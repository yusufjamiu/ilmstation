import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputCls, Page, Panel, useAudit, useConfirm } from "./ui";

type Kind = "Qur’an" | "Hadith" | "Scholar" | "Dua" | "Reminder";
type Item = { id: string; kind: Kind; arabic: string; text: string; source: string; date: string; active: boolean; createdAt: number };
const pad = (n: number) => String(n).padStart(2, "0");
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const dayOfYear = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000); };
const blank = (): Item => ({ id: `w-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, kind: "Qur’an", arabic: "", text: "", source: "", date: "", active: true, createdAt: Date.now() });
const niceDate = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }); };

export function WisdomSection() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [form, setForm] = useState<Item | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  useEffect(() => onSnapshot(collection(db, "wisdom"),
    (s) => setItems(s.docs.map((d) => ({ ...(d.data() as Omit<Item, "id">), id: d.id }))),
    () => setItems([])), []);

  const pinned = (items ?? []).filter((x) => x.date).sort((a, b) => a.date.localeCompare(b.date));
  const pool = (items ?? []).filter((x) => !x.date).sort((a, b) => a.createdAt - b.createdAt);
  const activePool = pool.filter((x) => x.active);
  const shownToday = (items ?? []).find((x) => x.active && x.date === todayKey()) ?? (activePool.length ? activePool[dayOfYear() % activePool.length] : undefined);

  const save = async (f: Item) => {
    if (!f.text.trim() || !f.source.trim()) return toast.error("Add the text and the source");
    const { id, ...data } = f;
    try {
      await setDoc(doc(db, "wisdom", id), { ...data, arabic: f.arabic.trim(), text: f.text.trim(), source: f.source.trim() });
      record(`${isNew ? "Added" : "Updated"} daily wisdom: ${f.source.trim()}`); toast.success("Saved"); setForm(null);
    } catch { toast.error("Couldn't save. Check you are an admin."); }
  };
  const remove = (x: Item) => ask({
    title: "Delete this wisdom?", body: `${x.source}: “${x.text}”`, confirm: "Delete", destructive: true,
    run: () => { void deleteDoc(doc(db, "wisdom", x.id)).then(() => { record(`Deleted daily wisdom: ${x.source}`); toast.success("Deleted"); }).catch(() => toast.error("Couldn't delete.")); },
  });

  const row = (x: Item) => <li key={x.id} className={`grid gap-2 border-2 border-foreground p-3 ${x.active ? "" : "opacity-60"}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-bold uppercase text-muted-foreground">{x.kind}{x.date && ` · pinned to ${niceDate(x.date)}`}{!x.active && " · hidden"}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => { setForm({ ...x }); setIsNew(false); }}><Pencil /> Edit</Button>
        <Button size="sm" variant="outline" aria-label="Delete" onClick={() => remove(x)}><Trash2 /></Button>
      </div>
    </div>
    {x.arabic && <p className="font-arabic text-2xl leading-relaxed" dir="rtl">{x.arabic}</p>}
    <p className="text-sm italic">{x.text}</p>
    <p className="text-xs text-muted-foreground">{x.source}</p>
  </li>;

  return <Page eyebrow="App · Today page" title="Daily Wisdom" actions={<Button onClick={() => { setForm(blank()); setIsNew(true); }}><Plus /> Add wisdom</Button>}>
    <Panel title="Showing today" tag={niceDate(todayKey())}>
      {shownToday ? <>
        {shownToday.arabic && <p className="font-arabic text-3xl leading-relaxed" dir="rtl">{shownToday.arabic}</p>}
        <p className="mt-2 italic">{shownToday.text}</p>
        <p className="mt-1 text-sm text-muted-foreground">{shownToday.source} · {shownToday.date ? "pinned to today" : "from the rotation"}</p>
      </> : <p className="text-sm text-muted-foreground">Nothing added yet, so users see the built-in list of 14. Add your own to replace it.</p>}
    </Panel>

    <div className="mt-6">
      <Panel title="Pinned to a date" tag={`${pinned.length}`}>
        {pinned.length ? <ul className="grid gap-2">{pinned.map(row)}</ul> : <p className="text-sm text-muted-foreground">Nothing pinned. Pin one to show it on a special day (e.g. 1 Ramadan, Eid, Jumu’ah).</p>}
      </Panel>
    </div>

    <div className="mt-6">
      <Panel title="Rotation" tag={`${activePool.length} active · one per day`}>
        {pool.length ? <ul className="grid gap-2">{pool.map(row)}</ul> : <p className="text-sm text-muted-foreground">Add ayat and hadith here. They take turns, one per day.</p>}
      </Panel>
    </div>

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) setForm(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{isNew ? "Add wisdom" : "Edit wisdom"}</DialogTitle><DialogDescription>An ayah or hadith for the Today page.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <Field label="Type"><select className={inputCls} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}><option value="Qur’an">Qur’an</option><option value="Hadith">Hadith</option><option value="Scholar">Words of scholars / imams</option><option value="Dua">Dua</option><option value="Reminder">Reminder</option></select></Field>
            <Field label="Arabic (optional)"><textarea rows={3} dir="rtl" className={`${inputCls} h-auto py-2 font-arabic text-2xl`} value={form.arabic} onChange={(e) => setForm({ ...form, arabic: e.target.value })} /></Field>
            <Field label="Text / translation"><textarea rows={2} className={`${inputCls} h-auto py-2`} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></Field>
            <Field label="Source"><input className={inputCls} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder={({ "Qur’an": "e.g. Al-Baqarah · 2:286", Hadith: "e.g. Sahih al-Bukhari 1", Scholar: "e.g. Imam ash-Shafi‘i, Diwan", Dua: "e.g. Sahih Muslim 2722", Reminder: "e.g. IlmStation" } as Record<string, string>)[form.kind]} /></Field>
            <Field label="Pin to a date (optional)"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <p className="-mt-2 text-xs text-muted-foreground">Leave empty to add it to the daily rotation.</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible to users</label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => void save(form)}>Save</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </Page>;
}
