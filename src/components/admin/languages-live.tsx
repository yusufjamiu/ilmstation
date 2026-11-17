import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { languages, DEFAULT_LIVE } from "@/components/language";

/** Admin: which app languages are live for users. English is always on. */
export function LiveLanguagesAdmin() {
  const [on, setOn] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDoc(doc(db, "siteConfig", "languages"))
      .then((s) => { const e = s.data()?.enabled; setOn(Array.isArray(e) ? e : [...DEFAULT_LIVE]); })
      .catch(() => setOn([...DEFAULT_LIVE]));
  }, []);
  if (!on) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const toggle = (c: string) => setOn((v) => (v!.includes(c) ? v!.filter((x) => x !== c) : [...v!, c]));
  const save = async () => {
    setBusy(true);
    try { await setDoc(doc(db, "siteConfig", "languages"), { enabled: ["en", ...on.filter((x) => x !== "en")], updatedAt: Date.now() }, { merge: true }); toast.success("Live languages saved"); }
    catch { toast.error("Couldn't save. Check your admin access."); }
    setBusy(false);
  };
  return <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
    <h2 className="font-serif text-3xl">🌍 Live languages</h2>
    <p className="mt-1 text-sm text-muted-foreground">Ticked languages appear in the app and website. Users of a language you switch off move to English.</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {languages.map((l) => <label key={l.code} className="flex items-center justify-between border-2 border-foreground px-4 py-3">
        <span><b dir={l.dir}>{l.native}</b> <span className="text-sm text-muted-foreground">· {l.label}</span></span>
        <input type="checkbox" className="size-5 accent-foreground" disabled={l.code === "en"} checked={l.code === "en" || on.includes(l.code)} onChange={() => toggle(l.code)} />
      </label>)}
    </div>
    <Button className="mt-4" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</Button>
  </section>;
}
