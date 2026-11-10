import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuizDay = {
  quiz?: { q: string; options: string[] }[];
  opensAt?: number; resultsAt?: number; maxEntries?: number; winners?: number; prize?: string; sponsors?: string[];
};
type Entry = { seq: number; picks: number[] };
type Result = { uid: string; name: string; score: number; total: number; correct: boolean; seq: number; at: number; recentWinner?: boolean };

const when = (ms: number) => new Date(ms).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const timeSec = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const pad = (n: number) => String(n).padStart(2, "0");
const hms = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; };
const names = (s: string[]) => (s.length <= 1 ? s.join("") : `${s.slice(0, -1).join(", ")} & ${s[s.length - 1]}`);
const ERRORS: Record<string, string> = {
  "verify-email": "Please verify your email to enter the prize quiz.",
  kids: "The prize quiz is for Teens & Adults.",
  suspended: "Your account can't enter right now.",
  "not-open": "The quiz isn't open yet.",
  closed: "Today's quiz has closed.",
  full: "Today's quiz is full. Come back tomorrow!",
  already: "You've already entered today's quiz.",
  "steps-first": "Finish the lesson, dua and reminder first.",
  "signed-out": "Please log in again.",
};

export function RamadanQuiz({ n, day, kid, unlocked, done, onFinish }: {
  n: number; day: QuizDay; kid: boolean; unlocked: boolean; done: boolean; onFinish: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const uid = auth.currentUser?.uid ?? null;
  const quiz = day.quiz ?? [];
  const isPrize = !!day.opensAt && !!day.resultsAt;
  const phase: "practice" | "before" | "open" | "results" = !isPrize ? "practice" : now < day.opensAt! ? "before" : now < day.resultsAt! ? "open" : "results";
  const max = day.maxEntries ?? 1000;
  const winners = day.winners ?? 0;

  const [picks, setPicks] = useState<number[]>([]);
  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);
  const [count, setCount] = useState(0);
  const [keys, setKeys] = useState<number[] | null>(null);
  const [mine, setMine] = useState<Result | null>(null);
  const [board, setBoard] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const [cooldown, setCooldown] = useState(5);
  useEffect(() => { getDoc(doc(db, "ramadanConfig", "current")).then((s) => setCooldown(Number(s.get("winCooldownDays") ?? 5))).catch(() => {}); }, []);

  useEffect(() => {
    if (!uid || !isPrize) return undefined;
    return onSnapshot(doc(db, "ramadanEntries", String(n), "list", uid), (s) => setEntry(s.exists() ? (s.data() as Entry) : null), () => setEntry(null));
  }, [n, uid, isPrize]);
  useEffect(() => {
    if (phase !== "open") return undefined;
    return onSnapshot(doc(db, "ramadanStats", String(n)), (s) => setCount(Number(s.get("count")) || 0), () => {});
  }, [n, phase]);
  useEffect(() => {
    if (phase !== "practice" && phase !== "results") return;
    getDoc(doc(db, "ramadanKeys", String(n))).then((s) => setKeys((s.get("answers") as number[]) ?? null)).catch(() => setKeys(null));
  }, [n, phase]);
  useEffect(() => {
    if (phase !== "results") return;
    if (uid) getDoc(doc(db, "ramadanResults", String(n), "list", uid)).then((s) => setMine(s.exists() ? (s.data() as Result) : null)).catch(() => {});
    getDocs(query(collection(db, "ramadanResults", String(n), "list"), orderBy("rankKey"), limit(Math.max(20, winners))))
      .then((s) => setBoard(s.docs.map((d) => d.data() as Result).filter((r) => r.correct))).catch(() => {});
  }, [n, phase, uid, winners]);

  if (!unlocked) return <p className="text-muted-foreground">Finish the lesson, dua and reminder to unlock the quiz.</p>;
  if (kid) return <p className="text-muted-foreground">The daily quiz is for Teens & Adults. Well done for finishing today’s lesson, dua and reminder!</p>;
  if (quiz.length === 0) return <><p>No quiz today. Well done for finishing today’s steps!</p>{!done && <Button className="mt-4" onClick={onFinish}>Finish day</Button>}</>;

  const myRank = board.findIndex((r) => r.uid === uid) + 1;
  const winnerIds = board.filter((r) => !r.recentWinner).slice(0, winners).map((r) => r.uid);
  const isWinner = !!uid && winnerIds.includes(uid);

  const questions = (opts: { picked: number[]; keys?: number[] | null; locked: boolean }) => quiz.map((q, qi) => <fieldset key={qi} className="mt-4">
    <legend className="font-semibold">{qi + 1}. {q.q}</legend>
    <div className="mt-2 grid gap-2">{q.options.map((o, oi) => {
      const chosen = opts.picked[qi] === oi;
      const right = !!opts.keys && opts.keys[qi] === oi;
      const wrong = !!opts.keys && chosen && !right;
      return <button key={oi} type="button" disabled={opts.locked} onClick={() => setPicks((p) => { const c = [...p]; c[qi] = oi; return c; })}
        className={cn("border-2 border-foreground px-3 py-2 text-left text-sm",
          right ? "bg-secondary text-secondary-foreground" : wrong ? "bg-destructive text-white" : chosen ? "bg-primary" : "bg-background hover:bg-muted")}>{o}</button>;
    })}</div>
  </fieldset>);

  const allPicked = quiz.every((_, i) => picks[i] != null);

  const submit = async () => {
    if (!allPicked) { toast("Answer every question first."); return; }
    if (!window.confirm("Submit your answers? You can't change them afterwards.")) return;
    setBusy(true);
    try {
      const token = await auth.currentUser!.getIdToken();
      const r = await fetch("/api/ramadan-quiz", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ day: n, picks: quiz.map((_, i) => picks[i]) }) });
      const out = (await r.json().catch(() => ({}))) as { error?: string; seq?: number };
      if (!r.ok) { toast(ERRORS[out.error ?? ""] ?? "Couldn't submit. Try again."); return; }
      toast.success(`Saved! You're entry #${out.seq}.`);
      if (!done) onFinish();
    } catch { toast("Couldn't submit. Check your connection."); } finally { setBusy(false); }
  };

  return <div>
    {isPrize && <div className="border-2 border-foreground bg-primary p-3">
      <p className="flex items-center gap-2 font-semibold"><Trophy className="size-4" /> Prize quiz{winners ? ` · ${winners} winner${winners === 1 ? "" : "s"}` : ""}{day.prize ? ` · ${day.prize}` : ""}</p>
      {!!day.sponsors?.length && <p className="mt-1 text-sm">Prizes sponsored by <b>{names(day.sponsors)}</b></p>}
      <p className="mt-1 text-xs">First {max.toLocaleString()} entries only · results {when(day.resultsAt!)}</p>
      <details className="mt-1 text-xs"><summary className="cursor-pointer font-semibold underline">Prize rules</summary>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Free to enter. One entry per person; the first {max.toLocaleString()} entries are accepted.</li>
          <li>Finish the lesson, dua and reminder first.</li>
          <li>Answers are revealed at results time. Winners are the first {winners} people with every answer correct, by the time the server received them.</li>
          {cooldown > 0 && <li>A person can win once every {cooldown} days. Recent winners are placed after other correct entries.</li>}
          <li>One prize per bank account per day. Cash prizes are paid to Nigerian bank accounts.</li>
          <li>Teens & Adults only. A verified email is needed.</li>
          <li>IlmStation will never ask for your PIN, OTP or BVN.</li>
        </ul>
      </details>
    </div>}

    {phase === "before" && <div className="mt-4"><p className="font-serif text-2xl">Opens {when(day.opensAt!)}</p><p className="mt-1 font-serif text-4xl tabular-nums">{hms(day.opensAt! - now)}</p></div>}

    {phase === "open" && (entry === undefined ? <p className="mt-4 text-muted-foreground">Loading…</p>
      : entry ? <div className="mt-4 border-2 border-foreground bg-secondary p-4 text-secondary-foreground">
          <p className="font-serif text-2xl">Saved ✓</p>
          <p className="mt-1">You’re entry <b>#{entry.seq}</b> of {max.toLocaleString()}. Results at <b>{when(day.resultsAt!)}</b>, in sha Allah.</p>
        </div>
      : count >= max ? <p className="mt-4 font-semibold">Today’s quiz is full. Come back tomorrow!</p>
      : <>
          {questions({ picked: picks, locked: busy })}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{count.toLocaleString()} of {max.toLocaleString()} entries so far</span>
            <Button disabled={busy || !allPicked} onClick={() => void submit()}>{busy ? "Submitting…" : "Submit answers"}</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">You won’t see if you’re right until results time.</p>
        </>)}

    {phase === "results" && <>
      {mine ? <div className={cn("mt-4 border-2 border-foreground p-4", isWinner ? "bg-primary" : "bg-background")}>
        <p className="font-serif text-2xl">{isWinner ? `🏆 You’re a winner! (#${myRank})` : `You got ${mine.score} of ${mine.total}`}</p>
        {!isWinner && mine.correct && <p className="mt-1 text-sm">{mine.recentWinner ? "All correct, MashaAllah! You won recently, so today’s prizes go to others." : `All correct, MashaAllah! Not in the top ${winners} this time.`}</p>}
        {isWinner && <PayoutForm n={n} />}
      </div> : <p className="mt-4 text-muted-foreground">You didn’t enter today’s quiz. Here are the answers.</p>}
      {questions({ picked: entry?.picks ?? [], keys, locked: true })}
      <h4 className="mt-6 font-serif text-2xl">Leaderboard</h4>
      {board.length === 0 ? <p className="text-sm text-muted-foreground">No all-correct entries.</p> :
        <ol className="mt-2 grid gap-1">{board.map((r, i) => <li key={r.uid} className={cn("flex items-center justify-between gap-2 border-2 border-foreground px-3 py-2 text-sm", winnerIds.includes(r.uid) && "bg-primary font-semibold", r.uid === uid && "ring-2 ring-ring")}>
          <span>{winnerIds.includes(r.uid) ? "🏆 " : ""}{i + 1}. {r.uid === uid ? "You" : r.name}{r.recentWinner && <span className="font-normal text-muted-foreground"> · recent winner</span>}</span><span className="tabular-nums text-muted-foreground">{timeSec(r.at)}</span>
        </li>)}</ol>}
    </>}

    {phase === "practice" && <>
      {questions({ picked: picks, keys: checked ? keys : null, locked: checked })}
      {!checked ? <Button className="mt-5" disabled={!allPicked} onClick={() => { setChecked(true); const s = quiz.filter((_, i) => keys?.[i] === picks[i]).length; toast.success(`You got ${s} of ${quiz.length}`); if (!done) onFinish(); }}>Check answers</Button>
        : <p className="mt-4 font-semibold">You got {quiz.filter((_, i) => keys?.[i] === picks[i]).length} of {quiz.length}.</p>}
    </>}
  </div>;
}

