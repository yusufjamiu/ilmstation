import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { roleAccess, seedAdmins, seedAnnouncements, seedFlags, type Admin, type AdminRole, type Announcement, type Flag, type Surface } from "./data";
import { resetAdminData, uid, useAdminStore } from "./store";
import { Choice, DataTable, Field, inputCls, Page, Panel, Pill, Toggle, useAudit, useConfirm } from "./ui";

const surfaces = [["both", "App + Web"], ["app", "App only"], ["web", "Web only"]] as const;
const audiences = [["everyone", "Everyone"], ["premium", "Premium members"], ["guardians", "Guardians"], ["kids", "Kids Mode"]] as const;
const surfaceLabel = (s: Surface) => surfaces.find(([v]) => v === s)?.[1] ?? s;

export function AnnouncementsSection() {
  const [items, setItems] = useAdminStore<Announcement[]>("announcements", seedAnnouncements);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();
  const today = new Date().toISOString().slice(0, 10);
  const blank = (): Announcement => ({ id: uid(), title: "", body: "", surface: "both", audience: "everyone", status: "draft", start: today, end: today });

  const save = (a: Announcement) => {
    if (!a.title.trim()) { toast.error("Add a title"); return; }
    if (a.end < a.start) { toast.error("End date must be after the start date"); return; }
    const exists = items.some((x) => x.id === a.id);
    setItems((l) => (exists ? l.map((x) => (x.id === a.id ? a : x)) : [a, ...l]));
    record(`${exists ? "Updated" : "Created"} announcement “${a.title}”`); toast.success("Announcement saved"); setEditing(null);
  };
  const setStatus = (a: Announcement, status: Announcement["status"]) => {
    setItems((l) => l.map((x) => (x.id === a.id ? { ...x, status } : x)));
    record(`${status === "live" ? "Published" : "Ended"} announcement “${a.title}”`);
  };

  return <Page eyebrow="App + Web · banners & notices" title="Announcements" actions={<Button onClick={() => setEditing(blank())}><Plus /> New announcement</Button>}>
    <div className="grid gap-4 lg:grid-cols-2">{items.map((a) => <article key={a.id} className="border-2 border-foreground bg-card shadow-brutal-sm">
      <div className="flex items-center justify-between gap-2 border-b-2 border-foreground px-4 py-2 text-xs font-bold uppercase"><span>{surfaceLabel(a.surface)} · {audiences.find(([v]) => v === a.audience)?.[1]}</span><Pill value={a.status} /></div>
      {/* Preview of how the banner renders in the product. */}
      <div className="m-4 flex gap-3 border-2 border-foreground bg-primary p-3"><Megaphone className="mt-0.5 size-5 shrink-0" /><div className="min-w-0"><p className="font-semibold">{a.title}</p><p className="text-sm">{a.body}</p></div></div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 text-sm"><span className="tabular-nums text-muted-foreground">{a.start} → {a.end}</span>
        <div className="flex gap-2">
          {a.status !== "live" ? <Button size="sm" variant="secondary" onClick={() => setStatus(a, "live")}>Go live</Button> : <Button size="sm" variant="outline" onClick={() => setStatus(a, "ended")}>End</Button>}
          <Button size="sm" variant="outline" onClick={() => setEditing({ ...a })}><Pencil /> Edit</Button>
          <Button size="sm" variant="outline" aria-label="Delete" onClick={() => ask({ title: "Delete announcement?", body: a.title, confirm: "Delete", destructive: true, run: () => { setItems((l) => l.filter((x) => x.id !== a.id)); record(`Deleted announcement “${a.title}”`); } })}><Trash2 /></Button>
        </div>
      </div>
    </article>)}</div>

    <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}><DialogContent>
      {editing && <>
        <DialogHeader><DialogTitle>{editing.title || "New announcement"}</DialogTitle><DialogDescription>Shows as a banner on the website and a notice in the app.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2"><input className={inputCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
          <Field label="Message" className="sm:col-span-2"><textarea rows={3} className={inputCls} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></Field>
          <Field label="Where"><Choice label="Where" className="w-full" value={editing.surface} onChange={(surface) => setEditing({ ...editing, surface })} options={surfaces} /></Field>
          <Field label="Who"><Choice label="Who" className="w-full" value={editing.audience} onChange={(audience) => setEditing({ ...editing, audience })} options={audiences} /></Field>
          <Field label="Starts"><input type="date" className={inputCls} value={editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value })} /></Field>
          <Field label="Ends"><input type="date" className={inputCls} value={editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value })} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => save(editing)}>Save</Button></DialogFooter>
      </>}
    </DialogContent></Dialog>
    {dialog}
  </Page>;
}

