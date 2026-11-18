/* Plays just part of a verse ("a phrase") using Quran.com word timings. Returns false when timings aren't available. */
const QURAN_COM_IDS: Record<string, number> = {
  "ar.alafasy": 7, "ar.husary": 6, "ar.abdulbasitmurattal": 2, "ar.abdurrahmaansudais": 3,
  "ar.shaatree": 4, "ar.hanirifai": 5, "ar.minshawi": 9,
};
type Seg = { word: number; start: number; end: number };
const cache = new Map<string, { url: string; segs: Seg[] } | null>();
const isMarkOnly = (t: string) => /^[\u06D6-\u06ED\u0670\u06DE\u06E9]+$/.test(t);
const plain = (t: string) => t.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "");

async function timings(reciter: string, surah: number, ayah: number) {
  const rid = QURAN_COM_IDS[reciter]; if (!rid) return null;
  const key = `${rid}:${surah}:${ayah}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const r = await fetch(`https://api.quran.com/api/v4/recitations/${rid}/by_ayah/${surah}:${ayah}?fields=segments`);
    const j = (await r.json()) as { audio_files?: { url: string; segments?: number[][] }[] };
    const f = j.audio_files?.[0];
    if (!f?.url || !f.segments?.length) { cache.set(key, null); return null; }
    const url = f.url.startsWith("http") ? f.url : f.url.startsWith("//") ? `https:${f.url}` : `https://verses.quran.com/${f.url}`;
    const segs: Seg[] = f.segments.filter((s) => s.length >= 3).map((s) => (s.length >= 4 ? { word: s[1]!, start: s[2]!, end: s[3]! } : { word: s[0]!, start: s[1]!, end: s[2]! }));
    const out = { url, segs };
    cache.set(key, out); return out;
  } catch { cache.set(key, null); return null; }
}

export async function playPhraseAudio(reciter: string, surah: number, ayah: number, verseArabic: string, phrase: string, rate = 1): Promise<boolean> {
  const t = await timings(reciter, surah, ayah); if (!t) return false;
  const words = verseArabic.trim().split(/\s+/).filter((w) => w && !isMarkOnly(w)).map(plain);
  const part = phrase.trim().split(/\s+/).filter((w) => w && !isMarkOnly(w)).map(plain);
  let k = -1;
  for (let i = 0; i + part.length <= words.length; i++) if (part.every((w, j) => words[i + j] === w)) { k = i; break; }
  if (k < 0) return false;
  const first = t.segs.find((s) => s.word === k + 1), last = t.segs.find((s) => s.word === k + part.length);
  if (!first || !last) return false;
  return new Promise<boolean>((resolve) => {
    const a = new Audio(t.url); a.playbackRate = rate; a.preload = "auto";
    let done = false;
    const finish = (ok: boolean) => { if (done) return; done = true; clearInterval(timer); a.pause(); resolve(ok); };
    const timer = window.setInterval(() => { if (a.currentTime * 1000 >= last.end + 120) finish(true); }, 30);
    a.onerror = () => finish(false);
    a.onended = () => finish(true);
    a.onloadedmetadata = () => { a.currentTime = Math.max(0, first.start - 40) / 1000; a.play().catch(() => finish(false)); };
    setTimeout(() => finish(true), 30000);
  });
}

export const PIECE_RECITERS = Object.keys(QURAN_COM_IDS);
