import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable, type StorageReference } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIES, type Age, type LibraryItem } from "@/components/library-data";
import { Field, inputCls, Page, useAudit, useConfirm } from "./ui";

type Track = { title: string; url: string; mins?: number };
type AudioStatus = "available" | "soon" | "none";
type Form = {
  id: string; isNew: boolean; title: string; author: string; cats: string[]; kind: "book" | "article";
  age: Age; audience: "" | "male" | "female"; tier: "free" | "premium"; cost: number;
  coverUrl: string; pdfUrl: string; audioStatus: AudioStatus; audio: Track[];
  comments: boolean; status: "draft" | "published"; createdAt: number;
};

const AGE_LABEL: Record<Age, string> = { kids: "Kids and up (everyone)", teens: "Teens and up", adults: "Adults only" };
const AUDIO_LABEL: Record<AudioStatus, string> = { available: "Available", soon: "Coming soon", none: "Not available" };
const MAX_MB = 200;

const newForm = (): Form => ({
  id: `bk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, isNew: true,
  title: "", author: "", cats: [], kind: "book", age: "teens", audience: "", tier: "free", cost: 0,
  coverUrl: "", pdfUrl: "", audioStatus: "none", audio: [], comments: true, status: "draft", createdAt: Date.now(),
});
const toForm = (i: LibraryItem): Form => ({
  id: i.id, isNew: false, title: i.title, author: i.author ?? "", cats: i.cats ?? [], kind: i.kind, age: i.age,
  audience: i.audience ?? "", tier: i.tier === "premium" ? "premium" : "free", cost: i.cost ?? 0,
  coverUrl: i.coverUrl ?? "", pdfUrl: i.pdfUrl ?? "", audioStatus: i.audioStatus ?? "none", audio: i.audio ?? [],
  comments: i.comments ?? true, status: i.status ?? "draft", createdAt: i.createdAt ?? Date.now(),
});

const ext = (f: File) => f.name.split(".").pop()?.toLowerCase() ?? "bin";
const safe = (s: string) => s.replace(/[^\w.-]+/g, "_");

function upload(path: string, file: File, onPct: (n: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
    task.on("state_changed", (s) => onPct(Math.round((s.bytesTransferred / s.totalBytes) * 100)), reject,
      () => { getDownloadURL(task.snapshot.ref).then(resolve, reject); });
  });
}
const audioMins = (file: File) => new Promise<number | undefined>((res) => {
  const a = new Audio(); const u = URL.createObjectURL(file); a.preload = "metadata";
  a.onloadedmetadata = () => { URL.revokeObjectURL(u); res(Math.max(1, Math.round(a.duration / 60))); };
  a.onerror = () => { URL.revokeObjectURL(u); res(undefined); };
  a.src = u;
});
async function deleteFolder(r: StorageReference): Promise<void> {
  const l = await listAll(r);
  await Promise.all([...l.items.map((i) => deleteObject(i)), ...l.prefixes.map(deleteFolder)]);
}
const tooBig = (f: File) => { if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name} is over ${MAX_MB} MB`); return true; } return false; };

