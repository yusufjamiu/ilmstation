import { QuizFeedback, QuizNext, QuizOption, QuizProgress, QuizQuestion } from "@/components/quiz-ui";
import { consumeFeature, usePremium } from "@/components/premium";
import { useEffect, useState } from "react";
import { deleteField, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { Check, Copy, Crown, Loader2, Lock, LogOut, Play, Share2, Timer, Trophy, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { duelQuestions, duelTopics } from "@/components/challenge";

type HQ = { q: string; options: string[]; a: number; why?: string };
type Room = {
  code: string; host: string; hostName: string; topic: string; status: "lobby" | "question" | "reveal" | "done";
  qIndex: number; questions: HQ[]; players: Record<string, { name: string }>; answers: Record<string, Record<string, number>>; qStartedAt: number; createdAt: number; secs?: number;
};
const SECS = 20;
const norm = (x: unknown): HQ => {
  const o = x as Record<string, unknown>;
  return { q: String(o.q ?? o.question ?? o.prompt ?? ""), options: (o.options ?? o.choices ?? o.answers ?? []) as string[], a: Number(o.a ?? o.answer ?? 0), why: (o.why ?? o.explain ?? o.explanation) as string | undefined };
};
const newCode = () => "IQ-" + Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
async function myName() {
  const u = auth.currentUser; if (!u) return "Player";
  try { const p = (await getDoc(doc(db, "profiles", u.uid))).data(); return String(p?.name || p?.username || u.displayName || "Player"); } catch { return u.displayName || "Player"; }
}
const scoreOf = (r: Room, uid: string) => r.questions.reduce((n, q, i) => n + (r.answers?.[i]?.[uid] === q.a ? 1 : 0), 0);
const board = (r: Room) => Object.entries(r.players ?? {}).map(([id, p]) => ({ id, name: p.name, score: scoreOf(r, id) })).sort((a, b) => b.score - a.score);
const panel = "border-2 border-foreground bg-background p-5 shadow-brutal";

/** Family Halaqah: a live quiz for the whole family, each on their own phone. */
export function FamilyHalaqah() {
  const uid = auth.currentUser?.uid ?? "";
  const [code, setCodeRaw] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [topic, setTopic] = useState(duelTopics[0]);
  const [rounds, setRounds] = useState(5);
  const [secs, setSecs] = useState(20);
  const { canAccess, config } = usePremium();
  const topicOpen = (t: string) => canAccess(`topic-${t}`, config.premiumTopics.includes(t) ? "premium" : "free");
  const [join, setJoin] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const setCode = (c: string) => { setCodeRaw(c); try { if (c) sessionStorage.setItem("halaqahRoom", c); else sessionStorage.removeItem("halaqahRoom"); } catch { /* ignore */ } };
  useEffect(() => { try { const c = sessionStorage.getItem("halaqahRoom"); if (c) setCodeRaw(c); } catch { /* ignore */ } }, []);
  useEffect(() => {
    if (!code) { setRoom(null); return; }
    return onSnapshot(doc(db, "halaqahRooms", code), (snap) => { if (!snap.exists()) { setCode(""); toast("The room has closed."); return; } setRoom(snap.data() as Room); }, () => { setCode(""); });
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const ref = code ? doc(db, "halaqahRooms", code) : null;
  const host = !!room && room.host === uid;
  const limit = room?.secs ?? SECS;
  const left = room ? Math.max(0, limit - Math.floor((now - room.qStartedAt) / 1000)) : limit;
  const answered = room ? Object.keys(room.answers?.[room.qIndex] ?? {}).length : 0;
  const playerCount = room ? Object.keys(room.players ?? {}).length : 0;

  // the host reveals when everyone has answered or time is up
  useEffect(() => {
    if (!host || !room || !ref || room.status !== "question") return;
    if (answered >= playerCount || left === 0) void updateDoc(ref, { status: "reveal" }).catch(() => {});
  }, [host, room?.status, answered, playerCount, left]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    if (!uid) return toast.error("Log in first.");
    if (!topicOpen(topic)) return toast("Choose a free topic, or go Premium.");
    setBusy(true);
    if (!(await consumeFeature("halaqah"))) { toast("You’ve hosted today’s free games. Go Premium to host without limits, or join someone else’s room."); setBusy(false); return; }
    try {
      const c = newCode(); const name = await myName();
      await setDoc(doc(db, "halaqahRooms", c), { code: c, host: uid, hostName: name, topic, status: "lobby", qIndex: 0, questions: duelQuestions(topic, rounds).map(norm), players: { [uid]: { name } }, answers: {}, qStartedAt: 0, createdAt: Date.now(), secs });
      setCode(c);
    } catch { toast.error("Couldn't create the room. Try again."); }
    setBusy(false);
  };
  const joinRoom = async () => {
    const c = join.trim().toUpperCase().replace(/^IQ-?/, "IQ-"); if (!c || c.length < 5) return toast.error("Enter the room code.");
    setBusy(true);
    try {
      const snap = await getDoc(doc(db, "halaqahRooms", c));
      if (!snap.exists()) { toast.error("No room with that code."); setBusy(false); return; }
      if ((snap.data() as Room).status !== "lobby") { toast.error("This game has already started."); setBusy(false); return; }
      await updateDoc(doc(db, "halaqahRooms", c), { [`players.${uid}`]: { name: await myName() } });
      setCode(c); setJoin("");
    } catch { toast.error("Couldn't join. Check the code."); }
    setBusy(false);
  };
  const answer = (i: number) => { if (!ref || !room || room.status !== "question" || left === 0 || room.answers?.[room.qIndex]?.[uid] !== undefined) return; void updateDoc(ref, { [`answers.${room.qIndex}.${uid}`]: i }).catch(() => {}); };
  const start = () => ref && void updateDoc(ref, { status: "question", qIndex: 0, qStartedAt: Date.now(), answers: {} });
  const next = () => { if (!ref || !room) return; if (room.qIndex + 1 < room.questions.length) void updateDoc(ref, { status: "question", qIndex: room.qIndex + 1, qStartedAt: Date.now() }); else void updateDoc(ref, { status: "done" }); };
  const again = () => ref && room && void updateDoc(ref, { questions: duelQuestions(room.topic, room.questions.length).map(norm), status: "lobby", qIndex: 0, answers: {} });
  const leave = () => { if (ref && room && !host) void updateDoc(ref, { [`players.${uid}`]: deleteField() }).catch(() => {}); setCode(""); };
  const share = async () => {
    const text = `Join our Family Halaqah on IlmStation. Room code: ${code}`;
    try { if (navigator.share) { await navigator.share({ title: "Family Halaqah", text, url: "https://www.ilmstation.com/app" }); return; } await navigator.clipboard.writeText(text); toast.success("Copied"); } catch { /* cancelled */ }
  };

  if (!room) return <div className="grid gap-5 lg:grid-cols-2">
    <section className={panel}>
      <p className="text-xs font-bold uppercase text-muted-foreground">Host</p>
      <h2 className="mt-1 font-serif text-3xl">Create a room</h2>
      <p className="mt-3 text-sm font-semibold">Topic</p>
      <div className="mt-2 flex flex-wrap gap-2">{duelTopics.map((t) => { const open = topicOpen(t); return <button key={t} onClick={() => (open ? setTopic(t) : toast("This topic is Premium. Premium hosts can play it with the whole family."))} className={cn("flex items-center gap-1 border-2 border-foreground px-3 py-1.5 text-sm font-semibold", t === topic && open ? "bg-primary" : "bg-background", !open && "opacity-60")}>{!open && <Lock className="size-3.5" />}{t}</button>; })}</div>
      <p className="mt-4 text-sm font-semibold">Questions</p>
      <div className="mt-2 flex gap-2">{[5, 10].map((n) => <button key={n} onClick={() => setRounds(n)} className={cn("border-2 border-foreground px-4 py-1.5 text-sm font-bold", n === rounds ? "bg-primary" : "bg-background")}>{n}</button>)}</div>
      <p className="mt-4 text-sm font-semibold">Time per question</p>
      <div className="mt-2 flex gap-2">{[10, 20, 30, 45].map((n) => <button key={n} onClick={() => setSecs(n)} className={cn("border-2 border-foreground px-3 py-1.5 text-sm font-bold", n === secs ? "bg-primary" : "bg-background")}>{n}s</button>)}</div>
      <Button className="mt-5 w-full" disabled={busy} onClick={() => void create()}>{busy ? <Loader2 className="animate-spin" /> : <Users />} Create a room</Button>
    </section>
    <section className={panel}>
      <p className="text-xs font-bold uppercase text-muted-foreground">Guest</p>
      <h2 className="mt-1 font-serif text-3xl">Join a room</h2>
      <p className="mt-2 text-sm text-muted-foreground">Ask the host for the room code.</p>
      <input value={join} onChange={(e) => setJoin(e.target.value.toUpperCase())} placeholder="IQ-XXXX" aria-label="Room code" className="mt-4 h-12 w-full border-2 border-foreground bg-background px-3 text-center font-mono text-2xl tracking-widest" />
      <Button variant="outline" className="mt-3 w-full" disabled={busy} onClick={() => void joinRoom()}>Join</Button>
    </section>
  </div>;

  const q = room.questions[room.qIndex];
  const mine = room.answers?.[room.qIndex]?.[uid];
  const list = board(room);

  if (room.status === "lobby") return <section className={panel}>
    <p className="text-xs font-bold uppercase text-muted-foreground">Room code · {room.topic} · {limit}s per question</p>
    <p className="mt-1 font-mono text-5xl tracking-widest">{room.code}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard?.writeText(room.code); toast.success("Copied"); }}><Copy /> Copy code</Button>
      <Button size="sm" variant="outline" onClick={() => void share()}><Share2 /> Share</Button>
    </div>
    <p className="mt-6 text-sm font-semibold">In the room ({playerCount})</p>
    <ul className="mt-2 grid gap-2">{list.map((p) => <li key={p.id} className="flex items-center gap-2 border-2 border-foreground px-3 py-2 font-semibold">{p.id === room.host ? <Crown className="size-4" /> : <Users className="size-4" />}{p.name}</li>)}</ul>
    {host ? <Button className="mt-5 w-full" onClick={start}><Play /> Start</Button> : <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Waiting for the host to start…</p>}
    <Button variant="ghost" className="mt-2" onClick={leave}><LogOut /> Leave</Button>
  </section>;

  if (room.status === "done") return <section className={panel}>
    <Trophy className="size-12" />
    <h2 className="mt-2 font-serif text-4xl">Family results</h2>
    <ol className="mt-4 grid gap-2">{list.map((p, i) => <li key={p.id} className={cn("flex items-center justify-between border-2 border-foreground px-4 py-3 font-bold", i === 0 && "bg-primary")}>
      <span className="flex items-center gap-2">{i === 0 ? <Crown className="size-5" /> : <span className="w-5 text-center">{i + 1}</span>}{p.name}</span><span>{p.score} / {room.questions.length}</span></li>)}</ol>
    <div className="mt-5 flex flex-wrap gap-2">
      {host && <Button onClick={again}><Play /> Play again</Button>}
      <Button variant="outline" onClick={leave}><LogOut /> Leave</Button>
    </div>
  </section>;

  const reveal = room.status === "reveal";
  const right = list.filter((p) => room.answers?.[room.qIndex]?.[p.id] === q.a);
  return <section className="grid gap-4">
    <div className="flex items-center justify-between text-sm"><span className="font-bold">Question {room.qIndex + 1} of {room.questions.length}<span className="block text-xs font-normal uppercase text-muted-foreground">{room.topic}</span></span>{!reveal && <span className="flex items-center gap-1 font-mono"><Timer className="size-4" />{left}s</span>}</div>
    <QuizProgress value={((room.qIndex + (reveal ? 1 : 0)) / room.questions.length) * 100} />
    <QuizQuestion topic={room.topic} text={q.q} />
    <div className="grid gap-3">{q.options.map((o, i) => <QuizOption key={i} letter={"ABCD"[i] ?? "•"} text={o} disabled={reveal || mine !== undefined} onClick={() => answer(i)}
      state={reveal && i === q.a ? "correct" : reveal && mine === i ? "wrong" : mine === i ? "picked" : "idle"} />)}</div>
    {!reveal && mine !== undefined && <p className="text-sm font-semibold">Locked in. Waiting for the others… ({answered}/{playerCount})</p>}
    {!reveal && host && <Button variant="outline" onClick={() => ref && void updateDoc(ref, { status: "reveal" })}>Reveal now</Button>}
    {reveal && <>
      <QuizFeedback ok={mine === q.a} text={q.why} />
      <p className="text-sm font-semibold">Got it right: {right.length ? right.map((p) => p.name).join(", ") : "nobody this time"}</p>
      <ol className="grid gap-1 text-sm">{list.map((p, i) => <li key={p.id} className="flex justify-between border-b border-foreground/20 py-1"><span>{i + 1}. {p.name}</span><b>{p.score}</b></li>)}</ol>
      {host ? <QuizNext label={room.qIndex + 1 < room.questions.length ? "Next question" : "See results"} onClick={next} /> : <p className="text-sm text-muted-foreground">The host will start the next question.</p>}
    </>}
  </section>;
}
