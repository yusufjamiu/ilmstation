import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import type { VoiceLangDef } from "@/components/study-core";
import { cleanVoiceLangs } from "@/components/voice-langs";
import { inputCls, Page, Panel, useAudit } from "./ui";

export function LanguagesSection() {
  const [list, setList] = useState<VoiceLangDef[] | null>(null);
  const [saving, setSaving] = useState(false);
  const { record } = useAudit();
  useEffect(() => { getDoc(doc(db, "siteConfig", "languages")).then((s) => setList(cleanVoiceLangs(s.get("voice")))).catch(() => setList(cleanVoiceLangs(null))); }, []);
  if (!list) return <Page eyebrow="App · Study" title="Languages"><p className="text-sm text-muted-foreground">Loading…</p></Page>;

  const set = (i: number, p: Partial<VoiceLangDef>) => setList(list.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const move = (i: number, d: number) => { const t = [...list]; const j = i + d; if (j < 0 || j >= t.length) return; [t[i], t[j]] = [t[j]!, t[i]!]; setList(t); };
  const save = async () => {
    const codes = list.map((l) => l.code.trim().toLowerCase());
    if (codes.some((c) => !/^[a-z]{2,3}(-[a-z0-9]{2,4})?$/.test(c))) { toast.error("Each code must be 2–3 letters, e.g. yo, sw"); return; }
    if (new Set(codes).size !== codes.length) { toast.error("Two languages have the same code"); return; }
    if (list.some((l) => !l.name.trim())) { toast.error("Every language needs a name"); return; }
    setSaving(true);
    try {
      const out = list.map((l) => ({ code: l.code.trim().toLowerCase(), name: l.name.trim(), ...(l.hidden ? { hidden: true } : {}) }));
      await setDoc(doc(db, "siteConfig", "languages"), { voice: out, updatedAt: Date.now() }, { merge: true });
      setList(out); record("Updated teaching languages"); toast.success("Saved. It shows in Study straight away.");
    } catch { toast.error("Couldn't save. Check you are an admin."); } finally { setSaving(false); }
  };

  return <Page eyebrow="App · Study" title="Languages" actions={<Button disabled={saving} onClick={() => void save()}><Save /> {saving ? "Saving…" : "Save changes"}</Button>}>
    <p className="mb-5 max-w-2xl text-sm text-muted-foreground">The languages lessons can be taught in (voice clips, videos and HTML pages). Learners pick theirs in Study; if a lesson has nothing in their language, they get English. English is always kept.</p>
    <Panel title="Teaching languages" tag={`${list.filter((l) => !l.hidden).length} visible`}>
      <div className="mb-2 hidden gap-2 px-3 text-xs font-bold uppercase text-muted-foreground sm:grid sm:grid-cols-[6rem_1fr_6rem_auto]"><span>Code</span><span>Name (English, then its own script)</span><span>Visible</span><span /></div>
      <div className="grid gap-2">{list.map((l, i) => {
        const en = l.code === "en";
        return <div key={i} className={`grid gap-2 border-2 border-foreground p-3 sm:grid-cols-[6rem_1fr_6rem_auto] sm:items-center ${l.hidden ? "opacity-60" : ""}`}>
          <input className={inputCls} value={l.code} disabled={en} placeholder="yo" onChange={(e) => set(i, { code: e.target.value })} />
          <input className={inputCls} value={l.name} placeholder="Yoruba (Yorùbá)" onChange={(e) => set(i, { name: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={en} checked={!l.hidden} onChange={(e) => set(i, { hidden: !e.target.checked })} /> Visible</label>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
            <Button size="sm" variant="outline" aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
            <Button size="sm" variant="outline" aria-label="Remove" disabled={en} onClick={() => { if (window.confirm(`Remove ${l.name}? Clips already uploaded in it are kept but won't show.`)) setList(list.filter((_, j) => j !== i)); }}><Trash2 /></Button>
          </div>
        </div>;
      })}</div>
      <Button variant="outline" className="mt-3" onClick={() => setList([...list, { code: "", name: "" }])}><Plus /> Add language</Button>
    </Panel>
  </Page>;
}
