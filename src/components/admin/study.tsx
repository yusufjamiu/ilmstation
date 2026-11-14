import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, BookOpen, ListOrdered, Pencil, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable, type StorageReference } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { STUDY_ICONS } from "@/components/study";
import {
  DEFAULT_CATEGORIES, DEFAULT_MADRASAH, slug, stageName, stagesOf, topics, useStudyCategories,
  type Category, type IconKey, type Level, type Subject, type Syllabus,
} from "@/components/study-data";
import { Choice, Field, inputCls, Page, Pill, useAudit, useConfirm } from "./ui";
import { LessonsManager } from "./study-lessons";
import { ExamsManager } from "./study-exams";

const MAX_MB = 50;
const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const hasSyl = (s?: Syllabus) => !!(topics(s).length || s?.pdfUrl);
const ICON_LABEL: Record<IconKey, string> = { graduation: "Graduation cap", languages: "Languages", sprout: "Growth", palette: "Palette", book: "Book", calculator: "Calculator", code: "Code", heart: "Heart", flask: "Science", globe: "Globe" };

async function deleteFolder(r: StorageReference): Promise<void> {
  const l = await listAll(r);
  await Promise.all([...l.items.map((i) => deleteObject(i)), ...l.prefixes.map(deleteFolder)]);
}

export function StudySection() {
  const [tab, setTab] = useState<"subjects" | "exams" | "categories">("subjects");
  const { cats, saved } = useStudyCategories();
  return <Page eyebrow="App · study" title="Study">
    <div className="mb-5 flex flex-wrap gap-2">{([["subjects", "Subjects & lessons"], ["exams", "Exams"], ["categories", "Categories & levels"]] as const).map(([id, label]) =>
      <button key={id} onClick={() => setTab(id)} className={cn("border-2 border-foreground px-3 py-2 text-sm font-semibold", tab === id ? "bg-primary shadow-brutal-sm" : "bg-background hover:bg-muted")}>{label}</button>)}</div>
    {!cats ? <p className="text-sm text-muted-foreground">Loading…</p>
      : tab === "subjects" ? <Subjects cats={cats} /> : tab === "exams" ? <ExamsManager cats={cats} /> : <Categories cats={cats} saved={saved} />}
  </Page>;
}

/* ---------------- Categories & levels ---------------- */

type CatForm = Category & { isNew: boolean };

