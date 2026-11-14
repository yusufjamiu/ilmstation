import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Mic, Pencil, Plus, Trash2, Upload, Volume2 } from "lucide-react";
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where, writeBatch } from "firebase/firestore";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable, type StorageReference } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  SCREEN_LABEL, stageName, VOICE_LANGS, voiceName,
  type Category, type Choice, type Lesson, type Screen, type ScreenType, type Subject, type VoiceLang, type Voices,
} from "@/components/study-data";
import { Field, inputCls, Pill, useAudit, useConfirm } from "./ui";

const MAX_MB = 50;
const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const ext = (f: File) => f.name.split(".").pop()?.toLowerCase() ?? "bin";

function upload(path: string, file: File, onPct: (n: number) => void, type?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_MB * 1024 * 1024) { reject(new Error(`${file.name} is over ${MAX_MB} MB`)); return; }
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: type ?? file.type });
    task.on("state_changed", (s) => onPct(Math.round((s.bytesTransferred / s.totalBytes) * 100)), reject,
      () => { getDownloadURL(task.snapshot.ref).then(resolve, reject); });
  });
}
async function deleteFolder(r: StorageReference): Promise<void> {
  const l = await listAll(r);
  await Promise.all([...l.items.map((i) => deleteObject(i)), ...l.prefixes.map(deleteFolder)]);
}

const blank = (type: ScreenType): Screen => {
  const id = newId("s");
  switch (type) {
    case "explain": return { id, type, text: "", big: "" };
    case "choose": return { id, type, prompt: "", options: [{ label: "" }, { label: "" }, { label: "" }], answer: 0 };
    case "match": return { id, type, prompt: "Match the pairs", pairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }] };
    case "tf": return { id, type, prompt: "", answer: true };
    case "fill": return { id, type, prompt: "", answer: "" };
    case "video": return { id, type, videos: {} };
    case "game": return { id, type, url: "" };
  }
};

type Form = Lesson & { isNew: boolean };

