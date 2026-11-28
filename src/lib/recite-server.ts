/* Verse timings for quiz reciters, so one verse can be played (and its words lit up) from a full-surah recording.
   GET /api/recite?r=<reciter key>&s=<surah>  →  { url, verses: { [ayah]: { from, to, words?: [word, start, end][] } } }  (ms)
   Sources: Quran.com (QDC: word timings), mp3quran.net (verse timings) and islamic.network (one file per verse).
   Word timings we make ourselves (POST /api/recite-align, admins, ElevenLabs forced alignment) are kept in
   Firestore reciteWords/{reciter}_{surah} and added here. */
import { admin } from "./money-server";
import { surahList } from "../components/quran-data";

const QDC: Record<string, number> = { alafasy: 7, sudais: 3, husary: 6, minshawi: 9, abdulbasit: 2, dosari: 97, shuraim: 10, shatri: 4 };
const MP3Q: Record<string, number> = { raad: 221, juhani: 62, alijaber: 76, ghamdi: 30, baleela: 217 };
const CDN: Record<string, [string, number]> = { maher: ["ar.mahermuaiqly", 128], ayyub: ["ar.muhammadayyoub", 128] };
const LETTER = /[\u0621-\u064A\u0671-\u06D3]/;

type Verses = Record<number, { from: number; to: number; words?: number[][]; url?: string }>;
const mem = new Map<string, Promise<{ url: string; verses: Verses }>>();
let folders: Promise<Record<number, string>> | null = null;

// short CDN cache: new word timings show up within the hour
const json = (status: number, body: object, cache = false) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": cache ? "public, max-age=3600, s-maxage=3600" : "no-store" } });

/** Word timings made with ElevenLabs, if any: { ayah: [[word, start, end], …] } */
async function storedWords(r: string, s: number): Promise<Record<number, number[][]>> {
  const a = await admin(); if (!a) return {};
  const d = (await a.db.doc(`reciteWords/${r}_${s}`).get()).data() ?? {};
  const out: Record<number, number[][]> = {};
  for (const [k, v] of Object.entries(d)) if (/^a\d+$/.test(k) && typeof v === "string") { try { out[Number(k.slice(1))] = JSON.parse(v); } catch { /* skip */ } }
  return out;
}

