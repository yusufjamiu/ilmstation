import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { Check, ChevronRight, LocateFixed, Lock, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { usePremium } from "@/components/premium";
import { useAuth } from "@/components/auth";
import { RamadanQuiz, type QuizDay } from "@/components/ramadan-quiz";
import { EidCardMaker } from "@/components/eid-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------- dates ---------- */
type Config = { year: number; start: string; days: number; eidCards?: boolean };
/** Used until the admin sets ramadanConfig/current. 1 Ramadan 1448 is expected around 8 Feb 2027. */
const DEFAULT: Config = { year: 1448, start: "2027-02-08", days: 30 };
const DAY = 86_400_000;

function useRamadanConfig(): Config {
  const [c, setC] = useState(DEFAULT);
  useEffect(() => onSnapshot(doc(db, "ramadanConfig", "current"),
    (s) => { if (s.exists()) setC({ ...DEFAULT, ...(s.data() as Partial<Config>) }); }, () => {}), []);
  return c;
}
const localDate = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y ?? 2027, (m ?? 1) - 1, d ?? 1); };
/** day 0 = before Ramadan (daysLeft), 1..30 = during, -1 = after */
function ramadanDay(c: Config, now = new Date()) {
  const diff = Math.round((localDate(now).getTime() - parseDate(c.start).getTime()) / DAY);
  if (diff < 0) return { day: 0, daysLeft: -diff };
  if (diff >= c.days) return { day: -1, daysLeft: 0 };
  return { day: diff + 1, daysLeft: 0 };
}
function useNow(ms: number) {
  const [n, setN] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setN(new Date()), ms); return () => clearInterval(t); }, [ms]);
  return n;
}
const pad = (n: number) => String(n).padStart(2, "0");
const hms = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; };
const round = (n: number) => Math.round(n * 1000) / 1000;

/* ---------- any city in the world ---------- */
export type City = { name: string; country?: string; lat?: number; lng?: number; method: number };
export const DEFAULT_CITY: City = { name: "Lagos, Nigeria", lat: 6.455, lng: 3.394, method: 3 };
/** Prayer-time method by country (aladhan.com methods). Everyone else: Muslim World League. */
function methodFor(cc?: string): number {
  switch ((cc ?? "").toUpperCase()) {
    case "SA": return 4;  // Umm al-Qura
    case "AE": return 16; // Dubai
    case "QA": return 10;
    case "KW": return 9;
    case "EG": return 5;
    case "PK": case "IN": case "BD": case "AF": return 1; // Karachi
    case "US": case "CA": return 2;  // ISNA
    case "TR": return 13;
    case "MY": return 17;
    case "SG": return 11;
    case "ID": return 20;
    case "FR": return 12;
    default: return 3;    // Muslim World League
  }
}
type GeoResult = { name: string; admin1?: string; country?: string; country_code?: string; latitude: number; longitude: number };

