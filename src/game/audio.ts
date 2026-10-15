/* IlmWorld radio: Qur'an recitation (and nasheeds when we have them) while you walk,
   at home and in vehicles. It goes quiet in the masjid, in school and in class, and
   during salah and lectures. Recitations stream verse by verse from the Islamic
   Network CDN (cdn.islamic.network), the same audio used by alquran.cloud. */

import { useEffect } from "react";

/** Number of verses in each surah, 1 to 114. */
const AYAHS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
  78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37,
  35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8,
  8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];
const START: number[] = [];
AYAHS.reduce((sum, n, i) => ((START[i] = sum), sum + n), 0);

export const SURAH_NAMES = [
  "Al-Fatihah",
  "Al-Baqarah",
  "Aal-Imran",
  "An-Nisa",
  "Al-Ma'idah",
  "Al-An'am",
  "Al-A'raf",
  "Al-Anfal",
  "At-Tawbah",
  "Yunus",
  "Hud",
  "Yusuf",
  "Ar-Ra'd",
  "Ibrahim",
  "Al-Hijr",
  "An-Nahl",
  "Al-Isra",
  "Al-Kahf",
  "Maryam",
  "Ta-Ha",
  "Al-Anbiya",
  "Al-Hajj",
  "Al-Mu'minun",
  "An-Nur",
  "Al-Furqan",
  "Ash-Shu'ara",
  "An-Naml",
  "Al-Qasas",
  "Al-Ankabut",
  "Ar-Rum",
  "Luqman",
  "As-Sajdah",
  "Al-Ahzab",
  "Saba",
  "Fatir",
  "Ya-Sin",
  "As-Saffat",
  "Sad",
  "Az-Zumar",
  "Ghafir",
  "Fussilat",
  "Ash-Shura",
  "Az-Zukhruf",
  "Ad-Dukhan",
  "Al-Jathiyah",
  "Al-Ahqaf",
  "Muhammad",
  "Al-Fath",
  "Al-Hujurat",
  "Qaf",
  "Adh-Dhariyat",
  "At-Tur",
  "An-Najm",
  "Al-Qamar",
  "Ar-Rahman",
  "Al-Waqi'ah",
  "Al-Hadid",
  "Al-Mujadilah",
  "Al-Hashr",
  "Al-Mumtahanah",
  "As-Saff",
  "Al-Jumu'ah",
  "Al-Munafiqun",
  "At-Taghabun",
  "At-Talaq",
  "At-Tahrim",
  "Al-Mulk",
  "Al-Qalam",
  "Al-Haqqah",
  "Al-Ma'arij",
  "Nuh",
  "Al-Jinn",
  "Al-Muzzammil",
  "Al-Muddaththir",
  "Al-Qiyamah",
  "Al-Insan",
  "Al-Mursalat",
  "An-Naba",
  "An-Nazi'at",
  "Abasa",
  "At-Takwir",
  "Al-Infitar",
  "Al-Mutaffifin",
  "Al-Inshiqaq",
  "Al-Buruj",
  "At-Tariq",
  "Al-A'la",
  "Al-Ghashiyah",
  "Al-Fajr",
  "Al-Balad",
  "Ash-Shams",
  "Al-Layl",
  "Ad-Duha",
  "Ash-Sharh",
  "At-Tin",
  "Al-Alaq",
  "Al-Qadr",
  "Al-Bayyinah",
  "Az-Zalzalah",
  "Al-Adiyat",
  "Al-Qari'ah",
  "At-Takathur",
  "Al-Asr",
  "Al-Humazah",
  "Al-Fil",
  "Quraysh",
  "Al-Ma'un",
  "Al-Kawthar",
  "Al-Kafirun",
  "An-Nasr",
  "Al-Masad",
  "Al-Ikhlas",
  "Al-Falaq",
  "An-Nas",
];

