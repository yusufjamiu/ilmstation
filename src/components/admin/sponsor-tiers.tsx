import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { DEFAULT_SPONSOR, type SponsorConfig, type SponsorTier } from "@/components/sponsor-tiers";
import { Field, inputCls, Page, Panel, useAudit } from "./ui";

export function SponsorTiersSection({ tabs }: { tabs?: ReactNode } = {}) {
  const [cfg, setCfg] = useState<SponsorConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const { record } = useAudit();

  useEffect(() => {
    getDoc(doc(db, "siteConfig", "sponsorship"))
      .then((s) => setCfg(s.exists() ? { ...DEFAULT_SPONSOR, ...(s.data() as Partial<SponsorConfig>) } : DEFAULT_SPONSOR))
      .catch(() => setCfg(DEFAULT_SPONSOR));
  }, []);

  if (!cfg) return <Page eyebrow="Web · sadaqah jariyah" title="Sponsorships">{tabs}<p className="text-sm text-muted-foreground">Loading…</p></Page>;

  const setTier = (i: number, patch: Partial<SponsorTier>) => setCfg({ ...cfg, tiers: cfg.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const move = (i: number, d: number) => { const t = [...cfg.tiers]; const j = i + d; if (j < 0 || j >= t.length) return; [t[i], t[j]] = [t[j]!, t[i]!]; setCfg({ ...cfg, tiers: t }); };
  const add = () => setCfg({ ...cfg, tiers: [...cfg.tiers, { id: `t-${Date.now().toString(36)}`, name: "New tier", amount: "₦0", per: "per month", covers: "", perks: [], active: true }] });
  const remove = (i: number) => { if (window.confirm(`Remove "${cfg.tiers[i]?.name}"?`)) setCfg({ ...cfg, tiers: cfg.tiers.filter((_, j) => j !== i) }); };

  const save = async () => {
    if (cfg.tiers.some((t) => !t.name.trim() || !t.amount.trim())) return toast.error("Every tier needs a name and a price");
    setSaving(true);
    try {
      await setDoc(doc(db, "siteConfig", "sponsorship"), {
        ...cfg,
        tiers: cfg.tiers.map((t) => ({ ...t, name: t.name.trim(), amount: t.amount.trim(), perks: t.perks.map((p) => p.trim()).filter(Boolean) })),
        updatedAt: Date.now(),
      });
      record("Updated sponsorship tiers");
      toast.success("Saved. It's live on the website now.");
    } catch { toast.error("Couldn't save. Check you are an admin."); } finally { setSaving(false); }
  };

  return <Page eyebrow="Web · sadaqah jariyah" title="Sponsorships" actions={<Button disabled={saving} onClick={() => void save()}><Save /> {saving ? "Saving…" : "Save changes"}</Button>}>
    {tabs}
    <Panel title="Section text" tag="Homepage & /sponsorship">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Small heading"><input className={inputCls} value={cfg.eyebrow} onChange={(e) => setCfg({ ...cfg, eyebrow: e.target.value })} /></Field>
        <Field label="Headline"><input className={inputCls} value={cfg.headline} onChange={(e) => setCfg({ ...cfg, headline: e.target.value })} /></Field>
      </div>
      <div className="mt-3"><Field label="Intro"><textarea rows={2} className={`${inputCls} h-auto py-2`} value={cfg.intro} onChange={(e) => setCfg({ ...cfg, intro: e.target.value })} /></Field></div>
    </Panel>

    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      {cfg.tiers.map((t, i) => <div key={t.id} className={`grid content-start gap-3 border-2 border-foreground p-4 ${t.highlight ? "bg-primary/25" : "bg-background"} ${t.active === false ? "opacity-60" : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase text-muted-foreground">Tier {i + 1}{t.highlight ? " · highlighted" : ""}{t.active === false ? " · hidden" : ""}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
            <Button size="sm" variant="outline" aria-label="Move down" disabled={i === cfg.tiers.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
            <Button size="sm" variant="outline" aria-label="Remove" onClick={() => remove(i)}><Trash2 /></Button>
          </div>
        </div>
        <Field label="Name"><input className={inputCls} value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Price"><input className={inputCls} value={t.amount} onChange={(e) => setTier(i, { amount: e.target.value })} placeholder="₦500 or Custom" /></Field>
          <Field label="Period"><input className={inputCls} value={t.per} onChange={(e) => setTier(i, { per: e.target.value })} placeholder="per month" /></Field>
        </div>
        <Field label="What it covers"><input className={inputCls} value={t.covers} onChange={(e) => setTier(i, { covers: e.target.value })} /></Field>
        <Field label="What’s included (one per line)"><textarea rows={4} className={`${inputCls} h-auto py-2`} value={t.perks.join("\n")} onChange={(e) => setTier(i, { perks: e.target.value.split("\n") })} /></Field>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="highlight" checked={!!t.highlight} onChange={() => setCfg({ ...cfg, tiers: cfg.tiers.map((x, j) => ({ ...x, highlight: j === i })) })} /> Highlight</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={t.active !== false} onChange={(e) => setTier(i, { active: e.target.checked })} /> Visible</label>
        </div>
      </div>)}
      <button onClick={add} className="grid min-h-40 place-items-center border-2 border-dashed border-foreground text-sm font-semibold hover:bg-muted"><span className="flex items-center gap-2"><Plus className="size-4" /> Add tier</span></button>
    </div>
    <p className="mt-4 text-xs text-muted-foreground">Changes go live when you click Save changes.</p>
  </Page>;
}