export function CityPicker({ city, onPick }: { city: City; onPick: (c: City) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return undefined; }
    const t = setTimeout(() => {
      setBusy(true);
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=6&language=en`)
        .then((r) => r.json())
        .then((j) => setResults(((j?.results ?? []) as GeoResult[]).map((g) => ({
          name: [g.name, g.admin1 && g.admin1 !== g.name ? g.admin1 : "", g.country].filter(Boolean).join(", "),
          lat: round(g.latitude), lng: round(g.longitude), method: methodFor(g.country_code),
        }))))
        .catch(() => setResults([]))
        .finally(() => setBusy(false));
    }, 350);
    return () => clearTimeout(t);
  }, [q, open]);

  const pick = (c: City) => { onPick(c); setOpen(false); setQ(""); };
  const locate = () => {
    if (!navigator.geolocation) { toast("Location isn't available on this device."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => pick({ name: "My location", lat: round(p.coords.latitude), lng: round(p.coords.longitude), method: city.method }),
      () => toast("Couldn't get your location. Search for your city instead."),
    );
  };

  if (!open) return <div className="flex flex-wrap items-center gap-2">
    <span className="inline-flex items-center gap-1 font-semibold"><MapPin className="size-4" /> {city.name}</span>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Change city</Button>
  </div>;

  return <div className="w-full max-w-md">
    <div className="flex gap-2">
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your city, e.g. Toronto" aria-label="Search your city"
        className="h-10 min-w-0 flex-1 border-2 border-foreground bg-background px-3 outline-none" />
      <Button size="icon" variant="outline" aria-label="Cancel" onClick={() => { setOpen(false); setQ(""); }}><X /></Button>
    </div>
    <div className="mt-2 border-2 border-foreground bg-background">
      <button type="button" onClick={locate} className="flex w-full items-center gap-2 border-b border-foreground/30 px-3 py-2 text-left text-sm font-semibold hover:bg-muted"><LocateFixed className="size-4" /> Use my location</button>
      {busy && <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>}
      {!busy && q.trim().length >= 2 && results.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No cities found.</p>}
      {results.map((c) => <button key={`${c.lat},${c.lng}`} type="button" onClick={() => pick(c)} className="block w-full border-b border-foreground/10 px-3 py-2 text-left text-sm hover:bg-muted">{c.name}</button>)}
    </div>
  </div>;
}

/* ---------- prayer times (aladhan.com, free) ---------- */
type Times = { fajr: Date; maghrib: Date; tz?: string };
function useTimes(city: City, dayKey: string) {
  const [t, setT] = useState<Times | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let off = false;
    setErr(false);
    const d = new Date();
    const ds = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const q = city.lat != null
      ? `timings/${ds}?latitude=${city.lat}&longitude=${city.lng}`
      : `timingsByCity/${ds}?city=${encodeURIComponent(city.name)}&country=${encodeURIComponent(city.country ?? "")}`;
    fetch(`https://api.aladhan.com/v1/${q}&method=${city.method}&iso8601=true`)
      .then((r) => r.json())
      .then((j) => {
        const tm = j?.data?.timings;
        if (!tm?.Fajr || !tm?.Maghrib) throw new Error("no times");
        if (!off) setT({ fajr: new Date(tm.Fajr), maghrib: new Date(tm.Maghrib), tz: j?.data?.meta?.timezone });
      })
      .catch(() => { if (!off) setErr(true); });
    return () => { off = true; };
  }, [city.name, city.country, city.lat, city.lng, city.method, dayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return { times: t, error: err };
}
const clock = (d: Date, tz?: string) => {
  try { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz }); }
  catch { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
};

/* ---------- each user's Ramadan, saved in ramadanProgress/{uid} ---------- */
type DayLog = { fast?: boolean; quran?: boolean; tarawih?: boolean; dua?: boolean; sadaqah?: boolean; qiyam?: boolean; prayers?: string[] };
type YearData = {
  days?: Record<string, DayLog>; juz?: number[]; quest?: number[]; rewarded?: number[];
  steps?: Record<string, string[]>; scores?: Record<string, { score: number; total: number; picks: number[] }>;
};
type Prog = { city?: City; years?: Record<string, YearData> };
export type QuizQ = { q: string; options: string[]; answer: number };
type Lesson = { title?: string; lesson?: string; duaArabic?: string; duaText?: string; hadith?: string; quiz?: QuizQ[] };

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const HABITS: [Exclude<keyof DayLog, "prayers">, string][] = [
  ["fast", "Fasted today"], ["quran", "Read Qur’an"], ["tarawih", "Prayed Tarawih"], ["dua", "Made dua"], ["sadaqah", "Gave sadaqah"],
];
/** The last ten days add the night prayer. */
const habitsFor = (d: number): typeof HABITS => (d >= 21 ? [...HABITS, ["qiyam", "Prayed Qiyam (night prayer)"]] : HABITS);

function Box({ title, tag, children, className }: { title: string; tag?: string; children: React.ReactNode; className?: string }) {
  return <section className={cn("min-w-0 border-2 border-foreground bg-background p-5 shadow-brutal", className)}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-serif text-2xl">{title}</h2>
      {tag && <span className="border-2 border-foreground px-2 py-0.5 text-xs font-bold uppercase">{tag}</span>}
    </div>
    {children}
  </section>;
}

/** The banner on the Today screen. */
export function RamadanBanner({ onOpen }: { onOpen: () => void }) {
  const c = useRamadanConfig();
  const r = ramadanDay(c);
  if (r.day === -1) {
    const after = Math.round((localDate().getTime() - parseDate(c.start).getTime()) / DAY) - c.days + 1;
    if (after > 3) return null;
    return <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-foreground bg-primary px-5 py-3 shadow-brutal">
      <span className="font-serif text-3xl">Eid Mubarak! 🌙</span>
      <p className="text-sm">Taqabbal Allahu minna wa minkum.</p>
      {c.eidCards !== false && <Button variant="outline" onClick={onOpen}>Make an Eid card <ChevronRight /></Button>}
    </div>;
  }
  return <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-foreground bg-primary px-5 py-3 shadow-brutal">
    <div>{r.day === 0
      ? <><span className="font-serif text-4xl">{r.daysLeft}</span><span className="ml-2 text-xs font-bold uppercase">{r.daysLeft === 1 ? "day" : "days"} to Ramadan</span></>
      : <><span className="font-serif text-4xl">Day {r.day}</span><span className="ml-2 text-xs font-bold uppercase">of Ramadan</span></>}</div>
    <p className="text-sm">{r.day === 0 ? "Prepare your intention, Tarawih plan, and 30-day quest chain." : "Check in today and continue your quest."}</p>
    <Button variant="outline" onClick={onOpen}>{r.day === 0 ? "Prepare" : "Open"} <ChevronRight /></Button>
  </div>;
}

export function RamadanScreen() {
  const config = useRamadanConfig();
  const now = useNow(1000);
  const r = ramadanDay(config, now);
  const { addPoints } = usePremium();
  const [uid, setUid] = useState<string | null>(null);
  const [prog, setProg] = useState<Prog>({});
  const [openDay, setOpenDay] = useState<number | null>(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(doc(db, "ramadanProgress", uid), (s) => setProg((s.data() as Prog) ?? {}), () => {});
  }, [uid]);

  const y = String(config.year);
  const year: YearData = prog.years?.[y] ?? {};
  const city = prog.city ?? DEFAULT_CITY;
  const { times, error } = useTimes(city, localDate(now).toDateString());
  const today = r.day > 0 ? r.day : 0;
  const afterEnd = Math.round((localDate(now).getTime() - parseDate(config.start).getTime()) / DAY) - config.days + 1;
  const eidOpen = config.eidCards !== false && ((r.day > 0 && r.day >= config.days - 2) || (r.day === -1 && afterEnd <= 3));
  const log: DayLog = year.days?.[String(today)] ?? {};

  const save = (patch: object) => {
    if (!uid) { toast("Log in to save your Ramadan progress."); return; }
    void setDoc(doc(db, "ramadanProgress", uid), patch, { merge: true }).catch(() => toast("Couldn't save. Check your connection."));
  };
  const setLog = (next: DayLog) => {
    save({ years: { [y]: { days: { [String(today)]: next } } } });
    const complete = habitsFor(today).every(([k]) => next[k]) && (next.prayers?.length ?? 0) === 5;
    if (complete && !(year.rewarded ?? []).includes(today)) {
      addPoints(10);
      toast.success("Day complete! +10 points. Taqabbal Allah.");
      save({ years: { [y]: { rewarded: [...(year.rewarded ?? []), today] } } });
    }
  };

  let streak = 0;
  for (let d = today; d >= 1; d--) { if (year.days?.[String(d)]?.fast) streak++; else if (d !== today) break; }
  const juz = year.juz ?? [];
  const quest = year.quest ?? [];

  let label = "";
  let target: Date | null = null;
  if (times) {
    if (now < times.fajr) { label = "Suhoor ends in"; target = times.fajr; }
    else if (now < times.maghrib) { label = "Iftar in"; target = times.maghrib; }
  }

  // quest steps for one day
  const markStep = (n: number, step: string) => {
    const cur = year.steps?.[String(n)] ?? [];
    if (!cur.includes(step)) save({ years: { [y]: { steps: { [String(n)]: [...cur, step] } } } });
  };
  const finishDay = (n: number, result?: { score: number; total: number; picks: number[] }) => {
    const cur = year.steps?.[String(n)] ?? [];
    const patch: YearData = { steps: { [String(n)]: [...new Set([...cur, "quiz"])] } };
    if (result) patch.scores = { [String(n)]: result };
    if (!quest.includes(n)) { patch.quest = [...quest, n]; addPoints(5); toast.success(`Day ${n} complete! +5 points`); }
    save({ years: { [y]: patch } });
  };

  return <div className="min-w-0 iq-rise">
    <header>
      <p className="text-xs font-semibold uppercase text-muted-foreground">Ramadan {config.year}</p>
      <h1 className="font-serif text-4xl leading-none sm:text-5xl">Your Ramadan</h1>
    </header>

    <Box className="mt-5 bg-primary" title={r.day === 0 ? "Ramadan is coming" : r.day === -1 ? (afterEnd <= 3 ? "Eid Mubarak! 🌙" : "Ramadan has ended") : `Day ${r.day} of ${config.days}`}
      tag={r.day > 0 ? `${streak} day fasting streak` : undefined}>
      {r.day === 0 && <div className="flex flex-wrap items-end gap-3"><span className="font-serif text-6xl">{r.daysLeft}</span><p className="pb-2">{r.daysLeft === 1 ? "day" : "days"} to go, in sha Allah. Set your intention and plan your Qur’an.</p></div>}
      {r.day === -1 && <p>Taqabbal Allahu minna wa minkum. You fasted {Object.values(year.days ?? {}).filter((d) => d.fast).length} days and read {juz.length} juz.</p>}
      {r.day > 0 && (target
        ? <div className="flex flex-wrap items-end gap-4"><span className="font-serif text-5xl tabular-nums sm:text-6xl">{hms(target.getTime() - now.getTime())}</span><p className="pb-2 font-semibold">{label.toLowerCase()}</p></div>
        : <p className="font-serif text-2xl">{times ? "Iftar time has passed. May Allah accept your fast." : "Loading times…"}</p>)}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground/30 pt-4 text-sm">
        <CityPicker city={city} onPick={(c) => save({ city: c })} />
        {times && <span className="font-semibold">Suhoor ends (Fajr) {clock(times.fajr, times.tz)} · Iftar (Maghrib) {clock(times.maghrib, times.tz)}</span>}
        {error && <span className="text-destructive">Couldn't load prayer times. Try another city or try later.</span>}
      </div>
    </Box>

    {eidOpen && <EidCardMaker />}

    {r.day >= 20 && <Box className="mt-5" title="The last ten nights" tag="Seek Laylatul Qadr">
      <p className="font-arabic text-3xl leading-relaxed" dir="rtl">اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي</p>
      <p className="mt-2 italic text-muted-foreground">“O Allah, You are Most Forgiving and You love to forgive, so forgive me.” (Tirmidhi)</p>
      <p className="mt-3 text-sm">Seek Laylatul Qadr especially in the odd nights: 21, 23, 25, 27 and 29.</p>
      {(r.day + 1) % 2 === 1 && r.day + 1 <= config.days && <p className="mt-2 font-semibold">🌙 Tonight is night {r.day + 1}, an odd night. Make extra dua and prayer.</p>}
    </Box>}

    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <Box title="Today’s checklist" tag={r.day > 0 ? `Day ${r.day}` : "Opens in Ramadan"}>
        {r.day > 0 ? <>
          <div className="grid gap-2">{habitsFor(today).map(([k, labelText]) => <button key={k} type="button" onClick={() => setLog({ ...log, [k]: !log[k] })}
            className={cn("flex items-center justify-between border-2 border-foreground px-3 py-2 text-left font-semibold", log[k] ? "bg-secondary text-secondary-foreground" : "bg-background hover:bg-muted")}>
            {labelText}{log[k] && <Check className="size-4" />}
          </button>)}</div>
          <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Prayers</p>
          <div className="mt-2 flex flex-wrap gap-2">{PRAYERS.map((p) => { const on = (log.prayers ?? []).includes(p); return <button key={p} type="button"
            onClick={() => setLog({ ...log, prayers: on ? (log.prayers ?? []).filter((x) => x !== p) : [...(log.prayers ?? []), p] })}
            className={cn("border-2 border-foreground px-3 py-1.5 text-sm font-semibold", on ? "bg-secondary text-secondary-foreground" : "bg-background hover:bg-muted")}>{p}</button>; })}</div>
        </> : <p className="text-muted-foreground">{r.day === 0 ? "Your daily checklist opens on the first day of Ramadan." : "Ramadan has ended."}</p>}
      </Box>

      <Box title="Qur’an khatm" tag={`${juz.length} of 30 juz`}>
        <div className="grid grid-cols-6 gap-2">{Array.from({ length: 30 }, (_, i) => i + 1).map((n) => { const on = juz.includes(n); return <button key={n} type="button" aria-label={`Juz ${n}`}
          onClick={() => save({ years: { [y]: { juz: on ? juz.filter((x) => x !== n) : [...juz, n].sort((a, b) => a - b) } } })}
          className={cn("grid aspect-square place-items-center border-2 border-foreground text-sm font-semibold", on ? "bg-secondary text-secondary-foreground" : "bg-background hover:bg-muted")}>{n}</button>; })}</div>
        <p className="mt-3 text-sm text-muted-foreground">One juz a day finishes the Qur’an in Ramadan. Tap a juz when you finish it.</p>
      </Box>
    </div>

    <Box className="mt-5" title="30-day quest" tag={r.day > 0 || r.day === -1 ? `${quest.length} done` : "Unlocks daily in Ramadan"}>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">{Array.from({ length: config.days }, (_, i) => i + 1).map((n) => {
        const open = r.day > 0 && n === r.day; // only today
        const done = quest.includes(n);
        return <button key={n} type="button" disabled={!open} onClick={() => setOpenDay(n)}
          className={cn("grid aspect-square place-items-center border-2 border-foreground text-sm font-semibold",
            done ? "bg-secondary text-secondary-foreground" : n === r.day ? "bg-primary" : open ? "bg-background hover:bg-muted" : "bg-muted text-muted-foreground",
            openDay === n && "ring-2 ring-ring ring-offset-2")}>
          {open || done ? n : <Lock className="size-3.5" />}
        </button>;
      })}</div>
      {openDay != null && <DayQuest key={openDay} n={openDay} steps={year.steps?.[String(openDay)] ?? []} result={year.scores?.[String(openDay)]}
        onClose={() => setOpenDay(null)} onStep={(s) => markStep(openDay, s)} onFinish={(res) => finishDay(openDay, res)} />}
    </Box>
  </div>;
}

