import { CalendarDays as SCal } from "lucide-react";
import { Check as QCheck, Lock as QLock, MapPin as QPin } from "lucide-react";
import { useLanguage as useAppLangS } from "@/components/language";
import { usePremium as useKidPremium } from "@/components/premium";
import { catFor } from "@/components/study-core";
import { useAuth } from "@/components/auth";
import { liveVoiceLangs } from "@/components/study-core";
import { useVoiceLangs } from "@/components/voice-langs";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, Calculator, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, Code, FileText, FlaskConical, Globe,
  GraduationCap, Heart, Languages, Lock, Palette, Sprout, Trophy, Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CertificateCard } from "@/components/study-certificate";
import { StudyPlanCard } from "@/components/study-plan";
import { StudyTestBar, testOn } from "@/components/study-test";
import { KidRoad, LessonPath, ProgressBar, StageRail } from "@/components/study-path";
import type { Plan } from "@/components/study-core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePremium } from "@/components/premium";
import { LessonPlayer } from "@/components/study-lesson";
import { ExamRunner } from "@/components/study-exam";
import {
  promoExamId, reachedIndex, stageName, stagesOf, subjectExamId, topics, useStudyCategories, useStudyMe, useVoiceLang, VOICE_LANGS,
  type Category, type Exam, type IconKey, type Lesson, type Results, type Subject,
} from "@/components/study-data";

const PdfReader = lazy(() => import("@/components/pdf-reader"));
export const STUDY_ICONS: Record<IconKey, typeof BookOpen> = { graduation: GraduationCap, languages: Languages, sprout: Sprout, palette: Palette, book: BookOpen, calculator: Calculator, code: Code, heart: Heart, flask: FlaskConical, globe: Globe };

type View = { cat?: string; stage?: string; subject?: string; lesson?: string; exam?: string };

/** Live published docs from a collection, filtered by equality fields. */
function useDocs<T>(name: string, filters: [string, string][], on = true) {
  const [rows, setRows] = useState<T[] | null>(null);
  const k = JSON.stringify(filters);
  useEffect(() => {
    if (!on) return;
    const q = query(collection(db, name), where("status", "==", "published"), ...filters.map(([f, v]) => where(f, "==", v)));
    return onSnapshot(q, (s) => setRows(s.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T)), () => setRows([]));
  }, [name, k, on]); // eslint-disable-line react-hooks/exhaustive-deps
  return rows;
}
function useExam(id: string | undefined) {
  const [exam, setExam] = useState<Exam | null>(null);
  useEffect(() => {
    if (!id) { setExam(null); return; }
    return onSnapshot(doc(db, "studyExams", id), (s) => setExam(s.exists() && s.get("status") === "published" ? ({ ...(s.data() as Omit<Exam, "id">), id: s.id }) : null), () => setExam(null));
  }, [id]);
  return exam;
}

export function StudyScreen() {
  const { uid } = useStudyMe();
  return <><div data-study><StudyScreenInner /></div><StudyTestBar uid={uid} /></>;
}

