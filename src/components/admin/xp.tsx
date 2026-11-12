import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cleanLevels, LEVEL_DEFAULTS, mergeXp, XP_DEFAULTS, XP_LABELS, type LevelDef, type XpAction, type XpConfig, type XpRule } from "@/lib/xp-config";
import { Field, inputCls, Page, Panel, useAudit } from "./ui";

export function XpSection() {
  const [cfg, setCfg] = useState<XpConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState<LevelDef[] | null>(null);
  const { record } = useAudit();
  useEffect(() => { getDoc(doc(db, "siteConfig", "xp")).then((s) => setCfg(mergeXp(s.data()))).catch(() => setCfg(mergeXp(null))); }, []);
  useEffect(() => { getDoc(doc(db, "siteConfig", "levels")).then((s) => setLevels(cleanLevels(s.get("list")))).catch(() => setLevels(LEVEL_DEFAULTS)); }, []);
  if (!cfg || !levels) return <Page eyebrow="App" title="XP rewards"><p className="text-sm text-muted-foreground">Loading…</p></Page>;

  const set = (k: XpAction, patch: Partial<XpRule>) => setCfg({ ...cfg, [k]: { ...cfg[k], ...patch } });
  const num = (v: string) => Math.max(0, Math.min(100_000, Math.floor(Number(v) || 0)));
  const save = async () => {
    setSaving(true);
    try { const lv = levels.filter((l) => l.name.trim()).map((l) => ({ name: l.name.trim(), xp: l.xp, perks: l.perks.map((x) => x.trim()).filter(Boolean) })).sort((a, b) => a.xp - b.xp); if (lv.length) lv[0]!.xp = 0; await setDoc(doc(db, "siteConfig", "xp"), { ...cfg, updatedAt: Date.now() }); await setDoc(doc(db, "siteConfig", "levels"), { list: lv, updatedAt: Date.now() }); setLevels(lv); record("Updated XP rewards"); toast.success("Saved. New amounts apply straight away."); }
    catch { toast.error("Couldn't save. Check you are an admin."); } finally { setSaving(false); }
  };

  return <Page eyebrow="App · learning rewards" title="XP rewards" actions={<>
    <Button variant="outline" onClick={() => { setCfg(mergeXp(null)); setLevels(LEVEL_DEFAULTS); }}><RotateCcw /> Defaults</Button>
    <Button disabled={saving} onClick={() => void save()}><Save /> {saving ? "Saving…" : "Save changes"}</Button>
  </>}>
    <p className="mb-5 max-w-2xl text-sm text-muted-foreground">How much XP each action gives. The <b>daily limit</b> is the most XP someone can get from that action in one day, which stops people farming it. Changes apply as soon as you save.</p>
    <div className="grid gap-4 lg:grid-cols-2">
      {(Object.keys(XP_DEFAULTS) as XpAction[]).map((k) => {
        const r = cfg[k]; const L = XP_LABELS[k];
        return <Panel key={k} title={L.label} tag={r.on ? "On" : "Off"}>
          <p className="-mt-1 mb-3 text-xs text-muted-foreground">{L.hint}</p>
          <div className={`grid gap-3 sm:grid-cols-2 ${r.on ? "" : "opacity-50"}`}>
            <Field label={L.amount}><input type="number" min={0} className={inputCls} value={r.amount} onChange={(e) => set(k, { amount: num(e.target.value) })} /></Field>
            <Field label="Daily limit"><input type="number" min={0} className={inputCls} value={r.cap} onChange={(e) => set(k, { cap: num(e.target.value) })} /></Field>
            {k === "daily" && <>
              <Field label="Bonus at 7-day streaks"><input type="number" min={0} className={inputCls} value={r.bonus7 ?? 0} onChange={(e) => set(k, { bonus7: num(e.target.value) })} /></Field>
              <Field label="Bonus at 30-day streaks"><input type="number" min={0} className={inputCls} value={r.bonus30 ?? 0} onChange={(e) => set(k, { bonus30: num(e.target.value) })} /></Field>
            </>}
            {k === "ramadan" && <Field label="Bonus for finishing the day"><input type="number" min={0} className={inputCls} value={r.bonus ?? 0} onChange={(e) => set(k, { bonus: num(e.target.value) })} /></Field>}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={r.on} onChange={(e) => set(k, { on: e.target.checked })} /> Give XP for this</label>
        </Panel>;
      })}
    </div>
    <div className="mt-8">
      <Panel title="Levels" tag={`${levels.length} levels`}>
        <p className="-mt-1 mb-3 text-xs text-muted-foreground">Users move up as their XP grows. The name and “what it gives” show on the Progress page and next to names on the leaderboard. The first level always starts at 0 XP.</p>
        <div className="mb-2 hidden gap-2 px-3 text-xs font-bold uppercase text-muted-foreground sm:grid sm:grid-cols-[2rem_1fr_7rem_2fr_auto]"><span>#</span><span>Name</span><span>XP needed</span><span>What it gives (one per line)</span><span /></div>
        <div className="grid gap-2">{levels.map((lv, i) => <div key={i} className="grid gap-2 border-2 border-foreground p-3 sm:grid-cols-[2rem_1fr_7rem_2fr_auto] sm:items-start">
          <span className="font-serif text-2xl">{i + 1}</span>
          <input className={inputCls} value={lv.name} placeholder="Name" onChange={(e) => setLevels(levels.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <input type="number" min={0} disabled={i === 0} className={inputCls} value={i === 0 ? 0 : lv.xp} onChange={(e) => setLevels(levels.map((x, j) => (j === i ? { ...x, xp: num(e.target.value) } : x)))} />
          <textarea rows={2} className={`${inputCls} h-auto py-2`} placeholder="What it gives (one per line)" value={lv.perks.join("\n")} onChange={(e) => setLevels(levels.map((x, j) => (j === i ? { ...x, perks: e.target.value.split("\n") } : x)))} />
          <Button size="sm" variant="outline" aria-label="Remove level" disabled={levels.length <= 1} onClick={() => setLevels(levels.filter((_, j) => j !== i))}><Trash2 /></Button>
        </div>)}</div>
        <Button variant="outline" className="mt-3" onClick={() => setLevels([...levels, { name: "New level", xp: (levels[levels.length - 1]?.xp ?? 0) + 1000, perks: [] }])}><Plus /> Add level</Button>
      </Panel>
    </div>
  </Page>;
}
