import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { centreStatuses, seedCentres, type AdminCentre } from "./data";
import { uid, useAdminStore } from "./store";
import { Choice, Field, inputCls, Page, Pill, SearchBox, useAudit } from "./ui";

const blank = (): AdminCentre => ({ id: uid(), name: "", city: "", address: "", status: "Enrolling now", schedule: "", places: 20, capacity: 40, programmes: [], lead: "" });

export function CentresSection() {
  const [centres, setCentres] = useAdminStore<AdminCentre[]>("centres", seedCentres);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AdminCentre | null>(null);
  const { record } = useAudit();
  const rows = centres.filter((c) => `${c.name} ${c.city} ${c.programmes.join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  const save = (c: AdminCentre) => {
    const exists = centres.some((x) => x.id === c.id);
    setCentres((l) => (exists ? l.map((x) => (x.id === c.id ? c : x)) : [...l, c]));
    record(`${exists ? "Updated" : "Added"} centre ${c.name}`); toast.success("Centre saved"); setEditing(null);
  };

  return <Page eyebrow="Web · learning centres" title="Centres" actions={<Button onClick={() => setEditing(blank())}><Plus /> Add centre</Button>}>
    <div className="mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search centres, cities or programmes" /></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((c) => {
      const filled = c.capacity - c.places;
      return <article key={c.id} className="flex flex-col border-2 border-foreground bg-card p-4 shadow-brutal-sm">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">{c.city}</p><h3 className="font-serif text-2xl leading-tight">{c.name}</h3></div><Pill value={c.status} className={c.status === "Closed" ? "bg-destructive text-destructive-foreground" : c.status === "Enrolling now" ? "bg-secondary" : "bg-primary"} /></div>
        <p className="mt-2 flex gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{c.address}</p>
        <p className="mt-1 text-sm">{c.schedule} · Lead: {c.lead}</p>
        <div className="mt-3 text-sm"><div className="flex justify-between"><span>Enrolment</span><span className="tabular-nums">{filled}/{c.capacity}</span></div><div className="mt-1 h-2 border border-foreground"><div className="h-full bg-secondary" style={{ width: `${(filled / Math.max(c.capacity, 1)) * 100}%` }} /></div></div>
        <div className="mt-3 flex flex-1 flex-wrap content-start gap-1">{c.programmes.map((p) => <span key={p} className="border border-foreground px-2 py-0.5 text-xs">{p}</span>)}</div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing({ ...c, programmes: [...c.programmes] })}><Pencil /> Edit</Button>
          <Choice label={`Status for ${c.name}`} className="min-h-8 flex-1 text-xs" value={c.status} onChange={(status) => { setCentres((l) => l.map((x) => (x.id === c.id ? { ...x, status } : x))); record(`Set ${c.name} to ${status}`); }} options={centreStatuses.map((s) => [s, s] as const)} />
        </div>
      </article>;
    })}</div>
    <CentreEditor item={editing} onClose={() => setEditing(null)} onSave={save} />
  </Page>;
}

function CentreEditor({ item, onClose, onSave }: { item: AdminCentre | null; onClose: () => void; onSave: (c: AdminCentre) => void }) {
  const [draft, setDraft] = useState(item);
  const [last, setLast] = useState(item);
  const [prog, setProg] = useState("");
  if (item !== last) { setLast(item); setDraft(item); }
  if (!draft) return null;
  const set = (p: Partial<AdminCentre>) => setDraft({ ...draft, ...p });
  const addProg = () => { if (prog.trim()) { set({ programmes: [...draft.programmes, prog.trim()] }); setProg(""); } };
  const submit = () => {
    if (!draft.name.trim() || !draft.city.trim()) { toast.error("Add a name and city"); return; }
    if (draft.places > draft.capacity) { toast.error("Open places can’t exceed capacity"); return; }
    onSave(draft);
  };
  return <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>{draft.name || "New centre"}</DialogTitle><DialogDescription>Listed on the website’s Centres page.</DialogDescription></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><input className={inputCls} value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="City"><input className={inputCls} value={draft.city} onChange={(e) => set({ city: e.target.value })} /></Field>
        <Field label="Address" className="sm:col-span-2"><input className={inputCls} value={draft.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        <Field label="Schedule"><input className={inputCls} value={draft.schedule} onChange={(e) => set({ schedule: e.target.value })} /></Field>
        <Field label="Centre lead"><input className={inputCls} value={draft.lead} onChange={(e) => set({ lead: e.target.value })} /></Field>
        <Field label="Capacity"><input type="number" min={0} className={inputCls} value={draft.capacity} onChange={(e) => set({ capacity: Math.max(0, Number(e.target.value) || 0) })} /></Field>
        <Field label="Open places"><input type="number" min={0} className={inputCls} value={draft.places} onChange={(e) => set({ places: Math.max(0, Number(e.target.value) || 0) })} /></Field>
        <Field label="Status"><Choice label="Status" className="w-full" value={draft.status} onChange={(status) => set({ status })} options={centreStatuses.map((s) => [s, s] as const)} /></Field>
      </div>
      <Field label="Programmes">
        <div className="flex gap-2"><input className={inputCls} value={prog} onChange={(e) => setProg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProg(); } }} placeholder="e.g. Weekend Qur’an" /><Button variant="outline" type="button" onClick={addProg}>Add</Button></div>
      </Field>
      <div className="flex flex-wrap gap-1">{draft.programmes.map((p) => <span key={p} className="flex items-center gap-1 border-2 border-foreground px-2 py-0.5 text-xs">{p}<button aria-label={`Remove ${p}`} onClick={() => set({ programmes: draft.programmes.filter((x) => x !== p) })}><X className="size-3" /></button></span>)}</div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save centre</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
