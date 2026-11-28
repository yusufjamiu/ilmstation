/* Verse timings for quiz reciters, so one verse can be played (and its words lit up) from a full-surah recording.
   GET /api/recite?r=<reciter key>&s=<surah>  →  { url, verses: { [ayah]: { from, to, words?: [word, start, end][] } } }  (ms)
   Sources: Quran.com (QDC: word timings) and mp3quran.net (verse timings only). */

const QDC: Record<string, number> = { alafasy: 7, sudais: 3, husary: 6, minshawi: 9, abdulbasit: 2, dosari: 97, shuraim: 10, shatri: 4 };
const MP3Q: Record<string, number> = { raad: 221, juhani: 62, alijaber: 76, ghamdi: 30, baleela: 217 };

type Verses = Record<number, { from: number; to: number; words?: number[][] }>;
const mem = new Map<string, Promise<{ url: string; verses: Verses }>>();
let folders: Promise<Record<number, string>> | null = null;

const json = (status: number, body: object, cache = false) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": cache ? "public, max-age=86400, s-maxage=604800" : "no-store" } });

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
  const verses: Verses = {};
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
  if ((!QDC[r] && !MP3Q[r]) || !Number.isInteger(s) || s < 1 || s > 114) return json(400, { error: "bad-request" });
  const key = `${r}:${s}`;
  if (!mem.has(key)) { const p = build(r, s); p.catch(() => mem.delete(key)); mem.set(key, p); }
  try { return json(200, await mem.get(key)!, true); } catch { return json(502, { error: "source-failed" }); }
}
