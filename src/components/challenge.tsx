import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Clock, Search, Send, Share2, Swords, Trophy, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShareActions } from "@/components/share-actions";
import { QuizVisual, visualQuestions, type VisualKind } from "@/components/quiz-visual";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, limit, onSnapshot, orderBy, query as fsQuery, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { useFriendIds } from "@/components/friends";

export type Presence = "online" | "in-duel" | "away" | "offline";

export type Rival = {
  id: string;
  name: string;
  handle: string;
  level: string;
  xp: number;
  presence: Presence;
  record: string;
};

const ONLINE_MS = 3 * 60 * 1000;
const AWAY_MS = 15 * 60 * 1000;
const BEAT_MS = 90 * 1000;

type PlayerDoc = { uid: string; username?: string; name?: string; level?: string; xp?: number; wins?: number; losses?: number; bestRun?: number; streak?: number; lastSeen?: number };

/** Keeps the public player card fresh while the app is open, so others can see this learner is online. */
export function PresenceBeat() {
  const { account } = useAuth();
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!account || !uid) return undefined;
    const beat = () => {
      if (document.hidden) return;
      void setDoc(doc(db, "players", uid), { uid, username: account.username ?? "", name: account.name, level: account.level, lastSeen: Date.now() }, { merge: true }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, BEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", beat); };
  }, [account]);
  return null;
}

function usePlayers() {
  const [myId, setMyId] = useState<string | null>(null);
  const [docs, setDocs] = useState<PlayerDoc[]>([]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => onAuthStateChanged(auth, (u) => setMyId(u?.uid ?? null)), []);
  useEffect(() => {
    const unsub = onSnapshot(fsQuery(collection(db, "players"), orderBy("lastSeen", "desc"), limit(50)), (snap) => setDocs(snap.docs.map((d) => d.data() as PlayerDoc)), () => {});
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => { unsub(); clearInterval(tick); };
  }, []);
  const toRival = (p: PlayerDoc): Rival => {
    const age = now - (p.lastSeen ?? 0);
    const wins = p.wins ?? 0;
    const losses = p.losses ?? 0;
    return { id: p.uid, name: p.name ?? "Learner", handle: p.username ? `@${p.username}` : "", level: p.level ?? "Beginner", xp: p.xp ?? 50, presence: age <= ONLINE_MS ? "online" : age <= AWAY_MS ? "away" : "offline", record: wins + losses === 0 ? "New" : `${wins}W · ${losses}L` };
  };
  const mine = docs.find((p) => p.uid === myId);
  return { players: docs.filter((p) => p.uid !== myId).map(toRival), myId, me: { wins: mine?.wins ?? 0, losses: mine?.losses ?? 0, bestRun: mine?.bestRun ?? 0, streak: mine?.streak ?? 0, xp: mine?.xp ?? 50 } };
}

export function useLeaderboard() {
  const [myId, setMyId] = useState<string | null>(null);
  const [docs, setDocs] = useState<PlayerDoc[]>([]);
  useEffect(() => onAuthStateChanged(auth, (u) => setMyId(u?.uid ?? null)), []);
  useEffect(() => onSnapshot(fsQuery(collection(db, "players"), orderBy("lastSeen", "desc"), limit(100)), (snap) => setDocs(snap.docs.map((d) => d.data() as PlayerDoc)), () => {}), []);
  const rows = docs.map((p) => ({ id: p.uid, name: p.username || (p.name ?? "Learner").split(" ")[0] || "Learner", xp: p.xp ?? 50, me: p.uid === myId })).sort((a, b) => b.xp - a.xp);
  return { rows };
}

type ChallengeDoc = { id: string; from: string; to: string; fromName: string; toName: string; topic: string; level: string; seconds: number; rounds: number; status: "pending" | "accepted" | "declined" | "cancelled"; createdAt: number; scores?: Record<string, number>; done?: Record<string, boolean> };

