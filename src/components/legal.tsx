import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { DEFAULT_LEGAL, LEGAL_TITLES, type LegalKey } from "@/lib/legal";
import { Button } from "@/components/ui/button";
import { Page, Panel } from "@/components/admin/ui";

type LegalDoc = Partial<Record<LegalKey, string>> & { address?: string; updated?: Partial<Record<LegalKey, number>> };

function useLegal() {
  const [d, setD] = useState<LegalDoc | null>(null);
  useEffect(() => { getDoc(doc(db, "siteConfig", "legal")).then((s) => setD((s.data() as LegalDoc) ?? {})).catch(() => setD({})); }, []);
  return d;
}

/** Simple text format: "## " = heading, "- " = bullet, blank line = new paragraph. */
function Formatted({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((block, i) => {
    const lines = block.split("\n").filter((l) => l.trim());
    if (!lines.length) return null;
    if (lines[0].startsWith("## ")) return <div key={i}>
      <h2 className="mt-10 font-serif text-3xl">{lines[0].slice(3)}</h2>
      {lines.length > 1 && <Formatted text={lines.slice(1).join("\n")} />}
    </div>;
    if (lines.every((l) => l.startsWith("- "))) return <ul key={i} className="mt-4 list-disc space-y-2 pl-6">{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
    return <p key={i} className="mt-4 leading-7">{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{l}</span>)}</p>;
  })}</>;
}

/** /privacy, /terms and /prize-rules */
export function LegalPage({ which }: { which: LegalKey }) {
  const d = useLegal();
  const text = d?.[which]?.trim() || DEFAULT_LEGAL[which];
  const updated = d?.updated?.[which];
  return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <p className="text-xs font-bold uppercase text-muted-foreground">IlmStation Limited</p>
    <h1 className="mt-2 font-serif text-5xl leading-none sm:text-6xl">{LEGAL_TITLES[which]}</h1>
    <p className="mt-3 text-sm text-muted-foreground">Last updated {new Date(updated ?? Date.UTC(2026, 10, 16)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
    <div className="mt-6 border-t-2 border-foreground pt-2">{d ? <Formatted text={text} /> : <p className="mt-4 text-muted-foreground">Loading…</p>}</div>
    {d?.address && <p className="mt-6 text-sm text-muted-foreground">Registered address: {d.address}</p>}
    <p className="mt-10 flex flex-wrap gap-4 border-t-2 border-foreground pt-4 text-sm font-semibold">
      <Link to="/privacy" className="underline">Privacy Policy</Link><Link to="/terms" className="underline">Terms of Use</Link><Link to="/prize-rules" className="underline">Prize Rules</Link>
    </p>
  </main>;
}

/** Admin → Legal pages */
export function LegalSection() {
  const d = useLegal();
  const [tab, setTab] = useState<LegalKey>("privacy");
  const [draft, setDraft] = useState<LegalDoc | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (d && !draft) setDraft(d); }, [d, draft]);
  if (!draft) return <Page eyebrow="Platform" title="Legal pages"><p className="text-sm text-muted-foreground">Loading…</p></Page>;
  const text = draft[tab] ?? DEFAULT_LEGAL[tab];
  const save = async () => {
    setSaving(true);
    try {
      const next = { ...draft, updated: { ...(draft.updated ?? {}), [tab]: Date.now() } };
      await setDoc(doc(db, "siteConfig", "legal"), next);
      setDraft(next); toast.success(`${LEGAL_TITLES[tab]} saved`);
    } catch { toast.error("Couldn't save. Check you are an admin."); } finally { setSaving(false); }
  };
  const path = tab === "privacy" ? "/privacy" : tab === "terms" ? "/terms" : "/prize-rules";
  return <Page eyebrow="Platform" title="Legal pages">
    <p className="-mt-2 mb-5 max-w-3xl text-sm text-muted-foreground">These pages are linked in the website footer, on signup and in app Settings. Format: a line starting with “## ” is a heading, “- ” is a bullet, and a blank line starts a new paragraph. Have a lawyer review them before the full launch.</p>
    <div className="mb-4 flex flex-wrap gap-2">{(Object.keys(LEGAL_TITLES) as LegalKey[]).map((k) => <Button key={k} variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}>{LEGAL_TITLES[k]}</Button>)}</div>
    <Panel title={LEGAL_TITLES[tab]} tag={draft.updated?.[tab] ? `Saved ${new Date(draft.updated[tab]!).toLocaleDateString("en-GB")}` : "Default text"}>
      <textarea className="min-h-[60vh] w-full border-2 border-foreground bg-background p-3 font-mono text-sm leading-6" value={text} onChange={(e) => setDraft({ ...draft, [tab]: e.target.value })} />
      <label className="mt-4 block text-xs font-bold uppercase">Registered address (optional, shown on all three pages)
        <input className="mt-1 h-10 w-full border-2 border-foreground bg-background px-3 text-sm font-normal normal-case" value={draft.address ?? ""} placeholder="e.g. 12 Example Street, Ikeja, Lagos" onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
      </label>
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { if (window.confirm(`Replace ${LEGAL_TITLES[tab]} with the default text?`)) setDraft({ ...draft, [tab]: DEFAULT_LEGAL[tab] }); }}>Reset to default</Button>
          <Button variant="outline" asChild><a href={path} target="_blank" rel="noreferrer">View page</a></Button>
        </div>
        <Button disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</Button>
      </div>
    </Panel>
  </Page>;
}
