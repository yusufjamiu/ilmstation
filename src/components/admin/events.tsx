import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Pencil, Plus, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { eventPrice } from "@/components/public-site";
import { seedEvents, seedRegistrations, type AdminEvent, type EventStatus, type Registration } from "./data";
import { naira, uid, useAdminStore } from "./store";
import { Choice, DataTable, Field, inputCls, Kpi, Page, Pill, SearchBox, useAudit, useConfirm, type Column } from "./ui";

const formats = [["Live online", "Live online"], ["In person", "In person"], ["Hybrid", "Hybrid"]] as const;
const statuses = [["published", "Published"], ["draft", "Draft"], ["cancelled", "Cancelled"]] as const;
const blank = (): AdminEvent => ({ id: uid(), title: "", speaker: "", topic: "", format: "Live online", location: "Zoom room", date: new Date().toISOString().slice(0, 10), time: "7:00 PM WAT", total: 50, booked: 0, price: 0, earlyBird: 0, status: "draft" });

export function EventsSection() {
  const [events, setEvents] = useAdminStore<AdminEvent[]>("events", seedEvents);
  const [regs, setRegs] = useAdminStore<Registration[]>("registrations", seedRegistrations);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<EventStatus | "all">("all");
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [attendees, setAttendees] = useState<AdminEvent | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  const rows = useMemo(() => events.filter((e) => (status === "all" || e.status === status) && `${e.title} ${e.speaker} ${e.topic}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.date.localeCompare(b.date)), [events, q, status]);
  const revenue = regs.filter((r) => r.status === "confirmed").reduce((s, r) => s + r.paid, 0);
  const seats = events.filter((e) => e.status === "published").reduce((s, e) => s + e.booked, 0);

  const save = (e: AdminEvent) => {
    const exists = events.some((x) => x.id === e.id);
    const before = events.find((x) => x.id === e.id);
    setEvents((l) => (exists ? l.map((x) => (x.id === e.id ? e : x)) : [...l, e]));
    record(before && before.price !== e.price ? `Changed ${e.title} price from ${eventPrice(before.price)} to ${eventPrice(e.price)}` : `${exists ? "Updated" : "Created"} event ${e.title}`);
    toast.success(exists ? "Event saved" : "Event created"); setEditing(null);
  };

  const columns: Column<AdminEvent>[] = [
    { key: "title", label: "Event", render: (e) => <div><p className="font-semibold">{e.title}</p><p className="text-xs text-muted-foreground">{e.speaker}</p></div> },
    { key: "date", label: "Date", render: (e) => <span className="tabular-nums">{e.date} · {e.time}</span> },
    { key: "format", label: "Format", render: (e) => e.format, mobile: false },
    { key: "price", label: "Price", render: (e) => <span className="tabular-nums">{eventPrice(e.price)}{e.earlyBird > 0 && e.earlyBird < e.price && <span className="block text-xs text-muted-foreground">Early: {naira(e.earlyBird)}</span>}</span> },
    { key: "seats", label: "Booked", render: (e) => <div className="min-w-24"><span className="tabular-nums">{e.booked}/{e.total}</span><div className="mt-1 h-2 border border-foreground"><div className="h-full bg-secondary" style={{ width: `${Math.min(100, (e.booked / Math.max(e.total, 1)) * 100)}%` }} /></div></div> },
    { key: "status", label: "Status", render: (e) => <Pill value={e.status} /> },
  ];

  return <Page eyebrow="Web · events & ticketing" title="Events & pricing" actions={<Button onClick={() => setEditing(blank())}><Plus /> New event</Button>}>
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Published" value={String(events.filter((e) => e.status === "published").length)} />
      <Kpi label="Seats booked" value={seats.toLocaleString()} />
      <Kpi label="Ticket revenue" value={naira(revenue)} tone="primary" />
      <Kpi label="Pending payments" value={String(regs.filter((r) => r.status === "pending").length)} />
    </div>
    <div className="mb-4 flex flex-wrap gap-2">
      <SearchBox value={q} onChange={setQ} placeholder="Search events" />
      <Choice label="Filter by status" value={status} onChange={setStatus} options={[["all", "Any status"], ...statuses]} />
    </div>
    <DataTable rows={rows} columns={columns} actions={(e) => <>
      <Button size="sm" variant="outline" onClick={() => setAttendees(e)}><Users /> {regs.filter((r) => r.eventId === e.id).length}</Button>
      <Button size="sm" variant="outline" onClick={() => setEditing({ ...e })}><Pencil /> Edit</Button>
      {e.status !== "cancelled" && <Button size="sm" variant="outline" aria-label="Cancel event" onClick={() => ask({ title: `Cancel “${e.title}”?`, body: "Registrants would be notified and paid tickets refunded.", confirm: "Cancel event", destructive: true, run: () => { setEvents((l) => l.map((x) => (x.id === e.id ? { ...x, status: "cancelled" } : x))); setRegs((l) => l.map((r) => (r.eventId === e.id && r.paid > 0 ? { ...r, status: "refunded" } : r))); record(`Cancelled ${e.title}`); toast.success("Event cancelled"); } })}><XCircle /></Button>}
    </>} />
    <EventEditor item={editing} onClose={() => setEditing(null)} onSave={save} />
    <Attendees event={attendees} regs={regs.filter((r) => r.eventId === attendees?.id)} onClose={() => setAttendees(null)} onUpdate={(id, st) => { setRegs((l) => l.map((r) => (r.id === id ? { ...r, status: st } : r))); record(`Marked registration ${st}`); }} />
    {dialog}
  </Page>;
}

function EventEditor({ item, onClose, onSave }: { item: AdminEvent | null; onClose: () => void; onSave: (e: AdminEvent) => void }) {
  const [draft, setDraft] = useState(item);
  const [last, setLast] = useState(item);
  if (item !== last) { setLast(item); setDraft(item); }
  if (!draft) return null;
  const set = (p: Partial<AdminEvent>) => setDraft({ ...draft, ...p });
  const num = (v: string) => Math.max(0, Number(v) || 0);
  const submit = () => {
    if (!draft.title.trim() || !draft.speaker.trim()) { toast.error("Add a title and speaker"); return; }
    if (draft.total < draft.booked) { toast.error(`Capacity can’t be below the ${draft.booked} seats already booked`); return; }
    if (draft.earlyBird > draft.price) { toast.error("Early-bird price should be at or below the full price"); return; }
    onSave(draft);
  };
  return <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>{draft.title || "New event"}</DialogTitle><DialogDescription>Shown on the website’s Events page and in the app.</DialogDescription></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2"><input className={inputCls} value={draft.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Speaker"><input className={inputCls} value={draft.speaker} onChange={(e) => set({ speaker: e.target.value })} /></Field>
        <Field label="Topic"><input className={inputCls} value={draft.topic} onChange={(e) => set({ topic: e.target.value })} /></Field>
        <Field label="Date"><input type="date" className={inputCls} value={draft.date} onChange={(e) => set({ date: e.target.value })} /></Field>
        <Field label="Time"><input className={inputCls} value={draft.time} onChange={(e) => set({ time: e.target.value })} /></Field>
        <Field label="Format"><Choice label="Format" className="w-full" value={draft.format} onChange={(format) => set({ format })} options={formats} /></Field>
        <Field label="Location"><input className={inputCls} value={draft.location} onChange={(e) => set({ location: e.target.value })} /></Field>
      </div>
      <fieldset className="grid gap-3 border-2 border-foreground bg-muted p-3 sm:grid-cols-3">
        <legend className="px-1 text-xs font-bold uppercase">Pricing & capacity</legend>
        <Field label="Full price (₦, 0 = free)"><input type="number" min={0} step={500} className={inputCls} value={draft.price} onChange={(e) => set({ price: num(e.target.value) })} /></Field>
        <Field label="Early-bird (₦)"><input type="number" min={0} step={500} className={inputCls} value={draft.earlyBird} disabled={draft.price === 0} onChange={(e) => set({ earlyBird: num(e.target.value) })} /></Field>
        <Field label="Capacity"><input type="number" min={1} className={inputCls} value={draft.total} onChange={(e) => set({ total: num(e.target.value) })} /></Field>
        <p className="text-xs text-muted-foreground sm:col-span-3">Shown as <b>{eventPrice(draft.price)}</b> · {Math.max(0, draft.total - draft.booked)} seats left · max revenue {naira(draft.price * draft.total)}</p>
      </fieldset>
      <Field label="Status"><Choice label="Status" className="w-full" value={draft.status} onChange={(status) => set({ status })} options={statuses} /></Field>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save event</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function Attendees({ event, regs, onClose, onUpdate }: { event: AdminEvent | null; regs: Registration[]; onClose: () => void; onUpdate: (id: string, s: Registration["status"]) => void }) {
  const exportCsv = () => {
    const csv = ["Name,Email,Tickets,Paid,Status", ...regs.map((r) => [r.name, r.email, r.tickets, r.paid, r.status].join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${event?.id ?? "event"}-registrations.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  return <Dialog open={!!event} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Registrations</DialogTitle><DialogDescription>{event?.title}</DialogDescription></DialogHeader>
      <DataTable rows={regs} empty="No registrations yet." columns={[
        { key: "n", label: "Name", render: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
        { key: "t", label: "Tickets", render: (r) => r.tickets },
        { key: "p", label: "Paid", render: (r) => <span className="tabular-nums">{r.paid ? naira(r.paid) : "Free"}</span> },
        { key: "s", label: "Status", render: (r) => <Pill value={r.status} /> },
      ]} actions={(r) => <>
        {r.status === "pending" && <Button size="sm" variant="secondary" onClick={() => onUpdate(r.id, "confirmed")}>Confirm</Button>}
        {r.status === "confirmed" && r.paid > 0 && <Button size="sm" variant="outline" onClick={() => onUpdate(r.id, "refunded")}>Refund</Button>}
      </>} />
      <DialogFooter><Button variant="outline" onClick={exportCsv} disabled={!regs.length}><Download /> Export CSV</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
