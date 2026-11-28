import { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizFeedback, QuizNext, QuizOption, QuizProgress, QuizQuestion } from "@/components/quiz-ui";
import { surahList, type SurahMeta } from "@/components/quran-data";
import { reciters } from "@/components/hifz";
import { quranEdition } from "@/components/language";
import { usePlaytime, TimeUp, KidGames, useAdminGames } from "@/components/kids";
import { awardXp } from "@/lib/xp";
import { cn } from "@/lib/utils";

/* ============================================================
   One quiz engine, many packs.
   A pack gives modes; a mode makes one question at a time.
   Packs: Qur'an (live) → Hadith, Qira'ah, Arabiyyah, Seerah, Fiqh (next, one at a time).
   ============================================================ */

type ChoiceQ = { kind: "choice"; prompt: string; arabic?: string; options: { label: string; sub?: string; arabic?: boolean }[]; answer: number; audio?: string; audioFirst?: boolean; reciter?: string; ref: string; meaning?: string; fullArabic?: string };
type ArrangeQ = { kind: "arrange"; prompt: string; words: string[]; audio?: string; reciter?: string; ref: string; meaning?: string; fullArabic?: string };
type Q = ChoiceQ | ArrangeQ;
type Mode = { id: string; title: string; emoji: string; blurb: string };
type Settings = { scope: string; reciter: string };
type Pack = { id: string; title: string; arabic: string; emoji: string; tint: string; live: boolean; modes: Mode[]; make?: (mode: string, s: Settings) => Promise<Q> };

const ROUNDS = 10;

/* ---------------- Qur'an pack ---------------- */
type Ayah = { n: number; global: number; text: string; meaning: string };
const surahCache = new Map<string, Promise<Ayah[]>>();
const hasLetter = /[ء-يٱ-ۓ]/;
const words = (t: string) => t.split(/\s+/).filter((w) => hasLetter.test(w));

