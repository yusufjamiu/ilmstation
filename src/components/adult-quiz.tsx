import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Pause, Play, RotateCcw, Trophy, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { surahList, type SurahMeta } from "@/components/quran-data";
import { reciters } from "@/components/hifz";
import { quranEdition } from "@/components/language";
import { usePlaytime, TimeUp, KidGames, useAdminGames } from "@/components/kids";
import { auth } from "@/lib/firebase";
import { wordTimings } from "@/lib/word-timing";
import { awardXp } from "@/lib/xp";
import { cn } from "@/lib/utils";

/* ============================================================
   One quiz engine, many packs.
   A pack has modes; a mode starts a session that makes one question at a time.
   Packs: Qur'an (live) → Hadith, Qira'ah, Arabiyyah, Seerah, Fiqh (next, one at a time).
   ============================================================ */

type Rng = () => number;
type Reciter = (typeof reciters)[number];
type Rec = { reciter: Reciter; surah: number; ayah: number; global: number };
type Opt = { label: string; sub?: string; arabic?: boolean };
type Base = { prompt: string; tag: string; ref: string; secs: number; meaning?: string; fullArabic?: string; note?: string; rec?: Rec; preAudio?: boolean; stopBefore?: number };
type ChoiceQ = Base & { kind: "choice"; verse?: string[]; blank?: number; blankWord?: string; options: Opt[]; answer: number };
type ArrangeQ = Base & { kind: "arrange"; words: string[] };
type RevealQ = Base & { kind: "reveal"; verse: string[]; blank: number; blankWord: string };
type TapQ = Base & { kind: "tap"; verse: string[]; answer: number; correctWord: string };
type Q = ChoiceQ | ArrangeQ | RevealQ | TapQ;
type Session = { total: number; next: () => Promise<Q> };
type Settings = { level: string; reciter: string; surah?: number };
type Ctx = { r: Rng; s: Settings };
type Mode = { id: string; title: string; emoji: string; blurb: string };

const ROUNDS = 10;
const DAILY_N = 5;

