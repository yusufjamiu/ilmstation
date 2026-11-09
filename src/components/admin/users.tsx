import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, Eye, RotateCcw, UserCheck } from "lucide-react";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { planNames, type Plan, type Role } from "./data";
import { Choice, DataTable, Field, Page, Pill, SearchBox, useAudit, useConfirm, type Column } from "./ui";

type Status = "active" | "suspended";
type User = {
  id: string; name: string; email: string; username: string; zone: string; gender: string;
  level: string; xp: number; joined: string; plan: Plan; role: Role; status: Status;
};

const zoneNames: Record<string, string> = { kids: "Kids", youth: "Teens & Young Adults", adult: "Adult" };
const planOptions = [["all", "All plans"], ...Object.entries(planNames)] as [Plan | "all", string][];
const zoneOptions = [["all", "All zones"], ["kids", "Kids"], ["youth", "Teens & Young Adults"], ["adult", "Adult"]] as const;
const statusOptions = [["all", "Any status"], ["active", "Active"], ["suspended", "Suspended"]] as const;
const roleOptions = [["learner", "Learner"], ["guardian", "Guardian"], ["teacher", "Teacher"]] as [Role, string][];

/** Real users: "profiles" (what they signed up with) + "userAdmin" (what admins set). */
async function loadUsers(): Promise<User[]> {
  const [profiles, extras] = await Promise.all([getDocs(collection(db, "profiles")), getDocs(collection(db, "userAdmin"))]);
  const extra = new Map(extras.docs.map((d) => [d.id, d.data()]));
  return profiles.docs.map((d) => {
    const p = d.data();
    const x = extra.get(d.id) ?? {};
    return {
      id: d.id,
      name: p.name ?? "—",
      email: p.email ?? "—",
      username: p.username ?? "",
      zone: p.zone ?? "",
      gender: p.gender ?? "",
      level: p.level ?? "",
      xp: Number(p.xp ?? 0),
      joined: String(p.createdAt ?? "").slice(0, 10),
      plan: (x.plan as Plan) ?? "free",
      role: (x.role as Role) ?? "learner",
      status: (x.status as Status) ?? "active",
    };
  }).sort((a, b) => b.joined.localeCompare(a.joined));
}