export type Reciter = { id: string; name: string; kbps: number };
export const RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "Mishary Alafasy", kbps: 128 },
  { id: "ar.sudais", name: "Abdur-Rahman As-Sudais", kbps: 192 },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", kbps: 128 },
  { id: "ar.minshawi", name: "Muhammad Siddiq Al-Minshawi", kbps: 128 },
  { id: "ar.abdulbasit", name: "Abdul Basit Abdus-Samad", kbps: 192 },
  { id: "ar.shuraim", name: "Saud Ash-Shuraim", kbps: 128 },
  { id: "ar.muhammadayoub", name: "Muhammad Ayyub", kbps: 128 },
];

/** Which surahs to play, in order. */
export const PLAYLISTS: { id: string; name: string; surahs: number[] }[] = [
  { id: "amma", name: "Juz 'Amma (An-Naba to An-Nas)", surahs: range(78, 114) },
  {
    id: "loved",
    name: "Loved surahs (Kahf, Yasin, Rahman, Waqi'ah, Mulk)",
    surahs: [18, 36, 55, 56, 67],
  },
  { id: "all", name: "The whole Qur'an from Al-Fatihah", surahs: range(1, 114) },
];
/** A list by id; "s:36" starts at Surah Ya-Sin and carries on to the end. */
export function playlistById(id: string) {
  if (id.startsWith("s:")) {
    const n = Math.max(1, Math.min(114, Number(id.slice(2)) || 1));
    return { id, name: `Surah ${SURAH_NAMES[n - 1]}`, surahs: range(n, 114) };
  }
  return PLAYLISTS.find((p) => p.id === id) ?? PLAYLISTS[0];
}
function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

/** Nasheeds: add files to public/ilmcity/nasheed/ (with permission) and list them here. */
export const NASHEEDS: { title: string; artist: string; url: string }[] = [];

/** What each vehicle plays. */
export const VEHICLE_RADIO: Record<
  "danfo" | "keke" | "car",
  { reciter: string; playlist: string }
> = {
  danfo: { reciter: "ar.sudais", playlist: "loved" },
  keke: { reciter: "ar.alafasy", playlist: "amma" },
  car: { reciter: "ar.abdulbasit", playlist: "loved" },
};

export type Source = { key: string; reciter: string; playlist: string; label: string };
export type RadioState = {
  playing: boolean;
  source: Source | null;
  surah: number;
  /** why it is quiet (masjid, class, salah, lecture) */
  hushed: string | null;
  error: boolean;
};

const url = (r: Reciter, surah: number, ayah: number) =>
  `https://cdn.islamic.network/quran/audio/${r.kbps}/${r.id}/${START[surah - 1] + ayah}.mp3`;

/** Plays a reciter verse by verse with the next verse loaded in advance, so there are no gaps. */
class Radio {
  private a = typeof Audio !== "undefined" ? new Audio() : null;
  private b = typeof Audio !== "undefined" ? new Audio() : null;
  private pos = new Map<string, { i: number; ayah: number }>();
  private hushes = new Map<string, number>();
  private subs = new Set<(s: RadioState) => void>();
  private failed = 0;
  state: RadioState = { playing: false, source: null, surah: 1, hushed: null, error: false };

