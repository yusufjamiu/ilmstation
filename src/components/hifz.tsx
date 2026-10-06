import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BellRing, BookOpen, CalendarDays, ChevronRight, CircleHelp, Download, Ear, Eye, EyeOff, Loader2, Lock, Target, Mic, Pause, Play, Repeat, RotateCcw, Search, Square, Timer, Volume2 } from "lucide-react";
import { surahList } from "@/components/quran-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { matchAyah, type WordCheck } from "@/lib/arabic-match";

type Verse = { arabic: string; meaning: string };
type Surah = { name: string; arabic: string; number: number; juz: number; ayahs: number; start: number; verses: Verse[] };
const localVerses: { number: number; verses: Verse[] }[] = [
  { number: 1, verses: [
    { arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", meaning: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
    { arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", meaning: "All praise is due to Allah, Lord of the worlds." },
    { arabic: "الرَّحْمَٰنِ الرَّحِيمِ", meaning: "The Entirely Merciful, the Especially Merciful." },
    { arabic: "مَالِكِ يَوْمِ الدِّينِ", meaning: "Sovereign of the Day of Recompense." },
    { arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", meaning: "It is You we worship and You we ask for help." },
    { arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", meaning: "Guide us to the straight path." },
    { arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", meaning: "The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray." },
  ] },
  { number: 112, verses: [
    { arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", meaning: "Say, He is Allah, One." },
    { arabic: "اللَّهُ الصَّمَدُ", meaning: "Allah, the Eternal Refuge." },
    { arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ", meaning: "He neither begets nor is born." },
    { arabic: "وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ", meaning: "Nor is there to Him any equivalent." },
  ] },
  { number: 103, verses: [
    { arabic: "وَالْعَصْرِ", meaning: "By time." },
    { arabic: "إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ", meaning: "Indeed, mankind is in loss." },
    { arabic: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ", meaning: "Except those who believe, do righteous deeds, and advise each other to truth and patience." },
  ] },
];

const verseCache = new Map<number, Verse[]>(localVerses.map(item => [item.number, item.verses]));
const reciters = [
  { id: "ar.alafasy", bitrate: 128, name: "Mishary Alafasy" },
  { id: "ar.husary", bitrate: 128, name: "Mahmoud Al-Husary" },
  { id: "ar.minshawi", bitrate: 128, name: "Al-Minshawi" },
  { id: "ar.abdulbasitmurattal", bitrate: 192, name: "Abdul Basit (Murattal)" },
  { id: "ar.mahermuaiqly", bitrate: 128, name: "Maher Al-Muaiqly" },
  { id: "ar.abdurrahmaansudais", bitrate: 192, name: "Abdur-Rahman As-Sudais" },
  { id: "ar.saoodshuraym", bitrate: 64, name: "Saud Ash-Shuraim" },
  { id: "ar.muhammadayyoub", bitrate: 128, name: "Muhammad Ayyub" },
];
const speeds = [0.5, 0.75, 1, 1.25, 1.5];
const ranges = Array.from({ length: 6 }, (_, i) => [i * 20 + 1, Math.min(114, i * 20 + 20)] as const);
const allSurahs = surahList.map(meta => ({ name: meta.name, arabic: meta.arabic, number: meta.n, juz: meta.juz, ayahs: meta.ayahs, start: meta.start, translation: meta.translation }));
/** Traditional memorisation order: Al-Fatiha, then An-Nas back to Al-Baqarah. */
const HIFZ_ORDER: number[] = [1, ...Array.from({ length: 113 }, (_, i) => 114 - i)];
// TEMP TESTING SWITCH: true unlocks every surah and skips the revision gates. Set to false before pushing.
const DEV_UNLOCK_ALL = false;
const REVISION_MINUTE_OPTIONS = [15, 30, 45, 60, 90, 120];
const LONG_SURAH_AYAHS = 40;
const LONG_REVIEW_TAIL = 20;
const RESUME_LOOKBACK = 3;
function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hrs} hr${hrs > 1 ? "s" : ""}` : `${hrs} hr ${rem} min`;
}

type Mark = "again" | "hard" | "good";
type Stage = "study" | "recall" | "recite";
type Rec = { mark: Mark; level: number; due: string; last: string };
type Plan = { size: number; days: number[]; time: string; reminders: boolean; daily: number; weekly: number; revisionMinutes: number };
type Tab = "surahs" | "revision" | "plan";
const keyFor = (surah: number, verse: number) => `${surah}:${verse}`;
const parseKey = (key: string) => { const [s, v] = key.split(":").map(Number); return { surah: s ?? 1, verse: v ?? 0 }; };
const steps: { id: Stage; title: string }[] = [{ id: "study", title: "Study" }, { id: "recall", title: "Recall" }, { id: "recite", title: "Recite" }];
const sizes = [{ value: 1, label: "1 ayah" }, { value: 3, label: "3 ayat" }, { value: 5, label: "5 ayat" }, { value: 10, label: "10 ayat" }, { value: 0, label: "Whole surah" }];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const icsDays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const intervals = [1, 3, 7, 14, 30, 60];
const TOTAL_AYAT = 6236;
const defaultPlan: Plan = { size: 3, days: [1, 3, 5, 6], time: "06:30", reminders: false, daily: 3, weekly: 15, revisionMinutes: 30 };
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return dayKey(d); };
const surahName = (n: number) => allSurahs.find(s => s.number === n)?.name ?? `Surah ${n}`;
function load<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? { ...fallback, ...JSON.parse(raw) } as T : fallback; } catch { return fallback; } }
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const LONG_VERSE_WORDS = 12;
const PHRASE_SIZE = 8;
const MAX_VISIBLE_ATTEMPTS = 4;
const MAX_BLIND_ATTEMPTS = 3;
const MAX_LINK_ATTEMPTS = 2;
const MAX_LINK_WORDS = 40;
const LOW_CONFIDENCE = 0.4;
const PASS_RATIO = 0.9;

/** Breaks a long ayah into shorter phrases so recitation can be checked piece by piece before the whole-verse pass. Short verses stay whole. */
function splitIntoPhrases(arabic: string): string[] {
  const words = arabic.trim().split(/\s+/).filter(Boolean);
  if (words.length <= LONG_VERSE_WORDS) return [arabic];
  const phraseCount = Math.ceil(words.length / PHRASE_SIZE);
  const size = Math.ceil(words.length / phraseCount);
  const phrases: string[] = [];
  for (let i = 0; i < words.length; i += size) phrases.push(words.slice(i, i + size).join(" "));
  return phrases;
}

/** A qualitative read of how close an attempt was — only "Excellent" (every word matched, in a sensible order) is allowed to advance. */
function matchLabel(words: WordCheck[]): string {
  const total = words.length || 1;
  const correct = words.filter(w => w.ok).length;
  const pct = correct / total;
  if (pct === 1) return "Excellent";
  if (pct >= 0.9) return "Very good — just a word or two off";
  if (pct >= 0.7) return "Good — a few words to tighten up";
  return "Keep practicing — several words need work";
}

export function HifzScreen() {
  const [tab, setTab] = useState<Tab>("surahs");
  const [setup, setSetup] = useState<number | null>(null);
  const [setupStart, setSetupStart] = useState(1);
  const [setupSize, setSetupSize] = useState(defaultPlan.size);
  const [active, setActive] = useState<number | null>(null);
  const [verseIndex, setVerseIndex] = useState(0);
  const [chunk, setChunk] = useState<[number, number]>([0, 0]);
  const [stage, setStage] = useState<Stage>("study");
  const [revealed, setRevealed] = useState(false);
  const [search, setSearch] = useState("");
  const [juz, setJuz] = useState("all");
  const [range, setRange] = useState("0");
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reciter, setReciter] = useState(reciters[0]!.id);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const recital = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState<Record<string, Rec>>({});
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [hydrated, setHydrated] = useState(false);
  const [revisionCursor, setRevisionCursor] = useState<number>(0);
  const [revisionResume, setRevisionResume] = useState<{ surah: number; verse: number } | null>(null);
  const [revisionMandatoryDoneDate, setRevisionMandatoryDoneDate] = useState<string | null>(null);
  const [revisionDoneDate, setRevisionDoneDate] = useState<string | null>(null);
  const [revisionTimerEnd, setRevisionTimerEnd] = useState<number | null>(null);
  const [mandatoryPass, setMandatoryPass] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [done, setDone] = useState(false);
  const [showKnownDialog, setShowKnownDialog] = useState(false);
  const [knownPicks, setKnownPicks] = useState<number[]>([]);
  const [portionHidden, setPortionHidden] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordError, setRecordError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notified = useRef("");

  // Automated reciter-sync matching
  const speechSupported = useMemo(() => typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition), []);
  const [preferManual, setPreferManual] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [autoPhase, setAutoPhase] = useState<"visible" | "blind" | null>(null);
  const [autoAttempt, setAutoAttempt] = useState(0);
  const [lastDiff, setLastDiff] = useState<WordCheck[] | null>(null);
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [linkChecking, setLinkChecking] = useState(false);
  const [listeningNow, setListeningNow] = useState(false);
  const recognitionRef = useRef<any>(null);
  const autoStopRef = useRef(false);
  const autoActive = speechSupported && !preferManual;
  const showText = stage === "study" || revealed;

  useEffect(() => {
    setProgress(load("iq_hifz_progress", {})); setActivity(load("iq_hifz_activity", {}));
    setRevisionCursor((() => { try { const raw = localStorage.getItem("iq_hifz_cursor_v2"); const v = raw ? JSON.parse(raw) : 0; return typeof v === "number" && Number.isFinite(v) ? v : 0; } catch { return 0; } })());
    setRevisionResume((() => { try { const raw = localStorage.getItem("iq_hifz_resume"); const v = raw ? JSON.parse(raw) : null; return v && typeof v.surah === "number" && typeof v.verse === "number" ? v : null; } catch { return null; } })());
    setRevisionMandatoryDoneDate(load("iq_hifz_mandatory_date", null as string | null));
    setRevisionDoneDate(load("iq_hifz_revision_date", null as string | null));
    const p = load("iq_hifz_plan", defaultPlan); setPlan(p); setSetupSize(p.size); setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_progress", JSON.stringify(progress)); }, [progress, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_activity", JSON.stringify(activity)); }, [activity, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_cursor_v2", JSON.stringify(revisionCursor)); }, [revisionCursor, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_resume", JSON.stringify(revisionResume)); }, [revisionResume, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_mandatory_date", JSON.stringify(revisionMandatoryDoneDate)); }, [revisionMandatoryDoneDate, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_revision_date", JSON.stringify(revisionDoneDate)); }, [revisionDoneDate, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_plan", JSON.stringify(plan)); }, [plan, hydrated]);

  useEffect(() => {
    if (!plan.reminders) return;
    const check = () => {
      const now = new Date(); const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const tag = `${dayKey()}-${plan.time}`;
      if (plan.days.includes(now.getDay()) && hhmm === plan.time && notified.current !== tag) {
        notified.current = tag;
        toast("Time for Hifz", { description: `Continue with ${surahName(nextUpSurah())} — ${plan.daily} ayat today.` });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("IlmStation · Hifz", { body: "Your planned memorisation session is ready." });
      }
    };
    check(); const id = setInterval(check, 30000); return () => clearInterval(id);
  }, [plan]);

  useEffect(() => () => { recorder.current?.stop(); stream.current?.getTracks().forEach(track => track.stop()); }, []);
  useEffect(() => () => { if (recordedUrl) URL.revokeObjectURL(recordedUrl); }, [recordedUrl]);
  useEffect(() => () => { autoStopRef.current = true; try { recognitionRef.current?.stop(); } catch { /* ignore */ } }, []);

  const meta = active === null ? null : allSurahs.find(item => item.number === active) ?? null;
  const surah: Surah | null = meta && verses ? { ...meta, verses } : null;
  const verse = surah?.verses[verseIndex];
  const phrases = useMemo(() => (verse ? splitIntoPhrases(verse.arabic) : []), [verse]);
  const recitalUrl = meta ? (() => { const r = reciters.find(item => item.id === reciter) ?? reciters[0]!; return `https://cdn.islamic.network/quran/audio/${r.bitrate}/${r.id}/${meta.start + verseIndex}.mp3`; })() : "";

  useEffect(() => {
    if (active === null) return;
    const cached = verseCache.get(active);
    if (cached) { setVerses(cached); setLoadError(""); return; }
    let cancelled = false;
    setVerses(null); setLoadError("");
    fetch(`https://api.alquran.cloud/v1/surah/${active}/editions/quran-uthmani,en.sahih`).then(res => res.json()).then((json: { data: { ayahs: { text: string }[] }[] }) => {
      const [ar, en] = json.data;
      if (!ar || !en) throw new Error("missing");
      const list = ar.ayahs.map((ayah, i) => ({ arabic: i === 0 && active !== 1 && ayah.text.startsWith("بِسْمِ") ? ayah.text.split(" ").slice(4).join(" ") : ayah.text, meaning: en.ayahs[i]?.text ?? "" }));
      verseCache.set(active, list);
      if (!cancelled) setVerses(list);
    }).catch(() => { if (!cancelled) setLoadError("We couldn't load this surah. Check your connection and try again."); });
    return () => { cancelled = true; };
  }, [active]);

  useEffect(() => { recital.current?.pause(); setPlaying(false); }, [recitalUrl]);
  useEffect(() => { if (recital.current) recital.current.playbackRate = speed; }, [speed, recitalUrl]);
  function toggleRecital() {
    const el = recital.current; if (!el) return;
    if (playing) { el.pause(); return; }
    el.playbackRate = speed;
    el.play().catch(() => setPlaying(false));
  }

  function playRecital(): Promise<void> {
    return new Promise(resolve => {
      const el = recital.current;
      if (!el) { resolve(); return; }
      const onEnd = () => { el.removeEventListener("ended", onEnd); resolve(); };
      el.addEventListener("ended", onEnd);
      el.currentTime = 0;
      el.playbackRate = speed;
      el.play().catch(() => resolve());
    });
  }

  /** Plays one ayah's own audio file (by index within the current surah) outside of the main player — used to re-read a range of already-learned verses during the linking check. */
  function playAyahAudio(idx: number): Promise<void> {
    return new Promise(resolve => {
      if (!meta) { resolve(); return; }
      const r = reciters.find(item => item.id === reciter) ?? reciters[0]!;
      const url = `https://cdn.islamic.network/quran/audio/${r.bitrate}/${r.id}/${meta.start + idx}.mp3`;
      const audio = new Audio(url);
      audio.playbackRate = speed;
      audio.addEventListener("ended", () => resolve());
      audio.play().catch(() => resolve());
    });
  }
  async function playJoinedRecital(from: number, to: number) {
    for (let i = from; i <= to; i++) {
      if (autoStopRef.current) return;
      await playAyahAudio(i);
    }
  }

  function listenOnce(): Promise<{ transcript: string; confidence: number }> {
    return new Promise(resolve => {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) { resolve({ transcript: "", confidence: 0 }); return; }
      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = "ar-SA";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      let settled = false;
      const finish = (transcript: string, confidence: number) => { if (settled) return; settled = true; resolve({ transcript, confidence }); };
      recognition.onresult = (e: any) => { const r = e.results?.[0]?.[0]; finish(r?.transcript ?? "", r?.confidence ?? 0); };
      recognition.onerror = () => finish("", 0);
      recognition.onend = () => finish("", 0);
      try { recognition.start(); } catch { finish("", 0); }
    });
  }

  /** One attempt: play the reciter (unless `silent`), listen, and score. Low-confidence results are treated as a miss, since the browser may "hear" a word the user never finished saying. Doesn't touch `revealed` — callers control visibility for their own stage. */
  async function attempt(reference: string, silent = false): Promise<{ words: WordCheck[]; ok: boolean }> {
    if (!silent) await playRecital();
    if (autoStopRef.current) return { words: [], ok: false };
    setListeningNow(true);
    const { transcript: heard, confidence } = await listenOnce();
    setListeningNow(false);
    if (autoStopRef.current) return { words: [], ok: false };
    let { words, ok } = matchAyah(heard, reference);
    if (!ok && words.length > 0) {
      const hit = words.filter(w => w.ok).length / words.length;
      const heardCount = heard.trim().split(/\s+/).filter(Boolean).length;
      if (hit >= PASS_RATIO && heardCount <= words.length * 1.6 + 2) ok = true;
    }
    if (confidence > 0 && confidence < LOW_CONFIDENCE) { words = words.map(w => ({ ...w, ok: false })); ok = false; }
    const label = matchLabel(words);
    setLastDiff(words); setLastLabel(label);
    if (ok) {
      toast.success(label);
      await delay(600);
    } else {
      if (confidence > 0 && confidence < LOW_CONFIDENCE) toast("Hard to hear that clearly — speak a little louder and finish each word");
      else { const missed = words.filter(w => !w.ok).length; toast(`Not quite — ${missed} word${missed === 1 ? "" : "s"} off, try again`); }
    }
    return { words, ok };
  }

  /** Tries a phrase up to MAX_VISIBLE_ATTEMPTS times; if it keeps failing and has more than 2 words, the reciter breaks it into two smaller halves, has you master each, then checks the whole phrase together once more before moving on. */
  async function attemptPhraseWithFallbackSplit(text: string, depth = 0): Promise<boolean> {
    for (let a = 1; a <= MAX_VISIBLE_ATTEMPTS && !autoStopRef.current; a++) {
      setAutoAttempt(a);
      const { ok } = await attempt(text);
      if (ok) return true;
    }
    if (autoStopRef.current) return false;
    const words = text.trim().split(/\s+/);
    if (words.length <= 2 || depth >= 2) return false;
    toast(`Let's break that down into two smaller parts`);
    const mid = Math.ceil(words.length / 2);
    const firstOk = await attemptPhraseWithFallbackSplit(words.slice(0, mid).join(" "), depth + 1);
    if (!firstOk || autoStopRef.current) return false;
    const secondOk = await attemptPhraseWithFallbackSplit(words.slice(mid).join(" "), depth + 1);
    if (!secondOk || autoStopRef.current) return false;
    toast("Now let's put it back together");
    for (let a = 1; a <= MAX_VISIBLE_ATTEMPTS && !autoStopRef.current; a++) {
      const { ok } = await attempt(text);
      if (ok) return true;
    }
    return false;
  }

  async function runAutoVerse() {
    if (!verse) return;
    autoStopRef.current = false;
    setLastDiff(null); setLastLabel(null); setAutoAttempt(0); setPhraseIndex(0);
    if (!recording) await startRecording();
    const versePhrases = splitIntoPhrases(verse.arabic);

    setStage("study"); setRevealed(true);
    for (let p = 0; p < versePhrases.length; p++) {
      if (autoStopRef.current) return;
      setPhraseIndex(p); setAutoPhase("visible");
      await attemptPhraseWithFallbackSplit(versePhrases[p]!);
      if (autoStopRef.current) return;
    }

    setStage("recite"); setRevealed(false); setAutoPhase("blind");
    let blindAttempt = 0; let blindOk = false;
    while (!autoStopRef.current && !blindOk) {
      blindAttempt++;
      const { ok } = await attempt(verse.arabic, true);
      if (ok) { blindOk = true; break; }
      if (blindAttempt >= MAX_BLIND_ATTEMPTS) {
        toast("Let's look at it once more before trying blind again");
        setStage("study"); setRevealed(true); setAutoPhase("visible");
        blindAttempt = 0;
        await playRecital();
        setStage("recite"); setRevealed(false); setAutoPhase("blind");
      }
    }
    if (autoStopRef.current) return;

    if (verseIndex > chunk[0] && surah) {
      const joined = surah.verses.slice(chunk[0], verseIndex + 1).map(v => v.arabic).join(" ");
      if (joined.trim().split(/\s+/).length <= MAX_LINK_WORDS) {
        setAutoPhase("blind"); setLinkChecking(true); setRevealed(false);
        let linked = false;
        while (!autoStopRef.current && !linked) {
          await playJoinedRecital(chunk[0], verseIndex);
          if (autoStopRef.current) break;
          const { ok } = await attempt(joined, true);
          linked = ok;
          if (ok) {
            setRevealed(true);
            await delay(900);
            setRevealed(false);
          } else {
            toast(`Not quite — listen again, then recite verses ${chunk[0] + 1}–${verseIndex + 1} together`);
          }
        }
        setLinkChecking(false); setRevealed(false);
        if (autoStopRef.current) return;
      }
    }

    if (autoStopRef.current) return;
    setAutoPhase(null);
    nextVerse("good");
  }

  /** Revision check: try to recall blind first; if missed, the reciter re-reads just this verse, then try again. Simpler than new-memorisation (no echo/linking), since it's testing retention, not teaching. */
  async function runAutoReview() {
    if (!verse) return;
    autoStopRef.current = false;
    setLastDiff(null); setLastLabel(null);
    if (!recording) await startRecording();
    setStage("recite"); setAutoPhase("blind"); setRevealed(false);
    let ok = false; let usedHelp = false;
    for (let a = 1; a <= MAX_BLIND_ATTEMPTS + 1 && !autoStopRef.current; a++) {
      if (a > 1) { usedHelp = true; await playRecital(); }
      const res = await attempt(verse.arabic, true);
      ok = res.ok;
      if (ok) { setRevealed(true); await delay(900); setRevealed(false); break; }
    }
    if (autoStopRef.current) return;
    setAutoPhase(null);
    nextVerse(ok ? (usedHelp ? "hard" : "good") : "again");
  }

  useEffect(() => {
    if (!autoActive || !verse || !sessionStarted) return;
    void (reviewOnly ? runAutoReview() : runAutoVerse());
    return () => { autoStopRef.current = true; try { recognitionRef.current?.stop(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, verseIndex, autoActive, reviewOnly, sessionStarted]);

  function switchToManual() {
    autoStopRef.current = true;
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setAutoPhase(null); setListeningNow(false); setLinkChecking(false);
    setPreferManual(true);
    setStage("study"); setRevealed(true);
  }

  const today = dayKey();
  const entries = Object.entries(progress);
  const memorized = entries.filter(([, r]) => r.level >= 1).length;
  const todayCount = activity[today] ?? 0;
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { label: dayNames[d.getDay()]!, count: activity[dayKey(d)] ?? 0, today: i === 6 }; });
  const weekCount = week.reduce((s, d) => s + d.count, 0);
  const streak = (() => { let n = 0; for (let i = 0; i < 365; i++) { if ((activity[addDays(-i)] ?? 0) > 0) n++; else if (i > 0) break; } return n; })();
  const nextSession = (() => { if (!plan.days.length) return null; const now = new Date(); for (let i = 0; i < 8; i++) { const d = new Date(); d.setDate(now.getDate() + i); if (!plan.days.includes(d.getDay())) continue; const [h, m] = plan.time.split(":").map(Number); d.setHours(h ?? 0, m ?? 0, 0, 0); if (d > now) return i === 0 ? `Today at ${plan.time}` : i === 1 ? `Tomorrow at ${plan.time}` : `${dayNames[d.getDay()]} at ${plan.time}`; } return null; })();
  const [lo, hi] = range === "all" ? [1, 114] : ranges[Number(range)] ?? [1, 114];
  const filtered = allSurahs.filter(item => (juz === "all" || item.juz === Number(juz)) && (search.trim() ? `${item.name} ${item.translation} ${item.arabic} ${item.number}`.toLowerCase().includes(search.toLowerCase()) : juz !== "all" || (item.number >= lo && item.number <= hi)));
  const setupMeta = setup === null ? null : allSurahs.find(s => s.number === setup) ?? null;
  const firstUnlearned = (n: number, ayahs: number) => { for (let v = 0; v < ayahs; v++) if (!progress[keyFor(n, v)] || progress[keyFor(n, v)]!.level < 1) return v + 1; return 1; };
  const isSurahMemorized = (n: number) => {
    const m = allSurahs.find(s => s.number === n);
    if (!m) return false;
    for (let v = 0; v < m.ayahs; v++) { const r = progress[keyFor(n, v)]; if (!r || r.level < 1) return false; }
    return true;
  };
  const surahLocked = (n: number) => {
    if (DEV_UNLOCK_ALL) return false;
    const idx = HIFZ_ORDER.indexOf(n);
    if (idx <= 0) return false;
    const prev = HIFZ_ORDER[idx - 1]!;
    return !isSurahMemorized(prev);
  };
  const nextUpSurah = () => HIFZ_ORDER.find(n => !isSurahMemorized(n)) ?? HIFZ_ORDER[HIFZ_ORDER.length - 1]!;
  const lastLearnedIndex = (n: number) => {
    const m = allSurahs.find(s => s.number === n); if (!m) return -1;
    let maxIdx = -1;
    for (let v = 0; v < m.ayahs; v++) if (progress[keyFor(n, v)]?.level) maxIdx = v;
    return maxIdx;
  };
  const surahAyahs = (n: number) => allSurahs.find(s => s.number === n)?.ayahs ?? 0;
  /** The surah you're memorising, as a revision block. Short or medium: verse 1 to where you stopped. Long (like Al-Baqarah): only the last 20 verses you learned. */
  const currentBlock = () => {
    const cur = nextUpSurah();
    const max = lastLearnedIndex(cur);
    if (max < 0) return null;
    const from = surahAyahs(cur) > LONG_SURAH_AYAHS ? Math.max(0, max - LONG_REVIEW_TAIL + 1) : 0;
    return { surah: cur, from, to: max };
  };
  /** Fully memorised surahs, newest first, going back toward Al-Fatiha. */
  const rotationBlocks = () => {
    const upTo = HIFZ_ORDER.indexOf(nextUpSurah());
    return HIFZ_ORDER.slice(0, upTo).reverse().map(n => ({ surah: n, from: 0, to: surahAyahs(n) - 1 }));
  };
  const rotationIndex = (blocks: { surah: number }[]) => { const i = blocks.findIndex(b => b.surah === revisionCursor); return i >= 0 ? i : 0; };
  const revisionBlocks = () => { const cb = currentBlock(); return [...(cb ? [cb] : []), ...rotationBlocks()]; };
  /** If time ran out partway through a long surah, start a few verses earlier next time. Short surahs restart from verse 1. */
  const withResume = (b: { surah: number; from: number; to: number }) => revisionResume && revisionResume.surah === b.surah ? { ...b, from: Math.min(Math.max(revisionResume.verse, b.from), b.to) } : b;
  /** What the next revision session starts with: the surah you're memorising (once a day), then the rotation from where you stopped. */
  const nextRevisionTarget = () => {
    const cb = currentBlock();
    if (cb && revisionMandatoryDoneDate !== today) return { block: cb, mandatory: true };
    const rot = rotationBlocks();
    if (!rot.length) return null;
    return { block: withResume(rot[rotationIndex(rot)]!), mandatory: false };
  };
  /** True if there's an in-progress surah that still needs its mandatory daily revision pass before new memorisation can start. */
  const mandatoryNeeded = () => {
    if (DEV_UNLOCK_ALL) return false;
    const cur = nextUpSurah();
    return lastLearnedIndex(cur) >= 0 && revisionMandatoryDoneDate !== today;
  };

  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop();
    setRecording(false);
    stream.current?.getTracks().forEach(track => track.stop());
  }
  async function startRecording() {
    setRecordError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setRecordError("Recording is not available in this browser."); return; }
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = mic;
      const chunks: BlobPart[] = [];
      const next = new MediaRecorder(mic);
      next.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      next.onstop = () => {
        if (chunks.length) setRecordedUrl(URL.createObjectURL(new Blob(chunks, { type: next.mimeType || "audio/webm" })));
        mic.getTracks().forEach(track => track.stop());
      };
      recorder.current = next;
      next.start();
      setRecording(true);
    } catch { setRecordError("Microphone access was declined. You can still recite aloud and assess yourself."); }
  }
  function resetVerseUi() { stopRecording(); setRecordedUrl(null); setRecordError(""); setRevealed(false); setAutoPhase(null); setLastDiff(null); setLastLabel(null); setAutoAttempt(0); setPhraseIndex(0); setLinkChecking(false); }
  function chooseSurah(n: number) {
    const m = allSurahs.find(s => s.number === n); if (!m) return;
    if (surahLocked(n)) { toast("Finish memorising the previous surah first"); return; }
    if (mandatoryNeeded()) { toast(`Revise ${surahName(nextUpSurah())} before starting new Hifz today`); setTab("revision"); return; }
    if (!DEV_UNLOCK_ALL && revisionBlocks().length > 0 && revisionDoneDate !== today) { toast("Revise today's cycle before starting new Hifz"); setTab("revision"); return; }
    setSetup(n); setSetupStart(firstUnlearned(n, m.ayahs)); setSetupSize(plan.size);
  }
  function markKnownSurahs() {
    if (!knownPicks.length) { setShowKnownDialog(false); return; }
    setProgress(prev => {
      const next = { ...prev };
      for (const n of knownPicks) {
        const m = allSurahs.find(s => s.number === n);
        if (!m) continue;
        for (let v = 0; v < m.ayahs; v++) {
          next[keyFor(n, v)] = { mark: "good", level: intervals.length, due: today, last: today };
        }
      }
      return next;
    });
    toast.success(`Marked ${knownPicks.length} surah${knownPicks.length === 1 ? "" : "s"} as memorised`);
    setKnownPicks([]); setShowKnownDialog(false);
  }
  function openSession(n: number, from: number, to: number, isReview = false, keepReciter = false) {
    resetVerseUi();
    if (!keepReciter) setSessionStarted(false);
    setMandatoryPass(false);
    if (n !== active) setVerses(verseCache.get(n) ?? null);
    setSetup(null); setActive(n); setVerseIndex(from); setChunk([from, to]); setStage(isReview ? "recall" : "study");
    setReviewOnly(isReview); setDone(false); setPortionHidden(false);
  }
  function beginSetup() {
    if (!setupMeta) return;
    const from = Math.min(Math.max(1, setupStart), setupMeta.ayahs) - 1;
    const to = setupSize === 0 ? setupMeta.ayahs - 1 : Math.min(setupMeta.ayahs - 1, from + setupSize - 1);
    openSession(setupMeta.number, from, to);
  }
  function startBlock(target: { block: { surah: number; from: number; to: number }; mandatory: boolean }, keepReciter = false) {
    openSession(target.block.surah, target.block.from, target.block.to, true, keepReciter);
    setMandatoryPass(target.mandatory);
  }
  function beginTimedRevision() {
    const target = nextRevisionTarget();
    if (!target) return;
    setRevisionTimerEnd(Date.now() + plan.revisionMinutes * 60000);
    startBlock(target, false);
  }
  function startMandatoryRevision(keepReciter = false) {
    const cb = currentBlock();
    if (!cb) return;
    setRevisionTimerEnd(null);
    startBlock({ block: cb, mandatory: true }, keepReciter);
  }
  function nextVerse(mark: Mark) {
    if (active === null || !surah) return;
    const key = keyFor(active, verseIndex);
    setProgress(prev => {
      const old = prev[key];
      const level = mark === "good" ? Math.min((old?.level ?? 0) + 1, intervals.length) : mark === "hard" ? Math.max(old?.level ?? 0, 0) : 0;
      const due = mark === "good" ? addDays(intervals[level - 1] ?? 60) : mark === "hard" ? addDays(1) : today;
      return { ...prev, [key]: { mark, level, due, last: today } };
    });
    setActivity(prev => ({ ...prev, [today]: (prev[today] ?? 0) + 1 }));
    const finishedSurah = active;
    resetVerseUi(); setStage(reviewOnly ? "recall" : "study");

    if (!reviewOnly) {
      if (verseIndex < chunk[1]) setVerseIndex(index => index + 1); else setDone(true);
      return;
    }

    const timed = revisionTimerEnd !== null;
    const expired = timed && Date.now() >= (revisionTimerEnd as number);

    if (verseIndex < chunk[1]) {
      // Time is checked after every verse, except while revising the surah you're memorising (that one must be finished).
      if (expired && !mandatoryPass) {
        setRevisionResume(surahAyahs(finishedSurah) > LONG_SURAH_AYAHS ? { surah: finishedSurah, verse: Math.max(chunk[0], verseIndex + 1 - RESUME_LOOKBACK) } : null);
        toast.success("Time's up — revision done for today");
        setDone(true);
        return;
      }
      setVerseIndex(index => index + 1);
      return;
    }

    // This block is finished.
    setRevisionDoneDate(today);
    setRevisionResume(r => (r && r.surah === finishedSurah ? null : r));
    const rot = rotationBlocks();
    let next: { block: { surah: number; from: number; to: number }; mandatory: boolean } | null = null;
    if (mandatoryPass) {
      setRevisionMandatoryDoneDate(today);
      if (!timed) { toast.success("Revision complete — new Hifz is unlocked for today."); setDone(true); return; }
      if (rot.length) next = { block: withResume(rot[rotationIndex(rot)]!), mandatory: false };
    } else if (rot.length) {
      const following = rot[(rotationIndex(rot) + 1) % rot.length]!;
      setRevisionCursor(following.surah);
      next = { block: following.surah === finishedSurah ? following : withResume(following), mandatory: false };
    }
    if (expired || !next) { toast.success(expired ? "Time's up — revision done for today" : "Revision complete"); setDone(true); return; }
    toast.success("Continuing revision…");
    startBlock(next, true);
  }
  function downloadIcs() {
    const [h, m] = plan.time.split(":");
    const d = new Date(); const start = `${dayKey(d).replace(/-/g, "")}T${h}${m}00`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IlmStation//Hifz//EN", "BEGIN:VEVENT", `UID:hifz-${Date.now()}@ilmstation`, `DTSTART:${start}`, "DURATION:PT20M", `RRULE:FREQ=WEEKLY;BYDAY=${plan.days.map(x => icsDays[x]).join(",")}`, "SUMMARY:Hifz session · IlmStation", `DESCRIPTION:Memorise ${plan.daily} ayat and revise what is due.`, "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", "DESCRIPTION:Hifz session in 10 minutes", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a"); a.href = url; a.download = "ilmstation-hifz.ics"; a.click(); URL.revokeObjectURL(url);
    toast.success("Calendar reminder downloaded", { description: "Open the file to add recurring Hifz reminders to your calendar." });
  }
  async function toggleReminders() {
    if (plan.reminders) { setPlan(p => ({ ...p, reminders: false })); return; }
    if (typeof Notification !== "undefined" && Notification.permission === "default") { try { await Notification.requestPermission(); } catch { /* ignore */ } }
    setPlan(p => ({ ...p, reminders: true }));
    toast.success("Reminders on", { description: nextSession ? `Next session: ${nextSession}` : "Pick at least one day." });
  }

  const tile = "border-2 border-foreground p-4 shadow-brutal-sm";
  const sessionTotal = chunk[1] - chunk[0] + 1;

  return <div className="min-w-0 iq-rise pb-8">
    <header className="border-2 border-foreground bg-primary px-4 py-4 shadow-brutal sm:px-6">
      <p className="text-xs font-bold uppercase">IlmStation / Memorisation</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><h1 className="font-serif text-4xl leading-none sm:text-5xl">Hifz workspace</h1>{(active !== null || setup !== null) && <Button variant="outline" size="sm" onClick={() => { autoStopRef.current = true; stopRecording(); setActive(null); setSetup(null); setDone(false); }}><ArrowLeft /> Workspace</Button>}</div>
    </header>

    {setupMeta ? <div className="mt-6 max-w-2xl border-2 border-foreground bg-background shadow-brutal">
      <div className="flex items-center justify-between gap-3 border-b-2 border-foreground bg-muted px-5 py-3"><div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">Surah {setupMeta.number} · {setupMeta.ayahs} ayat</p><h2 className="font-serif text-3xl">{setupMeta.name}</h2></div><span className="font-arabic text-3xl" lang="ar" dir="rtl">{setupMeta.arabic}</span></div>
      <div className="space-y-5 p-5">
        <div><p className="text-xs font-bold uppercase">How much would you like to memorise?</p><div className="mt-2 flex flex-wrap gap-2">{sizes.map(s => <Button key={s.value} size="sm" variant={setupSize === s.value ? "default" : "outline"} aria-pressed={setupSize === s.value} onClick={() => setSetupSize(s.value)}>{s.label}</Button>)}</div></div>
        <label className="block"><span className="text-xs font-bold uppercase">Start from ayah</span><input type="number" min={1} max={setupMeta.ayahs} value={setupStart} onChange={e => setSetupStart(Number(e.target.value) || 1)} className="mt-2 block h-11 w-32 border-2 border-foreground bg-background px-3"/></label>
        {(() => { const from = Math.min(Math.max(1, setupStart), setupMeta.ayahs); const to = setupSize === 0 ? setupMeta.ayahs : Math.min(setupMeta.ayahs, from + setupSize - 1); return <p className="border-l-4 border-secondary bg-muted/50 px-3 py-2 text-sm">This session: <b>ayat {from}{to > from ? `–${to}` : ""}</b> · {to - from + 1} {to - from === 0 ? "ayah" : "ayat"}{speechSupported && !preferManual ? " — you'll pick a reciter next" : ", each through study, recall and recite, then the whole portion together"}.</p>; })()}
        <div className="flex flex-wrap gap-2"><Button onClick={beginSetup}>Begin session <ArrowRight /></Button><Button variant="ghost" onClick={() => setSetup(null)}>Cancel</Button></div>
      </div>
    </div> : active === null ? <div className="mt-6 min-w-0">
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={cn(tile, "bg-primary")}><p className="text-xs font-bold uppercase">Today's goal</p><strong className="mt-1 block font-serif text-3xl font-normal">{todayCount}<span className="text-lg"> / {plan.daily}</span></strong><div className="mt-2 h-2 border border-foreground bg-background"><div className="h-full bg-foreground" style={{ width: `${Math.min(100, (todayCount / Math.max(1, plan.daily)) * 100)}%` }}/></div></div>
        <div className={cn(tile, "bg-secondary text-secondary-foreground")}><p className="text-xs font-bold uppercase">Memorised</p><strong className="mt-1 block font-serif text-3xl font-normal">{memorized}</strong><p className="text-xs opacity-80">{((memorized / TOTAL_AYAT) * 100).toFixed(2)}% of the Qur'an</p></div>
        <div className={cn(tile, "bg-background")}><p className="text-xs font-bold uppercase text-muted-foreground">Revision</p><strong className="mt-1 block font-serif text-2xl font-normal">{(() => { const t = nextRevisionTarget(); return t ? surahName(t.block.surah) : "Nothing yet"; })()}</strong><p className="text-xs text-muted-foreground">{streak ? `${streak}-day streak` : "Start a streak today"}</p></div>
        <div className={cn(tile, "bg-background")}><p className="text-xs font-bold uppercase text-muted-foreground">Next session</p><strong className="mt-1 block font-serif text-2xl font-normal">{nextSession ?? "Not planned"}</strong><button className="text-xs font-semibold underline" onClick={() => setTab("plan")}>{plan.reminders ? "Reminders on · edit" : "Set your plan"}</button></div>
      </div>
      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className={cn(tile, "bg-background")}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase text-muted-foreground">A gentle practice rhythm</p><div className="flex flex-wrap gap-x-4 gap-y-1">{steps.map((step, index) => <span key={step.id} className="flex items-center gap-2 text-sm"><span className="grid size-6 place-items-center border-2 border-foreground bg-primary font-serif text-xs">{index + 1}</span><b>{step.title}</b></span>)}</div></div><div className="mt-3 flex flex-wrap gap-2">{revisionBlocks().length > 0 && <Button size="sm" variant={mandatoryNeeded() ? "destructive" : "outline"} onClick={() => setTab("revision")}><RotateCcw /> {mandatoryNeeded() ? `Revise ${surahName(nextUpSurah())}` : "Continue revision"}</Button>}<Button size="sm" variant={(mandatoryNeeded() || (revisionBlocks().length > 0 && revisionDoneDate !== today)) ? "outline" : "default"} disabled={mandatoryNeeded() || (revisionBlocks().length > 0 && revisionDoneDate !== today)} onClick={() => chooseSurah(nextUpSurah())}>Continue with {surahName(nextUpSurah())} <ArrowRight /></Button></div></div>
        <div className={cn(tile, "bg-background")}><div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground"><span>This week</span><span>{weekCount} / {plan.weekly}</span></div><div className="mt-2 flex h-16 items-end gap-1">{week.map((d, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className={cn("w-full border border-foreground", d.today ? "bg-primary" : "bg-secondary")} style={{ height: `${Math.max(4, Math.min(44, d.count * 6))}px` }} title={`${d.count} ayat`}/><span className="text-[10px]">{d.label[0]}</span></div>)}</div></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b-2 border-foreground" role="tablist">{([["surahs", "Surahs"], ["revision", "Revision"], ["plan", "Plan & reminders"]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("-mb-0.5 border-2 border-foreground px-4 py-2 text-sm font-bold", tab === id ? "bg-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>{label}</button>)}</div>

      {tab === "surahs" && <>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Surahs unlock in order — Al-Fatiha first, then An-Nas back to Al-Baqarah.</p>
          <Button size="sm" variant="outline" onClick={() => setShowKnownDialog(true)}>Already know some surahs?</Button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><label className="relative block min-w-0"><Search className="absolute left-3 top-3.5 size-4"/><span className="sr-only">Search surahs</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, meaning, Arabic or number" className="h-11 w-full border-2 border-foreground bg-background pl-10 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"/></label><div className="grid grid-cols-2 gap-3 sm:contents"><select value={range} onChange={event => setRange(event.target.value)} aria-label="Filter by chapter" disabled={juz !== "all"} className="h-11 min-w-0 border-2 border-foreground bg-background px-3 disabled:opacity-50">{ranges.map(([x, y], i) => <option key={i} value={String(i)}>Chapters {x}–{y}</option>)}<option value="all">All chapters</option></select><select value={juz} onChange={event => setJuz(event.target.value)} aria-label="Filter by juz" className="h-11 min-w-0 border-2 border-foreground bg-background px-3"><option value="all">All Juz</option>{Array.from({ length: 30 }, (_, i) => <option key={i} value={String(i + 1)}>Juz {i + 1}</option>)}</select></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{filtered.length ? filtered.map(item => {
          let mem = 0; for (let v = 0; v < item.ayahs; v++) { const r = progress[keyFor(item.number, v)]; if (r?.level) mem++; }
          const pct = Math.round((mem / item.ayahs) * 100);
          const locked = surahLocked(item.number);
          const idx = HIFZ_ORDER.indexOf(item.number);
          const prevName = idx > 0 ? surahName(HIFZ_ORDER[idx - 1]!) : "";
          return <Button key={item.number} variant="outline" disabled={locked} onClick={() => chooseSurah(item.number)} className={cn("group flex min-h-23 w-full items-center justify-between gap-3 rounded-none px-4 py-3 text-left", locked && "opacity-60")}><span className="min-w-0 flex-1"><small className="block text-[11px] font-bold uppercase text-muted-foreground">Surah {item.number} · Juz {item.juz} · {item.ayahs} ayat</small><strong className="mt-1 block break-words font-serif text-2xl font-normal">{item.name}</strong><small className="block break-words text-xs text-muted-foreground">{locked ? `Locked — finish ${prevName} first` : mem ? `${mem} of ${item.ayahs} memorised` : item.translation}</small>{!locked && mem > 0 && <span className="mt-2 block h-1.5 border border-foreground"><span className="block h-full bg-secondary" style={{ width: `${pct}%` }}/></span>}</span><span className="flex shrink-0 items-center gap-2">{locked ? <Lock className="size-4" /> : <><span className="font-arabic text-2xl" lang="ar" dir="rtl">{item.arabic}</span><ChevronRight className="size-4" /></>}</span></Button>;
        }) : <p className="border-2 border-foreground p-5 text-sm md:col-span-2">No surahs match that search. Try another name, chapter or juz.</p>}</div>
        {showKnownDialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setShowKnownDialog(false)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto border-2 border-foreground bg-background p-5 shadow-brutal" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-2xl">Already know some surahs?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tick any you can already recite from memory — they'll be marked complete and added to your revision cycle.</p>
            <div className="mt-4 grid max-h-80 gap-1 overflow-y-auto">{HIFZ_ORDER.map(n => { const m = allSurahs.find(s => s.number === n); if (!m) return null; const checked = knownPicks.includes(n); const already = isSurahMemorized(n); return <label key={n} className={cn("flex items-center justify-between gap-2 border-b border-foreground/20 py-2 text-sm", already && "opacity-50")}><span>{m.name} <span className="text-xs text-muted-foreground">({m.ayahs} ayat)</span></span><input type="checkbox" disabled={already} checked={checked || already} onChange={() => setKnownPicks(p => checked ? p.filter(x => x !== n) : [...p, n])} className="size-5 accent-foreground"/></label>; })}</div>
            <div className="mt-5 flex flex-wrap gap-2"><Button onClick={markKnownSurahs}>Save</Button><Button variant="ghost" onClick={() => { setKnownPicks([]); setShowKnownDialog(false); }}>Cancel</Button></div>
          </div>
        </div>}
      </>}

      {tab === "revision" && <div className="mt-4 min-w-0 space-y-4">
        {mandatoryNeeded() && <section className={cn(tile, "bg-destructive/10")}>
          <p className="text-xs font-bold uppercase text-destructive">Required before new Hifz today</p>
          <h3 className="mt-1 font-serif text-2xl">Revise {surahName(nextUpSurah())} · ayat {(currentBlock()?.from ?? 0) + 1}–{lastLearnedIndex(nextUpSurah()) + 1}</h3>
          <p className="mt-2 text-sm text-muted-foreground">You're still memorising this surah — revise everything you've learned of it so far before starting anything new today.</p>
          <Button className="mt-3" variant="destructive" onClick={() => startMandatoryRevision(false)}>Revise now <ArrowRight /></Button>
        </section>}
        {(() => {
          const target = nextRevisionTarget();
          const cb = currentBlock();
          const rot = rotationBlocks();
          if (!target) return <section className={cn(tile, "bg-background")}><p className="text-sm text-muted-foreground">{cb || rot.length ? "You've finished today's revision." : "Nothing memorised yet — start with Al-Fatiha to begin building your revision cycle."}</p></section>;
          const order = [...(cb ? [cb] : []), ...rot];
          const b = target.block;
          return <>
            <section className={cn(tile, "bg-primary")}>
              <p className="text-xs font-bold uppercase">{target.mandatory ? "Starts with the surah you're memorising" : "Next up in your revision cycle"}</p>
              <h3 className="mt-1 font-serif text-3xl">{surahName(b.surah)} <span className="text-lg font-normal">· ayat {b.from + 1}–{b.to + 1}</span></h3>
              <p className="mt-2 text-sm">Newest first, then back toward Al-Fatiha, then around again. Each day starts with the surah you're memorising.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2"><Timer className="size-4"/><span className="text-xs font-bold uppercase">Session length</span>{REVISION_MINUTE_OPTIONS.map(m => <Button key={m} size="sm" variant={plan.revisionMinutes === m ? "default" : "outline"} onClick={() => setPlan(p => ({ ...p, revisionMinutes: m }))}>{formatMinutes(m)}</Button>)}</div>
              <Button className="mt-4 bg-foreground text-background" onClick={beginTimedRevision}><RotateCcw /> Start {formatMinutes(plan.revisionMinutes)} revision</Button>
            </section>
            <section className={cn(tile, "bg-background")}>
              <h3 className="font-serif text-xl">Your cycle, in order</h3>
              <ol className="mt-3 flex flex-wrap gap-2 text-sm">{order.map((x, i) => <li key={`${x.surah}-${i}`} className={cn("border-2 border-foreground px-2 py-1", x.surah === b.surah ? "bg-primary font-bold" : "bg-muted text-muted-foreground")}>{surahName(x.surah)}{x.from > 0 || x.to < surahAyahs(x.surah) - 1 ? ` (${x.from + 1}–${x.to + 1})` : ""}</li>)}</ol>
            </section>
          </>;
        })()}
      </div>}

      {tab === "plan" && <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <section className={cn(tile, "lg:col-span-2 bg-primary")}>
          <p className="text-xs font-bold uppercase">Your path</p>
          <p className="mt-1 font-serif text-2xl">{mandatoryNeeded() ? <>Revise <b>{surahName(nextUpSurah())}</b> before continuing Hifz today</> : revisionBlocks().length > 0 && revisionDoneDate !== today ? <>Revise today's cycle before continuing Hifz</> : <>Memorising <b>{surahName(nextUpSurah())}</b> · revision cycling through what's learned so far</>}</p>
          <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => { setTab("revision"); }}>Go to revision</Button><Button size="sm" variant="outline" onClick={() => { setTab("surahs"); }}>View surah order</Button></div>
        </section>
        <section className={cn(tile, "space-y-5 bg-background")}><h3 className="flex items-center gap-2 font-serif text-2xl"><CalendarDays className="size-5"/> Your Hifz days</h3>
          <div><p className="text-xs font-bold uppercase">Days</p><div className="mt-2 flex flex-wrap gap-2">{dayNames.map((d, i) => { const on = plan.days.includes(i); return <Button key={d} size="sm" variant={on ? "default" : "outline"} aria-pressed={on} onClick={() => setPlan(p => ({ ...p, days: on ? p.days.filter(x => x !== i) : [...p.days, i].sort() }))}>{d}</Button>; })}</div></div>
          <label className="block"><span className="text-xs font-bold uppercase">Time</span><input type="time" value={plan.time} onChange={e => setPlan(p => ({ ...p, time: e.target.value || "06:30" }))} className="mt-2 block h-11 border-2 border-foreground bg-background px-3"/></label>
          <div><p className="text-xs font-bold uppercase">Default portion per session</p><div className="mt-2 flex flex-wrap gap-2">{sizes.map(s => <Button key={s.value} size="sm" variant={plan.size === s.value ? "default" : "outline"} aria-pressed={plan.size === s.value} onClick={() => setPlan(p => ({ ...p, size: s.value }))}>{s.label}</Button>)}</div></div>
          <div className="space-y-2 border-t-2 border-foreground pt-4"><div className="flex flex-wrap gap-2"><Button variant={plan.reminders ? "secondary" : "outline"} onClick={toggleReminders} aria-pressed={plan.reminders}><BellRing /> {plan.reminders ? "Reminders on" : "Turn on reminders"}</Button><Button variant="outline" onClick={downloadIcs} disabled={!plan.days.length}><Download /> Add to calendar</Button></div><p className="text-xs text-muted-foreground">In-app reminders appear while IlmStation is open. Add to calendar for reminders on your phone even when the app is closed.</p></div>
        </section>
        <section className={cn(tile, "space-y-5 bg-background")}><h3 className="flex items-center gap-2 font-serif text-2xl"><Target className="size-5"/> Goals</h3>
          {([["daily", "Ayat per day", 1, 50], ["weekly", "Ayat per week", 1, 300]] as const).map(([k, label, min, max]) => <div key={k}><div className="flex justify-between text-sm"><span className="text-xs font-bold uppercase">{label}</span><b>{plan[k]}</b></div><input type="range" min={min} max={max} value={plan[k]} onChange={e => setPlan(p => ({ ...p, [k]: Number(e.target.value) }))} aria-label={label} className="mt-2 w-full accent-[var(--color-secondary)]"/></div>)}
          <div><div className="flex items-center justify-between text-sm"><span className="text-xs font-bold uppercase">Revision session length</span><b>{formatMinutes(plan.revisionMinutes)}</b></div><div className="mt-2 flex flex-wrap gap-2">{REVISION_MINUTE_OPTIONS.map(m => <Button key={m} size="sm" variant={plan.revisionMinutes === m ? "default" : "outline"} onClick={() => setPlan(p => ({ ...p, revisionMinutes: m }))}>{formatMinutes(m)}</Button>)}</div></div>
          <div className="grid grid-cols-2 gap-3 border-t-2 border-foreground pt-4 text-sm"><div><p className="text-xs font-bold uppercase text-muted-foreground">This week</p><b className="font-serif text-2xl font-normal">{weekCount} / {plan.weekly}</b></div><div><p className="text-xs font-bold uppercase text-muted-foreground">At this pace</p><b className="font-serif text-2xl font-normal">{plan.days.length ? `${Math.ceil((TOTAL_AYAT - memorized) / Math.max(1, plan.daily * plan.days.length) / 52)} yrs` : "—"}</b><p className="text-xs text-muted-foreground">to complete the Qur'an</p></div></div>
          <p className="text-xs text-muted-foreground">Goals, plan and progress are saved on this device.</p>
        </section>
      </div>}
    </div> : !surah ? <div className="mt-6 max-w-xl border-2 border-foreground p-6 shadow-brutal">{loadError ? <><p className="text-sm">{loadError}</p><div className="mt-4 flex gap-2"><Button onClick={() => { const n = active; setActive(null); setTimeout(() => setActive(n), 0); }}>Try again</Button><Button variant="outline" onClick={() => setActive(null)}>Back</Button></div></> : <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin"/> Loading {meta?.name}…</p>}</div> : surah && verse && <div className="mt-6 min-w-0">
      {done ? <div className="max-w-3xl border-2 border-foreground bg-background p-6 shadow-brutal"><p className="text-xs font-bold uppercase text-secondary">{reviewOnly ? "Revision" : "Portion complete"}</p><h2 className="mt-2 font-serif text-4xl">Alhamdulillah</h2><p className="mt-3 text-sm text-muted-foreground">{reviewOnly ? (mandatoryPass ? `You've revised ${surah.name} up to where you've stopped — new Hifz is unlocked for today.` : "Today's revision session is complete.") : `You practiced ${surah.name} ${chunk[0] + 1}${chunk[1] > chunk[0] ? `–${chunk[1] + 1}` : ""}. Today: ${todayCount} / ${plan.daily} ayat.`}</p>
        {!reviewOnly && sessionTotal > 1 && <div className="mt-5 border-2 border-foreground"><div className="flex items-center justify-between gap-2 border-b-2 border-foreground bg-muted px-4 py-2"><span className="text-xs font-bold uppercase">Connect the portion · recite it in one go</span><Button size="sm" variant="ghost" onClick={() => setPortionHidden(v => !v)}>{portionHidden ? <Eye /> : <EyeOff />}{portionHidden ? "Show" : "Hide"}</Button></div><div className="max-h-80 space-y-3 overflow-y-auto p-4" dir="rtl" lang="ar">{surah.verses.slice(chunk[0], chunk[1] + 1).map((v, i) => <p key={i} className={cn("font-arabic text-2xl leading-loose transition", portionHidden && "select-none blur-md")}>{v.arabic} <span className="text-base text-muted-foreground">﴿{chunk[0] + i + 1}﴾</span></p>)}</div></div>}
        <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => { setActive(null); setDone(false); }}>Back to workspace</Button>{!reviewOnly && chunk[1] < surah.verses.length - 1 && <Button variant="outline" onClick={() => openSession(surah.number, chunk[1] + 1, Math.min(surah.verses.length - 1, chunk[1] + sessionTotal))}>Next portion <ArrowRight /></Button>}</div></div> : <>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-muted-foreground">Surah {surah.number} / Ayah {verseIndex + 1} of {surah.verses.length}</p><h2 className="font-serif text-3xl">{surah.name} <span className="font-arabic text-2xl" lang="ar" dir="rtl">{surah.arabic}</span></h2></div><span className="border-2 border-foreground bg-muted px-3 py-1 text-xs font-semibold">{reviewOnly ? `Revision · ayat ${verseIndex - chunk[0] + 1} of ${sessionTotal}` : `Portion ${verseIndex - chunk[0] + 1} / ${sessionTotal}`}</span></div>
        {!reviewOnly && sessionTotal > 1 && <div className="mb-3 flex gap-1" aria-hidden>{Array.from({ length: sessionTotal }, (_, i) => <span key={i} className={cn("h-2 flex-1 border border-foreground", i < verseIndex - chunk[0] ? "bg-secondary" : i === verseIndex - chunk[0] ? "bg-primary" : "bg-muted")}/>)}</div>}
        <div className="mb-5 flex min-w-0 gap-1" aria-label={`Practice step: ${stage}`}>{steps.map((step, index) => <div key={step.id} className={cn("min-w-0 flex-1 border-2 border-foreground px-2 py-2 text-center text-xs font-bold sm:text-sm", step.id === stage ? "bg-primary" : steps.findIndex(item => item.id === stage) > index ? "bg-secondary text-secondary-foreground" : "bg-muted")}>{index + 1}. {step.title}</div>)}</div>

        {autoActive && !sessionStarted ? <div className="max-w-xl border-2 border-foreground bg-background p-6 shadow-brutal">
          <p className="text-xs font-bold uppercase text-secondary">Choose your reciter</p>
          <h3 className="mt-2 font-serif text-3xl">Who should lead this session?</h3>
          <p className="mt-2 text-sm text-muted-foreground">The reciter reads each verse, you repeat after them, and we check the match — word by word, in order — before moving on automatically. Once you're reciting from memory, and when linking verses together, the text stays hidden until you get it right. Long verses are broken into shorter phrases first.</p>
          <select value={reciter} onChange={e => setReciter(e.target.value)} aria-label="Reciter" className="mt-4 h-11 w-full border-2 border-foreground bg-background px-3">{reciters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => setSessionStarted(true)}>Start with {reciters.find(r => r.id === reciter)?.name} <ArrowRight /></Button>
            <Button variant="outline" onClick={switchToManual}>Use manual grading instead</Button>
          </div>
        </div> : <>
        {autoActive && <div className="mb-4 flex flex-wrap items-start gap-3 border-2 border-foreground bg-secondary/10 px-4 py-3 text-sm">
          <span className="flex shrink-0 items-center gap-2 font-bold"><Ear className={cn("size-4", listeningNow && "animate-pulse text-secondary")}/> {linkChecking ? "Linking check" : listeningNow ? "Listening…" : autoPhase === "blind" ? "Recite from memory" : "Repeat after the reciter"}</span>
          {lastLabel && !listeningNow && <span className={cn("border-2 border-foreground px-2 py-0.5 text-xs font-bold uppercase", lastLabel === "Excellent" ? "bg-secondary text-secondary-foreground" : "bg-background")}>{lastLabel}</span>}
          {lastDiff && !showText && <div className="flex flex-1 flex-wrap justify-end gap-1 font-arabic text-lg" dir="rtl">{lastDiff.map((w, i) => <span key={i} className={cn("px-1", w.ok ? "text-secondary" : "bg-destructive/15 text-destructive underline decoration-destructive decoration-2 underline-offset-2")}>{w.word}</span>)}</div>}
          {phrases.length > 1 && autoPhase === "visible" && !linkChecking && <span className="w-full text-xs text-muted-foreground">Phrase {phraseIndex + 1} of {phrases.length}</span>}
          <Button size="sm" variant="ghost" onClick={switchToManual}>Switch to manual grading</Button>
        </div>}
        {!speechSupported && <p className="mb-4 text-xs text-muted-foreground">Automatic reciter-sync needs Chrome's speech recognition, which this browser doesn't support — use the self-assessment buttons below instead.</p>}

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.65fr)]">
          <section className="min-w-0 border-2 border-foreground bg-background shadow-brutal"><div className="flex items-center justify-between gap-2 border-b-2 border-foreground bg-muted px-4 py-2 text-xs font-bold uppercase"><span>{stage === "study" ? "Read and understand" : stage === "recall" ? "Bring the words to mind" : "Recite aloud"}</span><span>{surah.number}:{verseIndex + 1}</span></div><div className="flex min-h-72 flex-col justify-center px-5 py-8 sm:px-8">
            {showText ? <><p dir="rtl" lang="ar" className="font-arabic text-4xl leading-[2.1] sm:text-5xl">{verse.arabic}</p><p className="mt-6 border-t border-foreground pt-4 text-sm leading-relaxed text-muted-foreground">{verse.meaning}</p></> : <div className="py-8 text-center"><BookOpen className="mx-auto size-7 text-secondary"/><p className="mt-4 font-serif text-3xl">Try without looking</p><p className="mt-2 text-sm text-muted-foreground">{stage === "recall" ? "Bring the ayah to mind, then reveal to check." : "Say it aloud before revealing the words."}</p></div>}
          </div><div className="flex flex-wrap items-center gap-2 border-t-2 border-foreground bg-muted/50 px-4 py-3"><Button size="sm" variant={playing ? "secondary" : "outline"} onClick={toggleRecital} aria-label={playing ? "Pause recitation" : "Play recitation"}>{playing ? <Pause /> : <Volume2 />}{playing ? "Pause" : "Listen"}</Button><select value={reciter} onChange={event => setReciter(event.target.value)} aria-label="Reciter" className="h-9 min-w-0 max-w-full flex-1 border-2 border-foreground bg-background px-2 text-sm sm:flex-none">{reciters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><select value={speed} onChange={event => setSpeed(Number(event.target.value))} aria-label="Playback speed" className="h-9 border-2 border-foreground bg-background px-2 text-sm">{speeds.map(v => <option key={v} value={v}>{v}×</option>)}</select><Button size="sm" variant={loop ? "secondary" : "ghost"} onClick={() => setLoop(v => !v)} aria-pressed={loop} aria-label="Repeat verse"><Repeat /> Repeat</Button><audio ref={recital} src={recitalUrl} preload="none" loop={loop} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} /></div>{!autoActive && <div className="flex flex-wrap gap-2 border-t-2 border-foreground p-4">{stage === "study" ? <Button onClick={() => { setStage("recall"); setRevealed(false); }}>Ready to recall <ArrowRight /></Button> : <Button variant="outline" onClick={() => setRevealed(value => !value)}>{revealed ? "Hide verse" : "Reveal verse"}</Button>}{stage === "recall" && <Button onClick={() => { setStage("recite"); setRevealed(false); }}>Continue to recite <ArrowRight /></Button>}</div>}</section>
          <aside className="min-w-0 border-t-2 border-foreground pt-4 lg:border-l-2 lg:border-t-0 lg:pl-5 lg:pt-0"><p className="text-xs font-bold uppercase text-muted-foreground">{stage === "recite" ? "Listen to yourself" : "Your practice desk"}</p><h3 className="mt-1 font-serif text-2xl">{stage === "study" ? "Notice the meaning" : stage === "recall" ? "Remember the sequence" : "Hear your recitation"}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{autoActive ? (reviewOnly ? "Try to recall it from memory first. If you miss a word, the reciter reads just this verse again before you retry." : "The reciter leads, you repeat, and an exact word-by-word match — in the right order — decides when you're ready to move on.") : stage === "study" ? "Read the Arabic slowly, listen to a reciter, and connect it to the meaning. Move on when you are ready." : stage === "recall" ? "Try to recall the whole ayah first. Reveal it to compare, then move on to reciting." : "Recite aloud without looking. You can record and listen back locally, or simply recite without recording. You decide what to review."}</p>
            {stage === "recite" && <div className="mt-5 border-y-2 border-foreground py-4"><div className="flex flex-wrap gap-2"><Button variant={recording ? "secondary" : "outline"} onClick={recording ? stopRecording : startRecording}>{recording ? <Square /> : <Mic />}{recording ? "Stop recording" : "Record recitation"}</Button>{recordedUrl && <Button variant="outline" onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; void audioRef.current.play(); } }}><Play /> Play back</Button>}</div>{recordedUrl && <audio ref={audioRef} src={recordedUrl} controls className="mt-3 w-full" aria-label="Your recorded recitation"/>}{recordError && <p role="alert" className="mt-3 text-sm text-destructive">{recordError}</p>}<p className="mt-3 text-xs text-muted-foreground">Recording stays on this device during this session. No automatic recitation grading.</p></div>}
            {!autoActive && stage === "recite" && <div className="mt-5"><p className="mb-3 text-xs font-bold uppercase">How did it go?</p><div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">{([{ mark: "again", label: "Again", hint: "Revise later today" }, { mark: "hard", label: "Hard", hint: "Revise tomorrow" }, { mark: "good", label: "Good", hint: "Space it out further" }] as const).map(item => <Button key={item.mark} variant={item.mark === "good" ? "default" : "outline"} className="h-auto min-h-12 flex-col items-start rounded-none px-4 py-2 text-left" onClick={() => nextVerse(item.mark)}><span>{item.label}</span><span className="text-xs font-normal opacity-75">{item.hint}</span></Button>)}</div></div>}
            <div className="mt-6 border-t border-foreground pt-4 text-xs text-muted-foreground"><CircleHelp className="mr-1 inline size-4"/> Memorised verses return on a revision schedule: 1, 3, 7, 14, 30, then 60 days.</div>
          </aside>
        </div>
        </>}
        <div className="mt-5 flex flex-wrap justify-between gap-2">{verseIndex > chunk[0] && !reviewOnly ? <Button variant="ghost" onClick={() => { autoStopRef.current = true; resetVerseUi(); setVerseIndex(v => v - 1); setStage("study"); }}><ArrowLeft /> Previous verse</Button> : <span/>}<Button variant="ghost" onClick={() => { autoStopRef.current = true; stopRecording(); setRecordedUrl(null); setActive(null); }}>Pause session <Pause /></Button></div>
      </>}
    </div>}
  </div>;
}
