import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

const COUNTRIES: [string, string][] = [["NG", "Nigeria"], ["GH", "Ghana"], ["NE", "Niger"], ["CM", "Cameroon"], ["SN", "Senegal"], ["KE", "Kenya"], ["ZA", "South Africa"], ["EG", "Egypt"], ["SA", "Saudi Arabia"], ["AE", "UAE"], ["QA", "Qatar"], ["KW", "Kuwait"], ["TR", "Türkiye"], ["PK", "Pakistan"], ["IN", "India"], ["BD", "Bangladesh"], ["MY", "Malaysia"], ["ID", "Indonesia"], ["PH", "Philippines"], ["GB", "United Kingdom"], ["US", "United States"], ["CA", "Canada"]];

/** Admin: countries whose Ramadan starts on a different day (their own moon sighting). */
export function RamadanCountries() {
  const [rows, setRows] = useState<{ c: string; d: string }[] | null>(null);
  const [base, setBase] = useState("");
  useEffect(() => {
    getDoc(doc(db, "ramadanConfig", "current")).then((s) => {
      setBase(String(s.get("start") ?? ""));
      const m = (s.get("countryStarts") as Record<string, string> | undefined) ?? {};
      setRows(Object.entries(m).map(([c, d]) => ({ c, d })));
    }).catch(() => setRows([]));
  }, []);
  if (!rows) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const save = async () => {
    const map: Record<string, string> = {};
    for (const r of rows) if (r.c && /^\d{4}-\d{2}-\d{2}$/.test(r.d)) map[r.c] = r.d;
    try { await setDoc(doc(db, "ramadanConfig", "current"), { countryStarts: map }, { merge: true }); toast.success("Saved"); } catch { toast.error("Couldn't save."); }
  };
  return <section className="mb-6 border-2 border-foreground bg-background p-5 shadow-brutal">
    <h2 className="font-serif text-3xl">🌙 Different start by country</h2>
    <p className="mt-1 text-sm text-muted-foreground">Everyone uses the main start date{base ? ` (${base})` : ""}. Add a country only if it announces a different day. It changes that country's countdown, daily checklist and Eid. The prize quiz stays the same for everyone.</p>
    <div className="mt-4 grid gap-2">
      {rows.map((r, i) => <div key={i} className="flex flex-wrap items-center gap-2">
        <select value={r.c} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, c: e.target.value } : x)))} className="h-10 border-2 border-foreground bg-background px-2">
          <option value="">Country…</option>{COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
        <input type="date" value={r.d} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, d: e.target.value } : x)))} className="h-10 border-2 border-foreground bg-background px-2" />
        <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</Button>
      </div>)}
    </div>
    <div className="mt-4 flex gap-2"><Button variant="outline" onClick={() => setRows([...rows, { c: "", d: base }])}>+ Add a country</Button><Button onClick={() => void save()}>Save</Button></div>
  </section>;
}
