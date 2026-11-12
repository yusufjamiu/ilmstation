import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { seedSponsors, sponsorTiers, type Sponsor, type SponsorStatus } from "./data";
import { naira, useAdminStore } from "./store";
import { SponsorTiersSection } from "./sponsor-tiers";
import { Choice, Field, inputCls, Kpi, Page, Pill, useAudit } from "./ui";

const stages: [SponsorStatus, string][] = [["new", "New"], ["contacted", "Contacted"], ["active", "Active"], ["declined", "Declined"]];

export function SponsorsSection() {
  const [sponsors, setSponsors] = useAdminStore<Sponsor[]>("sponsors", seedSponsors);
  const [open, setOpen] = useState<Sponsor | null>(null);
  const { record } = useAudit();
  const [tab, setTab] = useState<"sponsors" | "tiers">("sponsors");
  const tabs = <div className="mb-5 flex flex-wrap gap-2">
    <Button variant={tab === "sponsors" ? "default" : "outline"} onClick={() => setTab("sponsors")}>Sponsors</Button>
    <Button variant={tab === "tiers" ? "default" : "outline"} onClick={() => setTab("tiers")}>Tiers & prices</Button>
  </div>;
  const active = sponsors.filter((s) => s.status === "active");
  if (tab === "tiers") return <SponsorTiersSection tabs={tabs} />;

  const move = (s: Sponsor, status: SponsorStatus) => {
    setSponsors((l) => l.map((x) => (x.id === s.id ? { ...x, status } : x)));
    setOpen((o) => (o?.id === s.id ? { ...o, status } : o));
    record(`Moved sponsor ${s.org || s.name} to ${status}`);
  };

  return <Page eyebrow="Web · sadaqah jariyah" title="Sponsorships">
    {tabs}
    <p className="mb-4 border-2 border-dashed border-foreground p-3 text-xs text-muted-foreground">Sample data for now. Real enquiries will appear here once the /sponsorship form is connected.</p>
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Monthly pledged" value={naira(active.reduce((s, x) => s + x.monthly, 0))} tone="secondary" />
      <Kpi label="Learners funded" value={active.reduce((s, x) => s + x.learners, 0).toLocaleString()} />
      <Kpi label="Active sponsors" value={String(active.length)} />
      <Kpi label="In pipeline" value={naira(sponsors.filter((s) => s.status === "new" || s.status === "contacted").reduce((s, x) => s + x.monthly, 0))} note="New + contacted" tone="primary" />
    </div>
    {/* Pipeline board: columns on desktop, horizontal scroll on phones. */}
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[720px] grid-cols-4 gap-3">{stages.map(([stage, label]) => {
        const items = sponsors.filter((s) => s.status === stage);
        return <div key={stage} className={cn("border-2 border-foreground p-2", stage === "active" ? "bg-secondary/20" : "bg-muted")}>
          <p className="mb-2 flex justify-between px-1 text-xs font-bold uppercase"><span>{label}</span><span>{items.length}</span></p>
          <div className="grid gap-2">{items.map((s) => <button key={s.id} onClick={() => setOpen(s)} className="border-2 border-foreground bg-card p-3 text-left text-sm shadow-brutal-sm hover:-translate-y-0.5">
            <p className="font-semibold">{s.org || s.name}</p>
            <p className="text-xs text-muted-foreground">{sponsorTiers[s.tier]} · {s.learners} learners</p>
            <p className="mt-1 font-serif text-xl tabular-nums">{naira(s.monthly)}<span className="text-xs">/mo</span></p>
          </button>)}{!items.length && <p className="p-2 text-xs text-muted-foreground">Empty</p>}</div>
        </div>;
      })}</div>
    </div>

    <Dialog open={!!open} onOpenChange={(o) => { if (!o) setOpen(null); }}><DialogContent>
      {open && <>
        <DialogHeader><DialogTitle>{open.org || open.name}</DialogTitle><DialogDescription>{open.name} · {open.email} · enquired {open.at}</DialogDescription></DialogHeader>
        <dl className="grid grid-cols-3 gap-2 text-sm">{[["Tier", sponsorTiers[open.tier]], ["Learners", open.learners], ["Monthly", naira(open.monthly)]].map(([l, v]) => <div key={String(l)} className="border-2 border-foreground p-2"><dt className="text-xs uppercase text-muted-foreground">{l}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
        <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Stage</span><Pill value={open.status} /><Choice label="Stage" className="ml-auto" value={open.status} onChange={(st) => move(open, st)} options={stages} /></div>
        <Field label="Internal note"><textarea rows={3} className={inputCls} value={open.note} onChange={(e) => { const note = e.target.value; setOpen({ ...open, note }); setSponsors((l) => l.map((x) => (x.id === open.id ? { ...x, note } : x))); }} /></Field>
        <DialogFooter><Button variant="outline" asChild><a href={`mailto:${open.email}`}><Mail /> Email sponsor</a></Button><Button onClick={() => { record(`Sent impact report to ${open.org || open.name}`); toast.success("Impact report queued (demo)"); }}>Send impact report</Button></DialogFooter>
      </>}
    </DialogContent></Dialog>
  </Page>;
}