export function SettingsSection({ role }: { role: AdminRole }) {
  const [flags, setFlags] = useAdminStore<Flag[]>("flags", seedFlags);
  const [admins, setAdmins] = useAdminStore<Admin[]>("admins", seedAdmins);
  const [surface, setSurface] = useState<Surface | "all">("all");
  const [invite, setInvite] = useState({ name: "", email: "", role: "editor" as AdminRole });
  const { log, record } = useAudit();
  const { ask, dialog } = useConfirm();
  const isOwner = role === "owner";

  const flip = (f: Flag) => {
    const run = () => { setFlags((l) => l.map((x) => (x.key === f.key ? { ...x, on: !x.on } : x))); record(`Turned ${f.on ? "off" : "on"} ${f.label}`); toast.success(`${f.label} ${f.on ? "off" : "on"}`); };
    if (f.key === "maintenance" && !f.on) ask({ title: "Turn on maintenance mode?", body: "Every learner on the app and website will see a maintenance banner.", confirm: "Turn on", destructive: true, run });
    else run();
  };
  const addAdmin = () => {
    if (!invite.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) { toast.error("Add a name and valid email"); return; }
    setAdmins((l) => [...l, { id: uid(), ...invite, lastSeen: "Invited" }]);
    record(`Invited ${invite.email} as ${invite.role}`); toast.success("Admin invited (demo)");
    setInvite({ name: "", email: "", role: "editor" });
  };

  return <Page eyebrow="Platform" title="Settings">
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Feature flags" actions={<Choice label="Filter flags" className="min-h-8 text-xs" value={surface} onChange={setSurface} options={[["all", "All"], ...surfaces]} />}>
        <ul className="divide-y divide-foreground/30">{flags.filter((f) => surface === "all" || f.surface === surface || f.surface === "both").map((f) => <li key={f.key} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className={cn("font-semibold", f.key === "maintenance" && f.on && "text-destructive")}>{f.label}</p><p className="text-xs text-muted-foreground">{f.description} · {surfaceLabel(f.surface)}</p></div>
          <Toggle label={f.label} on={f.on} onChange={() => flip(f)} />
        </li>)}</ul>
      </Panel>

      <Panel title="Team & roles" tag={isOwner ? undefined : "Owner only"}>
        <DataTable rows={admins} columns={[
          { key: "n", label: "Admin", render: (a) => <div><p className="font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.email}</p></div> },
          { key: "r", label: "Role", render: (a) => isOwner && a.role !== "owner"
            ? <Choice label={`Role for ${a.name}`} className="min-h-8 text-xs" value={a.role} onChange={(r) => { setAdmins((l) => l.map((x) => (x.id === a.id ? { ...x, role: r } : x))); record(`Changed ${a.name} to ${r}`); }} options={(Object.keys(roleAccess) as AdminRole[]).filter((r) => r !== "owner").map((r) => [r, r] as const)} />
            : <span className="capitalize">{a.role}</span> },
          { key: "s", label: "Last seen", render: (a) => <span className="tabular-nums">{a.lastSeen}</span> },
        ]} actions={isOwner ? (a) => a.role !== "owner" ? <Button size="sm" variant="outline" aria-label={`Remove ${a.name}`} onClick={() => ask({ title: `Remove ${a.name}?`, body: "They will lose admin access immediately.", confirm: "Remove", destructive: true, run: () => { setAdmins((l) => l.filter((x) => x.id !== a.id)); record(`Removed admin ${a.name}`); } })}><Trash2 /></Button> : null : undefined} />
        {isOwner && <div className="mt-4 grid gap-2 border-t-2 border-foreground pt-4 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input className={inputCls} placeholder="Name" aria-label="New admin name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
          <input className={inputCls} placeholder="Email" aria-label="New admin email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <Choice label="New admin role" value={invite.role} onChange={(r) => setInvite({ ...invite, role: r })} options={(["editor", "moderator", "support"] as const).map((r) => [r, r] as const)} />
          <Button onClick={addAdmin}><UserPlus /> Invite</Button>
        </div>}
        <dl className="mt-4 grid gap-1 text-xs">{(Object.entries(roleAccess) as [AdminRole, string][]).map(([r, d]) => <div key={r} className="flex gap-2"><dt className="w-20 shrink-0 font-bold uppercase">{r}</dt><dd className="text-muted-foreground">{d}</dd></div>)}</dl>
      </Panel>
    </div>

    <Panel title="Audit log" tag={`${log.length} entries`} className="mt-5">
      <ul className="max-h-96 divide-y divide-foreground/30 overflow-y-auto text-sm">{log.map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2"><span><b>{l.actor}</b> · {l.action}</span><span className="tabular-nums text-muted-foreground">{l.at}</span></li>)}</ul>
    </Panel>

    <Panel title="Demo data" className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="max-w-xl text-muted-foreground">This admin is frontend-only. Changes are saved in this browser (iq_admin_* keys) and don’t reach other devices or the live app yet.</p>
        <Button variant="destructive" onClick={() => ask({ title: "Reset all admin data?", body: "Restores the original demo users, content, events and settings.", confirm: "Reset", destructive: true, run: resetAdminData })}>Reset demo data</Button></div>
    </Panel>
    {dialog}
  </Page>;
}
