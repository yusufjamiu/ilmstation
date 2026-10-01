import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, BookMarked, Check, CheckCircle2, ChevronRight, Circle, Clock, FileText, GraduationCap,
  Headphones, Lightbulb, ListChecks, Lock, NotebookPen, Pause, Play, PlayCircle, RotateCcw, Timer, Trophy, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuizVisual, visualQuestions, type VisualKind } from "@/components/quiz-visual";

type Kind = "video" | "reading" | "audio" | "quiz" | "reflection";
type Lesson = { id: string; title: string; kind: Kind; mins: number; body: string[]; quiz?: { q: string; options: string[]; answer: number; why: string; visual?: VisualKind }[]; prompt?: string };
type Module = { title: string; lessons: Lesson[] };
type Course = { id: string; title: string; teacher: string; level: string; cohort: string; next: string; modules: Module[] };

const courses: Course[] = [
  {
    id: "aqeedah", title: "Foundations of Aqeedah", teacher: "Ustadh Musa Abdullahi", level: "Beginner", cohort: "Cohort 7 · 142 students", next: "Live class · Sat 10:00 WAT",
    modules: [
      { title: "Module 1 · Knowing Allah", lessons: [
        { id: "a1", title: "What is Tawhid?", kind: "video", mins: 12, body: ["Tawhid is affirming the Oneness of Allah in His Lordship, His right to worship, and His Names and Attributes.", "Every act of worship rests on this foundation — it is the first call of every Prophet."] },
        { id: "a2", title: "The three categories", kind: "reading", mins: 8, body: ["Tawhid ar-Rububiyyah — Allah alone creates, sustains and controls.", "Tawhid al-Uluhiyyah — Allah alone deserves worship.", "Tawhid al-Asma wa's-Sifat — affirming His Names and Attributes without distortion or likening."] },
        { id: "a3", title: "Check your understanding", kind: "quiz", mins: 5, body: ["Three short questions. Take your time."], quiz: [
          visualQuestions.Aqeedah,
          { q: "Which category concerns Allah alone deserving worship?", options: ["Rububiyyah", "Uluhiyyah", "Asma wa's-Sifat"], answer: 1, why: "Uluhiyyah is about directing all worship to Allah alone." },
          { q: "Surah al-Ikhlas is often called…", options: ["A third of the Qur'an", "The mother of the Book", "The heart of the Qur'an"], answer: 0, why: "The Prophet ﷺ said it equals a third of the Qur'an (Bukhari)." },
          { q: "Affirming Allah's Names without likening them to creation is part of…", options: ["Uluhiyyah", "Rububiyyah", "Asma wa's-Sifat"], answer: 2, why: "Asma wa's-Sifat covers His Names and Attributes." },
        ] },
        { id: "a4", title: "Reflection journal", kind: "reflection", mins: 6, body: ["Write a few honest lines."], prompt: "Where in your day do you most feel reliance on Allah — and where do you forget it?" },
      ] },
      { title: "Module 2 · The Pillars of Iman", lessons: [
        { id: "b1", title: "Belief in the angels", kind: "audio", mins: 14, body: ["Angels are created from light, never disobey, and each has a role — Jibril with revelation, Mika'il with provision."] },
        { id: "b2", title: "Belief in the Books", kind: "reading", mins: 9, body: ["We believe in the Tawrah, Zabur, Injil and the Qur'an — the final, preserved revelation."] },
        { id: "b3", title: "Module check", kind: "quiz", mins: 4, body: ["Two questions."], quiz: [
          { q: "Which angel brought revelation?", options: ["Mika'il", "Jibril", "Israfil"], answer: 1, why: "Jibril (Gabriel) conveyed revelation to the Prophets." },
          { q: "Which revealed Book is preserved unchanged?", options: ["The Qur'an", "The Zabur", "The Injil"], answer: 0, why: "Allah promised to preserve the Qur'an (15:9)." },
        ] },
      ] },
    ],
  },
  {
    id: "arabic", title: "Arabic Essentials", teacher: "Ustadhah Maryam Ibrahim", level: "Beginner", cohort: "Cohort 3 · 88 students", next: "Live class · Tue 19:00 WAT",
    modules: [{ title: "Module 1 · Letters & sounds", lessons: [
      { id: "c1", title: "The Arabic alphabet", kind: "video", mins: 10, body: ["Arabic has 28 letters, written right to left, most connecting to the next."] },
      { id: "c2", title: "Short vowels", kind: "audio", mins: 7, body: ["Fatha (a), kasra (i) and damma (u) sit above or below letters."] },
        { id: "c3", title: "Quick check", kind: "quiz", mins: 3, body: ["Identify the letter, then check what you know."], quiz: [visualQuestions.Arabic, { q: "How many letters are in the Arabic alphabet?", options: ["26", "28", "30"], answer: 1, why: "There are 28 letters." }] },
    ] }],
  },
];