function Categories({ cats, saved }: { cats: Category[]; saved: boolean }) {
  const [form, setForm] = useState<CatForm | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  /* The defaults live only in code until an admin saves; write them once so edits have something to change. */
  const ensureSaved = async () => {
    if (saved) return;
    const b = writeBatch(db);
    DEFAULT_CATEGORIES.forEach(({ id, ...c }) => b.set(doc(db, "studyCategories", id), c));
    await b.commit();
  };

  const save = async (f: CatForm) => {
    if (!f.name.trim()) { toast.error("Add a category name"); return; }
    if (f.levels.some((l) => !l.name.trim())) { toast.error("Every level needs a name"); return; }
    const { isNew, id, ...rest } = f;
    try {
      await ensureSaved();
      await setDoc(doc(db, "studyCategories", id), { ...rest, name: f.name.trim(), levels: f.levels.map((l) => ({ ...l, name: l.name.trim(), stages: Math.min(9, Math.max(1, l.stages)) })) });
      record(`${isNew ? "Added" : "Updated"} study category ${f.name}`);
      toast.success("Saved");
      setForm(null);
    } catch { toast.error("Couldn't save. Check you are an admin."); }
  };

  const move = async (i: number, d: number) => {
    const a = cats[i]; const b = cats[i + d];
    if (!a || !b) return;
    try {
      await ensureSaved();
      const w = writeBatch(db);
      w.update(doc(db, "studyCategories", a.id), { order: i + d });
      w.update(doc(db, "studyCategories", b.id), { order: i });
      await w.commit();
    } catch { toast.error("Couldn't reorder."); }
  };

  const remove = (c: Category) => ask({
    title: `Delete ${c.name}?`, body: "The category disappears from the app. Its subjects stay in the admin, but no one can open them until you move them to another category.", confirm: "Delete", destructive: true,
    run: () => { void (async () => {
      try { await ensureSaved(); await deleteDoc(doc(db, "studyCategories", c.id)); record(`Deleted study category ${c.name}`); toast.success("Deleted"); }
      catch { toast.error("Couldn't delete."); }
    })(); },
  });

  const setLevel = (i: number, patch: Partial<Level>) => setForm((f) => f && { ...f, levels: f.levels.map((l, k) => (k === i ? { ...l, ...patch } : l)) });
  const moveLevel = (i: number, d: number) => setForm((f) => {
    if (!f) return f;
    const a = [...f.levels]; const j = i + d;
    if (j < 0 || j >= a.length) return f;
    [a[i], a[j]] = [a[j]!, a[i]!];
    return { ...f, levels: a };
  });

  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">These are the cards under "What will you learn today?". Only Live ones can be opened.</p>
      <Button onClick={() => setForm({ id: newId("cat"), isNew: true, name: "", nameAr: "", blurb: "", icon: "book", live: false, order: cats.length, levels: [{ id: "beginner", name: "Beginner", stages: 3 }] })}><Plus /> Add category</Button>
    </div>
    <div className="grid gap-3">{cats.map((c, i) => { const Icon = STUDY_ICONS[c.icon] ?? BookOpen; return <article key={c.id} className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-card p-4 shadow-brutal-sm">
      <span className="grid size-10 place-items-center border-2 border-foreground bg-primary"><Icon className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-2xl leading-tight">{c.name} {c.nameAr && <span dir="rtl" className="text-muted-foreground">{c.nameAr}</span>}</p>
        <p className="text-xs text-muted-foreground">{c.levels.length ? c.levels.map((l) => `${l.name} (${l.stages})`).join(" · ") : "No levels yet"}</p>
      </div>
      <Pill value={c.live ? "Live" : "Coming soon"} />
      <div className="flex gap-1">
        <Button size="icon" variant="outline" aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}><ArrowUp /></Button>
        <Button size="icon" variant="outline" aria-label="Move down" disabled={i === cats.length - 1} onClick={() => void move(i, 1)}><ArrowDown /></Button>
        <Button size="icon" variant="outline" aria-label={`Edit ${c.name}`} onClick={() => setForm({ ...c, levels: c.levels.map((l) => ({ ...l })), isNew: false })}><Pencil /></Button>
        <Button size="icon" variant="outline" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}><Trash2 /></Button>
      </div>
    </article>; })}</div>

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) setForm(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{form.isNew ? "Add category" : `Edit ${form.name}`}</DialogTitle><DialogDescription>Name it, pick an icon, then set up its levels and stages.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" /></Field>
              <Field label="Arabic name"><input dir="rtl" className={inputCls} value={form.nameAr ?? ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></Field>
            </div>
            <Field label="Short description"><input className={inputCls} value={form.blurb ?? ""} onChange={(e) => setForm({ ...form, blurb: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Icon"><select className={inputCls} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value as IconKey })}>{(Object.keys(ICON_LABEL) as IconKey[]).map((k) => <option key={k} value={k}>{ICON_LABEL[k]}</option>)}</select></Field>
              <Field label="Status"><select className={inputCls} value={form.live ? "live" : "soon"} onChange={(e) => setForm({ ...form, live: e.target.value === "live" })}><option value="soon">Coming soon</option><option value="live">Live</option></select></Field>
            </div>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Levels</legend>
              <div className="grid gap-2">{form.levels.map((l, i) => <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_auto] items-end gap-2">
                <Field label={i === 0 ? "Level name" : ""}><input className={inputCls} value={l.name} onChange={(e) => setLevel(i, { name: e.target.value })} /></Field>
                <Field label={i === 0 ? "Arabic" : ""}><input dir="rtl" className={inputCls} value={l.nameAr ?? ""} onChange={(e) => setLevel(i, { nameAr: e.target.value })} /></Field>
                <Field label={i === 0 ? "Stages" : ""}><input type="number" min={1} max={9} className={inputCls} value={l.stages} onChange={(e) => setLevel(i, { stages: Math.min(9, Math.max(1, Math.floor(Number(e.target.value) || 1))) })} /></Field>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" aria-label="Move level up" disabled={i === 0} onClick={() => moveLevel(i, -1)}><ArrowUp /></Button>
                  <Button size="icon" variant="outline" aria-label="Move level down" disabled={i === form.levels.length - 1} onClick={() => moveLevel(i, 1)}><ArrowDown /></Button>
                  <Button size="icon" variant="outline" aria-label="Remove level" onClick={() => setForm({ ...form, levels: form.levels.filter((_, k) => k !== i) })}><Trash2 /></Button>
                </div>
              </div>)}</div>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => {
                let id = slug(`level ${form.levels.length + 1}`); while (form.levels.some((l) => l.id === id)) id = `${id}x`;
                setForm({ ...form, levels: [...form.levels, { id, name: `Level ${form.levels.length + 1}`, stages: 3 }] });
              }}><Plus /> Add level</Button>
              <p className="mt-2 text-xs text-muted-foreground">Removing a level or lowering its stages hides those stages. Their syllabus is kept if you add them back.</p>
            </fieldset>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => void save(form)}>Save</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </>;
}

/* ---------------- Subjects & syllabus ---------------- */

type Form = Subject & { isNew: boolean };

function Subjects({ cats }: { cats: Category[] }) {
  const [items, setItems] = useState<Subject[] | null>(null);
  const [catId, setCatId] = useState<string>(cats[0]?.id ?? "madrasah");
  const [form, setForm] = useState<Form | null>(null);
  const [stage, setStage] = useState<string>("");
  const [busy, setBusy] = useState("");
  const [lessonsOf, setLessonsOf] = useState<string | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  useEffect(() => onSnapshot(collection(db, "studySubjects"),
    (snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as Omit<Subject, "id">), id: d.id }))),
    () => setItems([])), []);

  const cat = cats.find((c) => c.id === catId) ?? cats[0];
  const rows = useMemo(() => (items ?? []).filter((s) => s.category === cat?.id).sort((a, b) => a.order - b.order), [items, cat?.id]);
  const formCat = cats.find((c) => c.id === form?.category);
  const formStages = stagesOf(formCat);
  const firstLevel = (c?: Category) => stagesOf(c).filter((s) => s.level.id === c?.levels[0]?.id).map((s) => s.id);

  const open = (s?: Subject) => {
    const f: Form = s ? { ...s, syllabus: s.syllabus ?? {}, isNew: false }
      : { id: newId("sub"), isNew: true, category: cat?.id ?? "", name: "", nameAr: "", description: "", stages: firstLevel(cat), syllabus: {}, order: rows.length, status: "draft", createdAt: Date.now() };
    setStage(f.stages[0] ?? "");
    setForm(f);
  };

  const addStarters = async () => {
    if (!cat) return;
    try {
      const b = writeBatch(db);
      const stages = firstLevel(cat);
      DEFAULT_MADRASAH.forEach((d, i) => b.set(doc(db, "studySubjects", newId("sub") + i), {
        category: cat.id, name: d.name, nameAr: d.nameAr, stages, syllabus: {}, order: rows.length + i, status: "draft", createdAt: Date.now(),
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
      w.update(doc(db, "studySubjects", a.id), { order: i + d });
      w.update(doc(db, "studySubjects", b.id), { order: i });
      await w.commit();
    } catch { toast.error("Couldn't reorder."); }
  };

  const setSyl = (patch: Partial<Syllabus>) => setForm((f) => f && { ...f, syllabus: { ...f.syllabus, [stage]: { ...{ outline: "" }, ...f.syllabus[stage], ...patch, updatedAt: Date.now() } } });

  const uploadPdf = (file: File) => {
    if (!form || !stage) return;
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`File is over ${MAX_MB} MB`); return; }
    const task = uploadBytesResumable(ref(storage, `study/${form.id}/${stage}.pdf`), file, { contentType: file.type });
    task.on("state_changed", (s) => setBusy(`Uploading syllabus ${Math.round((s.bytesTransferred / s.totalBytes) * 100)}%`),
      () => { setBusy(""); toast.error("Upload failed. Check your Storage rules."); },
      () => { void getDownloadURL(task.snapshot.ref).then((url) => { setSyl({ pdfUrl: url }); setBusy(""); toast.success("Syllabus file uploaded"); }); });
  };

  const save = async (f: Form) => {
    if (!f.name.trim()) { toast.error("Add a subject name"); return; }
    if (!f.stages.length) { toast.error("Pick at least one stage"); return; }
    const { isNew, id, ...rest } = f;
    try {
      // syllabus for unticked stages is kept, so ticking them again brings it back
      await setDoc(doc(db, "studySubjects", id), { ...rest, name: f.name.trim(), nameAr: f.nameAr?.trim() ?? "", description: f.description?.trim() ?? "" });
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
  const lessonSubject = (items ?? []).find((s) => s.id === lessonsOf);
  if (lessonSubject) return <LessonsManager cat={cats.find((c) => c.id === lessonSubject.category)} subject={lessonSubject} onBack={() => setLessonsOf(null)} />;

  const valid = (s: Subject) => { const ids = stagesOf(cats.find((c) => c.id === s.category)).map((x) => x.id); return s.stages.filter((x) => ids.includes(x)); };

  return <>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Choice label="Category" value={cat?.id ?? ""} onChange={setCatId} options={cats.map((c) => [c.id, `${c.name}${c.live ? "" : " (coming soon)"}`] as const)} />
      <Button className="ml-auto" disabled={!cat} onClick={() => open()}><Plus /> Add subject</Button>
    </div>
    <p className="mb-4 text-sm text-muted-foreground">Subjects appear in the app only when published, and only in Live categories.</p>

    {items === null ? <p className="text-sm text-muted-foreground">Loading…</p>
      : rows.length === 0 ? <div className="border-2 border-dashed border-foreground p-8 text-center">
        <p className="font-serif text-2xl">No subjects in {cat?.name} yet</p>
        {cat?.id === "madrasah" && <><p className="mt-1 text-sm text-muted-foreground">Start with Qira'ah, Arabiyyah, Hadith, Fiqh and Seerah for the first level.</p>
          <Button className="mt-4" onClick={() => void addStarters()}><Sparkles /> Add starter subjects</Button></>}
      </div>
      : <div className="grid gap-3">{rows.map((s, i) => {
        const st = valid(s);
        return <article key={s.id} className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-card p-4 shadow-brutal-sm">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-2xl leading-tight">{s.name} {s.nameAr && <span className="text-muted-foreground" dir="rtl">{s.nameAr}</span>}</p>
            <div className="mt-2 flex flex-wrap gap-1">{st.map((x) => <span key={x} className={cn("border-2 border-foreground px-1.5 text-xs font-semibold", hasSyl(s.syllabus?.[x]) ? "bg-secondary text-secondary-foreground" : "bg-background")}>{stageName(cat, x)}</span>)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Syllabus ready for {st.filter((x) => hasSyl(s.syllabus?.[x])).length} of {st.length} stages</p>
          </div>
          <Pill value={s.status === "published" ? "Published" : "Draft"} />
          <div className="flex gap-1">
            <Button size="icon" variant="outline" aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}><ArrowUp /></Button>
            <Button size="icon" variant="outline" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => void move(i, 1)}><ArrowDown /></Button>
            <Button size="icon" variant="outline" aria-label={`Edit ${s.name}`} onClick={() => open(s)}><Pencil /></Button>
            <Button size="icon" variant="outline" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}><Trash2 /></Button>
          </div>
          <Button size="sm" onClick={() => setLessonsOf(s.id)}><ListOrdered /> Lessons</Button>
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
            <Field label="Category"><select className={inputCls} value={form.category} onChange={(e) => {
              const c = cats.find((x) => x.id === e.target.value); const ids = stagesOf(c).map((s) => s.id);
              const keep = form.stages.filter((s) => ids.includes(s)); const next = keep.length ? keep : firstLevel(c);
              setForm({ ...form, category: e.target.value, stages: next }); setStage(next[0] ?? "");
            }}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Stages</legend>
              {formCat?.levels.length ? <div className="grid gap-2 sm:grid-cols-3">{formCat.levels.map((l) => <div key={l.id}><p className="text-xs font-bold uppercase text-muted-foreground">{l.name}</p>
                {formStages.filter((s) => s.level.id === l.id).map((s) => <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.stages.includes(s.id)}
                  onChange={(e) => { const next = e.target.checked ? formStages.map((x) => x.id).filter((x) => x === s.id || form.stages.includes(x)) : form.stages.filter((x) => x !== s.id); setForm({ ...form, stages: next }); if (!next.includes(stage)) setStage(next[0] ?? ""); }} /> {s.name}</label>)}
              </div>)}</div> : <p className="text-sm text-muted-foreground">This category has no levels yet. Add them in Categories & levels.</p>}
            </fieldset>

            {form.stages.length > 0 && stage && <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Syllabus</legend>
              <div className="flex flex-wrap gap-1">{form.stages.filter((s) => formStages.some((x) => x.id === s)).map((s) => <button key={s} type="button" onClick={() => setStage(s)} className={cn("border-2 border-foreground px-2 py-1 text-xs font-semibold", s === stage ? "bg-primary shadow-brutal-sm" : "bg-background hover:bg-muted")}>{stageName(formCat, s)}{hasSyl(form.syllabus[s]) ? " ✓" : ""}</button>)}</div>
              <Field label={`${stageName(formCat, stage)} topics — one per line, in order`} className="mt-3">
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
  </>;
}
