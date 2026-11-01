import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuizVisual, type VisualKind } from "@/components/quiz-visual";
import { cn } from "@/lib/utils";
import { seedQuestions, topics, visualKinds, type AdminQuestion, type Audience, type Difficulty } from "./data";
import { uid, useAdminStore } from "./store";
import { Choice, DataTable, Field, inputCls, Page, Pill, SearchBox, useAudit, useConfirm, type Column } from "./ui";

const difficulties = [["Beginner", "Beginner"], ["Intermediate", "Intermediate"], ["Advanced", "Advanced"]] as const;
const audiences = [["both", "Adults + kids"], ["adults", "Adults only"], ["kids", "Kids only"]] as const;

const blank = (): AdminQuestion => ({ id: uid(), topic: topics[0] ?? "Aqeedah", q: "", options: ["", "", "", ""], answer: 0, why: "", visual: "aqeedah", difficulty: "Beginner", audience: "adults", status: "draft" });

export function ContentSection() {
  const [questions, setQuestions] = useAdminStore<AdminQuestion[]>("questions", seedQuestions);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  const rows = useMemo(() => questions.filter((x) => (topic === "all" || x.topic === topic) && (status === "all" || x.status === status) && `${x.q} ${x.why}`.toLowerCase().includes(q.toLowerCase())), [questions, q, topic, status]);
  const counts = topics.map((t) => [t, questions.filter((x) => x.topic === t).length] as const);

  const save = (item: AdminQuestion) => {
    const exists = questions.some((x) => x.id === item.id);
    setQuestions((l) => (exists ? l.map((x) => (x.id === item.id ? item : x)) : [item, ...l]));
    record(`${exists ? "Updated" : "Added"} ${item.topic} question “${item.q.slice(0, 40)}”`);
    toast.success(exists ? "Question updated" : "Question added");
    setEditing(null);
  };
  const toggle = (x: AdminQuestion) => {
    const next = x.status === "published" ? "draft" : "published";
    setQuestions((l) => l.map((y) => (y.id === x.id ? { ...y, status: next } : y)));
    record(`${next === "published" ? "Published" : "Unpublished"} “${x.q.slice(0, 40)}”`);
  };

  const columns: Column<AdminQuestion>[] = [
    { key: "q", label: "Question", render: (x) => <p className="max-w-md font-semibold">{x.q}</p> },
    { key: "topic", label: "Topic", render: (x) => x.topic },
    { key: "level", label: "Level", render: (x) => x.difficulty, mobile: false },
    { key: "aud", label: "Audience", render: (x) => audiences.find(([v]) => v === x.audience)?.[1] },
    { key: "visual", label: "Visual", render: (x) => <span className="capitalize">{x.visual}</span>, mobile: false },
    { key: "status", label: "Status", render: (x) => <button onClick={() => toggle(x)} aria-label={`Toggle ${x.status}`}><Pill value={x.status} /></button> },
  ];

  return <Page eyebrow="Quiz catalog · solo, duel, class & kids" title="Quiz content" actions={<Button onClick={() => setEditing(blank())}><Plus /> New question</Button>}>
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      <button onClick={() => setTopic("all")} className={cn("shrink-0 border-2 border-foreground px-3 py-1.5 text-sm font-semibold", topic === "all" ? "bg-primary shadow-brutal-sm" : "bg-background")}>All · {questions.length}</button>
      {counts.map(([t, n]) => <button key={t} onClick={() => setTopic(t)} className={cn("shrink-0 border-2 border-foreground px-3 py-1.5 text-sm font-semibold", topic === t ? "bg-primary shadow-brutal-sm" : "bg-background")}>{t} · {n}</button>)}
    </div>
    <div className="mb-4 flex flex-wrap gap-2">
      <SearchBox value={q} onChange={setQ} placeholder="Search questions" />
      <Choice label="Filter by status" value={status} onChange={setStatus} options={[["all", "Any status"], ["published", "Published"], ["draft", "Draft"]]} />
    </div>
    <DataTable rows={rows} columns={columns} empty="No questions match." actions={(x) => <>
      <Button size="sm" variant="outline" onClick={() => setEditing({ ...x, options: [...x.options] })}><Pencil /> Edit</Button>
      <Button size="sm" variant="outline" aria-label="Duplicate" onClick={() => setEditing({ ...x, id: uid(), options: [...x.options], status: "draft" })}><Copy /></Button>
      <Button size="sm" variant="outline" aria-label="Delete" onClick={() => ask({ title: "Delete this question?", body: x.q, confirm: "Delete", destructive: true, run: () => { setQuestions((l) => l.filter((y) => y.id !== x.id)); record(`Deleted “${x.q.slice(0, 40)}”`); toast.success("Question deleted"); } })}><Trash2 /></Button>
    </>} />
    <QuestionEditor item={editing} onClose={() => setEditing(null)} onSave={save} />
    {dialog}
  </Page>;
}

