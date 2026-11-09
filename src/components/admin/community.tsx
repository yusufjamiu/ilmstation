import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { roomGenders, roomZones, useRooms, type RoomDoc, type RoomGender, type RoomZone } from "@/components/chatrooms";
import { DataTable, Field, inputCls, Page, Panel, useAudit, useConfirm } from "./ui";

type Report = { id: string; room: string; messageId: string; reportedUid: string; reportedName: string; text: string; by: string; createdAt: number };
type Form = { id?: string; name: string; topic: string; note: string; zones: RoomZone[]; genders: RoomGender[]; postMode: "everyone" | "admins"; active: boolean };

const zoneList: [RoomZone, string][] = [["kids", "Kids"], ["youth", "Teens & Young Adults"], ["adult", "Adult"]];
const genderList: [RoomGender, string][] = [["male", "Brothers"], ["female", "Sisters"]];
const blank: Form = { name: "", topic: "", note: "", zones: ["adult"], genders: ["male", "female"], postMode: "everyone", active: true };

function describe(r: RoomDoc) {
  const z = roomZones(r);
  const g = roomGenders(r);
  const zones = z.length === 3 ? "All ages" : z.map((x) => zoneList.find(([k]) => k === x)?.[1]).join(" + ") || "No zone";
  const genders = g.length === 2 ? "Everyone" : g[0] === "female" ? "Sisters" : "Brothers";
  return `${zones} · ${genders} · ${r.postMode === "admins" ? "Admins post" : "Everyone posts"}`;
}

function useReports() {
  const [reports, setReports] = useState<Report[] | null>(null);
  useEffect(() => onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc")),
    (snap) => setReports(snap.docs.map((d) => ({ ...(d.data() as Omit<Report, "id">), id: d.id }))),
    () => setReports([])), []);
  return reports;
}

