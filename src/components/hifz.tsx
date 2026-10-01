import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BellRing, BookOpen, CalendarDays, ChevronRight, CircleHelp, Download, Eye, EyeOff, Loader2, Target, Mic, Pause, Play, Repeat, RotateCcw, Search, Square, Volume2 } from "lucide-react";
import { surahList } from "@/components/quran-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
];
const speeds = [0.5, 0.75, 1, 1.25, 1.5];
const ranges = Array.from({ length: 6 }, (_, i) => [i * 20 + 1, Math.min(114, i * 20 + 20)] as const);
const allSurahs = surahList.map(meta => ({ name: meta.name, arabic: meta.arabic, number: meta.n, juz: meta.juz, ayahs: meta.ayahs, start: meta.start, translation: meta.translation }));


type Mark = "again" | "hard" | "good";
type Stage = "study" | "recall" | "recite";
type Rec = { mark: Mark; level: number; due: string; last: string };
type Plan = { size: number; days: number[]; time: string; reminders: boolean; daily: number; weekly: number };
type Tab = "surahs" | "revision" | "plan";
const keyFor = (surah: number, verse: number) => `${surah}:${verse}`;
const parseKey = (key: string) => { const [s, v] = key.split(":").map(Number); return { surah: s ?? 1, verse: v ?? 0 }; };
const steps: { id: Stage; title: string }[] = [{ id: "study", title: "Study" }, { id: "recall", title: "Recall" }, { id: "recite", title: "Recite" }];
const sizes = [{ value: 1, label: "1 ayah" }, { value: 3, label: "3 ayat" }, { value: 5, label: "5 ayat" }, { value: 10, label: "10 ayat" }, { value: 0, label: "Whole surah" }];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const icsDays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const intervals = [1, 3, 7, 14, 30, 60];
const TOTAL_AYAT = 6236;
const defaultPlan: Plan = { size: 3, days: [1, 3, 5, 6], time: "06:30", reminders: false, daily: 3, weekly: 15 };
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return dayKey(d); };
const surahName = (n: number) => allSurahs.find(s => s.number === n)?.name ?? `Surah ${n}`;
function load<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? { ...fallback, ...JSON.parse(raw) } as T : fallback; } catch { return fallback; } }

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
  const [queue, setQueue] = useState<string[]>([]);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [done, setDone] = useState(false);
  const [portionHidden, setPortionHidden] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordError, setRecordError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notified = useRef("");

  useEffect(() => {
    setProgress(load("iq_hifz_progress", {})); setActivity(load("iq_hifz_activity", {}));
    const p = load("iq_hifz_plan", defaultPlan); setPlan(p); setSetupSize(p.size); setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_progress", JSON.stringify(progress)); }, [progress, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_activity", JSON.stringify(activity)); }, [activity, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("iq_hifz_plan", JSON.stringify(plan)); }, [plan, hydrated]);

  // In-app reminder while IlmStation is open
  useEffect(() => {
    if (!plan.reminders) return;
    const check = () => {
      const now = new Date(); const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const tag = `${dayKey()}-${plan.time}`;
      if (plan.days.includes(now.getDay()) && hhmm === plan.time && notified.current !== tag) {
        notified.current = tag;
        toast("Time for Hifz", { description: `Your ${plan.daily}-ayah session is ready.` });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("IlmStation · Hifz", { body: "Your planned memorisation session is ready." });
      }
    };
    check(); const id = setInterval(check, 30000); return () => clearInterval(id);
  }, [plan]);

  useEffect(() => () => { recorder.current?.stop(); stream.current?.getTracks().forEach(track => track.stop()); }, []);
  useEffect(() => () => { if (recordedUrl) URL.revokeObjectURL(recordedUrl); }, [recordedUrl]);

  const meta = active === null ? null : allSurahs.find(item => item.number === active) ?? null;
  const surah: Surah | null = meta && verses ? { ...meta, verses } : null;
  const verse = surah?.verses[verseIndex];
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

  const today = dayKey();
  const entries = Object.entries(progress);
  const memorized = entries.filter(([, r]) => r.level >= 1).length;
  const dueList = useMemo(() => entries.filter(([, r]) => r.due <= today).sort((a, b) => a[1].due.localeCompare(b[1].due) || a[0].localeCompare(b[0], undefined, { numeric: true })).map(([k]) => k), [progress, today]);
  const upcoming = useMemo(() => entries.filter(([, r]) => r.due > today).sort((a, b) => a[1].due.localeCompare(b[1].due)).slice(0, 6), [progress, today]);
  const todayCount = activity[today] ?? 0;
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { label: dayNames[d.getDay()]!, count: activity[dayKey(d)] ?? 0, today: i === 6 }; });
  const weekCount = week.reduce((s, d) => s + d.count, 0);
  const streak = (() => { let n = 0; for (let i = 0; i < 365; i++) { if ((activity[addDays(-i)] ?? 0) > 0) n++; else if (i > 0) break; } return n; })();
  const nextSession = (() => { if (!plan.days.length) return null; const now = new Date(); for (let i = 0; i < 8; i++) { const d = new Date(); d.setDate(now.getDate() + i); if (!plan.days.includes(d.getDay())) continue; const [h, m] = plan.time.split(":").map(Number); d.setHours(h ?? 0, m ?? 0, 0, 0); if (d > now) return i === 0 ? `Today at ${plan.time}` : i === 1 ? `Tomorrow at ${plan.time}` : `${dayNames[d.getDay()]} at ${plan.time}`; } return null; })();
  const [lo, hi] = range === "all" ? [1, 114] : ranges[Number(range)] ?? [1, 114];
  const filtered = allSurahs.filter(item => (juz === "all" || item.juz === Number(juz)) && (search.trim() ? `${item.name} ${item.translation} ${item.arabic} ${item.number}`.toLowerCase().includes(search.toLowerCase()) : juz !== "all" || (item.number >= lo && item.number <= hi)));
  const setupMeta = setup === null ? null : allSurahs.find(s => s.number === setup) ?? null;
  const firstUnlearned = (n: number, ayahs: number) => { for (let v = 0; v < ayahs; v++) if (!progress[keyFor(n, v)] || progress[keyFor(n, v)]!.level < 1) return v + 1; return 1; };

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
  function resetVerseUi() { stopRecording(); setRecordedUrl(null); setRecordError(""); setRevealed(false); }
  function chooseSurah(n: number) { const m = allSurahs.find(s => s.number === n); if (!m) return; setSetup(n); setSetupStart(firstUnlearned(n, m.ayahs)); setSetupSize(plan.size); }
  function openSession(n: number, from: number, to: number, isReview = false) {
    resetVerseUi();
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
  function startRevision(keys: string[]) {
    const first = keys[0]; if (!first) return;
    const { surah: s, verse: v } = parseKey(first);
    setQueue(keys.slice(1)); openSession(s, v, v, true);
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
    resetVerseUi(); setStage(reviewOnly ? "recall" : "study");
    if (reviewOnly) {
      const next = queue[0];
      if (next) { const { surah: s, verse: v } = parseKey(next); setQueue(queue.slice(1)); openSession(s, v, v, true); }
      else { setDone(true); toast.success("Revision complete"); }
      return;
    }
    if (verseIndex >= chunk[1]) setDone(true);
    else setVerseIndex(index => index + 1);
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
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><h1 className="font-serif text-4xl leading-none sm:text-5xl">Hifz workspace</h1>{(active !== null || setup !== null) && <Button variant="outline" size="sm" onClick={() => { stopRecording(); setActive(null); setSetup(null); setDone(false); }}><ArrowLeft /> Workspace</Button>}</div>
    </header>

    {setupMeta ? <div className="mt-6 max-w-2xl border-2 border-foreground bg-background shadow-brutal">
      <div className="flex items-center justify-between gap-3 border-b-2 border-foreground bg-muted px-5 py-3"><div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">Surah {setupMeta.number} · {setupMeta.ayahs} ayat</p><h2 className="font-serif text-3xl">{setupMeta.name}</h2></div><span className="font-arabic text-3xl" lang="ar" dir="rtl">{setupMeta.arabic}</span></div>
      <div className="space-y-5 p-5">
        <div><p className="text-xs font-bold uppercase">How much would you like to memorise?</p><div className="mt-2 flex flex-wrap gap-2">{sizes.map(s => <Button key={s.value} size="sm" variant={setupSize === s.value ? "default" : "outline"} aria-pressed={setupSize === s.value} onClick={() => setSetupSize(s.value)}>{s.label}</Button>)}</div></div>
        <label className="block"><span className="text-xs font-bold uppercase">Start from ayah</span><input type="number" min={1} max={setupMeta.ayahs} value={setupStart} onChange={e => setSetupStart(Number(e.target.value) || 1)} className="mt-2 block h-11 w-32 border-2 border-foreground bg-background px-3"/></label>
        {(() => { const from = Math.min(Math.max(1, setupStart), setupMeta.ayahs); const to = setupSize === 0 ? setupMeta.ayahs : Math.min(setupMeta.ayahs, from + setupSize - 1); return <p className="border-l-4 border-secondary bg-muted/50 px-3 py-2 text-sm">This session: <b>ayat {from}{to > from ? `–${to}` : ""}</b> · {to - from + 1} {to - from === 0 ? "ayah" : "ayat"}, each through study, recall and recite, then the whole portion together.</p>; })()}
        <div className="flex flex-wrap gap-2"><Button onClick={beginSetup}>Begin session <ArrowRight /></Button><Button variant="ghost" onClick={() => setSetup(null)}>Cancel</Button></div>
      </div>
    </div> : active === null ? <div className="mt-6 min-w-0">
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={cn(tile, "bg-primary")}><p className="text-xs font-bold uppercase">Today's goal</p><strong className="mt-1 block font-serif text-3xl font-normal">{todayCount}<span className="text-lg"> / {plan.daily}</span></strong><div className="mt-2 h-2 border border-foreground bg-background"><div className="h-full bg-foreground" style={{ width: `${Math.min(100, (todayCount / Math.max(1, plan.daily)) * 100)}%` }}/></div></div>
        <div className={cn(tile, "bg-secondary text-secondary-foreground")}><p className="text-xs font-bold uppercase">Memorised</p><strong className="mt-1 block font-serif text-3xl font-normal">{memorized}</strong><p className="text-xs opacity-80">{((memorized / TOTAL_AYAT) * 100).toFixed(2)}% of the Qur'an</p></div>
        <div className={cn(tile, "bg-background")}><p className="text-xs font-bold uppercase text-muted-foreground">Due for revision</p><strong className="mt-1 block font-serif text-3xl font-normal">{dueList.length}</strong><p className="text-xs text-muted-foreground">{streak ? `${streak}-day streak` : "Start a streak today"}</p></div>
        <div className={cn(tile, "bg-background")}><p className="text-xs font-bold uppercase text-muted-foreground">Next session</p><strong className="mt-1 block font-serif text-2xl font-normal">{nextSession ?? "Not planned"}</strong><button className="text-xs font-semibold underline" onClick={() => setTab("plan")}>{plan.reminders ? "Reminders on · edit" : "Set your plan"}</button></div>
      </div>
      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className={cn(tile, "bg-background")}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase text-muted-foreground">A gentle practice rhythm</p><div className="flex flex-wrap gap-x-4 gap-y-1">{steps.map((step, index) => <span key={step.id} className="flex items-center gap-2 text-sm"><span className="grid size-6 place-items-center border-2 border-foreground bg-primary font-serif text-xs">{index + 1}</span><b>{step.title}</b></span>)}</div></div><div className="mt-3 flex flex-wrap gap-2">{dueList.length > 0 && <Button size="sm" onClick={() => startRevision(dueList)}><RotateCcw /> Revise {dueList.length} due</Button>}<Button size="sm" variant={dueList.length ? "outline" : "default"} onClick={() => chooseSurah(112)}>Begin with Al-Ikhlas <ArrowRight /></Button></div></div>
        <div className={cn(tile, "bg-background")}><div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground"><span>This week</span><span>{weekCount} / {plan.weekly}</span></div><div className="mt-2 flex h-16 items-end gap-1">{week.map((d, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className={cn("w-full border border-foreground", d.today ? "bg-primary" : "bg-secondary")} style={{ height: `${Math.max(4, Math.min(44, d.count * 6))}px` }} title={`${d.count} ayat`}/><span className="text-[10px]">{d.label[0]}</span></div>)}</div></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b-2 border-foreground" role="tablist">{([["surahs", "Surahs"], ["revision", `Revision${dueList.length ? ` (${dueList.length})` : ""}`], ["plan", "Plan & reminders"]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("-mb-0.5 border-2 border-foreground px-4 py-2 text-sm font-bold", tab === id ? "bg-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>{label}</button>)}</div>

      {tab === "surahs" && <>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><label className="relative block min-w-0"><Search className="absolute left-3 top-3.5 size-4"/><span className="sr-only">Search surahs</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, meaning, Arabic or number" className="h-11 w-full border-2 border-foreground bg-background pl-10 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"/></label><div className="grid grid-cols-2 gap-3 sm:contents"><select value={range} onChange={event => setRange(event.target.value)} aria-label="Filter by chapter" disabled={juz !== "all"} className="h-11 min-w-0 border-2 border-foreground bg-background px-3 disabled:opacity-50">{ranges.map(([x, y], i) => <option key={i} value={String(i)}>Chapters {x}–{y}</option>)}<option value="all">All chapters</option></select><select value={juz} onChange={event => setJuz(event.target.value)} aria-label="Filter by juz" className="h-11 min-w-0 border-2 border-foreground bg-background px-3"><option value="all">All Juz</option>{Array.from({ length: 30 }, (_, i) => <option key={i} value={String(i + 1)}>Juz {i + 1}</option>)}</select></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{filtered.length ? filtered.map(item => {
          let mem = 0, due = 0; for (let v = 0; v < item.ayahs; v++) { const r = progress[keyFor(item.number, v)]; if (r?.level) mem++; if (r && r.due <= today) due++; }
          const pct = Math.round((mem / item.ayahs) * 100);
          return <Button key={item.number} variant="outline" onClick={() => chooseSurah(item.number)} className="group flex min-h-23 w-full items-center justify-between gap-3 rounded-none px-4 py-3 text-left"><span className="min-w-0 flex-1"><small className="block text-[11px] font-bold uppercase text-muted-foreground">Surah {item.number} · Juz {item.juz} · {item.ayahs} ayat</small><strong className="mt-1 block break-words font-serif text-2xl font-normal">{item.name}</strong><small className="block break-words text-xs text-muted-foreground">{due ? `${due} due for revision` : mem ? `${mem} of ${item.ayahs} memorised` : item.translation}</small>{mem > 0 && <span className="mt-2 block h-1.5 border border-foreground"><span className="block h-full bg-secondary" style={{ width: `${pct}%` }}/></span>}</span><span className="flex shrink-0 items-center gap-2"><span className="font-arabic text-2xl" lang="ar" dir="rtl">{item.arabic}</span><ChevronRight className="size-4" /></span></Button>;
        }) : <p className="border-2 border-foreground p-5 text-sm md:col-span-2">No surahs match that search. Try another name, chapter or juz.</p>}</div>
      </>}

      {tab === "revision" && <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <section className={cn(tile, "bg-background")}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-serif text-2xl">Due today</h3>{dueList.length > 0 && <Button size="sm" onClick={() => startRevision(dueList)}><RotateCcw /> Start revision</Button>}</div>
          {dueList.length ? <ul className="mt-3 divide-y divide-foreground/20">{dueList.slice(0, 12).map(k => { const { surah: s, verse: v } = parseKey(k); const r = progress[k]!; return <li key={k} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0"><b>{surahName(s)}</b> · ayah {v + 1}<span className="block text-xs text-muted-foreground">{r.mark === "good" ? "Scheduled check-in" : r.mark === "hard" ? "Needed help last time" : "Marked again"}</span></span><Button size="sm" variant="outline" onClick={() => startRevision([k])}>Revise</Button></li>; })}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nothing is due. Verses you memorise come back after 1, 3, 7, 14, 30 and 60 days so they stay strong.</p>}
        </section>
        <section className={cn(tile, "bg-background")}><h3 className="font-serif text-2xl">Coming up</h3>{upcoming.length ? <ul className="mt-3 divide-y divide-foreground/20">{upcoming.map(([k, r]) => { const { surah: s, verse: v } = parseKey(k); return <li key={k} className="flex items-center justify-between gap-2 py-2 text-sm"><span><b>{surahName(s)}</b> · ayah {v + 1}</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5"/>{r.due}</span></li>; })}</ul> : <p className="mt-3 text-sm text-muted-foreground">Your revision schedule fills in as you mark verses Good.</p>}</section>
      </div>}

      {tab === "plan" && <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <section className={cn(tile, "space-y-5 bg-background")}><h3 className="flex items-center gap-2 font-serif text-2xl"><CalendarDays className="size-5"/> Your Hifz days</h3>
          <div><p className="text-xs font-bold uppercase">Days</p><div className="mt-2 flex flex-wrap gap-2">{dayNames.map((d, i) => { const on = plan.days.includes(i); return <Button key={d} size="sm" variant={on ? "default" : "outline"} aria-pressed={on} onClick={() => setPlan(p => ({ ...p, days: on ? p.days.filter(x => x !== i) : [...p.days, i].sort() }))}>{d}</Button>; })}</div></div>
          <label className="block"><span className="text-xs font-bold uppercase">Time</span><input type="time" value={plan.time} onChange={e => setPlan(p => ({ ...p, time: e.target.value || "06:30" }))} className="mt-2 block h-11 border-2 border-foreground bg-background px-3"/></label>
          <div><p className="text-xs font-bold uppercase">Default portion per session</p><div className="mt-2 flex flex-wrap gap-2">{sizes.map(s => <Button key={s.value} size="sm" variant={plan.size === s.value ? "default" : "outline"} aria-pressed={plan.size === s.value} onClick={() => setPlan(p => ({ ...p, size: s.value }))}>{s.label}</Button>)}</div></div>
          <div className="space-y-2 border-t-2 border-foreground pt-4"><div className="flex flex-wrap gap-2"><Button variant={plan.reminders ? "secondary" : "outline"} onClick={toggleReminders} aria-pressed={plan.reminders}><BellRing /> {plan.reminders ? "Reminders on" : "Turn on reminders"}</Button><Button variant="outline" onClick={downloadIcs} disabled={!plan.days.length}><Download /> Add to calendar</Button></div><p className="text-xs text-muted-foreground">In-app reminders appear while IlmStation is open. Add to calendar for reminders on your phone even when the app is closed.</p></div>
        </section>
        <section className={cn(tile, "space-y-5 bg-background")}><h3 className="flex items-center gap-2 font-serif text-2xl"><Target className="size-5"/> Goals</h3>
          {([["daily", "Ayat per day", 1, 50], ["weekly", "Ayat per week", 1, 300]] as const).map(([k, label, min, max]) => <div key={k}><div className="flex justify-between text-sm"><span className="text-xs font-bold uppercase">{label}</span><b>{plan[k]}</b></div><input type="range" min={min} max={max} value={plan[k]} onChange={e => setPlan(p => ({ ...p, [k]: Number(e.target.value) }))} aria-label={label} className="mt-2 w-full accent-[var(--color-secondary)]"/></div>)}
          <div className="grid grid-cols-2 gap-3 border-t-2 border-foreground pt-4 text-sm"><div><p className="text-xs font-bold uppercase text-muted-foreground">This week</p><b className="font-serif text-2xl font-normal">{weekCount} / {plan.weekly}</b></div><div><p className="text-xs font-bold uppercase text-muted-foreground">At this pace</p><b className="font-serif text-2xl font-normal">{plan.days.length ? `${Math.ceil((TOTAL_AYAT - memorized) / Math.max(1, plan.daily * plan.days.length) / 52)} yrs` : "—"}</b><p className="text-xs text-muted-foreground">to complete the Qur'an</p></div></div>
          <p className="text-xs text-muted-foreground">Goals, plan and progress are saved on this device.</p>
        </section>
      </div>}
    </div> : !surah ? <div className="mt-6 max-w-xl border-2 border-foreground p-6 shadow-brutal">{loadError ? <><p className="text-sm">{loadError}</p><div className="mt-4 flex gap-2"><Button onClick={() => { const n = active; setActive(null); setTimeout(() => setActive(n), 0); }}>Try again</Button><Button variant="outline" onClick={() => setActive(null)}>Back</Button></div></> : <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin"/> Loading {meta?.name}…</p>}</div> : surah && verse && <div className="mt-6 min-w-0">
      {done ? <div className="max-w-3xl border-2 border-foreground bg-background p-6 shadow-brutal"><p className="text-xs font-bold uppercase text-secondary">{reviewOnly ? "Revision complete" : "Portion complete"}</p><h2 className="mt-2 font-serif text-4xl">Alhamdulillah</h2><p className="mt-3 text-sm text-muted-foreground">{reviewOnly ? "Your revised verses have been rescheduled." : `You practiced ${surah.name} ${chunk[0] + 1}${chunk[1] > chunk[0] ? `–${chunk[1] + 1}` : ""}. Today: ${todayCount} / ${plan.daily} ayat.`}</p>
        {!reviewOnly && sessionTotal > 1 && <div className="mt-5 border-2 border-foreground"><div className="flex items-center justify-between gap-2 border-b-2 border-foreground bg-muted px-4 py-2"><span className="text-xs font-bold uppercase">Connect the portion · recite it in one go</span><Button size="sm" variant="ghost" onClick={() => setPortionHidden(v => !v)}>{portionHidden ? <Eye /> : <EyeOff />}{portionHidden ? "Show" : "Hide"}</Button></div><div className="max-h-80 space-y-3 overflow-y-auto p-4" dir="rtl" lang="ar">{surah.verses.slice(chunk[0], chunk[1] + 1).map((v, i) => <p key={i} className={cn("font-arabic text-2xl leading-loose transition", portionHidden && "select-none blur-md")}>{v.arabic} <span className="text-base text-muted-foreground">﴿{chunk[0] + i + 1}﴾</span></p>)}</div></div>}
        <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => { setActive(null); setDone(false); }}>Back to workspace</Button>{!reviewOnly && chunk[1] < surah.verses.length - 1 && <Button variant="outline" onClick={() => openSession(surah.number, chunk[1] + 1, Math.min(surah.verses.length - 1, chunk[1] + sessionTotal))}>Next portion <ArrowRight /></Button>}{dueList.length > 0 && <Button variant="outline" onClick={() => startRevision(dueList)}>Revise {dueList.length} due <RotateCcw /></Button>}</div></div> : <>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-muted-foreground">Surah {surah.number} / Ayah {verseIndex + 1} of {surah.verses.length}</p><h2 className="font-serif text-3xl">{surah.name} <span className="font-arabic text-2xl" lang="ar" dir="rtl">{surah.arabic}</span></h2></div><span className="border-2 border-foreground bg-muted px-3 py-1 text-xs font-semibold">{reviewOnly ? `Revision · ${queue.length} more after this` : `Portion ${verseIndex - chunk[0] + 1} / ${sessionTotal}`}</span></div>
        {!reviewOnly && sessionTotal > 1 && <div className="mb-3 flex gap-1" aria-hidden>{Array.from({ length: sessionTotal }, (_, i) => <span key={i} className={cn("h-2 flex-1 border border-foreground", i < verseIndex - chunk[0] ? "bg-secondary" : i === verseIndex - chunk[0] ? "bg-primary" : "bg-muted")}/>)}</div>}
        <div className="mb-5 flex min-w-0 gap-1" aria-label={`Practice step: ${stage}`}>{steps.map((step, index) => <div key={step.id} className={cn("min-w-0 flex-1 border-2 border-foreground px-2 py-2 text-center text-xs font-bold sm:text-sm", step.id === stage ? "bg-primary" : steps.findIndex(item => item.id === stage) > index ? "bg-secondary text-secondary-foreground" : "bg-muted")}>{index + 1}. {step.title}</div>)}</div>
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.65fr)]">
          <section className="min-w-0 border-2 border-foreground bg-background shadow-brutal"><div className="flex items-center justify-between gap-2 border-b-2 border-foreground bg-muted px-4 py-2 text-xs font-bold uppercase"><span>{stage === "study" ? "Read and understand" : stage === "recall" ? "Bring the words to mind" : "Recite aloud"}</span><span>{surah.number}:{verseIndex + 1}</span></div><div className="flex min-h-72 flex-col justify-center px-5 py-8 sm:px-8">
            {stage === "study" || revealed ? <><p dir="rtl" lang="ar" className="font-arabic text-4xl leading-[2.1] sm:text-5xl">{verse.arabic}</p><p className="mt-6 border-t border-foreground pt-4 text-sm leading-relaxed text-muted-foreground">{verse.meaning}</p></> : <div className="py-8 text-center"><BookOpen className="mx-auto size-7 text-secondary"/><p className="mt-4 font-serif text-3xl">Try without looking</p><p className="mt-2 text-sm text-muted-foreground">{stage === "recall" ? "Bring the ayah to mind, then reveal to check." : "Say it aloud before revealing the words."}</p></div>}
          </div><div className="flex flex-wrap items-center gap-2 border-t-2 border-foreground bg-muted/50 px-4 py-3"><Button size="sm" variant={playing ? "secondary" : "outline"} onClick={toggleRecital} aria-label={playing ? "Pause recitation" : "Play recitation"}>{playing ? <Pause /> : <Volume2 />}{playing ? "Pause" : "Listen"}</Button><select value={reciter} onChange={event => setReciter(event.target.value)} aria-label="Reciter" className="h-9 min-w-0 max-w-full flex-1 border-2 border-foreground bg-background px-2 text-sm sm:flex-none">{reciters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><select value={speed} onChange={event => setSpeed(Number(event.target.value))} aria-label="Playback speed" className="h-9 border-2 border-foreground bg-background px-2 text-sm">{speeds.map(v => <option key={v} value={v}>{v}×</option>)}</select><Button size="sm" variant={loop ? "secondary" : "ghost"} onClick={() => setLoop(v => !v)} aria-pressed={loop} aria-label="Repeat verse"><Repeat /> Repeat</Button><audio ref={recital} src={recitalUrl} preload="none" loop={loop} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} /></div><div className="flex flex-wrap gap-2 border-t-2 border-foreground p-4">{stage === "study" ? <Button onClick={() => { setStage("recall"); setRevealed(false); }}>Ready to recall <ArrowRight /></Button> : <Button variant="outline" onClick={() => setRevealed(value => !value)}>{revealed ? "Hide verse" : "Reveal verse"}</Button>}{stage === "recall" && <Button onClick={() => { setStage("recite"); setRevealed(false); }}>Continue to recite <ArrowRight /></Button>}</div></section>
          <aside className="min-w-0 border-t-2 border-foreground pt-4 lg:border-l-2 lg:border-t-0 lg:pl-5 lg:pt-0"><p className="text-xs font-bold uppercase text-muted-foreground">{stage === "recite" ? "Listen to yourself" : "Your practice desk"}</p><h3 className="mt-1 font-serif text-2xl">{stage === "study" ? "Notice the meaning" : stage === "recall" ? "Remember the sequence" : "Hear your recitation"}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stage === "study" ? "Read the Arabic slowly, listen to a reciter, and connect it to the meaning. Move on when you are ready." : stage === "recall" ? "Try to recall the whole ayah first. Reveal it to compare, then move on to reciting." : "Recite aloud without looking. You can record and listen back locally, or simply recite without recording. You decide what to review."}</p>
            {stage === "recite" && <div className="mt-5 border-y-2 border-foreground py-4"><div className="flex flex-wrap gap-2"><Button variant={recording ? "secondary" : "outline"} onClick={recording ? stopRecording : startRecording}>{recording ? <Square /> : <Mic />}{recording ? "Stop recording" : "Record recitation"}</Button>{recordedUrl && <Button variant="outline" onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; void audioRef.current.play(); } }}><Play /> Play back</Button>}</div>{recordedUrl && <audio ref={audioRef} src={recordedUrl} controls className="mt-3 w-full" aria-label="Your recorded recitation"/>}{recordError && <p role="alert" className="mt-3 text-sm text-destructive">{recordError}</p>}<p className="mt-3 text-xs text-muted-foreground">Recording stays on this device during this session. No automatic recitation grading.</p></div>}
            {stage === "recite" && <div className="mt-5"><p className="mb-3 text-xs font-bold uppercase">How did it go?</p><div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">{([{ mark: "again", label: "Again", hint: "Revise later today" }, { mark: "hard", label: "Hard", hint: "Revise tomorrow" }, { mark: "good", label: "Good", hint: "Space it out further" }] as const).map(item => <Button key={item.mark} variant={item.mark === "good" ? "default" : "outline"} className="h-auto min-h-12 flex-col items-start rounded-none px-4 py-2 text-left" onClick={() => nextVerse(item.mark)}><span>{item.label}</span><span className="text-xs font-normal opacity-75">{item.hint}</span></Button>)}</div></div>}
            <div className="mt-6 border-t border-foreground pt-4 text-xs text-muted-foreground"><CircleHelp className="mr-1 inline size-4"/> Memorised verses return on a revision schedule: 1, 3, 7, 14, 30, then 60 days.</div>
          </aside>
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-2">{verseIndex > chunk[0] && !reviewOnly ? <Button variant="ghost" onClick={() => { resetVerseUi(); setVerseIndex(v => v - 1); setStage("study"); }}><ArrowLeft /> Previous verse</Button> : <span/>}<Button variant="ghost" onClick={() => { stopRecording(); setRecordedUrl(null); setActive(null); }}>Pause session <Pause /></Button></div>
      </>}
    </div>}
  </div>;
}
