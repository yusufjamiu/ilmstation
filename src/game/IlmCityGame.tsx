import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IlmCityEngine, type Context } from "./engine";
import { TravelMap } from "./TravelMap";
import { loadHumans } from "./humans";
import {
  AD_EMAIL,
  BILLBOARDS,
  BUS_FARE,
  DISTRICTS,
  QUESTIONS,
  STREETS,
  LECTURES,
  POINTS,
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
  const [save, setSave] = useState<Save>(() => loadSave());
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
  const [toasts, setToasts] = useState<{ id: number; text: string; tone?: "good" | "warn" }[]>([]);
  const [driving, setDriving] = useState(false);
  const [inside, setInside] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [speed, setSpeed] = useState<number | null>(null);
  const arriveRef = useRef<(() => void) | null>(null);
  const [arriving, setArriving] = useState<string | null>(null);
  const [travelling, setTravelling] = useState<{ from: string; to: string; byCar: boolean } | null>(
    null,
  );

  const toast = useCallback((text: string, tone?: "good" | "warn") => {
    const id = Math.random();
    setToasts((t) => [{ id, text, tone }, ...t].slice(0, 3));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
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
      update((s) => ({ ...s, day: clock.key, prayed: {}, asked: [], lectureMin: 0 }));
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

  /* ---------- actions coming from the 3D world ---------- */
  const onAction = useCallback(
    (id: string) => {
      const e = engine.current;
      if (!e) return;
      const c = clockRef.current,
        s = saveRef.current;
      if (id.startsWith("door:masjid:")) {
        const lid = id.slice(12);
        const name = landmarkName(lid);
        e.enterInterior("masjid", name);
        setInside(true);
        const lec = lectureNow(lid, c);
        const ms = masjidStatus(c);
        if (lec) openLecture(lec, true);
        else if (ms.open)
          toast(
            `Assalamu alaykum. ${ms.prayer!.name} jama'ah ${c.min < ms.prayer!.start ? `starts at ${fmtTime(ms.prayer!.start)}` : "is on"}.`,
            "good",
          );
        else
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
              />
            ),
          });
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
        if (p && !s.prayed[p.id]) {
          setPanel({
            kind: "busy",
            title:
              p.name === "Jumu'ah"
                ? "Listening to the khutbah, then praying Jumu'ah"
                : `Praying ${p.name} in jama'ah`,
            ms: 4500,
            done: () => {
              update((x) => ({ ...x, prayed: { ...x.prayed, [p.id]: true } }));
              toast(`You prayed ${p.name} in jama'ah. May Allah accept it.`, "good");
            },
          });
        } else if (p)
          toast(
            `You already prayed ${p.name}. Next: ${nextPrayer(c)?.name ?? "Fajr"} at ${fmtTime(nextPrayer(c)?.start ?? c.times.fajr)}.`,
          );
        else {
          const n = nextPrayer(c);
          toast(
            `The adhan for ${n?.name ?? "Fajr"} is at ${fmtTime(n?.start ?? c.times.fajr)}. Sit and make dhikr.`,
          );
        }
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
    [toast, update, openLecture],
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
    }, 1000);
    return () => {
      clearInterval(iv);
      e.dispose();
      engine.current = null;
    };
  }, [offset, toast, update, peopleReady]);
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
      {!panel && !arriving && <Joystick onMove={(x, y) => engine.current?.setInput(x, y)} />}
      {!panel && !arriving && ctx && (
        <button
          data-game-ui
          onClick={() => onAction(ctx.id)}
          className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] right-4 max-w-[52vw] rounded-2xl bg-[#1f6f63] px-5 py-4 text-left text-[15px] font-bold text-[#fdf8ec] shadow-xl active:scale-95"
        >
          {ctx.label}
        </button>
      )}
      {!panel && !arriving && !ctx && !driving && !inside && (
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
          onClose={() => setPanel(null)}
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
}: {
  mosque: string;
  clock: Clock;
  onLecture: (l: Lecture) => void;
  onQuiz: () => void;
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