export function CommunitySection() {
  const { rooms } = useRooms();
  const reports = useReports();
  const [form, setForm] = useState<Form | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? (id.startsWith("book:") ? "a book discussion" : id);
  const maxOrder = useMemo(() => rooms.reduce((m, r) => Math.max(m, r.order ?? 0), 0), [rooms]);

  const keep = async (r: Report) => {
    try { await deleteDoc(doc(db, "reports", r.id)); record(`Kept a message by ${r.reportedName}`); toast.success("Report dismissed"); }
    catch { toast.error("Couldn't dismiss. Try again."); }
  };
  const remove = async (r: Report) => {
    try {
      await deleteDoc(r.room.startsWith("book:") ? doc(db, "library", r.room.slice(5), "posts", r.messageId) : doc(db, "rooms", r.room, "messages", r.messageId));
      await deleteDoc(doc(db, "reports", r.id));
      record(`Removed a message by ${r.reportedName} in ${roomName(r.room)}`); toast.success("Message removed");
    } catch { toast.error("Couldn't remove. Try again."); }
  };
  const suspend = async (r: Report) => {
    try {
      await setDoc(doc(db, "userAdmin", r.reportedUid), { status: "suspended", updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid ?? null }, { merge: true });
      record(`Suspended ${r.reportedName}`); toast.success(`${r.reportedName} suspended`);
    } catch { toast.error("Couldn't suspend. Try again."); }
  };

  const save = async (f: Form) => {
    if (!f.name.trim()) return toast.error("Add a room name");
    if (!f.zones.length) return toast.error("Tick at least one age zone");
    if (!f.genders.length) return toast.error("Tick Brothers, Sisters or both");
    const id = f.id ?? `${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
    const data: Record<string, unknown> = {
      name: f.name.trim(), topic: f.topic.trim(), note: f.note.trim(), zones: f.zones, genders: f.genders, postMode: f.postMode, active: f.active,
      // kept for older screens that still read a single zone/audience
      zone: f.zones[0], audience: f.genders.length === 2 ? "all" : f.genders[0],
    };
    if (!f.id) Object.assign(data, { order: maxOrder + 1, memberCount: 0 });
    try {
      await setDoc(doc(db, "rooms", id), data, { merge: true });
      record(`${f.id ? "Updated" : "Created"} room ${f.name}`); toast.success(f.id ? "Room updated" : "Room created"); setForm(null);
    } catch { toast.error("Couldn't save the room. Check you are an admin."); }
  };

  const deleteRoom = (f: Form) => {
    if (!f.id) return;
    const id = f.id;
    setForm(null);
    ask({
      title: `Delete ${f.name}?`,
      body: "The room and all its messages will be deleted for everyone. This can't be undone. To just hide it, untick “Visible to users” instead.",
      confirm: "Delete room", destructive: true,
      run: () => { void (async () => {
        try {
          const msgs = await getDocs(collection(db, "rooms", id, "messages"));
          for (let i = 0; i < msgs.docs.length; i += 400) {
            const b = writeBatch(db);
            msgs.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
            await b.commit();
          }
          await deleteDoc(doc(db, "rooms", id));
          record(`Deleted room ${f.name}`); toast.success("Room deleted");
        } catch { toast.error("Couldn't delete the room. Try again."); }
      })(); },
    });
  };

  const edit = (r: RoomDoc) => setForm({ id: r.id, name: r.name, topic: r.topic ?? "", note: r.note ?? "", zones: roomZones(r), genders: roomGenders(r), postMode: r.postMode ?? "everyone", active: r.active });

  return <Page eyebrow="App + Web · chatrooms" title="Community" actions={<Button onClick={() => setForm(blank)}><Plus /> New room</Button>}>
    <Panel title="Reported messages" tag={`${reports?.length ?? 0} open`}>
      {!reports ? <p className="p-4 text-sm text-muted-foreground">Loading reports…</p> :
      <DataTable rows={reports} empty="Inbox zero — no reports to review." columns={[
        { key: "msg", label: "Message", render: (r) => <div className="max-w-md"><p className="font-semibold">“{r.text}”</p><p className="text-xs text-muted-foreground">{r.reportedName} in {roomName(r.room)}</p></div> },
        { key: "at", label: "Reported", render: (r) => <span className="text-xs tabular-nums">{new Date(r.createdAt).toLocaleString()}</span>, mobile: false },
      ]} actions={(r) => <>
        <Button size="sm" variant="outline" onClick={() => void keep(r)}><Check /> Keep</Button>
        <Button size="sm" variant="destructive" onClick={() => void remove(r)}><Trash2 /> Remove</Button>
        <Button size="sm" variant="outline" onClick={() => ask({ title: `Suspend ${r.reportedName}?`, body: "They won't be able to log in until you reinstate them in Users.", confirm: "Suspend", destructive: true, run: () => { void suspend(r); } })}><Ban /> Suspend</Button>
      </>} />}
    </Panel>

    <h2 className="mb-3 mt-8 text-sm font-bold uppercase">Rooms ({rooms.length})</h2>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rooms.map((room) => <article key={room.id} className={`border-2 border-foreground bg-card p-4 shadow-brutal-sm ${room.active ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">{room.topic}{!room.active && " · hidden"}</p><h3 className="font-serif text-2xl leading-tight">{room.name}</h3></div>
        <Button size="sm" variant="outline" onClick={() => edit(room)}><Pencil /> Edit</Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{room.note}</p>
      <p className="mt-3 border-t border-foreground/30 pt-3 text-sm font-semibold">{describe(room)}</p>
      <p className="text-xs tabular-nums text-muted-foreground">{room.memberCount ?? 0} members</p>
    </article>)}</div>

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) setForm(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{form.id ? "Edit room" : "New room"}</DialogTitle><DialogDescription>Choose who can see this room and who can post in it.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <Field label="Room name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Topic"><input className={inputCls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Qur’an, Kids, Sisters" /></Field>
            <Field label="Short description"><input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Age zones</legend>
              {zoneList.map(([k, label]) => <label key={k} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={form.zones.includes(k)} onChange={(e) => setForm({ ...form, zones: e.target.checked ? [...form.zones, k] : form.zones.filter((z) => z !== k) })} /> {label}</label>)}
            </fieldset>
            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Gender</legend>
              {genderList.map(([k, label]) => <label key={k} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={form.genders.includes(k)} onChange={(e) => setForm({ ...form, genders: e.target.checked ? [...form.genders, k] : form.genders.filter((g) => g !== k) })} /> {label}</label>)}
            </fieldset>
            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Who can post</legend>
              {([["everyone", "Everyone in the room"], ["admins", "Admins only (others read and watch)"]] as const).map(([k, label]) => <label key={k} className="flex items-center gap-2 py-1 text-sm"><input type="radio" name="postMode" checked={form.postMode === k} onChange={() => setForm({ ...form, postMode: k })} /> {label}</label>)}
            </fieldset>
            {form.zones.includes("kids") && form.postMode === "everyone" && <p className="border-2 border-destructive p-2 text-sm font-semibold text-destructive">Kids zone is self-chosen at signup, so adults could join. For kids rooms, “Admins only” is safer.</p>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible to users</label>
          </div>
          <DialogFooter>{form.id && <Button variant="destructive" className="sm:mr-auto" onClick={() => deleteRoom(form)}><Trash2 /> Delete room</Button>}<Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => void save(form)}>{form.id ? "Save changes" : "Create room"}</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </Page>;
}