function QuestionEditor({ item, onClose, onSave }: { item: AdminQuestion | null; onClose: () => void; onSave: (q: AdminQuestion) => void }) {
  const [draft, setDraft] = useState<AdminQuestion | null>(item);
  const [last, setLast] = useState(item);
  if (item !== last) { setLast(item); setDraft(item); }
  if (!draft) return null;
  const set = (patch: Partial<AdminQuestion>) => setDraft({ ...draft, ...patch });
  const submit = () => {
    if (!draft.q.trim()) { toast.error("Write the question"); return; }
    if (draft.options.some((o) => !o.trim())) { toast.error("Fill in every option"); return; }
    if (!draft.why.trim()) { toast.error("Add an explanation — learners see it after answering"); return; }
    onSave(draft);
  };
  return <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
      <DialogHeader><DialogTitle>{draft.q ? "Edit question" : "New question"}</DialogTitle><DialogDescription>Shared across solo play, duels, Study Mode and Kids Mode.</DialogDescription></DialogHeader>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid content-start gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Topic"><Choice label="Topic" className="w-full" value={draft.topic} onChange={(topic) => set({ topic })} options={topics.map((t) => [t, t] as const)} /></Field>
            <Field label="Illustration"><Choice label="Illustration" className="w-full capitalize" value={draft.visual} onChange={(visual: VisualKind) => set({ visual })} options={visualKinds.map((k) => [k, k] as const)} /></Field>
            <Field label="Difficulty"><Choice label="Difficulty" className="w-full" value={draft.difficulty} onChange={(difficulty: Difficulty) => set({ difficulty })} options={difficulties} /></Field>
            <Field label="Audience"><Choice label="Audience" className="w-full" value={draft.audience} onChange={(audience: Audience) => set({ audience })} options={audiences} /></Field>
          </div>
          <Field label="Question"><textarea rows={2} className={inputCls} value={draft.q} onChange={(e) => set({ q: e.target.value })} /></Field>
          <fieldset className="grid gap-2"><legend className="mb-1 text-xs font-bold uppercase text-muted-foreground">Options · select the correct one</legend>
            {draft.options.map((o, i) => <div key={i} className="flex items-center gap-2">
              <input type="radio" name="answer" aria-label={`Option ${i + 1} is correct`} checked={draft.answer === i} onChange={() => set({ answer: i })} className="size-5 accent-[var(--secondary)]" />
              <input className={inputCls} value={o} placeholder={`Option ${i + 1}`} onChange={(e) => set({ options: draft.options.map((x, j) => (j === i ? e.target.value : x)) })} />
            </div>)}
          </fieldset>
          <Field label="Explanation (shown after answering)"><textarea rows={3} className={inputCls} value={draft.why} onChange={(e) => set({ why: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.status === "published"} onChange={(e) => set({ status: e.target.checked ? "published" : "draft" })} className="size-4" /> Publish now</label>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-muted-foreground">Learner preview</p>
          <div className="mt-2 border-2 border-foreground bg-background p-4 shadow-brutal-sm">
            <p className="text-xs font-bold uppercase text-muted-foreground">{draft.topic} · {draft.difficulty}</p>
            <h3 className="mt-2 font-serif text-2xl">{draft.q || "Your question appears here"}</h3>
            <QuizVisual kind={draft.visual} compact />
            <div className="mt-4 grid gap-2">{draft.options.map((o, i) => <div key={i} className={cn("border-2 border-foreground px-3 py-2 text-sm", i === draft.answer ? "bg-secondary" : "bg-card")}>{o || `Option ${i + 1}`}</div>)}</div>
            {draft.why && <p className="mt-3 border-t-2 border-foreground pt-3 text-sm text-muted-foreground">{draft.why}</p>}
          </div>
        </div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save question</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
