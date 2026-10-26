import { useEffect, useMemo, useRef, useState } from "react";
import { cityOf, districtById } from "./content";

/* A drawn map of Lagos. When a player travels, their bus or car drives along the
   roads from one area to the other, then the new area loads. Positions are real
   latitude and longitude, drawn simply. */

type P = { lat: number; lng: number };
const PLACES: Record<string, P & { name: string; hub?: boolean }> = {
  lekki: { name: "Lekki", lat: 6.44, lng: 3.475 },
  agege: { name: "Agege", lat: 6.622, lng: 3.325 },
  ajegunle: { name: "Ajegunle", lat: 6.455, lng: 3.335 },
  ikorodu: { name: "Igbe Laara", lat: 6.615, lng: 3.505 },
  egbeda: { name: "Egbeda", lat: 6.592, lng: 3.29 },
  agric: { name: "Agric", lat: 6.632, lng: 3.522 },
  secondgate: { name: "Second Gate", lat: 6.647, lng: 3.536 },
  market: { name: "Ikorodu Market", lat: 6.66, lng: 3.548 },
  badore: { name: "Badore", lat: 6.468, lng: 3.548 },
  powerline: { name: "Powerline", lat: 6.565, lng: 3.262 },
  okeeletu: { name: "Oke Eletu", lat: 6.6, lng: 3.545 },
  manaargardens: { name: "Manaar Gardens Estate", lat: 6.602, lng: 3.505 },
  ikeja: { name: "Ojodu, Ikeja", lat: 6.64, lng: 3.365 },
  akoka: { name: "Akoka (UNILAG)", lat: 6.517, lng: 3.39 },
  ojo: { name: "Ojo (LASU)", lat: 6.47, lng: 3.2 },
  firstgate: { name: "First Gate (LASUSTECH)", lat: 6.64, lng: 3.529 },
  lagosairport: { name: "Lagos Airport", lat: 6.585, lng: 3.33 },
  ikejagra: { name: "Ikeja GRA", lat: 6.578, lng: 3.355 },
  ilorincentral: { name: "Ilorin Central", lat: 8.497, lng: 4.55 },
  taiwo: { name: "Taiwo Road", lat: 8.487, lng: 4.538 },
  gaa: { name: "Gaa-Akanbi", lat: 8.455, lng: 4.565 },
  tanke: { name: "Tanke (Unilorin)", lat: 8.478, lng: 4.612 },
  fate: { name: "Fate / GRA", lat: 8.47, lng: 4.58 },
  adewole: { name: "Adewole", lat: 8.51, lng: 4.52 },
  alhikmah: { name: "Al-Hikmah University", lat: 8.53, lng: 4.49 },
  ilorinairport: { name: "Ilorin Airport", lat: 8.44, lng: 4.494 },
  postoffice: { name: "Post Office", lat: 8.481, lng: 4.553, hub: true },
  haram: { name: "Al-Haram", lat: 21.4225, lng: 39.8262 },
  aziziyah: { name: "Aziziyah", lat: 21.405, lng: 39.87 },
  jeddahairport: { name: "Jeddah Airport", lat: 21.68, lng: 39.15 },
  mina: { name: "Mina", lat: 21.4133, lng: 39.8933 },
  arafat: { name: "Arafat", lat: 21.355, lng: 39.984 },
  nabawi: { name: "Al-Masjid An-Nabawi", lat: 24.4672, lng: 39.6112 },
  quba: { name: "Quba", lat: 24.4393, lng: 39.6172 },
  madinahairport: { name: "Madinah Airport", lat: 24.553, lng: 39.705 },
  island: { name: "Lagos Island", lat: 6.455, lng: 3.395, hub: true },
  yaba: { name: "Yaba", lat: 6.512, lng: 3.378, hub: true },
  ketu: { name: "Ketu", lat: 6.595, lng: 3.39, hub: true },
  apapa: { name: "Apapa", lat: 6.448, lng: 3.36, hub: true },
};
const ROADS: [string, string][] = [
  ["lekki", "island"],
  ["island", "apapa"],
  ["island", "yaba"],
  ["apapa", "ajegunle"],
  ["yaba", "ketu"],
  ["ketu", "agege"],
  ["ketu", "ikorodu"],
  ["yaba", "ajegunle"],
  ["ketu", "egbeda"],
  ["egbeda", "agege"],
  ["ikorodu", "agric"],
  ["agric", "firstgate"],
  ["firstgate", "secondgate"],
  ["yaba", "akoka"],
  ["apapa", "ojo"],
  ["secondgate", "market"],
  ["lekki", "badore"],
  ["egbeda", "powerline"],
  ["ikorodu", "okeeletu"],
  ["ikorodu", "manaargardens"],
  ["ketu", "ikeja"],
  ["ikeja", "lagosairport"],
  ["lagosairport", "ikejagra"],
  ["postoffice", "ilorincentral"],
  ["postoffice", "taiwo"],
  ["postoffice", "gaa"],
  ["postoffice", "tanke"],
  ["postoffice", "fate"],
  ["postoffice", "adewole"],
  ["fate", "ilorinairport"],
  ["adewole", "alhikmah"],
  ["haram", "aziziyah"],
  ["aziziyah", "jeddahairport"],
  ["aziziyah", "mina"],
  ["mina", "arafat"],
  ["nabawi", "quba"],
  ["quba", "madinahairport"],
];
/** Which city a place on the map is in (hubs included). */
const HUB_CITY: Record<string, string> = {
  island: "lagos",
  yaba: "lagos",
  ketu: "lagos",
  apapa: "lagos",
  postoffice: "ilorin",
};
const cityAt = (id: string) => HUB_CITY[id] ?? cityOf(districtById(id));

