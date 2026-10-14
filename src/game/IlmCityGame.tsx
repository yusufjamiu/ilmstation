import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IlmCityEngine, type Context } from "./engine";
import { TravelMap } from "./TravelMap";
import { loadHumans } from "./humans";
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
  SHOP_PRICES,
  MARKET_TRADERS,
  fullName,
  districtById,
  type Lecture,
  type Question,
} from "./content";
import {
  CITIES,
  clockFor,
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
};
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
const KEY = "ilmcity-3d-v1";
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

export default function IlmCityGame() {
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
  const offset = useTestOffset();
  const [clock, setClock] = useState<Clock>(() => clockFor(city, Date.now() + offset));
  const clockRef = useRef(clock);
  clockRef.current = clock;
  const [ctx, setCtx] = useState<Context>(null);
  const [place, setPlace] = useState(
    () => `${districtById(save.district ?? "lekki").name} · Lagos`,
  );
  const [panel, setPanel] = useState<Panel | null>(null);
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

  // new day resets the daily salah tracker
  useEffect(() => {
    if (save.day !== clock.key)
      update((s) => ({ ...s, day: clock.key, prayed: {}, asked: [], lectureMin: 0, schoolPts: 0 }));
  }, [clock.key, save.day, update]);

  const openLecture = useCallback(
    (lec: Lecture, live: boolean) =>
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
      }),
    [update],
  );

  const openPlot = useCallback(
    (pid: string) => {
      const e = engine.current;
      const p = e?.plotInfo(pid);
      if (!e || !p) return;
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
              : own?.kind === "rented" && own.until > Date.now()
                ? "Your house"
                : "House to let",
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
      const D = districtById(info.district);
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
              points={saveRef.current.coins}
              onRent={(days, pts) => {
                if (saveRef.current.coins < pts) return;
                const prev = saveRef.current.shops?.[sid];
                const next: ShopOwn = {
                  until: Math.max(Date.now(), prev?.until ?? 0) + days * 86400000,
                  name: prev?.name ?? "",
                  products: prev?.products ?? [],
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
    [toast, update, paintShop],
  ); /** Pray in the masjid: the obligatory prayer if it is due, or two voluntary rak'ahs. */
  const startPrayer = useCallback(
    (voluntary: boolean) => {
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
              if (fard) {
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
    [toast, update],
  );

  /* ---------- actions coming from the 3D world ---------- */
  const onAction = useCallback(
    (id: string) => {
      const e = engine.current;
      if (!e) return;
      const c = clockRef.current,
        s = saveRef.current;
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
            </div>
          ),
        });
        return;
      }
      if (id.startsWith("shop:") || id.startsWith("stall:")) {
        openShop(id.slice(id.indexOf(":") + 1));
        return;
      }
      if (id.startsWith("plot:")) {
        openPlot(id.slice(5));
        return;
      }
      if (id.startsWith("talk:")) {
        const i = Number(id.slice(5));
        const who = e.talkTo(i);
        if (!who) return;
        talkingRef.current = i;
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
        const lid = id.slice(12);
        const name = landmarkName(lid);
        e.enterInterior("masjid", name);
        setInside(true);
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
        e.enterInterior("home", "Your Home");
        setInside(true);
        return;
      }
      if (id.startsWith("door:madrasah:")) {
        e.enterInterior("madrasah", landmarkName(id.slice(14)));
        setInside(true);
        return;
      }
      if (id === "exit") {
        e.exitInterior();
        setInside(false);
        return;
      }
      if (id === "car") {
        e.enterCar();
        setDriving(true);
        toast("Bismillah. Drive safely.");
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
        return;
      }
      if (id === "sleep") {
        setPanel({
          kind: "busy",
          title: "Resting",
          ms: 3000,
          done: () =>
            toast(
              "Rested. In real life, set your alarm for Fajr at " + fmtTime(c.times.fajr) + ".",
              "good",
            ),
        });
        return;
      }
      if (id === "eat") {
        setPanel({
          kind: "busy",
          title: "Cooking jollof rice",
          ms: 3000,
          done: () => toast("Alhamdulillah. You ate well.", "good"),
        });
        return;
      }
      if (id === "prayermat") {
        const p = currentPrayer(c);
        setPanel({
          kind: "info",
          title: "Prayer corner",
          body: p ? (
            s.prayed[p.id] ? (
              <p>You have prayed {p.name}. May Allah accept it.</p>
            ) : (
              <PrayCheck
                prayer={p}
                onYes={() => {
                  update((x) => ({ ...x, prayed: { ...x.prayed, [p.id]: true } }));
                  setPanel(null);
                  toast(`${p.name} marked as prayed. May Allah accept it.`, "good");
                }}
              />
            )
          ) : (
            <p>
              No prayer time right now. Next is {nextPrayer(c)?.name ?? "Fajr"} at{" "}
              {fmtTime(nextPrayer(c)?.start ?? c.times.fajr)}.
            </p>
          ),
        });
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
          title: b.ad ? b.ad.brand : "Advertise in IlmCity",
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
    [toast, update, openLecture, openPlot, openShop, startPrayer],
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
    } catch {
      setWebgl(false);
      return;
    }
    engine.current = e;
    if (import.meta.env.DEV) (window as unknown as { __ilmcity?: IlmCityEngine }).__ilmcity = e;
    e.setClock(clockRef.current);
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
        const hi =
          panelRef.current || e.isRiding() || performance.now() - startedAt < 45000
            ? null
            : e.hisbahBeside(6);
        if (hi !== null) {
          const cp2 = currentPrayer(c);
          const key = cp2 ? `${c.key}-${cp2.id}` : `${c.key}-quran`;
          if (!h.asked.has(key)) {
            h.asked.add(key);
            const who = e.talkTo(hi);
            talkingRef.current = hi;
            const ask = cp2
              ? ({ kind: "prayer", name: cp2.name } as const)
              : ({ kind: "quran" } as const);
            setPanel({
              kind: "info",
              title: who?.name ?? "Hisbah",
              body: (
                <HisbahStop
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
                      ? `Fear Allah, my brother! Salah is the first deed we will be asked about on the Day of Judgement. ${cp2 ? `${cp2.name} time ends at ${fmtTime(cp2.end)}.` : ""} Go to the masjid now. (−${gain} points)`
                      : `Fear Allah, my brother. Do not leave the Qur'an behind. Read even one page today, in shaa Allah. (−${gain} points)`;
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

  if (!webgl)
    return (
      <div className="grid h-full place-items-center bg-[#10201e] p-6 text-center text-[#eef3ee]">
        <p>
          IlmCity needs a phone or computer that supports 3D graphics (WebGL). Try another browser.
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
              Ilm<span className="text-[#45b8a8]">City</span>
            </div>
            <p className="mt-2 text-sm opacity-70">Bismillah… the city is waking up</p>
          </div>
        </div>
      )}

      {/* top bar */}
      <div
        data-game-ui
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 p-3 pt-[max(12px,env(safe-area-inset-top))]"
      >
        <div className="pointer-events-auto flex min-w-0 items-center gap-3 rounded-2xl border border-[#1f6f63]/20 bg-[#fdf8ec]/95 p-2 pr-4 shadow-lg backdrop-blur">
          <SalahRing clock={clock} prayed={save.prayed} />
          <div className="min-w-0 leading-tight">
            <div className="text-[17px] font-bold tabular-nums">{fmtTime(clock.min)}</div>
            <div className="truncate text-[12px] font-medium opacity-80">{clock.gregorian}</div>
            <div className="truncate text-[12px] font-semibold text-[#1f6f63]">{clock.hijri}</div>
            <div className="mt-0.5 truncate text-[11.5px]">
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
          <button
            onClick={() => {
              const e = engine.current;
              if (!e) return;
              if (inside) toast("Go outside first, then tap Travel.");
              else if (driving) onAction("bus");
              else if (e.goToBusPark()) toast("Walking to the Bus Park…");
            }}
            className="pointer-events-auto rounded-xl bg-[#f2c230] px-3 py-1.5 text-[12px] font-bold text-[#2a1c05] shadow"
          >
            Travel
          </button>
          <a
            href="/app"
            className="pointer-events-auto rounded-xl bg-[#10201e]/80 px-3 py-1.5 text-[12px] font-semibold text-[#fdf8ec]"
          >
            Exit
          </a>
        </div>
      </div>

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
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-[80vw] rounded-xl border-l-4 bg-[#fdf8ec] px-3 py-2 text-[13px] shadow-lg ${t.tone === "warn" ? "border-[#b8573a]" : t.tone === "good" ? "border-[#1f6f63]" : "border-[#f2b84b]"}`}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* controls */}
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
      )}
      {!panel && !arriving && !ride && (
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
      {!panel && !arriving && !ride && !ctx && !driving && !inside && (
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
function SalahRing({ clock, prayed }: { clock: Clock; prayed: Record<string, boolean> }) {
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
    <svg width="64" height="64" viewBox="0 0 64 64" aria-label="Salah ring">
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
      <p className="mt-4 text-sm">To put your brand on billboards across IlmCity, contact:</p>
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
    </div>
  );
}

/* ---------------- houses and land ---------------- */
type PlotOwn =
  | { kind: "rented"; until: number }
  | { kind: "owned" }
  | { kind: "building"; floors: number; done: number }
  | { kind: "built"; floors: number; tenant?: string; since?: number };

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
}: {
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
        {SUBJECTS.map((s) => (
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
  const n = Number(id.replace(/\D/g, ""));
  if (!id.startsWith("m") || n % 3 !== 0) return null;
  return MARKET_TRADERS[(n / 3) % MARKET_TRADERS.length];
};

function ShopView({
  kind,
  where,
  own,
  trader,
  points,
  onRent,
  onPaystack,
  onSave,
}: {
  kind: "shop" | "stall";
  where: string;
  own?: ShopOwn;
  trader: (typeof MARKET_TRADERS)[number] | null;
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
      <button
        disabled={!name.trim()}
        className={primary}
        onClick={() => onSave({ until: own!.until, name: name.trim(), products })}
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
        Photos are saved on this phone for now. When accounts arrive, every player in IlmCity will
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
}: {
  who: string;
  ask: { kind: "prayer"; name: string } | { kind: "quran" };
  onAnswer: (yes: boolean) => string;
}) {
  const [reply, setReply] = useState<string | null>(null);
  const q =
    ask.kind === "prayer"
      ? `Assalamu alaykum, my brother. Have you prayed ${ask.name}?`
      : "Assalamu alaykum, my brother. Have you read the Qur'an today?";
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