const kindIcon: Record<Kind, typeof PlayCircle> = { video: PlayCircle, reading: FileText, audio: Headphones, quiz: ListChecks, reflection: NotebookPen };
const all = (c: Course) => c.modules.flatMap((m) => m.lessons);

export function StudyScreen() {
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);
  const [done, setDone] = useState<string[]>(["a1"]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [focus, setFocus] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setFocus((s) => { if (s <= 1) { setRunning(false); toast.success("Focus session complete — take a short break"); return 25 * 60; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [running]);

  const course = courses.find((c) => c.id === courseId);
  const lessons = course ? all(course) : [];
  const lesson = lessons.find((l) => l.id === lessonId);
  const pct = (c: Course) => Math.round((all(c).filter((l) => done.includes(l.id)).length / all(c).length) * 100);
  const unlocked = (l: Lesson) => { const i = lessons.indexOf(l); return i === 0 || done.includes(lessons[i - 1]!.id) || done.includes(l.id); };

  const complete = (id: string) => {
    if (!done.includes(id)) { setDone((d) => [...d, id]); toast.success("Lesson complete · +15 XP"); }
    const i = lessons.findIndex((l) => l.id === id);
    const nxt = lessons[i + 1];
    if (nxt) setLessonId(nxt.id); else { setLessonId(undefined); setFinished(true); }
  };

  const timer = <div className="flex items-center gap-2 border-2 border-foreground bg-background px-3 py-1.5 shadow-brutal-sm">
    <Timer className="size-4" /><span className="font-serif text-xl tabular-nums">{String(Math.floor(focus / 60)).padStart(2, "0")}:{String(focus % 60).padStart(2, "0")}</span>
    <button aria-label={running ? "Pause focus timer" : "Start focus timer"} onClick={() => setRunning(!running)} className="p-1 hover:bg-primary">{running ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
    <button aria-label="Reset focus timer" onClick={() => { setRunning(false); setFocus(25 * 60); }} className="p-1 hover:bg-primary"><RotateCcw className="size-4" /></button>
  </div>;

  if (!course) return <div className="iq-rise">
    <div className="grid grid-cols-1 items-end gap-4 min-[360px]:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0"><small className="text-xs font-bold uppercase text-muted-foreground">Study mode</small><h1 className="break-words font-serif text-4xl leading-none sm:text-5xl">Your classes</h1><p className="mt-2 text-muted-foreground">Structured courses with lessons, checks, notes and teacher feedback.</p></div>
      {timer}
    </div>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      {courses.map((c) => { const p = pct(c); const nextL = all(c).find((l) => !done.includes(l.id)); return <article key={c.id} className="flex flex-col border-2 border-foreground bg-card p-5 shadow-brutal">
        <div className="flex items-start justify-between gap-3"><span className="grid size-12 place-items-center border-2 border-foreground bg-primary text-foreground"><GraduationCap className="size-6" /></span><span className="border-2 border-foreground px-2 py-0.5 text-xs font-bold">{c.level}</span></div>
        <h2 className="mt-4 font-serif text-3xl">{c.title}</h2>
        <p className="text-sm text-muted-foreground">{c.teacher} · {c.cohort}</p>
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold"><Clock className="size-4" />{c.next}</p>
        <div className="mt-4 flex items-center gap-3"><div className="h-4 flex-1 border-2 border-foreground p-0.5"><div className="h-full bg-secondary transition-all" style={{ width: `${p}%` }} /></div><span className="font-serif text-xl">{p}%</span></div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => { setCourseId(c.id); setLessonId(nextL?.id); setFinished(false); }}>{p === 0 ? "Start class" : p === 100 ? "Review" : "Continue"} <ChevronRight /></Button>
          <Button variant="outline" onClick={() => { setCourseId(c.id); setLessonId(undefined); setFinished(false); }}>Syllabus</Button>
        </div>
        {nextL && <p className="mt-3 text-xs text-muted-foreground">Up next: {nextL.title}</p>}
      </article>; })}
    </div>
  </div>;

  if (finished) return <div className="iq-rise mx-auto max-w-xl border-2 border-foreground bg-primary p-8 text-center shadow-brutal">
    <Trophy className="mx-auto size-14" />
    <h1 className="mt-4 font-serif text-5xl">Course complete</h1>
    <p className="mt-2">{course.title} · {lessons.length} lessons · +{lessons.length * 15} XP</p>
    <div className="mt-5 border-2 border-foreground bg-background p-4 text-left text-sm"><strong className="font-serif text-xl font-normal">Teacher feedback</strong><p className="mt-1 text-muted-foreground">“MashaAllah — your reflections were thoughtful and your checks were strong. Revisit Module 2 before Saturday’s live class.” — {course.teacher}</p></div>
    <div className="mt-6 flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => toast.success("Certificate downloaded (demo)")}>Download certificate</Button><Button onClick={() => { setCourseId(undefined); setFinished(false); }}>Back to classes</Button></div>
  </div>;

  return <div className="iq-rise">
    <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-[minmax(0,1fr)_auto] min-[360px]:items-center">
      <Button variant="ghost" onClick={() => lesson ? setLessonId(undefined) : setCourseId(undefined)}><ArrowLeft /> {lesson ? "Syllabus" : "All classes"}</Button>
      {timer}
    </div>
    <div className="mt-4 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className={cn("border-2 border-foreground bg-card shadow-brutal", lesson && "hidden lg:block")}>
        <div className="border-b-2 border-foreground p-4"><h2 className="font-serif text-2xl leading-tight">{course.title}</h2><p className="text-xs text-muted-foreground">{course.teacher}</p>
          <div className="mt-3 flex items-center gap-2"><div className="h-3 flex-1 border-2 border-foreground p-px"><div className="h-full bg-secondary" style={{ width: `${pct(course)}%` }} /></div><span className="text-sm font-bold">{pct(course)}%</span></div></div>
        {course.modules.map((m) => <div key={m.title}><p className="bg-muted px-4 py-2 text-xs font-bold uppercase">{m.title}</p>
          {m.lessons.map((l) => { const Icon = kindIcon[l.kind]; const ok = unlocked(l); const isDone = done.includes(l.id); return <button key={l.id} disabled={!ok} onClick={() => setLessonId(l.id)} className={cn("flex w-full items-center gap-3 border-t border-foreground/20 px-4 py-3 text-left text-sm disabled:opacity-50", l.id === lessonId ? "bg-primary text-foreground" : "hover:bg-muted")}>
            {isDone ? <CheckCircle2 className="size-4 shrink-0 text-secondary" /> : ok ? <Circle className="size-4 shrink-0" /> : <Lock className="size-4 shrink-0" />}
            <span className="flex-1"><span className="block font-semibold">{l.title}</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="size-3" />{l.kind} · {l.mins} min</span></span>
          </button>; })}
        </div>)}
      </aside>
      <section className="min-w-0">
        {lesson ? <LessonView key={lesson.id} lesson={lesson} idx={lessons.indexOf(lesson)} total={lessons.length} note={notes[lesson.id] ?? ""} setNote={(v) => setNotes((n) => ({ ...n, [lesson.id]: v }))} done={done.includes(lesson.id)} onComplete={() => complete(lesson.id)} />
          : <div className="border-2 border-foreground bg-card p-6 shadow-brutal">
            <h1 className="font-serif text-4xl">Syllabus</h1>
            <p className="mt-2 text-muted-foreground">Lessons unlock in order. Each ends with a short activity so you know you’ve understood it.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[["Lessons done", `${lessons.filter((l) => done.includes(l.id)).length}/${lessons.length}`], ["Study time", `${lessons.filter((l) => done.includes(l.id)).reduce((a, l) => a + l.mins, 0)} min`], ["Next live", course.next.split("· ")[1]]].map(([a, b]) => <div key={a} className="border-2 border-foreground p-3"><small className="text-xs uppercase text-muted-foreground">{a}</small><p className="font-serif text-2xl">{b}</p></div>)}
            </div>
            <Button className="mt-5" onClick={() => setLessonId((lessons.find((l) => !done.includes(l.id)) ?? lessons[0])!.id)}>Resume learning <ChevronRight /></Button>
          </div>}
      </section>
    </div>
  </div>;
}

function LessonView({ lesson, idx, total, note, setNote, done, onComplete }: { lesson: Lesson; idx: number; total: number; note: string; setNote: (v: string) => void; done: boolean; onComplete: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(done ? 100 : 0);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<number | undefined>(undefined);
  const [score, setScore] = useState(0);
  const [reflection, setReflection] = useState("");
  const Icon = kindIcon[lesson.kind];
  const media = lesson.kind === "video" || lesson.kind === "audio";

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress((p) => { if (p >= 100) { setPlaying(false); return 100; } return p + 5; }), 250);
    return () => clearInterval(t);
  }, [playing]);

  const quiz = lesson.quiz;
  const quizDone = quiz ? qi >= quiz.length : false;
  const canFinish = done || (media ? progress >= 100 : lesson.kind === "quiz" ? quizDone : lesson.kind === "reflection" ? reflection.trim().length >= 10 : true);
  const q = quiz?.[qi];

  const feedback = useMemo(() => !quiz ? "" : score === quiz.length ? "Excellent — full marks. You’ve clearly understood this." : score >= quiz.length / 2 ? "Good work. Review the explanations for the ones you missed." : "Worth another look — re-read the lesson and try again.", [score, quiz]);

  return <div className="space-y-5">
    <div className="border-2 border-foreground bg-card shadow-brutal">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b-2 border-foreground px-4 py-3 sm:px-5"><span className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase leading-tight"><Icon className="size-4 shrink-0" />Lesson {idx + 1} of {total} · {lesson.kind}</span><span className="text-xs text-muted-foreground">{lesson.mins} min</span></div>
      <div className="p-5 sm:p-6">
        <h1 className="font-serif text-4xl leading-tight">{lesson.title}</h1>
        {media && <div className="mt-5 border-2 border-foreground bg-foreground p-5 text-background">
          <div className="grid aspect-video max-h-64 w-full place-items-center">{lesson.kind === "video" ? <PlayCircle className="size-16 opacity-80" /> : <Headphones className="size-16 opacity-80" />}</div>
          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"><button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)} className="grid size-10 place-items-center border-2 border-background bg-primary text-foreground">{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
            <div className="h-2 min-w-0 bg-background/30"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><span className="col-span-2 text-right text-xs tabular-nums sm:col-span-1">{Math.round(progress * lesson.mins * 0.6) / 100} / {lesson.mins}:00</span></div>
        </div>}
        <div className="mt-5 space-y-3 leading-7">{lesson.body.map((p) => <p key={p}>{p}</p>)}</div>

        {q && !quizDone && <div className="mt-5 border-2 border-foreground p-4">
          <small className="text-xs font-bold uppercase text-muted-foreground">Question {qi + 1} of {quiz!.length}</small>
          <p className="mt-1 font-serif text-2xl">{q.q}</p>
          {q.visual && <QuizVisual kind={q.visual} compact />}
          <div className="mt-3 grid gap-2">{q.options.map((o, i) => <Button key={o} variant="outline" disabled={pick !== undefined} onClick={() => { setPick(i); if (i === q.answer) setScore((s) => s + 1); }} className={cn("min-h-12 justify-between text-left", pick !== undefined && i === q.answer && "bg-secondary text-secondary-foreground", pick === i && i !== q.answer && "bg-destructive text-destructive-foreground", pick === undefined && "hover:bg-primary")}>{o}{pick !== undefined && i === q.answer && <Check className="size-4" />}{pick === i && i !== q.answer && <X className="size-4" />}</Button>)}</div>
          {pick !== undefined && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-2 border-foreground bg-muted p-3 text-sm"><span className="flex gap-2"><Lightbulb className="size-4 shrink-0" />{q.why}</span><Button size="sm" onClick={() => { setQi(qi + 1); setPick(undefined); }}>{qi + 1 < quiz!.length ? "Next question" : "See results"}</Button></div>}
        </div>}
        {quiz && quizDone && <div className="mt-5 border-2 border-foreground bg-primary p-4"><p className="font-serif text-3xl">{score} / {quiz.length}</p><p className="text-sm">{feedback}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => { setQi(0); setScore(0); setPick(undefined); }}><RotateCcw /> Retry</Button></div>}

        {lesson.kind === "reflection" && <div className="mt-5"><p className="font-serif text-2xl">{lesson.prompt}</p><textarea value={reflection} onChange={(e) => setReflection(e.target.value)} rows={5} aria-label="Your reflection" placeholder="Write at least a sentence…" className="mt-3 w-full border-2 border-foreground bg-background p-3 outline-none focus:shadow-brutal-sm" />
          {reflection.trim().length >= 10 && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Check className="size-4" />Your teacher will see this and may reply with feedback.</p>}</div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground px-5 py-3">
        <span className="text-sm text-muted-foreground">{canFinish ? "Ready to move on" : media ? "Finish the lesson to continue" : lesson.kind === "quiz" ? "Answer every question" : "Write your reflection"}</span>
        <Button disabled={!canFinish} onClick={onComplete}>{done ? "Next lesson" : "Mark complete"} <ChevronRight /></Button>
      </div>
    </div>
    <div className="border-2 border-foreground bg-card p-5 shadow-brutal-sm">
      <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-serif text-2xl"><BookMarked className="size-5" />My notes</h2>{note && <span className="text-xs text-muted-foreground">Saved</span>}</div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} aria-label="Lesson notes" placeholder="Jot down key points from this lesson…" className="mt-3 w-full border-2 border-foreground bg-background p-3 text-sm outline-none focus:shadow-brutal-sm" />
      <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => toast.success("Question sent to your teacher")}>Ask the teacher</Button></div>
    </div>
  </div>;
}