export function LessonsManager({ cat, subject, onBack }: { cat: Category | undefined; subject: Subject; onBack: () => void }) {
  const [stage, setStage] = useState(subject.stages[0] ?? "");
  const [items, setItems] = useState<Lesson[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [lang, setLang] = useState<VoiceLang>("en");
  const [busy, setBusy] = useState("");
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  useEffect(() => onSnapshot(query(collection(db, "studyLessons"), where("subjectId", "==", subject.id)),
    (snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as Omit<Lesson, "id">), id: d.id }))), () => setItems([])), [subject.id]);
  const rows = useMemo(() => (items ?? []).filter((l) => l.stage === stage).sort((a, b) => a.order - b.order), [items, stage]);

  const open = (l?: Lesson) => setForm(l ? { ...l, screens: l.screens ?? [], isNew: false }
    : { id: newId("les"), isNew: true, subjectId: subject.id, stage, order: rows.length, title: "", mins: 5, tier: "free", status: "draft", screens: [blank("explain")], createdAt: Date.now() });

  /** A ready-made lesson (the letter ب) to try the player without making content first. */
  const addSample = async () => {
    const S = (x: Record<string, unknown>) => ({ id: newId("s"), ...x }) as Screen;
    const sample: Omit<Lesson, "id"> = {
      subjectId: subject.id, stage, order: rows.length, title: "Sample · The letter Ba (ب)", mins: 5, tier: "free", status: "draft", createdAt: Date.now(),
      screens: [
        S({ type: "explain", title: "Meet Ba", big: "ب", text: "This is Ba. It has one dot below. Its sound is بَ (ba)." }),
        S({ type: "choose", prompt: "أين حرف الباء؟", options: [{ label: "ت" }, { label: "ب" }, { label: "ث" }], answer: 1, hint: "Look for one dot below." }),
        S({ type: "choose", prompt: "Which one starts with ب?", options: [{ label: "بطّة", emoji: "🦆" }, { label: "تفاحة", emoji: "🍎" }, { label: "شمس", emoji: "☀️" }], answer: 0 }),
        S({ type: "match", prompt: "Match the picture to the word", pairs: [{ left: "🦆", right: "بطّة" }, { left: "🚪", right: "باب" }, { left: "🏠", right: "بيت" }] }),
        S({ type: "tf", prompt: "Ba has two dots below.", answer: false, why: "Ba has one dot below. Ta (ت) has two dots above." }),
        S({ type: "fill", prompt: "Write the letter with one dot below:", answer: "ب|ba|baa", why: "ب is Ba." }),
      ],
    };
    await setDoc(doc(db, "studyLessons", newId("les")), JSON.parse(JSON.stringify(sample)) as Record<string, unknown>)
      .then(() => toast.success("Sample lesson added as a draft. Publish it to see it in the app."), () => toast.error("Couldn't save. Check you are an admin."));
  };

  const move = async (i: number, d: number) => {
    const a = rows[i]; const b = rows[i + d];
    if (!a || !b) return;
    const w = writeBatch(db);
    w.update(doc(db, "studyLessons", a.id), { order: i + d });
    w.update(doc(db, "studyLessons", b.id), { order: i });
    await w.commit().catch(() => toast.error("Couldn't reorder."));
  };
  const duplicate = async (l: Lesson) => {
    const id = newId("les");
    const { id: _old, ...rest } = l;
    await setDoc(doc(db, "studyLessons", id), JSON.parse(JSON.stringify({ ...rest, title: `${l.title} (copy)`, order: rows.length, status: "draft", createdAt: Date.now() })) as Record<string, unknown>)
      .then(() => toast.success("Copied as a draft"), () => toast.error("Couldn't copy."));
  };
  const remove = (l: Lesson) => ask({
    title: `Delete ${l.title}?`, body: "The lesson and its uploaded files will be deleted.", confirm: "Delete", destructive: true,
    run: () => { void (async () => {
      await deleteFolder(ref(storage, `study/lessons/${l.id}`)).catch(() => {});
      await deleteDoc(doc(db, "studyLessons", l.id)).then(() => { record(`Deleted lesson ${l.title}`); toast.success("Deleted"); }, () => toast.error("Couldn't delete."));
    })(); },
  });

  const save = async (f: Form) => {
    if (!f.title.trim()) { toast.error("Add a lesson title"); return; }
    const { isNew, id, ...rest } = f;
    const clean = JSON.parse(JSON.stringify({ ...rest, title: f.title.trim() })) as Record<string, unknown>; // drops undefined
    try {
      await setDoc(doc(db, "studyLessons", id), clean);
      record(`${isNew ? "Added" : "Updated"} lesson ${f.title}`);
      toast.success(f.status === "published" ? "Saved and published" : "Saved as draft");
      setForm(null);
    } catch { toast.error("Couldn't save. Check you are an admin."); }
  };

  const put = (i: number, s: Screen) => setForm((f) => f && { ...f, screens: f.screens.map((x, k) => (k === i ? s : x)) });
  const moveScreen = (i: number, d: number) => setForm((f) => {
    if (!f) return f;
    const a = [...f.screens]; const j = i + d;
    if (j < 0 || j >= a.length) return f;
    [a[i], a[j]] = [a[j]!, a[i]!];
    return { ...f, screens: a };
  });
  const up = async (file: File, kind: string, type?: string) => {
    if (!form) return "";
    try { return await upload(`study/lessons/${form.id}/${kind}-${Date.now()}.${ext(file)}`, file, (p) => setBusy(`Uploading ${p}%`), type); }
    catch (e) { toast.error((e as Error).message || "Upload failed. Check your Storage rules."); return ""; }
    finally { setBusy(""); }
  };

  return <div>
    <Button variant="ghost" onClick={onBack}><ArrowLeft /> All subjects</Button>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <h2 className="mr-auto font-serif text-3xl">{subject.name} · lessons</h2>
      <Button onClick={() => open()} disabled={!stage}><Plus /> Add lesson</Button>
    </div>
    <div className="mt-3 flex flex-wrap gap-1">{subject.stages.map((s) => <button key={s} onClick={() => setStage(s)} className={cn("border-2 border-foreground px-2 py-1 text-xs font-semibold", s === stage ? "bg-primary shadow-brutal-sm" : "bg-background hover:bg-muted")}>{stageName(cat, s)}</button>)}</div>

    {items === null ? <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      : rows.length === 0 ? <div className="mt-4 border-2 border-dashed border-foreground p-6 text-center"><p className="text-sm text-muted-foreground">No lessons in {stageName(cat, stage)} yet.</p>
        <Button className="mt-3" variant="outline" onClick={() => void addSample()}>Add a sample lesson (letter ب)</Button></div>
        : <div className="mt-4 grid gap-2">{rows.map((l, i) => <article key={l.id} className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-card p-3 shadow-brutal-sm">
          <span className="w-6 text-right font-bold tabular-nums">{i + 1}.</span>
          <div className="min-w-0 flex-1"><p className="font-semibold">{l.title}</p><p className="text-xs text-muted-foreground">{l.screens?.length ?? 0} screens · {l.mins} min · {l.tier === "premium" ? "Premium" : "Free"}</p></div>
          <Pill value={l.status === "published" ? "Published" : "Draft"} />
          <div className="flex gap-1">
            <Button size="icon" variant="outline" aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}><ArrowUp /></Button>
            <Button size="icon" variant="outline" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => void move(i, 1)}><ArrowDown /></Button>
            <Button size="icon" variant="outline" aria-label={`Copy ${l.title}`} onClick={() => void duplicate(l)}><Copy /></Button>
            <Button size="icon" variant="outline" aria-label={`Edit ${l.title}`} onClick={() => open(l)}><Pencil /></Button>
            <Button size="icon" variant="outline" aria-label={`Delete ${l.title}`} onClick={() => remove(l)}><Trash2 /></Button>
          </div>
        </article>)}</div>}

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) { if (busy) { toast("Wait for the upload to finish."); return; } setForm(null); } }}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{form.isNew ? "Add lesson" : `Edit ${form.title}`}</DialogTitle><DialogDescription>Build the lesson screen by screen. Text is shared by everyone; voice clips and videos are per language.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_9rem]">
              <Field label="Lesson title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The letter Ba (ب)" /></Field>
              <Field label="Minutes"><input type="number" min={1} className={inputCls} value={form.mins} onChange={(e) => setForm({ ...form, mins: Math.max(1, Number(e.target.value) || 1) })} /></Field>
              <Field label="Access"><select className={inputCls} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as Lesson["tier"] })}><option value="free">Free</option><option value="premium">Premium</option></select></Field>
              <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Lesson["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-2 border-foreground bg-muted p-2 text-sm">
              <Mic className="size-4" /><b>Voice language for uploads:</b>
              <select value={lang} onChange={(e) => setLang(e.target.value as VoiceLang)} className="border-2 border-foreground bg-background px-2 py-1">{VOICE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
              <span className="text-xs text-muted-foreground">Missing clips fall back to English, then the phone reads the text aloud.</span>
            </div>

            <ol className="grid gap-3">{form.screens.map((s, i) => <li key={s.id} className="border-2 border-foreground bg-card p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold uppercase">Screen {i + 1} · {SCREEN_LABEL[s.type]}</span>
                <div className="ml-auto flex gap-1">
                  <Button size="icon" variant="outline" aria-label="Move screen up" disabled={i === 0} onClick={() => moveScreen(i, -1)}><ArrowUp /></Button>
                  <Button size="icon" variant="outline" aria-label="Move screen down" disabled={i === form.screens.length - 1} onClick={() => moveScreen(i, 1)}><ArrowDown /></Button>
                  <Button size="icon" variant="outline" aria-label="Remove screen" onClick={() => setForm({ ...form, screens: form.screens.filter((_, k) => k !== i) })}><Trash2 /></Button>
                </div>
              </div>
              <ScreenEditor s={s} lang={lang} busy={!!busy} up={up} onChange={(n) => put(i, n)} />
            </li>)}</ol>

            <div className="flex flex-wrap gap-1"><span className="mr-1 self-center text-xs font-bold uppercase">Add screen:</span>{(Object.keys(SCREEN_LABEL) as ScreenType[]).map((t) =>
              <Button key={t} size="sm" variant="outline" onClick={() => setForm({ ...form, screens: [...form.screens, blank(t)] })}><Plus /> {SCREEN_LABEL[t].split(" (")[0]}</Button>)}</div>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Worksheet (optional PDF)</legend>
              <div className="flex flex-wrap items-center gap-3">
                {form.pdfUrl && <a href={form.pdfUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold underline">Worksheet uploaded ✓</a>}
                <FileBtn label={form.pdfUrl ? "Replace PDF" : "Upload PDF"} accept="application/pdf" disabled={!!busy} onFile={async (f) => { const u = await up(f, "worksheet"); if (u) setForm((x) => x && { ...x, pdfUrl: u }); }} />
                {form.pdfUrl && <Button size="sm" variant="outline" onClick={() => setForm({ ...form, pdfUrl: "" })}>Remove</Button>}
              </div>
            </fieldset>
            {busy && <p className="border-2 border-foreground bg-muted p-2 text-sm font-semibold">{busy}</p>}
          </div>
          <DialogFooter><Button variant="outline" disabled={!!busy} onClick={() => setForm(null)}>Cancel</Button><Button disabled={!!busy} onClick={() => void save(form)}>Save</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </div>;
}

/* ---------------- pieces ---------------- */

function FileBtn({ label, accept, disabled, onFile }: { label: string; accept: string; disabled?: boolean; onFile: (f: File) => void }) {
  return <label className={cn("inline-flex cursor-pointer items-center gap-2 border-2 border-foreground bg-background px-3 py-1.5 text-sm font-semibold", disabled && "opacity-50")}>
    <Upload className="size-4" /> {label}
    <input type="file" accept={accept} className="hidden" disabled={disabled} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} />
  </label>;
}

/** Voice clip for the chosen language, with a list of which languages already have one. */
function VoiceField({ voices, lang, busy, up, onChange, label = "Voice" }: { voices?: Voices; lang: VoiceLang; busy: boolean; up: (f: File, k: string) => Promise<string>; onChange: (v: Voices) => void; label?: string }) {
  const have = Object.entries(voices ?? {}).filter(([, u]) => u).map(([k]) => k);
  const url = voices?.[lang];
  return <div className="flex flex-wrap items-center gap-2 text-sm">
    <span className="font-semibold">{label} ({voiceName(lang)}):</span>
    {url && <button type="button" aria-label="Play" className="grid size-8 place-items-center border-2 border-foreground" onClick={() => void new Audio(url).play()}><Volume2 className="size-4" /></button>}
    <FileBtn label={url ? "Replace" : "Upload audio"} accept="audio/*" disabled={busy} onFile={async (f) => { const u = await up(f, `voice-${lang}`); if (u) onChange({ ...voices, [lang]: u }); }} />
    {url && <Button size="sm" variant="outline" onClick={() => { const v = { ...voices }; delete v[lang]; onChange(v); }}>Remove</Button>}
    {have.length > 0 && <span className="text-xs text-muted-foreground">Recorded: {have.map(voiceName).join(", ")}</span>}
  </div>;
}

function ScreenEditor({ s, lang, busy, up, onChange }: { s: Screen; lang: VoiceLang; busy: boolean; up: (f: File, k: string, type?: string) => Promise<string>; onChange: (s: Screen) => void }) {
  const voice = "voice" in s || ["explain", "choose", "match", "tf", "fill"].includes(s.type)
    ? <VoiceField voices={(s as { voice?: Voices }).voice} lang={lang} busy={busy} up={up} onChange={(v) => onChange({ ...s, voice: v } as Screen)} /> : null;

  switch (s.type) {
    case "explain": return <div className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_6rem]">
        <Field label="Heading (optional)"><input className={inputCls} value={s.title ?? ""} onChange={(e) => onChange({ ...s, title: e.target.value })} /></Field>
        <Field label="Big letter/word"><input dir="auto" className={inputCls} value={s.big ?? ""} onChange={(e) => onChange({ ...s, big: e.target.value })} placeholder="ب" /></Field>
        <Field label="Emoji"><input className={inputCls} value={s.emoji ?? ""} onChange={(e) => onChange({ ...s, emoji: e.target.value })} placeholder="🦆" /></Field>
      </div>
      <Field label="Text"><textarea dir="auto" rows={3} className={inputCls} value={s.text} onChange={(e) => onChange({ ...s, text: e.target.value })} placeholder="This is Ba. It has one dot below." /></Field>
      <div className="flex flex-wrap items-center gap-2">{s.imageUrl && <img src={s.imageUrl} alt="" className="h-16 border-2 border-foreground" />}
        <FileBtn label={s.imageUrl ? "Replace picture" : "Picture (optional)"} accept="image/*" disabled={busy} onFile={async (f) => { const u = await up(f, "img"); if (u) onChange({ ...s, imageUrl: u }); }} />
        {s.imageUrl && <Button size="sm" variant="outline" onClick={() => onChange({ ...s, imageUrl: "" })}>Remove</Button>}</div>
      {voice}
    </div>;

    case "choose": return <div className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <Field label="Question"><input dir="auto" className={inputCls} value={s.prompt} onChange={(e) => onChange({ ...s, prompt: e.target.value })} placeholder="أين حرف الباء؟" /></Field>
        <Field label="Big letter (optional)"><input dir="auto" className={inputCls} value={s.big ?? ""} onChange={(e) => onChange({ ...s, big: e.target.value })} /></Field>
      </div>
      <p className="text-xs font-bold uppercase">Options — tick the right one</p>
      {s.options.map((o, k) => <OptionRow key={k} o={o} right={s.answer === k} lang={lang} busy={busy} up={up}
        onRight={() => onChange({ ...s, answer: k })} onChange={(n) => onChange({ ...s, options: s.options.map((x, j) => (j === k ? n : x)) })}
        onRemove={s.options.length > 2 ? () => onChange({ ...s, options: s.options.filter((_, j) => j !== k), answer: s.answer === k ? 0 : s.answer > k ? s.answer - 1 : s.answer }) : undefined} />)}
      {s.options.length < 6 && <Button size="sm" variant="outline" className="w-fit" onClick={() => onChange({ ...s, options: [...s.options, { label: "" }] })}><Plus /> Option</Button>}
      <Field label="Hint after a wrong answer (optional)"><input dir="auto" className={inputCls} value={s.hint ?? ""} onChange={(e) => onChange({ ...s, hint: e.target.value })} placeholder="Look for one dot below" /></Field>
      {voice}
    </div>;

    case "match": return <div className="grid gap-2">
      <Field label="Instruction"><input dir="auto" className={inputCls} value={s.prompt} onChange={(e) => onChange({ ...s, prompt: e.target.value })} /></Field>
      {s.pairs.map((p, k) => <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
        <input dir="auto" aria-label={`Left ${k + 1}`} className={inputCls} value={p.left} onChange={(e) => onChange({ ...s, pairs: s.pairs.map((x, j) => (j === k ? { ...x, left: e.target.value } : x)) })} placeholder="🦆" />
        <input dir="auto" aria-label={`Right ${k + 1}`} className={inputCls} value={p.right} onChange={(e) => onChange({ ...s, pairs: s.pairs.map((x, j) => (j === k ? { ...x, right: e.target.value } : x)) })} placeholder="بطّة" />
        <Button size="icon" variant="outline" aria-label="Remove pair" disabled={s.pairs.length <= 2} onClick={() => onChange({ ...s, pairs: s.pairs.filter((_, j) => j !== k) })}><Trash2 /></Button>
      </div>)}
      {s.pairs.length < 6 && <Button size="sm" variant="outline" className="w-fit" onClick={() => onChange({ ...s, pairs: [...s.pairs, { left: "", right: "" }] })}><Plus /> Pair</Button>}
      {voice}
    </div>;

    case "tf": return <div className="grid gap-2">
      <Field label="Statement"><input dir="auto" className={inputCls} value={s.prompt} onChange={(e) => onChange({ ...s, prompt: e.target.value })} placeholder="Ba has two dots below." /></Field>
      <div className="flex gap-4 text-sm">{([true, false] as const).map((v) => <label key={String(v)} className="flex items-center gap-2"><input type="radio" checked={s.answer === v} onChange={() => onChange({ ...s, answer: v })} /> {v ? "True" : "False"}</label>)}</div>
      <Field label="Explanation (optional)"><input dir="auto" className={inputCls} value={s.why ?? ""} onChange={(e) => onChange({ ...s, why: e.target.value })} /></Field>
      {voice}
    </div>;

    case "fill": return <div className="grid gap-2">
      <Field label="Question"><input dir="auto" className={inputCls} value={s.prompt} onChange={(e) => onChange({ ...s, prompt: e.target.value })} placeholder="The letter with one dot below is ___" /></Field>
      <Field label="Correct answers (separate with |)"><input dir="auto" className={inputCls} value={s.answer} onChange={(e) => onChange({ ...s, answer: e.target.value })} placeholder="ب|ba|baa" /></Field>
      <Field label="Explanation (optional)"><input dir="auto" className={inputCls} value={s.why ?? ""} onChange={(e) => onChange({ ...s, why: e.target.value })} /></Field>
      {voice}
    </div>;

    case "video": { const v = s.videos[lang] ?? {}; const have = Object.entries(s.videos).filter(([, x]) => x?.youtube || x?.url).map(([k]) => voiceName(k));
      return <div className="grid gap-2">
        <Field label="Title (optional)"><input className={inputCls} value={s.title ?? ""} onChange={(e) => onChange({ ...s, title: e.target.value })} /></Field>
        <Field label={`YouTube link (${voiceName(lang)})`}><input className={inputCls} value={v.youtube ?? ""} onChange={(e) => onChange({ ...s, videos: { ...s.videos, [lang]: { ...v, youtube: e.target.value } } })} placeholder="https://youtu.be/…" /></Field>
        <div className="flex flex-wrap items-center gap-2 text-sm">or
          <FileBtn label={v.url ? "Replace video file" : "Upload video file"} accept="video/*" disabled={busy} onFile={async (f) => { const u = await up(f, `video-${lang}`); if (u) onChange({ ...s, videos: { ...s.videos, [lang]: { ...v, url: u } } }); }} />
          {v.url && <span className="font-semibold">Uploaded ✓</span>}
        </div>
        {have.length > 0 && <p className="text-xs text-muted-foreground">Has video in: {have.join(", ")}</p>}
      </div>; }

    case "game": return <div className="grid gap-2">
      <Field label="Title (optional)"><input className={inputCls} value={s.title ?? ""} onChange={(e) => onChange({ ...s, title: e.target.value })} /></Field>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <FileBtn label={s.url ? "Replace .html game" : "Upload .html game"} accept=".html,text/html" disabled={busy} onFile={async (f) => { const u = await up(f, "game", "text/html"); if (u) onChange({ ...s, url: u }); }} />
        {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold underline">Preview</a>}
      </div>
      <p className="text-xs text-muted-foreground">One self-contained .html file. To report the score, the game can call <code>parent.postMessage({`{ type: "ilmstation:done", score: 10 }`}, "*")</code>.</p>
    </div>;
  }
}

function OptionRow({ o, right, lang, busy, up, onRight, onChange, onRemove }: { o: Choice; right: boolean; lang: VoiceLang; busy: boolean; up: (f: File, k: string) => Promise<string>; onRight: () => void; onChange: (o: Choice) => void; onRemove?: (() => void) | undefined }) {
  return <div className={cn("grid gap-2 border-2 p-2", right ? "border-secondary bg-secondary/10" : "border-foreground/30")}>
    <div className="grid grid-cols-[auto_minmax(0,1fr)_5rem_auto] items-center gap-2">
      <input type="radio" checked={right} onChange={onRight} aria-label="Right answer" />
      <input dir="auto" aria-label="Option text" className={inputCls} value={o.label} onChange={(e) => onChange({ ...o, label: e.target.value })} placeholder="ب / بطّة" />
      <input aria-label="Emoji" className={inputCls} value={o.emoji ?? ""} onChange={(e) => onChange({ ...o, emoji: e.target.value })} placeholder="🦆" />
      <Button size="icon" variant="outline" aria-label="Remove option" disabled={!onRemove} onClick={onRemove}><Trash2 /></Button>
    </div>
    <VoiceField label="Says" voices={o.voice} lang={lang} busy={busy} up={up} onChange={(v) => onChange({ ...o, voice: v })} />
  </div>;
}
