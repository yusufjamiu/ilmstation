import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IlmCityEngine, type Context } from "./engine";
import { TravelMap } from "./TravelMap";
import type { MatchState, Slot } from "./soccer";
import type { RopeState } from "./rope";
import type { TennisState } from "./tennis";
import { connectCourt, connectCourtLocal, type CourtNet } from "./courtnet";
import { connectRope, connectRopeLocal } from "./ropenet";
import { VEHICLE_INFO } from "./vehicles";
import { connectHomes, connectHomesLocal, type Homes, type Knock, type ShownHome } from "./homes";
import { connectRooms, connectRoomsLocal, roomId, type RoomAd, type RoomsNet } from "./rooms";
import {
  cleanNumber,
  connectCalls,
  connectCallsLocal,
  numberFor,
  VoiceCall,
  type CallDoc,
  type CallNet,
  type CallUi,
  type PhoneEntry,
} from "./calls";
import { connectClaims, connectClaimsLocal, flatFor, type Claims } from "./claims";
import { connectTransfers, connectTransfersLocal, MAX_TRANSFER, type Transfers } from "./transfers";
import {
  connectPitch,
  connectPitchLocal,
  MAX_PER_TEAM,
  SLOT_KEYS,
  type PitchNet,
  type PitchRoom,
} from "./pitchnet";
import {
  AD_PRICES,
  requestAd,
  watchAds,
  watchAward,
  watchMyEnquiries,
  watchNasheeds,
  type Enquiry,
  type Nasheed,
} from "./live";
import { loadHumans } from "./humans";
import {
  ONLINE_LIMITS,
  cleanText,
  connectFirestore,
  connectLocal,
  looksLikeContact,
  type ChatInfo,
  type ChatMsg,
  type Online,
  type PlayerStatus,
} from "./online";
import { SCHOOL_POINTS, SUBJECTS, quizFor, type Q as SchoolQ } from "./school";
import {
  AD_EMAIL,
  BILLBOARDS,
  BUS_FARE,
  WORLD_CITIES,
  INTERCITY,
  cityOf,
  DISTRICTS,
  QUESTIONS,
  STREETS,
  LECTURES,
  POINTS,
  REMINDERS,
  SMALL_TALK,
  ECONOMY,
  TENANTS,
  HOUSE_PRICE,
  ROOM_RENT_WEEK,
  HOME_ITEMS,
  PAINT_PRICE,
  WALL_COLOURS,
  FLOOR_COLOURS,
  JOBS,
  STREAK_REWARDS,
  STREAK_TASKS,
  SHOP_SALES_PER_DAY,
  type Job,
  itemPoints,
  DAY_TASKS,
  TASK_POINTS,
  DAY_BONUS,
  ADHKAR,
  WUDU_STEPS,
  SHOP_PRICES,
  MARKET_TRADERS,
  fullName,
  rootOf,
  regionOf,
  districtById,
  type Lecture,
  type District,
  type Question,
  PLACE_DHIKR,
  CAMPUS_GIST,
  FOUND_ITEMS,
  FOOTBALL,
  MENU,
  HUNGRY_AT,
  eateryPrice,
  type Dish,
  POLICE,
  UNIVERSITIES,
  facultiesOf,
  facultyQuestions,
  type FoundKind,
} from "./content";
import {
  radio,
  useHush,
  RECITERS,
  PLAYLISTS,
  SURAH_NAMES,
  NASHEEDS,
  VEHICLE_RADIO,
  type RadioState,
  type Source,
} from "./audio";
import {
  CITIES,
  clockFor,
  cityGreeting,
  currentPrayer,
  fmtTime,
  masjidStatus,
  nextPrayer,
  type Clock,
  type Prayer,
} from "./time";

/* ---------- saved progress (moves to Firebase with accounts) ---------- */
type Save = {
  coins: number;
  ilm: number;
  day: string;
  prayed: Record<string, boolean>;
  asked: number[];
  pos?: { x: number; z: number };
  district?: string;
  car?: { x: number; z: number; heading: number };
  /** your wall and floor colours */
  paint?: { wall: number; floor: number };
  /** open house: other players may walk in without knocking */
  openHouse?: boolean;
  /** your car was towed to a police station */
  impound?: { fee: number; reason: string; area: string; at: number };
  /** you bought a football kit (needed to play matches) */
  jersey?: boolean;
  /** the car you bought at IlmMotors (none: the starter car) */
  ride?: { kind: CarKind; color: number };
  /** positions are on the one connected Lagos map */
  world?: boolean;
  lectureMin?: number;
  plots?: Record<string, PlotOwn>;
  shops?: Record<string, ShopOwn>;
  schoolPts?: number;
  /** who you are in the city */
  profile?: Look;
  /** guided start: steps in progress; past the last step means finished */
  guide?: number;
  /** the area of your flat */
  homeArea?: string;
  /** the family house (rich family) */
  homePlot?: string;
  path?: LifePath;
  job?: string;
  /** the day you last worked a shift */
  worked?: string;
  streak?: { n: number; last: string };
  items?: string[];
  needs?: Needs;
  tasks?: Record<string, boolean>;
  wudu?: boolean;
  salams?: number;
  /** adhkar said at places today */
  said?: { day: string; ids: string[] };
  /** your university and faculty, if you are a student */
  student?: { area: string; faculty: string };
  /** something you found and are taking to the police */
  carrying?: FoundKind;
  /** a room you rent in another player's house */
  lodging?: { id: string; plot: string; area: string; label: string; until: number; owner: string };
  /** people saved on your phone */
  contacts?: { uid: string; name: string; number: string }[];
  /** recent calls */
  calls?: { name: string; number: string; at: number; dir: "in" | "out" | "missed" }[];
  /** food you collected and haven't eaten yet (dish id) */
  meal?: string;
  /** you kept something that wasn't yours */
  wanted?: { at: number; item: FoundKind };
  /** you are in the police cell */
  jail?: { item: FoundKind };
  /** your own Qur'an player */
  radio?: { on: boolean; reciter: string; playlist: string; vehicles: boolean };
  /** money sent and received */
  txns?: { dir: "in" | "out"; name: string; amount: number; note?: string; at: number }[];
  /** clothes you own ("robe:#hex", "accent:#hex") */
  wardrobe?: string[];
  /** rent for your flat is paid up to this time */
  lease?: { until: number };
  /** sadaqah given at the masjid, in all (game units) */
  sadaqah?: number;
};
type Look = {
  name: string;
  female: boolean;
  skin: number;
  robe: number;
  accent: number;
  /** premium clothes: an agbada for brothers, a lace abaya for sisters */
  style?: "agbada" | "lace";
};

/* ---------- money ----------
   Everything is priced in IlmWorld naira (₦). The save keeps whole units of ₦10. */
const NAIRA_PER_POINT = 10;
/** Show an amount (in ₦10 units) as naira, e.g. 25 → "₦250". */
const N = (units: number) => "₦" + Math.round(units * NAIRA_PER_POINT).toLocaleString();
/** Cashing out: ₦5 in the game is ₦1 in your bank, from ₦10,000. */
const CASH_RATE = 5;
const MIN_WITHDRAW = 1000;
/** New clothes cost ₦500 each. */
const CLOTHES_PRICE = 50;

/** Badges others see on your name: ✨ when Allah has blessed you with wealth (₦100,000 or a
    house of your own), 💚 when you have given ₦5,000 or more in sadaqah. */
const BLESSED_MONEY = 10000;
const GENEROUS_GIVING = 500;
function badgeOf(s: Save) {
  const owns = Object.values(s.plots ?? {}).some((o) => o.kind === "bought" || o.kind === "built");
  return `${(s.sadaqah ?? 0) >= GENEROUS_GIVING ? "💚" : ""}${s.coins >= BLESSED_MONEY || owns ? "✨" : ""}`;
}
/** Premium clothes for those who can afford them: ₦20,000 each. */
const PREMIUM_PRICE = 2000;
const PREMIUM_THOBES = [0xc9a227, 0x5a1f6a, 0x0f2a5a, 0xf7f3e8, 0x7a1f1f];
const PREMIUM_ABAYAS = [0xc9a227, 0x3a1f4a, 0x0f2a5a, 0x101014, 0x6a1f3a];
const PREMIUM_CAPS = [0xc9a227, 0xe6d3a0, 0x5a1f6a];
const PREMIUM_HIJABS = [0xc9a227, 0xe6d3a0, 0xf2e6f0, 0x5a1f6a];

/** Weekly rent for a flat, by how costly the area is (₦1,400 in Lekki down to ₦500). */
const FLAT_RENT: Record<number, number> = { 1: 140, 2: 100, 3: 70, 4: 50 };
const flatRent = (area: string) => FLAT_RENT[districtById(area).tier ?? 2] ?? 100;
const WEEK = 7 * 86400000;
/** A home's colours: painted by its owner, or its own starting colours, so no two look alike. */
function homePaint(uid: string | undefined, p?: { wall: number; floor: number }) {
  if (p) return p;
  if (!uid) return { wall: 0xe9dcc4, floor: 0xb98d5e };
  const h = flatFor(uid).seed;
  return {
    wall: WALL_COLOURS[h % WALL_COLOURS.length],
    floor: FLOOR_COLOURS[(h >>> 8) % FLOOR_COLOURS.length],
  };
}

/* ---------- Ilm: what you have learned ----------
   Ilm grows with salah in jama'ah, lectures, classes, quizzes and adhkar. It gives you a
   title on your profile and raises the pay from your job, and can pay bail. */
const ILM_LEVELS: { min: number; brother: string; sister: string; bonus: number }[] = [
  { min: 0, brother: "Beginner", sister: "Beginner", bonus: 0 },
  { min: 50, brother: "Talib", sister: "Talibah", bonus: 0.05 },
  { min: 200, brother: "Student of knowledge", sister: "Student of knowledge", bonus: 0.1 },
  { min: 600, brother: "Ustadh", sister: "Ustadhah", bonus: 0.2 },
  { min: 1500, brother: "Sheikh", sister: "Sheikhah", bonus: 0.3 },
];
function ilmLevel(ilm: number) {
  let i = 0;
  while (i + 1 < ILM_LEVELS.length && ilm >= ILM_LEVELS[i + 1].min) i++;
  return { ...ILM_LEVELS[i], i, next: ILM_LEVELS[i + 1] ?? null };
}
type LifePath = "rich" | "worker" | "trader";
const LIFE_PATHS: { id: LifePath; icon: string; name: string; text: string }[] = [
  {
    id: "worker",
    icon: "💼",
    name: "9-to-5 worker",
    text: "A flat in the estate and a job with a daily salary: teacher, developer, Hajj consultant…",
  },
  {
    id: "trader",
    icon: "🏪",
    name: "Trader",
    text: "A flat and your first shop free for a week. Add products, then collect your sales.",
  },
  {
    id: "rich",
    icon: "🏡",
    name: "Rich family",
    text: "A big furnished family house on the street and ₦6,000 to start.",
  },
];
const landmarkName = (lid: string) => {
  for (const d of DISTRICTS) for (const l of d.landmarks) if (l.id === lid) return l.name;
  return "";
};
const hm = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
const weekday = (c: Clock) => new Date(c.key + "T12:00:00Z").getUTCDay();
const lecturesAt = (mosque: string, c: Clock) =>
  LECTURES.filter((l) => l.mosque === mosque && (!l.days?.length || l.days.includes(weekday(c))));
/** The lecture playing in this mosque right now, if any. */
function lectureNow(mosque: string, c: Clock) {
  return lecturesAt(mosque, c).find((l) => c.min >= hm(l.start) && c.min < hm(l.start) + l.minutes);
}
/** The next lecture today in this mosque. */
function lectureNext(mosque: string, c: Clock) {
  return lecturesAt(mosque, c)
    .filter((l) => hm(l.start) > c.min)
    .sort((a, b) => hm(a.start) - hm(b.start))[0];
}
const GUEST_KEY = "ilmcity-3d-v1";
let KEY = GUEST_KEY;
/** One save per IlmStation account. A guest's progress moves into their account the
    first time they log in on this phone. */
function useAccountSave(uid: string | null) {
  KEY = uid ? `${GUEST_KEY}-${uid}` : GUEST_KEY;
  if (uid && typeof localStorage !== "undefined") {
    try {
      if (!localStorage.getItem(KEY) && localStorage.getItem(GUEST_KEY))
        localStorage.setItem(KEY, localStorage.getItem(GUEST_KEY)!);
    } catch {
      /* storage blocked */
    }
  }
}
function loadSave(): Save {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Save | null;
    if (s && typeof s.coins === "number") {
      if (!s.world) return { ...s, pos: undefined, car: undefined, world: true };
      return s;
    }
  } catch {
    /* first visit */
  }
  return { coins: POINTS.start, ilm: 0, day: "", prayed: {}, asked: [], world: true };
}
function writeSave(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked */
  }
}

const QUIZ_CAP = POINTS.quizPerDay;
const city = CITIES.lagos;

/** How a saved plot should look in the world (an expired rental shows "To Let" again). */
function plotStateFn(o?: PlotOwn) {
  if (!o) return undefined;
  if (o.kind === "rented") return o.until > Date.now() ? { kind: "rented" as const } : undefined;
  if (o.kind === "owned") return { kind: "owned" as const };
  if (o.kind === "bought") return { kind: "rented" as const };
  if (o.kind === "building" && o.done <= Date.now())
    return { kind: "built" as const, floors: o.floors };
  return { kind: o.kind, floors: o.floors };
}

/** `?time=19:30` lets you test any time of day; without it the game runs on real Lagos time. */
function useTestOffset() {
  return useMemo(() => {
    if (typeof window === "undefined") return 0;
    const t = new URLSearchParams(window.location.search).get("time");
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return 0;
    const [h, m] = t.split(":").map(Number);
    const now = clockFor(city);
    return (h * 60 + m - now.min) * 60000;
  }, []);
}

type Panel =
  | { kind: "info"; title: string; body: ReactNode; phone?: { home?: () => void } }
  | { kind: "quiz"; q: Question; qi: number; picked?: number }
  | { kind: "busy"; title: string; ms: number; done: () => void };

/** Waits for the IlmStation login check, then opens the city with the right save. */
type Who = {
  ready: boolean;
  uid: string | null;
  firstName: string;
  female: boolean;
  adult: boolean;
};
/** The IlmStation login, loaded safely: if it fails or is slow, you play as a guest. */
function useCityAuth(): Who {
  const [who, setWho] = useState<Who>({
    ready: false,
    uid: null,
    firstName: "",
    female: false,
    adult: false,
  });
  useEffect(() => {
    let done = false;
    const finish = (w: Omit<Who, "ready">) => {
      if (done) return;
      done = true;
      setWho({ ...w, ready: true });
    };
    // dev only: ?online=local&as=Name pretends to be a logged-in adult, to test multiplayer
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(window.location.search);
      if (q.get("online") === "local") {
        const as = q.get("as") ?? "Tester";
        setWho({
          ready: true,
          uid: "local-" + as,
          firstName: as,
          female: q.get("sister") === "1",
          adult: true,
        });
        return;
      }
    }
    const guest = { uid: null, firstName: "", female: false, adult: false };
    const t = setTimeout(() => finish(guest), 4000);
    (async () => {
      try {
        const { auth, db } = await import("@/lib/firebase");
        const { onAuthStateChanged } = await import("firebase/auth");
        const { doc, getDoc } = await import("firebase/firestore");
        onAuthStateChanged(auth, async (u) => {
          if (!u) return finish(guest);
          let name = u.displayName ?? "",
            female = false,
            adult = false;
          try {
            const snap = await getDoc(doc(db, "profiles", u.uid));
            if (snap.exists()) {
              const a = snap.data() as {
                name?: string;
                gender?: string;
                zone?: string;
                dob?: string;
              };
              name = a.name ?? name;
              female = a.gender === "female";
              const age = a.dob
                ? (Date.now() - new Date(a.dob).getTime()) / (365.25 * 86400000)
                : 0;
              adult = a.zone !== "youth" && age >= 18;
            }
          } catch {
            /* profile unavailable */
          }
          finish({ uid: u.uid, firstName: name.split(/\s+/)[0] ?? "", female, adult });
        });
      } catch {
        finish(guest);
      }
    })();
    return () => clearTimeout(t);
  }, []);
  return who;
}

export default function IlmCityGame() {
  const { ready, uid, firstName, female, adult } = useCityAuth();
  if (!ready)
    return (
      <div className="grid h-full place-items-center bg-[#10201e] text-center text-[#fdf8ec]">
        <div className="font-serif text-4xl">
          Ilm<span className="text-[#45b8a8]">World</span>
        </div>
      </div>
    );
  return (
    <CityGame
      key={uid ?? "guest"}
      uid={uid}
      loggedIn={!!uid}
      firstName={firstName}
      female={female}
      adult={adult}
    />
  );
}

function CityGame({
  uid,
  loggedIn,
  firstName,
  female: accountFemale,
  adult,
}: {
  uid: string | null;
  loggedIn: boolean;
  firstName: string;
  female: boolean;
  adult: boolean;
}) {
  useAccountSave(uid);
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<IlmCityEngine | null>(null);
  const [save, setSave] = useState<Save>(() => {
    const s = loadSave();
    // testing only: ?points=5000 on the dev server
    const pts = import.meta.env.DEV
      ? new URLSearchParams(window.location.search).get("points")
      : null;
    return pts ? { ...s, coins: Number(pts) } : s;
  });
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (save.profile && !save.homeArea)
      setSave((x) => ({
        ...x,
        homeArea: x.district ?? "lekki",
        items: x.items ?? [],
        needs: x.needs ?? freshNeeds(),
      }));
  }, [save.profile, save.homeArea]);
  // players from before rent started get their first week free
  useEffect(() => {
    if (save.profile && !save.homePlot && !save.lease)
      setSave((x) => ({ ...x, lease: { until: Date.now() + 7 * 86400000 } }));
  }, [save.profile, save.homePlot, save.lease]);
  const offset = useTestOffset();
  const [clock, setClock] = useState<Clock>(() => clockFor(city, Date.now() + offset));
  const clockRef = useRef(clock);
  clockRef.current = clock;
  const [ctx, setCtx] = useState<Context>(null);
  const [place, setPlace] = useState(() => {
    const d = districtById(save.district ?? "lekki");
    return `${d.name} · ${WORLD_CITIES.find((w) => w.id === cityOf(d))?.name ?? "Lagos"}`;
  });
  const [panel, setPanel] = useState<Panel | null>(null);
  const [bigClock, setBigClock] = useState(false);
  const panelRef = useRef<Panel | null>(null);
  panelRef.current = panel;
  const [toasts, setToasts] = useState<{ id: number; text: string; tone?: "good" | "warn" }[]>([]);
  const [driving, setDriving] = useState(false);
  const [inside, setInside] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [speed, setSpeed] = useState<number | null>(null);
  const [ride, setRide] = useState<{
    next: string;
    stopping: boolean;
    fast: boolean;
    kmh: number;
  } | null>(null);
  const arriveRef = useRef<(() => void) | null>(null);
  const talkingRef = useRef<number | null>(null);
  const workSkip = useRef(false);
  const presenceAt = useRef(0);
  const needHintAt = useRef(Date.now());
  const lastSent = useRef({ x: 0, z: 0, area: "" });
  const watchedArea = useRef<string | null>(null);
  const offArea = useRef<(() => void) | null>(null);
  useEffect(() => () => offArea.current?.(), []);
  const areaRef = useRef<string | null>(null);
  const [newArea, setNewArea] = useState<string | null>(null);

  const hisbahRef = useRef<{
    reminded: Set<string>;
    commended: Set<string>;
    asked: Set<string>;
    speedAt: number;
  }>({
    reminded: new Set(),
    commended: new Set(),
    asked: new Set(),
    speedAt: 0,
  });
  const [arriving, setArriving] = useState<string | null>(null);
  const [travelling, setTravelling] = useState<{
    from: string;
    to: string;
    byCar: boolean;
    plane?: boolean;
  } | null>(null);

  const toast = useCallback((text: string, tone?: "good" | "warn") => {
    const id = Math.random();
    setToasts((t) => [{ id, text, tone }, ...t].slice(0, 3));
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      Math.min(7500, 2600 + text.length * 45),
    );
  }, []);
  const update = useCallback(
    (fn: (s: Save) => Save) =>
      setSave((s) => {
        const n = fn(s);
        writeSave(n);
        return n;
      }),
    [],
  );

  /** Finish a step of the guided start: +₦100. */
  const advance = useCallback(
    (which: number | string) => {
      const step = typeof which === "number" ? which : GUIDE.findIndex((g) => g.id === which) + 1;
      if (step < 1 || saveRef.current.guide !== step) return;
      saveRef.current = { ...saveRef.current, guide: step + 1 };
      update((x) => ({ ...x, guide: step + 1, coins: x.coins + 10 }));
      toast(
        step < GUIDE.length
          ? `Step ${step} done! +${N(10)}`
          : "You're ready. Enjoy IlmWorld! +₦100",
        "good",
      );
    },
    [toast, update],
  );
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  // skip steps already done (a job taken before the guide reached it, a flat-less home)
  useEffect(() => {
    const g = GUIDE[(save.guide ?? 99) - 1];
    if (!g) return;
    if (
      (g.id === "job" && save.job) ||
      (g.id === "rent" && save.homePlot) ||
      (g.id === "wudu" && save.wudu)
    )
      advance(g.id);
  }, [save.guide, save.job, save.homePlot, save.wudu, advance]);
  /** Tick off a task in My Day. */
  const doTask = useCallback(
    (id: string) => {
      const t = saveRef.current.tasks ?? {};
      if (t[id]) return;
      const next = { ...t, [id]: true };
      const all = DAY_TASKS.every((d) => next[d.id]);
      // a day with 5 tasks done keeps your streak going
      const today = clockRef.current.key;
      let streak = saveRef.current.streak ?? { n: 0, last: "" };
      let streakBonus = 0;
      if (Object.keys(next).length >= STREAK_TASKS && streak.last !== today) {
        const y = new Date(today + "T12:00:00Z");
        y.setUTCDate(y.getUTCDate() - 1);
        const n = streak.last === y.toISOString().slice(0, 10) ? streak.n + 1 : 1;
        streak = { n, last: today };
        streakBonus = STREAK_REWARDS[n] ?? 0;
        setTimeout(
          () =>
            toast(
              `🔥 ${n}-day streak!${streakBonus ? ` Bonus +${N(streakBonus)}.` : " Come back tomorrow to keep it going."}`,
              "good",
            ),
          1600,
        );
      }
      saveRef.current = { ...saveRef.current, tasks: next, streak };
      update((x) => ({
        ...x,
        tasks: next,
        streak,
        coins: x.coins + TASK_POINTS + (all ? DAY_BONUS : 0) + streakBonus,
      }));
      const task = DAY_TASKS.find((d) => d.id === id);
      toast(
        all
          ? `Masha Allah! You completed your whole day. +${N(TASK_POINTS + DAY_BONUS)}`
          : `✅ ${task?.text ?? "Task"} · +${N(TASK_POINTS)}`,
        "good",
      );
    },
    [toast, update],
  );
  /** Raise (or lower) your needs. */
  const need = useCallback(
    (d: Partial<Needs>) =>
      update((x) => {
        const n = { ...(x.needs ?? freshNeeds()) };
        for (const k of Object.keys(d) as (keyof Needs)[])
          n[k] = Math.max(0, Math.min(100, n[k] + (d[k] ?? 0)));
        return { ...x, needs: n };
      }),
    [update],
  );
  /** Each person you greet counts towards "Greet 3 people with salam". */
  const greeted = useCallback(() => {
    const n = (saveRef.current.salams ?? 0) + 1;
    saveRef.current = { ...saveRef.current, salams: n };
    update((x) => ({ ...x, salams: n }));
    need({ social: 12 });
    if (n >= 3) doTask("salam");
  }, [update, need, doTask]);
  /* ---------- adhkar at places ---------- */
  const [dhikr, setDhikr] = useState<{ id: string; then?: () => void } | null>(null);
  const sayDhikr = useCallback((id: string, then?: () => void, oncePerDay = false) => {
    const s0 = saveRef.current.said;
    const today = clockRef.current.key;
    if (oncePerDay && s0?.day === today && s0.ids.includes(id)) {
      then?.();
      return;
    }
    setDhikr({ id, then });
  }, []);
  const saidDhikr = useCallback(
    (id: string) => {
      const today = clockRef.current.key;
      const s0 = saveRef.current.said;
      const ids = s0?.day === today ? s0.ids : [];
      if (ids.includes(id)) return;
      update((x) => ({ ...x, said: { day: today, ids: [...ids, id] }, ilm: x.ilm + 1 }));
      need({ iman: 3 });
      toast("May Allah accept it. +1 Ilm", "good");
    },
    [update, need, toast],
  );
  useEffect(() => {
    if (!dhikr || dhikr.then) return;
    const t = setTimeout(() => setDhikr(null), 25000);
    return () => clearTimeout(t);
  }, [dhikr]);

  /* ---------- lost things, police and bail ---------- */
  const handIn = useCallback(() => {
    const k = saveRef.current.carrying;
    if (!k) return false;
    update((x) => ({
      ...x,
      carrying: undefined,
      coins: x.coins + POLICE.handInPoints,
      ilm: x.ilm + POLICE.handInIlm,
    }));
    need({ iman: 6 });
    toast(
      `The ${FOUND_ITEMS[k].name} will go back to its owner. JazakAllahu khairan! +${N(POLICE.handInPoints)}, +${POLICE.handInIlm} Ilm`,
      "good",
    );
    return true;
  }, [update, need, toast]);
  const openCell = useCallback(() => {
    const j = saveRef.current.jail;
    if (!j) return;
    const free = (msg: string) => {
      setPanel(null);
      toast(msg, "good");
    };
    setPanel({
      kind: "info",
      title: "Police cell",
      body: (
        <CellView
          item={FOUND_ITEMS[j.item].name}
          points={saveRef.current.coins}
          ilm={saveRef.current.ilm}
          onBailPoints={() => {
            update((x) => ({ ...x, jail: undefined, coins: x.coins - POLICE.bailPoints }));
            free("Bail paid. You're free to go. Don't go back to it.");
          }}
          onBailIlm={() => {
            update((x) => ({ ...x, jail: undefined, ilm: x.ilm - POLICE.bailIlm }));
            free("Bail paid with Ilm. You're free to go. Make tawbah.");
          }}
          onWait={() =>
            setPanel({
              kind: "busy",
              title: "Waiting in the cell",
              ms: POLICE.cellMinutes * 60000,
              done: () => {
                update((x) => ({ ...x, jail: undefined }));
                toast("You've done your time. Make tawbah and start afresh.", "good");
              },
            })
          }
        />
      ),
    });
  }, [update, toast]);
  const openCellRef = useRef(openCell);
  openCellRef.current = openCell;
  // things people lost appear on the pavements; the police catch thieves
  useEffect(() => {
    const iv = setInterval(() => {
      const e = engine.current;
      const sv = saveRef.current;
      if (!e || !sv.profile) return;
      if (sv.jail) {
        if (!panelRef.current) openCellRef.current();
        return;
      }
      const out = e.scenePlace() === "out" && !e.rideKind();
      if (sv.wanted && out && !panelRef.current && Date.now() - sv.wanted.at > 25000) {
        if (Math.random() < 0.3) {
          const area = e.districtId();
          e.putAtZone(`police:${area}`);
          const item = sv.wanted.item;
          const v = FOUND_ITEMS[item].value;
          saveRef.current = { ...sv, wanted: undefined, jail: { item } };
          update((x) => ({
            ...x,
            wanted: undefined,
            jail: { item },
            coins: Math.max(0, x.coins - v),
          }));
          toast(
            `🚓 Police! You were arrested for keeping a ${FOUND_ITEMS[item].name} that wasn't yours. It goes back to its owner (−${N(v)}).`,
            "warn",
          );
          setTimeout(() => openCellRef.current(), 600);
        }
        return;
      }
      if (out && !e.hasFound() && Math.random() < 0.12) {
        const kinds = Object.keys(FOUND_ITEMS) as FoundKind[];
        e.dropFound(kinds[Math.floor(Math.random() * kinds.length)]);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [update, toast]);

  /* ---------- food: order on the phone or eat at the eatery ---------- */
  const openPlacesRef = useRef<(area: string, phone?: boolean) => void>(() => {});
  const openPhoneRef = useRef<() => void>(() => {});
  const openWalletRef = useRef<() => void>(() => {});
  const profileBtn = useRef<HTMLButtonElement | null>(null);
  const eat = useCallback(
    (d: Dish) => {
      setPanel(null);
      const done = () => {
        setPanel(null);
        need({ hunger: d.fills });
        doTask("eat");
        update((x) => ({ ...x, meal: undefined }));
        engine.current?.standUp();
        sayDhikr("afterEating", () => {});
      };
      if (engine.current?.scenePlace() === "out") engine.current.prayPose("sit");
      sayDhikr("beforeEating", () =>
        setPanel({
          kind: "info",
          title: `Bismillah… ${d.name}`,
          body: <EatingView dish={d} onDone={done} />,
        }),
      );
    },
    [need, doTask, sayDhikr, update],
  );
  /** Wash your hands, then eat. */
  const openMeal = useCallback(
    (d: Dish) => {
      setPanel({
        kind: "info",
        title: `${d.icon} ${d.name}`,
        body: <MealView dish={d} onEat={() => eat(d)} />,
      });
    },
    [eat],
  );
  const openMealRef = useRef(openMeal);
  openMealRef.current = openMeal;
  /** your order: on the way, or the rider is waiting outside */
  const [delivery, setDelivery] = useState<{
    dish: Dish;
    outside: boolean;
    near?: boolean;
  } | null>(null);
  const meal = save.meal ? MENU.find((m) => m.id === save.meal) : undefined;
  const buyFood = useCallback(
    (d: Dish, where: "order" | "eatery") => {
      const price = where === "eatery" ? eateryPrice(d) : d.points;
      if (saveRef.current.coins < price) {
        setPanel({
          kind: "info",
          title: "Not enough money",
          body: <NoPointsView price={price} points={saveRef.current.coins} />,
        });
        return;
      }
      update((x) => ({ ...x, coins: x.coins - price }));
      if (where === "eatery") {
        const e = engine.current;
        if (e?.scenePlace() === "restaurant") {
          // take your tray to a table, sit down, then eat
          setPanel(null);
          update((x) => ({ ...x, meal: d.id }));
          e.guideTo("seat:");
          toast(
            `−${N(price)}. Here's your ${d.name.toLowerCase()}! Follow the arrow to a table and sit down.`,
            "good",
          );
          return;
        }
        toast(`−${N(price)}. Here's your ${d.name.toLowerCase()}!`, "good");
        openMeal(d);
        return;
      }
      setPanel(null);
      setDelivery({ dish: d, outside: false });
      toast(`Ordered! −${N(price)}. Your Ilm Food Delivery rider is on the way 🛵`, "good");
      engine.current?.deliverFood(
        () => {
          setDelivery({ dish: d, outside: true });
          toast(
            engine.current?.scenePlace() === "out"
              ? "Your rider is here. Walk to the bike to collect your food."
              : "Your rider is outside. Go out to collect your food.",
            "good",
          );
        },
        (near) => setDelivery((x) => (x ? { ...x, near } : x)),
        () => {
          setDelivery(null);
          update((x) => ({ ...x, meal: d.id }));
          toast(
            `You collected your ${d.name.toLowerCase()}. JazakAllahu khairan! ${engine.current?.districtId() !== (saveRef.current.homeArea ?? "lekki") ? "Sit down here, wash your hands and eat." : "Go inside, wash your hands, then eat."}`,
            "good",
          );
        },
      );
    },
    [update, toast, openMeal],
  );
  const openFood = useCallback(
    (where: "order" | "eatery", phone = false) => {
      setPanel({
        kind: "info",
        phone: phone ? { home: () => openPhoneRef.current() } : undefined,
        title:
          where === "order"
            ? "IlmDash · order food"
            : engine.current?.scenePlace() === "restaurant"
              ? "Al-Ma'idah Restaurant · menu"
              : "Al-Barakah Broast · eatery",
        body: (
          <FoodView
            where={where}
            points={saveRef.current.coins}
            hunger={Math.round((saveRef.current.needs ?? freshNeeds()).hunger)}
            onBuy={(d) => buyFood(d, where)}
          />
        ),
      });
    },
    [buyFood],
  );
  const openPhone = useCallback(() => {
    setPanel({
      kind: "info",
      title: "",
      phone: {},
      body: (
        <PhoneView
          myNumber={callNet.current ? numberFor(callNet.current.uid) : undefined}
          onCalls={() => openCallsRef.current("calls")}
          onHomes={() => openHomesRef.current()}
          onRooms={() => openRoomsRef.current()}
          onWallet={() => openWalletRef.current()}
          onContacts={() => openCallsRef.current("contacts")}
          onFood={() => openFood("order", true)}
          onOutings={() => openOutingsRef.current(true)}
          onTravel={() => openOutingsRef.current(true, "travel")}
          onPlaces={() => openPlacesRef.current(engine.current?.districtId() ?? "lekki", true)}
        />
      ),
    });
  }, [openFood]);
  openPhoneRef.current = openPhone;
  const openCallsRef = useRef<(tab: "calls" | "contacts") => void>(() => {});
  const openChatRef = useRef<(o: { uid: string; name: string }) => void>(() => {});
  const hungry = !!save.profile && (save.needs ?? freshNeeds()).hunger <= HUNGRY_AT;
  const hungryRef = useRef(hungry);
  hungryRef.current = hungry;
  const foodRef = useRef<{ delivery: typeof delivery; meal: typeof meal }>({ delivery, meal });
  foodRef.current = { delivery, meal };

  /* ---------- football ---------- */
  const [onlineReady, setOnlineReady] = useState(0);
  void onlineReady;
  /* the match on the pitch */
  const [match, setMatch] = useState<MatchState | null>(null);
  /* ---------- tennis ---------- */
  const [tennis, setTennis] = useState<TennisState | null>(null);
  const court = useRef<{ net: CourtNet; off: () => void; iv: number } | null>(null);
  const tennisDone = useRef(false);
  const leaveTennis = useCallback(() => {
    const c = court.current;
    if (c) {
      clearInterval(c.iv);
      c.off();
      void c.net.leave();
      c.net.close();
      court.current = null;
    }
    engine.current?.endTennis();
    engine.current?.hideRemotes([]);
    setTennis(null);
  }, []);
  const onTennis = useCallback(
    (t: TennisState) => {
      setTennis(t);
      if (t.phase === "over" && !tennisDone.current) {
        tennisDone.current = true;
        const pts = t.won ? 5 : 2;
        update((x) => ({ ...x, coins: x.coins + pts }));
        need({ energy: -8, social: 12, hunger: -5 });
        toast(`${t.won ? "You won!" : "Good game!"} +${N(pts)}`, "good");
      } else if (t.phase !== "over") tennisDone.current = false;
    },
    [update, need, toast],
  );
  const playTennis = useCallback(
    async (zoneId: string, online: boolean) => {
      const e = engine.current;
      if (!e) return;
      setPanel(null);
      tennisDone.current = false;
      if (!online) {
        if (!e.startTennis(zoneId, onTennis)) toast("Walk to the table tennis spot first.");
        return;
      }
      const me = onlineRef.current?.uid;
      if (!me) {
        toast("Log in to IlmStation to play table tennis with other players.", "warn");
        return;
      }
      let net: CourtNet;
      try {
        const local =
          import.meta.env.DEV &&
          new URLSearchParams(window.location.search).get("online") === "local";
        net = local ? connectCourtLocal(zoneId, me) : await connectCourt(zoneId, me);
      } catch {
        toast("Online table tennis isn't switched on yet. Play the coach for now.", "warn");
        return;
      }
      const name = saveRef.current.profile?.name ?? "Player";
      await net.join(name);
      toast("Waiting for another player on this court… (it starts when they join)");
      let started: "host" | "view" | null = null;
      let other = "";
      const off = net.watch((r) => {
        const ids = Object.entries(r.players)
          .sort((a, b) => a[1].at - b[1].at)
          .map(([u]) => u);
        const mine = ids.indexOf(me);
        if (mine > 1) {
          toast("This court is busy. Try another court or play the coach.", "warn");
          leaveTennis();
          return;
        }
        if (!started && ids.length >= 2) {
          started = mine === 0 ? "host" : "view";
          other = ids[1 - mine];
          const names: [string, string] = [r.players[ids[0]].name, r.players[ids[1]].name];
          e.hideRemotes([other]);
          e.startTennis(zoneId, onTennis, {
            mode: started,
            mySide: mine === 0 ? 0 : 1,
            names,
            send: started === "view" ? (i) => net.sendInput(i) : undefined,
          });
        }
        if (started === "view" && r.state) e.tennisApply(r.state);
        if (started === "host" && r.input[other]) e.tennisRemote(r.input[other]);
        if (started && !r.players[other]) {
          toast("The other player left the court.");
          leaveTennis();
        }
      });
      const iv = window.setInterval(() => {
        if (started === "host") {
          const s = e.tennisSnapshot();
          if (s) net.sendState(s);
        }
      }, 100);
      court.current = { net, off, iv };
    },
    [onTennis, toast, leaveTennis],
  );

  /* ---------- skipping rope ---------- */
  const [rope, setRope] = useState<RopeState | null>(null);
  const ropeOut = useRef(false);
  const onRope = useCallback(
    (r: RopeState) => {
      setRope(r);
      engine.current?.hideRemotes(r.uids);
      if (r.phase === "out" && !ropeOut.current) {
        ropeOut.current = true;
        const pts = Math.min(5, Math.floor(r.count / 10));
        need({ energy: -6, social: 15, hunger: -4 });
        if (pts) {
          update((x) => ({ ...x, coins: x.coins + pts }));
          toast(`${r.count} skips! +${N(pts)}. Masha Allah!`, "good");
        }
      } else if (r.phase !== "out") ropeOut.current = false;
    },
    [need, update, toast],
  );
  const playRope = useCallback(
    async (zoneId: string, how: "jump" | "turn" | "together") => {
      const e = engine.current;
      if (!e) return;
      setPanel(null);
      ropeOut.current = false;
      if (how !== "together") {
        if (!e.startRope(zoneId, { kind: "solo", role: how }, onRope))
          toast("Walk into the Sisters' Corner first.");
        return;
      }
      const uid = onlineRef.current?.uid;
      if (!uid) {
        toast("Log in to IlmStation to skip with other sisters.", "warn");
        return;
      }
      try {
        const local =
          import.meta.env.DEV &&
          new URLSearchParams(window.location.search).get("online") === "local";
        const net = local ? connectRopeLocal(zoneId, uid) : await connectRope(zoneId, uid);
        const name = saveRef.current.profile?.name ?? "Sister";
        if (!e.startRope(zoneId, { kind: "net", net, name }, onRope)) {
          net.close();
          toast("Walk into the Sisters' Corner first.");
        }
      } catch {
        toast(
          "Playing together isn't switched on yet. Skip with the sisters here for now.",
          "warn",
        );
      }
    },
    [onRope, toast],
  );
  const leaveRope = useCallback(() => {
    engine.current?.endRope();
    engine.current?.hideRemotes([]);
    setRope(null);
  }, []);
  const [watching, setWatching] = useState<MatchState | null>(null);
  const matchDone = useRef(false);
  const startPitchMatch = useCallback(
    (zoneId: string) => {
      const e = engine.current;
      if (!e) return;
      matchDone.current = false;
      setPanel(null);
      if (!e.startMatch(zoneId, setMatch)) toast("Walk to the pitch first.");
    },
    [toast],
  );

  /* live matches with other players on the same pitch */
  const pitch = useRef<{
    zone: string;
    net: PitchNet;
    off: () => void;
    live: (() => void)[];
    iv?: number;
    playing: "none" | "play" | "watch";
    host: boolean;
    room: PitchRoom | null;
  } | null>(null);
  const [pitchRoom, setPitchRoom] = useState<PitchRoom | null>(null);
  const stopLive = useCallback(() => {
    const P = pitch.current;
    if (!P) return;
    P.live.forEach((f) => f());
    P.live = [];
    if (P.iv) clearInterval(P.iv);
    P.iv = undefined;
    P.playing = "none";
  }, []);
  const leavePitch = useCallback(async () => {
    const P = pitch.current;
    if (!P) return;
    stopLive();
    const e = engine.current;
    if (e?.inMatch() || e?.isSpectating()) e.endMatch();
    setMatch(null);
    setWatching(null);
    try {
      if (P.room?.room?.host === P.net.uid && P.room.room.status !== "over")
        await P.net.setRoom({ status: "over", slots: null });
      await P.net.leave();
    } catch {
      /* offline */
    }
    P.off();
    P.net.close();
    e?.hideRemotes([]);
    pitch.current = null;
    setPitchRoom(null);
  }, [stopLive]);
  /** Who plays where, from the room's slots (keepers are always the computer). */
  const slotsFor = (r: PitchRoom, me: string): Slot[] => {
    const out: Slot[] = [];
    ([0, 1] as const).forEach((t) => {
      SLOT_KEYS[t].forEach((k) => {
        const v = r.room?.slots?.[k];
        out.push({
          key: k,
          team: t,
          gk: false,
          ctrl: v ? (v.uid === me ? "me" : "remote") : "cpu",
          name: v?.name ?? "Computer",
        });
      });
      out.push({ key: "g" + t, team: t, gk: true, ctrl: "cpu", name: "Keeper" });
    });
    return out;
  };
  const onPitchRoom = useCallback(
    (r: PitchRoom) => {
      const P = pitch.current;
      const e = engine.current;
      if (!P || !e) return;
      const prev = P.room;
      P.room = r;
      setPitchRoom(r);
      // players in this match are drawn on the pitch, not walking around the city
      e.hideRemotes(
        r.room?.status === "playing"
          ? Object.values(r.room.slots ?? {}).flatMap((v) => (v ? [v.uid] : []))
          : [],
      );
      const me = P.net.uid;
      const room = r.room;
      const slots = room?.slots ?? {};
      const mySlot = Object.keys(slots).find((k) => slots[k]?.uid === me);
      P.host = room?.host === me;
      if (room?.status === "playing") {
        if (mySlot && P.playing !== "play") {
          // kick off: play (running the match if you are the host)
          stopLive();
          matchDone.current = false;
          setWatching(null);
          setPanel(null);
          const ok = e.startMatch(P.zone, setMatch, {
            mode: P.host ? "host" : "view",
            slots: slotsFor(r, me),
            myKey: mySlot,
            labels: ["Team A", "Team B"],
            send: P.host ? undefined : (i) => P.net.sendInput(i),
          });
          if (!ok) return;
          P.playing = "play";
          if (P.host) {
            P.live.push(
              P.net.watchInputs((all) => {
                const cur = pitch.current?.room?.room?.slots ?? {};
                for (const [uid, inp] of Object.entries(all)) {
                  const k = Object.keys(cur).find((x) => cur[x]?.uid === uid);
                  if (k) engine.current?.matchInput(k, inp);
                }
              }),
            );
            P.iv = window.setInterval(() => {
              const snap = engine.current?.matchSnapshot();
              if (snap) P.net.sendState(snap);
            }, 100);
          } else P.live.push(P.net.watchState((sn) => engine.current?.matchApply(sn)));
        } else if (!mySlot && P.playing === "none") {
          // a match is on: watch it from the bench
          e.startMatch(P.zone, setWatching, {
            mode: "view",
            slots: slotsFor(r, me),
            myKey: "",
            labels: ["Team A", "Team B"],
            spectate: true,
          });
          P.playing = "watch";
          P.live.push(P.net.watchState((sn) => engine.current?.matchApply(sn)));
        }
        // the host fills empty places from the bench, or with the computer
        if (P.host && P.playing === "play") {
          const next = { ...slots };
          let changed = false;
          const queue = Object.entries(r.queue).sort((a, b) => a[1].at - b[1].at);
          for (const k of [...SLOT_KEYS[0], ...SLOT_KEYS[1]]) {
            const v = next[k];
            if (v && !r.players[v.uid]) {
              const q = queue.shift();
              next[k] = q ? { uid: q[0], name: q[1].name } : null;
              if (q) {
                void P.net.setPlayer(q[0], {
                  name: q[1].name,
                  team: SLOT_KEYS[0].includes(k) ? 0 : 1,
                  at: Date.now(),
                });
                void P.net.setQueued(q[0], null);
              }
              e.matchSetCtrl(k, q ? "remote" : "cpu", q ? q[1].name : "Computer");
              changed = true;
            }
          }
          if (changed) void P.net.setRoom({ slots: next });
        }
      } else if (P.playing === "watch") {
        stopLive();
        e.endMatch();
        setWatching(null);
      } else if (P.playing === "play" && !P.host && room?.status === "over" && !matchDone.current) {
        // the phone running the match went away
        stopLive();
        e.endMatch();
        setMatch(null);
        toast("The match stopped: the player running it left.", "warn");
      }
      void prev;
    },
    [stopLive, toast],
  );
  const onPitchRoomRef = useRef(onPitchRoom);
  onPitchRoomRef.current = onPitchRoom;
  /** Join the pitch: start a match, join a team, or wait on the bench. */
  const joinPitch = useCallback(
    async (zoneId: string) => {
      const uid = onlineRef.current?.uid;
      const name = saveRef.current.profile?.name ?? "Player";
      if (!uid) {
        toast("Log in to IlmStation to play with other players.", "warn");
        return;
      }
      if (pitch.current) await leavePitch();
      setPanel(null);
      let net: PitchNet;
      try {
        const local =
          import.meta.env.DEV &&
          new URLSearchParams(window.location.search).get("online") === "local";
        net = local ? connectPitchLocal(zoneId, uid) : await connectPitch(zoneId, uid);
      } catch {
        toast("Live football isn't switched on yet. Play the computer for now.", "warn");
        return;
      }
      pitch.current = {
        zone: zoneId,
        net,
        off: () => {},
        live: [],
        playing: "none",
        host: false,
        room: null,
      };
      let first = true;
      let latest: PitchRoom | null = null;
      pitch.current.off = net.watch(async (r) => {
        latest = r;
        if (first) {
          first = false;
          try {
            const status = r.room?.status;
            if (!r.room || status === "over") {
              if (await net.claim()) await net.join(name, 0);
            } else if (status === "waiting") {
              const n = [0, 0];
              for (const v of Object.values(r.players)) n[v.team]++;
              if (n[0] >= MAX_PER_TEAM && n[1] >= MAX_PER_TEAM) await net.enqueue(name);
              else await net.join(name, n[1] < n[0] ? 1 : 0);
            } else {
              await net.enqueue(name);
              engine.current?.goToBench(zoneId);
            }
          } catch {
            toast("Live football isn't switched on yet. Play the computer for now.", "warn");
            void leavePitch();
            return;
          }
          // joining changed the room: show the newest version, not the one from before
          if (latest) onPitchRoomRef.current(latest);
          return;
        }
        onPitchRoomRef.current(r);
      });
    },
    [toast, leavePitch],
  );
  // full time: rewards, then back to the side of the pitch
  useEffect(() => {
    if (!match || match.phase !== "over" || matchDone.current) return;
    matchDone.current = true;
    const pts = match.myGoals * FOOTBALL.perGoal + (match.won ? FOOTBALL.win : 0);
    const t = setTimeout(() => {
      update((x) => ({ ...x, coins: x.coins + pts }));
      need({ energy: -15, social: 18, hunger: -10 });
      toast(`${match.won ? "Victory!" : match.draw ? "A draw!" : "Good game!"} +${N(pts)}`, "good");
      const P = pitch.current;
      if (P && P.playing === "play") {
        stopLive();
        if (P.host) void P.net.setRoom({ status: "over", slots: null });
      }
      engine.current?.endMatch();
      setMatch(null);
    }, 3500);
    return () => clearTimeout(t);
  }, [match, update, need, toast, stopLive]);
  const openFootball = useCallback(
    (zoneId: string) => {
      if (!saveRef.current.jersey) {
        setPanel({
          kind: "info",
          title: "⚽ You need a jersey",
          body: (
            <div className="space-y-3">
              <p className="text-[14px]">
                Players wear their team's jersey on the pitch. Buy your football kit once: you
                change into your team's colours for each match, and back into your own clothes when
                you leave.
              </p>
              <button
                disabled={saveRef.current.coins < JERSEY_PRICE}
                onClick={() => {
                  if (saveRef.current.coins < JERSEY_PRICE) return;
                  update((x) => ({ ...x, coins: x.coins - JERSEY_PRICE, jersey: true }));
                  toast(`Football kit bought! −${N(JERSEY_PRICE)}`, "good");
                  setTimeout(() => openFootballRef.current(zoneId), 0);
                }}
                className="w-full rounded-xl bg-[#1f6f63] px-4 py-3 font-bold text-[#fdf8ec] disabled:opacity-40"
              >
                👕 Buy football kit · {N(JERSEY_PRICE)}
              </button>
              {saveRef.current.coins < JERSEY_PRICE && (
                <p className="text-[12.5px] opacity-75">
                  You have {N(saveRef.current.coins)}. Earn more at the mosque, a lecture or the
                  quiz.
                </p>
              )}
            </div>
          ),
        });
        return;
      }
      setPanel({
        kind: "info",
        title: "Football pitch",
        body: (
          <div className="space-y-2">
            <button
              onClick={() => startPitchMatch(zoneId)}
              className="w-full rounded-xl bg-[#1f6f63] px-4 py-3 text-left font-bold text-[#fdf8ec]"
            >
              ⚽ Play now · 3 vs 3 against IlmWorld FC
              <span className="block text-[12px] font-medium opacity-80">
                You, a teammate and a keeper. Run with the stick or tap; Pass and Shoot buttons.
              </span>
            </button>
            <button
              onClick={() => void joinPitch(zoneId)}
              className="w-full rounded-xl bg-[#e6b84a] px-4 py-3 text-left font-bold text-[#2a1c05]"
            >
              👥 Play with other players · Team A vs Team B
              <span className="block text-[12px] font-medium opacity-80">
                Up to 3 a side. If a match is on, wait on the bench or go to another pitch.
              </span>
            </button>
            <p className="text-[12px] opacity-70">
              +{N(FOOTBALL.perGoal)} a goal, +{N(FOOTBALL.win)} for the win.
            </p>
          </div>
        ),
      });
    },
    [startPitchMatch, joinPitch, update, toast],
  );
  const openFootballRef = useRef(openFootball);
  openFootballRef.current = openFootball;

  /* ---------- live from the admin: adverts, award, nasheeds ---------- */
  const adsRef = useRef<Record<string, NonNullable<(typeof BILLBOARDS)[number]["ad"]>>>({});
  const [nasheeds, setNasheeds] = useState<Nasheed[]>([]);
  const nasheedsRef = useRef(nasheeds);
  nasheedsRef.current = nasheeds;
  useEffect(() => {
    const offAds = watchAds((ads) => {
      adsRef.current = ads;
      engine.current?.setAds(ads);
    });
    const offN = watchNasheeds((n) => {
      setNasheeds(n);
      radio.setNasheeds(n);
    });
    const offAw = watchAward((a) => {
      if (!a) return;
      let seenId: string | null = null;
      try {
        seenId = localStorage.getItem("ilmcity-award-seen");
      } catch {
        /* storage off */
      }
      if (seenId === a.id) return;
      try {
        localStorage.setItem("ilmcity-award-seen", a.id);
      } catch {
        /* storage off */
      }
      setTimeout(
        () =>
          toast(
            `🏆 Best home of the week: ${a.winner}${a.home ? ` (${a.home})` : ""}. ${a.note}`,
            "good",
          ),
        4000,
      );
    });
    return () => {
      offAds();
      offN();
      offAw();
    };
  }, [toast]);

  /* ---------- Qur'an radio ---------- */
  const [radioState, setRadioState] = useState<RadioState>(radio.state);
  useEffect(() => radio.subscribe(setRadioState), []);
  const vehicleMute = useRef<string | null>(null);
  const radioCfg = save.radio ?? {
    on: false,
    reciter: "ar.alafasy",
    playlist: "amma",
    vehicles: true,
  };
  const radioCfgRef = useRef(radioCfg);
  radioCfgRef.current = radioCfg;
  /** Decide what should be playing: the vehicle's radio, your own player, or nothing. */
  const tuneRadio = useCallback(() => {
    const e = engine.current;
    if (!e) return;
    const where = e.scenePlace();
    radio.hushIf("place", where === "masjid" || where === "madrasah");
    const kind = e.rideKind();
    if (!kind) vehicleMute.current = null;
    const cfg = radioCfgRef.current;
    if (kind && cfg.vehicles && vehicleMute.current !== kind) {
      const v = VEHICLE_RADIO[kind];
      const name = RECITERS.find((r) => r.id === v.reciter)?.name ?? "";
      const label = `${kind === "danfo" ? "Danfo" : kind === "keke" ? "Keke" : "Car"} radio · ${name}`;
      if (radio.state.source?.key !== kind || !radio.state.playing)
        radio.play({ key: kind, reciter: v.reciter, playlist: v.playlist, label });
    } else if (cfg.on) {
      const src = mySource(cfg);
      const cur = radio.state.source;
      if (
        cur?.key !== "me" ||
        cur.reciter !== src.reciter ||
        cur.playlist !== src.playlist ||
        !radio.state.playing
      )
        radio.play(src);
    } else if (radio.state.playing) radio.pause();
  }, []);
  const tuneRef = useRef(tuneRadio);
  tuneRef.current = tuneRadio;
  useEffect(() => {
    const iv = setInterval(() => tuneRef.current(), 1000);
    return () => clearInterval(iv);
  }, []);
  const setRadio = useCallback(
    (p: Partial<typeof radioCfg>) => {
      const next = { ...radioCfgRef.current, ...p };
      radioCfgRef.current = next;
      update((x) => ({ ...x, radio: next }));
      tuneRef.current();
    },
    [update],
  );
  const openRadio = useCallback(() => {
    setPanel({
      kind: "info",
      title: "Qur'an & nasheed",
      body: (
        <RadioView
          cfg={radioCfgRef.current}
          riding={engine.current?.rideKind() ?? null}
          nasheedCount={nasheedsRef.current.length}
          onChange={(p) => {
            setRadio(p);
            setPanel(null);
            setTimeout(() => openRadioRef.current(), 0);
          }}
          onSkip={() => radio.skip()}
          onVehicleMute={() => {
            vehicleMute.current = engine.current?.rideKind() ?? null;
            radio.pause();
            setPanel(null);
          }}
        />
      ),
    });
  }, [setRadio]);
  const openRadioRef = useRef(openRadio);
  openRadioRef.current = openRadio;

  const greetedRef = useRef(greeted);
  greetedRef.current = greeted;
  const loggedInRef = useRef(loggedIn);
  loggedInRef.current = loggedIn;

  const openPlaces = useCallback(
    (area: string, phone = false) => {
      setNewArea(null);
      setPanel({
        kind: "info",
        phone: phone ? { home: () => openPhoneRef.current() } : undefined,
        title: `Places in ${fullName(districtById(area))}`,
        body: (
          <PlacesView
            area={area}
            onGo={(prefix) => {
              setPanel(null);
              if (!engine.current?.goToZone(prefix)) toast("Go outside first, then try again.");
            }}
          />
        ),
      });
    },
    [toast],
  );
  openPlacesRef.current = openPlaces;

  /** Ride to another area (bus fare, or free in your car); optionally walk to a place on arrival. */
  const startTrip = useCallback(
    (to: string, byCar: boolean, then?: string) => {
      const e = engine.current;
      if (!e) return;
      const here = e.districtId();
      // to another city: the inter-city bus from the motor park
      const far = cityOf(districtById(here)) !== cityOf(districtById(to));
      const fare = far ? INTERCITY.bus : BUS_FARE;
      if (!byCar && saveRef.current.coins < fare) {
        toast(
          `The ${far ? "inter-city bus" : "bus"} fare is ${N(fare)}. Earn money at work, a lecture or a quiz.`,
          "warn",
        );
        return;
      }
      setPanel(null);
      const d = districtById(to);
      arriveRef.current = () => {
        e.travel(to, byCar);
        advance("ride");
        advance("learn");
        setDriving(false);
        setInside(false);
        update((x) => ({
          ...x,
          coins: byCar ? x.coins : x.coins - fare,
          district: to,
          car: byCar ? e.carPos() : x.car,
          pos: undefined,
        }));
        setTravelling(null);
        setArriving(d.name);
        if (then) setTimeout(() => engine.current?.goToZone(then), 1500);
      };
      setTravelling({ from: here, to, byCar });
    },
    [toast, advance, update],
  );
  const tripRef = useRef(startTrip);
  tripRef.current = startTrip;
  const openOutings = useCallback(
    (phone = false, tab = "now") => {
      const e = engine.current;
      const here = e?.districtId() ?? "lekki";
      setPanel({
        kind: "info",
        phone: phone ? { home: () => openPhoneRef.current() } : undefined,
        title: "OutingStation",
        body: (
          <OutingView
            here={here}
            clock={clockRef.current}
            driving={!!e?.isDriving()}
            coins={saveRef.current.coins}
            has={(id) => !!engine.current?.hasZone(id)}
            tab0={tab}
            onGo={(area, prefix) => {
              if (!prefix) {
                if (area === here) toast("You are already here.");
                else tripRef.current(area, !!engine.current?.isDriving());
                return;
              }
              if (area === here) {
                setPanel(null);
                if (!engine.current?.goToZone(prefix)) toast("Go outside first, then try again.");
              } else tripRef.current(area, !!engine.current?.isDriving(), prefix);
            }}
          />
        ),
      });
    },
    [toast],
  );
  const openOutingsRef = useRef(openOutings);
  openOutingsRef.current = openOutings;

  // new day resets the daily salah tracker
  useEffect(() => {
    if (save.day !== clock.key)
      update((s) => ({
        ...s,
        day: clock.key,
        prayed: {},
        asked: [],
        lectureMin: 0,
        schoolPts: 0,
        tasks: {},
        salams: 0,
      }));
  }, [clock.key, save.day, update]);

  const openLecture = useCallback(
    (lec: Lecture, live: boolean) => {
      advance("learn");
      doTask("learn");
      setPanel({
        kind: "info",
        title: live ? "Lecture time" : "Lecture",
        body: (
          <LectureView
            lecture={lec}
            live={live}
            earnedToday={saveRef.current.lectureMin ?? 0}
            onMinute={() =>
              update((x) => {
                const m = x.lectureMin ?? 0;
                if (m >= POINTS.lectureDailyCap) return x;
                return {
                  ...x,
                  lectureMin: m + POINTS.perLectureMinute,
                  coins: x.coins + POINTS.perLectureMinute,
                  ilm: x.ilm + 1,
                };
              })
            }
          />
        ),
      });
    },
    [update, advance, doTask],
  );

  const openPlot = useCallback(
    (pid: string) => {
      const e = engine.current;
      const p = e?.plotInfo(pid);
      if (!e || !p) return;
      if (!loggedInRef.current) {
        setPanel({
          kind: "info",
          title: p.kind === "land" ? "Land for sale" : "House to let",
          body: <LoginFirst what={p.kind === "land" ? "buy land and build" : "rent a house"} />,
        });
        return;
      }
      const by = takenRef.current.get(pid);
      if (by && !saveRef.current.plots?.[pid]) {
        setPanel({
          kind: "info",
          title: p.kind === "land" ? "Sold" : "Occupied",
          body: (
            <p>
              No. {p.number} belongs to <b>{by}</b>. Every house can have only one owner, so look
              for another one with a red <b>TO LET</b> sign, or rent a room with 📱 Phone → Rooms.
            </p>
          ),
        });
        return;
      }
      const lod = saveRef.current.lodging;
      if (lod && lod.plot === pid && lod.until > Date.now() && !saveRef.current.plots?.[pid]) {
        const days = Math.ceil((lod.until - Date.now()) / 86400000);
        setPanel({
          kind: "info",
          title: "Your room",
          body: (
            <div className="space-y-3">
              <p>
                You rent a room in {lod.owner}'s house at {lod.label}. {days} day
                {days === 1 ? "" : "s"} left this week.
              </p>
              <button
                onClick={() => {
                  setPanel(null);
                  e.enterInterior("home", `Your room · ${lod.label}`);
                  setInside(true);
                  sayDhikr("enterHome");
                }}
                className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
              >
                Go inside
              </button>
            </div>
          ),
        });
        return;
      }
      const setOwn = (next: PlotOwn) => {
        update((x) => ({ ...x, plots: { ...x.plots, [pid]: next } }));
        e.setPlot(pid, plotStateFn(next) ?? { kind: p.kind === "land" ? "land" : "tolet" });
      };
      const render = () => {
        const own = saveRef.current.plots?.[pid];
        setPanel({
          kind: "info",
          title:
            p.kind === "land"
              ? own?.kind === "built"
                ? "Your property"
                : own
                  ? "Your land"
                  : "Land for sale"
              : (own?.kind === "rented" && own.until > Date.now()) || own?.kind === "bought"
                ? "Your house"
                : "House to let or buy",
          body: (
            <PlotView
              plot={p}
              own={own}
              points={saveRef.current.coins}
              players={
                roomsNet.current && uid
                  ? {
                      ads: myAds.current.filter((a) => a.plot === pid),
                      onList: (i) => {
                        const net = roomsNet.current!;
                        void net
                          .list(uid, pid, i, {
                            owner: uid,
                            ownerName: saveRef.current.profile?.name ?? "Player",
                            plot: pid,
                            area: p.district,
                            label: `No. ${p.number}, ${p.street}, ${districtById(p.district).name}`,
                            i,
                            rent: ROOM_RENT_WEEK,
                            tenant: null,
                            tenantName: null,
                          })
                          .then(() => {
                            myAds.current = [
                              ...myAds.current.filter((a) => a.id !== roomId(uid, pid, i)),
                              {
                                id: roomId(uid, pid, i),
                                owner: uid,
                                ownerName: "",
                                plot: pid,
                                area: p.district,
                                label: "",
                                i,
                                rent: ROOM_RENT_WEEK,
                                at: Date.now(),
                              },
                            ];
                            toast(
                              "Your room is listed. Players can find it in 📱 Phone → Rooms.",
                              "good",
                            );
                            render();
                          })
                          .catch(() => toast("Couldn't list the room. Try again.", "warn"));
                      },
                      onUnlist: (id) => {
                        void roomsNet.current!.unlist(id).then(() => {
                          myAds.current = myAds.current.filter((a) => a.id !== id);
                          render();
                        });
                      },
                    }
                  : undefined
              }
              onPay={async (pts, next, msg) => {
                if (saveRef.current.coins < pts) return;
                if (!(await claimPlotRef.current(pid, next))) {
                  toast("Another player has just taken this one. Please choose another.", "warn");
                  setPanel(null);
                  return;
                }
                update((x) => ({ ...x, coins: x.coins - pts }));
                setOwn(next);
                toast(msg, "good");
                setTimeout(render, 0);
              }}
              onPaystack={(amount, what) =>
                toast(
                  `Paystack checkout for ${what} (₦${amount.toLocaleString()}) is coming next. For now, pay from your IlmWorld wallet.`,
                )
              }
              onSet={(next) => {
                setOwn(next);
                toast("A tenant has moved in. Collect your rent here every few days.", "good");
                setTimeout(render, 0);
              }}
              onEnter={() => {
                setPanel(null);
                e.enterInterior("home", `No. ${p.number}, ${p.street}`);
                // a house of two floors or more is a duplex: stairs to the family rooms
                e.setDuplex((p.floors ?? 1) >= 2);
                setInside(true);
                if ((p.floors ?? 1) >= 2)
                  toast("Your duplex: take the stairs up to the family rooms.", "good");
              }}
              onRooms={(rooms, earned) => {
                const own2 = saveRef.current.plots?.[pid];
                if (own2?.kind !== "built" && own2?.kind !== "bought") return;
                update((x) => ({ ...x, coins: x.coins + earned }));
                setOwn({ ...own2, rooms });
                toast(
                  `A tenant moved in and paid ${N(earned)} for the week. Alhamdulillah!`,
                  "good",
                );
                setTimeout(render, 0);
              }}
              onCollect={() => {
                const own2 = saveRef.current.plots?.[pid];
                if (own2?.kind !== "built" || !own2.since) return;
                const per = ECONOMY.build[own2.floors].tenantPerDay;
                const due = Math.floor(((Date.now() - own2.since) / 86400000) * per);
                if (due < 1) return;
                update((x) => ({ ...x, coins: x.coins + due }));
                setOwn({ ...own2, since: own2.since + (due / per) * 86400000 });
                toast(`You collected ${N(due)} of rent. Alhamdulillah!`, "good");
                setTimeout(render, 0);
              }}
            />
          ),
        });
      };
      render();
    },
    [toast, update, sayDhikr, uid],
  );

  /** Paint every shop and stall: yours, the market's traders, or "for rent". */
  const paintShop = useCallback((e: IlmCityEngine, sid: string) => {
    const own = saveRef.current.shops?.[sid];
    const info = e.shopInfo(sid);
    const trader = traderAt(sid);
    if (own && own.until > Date.now())
      e.setShop(sid, {
        name: own.name || "My shop",
        imgs: own.products.map((p) => p.img),
        open: true,
        label: `Your shop · ${own.name || "My shop"}`,
      });
    else if (trader && info?.kind === "stall")
      e.setShop(sid, {
        name: trader.name,
        imgs: trader.items.map(([em]) => emojiPic(em)),
        open: true,
        label: `Buy from ${trader.name}`,
      });
    else e.setShop(sid, { open: false });
  }, []);
  const openShop = useCallback(
    (sid: string) => {
      const e = engine.current;
      const info = e?.shopInfo(sid);
      if (!e || !info) return;
      if (!loggedInRef.current && !(info.kind === "stall" && traderAt(sid))) {
        setPanel({
          kind: "info",
          title: info.kind === "shop" ? "Shop to let" : "Market space for rent",
          body: <LoginFirst what="rent a shop or market stall" />,
        });
        return;
      }
      const D = districtById(info.district);
      if (info.kind === "stall") doTask("market");
      const render = () => {
        const own = saveRef.current.shops?.[sid];
        const trader = info.kind === "stall" ? traderAt(sid) : null;
        setPanel({
          kind: "info",
          title: trader
            ? trader.name
            : own && own.until > Date.now()
              ? own.name || (info.kind === "shop" ? "Your shop" : "Your stall")
              : info.kind === "shop"
                ? "Shop to let"
                : "Market space for rent",
          body: (
            <ShopView
              key={sid + (own?.until ?? 0)}
              kind={info.kind}
              where={`${info.street}, ${fullName(D)}`}
              own={own}
              trader={trader}
              onFood={() => openFood("eatery")}
              points={saveRef.current.coins}
              onCollect={() => {
                const o2 = saveRef.current.shops?.[sid];
                if (!o2) return;
                const due = salesDue(o2);
                if (due < 1) return;
                const next = { ...o2, salesAt: Date.now() };
                update((x) => ({ ...x, coins: x.coins + due, shops: { ...x.shops, [sid]: next } }));
                saveRef.current = {
                  ...saveRef.current,
                  shops: { ...saveRef.current.shops, [sid]: next },
                };
                toast(`Sales collected: +${N(due)}. May Allah bless your trade.`, "good");
                setTimeout(render, 0);
              }}
              onRent={(days, pts) => {
                if (saveRef.current.coins < pts) return;
                const prev = saveRef.current.shops?.[sid];
                const next: ShopOwn = {
                  until: Math.max(Date.now(), prev?.until ?? 0) + days * 86400000,
                  name: prev?.name ?? "",
                  products: prev?.products ?? [],
                  salesAt: prev?.salesAt ?? Date.now(),
                };
                update((x) => ({ ...x, coins: x.coins - pts, shops: { ...x.shops, [sid]: next } }));
                saveRef.current = {
                  ...saveRef.current,
                  shops: { ...saveRef.current.shops, [sid]: next },
                };
                paintShop(e, sid);
                toast(
                  "The keys are yours! Give your business a name and add product photos.",
                  "good",
                );
                setTimeout(render, 0);
              }}
              onPaystack={(amount, what) =>
                toast(`Paystack checkout for ${what} (₦${amount.toLocaleString()}) is coming next.`)
              }
              onSave={(o) => {
                update((x) => ({ ...x, shops: { ...x.shops, [sid]: o } }));
                saveRef.current = {
                  ...saveRef.current,
                  shops: { ...saveRef.current.shops, [sid]: o },
                };
                paintShop(e, sid);
                toast(`${o.name} is open for business!`, "good");
                setPanel(null);
              }}
            />
          ),
        });
      };
      render();
    },
    [toast, update, paintShop, openFood, doTask],
  );

  /** Step-by-step wudu; `then` runs after (for example, the prayer you were about to start). */
  /** where to send you after wudu (e.g. back to your prayer mat) */
  const afterWudu = useRef<string | null>(null);
  const openWudu = useCallback(
    (then?: () => void) =>
      setPanel({
        kind: "info",
        title: "Wudu",
        body: (
          <WuduView
            onDone={() => {
              saveRef.current = { ...saveRef.current, wudu: true };
              update((x) => ({
                ...x,
                wudu: true,
                needs: { ...(x.needs ?? freshNeeds()), clean: 100 },
              }));
              doTask("wudu");
              advance("wudu");
              setPanel(null);
              if (then) setTimeout(then, 50);
            }}
          />
        ),
      }),
    [update, doTask, advance],
  );

  /** Pray in the masjid: the obligatory prayer if it is due, or two voluntary rak'ahs. */
  const startPrayer = useCallback(
    (voluntary: boolean) => {
      const e = engine.current;
      if (!saveRef.current.wudu && e?.scenePlace() === "home" && e.guideTo("bath")) {
        // at home: go to the bathroom for wudu, then come back to the mat
        setPanel(null);
        afterWudu.current = "prayermat";
        toast("Salah needs wudu. Follow the gold arrow to the bathroom 💧");
        return;
      }
      if (!saveRef.current.wudu) {
        setPanel({
          kind: "info",
          title: "Wudu first",
          body: (
            <div className="space-y-3">
              <p>Salah needs wudu. Make it now, then pray.</p>
              <button
                onClick={() => openWudu(() => startPrayerRef.current(voluntary))}
                className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
              >
                💧 Make wudu
              </button>
            </div>
          ),
        });
        return;
      }
      const c = clockRef.current;
      const p = currentPrayer(c);
      const fard = !voluntary && p && !saveRef.current.prayed[p.id] ? p : null;
      const rakahs = fard ? (fard.name === "Jumu'ah" ? 2 : RAKAHS[fard.id]) : 2;
      setPanel({
        kind: "info",
        title: fard ? `${fard.name} in jama'ah` : "Two rak'ahs",
        body: (
          <PrayerSession
            title={fard ? `${fard.name} · ${rakahs} rak'ahs` : "Tahiyyat al-Masjid · 2 rak'ahs"}
            rakahs={rakahs}
            onPose={(pose) => engine.current?.prayPose(pose)}
            onFinish={() => {
              setPanel(null);
              engine.current?.prayPose(null);
              advance("learn");
              need({ iman: 15 });
              if (fard) {
                if (Object.keys(saveRef.current.prayed).length + 1 >= 5) doTask("salah");
                update((x) => ({
                  ...x,
                  prayed: { ...x.prayed, [fard.id]: true },
                  ilm: x.ilm + 5,
                  coins: x.coins + 2,
                }));
                toast(
                  `You prayed ${fard.name} in jama'ah. May Allah accept it. +₦20, +5 Ilm`,
                  "good",
                );
              } else {
                update((x) => ({ ...x, ilm: x.ilm + 2 }));
                toast("May Allah accept your prayer. +2 Ilm", "good");
              }
            }}
          />
        ),
      });
    },
    [toast, update, advance, openWudu, need, doTask],
  );
  const startPrayerRef = useRef(startPrayer);
  startPrayerRef.current = startPrayer;

  /* ---------- other real players ---------- */
  const onlineRef = useRef<Online | null>(null);
  const areaPlayers = useRef<{ uid: string; name: string }[]>([]);
  const [inbox, setInbox] = useState<ChatInfo[]>([]);
  const [seenTick, setSeenTick] = useState(0);
  const myStatus = useRef<PlayerStatus | null>(null);
  useEffect(() => {
    if (!uid || !adult) return;
    let live = true;
    let offInbox: (() => void) | null = null;
    const local =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get("online") === "local";
    (local ? Promise.resolve(connectLocal(uid)) : connectFirestore(uid))
      .then(async (o) => {
        if (!live) return;
        onlineRef.current = o;
        setOnlineReady((n) => n + 1);
        myStatus.current = await o.status().catch(() => null);
        offInbox = o.watchInbox(setInbox);
      })
      .catch(() => {});
    const bye = () => onlineRef.current?.leave();
    window.addEventListener("pagehide", bye);
    // leaving the tab or locking the phone takes you off the street for others
    const vis = () => {
      if (document.hidden) bye();
      else presenceAt.current = 0;
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      live = false;
      offInbox?.();
      bye();
      window.removeEventListener("pagehide", bye);
      document.removeEventListener("visibilitychange", vis);
      onlineRef.current = null;
    };
  }, [uid, adult]);

  /* ---------- rooms to let between players ---------- */
  const roomsNet = useRef<RoomsNet | null>(null);
  const myAds = useRef<RoomAd[]>([]);
  useEffect(() => {
    if (!uid) return;
    const local =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get("online") === "local";
    let off: (() => void) | null = null;
    let live = true;
    (local ? Promise.resolve(connectRoomsLocal()) : connectRooms())
      .then((net) => {
        if (!live) return;
        roomsNet.current = net;
        off = net.watchMine(uid, (ads) => {
          myAds.current = ads;
          // a player rented one of your rooms: collect the week's rent
          for (const a of ads)
            if (a.tenant && !a.paid && (a.until ?? 0) > Date.now()) {
              void net.collected(a.id).catch(() => {});
              update((x) => {
                const own = x.plots?.[a.plot];
                const plots = { ...x.plots };
                if (own && (own.kind === "built" || own.kind === "bought")) {
                  const rooms = [...(own.rooms ?? [])];
                  rooms[a.i] = {
                    tenant: `${a.tenantName ?? "A player"} (player)`,
                    until: a.until!,
                  };
                  plots[a.plot] = { ...own, rooms };
                }
                return { ...x, coins: x.coins + a.rent, plots };
              });
              toast(
                `${a.tenantName ?? "A player"} rented Room ${a.i + 1} at ${a.label}. +${N(a.rent)} rent!`,
                "good",
              );
            }
        });
      })
      .catch(() => {});
    return () => {
      live = false;
      off?.();
    };
  }, [uid, update, toast]);
  const openRooms = useCallback(() => {
    const net = roomsNet.current;
    setPanel({
      kind: "info",
      title: "🔑 Rooms to let",
      phone: { home: () => openPhoneRef.current() },
      body:
        !net || !uid ? (
          <p className="text-[14px]">Log in to IlmStation to rent a room from other players.</p>
        ) : (
          <RoomsMarketView
            net={net}
            me={uid}
            points={saveRef.current.coins}
            lodging={saveRef.current.lodging}
            onRent={async (r) => {
              if (saveRef.current.coins < r.rent) {
                toast(
                  `The rent is ${N(r.rent)} a week. You have ${N(saveRef.current.coins)}.`,
                  "warn",
                );
                return;
              }
              const got = await net
                .rent(r.id, { uid, name: saveRef.current.profile?.name ?? "Player" })
                .catch(() => null);
              if (!got) {
                toast("Someone just rented that room. Try another.", "warn");
                return;
              }
              update((x) => ({
                ...x,
                coins: x.coins - r.rent,
                lodging: {
                  id: r.id,
                  plot: r.plot,
                  area: r.area,
                  label: r.label,
                  until: got.until!,
                  owner: r.ownerName,
                },
              }));
              setPanel(null);
              toast(`You rented a room at ${r.label}. −${N(r.rent)}. Welcome home!`, "good");
            }}
            onGo={(l) => {
              setPanel(null);
              const e = engine.current;
              if (!e) return;
              if (e.districtId() === l.area) {
                if (!e.goToZone("plot:" + l.plot)) toast("Go outside first, then try again.");
              } else tripRef.current(l.area, e.isDriving(), "plot:" + l.plot);
            }}
          />
        ),
    });
  }, [uid, toast, update]);
  const openRoomsRef = useRef(openRooms);
  openRoomsRef.current = openRooms;

  /* ---------- road offences: the police tow your car ---------- */
  const incidentRef = useRef<(kind: "hit" | "crash" | "blocking", who?: string) => void>(() => {});
  incidentRef.current = (kind, who) => {
    const e = engine.current;
    if (!e || saveRef.current.impound) return;
    const area = e.impoundCar();
    setDriving(false);
    tuneRef.current();
    const fee =
      kind === "hit" ? POLICE.hitFine : kind === "crash" ? POLICE.crashFine : POLICE.towFee;
    const reason =
      kind === "hit"
        ? `You knocked down ${who ?? "someone"} with your car`
        : kind === "crash"
          ? "You crashed into another vehicle"
          : "You left your car blocking the road";
    update((x) => ({
      ...x,
      impound: { fee, reason, area, at: Date.now() },
      car: e.carPos(),
    }));
    if (kind === "hit") need({ iman: -5 });
    setPanel({
      kind: "info",
      title: kind === "blocking" ? "🚓 Car towed" : "🚨 Accident",
      body: (
        <div className="space-y-3">
          <p>
            {reason}
            {kind === "hit" ? ". Alhamdulillah, they are not badly hurt." : "."}
          </p>
          <p className="rounded-xl bg-white p-3 text-[14px]">
            The police have towed your car to the <b>{districtById(area).name} police station</b>.
            Pay the fine of <b>{N(fee)}</b> there to get it back.
          </p>
          <p className="text-[12.5px] opacity-70">
            Drive slowly where people walk, and park off the road.
          </p>
        </div>
      ),
    });
  };

  /* ---------- homes on show: visits and likes ---------- */
  const homes = useRef<Homes | null>(null);
  const [visiting, setVisiting] = useState<(ShownHome & { liked?: boolean }) | null>(null);
  const visitingRef = useRef(visiting);
  visitingRef.current = visiting;
  const myPlace = () => {
    const s = saveRef.current;
    const a = districtById(s.homeArea ?? "lekki").name;
    return s.homePlot ? `Family house · ${a}` : `Flat · ${a}`;
  };
  const publishHome = useCallback(() => {
    const h = homes.current;
    const s = saveRef.current;
    if (!h || !uid || !s.profile || !(s.items ?? []).length) return;
    void h
      .publish({
        uid,
        name: s.profile.name,
        place: myPlace(),
        items: s.items ?? [],
        open: !!s.openHouse,
        paint: s.paint,
      })
      .catch(() => {});
  }, [uid]);
  useEffect(() => {
    if (!uid) return;
    const local =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get("online") === "local";
    let live = true;
    (local ? Promise.resolve(connectHomesLocal()) : connectHomes())
      .then((h) => {
        if (!live) return;
        homes.current = h;
        publishHome();
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [uid, publishHome]);
  /* knocking: you wait at the door until they let you in */
  const [knocking, setKnocking] = useState<{ id: string; name: string } | null>(null);
  const knockOff = useRef<(() => void) | null>(null);
  const visitKnock = useRef<string | null>(null);
  const cancelKnock = useCallback(() => {
    knockOff.current?.();
    knockOff.current = null;
    setKnocking(null);
  }, []);
  const enterHomeRef = useRef<(h: ShownHome) => void>(() => {});
  const visitHome = useCallback(
    async (h: ShownHome) => {
      const hs = homes.current;
      if (!hs || !uid) return;
      if (h.uid === uid) {
        toast("That's your own home!");
        return;
      }
      setPanel(null);
      if (h.open) {
        visitKnock.current = null;
        enterHomeRef.current(h);
        return;
      }
      const id = await hs
        .knock(h.uid, { uid, name: saveRef.current.profile?.name ?? "Player" })
        .catch(() => null);
      if (!id) {
        toast("Couldn't knock. Try again.", "warn");
        return;
      }
      setKnocking({ id, name: h.name });
      const timer = setTimeout(() => {
        cancelKnock();
        void hs.answer(id, "left").catch(() => {});
        toast(`No one answered at ${h.name}'s home. Try again later.`);
      }, 40_000);
      const off = hs.watchKnock(id, (k) => {
        if (!k) return;
        if (k.status === "in") {
          clearTimeout(timer);
          cancelKnock();
          visitKnock.current = id;
          toast(`${h.name} let you in. Assalamu alaikum!`, "good");
          enterHomeRef.current(h);
        } else if (k.status === "no") {
          clearTimeout(timer);
          cancelKnock();
          toast(`${h.name} can't have visitors right now.`);
        }
      });
      knockOff.current = () => {
        clearTimeout(timer);
        off();
      };
    },
    [uid, toast, cancelKnock],
  );
  const enterHome = useCallback(
    async (h: ShownHome) => {
      const e = engine.current;
      if (!e) return;
      if (e.scenePlace() !== "out") e.exitInterior();
      e.enterInterior("home", `${h.name}'s home`);
      e.setHomeItems(h.items);
      e.setDuplex(false);
      {
        const hp = homePaint(h.uid, h.paint);
        e.setHomePaint(hp.wall, hp.floor);
      }
      setInside(true);
      tuneRef.current();
      sayDhikr("enterHome");
      const liked = uid ? await homes.current?.liked(h.uid, uid).catch(() => false) : false;
      setVisiting({ ...h, liked: !!liked });
      // the owner can ask you to leave
      const kid = visitKnock.current;
      if (kid && homes.current) {
        const off = homes.current.watchKnock(kid, (k) => {
          if (k?.status !== "out") return;
          off();
          const en = engine.current;
          en?.setHomeItems(saveRef.current.items ?? []);
          const pt = homePaint(onlineRef.current?.uid, saveRef.current.paint);
          en?.setHomePaint(pt.wall, pt.floor);
          setVisiting(null);
          if (en?.scenePlace() === "home") {
            en.exitInterior();
            setInside(false);
          }
          toast(`${h.name} asked you to leave. Ma'a salama!`);
        });
      }
    },
    [uid, sayDhikr, toast],
  );
  enterHomeRef.current = (h) => void enterHome(h);
  const endVisit = useCallback(() => {
    if (!visitingRef.current) return;
    const pt = homePaint(onlineRef.current?.uid, saveRef.current.paint);
    engine.current?.setHomePaint(pt.wall, pt.floor);
    if (visitKnock.current) void homes.current?.answer(visitKnock.current, "left").catch(() => {});
    visitKnock.current = null;
    engine.current?.setHomeItems(saveRef.current.items ?? []);
    setVisiting(null);
  }, []);
  /* your door: knocks and guests */
  const [door, setDoor] = useState<Knock[]>([]);
  useEffect(() => {
    let off: (() => void) | null = null;
    const iv = setInterval(() => {
      if (off || !homes.current || !uid) return;
      off = homes.current.watchDoor(uid, setDoor);
    }, 1000);
    return () => {
      clearInterval(iv);
      off?.();
    };
  }, [uid]);
  const atDoor = door.find((k) => k.status === "knocking" && Date.now() - k.at < 40_000);
  const guests = door.filter((k) => k.status === "in");
  const answerDoor = useCallback((id: string, status: Knock["status"]) => {
    void homes.current?.answer(id, status).catch(() => {});
  }, []);
  const likeHome = useCallback(async () => {
    const v = visitingRef.current;
    if (!v || !uid || v.liked) return;
    setVisiting({ ...v, liked: true, likes: v.likes + 1 });
    const ok = await homes.current?.like(v.uid, uid).catch(() => false);
    if (ok) {
      toast(`You liked ${v.name}'s home ❤️`, "good");
      need({ social: 6 });
    } else setVisiting({ ...v, liked: false });
  }, [uid, toast, need]);
  const openHomes = useCallback(() => {
    setPanel({
      kind: "info",
      title: "🏠 Homes",
      phone: { home: () => openPhoneRef.current() },
      body: !homes.current ? (
        <p className="text-[14px]">Log in to IlmStation to visit and like other players' homes.</p>
      ) : (
        <HomesView
          homes={homes.current}
          me={uid}
          myItems={(saveRef.current.items ?? []).length}
          open={!!saveRef.current.openHouse}
          onOpen={(on) => {
            update((x) => ({ ...x, openHouse: on }));
            setTimeout(() => publishHome(), 0);
          }}
          onVisit={(h) => void visitHome(h)}
        />
      ),
    });
  }, [uid, visitHome, update, publishHome]);
  const openHomesRef = useRef(openHomes);
  openHomesRef.current = openHomes;

  /* ---------- phone calls ---------- */
  const callNet = useRef<CallNet | null>(null);
  const callObj = useRef<VoiceCall | null>(null);
  const [call, setCall] = useState<CallUi | null>(null);
  const [incoming, setIncoming] = useState<CallDoc | null>(null);
  const logCall = useCallback(
    (name: string, number: string, dir: "in" | "out" | "missed") =>
      update((x) => ({
        ...x,
        calls: [{ name, number, at: Date.now(), dir }, ...(x.calls ?? [])].slice(0, 30),
      })),
    [update],
  );
  useEffect(() => {
    const o = onlineRef.current;
    if (!o || callNet.current) return;
    const local =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get("online") === "local";
    let off: (() => void) | null = null;
    let live = true;
    (local ? Promise.resolve(connectCallsLocal(o.uid)) : connectCalls(o.uid))
      .then((net) => {
        if (!live) return;
        callNet.current = net;
        const name = saveRef.current.profile?.name ?? "Player";
        void net.register({ uid: o.uid, name, number: numberFor(o.uid) }).catch(() => {});
        off = net.watchIncoming((list) => {
          const c = list.find((x) => !myStatus.current?.blocked.includes(x.from));
          for (const x of list)
            if (myStatus.current?.blocked.includes(x.from)) VoiceCall.decline(net, x);
          if (c && callObj.current && callObj.current.ui.state !== "ended") {
            VoiceCall.decline(net, c);
            return;
          }
          setIncoming(c ?? null);
        });
      })
      .catch(() => {});
    return () => {
      live = false;
      off?.();
    };
  }, [onlineReady]);
  /* ---------- money between players ---------- */
  const transfers = useRef<Transfers | null>(null);
  useEffect(() => {
    const o = onlineRef.current;
    if (!o || transfers.current) return;
    const local =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get("online") === "local";
    let off: (() => void) | null = null;
    let live = true;
    (local ? Promise.resolve(connectTransfersLocal()) : connectTransfers())
      .then((t) => {
        if (!live) return;
        transfers.current = t;
        off = t.watchIncoming(o.uid, (list) => {
          for (const x of list)
            void t.receive(x.id).then((ok) => {
              if (!ok) return;
              update((s2) => ({
                ...s2,
                coins: s2.coins + x.amount,
                txns: [
                  {
                    dir: "in" as const,
                    name: x.fromName,
                    amount: x.amount,
                    note: x.note,
                    at: x.at,
                  },
                  ...(s2.txns ?? []),
                ].slice(0, 40),
              }));
              toast(
                `💰 ${x.fromName} sent you ${N(x.amount)}${x.note ? `: "${x.note}"` : ""}`,
                "good",
              );
            });
        });
      })
      .catch(() => {});
    return () => {
      live = false;
      off?.();
    };
  }, [onlineReady]);
  /** Send money to another player by their IlmWorld number. */
  const sendMoney = useCallback(
    async (number: string, units: number, note: string): Promise<string | null> => {
      const o = onlineRef.current;
      const t = transfers.current;
      const net = callNet.current;
      if (!o || !t || !net) return "Log in to IlmStation to send money.";
      if (!Number.isFinite(units) || units < 1) return "Enter an amount of at least ₦10.";
      if (units > MAX_TRANSFER) return `You can send up to ${N(MAX_TRANSFER)} at a time.`;
      if (units > saveRef.current.coins) return `You only have ${N(saveRef.current.coins)}.`;
      const clean = cleanNumber(number);
      if (!clean) return "An IlmWorld number has 7 digits, like IW 482 1937.";
      const who = await net.lookup(clean).catch(() => null);
      if (!who) return "No player has that IlmWorld number.";
      if (who.uid === o.uid) return "That's your own number.";
      const name = saveRef.current.profile?.name ?? "A player";
      update((x) => ({ ...x, coins: x.coins - units }));
      try {
        await t.send({
          from: o.uid,
          fromName: name,
          to: who.uid,
          toName: who.name,
          amount: units,
          note: note.trim().slice(0, 80) || undefined,
        });
      } catch {
        update((x) => ({ ...x, coins: x.coins + units }));
        return "It didn't go through. Check your connection and try again.";
      }
      update((x) => ({
        ...x,
        txns: [
          {
            dir: "out" as const,
            name: who.name,
            amount: units,
            note: note.trim() || undefined,
            at: Date.now(),
          },
          ...(x.txns ?? []),
        ].slice(0, 40),
      }));
      toast(`Sent ${N(units)} to ${who.name}.`, "good");
      return null;
    },
    [update, toast],
  );
  const sendMoneyRef = useRef(sendMoney);
  sendMoneyRef.current = sendMoney;
  openWalletRef.current = () => {
    advance("wallet");
    setPanel({
      kind: "info",
      title: "💰 Wallet",
      phone: { home: () => openPhoneRef.current() },
      body: (
        <WalletView
          points={saveRef.current.coins}
          txns={saveRef.current.txns ?? []}
          online={!!onlineRef.current}
          onSend={(num, units, note) => sendMoneyRef.current(num, units, note)}
        />
      ),
    });
  };

  /* ---------- houses are shared: one player per house ---------- */
  const claimsNet = useRef<Claims | null>(null);
  const [claimsReady, setClaimsReady] = useState(0);
  /** houses in view that other players have (plot → their name) */
  const takenRef = useRef(new Map<string, string>());
  const [areaNow, setAreaNow] = useState<string | null>(null);
  useEffect(() => {
    const iv = setInterval(() => {
      const a = engine.current?.districtId();
      if (a) setAreaNow(a);
    }, 3000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    const o = onlineRef.current;
    if (!o || claimsNet.current) return;
    const local =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get("online") === "local";
    (local ? Promise.resolve(connectClaimsLocal()) : connectClaims())
      .then((net) => {
        claimsNet.current = net;
        // put your own houses on record, so nobody else can take them
        const name = saveRef.current.profile?.name ?? "Player";
        for (const [pid, own] of Object.entries(saveRef.current.plots ?? {})) {
          const info = engine.current?.plotInfo(pid);
          if (!info) continue;
          const until = own.kind === "rented" ? own.until : Date.now() + 100 * 365 * 86400000;
          if (until < Date.now()) continue;
          void net
            .claim({
              plot: pid,
              area: info.district,
              owner: o.uid,
              name,
              kind: own.kind === "rented" ? "rented" : "owned",
              until,
            })
            .catch(() => {});
        }
        setClaimsReady((n) => n + 1);
      })
      .catch(() => {});
  }, [onlineReady]);
  useEffect(() => {
    const net = claimsNet.current;
    const o = onlineRef.current;
    if (!net || !o || !areaNow) return;
    return net.watchArea(areaNow, (list) => {
      const e = engine.current;
      if (!e) return;
      const now = new Map(list.filter((c) => c.owner !== o.uid).map((c) => [c.plot, c.name]));
      for (const pid of [...takenRef.current.keys()]) {
        if (now.has(pid)) continue;
        const info = e.plotInfo(pid);
        if (!info || info.district !== areaNow) continue;
        e.setPlot(
          pid,
          plotStateFn(saveRef.current.plots?.[pid]) ?? {
            kind: info.kind === "land" ? "land" : "tolet",
          },
        );
        takenRef.current.delete(pid);
      }
      for (const [pid, name] of now) {
        if (saveRef.current.plots?.[pid]) continue;
        e.setPlot(pid, { kind: "taken", by: name });
        takenRef.current.set(pid, name);
      }
    });
  }, [areaNow, claimsReady]);
  /** Take a house or land for yourself; false if another player already has it. */
  const claimPlot = useCallback(async (pid: string, own: PlotOwn) => {
    const net = claimsNet.current;
    const o = onlineRef.current;
    const info = engine.current?.plotInfo(pid);
    if (!net || !o || !info) return true;
    return net
      .claim({
        plot: pid,
        area: info.district,
        owner: o.uid,
        name: saveRef.current.profile?.name ?? "Player",
        kind: own.kind === "rented" ? "rented" : "owned",
        until: own.kind === "rented" ? own.until : Date.now() + 100 * 365 * 86400000,
      })
      .catch(() => false);
  }, []);
  const claimPlotRef = useRef(claimPlot);
  claimPlotRef.current = claimPlot;

  useEffect(() => {
    const o = onlineRef.current;
    if (!o || visitingRef.current || saveRef.current.paint) return;
    const pt = homePaint(o.uid);
    engine.current?.setHomePaint(pt.wall, pt.floor);
  }, [onlineReady]);

  /* ---------- rent for your flat ---------- */
  const flatName = useCallback((area: string) => {
    const o = onlineRef.current;
    const f = o ? flatFor(o.uid).label + " · " : "";
    return `Your flat · ${f}${districtById(area).name}`;
  }, []);
  const payRent = useCallback(() => {
    const sv = saveRef.current;
    const area = sv.homeArea ?? "lekki";
    const rent = flatRent(area);
    if (sv.coins < rent) {
      setPanel({
        kind: "info",
        title: "Not enough money for rent",
        body: <NoPointsView price={rent} points={sv.coins} />,
      });
      return false;
    }
    const until = Math.max(Date.now(), sv.lease?.until ?? 0) + WEEK;
    update((x) => ({ ...x, coins: x.coins - rent, lease: { until } }));
    toast(`Rent paid: −${N(rent)}. Your flat is paid for another week. Alhamdulillah!`, "good");
    return true;
  }, [update, toast]);
  const payRentRef = useRef(payRent);
  payRentRef.current = payRent;
  /** Sadaqah into the masjid box. */
  const giveSadaqah = useCallback(
    (units: number, where: string) => {
      const sv = saveRef.current;
      if (sv.coins < units) {
        toast(`You have ${N(sv.coins)}. Give what you can, even a little.`, "warn");
        return;
      }
      const before = sv.sadaqah ?? 0;
      update((x) => ({
        ...x,
        coins: x.coins - units,
        sadaqah: (x.sadaqah ?? 0) + units,
        ilm: x.ilm + 2,
      }));
      need({ iman: 10 });
      toast(
        `${N(units)} in the ${where} sadaqah box. "Charity does not decrease wealth." May Allah accept it and replace it with better.`,
        "good",
      );
      if (before < GENEROUS_GIVING && before + units >= GENEROUS_GIVING)
        setTimeout(
          () =>
            toast(
              "💚 You are now a Generous giver. Other players see the green heart by your name.",
              "good",
            ),
          2200,
        );
    },
    [update, need, toast],
  );
  const giveSadaqahRef = useRef(giveSadaqah);
  giveSadaqahRef.current = giveSadaqah;
  const openWardrobe = useCallback(() => {
    const look = saveRef.current.profile;
    if (!look) return;
    advance("clothes");
    setPanel({
      kind: "info",
      title: "👕 Clothes",
      body: (
        <WardrobeView
          look={look}
          owned={saveRef.current.wardrobe ?? []}
          coins={saveRef.current.coins}
          onWear={(p) => {
            const next = { ...saveRef.current.profile!, ...p };
            update((x) => ({ ...x, profile: next }));
            engine.current?.setPlayerLook(next);
          }}
          onBuy={(key, p, price) => {
            if (saveRef.current.coins < price) return;
            const next = { ...saveRef.current.profile!, ...p };
            update((x) => ({
              ...x,
              coins: x.coins - price,
              profile: next,
              wardrobe: [...(x.wardrobe ?? []), key],
            }));
            engine.current?.setPlayerLook(next);
            toast(`New clothes! −${N(price)}. They look good on you, Masha Allah.`, "good");
          }}
        />
      ),
    });
  }, [update, toast, advance]);
  const openWardrobeRef = useRef(openWardrobe);
  openWardrobeRef.current = openWardrobe;
  /** Rent due: what the landlord says when you come home. */
  const rentDue = useCallback((then?: () => void) => {
    const area = saveRef.current.homeArea ?? "lekki";
    const rent = flatRent(area);
    setPanel({
      kind: "info",
      title: "🏠 Rent is due",
      body: (
        <div className="space-y-3">
          <p>
            Your landlord says: "Assalamu alaikum. The rent for your flat in{" "}
            {districtById(area).name} is {N(rent)} a week. Please pay before you go in."
          </p>
          <p className="text-[13px] opacity-75">You have {N(saveRef.current.coins)}.</p>
          <button
            onClick={() => {
              if (payRentRef.current()) {
                setPanel(null);
                then?.();
              }
            }}
            className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
          >
            Pay {N(rent)} for one week
          </button>
          <p className="text-[12.5px] opacity-70">
            Short of money? Work a shift (👤 Profile → Work), pray in the masjid or take a quiz.
          </p>
        </div>
      ),
    });
  }, []);
  useEffect(() => {
    radio.hushIf("call", !!call && call.state !== "ended");
    if (call?.state !== "ended") return;
    const t = setTimeout(() => setCall(null), 2200);
    return () => clearTimeout(t);
  }, [call]);
  const dial = useCallback(
    async (to: PhoneEntry) => {
      const net = callNet.current;
      if (!net) {
        toast("Calls need you to be logged in (18+).", "warn");
        return;
      }
      if (to.uid === net.uid) {
        toast("That's your own number!");
        return;
      }
      setPanel(null);
      try {
        callObj.current = await VoiceCall.dial(
          net,
          { name: saveRef.current.profile?.name ?? "Player" },
          to,
          setCall,
        );
        logCall(to.name, to.number, "out");
      } catch {
        toast("Allow the microphone to make calls.", "warn");
      }
    },
    [toast, logCall],
  );
  const acceptCall = useCallback(async () => {
    const net = callNet.current;
    const c = incoming;
    if (!net || !c) return;
    setIncoming(null);
    try {
      callObj.current = await VoiceCall.answer(net, c, setCall);
      logCall(c.fromName, numberFor(c.from), "in");
    } catch {
      VoiceCall.decline(net, c);
      toast("Allow the microphone to answer calls.", "warn");
    }
  }, [incoming, toast, logCall]);
  const declineCall = useCallback(() => {
    const net = callNet.current;
    if (net && incoming) {
      VoiceCall.decline(net, incoming);
      logCall(incoming.fromName, numberFor(incoming.from), "missed");
    }
    setIncoming(null);
  }, [incoming, logCall]);
  const openCalls = useCallback(
    (tab: "calls" | "contacts") => {
      const net = callNet.current;
      setPanel({
        kind: "info",
        title: tab === "calls" ? "📞 Calls" : "👥 Contacts",
        phone: { home: () => openPhoneRef.current() },
        body: !net ? (
          <p className="text-[14px]">
            Calls and contacts are for players who are logged in to IlmStation and 18 or older.
          </p>
        ) : (
          <CallsView
            tab={tab}
            myNumber={numberFor(net.uid)}
            contacts={saveRef.current.contacts ?? []}
            log={saveRef.current.calls ?? []}
            lookup={(n) => net.lookup(n)}
            onCall={(e) => void dial(e)}
            onMessage={(e) => {
              setPanel(null);
              openChatRef.current({ uid: e.uid, name: e.name });
            }}
            onSave={(e) =>
              update((x) => ({
                ...x,
                contacts: [...(x.contacts ?? []).filter((c) => c.number !== e.number), e],
              }))
            }
            onRemove={(n) =>
              update((x) => ({
                ...x,
                contacts: (x.contacts ?? []).filter((c) => c.number !== n),
              }))
            }
          />
        ),
      });
    },
    [dial, update],
  );
  openCallsRef.current = openCalls;
  const unread = inbox.filter(
    (c) => c.lastFrom !== uid && c.lastText && c.lastAt > chatSeen(c.id),
  ).length;
  void seenTick;

  /** Start or continue a conversation, within the free limit, chat pass and fines. */
  const openChatWith = useCallback(
    async (other: { uid: string; name: string }) => {
      const o = onlineRef.current;
      if (!o) {
        setPanel({
          kind: "info",
          title: other.name,
          body: adult ? (
            <p>Connecting… try again in a moment.</p>
          ) : !loggedInRef.current ? (
            <LoginFirst what="chat with other players" />
          ) : (
            <p>
              Chatting with other players is for adults (18+). You can still talk to the neighbours
              in the city.
            </p>
          ),
        });
        return;
      }
      const st = (myStatus.current = await o.status().catch(() => myStatus.current ?? null)) ?? {
        partners: [],
        passUntil: 0,
        fine: 0,
        blocked: [],
      };
      if (st.blocked.includes(other.uid)) {
        toast(`You blocked ${other.name}.`);
        return;
      }
      if (st.fine > 0) {
        setPanel({
          kind: "info",
          title: "Chat is paused",
          body: (
            <FineView
              fine={st.fine}
              reason={st.fineReason}
              points={saveRef.current.coins}
              onNaira={() => toast("Paystack checkout is coming next.")}
              onPayPoints={async () => {
                const pts = Math.round(st.fine / 10);
                if (saveRef.current.coins < pts) return;
                update((x) => ({ ...x, coins: x.coins - pts }));
                await o.saveStatus({ fine: 0, fineReason: "" });
                myStatus.current = { ...st, fine: 0 };
                setPanel(null);
                toast("Fine paid. Please keep your words good. Chat is open again.", "good");
              }}
            />
          ),
        });
        return;
      }
      // replying to someone who wrote to you first never uses a free conversation
      const known =
        st.partners.includes(other.uid) ||
        inboxRef.current.some((c) => c.members.includes(other.uid));
      const pass = st.passUntil > Date.now();
      if (!known && !pass && st.partners.length >= ONLINE_LIMITS.freePartners) {
        setPanel({
          kind: "info",
          title: "Chat with more people",
          body: (
            <PassView
              points={saveRef.current.coins}
              onPoints={async (days, pts) => {
                if (saveRef.current.coins < pts) return;
                update((x) => ({ ...x, coins: x.coins - pts }));
                const passUntil = Math.max(Date.now(), st.passUntil) + days * 86400000;
                await o.saveStatus({ passUntil });
                myStatus.current = { ...st, passUntil };
                toast(`Unlimited chat for ${days} days. Enjoy, and keep it halal!`, "good");
                void openChatWith(other);
              }}
              onNaira={(amount, what) =>
                toast(`Paystack checkout for ${what} (₦${amount.toLocaleString()}) is coming next.`)
              }
            />
          ),
        });
        return;
      }
      if (!known) {
        const partners = [...st.partners, other.uid];
        myStatus.current = { ...st, partners };
        void o.saveStatus({ partners });
      }
      const myName = saveRef.current.profile?.name ?? firstName ?? "Player";
      const chatId = await o.openChat(other, myName);
      markChatSeen(chatId);
      setSeenTick((x) => x + 1);
      greetedRef.current();
      setPanel({
        kind: "info",
        title: other.name,
        body: (
          <ChatView
            online={o}
            chatId={chatId}
            me={o.uid}
            other={other}
            freeLeft={
              pass
                ? null
                : Math.max(0, ONLINE_LIMITS.freePartners - (myStatus.current?.partners.length ?? 0))
            }
            onReported={async (blockedUid) => {
              const s2 = myStatus.current ?? st;
              const blocked = [...new Set([...s2.blocked, blockedUid])];
              myStatus.current = { ...s2, blocked };
              await o.saveStatus({ blocked });
              setPanel(null);
              toast(
                "Thank you. Our team will review the report. You won't hear from them again.",
                "good",
              );
            }}
          />
        ),
      });
    },
    [adult, toast, update, firstName],
  );
  const openInbox = useCallback(() => {
    if (!onlineRef.current) {
      void openChatWith({ uid: "", name: "Messages" });
      return;
    }
    setPanel({
      kind: "info",
      title: "Messages",
      body: (
        <InboxView
          me={onlineRef.current.uid}
          chats={inboxRef.current}
          onOpen={(c) => {
            const other = c.members.find((m) => m !== onlineRef.current?.uid) ?? "";
            void openChatWith({ uid: other, name: c.names[other] ?? "Player" });
          }}
        />
      ),
    });
  }, [openChatWith]);
  const inboxRef = useRef<ChatInfo[]>([]);
  inboxRef.current = inbox;

  /* ---------- work ---------- */
  const startWork = useCallback(
    (job: Job) =>
      setPanel({
        kind: "info",
        title: `Work · ${job.place}`,
        body: (
          <WorkView
            job={job}
            onDone={(right, total) => {
              const pay = Math.round(
                job.pay * (0.5 + (0.5 * right) / total) * (1 + ilmLevel(saveRef.current.ilm).bonus),
              );
              update((x) => ({
                ...x,
                coins: x.coins + pay,
                ilm: x.ilm + 2,
                worked: clockRef.current.key,
              }));
              need({ energy: -15, social: 10 });
              setPanel(null);
              toast(
                `Salary paid: +${N(pay)}. Hard work is worship when the intention is right.`,
                "good",
              );
            }}
          />
        ),
      }),
    [update, need, toast],
  );
  const openJobs = useCallback(
    () =>
      setPanel({
        kind: "info",
        title: "Work",
        body: (
          <JobsView
            current={saveRef.current.job}
            onTake={(j) => {
              update((x) => ({ ...x, job: j.id }));
              saveRef.current = { ...saveRef.current, job: j.id };
              setPanel(null);
              setTimeout(() => advanceRef.current("job"), 0);
              toast(
                `You are now a ${j.name.toLowerCase()} at ${j.place}. Shift: ${hoursText(j)}. Pay: ${N(j.pay)} a day.`,
                "good",
              );
            }}
            onGo={(j) => {
              setPanel(null);
              if (j.area && engine.current?.districtId() !== j.area) {
                toast(
                  `Your work is in ${fullName(districtById(j.area))}. Take a danfo there (📱 Phone → Travel).`,
                );
                return;
              }
              if (!engine.current?.goToZone(j.at)) toast("Go outside first.");
            }}
          />
        ),
      }),
    [update, toast],
  );
  const openJobsRef = useRef(openJobs);
  openJobsRef.current = openJobs;

  /* ---------- actions coming from the 3D world ---------- */
  const onAction = useCallback(
    (id: string) => {
      const e = engine.current;
      if (!e) return;
      const c = clockRef.current,
        s = saveRef.current;
      // too hungry to do anything but eat (salah and the way home are still open)
      if (visitingRef.current && id !== "exit") {
        toast("You're visiting. Use these in your own home.");
        return;
      }
      const allowed =
        id.startsWith("stairs:") ||
        id.startsWith("seat:") ||
        id === "exit" ||
        id === "eat" ||
        id === "pray" ||
        id === "prayermat" ||
        id === "bath" ||
        id === "quran" ||
        id === "quiz" ||
        id.startsWith("door:") ||
        id.startsWith("eatery:") ||
        id.startsWith("talk:");
      if (hungryRef.current && !allowed && (foodRef.current.delivery || foodRef.current.meal)) {
        const f = foodRef.current;
        if (f.delivery)
          toast(
            f.delivery.outside
              ? "Your rider is outside. Go out and collect your food first."
              : "Your food is on the way. Wait for the rider, then eat.",
          );
        else if (f.meal) {
          if (e.scenePlace() === "out") {
            toast("Go home and eat your food first.");
            e.goToZone("door:home:");
          } else openMealRef.current(f.meal);
        }
        return;
      }
      if (hungryRef.current && !allowed) {
        setPanel({
          kind: "info",
          title: "I'm hungry 😩",
          body: (
            <HungryView
              onOrder={() => openFood("order")}
              onEatery={() => {
                setPanel(null);
                if (!e.goToZone("eatery:")) toast("Go outside first, then try again.");
              }}
            />
          ),
        });
        return;
      }
      if (id.startsWith("eatery:")) {
        openFood("eatery");
        return;
      }
      const job = JOBS.find((j) => j.id === s.job);
      if (job && id.startsWith(job.at) && s.worked !== c.key && !workSkip.current) {
        if (!onShift(job, c)) {
          toast(`Your shift is ${hoursText(job)}. Come back then, in shaa Allah.`);
        } else {
          setPanel({
            kind: "info",
            title: job.place,
            body: (
              <div className="space-y-2">
                <button
                  onClick={() => startWork(job)}
                  className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
                >
                  💼 Start my shift · {N(job.pay)}
                </button>
                <button
                  onClick={() => {
                    workSkip.current = true;
                    setPanel(null);
                    onActionRef.current(id);
                    workSkip.current = false;
                  }}
                  className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold"
                >
                  Just visit
                </button>
              </div>
            ),
          });
          return;
        }
      }
      if (id.startsWith("campus:")) {
        const [, lid, key, idx] = id.split(":");
        const L = landmarkById(lid);
        if (!L) return;
        const { l, d } = L;
        if (key === "admin") {
          setPanel({
            kind: "info",
            title: `${l.name} · Admin block`,
            body: (
              <div className="space-y-2">
                <p>{l.about ?? `${l.name} on ${STREETS[l.street].name}, ${fullName(d)}.`}</p>
                <p>
                  <b>Classes:</b> {(l.classes ?? []).join(", ")}.
                </p>
                <p>
                  <b>Subjects:</b> {SUBJECTS.map((x) => x.name).join(", ")}.
                </p>
                <p className="text-[13px] opacity-75">
                  Walk round the courtyard: every class has its own door. Enter a class to see its
                  books and take the quizzes.
                </p>
              </div>
            ),
          });
        } else if (key === "office") {
          const r = REMINDERS[Math.floor(Math.random() * REMINDERS.length)];
          setPanel({
            kind: "info",
            title: "The Sheikh's office",
            body: (
              <div className="space-y-2">
                <p>
                  Assalamu alaykum! The Sheikh is teaching a class right now. Please leave your
                  question with the admin block.
                </p>
                <p className="rounded-xl bg-white p-3 text-[14px]">
                  A reminder on the notice board: the Prophet ﷺ said, "{r.text}" ({r.source})
                </p>
              </div>
            ),
          });
        } else if (key === "class") {
          const cls = l.classes?.[Number(idx)];
          if (!cls) return;
          e.enterInterior("madrasah", `${cls} · ${l.name}`);
          setInside(true);
          setPanel({
            kind: "info",
            title: `${cls} · ${l.name}`,
            body: (
              <ClassView
                subjects={l.subjects}
                cls={cls}
                school={l.name}
                earnedToday={saveRef.current.schoolPts ?? 0}
                onCorrect={() => {
                  if ((saveRef.current.schoolPts ?? 0) >= SCHOOL_POINTS.dailyCap) return false;
                  update((x) => ({
                    ...x,
                    coins: x.coins + SCHOOL_POINTS.perCorrect,
                    ilm: x.ilm + 3,
                    schoolPts: (x.schoolPts ?? 0) + SCHOOL_POINTS.perCorrect,
                  }));
                  return true;
                }}
              />
            ),
          });
        }
        return;
      }
      if (id.startsWith("faculty:")) {
        const L = landmarkById(id.slice(8));
        if (!L) return;
        const library = L.l.id.endsWith("-library");
        const [room, uni] = L.l.name.split(" · ");
        sayDhikr("study", () => {
          e.enterInterior("madrasah", L.l.name);
          setInside(true);
          tuneRef.current();
          const today = clockRef.current.key;
          const s0 = saveRef.current.said;
          const ids = s0?.day === today ? s0.ids : [];
          if (!ids.includes("class")) {
            update((x) => ({ ...x, ilm: x.ilm + 2, said: { day: today, ids: [...ids, "class"] } }));
            need({ iman: 4, social: 5 });
          }
          setPanel({
            kind: "info",
            title: library ? L.l.name : `${room}${uni ? " · " + uni : ""}`,
            body: (
              <InClassView
                library={library}
                about={L.l.about ?? ""}
                quiz={
                  saveRef.current.student?.faculty === L.l.id
                    ? facultyQuestions(L.l.name)
                    : undefined
                }
                notMine={
                  !library &&
                  !!saveRef.current.student &&
                  saveRef.current.student.faculty !== L.l.id
                }
                onCorrect={() => {
                  if ((saveRef.current.schoolPts ?? 0) >= SCHOOL_POINTS.dailyCap) return false;
                  update((x) => ({
                    ...x,
                    coins: x.coins + SCHOOL_POINTS.perCorrect,
                    ilm: x.ilm + 2,
                    schoolPts: (x.schoolPts ?? 0) + SCHOOL_POINTS.perCorrect,
                  }));
                  return true;
                }}
                onLeave={() => {
                  setPanel(null);
                  onActionRef.current("exit");
                }}
              />
            ),
          });
        });
        return;
      }
      if (id.startsWith("field:")) {
        openFootballRef.current(id);
        return;
      }
      if (id.startsWith("found:")) {
        const kind = id.slice(6) as FoundKind;
        const it = FOUND_ITEMS[kind];
        if (!it) return;
        setPanel({
          kind: "info",
          title: `You found a ${it.name}`,
          body: (
            <FoundView
              name={it.name}
              carrying={!!saveRef.current.carrying}
              onReturn={() => {
                e.clearFound();
                update((x) => ({ ...x, carrying: kind }));
                setPanel(null);
                toast(
                  `Take the ${it.name} to the police station or a Hisbah officer. 📱 Phone → Places shows the way.`,
                );
              }}
              onKeep={() => {
                e.clearFound();
                saveRef.current = {
                  ...saveRef.current,
                  wanted: { at: Date.now(), item: kind },
                };
                update((x) => ({
                  ...x,
                  coins: x.coins + it.value,
                  ilm: Math.max(0, x.ilm - POLICE.keepIlm),
                  wanted: { at: Date.now(), item: kind },
                }));
                setPanel({
                  kind: "info",
                  title: "Fear Allah",
                  body: (
                    <div className="space-y-2">
                      <p>
                        This {it.name} belongs to someone who is looking for it. Stealing is haram.
                      </p>
                      <p className="rounded-xl bg-white p-3 text-[14px]">
                        The Prophet ﷺ said: "The thief is not a believer at the moment he is
                        stealing." (Bukhari and Muslim)
                      </p>
                      <p className="text-[13px] opacity-75">
                        −{POLICE.keepIlm} Ilm. You can still take it to the police station before
                        the police find you.
                      </p>
                    </div>
                  ),
                });
              }}
            />
          ),
        });
        return;
      }
      if (id.startsWith("police:")) {
        const sv = saveRef.current;
        if (sv.impound) {
          const im = sv.impound;
          setPanel({
            kind: "info",
            title: "🚓 Your car is here",
            body: (
              <div className="space-y-3">
                <p>{im.reason}, so your car was towed here.</p>
                <button
                  disabled={sv.coins < im.fee}
                  onClick={() => {
                    if (saveRef.current.coins < im.fee) return;
                    update((x) => ({ ...x, coins: x.coins - im.fee, impound: undefined }));
                    e.releaseCar();
                    setPanel(null);
                    toast(
                      `Fine paid, −${N(im.fee)}. Your car is in the yard beside the station. Drive carefully!`,
                      "good",
                    );
                  }}
                  className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec] disabled:opacity-40"
                >
                  Pay {N(im.fee)} and collect your car
                </button>
                {sv.coins < im.fee && (
                  <p className="text-[12.5px] opacity-75">
                    You have {N(sv.coins)}. Earn more at the mosque, a lecture or work.
                  </p>
                )}
              </div>
            ),
          });
          return;
        }
        if (sv.carrying) {
          handIn();
          return;
        }
        if (sv.wanted) {
          const item = sv.wanted.item;
          update((x) => ({
            ...x,
            wanted: undefined,
            coins: Math.max(0, x.coins - FOUND_ITEMS[item].value),
          }));
          toast(
            `You handed back the ${FOUND_ITEMS[item].name}. The officer accepts your apology. Allah loves those who repent.`,
            "good",
          );
          return;
        }
        setPanel({
          kind: "info",
          title: "Police station",
          body: (
            <div className="space-y-2">
              <p>
                Good day! Bring anything you find on the road here and we will return it to its
                owner. You will be rewarded.
              </p>
              <p className="text-[13px] opacity-75">
                Anyone caught keeping what isn't theirs is arrested. Bail is {N(POLICE.bailPoints)}{" "}
                or {POLICE.bailIlm} Ilm, or {POLICE.cellMinutes} minutes in the cell.
              </p>
            </div>
          ),
        });
        return;
      }
      if (id.startsWith("tennis:")) {
        setPanel({
          kind: "info",
          title: "🏓 Table tennis",
          body: (
            <div className="space-y-2">
              <p className="text-[13.5px] opacity-80">
                Brothers and sisters are all welcome. First to 11 points, win by 2.
              </p>
              <button
                onClick={() => void playTennis(id, false)}
                className="w-full rounded-xl bg-[#2f6fa8] px-4 py-3 text-left font-bold text-white"
              >
                🏓 Play the coach
                <span className="block text-[12px] font-normal opacity-85">
                  Move with the stick, tap Hit after the ball bounces on your side
                </span>
              </button>
              <button
                onClick={() => void playTennis(id, true)}
                className="w-full rounded-xl border border-[#2f6fa8]/30 bg-white px-4 py-3 text-left font-bold"
              >
                👥 Play another player
                <span className="block text-[12px] font-normal opacity-70">
                  One against one with a real player at this table
                </span>
              </button>
            </div>
          ),
        });
        return;
      }
      if (id.startsWith("sisters:")) {
        if (!saveRef.current.profile?.female) {
          toast(
            "The Sisters' Corner is for sisters' games. Brothers, the football pitch is close by!",
          );
          return;
        }
        setPanel({
          kind: "info",
          title: "🪢 Skipping rope",
          body: (
            <div className="space-y-2">
              <p className="text-[13.5px] opacity-80">
                Two sisters turn the rope and one jumps. Swap whenever you like.
              </p>
              <button
                onClick={() => void playRope(id, "jump")}
                className="w-full rounded-xl bg-[#8a2f4f] px-4 py-3 text-left font-bold text-white"
              >
                🦘 Jump in
                <span className="block text-[12px] font-normal opacity-80">
                  Tap Jump as the rope comes under your feet
                </span>
              </button>
              <button
                onClick={() => void playRope(id, "turn")}
                className="w-full rounded-xl border border-[#8a2f4f]/30 bg-white px-4 py-3 text-left font-bold"
              >
                🤲 Turn the rope
                <span className="block text-[12px] font-normal opacity-70">
                  Tap Turn each time the rope is at the top
                </span>
              </button>
              <button
                onClick={() => void playRope(id, "together")}
                className="w-full rounded-xl border border-[#8a2f4f]/30 bg-white px-4 py-3 text-left font-bold"
              >
                👭 Play with other sisters here
                <span className="block text-[12px] font-normal opacity-70">
                  Real players share one rope and take turns to jump
                </span>
              </button>
            </div>
          ),
        });
        return;
      }
      if (id.startsWith("hangout:")) {
        const L = landmarkById(id.slice(8));
        if (!L) return;
        setPanel({
          kind: "info",
          title: L.l.name,
          body: (
            <MeetView
              about={L.l.about ?? ""}
              onSit={() =>
                setPanel({
                  kind: "busy",
                  title: "Sitting with the students",
                  ms: 3500,
                  done: () => {
                    need({ social: 22, iman: 3 });
                    toast(
                      "You shared notes and good reminders. Brotherhood and sisterhood in Islam.",
                      "good",
                    );
                  },
                })
              }
            />
          ),
        });
        return;
      }
      if (id.startsWith("mansion:")) {
        const L = landmarkById(id.slice(8));
        if (!L) return;
        setPanel({
          kind: "info",
          title: L.l.name,
          body: (
            <div className="space-y-2">
              <p>
                {L.l.name} on {STREETS[L.l.street].name}, {fullName(L.d)}.
              </p>
              <p>{COMING_SOON_BIO}</p>
              <p className="text-[13px] opacity-75">
                The family welcomes visitors with good manners. You can greet the household and make
                du'a for them.
              </p>
            </div>
          ),
        });
        return;
      }
      if (id.startsWith("office:") && id.endsWith("-mssn")) {
        const L = landmarkById(id.slice(7));
        if (!L) return;
        const area = L.d.id;
        setPanel({
          kind: "info",
          title: L.l.name,
          body: (
            <MssnView
              about={L.l.about ?? ""}
              student={saveRef.current.student}
              area={area}
              uid={onlineRef.current?.uid ?? null}
              onQuiz={() => {
                setPanel(null);
                setTimeout(() => onActionRef.current("quiz"), 50);
              }}
              onRegister={(faculty) => {
                update((x) => ({ ...x, student: { area, faculty } }));
                toast("You're registered as a student here. Welcome to MSSN!", "good");
                setPanel(null);
              }}
              onAsk={async (text) => {
                const o = onlineRef.current;
                if (!o) {
                  toast("Log in to IlmStation to send your question to the MSSN.", "warn");
                  return false;
                }
                try {
                  await o.enquire({
                    place: L.l.name,
                    name: saveRef.current.profile?.name ?? "Player",
                    text: cleanText(text),
                  });
                  toast("Sent! The MSSN team will reply, in shaa Allah.", "good");
                  return true;
                } catch {
                  toast("Could not send. Try again.", "warn");
                  return false;
                }
              }}
            />
          ),
        });
        return;
      }
      if (id.startsWith("office:")) {
        const L = landmarkById(id.slice(7));
        if (!L) return;
        const classes = L.l.classes ?? [];
        setPanel({
          kind: "info",
          title: L.l.name,
          body: (
            <div className="space-y-3">
              <p>{L.l.about}</p>
              <p className="text-[13px] opacity-75">
                {STREETS[L.l.street].name}, {fullName(L.d)}
              </p>
              {L.l.brand?.link && (
                <a
                  href={L.l.brand.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-xl bg-[#1f6f63] py-3 text-center font-bold text-[#fdf8ec]"
                >
                  Visit {L.l.brand.link.replace("https://", "")}
                </a>
              )}
              {classes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[13px] font-semibold">Join a halaqah:</div>
                  {classes.map((c, k) => (
                    <button
                      key={c}
                      onClick={() => onActionRef.current(`campus:${L.l.id}:class:${k}`)}
                      className="w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-2.5 text-left font-bold"
                    >
                      📖 {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ),
        });
        return;
      }
      if (id.startsWith("shop:") || id.startsWith("stall:")) {
        sayDhikr("market", undefined, true);
        openShop(id.slice(id.indexOf(":") + 1));
        return;
      }
      if (id.startsWith("plot:")) {
        openPlot(id.slice(5));
        return;
      }
      if (id === "keke") {
        const area = e.districtId();
        setPanel({
          kind: "info",
          title: "Where to? · Keke",
          body: (
            <div className="space-y-2">
              <p className="text-[13px] opacity-75">
                Any place in {fullName(districtById(area))} for {N(3)}.
              </p>
              <PlacesView
                area={area}
                onGo={(prefix) => {
                  if (saveRef.current.coins < 3) {
                    toast("The keke fare is ₦30. Earn money at a mosque or school.", "warn");
                    return;
                  }
                  setPanel(null);
                  if (e.kekeTo(prefix)) {
                    tuneRef.current();
                    sayDhikr("ride");
                    update((x) => ({ ...x, coins: x.coins - 3 }));
                    advance("ride");
                    toast("Off we go! Hold on tight.", "good");
                  } else toast("The keke can't go there from here.");
                }}
              />
            </div>
          ),
        });
        return;
      }
      if (id === "keke-done") {
        toast('Keke driver: "We don reach! Safe journey."', "good");
        return;
      }
      if (id.startsWith("player:")) {
        const puid = id.slice(7);
        void openChatWith({ uid: puid, name: e.remoteName(puid) ?? "Player" });
        return;
      }
      if (id.startsWith("talk:")) {
        const i = Number(id.slice(5));
        const who = e.talkTo(i);
        if (!who) return;
        if (who.hisbah && saveRef.current.carrying) {
          handIn();
          e.endTalk(i);
          return;
        }
        talkingRef.current = i;
        greeted();
        setPanel({
          kind: "info",
          title: who.name,
          body: (
            <TalkView
              who={who}
              clock={c}
              nod={(k) => engine.current?.talkGesture(i, k)}
              onIlm={(n) => update((x) => ({ ...x, ilm: x.ilm + n }))}
            />
          ),
        });
        return;
      }
      if (id.startsWith("busstop:")) {
        e.waitForBus(id.slice(8));
        toast("Waiting for a danfo… it's coming down the road.");
        return;
      }
      if (id === "board") {
        if (s.coins < BUS_FARE) {
          toast(`The fare is ${N(BUS_FARE)}. Earn money at a mosque lecture or quiz.`, "warn");
          return;
        }
        if (e.boardBus()) {
          tuneRef.current();
          sayDhikr("ride");
          advance("ride");
          update((x) => ({ ...x, coins: x.coins - BUS_FARE }));
          toast(`Bismillah! You paid ${N(BUS_FARE)}. Tap "Get off" before your stop.`, "good");
        }
        return;
      }
      if (id.startsWith("arrived:")) {
        toast(`You got off in ${districtById(id.slice(8)).name}.`, "good");
        return;
      }
      if (id.startsWith("door:masjid:")) {
        advance("masjid");
        const lid = id.slice(12);
        const name = landmarkName(lid);
        e.enterInterior("masjid", name);
        setInside(true);
        tuneRef.current();
        sayDhikr("enterMasjid");
        const lec = lectureNow(lid, c);
        const ms = masjidStatus(c);
        if (ms.open && ms.prayer) {
          const k = `${c.key}-${ms.prayer.id}`;
          const h = hisbahRef.current;
          if (h.reminded.has(k) && !h.commended.has(k)) {
            h.commended.add(k);
            update((x) => ({ ...x, ilm: x.ilm + 5 }));
            setTimeout(
              () => toast('The Hisbah officer smiles: "May Allah accept from you!" +5 Ilm', "good"),
              1200,
            );
          }
        }
        if (lec) openLecture(lec, true);
        else {
          const cp = currentPrayer(c);
          const due = cp && !s.prayed[cp.id];
          setPanel({
            kind: "info",
            title: `Welcome to ${name}`,
            body: (
              <>
                <LearnChoice
                  mosque={lid}
                  clock={c}
                  onLecture={(l) => openLecture(l, false)}
                  onQuiz={() => {
                    setPanel(null);
                    setTimeout(() => onActionRef.current("quiz"), 50);
                  }}
                  pray={
                    due
                      ? {
                          label: ms.open ? `Pray ${cp!.name} in jama'ah` : `Pray ${cp!.name}`,
                          run: () => startPrayer(false),
                        }
                      : {
                          label: "Pray two rak'ahs (greeting the masjid)",
                          run: () => startPrayer(true),
                        }
                  }
                />
                <div className="mt-3 rounded-xl border border-[#1d6b3a]/25 bg-[#eef6ef] p-3">
                  <div className="text-[13px] font-bold">💚 Sadaqah box</div>
                  <div className="mb-2 text-[12px] opacity-75">
                    For the upkeep of the masjid and the needy. Give ₦5,000 in all to become a
                    Generous giver.
                  </div>
                  <div className="flex gap-2">
                    {[50, 100, 500].map((u) => (
                      <button
                        key={u}
                        onClick={() => giveSadaqahRef.current(u, name)}
                        className="flex-1 rounded-lg bg-[#1d6b3a] py-2 text-[13px] font-bold text-white"
                      >
                        {N(u)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ),
          });
        }
        return;
      }
      if (id.startsWith("door:home:")) {
        const which = id.slice(10) === "home" ? "lekki" : id.slice(10);
        const mine = saveRef.current.homeArea ?? "lekki";
        if (which !== mine) {
          toast(
            `Your flat is in ${districtById(mine).name} ${mine === "lekki" ? "(Your Home)" : "Estate"}. Take a danfo or keke there.`,
          );
          return;
        }
        const go = () => {
          e.enterInterior("home", flatName(mine));
          setInside(true);
          sayDhikr("enterHome");
        };
        if (!saveRef.current.homePlot && (saveRef.current.lease?.until ?? 0) < Date.now()) {
          rentDue(go);
          return;
        }
        go();
        return;
      }
      if (id === "bath") {
        setPanel({
          kind: "info",
          title: "Bathroom",
          body: (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setPanel(null);
                  // say the du'a on entering, make wudu, then the shahada after wudu
                  sayDhikr("enterToilet", () =>
                    openWudu(() =>
                      sayDhikr("afterWudu", () => {
                        const next = afterWudu.current;
                        afterWudu.current = null;
                        if (next && engine.current?.guideTo(next))
                          toast("You have wudu. Follow the arrow back to your prayer mat.", "good");
                      }),
                    ),
                  );
                }}
                className="w-full rounded-xl bg-[#1f6f63] px-4 py-3 text-left font-bold text-[#fdf8ec]"
              >
                💧 Make wudu
              </button>
              <button
                onClick={() => {
                  setPanel(null);
                  sayDhikr("enterToilet", () =>
                    setPanel({
                      kind: "busy",
                      title: "Using the toilet",
                      ms: 3000,
                      done: () => {
                        update((x) => ({ ...x, wudu: false }));
                        sayDhikr("leaveToilet", () => {});
                      },
                    }),
                  );
                }}
                className="w-full rounded-xl border border-[#1f6f63]/30 bg-white px-4 py-3 text-left font-bold"
              >
                🚽 Use the toilet
              </button>
              <button
                onClick={() => {
                  setPanel({
                    kind: "busy",
                    title: "Taking a bath",
                    ms: 3000,
                    done: () => {
                      need({ clean: 100 });
                      toast("Fresh and clean. Cleanliness is half of faith.", "good");
                    },
                  });
                }}
                className="w-full rounded-xl border border-[#1f6f63]/30 bg-white px-4 py-3 text-left font-bold"
              >
                🚿 Take a bath
              </button>
            </div>
          ),
        });
        return;
      }
      if (id.startsWith("dealer:")) {
        setPanel({
          kind: "info",
          title: "🚗 IlmMotors",
          body: (
            <DealerView
              points={saveRef.current.coins}
              mine={saveRef.current.ride}
              onBuy={(kind, color, price) => {
                if (saveRef.current.coins < price) {
                  setPanel({
                    kind: "info",
                    title: "Not enough money",
                    body: <NoPointsView price={price} points={saveRef.current.coins} />,
                  });
                  return;
                }
                update((x) => ({ ...x, coins: x.coins - price, ride: { kind, color } }));
                e.setCar(kind, color);
                setPanel(null);
                toast(
                  `Your new ${VEHICLE_INFO[kind].name} is parked where your old car was. Drive safely, bismillah!`,
                  "good",
                );
              }}
            />
          ),
        });
        return;
      }
      if (id.startsWith("door:mall:")) {
        e.enterInterior("mall", "IlmWorld Mall");
        setInside(true);
        tuneRef.current();
        sayDhikr("market", undefined, true);
        return;
      }
      if (id === "stairs:up" || id === "stairs:down") {
        e.changeFloor(id === "stairs:up");
        return;
      }
      if (id.startsWith("seat:")) {
        const m = saveRef.current.meal && MENU.find((x) => x.id === saveRef.current.meal);
        if (!m) {
          toast("Order at the counter first, then sit down to eat.");
          return;
        }
        e.sitAt(id);
        openMealRef.current(m);
        return;
      }
      if (id.startsWith("door:restaurant:")) {
        e.enterInterior("restaurant", "Al-Ma'idah Restaurant");
        setInside(true);
        tuneRef.current();
        toast("Assalamu alaikum! Order at the counter, then sit and eat.");
        return;
      }
      if (id.startsWith("door:madrasah:")) {
        e.enterInterior("madrasah", landmarkName(id.slice(14)));
        setInside(true);
        return;
      }
      if (id === "exit") {
        const was = e.scenePlace();
        endVisit();
        e.exitInterior();
        setInside(false);
        tuneRef.current();
        if (was === "home") sayDhikr("leaveHome");
        else if (was === "masjid") sayDhikr("leaveMasjid");
        return;
      }
      if (id === "car") {
        if (saveRef.current.impound) {
          toast("Your car is at the police station. Pay the fine there to get it back.", "warn");
          return;
        }
        e.enterCar();
        setDriving(true);
        tuneRef.current();
        sayDhikr("ride");
        return;
      }
      if (id === "car-exit") {
        e.exitCar();
        setDriving(false);
        return;
      }
      if (id.startsWith("airport:")) {
        const city = id.slice(8);
        const here = e.districtId();
        const fly = (dest: string, business: boolean) => {
          const price = business ? INTERCITY.business : INTERCITY.fly;
          if (saveRef.current.coins < price) {
            setPanel({
              kind: "info",
              title: "Not enough money",
              body: <NoPointsView price={price} points={saveRef.current.coins} />,
            });
            return;
          }
          const port = DISTRICTS.find(
            (d) => cityOf(d) === dest && d.landmarks.some((l) => l.kind === "airport"),
          );
          if (!port) return;
          setPanel(null);
          update((x) => ({ ...x, coins: x.coins - price }));
          toast(
            `${business ? "Business class" : "Economy"} ticket: −${N(price)}. Say the du'a for travelling. Bismillah!`,
            "good",
          );
          sayDhikr("ride");
          arriveRef.current = () => {
            engine.current?.arriveAt("airport:" + dest);
            setTravelling(null);
            setDriving(false);
            setInside(false);
            update((x) => ({ ...x, district: port.id, pos: undefined }));
            setArriving(
              `${WORLD_CITIES.find((w) => w.id === dest)?.name ?? port.name} · ${port.name}`,
            );
          };
          setTravelling({ from: here, to: port.id, byCar: false, plane: true });
        };
        setPanel({
          kind: "info",
          title: "✈️ Flights",
          body: (
            <div className="space-y-3">
              <p className="text-[13px] opacity-75">
                Fly to another city in minutes. Economy {N(INTERCITY.fly)}, business class{" "}
                {N(INTERCITY.business)}. You have {N(saveRef.current.coins)}.
              </p>
              {WORLD_CITIES.filter((c) => c.live && c.id !== city).map((c) => (
                <div key={c.id} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="font-bold">
                    {c.name}, {c.state} State
                  </div>
                  <div className="text-[12.5px] opacity-70">{c.blurb}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => fly(c.id, false)}
                      className="flex-1 rounded-lg bg-[#2f4a7a] px-3 py-2 text-[13px] font-bold text-white"
                    >
                      Economy · {N(INTERCITY.fly)}
                    </button>
                    <button
                      onClick={() => fly(c.id, true)}
                      className="flex-1 rounded-lg bg-[#e6b84a] px-3 py-2 text-[13px] font-bold text-[#2a1c05]"
                    >
                      Business · {N(INTERCITY.business)}
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-[12px] opacity-70">
                Cheaper: the inter-city bus from any bus stop ({N(INTERCITY.bus)}), or drive your
                own car.
              </p>
            </div>
          ),
        });
        return;
      }
      if (id === "bus") {
        const here = e.districtId();
        const carHere = e.carHere();
        const inCar = e.isDriving();
        const go = (to: string, byCar: boolean) => {
          tripRef.current(to, byCar);
        };
        setPanel({
          kind: "info",
          title: inCar ? "Where are you driving?" : "Where are you going?",
          body: (
            <div className="grid gap-2">
              {travelOptions(here).map(({ d, title, sub, local, far }) => (
                <div
                  key={d.id}
                  className={`rounded-xl border p-3 ${local ? "border-[#1f6f63]/40 bg-[#1f6f63]/5" : "border-[#10201e]/15"}`}
                >
                  <div className="font-bold">{title}</div>
                  <div className="text-[12.5px] opacity-75">{sub}</div>
                  <div className="mt-2 flex gap-2">
                    {!inCar && (
                      <button
                        onClick={() => go(d.id, false)}
                        className="flex-1 rounded-lg bg-[#f2c230] px-3 py-2 text-[13px] font-bold text-[#2a1c05]"
                      >
                        {far ? "Inter-city bus" : "Bus"} · {N(far ? INTERCITY.bus : BUS_FARE)}
                      </button>
                    )}
                    {carHere && (
                      <button
                        onClick={() => go(d.id, true)}
                        className="flex-1 rounded-lg bg-[#1f6f63] px-3 py-2 text-[13px] font-bold text-[#fdf8ec]"
                      >
                        Drive · free
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!carHere && (
                <p className="text-[12px] opacity-70">
                  Your car is parked{" "}
                  {e.carAreaId() ? `in ${districtById(e.carAreaId()!).name}` : "on the expressway"}.
                </p>
              )}
            </div>
          ),
        });
        return;
      }
      if (id === "souq") {
        setPanel({
          kind: "info",
          title: "Souq al-Barakah",
          body: (
            <>
              <p>
                The traders are setting up their stalls. Soon you will buy food, clothes, furniture
                and cars here.
              </p>
              <p className="mt-3 text-sm opacity-70">Coming in the next update.</p>
            </>
          ),
        });
        return;
      }
      if (id === "pray") {
        const p = currentPrayer(c);
        if (p && !s.prayed[p.id]) startPrayer(false);
        else startPrayer(true);
        return;
      }
      if (id === "quran") {
        setPanel({
          kind: "info",
          title: "Surah Al-Ikhlas",
          body: (
            <>
              <p dir="rtl" lang="ar" className="text-center font-[Amiri] text-2xl leading-[2.2]">
                قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝ ٱللَّهُ ٱلصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ
                يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ
              </p>
              <p className="mt-3 text-sm opacity-80">
                Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born,
                and there is none comparable to Him.
              </p>
            </>
          ),
        });
        update((x) => ({ ...x, ilm: x.ilm + 1 }));
        doTask("quran");
        need({ iman: 12 });
        return;
      }
      if (id === "quranhome") {
        onActionRef.current("quran");
        return;
      }
      if (id === "radio") {
        setPanel({
          kind: "info",
          title: "Radio · lectures",
          body: (
            <div className="space-y-2">
              {LECTURES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => openLecture(l, false)}
                  className="w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-2.5 text-left"
                >
                  <div className="font-bold">🎧 {l.title}</div>
                  <div className="text-[12px] opacity-70">{l.speaker}</div>
                </button>
              ))}
            </div>
          ),
        });
        return;
      }
      if (id === "sofa") {
        setPanel({
          kind: "busy",
          title: "Resting on the sofa",
          ms: 2500,
          done: () => {
            need({ energy: 15 });
            toast("A short rest. SubhanAllah.", "good");
          },
        });
        return;
      }
      if (id === "sleep") {
        setPanel({
          kind: "info",
          title: "Before you sleep",
          body: (
            <AdhkarView
              kind="sleep"
              onDone={() =>
                setPanel({
                  kind: "busy",
                  title: "Sleeping",
                  ms: 3500,
                  done: () => {
                    const late = c.min >= c.times.isha || c.min < c.times.fajr;
                    update((x) => ({
                      ...x,
                      wudu: false,
                      needs: { ...(x.needs ?? freshNeeds()), energy: 100 },
                    }));
                    if (late) doTask("sleep");
                    toast(
                      `Rested. On waking, say the du'a in My Day. Fajr is at ${fmtTime(c.times.fajr)}.`,
                      "good",
                    );
                  },
                })
              }
            />
          ),
        });
        return;
      }
      if (id === "eat") {
        // the dining table: eat the food you collected, or order some
        const m = saveRef.current.meal && MENU.find((x) => x.id === saveRef.current.meal);
        if (m) openMealRef.current(m);
        else openFood("order");
        return;
      }
      if (id === "prayermat") {
        const p = currentPrayer(c);
        startPrayer(!(p && !s.prayed[p.id]));
        return;
      }
      if (id === "quiz") {
        if (s.asked.length >= QUIZ_CAP) {
          toast("You answered all 5 questions today. Come back tomorrow, in shaa Allah.");
          return;
        }
        const pool = QUESTIONS.map((_, i) => i).filter((i) => !s.asked.includes(i));
        const qi = pool[Math.floor(Math.random() * pool.length)];
        update((x) => ({ ...x, asked: [...x.asked, qi] }));
        setPanel({ kind: "quiz", q: QUESTIONS[qi], qi });
        return;
      }
      if (id.startsWith("billboard:")) {
        const b = BILLBOARDS.find((x) => x.id === id.slice(10));
        if (!b) return;
        setPanel({
          kind: "info",
          title: b.ad ? b.ad.brand : "Advertise in IlmWorld",
          body: (
            <AdView
              boardName={b.name}
              ad={b.ad}
              canRequest={!!onlineRef.current}
              onRequest={async (r) => {
                const o = onlineRef.current;
                if (!o) return false;
                try {
                  await requestAd({
                    ...r,
                    board: b.id,
                    boardName: b.name,
                    brand: cleanText(r.brand),
                    headline: cleanText(r.headline),
                    line: cleanText(r.line),
                    from: o.uid,
                    fromName: saveRef.current.profile?.name ?? "Player",
                  });
                  return true;
                } catch {
                  toast("Could not send. Try again.", "warn");
                  return false;
                }
              }}
            />
          ),
        });
        return;
      }
      if (id.startsWith("street:")) {
        const st = STREETS[id.slice(7)];
        if (!st) return;
        setPanel({ kind: "info", title: st.name, body: <p>{st.bio}</p> });
      }
    },
    [
      playRope,
      playTennis,
      endVisit,
      greeted,
      startWork,
      toast,
      update,
      openLecture,
      openPlot,
      openShop,
      startPrayer,
      advance,
      openChatWith,
      openWudu,
      doTask,
      need,
      sayDhikr,
      handIn,
      openFood,
    ],
  );

  /* ---------- engine lifecycle ---------- */
  const [peopleReady, setPeopleReady] = useState(false);
  useEffect(() => {
    let live = true;
    loadHumans().then(() => live && setPeopleReady(true));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!host.current || !peopleReady) return;
    let e: IlmCityEngine;
    try {
      e = new IlmCityEngine(
        host.current,
        {
          onContext: setCtx,
          onAction: (id) => onActionRef.current(id),
          onPlace: setPlace,
          onRide: setRide,
          onCinematic: (on) => {
            if (!on) setArriving(null);
          },
        },
        {
          district: saveRef.current.district,
          car: saveRef.current.car,
          x: saveRef.current.pos?.x,
          z: saveRef.current.pos?.z,
        },
      );
    } catch (err) {
      console.error("IlmCity could not start", err);
      setWebgl(false);
      return;
    }
    engine.current = e;
    if (import.meta.env.DEV) (window as unknown as { __ilmcity?: IlmCityEngine }).__ilmcity = e;
    e.setAds(adsRef.current);
    e.setClock(clockRef.current);
    if (saveRef.current.profile) e.setPlayerLook(saveRef.current.profile);
    e.setHomeItems(saveRef.current.items ?? []);
    {
      const pt = homePaint(onlineRef.current?.uid, saveRef.current.paint);
      e.setHomePaint(pt.wall, pt.floor);
    }
    {
      // graphics: the player's choice, or a guess from the phone (checked again as it runs)
      const q = readQuality();
      if (q === "auto") e.setQuality(weakPhone() ? "low" : "high", true);
      else e.setQuality(q);
      e.onSlowPhone = () =>
        toast(
          "Switched to Smooth graphics so the game runs better. Change it in 👤 Profile → Graphics.",
        );
    }
    if (saveRef.current.ride) e.setCar(saveRef.current.ride.kind, saveRef.current.ride.color);
    if (saveRef.current.impound) e.setImpounded(true);
    e.onIncident = (kind, who) => incidentRef.current(kind, who);
    // every visit starts at home: you are only out in the city while you are playing
    {
      const sv = saveRef.current;
      if (sv.profile) {
        const home = sv.homeArea ?? sv.district ?? "lekki";
        const nm = districtById(home).name;
        if (sv.homePlot && e.plots.some((q) => q.id === sv.homePlot))
          e.startAtPlot(sv.homePlot, `Family house · ${nm}`);
        else {
          e.startAtHome(home, flatName(home));
          const left = (sv.lease?.until ?? Infinity) - Date.now();
          if (left < 0)
            setTimeout(
              () =>
                toast(
                  `🏠 Your rent of ${N(flatRent(home))} is due. Pay it in 👤 Profile, or before you come back in.`,
                  "warn",
                ),
              2500,
            );
          else if (left < 86400000)
            setTimeout(
              () =>
                toast(`🏠 Rent of ${N(flatRent(home))} is due tomorrow. 👤 Profile → Pay rent.`),
              2500,
            );
        }
        setInside(true);
      }
    }
    const startedAt = performance.now();
    {
      const st: Record<
        string,
        { kind: "rented" | "owned" | "building" | "built"; floors?: number }
      > = {};
      for (const [pid, o] of Object.entries(saveRef.current.plots ?? {})) {
        const k = plotStateFn(o);
        if (k) st[pid] = k;
      }
      e.initPlots(st);
      for (const sid of e.shopIds()) paintShop(e, sid);
    }
    const iv = setInterval(() => {
      // prayer times follow the city you are in
      const here = cityOf(districtById(e.districtId()));
      const c = clockFor(CITIES[here] ?? city, Date.now() + offset);
      const prev = clockRef.current;
      for (const p of c.prayers)
        if (prev.min < p.start && c.min >= p.start && prev.key === c.key)
          toast(`Adhan for ${p.name}. The masjid is open.`, "good");
      setClock(c);
      e.setClock(c);
      const pp = e.playerPos();
      if (pp.where === "out" && !e.isDriving())
        update((s) => ({
          ...s,
          pos: { x: pp.x, z: pp.z },
          district: e.districtId(),
          car: e.carPos(),
        }));
      setSpeed(e.isDriving() ? e.carSpeedKmh() : null);
      setRide(e.rideInfo());
      // needs fall slowly while you play
      if (saveRef.current.profile && !document.hidden) {
        update((x) => {
          const n = { ...(x.needs ?? freshNeeds()) };
          for (const k of Object.keys(n) as (keyof Needs)[])
            n[k] = Math.max(0, n[k] - NEED_DECAY[k] / 60);
          return { ...x, needs: n };
        });
        const n = saveRef.current.needs;
        if (n && Date.now() - needHintAt.current > 240000) {
          const low = NEED_META.find((m) => n[m.id] < 25);
          if (low) {
            needHintAt.current = Date.now();
            toast(`${low.icon} Your ${low.name.toLowerCase()} is low. ${low.tip}`);
          }
        }
      }
      // tell other players where you are (every 2 seconds)
      const o = onlineRef.current;
      const prof = saveRef.current.profile;
      const pr = e.presence();
      const ar = pr.out ? (e.areaAt(pr.x, pr.z)?.id ?? "") : "";
      const moved =
        Math.hypot(pr.x - lastSent.current.x, pr.z - lastSent.current.z) > 0.5 ||
        ar !== lastSent.current.area;
      // send when you move (every 3 s at most) or every 20 s while standing, to keep costs low
      if (
        o &&
        prof &&
        !document.hidden &&
        Date.now() - presenceAt.current > (moved ? 3000 : 20000)
      ) {
        presenceAt.current = Date.now();
        lastSent.current = { x: pr.x, z: pr.z, area: ar };
        e.presenceSent();
        o.setPresence({
          name: prof.name,
          look: prof,
          badge: badgeOf(saveRef.current),
          x: pr.x,
          z: pr.z,
          h: pr.h,
          moving: pr.moving,
          area: ar,
        });
        if (ar !== watchedArea.current) {
          watchedArea.current = ar;
          offArea.current?.();
          offArea.current = ar
            ? o.watchArea(ar, (list) => {
                areaPlayers.current = list.map((x) => ({ uid: x.uid, name: x.name }));
                engine.current?.setRemotePlayers(list);
              })
            : null;
          if (!ar) e.setRemotePlayers([]);
        }
      }
      if (e.playerPos().where === "out") {
        const ar = e.areaAt(e.playerPos().x, e.playerPos().z)?.id ?? null;
        if (ar && ar !== areaRef.current) {
          if (areaRef.current !== null && saveRef.current.profile) {
            setNewArea(ar);
            setTimeout(() => setNewArea((x) => (x === ar ? null : x)), 7000);
          }
          areaRef.current = ar;
        }
      }
      {
        const h = hisbahRef.current;
        const ms2 = masjidStatus(c);
        const cp = currentPrayer(c);
        if (ms2.open && ms2.prayer && cp && !saveRef.current.prayed[cp.id]) {
          const k = `${c.key}-${ms2.prayer.id}`;
          const who = !h.reminded.has(k) && e.nearHisbah(28);
          if (who) {
            h.reminded.add(k);
            toast(
              `${who}: "It's time for ${ms2.prayer.name}! The masjid is open. Go and pray, may Allah bless you."`,
              "warn",
            );
          }
        }
        // an officer walking past stops you with a question
        const quiet = panelRef.current || e.isRiding() || performance.now() - startedAt < 180000;
        const walkerIdx = quiet ? null : e.hisbahBeside(6);
        const cp2 = currentPrayer(c);
        const key = cp2 ? `${c.key}-${cp2.id}` : `${c.key}-quran`;
        // the Hisbah van pulls over beside you
        const van = !quiet && walkerIdx === null && !h.asked.has(key) && e.stopHisbahVan(16);
        const hi = walkerIdx ?? (van ? -1 : null);
        if (hi !== null) {
          if (!h.asked.has(key)) {
            h.asked.add(key);
            const who = hi >= 0 ? e.talkTo(hi) : { name: "Hisbah patrol officer" };
            talkingRef.current = hi >= 0 ? hi : null;
            const ask = cp2
              ? ({ kind: "prayer", name: cp2.name } as const)
              : ({ kind: "quran" } as const);
            setPanel({
              kind: "info",
              title: who?.name ?? "Hisbah",
              body: (
                <HisbahStop
                  sister={!!saveRef.current.profile?.female}
                  who={who?.name ?? "Hisbah"}
                  ask={ask}
                  onAnswer={(yes) => {
                    const gain = ask.kind === "prayer" ? 3 : 2;
                    if (yes) {
                      engine.current?.talkGesture(hi, "agree");
                      update((x) => ({ ...x, coins: x.coins + gain }));
                      toast(`+${N(gain)} from the Hisbah`, "good");
                      return ask.kind === "prayer"
                        ? `MashaAllah! May Allah accept it from you. Keep guarding your salah. (+${N(gain)})`
                        : `Barakallahu fik! The Qur'an will come on the Day of Judgement to intercede for its companions. (+${N(gain)})`;
                    }
                    engine.current?.talkGesture(hi, "headShake");
                    update((x) => ({ ...x, coins: Math.max(0, x.coins - gain) }));
                    toast(`−${N(gain)}. Go and make it up, in shaa Allah.`, "warn");
                    return ask.kind === "prayer"
                      ? `Fear Allah, my ${saveRef.current.profile?.female ? "sister" : "brother"}! Salah is the first deed we will be asked about on the Day of Judgement. ${cp2 ? `${cp2.name} time ends at ${fmtTime(cp2.end)}.` : ""} Go to the masjid now. (−${N(gain)})`
                      : `Fear Allah, my ${saveRef.current.profile?.female ? "sister" : "brother"}. Do not leave the Qur'an behind. Read even one page today, in shaa Allah. (−${N(gain)})`;
                  }}
                />
              ),
            });
          }
        }
        if (e.isDriving() && e.carSpeedKmh() > 75 && e.inArea() && Date.now() - h.speedAt > 60000) {
          const who = e.nearHisbah(45);
          if (who) {
            h.speedAt = Date.now();
            toast(`${who}: "Slow down, please! People walk here. Safety is part of iman."`, "warn");
          }
        }
      }
      for (const [pid, o] of Object.entries(saveRef.current.plots ?? {}))
        if (o.kind === "building" && o.done <= Date.now()) {
          const next: PlotOwn = { kind: "built", floors: o.floors };
          update((x) => ({ ...x, plots: { ...x.plots, [pid]: next } }));
          e.setPlot(pid, { kind: "built", floors: o.floors });
          toast(
            `Your ${ECONOMY.build[o.floors].name.toLowerCase()} is ready! Rent it out to earn money.`,
            "good",
          );
        }
    }, 1000);
    return () => {
      clearInterval(iv);
      e.dispose();
      engine.current = null;
    };
  }, [offset, toast, update, peopleReady, paintShop]);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const cur = currentPrayer(clock),
    nxt = nextPrayer(clock),
    ms = masjidStatus(clock);
  const areaLecture = districtById(save.district ?? "lekki")
    .landmarks.filter((l) => l.kind === "masjid")
    .map((l) => lectureNow(l.id, clock))
    .find(Boolean);

  openChatRef.current = (o) => void openChatWith(o);
  const goal =
    save.profile && (save.guide ?? 99) > GUIDE.length && !panel && !ride && !delivery && !meal
      ? nextGoal(save, clock, inside, engine.current?.districtId() ?? save.homeArea ?? "lekki")
      : null;
  const runGoal = (g: Goal) => {
    if (g.act === "jobs") return openJobs();
    if (g.act === "travel") return travelNow();
    if (g.act === "adhkarM" || g.act === "adhkarE") {
      const k = g.act === "adhkarM" ? "morning" : "evening";
      setPanel({
        kind: "info",
        title: k === "morning" ? "Morning adhkar" : "Evening adhkar",
        body: (
          <AdhkarView
            kind={k}
            onDone={() => {
              setPanel(null);
              need({ iman: 15 });
              doTask(g.act!);
            }}
          />
        ),
      });
      return;
    }
    if (g.prefix && !engine.current?.goToZone(g.prefix))
      toast(
        inside
          ? "Go outside first: walk to the door and tap Go outside."
          : "That place isn't in this area. Use 📱 Phone → Travel.",
      );
  };
  const travelNow = () =>
    (() => {
      const e = engine.current;
      if (!e) return;
      if (inside) toast("Go outside first, then tap Travel.");
      else if (driving) onAction("bus");
      else if (e.goToBusPark()) toast("Walking to the Bus Park…");
    })();
  const openMyDay = () =>
    (() =>
      setPanel({
        kind: "info",
        title: "My Day",
        body: (
          <MyDayView
            tasks={saveRef.current.tasks ?? {}}
            prayedCount={Object.keys(saveRef.current.prayed).length}
            salamCount={saveRef.current.salams ?? 0}
            onAdhkar={(k) =>
              setPanel({
                kind: "info",
                title:
                  k === "wake"
                    ? "Waking up"
                    : k === "morning"
                      ? "Morning adhkar"
                      : "Evening adhkar",
                body: (
                  <AdhkarView
                    kind={k}
                    onDone={() => {
                      setPanel(null);
                      need({ iman: 15 });
                      doTask(k === "wake" ? "wake" : k === "morning" ? "adhkarM" : "adhkarE");
                    }}
                  />
                ),
              })
            }
          />
        ),
      }))();
  const openHomeShop = () =>
    (() =>
      setPanel({
        kind: "info",
        title: "Furnish your home",
        body: (
          <HomeShopView
            owned={saveRef.current.items ?? []}
            points={saveRef.current.coins}
            paint={saveRef.current.paint}
            onPaint={(wall, floor) => {
              if (saveRef.current.coins < PAINT_PRICE) return;
              update((x) => ({ ...x, coins: x.coins - PAINT_PRICE, paint: { wall, floor } }));
              engine.current?.setHomePaint(wall, floor);
              setTimeout(() => publishHome(), 0);
              setPanel(null);
              toast(`Your home is freshly painted! −${N(PAINT_PRICE)}`, "good");
            }}
            onBuy={(ids, pts) => {
              if (saveRef.current.coins < pts) return;
              const items = [...new Set([...(saveRef.current.items ?? []), ...ids])];
              update((x) => ({ ...x, coins: x.coins - pts, items }));
              engine.current?.setHomeItems(items);
              setTimeout(() => publishHome(), 0);
              setPanel(null);
              toast(
                `Delivered to your flat! ${ids.length} item${ids.length > 1 ? "s" : ""} −${N(pts)}`,
                "good",
              );
            }}
            onNaira={(_ids, naira) =>
              toast(
                `Paystack checkout for ₦${naira.toLocaleString()} is coming next. For now, pay from your IlmWorld wallet.`,
              )
            }
          />
        ),
      }))();

  if (!webgl)
    return (
      <div className="grid h-full place-items-center bg-[#10201e] p-6 text-center text-[#eef3ee]">
        <p>
          IlmWorld needs a phone or computer that supports 3D graphics (WebGL). Try another browser.
        </p>
      </div>
    );

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#10201e] font-[Work_Sans,system-ui,sans-serif] text-[#10201e]">
      <div ref={host} className="absolute inset-0" />
      {!peopleReady && (
        <div className="absolute inset-0 grid place-items-center text-center text-[#fdf8ec]">
          <div>
            <div className="font-serif text-4xl">
              Ilm<span className="text-[#45b8a8]">World</span>
            </div>
            <p className="mt-2 text-sm opacity-70">{cityGreeting()}</p>
          </div>
        </div>
      )}
      {/* top bar */}
      <div
        data-game-ui
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 p-3 pt-[max(12px,env(safe-area-inset-top))]"
      >
        <div
          onClick={() => setBigClock((b) => !b)}
          className={`pointer-events-auto flex min-w-0 cursor-pointer items-center rounded-2xl border border-[#1f6f63]/20 bg-[#fdf8ec]/95 shadow-lg backdrop-blur ${bigClock ? "gap-3 p-2 pr-4" : "gap-1.5 p-1 pr-2.5"}`}
        >
          <span className="relative">
            <SalahRing clock={clock} prayed={save.prayed} size={bigClock ? 64 : 34} />
            {!bigClock &&
              save.profile &&
              Object.values(save.needs ?? freshNeeds()).some((v) => v < 25) && (
                <i className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border border-white bg-[#b8573a]" />
              )}
          </span>
          <div className="min-w-0 leading-tight">
            {bigClock && save.profile && (
              <NeedsBars
                needs={save.needs ?? freshNeeds()}
                onTap={() =>
                  setPanel({
                    kind: "info",
                    title: "Your needs",
                    body: <NeedsView needs={saveRef.current.needs ?? freshNeeds()} />,
                  })
                }
              />
            )}
            <div className={`font-bold tabular-nums ${bigClock ? "text-[17px]" : "text-[13px]"}`}>
              {fmtTime(clock.min)}
            </div>
            {bigClock && (
              <>
                <div className="truncate text-[12px] font-medium opacity-80">{clock.gregorian}</div>
                <div className="truncate text-[12px] font-semibold text-[#1f6f63]">
                  {clock.hijri}
                </div>
              </>
            )}
            <div className={`truncate ${bigClock ? "mt-0.5 text-[11.5px]" : "text-[10.5px]"}`}>
              {cur && !save.prayed[cur.id] ? (
                <span className="font-semibold text-[#b8573a]">
                  {cur.name} now · until {fmtTime(cur.end)}
                </span>
              ) : (
                <span className="opacity-80">
                  Next:{" "}
                  {nxt ? `${nxt.name} ${fmtTime(nxt.start)}` : `Fajr ${fmtTime(clock.times.fajr)}`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          <div className="flex gap-1.5">
            <Chip>
              <i className="inline-block size-3 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffe3a0,#f2b84b_60%,#b07a1c)]" />
              {N(save.coins)}
            </Chip>
            <Chip>
              <i className="inline-block size-2.5 rotate-45 rounded-[2px] bg-[#1f6f63]" />
              {save.ilm}
            </Chip>
          </div>
          {(save.streak?.n ?? 0) > 0 && (
            <Chip>
              🔥 {save.streak!.n} day{save.streak!.n > 1 ? "s" : ""}
            </Chip>
          )}
          <button
            onClick={openMyDay}
            className="pointer-events-auto relative rounded-xl bg-[#e6b84a] px-3 py-1.5 text-[12px] font-bold text-[#2a1c05] shadow"
          >
            📋 My Day
            {save.profile && (
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#1f6f63] text-[10px] text-white">
                {DAY_TASKS.filter((t) => !(save.tasks ?? {})[t.id]).length}
              </span>
            )}
          </button>
          <button
            ref={profileBtn}
            onClick={() => {
              advance("profile");
              setPanel({
                kind: "info",
                title: "👤 Profile",
                body: (
                  <ProfileView
                    look={saveRef.current.profile}
                    number={callNet.current ? numberFor(callNet.current.uid) : undefined}
                    coins={saveRef.current.coins}
                    ilm={saveRef.current.ilm}
                    badge={badgeOf(saveRef.current)}
                    home={
                      saveRef.current.homePlot
                        ? `Family house · ${districtById(saveRef.current.homeArea ?? "lekki").name}`
                        : flatName(saveRef.current.homeArea ?? "lekki").replace("Your flat · ", "")
                    }
                    rent={
                      saveRef.current.homePlot
                        ? null
                        : {
                            area: saveRef.current.homeArea ?? "lekki",
                            until: saveRef.current.lease?.until ?? 0,
                            weekly: flatRent(saveRef.current.homeArea ?? "lekki"),
                          }
                    }
                    items={[
                      { icon: "👕", label: "Clothes", run: () => openWardrobeRef.current() },
                      ...(saveRef.current.homePlot
                        ? []
                        : [
                            {
                              icon: "🏠",
                              label: "Pay rent",
                              run: () => {
                                if (payRentRef.current()) setPanel(null);
                              },
                            },
                          ]),
                      { icon: "💼", label: "Work", run: () => openJobsRef.current() },
                      { icon: "🛋️", label: "Home shop", run: openHomeShop },
                      {
                        icon: "🏘️",
                        label: "My houses",
                        run: () =>
                          setPanel({
                            kind: "info",
                            title: "My houses and land",
                            body: (
                              <MyHousesView
                                plots={saveRef.current.plots ?? {}}
                                info={(id) => engine.current?.plotInfo(id) ?? null}
                                onOpen={(id) => openPlot(id)}
                              />
                            ),
                          }),
                      },
                      { icon: "💬", label: "Chat", badge: unread, run: openInbox },
                      {
                        icon: "❤️",
                        label: "Needs",
                        run: () =>
                          setPanel({
                            kind: "info",
                            title: "Your needs",
                            body: <NeedsView needs={saveRef.current.needs ?? freshNeeds()} />,
                          }),
                      },
                      { icon: "📋", label: "My Day", run: openMyDay },
                      {
                        icon: "🎮",
                        label: "Graphics",
                        run: () =>
                          setPanel({
                            kind: "info",
                            title: "Graphics",
                            body: (
                              <GraphicsView
                                now={readQuality()}
                                low={!!engine.current?.isLow()}
                                onPick={(q) => {
                                  writeQuality(q);
                                  const e = engine.current;
                                  if (e) {
                                    if (q === "auto")
                                      e.setQuality(weakPhone() ? "low" : "high", true);
                                    else e.setQuality(q);
                                  }
                                  setPanel(null);
                                  toast(
                                    q === "low"
                                      ? "Smooth graphics: same look, runs faster."
                                      : q === "high"
                                        ? "Beautiful graphics: shadows and a long view."
                                        : "Auto: the game picks what suits your phone.",
                                    "good",
                                  );
                                }}
                              />
                            ),
                          }),
                      },
                      { icon: "🚪", label: "Exit", run: () => (window.location.href = "/app") },
                    ]}
                  />
                ),
              });
            }}
            className="pointer-events-auto relative rounded-xl bg-[#fdf8ec] px-3 py-1.5 text-[12px] font-bold text-[#1f6f63] shadow"
          >
            👤 Profile
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#b8573a] text-[11px] text-white">
                {unread}
              </span>
            )}
          </button>
          {save.profile && (
            <button
              onClick={openPhone}
              className="pointer-events-auto rounded-xl bg-[#fdf8ec] px-3 py-1.5 text-[12px] font-bold text-[#1f6f63] shadow"
            >
              📱 Phone
            </button>
          )}
          {save.profile && (
            <div className="pointer-events-auto flex max-w-[170px] items-center gap-1 rounded-xl bg-[#10201e]/85 py-1 pl-2.5 pr-1 text-[11.5px] font-semibold text-[#fdf8ec] shadow">
              <button
                onClick={openRadio}
                className="min-w-0 truncate text-left"
                aria-label="Qur'an player"
              >
                {radioState.hushed
                  ? "🔇 Quiet here"
                  : radioState.playing && radioState.source
                    ? `🎧 ${radioState.title}`
                    : "🎧 Qur'an"}
              </button>
              <button
                onClick={() => {
                  const kind = engine.current?.rideKind() ?? null;
                  if (radioState.playing) {
                    if (kind && radioState.source?.key === kind) vehicleMute.current = kind;
                    else setRadio({ on: false });
                    radio.pause();
                  } else {
                    vehicleMute.current = null;
                    if (kind && radioCfgRef.current.vehicles) tuneRef.current();
                    else setRadio({ on: true });
                    if (!kind || !radioCfgRef.current.vehicles)
                      radio.play(mySource(radioCfgRef.current));
                  }
                }}
                className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#fdf8ec]/15"
                aria-label={radioState.playing ? "Pause" : "Play"}
              >
                {radioState.playing ? "⏸" : "▶"}
              </button>
            </div>
          )}
        </div>
      </div>
      {pitchRoom && !match && pitch.current && (
        <PitchLobby
          r={pitchRoom}
          me={pitch.current.net.uid}
          watching={watching}
          others={(() => {
            const e = engine.current;
            const here = pitch.current?.zone;
            if (!e) return [];
            const p0 = e.playerPos();
            return [...e.pitches.entries()]
              .filter(([id]) => id !== here)
              .map(([id, p]) => ({ id, d: Math.hypot(p.x - p0.x, p.z - p0.z) }))
              .sort((a, b) => a.d - b.d)
              .slice(0, 3)
              .map(({ id, d }) => ({
                id,
                name: `${districtById(id.replace(/^field:/, "").replace(/-(pitch|field)$/, "")).name} pitch`,
                km: d / 1000,
              }));
          })()}
          onTeam={(t) => {
            const P = pitch.current;
            if (!P) return;
            const n = Object.values(pitchRoom.players).filter((v) => v.team === t).length;
            if (n >= MAX_PER_TEAM) return toast("That team is full.");
            void P.net.join(saveRef.current.profile?.name ?? "Player", t);
          }}
          onKickoff={() => {
            const P = pitch.current;
            if (!P) return;
            const slots: Record<string, { uid: string; name: string } | null> = {};
            ([0, 1] as const).forEach((t) => {
              const ps = Object.entries(pitchRoom.players)
                .filter(([, v]) => v.team === t)
                .sort((a, b) => a[1].at - b[1].at);
              SLOT_KEYS[t].forEach((k, i) => {
                slots[k] = ps[i] ? { uid: ps[i][0], name: ps[i][1].name } : null;
              });
            });
            void P.net.setRoom({ status: "playing", slots, at: Date.now() });
          }}
          onRestart={() => {
            const z = pitch.current?.zone;
            if (z) void joinPitch(z);
          }}
          onGo={(id) => {
            void leavePitch().then(() => {
              engine.current?.goToBench(id);
              openFootballRef.current(id);
            });
          }}
          onLeave={() => void leavePitch()}
        />
      )}
      {knocking && (
        <div data-game-ui className="absolute inset-x-3 top-3 z-50 mx-auto max-w-sm">
          <div className="flex items-center gap-3 rounded-[24px] bg-[#10201e]/95 px-4 py-3 text-white shadow-2xl">
            <span className="grid size-10 animate-pulse place-items-center rounded-full bg-[#c77d2a] text-[18px]">
              🚪
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-bold">
                Knocking at {knocking.name}'s door…
              </div>
              <div className="text-[12px] opacity-70">Waiting for them to let you in</div>
            </div>
            <button
              onClick={() => {
                void homes.current?.answer(knocking.id, "left").catch(() => {});
                cancelKnock();
              }}
              className="rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {atDoor && !call && (
        <div data-game-ui className="absolute inset-x-3 top-3 z-50 mx-auto max-w-sm">
          <div className="rounded-[24px] bg-[#10201e]/95 px-4 py-3 text-white shadow-2xl">
            <div className="text-[14.5px] font-bold">
              🚪 {atDoor.fromName} is knocking at your door
            </div>
            <div className="text-[12px] opacity-70">They want to visit your home.</div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => answerDoor(atDoor.id, "no")}
                className="flex-1 rounded-full bg-white/15 py-2 text-[13px] font-bold"
              >
                Not now
              </button>
              <button
                onClick={() => answerDoor(atDoor.id, "in")}
                className="flex-1 rounded-full bg-[#2e7d32] py-2 text-[13px] font-bold"
              >
                Let in
              </button>
            </div>
          </div>
        </div>
      )}
      {guests.length > 0 && !atDoor && !panel && (
        <div
          data-game-ui
          className="pointer-events-none absolute right-3 top-[220px] z-20 flex flex-col items-end gap-1.5"
        >
          {guests.map((g) => (
            <div
              key={g.id}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#10201e]/85 py-1 pl-3 pr-1 text-[12px] text-white shadow"
            >
              <span>👤 {g.fromName} is visiting</span>
              <button
                onClick={() => answerDoor(g.id, "out")}
                className="rounded-full bg-[#c0392b] px-2.5 py-1 text-[11.5px] font-bold"
              >
                Ask to leave
              </button>
            </div>
          ))}
        </div>
      )}
      {visiting && (
        <div
          data-game-ui
          className="pointer-events-none absolute inset-x-0 bottom-[110px] z-20 flex justify-center px-3"
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#10201e]/90 py-1.5 pl-4 pr-1.5 text-[13px] text-[#fdf8ec] shadow-xl">
            <span className="font-bold">🏠 {visiting.name}'s home</span>
            <span className="opacity-80">❤️ {visiting.likes}</span>
            <button
              onClick={() => void likeHome()}
              disabled={visiting.liked}
              className="rounded-full bg-[#c0392b] px-3 py-1.5 font-bold disabled:opacity-60"
            >
              {visiting.liked ? "Liked ❤️" : "❤️ Like"}
            </button>
          </div>
        </div>
      )}
      {incoming && !call && (
        <IncomingCall
          from={incoming.fromName}
          onAccept={() => void acceptCall()}
          onDecline={declineCall}
        />
      )}
      {call && (
        <CallScreen
          c={call}
          onMute={(m) => callObj.current?.mute(m)}
          onHangUp={() => callObj.current?.hangUp()}
        />
      )}
      {tennis && (
        <TennisHud t={tennis} onHit={() => engine.current?.tennisHit()} onLeave={leaveTennis} />
      )}
      {rope && (
        <RopeHud
          r={rope}
          onTap={() => engine.current?.ropeTap()}
          onAgain={(role) => {
            ropeOut.current = false;
            engine.current?.ropeAgain(role);
          }}
          onLeave={leaveRope}
        />
      )}
      {match && (
        <MatchHud
          m={match}
          act={(a) => engine.current?.matchAction(a)}
          onLeave={() => {
            if (pitch.current) void leavePitch();
            else {
              engine.current?.endMatch();
              setMatch(null);
            }
          }}
        />
      )}
      {(hungry || delivery || meal) && !match && !dhikr && !panel && (
        <div
          data-game-ui
          className="pointer-events-none absolute inset-x-0 bottom-[110px] z-20 flex justify-center px-3"
        >
          <button
            onClick={() => {
              const e = engine.current;
              if (delivery) {
                if (delivery.near) {
                  e?.collectFood();
                  return;
                }
                if (delivery.outside && e?.scenePlace() !== "out")
                  toast("Tap Exit to go outside. The rider is at your door.");
                return;
              }
              if (meal) {
                if (e?.scenePlace() === "restaurant") {
                  e.guideTo("seat:");
                  return;
                }
                if (e?.scenePlace() === "out") {
                  // away from home: sit down where you are and eat, like at a park
                  if (e.districtId() !== (saveRef.current.homeArea ?? "lekki")) openMeal(meal);
                  else if (!e.goToZone("door:home:")) toast("Go into a house to eat.");
                } else openMeal(meal);
                return;
              }
              openFood("order");
            }}
            className={`pointer-events-auto rounded-full px-4 py-2 text-center text-[13px] font-bold shadow-xl ${delivery || meal ? "bg-[#2f8f3a] text-white" : "animate-pulse bg-[#b8573a] text-white"} ${delivery?.outside ? "animate-pulse" : ""}`}
          >
            {delivery
              ? delivery.near
                ? "🛵 Collect your food from the rider"
                : delivery.outside
                  ? inside
                    ? "🛵 Your rider is outside · go out to collect your food"
                    : "🛵 Walk to the Ilm Food Delivery bike to collect your food"
                  : `🛵 Your ${delivery.dish.name.toLowerCase()} is on the way…`
              : meal
                ? engine.current?.scenePlace() === "restaurant"
                  ? `${meal.icon} Sit at a table to eat · tap for the way`
                  : inside
                    ? `${meal.icon} Tap here: wash your hands, then eat`
                    : engine.current?.districtId() !== (save.homeArea ?? "lekki")
                      ? `${meal.icon} Sit down here, wash your hands and eat · tap`
                      : `${meal.icon} Go inside, wash your hands, then eat · tap to walk home`
                : "😩 I'm hungry · tap to order food"}
          </button>
        </div>
      )}
      {dhikr && PLACE_DHIKR[dhikr.id] && (
        <DhikrCard
          d={PLACE_DHIKR[dhikr.id]}
          blocking={!!dhikr.then}
          onSaid={() => {
            saidDhikr(dhikr.id);
            const then = dhikr.then;
            setDhikr(null);
            then?.();
          }}
          onClose={() => {
            const then = dhikr.then;
            setDhikr(null);
            then?.();
          }}
        />
      )}
      <div
        data-game-ui
        className="pointer-events-none absolute left-3 top-[118px] flex flex-col items-start gap-1.5"
      >
        <span className="rounded-full bg-[#10201e]/80 px-3 py-1 text-[12px] font-semibold text-[#fdf8ec]">
          {place}
        </span>
        {speed !== null && (
          <span className="rounded-full bg-[#f2c230] px-3 py-1 text-[12px] font-bold tabular-nums text-[#2a1c05]">
            {speed} km/h
          </span>
        )}
        {!inside &&
          !driving &&
          districtById(save.district ?? "lekki").landmarks.some((l) => l.kind === "masjid") && (
            <span
              className={`rounded-full px-3 py-1 text-[11.5px] font-semibold ${ms.open || areaLecture ? "bg-[#1f6f63] text-[#fdf8ec]" : "bg-[#fdf8ec]/90 text-[#10201e]"}`}
            >
              Masjid{" "}
              {areaLecture
                ? `· lecture on: ${areaLecture.title}`
                : ms.open
                  ? `open · ${ms.prayer!.name}`
                  : `opens ${ms.next ? fmtTime(ms.next.start - 10) : "for Fajr"}`}
            </span>
          )}
        {goal && (
          <div className="pointer-events-auto flex max-w-[78vw] items-center gap-2 rounded-xl border-2 border-[#e6b84a] bg-[#10201e]/90 py-1.5 pl-3 pr-1.5 text-[#fdf8ec] shadow-lg">
            <span className="text-[12.5px] font-semibold leading-tight">🎯 {goal.text}</span>
            {(goal.prefix || goal.act) && (
              <button
                onClick={() => runGoal(goal)}
                className="shrink-0 rounded-lg bg-[#e6b84a] px-2.5 py-1 text-[12px] font-bold text-[#2a1c05]"
              >
                Go
              </button>
            )}
          </div>
        )}
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-[80vw] rounded-xl border-l-4 bg-[#fdf8ec] px-3 py-2 text-[13px] shadow-lg ${t.tone === "warn" ? "border-[#b8573a]" : t.tone === "good" ? "border-[#1f6f63]" : "border-[#f2b84b]"}`}
          >
            {t.text}
          </div>
        ))}
      </div>
      {/* controls */}{" "}
      {peopleReady && !save.profile && (
        <Onboarding
          loggedIn={loggedIn}
          firstName={firstName}
          female={accountFemale}
          onPreview={(look) => {
            const e = engine.current;
            if (!e) return;
            if (look) e.setPlayerLook(look);
            e.setPreview(!!look);
          }}
          onDone={async (look, area, path, student) => {
            const e = engine.current;
            if (!e) return;
            e.setPlayerLook(look);
            e.setPreview(false);
            e.startIn(area);
            let items: string[] = [];
            let bonus = 100;
            let plots = saveRef.current.plots ?? {};
            let shops = saveRef.current.shops ?? {};
            let homePlot: string | undefined;
            let msg = `Welcome home, ${look.name}! Your flat has a bed and a bathroom. Here is a gift of ₦1,000 to start.`;
            let lease: Save["lease"];
            if (path === "rich") {
              // the family house: a big house on the street that no other player has, furnished
              const me = onlineRef.current?.uid ?? look.name;
              const mix = (id: string) => flatFor(me + id).seed;
              const free = e.plots
                .filter(
                  (q) =>
                    q.district === area &&
                    q.kind === "house" &&
                    q.toLet &&
                    !takenRef.current.has(q.id),
                )
                .sort((a, b) => mix(a.id) - mix(b.id));
              let p: (typeof free)[number] | undefined;
              for (const q of free) {
                if (
                  await claimPlotRef.current(q.id, {
                    kind: "rented",
                    until: Date.now() + 3650 * 86400000,
                  })
                ) {
                  p = q;
                  break;
                }
              }
              if (p) {
                homePlot = p.id;
                plots = {
                  ...plots,
                  [p.id]: { kind: "rented", until: Date.now() + 3650 * 86400000 },
                };
                e.setPlot(p.id, { kind: "rented" });
              }
              items = HOME_ITEMS.map((i) => i.id);
              bonus = 600;
              msg = `Welcome to the family house, ${look.name}! It is fully furnished, and here is ₦6,000.`;
              if (!p)
                msg = `Welcome, ${look.name}! Every family house here is taken, so you start in a furnished flat with ₦6,000.`;
            } else if (path === "trader") {
              const sid = e.shopIds().find((id) => id.startsWith(area + "-") && !/-m\d+$/.test(id));
              if (sid) {
                shops = {
                  ...shops,
                  [sid]: {
                    until: Date.now() + 7 * 86400000,
                    name: "",
                    products: [],
                    salesAt: Date.now(),
                  },
                };
              }
              msg = `Welcome, ${look.name}! Your first shop is free for 7 days. Find it with Places → Shops, name it and add products.`;
            } else
              msg = `Welcome home, ${look.name}! Choose your job from 👤 Profile → Work. Here is ₦1,000 to start.`;
            if (!homePlot) {
              lease = { until: Date.now() + WEEK };
              msg += ` Your first week's rent (${N(flatRent(area))}) is paid; after that, rent is due every week.`;
            }
            e.setHomeItems(items);
            if (homePlot) e.startAtPlot(homePlot, `Family house · ${districtById(area).name}`);
            else e.startAtHome(area, flatName(area));
            setInside(true);
            const next = {
              ...saveRef.current,
              profile: look,
              guide: 1,
              coins: saveRef.current.coins + bonus,
              district: area,
              homeArea: area,
              homePlot,
              lease,
              items,
              needs: freshNeeds(),
              wudu: false,
              plots,
              shops,
              path,
              student,
            };
            saveRef.current = next;
            update(() => next);
            for (const sid of Object.keys(shops)) paintShop(e, sid);
            toast(msg, "good");
            if (path === "worker") setTimeout(() => openJobsRef.current(), 600);
          }}
        />
      )}
      {save.profile &&
        (save.guide ?? 5) <= GUIDE.length &&
        !panel &&
        !ride &&
        !arriving &&
        !travelling && (
          <Guide
            step={save.guide ?? 5}
            onGo={(prefix) => {
              const e = engine.current;
              if (!e?.goToZone(prefix)) toast("Go outside first.");
              else e.guideTo(prefix);
            }}
            onOpen={(what) => {
              if (what === "jobs") openJobsRef.current();
              else if (what === "clothes") openWardrobeRef.current();
              else if (what === "wallet") openWalletRef.current();
              else profileBtn.current?.click();
            }}
            onNext={() => advance(save.guide ?? 1)}
            onSkip={() => update((x) => ({ ...x, guide: GUIDE.length + 1 }))}
          />
        )}
      {newArea && !panel && !ride && (
        <div
          data-game-ui
          className="pointer-events-none absolute inset-x-0 top-[200px] z-10 flex justify-center px-4"
        >
          <button
            onClick={() => openPlaces(newArea)}
            className="pointer-events-auto rounded-2xl border-2 border-[#e6b84a] bg-[#1f6f63] px-4 py-3 text-left text-[#fdf8ec] shadow-2xl"
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e6b84a]">
              You are in {fullName(districtById(newArea))}
            </div>
            <div className="text-[15px] font-bold">
              {
                placesIn(newArea).filter(
                  (p) =>
                    !p.prefix.startsWith("busstop") &&
                    !p.prefix.startsWith("plot") &&
                    !p.prefix.startsWith("shop"),
                ).length
              }{" "}
              places to visit · tap to see
            </div>
          </button>
        </div>
      )}
      {ride && (
        <div
          data-game-ui
          className="absolute inset-x-3 bottom-[max(20px,env(safe-area-inset-bottom))] rounded-2xl bg-[#fdf8ec] p-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-[#f2c230] text-[22px]">
              🚌
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[15px] font-bold">On the danfo · {ride.kmh} km/h</div>
              <div className="truncate text-[12.5px] opacity-80">Next stop: {ride.next}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              disabled={ride.stopping}
              onClick={() => engine.current?.getOffNext()}
              className="flex-1 rounded-xl bg-[#1f6f63] px-3 py-3 text-[14px] font-bold text-[#fdf8ec] disabled:opacity-60"
            >
              {ride.stopping ? "Stopping at the next stop…" : "Get off at next stop"}
            </button>
            <button
              onClick={() => engine.current?.setRideFast(!ride.fast)}
              className="rounded-xl bg-[#10201e] px-4 py-3 text-[14px] font-bold text-[#fdf8ec]"
            >
              {ride.fast ? "Normal" : "⏩ Faster"}
            </button>
          </div>
        </div>
      )}{" "}
      {!panel && !arriving && !ride && save.profile && (
        <Joystick onMove={(x, y) => engine.current?.setInput(x, y)} />
      )}
      {!panel && !arriving && !ride && ctx && (
        <button
          data-game-ui
          onClick={() => onAction(ctx.id)}
          className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] right-4 max-w-[52vw] rounded-2xl bg-[#1f6f63] px-5 py-4 text-left text-[15px] font-bold text-[#fdf8ec] shadow-xl active:scale-95"
        >
          {ctx.label}
        </button>
      )}
      {!panel &&
        !arriving &&
        !ride &&
        !ctx &&
        !driving &&
        !inside &&
        (save.guide ?? 5) > GUIDE.length && (
          <div
            data-game-ui
            className="pointer-events-none absolute bottom-[max(36px,env(safe-area-inset-bottom))] right-4 max-w-[46vw] rounded-xl bg-[#10201e]/70 px-3 py-2 text-[12px] text-[#fdf8ec]"
          >
            Use the stick to walk. Drag the screen to look around. Tap signs and billboards.
          </div>
        )}
      {arriving && (
        <div
          data-game-ui
          className="pointer-events-none absolute inset-x-0 bottom-[12%] flex justify-center px-4"
        >
          <div className="rounded-2xl border-2 border-[#e6b84a] bg-[#1f6f63]/95 px-6 py-4 text-center text-[#fdf8ec] shadow-2xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#e6b84a]">
              {districtById(save.district ?? "lekki").state} State
            </div>
            <div className="font-serif text-3xl leading-tight">Welcome to {arriving}</div>
          </div>
        </div>
      )}
      {travelling && <TravelMap {...travelling} onDone={() => arriveRef.current?.()} />}
      {panel && (
        <Sheet
          panel={panel}
          onClose={() => {
            setPanel(null);
            if (talkingRef.current !== null) engine.current?.endTalk(talkingRef.current);
            talkingRef.current = null;
          }}
          onQuizPick={(i) => {
            advance("learn");
            doTask("learn");
            if (panel.kind !== "quiz" || panel.picked !== undefined) return;
            const ok = i === panel.q.a;
            setPanel({ ...panel, picked: i });
            if (ok) {
              update((x) => ({ ...x, coins: x.coins + POINTS.perCorrectAnswer, ilm: x.ilm + 10 }));
              toast(`Correct! +${N(POINTS.perCorrectAnswer)}, +10 Ilm`, "good");
            } else {
              update((x) => ({ ...x, ilm: x.ilm + 2 }));
              toast("Not quite. You still learned something. +2 Ilm");
            }
          }}
          onNextQuiz={() => {
            setPanel(null);
            setTimeout(() => onAction("quiz"), 50);
          }}
          quizLeft={QUIZ_CAP - save.asked.length}
        />
      )}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#1f6f63]/20 bg-[#fdf8ec]/95 px-2.5 py-1 text-[13px] font-bold tabular-nums shadow">
      {children}
    </span>
  );
}

/** The salah ring: the whole day as a circle, the five prayers marked, the sun moving round. */
function SalahRing({
  clock,
  prayed,
  size = 64,
}: {
  clock: Clock;
  prayed: Record<string, boolean>;
  size?: number;
}) {
  const R = 26,
    C = 32;
  const pt = (m: number, r = R) => {
    const a = (m / 1440) * Math.PI * 2 - Math.PI / 2;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r];
  };
  const arc = (a0: number, a1: number) => {
    const [x0, y0] = pt(a0),
      [x1, y1] = pt(a1);
    const large = a1 - a0 > 720 ? 1 : 0;
    return `M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1}`;
  };
  const [sx, sy] = pt(clock.min);
  const day = clock.min > clock.times.sunrise && clock.min < clock.times.maghrib;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Salah ring">
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke="#10201e"
        strokeOpacity="0.12"
        strokeWidth="6"
      />
      <path
        d={arc(clock.times.sunrise, clock.times.maghrib)}
        fill="none"
        stroke="#f2b84b"
        strokeOpacity="0.55"
        strokeWidth="6"
      />
      {clock.prayers.map((p) => {
        const [x, y] = pt(p.start);
        return (
          <circle
            key={p.id}
            cx={x}
            cy={y}
            r="3.6"
            fill={prayed[p.id] ? "#1f6f63" : clock.min >= p.end ? "#b8573a" : "#fdf8ec"}
            stroke="#1f6f63"
            strokeWidth="1.5"
          />
        );
      })}
      <circle
        cx={sx}
        cy={sy}
        r="5"
        fill={day ? "#f2b84b" : "#cdd6f0"}
        stroke="#10201e"
        strokeWidth="1.2"
      />
      <text x={C} y={C + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f6f63">
        {Object.values(prayed).filter(Boolean).length}/5
      </text>
    </svg>
  );
}

function PrayCheck({ prayer, onYes }: { prayer: Prayer; onYes: () => void }) {
  return (
    <>
      <p>
        It is {prayer.name} time until {fmtTime(prayer.end)}. Have you prayed {prayer.name} in real
        life?
      </p>
      <button
        onClick={onYes}
        className="mt-4 w-full rounded-xl bg-[#1f6f63] px-4 py-3 font-bold text-[#fdf8ec]"
      >
        Yes, I prayed it on time
      </button>
      <p className="mt-2 text-[12px] opacity-70">
        Be honest. This builds a real habit, and it is between you and Allah.
      </p>
    </>
  );
}

function AdView({
  boardName,
  ad,
  canRequest,
  onRequest,
}: {
  boardName: string;
  ad?: (typeof BILLBOARDS)[number]["ad"];
  canRequest: boolean;
  onRequest: (r: {
    brand: string;
    headline: string;
    line: string;
    link: string;
    contact: string;
    plan: "week" | "month";
    imageUrl?: string;
  }) => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState(false);
  const [f, setF] = useState({
    brand: "",
    headline: "",
    line: "",
    link: "",
    contact: "",
    plan: "week" as "week" | "month",
    imageUrl: undefined as string | undefined,
  });
  const [sent, setSent] = useState(false);
  const field = (
    k: "brand" | "headline" | "line" | "link" | "contact",
    label: string,
    max: number,
  ) => (
    <label className="block text-[13px]">
      <span className="font-semibold">{label}</span>
      <input
        value={f[k]}
        maxLength={max}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
        className="mt-0.5 w-full rounded-lg border border-[#10201e]/15 bg-white px-2.5 py-2 text-[14px]"
      />
    </label>
  );
  if (sent)
    return (
      <div className="space-y-2 text-center">
        <div className="text-4xl">📨</div>
        <p className="font-bold">Your advert was sent for review.</p>
        <p className="text-[13px] opacity-75">
          The IlmWorld team will contact you about payment, then approve it. It shows on the{" "}
          {boardName} board once approved.
        </p>
      </div>
    );
  if (form)
    return (
      <div className="space-y-2">
        <p className="text-[13px] opacity-75">
          Your advert on the {boardName} board. Every advert is checked before it goes up: no haram
          products, no music or immodest pictures.
        </p>
        {field("brand", "Business name", 30)}
        {field("headline", "Headline", 40)}
        {field("line", "One line about it", 70)}
        {field("link", "Website or WhatsApp link (optional)", 120)}
        {field("contact", "Your phone or email (for payment)", 60)}
        <label className="block text-[13px]">
          <span className="font-semibold">Banner picture (optional, wide)</span>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setF({ ...f, imageUrl: await shrinkPhoto(file, 640) });
            }}
            className="mt-0.5 block w-full text-[13px]"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["week", "month"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setF({ ...f, plan: k })}
              className={`rounded-xl py-2.5 text-[13px] font-bold ${f.plan === k ? "bg-[#1f6f63] text-[#fdf8ec]" : "border border-[#1f6f63]/25 bg-white"}`}
            >
              1 {k} · {naira(AD_PRICES[k].naira)}
            </button>
          ))}
        </div>
        <button
          disabled={!f.brand.trim() || !f.headline.trim() || f.contact.trim().length < 5}
          onClick={async () => {
            if (await onRequest(f)) setSent(true);
          }}
          className="w-full rounded-xl bg-[#10201e] py-3 font-bold text-[#fdf8ec] disabled:opacity-40"
        >
          Send for review
        </button>
      </div>
    );
  const copy = () => {
    navigator.clipboard?.writeText(AD_EMAIL).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };
  return (
    <>
      {ad ? (
        <div className="rounded-xl p-4" style={{ background: ad.bg, color: ad.fg }}>
          <div className="text-[12px] font-semibold uppercase opacity-80">{ad.brand}</div>
          <div className="mt-1 text-2xl font-extrabold leading-tight">{ad.headline}</div>
          <div className="mt-1 text-sm">{ad.line}</div>
        </div>
      ) : (
        <div className="rounded-xl bg-[#f2b84b] p-4 text-[#2a1c05]">
          <div className="text-2xl font-extrabold">Your advert here</div>
          <div className="mt-1 text-sm">This is the {boardName} billboard.</div>
        </div>
      )}
      {ad?.link && (
        <a
          href={ad.link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block rounded-xl bg-[#1f6f63] px-4 py-3 text-center font-bold text-[#fdf8ec]"
        >
          Visit {ad.brand}
        </a>
      )}
      {canRequest ? (
        <button
          onClick={() => setForm(true)}
          className="mt-3 w-full rounded-xl bg-[#e6b84a] py-3 font-bold text-[#2a1c05]"
        >
          📣 Advertise on this board · from {naira(AD_PRICES.week.naira)} a week
        </button>
      ) : (
        <p className="mt-3 text-[13px] opacity-75">Log in to IlmStation to advertise here.</p>
      )}
      <p className="mt-4 text-sm">For bigger campaigns across IlmWorld, contact:</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 select-all truncate rounded-lg bg-[#10201e]/5 px-3 py-2">
          {AD_EMAIL}
        </code>
        <button
          onClick={copy}
          className="rounded-lg border border-[#10201e]/20 px-3 py-2 text-sm font-semibold"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </>
  );
}

function Sheet({
  panel,
  onClose,
  onQuizPick,
  onNextQuiz,
  quizLeft,
}: {
  panel: Panel;
  onClose: () => void;
  onQuizPick: (i: number) => void;
  onNextQuiz: () => void;
  quizLeft: number;
}) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (panel.kind !== "busy") return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / panel.ms);
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        panel.done();
        onClose();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [panel, onClose]);
  if (panel.kind === "info" && panel.phone)
    return (
      <PhoneFrame title={panel.title} onHome={panel.phone.home} onClose={onClose}>
        {panel.body}
      </PhoneFrame>
    );
  return (
    <div
      data-game-ui
      className="absolute inset-0 flex items-end justify-center bg-black/30 p-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:items-center"
      onClick={panel.kind === "busy" ? undefined : onClose}
    >
      <div
        className="max-h-[80%] w-full max-w-md overflow-auto rounded-2xl bg-[#fdf8ec] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {panel.kind === "busy" ? (
          <>
            <div className="text-lg font-bold">{panel.title}…</div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#10201e]/10">
              <div
                className="h-full rounded-full bg-[#1f6f63]"
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 flex items-start gap-3">
              <h2 className="font-serif text-2xl leading-tight">
                {panel.kind === "quiz" ? "Ustadh Ibrahim asks" : panel.title}
              </h2>
              <button
                onClick={onClose}
                className="ml-auto rounded-lg border border-[#10201e]/15 px-3 py-1.5 text-sm font-semibold"
              >
                Close
              </button>
            </div>
            {panel.kind === "info" && (
              <div className="text-[15px] leading-relaxed">{panel.body}</div>
            )}
            {panel.kind === "quiz" && (
              <>
                <p className="text-[16px] font-semibold">{panel.q.q}</p>
                <div className="mt-3 grid gap-2">
                  {panel.q.o.map((o, i) => {
                    const st =
                      panel.picked === undefined
                        ? ""
                        : i === panel.q.a
                          ? "border-[#1f6f63] bg-[#1f6f63]/10"
                          : i === panel.picked
                            ? "border-[#b8573a] bg-[#b8573a]/10"
                            : "opacity-60";
                    return (
                      <button
                        key={i}
                        disabled={panel.picked !== undefined}
                        onClick={() => onQuizPick(i)}
                        className={`rounded-xl border border-[#10201e]/15 px-4 py-3 text-left font-semibold ${st}`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
                {panel.picked !== undefined && (
                  <>
                    <p className="mt-3 text-sm opacity-80">{panel.q.e}</p>
                    <button
                      onClick={quizLeft > 0 ? onNextQuiz : onClose}
                      className="mt-3 w-full rounded-xl bg-[#1f6f63] px-4 py-3 font-bold text-[#fdf8ec]"
                    >
                      {quizLeft > 0 ? `Next question (${quizLeft} left today)` : "Done for today"}
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);
  const R = 46;
  const move = (e: React.PointerEvent) => {
    if (active.current !== e.pointerId || !base.current) return;
    const r = base.current.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2),
      dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    onMove(dx / R, -dy / R);
  };
  const end = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };
  return (
    <div
      data-game-ui
      ref={base}
      onPointerDown={(e) => {
        active.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-4 size-[124px] touch-none rounded-full border-2 border-[#fdf8ec]/60 bg-[#10201e]/25 backdrop-blur-sm"
    >
      <div
        className="absolute left-1/2 top-1/2 size-14 rounded-full bg-[#fdf8ec]/90 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

/** Outside lecture times the mosque asks: listen to a lecture, or take the quiz? */
function LearnChoice({
  mosque,
  clock,
  onLecture,
  onQuiz,
  pray,
}: {
  mosque: string;
  clock: Clock;
  onLecture: (l: Lecture) => void;
  onQuiz: () => void;
  pray?: { label: string; run: () => void };
}) {
  const all = LECTURES.filter((l) => l.mosque === mosque);
  const next = lectureNext(mosque, clock);
  return (
    <div className="space-y-3">
      <p>
        There is no lecture on right now.
        {next
          ? ` Next live lecture: "${next.title}" at ${fmtTime(hm(next.start))}.`
          : " No more live lectures here today."}{" "}
        What would you like to do?
      </p>
      {pray && (
        <button
          onClick={pray.run}
          className="w-full rounded-xl bg-[#e6b84a] px-4 py-3 text-left font-bold text-[#2a1c05]"
        >
          🕌 {pray.label}
        </button>
      )}
      {all.map((l) => (
        <button
          key={l.id}
          onClick={() => onLecture(l)}
          className="w-full rounded-xl border border-[#1f6f63]/30 bg-white px-4 py-3 text-left"
        >
          <div className="font-bold">🎧 {l.title}</div>
          <div className="text-[12px] opacity-75">
            {l.speaker} · live daily{l.days?.length ? " on Fridays" : ""} at {fmtTime(hm(l.start))}{" "}
            · recording
          </div>
        </button>
      ))}
      <button
        onClick={onQuiz}
        className="w-full rounded-xl bg-[#1f6f63] px-4 py-3 text-left font-bold text-[#fdf8ec]"
      >
        ❓ Take the quiz · +{N(POINTS.perCorrectAnswer)} per correct answer
      </button>
      <p className="text-[12px] opacity-70">
        Lectures pay {N(POINTS.perLectureMinute)} for each minute you listen, up to{" "}
        {N(POINTS.lectureDailyCap)} a day.
      </p>
    </div>
  );
}

/** A lecture playing in the mosque. Points come for each full minute of listening. */
function LectureView({
  lecture,
  live,
  earnedToday,
  onMinute,
}: {
  lecture: Lecture;
  live: boolean;
  earnedToday: number;
  onMinute: () => void;
}) {
  useHush("lecture");
  const [secs, setSecs] = useState(0);
  const tick = useRef(onMinute);
  tick.current = onMinute;
  useEffect(() => {
    const iv = setInterval(
      () =>
        setSecs((s) => {
          if ((s + 1) % 60 === 0) tick.current();
          return s + 1;
        }),
      1000,
    );
    return () => clearInterval(iv);
  }, []);
  const earned = Math.min(
    POINTS.lectureDailyCap,
    earnedToday + Math.floor(secs / 60) * POINTS.perLectureMinute,
  );
  const capped = earned >= POINTS.lectureDailyCap;
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#1f6f63] p-4 text-[#fdf8ec]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#e6b84a]">
          {live ? "Live now" : "Recorded lecture"}
        </div>
        <div className="font-serif text-xl leading-tight">{lecture.title}</div>
        <div className="text-[13px] opacity-85">{lecture.speaker}</div>
        {lecture.audioUrl ? (
          <audio src={lecture.audioUrl} controls autoPlay className="mt-3 w-full" />
        ) : (
          <div className="mt-3 flex h-8 items-end gap-1" aria-hidden>
            {Array.from({ length: 24 }, (_, i) => (
              <span
                key={i}
                className="w-1.5 animate-pulse rounded-full bg-[#e6b84a]"
                style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 6) * 120}ms` }}
              />
            ))}
          </div>
        )}
      </div>
      <p className="tabular-nums">
        Listening {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")} ·{" "}
        {capped
          ? "you have earned today's lecture money. Keep listening for the reward with Allah."
          : `+${N(POINTS.perLectureMinute)} each minute (${N(earned)} of ${N(POINTS.lectureDailyCap)} today)`}
      </p>
      {!lecture.audioUrl && (
        <p className="text-[12px] opacity-70">
          The audio will be added once the speaker gives permission.
        </p>
      )}
    </div>
  );
}

/** A short chat with a neighbour: greetings, how they are, directions, a reminder. */
function TalkView({
  who,
  clock,
  nod,
  onIlm,
}: {
  who: { name: string; female: boolean; district: string; hisbah?: boolean };
  clock: Clock;
  nod: (k: "agree" | "headShake") => void;
  onIlm: (n: number) => void;
}) {
  const D = districtById(who.district);
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const [lines, setLines] = useState<{ me?: boolean; text: string }[]>([
    { text: "Assalamu alaykum wa rahmatullah!" },
  ]);
  const [asked, setAsked] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [lines]);
  const say = (key: string, me: string, them: string, k: "agree" | "headShake" = "agree") => {
    setAsked((a) => [...a, key]);
    setLines((l) => [...l, { me: true, text: me }, { text: them }]);
    nod(k);
  };
  const masjid = D.landmarks.find((l) => l.kind === "masjid");
  const school = D.landmarks.find((l) => l.kind === "school");
  const nxt = nextPrayer(clock);
  const options: { key: string; label: string; run: () => void }[] = [
    {
      key: "salam",
      label: "Wa alaykum salam! How is your day?",
      run: () => {
        say("salam", "Wa alaykum salam wa rahmatullah! How is your day?", pick(SMALL_TALK));
        onIlm(1);
      },
    },
    {
      key: "masjid",
      label: masjid ? "Where is the masjid?" : "Is there a masjid near here?",
      run: () =>
        say(
          "masjid",
          masjid ? "Where is the masjid?" : "Is there a masjid near here?",
          masjid
            ? `${masjid.name} is on ${STREETS[masjid.street].name}. ${nxt ? `${nxt.name} is at ${fmtTime(nxt.start)}, in shaa Allah.` : ""}`
            : `Not in ${D.name} yet. Take a danfo to Lekki or Egbeda, they have big masjids.`,
          masjid ? "agree" : "headShake",
        ),
    },
    {
      key: "remind",
      label: "Please share a reminder",
      run: () => {
        const r = pick(REMINDERS);
        say(
          "remind",
          "Please share a reminder with me.",
          `The Prophet ﷺ said: "${r.text}" (${r.source})`,
        );
        onIlm(2);
      },
    },
    {
      key: "rent",
      label: "Any house for rent around here?",
      run: () =>
        say(
          "rent",
          "Do you know any house for rent around here?",
          `Look for the red TO LET signs on the gates in ${D.name}. And the white LAND FOR SALE boards if you want to build your own.`,
        ),
    },
  ];
  if (who.hisbah) {
    options.splice(3, 1);
    options.unshift({
      key: "hisbah",
      label: "What does the Hisbah do?",
      run: () =>
        say(
          "hisbah",
          "What does the Hisbah do?",
          "We remind people about salah, help keep the streets clean and safe, and settle small quarrels with good words. Respect everyone, brothers and sisters alike.",
        ),
    });
    options.push({
      key: "report",
      label: "I want to report a problem",
      run: () =>
        say(
          "report",
          "I want to report a problem.",
          "JazakAllahu khayran. Write to admin@ilmstation.com and the team will look into it, in shaa Allah.",
        ),
    });
  }
  if (school && !who.hisbah)
    options.push({
      key: "school",
      label: `Tell me about ${school.name}`,
      run: () =>
        say(
          "school",
          `Tell me about ${school.name}.`,
          `It's on ${STREETS[school.street].name}. Go inside and answer the quiz to learn and earn money.`,
        ),
    });
  return (
    <div className="space-y-2">
      <div ref={box} className="max-h-[38vh] space-y-2 overflow-y-auto">
        {lines.map((l, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-[14px] ${l.me ? "ml-auto bg-[#1f6f63] text-[#fdf8ec]" : "bg-white"}`}
          >
            {l.text}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {options
          .filter((o) => !asked.includes(o.key))
          .map((o) => (
            <button
              key={o.key}
              onClick={o.run}
              className="rounded-full border border-[#1f6f63]/40 bg-[#fdf8ec] px-3 py-1.5 text-[13px] font-semibold text-[#1f6f63]"
            >
              {o.label}
            </button>
          ))}
      </div>
      <form
        className="flex gap-2 pt-1"
        onSubmit={(ev) => {
          ev.preventDefault();
          const t = typed.trim();
          if (!t) return;
          setTyped("");
          const r = npcReply(t, {
            who,
            D,
            nextPrayer: nxt ? `${nxt.name} at ${fmtTime(nxt.start)}` : "",
          });
          setLines((l) => [...l, { me: true, text: t }, { text: r.text }]);
          nod(r.nod);
        }}
      >
        <input
          value={typed}
          maxLength={200}
          onChange={(ev) => setTyped(ev.target.value)}
          placeholder={`Write to ${who.name.split(" ").slice(-1)[0]}…`}
          className="min-w-0 flex-1 rounded-xl border border-[#1f6f63]/30 bg-white px-3 py-2 text-[14px]"
        />
        <button className="rounded-xl bg-[#1f6f63] px-4 font-bold text-[#fdf8ec]">Send</button>
      </form>
    </div>
  );
}

/** What a passer-by says back to something you typed. */
function npcReply(
  text: string,
  c: { who: { name: string; hisbah?: boolean }; D: District; nextPrayer: string },
): { text: string; nod: "agree" | "headShake" } {
  const t = text.toLowerCase();
  const greet = ["salam", "salaam", "assalam"].some((w) => t.includes(w));
  const r = topicReply(t, c);
  if (greet && !r) return { text: "Wa alaykum salam wa rahmatullahi wa barakatuh!", nod: "agree" };
  if (greet && r) return { ...r, text: "Wa alaykum salam! " + r.text };
  return (
    r ?? {
      text: "Hmm, I'm not sure. Ask at the masjid or the school's admin block, they will help you.",
      nod: "headShake",
    }
  );
}
function topicReply(
  t: string,
  c: { who: { name: string; hisbah?: boolean }; D: District; nextPrayer: string },
): { text: string; nod: "agree" | "headShake" } | null {
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  const masjid = c.D.landmarks.find((l) => l.kind === "masjid");
  const school = c.D.landmarks.find((l) => l.kind === "campus" || l.kind === "school");
  if (has("stupid", "idiot", "fool", "mumu", "ode", "mad ", "useless", "shut up"))
    return {
      text: "Subhanallah! Let us speak with good words, my dear. The Prophet ﷺ was never harsh in speech.",
      nod: "headShake",
    };
  if (has("jazak", "thank", "e se", "shukran"))
    return { text: "Wa iyyakum! May Allah bless you too.", nod: "agree" };
  if (has("your name", "who are you"))
    return { text: `I am ${c.who.name}. I live here in ${c.D.name}.`, nod: "agree" };
  if (has("how are", "how you", "how far", "kedu", "bawo", "how is"))
    return { text: "Alhamdulillah, I am well. And you?", nod: "agree" };
  if (has("masjid", "mosque", "pray", "salah", "solah", "jumu", "adhan"))
    return {
      text: masjid
        ? `${masjid.name} is on ${STREETS[masjid.street]?.name}. ${c.nextPrayer ? `The next prayer is ${c.nextPrayer}.` : ""}`
        : "There is no masjid in this area yet. Take a danfo to the next area.",
      nod: masjid ? "agree" : "headShake",
    };
  if (has("rent", "house", "land", "flat", "apartment"))
    return {
      text: "Look for the red TO LET signs on the gates, and the white LAND FOR SALE boards.",
      nod: "agree",
    };
  if (has("shop", "market", "buy", "sell", "stall", "business"))
    return {
      text: `${c.D.name} Market has stalls for ₦2,000 a week, and there are shops to let on the streets.`,
      nod: "agree",
    };
  if (has("bus", "danfo", "travel", "go to", "keke", "road"))
    return {
      text: "Wait at the blue bus stop and a danfo will come. Or tap Travel at the top.",
      nod: "agree",
    };
  if (has("school", "learn", "quiz", "class", "study", "madrasah"))
    return {
      text: school
        ? `Go to ${school.name}. Every class has its books and a quiz.`
        : "Every mosque has a quiz, and there are big schools in Ikorodu and Ajegunle.",
      nod: "agree",
    };
  if (has("quran", "qur'an", "hadith", "advice", "remind", "nasiha"))
    return {
      text: `The Prophet ﷺ said: "${REMINDERS[0].text}" (${REMINDERS[0].source})`,
      nod: "agree",
    };
  if (has("marry", "marriage", "wife", "husband"))
    return {
      text: "May Allah bless you with a righteous spouse. Speak to the imam at the masjid, he will guide you.",
      nod: "agree",
    };
  return null;
}

/* ---------------- houses and land ---------------- */
type Room = { tenant: string; until: number } | null;
type PlotOwn =
  | { kind: "rented"; until: number }
  | { kind: "owned" }
  | { kind: "building"; floors: number; done: number }
  | { kind: "built"; floors: number; tenant?: string; since?: number; rooms?: Room[] }
  | { kind: "bought"; floors: number; rooms?: Room[] };
const roomsIn = (floors: number) => floors * 2 + 1;

const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
const floorsName = (f: number) => (f <= 1 ? "Bungalow" : f === 2 ? "Duplex" : "Storey building");

function PlotView({
  plot,
  own,
  points,
  players,
  onPay,
  onPaystack,
  onSet,
  onEnter,
  onCollect,
  onRooms,
}: {
  plot: {
    id: string;
    kind: "house" | "land" | "shops";
    number: number;
    street: string;
    district: string;
    floors: number;
  };
  own?: PlotOwn;
  points: number;
  players?: PlayersRooms;
  onPay: (pts: number, next: PlotOwn, msg: string) => void;
  onPaystack: (amount: number, what: string) => void;
  onSet: (next: PlotOwn) => void;
  onEnter: () => void;
  onCollect: () => void;
  onRooms: (rooms: Room[], earned: number) => void;
}) {
  const where = `No. ${plot.number}, ${plot.street}, ${districtById(plot.district).name}`;
  const btn = "w-full rounded-xl px-4 py-3 text-left text-[14px] font-bold";
  const primary = `${btn} bg-[#1f6f63] text-[#fdf8ec] disabled:opacity-50`;
  const secondary = `${btn} border border-[#1f6f63]/30 bg-white text-[#10201e]`;
  const now = Date.now();
  const R = ECONOMY.rent;
  const rentButtons = (extend: boolean) => (
    <>
      {(["week", "month"] as const).map((k) => (
        <button
          key={k}
          disabled={points < R[k].points}
          className={primary}
          onClick={() =>
            onPay(
              R[k].points,
              {
                kind: "rented",
                until: Math.max(now, own?.kind === "rented" ? own.until : 0) + R[k].days * 86400000,
              },
              `${extend ? "Extended" : "Rented"} for ${R[k].days} days. Welcome home!`,
            )
          }
        >
          {extend ? "Extend" : "Rent"} {k === "week" ? "7 days" : "1 month"} · {N(R[k].points)}
        </button>
      ))}
      <button className={secondary} onClick={() => onPaystack(R.week.naira, "7 days rent")}>
        Pay {naira(R.week.naira)} (7 days) with Paystack
      </button>
      <button className={secondary} onClick={() => onPaystack(R.month.naira, "1 month rent")}>
        Pay {naira(R.month.naira)} (1 month) with Paystack
      </button>
    </>
  );

  if (plot.kind === "house") {
    const beds = plot.floors * 2 + 1;
    if (own?.kind === "bought")
      return (
        <div className="space-y-2">
          <p>
            {where}. Your own {floorsName(plot.floors).toLowerCase()} with {beds} bedrooms.
          </p>
          <button className={primary} onClick={onEnter}>
            Go inside
          </button>
          <RoomsView
            players={players}
            rooms={own.rooms ?? []}
            count={beds}
            onRooms={(rooms, earned) => onRooms(rooms, earned)}
          />
        </div>
      );
    const price = HOUSE_PRICE[plot.floors] ?? HOUSE_PRICE[1];
    const buyButton = (
      <button
        disabled={points < price}
        className={primary}
        onClick={() =>
          onPay(
            price,
            { kind: "bought", floors: plot.floors, rooms: [] },
            "Alhamdulillah! The house is yours. You can rent out its rooms.",
          )
        }
      >
        Buy this house · {N(price)}
        <span className="block text-[12px] font-medium opacity-80">
          Rent out its {beds} rooms for {N(ROOM_RENT_WEEK)} a week each
        </span>
      </button>
    );
    if (own?.kind === "rented" && own.until > now) {
      const days = Math.ceil((own.until - now) / 86400000);
      return (
        <div className="space-y-2">
          <p>
            {where}. Your {floorsName(plot.floors).toLowerCase()} with {beds} bedrooms.{" "}
            <b>
              {days} day{days === 1 ? "" : "s"} left.
            </b>
          </p>
          <button className={primary} onClick={onEnter}>
            Go inside
          </button>
          {rentButtons(true)}
          {buyButton}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <p>
          {where}. {floorsName(plot.floors)} with {beds} bedrooms, a kitchen, a parlour and a fenced
          compound.
        </p>
        <p className="text-[13px] opacity-75">You have {N(points)}.</p>
        {rentButtons(false)}
        {buyButton}
      </div>
    );
  }

  // land
  if (!own)
    return (
      <div className="space-y-2">
        <p>
          {where}. A dry plot of 22 m × 20 m with a C of O. Buy it, build a house, and rent it out
          to earn money.
        </p>
        <p className="text-[13px] opacity-75">You have {N(points)}.</p>
        <button
          disabled={points < ECONOMY.land.points}
          className={primary}
          onClick={() =>
            onPay(ECONOMY.land.points, { kind: "owned" }, "Alhamdulillah! The land is yours.")
          }
        >
          Buy the land · {N(ECONOMY.land.points)}
        </button>
        <button className={secondary} onClick={() => onPaystack(ECONOMY.land.naira, "the land")}>
          Pay {naira(ECONOMY.land.naira)} with Paystack
        </button>
      </div>
    );
  if (own.kind === "owned")
    return (
      <div className="space-y-2">
        <p>Your land at {where}. What will you build?</p>
        {[1, 2, 3].map((f) => {
          const b = ECONOMY.build[f];
          return (
            <button
              key={f}
              disabled={points < b.points}
              className={primary}
              onClick={() =>
                onPay(
                  b.points,
                  { kind: "building", floors: f, done: Date.now() + b.minutes * 60000 },
                  `The builders have started your ${b.name.toLowerCase()}. Ready in ${b.minutes} minutes.`,
                )
              }
            >
              {b.name} · {N(b.points)} · {b.minutes} min
              <span className="block text-[12px] font-medium opacity-80">
                Tenants pay {N(b.tenantPerDay)} a day
              </span>
            </button>
          );
        })}
      </div>
    );
  if (own.kind === "building") {
    const m = Math.max(0, Math.ceil((own.done - now) / 60000));
    return (
      <p>
        The builders are working on your {ECONOMY.build[own.floors].name.toLowerCase()}. Ready in
        about {m} minute
        {m === 1 ? "" : "s"}, in shaa Allah.
      </p>
    );
  }
  if (own.kind !== "built") return null;
  const b = ECONOMY.build[own.floors];
  const due = own.since ? Math.floor(((now - own.since) / 86400000) * b.tenantPerDay) : 0;
  return (
    <div className="space-y-2">
      <p>
        Your {b.name.toLowerCase()} at {where}.{" "}
        {own.tenant
          ? `${own.tenant} live here and pay ${N(b.tenantPerDay)} a day.`
          : "Nobody lives here yet."}
      </p>
      {own.tenant ? (
        <button disabled={due < 1} className={primary} onClick={onCollect}>
          Collect rent · {N(due)}
        </button>
      ) : (
        <button
          className={primary}
          onClick={() =>
            onSet({
              ...own,
              tenant: TENANTS[Math.floor(Math.random() * TENANTS.length)],
              since: Date.now(),
            })
          }
        >
          Rent it out to a tenant
        </button>
      )}
      <button className={secondary} onClick={onEnter}>
        Go inside
      </button>
      {!own.tenant && (
        <RoomsView
          players={players}
          rooms={own.rooms ?? []}
          count={roomsIn(own.floors)}
          onRooms={(rooms, earned) => onRooms(rooms, earned)}
        />
      )}
    </div>
  );
}

/** Rooms in a house you own: each can be rented to a tenant for a week at a time. */
type PlayersRooms = {
  ads: RoomAd[];
  onList: (i: number) => void;
  onUnlist: (id: string) => void;
};
function RoomsView({
  rooms,
  count,
  onRooms,
  players,
}: {
  players?: PlayersRooms;
  rooms: Room[];
  count: number;
  onRooms: (rooms: Room[], earned: number) => void;
}) {
  const now = Date.now();
  const list = Array.from({ length: count }, (_, i) => rooms[i] ?? null);
  const used = new Set(list.filter((r) => r && r.until > now).map((r) => r!.tenant));
  const rentOut = (i: number) => {
    const free = TENANTS.filter((t) => !used.has(t));
    const tenant = free[Math.floor(Math.random() * free.length)] ?? TENANTS[0];
    const next = [...list];
    next[i] = { tenant, until: now + 7 * 86400000 };
    onRooms(next, ROOM_RENT_WEEK);
  };
  const occupied = list.filter((r) => r && r.until > now).length;
  return (
    <div className="space-y-1.5 rounded-xl bg-white p-3">
      <div className="text-[13px] font-semibold">
        Rooms · {occupied} of {count} rented
      </div>
      {list.map((r, i) => {
        const live = r && r.until > now;
        const days = live ? Math.ceil((r.until - now) / 86400000) : 0;
        return (
          <div key={i} className="flex items-center justify-between gap-2 text-[13px]">
            <span className="min-w-0 truncate">
              🛏️ Room {i + 1}:{" "}
              {live ? (
                <>
                  {r.tenant} · {days} day{days === 1 ? "" : "s"} left
                </>
              ) : r ? (
                <span className="opacity-70">free (the rent ended, {r.tenant} moved out)</span>
              ) : (
                <span className="opacity-70">empty</span>
              )}
            </span>
            {!live &&
              (() => {
                const ad = players?.ads.find((a) => a.i === i);
                if (ad && !(ad.tenant && (ad.until ?? 0) > now))
                  return (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="text-[11.5px] font-semibold text-[#1f6f63]">
                        Listed for players
                      </span>
                      <button
                        onClick={() => players!.onUnlist(ad.id)}
                        className="rounded-lg border border-[#10201e]/15 px-2 py-1 text-[11.5px]"
                      >
                        Unlist
                      </button>
                    </span>
                  );
                return (
                  <span className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => rentOut(i)}
                      className="rounded-lg bg-[#1f6f63] px-2.5 py-1.5 text-[12px] font-bold text-[#fdf8ec]"
                    >
                      Rent out · +{N(ROOM_RENT_WEEK)}
                    </button>
                    {players && (
                      <button
                        onClick={() => players.onList(i)}
                        className="rounded-lg bg-[#f2c230] px-2.5 py-1.5 text-[12px] font-bold"
                      >
                        To players
                      </button>
                    )}
                  </span>
                );
              })()}
          </div>
        );
      })}
      <p className="text-[11.5px] opacity-65">
        Tenants pay a week in advance. When the week ends and you don't rent the room again, they
        move out on their own.
      </p>
    </div>
  );
}

/* ---------------- schools ---------------- */
const COMING_SOON_BIO =
  "A biography of the Sheikh is coming soon. The IlmStation team will add it after review by our scholars panel.";
const landmarkById = (lid: string) => {
  for (const d of DISTRICTS) for (const l of d.landmarks) if (l.id === lid) return { l, d };
  return null;
};

/** Inside a class: the subjects with their books, and a quiz for each. */
function ClassView({
  cls,
  school,
  earnedToday,
  onCorrect,
  subjects,
}: {
  subjects?: string[];
  cls: string;
  school: string;
  earnedToday: number;
  onCorrect: () => boolean;
}) {
  const [sub, setSub] = useState<string | null>(null);
  const [qs, setQs] = useState<SchoolQ[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(earnedToday);
  if (!sub)
    return (
      <div className="space-y-2">
        <p className="text-[13px] opacity-80">
          Welcome to {cls} at {school}. Pick a subject to see the book and take its quiz.
        </p>
        {SUBJECTS.filter((x) => !subjects || subjects.includes(x.id)).map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSub(s.id);
              setQs(quizFor(s.id, cls));
              setI(0);
              setPicked(null);
              setScore(0);
            }}
            className="w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-2.5 text-left"
          >
            <div className="text-[14px] font-bold">{s.name}</div>
            <div className="text-[12px] opacity-75">📖 {s.book(cls)}</div>
          </button>
        ))}
        <p className="text-[12px] opacity-70">
          +{N(SCHOOL_POINTS.perCorrect)} per correct answer, up to {N(SCHOOL_POINTS.dailyCap)} a day
          ({earned} today).
        </p>
      </div>
    );
  const subject = SUBJECTS.find((s) => s.id === sub)!;
  if (i >= qs.length)
    return (
      <div className="space-y-3 text-center">
        <div className="font-serif text-2xl">
          {score} / {qs.length}
        </div>
        <p>
          {score === qs.length
            ? "Excellent! Masha Allah."
            : score >= 3
              ? "Well done!"
              : "Keep studying, you will get there in shaa Allah."}
        </p>
        <button
          onClick={() => setSub(null)}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
        >
          Back to subjects
        </button>
      </div>
    );
  const q = qs[i];
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-[#1f6f63]">
        {subject.name} · {cls} · question {i + 1} of {qs.length}
      </div>
      <p className="text-[16px] font-semibold">{q.q}</p>
      {q.o.map((o, k) => {
        const state =
          picked === null
            ? ""
            : k === q.a
              ? "bg-[#1f6f63] text-[#fdf8ec]"
              : k === picked
                ? "bg-[#b8573a] text-white"
                : "opacity-60";
        return (
          <button
            key={k}
            disabled={picked !== null}
            onClick={() => {
              setPicked(k);
              if (k === q.a) {
                setScore((x) => x + 1);
                if (onCorrect()) setEarned((x) => x + SCHOOL_POINTS.perCorrect);
              }
            }}
            className={`w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-2.5 text-left text-[14px] ${state}`}
          >
            {o}
          </button>
        );
      })}
      {picked !== null && (
        <button
          onClick={() => {
            setI((x) => x + 1);
            setPicked(null);
          }}
          className="w-full rounded-xl bg-[#10201e] py-3 font-bold text-[#fdf8ec]"
        >
          {i + 1 < qs.length ? "Next question" : "See my score"}
        </button>
      )}
    </div>
  );
}

/* ---------------- shops and stalls ---------------- */
type ShopOwn = {
  until: number;
  name: string;
  products: { name: string; price: string; img: string }[];
  /** when sales were last collected */
  salesAt?: number;
};

/** Shrink a photo so it fits in the game's storage (about 20 KB). */
function shrinkPhoto(file: File, max = 320): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const s = Math.min(1, max / Math.max(im.width, im.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(im.width * s);
        cv.height = Math.round(im.height * s);
        cv.getContext("2d")!.drawImage(im, 0, 0, cv.width, cv.height);
        res(cv.toDataURL("image/jpeg", 0.72));
      };
      im.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}
const emojiCache = new Map<string, string>();
/** A product picture drawn from an emoji, for the market's own traders. */
function emojiPic(e: string) {
  const hit = emojiCache.get(e);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#fdf8ec";
  c.fillRect(0, 0, 128, 128);
  c.font = "88px system-ui, 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(e, 64, 70);
  const url = cv.toDataURL("image/png");
  emojiCache.set(e, url);
  return url;
}
/** The market's own traders sit at every third stall. */
const traderAt = (id: string) => {
  const m = /-m(\d+)$/.exec(id);
  if (!m || Number(m[1]) % 3 !== 0) return null;
  const n = Number(m[1]) + id.length;
  return MARKET_TRADERS[n % MARKET_TRADERS.length];
};

function ShopView({
  kind,
  where,
  own,
  trader,
  onFood,
  onCollect,
  points,
  onRent,
  onPaystack,
  onSave,
}: {
  kind: "shop" | "stall";
  where: string;
  own?: ShopOwn;
  trader: (typeof MARKET_TRADERS)[number] | null;
  onFood: () => void;
  onCollect: () => void;
  points: number;
  onRent: (days: number, pts: number) => void;
  onPaystack: (amount: number, what: string) => void;
  onSave: (o: ShopOwn) => void;
}) {
  const now = Date.now();
  const mine = own && own.until > now;
  const [name, setName] = useState(own?.name ?? "");
  const [products, setProducts] = useState(own?.products ?? []);
  const [busy, setBusy] = useState(false);
  const btn = "w-full rounded-xl px-4 py-3 text-left text-[14px] font-bold";
  const primary = `${btn} bg-[#1f6f63] text-[#fdf8ec] disabled:opacity-50`;
  const secondary = `${btn} border border-[#1f6f63]/30 bg-white text-[#10201e]`;
  if (trader)
    return (
      <div className="space-y-2">
        <p className="text-[13px] opacity-80">{where}</p>
        {trader.items.map(([e, n, p]) => (
          <div key={n} className="flex items-center gap-3 rounded-xl bg-white p-2">
            <img src={emojiPic(e)} alt="" className="size-14 rounded-lg object-cover" />
            <div>
              <div className="font-bold">{n}</div>
              <div className="text-[13px] text-[#1f6f63]">{p}</div>
            </div>
          </div>
        ))}
        {/food|fruit|date/i.test(trader.name) && (
          <button
            onClick={onFood}
            className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
          >
            🍽️ Buy something to eat · ₦50
          </button>
        )}
        <p className="text-[12px] opacity-70">
          Want your own stall? Empty spaces cost ₦2,000 a week.
        </p>
      </div>
    );
  if (!mine) {
    const P = SHOP_PRICES;
    return (
      <div className="space-y-2">
        <p>
          {kind === "shop"
            ? `A lock-up shop on ${where}, with a counter and a roller shutter. Rent it, give it a name and show your products to every player who passes.`
            : `A market stall in ${where}. ₦2,000 a week. Add your business name and product photos, and they show on your stall for everyone to see.`}
        </p>
        {kind === "shop" ? (
          <>
            <p className="text-[13px] opacity-75">You have {N(points)}.</p>
            {(["week", "month"] as const).map((k) => (
              <button
                key={k}
                disabled={points < P.shop[k].points}
                className={primary}
                onClick={() => onRent(P.shop[k].days, P.shop[k].points)}
              >
                Rent {k === "week" ? "7 days" : "1 month"} · {N(P.shop[k].points)}
              </button>
            ))}
            <button
              className={secondary}
              onClick={() => onPaystack(P.shop.week.naira, "7 days shop rent")}
            >
              Pay {naira(P.shop.week.naira)} (7 days) with Paystack
            </button>
          </>
        ) : (
          <>
            <button
              className={primary}
              onClick={() => onPaystack(P.stall.week.naira, "a market stall for 7 days")}
            >
              Pay {naira(P.stall.week.naira)} for 7 days with Paystack
            </button>
            {import.meta.env.DEV && (
              <button className={secondary} onClick={() => onRent(7, 0)}>
                Test mode: take the stall free for 7 days
              </button>
            )}
          </>
        )}
      </div>
    );
  }
  const days = Math.ceil((own!.until - now) / 86400000);
  return (
    <div className="space-y-2">
      <p className="text-[13px] opacity-80">
        Your {kind} on {where}. {days} day{days === 1 ? "" : "s"} left.
      </p>
      <label className="block text-[13px] font-semibold">
        Business name
        <input
          value={name}
          maxLength={28}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Barakah Fabrics"
          className="mt-1 w-full rounded-xl border border-[#1f6f63]/30 bg-white px-3 py-2 text-[15px] font-normal"
        />
      </label>
      <div className="space-y-2">
        {products.map((p, k) => (
          <div key={k} className="flex items-center gap-2 rounded-xl bg-white p-2">
            <img src={p.img} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1 space-y-1">
              <input
                value={p.name}
                onChange={(e) =>
                  setProducts((ps) =>
                    ps.map((x, j) => (j === k ? { ...x, name: e.target.value } : x)),
                  )
                }
                placeholder="Product name"
                className="w-full rounded-lg border border-black/10 px-2 py-1 text-[13px]"
              />
              <input
                value={p.price}
                onChange={(e) =>
                  setProducts((ps) =>
                    ps.map((x, j) => (j === k ? { ...x, price: e.target.value } : x)),
                  )
                }
                placeholder="Price, e.g. ₦3,500"
                className="w-full rounded-lg border border-black/10 px-2 py-1 text-[13px]"
              />
            </div>
            <button
              onClick={() => setProducts((ps) => ps.filter((_, j) => j !== k))}
              className="px-2 text-[18px] opacity-60"
              aria-label="Remove product"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {products.length < 6 && (
        <label className={`${secondary} block cursor-pointer text-center`}>
          {busy ? "Adding photo…" : "📷 Add a product photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setBusy(true);
              try {
                const img = await shrinkPhoto(f);
                setProducts((ps) => [...ps, { name: "", price: "", img }]);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
      )}
      {own!.name && own!.products.length > 0 && (
        <button disabled={salesDue(own!) < 1} className={primary} onClick={onCollect}>
          {salesDue(own!) >= 1
            ? `💰 Collect sales · ${N(salesDue(own!))}`
            : `Customers are buying · about ${N(SHOP_SALES_PER_DAY)} a day`}
        </button>
      )}
      <button
        disabled={!name.trim()}
        className={primary}
        onClick={() =>
          onSave({
            ...own!,
            until: own!.until,
            name: name.trim(),
            products,
            salesAt: own!.salesAt ?? Date.now(),
          })
        }
      >
        Save and open my {kind}
      </button>
      {kind === "shop" ? (
        <button
          disabled={points < SHOP_PRICES.shop.week.points}
          className={secondary}
          onClick={() => onRent(7, SHOP_PRICES.shop.week.points)}
        >
          Extend 7 days · {N(SHOP_PRICES.shop.week.points)}
        </button>
      ) : (
        <button
          className={secondary}
          onClick={() => onPaystack(SHOP_PRICES.stall.week.naira, "7 more days")}
        >
          Extend 7 days · {naira(SHOP_PRICES.stall.week.naira)} with Paystack
        </button>
      )}
      <p className="text-[12px] opacity-70">
        Photos are saved on this phone for now. When accounts arrive, every player in IlmWorld will
        see them.
      </p>
    </div>
  );
}

/* ---------------- salah ---------------- */
type Step = { pose: "stand" | "ruku" | "sujud" | "sit"; name: string; say: string; secs: number };
/** The steps of one rak'ah, with what is said in each position. */
function rakahSteps(first: boolean, last: boolean, middleSitting: boolean): Step[] {
  const s: Step[] = [];
  if (first) s.push({ pose: "stand", name: "Takbir", say: "Allahu Akbar", secs: 5 });
  s.push(
    { pose: "stand", name: "Qiyam", say: "Al-Fatihah and a surah…", secs: 24 },
    { pose: "ruku", name: "Ruku'", say: "Subhana Rabbiyal 'Adheem", secs: 8 },
    {
      pose: "stand",
      name: "I'tidal",
      say: "Sami'allahu liman hamidah · Rabbana wa lakal hamd",
      secs: 5,
    },
    { pose: "sujud", name: "Sujud", say: "Subhana Rabbiyal A'la", secs: 8 },
    { pose: "sit", name: "Jalsah", say: "Rabbighfir li", secs: 4 },
    { pose: "sujud", name: "Sujud", say: "Subhana Rabbiyal A'la", secs: 8 },
  );
  if (middleSitting)
    s.push({ pose: "sit", name: "Tashahhud", say: "At-tahiyyatu lillah…", secs: 14 });
  if (last) {
    s.push({
      pose: "sit",
      name: "Tashahhud",
      say: "At-tahiyyatu lillah… Allahumma salli 'ala Muhammad…",
      secs: 24,
    });
    s.push({ pose: "sit", name: "Taslim", say: "As-salamu 'alaykum wa rahmatullah", secs: 5 });
  }
  return s;
}
const RAKAHS: Record<string, number> = {
  fajr: 2,
  dhuhr: 4,
  jumuah: 2,
  asr: 4,
  maghrib: 3,
  isha: 4,
};
const MIN_PRAYER_MS = 3 * 60 * 1000;

/** Praying: the steps play out with your character; you can finish after at least 3 minutes. */
function PrayerSession({
  title,
  rakahs,
  onPose,
  onFinish,
}: {
  title: string;
  rakahs: number;
  onPose: (p: Step["pose"] | null) => void;
  onFinish: () => void;
}) {
  useHush("salah");
  const steps = useMemo(() => {
    const out: Step[] = [];
    for (let r = 1; r <= rakahs; r++)
      out.push(...rakahSteps(r === 1, r === rakahs, r === 2 && rakahs > 2));
    return out;
  }, [rakahs]);
  const total = steps.reduce((a, s) => a + s.secs, 0);
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, []);
  const el = (now - t0) / 1000;
  let acc = 0,
    idx = steps.length;
  for (let i = 0; i < steps.length; i++) {
    if (el < acc + steps[i].secs) {
      idx = i;
      break;
    }
    acc += steps[i].secs;
  }
  const step = steps[idx];
  const pose = step?.pose ?? "sit";
  const poseRef = useRef<string>("");
  useEffect(() => {
    if (poseRef.current !== pose) {
      poseRef.current = pose;
      onPose(pose);
    }
  }, [pose, onPose]);
  useEffect(() => () => onPose(null), [onPose]);
  let rakah = 1,
    seen = 0;
  for (let i = 0; i <= Math.min(idx, steps.length - 1); i++) if (steps[i].name === "Qiyam") seen++;
  rakah = Math.max(1, Math.min(rakahs, seen));
  const left = Math.max(0, MIN_PRAYER_MS - (now - t0));
  const done = idx >= steps.length;
  const mm = Math.floor(left / 60000),
    ss = Math.floor((left % 60000) / 1000);
  return (
    <div className="space-y-3">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-[#1f6f63]">
        {title}
      </div>
      {!done ? (
        <div className="rounded-xl bg-[#1f6f63] p-4 text-[#fdf8ec]">
          <div className="text-[12px] uppercase tracking-[0.15em] text-[#e6b84a]">
            Rak'ah {rakah} of {rakahs} · {step.name}
          </div>
          <div className="mt-1 font-serif text-2xl leading-tight">{step.say}</div>
        </div>
      ) : (
        <div className="rounded-xl bg-[#1f6f63] p-4 text-[#fdf8ec]">
          <div className="text-[12px] uppercase tracking-[0.15em] text-[#e6b84a]">
            Dhikr after salah
          </div>
          <div className="mt-1 font-serif text-xl leading-snug">
            Astaghfirullah ×3 · SubhanAllah ×33 · Alhamdulillah ×33 · Allahu Akbar ×34
          </div>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[#10201e]/10">
        <div
          className="h-full rounded-full bg-[#e6b84a]"
          style={{ width: `${Math.min(100, (el / total) * 100)}%` }}
        />
      </div>
      <button
        disabled={left > 0}
        onClick={onFinish}
        className="w-full rounded-xl bg-[#10201e] py-3 font-bold text-[#fdf8ec] disabled:opacity-50"
      >
        {left > 0 ? `You can finish in ${mm}:${String(ss).padStart(2, "0")}` : "Finish my prayer"}
      </button>
      <p className="text-[12px] opacity-70">
        Take your time. Salah takes at least 3 minutes here, and you can stay as long as you like.
      </p>
    </div>
  );
}

/** The Hisbah officer stops you with one question. */
function HisbahStop({
  who,
  ask,
  onAnswer,
  sister,
}: {
  sister: boolean;
  who: string;
  ask: { kind: "prayer"; name: string } | { kind: "quran" };
  onAnswer: (yes: boolean) => string;
}) {
  const [reply, setReply] = useState<string | null>(null);
  const q =
    ask.kind === "prayer"
      ? `Assalamu alaykum, my ${sister ? "sister" : "brother"}. Have you prayed ${ask.name}?`
      : `Assalamu alaykum, my ${sister ? "sister" : "brother"}. Have you read the Qur'an today?`;
  return (
    <div className="space-y-2">
      <div className="max-w-[85%] rounded-2xl bg-white px-3 py-2 text-[14px]">{q}</div>
      {reply ? (
        <div className="max-w-[85%] rounded-2xl bg-white px-3 py-2 text-[14px]">{reply}</div>
      ) : (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setReply(onAnswer(true))}
            className="flex-1 rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
          >
            Yes, alhamdulillah
          </button>
          <button
            onClick={() => setReply(onAnswer(false))}
            className="flex-1 rounded-xl bg-[#b8573a] py-3 font-bold text-white"
          >
            Not yet
          </button>
        </div>
      )}
      <p className="text-[12px] opacity-60">{who} · Hisbah</p>
    </div>
  );
}

/* ---------------- first visit: welcome, account, character ---------------- */
const SKIN_TONES = [0x4a2c18, 0x5a3620, 0x6b4428, 0x8d5a36, 0xa86f45, 0xc58b5c];
const BROTHER_CLOTHES = [0xf4efe4, 0xcdb38a, 0x2f6f8f, 0x3d5a4a, 0x5a3f6a, 0x2a2a30];
const SISTER_CLOTHES = [0x1d1d26, 0x3d5a4a, 0x5a3f6a, 0x7d2f3a, 0x2a4a6a, 0xcdb38a];
const CAPS = [0xffffff, 0x2f8f83, 0x1d1d26, 0x7d2f3a, 0xd9b45a];
const HIJABS = [0xe9e2d0, 0x8a2f4f, 0x2a4a6a, 0x3d5a4a, 0x1d1d26];
/** More to buy in the clothes shop (₦500 each). */
const SHOP_THOBES = [
  ...BROTHER_CLOTHES,
  0x1f2f55,
  0x6a1f2a,
  0x8fb8d8,
  0x6b6b3a,
  0x8a8a8a,
  0x2f4a9a,
  0x6a4a2a,
  0x16161a,
];
const SHOP_ABAYAS = [
  ...SISTER_CLOTHES,
  0x2a2030,
  0x14324d,
  0x6a4a2a,
  0x8a8a8a,
  0x1f6f63,
  0x9a5a6a,
  0x3a3a46,
  0x5a2f2f,
];
const SHOP_CAPS = [...CAPS, 0xa83232, 0x1d6b3a, 0x2f4a9a, 0xcdb38a, 0x6a4a2a];
const SHOP_HIJABS = [
  ...HIJABS,
  0xd8c8a8,
  0xb36a8a,
  0x6a8ab3,
  0xf4f1ea,
  0x7d2f3a,
  0x1f6f63,
  0x9a7ab3,
  0xc58b5c,
];
const hex = (c: number) => "#" + c.toString(16).padStart(6, "0");
const goToLogin = (to: "/login" | "/signup") => {
  try {
    sessionStorage.setItem("ilmcity-return", "1");
  } catch {
    /* storage blocked */
  }
  window.location.href = to;
};

function Swatches({
  list,
  value,
  onPick,
  label,
}: {
  list: number[];
  value: number;
  onPick: (c: number) => void;
  label: string;
}) {
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold opacity-75">{label}</div>
      <div className="flex gap-2">
        {list.map((c) => (
          <button
            key={c}
            aria-label={label}
            onClick={() => onPick(c)}
            className={`size-9 rounded-full border-2 ${value === c ? "border-[#e6b84a] ring-2 ring-[#e6b84a]/50" : "border-black/10"}`}
            style={{ background: hex(c) }}
          />
        ))}
      </div>
    </div>
  );
}

function Onboarding({
  loggedIn,
  firstName,
  female,
  onPreview,
  onDone,
}: {
  loggedIn: boolean;
  firstName: string;
  female: boolean;
  onPreview: (look: Look | null) => void;
  onDone: (
    look: Look,
    area: string,
    path: LifePath,
    student?: { area: string; faculty: string },
  ) => void;
}) {
  const [step, setStep] = useState<"welcome" | "account" | "look" | "area" | "life" | "student">(
    "welcome",
  );
  const [path, setPath] = useState<LifePath>("worker");
  const [uni, setUni] = useState<string | null>(null);
  const [area, setArea] = useState("lekki");
  const [look, setLook] = useState<Look>({
    name: firstName,
    female,
    skin: SKIN_TONES[2],
    robe: female ? SISTER_CLOTHES[0] : BROTHER_CLOTHES[0],
    accent: female ? HIJABS[0] : CAPS[1],
  });
  const set = (p: Partial<Look>) => {
    const next = { ...look, ...p };
    if (p.female !== undefined && p.female !== look.female) {
      next.robe = p.female ? SISTER_CLOTHES[0] : BROTHER_CLOTHES[0];
      next.accent = p.female ? HIJABS[0] : CAPS[1];
    }
    setLook(next);
    onPreview(next);
  };
  useEffect(() => {
    if (step === "look") onPreview(look);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === "life")
    return (
      <div
        data-game-ui
        className="absolute inset-0 z-30 flex items-end bg-[#10201e]/70 p-3 pb-[max(14px,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto w-full max-w-md rounded-2xl bg-[#fdf8ec] p-4 shadow-2xl">
          <h2 className="font-serif text-2xl">Choose your life</h2>
          <p className="text-[13px] opacity-75">You can take a job or open a shop later too.</p>
          <div className="mt-3 space-y-2">
            {LIFE_PATHS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPath(p.id);
                  setStep("student");
                }}
                className="flex w-full items-start gap-3 rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-3 text-left active:bg-[#1f6f63]/10"
              >
                <span className="text-[28px] leading-none">{p.icon}</span>
                <span>
                  <span className="block text-[16px] font-bold">{p.name}</span>
                  <span className="block text-[13px] opacity-75">{p.text}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );

  if (step === "student")
    return (
      <div
        data-game-ui
        className="absolute inset-0 z-30 flex items-end bg-[#10201e]/70 p-3 pb-[max(14px,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex max-h-[86%] w-full max-w-md flex-col rounded-2xl bg-[#fdf8ec] p-4 shadow-2xl">
          <h2 className="font-serif text-2xl">
            {uni ? "Which faculty?" : "Are you a university student?"}
          </h2>
          <p className="text-[13px] opacity-75">
            {uni
              ? "You'll answer questions in your faculty and meet other Muslim students."
              : "Students get faculty classes, questions and the MSSN meeting point."}
          </p>
          <div className="mt-3 space-y-2 overflow-y-auto">
            {!uni &&
              UNIVERSITIES.map((u) => (
                <button
                  key={u.area}
                  onClick={() => setUni(u.area)}
                  className="w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-3 text-left"
                >
                  <span className="block text-[16px] font-bold">🎓 {u.name}</span>
                  <span className="block text-[13px] opacity-75">{u.full}</span>
                </button>
              ))}
            {uni &&
              facultiesOf(uni).map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    onDone({ ...look, name: look.name.trim() }, area, path, {
                      area: uni,
                      faculty: f.id,
                    })
                  }
                  className="w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-3 text-left text-[15px] font-bold"
                >
                  {f.name}
                </button>
              ))}
            <button
              onClick={() =>
                uni ? setUni(null) : onDone({ ...look, name: look.name.trim() }, area, path)
              }
              className="w-full rounded-xl bg-[#1f6f63] px-4 py-3 font-bold text-[#fdf8ec]"
            >
              {uni ? "Back" : "No, I'm not a student"}
            </button>
          </div>
        </div>
      </div>
    );

  if (step === "area")
    return (
      <div
        data-game-ui
        className="absolute inset-0 z-30 flex items-end bg-[#10201e]/70 p-3 pb-[max(14px,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex max-h-[86%] w-full max-w-md flex-col rounded-2xl bg-[#fdf8ec] p-4 shadow-2xl">
          <h2 className="font-serif text-2xl">Where do you want to start?</h2>
          <p className="text-[13px] opacity-75">You can travel anywhere later by danfo or car.</p>
          <div className="mt-3 space-y-2 overflow-y-auto">
            {DISTRICTS.filter((d) => !d.landmarks.some((l) => l.kind === "airport")).map(
              (d, i, all) => (
                <div key={d.id}>
                  {(i === 0 || cityOf(all[i - 1]) !== cityOf(d)) && (
                    <div className="mb-1 mt-2 text-[12px] font-bold uppercase tracking-wide text-[#1f6f63]">
                      {WORLD_CITIES.find((w) => w.id === cityOf(d))?.name ?? "Lagos"}, {d.state}{" "}
                      State
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setArea(d.id);
                      setStep("life");
                    }}
                    className="w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-2.5 text-left active:bg-[#1f6f63]/10"
                  >
                    <div className="text-[15px] font-bold">{fullName(d)}</div>
                    <div className="text-[12px] opacity-75">
                      {[
                        STREETS[d.streets[0].id]?.name,
                        ...d.landmarks.filter((l) => l.kind !== "home").map((l) => l.name),
                      ]
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(" · ")}
                    </div>
                  </button>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    );

  if (step === "welcome")
    return (
      <div
        data-game-ui
        className="absolute inset-0 z-30 flex flex-col justify-end bg-gradient-to-t from-[#10201e] via-[#10201e]/70 to-transparent p-5 pb-[max(28px,env(safe-area-inset-bottom))] text-[#fdf8ec]"
      >
        <div className="mx-auto w-full max-w-md">
          <div className="font-serif text-5xl leading-none">
            Ilm<span className="text-[#45b8a8]">World</span>
          </div>
          <p className="mt-3 text-[16px] leading-snug opacity-90">
            A Muslim world in Lagos and Ilorin that runs on real prayer times. Pray, learn, travel
            by danfo, rent a home and run your own business.
          </p>
          <ul className="mt-4 space-y-1.5 text-[14px] opacity-90">
            <li>🕌 Mosques with lectures, jama'ah and quizzes</li>
            <li>🏫 Schools with classes, books and tests</li>
            <li>🏠 Houses to rent, land to build on, shops to run</li>
          </ul>
          <button
            onClick={() => setStep("account")}
            className="mt-6 w-full rounded-2xl bg-[#e6b84a] py-4 text-[17px] font-extrabold text-[#2a1c05] shadow-xl active:scale-[0.98]"
          >
            Start
          </button>
        </div>
      </div>
    );

  if (step === "account")
    return (
      <div
        data-game-ui
        className="absolute inset-0 z-30 flex items-end bg-[#10201e]/70 p-4 pb-[max(20px,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto w-full max-w-md rounded-2xl bg-[#fdf8ec] p-5 shadow-2xl">
          {loggedIn ? (
            <>
              <h2 className="font-serif text-2xl">
                Assalamu alaykum{firstName ? `, ${firstName}` : ""}!
              </h2>
              <p className="mt-2 text-[15px]">
                You are logged in to IlmStation, so your city progress is kept with your account.
              </p>
              <button
                onClick={() => setStep("look")}
                className="mt-5 w-full rounded-xl bg-[#1f6f63] py-3.5 font-bold text-[#fdf8ec]"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl">Save your progress</h2>
              <p className="mt-2 text-[15px]">
                Log in with your IlmStation account to keep your money, home and shop on every
                device.
              </p>
              <button
                onClick={() => goToLogin("/login")}
                className="mt-5 w-full rounded-xl bg-[#1f6f63] py-3.5 font-bold text-[#fdf8ec]"
              >
                Log in
              </button>
              <button
                onClick={() => goToLogin("/signup")}
                className="mt-2 w-full rounded-xl border border-[#1f6f63]/40 bg-white py-3.5 font-bold text-[#1f6f63]"
              >
                Create a free account
              </button>
              <button
                onClick={() => setStep("look")}
                className="mt-2 w-full py-3 text-[15px] font-semibold text-[#10201e]/80 underline underline-offset-4"
              >
                Play as a guest
              </button>
              <p className="mt-1 text-center text-[12px] opacity-60">
                Guests can explore, pray and learn. Log in to rent houses, shops and land.
              </p>
            </>
          )}
        </div>
      </div>
    );

  return (
    <div
      data-game-ui
      className="absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(14px,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto w-full max-w-md rounded-2xl bg-[#fdf8ec] p-4 shadow-2xl">
        <h2 className="font-serif text-xl">Create your character</h2>
        <input
          value={look.name}
          maxLength={20}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Your name"
          className="mt-2 w-full rounded-xl border border-[#1f6f63]/30 bg-white px-3 py-2.5 text-[15px]"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[false, true].map((f) => (
            <button
              key={String(f)}
              onClick={() => set({ female: f })}
              className={`rounded-xl py-2.5 font-bold ${look.female === f ? "bg-[#1f6f63] text-[#fdf8ec]" : "border border-[#1f6f63]/30 bg-white"}`}
            >
              {f ? "Sister" : "Brother"}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2.5">
          <Swatches
            label="Skin tone"
            list={SKIN_TONES}
            value={look.skin}
            onPick={(c) => set({ skin: c })}
          />
          <Swatches
            label={look.female ? "Abaya" : "Thobe"}
            list={look.female ? SISTER_CLOTHES : BROTHER_CLOTHES}
            value={look.robe}
            onPick={(c) => set({ robe: c })}
          />
          <Swatches
            label={look.female ? "Hijab" : "Cap"}
            list={look.female ? HIJABS : CAPS}
            value={look.accent}
            onPick={(c) => set({ accent: c })}
          />
        </div>
        <button
          disabled={!look.name.trim()}
          onClick={() => setStep("area")}
          className="mt-4 w-full rounded-xl bg-[#e6b84a] py-3.5 text-[16px] font-extrabold text-[#2a1c05] disabled:opacity-50"
        >
          Next: choose where to start
        </button>
      </div>
    </div>
  );
}

/* ---------------- guided first minutes ---------------- */
type GuideStep = {
  id: string;
  title: string;
  text: string;
  /** a button that shows the way to a place */
  go?: { prefix: string; label: string };
  /** a button that opens a screen */
  open?: { what: "jobs" | "profile" | "wallet" | "clothes"; label: string };
  /** nothing to do but read: a Next button */
  next?: boolean;
};
/** The first ten minutes: each step is done by doing it (or by Next, for the ones to read). */
const GUIDE: GuideStep[] = [
  {
    id: "wudu",
    title: "Make wudu",
    text: "You are home. Walk to the bathroom and make wudu, step by step.",
    go: { prefix: "bath", label: "Show me the bathroom" },
  },
  {
    id: "masjid",
    title: "Visit the masjid",
    text: "Go outside and walk to the nearest mosque. Follow the gold arrow.",
    go: { prefix: "door:masjid:", label: "Show me the way" },
  },
  {
    id: "learn",
    title: "Pray or learn",
    text: "Inside, pray, listen to a lecture or take the quiz. You earn money and Ilm.",
  },
  {
    id: "profile",
    title: "Your profile",
    text: "Tap 👤 Profile at the top: your money, your Ilm and title, your rent and everything you own.",
    open: { what: "profile", label: "Open my profile" },
  },
  {
    id: "job",
    title: "Get a job",
    text: "Choose a job that suits you. Work your shift each day to earn your salary. More Ilm means more pay.",
    open: { what: "jobs", label: "Choose a job" },
  },
  {
    id: "rent",
    title: "Pay your rent",
    text: "Your flat has weekly rent, set by the area. The first week is paid. After that, pay in 👤 Profile → Pay rent, or the landlord stops you at the door.",
    next: true,
  },
  {
    id: "clothes",
    title: "Your clothes",
    text: "Look at the clothes shop: new thobes, abayas, caps and hijabs cost ₦500 each. What you own, you can change into for free.",
    open: { what: "clothes", label: "Open the clothes shop" },
  },
  {
    id: "wallet",
    title: "Your wallet",
    text: "Open 📱 Phone → Wallet: see your naira and send money to a friend with their IlmWorld number.",
    open: { what: "wallet", label: "Open my wallet" },
  },
  {
    id: "ride",
    title: "Ride a keke or danfo",
    text: "Stand by the road and a keke will stop for you, or take a danfo from a bus stop to another area.",
    go: { prefix: "busstop:", label: "Show me a bus stop" },
  },
  {
    id: "play",
    title: "Play with others",
    text: "Football at the pitch, skipping rope at the Sisters' Corner, and table tennis for brothers and sisters. Real players can join you.",
    go: { prefix: "field:", label: "Show me the pitch" },
    next: true,
  },
];

function Guide({
  step,
  onGo,
  onOpen,
  onNext,
  onSkip,
}: {
  step: number;
  onGo: (prefix: string) => void;
  onOpen: (what: NonNullable<GuideStep["open"]>["what"]) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const g = GUIDE[step - 1];
  if (!g) return null;
  return (
    <div
      data-game-ui
      className="pointer-events-none absolute inset-x-3 bottom-[190px] z-10 flex justify-center"
    >
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border-2 border-[#e6b84a] bg-[#10201e]/92 p-3 text-[#fdf8ec] shadow-2xl">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e6b84a]">
            Step {step} of {GUIDE.length} · +₦100
          </div>
          <button onClick={onSkip} className="text-[11px] opacity-60 underline">
            Skip guide
          </button>
        </div>
        <div className="mt-0.5 text-[16px] font-bold">{g.title}</div>
        <div className="text-[13px] opacity-85">{g.text}</div>
        {g.go && (
          <button
            onClick={() => onGo(g.go!.prefix)}
            className="mt-2 rounded-lg bg-[#e6b84a] px-3 py-1.5 text-[13px] font-bold text-[#2a1c05]"
          >
            {g.go.label}
          </button>
        )}
        {g.open && (
          <button
            onClick={() => onOpen(g.open!.what)}
            className="mt-2 rounded-lg bg-[#e6b84a] px-3 py-1.5 text-[13px] font-bold text-[#2a1c05]"
          >
            {g.open.label}
          </button>
        )}
        {g.next && (
          <button
            onClick={onNext}
            className="ml-2 mt-2 rounded-lg border border-[#e6b84a] px-3 py-1.5 text-[13px] font-bold text-[#e6b84a]"
          >
            {step === GUIDE.length ? "Got it" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}

/** Asking a guest to log in before they rent or buy. */
function LoginFirst({ what }: { what: string }) {
  return (
    <div className="space-y-2">
      <p>Log in with your IlmStation account to {what}. Your progress as a guest comes with you.</p>
      <button
        onClick={() => goToLogin("/login")}
        className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
      >
        Log in
      </button>
      <button
        onClick={() => goToLogin("/signup")}
        className="w-full rounded-xl border border-[#1f6f63]/40 bg-white py-3 font-bold text-[#1f6f63]"
      >
        Create a free account
      </button>
    </div>
  );
}

/* ---------------- places to visit ---------------- */
type Place = { icon: string; name: string; sub: string; prefix: string };
const ICON: Record<string, string> = {
  masjid: "🕌",
  school: "🏫",
  campus: "🏫",
  home: "🏠",
  souq: "🛍️",
  mansion: "🏡",
  office: "🏢",
  market: "🛒",
  faculty: "🎓",
  field: "⚽",
  hangout: "🤝",
};
function placesIn(id: string): Place[] {
  const D = districtById(id);
  const out: Place[] = D.landmarks.map((l) => ({
    icon: ICON[l.kind] ?? "📍",
    name: l.name,
    sub: STREETS[l.street]?.name ?? "",
    prefix:
      l.kind === "masjid"
        ? `door:masjid:${l.id}`
        : l.kind === "school"
          ? `door:madrasah:${l.id}`
          : l.kind === "home"
            ? "door:home:"
            : l.kind === "souq"
              ? "souq"
              : l.kind === "campus"
                ? `campus:${l.id}:admin`
                : l.kind === "market"
                  ? `stall:${D.id}-m`
                  : `${l.kind}:${l.id}`,
  }));
  if (!D.landmarks.some((l) => l.kind === "market"))
    out.push({
      icon: "🛒",
      name: `${D.name} Market`,
      sub: "Stalls for rent · ₦2,000 a week",
      prefix: `stall:${D.id}-m`,
    });
  if (!D.landmarks.some((l) => l.kind === "field"))
    out.push({
      icon: "⚽",
      name: `${D.name} Football Pitch`,
      sub: "Play a match",
      prefix: `field:${D.id}-pitch`,
    });
  if (D.id === "ikeja")
    out.push({
      icon: "🏬",
      name: "IlmWorld Mall",
      sub: "Shops by real sellers",
      prefix: "door:mall:ikeja",
    });
  if (D.id === "ikeja" || D.id === "lekki")
    out.push({
      icon: "🚗",
      name: "IlmMotors",
      sub: "Buy a car",
      prefix: `dealer:${D.id}`,
    });
  out.push({
    icon: "🏓",
    name: `${D.name} Table Tennis`,
    sub: "Brothers and sisters welcome",
    prefix: `tennis:${D.id}`,
  });
  out.push({
    icon: "🪢",
    name: "Sisters' Corner",
    sub: "Skipping rope with the sisters",
    prefix: `sisters:${D.id}`,
  });
  out.push({
    icon: "🏪",
    name: "Shops to let",
    sub: "Lock-up shops on the streets",
    prefix: `shop:${D.id}-`,
  });
  out.push({
    icon: "🏘️",
    name: "Houses to let and land for sale",
    sub: "Look for the red and white signs",
    prefix: `plot:${D.id}-`,
  });
  out.push({
    icon: "🚌",
    name: `${D.busStop ?? D.name} Bus Stop`,
    sub: "Danfo to other areas",
    prefix: "busstop:",
  });
  return out;
}
function PlacesView({ area, onGo }: { area: string; onGo: (prefix: string) => void }) {
  return (
    <div className="space-y-2">
      {placesIn(area).map((p) => (
        <button
          key={p.name}
          onClick={() => onGo(p.prefix)}
          className="flex w-full items-center gap-3 rounded-xl border border-[#1f6f63]/20 bg-white px-3 py-2.5 text-left"
        >
          <span className="text-[22px]">{p.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold leading-tight">{p.name}</span>
            <span className="block truncate text-[12px] opacity-70">{p.sub}</span>
          </span>
          <span className="rounded-lg bg-[#1f6f63] px-2.5 py-1 text-[12px] font-bold text-[#fdf8ec]">
            Go
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- wash your hands, then eat ---------------- */
function MealView({ dish, onEat }: { dish: Dish; onEat: () => void }) {
  const [step, setStep] = useState<"wash" | "washing" | "eat">("wash");
  useEffect(() => {
    if (step !== "washing") return;
    const t = setTimeout(() => setStep("eat"), 2000);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div className="space-y-3">
      <div className="text-center text-[52px] leading-none">{dish.icon}</div>
      <button
        disabled={step !== "wash"}
        onClick={() => setStep("washing")}
        className={`w-full rounded-xl px-4 py-3 text-left font-bold ${step === "wash" ? "bg-[#1f6f63] text-[#fdf8ec]" : "border border-[#1f6f63]/30 bg-white"}`}
      >
        {step === "wash"
          ? "🧼 1. Wash your hands"
          : step === "washing"
            ? "🧼 Washing…"
            : "✅ Hands washed"}
      </button>
      <button
        disabled={step !== "eat"}
        onClick={onEat}
        className={`w-full rounded-xl px-4 py-3 text-left font-bold ${step === "eat" ? "bg-[#f2c230] text-[#2a1c05]" : "border border-[#10201e]/15 bg-white opacity-50"}`}
      >
        🍽️ 2. Say Bismillah and eat
      </button>
      <p className="text-[12px] opacity-70">
        Eat with your right hand, from what is in front of you.
      </p>
    </div>
  );
}

/* ---------------- IlmMotors ---------------- */
type CarKind = "small" | "sedan" | "pickup" | "suv" | "luxury";
const CARS: { kind: CarKind; price: number }[] = [
  { kind: "small", price: 300 },
  { kind: "sedan", price: 600 },
  { kind: "pickup", price: 750 },
  { kind: "suv", price: 1200 },
  { kind: "luxury", price: 2500 },
];
const PAINT = [0xf4f4f2, 0x1d1d26, 0xc0392b, 0x1f6f63, 0x2f4a7a, 0xb8bcc2, 0xe6b84a, 0x6d4a2b];
const REPAINT = 60;
function DealerView({
  points,
  mine,
  onBuy,
}: {
  points: number;
  mine?: { kind: CarKind; color: number };
  onBuy: (kind: CarKind, color: number, price: number) => void;
}) {
  const [color, setColor] = useState<number>(mine?.color ?? PAINT[0]);
  const hex = (c: number) => "#" + c.toString(16).padStart(6, "0");
  return (
    <div className="space-y-3">
      <p className="text-[13px] opacity-75">
        Pick a colour, then a car. You have {N(points)}. Your old car is traded in.
      </p>
      <div className="flex flex-wrap gap-2">
        {PAINT.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`size-8 rounded-full border-2 ${color === c ? "border-[#10201e] ring-2 ring-[#f2c230]" : "border-[#10201e]/20"}`}
            style={{ background: hex(c) }}
            aria-label="Colour"
          />
        ))}
      </div>
      <div className="space-y-2">
        {CARS.map(({ kind, price }) => {
          const v = VEHICLE_INFO[kind];
          const owned = mine?.kind === kind;
          const cost = owned ? (mine.color === color ? 0 : REPAINT) : price;
          return (
            <div
              key={kind}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm"
            >
              <span className="text-[26px]">
                {kind === "pickup" ? "🛻" : kind === "suv" ? "🚙" : "🚗"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold">{v.name}</span>
                <span className="block text-[12px] opacity-70">
                  {v.blurb} Top speed {Math.round((v.top + 4) * 3.6)} km/h.
                </span>
              </span>
              <button
                disabled={owned && cost === 0}
                onClick={() => onBuy(kind, color, cost)}
                className="rounded-lg bg-[#f2c230] px-3 py-2 text-[12.5px] font-bold disabled:opacity-50"
              >
                {owned ? (cost ? `Repaint · ${N(cost)}` : "Yours") : `${N(price)}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- rooms to let between players ---------------- */
function RoomsMarketView({
  net,
  me,
  points,
  lodging,
  onRent,
  onGo,
}: {
  net: RoomsNet;
  me: string;
  points: number;
  lodging?: Save["lodging"];
  onRent: (r: RoomAd) => void;
  onGo: (l: { area: string; plot: string }) => void;
}) {
  const [list, setList] = useState<RoomAd[] | null>(null);
  useEffect(() => net.watchFree(setList), [net]);
  const mine = lodging && lodging.until > Date.now() ? lodging : null;
  const rooms = (list ?? []).filter((r) => r.owner !== me);
  return (
    <div className="space-y-3">
      {mine && (
        <div className="rounded-xl bg-[#1f6f63] px-3 py-2.5 text-[#fdf8ec]">
          <div className="text-[12px] opacity-80">Your room</div>
          <div className="text-[14px] font-bold">{mine.label}</div>
          <div className="text-[12px] opacity-80">
            {mine.owner}'s house · {Math.ceil((mine.until - Date.now()) / 86400000)} days left
          </div>
          <button
            onClick={() => onGo(mine)}
            className="mt-1.5 rounded-lg bg-[#fdf8ec] px-3 py-1.5 text-[12px] font-bold text-[#1f6f63]"
          >
            Go there
          </button>
        </div>
      )}
      <p className="text-[13px] opacity-75">
        Rooms in houses owned by other players. Rent is paid for a week at a time. You have{" "}
        {N(points)}.
      </p>
      {!list && <p className="text-[13px] opacity-70">Loading rooms…</p>}
      {list && rooms.length === 0 && (
        <p className="text-[13px] opacity-70">No rooms listed right now. Check again later.</p>
      )}
      <div className="space-y-2">
        {rooms.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm"
          >
            <span className="text-[22px]">🛏️</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">{r.label}</span>
              <span className="block text-[11.5px] opacity-60">
                Room {r.i + 1} · {r.ownerName}'s house
              </span>
            </span>
            <button
              disabled={!!mine}
              onClick={() => onRent(r)}
              className="rounded-lg bg-[#f2c230] px-2.5 py-1.5 text-[12px] font-bold disabled:opacity-40"
            >
              Rent · {N(r.rent)}/wk
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- homes on show ---------------- */
function HomesView({
  homes,
  me,
  myItems,
  open,
  onOpen,
  onVisit,
}: {
  homes: Homes;
  me: string | null;
  myItems: number;
  open: boolean;
  onOpen: (on: boolean) => void;
  onVisit: (h: ShownHome) => void;
}) {
  const [isOpen, setIsOpen] = useState(open);
  const [list, setList] = useState<ShownHome[] | null>(null);
  useEffect(() => homes.top(setList), [homes]);
  const mine = list?.find((h) => h.uid === me);
  const others = (list ?? []).filter((h) => h.uid !== me);
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#c77d2a] px-3 py-2.5 text-white">
        <div className="text-[15px] font-black">🏆 Best home of the week</div>
        <div className="text-[12px] opacity-90">
          Visit homes and like the ones you love. Every Saturday the best furnished home wins.
        </div>
      </div>
      <div className="rounded-xl bg-white px-3 py-2 text-[13px] shadow-sm">
        {myItems === 0
          ? "Your home isn't on show yet. Buy furniture from 👤 Profile → Furnish your home."
          : `Your home: ❤️ ${mine?.likes ?? 0} likes this week · ${myItems} items`}
      </div>
      <label className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-[13px] shadow-sm">
        <input
          type="checkbox"
          checked={isOpen}
          onChange={(e) => {
            setIsOpen(e.target.checked);
            onOpen(e.target.checked);
          }}
          className="size-5 accent-[#1f6f63]"
        />
        <span>
          <b>Open house</b>
          <span className="block text-[11.5px] opacity-65">
            {isOpen
              ? "Anyone can walk in. You can still ask a guest to leave."
              : "Visitors knock and wait for you to let them in."}
          </span>
        </span>
      </label>
      {!list && <p className="text-[13px] opacity-70">Loading homes…</p>}
      {list && others.length === 0 && (
        <p className="text-[13px] opacity-70">No other homes on show yet.</p>
      )}
      <div className="space-y-2">
        {others.map((h, i) => (
          <div
            key={h.uid}
            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm"
          >
            <span className="w-6 text-center text-[13px] font-bold opacity-60">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">{h.name}'s home</span>
              <span className="block truncate text-[11.5px] opacity-60">
                {h.place} · {h.items.length} items
              </span>
            </span>
            <span className="text-[12.5px] font-bold">❤️ {h.likes}</span>
            <button
              onClick={() => onVisit(h)}
              className="rounded-lg bg-[#1f6f63] px-2.5 py-1.5 text-[12px] font-bold text-white"
            >
              {h.open ? "Visit" : "Knock"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- calls and contacts ---------------- */
type Contact = { uid: string; name: string; number: string };
function CallsView({
  tab,
  myNumber,
  contacts,
  log,
  lookup,
  onCall,
  onMessage,
  onSave,
  onRemove,
}: {
  tab: "calls" | "contacts";
  myNumber: string;
  contacts: Contact[];
  log: NonNullable<Save["calls"]>;
  lookup: (n: string) => Promise<PhoneEntry | null>;
  onCall: (e: Contact) => void;
  onMessage: (e: Contact) => void;
  onSave: (e: Contact) => void;
  onRemove: (n: string) => void;
}) {
  const [num, setNum] = useState("");
  const [found, setFound] = useState<PhoneEntry | null>(null);
  const [err, setErr] = useState("");
  const [list, setList] = useState(contacts);
  const find = async () => {
    setErr("");
    setFound(null);
    const n = cleanNumber(num);
    if (!n) return setErr("IlmWorld numbers have 7 digits, like IW 482 1937.");
    const e = await lookup(n).catch(() => null);
    if (!e) return setErr("No player has that number.");
    setFound(e);
  };
  const row = (c: Contact) => (
    <div key={c.number} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
      <span className="grid size-9 place-items-center rounded-full bg-[#8a2f4f] text-[15px] font-bold text-white">
        {c.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold">{c.name}</span>
        <span className="block text-[11.5px] opacity-60">{c.number}</span>
      </span>
      <button
        onClick={() => onMessage(c)}
        className="rounded-full bg-[#1f6f63]/10 px-2.5 py-1.5 text-[15px]"
        aria-label="Message"
      >
        💬
      </button>
      <button
        onClick={() => onCall(c)}
        className="rounded-full bg-[#2e7d32] px-2.5 py-1.5 text-[15px]"
        aria-label="Call"
      >
        📞
      </button>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#1f6f63] px-3 py-2 text-[#fdf8ec]">
        <div className="text-[11px] opacity-80">My IlmWorld number</div>
        <div className="text-[18px] font-bold tracking-wide">{myNumber}</div>
      </div>
      <div className="flex gap-2">
        <input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          inputMode="numeric"
          placeholder="IW 000 0000"
          className="min-w-0 flex-1 rounded-xl border border-[#10201e]/15 bg-white px-3 py-2 text-[15px] tracking-wide"
        />
        <button
          onClick={() => void find()}
          className="rounded-xl bg-[#10201e] px-3 py-2 text-[13px] font-bold text-white"
        >
          Find
        </button>
      </div>
      {err && <p className="text-[12.5px] text-[#b8573a]">{err}</p>}
      {found && (
        <div className="space-y-2 rounded-xl border border-[#1f6f63]/30 p-2">
          {row(found)}
          {!list.some((c) => c.number === found.number) && (
            <button
              onClick={() => {
                onSave(found);
                setList((l) => [...l, found]);
              }}
              className="w-full rounded-lg bg-[#f2c230] py-2 text-[13px] font-bold"
            >
              ＋ Save to contacts
            </button>
          )}
        </div>
      )}
      {tab === "contacts" ? (
        <div className="space-y-2">
          <div className="text-[12px] font-bold uppercase opacity-60">Contacts</div>
          {list.length === 0 && (
            <p className="text-[13px] opacity-70">
              No contacts yet. Ask a friend for their IlmWorld number and find it above.
            </p>
          )}
          {list.map((c) => (
            <div key={c.number} className="space-y-1">
              {row(c)}
              <button
                onClick={() => {
                  onRemove(c.number);
                  setList((l) => l.filter((x) => x.number !== c.number));
                }}
                className="ml-1 text-[11px] opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[12px] font-bold uppercase opacity-60">Recent</div>
          {log.length === 0 && <p className="text-[13px] opacity-70">No calls yet.</p>}
          {log.map((l, i) => {
            const c = list.find((x) => x.number === l.number);
            return (
              <div key={i} className="flex items-center gap-2 text-[13.5px]">
                <span>{l.dir === "out" ? "↗️" : l.dir === "in" ? "↙️" : "❌"}</span>
                <span
                  className={`flex-1 font-semibold ${l.dir === "missed" ? "text-[#b8573a]" : ""}`}
                >
                  {l.name}
                </span>
                <span className="text-[11px] opacity-50">
                  {new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {c && (
                  <button onClick={() => onCall(c)} className="text-[15px]" aria-label="Call back">
                    📞
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11px] opacity-55">
        Calls are voice only, between players aged 18+. Be kind; you can block anyone from their
        chat.
      </p>
    </div>
  );
}

function IncomingCall({
  from,
  onAccept,
  onDecline,
}: {
  from: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div data-game-ui className="absolute inset-x-3 top-3 z-50 mx-auto max-w-sm">
      <div className="flex items-center gap-3 rounded-[26px] bg-[#111]/95 px-4 py-3 text-white shadow-2xl">
        <span className="grid size-11 animate-pulse place-items-center rounded-full bg-[#2e7d32] text-[20px]">
          📞
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold">{from}</div>
          <div className="text-[12px] opacity-70">IlmWorld call…</div>
        </div>
        <button
          onClick={onDecline}
          className="grid size-11 place-items-center rounded-full bg-[#c0392b] text-[18px]"
          aria-label="Decline"
        >
          ✕
        </button>
        <button
          onClick={onAccept}
          className="grid size-11 place-items-center rounded-full bg-[#2e7d32] text-[18px]"
          aria-label="Answer"
        >
          ✓
        </button>
      </div>
    </div>
  );
}

function CallScreen({
  c,
  onMute,
  onHangUp,
}: {
  c: CallUi;
  onMute: (m: boolean) => void;
  onHangUp: () => void;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const secs = c.since ? Math.floor((Date.now() - c.since) / 1000) : 0;
  const status =
    c.state === "ringing"
      ? "Ringing…"
      : c.state === "connecting"
        ? "Connecting…"
        : c.state === "live"
          ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
          : (c.why ?? "Call ended");
  return (
    <div data-game-ui className="absolute inset-x-3 top-3 z-50 mx-auto max-w-sm">
      <div className="rounded-[28px] bg-gradient-to-b from-[#1f3d37] to-[#10201e] px-5 py-4 text-center text-white shadow-2xl">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-white/15 text-[24px] font-bold">
          {c.other.slice(0, 1).toUpperCase()}
        </div>
        <div className="mt-1.5 text-[17px] font-bold">{c.other}</div>
        <div className="text-[13px] opacity-75">{status}</div>
        {c.state !== "ended" && (
          <div className="mt-3 flex justify-center gap-6">
            <button
              onClick={() => onMute(!c.muted)}
              className={`grid size-12 place-items-center rounded-full text-[18px] ${c.muted ? "bg-white text-[#10201e]" : "bg-white/15"}`}
              aria-label="Mute"
            >
              {c.muted ? "🔇" : "🎙️"}
            </button>
            <button
              onClick={onHangUp}
              className="grid size-12 place-items-center rounded-full bg-[#c0392b] text-[18px]"
              aria-label="Hang up"
            >
              📵
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- wallet ---------------- */
function WalletView({
  points,
  txns,
  online,
  onSend,
}: {
  points: number;
  txns: NonNullable<Save["txns"]>;
  online: boolean;
  onSend: (number: string, units: number, note: string) => Promise<string | null>;
}) {
  const [tab, setTab] = useState<"wallet" | "send">("wallet");
  const [num, setNum] = useState("");
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bal, setBal] = useState(points);
  const [log, setLog] = useState(txns);
  const toGo = Math.max(0, MIN_WITHDRAW - bal);
  const tabs = (
    <div className="flex gap-1 rounded-xl bg-[#10201e]/6 p-1">
      {(["wallet", "send"] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`flex-1 rounded-lg py-1.5 text-[13px] font-bold ${tab === t ? "bg-white shadow-sm" : "opacity-60"}`}
        >
          {t === "wallet" ? "💰 Wallet" : "📤 Send money"}
        </button>
      ))}
    </div>
  );
  if (tab === "send") {
    const naira = Math.floor(Number(amt.replace(/[^0-9]/g, "")) || 0);
    const units = Math.floor(naira / NAIRA_PER_POINT);
    return (
      <div className="space-y-3">
        {tabs}
        <p className="text-[13px] opacity-75">
          Send IlmWorld naira to another player with their IlmWorld number (Phone → Calls shows
          yours). You have {N(bal)}.
        </p>
        <input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="IlmWorld number, e.g. IW 482 1937"
          className="w-full rounded-xl border border-[#10201e]/15 bg-white px-3 py-2.5 text-[15px]"
        />
        <input
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          inputMode="numeric"
          placeholder="Amount in ₦ (e.g. 500)"
          className="w-full rounded-xl border border-[#10201e]/15 bg-white px-3 py-2.5 text-[15px]"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
          placeholder="Note (optional)"
          className="w-full rounded-xl border border-[#10201e]/15 bg-white px-3 py-2.5 text-[15px]"
        />
        {err && <p className="text-[13px] font-bold text-[#b3261e]">{err}</p>}
        <button
          disabled={busy || !online || !num.trim() || units < 1}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            const e = await onSend(num, units, note);
            setBusy(false);
            if (e) {
              setErr(e);
              return;
            }
            setBal((b) => b - units);
            setLog((l) => [{ dir: "out", name: num, amount: units, note, at: Date.now() }, ...l]);
            setNum("");
            setAmt("");
            setNote("");
            setTab("wallet");
          }}
          className="w-full rounded-xl bg-[#1d6b3a] py-3 font-bold text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : units >= 1 ? `Send ${N(units)}` : "Send"}
        </button>
        {!online && <p className="text-[12.5px] opacity-75">Log in to IlmStation to send money.</p>}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {tabs}
      <div className="rounded-2xl bg-gradient-to-br from-[#1d6b3a] to-[#10201e] p-4 text-white">
        <div className="text-[12px] opacity-80">IlmWorld naira</div>
        <div className="text-[30px] font-black leading-tight">{N(bal)}</div>
        <div className="text-[13px] opacity-85">
          Cash value ₦{Math.floor((bal * NAIRA_PER_POINT) / CASH_RATE).toLocaleString()}
        </div>
      </div>
      {log.length > 0 && (
        <div className="space-y-1 rounded-xl bg-white p-3 text-[13px] shadow-sm">
          <div className="font-bold">Recent</div>
          {log.slice(0, 8).map((t, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="truncate">
                {t.dir === "in" ? "From" : "To"} {t.name}
                {t.note ? ` · ${t.note}` : ""}
              </span>
              <b className={t.dir === "in" ? "text-[#1d6b3a]" : ""}>
                {t.dir === "in" ? "+" : "−"}
                {N(t.amount)}
              </b>
            </div>
          ))}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[#10201e]/10">
        <div
          className="h-full rounded-full bg-[#1d6b3a]"
          style={{ width: `${Math.min(100, (bal / MIN_WITHDRAW) * 100)}%` }}
        />
      </div>
      <p className="text-[12.5px] opacity-75">
        {toGo > 0
          ? `${N(toGo)} more to reach the ${N(MIN_WITHDRAW)} minimum to cash out.`
          : "You've reached the minimum to cash out."}
      </p>
      <button
        disabled
        className="w-full rounded-xl bg-[#1d6b3a] py-3 font-bold text-white opacity-50"
      >
        Cash out to bank · coming soon
      </button>
      <div className="space-y-1 rounded-xl bg-white p-3 text-[12.5px] shadow-sm">
        <div className="font-bold">How cashing out will work</div>
        <div>
          • {N(CASH_RATE)} in the game = ₦{NAIRA_PER_POINT} in your Nigerian bank account.
        </div>
        <div>• Only money you earn (salah on time, lectures, quizzes, work) can be cashed out.</div>
        <div>• Up to 2 cash-outs a week, for players aged 18+ with a verified account.</div>
        <div>• Every request is checked by the IlmWorld team before payment.</div>
      </div>
    </div>
  );
}

/* ---------------- the phone ---------------- */
function PhoneFrame({
  title,
  onHome,
  onClose,
  children,
}: {
  title: string;
  onHome?: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(iv);
  }, []);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div
      data-game-ui
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-3"
      onClick={onClose}
    >
      <div
        className="relative flex h-[min(86vh,720px)] w-[min(92vw,360px)] flex-col overflow-hidden rounded-[44px] border-[10px] border-[#111] bg-[#111] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute left-1/2 top-1.5 z-10 h-[22px] w-[96px] -translate-x-1/2 rounded-full bg-black" />
        <div
          className={`flex flex-1 flex-col overflow-hidden rounded-[34px] ${title ? "bg-[#fdf8ec]" : "bg-gradient-to-b from-[#1f6f63] via-[#24443d] to-[#10201e]"}`}
        >
          <div
            className={`flex items-center justify-between px-6 pb-1 pt-2.5 text-[12px] font-bold ${title ? "text-[#10201e]" : "text-white"}`}
          >
            <span>{time}</span>
            <span className="flex items-center gap-2">
              <span className="tracking-wide">IlmNet ▂▄▆ 🔋</span>
              <button
                onClick={onClose}
                aria-label="Close phone"
                className={`grid size-6 place-items-center rounded-full text-[14px] leading-none ${title ? "bg-[#10201e]/10" : "bg-white/20"}`}
              >
                ✕
              </button>
            </span>
          </div>
          {title && (
            <div className="flex items-center gap-2 border-b border-[#10201e]/10 px-4 pb-2 pt-1">
              {onHome && (
                <button
                  onClick={onHome}
                  className="text-[20px] font-bold text-[#1f6f63]"
                  aria-label="Back"
                >
                  ‹
                </button>
              )}
              <div className="truncate text-[16px] font-bold">{title}</div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 py-3 text-[14px] leading-relaxed">
            {children}
          </div>
          <button
            onClick={onHome ?? onClose}
            className="mx-auto mb-2 mt-1 h-[5px] w-[120px] rounded-full bg-current opacity-40"
            style={{ color: title ? "#10201e" : "#fff" }}
            aria-label="Home"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- eating: finish when you are done ---------------- */
function EatingView({ dish, onDone }: { dish: Dish; onDone: () => void }) {
  const [t, setT] = useState(0);
  const FULL = 12;
  useEffect(() => {
    const t0 = Date.now();
    const iv = setInterval(() => setT((Date.now() - t0) / 1000), 250);
    return () => clearInterval(iv);
  }, []);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (t >= FULL) doneRef.current();
  }, [t]);
  const ready = t >= 2;
  return (
    <div className="space-y-3">
      <div className="text-center text-[52px] leading-none">{dish.icon}</div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#10201e]/10">
        <div
          className="h-full rounded-full bg-[#1f6f63] transition-[width] duration-200"
          style={{ width: `${Math.min(100, (t / FULL) * 100)}%` }}
        />
      </div>
      <button
        disabled={!ready}
        onClick={onDone}
        className={`w-full rounded-xl py-3 font-bold ${ready ? "bg-[#1f6f63] text-[#fdf8ec]" : "bg-[#10201e]/10 opacity-60"}`}
      >
        ✅ Done eating · Alhamdulillah
      </button>
      <p className="text-[12px] opacity-70">
        Eat at your own pace. Tap Done when you have finished.
      </p>
    </div>
  );
}

/* ---------------- OutingStation: where to go in the game ---------------- */
type Outing = Place & { area: string; live?: boolean };
const OUTING_TABS = [
  { id: "now", label: "Happening now" },
  { id: "lectures", label: "Lectures & mosques" },
  { id: "food", label: "Food" },
  { id: "sport", label: "Football & play" },
  { id: "campus", label: "Campus & MSSN" },
  { id: "shop", label: "Markets" },
  { id: "travel", label: "🚌 Travel" },
] as const;
function outingsFor(tab: string, here: string, c: Clock, has: (id: string) => boolean): Outing[] {
  const out: Outing[] = [];
  if (tab === "travel")
    return DISTRICTS.filter((D) => D.id !== here)
      .sort(
        (a, b) =>
          Number(cityOf(a) !== cityOf(districtById(here))) -
          Number(cityOf(b) !== cityOf(districtById(here))),
      )
      .map((D) => ({
        icon: cityOf(D) !== cityOf(districtById(here)) ? "🌍" : D.parent ? "🏘️" : "🌆",
        name: fullName(D),
        sub:
          cityOf(D) !== cityOf(districtById(here))
            ? `Inter-city bus · ${N(INTERCITY.bus)}, or fly from the airport`
            : `${D.busStop ?? D.name} Bus Stop`,
        prefix: "",
        area: D.id,
      }));
  const city = cityOf(districtById(here));
  for (const D of DISTRICTS.filter((x) => cityOf(x) === city)) {
    const at = (p: Place, live?: boolean) => out.push({ ...p, area: D.id, live });
    if (tab === "now" || tab === "lectures")
      for (const l of D.landmarks.filter((x) => x.kind === "masjid")) {
        const now = lectureNow(l.id, c);
        const next = lectureNext(l.id, c);
        if (tab === "now" && !now) continue;
        at(
          {
            icon: "🕌",
            name: l.name,
            sub: now
              ? `Live now: ${now.title} · ${now.speaker}`
              : next
                ? `${next.start}: ${next.title} · ${next.speaker}`
                : "Pray in congregation",
            prefix: `door:masjid:${l.id}`,
          },
          !!now,
        );
      }
    if (tab === "food") {
      if (has(`door:restaurant:${D.id}`))
        at({
          icon: "🍽️",
          name: `Al-Ma'idah Restaurant, ${D.name}`,
          sub: "Walk in · sit at a table and eat",
          prefix: `door:restaurant:${D.id}`,
        });
      if (has(`eatery:${D.id}`))
        at({
          icon: "🍗",
          name: `Al-Barakah Broast, ${D.name}`,
          sub: "Roadside food truck · quick bites",
          prefix: `eatery:${D.id}`,
        });
    }
    if (tab === "sport") {
      const f = D.landmarks.find((l) => l.kind === "field");
      at({
        icon: "⚽",
        name: f?.name ?? `${D.name} Football Pitch`,
        sub: "Join a team and play a match",
        prefix: f ? `field:${f.id}` : `field:${D.id}-pitch`,
      });
      at({
        icon: "🪢",
        name: `Sisters' Corner, ${D.name}`,
        sub: "Skipping rope",
        prefix: `sisters:${D.id}`,
      });
    }
    if (tab === "campus")
      for (const l of D.landmarks.filter((x) => x.kind === "campus" || x.kind === "hangout"))
        at({
          icon: l.kind === "campus" ? "🎓" : "🤝",
          name: l.name,
          sub: l.kind === "campus" ? "Faculties, classes and MSSN" : "Meet other students",
          prefix: l.kind === "campus" ? `campus:${l.id}:admin` : `hangout:${l.id}`,
        });
    if (tab === "shop")
      for (const p of placesIn(D.id).filter(
        (x) =>
          x.prefix === "souq" ||
          x.prefix.startsWith("stall:") ||
          x.prefix.startsWith("door:mall:") ||
          x.prefix.startsWith("dealer:"),
      ))
        at(p);
  }
  // your area first, then nearest by name
  return out.sort(
    (a, b) =>
      (a.area === here ? -1 : 0) - (b.area === here ? -1 : 0) ||
      Number(!!b.live) - Number(!!a.live),
  );
}
function OutingView({
  here,
  clock,
  driving,
  coins,
  has,
  tab0,
  onGo,
}: {
  tab0?: string;
  here: string;
  has: (id: string) => boolean;
  clock: Clock;
  driving: boolean;
  coins: number;
  onGo: (area: string, prefix: string) => void;
}) {
  const [tab, setTab] = useState<string>(tab0 ?? "now");
  const list = outingsFor(tab, here, clock, has);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-[#5adaee] p-3 text-[#0d3b44]">
        <img src="/outingstation-icon.png" alt="" className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <div className="text-[17px] font-black">Where do you want to go?</div>
          <div className="text-[12px] opacity-80">
            Powered by OutingStation · rides{" "}
            {driving ? "free in your car" : `${N(BUS_FARE)} by danfo`} · you have {N(coins)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {OUTING_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1 text-[12px] font-bold ${tab === t.id ? "bg-[#1a8fa3] text-white" : "bg-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {list.length === 0 && tab !== "travel" && (
        <p className="text-[13px] opacity-70">
          Nothing live right now. Check Lectures &amp; mosques for what's coming up today.
        </p>
      )}
      {tab === "travel" && (
        <div className="space-y-1.5">
          <div className="text-[12px] font-bold uppercase opacity-60">
            Other cities · coming soon
          </div>
          {WORLD_CITIES.filter((c) => !c.live).map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-dashed border-[#10201e]/20 bg-white/60 px-3 py-2"
            >
              <div className="text-[14px] font-bold">
                {c.name}, {c.country === "Nigeria" ? `${c.state} State` : c.country}
                <span className="ml-1.5 rounded bg-[#f2b84b] px-1.5 py-0.5 text-[10px] font-bold">
                  SOON
                </span>
              </div>
              <div className="text-[12px] opacity-70">{c.blurb}</div>
            </div>
          ))}
        </div>
      )}
      <div className="max-h-[52vh] space-y-2 overflow-y-auto">
        {list.map((p) => {
          const local = p.area === here;
          return (
            <button
              key={p.area + p.prefix + p.name}
              onClick={() => onGo(p.area, p.prefix)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#1f6f63]/20 bg-white px-3 py-2.5 text-left"
            >
              <span className="text-[22px]">{p.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-tight">
                  {p.live && (
                    <span className="mr-1 rounded bg-[#c0392b] px-1 text-[10px] text-white">
                      LIVE
                    </span>
                  )}
                  {p.name}
                </span>
                <span className="block truncate text-[12px] opacity-70">
                  {fullName(districtById(p.area))} · {p.sub}
                </span>
              </span>
              <span
                className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${local ? "bg-[#1f6f63] text-[#fdf8ec]" : "bg-[#f2c230] text-[#2a1c05]"}`}
              >
                {local ? "Walk" : "Ride"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- chat with other players ---------------- */
const chatSeen = (id: string) => {
  try {
    return Number(localStorage.getItem("ilmcity-seen-" + id) ?? 0);
  } catch {
    return 0;
  }
};
const markChatSeen = (id: string) => {
  try {
    localStorage.setItem("ilmcity-seen-" + id, String(Date.now()));
  } catch {
    /* storage blocked */
  }
};
const REPORT_REASONS = [
  "Harassment or bullying",
  "Rude or indecent language",
  "Asking for money or a scam",
  "Pretending to be someone else",
  "Something else",
];

function ChatView({
  online,
  chatId,
  me,
  other,
  freeLeft,
  onReported,
}: {
  online: Online;
  chatId: string;
  me: string;
  other: { uid: string; name: string };
  freeLeft: number | null;
  onReported: (uid: string) => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [warn, setWarn] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(
    () => online.watchChat(chatId, (m) => (setMsgs(m), markChatSeen(chatId))),
    [online, chatId],
  );
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [msgs]);
  if (reporting)
    return (
      <div className="space-y-2">
        <p className="text-[14px]">Report {other.name}. Our team reads every report.</p>
        {REPORT_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-[14px]">
            <input type="radio" checked={reason === r} onChange={() => setReason(r)} />
            {r}
          </label>
        ))}
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={500}
          placeholder="What happened? (optional)"
          className="h-20 w-full rounded-xl border border-black/15 bg-white p-2 text-[14px]"
        />
        <button
          onClick={async () => {
            await online
              .report({
                reported: other.uid,
                reportedName: other.name,
                reason,
                details,
                chatId,
                messages: msgs.slice(-30).map((m) => ({ from: m.from, text: m.text })),
              })
              .catch(() => {});
            onReported(other.uid);
          }}
          className="w-full rounded-xl bg-[#b8573a] py-3 font-bold text-white"
        >
          Send report and block
        </button>
        <button onClick={() => setReporting(false)} className="w-full py-2 text-[14px] underline">
          Cancel
        </button>
      </div>
    );
  return (
    <div className="space-y-2">
      <div ref={box} className="max-h-[42vh] min-h-[120px] space-y-2 overflow-y-auto">
        {msgs.length === 0 && (
          <p className="text-center text-[13px] opacity-60">
            Say salam to {other.name}. Keep it kind and halal.
          </p>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-[14px] ${m.from === me ? "ml-auto bg-[#1f6f63] text-[#fdf8ec]" : "bg-white"}`}
          >
            {m.text}
          </div>
        ))}
      </div>
      {warn && <p className="text-[12px] text-[#b8573a]">{warn}</p>}
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const t = cleanText(text.trim());
          if (!t) return;
          if (looksLikeContact(t) && !warn) {
            setWarn(
              "For your safety, think twice before sharing phone or bank numbers with people you don't know. Tap Send again to send.",
            );
            return;
          }
          setWarn("");
          setText("");
          await online.send(chatId, t).catch(() => setWarn("Not sent. Check your connection."));
        }}
      >
        <input
          value={text}
          maxLength={400}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${other.name}…`}
          className="min-w-0 flex-1 rounded-xl border border-[#1f6f63]/30 bg-white px-3 py-2 text-[14px]"
        />
        <button className="rounded-xl bg-[#1f6f63] px-4 font-bold text-[#fdf8ec]">Send</button>
      </form>
      <div className="flex items-center justify-between text-[12px]">
        <span className="opacity-60">
          {freeLeft === null
            ? "Unlimited chat pass"
            : `${freeLeft} free conversation${freeLeft === 1 ? "" : "s"} left`}
        </span>
        <button
          onClick={() => setReporting(true)}
          className="font-semibold text-[#b8573a] underline"
        >
          Report
        </button>
      </div>
    </div>
  );
}

function InboxView({
  me,
  chats,
  onOpen,
}: {
  me: string;
  chats: ChatInfo[];
  onOpen: (c: ChatInfo) => void;
}) {
  if (!chats.length)
    return (
      <p className="text-[14px]">
        No messages yet. Walk up to a player with a gold name tag (● Name) and tap Chat.
      </p>
    );
  return (
    <div className="space-y-2">
      {chats.map((c) => {
        const other = c.members.find((m) => m !== me) ?? "";
        const isNew = c.lastFrom !== me && c.lastText && c.lastAt > chatSeen(c.id);
        return (
          <button
            key={c.id}
            onClick={() => onOpen(c)}
            className="flex w-full items-center gap-3 rounded-xl border border-[#1f6f63]/20 bg-white px-3 py-2.5 text-left"
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#e6b84a] font-bold text-[#2a1c05]">
              {(c.names[other] ?? "?").slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold">{c.names[other] ?? "Player"}</span>
              <span className="block truncate text-[12px] opacity-70">
                {c.lastText || "New conversation"}
              </span>
            </span>
            {isNew && <span className="size-2.5 rounded-full bg-[#b8573a]" />}
          </button>
        );
      })}
    </div>
  );
}

function PassView({
  points,
  onPoints,
  onNaira,
}: {
  points: number;
  onPoints: (days: number, pts: number) => void;
  onNaira: (amount: number, what: string) => void;
}) {
  const P = ONLINE_LIMITS.pass;
  const btn = "w-full rounded-xl px-4 py-3 text-left text-[14px] font-bold";
  return (
    <div className="space-y-2">
      <p>
        You have used your {ONLINE_LIMITS.freePartners} free conversations. Get a chat pass to talk
        with as many people as you like.
      </p>
      <p className="text-[13px] opacity-75">You have {N(points)}.</p>
      {(["week", "month"] as const).map((k) => (
        <button
          key={k}
          disabled={points < P[k].points}
          onClick={() => onPoints(P[k].days, P[k].points)}
          className={`${btn} bg-[#1f6f63] text-[#fdf8ec] disabled:opacity-50`}
        >
          {k === "week" ? "1 week" : "1 month"} · {N(P[k].points)}
        </button>
      ))}
      {(["week", "month"] as const).map((k) => (
        <button
          key={"n" + k}
          onClick={() => onNaira(P[k].naira, `a ${k} chat pass`)}
          className={`${btn} border border-[#1f6f63]/30 bg-white`}
        >
          {k === "week" ? "1 week" : "1 month"} · ₦{P[k].naira.toLocaleString()} with Paystack
        </button>
      ))}
    </div>
  );
}

function FineView({
  fine,
  reason,
  points,
  onPayPoints,
  onNaira,
}: {
  onNaira: () => void;
  fine: number;
  reason?: string;
  points: number;
  onPayPoints: () => void;
}) {
  const pts = Math.round(fine / 10);
  return (
    <div className="space-y-2">
      <p>
        After a report was checked by our team, your chat was paused
        {reason ? ` for: ${reason}` : ""}. Pay the fine to chat again.
      </p>
      <div className="rounded-xl bg-white p-3 text-center">
        <div className="text-[13px] opacity-70">Fine</div>
        <div className="font-serif text-3xl">₦{fine.toLocaleString()}</div>
      </div>
      <button
        disabled={points < pts}
        onClick={onPayPoints}
        className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec] disabled:opacity-50"
      >
        Pay with {N(pts)}
      </button>
      <button
        onClick={onNaira}
        className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold"
      >
        Pay ₦{fine.toLocaleString()} with Paystack
      </button>
    </div>
  );
}

/* ---------------- daily life ---------------- */
type Needs = { hunger: number; energy: number; iman: number; social: number; clean: number };
const NEED_META: { id: keyof Needs; icon: string; name: string; tip: string }[] = [
  {
    id: "hunger",
    icon: "🍽️",
    name: "Food",
    tip: "Order food on your phone, or eat at the eatery.",
  },
  { id: "energy", icon: "⚡", name: "Energy", tip: "Sleep or rest on a sofa." },
  { id: "iman", icon: "🕌", name: "Iman", tip: "Pray, read the Qur'an, make dhikr or learn." },
  { id: "social", icon: "👥", name: "Friends", tip: "Greet neighbours and chat with players." },
  { id: "clean", icon: "💧", name: "Clean", tip: "Make wudu or bathe." },
];
const freshNeeds = (): Needs => ({ hunger: 80, energy: 90, iman: 70, social: 60, clean: 80 });
/** How fast each need falls, per real minute of play. */
const NEED_DECAY: Needs = { hunger: 1.2, energy: 0.8, iman: 0.6, social: 0.9, clean: 0.7 };

function NeedsBars({ needs, onTap }: { needs: Needs; onTap: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      className="mb-0.5 flex gap-1"
      aria-label="Your needs"
    >
      {NEED_META.map((n) => {
        const v = Math.round(needs[n.id]);
        return (
          <span key={n.id} className="flex items-center gap-0.5">
            <span className="text-[9px]">{n.icon}</span>
            <span className="h-1.5 w-3 overflow-hidden rounded-full bg-[#10201e]/15">
              <span
                className={`block h-full rounded-full ${v < 25 ? "bg-[#b8573a]" : v < 50 ? "bg-[#e6b84a]" : "bg-[#1f6f63]"}`}
                style={{ width: `${v}%` }}
              />
            </span>
          </span>
        );
      })}
    </button>
  );
}

function NeedsView({ needs }: { needs: Needs }) {
  return (
    <div className="space-y-2">
      {NEED_META.map((n) => (
        <div key={n.id} className="rounded-xl bg-white p-2.5">
          <div className="flex items-center justify-between text-[14px] font-bold">
            <span>
              {n.icon} {n.name}
            </span>
            <span className="tabular-nums">{Math.round(needs[n.id])}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#10201e]/10">
            <div
              className="h-full rounded-full bg-[#1f6f63]"
              style={{ width: `${needs[n.id]}%` }}
            />
          </div>
          <div className="mt-1 text-[12px] opacity-70">{n.tip}</div>
        </div>
      ))}
    </div>
  );
}

function AdhkarView({ kind, onDone }: { kind: keyof typeof ADHKAR; onDone: () => void }) {
  const list = ADHKAR[kind];
  const [counts, setCounts] = useState(() => list.map(() => 0));
  const done = counts.every((c, i) => c >= list[i].times);
  return (
    <div className="space-y-2">
      {list.map((d, i) => {
        const full = counts[i] >= d.times;
        return (
          <div key={i} className={`rounded-xl p-3 ${full ? "bg-[#1f6f63]/10" : "bg-white"}`}>
            <div className="text-[15px] font-semibold leading-snug">{d.ar}</div>
            <div className="mt-1 text-[13px] opacity-80">{d.en}</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] opacity-60">{d.src}</span>
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-bold tabular-nums">
                  {Math.min(counts[i], d.times)} / {d.times}
                </span>
                {!full && (
                  <button
                    onClick={() => setCounts((c) => c.map((x, j) => (j === i ? x + 1 : x)))}
                    className="rounded-lg bg-[#1f6f63] px-3 py-1.5 text-[13px] font-bold text-[#fdf8ec]"
                  >
                    Said it
                  </button>
                )}
                {!full && d.times >= 10 && (
                  <button
                    onClick={() => setCounts((c) => c.map((x, j) => (j === i ? x + 10 : x)))}
                    className="rounded-lg border border-[#1f6f63]/40 px-2 py-1.5 text-[13px] font-bold text-[#1f6f63]"
                  >
                    +10
                  </button>
                )}
              </span>
            </div>
          </div>
        );
      })}
      <button
        disabled={!done}
        onClick={onDone}
        className="w-full rounded-xl bg-[#e6b84a] py-3 font-extrabold text-[#2a1c05] disabled:opacity-50"
      >
        {done ? "Done · Alhamdulillah" : "Say each one to finish"}
      </button>
    </div>
  );
}

function WuduView({ onDone }: { onDone: () => void }) {
  const [k, setK] = useState(0);
  const [n, setN] = useState(0);
  const step = WUDU_STEPS[k];
  if (!step)
    return (
      <div className="space-y-3 text-center">
        <div className="text-[40px]">💧</div>
        <p className="text-[15px]">Your wudu is complete. You are ready for salah.</p>
        <button
          onClick={onDone}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
        >
          Alhamdulillah
        </button>
      </div>
    );
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {WUDU_STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < k ? "bg-[#1f6f63]" : i === k ? "bg-[#e6b84a]" : "bg-[#10201e]/10"}`}
          />
        ))}
      </div>
      <div className="rounded-xl bg-white p-4">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-[#1f6f63]">
          Step {k + 1} of {WUDU_STEPS.length}
        </div>
        <div className="font-serif text-2xl leading-tight">{step.name}</div>
        <p className="mt-1 text-[14px] opacity-80">{step.how}</p>
      </div>
      <button
        onClick={() => {
          if (n + 1 >= step.times) {
            setK(k + 1);
            setN(0);
          } else setN(n + 1);
        }}
        className="w-full rounded-xl bg-[#1f6f63] py-4 text-[16px] font-extrabold text-[#fdf8ec]"
      >
        {step.times > 1 ? `Wash · ${n + 1} of ${step.times}` : "Done"}
      </button>
    </div>
  );
}

function MyDayView({
  tasks,
  prayedCount,
  salamCount,
  onAdhkar,
}: {
  tasks: Record<string, boolean>;
  prayedCount: number;
  salamCount: number;
  onAdhkar: (k: "wake" | "morning" | "evening") => void;
}) {
  const doneN = DAY_TASKS.filter((t) => tasks[t.id]).length;
  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-[#10201e]/10">
        <div
          className="h-full rounded-full bg-[#e6b84a]"
          style={{ width: `${(doneN / DAY_TASKS.length) * 100}%` }}
        />
      </div>
      <p className="text-[12px] opacity-70">
        {doneN} of {DAY_TASKS.length} done · +{N(TASK_POINTS)} each, +{N(DAY_BONUS)} when you finish
        them all
      </p>
      {DAY_TASKS.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 ${tasks[t.id] ? "bg-[#1f6f63]/10" : "bg-white"}`}
        >
          <span className="text-[18px]">{tasks[t.id] ? "✅" : "⬜"}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold leading-tight">
              {t.text}
              {t.id === "salah"
                ? ` (${prayedCount}/5)`
                : t.id === "salam"
                  ? ` (${Math.min(3, salamCount)}/3)`
                  : ""}
            </span>
            <span className="block text-[12px] opacity-65">{t.hint}</span>
          </span>
          {!tasks[t.id] && (t.id === "wake" || t.id === "adhkarM" || t.id === "adhkarE") && (
            <button
              onClick={() =>
                onAdhkar(t.id === "wake" ? "wake" : t.id === "adhkarM" ? "morning" : "evening")
              }
              className="rounded-lg bg-[#1f6f63] px-2.5 py-1 text-[12px] font-bold text-[#fdf8ec]"
            >
              Start
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function HomeShopView({
  owned,
  points,
  paint,
  onPaint,
  onBuy,
  onNaira,
}: {
  owned: string[];
  points: number;
  paint?: { wall: number; floor: number };
  onPaint: (wall: number, floor: number) => void;
  onBuy: (ids: string[], pts: number) => void;
  onNaira: (ids: string[], naira: number) => void;
}) {
  const left = HOME_ITEMS.filter((i) => !owned.includes(i.id));
  const [pick, setPick] = useState<string[]>([]);
  const [tab, setTab] = useState<"items" | "paint">("items");
  const [wall, setWall] = useState(paint?.wall ?? WALL_COLOURS[0]);
  const [floor, setFloor] = useState(paint?.floor ?? FLOOR_COLOURS[0]);
  const hex = (c: number) => "#" + c.toString(16).padStart(6, "0");
  const tabs = (
    <div className="flex gap-1.5">
      {(
        [
          ["items", "🛋️ Furniture & decor"],
          ["paint", "🎨 Paint"],
        ] as const
      ).map(([k, l]) => (
        <button
          key={k}
          onClick={() => setTab(k)}
          className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold ${tab === k ? "bg-[#1f6f63] text-white" : "bg-white"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
  if (tab === "paint")
    return (
      <div className="space-y-3">
        {tabs}
        <div
          className="grid h-24 place-items-end rounded-xl p-2"
          style={{ background: `linear-gradient(${hex(wall)} 62%, ${hex(floor)} 62%)` }}
        >
          <span className="rounded bg-white/80 px-2 py-0.5 text-[11px] font-bold">Preview</span>
        </div>
        <div className="text-[13px] font-bold">Walls</div>
        <div className="flex flex-wrap gap-2">
          {WALL_COLOURS.map((c) => (
            <button
              key={c}
              onClick={() => setWall(c)}
              aria-label="Wall colour"
              className={`size-9 rounded-full border-2 ${wall === c ? "border-[#10201e] ring-2 ring-[#f2c230]" : "border-[#10201e]/15"}`}
              style={{ background: hex(c) }}
            />
          ))}
        </div>
        <div className="text-[13px] font-bold">Floor</div>
        <div className="flex flex-wrap gap-2">
          {FLOOR_COLOURS.map((c) => (
            <button
              key={c}
              onClick={() => setFloor(c)}
              aria-label="Floor colour"
              className={`size-9 rounded-full border-2 ${floor === c ? "border-[#10201e] ring-2 ring-[#f2c230]" : "border-[#10201e]/15"}`}
              style={{ background: hex(c) }}
            />
          ))}
        </div>
        <button
          disabled={points < PAINT_PRICE}
          onClick={() => onPaint(wall, floor)}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec] disabled:opacity-50"
        >
          🎨 Paint my home · {N(PAINT_PRICE)}
        </button>
      </div>
    );
  const chosen = left.filter((i) => pick.includes(i.id));
  const pts = chosen.reduce((a, i) => a + itemPoints(i), 0);
  const naira = chosen.reduce((a, i) => a + i.naira, 0);
  if (!left.length)
    return (
      <div className="space-y-3">
        {tabs}
        <p>Masha Allah, your home is fully furnished!</p>
      </div>
    );
  return (
    <div className="space-y-2">
      {tabs}
      <p className="text-[13px] opacity-75">
        Your flat has a bed and a bathroom. Pick what to add. You have {N(points)}.
      </p>
      <button
        onClick={() => setPick(pick.length === left.length ? [] : left.map((i) => i.id))}
        className="text-[13px] font-bold text-[#1f6f63] underline"
      >
        {pick.length === left.length ? "Clear" : "Pick everything"}
      </button>
      <div className="grid grid-cols-2 gap-2">
        {left.map((i) => {
          const on = pick.includes(i.id);
          return (
            <button
              key={i.id}
              onClick={() => setPick((p) => (on ? p.filter((x) => x !== i.id) : [...p, i.id]))}
              className={`rounded-xl border-2 p-2 text-left ${on ? "border-[#1f6f63] bg-[#1f6f63]/10" : "border-transparent bg-white"}`}
            >
              <div className="text-[22px]">{i.icon}</div>
              <div className="text-[13px] font-bold leading-tight">{i.name}</div>
              <div className="text-[11px] opacity-70">{i.does}</div>
              <div className="mt-1 text-[12px] font-bold text-[#1f6f63]">
                ₦{i.naira} · {N(itemPoints(i))}
              </div>
            </button>
          );
        })}
      </div>
      <button
        disabled={!chosen.length || points < pts}
        onClick={() =>
          onBuy(
            chosen.map((i) => i.id),
            pts,
          )
        }
        className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec] disabled:opacity-50"
      >
        {chosen.length
          ? `Buy ${chosen.length} item${chosen.length > 1 ? "s" : ""} · ${N(pts)}`
          : "Pick items to buy"}
      </button>
      {chosen.length > 0 && (
        <button
          onClick={() =>
            onNaira(
              chosen.map((i) => i.id),
              naira,
            )
          }
          className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold"
        >
          Pay ₦{naira.toLocaleString()} with Paystack
        </button>
      )}
    </div>
  );
}

/* ---------------- work ---------------- */
const hourNow = (c: Clock) => c.min / 60;
const onShift = (j: Job, c: Clock) =>
  !j.hours || (hourNow(c) >= j.hours[0] && hourNow(c) < j.hours[1]);
const hoursText = (j: Job) =>
  j.hours ? `${fmtTime(j.hours[0] * 60)} – ${fmtTime(j.hours[1] * 60)}` : "Any time";

function JobsView({
  current,
  onTake,
  onGo,
}: {
  current?: string;
  onTake: (j: Job) => void;
  onGo: (j: Job) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] opacity-75">
        One shift a day, paid when you finish. You can change jobs any time.
      </p>
      {JOBS.map((j) => {
        const mine = j.id === current;
        return (
          <div
            key={j.id}
            className={`rounded-xl p-3 ${mine ? "bg-[#1f6f63]/10 ring-2 ring-[#1f6f63]" : "bg-white"}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[15px] font-bold">{j.name}</div>
              <div className="whitespace-nowrap text-[13px] font-bold text-[#1f6f63]">
                {N(j.pay)}/day
              </div>
            </div>
            <div className="text-[12px] opacity-75">
              {j.place}
              {j.area ? `, ${fullName(districtById(j.area))}` : ""} · {hoursText(j)}
            </div>
            <div className="mt-1 text-[13px]">{j.about}</div>
            <button
              onClick={() => (mine ? onGo(j) : onTake(j))}
              className="mt-2 rounded-lg bg-[#1f6f63] px-3 py-1.5 text-[13px] font-bold text-[#fdf8ec]"
            >
              {mine ? "Go to work" : "Take this job"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function WorkView({ job, onDone }: { job: Job; onDone: (correct: number, total: number) => void }) {
  const tasks = useMemo(() => [...job.tasks].sort(() => Math.random() - 0.5).slice(0, 4), [job]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const t = tasks[i];
  if (!t)
    return (
      <div className="space-y-3 text-center">
        <div className="text-[40px]">💼</div>
        <p className="text-[15px]">
          Shift done! You handled {score} of {tasks.length} well.
        </p>
        <button
          onClick={() => onDone(score, tasks.length)}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
        >
          Collect my pay
        </button>
      </div>
    );
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-[#1f6f63]">
        {job.name} · task {i + 1} of {tasks.length}
      </div>
      <p className="text-[16px] font-semibold">{t.q}</p>
      {t.o.map((o, k) => (
        <button
          key={k}
          disabled={picked !== null}
          onClick={() => {
            setPicked(k);
            if (k === t.a) setScore((x) => x + 1);
          }}
          className={`w-full rounded-xl border border-[#1f6f63]/25 px-4 py-2.5 text-left text-[14px] ${
            picked === null
              ? "bg-white"
              : k === t.a
                ? "bg-[#1f6f63] text-[#fdf8ec]"
                : k === picked
                  ? "bg-[#b8573a] text-white"
                  : "bg-white opacity-60"
          }`}
        >
          {o}
        </button>
      ))}
      {picked !== null && (
        <button
          onClick={() => {
            setI(i + 1);
            setPicked(null);
          }}
          className="w-full rounded-xl bg-[#10201e] py-3 font-bold text-[#fdf8ec]"
        >
          Next
        </button>
      )}
    </div>
  );
}

/* ---------------- the next thing to do ---------------- */
type Goal = { text: string; prefix?: string; act?: "adhkarM" | "adhkarE" | "jobs" | "travel" };
function nextGoal(s: Save, c: Clock, inside: boolean, area: string): Goal | null {
  const t = s.tasks ?? {};
  const n = s.needs;
  const cp = currentPrayer(c);
  const home = s.homeArea ?? "lekki";
  const homeDoor = s.homePlot
    ? `plot:${s.homePlot}`
    : `door:home:${home === "lekki" ? "home" : home}`;
  if (cp && !s.prayed[cp.id])
    return s.wudu
      ? {
          text: `Pray ${cp.name} · until ${fmtTime(cp.end)}`,
          prefix: inside && (s.items ?? []).includes("prayermat") ? "prayermat" : "door:masjid:",
        }
      : { text: `Make wudu for ${cp.name}`, prefix: inside ? "bath" : "door:masjid:" };
  if (s.impound && !inside)
    return {
      text: `Collect your car at the ${districtById(s.impound.area).name} police station`,
      prefix: "police:",
    };
  if (s.meal)
    return inside
      ? { text: "Your food is here: wash your hands at the table, then eat", prefix: "eat" }
      : area !== home
        ? { text: "Your food is ready: sit down here, wash your hands and eat" }
        : { text: "Take your food home: go inside, wash your hands, then eat", prefix: homeDoor };
  if (n && n.hunger < 30)
    return { text: "You're hungry: order food (📱) or eat at a restaurant", prefix: "eatery:" };
  if (n && n.energy < 25)
    return { text: "You're tired: go home and rest", prefix: inside ? "sleep" : homeDoor };
  const job = JOBS.find((j) => j.id === s.job);
  if (job && s.worked !== c.key && onShift(job, c))
    return { text: `Go to work: ${job.name}`, prefix: job.at };
  if (!t.adhkarM && c.min < c.times.dhuhr)
    return { text: "Say your morning adhkar", act: "adhkarM" };
  if (!t.adhkarE && c.min >= c.times.asr && c.min < c.times.isha)
    return { text: "Say your evening adhkar", act: "adhkarE" };
  if (!s.job && !s.path) return { text: "Find a job and earn a daily salary", act: "jobs" };
  if (!t.eat)
    return {
      text: "Eat a halal meal",
      prefix: (s.items ?? []).includes("kitchen") && inside ? "eat" : `stall:${area}-m`,
    };
  if (!t.learn) return { text: "Learn something at the masjid", prefix: "door:masjid:" };
  if (!t.market) return { text: "Visit the market", prefix: `stall:${area}-m` };
  if (!t.quran)
    return {
      text: "Read the Qur'an",
      prefix: inside && (s.items ?? []).includes("bookshelf") ? "quranhome" : "door:masjid:",
    };
  if ((s.salams ?? 0) < 3) return { text: "Greet 3 people with salam" };
  if (!t.sleep && (c.min >= c.times.isha || c.min < c.times.fajr))
    return { text: "Sleep early after Isha", prefix: inside ? "sleep" : homeDoor };
  return {
    text: `Explore another area of ${WORLD_CITIES.find((w) => w.id === cityOf(districtById(area)))?.name ?? "the city"}`,
    act: "travel",
  };
}

/* ---------------- graphics setting ---------------- */
type Quality = "auto" | "low" | "high";
const QKEY = "ilmcity-quality";
function readQuality(): Quality {
  try {
    const q = localStorage.getItem(QKEY);
    return q === "low" || q === "high" ? q : "auto";
  } catch {
    return "auto";
  }
}
function writeQuality(q: Quality) {
  try {
    localStorage.setItem(QKEY, q);
  } catch {
    /* storage off */
  }
}
/** Phones with little memory or few cores start on smooth graphics. */
function weakPhone() {
  const n = navigator as Navigator & { deviceMemory?: number };
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  return (n.deviceMemory ?? 8) <= 4 || (mobile && (navigator.hardwareConcurrency ?? 8) <= 4);
}
function GraphicsView({
  now,
  low,
  onPick,
}: {
  now: Quality;
  low: boolean;
  onPick: (q: Quality) => void;
}) {
  const opt = (q: Quality, title: string, sub: string) => (
    <button
      onClick={() => onPick(q)}
      className={`w-full rounded-xl border px-4 py-3 text-left ${now === q ? "border-[#1f6f63] bg-[#1f6f63]/10" : "border-[#10201e]/15 bg-white"}`}
    >
      <div className="font-bold">
        {title} {now === q && "✓"}
      </div>
      <div className="text-[12.5px] opacity-70">{sub}</div>
    </button>
  );
  return (
    <div className="space-y-2">
      {opt("auto", "Auto", `The game picks for your phone (now: ${low ? "Smooth" : "Beautiful"}).`)}
      {opt(
        "low",
        "Smooth",
        "Best for cheaper phones: same look, lighter shadows, a little less view.",
      )}
      {opt("high", "Beautiful", "Shadows and a long view. Needs a stronger phone.")}
    </div>
  );
}

/* ---------------- profile ---------------- */
function ProfileView({
  look,
  number,
  coins,
  ilm,
  home,
  rent,
  badge,
  items,
}: {
  look: Look | undefined;
  number?: string;
  coins: number;
  ilm: number;
  home: string;
  rent?: { area: string; until: number; weekly: number } | null;
  badge: string;
  items: { icon: string; label: string; badge?: number; run: () => void }[];
}) {
  const lv = ilmLevel(ilm);
  const title = look?.female ? lv.sister : lv.brother;
  const pct = lv.next ? ((ilm - lv.min) / (lv.next.min - lv.min)) * 100 : 100;
  const daysLeft = rent ? Math.ceil((rent.until - Date.now()) / 86400000) : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#1f6f63] to-[#10201e] p-3.5 text-[#fdf8ec]">
        <div
          className="grid size-14 shrink-0 place-items-center rounded-full border-4 text-[22px] font-black"
          style={{
            background: look ? hex(look.robe) : "#1f6f63",
            borderColor: look ? hex(look.accent) : "#e6b84a",
            color: look && look.robe > 0x888888 ? "#10201e" : "#fdf8ec",
          }}
        >
          {(look?.name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[18px] font-black">{look?.name ?? "Player"}</div>
          <div className="text-[12.5px] text-[#e6b84a]">
            {title} · {look?.female ? "Sister" : "Brother"}
            {badge.includes("💚") ? " · 💚 Generous giver" : ""}
            {badge.includes("✨") ? " · ✨ Blessed" : ""}
          </div>
          <div className="truncate text-[12px] opacity-75">
            {home}
            {number ? ` · ${number}` : ""}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-2.5 shadow-sm">
          <div className="text-[11px] font-bold uppercase opacity-60">Money</div>
          <div className="text-[18px] font-black text-[#1d6b3a]">{N(coins)}</div>
        </div>
        <div className="rounded-xl bg-white p-2.5 shadow-sm">
          <div className="text-[11px] font-bold uppercase opacity-60">Ilm</div>
          <div className="text-[18px] font-black text-[#1f6f63]">{ilm}</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#10201e]/10">
            <div className="h-full bg-[#1f6f63]" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <div className="mt-0.5 text-[10.5px] opacity-65">
            {lv.next
              ? `${lv.next.min - ilm} more to ${look?.female ? lv.next.sister : lv.next.brother}`
              : "Highest level"}
          </div>
        </div>
      </div>
      {rent && (
        <div
          className={`rounded-xl p-2.5 text-[12.5px] shadow-sm ${daysLeft <= 1 ? "bg-[#fbe9e4]" : "bg-white"}`}
        >
          🏠 Rent: <b>{N(rent.weekly)}</b> a week ·{" "}
          {daysLeft > 0 ? `paid for ${daysLeft} more day${daysLeft > 1 ? "s" : ""}` : "due now"}
        </div>
      )}
      <details className="rounded-xl bg-white p-2.5 text-[12.5px] shadow-sm">
        <summary className="cursor-pointer font-bold">What is Ilm for?</summary>
        <div className="mt-1.5 space-y-1 opacity-85">
          <div>
            • Ilm is the knowledge you gain: salah in jama'ah, lectures, classes, quizzes, adhkar.
          </div>
          <div>
            • It gives you a title: Talib, Student of knowledge, Ustadh, then Sheikh (Talibah,
            Ustadhah, Sheikhah for sisters).
          </div>
          <div>• Each title raises your job pay: +5%, +10%, +20%, then +30%.</div>
          <div>• It can pay your bail if you are ever arrested ({POLICE.bailIlm} Ilm).</div>
        </div>
      </details>
      <details className="rounded-xl bg-white p-2.5 text-[12.5px] shadow-sm">
        <summary className="cursor-pointer font-bold">Badges others see</summary>
        <div className="mt-1.5 space-y-1 opacity-85">
          <div>
            • 💚 <b>Generous giver</b>: ₦5,000 or more given in the masjid sadaqah box.
          </div>
          <div>
            • ✨ <b>Blessed</b>: ₦100,000 in the wallet, or a house of your own. Your name tag turns
            gold.
          </div>
          <div>• Premium clothes, a big car and a duplex show it too. Be grateful, not proud.</div>
        </div>
      </details>
      <MenuView items={items} />
    </div>
  );
}

/** Your clothes: wear what you own, buy new ones for ₦500. */
function WardrobeView({
  look,
  owned,
  coins,
  onWear,
  onBuy,
}: {
  look: Look;
  owned: string[];
  coins: number;
  onWear: (p: Partial<Look>) => void;
  onBuy: (key: string, p: Partial<Look>, price: number) => void;
}) {
  const [cur, setCur] = useState(look);
  const [have, setHave] = useState(owned);
  const [money, setMoney] = useState(coins);
  const [pick, setPick] = useState<{
    key: string;
    p: Partial<Look>;
    name: string;
    price: number;
  } | null>(null);
  const wearing = (c: number, which: "robe" | "accent", style?: Look["style"]) =>
    cur[which] === c && (which === "accent" || cur.style === style);
  const row = (
    label: string,
    which: "robe" | "accent",
    list: number[],
    price = CLOTHES_PRICE,
    style?: Look["style"],
  ) => (
    <div>
      <div className="mb-1 text-[12.5px] font-bold">{label}</div>
      <div className="flex flex-wrap gap-2">
        {list.map((c) => {
          const key = `${style ?? which}:${hex(c)}`;
          const on = wearing(c, which, style);
          const mine = have.includes(key) || on;
          const p: Partial<Look> = which === "robe" ? { robe: c, style } : { accent: c };
          return (
            <button
              key={c}
              aria-label={label}
              onClick={() => {
                if (mine) {
                  setPick(null);
                  setCur({ ...cur, ...p });
                  onWear(p);
                } else setPick({ key, p, name: label.toLowerCase(), price });
              }}
              className={`relative size-10 rounded-full border-2 ${on ? "border-[#e6b84a] ring-2 ring-[#e6b84a]/50" : pick?.key === key ? "border-[#1f6f63] ring-2 ring-[#1f6f63]/40" : "border-black/10"}`}
              style={{ background: hex(c) }}
            >
              {!mine && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-[#10201e] px-1 text-[8.5px] font-bold text-white">
                  ₦
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
  return (
    <div className="space-y-3">
      <p className="text-[13px] opacity-75">
        Tap something you own to wear it. New clothes cost {N(CLOTHES_PRICE)} each. You have{" "}
        {N(money)}.
      </p>
      {row(cur.female ? "Abaya" : "Thobe", "robe", cur.female ? SHOP_ABAYAS : SHOP_THOBES)}
      {row(cur.female ? "Hijab" : "Cap", "accent", cur.female ? SHOP_HIJABS : SHOP_CAPS)}
      <div className="rounded-xl border border-[#c9a227]/50 bg-[#fbf3d9] p-2.5">
        <div className="text-[12.5px] font-bold text-[#8a6a10]">
          ✨ Premium · {N(PREMIUM_PRICE)} each
        </div>
        <div className="mb-2 text-[11.5px] opacity-75">
          {cur.female
            ? "A lace abaya with bell sleeves, a long khimar and gold trim."
            : "A flowing agbada over the kaftan, with gold embroidery and a tall fila."}{" "}
          For those Allah has blessed. Be grateful, not proud.
        </div>
        {row(
          cur.female ? "Lace abaya" : "Agbada",
          "robe",
          cur.female ? PREMIUM_ABAYAS : PREMIUM_THOBES,
          PREMIUM_PRICE,
          cur.female ? "lace" : "agbada",
        )}
        <div className="h-2" />
        {row(
          cur.female ? "Silk hijab" : "Premium cap",
          "accent",
          cur.female ? PREMIUM_HIJABS : PREMIUM_CAPS,
          PREMIUM_PRICE,
        )}
      </div>
      {pick && (
        <button
          disabled={money < pick.price}
          onClick={() => {
            onBuy(pick.key, pick.p, pick.price);
            setHave([...have, pick.key]);
            setCur({ ...cur, ...pick.p });
            setMoney(money - pick.price);
            setPick(null);
          }}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec] disabled:opacity-50"
        >
          {money < pick.price
            ? `You need ${N(pick.price)} for this ${pick.name}`
            : `Buy and wear this ${pick.name} · ${N(pick.price)}`}
        </button>
      )}
    </div>
  );
}

function MenuView({
  items,
}: {
  items: { icon: string; label: string; badge?: number; run: () => void }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((m) => (
        <button
          key={m.label}
          onClick={m.run}
          className="relative rounded-xl bg-white px-2 py-3 text-center"
        >
          <div className="text-[24px]">{m.icon}</div>
          <div className="text-[13px] font-bold">{m.label}</div>
          {!!m.badge && (
            <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[#b8573a] text-[11px] text-white">
              {m.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Points a named shop with products has earned since sales were last collected (up to 3 days). */
function salesDue(o: ShopOwn) {
  if (!o.name || !o.products.length) return 0;
  const days = Math.min(3, (Date.now() - (o.salesAt ?? Date.now())) / 86400000);
  return Math.floor(days * SHOP_SALES_PER_DAY);
}

/** Your own Qur'an player as a radio source. */
function mySource(c: { reciter: string; playlist: string }): Source {
  return {
    key: "me",
    reciter: c.reciter,
    playlist: c.playlist,
    label:
      c.playlist === "nasheed"
        ? "Nasheeds"
        : (RECITERS.find((r) => r.id === c.reciter)?.name ?? "Qur'an"),
  };
}

/* ---------------- adhkar card ---------------- */
function DhikrCard({
  d,
  blocking,
  onSaid,
  onClose,
}: {
  d: { title: string; arabic: string; say: string; meaning: string; source: string; tip?: string };
  blocking: boolean;
  onSaid: () => void;
  onClose: () => void;
}) {
  return (
    <div
      data-game-ui
      className={`absolute inset-x-3 z-40 mx-auto max-w-md ${blocking ? "top-1/2 -translate-y-1/2" : "top-[118px]"}`}
    >
      <div className="rounded-2xl border border-[#1f6f63]/25 bg-[#fdf8ec] p-3.5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#1f6f63]">
            🤲 {d.title}
          </div>
          {!blocking && (
            <button
              onClick={onClose}
              className="px-1 text-[18px] leading-none opacity-50"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        <p
          dir="rtl"
          lang="ar"
          className="mt-1.5 text-center font-[Amiri] text-[21px] leading-[1.9]"
        >
          {d.arabic}
        </p>
        <p className="mt-1 text-[13px] font-semibold italic">{d.say}</p>
        <p className="mt-1 text-[12.5px] opacity-80">
          "{d.meaning}" <span className="opacity-70">({d.source})</span>
        </p>
        {d.tip && <p className="mt-1 text-[12px] text-[#1f6f63]">{d.tip}</p>}
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={onSaid}
            className="flex-1 rounded-xl bg-[#1f6f63] py-2.5 text-[14px] font-bold text-[#fdf8ec]"
          >
            I said it ✓
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#1f6f63]/30 bg-white px-4 py-2.5 text-[14px] font-bold"
          >
            {blocking ? "Continue" : "Later"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- university ---------------- */
function InClassView({
  library,
  about,
  quiz,
  notMine,
  onCorrect,
  onLeave,
}: {
  library: boolean;
  about: string;
  quiz?: { q: string; o: string[]; a: number }[];
  notMine?: boolean;
  onCorrect: () => boolean;
  onLeave: () => void;
}) {
  const [qi, setQi] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  if (quiz && qi !== null) {
    if (qi >= quiz.length)
      return (
        <div className="space-y-3 text-center">
          <div className="font-serif text-3xl">
            {score} / {quiz.length}
          </div>
          <p>{score === quiz.length ? "Excellent! Masha Allah." : "Well done. Keep studying!"}</p>
          <button
            onClick={onLeave}
            className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
          >
            Leave class
          </button>
        </div>
      );
    const q = quiz[qi];
    return (
      <div className="space-y-2">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-[#1f6f63]">
          Question {qi + 1} of {quiz.length}
        </div>
        <p className="text-[16px] font-semibold">{q.q}</p>
        {q.o.map((o, k) => (
          <button
            key={k}
            disabled={picked !== null}
            onClick={() => {
              setPicked(k);
              if (k === q.a) {
                setScore((x) => x + 1);
                onCorrect();
              }
            }}
            className={`w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-2.5 text-left text-[14px] ${picked === null ? "" : k === q.a ? "bg-[#1f6f63] text-[#fdf8ec]" : k === picked ? "bg-[#b8573a] text-white" : "opacity-60"}`}
          >
            {o}
          </button>
        ))}
        {picked !== null && (
          <button
            onClick={() => {
              setQi(qi + 1);
              setPicked(null);
            }}
            className="w-full rounded-xl bg-[#10201e] py-3 font-bold text-[#fdf8ec]"
          >
            {qi + 1 < quiz.length ? "Next question" : "See my score"}
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-3 text-center">
      <div className="text-5xl">{library ? "📚" : "🎓"}</div>
      <p className="text-[18px] font-bold">
        {library ? "You're in the library now." : "You're in class now."}
      </p>
      <p className="text-[15px]">
        Focus on your {library ? "reading" : "lecture"} and continue playing later, in shaa Allah.
      </p>
      <p className="rounded-xl bg-white p-3 text-[14px] text-[#1f6f63]">
        Wishing you success in your studies. May Allah increase you in beneficial knowledge. 🤲
      </p>
      {about && <p className="text-[12.5px] opacity-70">{about}</p>}
      {quiz && (
        <button
          onClick={() => setQi(0)}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
        >
          📝 Answer questions in my faculty
        </button>
      )}
      {notMine && (
        <p className="text-[12.5px] opacity-70">
          This isn't your faculty. Go to your own faculty to answer its questions.
        </p>
      )}
      <button
        onClick={onLeave}
        className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold"
      >
        {library ? "Leave the library" : "Leave class"}
      </button>
    </div>
  );
}

function MeetView({ about, onSit }: { about: string; onSit: () => void }) {
  const [gist] = useState(() => {
    const a = Math.floor(Math.random() * CAMPUS_GIST.length);
    return [CAMPUS_GIST[a], CAMPUS_GIST[(a + 3) % CAMPUS_GIST.length]];
  });
  return (
    <div className="space-y-3">
      <p>{about}</p>
      <div className="space-y-1.5">
        <div className="text-[13px] font-semibold">Today's gist:</div>
        {gist.map((g) => (
          <p key={g} className="rounded-xl bg-white p-2.5 text-[14px]">
            💬 {g}
          </p>
        ))}
      </div>
      <button
        onClick={onSit}
        className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
      >
        Sit and gist
      </button>
      <p className="text-[12px] opacity-70">
        Players who come here can chat with you: walk up to them and tap Chat. Keep it respectful,
        brothers and sisters alike.
      </p>
    </div>
  );
}

/* ---------------- Qur'an player ---------------- */
function RadioView({
  cfg,
  riding,
  nasheedCount,
  onChange,
  onSkip,
  onVehicleMute,
}: {
  cfg: { on: boolean; reciter: string; playlist: string; vehicles: boolean };
  riding: "danfo" | "keke" | "car" | null;
  nasheedCount: number;
  onChange: (
    p: Partial<{ on: boolean; reciter: string; playlist: string; vehicles: boolean }>,
  ) => void;
  onSkip: () => void;
  onVehicleMute: () => void;
}) {
  const [st, setSt] = useState(radio.state);
  useEffect(() => radio.subscribe(setSt), []);
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white p-3">
        <div className="text-[12px] font-semibold opacity-70">Now</div>
        <div className="font-bold">
          {st.hushed
            ? "Quiet: no Qur'an or nasheed in the masjid, in class or during salah"
            : st.playing && st.source
              ? `${st.title} · ${st.source.label}`
              : "Off"}
        </div>
        {st.error && (
          <div className="mt-1 text-[12px] text-[#b8573a]">
            The recitation could not load. Check your internet and try again.
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => onChange({ on: !cfg.on })}
            className={`flex-1 rounded-lg py-2 text-[13px] font-bold ${cfg.on ? "border border-[#1f6f63]/30 bg-white" : "bg-[#1f6f63] text-[#fdf8ec]"}`}
          >
            {cfg.on ? "⏸ Turn off" : "▶ Play"}
          </button>
          {st.playing && (
            <button
              onClick={onSkip}
              className="flex-1 rounded-lg border border-[#1f6f63]/30 bg-white py-2 text-[13px] font-bold"
            >
              ⏭ Next surah
            </button>
          )}
        </div>
        {riding && st.source?.key === riding && st.playing && (
          <button
            onClick={onVehicleMute}
            className="mt-2 text-[12.5px] font-semibold text-[#1f6f63] underline"
          >
            Turn off the {riding} radio for this ride
          </button>
        )}
      </div>
      <div>
        <div className="mb-1 text-[13px] font-semibold">Reciter</div>
        <div className="grid gap-1.5">
          {RECITERS.map((r) => (
            <button
              key={r.id}
              onClick={() => onChange({ reciter: r.id, on: true })}
              className={`rounded-xl px-3 py-2 text-left text-[14px] ${cfg.reciter === r.id ? "bg-[#1f6f63] font-bold text-[#fdf8ec]" : "border border-[#1f6f63]/20 bg-white"}`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 text-[13px] font-semibold">What to play</div>
        <div className="grid gap-1.5">
          {PLAYLISTS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ playlist: p.id, on: true })}
              className={`rounded-xl px-3 py-2 text-left text-[14px] ${cfg.playlist === p.id ? "bg-[#1f6f63] font-bold text-[#fdf8ec]" : "border border-[#1f6f63]/20 bg-white"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 text-[13px] font-semibold">Or pick a surah</div>
        <select
          value={cfg.playlist.startsWith("s:") ? cfg.playlist : ""}
          onChange={(e) => e.target.value && onChange({ playlist: e.target.value, on: true })}
          className="w-full rounded-xl border border-[#1f6f63]/20 bg-white px-3 py-2.5 text-[14px]"
        >
          <option value="">Choose a surah…</option>
          {SURAH_NAMES.map((n, i) => (
            <option key={n} value={`s:${i + 1}`}>
              {i + 1}. {n}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center justify-between rounded-xl bg-white p-3 text-[14px]">
        <span>
          <b>Radio in danfo, keke and car</b>
          <br />
          <span className="text-[12px] opacity-70">Each one plays its own reciter</span>
        </span>
        <input
          type="checkbox"
          checked={cfg.vehicles}
          onChange={(e) => onChange({ vehicles: e.target.checked })}
          className="size-5 accent-[#1f6f63]"
        />
      </label>
      <div className="rounded-xl border border-dashed border-[#1f6f63]/30 p-3 text-[13px]">
        <b>Nasheeds</b>
        {nasheedCount === 0 ? (
          <p className="mt-0.5 opacity-75">Coming soon, in shaa Allah.</p>
        ) : (
          <button
            onClick={() => onChange({ playlist: "nasheed", on: true })}
            className={`mt-1.5 w-full rounded-xl px-3 py-2 text-left text-[14px] ${cfg.playlist === "nasheed" ? "bg-[#1f6f63] font-bold text-[#fdf8ec]" : "border border-[#1f6f63]/20 bg-white"}`}
          >
            🎵 Play nasheeds ({nasheedCount})
          </button>
        )}
      </div>
      <p className="text-[11.5px] opacity-60">
        It keeps playing while you text. It stops by itself in the masjid, in school and class, and
        during salah and lectures. Recitations: Islamic Network.
      </p>
    </div>
  );
}

/* ---------------- found things and the cell ---------------- */
function FoundView({
  name,
  carrying,
  onReturn,
  onKeep,
}: {
  name: string;
  carrying: boolean;
  onReturn: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="space-y-3">
      <p>Someone dropped this {name} on the road. Its owner must be worried.</p>
      {carrying ? (
        <p className="text-[13px] opacity-75">
          Hand in what you are already carrying first, then come back for this.
        </p>
      ) : (
        <button
          onClick={onReturn}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
        >
          🤲 Take it to the police or Hisbah
        </button>
      )}
      {!carrying && (
        <button
          onClick={onKeep}
          className="w-full rounded-xl border border-[#b8573a]/40 bg-white py-3 font-bold text-[#b8573a]"
        >
          Keep it
        </button>
      )}
    </div>
  );
}

function CellView({
  item,
  points,
  ilm,
  onBailPoints,
  onBailIlm,
  onWait,
}: {
  item: string;
  points: number;
  ilm: number;
  onBailPoints: () => void;
  onBailIlm: () => void;
  onWait: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-center text-5xl">🚔</div>
      <p>
        You were arrested for keeping a {item} that wasn't yours. It has gone back to its owner.
      </p>
      <p className="rounded-xl bg-white p-3 text-[14px]">
        "Indeed, Allah loves those who constantly repent." (Qur'an 2:222)
      </p>
      <button
        disabled={points < POLICE.bailPoints}
        onClick={onBailPoints}
        className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec] disabled:opacity-40"
      >
        Pay bail · {N(POLICE.bailPoints)}
      </button>
      <button
        disabled={ilm < POLICE.bailIlm}
        onClick={onBailIlm}
        className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold disabled:opacity-40"
      >
        Pay bail · {POLICE.bailIlm} Ilm
      </button>
      <button
        onClick={onWait}
        className="w-full rounded-xl border border-[#10201e]/20 bg-white py-3 font-bold"
      >
        Wait {POLICE.cellMinutes} minutes in the cell
      </button>
    </div>
  );
}

/* ---------------- my houses ---------------- */
function MyHousesView({
  plots,
  info,
  onOpen,
}: {
  plots: Record<string, PlotOwn>;
  info: (id: string) => { number: number; street: string; district: string } | null;
  onOpen: (id: string) => void;
}) {
  const now = Date.now();
  const mine = Object.entries(plots).filter(([, o]) => o.kind !== "rented" || o.until > now);
  if (!mine.length)
    return (
      <p>
        You don't have a house or land yet. Look for TO LET signs to rent or buy a house, and LAND
        FOR SALE boards to buy land and build.
      </p>
    );
  const what = (o: PlotOwn) => {
    if (o.kind === "rented") return `Rented · ${Math.ceil((o.until - now) / 86400000)} days left`;
    if (o.kind === "owned") return "Your land, ready to build";
    if (o.kind === "building") return "Being built";
    const rooms = (o.rooms ?? []).filter((r) => r && r.until > now).length;
    return `${o.kind === "bought" ? "Bought" : "Built"} · ${rooms} of ${roomsIn(o.floors)} rooms rented`;
  };
  return (
    <div className="space-y-2">
      {mine.map(([id, o]) => {
        const p = info(id);
        return (
          <button
            key={id}
            onClick={() => onOpen(id)}
            className="w-full rounded-xl border border-[#1f6f63]/20 bg-white px-3 py-2.5 text-left"
          >
            <div className="text-[14px] font-bold">{p ? `No. ${p.number}, ${p.street}` : id}</div>
            <div className="text-[12px] opacity-75">
              {p ? districtById(p.district).name + " · " : ""}
              {what(o)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- MSSN secretariat ---------------- */
function MssnView({
  about,
  student,
  area,
  uid,
  onQuiz,
  onRegister,
  onAsk,
}: {
  uid: string | null;
  about: string;
  student?: { area: string; faculty: string };
  area: string;
  onQuiz: () => void;
  onRegister: (faculty: string) => void;
  onAsk: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [pick, setPick] = useState(false);
  const [mineQ, setMineQ] = useState<Enquiry[]>([]);
  useEffect(() => (uid ? watchMyEnquiries(uid, setMineQ) : undefined), [uid]);
  const mine = student?.area === area;
  return (
    <div className="space-y-3">
      <p>{about}</p>
      <button
        onClick={onQuiz}
        className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
      >
        📝 Take the MSSN Islamic quiz
      </button>
      {!mine &&
        (pick ? (
          <div className="space-y-1.5">
            {facultiesOf(area).map((f) => (
              <button
                key={f.id}
                onClick={() => onRegister(f.id)}
                className="w-full rounded-xl border border-[#1f6f63]/25 bg-white px-4 py-2.5 text-left text-[14px] font-bold"
              >
                {f.name}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setPick(true)}
            className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold"
          >
            🎓 I'm a student here
          </button>
        ))}
      <div className="rounded-xl bg-white p-3">
        <div className="text-[13px] font-semibold">Ask the MSSN a question</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 400))}
          rows={3}
          placeholder="e.g. When is the next tutorial? How do I join IVC?"
          className="mt-1.5 w-full rounded-lg border border-[#10201e]/15 p-2 text-[14px]"
        />
        <button
          disabled={text.trim().length < 5}
          onClick={async () => {
            if (await onAsk(text.trim())) setText("");
          }}
          className="mt-1.5 w-full rounded-lg bg-[#10201e] py-2 text-[14px] font-bold text-[#fdf8ec] disabled:opacity-40"
        >
          Send
        </button>
      </div>
      {mineQ.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[13px] font-semibold">Your questions</div>
          {mineQ.slice(0, 5).map((q) => (
            <div key={q.id} className="rounded-xl bg-white p-2.5 text-[13px]">
              <div className="font-semibold">❓ {q.text}</div>
              <div className={q.answer ? "mt-1 text-[#1f6f63]" : "mt-1 opacity-60"}>
                {q.answer ? `💬 ${q.answer}` : "Waiting for an answer…"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const JERSEY_PRICE = 25;

/* ---------------- tennis ---------------- */
function TennisHud({
  t,
  onHit,
  onLeave,
}: {
  t: TennisState;
  onHit: () => void;
  onLeave: () => void;
}) {
  const hitRef = useRef(onHit);
  hitRef.current = onHit;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        hitRef.current();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const me = t.mySide;
  return (
    <>
      <div
        data-game-ui
        className="pointer-events-none absolute inset-x-0 top-[70px] z-30 flex justify-center"
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-[#14324d]/92 px-4 py-2 text-white shadow-xl">
          <span className="text-[12px] font-bold text-[#9fd0ff]">
            {me === 0 ? "You" : t.names[0]}
          </span>
          <span className="font-serif text-3xl tabular-nums">
            {t.score[0]} – {t.score[1]}
          </span>
          <span className="text-[12px] font-bold text-[#ffd59f]">
            {me === 1 ? "You" : t.names[1]}
          </span>
          <button onClick={onLeave} className="rounded-lg bg-white/10 px-2 py-0.5 text-[12px]">
            {t.phase === "over" ? "Done" : "Leave"}
          </button>
        </div>
      </div>
      {t.msg && (
        <div
          data-game-ui
          className="pointer-events-none absolute inset-x-0 top-[128px] z-30 flex justify-center px-3"
        >
          <div className="rounded-xl bg-[#fdf8ec]/95 px-4 py-2 text-center text-[14px] font-bold shadow-lg">
            {t.msg}
          </div>
        </div>
      )}
      {t.phase !== "over" && (
        <div
          data-game-ui
          className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] right-4 z-30"
        >
          <button
            onClick={onHit}
            className={`grid size-24 place-items-center rounded-full text-[18px] font-extrabold text-white shadow-xl active:scale-95 ${t.canHit ? "bg-[#2f6fa8]" : "bg-[#2f6fa8]/45"}`}
          >
            {t.myServe ? "Serve" : "Hit"}
            <span className="-mt-4 text-[10px] font-semibold opacity-70">Space</span>
          </button>
        </div>
      )}
    </>
  );
}

/* ---------------- skipping rope ---------------- */
function RopeHud({
  r,
  onTap,
  onAgain,
  onLeave,
}: {
  r: RopeState;
  onTap: () => void;
  onAgain: (role: "jump" | "turn") => void;
  onLeave: () => void;
}) {
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        tapRef.current();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const solo = !r.together && r.role !== "hold";
  return (
    <>
      <div
        data-game-ui
        className="pointer-events-none absolute inset-x-0 top-[70px] z-30 flex justify-center"
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-[#3a1a2a]/90 px-4 py-2 text-[#fdf8ec] shadow-xl">
          <span className="text-[12px] font-bold text-[#f3b6cc]">🪢 {r.names.jumper} jumping</span>
          <span className="font-serif text-3xl tabular-nums">{r.count}</span>
          {r.lives !== undefined && (
            <span className="text-[13px]">{"❤️".repeat(Math.max(0, r.lives))}</span>
          )}
          <button onClick={onLeave} className="rounded-lg bg-white/10 px-2 py-0.5 text-[12px]">
            Leave
          </button>
        </div>
      </div>
      <div
        data-game-ui
        className="pointer-events-none absolute inset-x-0 top-[128px] z-30 flex justify-center px-3"
      >
        <div className="rounded-xl bg-[#fdf8ec]/95 px-4 py-2 text-center text-[14px] font-bold shadow-lg">
          {r.phase === "count"
            ? r.role === "jump"
              ? `Get ready to jump… ${r.countdown}`
              : r.role === "turn"
                ? `Get ready to turn… ${r.countdown}`
                : `${r.names.jumper} jumps next… ${r.countdown}`
            : r.msg ||
              (r.role === "jump"
                ? "Tap Jump as the rope reaches your feet"
                : r.role === "turn"
                  ? "Tap Turn when the rope is at the top"
                  : `You're turning the rope with ${r.names.left === "You" ? r.names.right : r.names.left}. Your turn to jump comes next!`)}
          {r.together && (
            <div className="text-[11.5px] font-semibold opacity-70">
              Playing together · {r.uids.length} sisters here
            </div>
          )}
        </div>
      </div>
      <div
        data-game-ui
        className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] right-4 z-30 flex items-end gap-3"
      >
        {r.phase === "out" && solo ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onAgain("jump")}
              className="rounded-xl bg-[#8a2f4f] px-4 py-3 text-[14px] font-bold text-white shadow-xl"
            >
              🦘 Jump again
            </button>
            <button
              onClick={() => onAgain("turn")}
              className="rounded-xl bg-[#fdf8ec] px-4 py-3 text-[14px] font-bold shadow-xl"
            >
              🤲 Turn the rope
            </button>
          </div>
        ) : (
          r.role !== "hold" && (
            <button
              onClick={onTap}
              disabled={r.phase !== "play"}
              className="grid size-24 place-items-center rounded-full bg-[#8a2f4f] text-[18px] font-extrabold text-white shadow-xl active:scale-95 disabled:opacity-40"
            >
              {r.role === "jump" ? "Jump" : "Turn"}
              <span className="-mt-4 text-[10px] font-semibold opacity-70">Space</span>
            </button>
          )
        )}
      </div>
    </>
  );
}

/* ---------------- football match on the pitch ---------------- */
function MatchHud({
  m,
  act,
  onLeave,
}: {
  m: MatchState;
  act: (a: "shoot" | "pass" | "tackle" | "L" | "C" | "R") => void;
  onLeave: () => void;
}) {
  // keyboard: Space shoots, E passes, Q tackles
  const actRef = useRef(act);
  actRef.current = act;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        actRef.current("shoot");
      } else if (e.key === "e" || e.key === "E") actRef.current("pass");
      else if (e.key === "q" || e.key === "Q") actRef.current("tackle");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const mm = Math.floor(m.clock / 60),
    ss = Math.floor(m.clock % 60);
  const big = "grid place-items-center rounded-full font-extrabold shadow-xl active:scale-95";
  return (
    <>
      <div
        data-game-ui
        className="pointer-events-none absolute inset-x-0 top-[70px] z-30 flex justify-center"
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-[#10201e]/90 px-4 py-2 text-[#fdf8ec] shadow-xl">
          <span
            className={`text-[12px] font-bold text-[#7fd1c4] ${m.myTeam === 0 ? "underline" : ""}`}
          >
            {m.labels[0]}
          </span>
          <span className="font-serif text-3xl tabular-nums">
            {m.score[0]} – {m.score[1]}
          </span>
          <span
            className={`text-[12px] font-bold text-[#f0a070] ${m.myTeam === 1 ? "underline" : ""}`}
          >
            {m.labels[1]}
          </span>
          <span className="ml-1 rounded-lg bg-white/10 px-2 py-0.5 text-[12px] font-semibold tabular-nums">
            {m.phase === "pens"
              ? "Penalties"
              : `${m.half === 1 ? "1st" : "2nd"} · ${mm}:${String(ss).padStart(2, "0")}`}
          </span>
          {m.phase !== "over" && (
            <button
              onClick={onLeave}
              className="ml-1 rounded-lg bg-white/10 px-2 py-0.5 text-[12px]"
            >
              Leave
            </button>
          )}
        </div>
      </div>
      {m.msg && (
        <div
          data-game-ui
          className="pointer-events-none absolute inset-x-0 top-[132px] z-30 flex justify-center"
        >
          <div className="rounded-xl bg-[#fdf8ec]/95 px-4 py-2 text-center text-[15px] font-bold shadow-lg">
            {m.msg}
            {m.pen && (
              <div className="text-[12px] font-semibold opacity-70">
                You {m.pen.scored[0]}/{m.pen.taken[0]} · FC {m.pen.scored[1]}/{m.pen.taken[1]}
              </div>
            )}
          </div>
        </div>
      )}
      <div
        data-game-ui
        className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] right-4 z-30 flex items-end gap-3"
      >
        {m.phase === "pens" && m.pen ? (
          <div className="flex gap-2">
            {(["L", "C", "R"] as const).map((k) => (
              <button
                key={k}
                onClick={() => act(k)}
                className="rounded-xl bg-[#1f6f63] px-4 py-3 text-[14px] font-bold text-[#fdf8ec] shadow-xl"
              >
                {m.pen!.you === "shoot" ? "Shoot " : "Dive "}
                {k === "L" ? "left" : k === "C" ? "middle" : "right"}
              </button>
            ))}
          </div>
        ) : (
          <>
            <button
              onClick={() => act("tackle")}
              disabled={!m.canTackle}
              className={`${big} size-14 bg-[#b8573a] text-[12px] text-white disabled:opacity-35`}
            >
              Tackle
              <span className="-mt-3 text-[9px] font-semibold opacity-70">Q</span>
            </button>
            <button
              onClick={() => act("pass")}
              disabled={!m.hasBall}
              className={`${big} size-16 bg-[#fdf8ec] text-[14px] text-[#1f6f63] disabled:opacity-40`}
            >
              Pass
              <span className="-mt-3 text-[9px] font-semibold opacity-60">E</span>
            </button>
            <button
              onClick={() => act("shoot")}
              disabled={!m.hasBall || !!m.throwing}
              className={`${big} size-20 bg-[#e6b84a] text-[16px] text-[#2a1c05] disabled:opacity-40`}
            >
              Shoot
              <span className="-mt-3 text-[9px] font-semibold opacity-60">Space</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ---------------- where the bus goes ---------------- */
/** From outside a town you travel to its entrance (Ikorodu → Igbe Laara); inside a town
    you can ride to each of its bus stops. */
function travelOptions(here: string) {
  const hereRoot = rootOf(districtById(here)).id;
  const stopsOf = (root: string) => DISTRICTS.filter((x) => rootOf(x).id === root);
  const places = (d: (typeof DISTRICTS)[number]) =>
    d.landmarks
      .filter((l) => l.kind !== "home")
      .map((l) => l.name)
      .join(" · ") || "Homes and shops";
  const local = stopsOf(hereRoot)
    .filter((d) => d.id !== here)
    .map((d) => ({
      d,
      title: `🚏 ${d.busStop ?? d.name} Bus Stop · ${regionOf(d)}`,
      sub: places(d),
      local: true,
    }));
  const city = cityOf(districtById(here));
  const away = DISTRICTS.filter((d) => !d.parent && d.id !== hereRoot)
    .sort((a, b) => Number(cityOf(a) !== city) - Number(cityOf(b) !== city))
    .map((d) => {
      const stops = stopsOf(d.id);
      const far = cityOf(d) !== city;
      return {
        d,
        far,
        title: `${far ? "🌍 " : ""}${regionOf(d)}, ${d.state}`,
        sub:
          stops.length > 1
            ? `Arrive at ${d.busStop ?? d.name}. Bus stops: ${stops.map((x) => x.busStop ?? x.name).join(" · ")}`
            : places(d),
        local: false,
      };
    });
  return [...local.map((x) => ({ ...x, far: false })), ...away];
}

/* ---------------- live football: teams and the bench ---------------- */
function PitchLobby({
  r,
  me,
  watching,
  others,
  onTeam,
  onKickoff,
  onRestart,
  onGo,
  onLeave,
}: {
  r: PitchRoom;
  me: string;
  watching: MatchState | null;
  others: { id: string; name: string; km: number }[];
  onTeam: (t: 0 | 1) => void;
  onKickoff: () => void;
  onRestart: () => void;
  onGo: (id: string) => void;
  onLeave: () => void;
}) {
  const room = r.room;
  const host = room?.host === me;
  const mine = r.players[me];
  const queue = Object.entries(r.queue).sort((a, b) => a[1].at - b[1].at);
  const place = queue.findIndex(([u]) => u === me);
  const team = (t: 0 | 1) =>
    Object.entries(r.players)
      .filter(([, v]) => v.team === t)
      .sort((a, b) => a[1].at - b[1].at);
  const btn = "w-full rounded-xl py-3 font-bold";
  return (
    <div data-game-ui className="absolute inset-x-3 bottom-3 z-40 mx-auto max-w-md">
      <div className="rounded-2xl bg-[#fdf8ec] p-4 shadow-2xl">
        {room?.status === "playing" ? (
          <div className="space-y-2">
            <div className="text-[13px] font-bold uppercase tracking-wide text-[#1f6f63]">
              Match on ·{" "}
              {watching ? `Team A ${watching.score[0]} – ${watching.score[1]} Team B` : "watching"}
            </div>
            <p className="text-[15px]">
              {place >= 0
                ? `You're on the bench, number ${place + 1} in line. You'll come on when a player leaves.`
                : "You're watching this match."}
            </p>
            {others.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[12px] font-semibold opacity-70">Or go to another pitch:</div>
                {others.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => onGo(o.id)}
                    className="w-full rounded-xl border border-[#1f6f63]/25 bg-white px-3 py-2 text-left text-[14px] font-bold"
                  >
                    ⚽ {o.name}{" "}
                    <span className="font-normal opacity-60">· {o.km.toFixed(1)} km</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={onLeave} className={`${btn} border border-[#10201e]/20 bg-white`}>
              Leave the bench
            </button>
          </div>
        ) : room?.status === "waiting" ? (
          <div className="space-y-3">
            <div className="text-[13px] font-bold uppercase tracking-wide text-[#1f6f63]">
              Picking teams · up to 3 a side
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1] as const).map((t) => (
                <div
                  key={t}
                  className={`rounded-xl p-2.5 ${t === 0 ? "bg-[#1f6f63]/10" : "bg-[#d8682a]/10"}`}
                >
                  <div className="text-[13px] font-bold">{t === 0 ? "Team A" : "Team B"}</div>
                  {team(t).map(([u, v]) => (
                    <div key={u} className="truncate text-[13px]">
                      {u === room.host ? "⭐ " : "• "}
                      {v.name}
                      {u === me ? " (you)" : ""}
                    </div>
                  ))}
                  {team(t).length < MAX_PER_TEAM && (
                    <div className="text-[12px] opacity-50">+ computer players</div>
                  )}
                  {mine && mine.team !== t && (
                    <button
                      onClick={() => onTeam(t)}
                      className="mt-1.5 w-full rounded-lg bg-white py-1.5 text-[12px] font-bold"
                    >
                      Join {t === 0 ? "Team A" : "Team B"}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {place >= 0 && <p className="text-[13px]">Both teams are full: you're on the bench.</p>}
            {host ? (
              <button onClick={onKickoff} className={`${btn} bg-[#1f6f63] text-[#fdf8ec]`}>
                Bismillah · kick off
              </button>
            ) : (
              <p className="text-center text-[13px] opacity-70">
                Waiting for {r.players[room.host]?.name ?? "the host"} to kick off…
              </p>
            )}
            <button onClick={onLeave} className={`${btn} border border-[#10201e]/20 bg-white`}>
              Leave
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[15px]">The match has finished. Start another one?</p>
            <button onClick={onRestart} className={`${btn} bg-[#1f6f63] text-[#fdf8ec]`}>
              Start a new match
            </button>
            <button onClick={onLeave} className={`${btn} border border-[#10201e]/20 bg-white`}>
              Leave
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- food and the phone ---------------- */
function FoodView({
  where,
  points,
  hunger,
  onBuy,
}: {
  where: "order" | "eatery";
  points: number;
  hunger: number;
  onBuy: (d: Dish) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] opacity-75">
        {where === "order"
          ? "Delivered to you wherever you are by an IlmDash rider. Cheaper than the eatery."
          : "Fresh and hot, straight away. Ordering on your phone costs less."}{" "}
        Food {hunger}% · you have {N(points)}.
      </p>
      {MENU.map((d) => {
        const price = where === "eatery" ? eateryPrice(d) : d.points;
        return (
          <button
            key={d.id}
            onClick={() => onBuy(d)}
            className="flex w-full items-center gap-3 rounded-xl border border-[#1f6f63]/20 bg-white px-3 py-2.5 text-left"
          >
            <span className="text-[26px]">{d.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold">{d.name}</span>
              <span className="block text-[12px] opacity-65">fills {d.fills}%</span>
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-[13px] font-bold ${points >= price ? "bg-[#1f6f63] text-[#fdf8ec]" : "bg-[#10201e]/10 opacity-60"}`}
            >
              {N(price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function HungryView({ onOrder, onEatery }: { onOrder: () => void; onEatery: () => void }) {
  return (
    <div className="space-y-3">
      <p>You're too hungry to do anything else. Eat first, then carry on.</p>
      <button
        onClick={onOrder}
        className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
      >
        📱 Order food (cheaper)
      </button>
      <button
        onClick={onEatery}
        className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold"
      >
        🍗 Walk to the nearest eatery
      </button>
      <p className="text-[12px] opacity-70">You can still pray and go home while you're hungry.</p>
    </div>
  );
}

function NoPointsView({ price, points }: { price: number; points: number }) {
  return (
    <div className="space-y-3">
      <p>
        This costs {N(price)} and you have {N(points)}.
      </p>
      <p className="rounded-xl bg-white p-3 text-[14px]">
        Earn money by praying on time (+₦20 for each fard salah), lecture minutes and the mosque
        quiz, or top up your wallet.
      </p>
      <button
        disabled
        className="w-full rounded-xl bg-[#e6b84a] py-3 font-bold text-[#2a1c05] opacity-60"
      >
        Top up · coming soon with Paystack
      </button>
    </div>
  );
}

function PhoneView({
  myNumber,
  onWallet,
  onRooms,
  onHomes,
  onCalls,
  onContacts,
  onFood,
  onOutings,
  onTravel,
  onPlaces,
}: {
  myNumber?: string;
  onWallet: () => void;
  onRooms: () => void;
  onHomes: () => void;
  onCalls: () => void;
  onContacts: () => void;
  onFood: () => void;
  onOutings: () => void;
  onTravel: () => void;
  onPlaces: () => void;
}) {
  const now = new Date();
  const icon = (bg: string, e: ReactNode, name: string, on?: () => void) => (
    <button
      key={name}
      onClick={on}
      disabled={!on}
      className={`flex flex-col items-center gap-1 text-[11px] font-semibold text-white ${on ? "" : "opacity-45"}`}
    >
      <span
        className="grid size-[54px] place-items-center rounded-[16px] text-[28px] shadow-lg"
        style={{ background: bg }}
      >
        {e}
      </span>
      <span className="max-w-[70px] truncate">{name}</span>
    </button>
  );
  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="pt-6 text-center text-white">
        <div className="text-[54px] font-light leading-none tracking-tight">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="mt-1 text-[13px] opacity-80">
          {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
        </div>
        {myNumber && (
          <div className="mx-auto mt-2 w-fit rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold tracking-wide">
            📞 My number: {myNumber}
          </div>
        )}
      </div>
      <div className="mt-10 grid grid-cols-4 gap-x-2 gap-y-5">
        {icon("#2f8f3a", "🛵", "IlmDash", onFood)}
        {icon(
          "transparent",
          <img src="/outingstation-icon.png" alt="" className="size-[54px] rounded-[16px]" />,
          "OutingStation",
          onOutings,
        )}
        {icon("#3a7bd5", "🚌", "Travel", onTravel)}
        {icon("#1f6f63", "📍", "Places", onPlaces)}
        {icon("#2e7d32", "📞", "Calls", onCalls)}
        {icon("#8a2f4f", "👥", "Contacts", onContacts)}
        {icon("#c77d2a", "🏠", "Homes", onHomes)}
        {icon("#5a3f6a", "🔑", "Rooms", onRooms)}
        {icon("#1d6b3a", "💰", "Wallet", onWallet)}
      </div>
      <div className="mt-auto rounded-[22px] bg-white/15 p-2.5 backdrop-blur">
        <div className="grid grid-cols-4 gap-2">
          {icon("#2e7d32", "📞", "Phone", onCalls)}
          {icon("#2f8f3a", "🛵", "Food", onFood)}
          {icon("#3a7bd5", "🚌", "Travel", onTravel)}
          {icon("#1f6f63", "📍", "Places", onPlaces)}
        </div>
      </div>
    </div>
  );
}
