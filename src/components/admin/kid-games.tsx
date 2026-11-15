import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputCls, Page, Panel, useAudit, useConfirm } from "./ui";

type Q = { q: string; options: string[]; answer: number; why: string };
type Game = { id: string; title: string; emoji: string; color: string; status: "draft" | "published"; order: number; questions: Q[]; createdAt: number };
const COLORS: [string, string][] = [["yellow", "Yellow"], ["green", "Green"], ["white", "White"], ["grey", "Grey"]];
const blankQ = (): Q => ({ q: "", options: ["", "", "", ""], answer: 0, why: "" });

export function KidGamesSection() {
  const [items, setItems] = useState<Game[] | null>(null);
  const [form, setForm] = useState<Game | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();
  useEffect(() => onSnapshot(collection(db, "kidGames"), (s) => setItems(s.docs.map((d) => ({ ...(d.data() as Omit<Game, "id">), id: d.id })).sort((a, b) => a.order - b.order)), () => setItems([])), []);

  const rows = items ?? [];
  const blank = (): Game => ({ id: `kg-${Date.now().toString(36)}`, title: "", emoji: "⭐", color: "yellow", status: "draft", order: rows.length, questions: [blankQ()], createdAt: Date.now() });
  const setQ = (i: number, p: Partial<Q>) => form && setForm({ ...form, questions: form.questions.map((q, j) => (j === i ? { ...q, ...p } : q)) });

  const save = async (g: Game) => {
    if (!g.title.trim()) { toast.error("Give the game a title"); return; }
    const questions: Q[] = [];
    for (const [n, q] of g.questions.entries()) {
      const filled = q.options.map((o, k) => ({ o: o.trim(), k })).filter((x) => x.o);
      if (!q.q.trim() && !filled.length) continue; // empty question: skip it
      if (!q.q.trim()) { toast.error(`Question ${n + 1} needs its question`); return; }
      if (filled.length < 2) { toast.error(`Question ${n + 1} needs at least 2 answers`); return; }
      const answer = filled.findIndex((x) => x.k === q.answer);
      if (answer < 0) { toast.error(`Question ${n + 1}: tick the correct answer`); return; }
      questions.push({ q: q.q.trim(), options: filled.map((x) => x.o), answer, why: q.why.trim() });
    }
    if (!questions.length) { toast.error("Add at least one question"); return; }
    const { id, ...data } = g;
    try { await setDoc(doc(db, "kidGames", id), { ...data, title: g.title.trim(), questions }); record(`Saved kids game ${g.title.trim()}`); toast.success("Saved"); setForm(null); }
    catch { toast.error("Couldn't save. Check you are an admin."); }
  };
  const move = async (i: number, d: number) => {
    const a = rows[i]; const b = rows[i + d];
    if (!a || !b) return;
    const w = writeBatch(db);
    w.update(doc(db, "kidGames", a.id), { order: b.order });
    w.update(doc(db, "kidGames", b.id), { order: a.order === b.order ? a.order + d : a.order });
    await w.commit().catch(() => toast.error("Couldn't reorder"));
  };

  return <Page eyebrow="App · Kids zone" title="Kids games" actions={<Button onClick={() => setForm(blank())}><Plus /> Add game</Button>}>
    <p className="mb-5 max-w-2xl text-sm text-muted-foreground">Simple quiz games for children (Kids zone only). Until you publish one, kids see the 4 starter games.</p>
    <Panel title="Games" tag={`${rows.filter((g) => g.status === "published").length} published`}>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No games yet. Add the first one.</p> : <ul className="grid gap-2">{rows.map((g, i) => <li key={g.id} className={`flex flex-wrap items-center gap-3 border-2 border-foreground p-3 ${g.status === "draft" ? "opacity-70" : ""}`}>
        <span className="text-3xl">{g.emoji}</span>
        <div className="min-w-0 flex-1"><p className="font-semibold">{g.title}</p><p className="text-xs text-muted-foreground">{g.questions.length} questions · {g.status === "published" ? "Published" : "Draft"}</p></div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}><ArrowUp /></Button>
          <Button size="sm" variant="outline" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => void move(i, 1)}><ArrowDown /></Button>
          <Button size="sm" variant="outline" onClick={() => setForm({ ...g, questions: g.questions.map((q) => ({ ...q, options: [...q.options, "", "", "", ""].slice(0, 4) })) })}><Pencil /> Edit</Button>
          <Button size="sm" variant="outline" aria-label="Delete" onClick={() => ask({ title: `Delete “${g.title}”?`, body: "Kids won't see it any more.", confirm: "Delete", destructive: true, run: () => { void deleteDoc(doc(db, "kidGames", g.id)).then(() => { record(`Deleted kids game ${g.title}`); toast.success("Deleted"); }); } })}><Trash2 /></Button>
        </div>
      </li>)}</ul>}
    </Panel>

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) setForm(null); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{form.title || "New game"}</DialogTitle><DialogDescription>Short, simple questions work best for children.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="The 5 prayers" /></Field>
              <Field label="Emoji"><input className={`${inputCls} text-center text-2xl`} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Colour"><select className={inputCls} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>{COLORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
              <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Game["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
            </div>
            {form.questions.map((q, i) => <fieldset key={i} className="grid gap-2 border-2 border-foreground p-3">
              <legend className="px-1 text-sm font-bold">Question {i + 1}</legend>
              <textarea rows={2} dir="auto" className={`${inputCls} h-auto py-2`} value={q.q} onChange={(e) => setQ(i, { q: e.target.value })} placeholder="How many times do we pray each day?" />
              {q.options.map((o, k) => <label key={k} className="flex items-center gap-2 text-sm">
                <input type="radio" name={`correct-${i}`} checked={q.answer === k} onChange={() => setQ(i, { answer: k })} title="Correct answer" />
                <input dir="auto" className={inputCls} value={o} onChange={(e) => setQ(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} placeholder={`Answer ${"ABCD"[k]}${k < 2 ? "" : " (optional)"}`} />
              </label>)}
              <p className="text-xs text-muted-foreground">Tick the circle next to the correct answer.</p>
              <input dir="auto" className={inputCls} value={q.why} onChange={(e) => setQ(i, { why: e.target.value })} placeholder="Short explanation shown after answering (optional)" />
              {form.questions.length > 1 && <Button size="sm" variant="outline" className="w-fit" onClick={() => setForm({ ...form, questions: form.questions.filter((_, j) => j !== i) })}><Trash2 /> Remove question</Button>}
            </fieldset>)}
            <Button variant="outline" onClick={() => setForm({ ...form, questions: [...form.questions, blankQ()] })}><Plus /> Add question</Button>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => void save(form)}>Save</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </Page>;
}
