import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { collection, doc, getDoc, onSnapshot, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { promoExamId, stageName, stagesOf, subjectExamId, type Category, type Exam, type Key, type Question, type Subject } from "@/components/study-data";
import { Choice, Field, inputCls, Pill, useAudit } from "./ui";

/* Questions are saved to studyExams (readable by learners, no answers) and the answers to
   studyExamKeys (admins only). The server marks every attempt. */

type Q = Question & { answer: number | boolean | string; why?: string };
type Form = Omit<Exam, "questions"> & { questions: Q[]; isNew: boolean };
const newId = () => `q-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function ExamsManager({ cats }: { cats: Category[] }) {
  const [catId, setCatId] = useState(cats[0]?.id ?? "");
  const cat = cats.find((c) => c.id === catId) ?? cats[0];
  const stages = stagesOf(cat);
  const [stage, setStage] = useState(stages[0]?.id ?? "");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Record<string, Exam>>({});
  const [form, setForm] = useState<Form | null>(null);
  const { record } = useAudit();

  useEffect(() => { if (!stages.some((s) => s.id === stage)) setStage(stages[0]?.id ?? ""); }, [catId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cat) return;
    const a = onSnapshot(query(collection(db, "studySubjects"), where("category", "==", cat.id)),
      (s) => setSubjects(s.docs.map((d) => ({ ...(d.data() as Omit<Subject, "id">), id: d.id })).sort((x, y) => x.order - y.order)), () => setSubjects([]));
    const b = onSnapshot(query(collection(db, "studyExams"), where("category", "==", cat.id)),
      (s) => setExams(Object.fromEntries(s.docs.map((d) => [d.id, { ...(d.data() as Omit<Exam, "id">), id: d.id }]))), () => setExams({}));
    return () => { a(); b(); };
  }, [cat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const inStage = useMemo(() => subjects.filter((s) => s.stages.includes(stage)), [subjects, stage]);

  const open = async (id: string, kind: Exam["kind"], subject?: Subject) => {
    const e = exams[id];
    if (e) {
      const keys = new Map((((await getDoc(doc(db, "studyExamKeys", id))).get("keys") as Key[] | undefined) ?? []).map((k) => [k.id, k]));
      setForm({ ...e, isNew: false, questions: e.questions.map((q) => ({ ...q, answer: keys.get(q.id)?.answer ?? (q.type === "tf" ? true : q.type === "mcq" ? 0 : ""), why: keys.get(q.id)?.why ?? "" })) });
      return;
    }
    setForm({
      id, isNew: true, kind, category: cat!.id, stage, ...(subject ? { subjectId: subject.id } : {}),
      title: kind === "promotion" ? `${stageName(cat, stage)} promotion exam` : `${subject?.name} · ${stageName(cat, stage)} exam`,
      passMark: kind === "promotion" ? 70 : 60, minutes: kind === "promotion" ? 30 : 15, perAttempt: kind === "promotion" ? 30 : 10, waitDays: 7,
      status: "draft", questions: [],
    });
  };

  const save = async (f: Form) => {
    if (!f.title.trim()) { toast.error("Add a title"); return; }
    if (!f.questions.length) { toast.error("Add at least one question"); return; }
    if (f.questions.some((q) => !q.q.trim() || (q.type === "mcq" && q.options.some((o) => !o.trim())) || (q.type === "fill" && !String(q.answer).trim()))) { toast.error("Fill in every question, option and answer"); return; }
    const { isNew, questions, ...rest } = f;
    const pub: Question[] = questions.map((q) => (q.type === "mcq" ? { id: q.id, type: q.type, q: q.q, options: q.options } : { id: q.id, type: q.type, q: q.q }));
    const keys: Key[] = questions.map((q) => ({ id: q.id, answer: q.answer, ...(q.why ? { why: q.why } : {}) }));
    try {
      const b = writeBatch(db);
      b.set(doc(db, "studyExams", f.id), JSON.parse(JSON.stringify({ ...rest, title: f.title.trim(), questions: pub })));
      b.set(doc(db, "studyExamKeys", f.id), { keys });
      await b.commit();
      record(`${isNew ? "Added" : "Updated"} exam ${f.title}`);
      toast.success(f.status === "published" ? "Saved and published" : "Saved as draft");
      setForm(null);
    } catch { toast.error("Couldn't save. Check you are an admin."); }
  };

  const setQ = (i: number, q: Q) => setForm((f) => f && { ...f, questions: f.questions.map((x, k) => (k === i ? q : x)) });
  const row = (id: string, label: string, kind: Exam["kind"], subject?: Subject) => { const e = exams[id]; return <article key={id} className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-card p-4 shadow-brutal-sm">
    {kind === "promotion" ? <Trophy className="size-6" /> : <GraduationCap className="size-6" />}
    <div className="min-w-0 flex-1"><p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">{e ? `${e.questions.length} questions · ${e.perAttempt || e.questions.length} per try · pass ${e.passMark}% · ${e.minutes ? `${e.minutes} min` : "no time limit"}` : "Not set up yet"}</p></div>
    {e && <Pill value={e.status === "published" ? "Published" : "Draft"} />}
    <Button size="sm" variant="outline" onClick={() => void open(id, kind, subject)}>{e ? <><Pencil /> Edit</> : <><Plus /> Set up</>}</Button>
  </article>; };

  return <>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Choice label="Category" value={cat?.id ?? ""} onChange={setCatId} options={cats.map((c) => [c.id, c.name] as const)} />
      <Choice label="Stage" value={stage} onChange={setStage} options={stages.map((s) => [s.id, s.name] as const)} />
    </div>
    <p className="mb-4 text-sm text-muted-foreground">Each subject has an exam per stage. The promotion exam covers the whole stage. Passing it opens the next stage, and learners can take it early to skip ahead.</p>
    <div className="grid gap-2">
      {inStage.length === 0 ? <p className="border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">No subjects in this stage yet.</p>
        : inStage.map((s) => row(subjectExamId(s.id, stage), `${s.name} exam`, "subject", s))}
      {cat && stage && row(promoExamId(cat.id, stage), `${stageName(cat, stage)} promotion exam`, "promotion")}
    </div>

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) setForm(null); }}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{form.title || "Exam"}</DialogTitle><DialogDescription>Learners never see the answers; the server marks every attempt.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-5">
              <Field label="Pass mark %"><input type="number" min={1} max={100} className={inputCls} value={form.passMark} onChange={(e) => setForm({ ...form, passMark: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} /></Field>
              <Field label="Minutes (0 = none)"><input type="number" min={0} className={inputCls} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: Math.max(0, Number(e.target.value) || 0) })} /></Field>
              <Field label="Questions per try"><input type="number" min={1} className={inputCls} value={form.perAttempt} onChange={(e) => setForm({ ...form, perAttempt: Math.max(1, Number(e.target.value) || 1) })} /></Field>
              {form.kind === "promotion" && <Field label="Skip-ahead wait (days)"><input type="number" min={0} className={inputCls} value={form.waitDays} onChange={(e) => setForm({ ...form, waitDays: Math.max(0, Number(e.target.value) || 0) })} /></Field>}
              <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Exam["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
            </div>
            <p className="text-xs text-muted-foreground">Each try picks {form.perAttempt} random questions from the {form.questions.length} below, so add more questions than "per try" to keep exams fresh.</p>

            <ol className="grid gap-2">{form.questions.map((q, i) => <li key={q.id} className="grid gap-2 border-2 border-foreground bg-card p-3">
              <div className="flex items-center gap-2"><span className="text-xs font-bold uppercase">Q{i + 1} · {q.type === "mcq" ? "Multiple choice" : q.type === "tf" ? "True / false" : "Fill in the blank"}</span>
                <Button size="icon" variant="outline" className="ml-auto" aria-label="Remove question" onClick={() => setForm({ ...form, questions: form.questions.filter((_, k) => k !== i) })}><Trash2 /></Button></div>
              <input dir="auto" aria-label="Question" className={inputCls} value={q.q} onChange={(e) => setQ(i, { ...q, q: e.target.value })} placeholder="Question" />
              {q.type === "mcq" && q.options.map((o, k) => <label key={k} className="flex items-center gap-2"><input type="radio" checked={q.answer === k} onChange={() => setQ(i, { ...q, answer: k })} aria-label="Right answer" />
                <input dir="auto" className={inputCls} value={o} onChange={(e) => setQ(i, { ...q, options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} placeholder={`Option ${k + 1}`} /></label>)}
              {q.type === "tf" && <div className="flex gap-4 text-sm">{([true, false] as const).map((v) => <label key={String(v)} className="flex items-center gap-2"><input type="radio" checked={q.answer === v} onChange={() => setQ(i, { ...q, answer: v })} /> {v ? "True" : "False"}</label>)}</div>}
              {q.type === "fill" && <input dir="auto" aria-label="Correct answers" className={inputCls} value={String(q.answer)} onChange={(e) => setQ(i, { ...q, answer: e.target.value })} placeholder="Correct answers, separated by |" />}
              <input dir="auto" aria-label="Explanation" className={inputCls} value={q.why ?? ""} onChange={(e) => setQ(i, { ...q, why: e.target.value })} placeholder="Explanation shown after marking (optional)" />
            </li>)}</ol>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" onClick={() => setForm({ ...form, questions: [...form.questions, { id: newId(), type: "mcq", q: "", options: ["", "", "", ""], answer: 0 }] })}><Plus /> Multiple choice</Button>
              <Button size="sm" variant="outline" onClick={() => setForm({ ...form, questions: [...form.questions, { id: newId(), type: "tf", q: "", answer: true }] })}><Plus /> True / false</Button>
              <Button size="sm" variant="outline" onClick={() => setForm({ ...form, questions: [...form.questions, { id: newId(), type: "fill", q: "", answer: "" }] })}><Plus /> Fill in the blank</Button>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => void save(form)}>Save</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}