function loadSurah(n: number): Promise<Ayah[]> {
  const ed = quranEdition();
  const key = `${n}:${ed}`;
  if (!surahCache.has(key)) {
    const p = fetch(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,${ed}`).then((r) => r.json()).then((j: { data: { ayahs: { number: number; numberInSurah: number; text: string }[] }[] }) => {
      const [ar, tr] = j.data;
      return ar!.ayahs.map((a, i) => {
        let text = a.text.replace(/^﻿/, "").trim();
        // the API puts the Basmalah in front of verse 1 (not part of the verse, except Al-Fatiha)
        if (a.numberInSurah === 1 && n !== 1 && n !== 9 && text.startsWith("بِسْمِ")) text = text.split(/\s+/).slice(4).join(" ");
        return { n: a.numberInSurah, global: a.number, text, meaning: tr?.ayahs[i]?.text ?? "" };
      });
    });
    p.catch(() => surahCache.delete(key));
    surahCache.set(key, p);
  }
  return surahCache.get(key)!;
}

const SCOPES: [string, string, number][] = [["juz30", "Juz ʿAmma", 78], ["juz29", "Juz 29–30", 67], ["juz28", "Juz 28–30", 58], ["all", "Whole Qur’an", 1]];
const scopeSurahs = (scope: string) => { const from = SCOPES.find(([id]) => id === scope)?.[2] ?? 78; return surahList.filter((s) => s.n >= from); };
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!;
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; };
/** Bigger surahs come up more often (so the whole Qur'an is fair), but every surah can appear. */
const pickSurah = (list: SurahMeta[]) => { const total = list.reduce((s, x) => s + Math.sqrt(x.ayahs), 0); let r = Math.random() * total; for (const s of list) { r -= Math.sqrt(s.ayahs); if (r <= 0) return s; } return list[list.length - 1]!; };
const reciterFor = (id: string) => (id === "mixed" ? pick(reciters) : reciters.find((r) => r.id === id) ?? reciters[0]!);
const audioUrl = (r: (typeof reciters)[number], g: number) => `https://cdn.islamic.network/quran/audio/${r.bitrate}/${r.id}/${g}.mp3`;
const refOf = (s: SurahMeta, n: number) => `Surah ${s.name} (${s.n}:${n})`;

async function verseFrom(list: SurahMeta[], minWords: number, maxWords = 999) {
  for (let t = 0; t < 8; t++) {
    const s = pickSurah(list);
    const ayahs = (await loadSurah(s.n)).filter((a) => { const w = words(a.text).length; return w >= minWords && w <= maxWords; });
    if (ayahs.length) return { s, a: pick(ayahs), ayahs: await loadSurah(s.n) };
  }
  throw new Error("No verse found");
}

async function nameTheSurah(st: Settings): Promise<Q> {
  const list = scopeSurahs(st.scope);
  const { s, a } = await verseFrom(list, 4);
  const others = shuffle(list.filter((x) => x.n !== s.n)).slice(0, 3);
  const opts = shuffle([s, ...others]);
  const r = reciterFor(st.reciter);
  return { kind: "choice", prompt: "Listen. Which surah is this verse from?", arabic: a.text, audio: audioUrl(r, a.global), audioFirst: true, reciter: r.name,
    options: opts.map((o) => ({ label: o.name, sub: o.arabic })), answer: opts.indexOf(s), ref: refOf(s, a.n), meaning: a.meaning };
}

async function completeTheVerse(st: Settings): Promise<Q> {
  const list = scopeSurahs(st.scope);
  const { s, a, ayahs } = await verseFrom(list, 6);
  const w = words(a.text); const cut = Math.ceil(w.length / 2);
  const right = w.slice(cut).join(" ");
  const endings = new Set<string>();
  const addFrom = (pool: Ayah[]) => { for (const x of shuffle(pool)) { if (endings.size >= 3) break; const xw = words(x.text); if (x.n === a.n || xw.length < 4) continue; const e = xw.slice(Math.ceil(xw.length / 2)).join(" "); if (e !== right) endings.add(e); } };
  addFrom(ayahs);
  for (const n of [s.n + 1, s.n - 1, s.n + 2, s.n - 2]) { if (endings.size >= 3) break; if (n >= 1 && n <= 114) addFrom(await loadSurah(n)); }
  const opts = shuffle([right, ...[...endings].slice(0, 3)]);
  const r = reciterFor(st.reciter);
  return { kind: "choice", prompt: "Complete the verse.", arabic: `${w.slice(0, cut).join(" ")} …`, audio: audioUrl(r, a.global), reciter: r.name,
    options: opts.map((o) => ({ label: o, arabic: true })), answer: opts.indexOf(right), ref: refOf(s, a.n), meaning: a.meaning, fullArabic: a.text };
}

async function arrangeTheVerse(st: Settings): Promise<Q> {
  const list = scopeSurahs(st.scope);
  const { s, a } = await verseFrom(list, 4);
  const w = words(a.text);
  const part = w.length > 9; // long verse → arrange its first part
  const r = reciterFor(st.reciter);
  return { kind: "arrange", prompt: part ? "Put the start of this verse in order." : "Put the words of this verse in order.", words: part ? w.slice(0, 8) : w,
    audio: audioUrl(r, a.global), reciter: r.name, ref: refOf(s, a.n), meaning: a.meaning, fullArabic: a.text };
}

const QURAN_MAKERS: Record<string, (s: Settings) => Promise<Q>> = { surah: nameTheSurah, complete: completeTheVerse, arrange: arrangeTheVerse };

const PACKS: Pack[] = [
  { id: "quran", title: "Qur’an", arabic: "القرآن", emoji: "📖", tint: "bg-primary", live: true,
    modes: [
      { id: "surah", title: "Name the surah", emoji: "🎧", blurb: "Hear a verse from a reciter. Which surah is it?" },
      { id: "complete", title: "Complete the verse", emoji: "✍️", blurb: "Pick the right ending of the verse." },
      { id: "arrange", title: "Arrange the verse", emoji: "🧩", blurb: "Tap the words in the right order." },
      { id: "mixed", title: "Mixed", emoji: "🎲", blurb: "All three, one after another." },
    ],
    make: (mode, s) => (QURAN_MAKERS[mode === "mixed" ? pick(Object.keys(QURAN_MAKERS)) : mode] ?? nameTheSurah)(s) },
  { id: "hadith", title: "Hadith", arabic: "الحديث", emoji: "📜", tint: "bg-secondary text-secondary-foreground", live: false, modes: [] },
  { id: "qiraah", title: "Qira’ah", arabic: "القراءة", emoji: "🔤", tint: "bg-[#d7ecd9] text-[#1c1a17]", live: false, modes: [] },
  { id: "arabiyyah", title: "Arabiyyah", arabic: "العربية", emoji: "✍️", tint: "bg-[#f7d9c4] text-[#1c1a17]", live: false, modes: [] },
  { id: "seerah", title: "Seerah", arabic: "السيرة", emoji: "🌙", tint: "bg-background", live: false, modes: [] },
  { id: "fiqh", title: "Fiqh", arabic: "الفقه", emoji: "🕌", tint: "bg-muted", live: false, modes: [] },
];

/* ---------------- Screens ---------------- */

/** Adult Play → Games & quizzes. */
export function AdultGames() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [more, setMore] = useState(false);
  const adminGames = useAdminGames("all");
  if (more) return <div><Button variant="outline" onClick={() => setMore(false)}>← Games &amp; quizzes</Button><div className="mt-4"><KidGames audience="all" /></div></div>;
  if (pack) return <PackScreen pack={pack} onBack={() => setPack(null)} />;
  return <div className="iq-rise">
    <p className="text-xs font-bold uppercase text-muted-foreground">Play and learn</p>
    <h1 className="font-serif text-5xl leading-none">Games &amp; quizzes</h1>
    <p className="mt-3 text-lg text-muted-foreground">Pick a subject. Every right answer earns XP.</p>
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{PACKS.map((p) => <button key={p.id} disabled={!p.live} onClick={() => setPack(p)}
      className={cn("flex min-h-40 flex-col justify-between border-2 border-foreground p-5 text-start shadow-brutal transition", p.tint, p.live ? "hover:-translate-y-1" : "opacity-60")}>
      <span className="text-5xl">{p.emoji}</span>
      <span><b className="block font-serif text-3xl leading-none">{p.title}</b><span dir="rtl" lang="ar" className="font-arabic text-lg">{p.arabic}</span>
        <span className="mt-1 block text-sm font-semibold">{p.live ? `${p.modes.length - 1} games · ▶ Play` : "Coming soon"}</span></span>
    </button>)}</div>
    {adminGames.length > 0 && <button onClick={() => setMore(true)} className="mt-6 flex w-full items-center justify-between border-2 border-foreground bg-background p-5 text-start shadow-brutal">
      <span><b className="block font-serif text-2xl">More games</b><span className="text-sm text-muted-foreground">{adminGames.length} from the IlmStation team</span></span><ChevronRight />
    </button>}
  </div>;
}

function PackScreen({ pack, onBack }: { pack: Pack; onBack: () => void }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [scope, setScope] = useState(() => { try { return localStorage.getItem("iq_qscope") ?? "juz30"; } catch { return "juz30"; } });
  const [reciter, setReciter] = useState("mixed");
  useEffect(() => { try { localStorage.setItem("iq_qscope", scope); } catch { /* ignore */ } }, [scope]);
  if (mode) return <QuizRun pack={pack} mode={mode} settings={{ scope, reciter }} onExit={() => setMode(null)} />;
  return <div className="iq-rise">
    <Button variant="outline" onClick={onBack}>← Subjects</Button>
    <h1 className="mt-4 font-serif text-5xl leading-none">{pack.emoji} {pack.title}</h1>
    {pack.id === "quran" && <div className="mt-5 grid gap-3 border-2 border-foreground bg-background p-4">
      <div><p className="text-xs font-bold uppercase">Verses from</p>
        <div className="mt-2 flex flex-wrap gap-2">{SCOPES.map(([id, label]) => <Button key={id} size="sm" variant={scope === id ? "default" : "outline"} onClick={() => setScope(id)}>{label}</Button>)}</div></div>
      <label className="text-xs font-bold uppercase">Reciter
        <select value={reciter} onChange={(e) => setReciter(e.target.value)} className="mt-2 block h-10 w-full border-2 border-foreground bg-background px-2 text-sm font-normal normal-case">
          <option value="mixed">Different reciter each question</option>{reciters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select></label>
    </div>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{pack.modes.map((m, i) => <button key={m.id} onClick={() => setMode(m)}
      className={cn("flex items-center gap-4 border-2 border-foreground p-5 text-start shadow-brutal transition hover:-translate-y-1", ["bg-primary", "bg-secondary text-secondary-foreground", "bg-[#d7ecd9] text-[#1c1a17]", "bg-background"][i % 4])}>
      <span className="text-5xl">{m.emoji}</span>
      <span className="min-w-0 flex-1"><b className="block font-serif text-2xl leading-tight">{m.title}</b><span className="text-sm">{m.blurb}</span></span>
      <span className="shrink-0 animate-pulse border-2 border-foreground bg-background px-3 py-1 text-sm font-bold text-foreground">▶ Start</span>
    </button>)}</div>
  </div>;
}

function QuizRun({ pack, mode, settings, onExit }: { pack: Pack; mode: Mode; settings: Settings; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<Q | null>(null);
  const [err, setErr] = useState(false);
  const [answered, setAnswered] = useState<boolean | null>(null); // null = not yet, true/false = right/wrong
  const [picked, setPicked] = useState<number | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const next = useRef<Promise<Q> | null>(null);
  const pt = usePlaytime(!finished);

  const play = (url?: string) => { audio.current?.pause(); if (!url) return; const a = new Audio(url); audio.current = a; void a.play().catch(() => {}); };
  const stop = () => audio.current?.pause();
  useEffect(() => stop, []);

  const make = () => pack.make!(mode.id, settings);
  const load = (first = false) => {
    setQ(null); setErr(false); setAnswered(null); setPicked(null); setBuilt([]);
    const p = first || !next.current ? make() : next.current;
    p.then((x) => {
      setQ(x);
      if (x.kind === "arrange") { let o = shuffle(x.words.map((_, i) => i)); if (o.every((v, i) => v === i)) o = o.reverse(); setOrder(o); }
      if (x.kind === "choice" && x.audioFirst) play(x.audio);
      next.current = make(); next.current.catch(() => { next.current = null; });
    }).catch(() => setErr(true));
  };
  useEffect(() => { load(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (s: number) => { stop(); setFinished(true); const diff = settings.scope === "all" ? "Advanced" : settings.scope === "juz30" ? "Beginner" : "Intermediate"; void awardXp("quiz", { correct: s, total: ROUNDS, difficulty: diff, topic: `${pack.title}: ${mode.title}` }); };
  const mark = (ok: boolean) => { setAnswered(ok); if (ok) setScore((n) => n + 1); if (q && !(q.kind === "choice" && q.audioFirst)) play(q.audio); };
  const goNext = () => { if (round + 1 >= ROUNDS) { finish(score); return; } setRound((r) => r + 1); load(); };
  const restart = () => { setRound(0); setScore(0); setFinished(false); load(true); };

  if (pt.locked) return <TimeUp resetsAt={pt.resetsAt} kid={false} onBack={onExit} />;
  if (finished) return <div className="iq-rise mx-auto max-w-2xl border-2 border-foreground bg-primary p-8 text-center shadow-brutal">
    <p className="text-6xl">{score >= 8 ? "🏆" : score >= 5 ? "🌟" : "🤲"}</p>
    <h2 className="mt-3 font-serif text-5xl">{score >= 8 ? "Mā shā’ Allāh!" : score >= 5 ? "Bārak Allāhu fīk!" : "Keep going!"}</h2>
    <p className="mt-2 text-xl font-semibold">{score} out of {ROUNDS} · {mode.title}</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Button size="lg" onClick={restart}><RotateCcw /> Play again</Button>
      <Button size="lg" variant="outline" className="bg-background" onClick={onExit}>Pick another game</Button>
    </div>
  </div>;

  return <div className="iq-rise mx-auto grid max-w-3xl gap-4">
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={() => { stop(); onExit(); }}>← {pack.title}</Button>
      <span className="flex items-center gap-2 text-sm font-bold">{pt.left >= 0 && <span className="border-2 border-foreground px-2 py-1">⏱ {Math.ceil(pt.left / 60)} min</span>}<span className="border-2 border-foreground bg-primary px-3 py-1">✓ {score}</span></span>
    </div>
    <div className="flex items-center justify-between text-sm"><span className="font-bold">Question {round + 1} of {ROUNDS}</span><span className="text-muted-foreground">{mode.emoji} {mode.title}</span></div>
    <QuizProgress value={(round + (answered !== null ? 1 : 0)) / ROUNDS * 100} />

    {err && <div className="border-2 border-foreground bg-background p-6 text-center"><p>Couldn’t load the question. Check your internet.</p><Button className="mt-3" onClick={() => load(true)}>Try again</Button></div>}
    {!q && !err && <div className="grid place-items-center border-2 border-dashed border-foreground p-10"><Loader2 className="size-8 animate-spin" /></div>}

    {q && <>
      <QuizQuestion text={q.prompt}>
        {q.kind === "choice" && q.arabic && <p dir="rtl" lang="ar" className="mt-3 text-right font-arabic text-3xl leading-[2.2]">{q.arabic}</p>}
        {q.audio && (q.kind === "arrange" || (q.kind === "choice" && q.audioFirst) || answered !== null) && <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="bg-background" onClick={() => play(q.audio)}><Volume2 /> {q.kind === "arrange" && answered === null ? "Listen (hint)" : "Listen again"}</Button>
          {q.reciter && <span className="text-xs text-muted-foreground">Reciter: {q.reciter}</span>}
        </div>}
      </QuizQuestion>

      {q.kind === "choice" && <div className={cn("grid gap-3", !q.options[0]?.arabic && "sm:grid-cols-2")}>{q.options.map((o, k) => <QuizOption key={`${k}-${o.label}`} letter={"ABCD"[k] ?? "•"} disabled={answered !== null}
        text={o.arabic ? <span dir="rtl" lang="ar" className="block text-right font-arabic text-2xl leading-loose">{o.label}</span> : <span>{o.label}{o.sub && <span dir="rtl" lang="ar" className="ms-2 font-arabic text-lg opacity-80">{o.sub}</span>}</span>}
        state={answered === null ? "idle" : k === q.answer ? "correct" : picked === k ? "wrong" : "idle"}
        onClick={() => { setPicked(k); mark(k === q.answer); }} />)}</div>}

      {q.kind === "arrange" && <ArrangeBoard q={q} order={order} built={built} setBuilt={setBuilt} answered={answered} onCheck={(ok) => mark(ok)} />}

      {answered !== null && <>
        <QuizFeedback ok={answered} source={q.ref}
          text={<>{q.fullArabic && <span dir="rtl" lang="ar" className="block text-right font-arabic text-xl leading-loose">{q.fullArabic}</span>}{q.meaning && <span className="mt-1 block" dir="auto">{q.meaning}</span>}</>} />
        <QuizNext label={round + 1 < ROUNDS ? "Next question" : "See results"} onClick={goNext} />
      </>}
    </>}
  </div>;
}

function ArrangeBoard({ q, order, built, setBuilt, answered, onCheck }: { q: ArrangeQ; order: number[]; built: number[]; setBuilt: (b: number[]) => void; answered: boolean | null; onCheck: (ok: boolean) => void }) {
  const done = answered !== null;
  // compare words, not positions, so repeated words in a verse don't count as wrong
  const ok = built.length === q.words.length && built.every((idx, i) => q.words[idx] === q.words[i]);
  useEffect(() => { if (!done && built.length === q.words.length) onCheck(ok); }, [built]); // eslint-disable-line react-hooks/exhaustive-deps
  const chip = "rounded-full border-[1.5px] border-foreground px-4 py-2 font-arabic text-2xl shadow-[0_3px_0_var(--foreground)]";
  return <div className="grid gap-3">
    <div dir="rtl" className={cn("flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-foreground p-3", done && (answered ? "bg-[#c9f2dc]" : "bg-[#fdecef]"))}>
      {built.length === 0 && <span dir="ltr" className="w-full text-center text-sm text-muted-foreground">Tap the words below, starting with the first word (right to left).</span>}
      {built.map((idx, i) => <button key={`${idx}-${i}`} data-plain disabled={done} onClick={() => setBuilt(built.filter((_, j) => j !== i))} lang="ar" className={cn(chip, "bg-primary")}>{q.words[idx]}</button>)}
    </div>
    {!done && <div dir="rtl" className="flex flex-wrap gap-2">{order.filter((idx) => !built.includes(idx)).map((idx) => <button key={idx} data-plain onClick={() => setBuilt([...built, idx])} lang="ar" className={cn(chip, "bg-background")}>{q.words[idx]}</button>)}</div>}
    {!done && built.length > 0 && <Button variant="outline" className="justify-self-start" onClick={() => setBuilt([])}><RotateCcw /> Clear</Button>}
  </div>;
}
