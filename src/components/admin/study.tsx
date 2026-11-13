import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable, type StorageReference } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CATEGORIES, DEFAULT_MADRASAH, LEVELS, STAGES, stageName, topics,
  type CategoryId, type StageId, type Subject, type Syllabus,
} from "@/components/study-data";
import { Choice, Field, inputCls, Page, Pill, useAudit, useConfirm } from "./ui";

type Form = Subject & { isNew: boolean };
const MAX_MB = 50;
const newId = () => `sub-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const BEGINNER: StageId[] = ["beginner-1", "beginner-2", "beginner-3"];

async function deleteFolder(r: StorageReference): Promise<void> {
  const l = await listAll(r);
  await Promise.all([...l.items.map((i) => deleteObject(i)), ...l.prefixes.map(deleteFolder)]);
}

export function StudySection() {
  const [items, setItems] = useState<Subject[] | null>(null);
  const [cat, setCat] = useState<CategoryId>("madrasah");
  const [form, setForm] = useState<Form | null>(null);
  const [stage, setStage] = useState<StageId>("beginner-1");
  const [busy, setBusy] = useState("");
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  useEffect(() => onSnapshot(collection(db, "studySubjects"),
    (snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as Omit<Subject, "id">), id: d.id }))),
    () => setItems([])), []);

  const rows = useMemo(() => (items ?? []).filter((s) => s.category === cat).sort((a, b) => a.order - b.order), [items, cat]);

  const open = (s?: Subject) => {
    const f: Form = s ? { ...s, syllabus: s.syllabus ?? {}, isNew: false }
      : { id: newId(), isNew: true, category: cat, name: "", nameAr: "", description: "", stages: [...BEGINNER], syllabus: {}, order: rows.length, status: "draft", createdAt: Date.now() };
    setStage(f.stages[0] ?? "beginner-1");
    setForm(f);
  };

  const addStarters = async () => {
    try {
      const b = writeBatch(db);
      DEFAULT_MADRASAH.forEach((d, i) => b.set(doc(db, "studySubjects", newId() + i), {
        category: "madrasah", name: d.name, nameAr: d.nameAr, stages: BEGINNER, syllabus: {}, order: rows.length + i, status: "draft", createdAt: Date.now(),
      } satisfies Omit<Subject, "id">));
      await b.commit();
      record("Added starter Madrasah subjects");
      toast.success("5 subjects added as drafts. Add their syllabus, then publish.");
    } catch { toast.error("Couldn't save. Check you are an admin."); }
  };

  const move = async (i: number, d: number) => {
    const a = rows[i]; const b = rows[i + d];
    if (!a || !b) return;
    try {
      const w = writeBatch(db);
      w.update(doc(db, "studySubjects", a.id), { order: b.order });
      w.update(doc(db, "studySubjects", b.id), { order: a.order === b.order ? a.order + d : a.order });
      await w.commit();
    } catch { toast.error("Couldn't reorder."); }
  };

  const setSyl = (patch: Partial<Syllabus>) => setForm((f) => f && { ...f, syllabus: { ...f.syllabus, [stage]: { outline: "", ...f.syllabus[stage], ...patch, updatedAt: Date.now() } } });

  const uploadPdf = (file: File) => {
    if (!form) return;
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`File is over ${MAX_MB} MB`); return; }
    const task = uploadBytesResumable(ref(storage, `study/${form.id}/${stage}.pdf`), file, { contentType: file.type });
    task.on("state_changed", (s) => setBusy(`Uploading syllabus ${Math.round((s.bytesTransferred / s.totalBytes) * 100)}%`),
      () => { setBusy(""); toast.error("Upload failed. Check your Storage rules."); },
      () => { void getDownloadURL(task.snapshot.ref).then((url) => { setSyl({ pdfUrl: url }); setBusy(""); toast.success("Syllabus file uploaded"); }); });
  };

  const save = async (f: Form) => {
    if (!f.name.trim()) { toast.error("Add a subject name"); return; }
    if (!f.stages.length) { toast.error("Pick at least one stage"); return; }
    const syllabus: Subject["syllabus"] = {};
    for (const s of f.stages) if (f.syllabus[s]) syllabus[s] = f.syllabus[s];
    const { isNew, id, ...rest } = f;
    try {
      await setDoc(doc(db, "studySubjects", id), { ...rest, name: f.name.trim(), nameAr: f.nameAr?.trim() ?? "", description: f.description?.trim() ?? "", syllabus });
      record(`${isNew ? "Added" : "Updated"} study subject ${f.name}`);
      toast.success(f.status === "published" ? "Saved and published" : "Saved as draft");
      setForm(null);
    } catch { toast.error("Couldn't save. Check you are an admin."); }
  };

  const remove = (s: Subject) => ask({
    title: `Delete ${s.name}?`, body: "The subject and all its syllabus files will be deleted. This can't be undone.", confirm: "Delete", destructive: true,
    run: () => { void (async () => {
      try {
        await deleteFolder(ref(storage, `study/${s.id}`)).catch(() => {});
        await deleteDoc(doc(db, "studySubjects", s.id));
        record(`Deleted study subject ${s.name}`); toast.success("Deleted");
      } catch { toast.error("Couldn't delete. Try again."); }
    })(); },
  });

  const syl = form?.syllabus[stage];

  return <Page eyebrow="App · study" title="Study" actions={<Button onClick={() => open()}><Plus /> Add subject</Button>}>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Choice label="Category" value={cat} onChange={setCat} options={CATEGORIES.map((c) => [c.id, `${c.name}${c.live ? "" : " (coming soon)"}`] as const)} />
      <p className="text-sm text-muted-foreground">Subjects appear in the app only when published.</p>
    </div>

    {items === null ? <p className="text-sm text-muted-foreground">Loading…</p>
      : rows.length === 0 ? <div className="border-2 border-dashed border-foreground p-8 text-center">
        <p className="font-serif text-2xl">No subjects yet</p>
        {cat === "madrasah" && <><p className="mt-1 text-sm text-muted-foreground">Start with Qira'ah, Arabiyyah, Hadith, Fiqh and Seerah for Beginner 1–3.</p>
          <Button className="mt-4" onClick={() => void addStarters()}><Sparkles /> Add starter subjects</Button></>}
      </div>
      : <div className="grid gap-3">{rows.map((s, i) => {
        const filled = s.stages.filter((st) => topics(s.syllabus?.[st]).length || s.syllabus?.[st]?.pdfUrl).length;
        return <article key={s.id} className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-card p-4 shadow-brutal-sm">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-2xl leading-tight">{s.name} {s.nameAr && <span className="text-muted-foreground" dir="rtl">{s.nameAr}</span>}</p>
            <div className="mt-2 flex flex-wrap gap-1">{s.stages.map((st) => <span key={st} className={cn("border-2 border-foreground px-1.5 text-xs font-semibold", (topics(s.syllabus?.[st]).length || s.syllabus?.[st]?.pdfUrl) ? "bg-secondary text-secondary-foreground" : "bg-background")}>{stageName(st)}</span>)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Syllabus ready for {filled} of {s.stages.length} stages</p>
          </div>
          <Pill value={s.status === "published" ? "Published" : "Draft"} />
          <div className="flex gap-1">
            <Button size="icon" variant="outline" aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}><ArrowUp /></Button>
            <Button size="icon" variant="outline" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => void move(i, 1)}><ArrowDown /></Button>
            <Button size="icon" variant="outline" aria-label={`Edit ${s.name}`} onClick={() => open(s)}><Pencil /></Button>
            <Button size="icon" variant="outline" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}><Trash2 /></Button>
          </div>
        </article>;
      })}</div>}

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) { if (busy) { toast("Wait for the upload to finish."); return; } setForm(null); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{form.isNew ? "Add subject" : `Edit ${form.name}`}</DialogTitle><DialogDescription>Choose the stages it is taught in, then add a syllabus for each stage.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Subject name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fiqh" /></Field>
              <Field label="Arabic name"><input dir="rtl" className={inputCls} value={form.nameAr ?? ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="الفقه" /></Field>
            </div>
            <Field label="Short description"><input className={inputCls} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Category"><select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CategoryId })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Stages</legend>
              <div className="grid gap-2 sm:grid-cols-3">{LEVELS.map((l) => <div key={l.id}><p className="text-xs font-bold uppercase text-muted-foreground">{l.name}</p>
                {STAGES.filter((s) => s.level === l.id).map((s) => <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.stages.includes(s.id)}
                  onChange={(e) => { const next = e.target.checked ? STAGES.map((x) => x.id).filter((x) => x === s.id || form.stages.includes(x)) : form.stages.filter((x) => x !== s.id); setForm({ ...form, stages: next }); if (!next.includes(stage) && next[0]) setStage(next[0]); if (e.target.checked && !form.stages.length) setStage(s.id); }} /> {s.name}</label>)}
              </div>)}</div>
            </fieldset>

            {form.stages.length > 0 && <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Syllabus</legend>
              <div className="flex flex-wrap gap-1">{form.stages.map((s) => <button key={s} type="button" onClick={() => setStage(s)} className={cn("border-2 border-foreground px-2 py-1 text-xs font-semibold", s === stage ? "bg-primary shadow-brutal-sm" : "bg-background hover:bg-muted")}>{stageName(s)}{(topics(form.syllabus[s]).length || form.syllabus[s]?.pdfUrl) ? " ✓" : ""}</button>)}</div>
              <Field label={`${stageName(stage)} topics — one per line, in order`} className="mt-3">
                <textarea rows={7} className={inputCls} value={syl?.outline ?? ""} onChange={(e) => setSyl({ outline: e.target.value })} placeholder={"Week 1 · Purification (Taharah)\nWeek 2 · Wudu\nWeek 3 · Salah times"} />
              </Field>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {syl?.pdfUrl && <a href={syl.pdfUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold underline">Syllabus PDF uploaded ✓</a>}
                <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-foreground px-3 py-2 text-sm font-semibold"><Upload className="size-4" /> {syl?.pdfUrl ? "Replace" : "Upload"} PDF (optional)<input type="file" accept="application/pdf" className="hidden" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadPdf(f); }} /></label>
                {syl?.pdfUrl && <Button size="sm" variant="outline" onClick={() => setSyl({ pdfUrl: "" })}>Remove</Button>}
              </div>
            </fieldset>}

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Status</legend>
              <div className="flex gap-4">{(["draft", "published"] as const).map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name="study-status" checked={form.status === k} onChange={() => setForm({ ...form, status: k })} /> {k === "draft" ? "Draft (only admins see it)" : "Published"}</label>)}</div>
            </fieldset>
            {busy && <p className="border-2 border-foreground bg-muted p-2 text-sm font-semibold">{busy}</p>}
          </div>
          <DialogFooter><Button variant="outline" disabled={!!busy} onClick={() => setForm(null)}>Cancel</Button><Button disabled={!!busy} onClick={() => void save(form)}>Save</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </Page>;
}
