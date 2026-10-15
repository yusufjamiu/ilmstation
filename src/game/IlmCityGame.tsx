import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IlmCityEngine, type Context } from "./engine";
import { TravelMap } from "./TravelMap";
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
  districtById,
  type Lecture,
  type District,
  type Question,
  PLACE_DHIKR,
  CAMPUS_GIST,
  FOUND_ITEMS,
  POLICE,
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
  /** something you found and are taking to the police */
  carrying?: FoundKind;
  /** you kept something that wasn't yours */
  wanted?: { at: number; item: FoundKind };
  /** you are in the police cell */
  jail?: { item: FoundKind };
  /** your own Qur'an player */
  radio?: { on: boolean; reciter: string; playlist: string; vehicles: boolean };
};
type Look = { name: string; female: boolean; skin: number; robe: number; accent: number };
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
    text: "A big furnished family house on the street and 600 points to start.",
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
  | { kind: "info"; title: string; body: ReactNode }
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
  const offset = useTestOffset();
  const [clock, setClock] = useState<Clock>(() => clockFor(city, Date.now() + offset));
  const clockRef = useRef(clock);
  clockRef.current = clock;
  const [ctx, setCtx] = useState<Context>(null);
  const [place, setPlace] = useState(
    () => `${districtById(save.district ?? "lekki").name} · Lagos`,
  );
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
  const [travelling, setTravelling] = useState<{ from: string; to: string; byCar: boolean } | null>(
    null,
  );

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

  /** Finish a step of the guided start: +10 points. */
  const advance = useCallback(
    (step: number) => {
      if (saveRef.current.guide !== step) return;
      saveRef.current = { ...saveRef.current, guide: step + 1 };
      update((x) => ({ ...x, guide: step + 1, coins: x.coins + 10 }));
      toast(
        step < GUIDE.length
          ? `Step ${step} done! +10 points`
          : "You're ready. Enjoy IlmWorld! +10 points",
        "good",
      );
    },
    [toast, update],
  );
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
              `🔥 ${n}-day streak!${streakBonus ? ` Bonus +${streakBonus} points.` : " Come back tomorrow to keep it going."}`,
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
          ? `Masha Allah! You completed your whole day. +${TASK_POINTS + DAY_BONUS} points`
          : `✅ ${task?.text ?? "Task"} · +${TASK_POINTS} points`,
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
      `The ${FOUND_ITEMS[k].name} will go back to its owner. JazakAllahu khairan! +${POLICE.handInPoints} points, +${POLICE.handInIlm} Ilm`,
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
            `🚓 Police! You were arrested for keeping a ${FOUND_ITEMS[item].name} that wasn't yours. It goes back to its owner (−${v} points).`,
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
    (area: string) => {
      setNewArea(null);
      setPanel({
        kind: "info",
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
      advance(3);
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
              onPay={(pts, next, msg) => {
                if (saveRef.current.coins < pts) return;
                update((x) => ({ ...x, coins: x.coins - pts }));
                setOwn(next);
                toast(msg, "good");
                setTimeout(render, 0);
              }}
              onPaystack={(amount, what) =>
                toast(
                  `Paystack checkout for ${what} (₦${amount.toLocaleString()}) is coming next. For now, use points.`,
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
                setInside(true);
              }}
              onRooms={(rooms, earned) => {
                const own2 = saveRef.current.plots?.[pid];
                if (own2?.kind !== "built" && own2?.kind !== "bought") return;
                update((x) => ({ ...x, coins: x.coins + earned }));
                setOwn({ ...own2, rooms });
                toast(
                  `A tenant moved in and paid ${earned} points for the week. Alhamdulillah!`,
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
                toast(`You collected ${due} points of rent. Alhamdulillah!`, "good");
                setTimeout(render, 0);
              }}
            />
          ),
        });
      };
      render();
    },
    [toast, update],
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
      });
    else if (trader && info?.kind === "stall")
      e.setShop(sid, {
        name: trader.name,
        imgs: trader.items.map(([em]) => emojiPic(em)),
        open: true,
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
              onFood={() => {
                if (saveRef.current.coins < 5) {
                  toast("A meal costs 5 points.", "warn");
                  return;
                }
                update((x) => ({ ...x, coins: x.coins - 5 }));
                need({ hunger: 40 });
                doTask("eat");
                setPanel(null);
                toast("Bismillah… delicious! Alhamdulillah. −5 points", "good");
              }}
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
                toast(`Sales collected: +${due} points. May Allah bless your trade.`, "good");
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
    [toast, update, paintShop, doTask, need],
  );

  /** Step-by-step wudu; `then` runs after (for example, the prayer you were about to start). */
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
              advance(1);
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
              advance(3);
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
                  `You prayed ${fard.name} in jama'ah. May Allah accept it. +2 points, +5 Ilm`,
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
              const pay = Math.round(job.pay * (0.5 + (0.5 * right) / total));
              update((x) => ({
                ...x,
                coins: x.coins + pay,
                ilm: x.ilm + 2,
                worked: clockRef.current.key,
              }));
              need({ energy: -15, social: 10 });
              setPanel(null);
              toast(
                `Salary paid: +${pay} points. Hard work is worship when the intention is right.`,
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
              toast(
                `You are now a ${j.name.toLowerCase()} at ${j.place}. Shift: ${hoursText(j)}. Pay: ${j.pay} points a day.`,
                "good",
              );
            }}
            onGo={(j) => {
              setPanel(null);
              if (j.area && engine.current?.districtId() !== j.area) {
                toast(
                  `Your work is in ${fullName(districtById(j.area))}. Take a danfo there (☰ Menu → Travel).`,
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
                  💼 Start my shift · {job.pay} pts
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
        setPanel({
          kind: "busy",
          title: "Playing football with the brothers",
          ms: 4000,
          done: () => {
            need({ energy: -12, social: 15, hunger: -8 });
            toast("Good game! A strong believer is better and more beloved to Allah.", "good");
          },
        });
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
                  `Take the ${it.name} to the police station or a Hisbah officer. ☰ Menu → Places shows the way.`,
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
                Anyone caught keeping what isn't theirs is arrested. Bail is {POLICE.bailPoints}{" "}
                points or {POLICE.bailIlm} Ilm, or {POLICE.cellMinutes} minutes in the cell.
              </p>
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
          kind: "busy",
          title: "Skipping rope with the sisters",
          ms: 4000,
          done: () => {
            need({ energy: -8, social: 18, hunger: -5 });
            toast("Bismillah… 1, 2, 3… you skipped 40 times! Masha Allah.", "good");
          },
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
                Any place in {fullName(districtById(area))} for 3 points.
              </p>
              <PlacesView
                area={area}
                onGo={(prefix) => {
                  if (saveRef.current.coins < 3) {
                    toast("The keke fare is 3 points. Earn points at a mosque or school.", "warn");
                    return;
                  }
                  setPanel(null);
                  if (e.kekeTo(prefix)) {
                    tuneRef.current();
                    sayDhikr("ride");
                    update((x) => ({ ...x, coins: x.coins - 3 }));
                    advance(4);
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
          toast(`The fare is ${BUS_FARE} points. Earn points at a mosque lecture or quiz.`, "warn");
          return;
        }
        if (e.boardBus()) {
          tuneRef.current();
          sayDhikr("ride");
          advance(4);
          update((x) => ({ ...x, coins: x.coins - BUS_FARE }));
          toast(`Bismillah! You paid ${BUS_FARE} points. Tap "Get off" before your stop.`, "good");
        }
        return;
      }
      if (id.startsWith("arrived:")) {
        toast(`You got off in ${districtById(id.slice(8)).name}.`, "good");
        return;
      }
      if (id.startsWith("door:masjid:")) {
        advance(2);
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
        e.enterInterior("home", `Your flat · ${districtById(mine).name}`);
        setInside(true);
        sayDhikr("enterHome");
        return;
      }
      if (id === "bath") {
        setPanel({
          kind: "info",
          title: "Bathroom",
          body: (
            <div className="space-y-2">
              <button
                onClick={() => openWudu()}
                className="w-full rounded-xl bg-[#1f6f63] px-4 py-3 text-left font-bold text-[#fdf8ec]"
              >
                💧 Make wudu
              </button>
              <button
                onClick={() => {
                  setPanel(null);
                  update((x) => ({ ...x, wudu: false }));
                  toast(
                    'Entering: "Allahumma inni a\'udhu bika minal-khubuthi wal-khaba\'ith." Leaving: "Ghufranak."',
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
      if (id.startsWith("door:madrasah:")) {
        e.enterInterior("madrasah", landmarkName(id.slice(14)));
        setInside(true);
        return;
      }
      if (id === "exit") {
        const was = e.scenePlace();
        e.exitInterior();
        setInside(false);
        tuneRef.current();
        if (was === "home") sayDhikr("leaveHome");
        else if (was === "masjid") sayDhikr("leaveMasjid");
        return;
      }
      if (id === "car") {
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
      if (id === "bus") {
        const here = e.districtId();
        const carHere = e.carHere();
        const inCar = e.isDriving();
        const go = (to: string, byCar: boolean) => {
          if (!byCar && saveRef.current.coins < BUS_FARE) {
            toast(
              `The bus fare is ${BUS_FARE} points. Earn points at a mosque lecture or quiz.`,
              "warn",
            );
            return;
          }
          setPanel(null);
          const d = districtById(to);
          arriveRef.current = () => {
            e.travel(to, byCar);
            advance(4);
            advance(3);
            setDriving(false);
            setInside(false);
            update((x) => ({
              ...x,
              coins: byCar ? x.coins : x.coins - BUS_FARE,
              district: to,
              car: byCar ? e.carPos() : x.car,
              pos: undefined,
            }));
            setTravelling(null);
            setArriving(d.name);
          };
          setTravelling({ from: here, to, byCar });
        };
        setPanel({
          kind: "info",
          title: inCar ? "Where are you driving?" : "Where are you going?",
          body: (
            <div className="grid gap-2">
              {DISTRICTS.filter((d) => d.id !== here).map((d) => (
                <div key={d.id} className="rounded-xl border border-[#10201e]/15 p-3">
                  <div className="font-bold">
                    {d.name}, {d.state}
                  </div>
                  <div className="text-[12.5px] opacity-75">
                    {d.landmarks
                      .filter((l) => l.kind !== "home")
                      .map((l) => l.name)
                      .join(" · ") || "Homes and shops"}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {!inCar && (
                      <button
                        onClick={() => go(d.id, false)}
                        className="flex-1 rounded-lg bg-[#f2c230] px-3 py-2 text-[13px] font-bold text-[#2a1c05]"
                      >
                        Bus · {BUS_FARE} pts
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
        setPanel({
          kind: "busy",
          title: "Bismillah… cooking jollof rice",
          ms: 3000,
          done: () => {
            need({ hunger: 60 });
            doTask("eat");
            sayDhikr("afterEating");
          },
        });
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
          body: <AdView boardName={b.name} ad={b.ad} />,
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
    e.setClock(clockRef.current);
    if (saveRef.current.profile) e.setPlayerLook(saveRef.current.profile);
    e.setHomeItems(saveRef.current.items ?? []);
    // every visit starts at home: you are only out in the city while you are playing
    {
      const sv = saveRef.current;
      if (sv.profile) {
        const home = sv.homeArea ?? sv.district ?? "lekki";
        const nm = districtById(home).name;
        if (sv.homePlot && e.plots.some((q) => q.id === sv.homePlot))
          e.startAtPlot(sv.homePlot, `Family house · ${nm}`);
        else e.startAtHome(home, `Your flat · ${nm}`);
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
      const c = clockFor(city, Date.now() + offset);
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
            ? o.watchArea(ar, (list) => engine.current?.setRemotePlayers(list))
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
                      toast(`+${gain} points from the Hisbah`, "good");
                      return ask.kind === "prayer"
                        ? `MashaAllah! May Allah accept it from you. Keep guarding your salah. (+${gain} points)`
                        : `Barakallahu fik! The Qur'an will come on the Day of Judgement to intercede for its companions. (+${gain} points)`;
                    }
                    engine.current?.talkGesture(hi, "headShake");
                    update((x) => ({ ...x, coins: Math.max(0, x.coins - gain) }));
                    toast(`−${gain} points. Go and make it up, in shaa Allah.`, "warn");
                    return ask.kind === "prayer"
                      ? `Fear Allah, my ${saveRef.current.profile?.female ? "sister" : "brother"}! Salah is the first deed we will be asked about on the Day of Judgement. ${cp2 ? `${cp2.name} time ends at ${fmtTime(cp2.end)}.` : ""} Go to the masjid now. (−${gain} points)`
                      : `Fear Allah, my ${saveRef.current.profile?.female ? "sister" : "brother"}. Do not leave the Qur'an behind. Read even one page today, in shaa Allah. (−${gain} points)`;
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
            `Your ${ECONOMY.build[o.floors].name.toLowerCase()} is ready! Rent it out to earn points.`,
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

  const goal =
    save.profile && (save.guide ?? 99) > GUIDE.length && !panel && !ride
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
          : "That place isn't in this area. Use ☰ Menu → Travel.",
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
            onBuy={(ids, pts) => {
              if (saveRef.current.coins < pts) return;
              const items = [...new Set([...(saveRef.current.items ?? []), ...ids])];
              update((x) => ({ ...x, coins: x.coins - pts, items }));
              engine.current?.setHomeItems(items);
              setPanel(null);
              toast(
                `Delivered to your flat! ${ids.length} item${ids.length > 1 ? "s" : ""} −${pts} points`,
                "good",
              );
            }}
            onNaira={(_ids, naira) =>
              toast(
                `Paystack checkout for ₦${naira.toLocaleString()} is coming next. For now, use points.`,
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
              {save.coins} pts
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
            onClick={() =>
              setPanel({
                kind: "info",
                title: "Menu",
                body: (
                  <MenuView
                    items={[
                      { icon: "🚌", label: "Travel", run: () => (setPanel(null), travelNow()) },
                      {
                        icon: "📍",
                        label: "Places",
                        run: () => openPlaces(engine.current?.districtId() ?? "lekki"),
                      },
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
                      { icon: "🚪", label: "Exit", run: () => (window.location.href = "/app") },
                    ]}
                  />
                ),
              })
            }
            className="pointer-events-auto relative rounded-xl bg-[#fdf8ec] px-3 py-1.5 text-[12px] font-bold text-[#1f6f63] shadow"
          >
            ☰ Menu
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#b8573a] text-[11px] text-white">
                {unread}
              </span>
            )}
          </button>
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
                    ? `🎧 ${SURAH_NAMES[radioState.surah - 1]}`
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
          onDone={(look, area, path) => {
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
            let msg = `Welcome home, ${look.name}! Your flat has a bed and a bathroom. Here is a gift of 100 points to start.`;
            if (path === "rich") {
              // the family house: one of the big houses on the street, furnished
              const p = e.plots.find((q) => q.district === area && q.kind === "house" && q.toLet);
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
              msg = `Welcome to the family house, ${look.name}! It is fully furnished, and here are 600 points.`;
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
              msg = `Welcome home, ${look.name}! Choose your job from ☰ Menu → Work. Here are 100 points to start.`;
            e.setHomeItems(items);
            if (homePlot) e.startAtPlot(homePlot, `Family house · ${districtById(area).name}`);
            else e.startAtHome(area, `Your flat · ${districtById(area).name}`);
            setInside(true);
            const next = {
              ...saveRef.current,
              profile: look,
              guide: 1,
              coins: saveRef.current.coins + bonus,
              district: area,
              homeArea: area,
              homePlot,
              items,
              needs: freshNeeds(),
              wudu: false,
              plots,
              shops,
              path,
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
              if (!engine.current?.goToZone(prefix)) toast("Go outside first.");
            }}
            onNext={() => advance(GUIDE.length)}
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
              Lagos State
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
            advance(3);
            doTask("learn");
            if (panel.kind !== "quiz" || panel.picked !== undefined) return;
            const ok = i === panel.q.a;
            setPanel({ ...panel, picked: i });
            if (ok) {
              update((x) => ({ ...x, coins: x.coins + POINTS.perCorrectAnswer, ilm: x.ilm + 10 }));
              toast(`Correct! +${POINTS.perCorrectAnswer} points, +10 Ilm`, "good");
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

function AdView({ boardName, ad }: { boardName: string; ad?: (typeof BILLBOARDS)[number]["ad"] }) {
  const [copied, setCopied] = useState(false);
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
      <p className="mt-4 text-sm">To put your brand on billboards across IlmWorld, contact:</p>
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
        ❓ Take the quiz · +{POINTS.perCorrectAnswer} points per correct answer
      </button>
      <p className="text-[12px] opacity-70">
        Lectures pay {POINTS.perLectureMinute} point per minute you listen, up to{" "}
        {POINTS.lectureDailyCap} a day.
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
          ? "you have earned today's lecture points. Keep listening for the reward with Allah."
          : `+${POINTS.perLectureMinute} point each minute (${earned}/${POINTS.lectureDailyCap} today)`}
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
          `It's on ${STREETS[school.street].name}. Go inside and answer the quiz to learn and earn points.`,
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
          {extend ? "Extend" : "Rent"} {k === "week" ? "7 days" : "1 month"} · {R[k].points} points
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
        Buy this house · {price.toLocaleString()} points
        <span className="block text-[12px] font-medium opacity-80">
          Rent out its {beds} rooms for {ROOM_RENT_WEEK} points a week each
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
        <p className="text-[13px] opacity-75">You have {points} points.</p>
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
          to earn points.
        </p>
        <p className="text-[13px] opacity-75">You have {points} points.</p>
        <button
          disabled={points < ECONOMY.land.points}
          className={primary}
          onClick={() =>
            onPay(ECONOMY.land.points, { kind: "owned" }, "Alhamdulillah! The land is yours.")
          }
        >
          Buy the land · {ECONOMY.land.points.toLocaleString()} points
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
              {b.name} · {b.points.toLocaleString()} points · {b.minutes} min
              <span className="block text-[12px] font-medium opacity-80">
                Tenants pay {b.tenantPerDay} points a day
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
          ? `${own.tenant} live here and pay ${b.tenantPerDay} points a day.`
          : "Nobody lives here yet."}
      </p>
      {own.tenant ? (
        <button disabled={due < 1} className={primary} onClick={onCollect}>
          Collect rent · {due} points
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
          rooms={own.rooms ?? []}
          count={roomsIn(own.floors)}
          onRooms={(rooms, earned) => onRooms(rooms, earned)}
        />
      )}
    </div>
  );
}

/** Rooms in a house you own: each can be rented to a tenant for a week at a time. */
function RoomsView({
  rooms,
  count,
  onRooms,
}: {
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
            {!live && (
              <button
                onClick={() => rentOut(i)}
                className="shrink-0 rounded-lg bg-[#1f6f63] px-2.5 py-1.5 text-[12px] font-bold text-[#fdf8ec]"
              >
                Rent out · +{ROOM_RENT_WEEK}
              </button>
            )}
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
          +{SCHOOL_POINTS.perCorrect} points per correct answer, up to {SCHOOL_POINTS.dailyCap} a
          day ({earned} today).
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
function shrinkPhoto(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const s = Math.min(1, 320 / Math.max(im.width, im.height));
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
            🍽️ Buy something to eat · 5 points
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
            <p className="text-[13px] opacity-75">You have {points} points.</p>
            {(["week", "month"] as const).map((k) => (
              <button
                key={k}
                disabled={points < P.shop[k].points}
                className={primary}
                onClick={() => onRent(P.shop[k].days, P.shop[k].points)}
              >
                Rent {k === "week" ? "7 days" : "1 month"} · {P.shop[k].points} points
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
            ? `💰 Collect sales · ${salesDue(own!)} points`
            : `Customers are buying · about ${SHOP_SALES_PER_DAY} points a day`}
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
          Extend 7 days · {SHOP_PRICES.shop.week.points} points
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
  onDone: (look: Look, area: string, path: LifePath) => void;
}) {
  const [step, setStep] = useState<"welcome" | "account" | "look" | "area" | "life">("welcome");
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
                onClick={() => onDone({ ...look, name: look.name.trim() }, area, p.id)}
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
            {DISTRICTS.map((d) => (
              <button
                key={d.id}
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
            ))}
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
            A Muslim city in Lagos that runs on real prayer times. Pray, learn, travel by danfo,
            rent a home and run your own business.
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
                Log in with your IlmStation account to keep your points, home and shop on every
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
const GUIDE: { title: string; text: string; go?: { prefix: string; label: string } }[] = [
  {
    title: "Make wudu",
    text: "You are home. Walk to the bathroom and make wudu, step by step.",
    go: { prefix: "bath", label: "Show me the bathroom" },
  },
  {
    title: "Visit the masjid",
    text: "Go outside and walk to the nearest mosque. Follow the marker on the ground.",
    go: { prefix: "door:masjid:", label: "Show me the way" },
  },
  {
    title: "Pray or learn",
    text: "Inside, pray, listen to a lecture or take the quiz. It all earns points.",
  },
  {
    title: "Ride a keke or danfo",
    text: "Stand by the road and a keke will stop for you, or wait at a bus stop for a danfo.",
    go: { prefix: "busstop:", label: "Show me a bus stop" },
  },
  {
    title: "Your day",
    text: "Tap 📋 My Day for today's tasks, and watch your needs under the clock: food, energy, iman, friends and clean. Buy furniture with 🛋️ Home.",
  },
];

function Guide({
  step,
  onGo,
  onNext,
  onSkip,
}: {
  step: number;
  onGo: (prefix: string) => void;
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
            Step {step} of {GUIDE.length} · +10 points
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
        {step === GUIDE.length && (
          <button
            onClick={onNext}
            className="mt-2 rounded-lg bg-[#e6b84a] px-3 py-1.5 text-[13px] font-bold text-[#2a1c05]"
          >
            Got it
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
      <p className="text-[13px] opacity-75">You have {points} points.</p>
      {(["week", "month"] as const).map((k) => (
        <button
          key={k}
          disabled={points < P[k].points}
          onClick={() => onPoints(P[k].days, P[k].points)}
          className={`${btn} bg-[#1f6f63] text-[#fdf8ec] disabled:opacity-50`}
        >
          {k === "week" ? "1 week" : "1 month"} · {P[k].points} points
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
        Pay with {pts} points
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
  { id: "hunger", icon: "🍽️", name: "Food", tip: "Cook at home or buy food at a market." },
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
        {doneN} of {DAY_TASKS.length} done · +{TASK_POINTS} points each, +{DAY_BONUS} when you
        finish them all
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
  onBuy,
  onNaira,
}: {
  owned: string[];
  points: number;
  onBuy: (ids: string[], pts: number) => void;
  onNaira: (ids: string[], naira: number) => void;
}) {
  const left = HOME_ITEMS.filter((i) => !owned.includes(i.id));
  const [pick, setPick] = useState<string[]>([]);
  const chosen = left.filter((i) => pick.includes(i.id));
  const pts = chosen.reduce((a, i) => a + itemPoints(i), 0);
  const naira = chosen.reduce((a, i) => a + i.naira, 0);
  if (!left.length) return <p>Masha Allah, your home is fully furnished!</p>;
  return (
    <div className="space-y-2">
      <p className="text-[13px] opacity-75">
        Your flat has a bed and a bathroom. Pick what to add. You have {points} points.
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
                ₦{i.naira} · {itemPoints(i)} pts
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
          ? `Buy ${chosen.length} item${chosen.length > 1 ? "s" : ""} · ${pts} points`
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
                {j.pay} pts/day
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
  if (n && n.hunger < 30)
    return (s.items ?? []).includes("kitchen")
      ? { text: "You're hungry: cook at home", prefix: inside ? "eat" : homeDoor }
      : { text: "You're hungry: buy food at the market", prefix: `stall:${area}-m` };
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
  return { text: "Explore another area of Lagos", act: "travel" };
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
    label: RECITERS.find((r) => r.id === c.reciter)?.name ?? "Qur'an",
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
  onLeave,
}: {
  library: boolean;
  about: string;
  onLeave: () => void;
}) {
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
  onChange,
  onSkip,
  onVehicleMute,
}: {
  cfg: { on: boolean; reciter: string; playlist: string; vehicles: boolean };
  riding: "danfo" | "keke" | "car" | null;
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
              ? `Surah ${SURAH_NAMES[st.surah - 1]} · ${st.source.label}`
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
        {NASHEEDS.length === 0 ? (
          <p className="mt-0.5 opacity-75">Coming soon, in shaa Allah.</p>
        ) : (
          <p className="mt-0.5 opacity-75">{NASHEEDS.length} nasheeds</p>
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
        Pay bail · {POLICE.bailPoints} points
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