function useIncoming(myId: string | null) {
  const [list, setList] = useState<ChallengeDoc[]>([]);
  useEffect(() => {
    if (!myId) { setList([]); return undefined; }
    return onSnapshot(fsQuery(collection(db, "challenges"), where("to", "==", myId), where("status", "==", "pending")), (snap) => {
      const cutoff = Date.now() - 24 * 3600 * 1000;
      setList(snap.docs.map((d) => ({ ...(d.data() as Omit<ChallengeDoc, "id">), id: d.id })).filter((x) => x.createdAt > cutoff));
    }, () => {});
  }, [myId]);
  return list;
}

const presenceLabel: Record<Presence, string> = { online: "Online now", "in-duel": "In a duel", away: "Away", offline: "Offline" };
const presenceDot: Record<Presence, string> = { online: "fill-secondary text-secondary", "in-duel": "fill-primary text-primary", away: "fill-muted-foreground text-muted-foreground", offline: "fill-transparent text-muted-foreground" };

const topics = ["Aqeedah", "Hadith", "Seerah", "Fiqh", "Arabic", "Qur’an", "Tafsir", "Dua"];
const levels = [
  { id: "Beginner", note: "1× points" },
  { id: "Intermediate", note: "1.5× points" },
  { id: "Advanced", note: "2× points" },
];
const clocks = [
  { id: 10, note: "Lightning · 1.25× points" },
  { id: 20, note: "Standard" },
  { id: 45, note: "Relaxed · 0.8× points" },
];
const roundOptions = [5, 10, 15];

type Q = { q: string; options: string[]; a: number; visual?: VisualKind; why?: string };
const bank: Record<string, Q[]> = {
  Seerah: [
    { q: "In which city was the Prophet ﷺ born?", options: ["Makkah", "Madinah", "Ta’if", "Jerusalem"], a: 0 },
    { q: "Who was the Prophet’s ﷺ first wife?", options: ["Aisha", "Khadijah", "Hafsah", "Zaynab"], a: 1 },
    { q: "Which cave did the first revelation come in?", options: ["Thawr", "Hira", "Uhud", "Safa"], a: 1 },
    { q: "The migration to Madinah is known as?", options: ["Isra", "Hijrah", "Fath", "Bay’ah"], a: 1 },
    { q: "Which battle came first?", options: ["Uhud", "Badr", "Khandaq", "Tabuk"], a: 1 },
  ],
  Aqeedah: [
    { q: "What is the first pillar of Iman?", options: ["Belief in Allah", "Belief in angels", "Belief in the Last Day", "Belief in decree"], a: 0 },
    { q: "Tawhid al-Uluhiyyah concerns?", options: ["Allah’s lordship", "Allah’s worship", "Allah’s names", "Allah’s books"], a: 1 },
    { q: "How many pillars of Iman are there?", options: ["Five", "Six", "Seven", "Four"], a: 1 },
    { q: "Shirk means?", options: ["Forgetfulness", "Associating partners with Allah", "Doubt", "Neglect"], a: 1 },
    { q: "Belief in Qadar means belief in?", options: ["Divine decree", "The angels", "The prophets", "The scriptures"], a: 0 },
  ],
  Fiqh: [
    { q: "How many obligatory prayers are there daily?", options: ["Three", "Four", "Five", "Six"], a: 2 },
    { q: "Wudu is invalidated by?", options: ["Speaking", "Passing wind", "Walking", "Laughing quietly"], a: 1 },
    { q: "Zakat on wealth is generally?", options: ["2.5%", "5%", "10%", "1%"], a: 0 },
    { q: "Which fast is obligatory?", options: ["Ashura", "Ramadan", "Mondays", "Six of Shawwal"], a: 1 },
    { q: "Tayammum uses?", options: ["Sand or clean earth", "Salt water", "Milk", "Oil"], a: 0 },
  ],
};
const fallback: Q[] = [
  { q: "The Qur’an was revealed over how many years?", options: ["13", "23", "33", "10"], a: 1 },
  { q: "Which month is fasting obligatory?", options: ["Rajab", "Shawwal", "Ramadan", "Muharram"], a: 2 },
  { q: "How many chapters are in the Qur’an?", options: ["114", "104", "120", "99"], a: 0 },
  { q: "Salat al-Fajr has how many obligatory units?", options: ["2", "3", "4", "5"], a: 0 },
  { q: "“Bismillah” means?", options: ["Praise be to Allah", "In the name of Allah", "Allah is greatest", "There is no god but Allah"], a: 1 },
];