/** mp3quran reciter id → folder of its surah files. */
function mp3qFolders() {
  if (!folders) {
    folders = fetch("https://www.mp3quran.net/api/v3/ayat_timing/reads").then((r) => r.json()).then((j: unknown) => {
      const list = (Array.isArray(j) ? j : ((j as { reads?: unknown[] }).reads ?? [])) as Record<string, unknown>[];
      const out: Record<number, string> = {};
      for (const x of list) {
        const url = Object.values(x).find((v) => typeof v === "string" && /^https?:\/\//.test(v)) as string | undefined;
        if (x.id && url) out[Number(x.id)] = url.endsWith("/") ? url : `${url}/`;
      }
      return out;
    });
    folders.catch(() => { folders = null; });
  }
  return folders;
}

async function build(r: string, s: number): Promise<{ url: string; verses: Verses }> {
  const base = await source(r, s);
  if (!QDC[r]) { const w = await storedWords(r, s).catch(() => ({} as Record<number, number[][]>)); for (const [n, list] of Object.entries(w)) if (base.verses[+n]) base.verses[+n]!.words = list; }
  return base;
}

async function source(r: string, s: number): Promise<{ url: string; verses: Verses }> {
  const verses: Verses = {};
  if (CDN[r]) {
    const [id, kb] = CDN[r]; const m = surahList.find((x) => x.n === s)!;
    for (let n = 1; n <= m.ayahs; n++) verses[n] = { from: 0, to: 0, url: `https://cdn.islamic.network/quran/audio/${kb}/${id}/${m.start + n - 1}.mp3` };
    return { url: "", verses };
  }
  if (QDC[r]) {
    const j = (await fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${QDC[r]}/audio_files?chapter=${s}&segments=true`).then((x) => x.json())) as {
      audio_files?: { audio_url: string; verse_timings?: { verse_key: string; timestamp_from: number; timestamp_to: number; segments?: number[][] }[] }[];
    };
    const f = j.audio_files?.[0];
    if (!f?.audio_url) throw new Error("no audio");
    for (const v of f.verse_timings ?? []) {
      const ayah = Number(v.verse_key.split(":")[1]);
      verses[ayah] = { from: v.timestamp_from, to: v.timestamp_to, words: (v.segments ?? []).filter((x) => x.length >= 3).map((x) => [x[0]!, x[1]!, x[2]!]) };
    }
    return { url: f.audio_url.replace(/([^:])\/\//g, "$1/"), verses };
  }
  const id = MP3Q[r]!;
  const [dir, t] = await Promise.all([
    mp3qFolders().then((m) => m[id]),
    fetch(`https://www.mp3quran.net/api/v3/ayat_timing?surah=${s}&read=${id}`).then((x) => x.json()) as Promise<{ ayah: number; start_time: number; end_time: number }[]>,
  ]);
  if (!dir || !Array.isArray(t)) throw new Error("no audio");
  for (const v of t) if (v.ayah > 0) verses[v.ayah] = { from: v.start_time, to: v.end_time };
  return { url: `${dir}${String(s).padStart(3, "0")}.mp3`, verses };
}

export async function handleRecite(request: Request): Promise<Response> {
  const u = new URL(request.url);
  const r = u.searchParams.get("r") ?? "";
  const s = Number(u.searchParams.get("s"));
  if ((!QDC[r] && !MP3Q[r] && !CDN[r]) || !Number.isInteger(s) || s < 1 || s > 114) return json(400, { error: "bad-request" });
  const key = `${r}:${s}`;
  if (!mem.has(key)) { const p = build(r, s); p.catch(() => mem.delete(key)); mem.set(key, p); }
  try { return json(200, await mem.get(key)!, true); } catch { return json(502, { error: "source-failed" }); }
}

/* ---------------- Making word timings (admins) ---------------- */
const BASMALAH = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"];
async function surahWords(s: number): Promise<string[][]> {
  const j = (await fetch(`https://api.alquran.cloud/v1/surah/${s}/quran-uthmani`).then((x) => x.json())) as { data: { ayahs: { numberInSurah: number; text: string }[] } };
  return j.data.ayahs.map((a) => {
    let w = a.text.replace(/^\uFEFF/, "").trim().split(/\s+/);
    if (a.numberInSurah === 1 && s !== 1 && s !== 9 && w[0]?.startsWith("بِسْمِ")) w = w.slice(4);
    return w.filter((x) => LETTER.test(x));
  });
}
async function align(audio: ArrayBuffer, text: string, key: string) {
  const fd = new FormData();
  fd.append("file", new Blob([audio], { type: "audio/mpeg" }), "recitation.mp3");
  fd.append("text", text);
  const r = await fetch("https://api.elevenlabs.io/v1/forced-alignment", { method: "POST", headers: { "xi-api-key": key }, body: fd });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const j = (await r.json()) as { words?: { text: string; start: number; end: number }[] };
  return (j.words ?? []).filter((w) => LETTER.test(w.text));
}
const ms = (sec: number) => Math.round(sec * 1000);

/** POST /api/recite-align { r, s, from?, to? } — makes word timings for one surah (or a few verses of it). */
export async function handleReciteAlign(request: Request): Promise<Response> {
  if (request.method !== "POST") return json(405, { error: "method" });
  const a = await admin(); if (!a) return json(500, { error: "server-not-set-up" });
  try {
    const uid = (await a.auth.verifyIdToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""))).uid;
    if (!(await a.db.doc(`admins/${uid}`).get()).exists) return json(403, { error: "admins-only" });
  } catch { return json(401, { error: "signed-out" }); }
  const key = process.env.ELEVENLABS_API_KEY; if (!key) return json(503, { error: "ElevenLabs key not set" });
  const body = (await request.json().catch(() => ({}))) as { r?: string; s?: number; from?: number; to?: number };
  const r = String(body.r ?? ""), s = Number(body.s);
  if ((!MP3Q[r] && !CDN[r]) || !Number.isInteger(s) || s < 1 || s > 114) return json(400, { error: "bad-request" });

  try {
    const words = await surahWords(s);
    const out: Record<string, string> = {};
    let inWindow = 0, total = 0;
    if (CDN[r]) {
      // one short file per verse: align each verse on its own (a few at a time, so it fits in a minute)
      const src = await source(r, s);
      const from = Math.max(1, Number(body.from) || 1), to = Math.min(words.length, Number(body.to) || from + 9);
      for (let n = from; n <= to; n++) {
        const audio = await fetch(src.verses[n]!.url!).then((x) => x.arrayBuffer());
        const got = await align(audio, words[n - 1]!.join(" "), key);
        if (got.length !== words[n - 1]!.length) throw new Error(`Ayah ${n}: ${got.length} words heard, ${words[n - 1]!.length} expected`);
        out[`a${n}`] = JSON.stringify(got.map((w, i) => [i + 1, ms(w.start), ms(w.end)]));
        total += got.length; inWindow += got.length;
      }
      await a.db.doc(`reciteWords/${r}_${s}`).set({ ...out, at: Date.now() }, { merge: true });
      mem.delete(`${r}:${s}`);
      return json(200, { ok: true, verses: to - from + 1, next: to < words.length ? to + 1 : null, match: 100 });
    }
    // one file for the whole surah
    const src = await source(r, s);
    const audio = await fetch(src.url).then((x) => x.arrayBuffer());
    if (audio.byteLength > 150 * 1024 * 1024) return json(413, { error: "Surah file too big for now" });
    const lead = s !== 1 && s !== 9 ? BASMALAH : [];
    const got = await align(audio, [...lead, ...words.flat()].join(" "), key);
    if (got.length !== lead.length + words.flat().length) throw new Error(`${got.length} words heard, ${lead.length + words.flat().length} expected`);
    let k = lead.length;
    words.forEach((list, i) => {
      const n = i + 1; const v = src.verses[n];
      const seg = list.map((_, j) => { const w = got[k++]!; if (v && w.start * 1000 >= v.from - 700 && w.start * 1000 <= v.to + 700) inWindow++; total++; return [j + 1, ms(w.start), ms(w.end)]; });
      out[`a${n}`] = JSON.stringify(seg);
    });
    const match = Math.round((inWindow / Math.max(1, total)) * 100);
    // mp3quran's verse times are a check: if most words land outside their verse, the alignment went wrong
    if (match < 85) return json(422, { error: `Only ${match}% of words matched their verse. Not saved.`, match });
    await a.db.doc(`reciteWords/${r}_${s}`).set({ ...out, at: Date.now() }, { merge: true });
    mem.delete(`${r}:${s}`);
    return json(200, { ok: true, verses: words.length, next: null, match });
  } catch (e) {
    return json(502, { error: e instanceof Error ? e.message : "failed" });
  }
}
