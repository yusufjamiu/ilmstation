import { useEffect, useRef, useState } from "react";
import { Check, Mic, RotateCcw, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SurahMeta = { n: number; name: string; arabic?: string };
type Ayah = { text: string; n: number; global: number };
const norm = (w: string) => w.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\u0621-\u064A]/g, "").replace(/([اوي])\1+/g, "$1");
export const isMark = (t: string) => /^[\u06D6-\u06ED\u0670]+$/.test(t);
function near(a: string, b: string) {
  if (a === b) return true; const n = Math.max(a.length, b.length); if (n < 4) return false;
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { let p = d[0]!; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]!; d[j] = Math.min(d[j]! + 1, d[j - 1]! + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } }
  return d[b.length]! <= (n >= 7 ? 2 : 1);
}
/** Which expected words were said, in order (allows the odd extra or repeated word). */
export function check(expected: string[], heard: string): boolean[] {
  const h = heard.split(/\s+/).map(norm).filter(Boolean); let p = 0;
  return expected.map((w) => { const e = norm(w); for (let k = p; k < Math.min(h.length, p + 4); k++) if (near(h[k]!, e)) { p = k + 1; return true; } return false; });
}
export function listen(): Promise<string> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SR) { resolve(""); return; }
    const rec = new SR(); rec.lang = "ar-SA"; let text = "";
    rec.onresult = (e: { results: { 0: { transcript: string } }[] }) => { text = Array.from(e.results).map((r) => r[0].transcript).join(" "); };
    rec.onend = () => resolve(text); rec.onerror = () => {};
    try { rec.start(); } catch { resolve(""); }
  });
}

/** Revise any part of the Qur'an from memory. Separate from the Hifz plan. */
export function FreeRevision({ surahs, reciter }: { surahs: SurahMeta[]; reciter: string }) {
  const [surah, setSurah] = useState(67);
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [from, setFrom] = useState(1); const [to, setTo] = useState(1);
  const [run, setRun] = useState(false); const [i, setI] = useState(0);
  const [marks, setMarks] = useState<boolean[] | null>(null);
  const [tries, setTries] = useState(0); const [state, setState] = useState<"listen" | "wrong" | "reveal" | "done">("listen");
  const [results, setResults] = useState<boolean[]>([]);
  const stop = useRef(false);
  useEffect(() => {
    setAyahs(null);
    fetch(`https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`).then((r) => r.json()).then((j: { data: { ayahs: { text: string; numberInSurah: number; number: number }[] } }) => {
      const list = j.data.ayahs.map((a, k) => ({ n: a.numberInSurah, global: a.number, text: k === 0 && surah !== 1 && surah !== 9 && a.text.startsWith("بِسْمِ") ? a.text.split(" ").slice(4).join(" ") : a.text }));
      setAyahs(list); setFrom(1); setTo(list.length);
    }).catch(() => setAyahs([]));
  }, [surah]);
  const range = ayahs ? ayahs.filter((a) => a.n >= from && a.n <= to) : [];
  const cur = range[i];
  const words = cur ? cur.text.trim().split(/\s+/).filter((w) => w && !isMark(w)) : [];
  const play = () => cur && new Audio(`https://cdn.islamic.network/quran/audio/128/${reciter}/${cur.global}.mp3`).play().catch(() => {});

  useEffect(() => {
    if (!run || !cur || state !== "listen") return;
    let cancelled = false; stop.current = false;
    void listen().then((heard) => {
      if (cancelled || stop.current) return;
      const m = check(words, heard); setMarks(m);
      if (m.every(Boolean)) { setResults((r) => [...r, tries === 0]); setTimeout(() => next(), 900); }
      else if (tries >= 2) { setState("reveal"); play(); setResults((r) => [...r, false]); }
      else { setState("wrong"); }
    });
    return () => { cancelled = true; };
  }, [run, i, state, tries]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = () => { setMarks(null); setTries(0); if (i + 1 < range.length) { setI(i + 1); setState("listen"); } else setState("done"); };
  const again = () => { setMarks(null); setTries((t) => t + 1); setState("listen"); };
  const name = surahs.find((s) => s.n === surah)?.name ?? "";

  if (!run) return <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
    <p className="text-xs font-bold uppercase text-muted-foreground">Any part of the Qur’an</p>
    <h2 className="mt-1 font-serif text-3xl">Free revision</h2>
    <label className="mt-4 block text-sm font-semibold">Surah</label>
    <select value={surah} onChange={(e) => setSurah(Number(e.target.value))} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3">{surahs.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.name}</option>)}</select>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <label className="text-sm font-semibold">From verse<input type="number" min={1} max={ayahs?.length ?? 1} value={from} onChange={(e) => setFrom(Math.max(1, Number(e.target.value) || 1))} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3" /></label>
      <label className="text-sm font-semibold">To verse<input type="number" min={from} max={ayahs?.length ?? 1} value={to} onChange={(e) => setTo(Math.min(ayahs?.length ?? 1, Number(e.target.value) || 1))} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3" /></label>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{ayahs ? `${ayahs.length} verses in this surah` : "Loading…"}</p>
    <Button className="mt-5 w-full" disabled={!ayahs?.length || from > to} onClick={() => { setI(0); setResults([]); setTries(0); setMarks(null); setState("listen"); setRun(true); }}><Mic /> Start</Button>
  </section>;

  if (state === "done") {
    const perfect = results.filter(Boolean).length;
    try { const h = JSON.parse(localStorage.getItem("ilmstation:free-revision") ?? "[]"); h.unshift({ at: Date.now(), surah, from, to, perfect, total: range.length }); localStorage.setItem("ilmstation:free-revision", JSON.stringify(h.slice(0, 30))); } catch { /* ignore */ }
    return <section className="border-2 border-foreground bg-primary p-6 shadow-brutal">
      <Check className="size-10" />
      <h2 className="mt-2 font-serif text-4xl">Masha’Allah!</h2>
      <p className="mt-2 text-lg font-semibold">{name} {from}–{to}: {perfect} of {range.length} verses perfect</p>
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setI(0); setResults([]); setTries(0); setMarks(null); setState("listen"); }}><RotateCcw /> Again</Button><Button onClick={() => setRun(false)}>Choose another part</Button></div>
    </section>;
  }

  return <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
    <div className="flex items-center justify-between text-sm font-bold"><span>{name} · {cur?.n}</span><span>{i + 1} / {range.length}</span></div>
    <p dir="rtl" lang="ar" className="mt-4 select-none text-right font-arabic text-3xl leading-[2.3]" style={{ WebkitUserSelect: "none" }}>
      {words.map((w, k) => { const ok = marks?.[k]; const show = state === "reveal" || ok !== undefined;
        return <span key={k} className={cn("me-2 inline-block transition", ok === false && "text-destructive", ok === true && "text-secondary")} style={show ? undefined : { filter: "blur(7px)", opacity: 0.55 }}>{w}</span>; })}
    </p>
    {state === "listen" && <p className="mt-4 flex items-center gap-2 text-sm font-semibold"><Mic className="size-4 animate-pulse" /> Recite this verse from memory…</p>}
    {state === "wrong" && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="flex items-center gap-1 text-sm font-semibold"><X className="size-4" /> Not quite. Say it again.</span><Button size="sm" onClick={again}><RotateCcw /> Try again</Button></div>}
    {state === "reveal" && <div className="mt-4 flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={play}><Volume2 /> Listen again</Button><Button size="sm" onClick={next}>Next verse</Button></div>}
    <Button variant="ghost" className="mt-4" onClick={() => { stop.current = true; setRun(false); }}>Stop</Button>
  </section>;
}