function StudyScreenInner() {
  const [view, setView] = useState<View>({});
  const { cats: allCats } = useStudyCategories();
  const { account: studyAcct, ready: studyReady } = useAuth();
  const cats = allCats ? allCats.filter((c) => catFor(c, studyAcct?.zone)) : allCats;
  const { uid, progress, results } = useStudyMe();
  const voice = useVoiceLang();
  useVoiceLangs();
  const appLang = useAppLangS().lang;
  useEffect(() => { if (voice.lang !== appLang) voice.set(appLang); }, [appLang]); // eslint-disable-line react-hooks/exhaustive-deps
  const subjects = useDocs<Subject>("studySubjects", view.cat ? [["category", view.cat]] : [], !!view.cat);
  const stageLessons = useDocs<Lesson>("studyLessons", view.stage ? [["stage", view.stage]] : [], !!view.stage);
  const examView = useExam(view.exam);
  const catLessons = useDocs<Lesson>("studyLessons", [], !!view.cat && studyAcct?.zone !== "kids");
  useEffect(() => { window.scrollTo?.(0, 0); }, [view]);
  if (!studyReady) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (studyAcct?.zone === "kids") return <KidStudy cats={cats ?? []} />;
  if (!cats) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const cat = cats.find((c) => c.id === view.cat);
  const stages = stagesOf(cat);
  const reached = cat ? reachedIndex(results, cat.id, stages) : 0;
  const flow = makeFlow(cat, subjects ?? [], catLessons ?? [], progress.done ?? {}, reached);

  /* an exam */
  if (view.exam) return examView ? <ExamRunner exam={examView} onExit={() => setView({ ...view, exam: undefined })} />
    : <div className="iq-rise"><Button variant="ghost" onClick={() => setView({ ...view, exam: undefined })}><ArrowLeft /> Back</Button><p className="mt-4 border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">This exam isn't ready yet.</p></div>;

  /* 1 · categories */
  if (!cat) return <div className="iq-rise">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><small className="text-xs font-bold uppercase text-muted-foreground">Study</small>
        <h1 className="font-serif text-4xl leading-none sm:text-5xl">What will you learn today?</h1></div>
      
    </div>
    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5">{cats.map((c) => { const Icon = STUDY_ICONS[c.icon] ?? BookOpen; return <button key={c.id} disabled={!c.live} onClick={() => setView({ cat: c.id })}
      className={cn("flex flex-col border-2 border-foreground bg-card p-5 text-left shadow-brutal transition-transform", c.live ? "col-span-2 hover:-translate-y-0.5 sm:col-span-1" : "col-span-1 opacity-70 max-sm:p-3 max-sm:shadow-brutal-sm")}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-12 place-items-center border-2 border-foreground", c.live ? "bg-primary" : "bg-muted max-sm:size-9")}><Icon className={cn("size-6", !c.live && "max-sm:size-5")} /></span>
        {!c.live && <span className="flex items-center gap-1 border-2 border-foreground px-2 py-0.5 text-xs font-bold max-sm:border-0 max-sm:p-0"><Lock className="size-3 max-sm:size-4" /> <span className="max-sm:hidden">Coming soon</span></span>}
      </div>
      <h2 className={cn("mt-4 font-serif text-3xl", !c.live && "max-sm:mt-3 max-sm:text-xl max-sm:leading-tight")}>{c.name} {c.nameAr && <span dir="rtl" className={cn("text-xl text-muted-foreground", !c.live && "max-sm:block max-sm:text-base")}>{c.nameAr}</span>}</h2>
      <p className={cn("text-sm text-muted-foreground", !c.live && "max-sm:hidden")}>{c.blurb}</p>
      {!c.live && <p className="mt-1 text-xs font-bold sm:hidden">Coming soon</p>}
      {c.live && <CardAction label="Open →" pulse={cats.filter((x) => x.live).length === 1} />}
    </button>; })}</div>
  </div>;

  /* 2 · levels and stages */
  if (!view.stage) return <StagesView cat={cat} subjects={catLessons ? subjects : null} flow={flow} reached={reached} onBack={() => setView({})}
    onOpen={(stage) => setView({ cat: cat.id, stage })} onExam={(id) => setView({ cat: cat.id, exam: id })} />;

  const stageIdx = stages.findIndex((s) => s.id === view.stage);
  const inStage = (subjects ?? []).filter((s) => s.stages.includes(view.stage!)).sort((a, b) => a.order - b.order);
  const subject = inStage.find((s) => s.id === view.subject);
  const lessons = (stageLessons ?? []).filter((l) => l.subjectId === subject?.id).sort((a, b) => a.order - b.order);

  /* 4b · a lesson */
  const lesson = lessons.find((l) => l.id === view.lesson);
  if (subject && lesson) return <LessonPlayer key={lesson.id} lesson={lesson} lang={voice.lang} uid={uid} done={!!progress.done?.[lesson.id]} note={progress.notes?.[lesson.id] ?? ""}
    onExit={() => setView({ ...view, lesson: undefined })} onFinished={() => {}} />;

  /* 4 · a subject */
  if (subject) return <SubjectView cat={cat} stage={view.stage} subject={subject} lessons={lessons} done={progress.done ?? {}} results={results} uid={uid} flow={flow} plans={progress.plans ?? {}}
    onBack={() => setView({ cat: cat.id, stage: view.stage })} onLesson={(id) => setView({ ...view, lesson: id })} onExam={(id) => setView({ ...view, exam: id })} />;

  /* 3 · subjects in a stage */
  return <StageView cat={cat} stage={view.stage} stageIdx={stageIdx} reached={reached} subjects={inStage} flow={flow} lessons={stageLessons ?? []} done={progress.done ?? {}} results={results}
    onBack={() => setView({ cat: cat.id })} onSubject={(id) => setView({ cat: cat.id, stage: view.stage, subject: id })} onExam={(id) => setView({ cat: cat.id, stage: view.stage, exam: id })} />;
}

/* ---------------- progress per subject ----------------
   Each subject moves through the levels on its own: Qira'ah in Beginner 2 opens when every lesson of
   Qira'ah in Beginner 1 is done (its last lesson is the level's final exam). Arabiyyah keeps its own pace.
   Stages opened the old way (promotion exam / test out) stay open. */