/* ---------------- helpers ---------------- */
const pick = <T,>(r: Rng, a: T[]): T => a[Math.floor(r() * a.length)]!;
const shuffle = <T,>(r: Rng, a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; };
/** Same numbers for everyone on the same day (daily challenge). */
const seeded = (seed: string): Rng => { let h = 1779033703; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353); return () => { h = (h + 0x6d2b79f5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const hasLetter = /[ء-يٱ-ۓ]/;
const words = (t: string) => t.split(/\s+/).filter((w) => hasLetter.test(w));
/** Letters only, to compare words without marks. */
const plain = (t: string) => t.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/[ٱأإآ]/g, "ا");
const short = (t: string, n = 12) => { const w = words(t); return w.length > n ? `${w.slice(0, n).join(" ")} …` : w.join(" "); };
const trimText = (t: string, n = 170) => (t.length > n ? `${t.slice(0, n).trim()}…` : t);
const utcDay = () => new Date().toISOString().slice(0, 10);

/* ---------------- Qur'an data ---------------- */
type Verse = { surah: SurahMeta; n: number; global: number; text: string; meaning: string };
const surahCache = new Map<string, Promise<Verse[]>>();
function loadSurah(n: number): Promise<Verse[]> {
  const ed = quranEdition();
  const key = `${n}:${ed}`;
  if (!surahCache.has(key)) {
    const meta = surahList.find((s) => s.n === n)!;
    const p = fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,${ed}`).then((r) => r.json()).then((j: { data: { ayahs: { number: number; numberInSurah: number; text: string }[] }[] }) => {
      const [ar, tr] = j.data;
      return ar!.ayahs.map((a, i) => {
        let text = a.text.replace(/^\uFEFF/, "").trim();
        // the API puts the Basmalah in front of verse 1 (not part of the verse, except Al-Fatiha)
        if (a.numberInSurah === 1 && n !== 1 && n !== 9 && text.startsWith("بِسْمِ")) text = text.split(/\s+/).slice(4).join(" ");
        return { surah: meta, n: a.numberInSurah, global: a.number, text, meaning: tr?.ayahs[i]?.text ?? "" };
      });
    });
    p.catch(() => surahCache.delete(key));
    surahCache.set(key, p);
  }
  return surahCache.get(key)!;
}

const LEVELS: [string, string, number, string][] = [["easy", "Easy · Juz ʿAmma", 78, "Beginner"], ["medium", "Medium · Juz 28–30", 58, "Intermediate"], ["hard", "Hard · Whole Qur’an", 1, "Advanced"]];
const levelSurahs = (l: string) => surahList.filter((s) => s.n >= (LEVELS.find(([id]) => id === l)?.[2] ?? 78));
const tagOf = (s: SurahMeta) => (s.n >= 78 ? "Easy" : s.n >= 58 ? "Medium" : "Hard");
/** Bigger surahs come up more often (so the whole Qur'an is fair), but every surah can appear. */
const pickSurah = (r: Rng, list: SurahMeta[]) => { const total = list.reduce((s, x) => s + Math.sqrt(x.ayahs), 0); let v = r() * total; for (const s of list) { v -= Math.sqrt(s.ayahs); if (v <= 0) return s; } return list[list.length - 1]!; };
// reciters that have word timings, so the words can light up as they recite
const TIMED = ["ar.alafasy", "ar.husary", "ar.minshawi", "ar.abdulbasitmurattal", "ar.abdurrahmaansudais"];
const reciterFor = (c: Ctx) => (c.s.reciter === "mixed" ? pick(c.r, reciters.filter((x) => TIMED.includes(x.id))) : reciters.find((x) => x.id === c.s.reciter) ?? reciters[0]!);
const recOf = (c: Ctx, v: Verse): Rec => ({ reciter: reciterFor(c), surah: v.surah.n, ayah: v.n, global: v.global });
const refOf = (v: Verse) => `Surah ${v.surah.name} · ${v.surah.n}:${v.n}`;
const about = (v: Verse) => ({ ref: refOf(v), meaning: v.meaning, fullArabic: v.text, tag: tagOf(v.surah) });

async function verseFrom(c: Ctx, ok: (v: Verse, all: Verse[]) => boolean, surahs = levelSurahs(c.s.level)) {
  for (let t = 0; t < 10; t++) {
    const s = pickSurah(c.r, surahs);
    const all = await loadSurah(s.n);
    const good = all.filter((v) => ok(v, all));
    if (good.length) return { v: pick(c.r, good), all };
  }
  throw new Error("No verse found");
}
const wc = (min: number, max = 999) => (v: Verse) => { const n = words(v.text).length; return n >= min && n <= max; };

/** Fills up to `need` distinct items from the surah, then nearby surahs. */
async function gather<T>(c: Ctx, s: SurahMeta, need: number, from: (all: Verse[]) => T[], key: (x: T) => string, skip: Set<string>) {
  const out: T[] = [];
  const take = (items: T[]) => { for (const x of shuffle(c.r, items)) { if (out.length >= need) break; const k = key(x); if (!k || skip.has(k)) continue; skip.add(k); out.push(x); } };
  take(from(await loadSurah(s.n)));
  for (const n of [s.n + 1, s.n - 1, s.n + 2, s.n - 2, s.n + 3]) { if (out.length >= need) break; if (n >= 1 && n <= 114) take(from(await loadSurah(n))); }
  return out;
}

/* ---------------- Qur'an games ---------------- */
async function guessSurah(c: Ctx): Promise<Q> {
  const list = levelSurahs(c.s.level);
  const { v } = await verseFrom(c, wc(4));
  const opts = shuffle(c.r, [v.surah, ...shuffle(c.r, list.filter((x) => x.n !== v.surah.n)).slice(0, 3)]);
  return { kind: "choice", prompt: "Guess the surah", verse: words(v.text), options: opts.map((o) => ({ label: o.arabic, sub: o.name, arabic: true })), answer: opts.indexOf(v.surah),
    rec: recOf(c, v), preAudio: true, secs: 20, ...about(v), fullArabic: undefined };
}

async function lastWordQ(c: Ctx) {
  const { v } = await verseFrom(c, wc(4));
  const w = words(v.text); const blank = w.length - 1; const right = w[blank]!;
  const ends = await gather(c, v.surah, 3, (all) => all.filter((x) => x.n !== v.n).map((x) => words(x.text).at(-1) ?? ""), plain, new Set([plain(right)]));
  return { v, w, blank, right, ends };
}
async function finishAyah(c: Ctx): Promise<Q> {
  const { v, w, blank, right, ends } = await lastWordQ(c);
  const opts = shuffle(c.r, [right, ...ends]);
  return { kind: "choice", prompt: "Finish the ayah", verse: w, blank, blankWord: right, options: opts.map((o) => ({ label: o, arabic: true })), answer: opts.indexOf(right),
    rec: recOf(c, v), preAudio: true, stopBefore: blank, secs: 20, ...about(v) };
}
async function onlyHuffaz(c: Ctx): Promise<Q> {
  const { v } = await verseFrom(c, wc(4));
  const w = words(v.text);
  return { kind: "reveal", prompt: "Finish the ayah", verse: w, blank: w.length - 1, blankWord: w.at(-1)!, rec: recOf(c, v), preAudio: true, stopBefore: w.length - 1, secs: 15, ...about(v), tag: "Only Huffaz" };
}

/** Shows verse k, asks for the verse after (or before). */
async function neighbourQ(c: Ctx, all: Verse[], k: number, dir: 1 | -1, prompt: string): Promise<Q> {
  const cur = all[k]!, right = all[k + dir]!;
  const others = await gather(c, cur.surah, 3, (list) => list.filter((x) => x.global !== cur.global && x.global !== right.global).map((x) => x.text), (t) => plain(short(t)), new Set([plain(short(right.text)), plain(short(cur.text))]));
  const opts = shuffle(c.r, [right.text, ...others]);
  return { kind: "choice", prompt, verse: words(cur.text), options: opts.map((o) => ({ label: short(o), arabic: true })), answer: opts.indexOf(right.text),
    rec: recOf(c, cur), preAudio: true, secs: 25, ...about(right) };
}
async function nextVerse(c: Ctx): Promise<Q> { const { v, all } = await verseFrom(c, (x, a) => x.n < a.length); return neighbourQ(c, all, v.n - 1, 1, "What comes next?"); }
async function prevVerse(c: Ctx): Promise<Q> { const { v, all } = await verseFrom(c, (x) => x.n > 1); return neighbourQ(c, all, v.n - 1, -1, "What comes before?"); }

async function verseNumber(c: Ctx): Promise<Q> {
  const { v } = await verseFrom(c, wc(3), levelSurahs(c.s.level).filter((s) => s.ayahs >= 4));
  const near = shuffle(c.r, Array.from({ length: v.surah.ayahs }, (_, i) => i + 1).filter((x) => x !== v.n && Math.abs(x - v.n) <= 5));
  const opts = [v.n, ...near.slice(0, 3)].sort((a, b) => a - b);
  return { kind: "choice", prompt: `Which ayah of Surah ${v.surah.name} is this?`, verse: words(v.text), options: opts.map((o) => ({ label: `Ayah ${o}` })), answer: opts.indexOf(v.n),
    rec: recOf(c, v), preAudio: true, secs: 20, ...about(v), fullArabic: undefined };
}

async function edgeVerse(c: Ctx, end: "first" | "last"): Promise<Q> {
  const list = levelSurahs(c.s.level);
  const s = pickSurah(c.r, list);
  const at = async (x: SurahMeta) => { const all = await loadSurah(x.n); return end === "first" ? all[0]! : all[all.length - 1]!; };
  const right = await at(s);
  const seen = new Set([plain(short(right.text))]); const others: Verse[] = [];
  for (const x of shuffle(c.r, list.filter((y) => y.n !== s.n))) { if (others.length >= 3) break; const v = await at(x); const k = plain(short(v.text)); if (!seen.has(k)) { seen.add(k); others.push(v); } }
  const opts = shuffle(c.r, [right, ...others]);
  return { kind: "choice", prompt: end === "first" ? `How does Surah ${s.name} begin?` : `How does Surah ${s.name} end?`, options: opts.map((o) => ({ label: short(o.text), arabic: true })), answer: opts.indexOf(right),
    rec: recOf(c, right), secs: 25, ...about(right) };
}

async function makkahMadinah(c: Ctx): Promise<Q> {
  const { v } = await verseFrom(c, wc(3));
  const med = v.surah.type === "Medinan";
  return { kind: "choice", prompt: `Was Surah ${v.surah.name} revealed in Makkah or Madinah?`, verse: words(v.text), options: [{ label: "Makkah", sub: "مكية" }, { label: "Madinah", sub: "مدنية" }], answer: med ? 1 : 0,
    rec: recOf(c, v), preAudio: true, secs: 15, ...about(v), fullArabic: undefined, note: `Surah ${v.surah.name} is ${med ? "Madani" : "Makki"} by the common classification. Scholars differ on a few surahs.` };
}

async function findMistake(c: Ctx): Promise<Q> {
  const { v, all } = await verseFrom(c, wc(5, 14));
  const w = words(v.text);
  const mine = new Set(w.map(plain));
  const pool = [...new Set(all.filter((x) => x.n !== v.n).flatMap((x) => words(x.text)))].filter((x) => !mine.has(plain(x)) && plain(x).length >= 3);
  if (!pool.length) throw new Error("no swap");
  const p = Math.floor(c.r() * w.length);
  const shown = [...w]; shown[p] = pick(c.r, pool);
  return { kind: "tap", prompt: "Find the mistake", verse: shown, answer: p, correctWord: w[p]!, rec: recOf(c, v), secs: 30, ...about(v), tag: "Hard" };
}

async function meaningMatch(c: Ctx): Promise<Q> {
  const { v } = await verseFrom(c, (x) => wc(3)(x) && !!x.meaning);
  const others = await gather(c, v.surah, 3, (all) => all.filter((x) => x.n !== v.n).map((x) => x.meaning), (t) => t.slice(0, 60), new Set([v.meaning.slice(0, 60)]));
  const opts = shuffle(c.r, [v.meaning, ...others]);
  return { kind: "choice", prompt: "What does this verse mean?", verse: words(v.text), options: opts.map((o) => ({ label: trimText(o) })), answer: opts.indexOf(v.meaning),
    rec: recOf(c, v), preAudio: true, secs: 30, ...about(v), fullArabic: undefined };
}

async function arrangeVerse(c: Ctx): Promise<Q> {
  const { v } = await verseFrom(c, wc(4));
  const w = words(v.text); const part = w.length > 9; // long verse → arrange its first part
  return { kind: "arrange", prompt: part ? "Arrange the start of the verse" : "Arrange the verse", words: part ? w.slice(0, 8) : w, rec: recOf(c, v), secs: 45, ...about(v) };
}

const MAKERS: Record<string, (c: Ctx) => Promise<Q>> = {
  surah: guessSurah, finish: finishAyah, huffaz: onlyHuffaz, next: nextVerse, prev: prevVerse, arrange: arrangeVerse, number: verseNumber,
  first: (c) => edgeVerse(c, "first"), last: (c) => edgeVerse(c, "last"), place: makkahMadinah, mistake: findMistake, meaning: meaningMatch,
};

/** Complete the surah: walk through one surah, verse after verse. */
async function chainSession(c: Ctx): Promise<Session> {
  const s = c.s.surah ? surahList.find((x) => x.n === c.s.surah)! : pickSurah(c.r, levelSurahs(c.s.level).filter((x) => x.ayahs >= 3));
  const all = await loadSurah(s.n);
  const start = all.length <= 11 ? 0 : Math.floor(c.r() * (all.length - 10));
  const total = Math.min(10, all.length - 1 - start);
  let i = 0;
  return { total, next: () => { const k = start + i++; return neighbourQ(c, all, k, 1, `Complete Surah ${s.name}: what comes next?`); } };
}

function quranSession(mode: string, s: Settings): Promise<Session> {
  const c: Ctx = { r: Math.random, s };
  if (mode === "chain") return chainSession(c);
  if (mode === "daily") {
    const r = seeded(`quran-${utcDay()}`); const d: Ctx = { r, s: { level: "medium", reciter: "mixed" } };
    const plan = [guessSurah, finishAyah, nextVerse, meaningMatch, findMistake];
    let i = 0;
    return Promise.resolve({ total: DAILY_N, next: () => plan[i++ % plan.length]!(d).catch(() => guessSurah(d)) });
  }
  const keys = Object.keys(MAKERS);
  return Promise.resolve({ total: ROUNDS, next: () => (mode === "mixed" ? MAKERS[pick(c.r, keys)]!(c).catch(() => guessSurah(c)) : (MAKERS[mode] ?? guessSurah)(c)) });
}

const QURAN_GROUPS: [string, Mode[]][] = [
  ["Memorisation", [
    { id: "finish", title: "Finish the ayah", emoji: "✍️", blurb: "The last word is missing. Pick it." },
    { id: "chain", title: "Complete the surah", emoji: "📿", blurb: "Pick the next verse, all through a surah." },
    { id: "huffaz", title: "Only Huffaz", emoji: "🧠", blurb: "No choices. Say the missing word, then reveal." },
    { id: "prev", title: "What comes before?", emoji: "⏪", blurb: "Pick the verse before this one." },
    { id: "arrange", title: "Arrange the verse", emoji: "🧩", blurb: "Tap the words in the right order." },
    { id: "first", title: "How does it begin?", emoji: "🌅", blurb: "Pick the first verse of a surah." },
    { id: "last", title: "How does it end?", emoji: "🌙", blurb: "Pick the last verse of a surah." },
    { id: "mistake", title: "Find the mistake", emoji: "🔍", blurb: "One word was swapped. Tap it." },
  ]],
  ["Know the Qur’an", [
    { id: "surah", title: "Guess the surah", emoji: "🎧", blurb: "Hear a reciter. Which surah is it?" },
    { id: "number", title: "Which ayah number?", emoji: "🔢", blurb: "Pick the verse number." },
    { id: "place", title: "Makkah or Madinah?", emoji: "🕋", blurb: "Where was this surah revealed?" },
    { id: "meaning", title: "What does it mean?", emoji: "💬", blurb: "Pick the meaning in your language." },
    { id: "mixed", title: "Mixed", emoji: "🎲", blurb: "A bit of every game." },
  ]],
];

type Pack = { id: string; title: string; arabic: string; emoji: string; tint: string; live: boolean; games: number };
const PACKS: Pack[] = [
  { id: "quran", title: "Qur’an", arabic: "القرآن", emoji: "📖", tint: "bg-primary", live: true, games: 12 },
  { id: "hadith", title: "Hadith", arabic: "الحديث", emoji: "📜", tint: "bg-secondary text-secondary-foreground", live: false, games: 0 },
  { id: "qiraah", title: "Qira’ah", arabic: "القراءة", emoji: "🔤", tint: "bg-[#d7ecd9] text-[#1c1a17]", live: false, games: 0 },
  { id: "arabiyyah", title: "Arabiyyah", arabic: "العربية", emoji: "✍️", tint: "bg-[#f7d9c4] text-[#1c1a17]", live: false, games: 0 },
  { id: "seerah", title: "Seerah", arabic: "السيرة", emoji: "🌙", tint: "bg-background", live: false, games: 0 },
  { id: "fiqh", title: "Fiqh", arabic: "الفقه", emoji: "🕌", tint: "bg-muted", live: false, games: 0 },
];

/* ---------------- reciter with words lighting up ---------------- */
function useRecital() {
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const cur = useRef<{ a?: HTMLAudioElement; t?: number; tok: number }>({ tok: 0 });
  const stop = useCallback(() => { const c = cur.current; c.tok++; c.a?.pause(); if (c.t) clearInterval(c.t); c.a = undefined; setPlaying(false); setActive(-1); }, []);
  /** Plays the verse; with `stopBefore`, stops before that word (so the hidden word isn't given away). */
  const play = useCallback(async (rec: Rec, stopBefore?: number) => {
    stop(); const tok = cur.current.tok;
    const t = await wordTimings(rec.reciter.id, rec.surah, rec.ayah);
    if (cur.current.tok !== tok) return;
    const cut = stopBefore !== undefined ? t?.segs.find((s) => s.word === stopBefore + 1)?.start : undefined;
    if (stopBefore !== undefined && cut === undefined) return; // no timings: stay quiet rather than give the answer away
    const a = new Audio(t?.url ?? `https://cdn.islamic.network/quran/audio/${rec.reciter.bitrate}/${rec.reciter.id}/${rec.global}.mp3`);
    cur.current.a = a;
    const end = () => { if (cur.current.a !== a) return; if (cur.current.t) clearInterval(cur.current.t); setPlaying(false); setActive(-1); };
    a.onended = end; a.onerror = end;
    setPlaying(true);
    if (t) cur.current.t = window.setInterval(() => {
      const ms = a.currentTime * 1000;
      if (cut !== undefined && ms >= cut - 60) { a.pause(); end(); return; }
      let w = -1; for (const s of t.segs) if (ms >= s.start) w = s.word - 1;
      setActive(w);
    }, 60);
    a.play().catch(end);
  }, [stop]);
  useEffect(() => stop, [stop]);
  return { active, playing, play, stop };
}

