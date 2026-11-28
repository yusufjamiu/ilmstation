import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Pause, Play, RotateCcw, Trophy, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizFeedback, QuizNext, QuizProgress } from "@/components/quiz-ui";
import { surahList, type SurahMeta } from "@/components/quran-data";
import { quranEdition, useLanguage } from "@/components/language";
import { usePlaytime, TimeUp, KidGames, useAdminGames } from "@/components/kids";
import { auth } from "@/lib/firebase";
import { awardXp } from "@/lib/xp";
import { cn } from "@/lib/utils";

/* ============================================================
   One quiz engine, many packs.
   A pack has modes; a mode starts a session that makes one question at a time.
   Packs: Qur'an (live) → Hadith, Qira'ah, Arabiyyah, Seerah, Fiqh (next, one at a time).
   ============================================================ */

type Rng = () => number;
type Reciter = { key: string; name: string; words: boolean; cdn?: string; bitrate?: number };
/** Quiz reciters. `words`: words light up as they recite. `cdn`: verse-by-verse files on islamic.network (also the backup). */
const RECITERS: Reciter[] = [
  { key: "alafasy", name: "Mishary Alafasy", words: true, cdn: "ar.alafasy", bitrate: 128 },
  { key: "dosari", name: "Yasser Al-Dosari", words: true },
  { key: "sudais", name: "Abdur-Rahman As-Sudais", words: true, cdn: "ar.abdurrahmaansudais", bitrate: 192 },
  { key: "shuraim", name: "Saud Ash-Shuraim", words: true, cdn: "ar.saoodshuraym", bitrate: 64 },
  { key: "husary", name: "Mahmoud Al-Husary", words: true, cdn: "ar.husary", bitrate: 128 },
  { key: "minshawi", name: "Al-Minshawi", words: true, cdn: "ar.minshawi", bitrate: 128 },
  { key: "abdulbasit", name: "Abdul Basit (Murattal)", words: true, cdn: "ar.abdulbasitmurattal", bitrate: 192 },
  { key: "shatri", name: "Abu Bakr Ash-Shatri", words: true },
  { key: "raad", name: "Raad Al-Kurdi", words: false },
  { key: "juhani", name: "Abdullah Al-Juhani", words: false },
  { key: "ghamdi", name: "Saad Al-Ghamdi", words: false },
  { key: "alijaber", name: "Ali Jaber", words: false },
  { key: "baleela", name: "Bandar Baleela", words: false },
  { key: "maher", name: "Maher Al-Muaiqly", words: false, cdn: "ar.mahermuaiqly", bitrate: 128 },
  { key: "ayyub", name: "Muhammad Ayyub", words: false, cdn: "ar.muhammadayyoub", bitrate: 128 },
];
type Rec = { reciter: Reciter; surah: number; ayah: number; global: number };
type Opt = { label: string; sub?: string; arabic?: boolean };
type Base = { prompt: string; tag: string; ref: string; secs: number; meaning?: string; fullArabic?: string; note?: string; rec?: Rec; preAudio?: boolean; stopBefore?: number };
type ChoiceQ = Base & { kind: "choice"; verse?: string[]; blank?: number; blankWord?: string; options: Opt[]; answer: number; optRecs?: Rec[] };
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
/** `words`: this question hides a word, so it needs a reciter whose recitation can stop just before it. */
const reciterFor = (c: Ctx, words = false) => {
  const chosen = RECITERS.find((x) => x.key === c.s.reciter);
  if (chosen && (!words || chosen.words)) return chosen;
  return pick(c.r, RECITERS.filter((x) => x.words));
};
const recOf = (c: Ctx, v: Verse, words = false): Rec => ({ reciter: reciterFor(c, words), surah: v.surah.n, ayah: v.n, global: v.global });
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
    rec: recOf(c, v, true), preAudio: true, stopBefore: blank, secs: 20, ...about(v) };
}
async function onlyHuffaz(c: Ctx): Promise<Q> {
  const { v } = await verseFrom(c, wc(4));
  const w = words(v.text);
  return { kind: "reveal", prompt: "Finish the ayah", verse: w, blank: w.length - 1, blankWord: w.at(-1)!, rec: recOf(c, v, true), preAudio: true, stopBefore: w.length - 1, secs: 15, ...about(v), tag: "From memory" };
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
    optRecs: opts.map((o) => recOf(c, o)), rec: recOf(c, right), secs: 30, ...about(right) };
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
    { id: "huffaz", title: "Hifz check", emoji: "🧠", blurb: "No choices. Recite the missing word from memory." },
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
type Track = { url: string; from: number; to: number; words: number[][] };
const trackCache = new Map<string, Promise<{ url: string; verses: Record<number, { from: number; to: number; words?: number[][]; url?: string }> }>>();
const cdnTrack = (R: Reciter, global: number): Track | null => (R.cdn ? { url: `https://cdn.islamic.network/quran/audio/${R.bitrate}/${R.cdn}/${global}.mp3`, from: 0, to: Infinity, words: [] } : null);
async function trackFor(rec: Rec): Promise<Track | null> {
  const R = rec.reciter;
  const key = `${R.key}:${rec.surah}`;
  if (!trackCache.has(key)) {
    const p = fetch(`/api/recite?r=${R.key}&s=${rec.surah}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error("recite"))));
    p.catch(() => trackCache.delete(key));
    trackCache.set(key, p);
  }
  try { const d = await trackCache.get(key)!; const v = d.verses[rec.ayah]; if (v) return { url: v.url ?? d.url, from: v.from, to: v.to || Infinity, words: v.words ?? [] }; } catch { /* use the backup */ }
  return cdnTrack(R, rec.global);
}

/* One audio player for the whole quiz. Phones (iPhone especially) only let a page play sound after a tap,
   so the first tap "unlocks" this player and every later verse plays through it. */
let shared: HTMLAudioElement | null = null;
const player = () => (shared ??= new Audio());
const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
/** Call inside a tap (Start, an answer…). */
function unlockAudio() { const a = player(); if (!a.src || a.src === SILENT) { a.src = SILENT; void a.play().catch(() => {}); } }

function useRecital() {
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [who, setWho] = useState<string | null>(null); // the backup reciter, when one was used
  const cur = useRef<{ t?: number; tok: number; done?: () => void }>({ tok: 0 });
  const stop = useCallback(() => {
    const c = cur.current; c.tok++; player().pause(); if (c.t) clearInterval(c.t);
    const d = c.done; c.done = undefined; d?.();
    setPlaying(false); setActive(-1);
  }, []);
  /** Spoken guide (the question in the user's language). Resolves when it ends or is stopped. */
  const say = useCallback((url: string) => new Promise<void>((resolve) => {
    stop(); const tok = cur.current.tok; cur.current.done = resolve;
    const a = player();
    const end = () => { if (cur.current.tok !== tok) return; cur.current.done = undefined; resolve(); };
    a.onended = end; a.onerror = end; a.src = url;
    a.play().catch(end);
  }), [stop]);
  /** Plays one verse; resolves when it has finished (or was stopped). With `stopBefore`, stops just before
      that word so a hidden word isn't given away; if this reciter has no word times for it, a backup reciter is used. */
  const play = useCallback((rec: Rec, stopBefore?: number) => new Promise<void>((resolve) => {
    stop(); const tok = cur.current.tok; cur.current.done = resolve;
    const end = () => { if (cur.current.tok !== tok) return; player().pause(); if (cur.current.t) clearInterval(cur.current.t); cur.current.done = undefined; setPlaying(false); setActive(-1); resolve(); };
    void (async () => {
      const cutOf = (t: Track | null) => (!t || stopBefore === undefined ? undefined : t.words.find((w) => w[0] === stopBefore + 1)?.[1] ?? t.words.find((w) => w[0] === stopBefore)?.[2]);
      let tr = await trackFor(rec); let backup: string | null = null; let cut = cutOf(tr);
      if (stopBefore !== undefined && cut === undefined) {
        for (const R of RECITERS.filter((x) => x.words && x.key !== rec.reciter.key)) {
          const t2 = await trackFor({ ...rec, reciter: R }); const c2 = cutOf(t2);
          if (c2 !== undefined) { tr = t2; cut = c2; backup = R.name; break; }
        }
      }
      if (cur.current.tok !== tok) return;
      setWho(backup);
      if (!tr || (stopBefore !== undefined && cut === undefined)) { end(); return; }
      const endAt = cut !== undefined ? cut - 60 : tr.to;
      const words = tr.words;
      const a = player();
      a.onended = end; a.onerror = end;
      const go = () => {
        if (cur.current.tok !== tok) return;
        setPlaying(true);
        cur.current.t = window.setInterval(() => {
          const ms = a.currentTime * 1000;
          if (ms >= endAt) { end(); return; }
          let w = -1; for (const x of words) if (ms >= x[1]!) w = x[0]! - 1;
          setActive(w);
        }, 50);
        a.play().catch(end);
      };
      a.src = tr.url;
      if (tr.from > 0) { a.addEventListener("loadedmetadata", () => { if (cur.current.tok !== tok) return; a.currentTime = tr.from / 1000; go(); }, { once: true }); a.load(); } else go();
    })().catch(end);
  }), [stop]);
  useEffect(() => stop, [stop]);
  return { active, playing, who, play, stop, say };
}

/* ---------------- the question in the user's language ---------------- */
const trCache = new Map<string, Promise<string>>();
function translated(text: string, lang: string): Promise<string> {
  if (lang === "en") return Promise.resolve(text);
  const key = `${lang}|${text}`;
  if (!trCache.has(key)) {
    const p = fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang }) })
      .then((r) => r.json()).then((j: { text?: string }) => j.text || text).catch(() => text);
    trCache.set(key, p);
  }
  return trCache.get(key)!;
}
const guideUrl = (text: string, lang: string) => `/api/tts?text=${encodeURIComponent(text)}&lang=${lang}&who=adult`;

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
  const [reciter, setReciter] = useState(() => { try { return localStorage.getItem("iq_qreciter") ?? "mixed"; } catch { return "mixed"; } });
  useEffect(() => { try { localStorage.setItem("iq_qreciter", reciter); } catch { /* ignore */ } }, [reciter]);
  useEffect(() => { try { localStorage.setItem("iq_qlevel", level); } catch { /* ignore */ } }, [level]);
  const [guide, setGuide] = useState(() => { try { return localStorage.getItem("iq_qguide") !== "0"; } catch { return true; } });
  useEffect(() => { try { localStorage.setItem("iq_qguide", guide ? "1" : "0"); } catch { /* ignore */ } }, [guide]);
  const today = utcDay();
  const played = (() => { try { return localStorage.getItem(`iq_qdaily_${today}`); } catch { return null; } })();
  const lv = LEVELS.find(([id]) => id === level) ?? LEVELS[0]!;

  if (daily === "board") return <div className="iq-rise mx-auto max-w-2xl"><Button variant="outline" onClick={() => setDaily(null)}>← Qur’an</Button><div className="mt-4"><DailyBoard date={today} /></div></div>;
  if (daily === "play") return <QuizRun title="Daily challenge" daily guide={guide} start={() => quranSession("daily", { level: "medium", reciter: "mixed" })} xpLevel="Intermediate" topic="Qur’an: Daily challenge" onExit={() => setDaily(null)} />;
  if (mode) return <QuizRun title={mode.title} guide={guide} start={() => quranSession(mode.id, { level, reciter, surah })} xpLevel={lv[3]} topic={`Qur’an: ${mode.title}`} onExit={() => { setMode(null); setSurah(undefined); }} />;

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

    <div className="mt-5 flex flex-col gap-4 border-2 border-foreground bg-secondary p-5 text-secondary-foreground shadow-brutal sm:flex-row sm:items-center">
      <span className="flex min-w-0 flex-1 items-start gap-4"><span className="text-5xl">🏆</span>
      <span className="min-w-0 flex-1"><span className="text-xs font-bold uppercase">Daily Qur’an challenge</span>
        <b className="block font-serif text-3xl leading-none">5 questions · same for everyone</b>
        <span className="text-sm opacity-80">{played !== null ? `You scored ${played}/${DAILY_N} today. Come back tomorrow, in shaa Allah.` : "One try a day. Fastest with the most right answers tops the board."}</span></span></span>
      <span className="grid grid-cols-2 gap-2 sm:flex">
        {played === null && <button onClick={() => { unlockAudio(); setDaily("play"); }} className="animate-pulse border-2 border-foreground bg-primary px-4 py-2 font-bold text-foreground shadow-brutal-sm">▶ Start</button>}
        <button onClick={() => setDaily("board")} className="border-2 border-foreground bg-background px-4 py-2 font-bold text-foreground shadow-brutal-sm"><Trophy className="inline size-4" /> Board</button>
      </span>
    </div>

    <div className="mt-5 grid gap-3 border-2 border-foreground bg-background p-4">
      <div><p className="text-xs font-bold uppercase">Level</p>
        <div className="mt-2 flex flex-wrap gap-2">{LEVELS.map(([id, label]) => <Button key={id} size="sm" variant={level === id ? "default" : "outline"} onClick={() => setLevel(id)}>{label}</Button>)}</div></div>
      <label className="text-xs font-bold uppercase">Reciter
        <select value={reciter} onChange={(e) => setReciter(e.target.value)} className="mt-2 block h-10 w-full border-2 border-foreground bg-background px-2 text-sm font-normal normal-case">
          <option value="mixed">Different reciter each question</option>{RECITERS.map((r) => <option key={r.key} value={r.key}>{r.name}{r.words ? "" : " (no word highlight)"}</option>)}
        </select></label>
      <label className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span>🔊 Voice guide <span className="block text-xs font-normal text-muted-foreground">Reads each question aloud in your language before the reciter.</span></span>
        <input type="checkbox" className="size-5 accent-[#e6b84a]" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
      </label>
    </div>

    {QURAN_GROUPS.map(([group, modes]) => <section key={group} className="mt-6">
      <h2 className="font-serif text-3xl">{group}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{modes.map((m, i) => <button key={m.id} onClick={() => { unlockAudio(); if (m.id === "chain") setChoosingSurah(true); else setMode(m); }}
        className={cn("flex items-center gap-4 border-2 border-foreground p-4 text-start shadow-brutal transition hover:-translate-y-1", ["bg-primary", "bg-secondary text-secondary-foreground", "bg-[#d7ecd9] text-[#1c1a17]", "bg-background"][i % 4])}>
        <span className="text-4xl">{m.emoji}</span>
        <span className="min-w-0 flex-1"><b className="block font-serif text-2xl leading-tight">{m.title}</b><span className="text-sm">{m.blurb}</span></span>
        <span className="shrink-0 border-2 border-foreground bg-background px-3 py-1 text-sm font-bold text-foreground">▶ Start</span>
      </button>)}</div>
    </section>)}
  </div>;
}

/** IlmStation's own look: cream, charcoal and the logo's gold, bold borders. */
const GOLD = "#e6b84a";
const LEVEL_CHIP: Record<string, [string, string]> = { Easy: ["🌱", "bg-[#d7ecd9] text-[#1c1a17]"], Medium: ["🌿", "bg-primary"], Hard: ["🔥", "bg-[#f7d9c4] text-[#1c1a17]"], "From memory": ["🧠", "bg-secondary text-secondary-foreground"] };

function QuizRun({ title, start, onExit, xpLevel, topic, daily = false, guide = true }: { title: string; start: () => Promise<Session>; onExit: () => void; xpLevel: string; topic: string; daily?: boolean; guide?: boolean }) {
  const { lang } = useLanguage();
  const [shown, setShown] = useState("");      // the question, in the user's language
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false);       // the question has been read: the countdown can start
  const [afterRead, setAfterRead] = useState(false); // the answer verse has been recited: move on by itself
  const [hold, setHold] = useState(false);          // "Stay here": don't move on by itself
  const showTok = useRef(0);
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
    setQ(x); setLeft(x.secs * 1000); setPaused(false); setShown(x.prompt);
    if (x.kind === "arrange") { let o = shuffle(Math.random, x.words.map((_, i) => i)); if (o.every((v, i) => v === i)) o = o.reverse(); setOrder(o); }
    const tok = ++showTok.current;
    void (async () => {
      const t = await translated(x.prompt, lang);
      if (showTok.current !== tok) return;
      setShown(t);
      if (guide) { setSpeaking(true); await rc.say(guideUrl(t, lang)); if (showTok.current !== tok) return; setSpeaking(false); }
      if (x.preAudio && x.rec) await rc.play(x.rec, x.stopBefore);
      if (showTok.current === tok) setReady(true);
    })();
  };
  const loadNext = (fresh: boolean) => {
    showTok.current++; setSpeaking(false); setReady(false); setAfterRead(false); setHold(false); rc.stop(); setQ(null); setErr(false); setAnswered(null); setPicked(null); setBuilt([]); setRevealed(false);
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
    setSpeaking(false); setAfterRead(false);
    const tok = ++showTok.current;
    // the full verse after answering, then on to the next question
    if (q?.rec) void rc.play(q.rec).then(() => { if (showTok.current === tok) setAfterRead(true); }); else setAfterRead(true);
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
  // the countdown only runs once the question has been read, and stops while a verse is playing
  useEffect(() => { if (!waiting || !ready || paused || rc.playing) return undefined; const id = setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100); return () => clearInterval(id); }, [waiting, ready, paused, rc.playing]);
  useEffect(() => { if (answered === null || !afterRead || rc.playing || hold) return undefined; const id = setTimeout(goNext, 3500); return () => clearTimeout(id); }, [answered, afterRead, rc.playing, hold]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (left === 0 && waiting) { if (q?.kind === "reveal") setRevealed(true); else mark(false); } }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pt.locked) return <TimeUp resetsAt={pt.resetsAt} kid={false} onBack={onExit} />;
  if (finished) return <div className="iq-rise mx-auto grid max-w-2xl gap-4">
    <div className="border-2 border-foreground bg-primary p-8 text-center shadow-brutal">
      <p className="text-6xl">{score >= total * 0.8 ? "🏆" : score >= total / 2 ? "🌟" : "🤲"}</p>
      <h2 className="mt-3 font-serif text-5xl">{score >= total * 0.8 ? "Mā shā’ Allāh!" : score >= total / 2 ? "Bārak Allāhu fīk!" : "Keep going!"}</h2>
      <p className="mt-2 text-xl font-semibold">{score} out of {total} · {title}</p>
      {daily && sent === "fail" && <p className="mt-2 text-sm font-semibold text-[#c94653]">Couldn’t save your score to the board.</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!daily && <Button size="lg" variant="outline" className="bg-background" onClick={begin}><RotateCcw /> Play again</Button>}
        <Button size="lg" variant="outline" className="bg-background" onClick={onExit}>Back to games</Button>
      </div>
    </div>
    {daily && sent !== "idle" && <DailyBoard date={utcDay()} />}
  </div>;

  const done = answered !== null;
  const blankIdx = q && (q.kind === "choice" || q.kind === "reveal") ? q.blank : undefined;
  const blankShow = q && done ? (q.kind === "reveal" || q.kind === "choice" ? q.blankWord : undefined) : q?.kind === "reveal" && revealed ? q.blankWord : undefined;
  const chip = q ? LEVEL_CHIP[q.tag] ?? LEVEL_CHIP.Medium! : null;
  const secs = Math.ceil(left / 1000);

  return <div className="iq-rise mx-auto grid max-w-3xl gap-3 pb-28 md:pb-0">
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={() => { showTok.current++; rc.stop(); onExit(); }}>← Games</Button>
      <span className="flex items-center gap-2 text-sm font-bold">{pt.left >= 0 && <span className="border-2 border-foreground px-2 py-1">⏱ {Math.ceil(pt.left / 60)} min</span>}<span className="border-2 border-foreground bg-primary px-3 py-1">✓ {score}</span></span>
    </div>

    <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
      <div className="-mx-5 -mt-5 mb-4 h-1.5" style={{ background: GOLD }} />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase text-muted-foreground">Question {round + 1} of {total}</p>
          <div className="mt-2"><QuizProgress value={(round + (done ? 1 : 0)) / total * 100} /></div>
        </div>
        {q && chip && <span className={cn("shrink-0 border-2 border-foreground px-2 py-1 text-xs font-bold", chip[1])}>{chip[0]} {q.tag}</span>}
        {q && <span aria-label="Seconds left" className={cn("grid size-12 shrink-0 place-items-center border-2 border-foreground text-xl font-extrabold tabular-nums shadow-brutal-sm", !waiting || !ready ? "bg-muted text-muted-foreground" : secs <= 5 ? "animate-pulse bg-[#c94653] text-white" : "bg-background")}>{secs}</span>}
      </div>

      {err && <div className="py-10 text-center"><p>Couldn’t load the question. Check your internet.</p><Button className="mt-3" onClick={() => (session.current ? loadNext(true) : begin())}>Try again</Button></div>}
      {!q && !err && <div className="grid place-items-center py-16"><Loader2 className="size-8 animate-spin" /></div>}

      {q && <>
        <h2 dir="auto" className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">{shown || q.prompt}{speaking && <Volume2 className="ms-2 inline size-6 animate-pulse" />}</h2>

        {q.kind !== "arrange" && "verse" in q && q.verse && <div dir="rtl" lang="ar" className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-1 border-2 border-foreground bg-[#fdf8ec] px-4 py-5 font-arabic text-3xl leading-[2.1] text-[#1c1a17] sm:text-4xl">
          {q.verse.map((w, i) => {
            if (i === blankIdx) return blankShow ? <span key={i} className="bg-[#c9f2dc] px-1 text-[#2f7352]">{blankShow}</span> : <span key={i} className="inline-block min-w-20 border-b-4" style={{ borderColor: GOLD }}>&nbsp;</span>;
            if (q.kind === "tap") {
              const st = !done ? "hover:bg-primary/50" : i === q.answer ? "bg-[#fdecef] text-[#c94653] line-through" : "";
              return <button key={i} data-plain disabled={done} onClick={() => { unlockAudio(); setPicked(i); mark(i === q.answer); }} className={cn("px-1 transition", st)}>{w}</button>;
            }
            const lit = rc.playing && i === rc.active;
            return <span key={i} className={cn("px-0.5 transition-colors duration-150", rc.playing && i > rc.active && "opacity-45")} style={lit ? { background: `${GOLD}aa` } : undefined}>{w}</span>;
          })}
        </div>}
        {q.kind === "tap" && !done && <p className="mt-2 text-center text-xs text-muted-foreground">The reciter reads it after you answer, so the mistake isn’t given away.</p>}
        {q.kind === "tap" && done && <p className="mt-2 text-center text-sm">The right word: <span dir="rtl" lang="ar" className="font-arabic text-2xl text-[#2f7352]">{q.correctWord}</span></p>}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {q.rec && (q.preAudio || q.kind === "arrange" || done) && <>
            <Button size="sm" variant="outline" onClick={() => { unlockAudio(); void rc.play(q.rec!, done ? undefined : q.stopBefore); }}><Volume2 /> {q.kind === "arrange" && !done ? "Listen (hint)" : "Listen"}</Button>
            <span className="text-xs text-muted-foreground">{rc.who ?? q.rec.reciter.name}</span>
          </>}
          {waiting && <Button size="sm" variant={paused ? "default" : "outline"} className="ms-auto" onClick={() => setPaused((p) => !p)}>{paused ? <><Play /> Continue</> : <><Pause /> Need more time?</>}</Button>}
        </div>

        {q.kind === "choice" && <div className={cn("mt-4 grid gap-3", !q.options[0]?.arabic && q.options.every((o) => o.label.length < 30) && "sm:grid-cols-2")}>{q.options.map((o, k) => {
          const listen = q.optRecs?.[k];
          const st = !done ? "bg-background" : k === q.answer ? "bg-[#2f7352] text-white" : picked === k ? "bg-[#c94653] text-white" : "bg-background opacity-50";
          return <div key={`${k}-${o.label}`} className="flex items-center gap-2">
            <button data-plain disabled={done} onClick={() => { unlockAudio(); setPicked(k); mark(k === q.answer); }}
              className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-foreground px-3 py-2.5 text-start shadow-[0_3px_0_var(--foreground)] transition active:translate-y-0.5", st)}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-current text-sm font-bold">{"ABCD"[k]}</span>
              {o.arabic && !o.sub && <span dir="rtl" lang="ar" className="min-w-0 flex-1 text-right font-arabic text-2xl leading-loose">{o.label}</span>}
              {o.arabic && o.sub && <span className="flex min-w-0 flex-1 items-center justify-between gap-3"><span className="text-sm font-semibold">{o.sub}</span><span dir="rtl" lang="ar" className="font-arabic text-2xl leading-loose">{o.label}</span></span>}
              {!o.arabic && <span className="flex min-w-0 flex-1 items-center justify-between gap-3"><span dir="auto" className="font-semibold">{o.label}</span>{o.sub && <span dir="rtl" lang="ar" className="font-arabic text-lg">{o.sub}</span>}</span>}
              {done && k === q.answer && <span className="shrink-0 font-bold">✓</span>}
            </button>
            {listen && <button data-plain aria-label="Listen to this verse" onClick={() => { unlockAudio(); void rc.play(listen); }} className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-foreground bg-background shadow-[0_3px_0_var(--foreground)]"><Volume2 className="size-5" /></button>}
          </div>;
        })}</div>}

        {q.kind === "reveal" && <div className="mt-4 grid gap-3">
          <button data-plain disabled={revealed} onClick={() => setRevealed(true)} className={cn("mx-auto grid h-24 w-full max-w-xs place-items-center border-2 border-foreground", revealed ? "bg-[#c9f2dc] text-[#2f7352]" : "border-dashed bg-muted")}>
            {revealed ? <span dir="rtl" lang="ar" className="font-arabic text-4xl">{q.blankWord}</span> : <span className="font-serif text-5xl">?</span>}
          </button>
          {!revealed && <p className="text-center text-sm text-muted-foreground">Recite the missing word from memory, then tap to check.</p>}
          {revealed && !done && <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className="bg-[#2f7352] text-white hover:bg-[#2f7352]/90" onClick={() => mark(true)}>✓ I knew it</Button>
            <Button size="lg" variant="outline" onClick={() => mark(false)}>✗ I didn’t</Button>
          </div>}
        </div>}

        {q.kind === "arrange" && <ArrangeBoard q={q} order={order} built={built} setBuilt={setBuilt} answered={answered} onCheck={mark} />}

        {done && <div className="mt-4 grid gap-3">
          {picked === null && q.kind !== "reveal" && q.kind !== "arrange" && !answered && <p className="text-sm font-bold">⏱ Time’s up</p>}
          <QuizFeedback ok={!!answered} source={q.ref} text={<>
            {q.fullArabic && <span dir="rtl" lang="ar" className="block text-right font-arabic text-xl leading-loose">{q.fullArabic}</span>}
            {q.meaning && <span className="mt-1 block" dir="auto">{q.meaning}</span>}
            {q.note && <span className="mt-1 block text-xs opacity-70">{q.note}</span>}
          </>} />
          <QuizNext label={round + 1 < total ? "Next question" : "See my score"} onClick={goNext} />
          <p className="text-center text-xs text-muted-foreground">{hold ? "Tap Next when you’re ready." : rc.playing ? "Listening to the verse…" : afterRead ? <>Moving on… <button data-plain className="font-bold underline" onClick={() => setHold(true)}>Stay here</button></> : null}</p>
        </div>}
      </>}
    </section>
  </div>;
}

function ArrangeBoard({ q, order, built, setBuilt, answered, onCheck }: { q: ArrangeQ; order: number[]; built: number[]; setBuilt: (b: number[]) => void; answered: boolean | null; onCheck: (ok: boolean) => void }) {
  const done = answered !== null;
  // compare words, not positions, so repeated words in a verse don't count as wrong
  const ok = built.length === q.words.length && built.every((idx, i) => q.words[idx] === q.words[i]);
  useEffect(() => { if (!done && built.length === q.words.length) onCheck(ok); }, [built]); // eslint-disable-line react-hooks/exhaustive-deps
  const chip = "border-2 border-foreground px-3 py-1 font-arabic text-2xl shadow-brutal-sm transition active:translate-y-0.5";
  return <div className="mt-4 grid gap-3">
    <div dir="rtl" className={cn("flex min-h-20 flex-wrap items-center justify-center gap-2 border-2 border-dashed border-foreground p-3", done ? (answered ? "bg-[#c9f2dc]" : "bg-[#fdecef]") : "bg-[#fdf8ec] text-[#1c1a17]")}>
      {built.length === 0 && <span dir="ltr" className="text-sm text-muted-foreground">Tap the words below, starting with the first word (right to left).</span>}
      {built.map((idx, i) => <button key={`${idx}-${i}`} data-plain disabled={done} onClick={() => setBuilt(built.filter((_, j) => j !== i))} lang="ar" className={cn(chip, "bg-primary text-foreground")}>{q.words[idx]}</button>)}
    </div>
    {!done && <div dir="rtl" className="flex flex-wrap justify-center gap-2">{order.filter((idx) => !built.includes(idx)).map((idx) => <button key={idx} data-plain onClick={() => setBuilt([...built, idx])} lang="ar" className={cn(chip, "bg-background")}>{q.words[idx]}</button>)}</div>}
    {!done && built.length > 0 && <Button variant="outline" size="sm" className="justify-self-center" onClick={() => setBuilt([])}><RotateCcw /> Clear</Button>}
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
    <h2 className="flex items-center gap-2 font-serif text-3xl"><Trophy className="text-[#e6b84a]" /> Today’s board</h2>
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