type Flow = ReturnType<typeof makeFlow>;
function makeFlow(cat: Category | undefined, subjects: Subject[], lessons: Lesson[], done: Record<string, number>, reached: number) {
  const stages = stagesOf(cat);
  const idxOf = (id: string) => stages.findIndex((s) => s.id === id);
  const lessonsOf = (sid: string, stage: string) => lessons.filter((l) => l.subjectId === sid && l.stage === stage);
  const complete = (sid: string, stage: string) => { const ls = lessonsOf(sid, stage); return ls.length > 0 && ls.every((l) => done[l.id]); };
  const prevStage = (sid: string, stage: string) => {
    const sub = subjects.find((s) => s.id === sid);
    const mine = stages.filter((st) => sub?.stages.includes(st.id));
    const j = mine.findIndex((st) => st.id === stage);
    return j > 0 ? mine[j - 1] : undefined;
  };
  const open = (sid: string, stage: string) => { const p = prevStage(sid, stage); return testOn() || !p || idxOf(stage) <= reached || complete(sid, p.id); };
  const earnedAt = (sid: string, stage: string) => Math.max(0, ...lessonsOf(sid, stage).map((l) => done[l.id] ?? 0)) || Date.now();
  const inStage = (stage: string) => subjects.filter((s) => s.stages.includes(stage));
  const stageState = (stage: string): "done" | "open" | "locked" => {
    const subs = inStage(stage);
    if (subs.length && subs.every((s) => complete(s.id, stage))) return "done";
    return testOn() || subs.some((s) => open(s.id, stage)) || idxOf(stage) <= reached ? "open" : "locked";
  };
  const stageProgress = (stage: string) => { const ls = inStage(stage).flatMap((s) => lessonsOf(s.id, stage)); return { done: ls.filter((l) => done[l.id]).length, total: ls.length }; };
  return { lessonsOf, complete, prevStage, open, earnedAt, stageState, stageProgress };
}

/* ---------------- stages ---------------- */

function StagesView({ cat, subjects, flow, reached, onBack, onOpen, onExam }: { cat: Category; subjects: Subject[] | null; flow: Flow; reached: number; onBack: () => void; onOpen: (s: string) => void; onExam: (id: string) => void }) {
  const stages = stagesOf(cat);
  const firstOpen = stages.find((s) => flow.stageState(s.id) === "open" && (subjects ?? []).some((x) => x.stages.includes(s.id)))?.id;
  return <div className="iq-rise">
    <Button variant="ghost" onClick={onBack}><ArrowLeft /> Back</Button>
    <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{cat.name} {cat.nameAr && <span dir="rtl" className="text-2xl text-muted-foreground">{cat.nameAr}</span>}</h1>
    <p className="mt-1 text-muted-foreground">Each subject moves up on its own: finish a subject's level, and its next level opens. Every completed level earns a certificate.</p>
    {subjects === null ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      : <div className="mt-6 grid gap-6">{cat.levels.map((l) => <section key={l.id}>
        <h2 className="font-serif text-2xl">{l.name} {l.nameAr && <span dir="rtl" className="text-lg text-muted-foreground">{l.nameAr}</span>}</h2>
        <StageRail items={stages.filter((s) => s.level.id === l.id).map((s) => {
          const idx = stages.indexOf(s);
          const n = subjects.filter((x) => x.stages.includes(s.id)).length;
          const state = flow.stageState(s.id);
          const prev = stages[idx - 1];
          const pg = flow.stageProgress(s.id);
          return { key: s.id, state: !n ? "soon" as const : state, current: s.id === firstOpen, node: <div className={cn("flex flex-col justify-between gap-3 border-2 border-foreground bg-card p-4 shadow-brutal-sm", state === "locked" && "bg-muted", s.id === firstOpen && "shadow-brutal")}>
            <button disabled={state === "locked" || !n} onClick={() => onOpen(s.id)} className="flex items-center justify-between text-left disabled:cursor-default">
              <span><span className="block font-serif text-2xl">{s.name}</span>
                <span className="text-xs text-muted-foreground">{state === "done" ? "Completed ✓" : !n ? "Coming soon" : `${n} subject${n > 1 ? "s" : ""}`}</span>
                {n > 0 && state !== "locked" && <ProgressBar done={pg.done} total={pg.total} />}</span>
              {state === "locked" ? <Lock className="size-4" /> : state === "done" ? <CheckCircle2 className="size-5 text-secondary" /> : n ? <ChevronRight className="size-5" /> : null}
            </button>
            {state !== "locked" && n > 0 && <button onClick={() => onOpen(s.id)} className="text-left"><CardAction label={state === "open" ? "Start →" : "Review →"} pulse={s.id === firstOpen} /></button>}
            {state === "locked" && prev && n > 0 && idx > reached && <Button size="sm" variant="outline" onClick={() => onExam(promoExamId(cat.id, prev.id))}>Test out to here</Button>}
          </div> };
        })} />
      </section>)}</div>}
  </div>;
}

/* ---------------- one stage ---------------- */

