import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gift, Plus, Save, Trash2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { callPremium } from "@/components/premium";
import { mergePremium, QUIZ_TOPICS, type PlanDef, type PremiumConfig } from "@/lib/premium-config";
import { Field, inputCls, Page, Panel, useAudit } from "./ui";

export function PremiumSection() {
  const [cfg, setCfg] = useState<PremiumConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [gEmail, setGEmail] = useState("");
  const [gDays, setGDays] = useState(30);
  const { record } = useAudit();
  useEffect(() => { getDoc(doc(db, "siteConfig", "premium")).then((s) => setCfg(mergePremium(s.data()))).catch(() => setCfg(mergePremium(null))); }, []);
  if (!cfg) return <Page eyebrow="App" title="Premium"><p className="text-sm text-muted-foreground">Loading…</p></Page>;

  const num = (v: string) => Math.max(0, Math.floor(Number(v) || 0));
  const setPlan = (i: number, p: Partial<PlanDef>) => setCfg({ ...cfg, plans: cfg.plans.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const save = async () => {
    if (cfg.plans.some((p) => !p.name.trim())) { toast.error("Every plan needs a name"); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, "siteConfig", "premium"), { ...cfg, plans: cfg.plans.map((p) => ({ ...p, name: p.name.trim(), points: p.points.map((x) => x.trim()).filter(Boolean) })), updatedAt: Date.now() });
      record("Updated Premium settings"); toast.success("Saved. Changes apply straight away.");
    } catch { toast.error("Couldn't save. Check you are an admin."); } finally { setSaving(false); }
  };
  const grant = async () => {
    if (!/\S+@\S+\.\S+/.test(gEmail)) { toast.error("Enter their email"); return; }
    const r = await callPremium("grant", { email: gEmail, days: gDays });
    if (!r.ok) { toast.error(r.error ?? "Couldn't give Premium"); return; }
    record(`Gave ${gDays} days of Premium to ${gEmail}`);
    toast.success(`Premium until ${new Date(r.until ?? 0).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
    setGEmail("");
  };

  return <Page eyebrow="App · subscriptions" title="Premium" actions={<Button disabled={saving} onClick={() => void save()}><Save /> {saving ? "Saving…" : "Save changes"}</Button>}>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Free trial" tag={cfg.trialDays ? `${cfg.trialDays} days` : "Off"}>
        <Field label="Days of Premium for new accounts (0 = no trial)"><input type="number" min={0} className={inputCls} value={cfg.trialDays} onChange={(e) => setCfg({ ...cfg, trialDays: num(e.target.value) })} /></Field>
        <p className="mt-2 text-xs text-muted-foreground">Each account gets the trial once, the first time it opens the app. No card needed.</p>
      </Panel>
      <Panel title="Give Premium" tag="By email">
        <div className="grid gap-2 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
          <Field label="Their IlmStation email"><input className={inputCls} value={gEmail} onChange={(e) => setGEmail(e.target.value)} placeholder="name@example.com" /></Field>
          <Field label="Days"><input type="number" min={1} className={inputCls} value={gDays} onChange={(e) => setGDays(num(e.target.value) || 1)} /></Field>
          <Button onClick={() => void grant()}><Gift /> Give</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Adds days on top of any Premium they already have. Works on the live site.</p>
      </Panel>
    </div>

    <div className="mt-6"><Panel title="Plans" tag={`${cfg.plans.filter((p) => p.visible).length} shown`}>
      <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg.usdAbroad} onChange={(e) => setCfg({ ...cfg, usdAbroad: e.target.checked })} /> Charge in US dollars ($) outside Nigeria (your Paystack account must be approved for USD first)</label>
      <div className="grid gap-3 lg:grid-cols-2">{cfg.plans.map((p, i) => <div key={i} className={`grid gap-2 border-2 border-foreground p-3 ${p.visible ? "" : "opacity-60"}`}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_7rem_6rem_6rem]">
          <Field label="Name"><input className={inputCls} value={p.name} onChange={(e) => setPlan(i, { name: e.target.value })} /></Field>
          <Field label="Price (₦, 0 = quote)"><input type="number" min={0} className={inputCls} value={p.price} onChange={(e) => setPlan(i, { price: num(e.target.value) })} /></Field>
          <Field label="Price ($)"><input type="number" min={0} step={0.01} className={inputCls} value={p.priceUsd ?? 0} onChange={(e) => setPlan(i, { priceUsd: Math.max(0, Number(e.target.value) || 0) })} /></Field>
          <Field label="Per"><select className={inputCls} value={p.period} onChange={(e) => setPlan(i, { period: e.target.value as PlanDef["period"] })}><option value="month">month</option><option value="year">year</option></select></Field>
        </div>
        <Field label="Who it’s for"><input className={inputCls} value={p.seats} onChange={(e) => setPlan(i, { seats: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Adult seats (incl. payer)"><input type="number" min={1} className={inputCls} value={p.adults ?? 1} onChange={(e) => setPlan(i, { adults: Math.max(1, num(e.target.value)) })} /></Field>
          <Field label="Child seats"><input type="number" min={0} className={inputCls} value={p.kids} onChange={(e) => setPlan(i, { kids: num(e.target.value) })} /></Field>
        </div>
        <Field label="What’s included (one per line)"><textarea rows={3} className={`${inputCls} h-auto py-2`} value={p.points.join("\n")} onChange={(e) => setPlan(i, { points: e.target.value.split("\n") })} /></Field>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.visible} onChange={(e) => setPlan(i, { visible: e.target.checked })} /> Show to users</label>
          <Button size="sm" variant="outline" aria-label="Remove plan" onClick={() => { if (window.confirm(`Remove ${p.name}?`)) setCfg({ ...cfg, plans: cfg.plans.filter((_, j) => j !== i) }); }}><Trash2 /></Button>
        </div>
      </div>)}</div>
      <Button variant="outline" className="mt-3" onClick={() => setCfg({ ...cfg, plans: [...cfg.plans, { id: `plan-${Date.now().toString(36)}`, name: "New plan", price: 0, period: "month", seats: "", kids: 0, points: [], visible: false }] })}><Plus /> Add plan</Button>
    </Panel></div>

    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <Panel title="Points → Premium" tag={`${cfg.redeem.filter((o) => o.on).length} options`}>
        <p className="mb-3 mt-2 text-xs text-muted-foreground">Users earn points when they reach a new level (set in XP rewards → Levels). Here they swap points for Premium days (Wallet & store → Use points).</p>
        <div className="grid gap-2">{cfg.redeem.map((o, i) => <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
          <Field label="Points"><input type="number" min={1} className={inputCls} value={o.points} onChange={(e) => setCfg({ ...cfg, redeem: cfg.redeem.map((x, j) => (j === i ? { ...x, points: num(e.target.value) } : x)) })} /></Field>
          <Field label="Days of Premium"><input type="number" min={1} className={inputCls} value={o.days} onChange={(e) => setCfg({ ...cfg, redeem: cfg.redeem.map((x, j) => (j === i ? { ...x, days: num(e.target.value) } : x)) })} /></Field>
          <label className="flex h-10 items-center gap-1 text-sm"><input type="checkbox" checked={o.on} onChange={(e) => setCfg({ ...cfg, redeem: cfg.redeem.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)) })} /> On</label>
          <Button size="sm" variant="outline" aria-label="Remove" onClick={() => setCfg({ ...cfg, redeem: cfg.redeem.filter((_, j) => j !== i) })}><Trash2 /></Button>
        </div>)}</div>
        <Button variant="outline" className="mt-3" onClick={() => setCfg({ ...cfg, redeem: [...cfg.redeem, { points: 3000, days: 10, on: true }] })}><Plus /> Add option</Button>
      </Panel>

      <Panel title="What is Premium" tag="Across the app">
        <p className="-mt-1 mb-2 text-sm font-semibold">Premium quiz topics</p>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">{QUIZ_TOPICS.map((t) => <label key={t} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg.premiumTopics.includes(t)} onChange={(e) => setCfg({ ...cfg, premiumTopics: e.target.checked ? [...cfg.premiumTopics, t] : cfg.premiumTopics.filter((x) => x !== t) })} /> {t}</label>)}</div>
        <div className="mt-3"><Field label="Points to unlock one Premium topic"><input type="number" min={0} className={inputCls} value={cfg.topicCost} onChange={(e) => setCfg({ ...cfg, topicCost: num(e.target.value) })} /></Field></div>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg.cardMarkPerk} onChange={(e) => setCfg({ ...cfg, cardMarkPerk: e.target.checked })} /> Premium members can remove the IlmStation mark on cards</label>
        <p className="mt-3 text-xs text-muted-foreground">Books, card designs and Study lessons are set one by one in their own admin pages (Free or Premium, points price, free from level).</p>
      </Panel>
    </div>
  </Page>;
}