export function UsersSection() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<Plan | "all">("all");
  const [zone, setZone] = useState<string>("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [open, setOpen] = useState<User | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  const refresh = () => {
    setError("");
    loadUsers().then(setUsers).catch(() => setError("Couldn't load users. Check that admins can read profiles in your Firestore rules."));
  };
  useEffect(refresh, []);

  const rows = useMemo(() => (users ?? []).filter((u) =>
    (plan === "all" || u.plan === plan) && (zone === "all" || u.zone === zone) && (status === "all" || u.status === status) &&
    `${u.name} ${u.email} ${u.username}`.toLowerCase().includes(q.toLowerCase())), [users, q, plan, zone, status]);

  const update = async (id: string, patch: Partial<Pick<User, "plan" | "role" | "status">>, msg: string) => {
    try {
      await setDoc(doc(db, "userAdmin", id), { ...patch, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid ?? null }, { merge: true });
      setUsers((list) => list?.map((u) => (u.id === id ? { ...u, ...patch } : u)) ?? list);
      setOpen((o) => (o?.id === id ? { ...o, ...patch } : o));
      record(msg); toast.success(msg);
    } catch {
      toast.error("Couldn't save. Check your Firestore rules for userAdmin.");
    }
  };

  const columns: Column<User>[] = [
    { key: "name", label: "User", render: (u) => <div className="min-w-0"><p className="font-semibold">{u.name}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div> },
    { key: "zone", label: "Zone", render: (u) => zoneNames[u.zone] ?? "—" },
    { key: "gender", label: "Gender", render: (u) => <span className="capitalize">{u.gender || "—"}</span>, mobile: false },
    { key: "plan", label: "Plan", render: (u) => planNames[u.plan] },
    { key: "xp", label: "XP", render: (u) => <span className="tabular-nums">{u.xp.toLocaleString()}</span>, className: "text-right" },
    { key: "joined", label: "Joined", render: (u) => <span className="tabular-nums">{u.joined || "—"}</span>, mobile: false },
    { key: "status", label: "Status", render: (u) => <Pill value={u.status} /> },
  ];

  return <Page eyebrow="People" title="Users" actions={<Button variant="outline" onClick={refresh}><RotateCcw /> Refresh</Button>}>
    <div className="mb-4 flex flex-wrap gap-2">
      <SearchBox value={q} onChange={setQ} placeholder="Search name, email or username" />
      <Choice label="Filter by zone" value={zone} onChange={setZone} options={zoneOptions as unknown as [string, string][]} />
      <Choice label="Filter by plan" value={plan} onChange={setPlan} options={planOptions} />
      <Choice label="Filter by status" value={status} onChange={setStatus} options={statusOptions as unknown as [Status | "all", string][]} />
    </div>

    {error && <p role="alert" className="mb-3 border-2 border-destructive p-3 text-sm font-semibold text-destructive">{error}</p>}
    {!users && !error && <p className="text-sm text-muted-foreground">Loading users…</p>}

    {users && <>
      <p className="mb-3 text-sm text-muted-foreground">{rows.length} of {users.length} users</p>
      <DataTable rows={rows} columns={columns} empty="No users match these filters." actions={(u) => <>
        <Button size="sm" variant="outline" onClick={() => setOpen(u)}><Eye /> View</Button>
        {u.status === "suspended"
          ? <Button size="sm" variant="secondary" onClick={() => update(u.id, { status: "active" }, `Reinstated ${u.name}`)}><UserCheck /> Reinstate</Button>
          : <Button size="sm" variant="outline" onClick={() => ask({ title: `Suspend ${u.name}?`, body: "They will be marked as suspended.", confirm: "Suspend", destructive: true, run: () => { void update(u.id, { status: "suspended" }, `Suspended ${u.name}`); } })}><Ban /> Suspend</Button>}
      </>} />
    </>}

    <Dialog open={!!open} onOpenChange={(o) => { if (!o) setOpen(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {open && <>
          <DialogHeader><DialogTitle className="font-serif text-3xl font-normal">{open.name}</DialogTitle><DialogDescription>{open.email}{open.username && ` · @${open.username}`} · joined {open.joined || "—"}</DialogDescription></DialogHeader>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {[["XP", open.xp.toLocaleString()], ["Zone", zoneNames[open.zone] ?? "—"], ["Gender", open.gender || "—"], ["Level", open.level || "—"], ["Status", open.status], ["Plan", planNames[open.plan]]].map(([l, v]) =>
              <div key={l} className="border-2 border-foreground p-2"><dt className="text-xs uppercase text-muted-foreground">{l}</dt><dd className="font-semibold capitalize">{v}</dd></div>)}
          </dl>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plan"><Choice label="Plan" className="w-full" value={open.plan} onChange={(p) => update(open.id, { plan: p }, `Moved ${open.name} to ${planNames[p]}`)} options={Object.entries(planNames) as [Plan, string][]} /></Field>
            <Field label="Role"><Choice label="Role" className="w-full" value={open.role} onChange={(r) => update(open.id, { role: r }, `Changed ${open.name}'s role to ${r}`)} options={roleOptions} /></Field>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            {open.status !== "suspended"
              ? <Button variant="destructive" onClick={() => update(open.id, { status: "suspended" }, `Suspended ${open.name}`)}><Ban /> Suspend</Button>
              : <Button variant="secondary" onClick={() => update(open.id, { status: "active" }, `Reinstated ${open.name}`)}><UserCheck /> Reinstate</Button>}
          </DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </Page>;
}