function StageView({ cat, stage, stageIdx, reached, subjects, flow, lessons, done, results, onBack, onSubject, onExam }: {
  cat: Category; stage: string; stageIdx: number; reached: number; subjects: Subject[]; flow: Flow; lessons: Lesson[]; done: Record<string, number>; results: Results;
  onBack: () => void; onSubject: (id: string) => void; onExam: (id: string) => void;
}) {
  const promo = useExam(promoExamId(cat.id, stage));
  const passedAll = subjects.every((s) => results.exams?.[subjectExamId(s.id, stage)]?.passed);
  const promoPassed = !!results.exams?.[promoExamId(cat.id, stage)]?.passed || stageIdx < reached;
  return <div className="iq-rise">
    <Button variant="ghost" onClick={onBack}><ArrowLeft /> Back</Button>
    <small className="mt-2 block text-xs font-bold uppercase text-muted-foreground">{cat.name}</small>
    <h1 className="font-serif text-4xl sm:text-5xl">{stageName(cat, stage)}</h1>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((s) => {
      const ls = lessons.filter((l) => l.subjectId === s.id);
      const d = ls.filter((l) => done[l.id]).length;
      const passed = results.exams?.[subjectExamId(s.id, stage)]?.passed || (ls.length > 0 && d === ls.length);
      const isOpen = flow.open(s.id, stage), prev = flow.prevStage(s.id, stage);
      if (!isOpen) return <button key={s.id} onClick={() => toast(`Finish ${s.name} in ${prev?.name ?? "the level before"} first.`)} className="flex flex-col border-2 border-foreground bg-muted p-5 text-left opacity-80 shadow-brutal-sm">
        <div className="flex items-start justify-between"><span className="grid size-10 place-items-center border-2 border-foreground bg-background"><Lock className="size-5" /></span></div>
        <h2 className="mt-3 font-serif text-3xl leading-tight">{s.name}</h2>
        {s.nameAr && <p dir="rtl" className="text-lg text-muted-foreground">{s.nameAr}</p>}
        <p className="mt-3 text-sm font-semibold">Finish {s.name} in {prev?.name} to open it.</p>
      </button>;
      return <div key={s.id}><button onClick={() => onSubject(s.id)} className="flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-foreground bg-card p-3.5 text-left shadow-[0_4px_0_var(--foreground)] sm:hidden">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-[#1c1a17]"><BookOpen className="size-6" /></span>
        <span className="min-w-0 flex-1"><b className="block truncate text-base leading-tight">{s.name}</b>{s.nameAr && <span dir="rtl" className="block text-sm text-muted-foreground">{s.nameAr}</span>}<span className="text-xs text-muted-foreground">{passed ? "Completed ✓" : `${d}/${ls.length}`}</span></span>
        <StudyRing pct={ls.length ? (d / ls.length) * 100 : 0} /></button>
      <button onClick={() => onSubject(s.id)} className="hidden w-full flex-col border-2 border-foreground bg-card p-5 text-left shadow-brutal hover:-translate-y-0.5 sm:flex">
        <div className="flex items-start justify-between"><span className="grid size-10 place-items-center border-2 border-foreground bg-primary"><BookOpen className="size-5" /></span>{passed && <span className="flex items-center gap-1 border-2 border-foreground bg-secondary px-2 text-xs font-bold text-secondary-foreground"><Check className="size-3" /> Completed</span>}</div>
        <h2 className="mt-3 font-serif text-3xl leading-tight">{s.name}</h2>
        {s.nameAr && <p dir="rtl" className="text-lg text-muted-foreground">{s.nameAr}</p>}
        <div className="mt-3 flex items-center gap-2"><div className="h-3 flex-1 border-2 border-foreground p-px"><div className="h-full bg-secondary" style={{ width: `${ls.length ? (d / ls.length) * 100 : 0}%` }} /></div><span className="text-xs font-bold tabular-nums">{d}/{ls.length}</span></div>
        <CardAction label={d === 0 ? "Start ▶" : d < ls.length ? "Continue ▶" : "Review →"} pulse={d < ls.length} />
      </button></div>;
    })}</div>

    {promo && <div className={cn("mt-8 flex flex-wrap items-center gap-4 border-2 border-foreground p-5 shadow-brutal", promoPassed ? "bg-secondary text-secondary-foreground" : "bg-primary")}>
      <Trophy className="size-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-3xl">Promotion exam</h2>
        <p className="text-sm">{promoPassed ? "Passed. The next stage is open." : passedAll ? "You've passed every subject. Pass this to move up." : "Pass every subject exam first, or take it now to skip ahead."}</p>
      </div>
      {!promoPassed && <Button variant="outline" onClick={() => onExam(promo.id)}>{passedAll ? "Take the exam" : "Skip ahead"}</Button>}
    </div>}
  </div>;
}

/* ---------------- one subject ---------------- */

