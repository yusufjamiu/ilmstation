/* Real prayer times, Hijri date and city clocks for IlmCity.
   Prayer math follows the standard PrayTimes method (sun position + twilight angles). */

export type Method = { fajr: number; isha?: number; ishaMin?: number };
export type City = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tz: string;
  method: Method;
};

export const METHODS: Record<string, Method> = {
  MWL: { fajr: 18, isha: 17 },
  UQ: { fajr: 18.5, ishaMin: 90 },
};

export const CITIES: Record<string, City> = {
  lagos: {
    id: "lagos",
    name: "Lekki, Lagos",
    lat: 6.4474,
    lng: 3.4723,
    tz: "Africa/Lagos",
    method: METHODS.MWL,
  },
  ilorin: {
    id: "ilorin",
    name: "Ilorin",
    lat: 8.4966,
    lng: 4.5421,
    tz: "Africa/Lagos",
    method: METHODS.MWL,
  },
  riyadh: {
    id: "riyadh",
    name: "Riyadh",
    lat: 24.7136,
    lng: 46.6753,
    tz: "Asia/Riyadh",
    method: METHODS.UQ,
  },
};

const DR = Math.PI / 180;
const dsin = (d: number) => Math.sin(d * DR);
const dcos = (d: number) => Math.cos(d * DR);
const dtan = (d: number) => Math.tan(d * DR);
const dasin = (x: number) => Math.asin(x) / DR;
const dacos = (x: number) => Math.acos(x) / DR;
const datan2 = (y: number, x: number) => Math.atan2(y, x) / DR;
const dacot = (x: number) => Math.atan(1 / x) / DR;
const fixA = (a: number) => {
  a = a - 360 * Math.floor(a / 360);
  return a < 0 ? a + 360 : a;
};
const fixH = (a: number) => {
  a = a - 24 * Math.floor(a / 24);
  return a < 0 ? a + 24 : a;
};

function julian(y: number, m: number, d: number) {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100),
    B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function sunPos(jd: number) {
  const D = jd - 2451545,
    g = fixA(357.529 + 0.98560028 * D),
    q = fixA(280.459 + 0.98564736 * D);
  const L = fixA(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g)),
    e = 23.439 - 0.00000036 * D;
  const RA = datan2(dcos(e) * dsin(L), dcos(L)) / 15;
  return { decl: dasin(dsin(e) * dsin(L)), eqt: q / 15 - fixH(RA) };
}

/** Minutes after local midnight for each time of the day. */
export type DayTimes = {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

export function calcTimes(
  y: number,
  m: number,
  d: number,
  city: City,
  offMin: number,
  asrFactor = 1,
): DayTimes {
  const { lat, lng, method } = city;
  const jd = julian(y, m, d) - lng / (15 * 24);
  const mid = (t: number) => fixH(12 - sunPos(jd + t / 24).eqt);
  const ang = (a: number, t: number, ccw: boolean) => {
    const dec = sunPos(jd + t / 24).decl;
    const v = dacos((-dsin(a) - dsin(dec) * dsin(lat)) / (dcos(dec) * dcos(lat))) / 15;
    return mid(t) + (ccw ? -v : v);
  };
  const asr = (t: number) => {
    const dec = sunPos(jd + t / 24).decl;
    return ang(-dacot(asrFactor + dtan(Math.abs(lat - dec))), t, false);
  };
  const sunrise = ang(0.833, 6, true),
    sunset = ang(0.833, 18, false);
  let fajr = ang(method.fajr, 5, true);
  let isha = method.ishaMin ? sunset + method.ishaMin / 60 : ang(method.isha ?? 17, 18, false);
  if (Number.isNaN(fajr)) fajr = sunrise - 1.5;
  if (Number.isNaN(isha)) isha = sunset + 1.5;
  const t = {
    fajr,
    sunrise,
    dhuhr: mid(12) + 1 / 60,
    asr: asr(13),
    maghrib: sunset + 1 / 60,
    isha,
  };
  const out = {} as DayTimes;
  (Object.keys(t) as (keyof DayTimes)[]).forEach((k) => {
    out[k] = (t[k] - lng / 15) * 60 + offMin;
  });
  return out;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
export function tzOffset(tz: string, ms: number): number {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    fmtCache.set(tz, f);
  }
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUTC - ms) / 60000);
}