export function LibrarySection() {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState("");
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  useEffect(() => onSnapshot(collection(db, "library"),
    (snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as Omit<LibraryItem, "id">), id: d.id })).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))),
    () => setItems([])), []);

  const close = () => {
    if (busy) return toast("Wait for the upload to finish.");
    if (form?.isNew) void deleteFolder(ref(storage, `library/${form.id}`)).catch(() => {});
    setForm(null);
  };

  const putFile = async (kind: "cover" | "pdf", f: File) => {
    if (!form || tooBig(f)) return;
    try {
      const url = await upload(`library/${form.id}/${kind}.${ext(f)}`, f, (p) => setBusy(`Uploading ${kind === "pdf" ? "book" : "cover"} ${p}%`));
      setForm((prev) => prev && { ...prev, [kind === "pdf" ? "pdfUrl" : "coverUrl"]: url });
    } catch { toast.error("Upload failed. Check your Storage rules."); } finally { setBusy(""); }
  };

  const addAudio = async (files: File[]) => {
    if (!form) return;
    const id = form.id;
    const sorted = files.filter((f) => !tooBig(f)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const start = form.audio.length;
    try {
      for (let n = 0; n < sorted.length; n++) {
        const f = sorted[n]!;
        const mins = await audioMins(f);
        const url = await upload(`library/${id}/audio/${Date.now()}-${safe(f.name)}`, f, (p) => setBusy(`Uploading audio ${n + 1} of ${sorted.length} · ${p}%`));
        const base = f.name.replace(/\.[^.]+$/, "").replace(/^[\d\s._-]+/, "").trim();
        setForm((prev) => prev && { ...prev, audioStatus: "available", audio: [...prev.audio, { title: base || `Chapter ${start + n + 1}`, url, ...(mins ? { mins } : {}) }] });
      }
      if (sorted.length) toast.success("Audio uploaded");
    } catch { toast.error("Upload failed. Check your Storage rules."); } finally { setBusy(""); }
  };

  const moveTrack = (i: number, d: number) => setForm((f) => {
    if (!f) return f;
    const a = [...f.audio]; const j = i + d;
    if (j < 0 || j >= a.length) return f;
    [a[i], a[j]] = [a[j]!, a[i]!];
    return { ...f, audio: a };
  });
  const removeTrack = (i: number) => setForm((f) => {
    if (!f) return f;
    const t = f.audio[i];
    if (t) void deleteObject(ref(storage, t.url)).catch(() => {});
    return { ...f, audio: f.audio.filter((_, k) => k !== i) };
  });

  const save = async (f: Form) => {
    if (!f.title.trim()) return toast.error("Add a title");
    if (!f.cats.length) return toast.error("Pick at least one category");
    if (f.audioStatus === "available" && !f.audio.length) return toast.error("Upload audio, or set audio to Coming soon / Not available");
    const data: Record<string, unknown> = {
      title: f.title.trim(), cats: f.cats, kind: f.kind, age: f.age, tier: f.tier, cost: f.tier === "premium" ? Number(f.cost) || 0 : 0,
      coverUrl: f.coverUrl, pdfUrl: f.pdfUrl, audioStatus: f.audioStatus, audio: f.audioStatus === "available" ? f.audio : [],
      comments: f.comments, status: f.status, createdAt: f.createdAt,
    };
    if (f.author.trim()) data.author = f.author.trim();
    if (f.audience) data.audience = f.audience;
    try {
      await setDoc(doc(db, "library", f.id), data);
      record(`${f.isNew ? "Added" : "Updated"} library item ${f.title}`);
      toast.success(f.status === "published" ? "Saved and published" : "Saved as draft");
      setForm(null);
    } catch { toast.error("Couldn't save. Check you are an admin."); }
  };

  const remove = (i: LibraryItem) => ask({
    title: `Delete ${i.title}?`, body: "The book, its cover and all its audio will be deleted. This can't be undone.", confirm: "Delete", destructive: true,
    run: () => { void (async () => {
      try {
        await deleteFolder(ref(storage, `library/${i.id}`)).catch(() => {});
        await deleteDoc(doc(db, "library", i.id));
        record(`Deleted library item ${i.title}`); toast.success("Deleted");
      } catch { toast.error("Couldn't delete. Try again."); }
    })(); },
  });

  return <Page eyebrow="App · library" title="Library" actions={<Button onClick={() => setForm(newForm())}><Plus /> Add book</Button>}>
    {!items ? <p className="text-sm text-muted-foreground">Loading…</p> : items.length === 0 ? <p className="text-sm text-muted-foreground">No uploaded books yet. Click “Add book” to upload the first one.</p> :
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((i) => <article key={i.id} className="flex gap-3 border-2 border-foreground bg-card p-4 shadow-brutal-sm">
      {i.coverUrl ? <img src={i.coverUrl} alt="" className="h-32 w-24 shrink-0 border-2 border-foreground object-cover" /> : <div className="grid h-32 w-24 shrink-0 place-items-center border-2 border-dashed border-foreground text-xs text-muted-foreground">No cover</div>}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase text-muted-foreground">{i.status === "published" ? "Published" : "Draft"} · {i.cats?.[0]}</p>
        <h3 className="font-serif text-xl leading-tight">{i.title}</h3>
        {i.author && <p className="text-xs text-muted-foreground">{i.author}</p>}
        <p className="mt-2 text-xs">{i.pdfUrl ? "PDF ✓" : "No PDF"} · Audio: {AUDIO_LABEL[i.audioStatus ?? "none"]}{i.audio?.length ? ` (${i.audio.length})` : ""}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setForm(toForm(i))}><Pencil /> Edit</Button>
          <Button size="sm" variant="outline" aria-label={`Delete ${i.title}`} onClick={() => remove(i)}><Trash2 /></Button>
        </div>
      </div>
    </article>)}</div>}

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{form.isNew ? "Add book" : "Edit book"}</DialogTitle><DialogDescription>Upload the files, choose who can see it, then publish.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Author"><input className={inputCls} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Categories</legend>
              <div className="grid gap-1 sm:grid-cols-2">{CATEGORIES.map((c) => <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.cats.includes(c)} onChange={(e) => setForm({ ...form, cats: e.target.checked ? [...form.cats, c] : form.cats.filter((x) => x !== c) })} /> {c}</label>)}</div>
              <p className="mt-1 text-xs text-muted-foreground">The first one you tick is the main category.</p>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Who can see it"><select className={inputCls} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value as Age })}>{(Object.keys(AGE_LABEL) as Age[]).map((a) => <option key={a} value={a}>{AGE_LABEL[a]}</option>)}</select></Field>
              <Field label="Shelf"><select className={inputCls} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Form["audience"] })}><option value="">Everyone</option><option value="male">Brothers only</option><option value="female">Sisters only</option></select></Field>
              <Field label="Type"><select className={inputCls} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Form["kind"] })}><option value="book">Book</option><option value="article">Article</option></select></Field>
              <Field label="Access"><select className={inputCls} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as Form["tier"] })}><option value="free">Free</option><option value="premium">Premium</option></select></Field>
              {form.tier === "premium" && <Field label="Unlock cost (points)"><input type="number" min={0} className={inputCls} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></Field>}
            </div>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Cover image</legend>
              <div className="flex items-center gap-3">
                {form.coverUrl && <img src={form.coverUrl} alt="" className="h-24 w-16 border-2 border-foreground object-cover" />}
                <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-foreground px-3 py-2 text-sm font-semibold"><Upload className="size-4" /> {form.coverUrl ? "Replace" : "Upload"} cover<input type="file" accept="image/*" className="hidden" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void putFile("cover", f); }} /></label>
              </div>
            </fieldset>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Book file (PDF)</legend>
              <div className="flex flex-wrap items-center gap-3">
                {form.pdfUrl && <a href={form.pdfUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold underline">PDF uploaded ✓</a>}
                <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-foreground px-3 py-2 text-sm font-semibold"><Upload className="size-4" /> {form.pdfUrl ? "Replace" : "Upload"} PDF<input type="file" accept="application/pdf" className="hidden" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void putFile("pdf", f); }} /></label>
                {form.pdfUrl && <Button size="sm" variant="outline" onClick={() => setForm({ ...form, pdfUrl: "" })}>Remove</Button>}
              </div>
            </fieldset>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Audio</legend>
              <div className="flex flex-wrap gap-4">{(Object.keys(AUDIO_LABEL) as AudioStatus[]).map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name="audioStatus" checked={form.audioStatus === k} onChange={() => setForm({ ...form, audioStatus: k })} /> {AUDIO_LABEL[k]}</label>)}</div>
              {form.audioStatus === "available" && <div className="mt-3">
                <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-foreground px-3 py-2 text-sm font-semibold"><Upload className="size-4" /> Add audio files<input type="file" accept="audio/*" multiple className="hidden" disabled={!!busy} onChange={(e) => { const fs = Array.from(e.target.files ?? []); e.target.value = ""; if (fs.length) void addAudio(fs); }} /></label>
                <p className="mt-1 text-xs text-muted-foreground">One file per chapter. Name them 01, 02, 03… and select them all at once.</p>
                {form.audio.length > 0 && <ol className="mt-3 grid gap-2">{form.audio.map((t, i) => <li key={t.url} className="flex items-center gap-2">
                  <span className="w-6 text-right text-xs tabular-nums">{i + 1}.</span>
                  <input className={`${inputCls} min-w-0 flex-1`} value={t.title} aria-label={`Chapter ${i + 1} title`} onChange={(e) => setForm({ ...form, audio: form.audio.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
                  {t.mins && <span className="text-xs tabular-nums text-muted-foreground">{t.mins}m</span>}
                  <Button size="icon" variant="outline" aria-label="Move up" disabled={i === 0} onClick={() => moveTrack(i, -1)}><ArrowUp /></Button>
                  <Button size="icon" variant="outline" aria-label="Move down" disabled={i === form.audio.length - 1} onClick={() => moveTrack(i, 1)}><ArrowDown /></Button>
                  <Button size="icon" variant="outline" aria-label="Remove" onClick={() => removeTrack(i)}><Trash2 /></Button>
                </li>)}</ol>}
              </div>}
            </fieldset>

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.checked })} /> Allow comments and ratings</label>
            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Status</legend>
              <div className="flex gap-4">{(["draft", "published"] as const).map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name="status" checked={form.status === k} onChange={() => setForm({ ...form, status: k })} /> {k === "draft" ? "Draft (only admins see it)" : "Published"}</label>)}</div>
            </fieldset>
            {busy && <p className="border-2 border-foreground bg-muted p-2 text-sm font-semibold">{busy}</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={!!busy} onClick={() => void save(form)}>Save</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </Page>;
}