function questionsFor(topic: string, rounds: number): Q[] {
  const pool = bank[topic] ?? fallback;
  const visual = (visualQuestions as Record<string, import("@/components/quiz-visual").VisualQuestion>)[topic];
  return Array.from({ length: rounds }, (_, i) => i === 0 && visual ? { q: visual.q, options: visual.options, a: visual.answer, visual: visual.visual, why: visual.why } : pool[(i - (visual ? 1 : 0)) % pool.length] ?? fallback[0]!);
}

const levelMult = (l: string) => (l === "Advanced" ? 2 : l === "Intermediate" ? 1.5 : 1);
const clockMult = (s: number) => (s <= 10 ? 1.25 : s >= 45 ? 0.8 : 1);

type Phase = "lobby" | "setup" | "invite" | "duel" | "result";

export function ChallengeScreen() {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [shareOpen, setShareOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Online" | "Friends">("Online");
  const [rival, setRival] = useState<Rival>();
  const [topic, setTopic] = useState("Seerah");
  const [level, setLevel] = useState("Intermediate");
  const [seconds, setSeconds] = useState(20);
  const [rounds, setRounds] = useState(5);

  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number>();
  const [left, setLeft] = useState(seconds);
  const [you, setYou] = useState(0);
  const [them, setThem] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const questions = useMemo(() => questionsFor(topic, rounds), [topic, rounds]);
  const current = questions[round];
  const { players, me, myId } = usePlayers();
  const { account } = useAuth();
  const incoming = useIncoming(myId);
  const friendIds = useFriendIds();
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [live, setLive] = useState<ChallengeDoc | null>(null);
  const meRef = useRef(me); meRef.current = me;
  const youRef = useRef(0);
  const recorded = useRef(false);
  const [earned, setEarned] = useState(0);
  useEffect(() => {
    if (!challengeId) { setLive(null); return undefined; }
    return onSnapshot(doc(db, "challenges", challengeId), (snap) => setLive(snap.exists() ? { ...(snap.data() as Omit<ChallengeDoc, "id">), id: snap.id } : null), () => {});
  }, [challengeId]);
  const liveNow = live && live.id === challengeId ? live : null;
  const opponentDone = !!(liveNow && rival && liveNow.done?.[rival.id]);
  const opponentLeft = !!(liveNow && liveNow.status === "cancelled" && phase !== "invite");
  useEffect(() => {
    if (!liveNow || phase !== "invite") return;
    if (liveNow.status === "accepted") startDuel();
    else if (liveNow.status === "declined") { toast("They declined your challenge"); setChallengeId(null); setPhase("lobby"); }
  }, [liveNow?.status, phase]);
  useEffect(() => { if (liveNow && rival) setThem(liveNow.scores?.[rival.id] ?? 0); }, [liveNow?.scores, rival]);
  useEffect(() => {
    if (phase !== "result") { recorded.current = false; return; }
    if (recorded.current || !myId || !rival || !opponentDone) return;
    recorded.current = true;
    const m = meRef.current;
    const mine = youRef.current;
    const theirs = liveNow?.scores?.[rival.id] ?? 0;
    const gained = Math.round(mine / 10) + (mine > theirs ? Math.round((20 + 2 * rounds) * levelMult(level) * clockMult(seconds)) : mine === theirs ? 10 : 0); setEarned(gained); const xp = m.xp + gained;
    if (mine > theirs) { const s = m.streak + 1; void setDoc(doc(db, "players", myId), { xp, wins: m.wins + 1, streak: s, bestRun: Math.max(m.bestRun, s) }, { merge: true }).catch(() => {}); }
    else if (mine === theirs) void setDoc(doc(db, "players", myId), { xp }, { merge: true }).catch(() => {});
    else if (mine < theirs) void setDoc(doc(db, "players", myId), { xp, losses: m.losses + 1, streak: 0 }, { merge: true }).catch(() => {});
  }, [phase, opponentDone]);
  const onlineCount = players.filter((r) => r.presence === "online").length;

  const list = players.filter((r) => {
    const match = (r.name + r.handle).toLowerCase().includes(query.toLowerCase());
    if (!match) return false;
    if (filter === "Online") return r.presence === "online";
    if (filter === "Friends") return friendIds.includes(r.id);
    return true;
  });

  // Question countdown: a missed clock scores nothing and moves on.
  useEffect(() => {
    if (phase !== "duel" || picked !== undefined) return;
    if (left <= 0) { lockIn(-1); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left, picked]);

  const resetDuel = () => { setRound(0); setPicked(undefined); setLeft(seconds); setYou(0); youRef.current = 0; setThem(0); setCorrectCount(0); };

  const startDuel = () => { resetDuel(); setPhase("duel"); };

  function lockIn(choice: number) {
    if (picked !== undefined || !current) return;
    setPicked(choice);
    const right = choice === current.a;
    const speedBonus = Math.round((left / seconds) * 30);
    const mult = levelMult(level) * clockMult(seconds);
    if (right) { const total = youRef.current + Math.round((50 + speedBonus) * mult); youRef.current = total; setYou(total); setCorrectCount((c) => c + 1); if (challengeId && myId) void updateDoc(doc(db, "challenges", challengeId), { [`scores.${myId}`]: total }).catch(() => {}); }
    // Opponent plays with a topic-weighted chance so results vary.
    
    
    setTimeout(() => {
      if (round + 1 >= rounds) { finishDuel(); setPhase("result"); return; }
      setRound((r) => r + 1); setPicked(undefined); setLeft(seconds);
    }, 1400);
  }

  async function sendChallenge() {
    if (!myId || !rival) return;
    const id = `${myId}_${rival.id}_${Date.now()}`;
    try {
      await setDoc(doc(db, "challenges", id), { from: myId, to: rival.id, fromName: account?.name ?? "A learner", toName: rival.name, topic, level, seconds, rounds, status: "pending", createdAt: Date.now(), scores: {}, done: {} });
      setChallengeId(id); setPhase("invite");
    } catch { toast("We couldn't send that challenge. Try again."); }
  }
  async function acceptInvite(inv: ChallengeDoc) {
    try {
      await updateDoc(doc(db, "challenges", inv.id), { status: "accepted" });
      setRival(players.find((p) => p.id === inv.from) ?? { id: inv.from, name: inv.fromName, handle: "", level: "Beginner", xp: 0, presence: "online", record: "New" });
      setTopic(inv.topic); setLevel(inv.level); setSeconds(inv.seconds); setRounds(inv.rounds);
      setChallengeId(inv.id); setPhase("invite");
    } catch { toast("We couldn't accept that invite. Try again."); }
  }
  const declineInvite = (inv: ChallengeDoc) => updateDoc(doc(db, "challenges", inv.id), { status: "declined" }).then(() => toast("Invite declined")).catch(() => toast("Something went wrong. Try again."));
  function finishDuel() { if (challengeId && myId) void updateDoc(doc(db, "challenges", challengeId), { [`done.${myId}`]: true }).catch(() => {}); }

  return <div className="iq-rise">
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Head-to-head · 1 vs 1</p>
        <h1 className="font-serif text-4xl leading-none sm:text-5xl">Challenge</h1>
      </div>
      {phase !== "lobby" && <Button variant="outline" onClick={() => { if ((phase === "duel" || phase === "invite") && challengeId) void updateDoc(doc(db, "challenges", challengeId), { status: "cancelled" }).catch(() => {}); setChallengeId(null); setPhase("lobby"); resetDuel(); }}>Leave duel</Button>}
    </header>

    <div className="mt-6">
      {phase === "lobby" && <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section className="border-2 border-foreground bg-background shadow-brutal">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground px-4 py-2">
            <h2 className="font-serif text-xl">Who’s online</h2>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Circle className="size-3 fill-secondary text-secondary" />{onlineCount} online</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <label className="col-span-3 flex h-10 min-w-0 items-center gap-2 border-2 border-foreground px-3 sm:flex-1">
                <Search className="size-4 shrink-0" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search learners" className="w-full bg-transparent outline-none" aria-label="Search learners" />
              </label>
              {(["Online", "Friends", "All"] as const).map((f) => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>)}
            </div>
            <ul className="mt-4 space-y-3">
              {list.map((r) => <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-2 border-foreground p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
                <span className="grid size-11 shrink-0 place-items-center border-2 border-foreground bg-primary font-serif text-xl text-primary-foreground">{r.name[0]}</span>
                <div className="min-w-0 flex-1">
                  <b className="block break-words font-serif text-xl leading-tight sm:truncate sm:font-sans sm:text-base sm:font-bold">{r.name}</b>
                  <p className="mt-1 grid gap-1 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    <span className="flex items-center gap-1"><Circle className={cn("size-2.5 shrink-0", presenceDot[r.presence])} />{presenceLabel[r.presence]}</span>
                    <span>{r.level} · {r.xp} XP{r.handle ? ` · ${r.handle}` : ""}</span>
                  </p>
                </div>
                <span className="col-start-2 text-xs font-semibold uppercase text-muted-foreground sm:col-start-auto">{r.record}</span>
                <Button className="col-span-2 w-full sm:col-span-1 sm:w-auto" size="sm" disabled={r.presence === "offline"} onClick={() => { setRival(r); setPhase("setup"); }}>
                  <Swords /> {r.presence === "in-duel" ? "Queue duel" : "Challenge"}
                </Button>
              </li>)}
              {!list.length && <li className="border-2 border-dashed border-foreground p-6 text-center text-muted-foreground">Nobody matches that search right now.</li>}
            </ul>
          </div>
        </section>

        <div className="grid gap-5 content-start">
          <section className="border-2 border-foreground bg-primary p-4 shadow-brutal">
            <Users className="size-6" />
            <h2 className="mt-3 font-serif text-2xl">Quick match</h2>
            <p className="mt-1 text-sm">We’ll pair you with an online learner near your level.</p>
            <Button className="mt-4" variant="secondary" onClick={() => {
              const pool = players.filter((r) => r.presence === "online");
              const pick = pool[Math.floor(Math.random() * pool.length)];
              if (!pick) { toast("Nobody else is online right now"); return; }
              setRival(pick); setPhase("setup");
              toast.success(`Matched with ${pick.name}`);
            }}>Find an opponent</Button>
          </section>
          <section className="border-2 border-foreground bg-background p-4 shadow-brutal">
            <h2 className="font-serif text-2xl">Invites for you</h2>
            {incoming.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No invites yet. When someone challenges you, it will show here.</p> : <div className="mt-3 space-y-3">{incoming.map((inv) => <div key={inv.id} className="border-2 border-foreground p-3"><b className="block">{inv.fromName}</b><small className="text-muted-foreground">{inv.topic} · {inv.rounds} rounds · {inv.level}</small><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void acceptInvite(inv)}>Accept</Button><Button size="sm" variant="outline" onClick={() => void declineInvite(inv)}>Decline</Button></div></div>)}</div>}
          </section>
          <section className="border-2 border-foreground bg-background p-4 shadow-brutal">
            <h2 className="font-serif text-2xl">Your duel record</h2>
            <div className="mt-3 grid grid-cols-3 border-2 border-foreground text-center">
              {[["Wins", String(me.wins)], ["Losses", String(me.losses)], ["Best run", String(me.bestRun)]].map(([l, v]) => <div key={l} className="border-r-2 border-foreground p-3 last:border-r-0">
                <p className="font-serif text-3xl">{v}</p><small className="text-muted-foreground">{l}</small>
              </div>)}
            </div>
          </section>
        </div>
      </div>}

      {phase === "setup" && rival && <section className="border-2 border-foreground bg-background shadow-brutal">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b-2 border-foreground px-4 py-2">
          <h2 className="font-serif text-xl">Set the duel</h2>
          <span className="max-w-36 text-right text-xs font-semibold uppercase leading-tight text-muted-foreground">vs {rival.name}</span>
        </div>
        <div className="grid gap-6 p-4">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Topic</h3>
            <div className="mt-2 flex flex-wrap gap-2">{topics.map((t) => <button key={t} onClick={() => setTopic(t)} className={cn("border-2 border-foreground px-4 py-2 font-semibold shadow-brutal-sm", topic === t ? "bg-primary" : "bg-background")}>{t}</button>)}</div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Difficulty</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">{levels.map((l) => <button key={l.id} onClick={() => setLevel(l.id)} className={cn("border-2 border-foreground p-4 text-left", level === l.id ? "bg-primary shadow-brutal" : "bg-background shadow-brutal-sm")}><span className="font-serif text-2xl">{l.id}</span><p className="text-sm text-muted-foreground">{l.note}</p></button>)}</div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Time per question</h3>
              <div className="mt-2 flex flex-wrap gap-2">{clocks.map((c) => <button key={c.id} onClick={() => { setSeconds(c.id); setLeft(c.id); }} className={cn("border-2 border-foreground px-4 py-2 text-left shadow-brutal-sm", seconds === c.id ? "bg-primary" : "bg-background")}><b className="block">{c.id}s</b><small className="text-muted-foreground">{c.note}</small></button>)}</div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Rounds</h3>
              <div className="mt-2 flex flex-wrap gap-2">{roundOptions.map((r) => <button key={r} onClick={() => setRounds(r)} className={cn("border-2 border-foreground px-5 py-3 font-semibold shadow-brutal-sm", rounds === r ? "bg-primary" : "bg-background")}>{r}</button>)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void sendChallenge()}><Send /> Send challenge</Button>
            <Button variant="outline" onClick={() => setPhase("lobby")}>Back</Button>
          </div>
        </div>
      </section>}

      {phase === "invite" && rival && <section className="mx-auto max-w-xl border-2 border-foreground bg-background p-6 text-center shadow-brutal">
        <span className="mx-auto grid size-20 place-items-center border-2 border-foreground bg-primary font-serif text-4xl text-primary-foreground">{rival.name[0]}</span>
        <h2 className="mt-4 font-serif text-3xl">{liveNow?.status === "accepted" ? "Starting the duel…" : `Waiting for ${rival.name}`}</h2>
        <p className="mt-2 text-muted-foreground">{topic} · {level} · {rounds} rounds · {seconds}s a question</p>
        <p className="mt-1 text-sm text-muted-foreground">The duel begins the moment they accept. Invites expire after 24 hours.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Button variant="outline" onClick={() => { if (challengeId) void updateDoc(doc(db, "challenges", challengeId), { status: "cancelled" }).catch(() => {}); setChallengeId(null); setPhase("lobby"); toast("Challenge withdrawn"); }}>Withdraw</Button></div>
      </section>}

      {phase === "duel" && rival && current && <section className="border-2 border-foreground bg-background shadow-brutal">
        <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
          <h2 className="font-serif text-xl">Round {round + 1} of {rounds}</h2>
          <span className="flex items-center gap-2 text-xs font-semibold uppercase"><Clock className="size-4" />{String(Math.max(left, 0)).padStart(2, "0")}s</span>
        </div>
        <div className="p-4">
          <div className="h-3 border-2 border-foreground p-0.5"><div className={cn("h-full transition-all", left / seconds < 0.3 ? "bg-destructive" : "bg-secondary")} style={{ width: `${Math.max((left / seconds) * 100, 0)}%` }} /></div>
          <div className="mt-5 grid grid-cols-2 divide-x-2 divide-foreground border-2 border-foreground text-center">
            <div className="bg-primary p-4"><b>You</b><p className="font-serif text-4xl">{you}</p></div>
            <div className="p-4"><b>{rival.name.split(" ")[0]}</b><p className="font-serif text-4xl">{them}</p></div>
          </div>
          <h3 className="mt-8 max-w-3xl font-serif text-3xl sm:text-4xl">{current.q}</h3>
          {current.visual && <QuizVisual kind={current.visual} compact />}
          <div className="mt-6 grid gap-3 md:grid-cols-2">{current.options.map((o, i) => <Button key={o} variant="outline" onClick={() => lockIn(i)} disabled={picked !== undefined}
            className={cn("min-h-14 justify-start text-left",
              picked === undefined ? "bg-background hover:bg-primary" : i === current.a ? "bg-secondary text-secondary-foreground" : picked === i ? "bg-destructive text-destructive-foreground" : "bg-muted opacity-70")}>{o}</Button>)}</div>
          {picked !== undefined && <p className="mt-4 font-semibold">{picked === current.a ? "Correct — points banked." : picked === -1 ? "Time up — no points this round." : "Not this time. The right answer is highlighted."}{current.why && <span className="mt-1 block font-normal text-muted-foreground">{current.why}</span>}</p>}
        </div>
      </section>}

      {phase === "result" && rival && <section className="mx-auto max-w-2xl border-2 border-foreground bg-background shadow-brutal">
        <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
          <h2 className="font-serif text-xl">{opponentLeft ? "Your opponent left" : !opponentDone ? "Waiting for your opponent to finish…" : you > them ? "You won the duel" : you === them ? "A draw" : "Close one"}</h2>{earned > 0 && <span className="text-xs font-semibold uppercase text-muted-foreground">+{earned} XP</span>}
          
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 divide-x-2 divide-foreground border-2 border-foreground text-center">
            <div className={cn("p-5", you >= them && "bg-primary")}><b>You</b><p className="font-serif text-5xl">{you}</p></div>
            <div className={cn("p-5", them > you && "bg-primary")}><b>{rival.name.split(" ")[0]}</b><p className="font-serif text-5xl">{them}</p></div>
          </div>
          <div className="mt-5 grid grid-cols-1 border-2 border-foreground text-center sm:grid-cols-3">
            {[["Correct", `${correctCount}/${rounds}`], ["Topic", topic], ["Level", level]].map(([l, v]) => <div key={l} className="border-b-2 border-foreground p-3 last:border-b-0 sm:border-b-0 sm:border-r-2 sm:last:border-r-0"><p className="break-words font-serif text-2xl">{v}</p><small className="text-muted-foreground">{l}</small></div>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => void sendChallenge()}><Swords /> Rematch</Button>
            <Button variant="outline" onClick={() => { setChallengeId(null); setPhase("lobby"); }}><UserPlus /> New opponent</Button>
            <Button variant="outline" onClick={() => setShareOpen(true)}><Share2 /> Share result</Button>
            <Button variant="ghost" onClick={() => toast.success(`${rival.name} thanked for the duel`)}><Trophy /> Say jazakAllahu khayran</Button>
          </div>
          <Dialog open={shareOpen} onOpenChange={setShareOpen}><DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none"><DialogHeader><DialogTitle className="font-serif text-3xl">Share your duel</DialogTitle><DialogDescription>Copy the card or post it straight to a platform.</DialogDescription></DialogHeader><div className="border-2 border-foreground bg-primary p-8 text-center shadow-brutal"><p className="text-xs font-bold uppercase">IlmStation · 1 vs 1 duel</p><p className="mt-3 font-serif text-5xl">{you} – {them}</p><p className="mt-2 text-sm">{topic} · {level} · vs {rival.name}</p></div><ShareActions card={{ eyebrow: "IlmStation · 1 vs 1 duel", headline: `${you} – ${them}`, sub: `${topic} · ${level} · vs ${rival.name}`, meta: "Duel" }} onDone={() => setShareOpen(false)} /></DialogContent></Dialog>
        </div>
      </section>}
    </div>
  </div>;
}