export type Prayer = {
  id: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  name: string;
  start: number;
  end: number;
};

export type Clock = {
  min: number; // minutes after local midnight
  key: string; // YYYY-MM-DD local
  gregorian: string; // "Tue 13 October 2026"
  hijri: string; // "21 Rabiʻ II 1448"
  times: DayTimes;
  prayers: Prayer[];
  friday: boolean;
};

const hijriFmt = (() => {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
})();
const gregFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timesCache = new Map<string, DayTimes>();
export function clockFor(city: City, ms = Date.now()): Clock {
  const off = tzOffset(city.tz, ms);
  const shifted = new Date(ms + off * 60000);
  const key = shifted.toISOString().slice(0, 10);
  const ck = city.id + key;
  let times = timesCache.get(ck);
  if (!times) {
    times = calcTimes(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth() + 1,
      shifted.getUTCDate(),
      city,
      off,
    );
    timesCache.set(ck, times);
  }
  const friday = shifted.getUTCDay() === 5;
  let hijri = "";
  if (hijriFmt) {
    const parts: Record<string, string> = {};
    for (const x of hijriFmt.formatToParts(shifted)) parts[x.type] = x.value;
    hijri = `${parts.day} ${parts.month} ${parseInt(parts.year, 10)} AH`;
  }
  return {
    min: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() + shifted.getUTCSeconds() / 60,
    key,
    gregorian: gregFmt.format(shifted),
    hijri,
    times,
    friday,
    prayers: [
      { id: "fajr", name: "Fajr", start: times.fajr, end: times.sunrise },
      { id: "dhuhr", name: friday ? "Jumu'ah" : "Dhuhr", start: times.dhuhr, end: times.asr },
      { id: "asr", name: "Asr", start: times.asr, end: times.maghrib },
      { id: "maghrib", name: "Maghrib", start: times.maghrib, end: times.isha },
      { id: "isha", name: "Isha", start: times.isha, end: 1440 },
    ],
  };
}

export function fmtTime(m: number) {
  m = ((Math.floor(m) % 1440) + 1440) % 1440;
  let h = Math.floor(m / 60);
  const mm = m % 60,
    ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ap}`;
}

export const currentPrayer = (c: Clock) =>
  c.prayers.find((p) => c.min >= p.start && c.min < p.end) ?? null;
export const nextPrayer = (c: Clock) => c.prayers.find((p) => p.start > c.min) ?? null;

/** The masjid opens 10 minutes before each adhan and closes 45 minutes after it. */
export function masjidStatus(c: Clock): { open: boolean; prayer?: Prayer; next?: Prayer } {
  for (const p of c.prayers)
    if (c.min >= p.start - 10 && c.min < p.start + 45) return { open: true, prayer: p };
  return { open: false, next: c.prayers.find((p) => p.start - 10 > c.min) };
}

/** 0 = full day, 1 = full night, smooth twilight between. */
export function darkness(c: Clock) {
  const t = c.times,
    m = c.min;
  if (m < t.fajr || m > t.isha) return 1;
  if (m < t.sunrise) return 1 - (m - t.fajr) / (t.sunrise - t.fajr);
  if (m > t.maghrib) return (m - t.maghrib) / (t.isha - t.maghrib);
  return 0;
}

/** A greeting for the loading screen that fits the time of day in Lagos. */
export function cityGreeting(ms = Date.now()) {
  const c = clockFor(CITIES.lagos, ms);
  const h = c.min / 60;
  if (c.min < c.times.fajr || h >= 22) return "Bismillah… the city rests under the stars";
  if (c.min < c.times.sunrise + 30) return "Bismillah… the city wakes for Fajr";
  if (h < 12) return "Good morning… the city is busy and bright";
  if (c.min < c.times.asr) return "Good afternoon… the city is at work";
  if (c.min < c.times.maghrib) return "Good evening… the sun is going down over Lagos";
  return "Good evening… the street lights are on";
}
