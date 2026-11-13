import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, FileText, GraduationCap, Languages, Lock, Palette, Sprout } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES, LEVELS, STAGES, stageName, topics, type CategoryId, type StageId, type Subject } from "@/components/study-data";

const PdfReader = lazy(() => import("@/components/pdf-reader"));
const ICON: Record<CategoryId, typeof BookOpen> = { madrasah: GraduationCap, languages: Languages, development: Sprout, creativity: Palette };

type View = { cat?: CategoryId; stage?: StageId; subject?: string };

export function StudyScreen() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [view, setView] = useState<View>({});

  useEffect(() => onSnapshot(query(collection(db, "studySubjects"), where("status", "==", "published")),
    (snap) => setSubjects(snap.docs.map((d) => ({ ...(d.data() as Omit<Subject, "id">), id: d.id })).sort((a, b) => a.order - b.order)),
    () => setSubjects([])), []);

  const inCat = useMemo(() => (subjects ?? []).filter((s) => s.category === view.cat), [subjects, view.cat]);
  const back = (v: View) => <Button variant="ghost" onClick={() => setView(v)}><ArrowLeft /> Back</Button>;

  /* 1 · The four categories */
  if (!view.cat) return <div className="iq-rise">
    <small className="text-xs font-bold uppercase text-muted-foreground">Study</small>
    <h1 className="font-serif text-4xl leading-none sm:text-5xl">What will you learn today?</h1>
    <div className="mt-6 grid gap-5 sm:grid-cols-2">{CATEGORIES.map((c) => { const Icon = ICON[c.id]; return <button key={c.id} disabled={!c.live} onClick={() => setView({ cat: c.id })}
      className={cn("flex flex-col border-2 border-foreground bg-card p-5 text-left shadow-brutal transition-transform", c.live ? "hover:-translate-y-0.5" : "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-12 place-items-center border-2 border-foreground", c.live ? "bg-primary" : "bg-muted")}><Icon className="size-6" /></span>
        {!c.live && <span className="flex items-center gap-1 border-2 border-foreground px-2 py-0.5 text-xs font-bold"><Lock className="size-3" /> Coming soon</span>}
      </div>
      <h2 className="mt-4 font-serif text-3xl">{c.name} <span dir="rtl" className="text-xl text-muted-foreground">{c.nameAr}</span></h2>
      <p className="text-sm text-muted-foreground">{c.blurb}</p>
    </button>; })}</div>
  </div>;

  const cat = CATEGORIES.find((c) => c.id === view.cat)!;

  /* 2 · Levels and stages */
  if (!view.stage) return <div className="iq-rise">
    {back({})}
    <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{cat.name} <span dir="rtl" className="text-2xl text-muted-foreground">{cat.nameAr}</span></h1>
    <p className="mt-1 text-muted-foreground">Three levels, three stages each. Pick your stage.</p>
    {subjects === null ? <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      : <div className="mt-6 grid gap-6">{LEVELS.map((l) => <section key={l.id}>
        <h2 className="font-serif text-2xl">{l.name} <span dir="rtl" className="text-lg text-muted-foreground">{l.nameAr}</span></h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">{STAGES.filter((s) => s.level === l.id).map((s) => {
          const n = inCat.filter((x) => x.stages.includes(s.id)).length;
          return <button key={s.id} disabled={!n} onClick={() => setView({ cat: cat.id, stage: s.id })}
            className={cn("flex items-center justify-between border-2 border-foreground bg-card p-4 text-left shadow-brutal-sm", n ? "hover:bg-primary" : "opacity-60")}>
            <span><span className="block font-serif text-2xl">{s.name}</span><span className="text-xs text-muted-foreground">{n ? `${n} subject${n > 1 ? "s" : ""}` : "Coming soon"}</span></span>
            {n ? <ChevronRight className="size-5" /> : <Lock className="size-4" />}
          </button>;
        })}</div>
      </section>)}</div>}
  </div>;

  const inStage = inCat.filter((s) => s.stages.includes(view.stage!));
  const subject = inStage.find((s) => s.id === view.subject);

  /* 3 · Subjects in a stage */
  if (!subject) return <div className="iq-rise">
    {back({ cat: cat.id })}
    <small className="mt-2 block text-xs font-bold uppercase text-muted-foreground">{cat.name}</small>
    <h1 className="font-serif text-4xl sm:text-5xl">{stageName(view.stage)}</h1>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{inStage.map((s) => { const t = topics(s.syllabus?.[view.stage!]); return <button key={s.id} onClick={() => setView({ ...view, subject: s.id })}
      className="flex flex-col border-2 border-foreground bg-card p-5 text-left shadow-brutal hover:-translate-y-0.5">
      <span className="grid size-10 place-items-center border-2 border-foreground bg-primary"><BookOpen className="size-5" /></span>
      <h2 className="mt-3 font-serif text-3xl leading-tight">{s.name}</h2>
      {s.nameAr && <p dir="rtl" className="text-lg text-muted-foreground">{s.nameAr}</p>}
      {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
      <p className="mt-3 text-xs font-semibold">{t.length ? `${t.length} topics` : "Syllabus coming soon"}</p>
    </button>; })}</div>
  </div>;

  /* 4 · Syllabus for one subject at one stage */
  return <SyllabusView subject={subject} stage={view.stage} onBack={() => setView({ cat: cat.id, stage: view.stage })} />;
}

function SyllabusView({ subject, stage, onBack }: { subject: Subject; stage: StageId; onBack: () => void }) {
  const syl = subject.syllabus?.[stage];
  const list = topics(syl);
  const [pdf, setPdf] = useState(false);
  const [page, setPage] = useState(1);

  return <div className="iq-rise">
    <Button variant="ghost" onClick={onBack}><ArrowLeft /> {stageName(stage)}</Button>
    <div className="mt-2 border-2 border-foreground bg-card p-6 shadow-brutal">
      <small className="text-xs font-bold uppercase text-muted-foreground">{stageName(stage)} · Syllabus</small>
      <h1 className="font-serif text-4xl leading-tight">{subject.name} {subject.nameAr && <span dir="rtl" className="text-2xl text-muted-foreground">{subject.nameAr}</span>}</h1>
      {subject.description && <p className="mt-1 text-muted-foreground">{subject.description}</p>}
      {list.length ? <ol className="mt-5 grid gap-2">{list.map((t, i) => <li key={`${i}-${t}`} className="flex items-start gap-3 border-2 border-foreground p-3">
        <span className="grid size-7 shrink-0 place-items-center border-2 border-foreground bg-primary text-sm font-bold tabular-nums">{i + 1}</span><span className="pt-0.5">{t}</span>
      </li>)}</ol>
        : <p className="mt-5 border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">The syllabus for this stage is being prepared. Check back soon.</p>}
      {syl?.pdfUrl && <Button className="mt-5" variant="outline" onClick={() => setPdf(!pdf)}><FileText /> {pdf ? "Hide" : "Open"} full syllabus</Button>}
    </div>
    {pdf && syl?.pdfUrl && <div className="mt-5 border-2 border-foreground bg-card p-3 shadow-brutal">
      <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Opening…</p>}><PdfReader url={syl.pdfUrl} startPage={page} onPage={(p) => setPage(p)} /></Suspense>
    </div>}
  </div>;
}
