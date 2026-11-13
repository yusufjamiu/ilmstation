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

const GOLD = "#9a7b2f";
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
  return <div ref={frame} style={{ boxSizing: "border-box", aspectRatio: "5 / 7.4", maxWidth: "34rem", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", background: "#fdf8ea", border: `3px double ${GOLD}`, boxShadow: `inset 0 0 0 4px #fdf8ea, inset 0 0 0 5px ${GOLD}`, padding: ".9rem 1.1rem .7rem", color: "#1b1a17" }}>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap" precedence="default"/>
    <div dir="rtl" style={{ display: "flex", justifyContent: "space-between", fontFamily: QFONT, fontSize: ".95rem", color: "#6b5520", borderBottom: `1px solid ${GOLD}`, paddingBottom: ".25rem", marginBottom: ".4rem" }}><span>الجزء {first ? arDigits(first.juz) : ""}</span><span>{first?.surahName}</span></div>
    <div ref={body} dir="rtl" lang="ar" style={{ flex: 1, minHeight: 0, overflow: "hidden", fontFamily: QFONT, lineHeight: 2.05, textAlign: "justify", textAlignLast: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {blocks.map((blk, bi) => <div key={bi}>
        {blk.head && <div style={{ textAlign: "center", margin: ".15em 0 .25em" }}>
          <div style={{ border: `2px solid ${GOLD}`, outline: `1px solid ${GOLD}`, outlineOffset: "3px", background: "#f3e8c6", padding: ".05em .8em", display: "block", fontSize: ".85em", lineHeight: 1.7 }}>{blk.head.surahName}</div>
          {blk.head.surah !== 1 && blk.head.surah !== 9 && <div style={{ fontSize: ".9em", marginTop: ".2em", lineHeight: 1.8 }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>}
        </div>}
        <p style={{ margin: 0 }}>{blk.items.map(a => {
          const key = `${a.surah}:${a.n}`;
          return <span key={key} onClick={() => onSelect(a)} style={{ cursor: "pointer", background: focus === key ? "rgba(214,170,60,.22)" : undefined, borderRadius: ".3em", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}>{a.text} <span aria-label={`Verse ${a.n}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.5em", height: "1.5em", margin: "0 .15em", borderRadius: "50%", border: `1.5px solid ${GOLD}`, boxShadow: `0 0 0 2px #fdf8ea, 0 0 0 3px ${GOLD}`, fontSize: ".5em", color: "#6b5520", verticalAlign: "middle", background: "#fdf8ea" }}>{arDigits(a.n)}</span>{" "}</span>;
        })}</p>
      </div>)}
    </div>
    <div style={{ textAlign: "center", fontFamily: QFONT, color: "#6b5520", borderTop: `1px solid ${GOLD}`, marginTop: ".4rem", paddingTop: ".25rem" }}>{arDigits(page)}</div>
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
  const banner = (n: number) => <div style={{ width: "100%", border: `2px solid ${GOLD}`, outline: `1px solid ${GOLD}`, outlineOffset: "3px", background: "#f3e8c6", textAlign: "center", fontFamily: QFONT, fontSize: "1.1rem", lineHeight: 1.6, padding: ".05em .6em" }}>{nameOf(n)}</div>;
  return <div ref={frame} style={{ boxSizing: "border-box", aspectRatio: "5 / 7.4", maxWidth: "34rem", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", background: "#fdf8ea", border: `3px double ${GOLD}`, boxShadow: `inset 0 0 0 4px #fdf8ea, inset 0 0 0 5px ${GOLD}`, padding: ".8rem 1rem .6rem", color: "#1b1a17" }}>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap" precedence="default"/>
    <div dir="rtl" style={{ display: "flex", justifyContent: "space-between", fontFamily: QFONT, fontSize: ".95rem", color: "#6b5520", borderBottom: `1px solid ${GOLD}`, paddingBottom: ".25rem", marginBottom: ".35rem" }}><span>الجزء {first ? arDigits(first.juz) : ""}</span><span>{first?.surahName}</span></div>
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
    <div style={{ textAlign: "center", fontFamily: QFONT, color: "#6b5520", borderTop: `1px solid ${GOLD}`, marginTop: ".35rem", paddingTop: ".2rem" }}>{arDigits(page)}</div>
  </div>;
}

function readSaved(): { page: number; at: number } | null {
  try { const raw = localStorage.getItem("ilmstation:tilawah-page"); if (!raw) return null; const v = JSON.parse(raw); return typeof v?.page === "number" ? { page: v.page, at: v.at ?? 0 } : null; } catch { return null; }
}
function writeSaved(page: number, at: number) { try { localStorage.setItem("ilmstation:tilawah-page", JSON.stringify({ page, at })); } catch { /* ignore */ } }

/** Tilawah: read the Qur'an page by page, like the printed mushaf. Your page is saved to your account (and this device), so you can pick up later from anywhere. */
function Tilawah() {
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

  const go = (p: number) => { if (p >= 1 && p <= TOTAL_PAGES) { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const currentSurah = ayahs?.[0]?.surah ?? 1;
  return <div className="mt-4 min-w-0 space-y-4">
    <section className={cn(panel, "space-y-3")}>
      <div className="flex flex-wrap items-center gap-3"><BookOpen className="size-5"/><h2 className="font-serif text-2xl">Tilawah</h2><span className="text-sm text-muted-foreground">Read page by page. Tap a verse for its meaning.</span></div>
      <div className="flex flex-wrap items-center gap-2">
        <SurahPicker value={currentSurah} onChange={n => { void pageOfSurah(n).then(go).catch(() => setError(true)); }}/>
        <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); const p = Number(jump); if (p >= 1 && p <= TOTAL_PAGES) { go(Math.floor(p)); setJump(""); } }}><input value={jump} onChange={e => setJump(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" placeholder={`Page 1-${TOTAL_PAGES}`} aria-label="Go to page" className="h-11 w-32 border-2 border-foreground bg-background px-3"/><Button type="submit" variant="outline">Go</Button></form>
        {saved !== null && saved !== page && <Button variant="secondary" onClick={() => go(saved)}>Continue where I stopped (page {saved})</Button>}
      </div>
    </section>
    {error ? <section className={panel}><p className="text-sm">We couldn't load this page. Check your connection and try again.</p><Button className="mt-3" onClick={() => setTick(t => t + 1)}>Try again</Button></section> : !ayahs || (!layout && !layoutFailed) ? <p className="text-sm text-muted-foreground">Loading the page…</p> : <>
      {layout ? <QcfPage page={page} layout={layout} ayahs={ayahs} focus={pick ? `${pick.surah}:${pick.n}` : null} onSelect={key => setPick(ayahs.find(a => `${a.surah}:${a.n}` === key) ?? null)}/> : <MushafPage page={page} ayahs={ayahs} focus={pick ? `${pick.surah}:${pick.n}` : null} onSelect={a => setPick(a)}/>}
      {pick && <section className={cn(panel, "space-y-1")}><p className="text-xs font-bold uppercase text-muted-foreground">{surahList.find(s => s.n === pick.surah)?.name} · verse {pick.n}</p><p className="text-sm leading-relaxed">{pick.meaning}</p></section>}
      <div className="mx-auto flex max-w-[34rem] items-center justify-between gap-2">
        <Button variant="outline" disabled={page >= TOTAL_PAGES} onClick={() => go(page + 1)}><ArrowLeft /> Next page</Button>
        <span className="text-sm font-bold">{page} / {TOTAL_PAGES}</span>
        <Button variant="outline" disabled={page <= 1} onClick={() => go(page - 1)}>Previous page <ArrowRight /></Button>
      </div>
    </>}
  </div>;
}

/** Listen: play a surah verse by verse with the verse you hear highlighted on the page. */
function Listen() {
  const [surah, setSurah] = useState(1);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reciter, setReciter] = useState(reciters[0]!.id);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(false);
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
    if (idx < last) setIdx(i => i + 1); else setPlaying(false);
  }
  const [a, b] = pageSlice([0, Math.max(0, last)], idx);
  return <div className="mt-4 min-w-0 space-y-4">
    <section className={cn(panel, "space-y-3")}>
      <div className="flex flex-wrap items-center gap-3"><Headphones className="size-5"/><h2 className="font-serif text-2xl">Listen</h2><span className="text-sm text-muted-foreground">Follow the highlighted verse as it is recited.</span></div>
      <div className="flex flex-wrap items-center gap-2">
        <SurahPicker value={surah} onChange={n => { audio.current?.pause(); setPlaying(false); setSurah(n); setIdx(0); }}/>
        <select value={reciter} onChange={e => setReciter(e.target.value)} aria-label="Reciter" className="h-11 min-w-0 border-2 border-foreground bg-background px-3">{reciters.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select value={speed} onChange={e => setSpeed(Number(e.target.value))} aria-label="Playback speed" className="h-11 border-2 border-foreground bg-background px-3">{speeds.map(v => <option key={v} value={v}>{v}×</option>)}</select>
      </div>
    </section>
    {error ? <section className={panel}><p className="text-sm">We couldn't load this surah. Check your connection and try again.</p><Button className="mt-3" onClick={retry}>Try again</Button></section> : !verses ? <p className="text-sm text-muted-foreground">Loading the surah…</p> : <>
      <PageView verses={verses.slice(a, b + 1)} from={a} revealUpTo={verses.length} focus={idx} peek={false} onSelect={n => setIdx(n)} title={meta.arabic} juz={meta.juz} number={surah}/>
      <section className={cn(panel, "space-y-3")}>
        <p className="text-xs font-bold uppercase text-muted-foreground">{meta.name} · verse {idx + 1} of {verses.length}</p>
        <p className="text-sm leading-relaxed">{verses[idx]?.meaning}</p>
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
  const [section, setSection] = useState<Section>("hifz");
  const practice = section === "hifz" || section === "revision";
  return <div>
    <div className="flex flex-wrap gap-1 border-b-2 border-foreground" role="tablist" aria-label="Quran sections">{sections.map(item => <button key={item.id} role="tab" aria-selected={section === item.id} onClick={() => setSection(item.id)} className={cn("-mb-0.5 border-2 border-foreground px-4 py-2 text-sm font-bold", section === item.id ? "bg-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</div>
    {practice && <HifzScreen section={section === "revision" ? "revision" : "hifz"} onGoRevision={() => setSection("revision")}/>}
    {section === "tilawah" && <Tilawah/>}
    {section === "listen" && <Listen/>}
  </div>;
}