  constructor() {
    for (const el of [this.a, this.b]) {
      if (!el) continue;
      el.preload = "auto";
      el.addEventListener("ended", () => this.next());
      el.addEventListener("error", () => {
        if (el !== this.a || !this.state.source) return;
        // skip a verse that will not load; stop after several in a row (offline)
        if (++this.failed > 4) {
          this.failed = 0;
          this.set({ error: true });
          this.stopNow();
        } else this.next();
      });
      el.addEventListener("playing", () => {
        if (el === this.a) {
          this.failed = 0;
          if (this.state.error) this.set({ error: false });
        }
      });
    }
  }
  subscribe(fn: (s: RadioState) => void) {
    this.subs.add(fn);
    fn(this.state);
    return () => void this.subs.delete(fn);
  }
  private set(p: Partial<RadioState>) {
    this.state = { ...this.state, ...p };
    this.subs.forEach((f) => f(this.state));
  }
  private where(src: Source) {
    const list = playlistById(src.playlist);
    const at = this.pos.get(src.key) ?? { i: 0, ayah: 1 };
    return { list, at, reciter: RECITERS.find((r) => r.id === src.reciter) ?? RECITERS[0] };
  }
  /** Start (or switch to) a source. Call from a tap the first time, so the browser allows sound. */
  play(src: Source) {
    if (!this.a) return;
    const cur = this.state.source;
    const changed =
      !cur || cur.key !== src.key || cur.reciter !== src.reciter || cur.playlist !== src.playlist;
    if (changed || this.a.error) {
      if (cur?.key === src.key && cur.playlist !== src.playlist) this.pos.delete(src.key);
      this.set({ source: src });
      this.load();
    }
    this.set({ playing: true });
    if (!this.state.hushed) void this.a.play().catch(() => this.set({ playing: false }));
  }
  private load() {
    const src = this.state.source;
    if (!src || !this.a || !this.b) return;
    const { list, at, reciter } = this.where(src);
    const surah = list.surahs[at.i % list.surahs.length];
    this.a.src = url(reciter, surah, at.ayah);
    const nx = this.peek(list.surahs, at);
    this.b.src = url(reciter, list.surahs[nx.i % list.surahs.length], nx.ayah);
    this.set({ surah });
  }
  private peek(surahs: number[], at: { i: number; ayah: number }) {
    const s = surahs[at.i % surahs.length];
    return at.ayah < AYAHS[s - 1] ? { i: at.i, ayah: at.ayah + 1 } : { i: at.i + 1, ayah: 1 };
  }
  private next(): void {
    const src = this.state.source;
    if (!src || !this.a || !this.b) return;
    const { list, at } = this.where(src);
    const nx = this.peek(list.surahs, at);
    this.pos.set(src.key, { i: nx.i % list.surahs.length, ayah: nx.ayah });
    // the loaded next verse becomes current, and the one after starts loading
    [this.a, this.b] = [this.b, this.a];
    this.load2();
    // the verse we loaded ahead failed: move on (a few times at most)
    if (this.a.error && ++this.failed <= 4) this.next();
    if (this.state.playing && !this.state.hushed) void this.a.play().catch(() => {});
  }
  private load2() {
    const src = this.state.source;
    if (!src || !this.b) return;
    const { list, at, reciter } = this.where(src);
    const nx = this.peek(list.surahs, at);
    this.b.src = url(reciter, list.surahs[nx.i % list.surahs.length], nx.ayah);
    this.set({ surah: list.surahs[at.i % list.surahs.length] });
  }
  /** Skip to the next surah. */
  skip() {
    const src = this.state.source;
    if (!src) return;
    const { list, at } = this.where(src);
    this.pos.set(src.key, { i: (at.i + 1) % list.surahs.length, ayah: 1 });
    this.load();
    if (this.state.playing && !this.state.hushed) void this.a?.play().catch(() => {});
  }
  pause() {
    this.set({ playing: false });
    this.a?.pause();
  }
  private stopNow() {
    this.set({ playing: false });
    this.a?.pause();
  }
  /** Go quiet for a reason (masjid, class, salah); several reasons can overlap. */
  hush(reason: string, on: boolean) {
    const n = (this.hushes.get(reason) ?? 0) + (on ? 1 : -1);
    if (n > 0) this.hushes.set(reason, n);
    else this.hushes.delete(reason);
    const hushed = [...this.hushes.keys()][0] ?? null;
    if (hushed === this.state.hushed) return;
    this.set({ hushed });
    if (hushed) this.a?.pause();
    else if (this.state.playing) void this.a?.play().catch(() => {});
  }
  /** Set a hush reason to an exact on/off value (for places, which are checked often). */
  hushIf(reason: string, on: boolean) {
    const has = this.hushes.has(reason);
    if (on !== has) this.hush(reason, on);
  }
}

export const radio = new Radio();

/** Keep the radio quiet while a component (salah, a lecture) is on screen. */
export function useHush(reason: string) {
  useEffect(() => {
    radio.hush(reason, true);
    return () => radio.hush(reason, false);
  }, [reason]);
}