const PERR: Record<string, string> = {
  "bad-account": "We couldn't find that account. Check the bank and number.",
  duplicate: "This bank account has already been used for a prize today.",
  paid: "This prize has already been paid.",
  "not-winner": "Only today's winners can do this.",
  "not-out": "Results aren't out yet.",
  "bad-phone": "Enter a valid phone number.",
};
type Saved = { accountName?: string; bank?: string; accountLast4?: string; paid?: boolean };

function PayoutForm({ n }: { n: number }) {
  const uid = auth.currentUser?.uid ?? "";
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [acct, setAcct] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/ramadan-payout?action=banks").then((r) => r.json()).then((j) => setBanks(j.banks ?? [])).catch(() => {}); }, []);
  useEffect(() => onSnapshot(doc(db, "ramadanPayouts", `${n}_${uid}`), (s) => setSaved(s.exists() ? (s.data() as Saved) : null), () => {}), [n, uid]);

  const call = async (action: "resolve" | "save") => {
    setBusy(true);
    try {
      const token = await auth.currentUser!.getIdToken();
      const r = await fetch("/api/ramadan-payout", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, day: n, bankCode, accountNumber: acct, phone }) });
      const out = (await r.json().catch(() => ({}))) as { error?: string; accountName?: string };
      if (!r.ok) { toast(PERR[out.error ?? ""] ?? "Something went wrong. Try again."); return null; }
      return out;
    } catch { toast("Check your connection and try again."); return null; } finally { setBusy(false); }
  };

  const note = <p className="mt-2 text-xs text-muted-foreground">Cash prizes are paid to Nigerian bank accounts. IlmStation will never ask for your PIN, OTP or BVN.</p>;
  if (saved?.paid) return <p className="mt-3 font-semibold">Paid ✓ to {saved.bank} ••••{saved.accountLast4}. Jazakallahu khairan!</p>;
  if (saved && !editing) return <div className="mt-3">
    <p className="font-semibold">Details received ✓</p>
    <p className="text-sm">{saved.accountName} · {saved.bank} ••••{saved.accountLast4}. We’ll send your prize soon, in sha Allah.</p>
    <Button className="mt-2" size="sm" variant="outline" onClick={() => setEditing(true)}>Change details</Button>
  </div>;

  const input = "h-10 w-full border-2 border-foreground bg-background px-3";
  return <div className="mt-4 grid gap-2">
    <p className="text-sm font-semibold">Where should we send your prize?</p>
    <select className={input} value={bankCode} onChange={(e) => { setBankCode(e.target.value); setName(""); }} aria-label="Bank">
      <option value="">{banks.length ? "Choose your bank" : "Loading banks…"}</option>
      {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
    </select>
    <input className={input} inputMode="numeric" maxLength={10} placeholder="Account number (10 digits)" value={acct} onChange={(e) => { setAcct(e.target.value.replace(/\D/g, "")); setName(""); }} />
    <input className={input} inputMode="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
    {!name
      ? <Button disabled={busy || !bankCode || acct.length !== 10} onClick={() => void call("resolve").then((o) => o?.accountName && setName(o.accountName))}>{busy ? "Checking…" : "Check account"}</Button>
      : <div className="border-2 border-foreground p-3">
          <p className="text-sm">Account name: <b>{name}</b>. Is this you?</p>
          <div className="mt-2 flex gap-2">
            <Button disabled={busy || !phone.trim()} onClick={() => void call("save").then((o) => { if (o) { toast.success("Thank you! We’ll send your prize soon, in sha Allah."); setEditing(false); } })}>Yes, send</Button>
            <Button variant="outline" onClick={() => setName("")}>No, change</Button>
          </div>
        </div>}
    {note}
  </div>;
}
