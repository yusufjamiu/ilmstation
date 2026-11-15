import { PlanRequests } from "./plan-requests";
import { FEATURE_LIMITS, FEATURE_TICKS } from "@/lib/premium-config";
import { lagosDate, type Period, type Promo } from "@/lib/premium-config";
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
        <Field label="Name"><input className={inputCls} value={p.name} onChange={(e) => setPlan(i, { name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Field label="₦ per month"><input type="number" min={0} className={inputCls} value={p.priceMonthly ?? 0} onChange={(e) => setPlan(i, { priceMonthly: num(e.target.value) })} /></Field>
          <Field label="₦ per year"><input type="number" min={0} className={inputCls} value={p.priceYearly ?? 0} onChange={(e) => setPlan(i, { priceYearly: num(e.target.value) })} /></Field>
          <Field label="$ per month"><input type="number" min={0} step={0.01} className={inputCls} value={p.usdMonthly ?? 0} onChange={(e) => setPlan(i, { usdMonthly: Math.max(0, Number(e.target.value) || 0) })} /></Field>
          <Field label="$ per year"><input type="number" min={0} step={0.01} className={inputCls} value={p.usdYearly ?? 0} onChange={(e) => setPlan(i, { usdYearly: Math.max(0, Number(e.target.value) || 0) })} /></Field>
        </div>
        <p className="-mt-1 text-xs text-muted-foreground">0 = not offered. Both ₦ prices at 0 = “Ask for a quote”. $ prices are only used outside Nigeria when dollars are on.</p>
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
    <div className="mt-6"><PlanRequests /></div>
    <div className="mt-6"><Panel title="Premium features" tag="Free vs Premium">
      <p className="-mt-1 mb-3 text-xs text-muted-foreground">Daily limits reset at midnight (Nigeria time). 0 = unlimited. Game minutes are set in Games & quizzes. Books and audio are set per book in Library.</p>
      <div className="grid gap-2">
        <div className="hidden grid-cols-[1fr_4rem_6rem_6rem] gap-2 text-xs font-bold uppercase text-muted-foreground sm:grid"><span>Limit per day</span><span>On</span><span>Free</span><span>Premium</span></div>
        {FEATURE_LIMITS.map((f) => { const v = cfg.features[f.id]; const setF = (patch: Partial<typeof v>) => setCfg({ ...cfg, features: { ...cfg.features, [f.id]: { ...v, ...patch } } }); return <div key={f.id} className={`grid grid-cols-[1fr_4rem_6rem_6rem] items-center gap-2 ${v.on ? "" : "opacity-60"}`}>
          <span className="text-sm font-semibold">{f.label}</span>
          <input type="checkbox" checked={v.on} onChange={(e) => setF({ on: e.target.checked })} aria-label={`${f.label} limit on`} />
          <input type="number" min={0} className={inputCls} value={v.free} onChange={(e) => setF({ free: num(e.target.value) })} aria-label="Free" />
          <input type="number" min={0} className={inputCls} value={v.premium} onChange={(e) => setF({ premium: num(e.target.value) })} aria-label="Premium" />
        </div>; })}
      </div>
      <p className="mt-5 text-sm font-bold">Premium only</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">{FEATURE_TICKS.map((t) => <label key={t.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!cfg.ticks[t.id]} onChange={(e) => setCfg({ ...cfg, ticks: { ...cfg.ticks, [t.id]: e.target.checked } })} /> {t.label}</label>)}</div>
    </Panel></div>
    <div className="mt-6"><Panel title="Promotions" tag={`${cfg.promos.filter((x) => x.on).length} on`}>
      <p className="-mt-1 mb-3 text-xs text-muted-foreground">Discounts for Ramadan, Eid or any offer. It applies to everyone automatically between the dates. Switch it off to end it early.</p>
      <div className="grid gap-3">{cfg.promos.map((x, i) => {
        const setP = (patch: Partial<Promo>) => setCfg({ ...cfg, promos: cfg.promos.map((y, j) => (j === i ? { ...y, ...patch } : y)) });
        const allIds = cfg.plans.map((pl) => pl.id);
        const cur = x.plans?.length ? x.plans : allIds;
        return <div key={x.id} className={`grid gap-2 border-2 border-foreground p-3 ${x.on ? "" : "opacity-60"}`}>
          <div className="grid gap-2 sm:grid-cols-[1fr_6rem_10rem_10rem]">
            <Field label="Name"><input className={inputCls} value={x.name} onChange={(e) => setP({ name: e.target.value })} /></Field>
            <Field label="% off"><input type="number" min={1} max={90} className={inputCls} value={x.percent} onChange={(e) => setP({ percent: Math.max(0, Math.min(90, Number(e.target.value) || 0)) })} /></Field>
            <Field label="Starts"><input type="date" className={inputCls} value={x.start} onChange={(e) => setP({ start: e.target.value })} /></Field>
            <Field label="Ends"><input type="date" className={inputCls} value={x.end} onChange={(e) => setP({ end: e.target.value })} /></Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
                        <Field label="Banner text (optional, shown on the Premium page)"><input className={inputCls} value={x.banner ?? ""} placeholder="25% off all plans this Ramadan 🌙" onChange={(e) => setP({ banner: e.target.value })} /></Field>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold">Plans:</span>
            {cfg.plans.map((pl) => <label key={pl.id} className="flex items-center gap-1"><input type="checkbox" checked={cur.includes(pl.id)} onChange={(e) => { const next = e.target.checked ? [...new Set([...cur, pl.id])] : cur.filter((id) => id !== pl.id); setP({ plans: next.length === allIds.length ? [] : next }); }} /> {pl.name}</label>)}
            <span className="font-semibold">Billing:</span>
            {(["month", "year"] as Period[]).map((per) => { const pc = x.periods?.length ? x.periods : (["month", "year"] as Period[]); return <label key={per} className="flex items-center gap-1"><input type="checkbox" checked={pc.includes(per)} onChange={(e) => { const next = e.target.checked ? [...new Set([...pc, per])] : pc.filter((q) => q !== per); setP({ periods: next.length === 2 ? [] : next }); }} /> {per === "month" ? "Monthly" : "Yearly"}</label>; })}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={x.on} onChange={(e) => setP({ on: e.target.checked })} /> On</label>
            <Button size="sm" variant="outline" aria-label="Remove promotion" onClick={() => setCfg({ ...cfg, promos: cfg.promos.filter((_, j) => j !== i) })}><Trash2 /></Button>
          </div>
        </div>;
      })}</div>
      <Button variant="outline" className="mt-3" onClick={() => setCfg({ ...cfg, promos: [...cfg.promos, { id: `promo-${Date.now().toString(36)}`, name: "Ramadan offer", percent: 20, plans: [], periods: [], start: lagosDate(), end: lagosDate(Date.now() + 30 * 86_400_000), code: "", banner: "", on: true }] })}><Plus /> Add promotion</Button>
    </Panel></div>
  </Page>;
}
