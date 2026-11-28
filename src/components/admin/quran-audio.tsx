import { useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { surahList } from "@/components/quran-data";
import { Button } from "@/components/ui/button";
import { Field, inputCls, Page, Panel } from "./ui";

/** Reciters whose recordings have no word timings: we make them with ElevenLabs, so their words light up in the Qur'an quiz. */
const TO_ALIGN: [string, string, boolean][] = [
  ["raad", "Raad Al-Kurdi", false], ["ghamdi", "Saad Al-Ghamdi", false], ["maher", "Maher Al-Muaiqly", true], ["juhani", "Abdullah Al-Juhani", false],
  ["alijaber", "Ali Jaber", false], ["baleela", "Bandar Baleela", false], ["ayyub", "Muhammad Ayyub", true],
];

export function QuranAudioSection() {
  const [r, setR] = useState("raad");
  const [from, setFrom] = useState(78);
  const [to, setTo] = useState(114);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const stopRef = useRef(false);
  const add = (line: string) => setLog((l) => [line, ...l].slice(0, 200));

  const run = async () => {
    const u = auth.currentUser; if (!u) return;
    setBusy(true); stopRef.current = false; setLog([]);
    const name = TO_ALIGN.find(([k]) => k === r)?.[1] ?? r;
    add(`Starting ${name}, surahs ${from}–${to}…`);
    let ok = 0, bad = 0;
    for (let s = from; s <= to && !stopRef.current; s++) {
      const meta = surahList.find((x) => x.n === s)!;
      let part: number | null = 1;
      while (part && !stopRef.current) {
        const res = await fetch("/api/recite-align", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await u.getIdToken()}` }, body: JSON.stringify({ r, s, from: part }) }).catch(() => null);
        const j = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string; match?: number; next?: number | null };
        if (!res?.ok || !j.ok) { bad++; add(`✗ ${s}. ${meta.name}: ${j.error ?? "failed"}`); break; }
        part = j.next ?? null;
        if (!part) { ok++; add(`✓ ${s}. ${meta.name} · ${meta.ayahs} ayat · ${j.match}% match`); }
      }
    }
    add(stopRef.current ? `Stopped. ${ok} done, ${bad} failed.` : `Finished. ${ok} done, ${bad} failed.`);
    setBusy(false);
  };

  return <Page eyebrow="Qur’an quiz" title="Reciter word timings">
    <Panel title="Make words light up" tag="ElevenLabs">
      <p className="text-sm text-muted-foreground">Some reciters’ recordings only say where each verse starts. This listens to their recitation and marks every word, once, so their words light up in the quiz too. Start with Juz ʿAmma (78–114). Each surah is checked against the verse times; if it doesn’t match well, it isn’t saved. Check your ElevenLabs usage after the first run.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Reciter"><select className={inputCls} value={r} onChange={(e) => setR(e.target.value)} disabled={busy}>{TO_ALIGN.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field>
        <Field label="From surah"><input className={inputCls} type="number" min={1} max={114} value={from} onChange={(e) => setFrom(Math.max(1, Math.min(114, Number(e.target.value))))} disabled={busy} /></Field>
        <Field label="To surah"><input className={inputCls} type="number" min={1} max={114} value={to} onChange={(e) => setTo(Math.max(from, Math.min(114, Number(e.target.value))))} disabled={busy} /></Field>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => void run()} disabled={busy}>{busy ? "Working…" : "Start"}</Button>
        {busy && <Button variant="outline" onClick={() => { stopRef.current = true; }}>Stop</Button>}
      </div>
      {log.length > 0 && <pre className="mt-4 max-h-96 overflow-auto border-2 border-foreground bg-muted p-3 text-xs leading-relaxed">{log.join("\n")}</pre>}
    </Panel>
  </Page>;
}
