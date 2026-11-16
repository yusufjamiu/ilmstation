import { useEffect, useState, type ReactNode } from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { naira } from "./store";
import { Kpi, Page } from "./ui";

/** Real sponsors from the /sponsorship form: New → Contacted → Active → Declined. */
type S = { id: string; name: string; org: string; phone: string; email: string; message: string; status: string; createdAt: number; monthly?: number; learners?: number };
const COLS: [string, string][] = [["new", "New"], ["contacted", "Contacted"], ["active", "Active"], ["declined", "Declined"]];
const field = "h-9 w-full border-2 border-foreground bg-background px-2 text-sm";

export function RealSponsors({ tabs }: { tabs: ReactNode }) {
  const [rows, setRows] = useState<S[]>([]);
  useEffect(() => onSnapshot(query(collection(db, "partnerEnquiries"), orderBy("createdAt", "desc"), limit(300)),
    (s) => setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<S, "id">) })).filter((r) => (r as unknown as { kind?: string }).kind === "Sponsor")), () => {}), []);
  const save = (id: string, patch: Partial<S>) => void updateDoc(doc(db, "partnerEnquiries", id), patch).catch(() => toast.error("Couldn't save."));
  const active = rows.filter((r) => r.status === "active");
  const col = (k: string) => rows.filter((r) => (k === "declined" ? r.status === "declined" || r.status === "closed" : r.status === k));
  const tierOf = (m: string) => /^Tier: (.+)$/m.exec(m)?.[1] ?? "";
  const note = (m: string) => m.replace(/^Tier: .+\n?/m, "").trim();
  return <Page eyebrow="Web · Sadaqah jariyah" title="Sponsorships">
    {tabs}
    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Monthly pledged" value={naira(active.reduce((t, r) => t + Number(r.monthly ?? 0), 0))} note="Active sponsors" tone="secondary" />
      <Kpi label="Learners funded" value={active.reduce((t, r) => t + Number(r.learners ?? 0), 0).toLocaleString()} />
      <Kpi label="Active sponsors" value={String(active.length)} />
      <Kpi label="New enquiries" value={String(col("new").length)} note="Waiting for a reply" tone="primary" />
    </div>
    {!rows.length && <p className="mt-5 border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">No sponsor enquiries yet. They arrive here from the form on www.ilmstation.com/sponsorship.</p>}
    <div className="mt-5 grid gap-4 lg:grid-cols-4">{COLS.map(([k, label]) => { const list = col(k); return <div key={k} className={`border-2 border-foreground p-3 ${k === "active" ? "bg-secondary/20" : "bg-muted"}`}>
      <p className="mb-3 flex justify-between text-sm font-bold uppercase"><span>{label}</span><span>{list.length}</span></p>
      <div className="grid gap-3">{list.map((r) => <div key={r.id} className="grid gap-2 border-2 border-foreground bg-background p-3 shadow-brutal-sm">
        <p className="font-semibold leading-tight">{r.org || r.name}</p>
        <p className="text-xs text-muted-foreground">{[r.org ? r.name : "", tierOf(r.message), new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })].filter(Boolean).join(" · ")}</p>
        <p className="text-xs">{[r.phone, r.email].filter(Boolean).join(" · ")}</p>
        {note(r.message) && <p className="text-xs text-muted-foreground">“{note(r.message)}”</p>}
        {k === "active" && <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] font-bold uppercase">₦ per month<input type="number" min={0} className={field} defaultValue={r.monthly ?? 0} onBlur={(e) => save(r.id, { monthly: Math.max(0, Number(e.target.value) || 0) })} /></label>
          <label className="text-[10px] font-bold uppercase">Learners<input type="number" min={0} className={field} defaultValue={r.learners ?? 0} onBlur={(e) => save(r.id, { learners: Math.max(0, Number(e.target.value) || 0) })} /></label>
        </div>}
        <select className={field} value={r.status === "closed" ? "declined" : r.status} onChange={(e) => save(r.id, { status: e.target.value })}>{COLS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </div>)}</div>
    </div>; })}</div>
  </Page>;
}