function SubjectView({ cat, stage, subject, lessons, done, results, uid, flow, plans, onBack, onLesson, onExam }: {
  cat: Category; stage: string; subject: Subject; lessons: Lesson[]; done: Record<string, number>; results: Results; uid: string | null | undefined; flow: Flow; plans: Record<string, Plan>;
  onBack: () => void; onLesson: (id: string) => void; onExam: (id: string) => void;
}) {
  const { canAccess } = usePremium();
  const [syl, setSyl] = useState(false);
  const [pdf, setPdf] = useState(false);
  const [page, setPage] = useState(1);
  const [planOpen, setPlanOpen] = useState(false);
  const s = subject.syllabus?.[stage];
  const list = topics(s);
  const exam = useExam(subjectExamId(subject.id, stage));
  const allDone = lessons.every((l) => done[l.id]);
  const r = results.exams?.[subjectExamId(subject.id, stage)];
  const firstOpen = useMemo(() => lessons.findIndex((l) => !done[l.id]), [lessons, done]);

  return <div className="iq-rise">
    <Button variant="ghost" onClick={onBack}><ArrowLeft /> {stageName(cat, stage)}</Button>
    <div className="mt-2 border-2 border-foreground bg-card p-5 shadow-brutal">
      <small className="text-xs font-bold uppercase text-muted-foreground">{stageName(cat, stage)}</small>
      <h1 className="font-serif text-4xl leading-tight">{subject.name} {subject.nameAr && <span dir="rtl" className="text-2xl text-muted-foreground">{subject.nameAr}</span>}</h1>
      {subject.description && <p className="mt-1 text-muted-foreground">{subject.description}</p>}
      {(list.length > 0 || s?.pdfUrl) && <button onClick={() => setSyl(!syl)} className="mt-3 flex items-center gap-1 text-sm font-semibold underline"><ChevronDown className={cn("size-4 transition-transform", syl && "rotate-180")} /> Syllabus</button>}
      {syl && <div className="mt-2">
        {list.length > 0 && <ol className="grid gap-1 text-sm">{list.map((t, i) => <li key={`${i}-${t}`}>{i + 1}. {t}</li>)}</ol>}
        {s?.pdfUrl && <Button size="sm" variant="outline" className="mt-2" onClick={() => setPdf(!pdf)}><FileText /> {pdf ? "Hide" : "Open"} full syllabus</Button>}
        {pdf && s?.pdfUrl && <div className="mt-3 border-2 border-foreground"><Suspense fallback={<p className="p-4 text-sm">Opening…</p>}><PdfReader url={s.pdfUrl} startPage={page} onPage={(p) => setPage(p)} /></Suspense></div>}
      </div>}
    </div>

    {uid && flow.complete(subject.id, stage) && <CertificateCard className="mt-4" info={{ uid, subject: subject.name, subjectAr: subject.nameAr, level: stageName(cat, stage), category: cat.name, date: flow.earnedAt(subject.id, stage), stars: stagesOf(cat).filter((st) => subject.stages.includes(st.id)).findIndex((st) => st.id === stage) + 1 }} />}
    {uid && lessons.length > 0 && <>
      <button onClick={() => setPlanOpen(!planOpen)} className="mt-4 flex w-full items-center gap-3 border-2 border-foreground bg-card p-3.5 text-left shadow-brutal-sm">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-[#1c1a17]"><SCal className="size-5" /></span>
        <span className="min-w-0 flex-1"><b className="block">Plan your pace</b><span className="text-xs text-muted-foreground">{plans[`${subject.id}__${stage}`] ? "Your plan is set · tap to change" : "Set a weekly goal and reminders"}</span></span>
        <ChevronDown className={cn("size-5 shrink-0 transition-transform", planOpen && "rotate-180")} />
      </button>
      {planOpen && <StudyPlanCard uid={uid} planKey={`${subject.id}__${stage}`} plan={plans[`${subject.id}__${stage}`]} subject={subject.name} level={stageName(cat, stage)} total={lessons.length} doneNow={lessons.filter((l) => done[l.id]).length} />}
    </>}
    <h2 className="mt-6 font-serif text-2xl">Lessons</h2>
    {lessons.length === 0 ? <p className="mt-2 border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">Lessons are being prepared. Check back soon.</p>
      : <LessonPath lessons={lessons} isDone={(id) => !!done[id]} firstOpen={firstOpen} levelName={stageName(cat, stage)}
          canOpen={(i) => testOn() || !!done[lessons[i]!.id] || i === firstOpen || firstOpen === -1}
          premiumLocked={(l) => !canAccess(l.id, l.tier as Lesson["tier"])}
          onOpen={(l) => (!canAccess(l.id, l.tier as Lesson["tier"]) ? toast("This lesson is for Premium members.") : onLesson(l.id))}
          certificate={flow.complete(subject.id, stage) ? "earned" : "locked"} />}

    {exam && <div className={cn("mt-6 flex flex-wrap items-center gap-4 border-2 border-foreground p-5 shadow-brutal", r?.passed ? "bg-secondary text-secondary-foreground" : "bg-card")}>
      <GraduationCap className="size-9 shrink-0" />
      <div className="min-w-0 flex-1"><h2 className="font-serif text-2xl">{subject.name} exam</h2>
        <p className="text-sm">{r?.passed ? `Passed · best score ${r.best}%` : allDone ? `Pass mark ${exam.passMark}%${r ? ` · best so far ${r.best}%` : ""}` : "Finish all the lessons to unlock the exam."}</p></div>
      {!r?.passed && <Button disabled={!allDone} onClick={() => onExam(exam.id)}>{r ? "Try again" : "Take the exam"}</Button>}
    </div>}
  </div>;
}

/* ---------------- Kids: big tiles, simple lists, stars ---------------- */
/* ---------------- the action button on every card ("Open →", "Start ▶"…): the main one gently pulses ---------------- */
function CardAction({ label, pulse }: { label: string; pulse?: boolean }) {
  return <span className={cn("mt-4 inline-flex w-fit items-center gap-1 border-2 border-foreground bg-foreground px-4 py-2 text-sm font-bold text-background shadow-brutal-sm",
    pulse && "animate-pulse")}>{label}</span>;
}

const KID_TINTS = ["bg-primary", "bg-secondary text-secondary-foreground", "bg-[#d7ecd9] text-[#1c1a17]", "bg-[#f7d9c4] text-[#1c1a17]", "bg-[#d9e3f7] text-[#1c1a17]"];
function kidEmoji(name: string) {
  const n = name.toLowerCase();
  if (/letter|qa.?idah|alphabet|huruf|arab/.test(n)) return "أ ب ت";   // Arabic letters, not "abc"
  if (/dua|du.?a|supplicat/.test(n)) return "🤲";
  if (/prophet|nabi|anbiya|stor|seerah|sirah/.test(n)) return "🌙";
  if (/salah|salat|prayer|wudu/.test(n)) return "🕌";
  if (/manner|adab|akhlaq|character/.test(n)) return "💛";
  if (/qur|surah|juz|hifz/.test(n)) return "📖";
  return "⭐";
}
function KidStudy({ cats }: { cats: Category[] }) {
  const live = cats.filter((c) => c.live !== false);
  const [catId, setCatId] = useState<string | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);
  const cid = catId ?? (live.length === 1 ? live[0].id : undefined);
  const { uid, progress } = useStudyMe();
  const voice = useVoiceLang();
  const { premium } = useKidPremium();
  const subjects = useDocs<Subject>("studySubjects", cid ? [["category", cid]] : [], !!cid);
  const lessonsAll = useDocs<Lesson>("studyLessons", subjectId ? [["subjectId", subjectId]] : [], !!subjectId);
  useEffect(() => { window.scrollTo?.(0, 0); }, [cid, subjectId, lessonId]);
  const subject = (subjects ?? []).find((x) => x.id === subjectId);
  // lessons in level order (Level 1, Level 2…), then lesson order
  const kStages = stagesOf(live.find((c) => c.id === cid));
  const sIdx = (id: string) => { const i = kStages.findIndex((x) => x.id === id); return i < 0 ? 999 : i; };
  const lessons = (lessonsAll ?? []).filter((l) => l.subjectId === subjectId).sort((a, b) => sIdx(a.stage) - sIdx(b.stage) || a.order - b.order);
  const lesson = lessons.find((l) => l.id === lessonId);
  const done = (id: string) => !!progress.done?.[id];
  const nextUp = lessons.findIndex((y) => !done(y.id));       // lessons open one by one, level by level
  const levels = [...new Set(lessons.map((l) => l.stage))];
  const back = (label: string, onClick: () => void) => <button onClick={onClick} className="mb-4 border-2 border-foreground bg-background px-4 py-2 text-lg font-bold">← {label}</button>;

  if (lesson) return <LessonPlayer key={lesson.id} lesson={lesson} lang={voice.lang} uid={uid} done={done(lesson.id)} note={progress.notes?.[lesson.id] ?? ""} onExit={() => setLessonId(undefined)} onFinished={() => {}} />;

  if (subject) return <div className="iq-rise">
    {back("Subjects", () => setSubjectId(undefined))}
    <h1 className="font-serif text-5xl leading-none">{kidEmoji(subject.name)} {subject.name}</h1>
    <p className="mt-2 text-lg text-muted-foreground">{`${lessons.filter((l) => done(l.id)).length} of ${lessons.length} done ⭐`}</p>
    {!lessons.length && <p className="mt-6 border-2 border-dashed border-foreground p-6 text-lg">New lessons are coming soon! 🌟</p>}
    {levels.map((lv) => { const inLv = lessons.filter((l) => l.stage === lv); const lvDone = inLv.every((l) => done(l.id)); const lvName = kStages.find((x) => x.id === lv)?.name ?? lv;
      return <section key={lv} className="mt-8">
      {levels.length > 1 && <h2 className="font-serif text-3xl">{lvDone ? "🏆" : "📘"} {lvName}</h2>}
      {lvDone && uid && <CertificateCard className="mt-3" info={{ uid, subject: subject.name, subjectAr: subject.nameAr, level: lvName, category: live.find((c) => c.id === cid)?.name ?? "", kids: true, stars: levels.indexOf(lv) + 1, date: Math.max(...inLv.map((l) => progress.done?.[l.id] ?? 0)) || Date.now() }} />}
      <div className="mt-4"><KidRoad lessons={inLv} isDone={done} nextId={lessons[nextUp]?.id}
        isShut={(id) => !testOn() && !done(id) && id !== lessons[nextUp]?.id} isPremiumLocked={(l) => l.tier === "premium" && !premium}
        trophy={lvDone ? `${lvName} done!` : `Finish ${lvName}`} trophyDone={lvDone}
        onOpen={(l) => { const shut = !testOn() && !done(l.id) && l.id !== lessons[nextUp]?.id;
          if (shut) toast("🔒 Finish the lesson before this one first!"); else if (l.tier === "premium" && !premium) toast("🔒 This lesson is Premium. Ask your parent about Premium!"); else setLessonId(l.id); }} /></div>
    </section>; })}
  </div>;

  if (cid) return <div className="iq-rise">
    {live.length > 1 && back("Back", () => setCatId(undefined))}
    <h1 className="font-serif text-5xl leading-none">Study 📚</h1>
    <p className="mt-3 text-lg text-muted-foreground">Pick something to learn!</p>
    {subjects && !subjects.length && <p className="mt-6 border-2 border-dashed border-foreground p-6 text-lg">New lessons are coming soon! 🌟</p>}
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{(subjects ?? []).slice().sort((a, b) => a.order - b.order).map((x, i) => <button key={x.id} onClick={() => setSubjectId(x.id)}
      className={cn("flex aspect-square flex-col items-center justify-center gap-2 border-2 border-foreground p-4 text-center shadow-brutal transition-transform hover:-translate-y-1", KID_TINTS[i % KID_TINTS.length])}>
      <span className="text-5xl">{kidEmoji(x.name)}</span>
      <b className="text-xl leading-tight">{x.name}</b>
      {x.nameAr && <span dir="rtl" className="text-sm opacity-80">{x.nameAr}</span>}
      <span className="mt-1 border-2 border-foreground bg-foreground px-3 py-1 text-sm font-bold text-background">Play ▶</span>
    </button>)}</div>
  </div>;

  return <div className="iq-rise">
    <h1 className="font-serif text-5xl leading-none">Study 📚</h1>
    <p className="mt-3 text-lg text-muted-foreground">Pick something to learn!</p>
    {!live.length && <p className="mt-6 border-2 border-dashed border-foreground p-6 text-lg">New lessons are coming soon! 🌟</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{live.map((c, i) => <button key={c.id} onClick={() => setCatId(c.id)}
      className={cn("border-2 border-foreground p-6 text-left shadow-brutal transition-transform hover:-translate-y-1", KID_TINTS[i % KID_TINTS.length])}>
      <span className="text-5xl">📚</span><b className="mt-2 block font-serif text-3xl">{c.name}</b>
      <span className="mt-3 inline-block animate-pulse border-2 border-foreground bg-foreground px-4 py-2 text-lg font-bold text-background">Open ▶</span>
    </button>)}</div>
  </div>;
}

/** Quest Map: the Study curriculum as a journey. Chapters = categories, stops = subjects. */
export function QuestMap() {
  const raw = useStudyCategories() as unknown;
  const all = ((Array.isArray(raw) ? raw : (raw as { cats?: Category[] } | null)?.cats) ?? []) as (Category & { live?: boolean })[];
  const { account: qAcct } = useAuth();
  const cats = all.filter((c) => c.live !== false && catFor(c, qAcct?.zone));
  const [catId, setCatId] = useState<string | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);
  const cid = catId ?? cats[0]?.id;
  const { uid, progress } = useStudyMe();
  const voice = useVoiceLang();
  const { premium } = useKidPremium();
  const subjects = useDocs<Subject>("studySubjects", cid ? [["category", cid]] : [], !!cid);
  const lessonsAll = useDocs<Lesson>("studyLessons", [], true);
  useEffect(() => { window.scrollTo?.(0, 0); }, [cid, subjectId, lessonId]);
  const done = (id: string) => !!progress.done?.[id];
  const list = (subjects ?? []).slice().sort((a, b) => a.order - b.order);
  const lessonsOf = (sid: string) => (lessonsAll ?? []).filter((l) => l.subjectId === sid).sort((a, b) => a.order - b.order);
  const pctOf = (sid: string) => { const ls = lessonsOf(sid); return ls.length ? Math.round((ls.filter((l) => done(l.id)).length / ls.length) * 100) : 0; };
  const firstOpen = list.findIndex((x) => pctOf(x.id) < 100 || !lessonsOf(x.id).length);
  const status = (i: number) => (firstOpen === -1 || i < firstOpen ? "done" : i === firstOpen ? "current" : "locked");
  const totalLessons = list.reduce((n, x) => n + lessonsOf(x.id).length, 0);
  const totalDone = list.reduce((n, x) => n + lessonsOf(x.id).filter((l) => done(l.id)).length, 0);
  const overall = totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0;
  const subject = list.find((x) => x.id === subjectId);
  const lessons = subject ? lessonsOf(subject.id) : [];
  const lesson = lessons.find((l) => l.id === lessonId);

  if (lesson) return <LessonPlayer key={lesson.id} lesson={lesson} lang={voice.lang} uid={uid} done={done(lesson.id)} note={progress.notes?.[lesson.id] ?? ""} onExit={() => setLessonId(undefined)} onFinished={() => {}} />;
  if (subject) return <div className="iq-rise">
    <button onClick={() => setSubjectId(undefined)} className="mb-4 border-2 border-foreground bg-background px-4 py-2 font-bold shadow-brutal-sm">← Map</button>
    <h2 className="font-serif text-4xl leading-tight">{subject.name}</h2>
    {subject.nameAr && <p dir="rtl" className="text-lg text-muted-foreground">{subject.nameAr}</p>}
    <p className="mt-2 text-sm text-muted-foreground">{lessons.filter((l) => done(l.id)).length} / {lessons.length}</p>
    <div className="mt-5 grid gap-3">{lessons.map((l, i) => { const locked = l.tier === "premium" && !premium; return <button key={l.id} onClick={() => (locked ? toast("This lesson is Premium.") : setLessonId(l.id))}
      className={cn("flex items-center gap-4 border-2 border-foreground p-4 text-left shadow-brutal-sm", done(l.id) ? "bg-primary/40" : "bg-background", locked && "opacity-70")}>
      <span className="grid size-11 shrink-0 place-items-center border-2 border-foreground bg-background font-bold">{done(l.id) ? <QCheck className="size-5" /> : i + 1}</span>
      <span className="min-w-0 flex-1"><b className="block leading-tight">{l.title}</b><span className="text-xs text-muted-foreground">{l.mins ? `${l.mins} min` : ""}</span></span>
      {locked && <QLock className="size-4" />}
    </button>; })}
    {!lessons.length && <p className="border-2 border-dashed border-foreground p-5 text-sm">Coming soon</p>}</div>
  </div>;

  return <div className="iq-rise">
    {cats.length > 1 && <div className="mb-4 flex flex-wrap gap-2">{cats.map((c) => <button key={c.id} onClick={() => setCatId(c.id)} className={cn("border-2 border-foreground px-3 py-1.5 text-sm font-bold", c.id === cid ? "bg-foreground text-background" : "bg-background")}>{c.name}</button>)}</div>}
    <section className="border-2 border-foreground bg-primary p-4 shadow-brutal">
      <p className="text-xs font-bold uppercase">{cats.find((c) => c.id === cid)?.name ?? ""}</p>
      <div className="mt-2 flex items-center gap-3"><div className="h-3 flex-1 border-2 border-foreground bg-background"><div className="h-full bg-secondary" style={{ width: `${overall}%` }} /></div><b className="tabular-nums">{overall}%</b></div>
      <p className="mt-1 text-xs">{totalDone} / {totalLessons}</p>
    </section>
    {subjects === undefined || subjects === null ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p> : !list.length ? <p className="mt-6 border-2 border-dashed border-foreground p-6 text-sm">Coming soon</p> :
    <div className="relative mx-auto mt-8 max-w-md pb-6">
      <div className="absolute bottom-0 left-1/2 top-0 -translate-x-1/2 border-l-4 border-dashed border-foreground/25" />
      {list.map((x, i) => { const st = status(i); const pct = pctOf(x.id); const left = i % 2 === 0;
        return <div key={x.id} className={cn("relative mb-6 flex", left ? "justify-start" : "justify-end")}>
          <button onClick={() => (st === "locked" ? toast(`Finish ${list[firstOpen]?.name ?? "the previous stop"} first`) : setSubjectId(x.id))}
            className={cn("relative z-10 flex w-[82%] items-center gap-3 border-2 border-foreground p-3 text-left shadow-brutal transition hover:-translate-y-0.5", st === "current" ? "bg-primary" : st === "done" ? "bg-background" : "bg-muted text-muted-foreground")}>
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-full border-2 border-foreground font-serif text-xl", st === "done" ? "bg-secondary text-background" : st === "current" ? "bg-background" : "bg-muted")}>
              {st === "done" ? <QCheck className="size-6" /> : st === "locked" ? <QLock className="size-5" /> : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate leading-tight">{x.name}</b>
              <span className="text-xs text-muted-foreground">{`${lessonsOf(x.id).length} lessons · ${pct}%`}</span>
              {st === "current" && <span className="mt-1 block h-2 border border-foreground bg-background"><span className="block h-full bg-secondary" style={{ width: `${pct}%` }} /></span>}
            </span>
            {st === "current" && <QPin className="size-5 shrink-0" />}
          </button>
        </div>; })}
    </div>}
  </div>;
}

/* progress ring for subject rows on phones */
function StudyRing({ pct }: { pct: number }) {
  const r = 18, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, Math.round(pct)));
  return <span className="relative grid size-12 shrink-0 place-items-center">
    <svg viewBox="0 0 44 44" className="absolute inset-0 size-12 -rotate-90"><circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="#2f7352" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} /></svg>
    <span className="text-[11px] font-bold tabular-nums text-[#2f7352]">{v}%</span></span>;
}

/* phones: Study cards look like the Today cards */
if (typeof document !== "undefined" && !document.getElementById("study-m-style")) {
  const st = document.createElement("style"); st.id = "study-m-style";
  st.textContent = "@media (max-width:639px){"
    + "[data-study] .shadow-brutal:not([data-plain]):not(.rounded-full),[data-study] .shadow-brutal-sm:not([data-plain]):not(.rounded-full){border-radius:16px!important;border-width:1.5px!important;box-shadow:0 4px 0 var(--foreground)!important}"
    + "[data-study] span.bg-foreground.text-background,[data-study] button.bg-foreground.text-background{border-radius:999px!important;box-shadow:none!important}"
    + "[data-study] .border-dashed{border-radius:16px}"
    + "[data-study] .size-10.border-2,[data-study] .size-12.border-2{border-radius:12px;border-width:1.5px}"
    + "}";
  document.head.appendChild(st);
}
