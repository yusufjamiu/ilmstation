import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, Eye, RotateCcw, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { planNames, seedUsers, type AdminUser, type Plan, type Role, type UserStatus } from "./data";
import { uid, useAdminStore } from "./store";
import { Choice, DataTable, Field, inputCls, Page, Pill, SearchBox, useAudit, useConfirm, type Column } from "./ui";

const planOptions = [["all", "All plans"], ...Object.entries(planNames)] as [Plan | "all", string][];
const roleOptions = [["all", "All roles"], ["learner", "Learner"], ["guardian", "Guardian"], ["teacher", "Teacher"]] as const;
const statusOptions = [["all", "Any status"], ["active", "Active"], ["suspended", "Suspended"], ["invited", "Invited"]] as const;

export function UsersSection() {
  const [users, setUsers] = useAdminStore<AdminUser[]>("users", seedUsers);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<Plan | "all">("all");
  const [role, setRole] = useState<Role | "all">("all");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [open, setOpen] = useState<AdminUser | null>(null);
  const [inviting, setInviting] = useState(false);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  const rows = useMemo(() => users.filter((u) =>
    (plan === "all" || u.plan === plan) && (role === "all" || u.role === role) && (status === "all" || u.status === status) &&
    `${u.name} ${u.email} ${u.city}`.toLowerCase().includes(q.toLowerCase())), [users, q, plan, role, status]);

  const update = (id: string, patch: Partial<AdminUser>, msg: string) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setOpen((o) => (o?.id === id ? { ...o, ...patch } : o));
    record(msg); toast.success(msg);
  };

  const columns: Column<AdminUser>[] = [
    { key: "name", label: "User", render: (u) => <div className="min-w-0"><p className="font-semibold">{u.name}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div> },
    { key: "role", label: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
    { key: "plan", label: "Plan", render: (u) => planNames[u.plan] },
    { key: "city", label: "City", render: (u) => u.city, mobile: false },
    { key: "streak", label: "Streak", render: (u) => <span className="tabular-nums">{u.streak} d</span>, className: "text-right" },
    { key: "active", label: "Last active", render: (u) => <span className="tabular-nums">{u.lastActive}</span>, mobile: false },
    { key: "status", label: "Status", render: (u) => <Pill value={u.status} /> },
  ];

  return <Page eyebrow="People" title="Users" actions={<Button onClick={() => setInviting(true)}><UserPlus /> Invite user</Button>}>
    <div className="mb-4 flex flex-wrap gap-2">
      <SearchBox value={q} onChange={setQ} placeholder="Search name, email or city" />
      <Choice label="Filter by plan" value={plan} onChange={setPlan} options={planOptions} />
      <Choice label="Filter by role" value={role} onChange={setRole} options={roleOptions} />
      <Choice label="Filter by status" value={status} onChange={setStatus} options={statusOptions} />
    </div>
    <p className="mb-3 text-sm text-muted-foreground">{rows.length} of {users.length} users</p>
    <DataTable rows={rows} columns={columns} empty="No users match these filters." actions={(u) => <>
      <Button size="sm" variant="outline" onClick={() => setOpen(u)}><Eye /> View</Button>
      {u.status === "suspended"
        ? <Button size="sm" variant="secondary" onClick={() => update(u.id, { status: "active" }, `Reinstated ${u.name}`)}><UserCheck /> Reinstate</Button>
        : <Button size="sm" variant="outline" onClick={() => ask({ title: `Suspend ${u.name}?`, body: "They will be signed out of the app and website until reinstated.", confirm: "Suspend", destructive: true, run: () => update(u.id, { status: "suspended" }, `Suspended ${u.name}`) })}><Ban /> Suspend</Button>}
    </>} />

    <Dialog open={!!open} onOpenChange={(o) => { if (!o) setOpen(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {open && <>
          <DialogHeader><DialogTitle className="font-serif text-3xl font-normal">{open.name}</DialogTitle><DialogDescription>{open.email} · joined {open.joined}</DialogDescription></DialogHeader>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {[["XP", open.xp.toLocaleString()], ["Streak", `${open.streak} days`], ["Hifz", open.hifzJuz ? `${open.hifzJuz} juz` : "Not started"], ["Kids", open.kids], ["City", open.city], ["Last active", open.lastActive]].map(([l, v]) => <div key={String(l)} className="border-2 border-foreground p-2"><dt className="text-xs uppercase text-muted-foreground">{l}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plan"><Choice label="Plan" className="w-full" value={open.plan} onChange={(p) => update(open.id, { plan: p }, `Moved ${open.name} to ${planNames[p]}`)} options={Object.entries(planNames) as [Plan, string][]} /></Field>
            <Field label="Role"><Choice label="Role" className="w-full" value={open.role} onChange={(r) => update(open.id, { role: r }, `Changed ${open.name}'s role to ${r}`)} options={roleOptions.slice(1) as unknown as [Role, string][]} /></Field>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => update(open.id, { streak: 0 }, `Reset streak for ${open.name}`)}><RotateCcw /> Reset streak</Button>
            <Button variant="outline" onClick={() => { record(`Sent password reset to ${open.email}`); toast.success(`Password reset sent to ${open.email} (demo)`); }}>Send password reset</Button>
            {open.status !== "suspended"
              ? <Button variant="destructive" onClick={() => update(open.id, { status: "suspended" }, `Suspended ${open.name}`)}><Ban /> Suspend</Button>
              : <Button variant="secondary" onClick={() => update(open.id, { status: "active" }, `Reinstated ${open.name}`)}><UserCheck /> Reinstate</Button>}
          </DialogFooter>
        </>}
      </DialogContent>
    </Dialog>

    <InviteDialog open={inviting} onOpenChange={setInviting} onInvite={(u) => { setUsers((l) => [u, ...l]); record(`Invited ${u.email}`); toast.success(`Invite sent to ${u.email} (demo)`); }} />
    {dialog}
  </Page>;
}

function InviteDialog({ open, onOpenChange, onInvite }: { open: boolean; onOpenChange: (o: boolean) => void; onInvite: (u: AdminUser) => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "learner" as Role, plan: "free" as Plan });
  const submit = () => {
    if (!form.name.trim()) { toast.error("Add a name"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Add a valid email"); return; }
    const today = new Date().toISOString().slice(0, 10);
    onInvite({ id: uid(), ...form, status: "invited", city: "—", joined: today, lastActive: today, streak: 0, xp: 0, kids: 0, hifzJuz: 0 });
    setForm({ name: "", email: "", role: "learner", plan: "free" }); onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>Invite a user</DialogTitle><DialogDescription>They’ll get an email to set up their IlmStation account.</DialogDescription></DialogHeader>
    <div className="grid gap-3">
      <Field label="Full name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Role"><Choice label="Role" className="w-full" value={form.role} onChange={(role) => setForm({ ...form, role })} options={roleOptions.slice(1) as unknown as [Role, string][]} /></Field>
        <Field label="Plan"><Choice label="Plan" className="w-full" value={form.plan} onChange={(plan) => setForm({ ...form, plan })} options={Object.entries(planNames) as [Plan, string][]} /></Field>
      </div>
    </div>
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Send invite</Button></DialogFooter>
  </DialogContent></Dialog>;
}