/* ---------- one day: lesson → dua → reminder → quiz ---------- */
const STEPS = [["lesson", "Today’s lesson"], ["dua", "Dua"], ["reminder", "Reminder"], ["quiz", "Quiz"]] as const;
type Step = (typeof STEPS)[number][0];

function DayQuest({ n, steps, result, onClose, onStep, onFinish }: {
  n: number; steps: string[]; result?: { score: number; total: number; picks: number[] };
  onClose: () => void; onStep: (s: Step) => void; onFinish: (r?: { score: number; total: number; picks: number[] }) => void;
}) {
  const [d, setD] = useState<Lesson | null | undefined>(undefined);
  const firstOpen = (STEPS.find(([k]) => !steps.includes(k))?.[0] ?? "quiz") as Step;
  const [tab, setTab] = useState<Step>(firstOpen);
  const [picks, setPicks] = useState<number[]>([]);
  const { account } = useAuth();
  const kid = account?.zone === "kids";

  useEffect(() => {
    getDoc(doc(db, "ramadanDays", String(n))).then((s) => setD(s.exists() ? (s.data() as Lesson) : null)).catch(() => setD(null));
  }, [n]);

  const firstThreeDone = ["lesson", "dua", "reminder"].every((k) => steps.includes(k));
  const quiz = d?.quiz ?? [];
  const next = (s: Step) => { onStep(s); const i = STEPS.findIndex(([k]) => k === s); const nx = STEPS[i + 1]?.[0]; if (nx) setTab(nx); };

  const submitQuiz = () => {
    if (picks.length < quiz.length || picks.some((p) => p == null)) { toast("Answer every question first."); return; }
    const score = quiz.reduce((a, q, i) => a + (picks[i] === q.answer ? 1 : 0), 0);
    toast.success(`You got ${score} of ${quiz.length}!`);
    onFinish({ score, total: quiz.length, picks });
  };

  return <div className="mt-5 border-2 border-foreground p-4">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase text-muted-foreground">Day {n}</p><h3 className="font-serif text-3xl">{d?.title ?? (d === null ? "Coming soon" : "Loading…")}</h3></div>
      <Button size="icon" variant="outline" aria-label="Close" onClick={onClose}><X /></Button>
    </div>

    {d === null && <p className="mt-3 text-muted-foreground">This day’s lesson hasn’t been added yet. Check back soon.</p>}

    {d && <>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{STEPS.map(([k, label], i) => {
        const done = steps.includes(k);
        const locked = k === "quiz" && !firstThreeDone;
        return <button key={k} type="button" disabled={locked} onClick={() => setTab(k)}
          className={cn("flex items-center justify-center gap-1.5 border-2 border-foreground px-2 py-2 text-sm font-semibold",
            tab === k ? "bg-primary" : done ? "bg-secondary text-secondary-foreground" : locked ? "bg-muted text-muted-foreground" : "bg-background hover:bg-muted")}>
          {locked ? <Lock className="size-3.5" /> : done ? <Check className="size-3.5" /> : <span className="text-xs">{i + 1}</span>} {label}
        </button>;
      })}</div>

      <div className="mt-5">
        {tab === "lesson" && <>
          {d.lesson ? <p className="whitespace-pre-wrap leading-7">{d.lesson}</p> : <p className="text-muted-foreground">No lesson text for today.</p>}
          <Button className="mt-5" variant={steps.includes("lesson") ? "secondary" : "default"} onClick={() => next("lesson")}>{steps.includes("lesson") ? "Read ✓ · Next" : "Mark as read"}</Button>
        </>}

        {tab === "dua" && <>
          {d.duaArabic ? <p className="font-arabic text-3xl leading-relaxed" dir="rtl">{d.duaArabic}</p> : <p className="text-muted-foreground">No dua for today.</p>}
          {d.duaText && <p className="mt-2 italic text-muted-foreground">{d.duaText}</p>}
          <Button className="mt-5" variant={steps.includes("dua") ? "secondary" : "default"} onClick={() => next("dua")}>{steps.includes("dua") ? "Done ✓ · Next" : "I’ve made this dua"}</Button>
        </>}

        {tab === "reminder" && <>
          {d.hadith ? <p className="border-l-4 border-foreground pl-3 leading-7">{d.hadith}</p> : <p className="text-muted-foreground">No reminder for today.</p>}
          <Button className="mt-5" variant={steps.includes("reminder") ? "secondary" : "default"}
            onClick={() => { if (quiz.length === 0 || kid) { onStep("reminder"); onFinish(); } else next("reminder"); }}>
            {steps.includes("reminder") ? "Done ✓ · Next" : quiz.length === 0 || kid ? "Mark as done & finish day" : "Mark as done"}
          </Button>
        </>}

        {tab === "quiz" && <RamadanQuiz n={n} day={d as QuizDay} kid={kid} unlocked={firstThreeDone} done={steps.includes("quiz")} onFinish={() => onFinish()} />}
      </div>
    </>}
  </div>;
}
