import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, GraduationCap, Lightbulb, Trophy, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Exam, Question } from "@/components/study-data";

type Mark = { id: string; correct: boolean; why: string };
type Result = { score: number; passed: boolean; passMark: number; late: boolean; promoted: boolean; marks: Mark[] };

async function call(body: Record<string, unknown>) {
  const u = auth.currentUser;
  if (!u) throw new Error("Sign in to take exams.");
  const r = await fetch("/api/study-exam", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await u.getIdToken()}` }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error(String(j.error ?? "Something went wrong. Try again."));
  return j;
}

export function ExamRunner({ exam, onExit }: { exam: Exam; onExit: () => void }) {
  const [phase, setPhase] = useState<"intro" | "loading" | "taking" | "sending" | "done">("intro");
  const [qs, setQs] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | boolean | string>>({});
  const [ends, setEnds] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState<Result | null>(null);
  const [early, setEarly] = useState(false);
  const [sure, setSure] = useState(false);

  const start = async () => {
    setPhase("loading");
    try {
      const j = await call({ action: "start", examId: exam.id });
      setQs(j.questions as Question[]); setAnswers({}); setEarly(!!j.early);
      setEnds(Number(j.minutes) > 0 ? Number(j.startedAt) + Number(j.minutes) * 60_000 : 0);
      setPhase("taking");
    } catch (e) { toast.error((e as Error).message); setPhase("intro"); }
  };
  const submit = async () => {
    setPhase("sending");
    try { setResult((await call({ action: "submit", examId: exam.id, answers })) as unknown as Result); setPhase("done"); }
    catch (e) { toast.error((e as Error).message); setPhase("taking"); }
  };

  useEffect(() => {
    if (phase !== "taking" || !ends) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase, ends]);
  useEffect(() => { if (phase === "taking" && ends && now >= ends) void submit(); }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = Math.max(0, Math.round((ends - now) / 1000));
  const answered = qs.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;

  if (phase === "intro" || phase === "loading") return <div className="iq-rise mx-auto max-w-xl">
    <Button variant="ghost" onClick={onExit}><ArrowLeft /> Back</Button>
    <div className="mt-2 border-2 border-foreground bg-card p-6 text-center shadow-brutal">
      <GraduationCap className="mx-auto size-12" />
      <small className="mt-3 block text-xs font-bold uppercase text-muted-foreground">{exam.kind === "promotion" ? "Promotion exam" : "Subject exam"}</small>
      <h1 className="font-serif text-4xl">{exam.title}</h1>
      <ul className="mx-auto mt-4 grid max-w-xs gap-1 text-left text-sm">
        <li>• {exam.perAttempt || exam.questions.length} questions</li>
        {exam.minutes > 0 && <li>• {exam.minutes} minutes</li>}
        <li>• Pass mark: {exam.passMark}%</li>
        {exam.kind === "promotion" && <li>• Pass to move up to the next stage</li>}
        {exam.kind === "promotion" && <li>• Skipping ahead? You get one try every {exam.waitDays} day{exam.waitDays === 1 ? "" : "s"}</li>}
      </ul>
      <Button size="lg" className="mt-6" disabled={phase === "loading"} onClick={() => void start()}>{phase === "loading" ? "Starting…" : "Start exam"}</Button>
    </div>
  </div>;

  if (phase === "done" && result) {
    const byId = new Map(result.marks.map((m) => [m.id, m]));
    return <div className="iq-rise mx-auto max-w-2xl">
      <div className={cn("border-2 border-foreground p-8 text-center shadow-brutal", result.passed ? "bg-primary" : "bg-card")}>
        {result.passed ? <Trophy className="mx-auto size-14" /> : <X className="mx-auto size-14" />}
        <p className="mt-2 font-serif text-6xl">{result.score}%</p>
        <h1 className="font-serif text-3xl">{result.passed ? "You passed!" : "Not this time"}</h1>
        <p className="mt-1 text-sm">{result.late ? "Time ran out before you sent your answers." : result.promoted ? "MashaAllah! The next stage is now open." : result.passed ? "Well done." : `You need ${result.passMark}% to pass. Review the lessons and try again.`}</p>
        {early && !result.passed && <p className="mt-1 text-sm">You can try skipping ahead again after the waiting time.</p>}
      </div>
      <ol className="mt-5 grid gap-2">{qs.map((q, n) => { const m = byId.get(q.id); return <li key={q.id} className="border-2 border-foreground bg-card p-3">
        <p className="flex items-start gap-2 font-semibold">{m?.correct ? <Check className="size-5 shrink-0 text-secondary" /> : <X className="size-5 shrink-0 text-destructive" />}<span dir="auto">{n + 1}. {q.q}</span></p>
        {m?.why && <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground"><Lightbulb className="size-4 shrink-0" />{m.why}</p>}
      </li>; })}</ol>
      <div className="mt-5 text-center"><Button onClick={onExit}>Done</Button></div>
    </div>;
  }

  return <div className="iq-rise mx-auto max-w-2xl">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-2 border-foreground bg-background p-3 shadow-brutal-sm">
      <span className="font-serif text-xl">{exam.title}</span>
      <span className="flex items-center gap-3 text-sm font-bold tabular-nums">{answered}/{qs.length} answered{ends > 0 && <span className={cn("flex items-center gap-1", left < 60 && "text-destructive")}><Clock className="size-4" />{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>}</span>
    </div>
    <ol className="mt-4 grid gap-4">{qs.map((q, n) => <li key={q.id} className="border-2 border-foreground bg-card p-4 shadow-brutal-sm">
      <p dir="auto" className="font-serif text-2xl">{n + 1}. {q.q}</p>
      {q.type === "mcq" && <div className="mt-3 grid gap-2">{q.options.map((o, k) => <button key={k} type="button" onClick={() => setAnswers({ ...answers, [q.id]: k })}
        className={cn("min-h-12 border-2 border-foreground px-3 text-left", answers[q.id] === k ? "bg-primary" : "bg-background hover:bg-muted")} dir="auto">{o}</button>)}</div>}
      {q.type === "tf" && <div className="mt-3 grid grid-cols-2 gap-2">{([true, false] as const).map((v) => <button key={String(v)} type="button" onClick={() => setAnswers({ ...answers, [q.id]: v })}
        className={cn("min-h-12 border-2 border-foreground", answers[q.id] === v ? "bg-primary" : "bg-background hover:bg-muted")}>{v ? "True" : "False"}</button>)}</div>}
      {q.type === "fill" && <input dir="auto" value={String(answers[q.id] ?? "")} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} aria-label={`Answer ${n + 1}`} className="mt-3 min-h-12 w-full border-2 border-foreground bg-background px-3 outline-none" />}
    </li>)}</ol>
    <div className="mt-5 flex justify-end gap-2">
      <Button variant="outline" onClick={onExit}>Leave</Button>
      <Button size="lg" disabled={phase === "sending"} onClick={() => { if (answered < qs.length && !sure) { setSure(true); return; } void submit(); }}>{phase === "sending" ? "Marking…" : answered < qs.length && sure ? `Send with ${qs.length - answered} unanswered?` : "Send answers"}</Button>
    </div>
  </div>;
}
