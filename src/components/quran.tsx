import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft, ArrowRight, BookOpen, Headphones, Pause, Play, Repeat, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { surahList } from "@/components/quran-data";
import { HifzScreen, PageView, pageSlice, reciters, speeds } from "@/components/hifz";

type Section = "hifz" | "tilawah" | "revision" | "listen";
type Verse = { arabic: string; meaning: string };
const sections: { id: Section; label: string }[] = [{ id: "hifz", label: "Hifz" }, { id: "tilawah", label: "Tilawah" }, { id: "revision", label: "Revision" }, { id: "listen", label: "Listen" }];
const panel = "border-2 border-foreground bg-background p-5 shadow-brutal";

const cache = new Map<number, Verse[]>();
/** Loads one surah (Uthmani text + English meaning). The spoken Bismillah is dropped from verse 1, as in Hifz. */
function useSurah(n: number) {
  const [verses, setVerses] = useState<Verse[] | null>(cache.get(n) ?? null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const cached = cache.get(n);
    if (cached) { setVerses(cached); setError(false); return; }
    let cancelled = false;
    setVerses(null); setError(false);
    fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.sahih`).then(res => res.json()).then((json: { data: { ayahs: { text: string }[] }[] }) => {
      const [ar, en] = json.data;
      if (!ar || !en) throw new Error("missing");
      const list = ar.ayahs.map((a, i) => ({ arabic: i === 0 && n !== 1 && a.text.startsWith("بِسْمِ") ? a.text.split(" ").slice(4).join(" ") : a.text, meaning: en.ayahs[i]?.text ?? "" }));
      cache.set(n, list);
      if (!cancelled) setVerses(list);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [n, tick]);
  return { verses, error, retry: () => setTick(t => t + 1) };
}

function SurahPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return <select value={value} onChange={e => onChange(Number(e.target.value))} aria-label="Surah" className="h-11 min-w-0 flex-1 border-2 border-foreground bg-background px-3 sm:max-w-xs">{surahList.map(s => <option key={s.n} value={s.n}>{s.n}. {s.name} · {s.arabic}</option>)}</select>;
}

const GOLD = "var(--mus-gold)";
/* mushaf colours: cream paper in light mode, deep brown page with cream text in dark mode */
if (typeof document !== "undefined" && !document.getElementById("mushaf-colors")) {
  const st = document.createElement("style"); st.id = "mushaf-colors";
  st.textContent = `:root{--mus-paper:var(--mus-paper);--mus-ink:#1b1a17;--mus-muted:#6b5520;--mus-band:#f3e8c6;--mus-gold:#9a7b2f}
.dark,[data-theme="dark"]{--mus-paper:#1c1812;--mus-ink:#efe6d2;--mus-muted:#d1b46c;--mus-band:#2b2417;--mus-gold:#b8964a}`;
  document.head.appendChild(st);
}
const QFONT = '"Amiri Quran","Amiri",serif';
const TOTAL_PAGES = 604;
const arDigits = (n: number) => n.toLocaleString("ar-EG");

type PageAyah = { surah: number; surahName: string; n: number; text: string; meaning: string; juz: number };
const pageCache = new Map<number, PageAyah[]>();
/** One page of the printed Madinah mushaf: exactly the verses that sit on that page. */
async function fetchAlquranCloud(page: number): Promise<PageAyah[]> {
  const json = await withTimeout(fetch(`https://api.alquran.cloud/v1/page/${page}/editions/quran-uthmani,en.sahih`).then(res => res.json()), 12000) as { data: { ayahs: { text: string; numberInSurah: number; juz: number; surah: { number: number; name: string } }[] }[] };
  const [ar, en] = json.data;
  if (!ar || !en) throw new Error("missing");
  return ar.ayahs.map((a, i) => ({ surah: a.surah.number, surahName: a.surah.name, n: a.numberInSurah, juz: a.juz, meaning: en.ayahs[i]?.text ?? "", text: a.numberInSurah === 1 && a.surah.number !== 1 && a.text.startsWith("بِسْمِ") ? a.text.split(" ").slice(4).join(" ") : a.text }));
}
async function fetchQuranCom(page: number): Promise<PageAyah[]> {
  const json = await withTimeout(fetch(`https://api.quran.com/api/v4/verses/by_page/${page}?fields=text_uthmani&translations=131&per_page=50`).then(res => res.json()), 12000) as { verses: { verse_key: string; verse_number: number; juz_number: number; text_uthmani: string; translations?: { text: string }[] }[] };
  if (!json.verses?.length) throw new Error("missing");
  return json.verses.map(v => {
    const surah = Number(v.verse_key.split(":")[0]);
    const info = surahList.find(x => x.n === surah);
    return { surah, surahName: `سُورَةُ ${info?.arabic ?? ""}`, n: v.verse_number, juz: v.juz_number, meaning: (v.translations?.[0]?.text ?? "").replace(/<[^>]*>/g, ""), text: v.text_uthmani };
  });
}
/** Tries alquran.cloud, then Quran.com, and retries once, so one slow or blocked server doesn't break the page. */
async function loadPage(page: number): Promise<PageAyah[]> {
  const cached = pageCache.get(page);
  if (cached) return cached;
  let lastError: unknown;
  for (const fetcher of [fetchAlquranCloud, fetchQuranCom, fetchAlquranCloud]) {
    try { const list = await fetcher(page); pageCache.set(page, list); return list; } catch (e) { lastError = e; }
  }
  throw lastError;
}
const startPageCache = new Map<number, number>();
function pageOfSurah(n: number): Promise<number> {
  const hit = startPageCache.get(n);
  if (hit) return Promise.resolve(hit);
  const start = surahList.find(s => s.n === n)?.start ?? 1;
  return fetch(`https://api.alquran.cloud/v1/ayah/${start}`).then(res => res.json()).then((json: { data: { page: number } }) => { startPageCache.set(n, json.data.page); return json.data.page; });
}

/** A mushaf page: framed, page number at the foot, surah banners where a surah begins, verses justified edge to edge. The font size is fitted so the text fills the page like a printed one. */
function MushafPage({ page, ayahs, focus, onSelect }: { page: number; ayahs: PageAyah[]; focus: string | null; onSelect: (a: PageAyah) => void }) {
  const body = useRef<HTMLDivElement | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  const fit = () => {
    const el = body.current; if (!el) return;
    let lo = 14, hi = 42, best = 14;
    while (hi - lo > 0.5) { const mid = (lo + hi) / 2; el.style.fontSize = `${mid}px`; if (el.scrollHeight <= el.clientHeight + 1) { best = mid; lo = mid; } else hi = mid; }
    el.style.fontSize = `${Math.min(best, 34)}px`;
  };
  useLayoutEffect(() => {
    fit();
    void (document as any).fonts?.ready?.then(fit);
    const ro = typeof ResizeObserver !== "undefined" && frame.current ? new ResizeObserver(fit) : null;
    if (ro && frame.current) ro.observe(frame.current);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayahs, page]);
  const blocks: { head?: PageAyah; items: PageAyah[] }[] = [];
  for (const a of ayahs) { if (a.n === 1) blocks.push({ head: a, items: [a] }); else if (blocks.length) blocks[blocks.length - 1]!.items.push(a); else blocks.push({ items: [a] }); }
  const first = ayahs[0];
  return <div ref={frame} style={{ boxSizing: "border-box", aspectRatio: "5 / 7.4", maxWidth: "34rem", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", background: "var(--mus-paper)", border: `3px double ${GOLD}`, boxShadow: `inset 0 0 0 4px var(--mus-paper), inset 0 0 0 5px ${GOLD}`, padding: ".9rem 1.1rem .7rem", color: "var(--mus-ink)" }}>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap" precedence="default"/>
    <div dir="rtl" style={{ display: "flex", justifyContent: "space-between", fontFamily: QFONT, fontSize: ".95rem", color: "var(--mus-muted)", borderBottom: `1px solid ${GOLD}`, paddingBottom: ".25rem", marginBottom: ".4rem" }}><span>الجزء {first ? arDigits(first.juz) : ""}</span><span>{first?.surahName}</span></div>
    <div ref={body} dir="rtl" lang="ar" style={{ flex: 1, minHeight: 0, overflow: "hidden", fontFamily: QFONT, lineHeight: 2.05, textAlign: "justify", textAlignLast: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {blocks.map((blk, bi) => <div key={bi}>
        {blk.head && <div style={{ textAlign: "center", margin: ".15em 0 .25em" }}>
          <div style={{ border: `2px solid ${GOLD}`, outline: `1px solid ${GOLD}`, outlineOffset: "3px", background: "var(--mus-band)", padding: ".05em .8em", display: "block", fontSize: ".85em", lineHeight: 1.7 }}>{blk.head.surahName}</div>
          {blk.head.surah !== 1 && blk.head.surah !== 9 && <div style={{ fontSize: ".9em", marginTop: ".2em", lineHeight: 1.8 }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>}
        </div>}
        <p style={{ margin: 0 }}>{blk.items.map(a => {
          const key = `${a.surah}:${a.n}`;
          return <span key={key} onClick={() => onSelect(a)} style={{ cursor: "pointer", background: focus === key ? "rgba(214,170,60,.22)" : undefined, borderRadius: ".3em", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}>{a.text} <span aria-label={`Verse ${a.n}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.5em", height: "1.5em", margin: "0 .15em", borderRadius: "50%", border: `1.5px solid ${GOLD}`, boxShadow: `0 0 0 2px var(--mus-paper), 0 0 0 3px ${GOLD}`, fontSize: ".5em", color: "var(--mus-muted)", verticalAlign: "middle", background: "var(--mus-paper)" }}>{arDigits(a.n)}</span>{" "}</span>;
        })}</p>
      </div>)}
    </div>
    <div style={{ textAlign: "center", fontFamily: QFONT, color: "var(--mus-muted)", borderTop: `1px solid ${GOLD}`, marginTop: ".4rem", paddingTop: ".25rem" }}>{arDigits(page)}</div>
  </div>;
}

type QWord = { code: string; key: string; end: boolean; verse: number; pos: number };
type QLine = { line: number; words: QWord[] };
type Layout = { lines: QLine[]; total: number; family: string };
const layoutCache = new Map<number, Layout>();
const loadedFonts = new Set<number>();
const FONT_BASES = ["https://verses.quran.foundation/fonts/quran/hafs/v1/woff2", "https://static.qurancdn.com/fonts/quran/hafs/v1/woff2", "https://quran.com/fonts/quran/hafs/v1/woff2"];
const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> => Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
/** Each mushaf page has its own font where every word is one glyph. We try a few font servers in turn. */
async function loadPageFont(page: number): Promise<string> {
  const family = `qcf-p${page}`;
  if (loadedFonts.has(page)) return family;
  for (const base of FONT_BASES) {
    try {
      const face = new FontFace(family, `url(${base}/p${page}.woff2)`);
      await withTimeout(face.load(), 8000);
      (document as any).fonts.add(face);
      loadedFonts.add(page);
      return family;
    } catch { /* try the next server */ }
  }
  throw new Error("font");
}
/** Which words sit on which of the printed lines of this page (from Quran.com), plus the page's font. */
function loadLayout(page: number): Promise<Layout> {
  const hit = layoutCache.get(page);
  if (hit) return Promise.resolve(hit);
  const data = withTimeout(fetch(`https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=code_v1,line_number&per_page=50&mushaf=2`).then(res => res.json()), 10000);
  return Promise.all([data, loadPageFont(page)]).then(([json, family]) => {
    const byLine = new Map<number, QWord[]>();
    for (const v of (json as any).verses ?? []) for (const w of v.words ?? []) {
      if (!w.code_v1 || typeof w.line_number !== "number") continue;
      const list = byLine.get(w.line_number) ?? [];
      list.push({ code: w.code_v1, key: v.verse_key, end: w.char_type_name === "end", verse: v.verse_number, pos: w.position });
      byLine.set(w.line_number, list);
    }
    if (!byLine.size) throw new Error("empty");
    const lines = [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([line, words]) => ({ line, words }));
    const layout: Layout = { lines, total: page <= 2 ? 8 : 15, family };
    layoutCache.set(page, layout);
    return layout;
  });
}

/** The page exactly as printed: the same 15 lines, each justified edge to edge, in the page's own mushaf font. */
function QcfPage({ page, layout, ayahs, focus, onSelect }: { page: number; layout: Layout; ayahs: PageAyah[]; focus: string | null; onSelect: (key: string) => void }) {
  const area = useRef<HTMLDivElement | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  const fit = () => {
    const el = area.current; if (!el) return;
    el.style.fontSize = "20px";
    let widest = 0;
    el.querySelectorAll<HTMLElement>("[data-line]").forEach(row => {
      const kids = Array.from(row.children) as HTMLElement[];
      const w = kids.reduce((sum, k) => sum + k.getBoundingClientRect().width, 0) + Math.max(0, kids.length - 1) * 20 * 0.18;
      if (w > widest) widest = w;
    });
    if (widest > 0) el.style.fontSize = `${Math.min(46, (20 * el.clientWidth) / widest * 0.985)}px`;
  };
  useLayoutEffect(() => {
    fit();
    void (document as any).fonts?.ready?.then(fit);
    const ro = typeof ResizeObserver !== "undefined" && frame.current ? new ResizeObserver(fit) : null;
    if (ro && frame.current) ro.observe(frame.current);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, page]);
  const byLine = new Map(layout.lines.map(l => [l.line, l]));
  const startAt = new Map<number, number>();
  layout.lines.forEach(l => { const w = l.words[0]; if (w && w.verse === 1 && w.pos === 1) startAt.set(l.line, Number(w.key.split(":")[0])); });
  const nameOf = (n: number) => ayahs.find(a => a.surah === n)?.surahName ?? `سُورَةُ ${surahList.find(s => s.n === n)?.arabic ?? ""}`;
  const first = ayahs[0];
  const banner = (n: number) => <div style={{ width: "100%", border: `2px solid ${GOLD}`, outline: `1px solid ${GOLD}`, outlineOffset: "3px", background: "var(--mus-band)", textAlign: "center", fontFamily: QFONT, fontSize: "1.1rem", lineHeight: 1.6, padding: ".05em .6em" }}>{nameOf(n)}</div>;
  return <div ref={frame} style={{ boxSizing: "border-box", aspectRatio: "5 / 7.4", maxWidth: "34rem", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", background: "var(--mus-paper)", border: `3px double ${GOLD}`, boxShadow: `inset 0 0 0 4px var(--mus-paper), inset 0 0 0 5px ${GOLD}`, padding: ".8rem 1rem .6rem", color: "var(--mus-ink)" }}>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap" precedence="default"/>
    <div dir="rtl" style={{ display: "flex", justifyContent: "space-between", fontFamily: QFONT, fontSize: ".95rem", color: "var(--mus-muted)", borderBottom: `1px solid ${GOLD}`, paddingBottom: ".25rem", marginBottom: ".35rem" }}><span>الجزء {first ? arDigits(first.juz) : ""}</span><span>{first?.surahName}</span></div>
    <div ref={area} dir="rtl" lang="ar" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {Array.from({ length: layout.total }, (_, i) => i + 1).map(row => {
        const line = byLine.get(row);
        const wrap: React.CSSProperties = { flex: 1, minHeight: 0, display: "flex", alignItems: "center" };
        if (!line) {
          const next = startAt.get(row + 1); const after = startAt.get(row + 2);
          if (next !== undefined) return <div key={row} style={{ ...wrap, justifyContent: "center", fontFamily: QFONT }}>{next === 1 || next === 9 ? banner(next) : <span style={{ fontSize: "1.25rem" }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</span>}</div>;
          if (after !== undefined && after !== 1 && after !== 9) return <div key={row} style={{ ...wrap, justifyContent: "center" }}>{banner(after)}</div>;
          return <div key={row} style={wrap}/>;
        }
        const endsSurah = line.words.some(w => w.end && w.verse === surahList.find(s => s.n === Number(w.key.split(":")[0]))?.ayahs);
        return <div key={row} data-line style={{ ...wrap, justifyContent: endsSurah ? "center" : "space-between", columnGap: "0.18em", fontFamily: layout.family, lineHeight: 1.2, whiteSpace: "nowrap" }}>
          {line.words.map((w, k) => <span key={k} onClick={() => onSelect(w.key)} style={{ flexShrink: 0, cursor: "pointer", background: focus === w.key ? "rgba(214,170,60,.28)" : undefined, borderRadius: ".15em" }}>{w.code}</span>)}
        </div>;
      })}
    </div>
    <div style={{ textAlign: "center", fontFamily: QFONT, color: "var(--mus-muted)", borderTop: `1px solid ${GOLD}`, marginTop: ".35rem", paddingTop: ".2rem" }}>{arDigits(page)}</div>
  </div>;
}

function readSaved(): { page: number; at: number } | null {
  try { const raw = localStorage.getItem("ilmstation:tilawah-page"); if (!raw) return null; const v = JSON.parse(raw); return typeof v?.page === "number" ? { page: v.page, at: v.at ?? 0 } : null; } catch { return null; }
}
function writeSaved(page: number, at: number) { try { localStorage.setItem("ilmstation:tilawah-page", JSON.stringify({ page, at })); } catch { /* ignore */ } }

/** Tilawah: read the Qur'an page by page, like the printed mushaf. Your page is saved to your account (and this device), so you can pick up later from anywhere. */
function Tilawah({ onBack }: { onBack?: () => void } = {}) {
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [ayahs, setAyahs] = useState<PageAyah[] | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [layoutFailed, setLayoutFailed] = useState(false);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const [pick, setPick] = useState<PageAyah | null>(null);
  const [jump, setJump] = useState("");

  useEffect(() => {
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async user => {
      let best = readSaved();
      if (user) {
        try {
          const snap = await getDoc(doc(db, "hifz", user.uid));
          const t = (snap.data() as any)?.tilawah;
          if (t && typeof t.page === "number" && (!best || (t.at ?? 0) > best.at)) best = { page: t.page, at: t.at ?? 0 };
        } catch { /* offline: use this device's copy */ }
      }
      if (cancelled) return;
      setUid(user?.uid ?? null);
      if (best) { setPage(best.page); setSaved(best.page); }
      setHydrated(true);
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      const at = Date.now();
      writeSaved(page, at);
      if (uid) void setDoc(doc(db, "hifz", uid), { tilawah: { page, at } }, { merge: true }).catch(() => { /* ignore */ });
    }, 700);
    return () => clearTimeout(t);
  }, [page, hydrated, uid]);

  useEffect(() => {
    let cancelled = false;
    setError(false); setPick(null);
    setLayout(null); setLayoutFailed(false);
    loadPage(page).then(list => { if (!cancelled) { setAyahs(list); if (page < TOTAL_PAGES) void loadPage(page + 1).catch(() => {}); } }).catch(() => { if (!cancelled) setError(true); });
    loadLayout(page).then(l => { if (!cancelled) { setLayout(l); if (page < TOTAL_PAGES) void loadLayout(page + 1).catch(() => {}); } }).catch(() => { if (!cancelled) setLayoutFailed(true); });
    return () => { cancelled = true; };
  }, [page, tick]);

  const go = (p: number) => { if (p >= 1 && p <= TOTAL_PAGES) setPage(p); };
  const currentSurah = ayahs?.[0]?.surah ?? 1;
  const [opened, setOpened] = useState(false);
  const [ask, setAsk] = useState(false);
  useEffect(() => {
    if (saved === null || opened) return;
    try { if (sessionStorage.getItem("tilawahAsked")) return; sessionStorage.setItem("tilawahAsked", "1"); } catch { /* ignore */ }
    setAsk(true);
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!opened) return <div className="mt-1 min-w-0 sm:mt-4">
    <section className={cn(panel, "space-y-4")}>
      <div className="flex items-center gap-2">{onBack && <Button size="sm" variant="outline" className="shrink-0" onClick={onBack} aria-label="Back to Qur’an">←</Button>}<BookOpen className="size-5"/><h2 className="font-serif text-2xl">Tilawah</h2></div>
      <div className="flex flex-wrap gap-2">
        {saved !== null && <Button variant="secondary" onClick={() => { go(saved); setOpened(true); }}>Continue where I stopped (page {saved})</Button>}
        <Button variant="outline" onClick={() => { go(1); setOpened(true); }}>Start from the beginning</Button>
      </div>
      <p className="text-sm text-muted-foreground">Or choose a surah:</p>
      <SurahList onPick={n => { void pageOfSurah(n).then(p => { go(p); setOpened(true); }).catch(() => setError(true)); }}/>
    </section>
    {ask && saved !== null && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setAsk(false)}>
      <div className="w-full max-w-sm border-2 border-foreground bg-background p-5 shadow-brutal" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between"><p className="text-4xl">📖</p><button onClick={() => setAsk(false)} aria-label="Close" className="border-2 border-foreground px-2.5 py-0.5 text-lg font-bold">✕</button></div>
        <p className="mt-2 font-serif text-3xl leading-tight">Continue reading?</p>
        <p className="mt-1 text-sm text-muted-foreground">You stopped at page {saved}.</p>
        <div className="mt-5 grid gap-2">
          <Button onClick={() => { setAsk(false); go(saved); setOpened(true); }}>Continue from page {saved}</Button>
          <Button variant="outline" onClick={() => setAsk(false)}>Choose a surah</Button>
        </div>
      </div>
    </div>}
  </div>;
  return <div className="mt-1 min-w-0 space-y-3 sm:mt-4 sm:space-y-4">
    <section className="border-2 border-foreground bg-background p-1.5">
      <div className="flex items-center gap-1.5">
        {onBack && <Button size="sm" variant="outline" className="shrink-0" onClick={onBack} aria-label="Back to Qur’an">←</Button>}
        <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpened(false)}>☰ Surahs</Button>
        <form className="flex flex-1 items-center gap-1.5" onSubmit={e => { e.preventDefault(); const p = Number(jump); if (p >= 1 && p <= TOTAL_PAGES) { go(Math.floor(p)); setJump(""); } }}><input value={jump} onChange={e => setJump(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" placeholder="Page" aria-label="Go to page" className="h-9 w-full min-w-0 border-2 border-foreground bg-background px-2 text-sm"/><Button type="submit" size="sm" variant="outline">Go</Button></form>
      </div>
    </section>
    {error ? <section className={panel}><p className="text-sm">We couldn't load this page. Check your connection and try again.</p><Button className="mt-3" onClick={() => setTick(t => t + 1)}>Try again</Button></section> : !ayahs || (!layout && !layoutFailed) ? <p className="text-sm text-muted-foreground">Loading the page…</p> : <>
      {layout ? <QcfPage page={page} layout={layout} ayahs={ayahs} focus={pick ? `${pick.surah}:${pick.n}` : null} onSelect={key => setPick(ayahs.find(a => `${a.surah}:${a.n}` === key) ?? null)}/> : <MushafPage page={page} ayahs={ayahs} focus={pick ? `${pick.surah}:${pick.n}` : null} onSelect={a => setPick(a)}/>}
      {pick && <section className={cn(panel, "space-y-1")}><p className="text-xs font-bold uppercase text-muted-foreground">{surahList.find(s => s.n === pick.surah)?.name} · verse {pick.n}</p><p className="text-sm leading-relaxed">{pick.meaning}</p></section>}
      <div className="mx-auto flex max-w-[34rem] items-center justify-between gap-2">
        <Button size="sm" variant="outline" disabled={page >= TOTAL_PAGES} onClick={() => go(page + 1)} aria-label="Next page"><ArrowLeft /> Next</Button>
        <span className="text-sm font-bold tabular-nums">{page} / {TOTAL_PAGES}</span>
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Previous page">Previous <ArrowRight /></Button>
      </div>
    </>}
  </div>;
}

/** Listen: play a surah verse by verse with the verse you hear highlighted on the page. */
function Listen({ onBack }: { onBack?: () => void } = {}) {
  const [surah, setSurah] = useState(1);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reciter, setReciter] = useState(reciters[0]!.id);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [chosen, setChosen] = useState(false);
  const [lastL] = useState<{ surah: number; idx: number } | null>(() => { try { const v = JSON.parse(localStorage.getItem("ilmstation:listen-last") ?? "null"); return v && typeof v.surah === "number" ? v : null; } catch { return null; } });
  const [askL, setAskL] = useState(false);
  const [autoNext, setAutoNext] = useState(() => { try { return localStorage.getItem("listenAutoNext") !== "0"; } catch { return true; } });
  const [showMeaning, setShowMeaning] = useState(false);
  useEffect(() => { if (chosen) { try { localStorage.setItem("ilmstation:listen-last", JSON.stringify({ surah, idx })); } catch { /* ignore */ } } }, [chosen, surah, idx]);
  useEffect(() => { if (!lastL) return; try { if (sessionStorage.getItem("listenAsked")) return; sessionStorage.setItem("listenAsked", "1"); } catch { /* ignore */ } setAskL(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const resume = () => { if (!lastL) return; setAskL(false); setSurah(lastL.surah); setIdx(lastL.idx); setChosen(true); };
  const lastName = lastL ? `${surahList.find(x => x.n === lastL.surah)?.name ?? ""} · verse ${lastL.idx + 1}` : "";
  const audio = useRef<HTMLAudioElement | null>(null);
  const { verses, error, retry } = useSurah(surah);
  const meta = surahList.find(s => s.n === surah)!;
  const r = reciters.find(x => x.id === reciter) ?? reciters[0]!;
  const src = `https://cdn.islamic.network/quran/audio/${r.bitrate}/${r.id}/${meta.start + idx}.mp3`;
  const last = (verses?.length ?? meta.ayahs) - 1;
  useEffect(() => {
    const el = audio.current; if (!el) return;
    el.playbackRate = speed;
    if (playing) el.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, speed]);
  function toggle() {
    const el = audio.current; if (!el) return;
    if (playing) { el.pause(); setPlaying(false); } else { el.playbackRate = speed; el.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  }
  function ended() {
    const el = audio.current;
    if (repeat && el) { el.currentTime = 0; void el.play(); return; }
    if (idx < last) setIdx(i => i + 1); else if (autoNext && surah < 114) { setSurah(x => x + 1); setIdx(0); } else setPlaying(false);
  }
  const [a, b] = pageSlice([0, Math.max(0, last)], idx);
  if (!chosen) return <div className="mt-1 min-w-0 sm:mt-4">
    <section className={cn(panel, "space-y-4")}>
      <div className="flex items-center gap-2">{onBack && <Button size="sm" variant="outline" className="shrink-0" onClick={onBack} aria-label="Back to Qur’an">←</Button>}<Headphones className="size-5"/><h2 className="font-serif text-2xl">Listen</h2></div>
      {lastL && <Button variant="secondary" onClick={resume}>Continue: {lastName}</Button>}
      <p className="text-sm text-muted-foreground">Choose a surah to listen to.</p>
      <SurahList onPick={n => { audio.current?.pause(); setPlaying(false); setSurah(n); setIdx(0); setChosen(true); }}/>
    </section>
    {askL && lastL && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setAskL(false)}>
      <div className="w-full max-w-sm border-2 border-foreground bg-background p-5 shadow-brutal" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between"><p className="text-4xl">🎧</p><button onClick={() => setAskL(false)} aria-label="Close" className="border-2 border-foreground px-2.5 py-0.5 text-lg font-bold">✕</button></div>
        <p className="mt-2 font-serif text-3xl leading-tight">Continue listening?</p>
        <p className="mt-1 text-sm text-muted-foreground">You stopped at {lastName}.</p>
        <div className="mt-5 grid gap-2">
          <Button onClick={resume}>Continue</Button>
          <Button variant="outline" onClick={() => setAskL(false)}>Choose a surah</Button>
        </div>
      </div>
    </div>}
  </div>;
  return <div className="mt-1 min-w-0 space-y-3 sm:mt-4 sm:space-y-4">
    <section className="border-2 border-foreground bg-background p-1.5">
      <div className="flex items-center gap-1.5">
        {onBack && <Button size="sm" variant="outline" className="shrink-0" onClick={onBack} aria-label="Back to Qur’an">←</Button>}
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => { audio.current?.pause(); setPlaying(false); setChosen(false); }}>☰ Surahs</Button>
        <select value={reciter} onChange={e => setReciter(e.target.value)} aria-label="Reciter" className="h-9 min-w-0 flex-1 border-2 border-foreground bg-background px-2 text-sm">{reciters.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select value={speed} onChange={e => setSpeed(Number(e.target.value))} aria-label="Playback speed" className="h-9 shrink-0 border-2 border-foreground bg-background px-1 text-sm">{speeds.map(v => <option key={v} value={v}>{v}×</option>)}</select>
      </div>
    </section>
    {error ? <section className={panel}><p className="text-sm">We couldn't load this surah. Check your connection and try again.</p><Button className="mt-3" onClick={retry}>Try again</Button></section> : !verses ? <p className="text-sm text-muted-foreground">Loading the surah…</p> : <>
      <PageView verses={verses.slice(a, b + 1)} from={a} revealUpTo={verses.length} focus={idx} peek={false} onSelect={n => { setIdx(n); setShowMeaning(true); }} title={meta.arabic} juz={meta.juz} number={surah}/>
      {showMeaning && verses[idx] && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowMeaning(false)}>
        <div className="max-h-[85vh] w-full max-w-md overflow-y-auto border-2 border-foreground bg-background p-5 shadow-brutal" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase text-muted-foreground">{meta.name} · verse {idx + 1}</p><button onClick={() => setShowMeaning(false)} aria-label="Close" className="border-2 border-foreground px-2.5 py-0.5 text-lg font-bold">✕</button></div>
          <p dir="rtl" lang="ar" className="mt-3 text-right font-arabic text-3xl leading-[2]">{(verses[idx] as { text?: string }).text}</p>
          <p className="mt-3 text-base leading-relaxed">{verses[idx]?.meaning}</p>
          <Button className="mt-5 w-full" onClick={() => void verseCard((verses[idx] as { text?: string }).text ?? "", verses[idx]?.meaning ?? "", `${meta.name} · ${surah}:${idx + 1}`)}>📥 Download card</Button>
        </div>
      </div>}
      <section className={cn(panel, "space-y-3")}>
        <p className="text-xs font-bold uppercase text-muted-foreground">{meta.name} · verse {idx + 1} of {verses.length}</p>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={autoNext} onChange={e => { setAutoNext(e.target.checked); try { localStorage.setItem("listenAutoNext", e.target.checked ? "1" : "0"); } catch { /* ignore */ } }}/> Auto-play next surah</label>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous verse" disabled={idx === 0} onClick={() => setIdx(i => Math.max(0, i - 1))}><SkipBack /></Button>
          <Button onClick={toggle}>{playing ? <Pause /> : <Play />}{playing ? "Pause" : "Play"}</Button>
          <Button variant="outline" size="icon" aria-label="Next verse" disabled={idx >= last} onClick={() => setIdx(i => Math.min(last, i + 1))}><SkipForward /></Button>
          <Button variant={repeat ? "secondary" : "ghost"} aria-pressed={repeat} onClick={() => setRepeat(v => !v)}><Repeat /> Repeat verse</Button>
        </div>
        <audio ref={audio} src={src} preload="auto" onEnded={ended} onPause={() => { if (audio.current && !audio.current.ended) setPlaying(false); }} onPlay={() => setPlaying(true)}/>
      </section>
    </>}
  </div>;
}

/** The Quran area: Hifz, Tilawah (reading), Revision and Listen. */
export function QuranScreen() {
  const [section, setSection] = useState<Section | null>(null);
  const practice = section === "hifz" || section === "revision";
  const info: Record<string, [string, string]> = { hifz: ["📖", "Memorise step by step"], tilawah: ["📜", "Read the mushaf page by page"], revision: ["🔁", "Review what you've memorised"], listen: ["🎧", "Listen to beautiful recitations"] };
  if (!section) return <div className="iq-rise">
    <p className="text-xs font-bold uppercase text-muted-foreground">Qur’an</p>
    <h1 className="font-serif text-4xl leading-none sm:text-5xl">What would you like to do?</h1>
    <div className="mt-6 grid gap-3">{sections.map(item => <button key={item.id} onClick={() => setSection(item.id)} className="flex items-center gap-4 border-2 border-foreground bg-background p-5 text-left shadow-brutal transition-transform hover:-translate-y-0.5">
      <span className="text-4xl">{info[item.id]?.[0] ?? "📖"}</span>
      <span className="min-w-0 flex-1"><b className="block font-serif text-3xl leading-none">{item.label}</b><span className="text-sm text-muted-foreground">{info[item.id]?.[1] ?? ""}</span></span>
      <ArrowRight className="size-5 shrink-0" />
    </button>)}</div>
  </div>;
  return <div>
    {practice && <button onClick={() => setSection(null)} className="mb-2 border-2 border-foreground bg-background px-3 py-1.5 text-sm font-bold shadow-brutal-sm">← Qur’an</button>}
    {practice && <HifzScreen section={section === "revision" ? "revision" : "hifz"} onGoRevision={() => setSection("revision")}/>}
    {section === "tilawah" && <Tilawah onBack={() => setSection(null)}/>}
    {section === "listen" && <Listen onBack={() => setSection(null)}/>}
  </div>;
}

/** All 114 surahs in a scrolling list, with search. */
function SurahList({ onPick, note }: { onPick: (n: number) => void; note?: (n: number) => string }) {
  const [q, setQ] = useState("");
  const list = surahList.filter(x => !q.trim() || `${x.n} ${x.name} ${x.arabic}`.toLowerCase().includes(q.trim().toLowerCase()));
  return <div className="border-2 border-foreground bg-background">
    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search a surah…" aria-label="Search a surah" className="h-11 w-full border-b-2 border-foreground bg-background px-3 text-sm outline-none"/>
    <div>{list.map(x => <button key={x.n} onClick={() => onPick(x.n)} className="flex w-full items-center gap-3 border-b border-foreground/20 px-3 py-3 text-left last:border-b-0 hover:bg-muted">
      <span className="grid size-9 shrink-0 place-items-center border-2 border-foreground text-sm font-bold">{x.n}</span>
      <span className="min-w-0 flex-1"><b className="block">{x.name}</b>{note && <span className="text-xs text-muted-foreground">{note(x.n)}</span>}</span>
      <span className="font-arabic text-xl" dir="rtl" lang="ar">{x.arabic}</span>
    </button>)}{!list.length && <p className="p-4 text-sm text-muted-foreground">No surah matches.</p>}</div>
  </div>;
}

/** A square verse card (Arabic, meaning, reference) in IlmStation style. */
async function verseCard(arabic: string, meaning: string, ref: string) {
  const W = 1080, c = document.createElement("canvas"); c.width = W; c.height = W;
  const x = c.getContext("2d"); if (!x) return;
  try { await Promise.all([document.fonts.load('52px "Amiri Quran"'), document.fonts.load('52px "Amiri"')]); } catch { /* use what's there */ }
  const wrap = (t: string, maxW: number) => { const out: string[] = []; let line = ""; for (const w of t.split(" ")) { const tt = line ? `${line} ${w}` : w; if (x.measureText(tt).width > maxW && line) { out.push(line); line = w; } else line = tt; } if (line) out.push(line); return out; };
  x.fillStyle = "#e8c25b"; x.fillRect(0, 0, W, W);
  x.fillStyle = "#1c1a17"; x.fillRect(74, 74, W - 128, W - 128);
  x.fillStyle = "#f7f3ea"; x.fillRect(54, 54, W - 128, W - 128);
  x.lineWidth = 8; x.strokeStyle = "#1c1a17"; x.strokeRect(54, 54, W - 128, W - 128);
  x.fillStyle = "#e8c25b"; x.fillRect(110, 112, 190, 58); x.strokeRect(110, 112, 190, 58);
  x.fillStyle = "#1c1a17"; x.font = "bold 30px Arial, sans-serif"; x.textBaseline = "middle"; x.fillText("QUR’AN", 140, 142); x.textBaseline = "alphabetic";
  let size = 58, lines: string[] = [];
  for (; size >= 30; size -= 4) { x.font = `${size}px "Amiri Quran", "Amiri", serif`; lines = wrap(arabic, 820); if (lines.length * size * 1.9 <= 400) break; }
  x.direction = "rtl"; x.textAlign = "right"; let y = 270;
  for (const l of lines) { x.fillText(l, W - 110, y); y += size * 1.9; }
  x.direction = "ltr"; x.textAlign = "left";
  let ms = 36, mlines: string[] = [];
  for (; ms >= 22; ms -= 2) { x.font = `${ms}px Georgia, serif`; mlines = wrap(meaning, 820); if (y + 20 + mlines.length * ms * 1.4 <= 830) break; }
  y += 20; for (const l of mlines) { x.fillText(l, 110, y); y += ms * 1.4; }
  x.font = "bold 30px Arial, sans-serif"; x.fillText(ref, 110, 880);
  x.fillRect(110, 905, 60, 60); x.fillStyle = "#f7f3ea"; x.font = "42px Georgia, serif"; x.fillText("I", 130, 950);
  x.fillStyle = "#1c1a17"; x.font = "34px Georgia, serif"; x.fillText("IlmStation · ilmstation.com", 188, 948);
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/png"));
  if (!blob) return;
  const file = new File([blob], "ilmstation-verse.png", { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], text: `${ref} · via IlmStation` }); return; } catch { /* fall back to download */ } }
  const u = URL.createObjectURL(file); const a = document.createElement("a"); a.href = u; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
}