/* ---------------- screens ---------------- */

/** Adult Play → Games & quizzes. */
export function AdultGames() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [more, setMore] = useState(false);
  const adminGames = useAdminGames("all");
  if (more) return <div><Button variant="outline" onClick={() => setMore(false)}>← Games &amp; quizzes</Button><div className="mt-4"><KidGames audience="all" /></div></div>;
  if (pack) return <QuranPack onBack={() => setPack(null)} />;
  return <div className="iq-rise">
    <p className="text-xs font-bold uppercase text-muted-foreground">Play and learn</p>
    <h1 className="font-serif text-5xl leading-none">Games &amp; quizzes</h1>
    <p className="mt-3 text-lg text-muted-foreground">Pick a subject. Every right answer earns XP.</p>
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{PACKS.map((p) => <button key={p.id} disabled={!p.live} onClick={() => setPack(p)}
      className={cn("flex min-h-40 flex-col justify-between border-2 border-foreground p-5 text-start shadow-brutal transition", p.tint, p.live ? "hover:-translate-y-1" : "opacity-60")}>
      <span className="text-5xl">{p.emoji}</span>
      <span><b className="block font-serif text-3xl leading-none">{p.title}</b><span dir="rtl" lang="ar" className="font-arabic text-lg">{p.arabic}</span>
        <span className="mt-1 block text-sm font-semibold">{p.live ? `${p.games} games · ▶ Play` : "Coming soon"}</span></span>
    </button>)}</div>
    {adminGames.length > 0 && <button onClick={() => setMore(true)} className="mt-6 flex w-full items-center justify-between border-2 border-foreground bg-background p-5 text-start shadow-brutal">
      <span><b className="block font-serif text-2xl">More games</b><span className="text-sm text-muted-foreground">{adminGames.length} from the IlmStation team</span></span><ChevronRight />
    </button>}
  </div>;
}