const W = 400,
  H = 380;
/** How to turn latitude and longitude into the picture: Lagos has its own fixed frame (the
    coast and lagoon are drawn for it); other trips fit their places on the page. */
type Frame = { lng0: number; lng1: number; lat0: number; lat1: number };
const LAGOS: Frame = { lng0: 3.17, lng1: 3.575, lat0: 6.39, lat1: 6.68 };
function frameFor(ids: string[]): Frame {
  const ps = ids.map((i) => PLACES[i]);
  const lng0 = Math.min(...ps.map((p) => p.lng)),
    lng1 = Math.max(...ps.map((p) => p.lng)),
    lat0 = Math.min(...ps.map((p) => p.lat)),
    lat1 = Math.max(...ps.map((p) => p.lat));
  const pl = Math.max(0.02, (lng1 - lng0) * 0.15),
    pa = Math.max(0.02, (lat1 - lat0) * 0.15);
  return { lng0: lng0 - pl, lng1: lng1 + pl, lat0: lat0 - pa, lat1: lat1 + pa };
}
const projector = (f: Frame) => (id: string) => ({
  x: ((PLACES[id].lng - f.lng0) / (f.lng1 - f.lng0)) * (W - 40) + 20,
  y: ((f.lat1 - PLACES[id].lat) / (f.lat1 - f.lat0)) * (H - 40) + 20,
});
/** Lagos to Ilorin: by road up the expressway, or by air. */
const CITY_POINT: Record<string, P & { name: string }> = {
  lagos: { name: "Lagos", lat: 6.52, lng: 3.37 },
  ilorin: { name: "Ilorin", lat: 8.49, lng: 4.55 },
  makkah: { name: "Makkah", lat: 21.42, lng: 39.83 },
  madinah: { name: "Madinah", lat: 24.47, lng: 39.61 },
};

function km(a: P, b: P) {
  const R = 6371,
    r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r,
    dLng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * 1.3; // roads wind, so add 30%
}

/** Shortest route along the roads. */
function route(from: string, to: string): string[] {
  const prev: Record<string, string | null> = { [from]: null };
  const q = [from];
  while (q.length) {
    const c = q.shift()!;
    if (c === to) break;
    for (const [a, b] of ROADS) {
      const n = a === c ? b : b === c ? a : null;
      if (n && !(n in prev)) {
        prev[n] = c;
        q.push(n);
      }
    }
  }
  const out: string[] = [];
  for (let c: string | null = to; c; c = prev[c] ?? null) out.unshift(c);
  return out[0] === from ? out : [from, to];
}

const LAND = "M0 0H400V300C340 296 300 312 250 306C200 300 150 318 100 312C60 308 30 318 0 314Z";
// Lagos Lagoon, between Ikorodu and Lekki
const LAGOON =
  "M232 300C246 262 236 232 262 214C290 194 336 206 362 182C380 166 392 170 400 168V270C370 278 340 270 312 282C286 292 262 288 232 300Z";

