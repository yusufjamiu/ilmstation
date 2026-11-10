import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { roleAccess, type AdminRole } from "./data";
import { Field, inputCls, Panel, useAudit, useConfirm } from "./ui";

type Member = { id: string; role: AdminRole; name?: string; email?: string };
const ROLES: AdminRole[] = ["owner", "admin", "editor", "moderator", "support"];
const ORDER: Record<string, number> = { owner: 0, admin: 1, editor: 2, moderator: 3, support: 4 };

/** Team & roles, saved in Firebase (admins/{uid}). Only owners can see and change it. */
export function TeamPanel({ role: myRole }: { role: AdminRole }) {
  const isOwner = myRole === "owner";
  const canManage = isOwner || myRole === "admin";
  const pickable = ROLES.filter((r) => isOwner || r !== "owner");
  const me = auth.currentUser?.uid ?? "";
  const [team, setTeam] = useState<Member[] | null>(null);
  const [extra, setExtra] = useState<Record<string, { name?: string; email?: string }>>({});
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("moderator");
  const [busy, setBusy] = useState(false);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    if (!canManage) return undefined;
    return onSnapshot(collection(db, "admins"),
      (s) => setTeam(s.docs.map((d) => ({ ...(d.data() as Omit<Member, "id">), id: d.id })).sort((a, b) => (ORDER[a.role] ?? 9) - (ORDER[b.role] ?? 9))),
      () => setTeam([]));
  }, [canManage]);

  // names/emails for older admin records
  useEffect(() => {
    team?.filter((m) => !m.name && !extra[m.id]).forEach((m) => {
      getDoc(doc(db, "profiles", m.id)).then((p) => {
        if (p.exists()) setExtra((x) => ({ ...x, [m.id]: { name: p.get("name"), email: p.get("email") } }));
      }).catch(() => {});
    });
  }, [team]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    try {
      const found = await getDoc(doc(db, "emails", e));
      if (!found.exists()) { toast.error("No IlmStation account uses this email. Ask them to sign up (or log in once) first."); return; }
      const uid = found.get("uid") as string;
      if (team?.some((m) => m.id === uid)) { toast("They’re already on the team."); return; }
      const p = await getDoc(doc(db, "profiles", uid)).catch(() => null);
      await setDoc(doc(db, "admins", uid), { role, email: e, name: (p?.get("name") as string) ?? "", addedBy: me || null, addedAt: serverTimestamp() });
      record(`Added ${e} to the team as ${role}`);
      toast.success(`Added as ${role}. They can open /admin with their account.`);
      setEmail("");
    } catch { toast.error("Couldn’t add. Only owners can manage the team."); } finally { setBusy(false); }
  };

  const changeRole = async (m: Member, r: AdminRole) => {
    try { await updateDoc(doc(db, "admins", m.id), { role: r }); record(`Changed ${m.email ?? m.id} to ${r}`); toast.success(`Role changed to ${r}`); }
    catch { toast.error("Couldn’t change the role."); }
  };

  const remove = (m: Member) => ask({
    title: `Remove ${m.name || m.email || "this person"} from the team?`, body: "They lose admin access straight away. Their normal IlmStation account stays.", confirm: "Remove", destructive: true,
    run: () => { void deleteDoc(doc(db, "admins", m.id)).then(() => { record(`Removed ${m.email ?? m.id} from the team`); toast.success("Removed"); }).catch(() => toast.error("Couldn’t remove.")); },
  });

  const guide = <dl className="mt-4 grid gap-1 text-xs">{ROLES.map((r) => <div key={r} className="flex gap-2"><dt className="w-20 shrink-0 font-bold uppercase">{r}</dt><dd className="text-muted-foreground">{roleAccess[r]}</dd></div>)}</dl>;

  if (!canManage) return <Panel title="Team & roles" tag="Owners & admins"><p className="text-sm text-muted-foreground">Only owners and admins can manage the team.</p>{guide}</Panel>;

  return <Panel title="Team & roles" tag={team ? `${team.length} ${team.length === 1 ? "person" : "people"}` : undefined}>
    {!team ? <p className="text-sm text-muted-foreground">Loading…</p> :
      <ul className="grid gap-2">{team.map((m) => {
        const self = m.id === me;
        const locked = self || (!isOwner && m.role === "owner");
        const name = m.name || extra[m.id]?.name || "—";
        const mail = m.email || extra[m.id]?.email || m.id;
        return <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-3">
          <div className="min-w-0"><p className="font-semibold">{name}{self && <span className="ml-2 text-xs font-bold uppercase text-muted-foreground">You</span>}</p><p className="truncate text-xs text-muted-foreground">{mail}</p></div>
          <div className="flex items-center gap-2">
            <select aria-label={`Role for ${name}`} className={`${inputCls} h-9 w-36 capitalize`} value={m.role} disabled={locked} onChange={(e) => void changeRole(m, e.target.value as AdminRole)}>
              {(locked ? ROLES : pickable).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button size="icon" variant="outline" aria-label={`Remove ${name}`} disabled={locked} onClick={() => remove(m)}><Trash2 /></Button>
          </div>
        </li>;
      })}</ul>}

    <div className="mt-4 grid gap-2 border-t-2 border-foreground pt-4 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-end">
      <Field label="Their IlmStation email"><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></Field>
      <Field label="Role"><select className={`${inputCls} capitalize`} value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>{pickable.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
      <Button disabled={busy} onClick={() => void add()}><UserPlus /> Add</Button>
    </div>
    <p className="mt-1 text-xs text-muted-foreground">They must already have an IlmStation account, and they log in to /admin with it.</p>
    {guide}
    {dialog}
  </Panel>;
}