function QuranPack({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [daily, setDaily] = useState<"play" | "board" | null>(null);
  const [choosingSurah, setChoosingSurah] = useState(false);
  const [surah, setSurah] = useState<number | undefined>();
  const [level, setLevel] = useState(() => { try { return localStorage.getItem("iq_qlevel") ?? "easy"; } catch { return "easy"; } });
  const [reciter, setReciter] = useState("mixed");
  useEffect(() => { try { localStorage.setItem("iq_qlevel", level); } catch { /* ignore */ } }, [level]);
  const today = utcDay();
  const played = (() => { try { return localStorage.getItem(`iq_qdaily_${today}`); } catch { return null; } })();
  const lv = LEVELS.find(([id]) => id === level) ?? LEVELS[0]!;

  if (daily === "board") return <div className="iq-rise mx-auto max-w-2xl"><Button variant="outline" onClick={() => setDaily(null)}>← Qur’an</Button><div className="mt-4"><DailyBoard date={today} /></div></div>;
  if (daily === "play") return <QuizRun title="Daily challenge" daily start={() => quranSession("daily", { level: "medium", reciter: "mixed" })} xpLevel="Intermediate" topic="Qur’an: Daily challenge" onExit={() => setDaily(null)} />;
  if (mode) return <QuizRun title={mode.title} start={() => quranSession(mode.id, { level, reciter, surah })} xpLevel={lv[3]} topic={`Qur’an: ${mode.title}`} onExit={() => { setMode(null); setSurah(undefined); }} />;

  if (choosingSurah) return <div className="iq-rise">
    <Button variant="outline" onClick={() => setChoosingSurah(false)}>← Qur’an</Button>
    <h1 className="mt-4 font-serif text-4xl">📿 Complete which surah?</h1>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button onClick={() => { setChoosingSurah(false); setMode({ id: "chain", title: "Complete the surah", emoji: "📿", blurb: "" }); }} className="border-2 border-foreground bg-primary p-3 font-bold">🎲 Surprise me</button>
      {levelSurahs(level).filter((s) => s.ayahs >= 3).map((s) => <button key={s.n} onClick={() => { setSurah(s.n); setChoosingSurah(false); setMode({ id: "chain", title: `Complete ${s.name}`, emoji: "📿", blurb: "" }); }}
        className="flex items-center justify-between gap-2 border-2 border-foreground bg-background p-3 text-start"><span className="text-sm font-semibold">{s.n}. {s.name}</span><span dir="rtl" lang="ar" className="font-arabic">{s.arabic}</span></button>)}
    </div>
  </div>;

  return <div className="iq-rise">
    <Button variant="outline" onClick={onBack}>← Subjects</Button>
    <h1 className="mt-4 font-serif text-5xl leading-none">📖 Qur’an</h1>

    <div className="mt-5 flex flex-wrap items-center gap-4 border-2 border-foreground bg-[#14130f] p-5 text-[#f3ead6] shadow-brutal">
      <span className="text-5xl">🏆</span>
      <span className="min-w-0 flex-1"><span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Daily Qur’an challenge</span>
        <b className="block font-serif text-3xl leading-none">5 questions · same for everyone</b>
        <span className="text-sm opacity-80">{played !== null ? `You scored ${played}/${DAILY_N} today. Come back tomorrow, in shaa Allah.` : "One try a day. Fastest with the most right answers tops the board."}</span></span>
      <span className="flex gap-2">
        {played === null && <button onClick={() => setDaily("play")} className="animate-pulse border-2 border-[#d4af37] bg-[#d4af37] px-4 py-2 font-bold text-[#14130f]">▶ Start</button>}
        <button onClick={() => setDaily("board")} className="border-2 border-[#d4af37] px-4 py-2 font-bold text-[#d4af37]"><Trophy className="inline size-4" /> Board</button>
      </span>
    </div>

    <div className="mt-5 grid gap-3 border-2 border-foreground bg-background p-4">
      <div><p className="text-xs font-bold uppercase">Level</p>
        <div className="mt-2 flex flex-wrap gap-2">{LEVELS.map(([id, label]) => <Button key={id} size="sm" variant={level === id ? "default" : "outline"} onClick={() => setLevel(id)}>{label}</Button>)}</div></div>
      <label className="text-xs font-bold uppercase">Reciter
        <select value={reciter} onChange={(e) => setReciter(e.target.value)} className="mt-2 block h-10 w-full border-2 border-foreground bg-background px-2 text-sm font-normal normal-case">
          <option value="mixed">Different reciter each question</option>{reciters.map((r) => <option key={r.id} value={r.id}>{r.name}{TIMED.includes(r.id) ? "" : " (no word highlight)"}</option>)}
        </select></label>
    </div>

    {QURAN_GROUPS.map(([group, modes]) => <section key={group} className="mt-6">
      <h2 className="font-serif text-3xl">{group}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{modes.map((m, i) => <button key={m.id} onClick={() => (m.id === "chain" ? setChoosingSurah(true) : setMode(m))}
        className={cn("flex items-center gap-4 border-2 border-foreground p-4 text-start shadow-brutal transition hover:-translate-y-1", ["bg-primary", "bg-secondary text-secondary-foreground", "bg-[#d7ecd9] text-[#1c1a17]", "bg-background"][i % 4])}>
        <span className="text-4xl">{m.emoji}</span>
        <span className="min-w-0 flex-1"><b className="block font-serif text-2xl leading-tight">{m.title}</b><span className="text-sm">{m.blurb}</span></span>
        <span className="shrink-0 border-2 border-foreground bg-background px-3 py-1 text-sm font-bold text-foreground">▶ Start</span>
      </button>)}</div>
    </section>)}
  </div>;
}

const TAG_TONE: Record<string, string> = { Easy: "border-[#3fa66b] text-[#6fd39a]", Medium: "border-[#d4af37] text-[#d4af37]", Hard: "border-[#e07a3f] text-[#f0a070]", "Only Huffaz": "border-[#c94653] bg-[#3d1719] text-[#ff8a95]" };

function QuizRun({ title, start, onExit, xpLevel, topic, daily = false }: { title: string; start: () => Promise<Session>; onExit: () => void; xpLevel: string; topic: string; daily?: boolean }) {
  const session = useRef<Session | null>(null);
  const prefetch = useRef<Promise<Q> | null>(null);
  const t0 = useRef(Date.now());
  const [total, setTotal] = useState(ROUNDS);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<Q | null>(null);
  const [err, setErr] = useState(false);
  const [answered, setAnswered] = useState<boolean | null>(null); // null = not yet
  const [picked, setPicked] = useState<number | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [left, setLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sent, setSent] = useState<"idle" | "ok" | "already" | "fail">("idle");
  const rc = useRecital();
  const pt = usePlaytime(!finished);

  const show = (x: Q) => {
    setQ(x); setLeft(x.secs * 1000); setPaused(false);
    if (x.kind === "arrange") { let o = shuffle(Math.random, x.words.map((_, i) => i)); if (o.every((v, i) => v === i)) o = o.reverse(); setOrder(o); }
    if (x.preAudio && x.rec) void rc.play(x.rec, x.stopBefore);
  };
  const loadNext = (fresh: boolean) => {
    rc.stop(); setQ(null); setErr(false); setAnswered(null); setPicked(null); setBuilt([]); setRevealed(false);
    const s = session.current!;
    const p = fresh || !prefetch.current ? s.next() : prefetch.current;
    prefetch.current = null;
    p.then((x) => { show(x); prefetch.current = s.next(); prefetch.current.catch(() => { prefetch.current = null; }); }).catch(() => setErr(true));
  };
  const begin = () => {
    setErr(false); setRound(0); setScore(0); setFinished(false); t0.current = Date.now();
    start().then((s) => { session.current = s; setTotal(s.total); loadNext(true); }).catch(() => setErr(true));
  };
  useEffect(begin, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mark = (ok: boolean) => {
    if (answered !== null) return;
    setAnswered(ok); if (ok) setScore((n) => n + 1);
    if (q?.rec) void rc.play(q.rec); // full verse after answering
  };
  const finish = () => {
    rc.stop(); setFinished(true);
    void awardXp("quiz", { correct: score, total, difficulty: xpLevel, topic });
    if (daily) {
      try { localStorage.setItem(`iq_qdaily_${utcDay()}`, String(score)); } catch { /* ignore */ }
      void (async () => {
        const u = auth.currentUser; if (!u) { setSent("fail"); return; }
        const r = await fetch("/api/quran-daily", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await u.getIdToken()}` },
          body: JSON.stringify({ date: utcDay(), score, total, ms: Date.now() - t0.current }) }).catch(() => null);
        setSent(r?.ok ? "ok" : r?.status === 409 ? "already" : "fail");
      })();
    }
  };
  const goNext = () => { if (round + 1 >= total) { finish(); return; } setRound((r) => r + 1); loadNext(false); };

  // timer: runs while the question is open; "pause for more time"
  const waiting = !!q && answered === null && !(q.kind === "reveal" && revealed);
  useEffect(() => { if (!waiting || paused) return undefined; const id = setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100); return () => clearInterval(id); }, [waiting, paused]);
  useEffect(() => { if (left === 0 && waiting) { if (q?.kind === "reveal") setRevealed(true); else mark(false); } }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pt.locked) return <TimeUp resetsAt={pt.resetsAt} kid={false} onBack={onExit} />;
  if (finished) return <div className="iq-rise mx-auto grid max-w-2xl gap-4">
    <div className="border-2 border-foreground bg-[#14130f] p-8 text-center text-[#f3ead6] shadow-brutal">
      <p className="text-6xl">{score >= total * 0.8 ? "🏆" : score >= total / 2 ? "🌟" : "🤲"}</p>
      <h2 className="mt-3 font-serif text-5xl text-[#d4af37]">{score >= total * 0.8 ? "Mā shā’ Allāh!" : score >= total / 2 ? "Bārak Allāhu fīk!" : "Keep going!"}</h2>
      <p className="mt-2 text-xl font-semibold">Your score: {score}/{total} · {title}</p>
      {daily && sent === "fail" && <p className="mt-2 text-sm text-[#ff8a95]">Couldn’t save your score to the board.</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!daily && <Button size="lg" onClick={begin}><RotateCcw /> Play again</Button>}
        <Button size="lg" variant="outline" className="bg-background text-foreground" onClick={onExit}>Back to games</Button>
      </div>
    </div>
    {daily && sent !== "idle" && <DailyBoard date={utcDay()} />}
  </div>;

  const done = answered !== null;
  const blankIdx = q && (q.kind === "choice" || q.kind === "reveal") ? q.blank : undefined;
  const blankShow = q && done ? (q.kind === "reveal" || q.kind === "choice" ? q.blankWord : undefined) : q?.kind === "reveal" && revealed ? q.blankWord : undefined;

  return <div className="iq-rise mx-auto grid max-w-3xl gap-3">
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={() => { rc.stop(); onExit(); }}>← Games</Button>
      <span className="flex items-center gap-2 text-sm font-bold">{pt.left >= 0 && <span className="border-2 border-foreground px-2 py-1">⏱ {Math.ceil(pt.left / 60)} min</span>}<span className="border-2 border-foreground bg-primary px-3 py-1">✓ {score}</span></span>
    </div>

    <div className="rounded-2xl border-2 border-foreground bg-[#14130f] p-5 text-[#f3ead6] shadow-brutal">
      <div className="flex items-center justify-between gap-2">
        <span className="flex gap-1.5">{Array.from({ length: total }, (_, k) => <span key={k} className={cn("size-2 rounded-full", k < round ? "bg-[#3fa66b]" : k === round ? "bg-[#d4af37]" : "bg-[#3a362c]")} />)}</span>
        {q && <span className={cn("rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider", TAG_TONE[q.tag] ?? TAG_TONE.Medium)}>{q.tag}</span>}
      </div>

      {err && <div className="py-10 text-center"><p>Couldn’t load the question. Check your internet.</p><Button className="mt-3" onClick={() => (session.current ? loadNext(true) : begin())}>Try again</Button></div>}
      {!q && !err && <div className="grid place-items-center py-16"><Loader2 className="size-8 animate-spin text-[#d4af37]" /></div>}

      {q && <>
        <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">— {q.prompt} —</p>

        {q.kind !== "arrange" && "verse" in q && q.verse && <div dir="rtl" lang="ar" className="mt-4 flex flex-wrap justify-center gap-x-2.5 gap-y-1 font-arabic text-3xl leading-[2.1] sm:text-4xl">
          {q.verse.map((w, i) => {
            const dim = rc.playing && i > rc.active;
            if (i === blankIdx) return blankShow ? <span key={i} className="text-[#6fd39a]">{blankShow}</span> : <span key={i} className="inline-block min-w-24 border-b-2 border-[#d4af37]">&nbsp;</span>;
            if (q.kind === "tap") {
              const st = !done ? "" : i === q.answer ? "bg-[#3d1719] text-[#ff8a95] line-through" : picked === i ? "bg-[#3d1719]" : "";
              return <button key={i} data-plain disabled={done} onClick={() => { setPicked(i); mark(i === q.answer); }} className={cn("rounded-lg px-1.5 transition hover:bg-[#2a271f]", st)}>{w}</button>;
            }
            return <span key={i} className={cn("transition-colors duration-150", dim ? "text-[#f3ead6]/30" : rc.playing && i === rc.active ? "text-[#d4af37]" : "")}>{w}</span>;
          })}
        </div>}
        {q.kind === "tap" && done && <p className="mt-2 text-center text-sm">The right word: <span dir="rtl" lang="ar" className="font-arabic text-2xl text-[#6fd39a]">{q.correctWord}</span></p>}

        {/* timer + pause */}
        <div className="mt-4 flex items-center gap-3">
          <button data-plain onClick={() => setPaused((p) => !p)} disabled={!waiting} className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#f3ead6]/70 disabled:opacity-40">
            {paused ? <Play className="size-3" /> : <Pause className="size-3" />}{paused ? "Resume" : "Pause for more time"}</button>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-[#3a362c]"><span className="block h-full bg-[#d4af37] transition-[width] duration-100" style={{ width: `${(left / (q.secs * 1000)) * 100}%` }} /></span>
        </div>

        {q.rec && (q.preAudio || q.kind === "arrange" || done) && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button data-plain onClick={() => void rc.play(q.rec!, done ? undefined : q.stopBefore)} className="flex items-center gap-1 rounded-full border border-[#d4af37] px-3 py-1 font-bold text-[#d4af37]">
            <Volume2 className="size-4" /> {q.kind === "arrange" && !done ? "Listen (hint)" : "Listen"}</button>
          <span className="text-xs text-[#f3ead6]/60">Reciter: {q.rec.reciter.name}</span>
        </div>}

        {q.kind === "choice" && <div className={cn("mt-4 grid gap-2.5", !q.options[0]?.arabic && q.options.every((o) => o.label.length < 30) && "sm:grid-cols-2")}>{q.options.map((o, k) => {
          const st = !done ? "border-[#3a362c] bg-[#1d1b16] hover:border-[#d4af37]" : k === q.answer ? "border-[#3fa66b] bg-[#173d27]" : picked === k ? "border-[#c94653] bg-[#3d1719]" : "border-[#3a362c] bg-[#1d1b16] opacity-40";
          return <button key={`${k}-${o.label}`} data-plain disabled={done} onClick={() => { setPicked(k); mark(k === q.answer); }} className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 text-start transition", st)}>
            <span className="w-5 shrink-0 font-bold text-[#d4af37]">{k + 1}</span>
            <span className="min-w-0 flex-1 text-center">
              {o.arabic ? <span dir="rtl" lang="ar" className="block font-arabic text-2xl leading-loose">{o.label}</span> : <span className="block font-semibold" dir="auto">{o.label}</span>}
              {o.sub && <span className="block text-xs text-[#f3ead6]/60" dir="auto">{o.sub}</span>}
            </span>
            {done && k === q.answer && <span className="text-[#6fd39a]">✓</span>}
          </button>;
        })}</div>}

        {q.kind === "reveal" && <div className="mt-4 grid gap-3">
          <button data-plain disabled={revealed} onClick={() => setRevealed(true)} className={cn("mx-auto grid h-24 w-full max-w-xs place-items-center rounded-xl border-2", revealed ? "border-[#3fa66b] bg-[#173d27]" : "border-[#3a362c] bg-[#1d1b16]")}>
            {revealed ? <span dir="rtl" lang="ar" className="font-arabic text-4xl">{q.blankWord}</span> : <span className="font-serif text-6xl text-[#d4af37]">?</span>}
          </button>
          {!revealed && <p className="text-center text-xs font-bold uppercase tracking-widest text-[#ff8a95]">No choices. Only your hifz. Say it, then tap to reveal.</p>}
          {revealed && !done && <div className="grid grid-cols-2 gap-3">
            <button data-plain onClick={() => mark(true)} className="rounded-xl border border-[#3fa66b] bg-[#173d27] py-3 font-bold">✓ I got it</button>
            <button data-plain onClick={() => mark(false)} className="rounded-xl border border-[#c94653] bg-[#3d1719] py-3 font-bold">✗ I missed it</button>
          </div>}
        </div>}

        {q.kind === "arrange" && <ArrangeBoard q={q} order={order} built={built} setBuilt={setBuilt} answered={answered} onCheck={mark} />}

        {done && <div className={cn("mt-4 rounded-xl border p-3", answered ? "border-[#3fa66b] bg-[#173d27]/60" : "border-[#c94653] bg-[#3d1719]/60")}>
          <p className="text-sm font-bold">{answered ? "✓ Correct!" : picked === null && q.kind !== "reveal" && q.kind !== "arrange" ? "⏱ Time’s up" : "✗ Not quite"}</p>
          {q.fullArabic && <p dir="rtl" lang="ar" className="mt-1 text-right font-arabic text-xl leading-loose">{q.fullArabic}</p>}
          {q.meaning && <p className="mt-1 text-sm opacity-90" dir="auto">{q.meaning}</p>}
          {q.note && <p className="mt-1 text-xs opacity-70">{q.note}</p>}
          <p className="mt-2 font-mono text-xs text-[#d4af37]">{q.ref}</p>
        </div>}
        {done && <button data-plain onClick={goNext} className="mt-4 w-full rounded-full bg-[#d4af37] py-3.5 font-extrabold uppercase text-[#14130f]">{round + 1 < total ? "Next question →" : "See my score"}</button>}
      </>}
    </div>
  </div>;
}

function ArrangeBoard({ q, order, built, setBuilt, answered, onCheck }: { q: ArrangeQ; order: number[]; built: number[]; setBuilt: (b: number[]) => void; answered: boolean | null; onCheck: (ok: boolean) => void }) {
  const done = answered !== null;
  // compare words, not positions, so repeated words in a verse don't count as wrong
  const ok = built.length === q.words.length && built.every((idx, i) => q.words[idx] === q.words[i]);
  useEffect(() => { if (!done && built.length === q.words.length) onCheck(ok); }, [built]); // eslint-disable-line react-hooks/exhaustive-deps
  const chip = "rounded-full border px-4 py-1.5 font-arabic text-2xl";
  return <div className="mt-4 grid gap-3">
    <div dir="rtl" className={cn("flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3", done ? (answered ? "border-[#3fa66b] bg-[#173d27]" : "border-[#c94653] bg-[#3d1719]") : "border-[#3a362c]")}>
      {built.length === 0 && <span dir="ltr" className="text-sm text-[#f3ead6]/60">Tap the words below, starting with the first word (right to left).</span>}
      {built.map((idx, i) => <button key={`${idx}-${i}`} data-plain disabled={done} onClick={() => setBuilt(built.filter((_, j) => j !== i))} lang="ar" className={cn(chip, "border-[#d4af37] bg-[#2a271f]")}>{q.words[idx]}</button>)}
    </div>
    {!done && <div dir="rtl" className="flex flex-wrap justify-center gap-2">{order.filter((idx) => !built.includes(idx)).map((idx) => <button key={idx} data-plain onClick={() => setBuilt([...built, idx])} lang="ar" className={cn(chip, "border-[#3a362c] bg-[#1d1b16]")}>{q.words[idx]}</button>)}</div>}
    {!done && built.length > 0 && <button data-plain onClick={() => setBuilt([])} className="justify-self-center text-sm text-[#f3ead6]/70 underline">Clear</button>}
  </div>;
}

function DailyBoard({ date }: { date: string }) {
  type Row = { name: string; score: number; total: number; secs: number; me: boolean };
  const [data, setData] = useState<{ top: Row[]; mine: Row | null; rank: number | null; players: number } | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    void (async () => {
      const u = auth.currentUser;
      const r = await fetch(`/api/quran-daily?date=${date}`, { headers: u ? { authorization: `Bearer ${await u.getIdToken()}` } : {} }).catch(() => null);
      if (!r?.ok) { setErr(true); return; }
      setData(await r.json());
    })();
  }, [date]);
  return <div className="border-2 border-foreground bg-background p-5 shadow-brutal">
    <h2 className="flex items-center gap-2 font-serif text-3xl"><Trophy className="text-[#d4af37]" /> Today’s board</h2>
    {err && <p className="mt-3 text-sm text-muted-foreground">Couldn’t load the board.</p>}
    {!data && !err && <Loader2 className="mt-4 size-6 animate-spin" />}
    {data && <>
      <p className="mt-1 text-sm text-muted-foreground">{data.players} {data.players === 1 ? "player" : "players"} today{data.rank ? ` · you are #${data.rank}` : ""}</p>
      {data.top.length === 0 ? <p className="mt-4 text-sm">No one yet. Be the first!</p>
        : <ol className="mt-4 grid gap-1.5">{data.top.map((r, i) => <li key={i} className={cn("flex items-center gap-3 border-2 border-foreground px-3 py-2", r.me ? "bg-primary" : "bg-background")}>
          <span className="w-7 font-bold">{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}</span><span className="flex-1 font-semibold">{r.name}{r.me ? " (you)" : ""}</span>
          <span className="font-bold">{r.score}/{r.total}</span><span className="w-12 text-end text-xs text-muted-foreground">{r.secs}s</span></li>)}</ol>}
    </>}
  </div>;
}