export function TravelMap({
  from,
  to,
  byCar,
  plane,
  train,
  onDone,
}: {
  from: string;
  to: string;
  byCar: boolean;
  plane?: boolean;
  train?: boolean;
  onDone: () => void;
}) {
  const path = useRef<SVGPathElement>(null);
  const cityA = cityOf(districtById(from)),
    cityB = cityOf(districtById(to));
  const intercity = cityA !== cityB;
  const lagos = !intercity && cityA === "lagos";
  const pt = useMemo(() => {
    if (lagos) return projector(LAGOS);
    if (intercity) {
      // the two cities are far apart: draw each city as a point
      const both = [CITY_POINT[cityA], CITY_POINT[cityB]];
      const fr: Frame = {
        lng0: Math.min(...both.map((b) => b.lng)) - 0.5,
        lng1: Math.max(...both.map((b) => b.lng)) + 0.5,
        lat0: Math.min(...both.map((b) => b.lat)) - 0.4,
        lat1: Math.max(...both.map((b) => b.lat)) + 0.4,
      };
      return (id: string) => {
        const c = CITY_POINT[cityAt(id)];
        return {
          x: ((c.lng - fr.lng0) / (fr.lng1 - fr.lng0)) * (W - 40) + 20,
          y: ((fr.lat1 - c.lat) / (fr.lat1 - fr.lat0)) * (H - 40) + 20,
        };
      };
    }
    return projector(frameFor(Object.keys(PLACES).filter((id) => cityAt(id) === cityA)));
  }, [lagos, intercity, from, to, cityA, cityB]);
  const [pos, setPos] = useState({ x: pt(from).x, y: pt(from).y, a: 0, p: 0 });
  const stops = useMemo(() => (intercity ? [from, to] : route(from, to)), [from, to, intercity]);
  const d = useMemo(
    () => stops.map((s, i) => `${i ? "L" : "M"}${pt(s).x} ${pt(s).y}`).join(""),
    [stops],
  );
  const dist = useMemo(() => {
    let t = 0;
    for (let i = 1; i < stops.length; i++) t += km(PLACES[stops[i - 1]], PLACES[stops[i]]);
    return Math.round(plane ? t / 1.3 : t);
  }, [stops, plane]);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const el = path.current;
    if (!el) return;
    const len = el.getTotalLength();
    const ms = intercity ? (plane ? 6000 : 9000) : Math.min(6500, 2600 + dist * 120);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const raw = Math.min(1, (now - t0) / ms);
      const p = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      const a = el.getPointAtLength(p * len),
        b = el.getPointAtLength(Math.min(len, p * len + 2));
      setPos({ x: a.x, y: a.y, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI, p: raw });
      if (raw < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => done.current(), 450);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [d, dist, intercity, plane]);

  const fromName = districtById(from).name,
    toName = districtById(to).name;
  const vehicle = byCar
    ? "#1f6f63"
    : train
      ? "#f4f1ea"
      : cityA === "makkah" || cityA === "madinah"
        ? "#e9efe9"
        : "#f2c230";
  const shown = Object.keys(PLACES).filter((id) =>
    intercity ? id === from || id === to : cityAt(id) === cityA,
  );
  const roads = ROADS.filter(([a, b]) => !intercity && shown.includes(a) && shown.includes(b));

  return (
    <div
      data-game-ui
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#10201e]/90 p-4 text-[#fdf8ec]"
    >
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <div className="font-serif text-2xl leading-tight">
            {fromName} → {toName}
          </div>
          <div className="whitespace-nowrap text-[13px] opacity-80 tabular-nums">
            about {dist} km
          </div>
        </div>
        <div className="text-[13px] opacity-80">
          {plane
            ? "✈️ On the plane"
            : byCar
              ? "Driving your car"
              : train || (intercity && (cityA === "makkah" || cityA === "madinah"))
                ? "🚄 On the Haramain high-speed train"
                : intercity
                  ? "On the inter-city bus"
                  : cityA === "makkah" || cityA === "madinah"
                    ? "On the city bus"
                    : "On the yellow bus"}{" "}
          ·{" "}
          {intercity
            ? `${CITY_POINT[cityA].name} to ${CITY_POINT[cityB].name}`
            : CITY_POINT[cityA].name}
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-3 w-full rounded-2xl"
          role="img"
          aria-label={`Route from ${fromName} to ${toName}`}
        >
          <rect width={W} height={H} fill={lagos ? "#3f9db5" : "#a9c47a"} />
          {lagos && <path d={LAND} fill="#a9c47a" />}
          {lagos && <path d={LAGOON} fill="#3f9db5" />}
          {lagos && (
            <text
              x={W - 16}
              y={H - 18}
              textAnchor="end"
              fontSize="12"
              fill="#e6f4f8"
              fontStyle="italic"
            >
              Atlantic Ocean
            </text>
          )}
          {lagos && (
            <text
              x={330}
              y={248}
              textAnchor="middle"
              fontSize="11"
              fill="#e6f4f8"
              fontStyle="italic"
            >
              Lagos Lagoon
            </text>
          )}
          {roads.map(([a, b]) => (
            <line
              key={a + b}
              x1={pt(a).x}
              y1={pt(a).y}
              x2={pt(b).x}
              y2={pt(b).y}
              stroke="#6b6f74"
              strokeWidth="6"
              strokeLinecap="round"
            />
          ))}
          {roads.map(([a, b]) => (
            <line
              key={"m" + a + b}
              x1={pt(a).x}
              y1={pt(a).y}
              x2={pt(b).x}
              y2={pt(b).y}
              stroke="#f2c94c"
              strokeWidth="1"
              strokeDasharray="4 5"
            />
          ))}
          <path
            ref={path}
            d={d}
            fill="none"
            stroke="#fdf8ec"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 - 1000 * pos.p}
            pathLength={1000}
            opacity="0.9"
          />
          {shown.map((id) => {
            const p = PLACES[id];
            const c = pt(id);
            const end = id === from || id === to;
            if (p.hub)
              return (
                <g key={id}>
                  <circle cx={c.x} cy={c.y} r="3.5" fill="#fdf8ec" stroke="#6b6f74" />
                  <text x={c.x + 7} y={c.y + 4} fontSize="10" fill="#2a3a34">
                    {p.name}
                  </text>
                </g>
              );
            return (
              <g key={id}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={end ? 9 : 7}
                  fill={id === to ? "#b8573a" : "#1f6f63"}
                  stroke="#fdf8ec"
                  strokeWidth="2.5"
                />
                <rect
                  x={c.x - 34}
                  y={c.y - 30}
                  width="68"
                  height="18"
                  rx="9"
                  fill="#10201e"
                  opacity="0.85"
                />
                <text
                  x={c.x}
                  y={c.y - 17}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#fdf8ec"
                >
                  {intercity ? CITY_POINT[cityAt(id)].name : p.name}
                </text>
              </g>
            );
          })}
          <g transform={`translate(${pos.x} ${pos.y}) rotate(${pos.a})`}>
            {plane && (
              <text x="0" y="6" textAnchor="middle" fontSize="20" transform="rotate(45)">
                ✈️
              </text>
            )}
            <rect
              visibility={plane ? "hidden" : "visible"}
              x="-11"
              y="-6"
              width="22"
              height="12"
              rx="3"
              fill={vehicle}
              stroke="#10201e"
              strokeWidth="1.5"
            />
            <rect
              visibility={plane ? "hidden" : "visible"}
              x="2"
              y="-4.5"
              width="6"
              height="9"
              rx="1.5"
              fill="#2a3a44"
            />
          </g>
        </svg>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#fdf8ec]/15">
          <div className="h-full rounded-full bg-[#f2c230]" style={{ width: `${pos.p * 100}%` }} />
        </div>
        <p className="mt-2 text-center text-[12px] opacity-70">
          {pos.p < 1 && intercity
            ? plane
              ? cityA === "makkah" ||
                cityA === "madinah" ||
                cityB === "makkah" ||
                cityB === "madinah"
                ? cityA !== "lagos" && cityA !== "ilorin" && cityB !== "lagos" && cityB !== "ilorin"
                  ? "A short flight over the Hijaz mountains"
                  : "Over the Sahara and the Red Sea… about six hours in the air"
                : "Flying over Ogun and Oyo… about an hour in the air"
              : cityA === "makkah" || cityA === "madinah"
                ? "On the Haramain high-speed train"
                : "Along the Lagos–Ibadan Expressway and up to Ilorin"
            : pos.p < 1
              ? `Via ${
                  stops
                    .slice(1, -1)
                    .map((s) => PLACES[s].name)
                    .join(", ") || "the main road"
                }`
              : `Arriving in ${toName}…`}
        </p>
      </div>
    </div>
  );
}
