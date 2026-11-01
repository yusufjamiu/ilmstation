import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, Trash2, Unlock, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedReports, seedRooms, type Report, type Room } from "./data";
import { useAdminStore } from "./store";
import { Choice, DataTable, Page, Panel, Pill, Toggle, useAudit, useConfirm } from "./ui";

export function CommunitySection() {
  const [rooms, setRooms] = useAdminStore<Room[]>("rooms", seedRooms);
  const [reports, setReports] = useAdminStore<Report[]>("reports", seedReports);
  const [muted, setMuted] = useAdminStore<string[]>("muted", []);
  const [filter, setFilter] = useState<Report["status"] | "all">("open");
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();
  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? id;
  const rows = reports.filter((r) => filter === "all" || r.status === filter);

  const resolve = (r: Report, status: Report["status"]) => {
    setReports((l) => l.map((x) => (x.id === r.id ? { ...x, status } : x)));
    record(`${status === "removed" ? "Removed" : "Kept"} a message by ${r.author} in ${roomName(r.roomId)}`);
    toast.success(status === "removed" ? "Message removed" : "Report dismissed");
  };
  const mute = (name: string) => {
    const on = muted.includes(name);
    setMuted((l) => (on ? l.filter((x) => x !== name) : [...l, name]));
    record(`${on ? "Unmuted" : "Muted"} ${name} for 24 hours`);
    toast.success(on ? `${name} unmuted` : `${name} muted for 24 hours`);
  };

  return <Page eyebrow="App + Web · chatrooms" title="Community">
    <Panel title="Reported messages" tag={`${reports.filter((r) => r.status === "open").length} open`} actions={<Choice label="Filter reports" className="min-h-8 text-xs" value={filter} onChange={setFilter} options={[["open", "Open"], ["kept", "Kept"], ["removed", "Removed"], ["all", "All"]]} />}>
      <DataTable rows={rows} empty="Inbox zero — no reports to review." columns={[
        { key: "msg", label: "Message", render: (r) => <div className="max-w-md"><p className="font-semibold">“{r.text}”</p><p className="text-xs text-muted-foreground">{r.author}{muted.includes(r.author) && " · muted"} in {roomName(r.roomId)}</p></div> },
        { key: "reason", label: "Reason", render: (r) => r.reason },
        { key: "by", label: "Reported", render: (r) => <span className="text-xs tabular-nums">{r.reporter}<br />{r.at}</span>, mobile: false },
        { key: "status", label: "Status", render: (r) => <Pill value={r.status} /> },
      ]} actions={(r) => <>
        {r.status === "open" && <><Button size="sm" variant="outline" onClick={() => resolve(r, "kept")}><Check /> Keep</Button><Button size="sm" variant="destructive" onClick={() => resolve(r, "removed")}><Trash2 /> Remove</Button></>}
        <Button size="sm" variant="outline" aria-label={`${muted.includes(r.author) ? "Unmute" : "Mute"} ${r.author}`} onClick={() => mute(r.author)}><VolumeX /> {muted.includes(r.author) ? "Unmute" : "Mute"}</Button>
      </>} />
    </Panel>

    <h2 className="mb-3 mt-8 text-sm font-bold uppercase">Rooms</h2>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rooms.map((room) => <article key={room.id} className="border-2 border-foreground bg-card p-4 shadow-brutal-sm">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">{room.topic}{room.kids && " · Kids"}</p><h3 className="font-serif text-2xl leading-tight">{room.name}</h3></div>{room.locked ? <Lock className="size-5 shrink-0" aria-label="Locked" /> : <Unlock className="size-5 shrink-0 text-muted-foreground" aria-label="Open" />}</div>
      <p className="mt-2 text-sm text-muted-foreground">{room.description}</p>
      <p className="mt-2 text-sm tabular-nums">{room.members} members · {room.online} online</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-foreground/30 pt-3 text-sm">
        <span>{room.locked ? "Read-only (locked)" : "Open for posting"}</span>
        <Toggle label={`Lock ${room.name}`} on={room.locked} onChange={() => {
          const run = () => { setRooms((l) => l.map((x) => (x.id === room.id ? { ...x, locked: !x.locked } : x))); record(`${room.locked ? "Unlocked" : "Locked"} ${room.name}`); };
          if (room.locked) run(); else ask({ title: `Lock ${room.name}?`, body: "Members can still read, but nobody can post until you unlock it.", confirm: "Lock room", run });
        }} />
      </div>
    </article>)}</div>
    {dialog}
  </Page>;
}
