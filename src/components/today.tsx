import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { arrayUnion, collection, doc, getDoc, getDocs, limit, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { BookOpen, Copy, Download, Headphones, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { awardXp } from "@/lib/xp";
import { cleanLevels, LEVEL_DEFAULTS, levelFor, type LevelDef } from "@/lib/xp-config";
import { LIBRARY, type LibraryItem } from "@/components/library-data";
import { CityPicker, DEFAULT_CITY, type City } from "@/components/ramadan";
import type { ShareCard } from "@/components/share-actions";

/* ---------- dates ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (key: string, n: number) => { const [y, m, d] = key.split("-").map(Number); return dayKey(new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + n)); };
const hijriOf = (d: Date) => { try { return `${new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(d).replace(/\s*AH$/, "")} AH`; } catch { return ""; } };

/** e.g. "Thursday · 12 November · 2 Jumada II 1448 AH" */
export function todayLabel() {
  const d = new Date();
  return [d.toLocaleDateString("en-GB", { weekday: "long" }), d.toLocaleDateString("en-GB", { day: "numeric", month: "long" }), hijriOf(d)].filter(Boolean).join(" · ");
}

function useUid() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);
  return uid;
}

/* ---------- daily streak (a day counts when you open IlmStation) ---------- */
export type StreakInfo = { count: number; best: number; last: string; days: string[] };
export function useStreak(): StreakInfo | null {
  const uid = useUid();
  const [s, setS] = useState<StreakInfo | null>(null);
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "profiles", uid);
    getDoc(ref).then((snap) => {
      const cur = (snap.get("streak") as StreakInfo | undefined) ?? { count: 0, best: 0, last: "", days: [] };
      const today = dayKey();
      if (cur.last === today) { setS(cur); return; }
      const count = cur.last === addDays(today, -1) ? cur.count + 1 : 1;
      const next: StreakInfo = { count, best: Math.max(cur.best ?? 0, count), last: today, days: [...(cur.days ?? []).filter((x) => x >= addDays(today, -60)), today] };
      setS(next);
      void setDoc(ref, { streak: next }, { merge: true }).then(() => awardXp("daily")).catch(() => {});
      if (count > 1) toast.success(`🔥 ${count} day streak! Keep it going.`);
    }).catch(() => {});
  }, [uid]);
  return s;
}

/* ---------- level from XP ---------- */
export { levelFor };
export function useLevels(): LevelDef[] {
  const [l, setL] = useState<LevelDef[]>(LEVEL_DEFAULTS);
  useEffect(() => onSnapshot(doc(db, "siteConfig", "levels"), (snap) => setL(cleanLevels(snap.get("list"))), () => {}), []);
  return l;
}
export function useMyXp() {
  const uid = useUid();
  const { account } = useAuth();
  const [xp, setXp] = useState<number | null>(null);
  useEffect(() => { if (!uid) return undefined; return onSnapshot(doc(db, "players", uid), (s) => setXp(Number(s.get("xp") ?? 50)), () => {}); }, [uid]);
  return xp ?? account?.xp ?? 0;
}
export function LevelCard() {
  const l = levelFor(useMyXp(), useLevels());
  return <div className="m-3 border-2 border-foreground bg-foreground p-3 text-background">
    <p className="text-xs uppercase text-background/60">Level {l.n}</p>
    <p className="font-serif text-2xl">{l.name}</p>
    <div className="mt-2 h-2 border border-background/40"><div className="h-full bg-primary" style={{ width: `${l.pct}%` }} /></div>
    <p className="mt-1 text-xs">{l.xp.toLocaleString()}{l.next ? ` / ${l.next.toLocaleString()}` : ""} XP</p>
  </div>;
}

/* ---------- shared card helpers (IlmStation look) ---------- */
const C = { bg: "#f7f3ea", ink: "#1c1a17", muted: "#6b6458", yellow: "#e8c25b", green: "#3e7b4f" };
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&display=swap";
function appFonts() {
  const probe = document.createElement("span"); probe.className = "font-serif"; probe.style.display = "none"; document.body.appendChild(probe);
  const serif = getComputedStyle(probe).fontFamily || "Georgia, serif"; probe.remove();
  return { serif, sans: getComputedStyle(document.body).fontFamily || "sans-serif" };
}
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
/** The box with its offset shadow, a header title and a yellow tag. */
function drawBox(ctx: CanvasRenderingContext2D, f: { serif: string; sans: string }, x: number, y: number, bw: number, bh: number, head: number, title: string, tag: string) {
  ctx.fillStyle = C.ink; ctx.fillRect(x + 18, y + 18, bw, bh);
  ctx.fillStyle = C.bg; ctx.fillRect(x, y, bw, bh);
  ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.strokeRect(x, y, bw, bh);
  ctx.beginPath(); ctx.moveTo(x, y + head); ctx.lineTo(x + bw, y + head); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.font = `56px ${f.serif}`; ctx.fillText(title, x + 40, y + head / 2 + 2);
  ctx.font = `800 28px ${f.sans}`;
  const tw = ctx.measureText(tag).width + 40;
  ctx.fillStyle = C.yellow; ctx.fillRect(x + bw - 40 - tw, y + head / 2 - 26, tw, 52);
  ctx.lineWidth = 4; ctx.strokeRect(x + bw - 40 - tw, y + head / 2 - 26, tw, 52);
  ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.fillText(tag, x + bw - 40 - tw / 2, y + head / 2 + 1);
}
/** Black "I" square + IlmStation + ilmstation.com, centred. */
function drawLogo(ctx: CanvasRenderingContext2D, f: { serif: string; sans: string }, S: number, ly: number) {
  ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = `60px ${f.serif}`;
  const nameW = ctx.measureText("IlmStation").width;
  ctx.font = `28px ${f.sans}`; const urlW = ctx.measureText("· ilmstation.com").width;
  let lx = S / 2 - (64 + 18 + nameW + 18 + urlW) / 2;
  ctx.fillStyle = C.ink; ctx.fillRect(lx, ly - 32, 64, 64);
  ctx.fillStyle = C.bg; ctx.font = `44px ${f.serif}`; ctx.textAlign = "center"; ctx.fillText("I", lx + 32, ly + 2);
  lx += 82; ctx.textAlign = "left"; ctx.fillStyle = C.ink; ctx.font = `60px ${f.serif}`; ctx.fillText("IlmStation", lx, ly + 2);
  lx += nameW + 18; ctx.fillStyle = C.muted; ctx.font = `28px ${f.sans}`; ctx.fillText("· ilmstation.com", lx, ly + 4);
}
const toFile = (c: HTMLCanvasElement, name: string) => new Promise<File | null>((res) => c.toBlob((bl) => res(bl ? new File([bl], name, { type: "image/png" }) : null), "image/png"));
/** Share sheet on phones, download on computers. */
async function shareOrDownload(f: File, name: string, text: string) {
  if (navigator.canShare?.({ files: [f] }) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [f], text }); } catch { /* cancelled */ }
    return;
  }
  const url = URL.createObjectURL(f);
  const el = document.createElement("a"); el.href = url; el.download = name; el.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- daily wisdom: a different one each day ---------- */
export type WisdomKind = "Qur’an" | "Hadith" | "Scholar" | "Dua" | "Reminder";
export const KIND_LABEL: Record<string, string> = { "Qur’an": "Qur’an", Hadith: "Hadith", Scholar: "Words of scholars", Dua: "Dua", Reminder: "Reminder" };
const KIND_TAG: Record<string, string> = { "Qur’an": "QUR’AN", Hadith: "HADITH", Scholar: "SCHOLARS", Dua: "DUA", Reminder: "REMINDER" };
export type Wisdom = { kind: WisdomKind; arabic: string; text: string; source: string };
const WISDOM: Wisdom[] = [
  { kind: "Qur’an", arabic: "إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ", text: "Indeed, We sent it down during the Night of Decree.", source: "Al-Qadr · 97:1" },
  { kind: "Hadith", arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ", text: "Actions are only by intentions.", source: "Sahih al-Bukhari 1" },
  { kind: "Qur’an", arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", text: "For indeed, with hardship comes ease.", source: "Ash-Sharh · 94:5" },
  { kind: "Hadith", arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", text: "The best of you are those who learn the Qur’an and teach it.", source: "Sahih al-Bukhari 5027" },
  { kind: "Qur’an", arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", text: "So remember Me; I will remember you.", source: "Al-Baqarah · 2:152" },
  { kind: "Hadith", arabic: "وَمَن يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ", text: "Whoever strives to be patient, Allah will make him patient.", source: "Sahih al-Bukhari 1469" },
  { kind: "Qur’an", arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", text: "Surely, in the remembrance of Allah do hearts find rest.", source: "Ar-Ra‘d · 13:28" },
  { kind: "Hadith", arabic: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ", text: "A good word is charity.", source: "Sahih al-Bukhari 2989" },
  { kind: "Qur’an", arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", text: "Allah does not burden a soul beyond what it can bear.", source: "Al-Baqarah · 2:286" },
  { kind: "Hadith", arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ", text: "Whoever takes a path seeking knowledge, Allah makes easy for him a path to Paradise.", source: "Sahih Muslim 2699" },
  { kind: "Qur’an", arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", text: "And say: My Lord, increase me in knowledge.", source: "Ta-Ha · 20:114" },
  { kind: "Hadith", arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ", text: "Your smile in the face of your brother is charity.", source: "Jami‘ at-Tirmidhi 1956" },
  { kind: "Qur’an", arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", text: "And whoever relies upon Allah, He is sufficient for him.", source: "At-Talaq · 65:3" },
  { kind: "Qur’an", arabic: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", text: "Do not despair of the mercy of Allah.", source: "Az-Zumar · 39:53" },
];
const dayOfYear = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000); };
export function todaysWisdom() {
  const i = dayOfYear() % WISDOM.length;
  return { ...WISDOM[i]!, index: i };
}

/** A square card of the wisdom. Text shrinks until it fits the box. */
async function wisdomImage(w: Wisdom): Promise<File | null> {
  if (!document.querySelector(`link[href="${FONT_LINK}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = FONT_LINK; document.head.appendChild(l); }
  await document.fonts.load('700 80px "Amiri"', "الله").catch(() => {});
  const f = appFonts();
  const S = 1080;
  const c = document.createElement("canvas"); c.width = S; c.height = S;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, S, S);
  const x = 90, y = 110, bw = S - 180, bh = 790, head = 112;
  drawBox(ctx, f, x, y, bw, bh, head, "Daily Wisdom", KIND_TAG[w.kind] ?? String(w.kind).toUpperCase());

  // measure everything together and shrink until it fits
  const avail = bh - head - 80;
  let arPx = 80, trPx = 42, ar: string[] = [], tr: string[] = [], blockH = 0;
  ctx.textBaseline = "top";
  for (let scale = 1; scale >= 0.45; scale -= 0.05) {
    arPx = Math.round(80 * scale); trPx = Math.round((w.arabic.trim() ? 42 : 58) * scale);
    ctx.direction = "rtl"; ctx.font = `700 ${arPx}px "Amiri", serif`;
    ar = w.arabic.trim() ? wrapLines(ctx, w.arabic, bw - 120) : [];
    ctx.direction = "ltr"; ctx.font = `italic ${trPx}px ${f.sans}`;
    tr = wrapLines(ctx, w.text, bw - 140);
    blockH = (ar.length ? arPx * 0.35 + ar.length * arPx * 1.55 + 30 : 0) + tr.length * trPx * 1.4 + 30 + 34;
    if (blockH <= avail) break;
  }
  let ty = y + head + 40 + Math.max(0, (avail - blockH) / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = C.ink; ctx.direction = "rtl"; ctx.font = `700 ${arPx}px "Amiri", serif`;
  if (ar.length) ty += arPx * 0.35;
  for (const l of ar) { ctx.fillText(l, S / 2, ty); ty += arPx * 1.55; }
  ctx.direction = "ltr"; ty += ar.length ? 30 : 0;
  ctx.font = `italic ${trPx}px ${f.sans}`;
  for (const l of tr) { ctx.fillText(l, S / 2, ty); ty += trPx * 1.4; }
  ty += 30;
  ctx.fillStyle = C.green; ctx.font = `700 32px ${f.sans}`; ctx.fillText(w.source, S / 2, ty);
  drawLogo(ctx, f, S, y + bh + 70);
  return toFile(c, "daily-wisdom.png");
}

/** Today's wisdom: pinned to today, else the admin's rotation, else the built-in list. */
type StoredWisdom = Wisdom & { id: string; date?: string; active?: boolean; createdAt?: number };
export function useTodaysWisdom(): Wisdom & { id: string } {
  const [list, setList] = useState<StoredWisdom[] | null>(null);
  useEffect(() => onSnapshot(collection(db, "wisdom"),
    (s) => setList(s.docs.map((d) => ({ ...(d.data() as Omit<StoredWisdom, "id">), id: d.id }))), () => setList([])), []);
  const fb = todaysWisdom();
  const fallback = { kind: fb.kind, arabic: fb.arabic, text: fb.text, source: fb.source, id: `b${fb.index}` };
  if (!list) return fallback;
  const pinned = list.find((x) => x.active !== false && x.date === dayKey());
  if (pinned) return pinned;
  const pool = list.filter((x) => x.active !== false && !x.date).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  if (!pool.length) return fallback;
  return pool[dayOfYear() % pool.length]!;
}

export function DailyWisdom({ onShare, w: given }: { onShare: (card: ShareCard) => void; w?: Wisdom & { id: string } }) {
  const uid = useUid();
  const w = given ?? (() => { const b = todaysWisdom(); return { kind: b.kind, arabic: b.arabic, text: b.text, source: b.source, id: `b${b.index}` }; })();
  const [busy, setBusy] = useState(false);
  const save = () => {
    if (!uid) { toast("Log in to save wisdom."); return; }
    void setDoc(doc(db, "profiles", uid), { savedWisdom: arrayUnion(w.id) }, { merge: true })
      .then(() => { toast.success("Saved"); void awardXp("wisdom"); }).catch(() => toast("Couldn't save. Try again."));
  };
  const copy = () => {
    void navigator.clipboard.writeText(`${w.arabic ? `${w.arabic}\n\n` : ""}“${w.text}”\n— ${w.source}\n\nvia IlmStation · ilmstation.com`)
      .then(() => { toast.success("Copied"); void awardXp("wisdom"); }).catch(() => toast("Couldn't copy."));
  };
  const download = async () => {
    setBusy(true);
    try {
      const f = await wisdomImage(w);
      if (!f) return;
      void awardXp("wisdom");
      await shareOrDownload(f, "daily-wisdom.png", "Daily Wisdom · via IlmStation · ilmstation.com");
    } finally { setBusy(false); }
  };
  return <>
    {w.arabic && <p className="font-arabic text-3xl leading-relaxed" dir="rtl">{w.arabic}</p>}
    <p className={w.arabic ? "mt-2 text-sm italic" : "font-serif text-2xl italic leading-snug"}>{w.text}</p>
    <p className="mt-2 text-xs text-muted-foreground">{w.source}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={save}>Save</Button>
      <Button variant="outline" size="sm" onClick={copy}><Copy /> Copy</Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void download()}><Download /> {busy ? "Making…" : "Card"}</Button>
      <Button variant="outline" size="sm" onClick={() => onShare({ eyebrow: "IlmStation · Daily Wisdom", arabic: w.arabic, headline: w.text, sub: w.source, meta: w.kind })}><Share2 /> Share</Button>
    </div>
  </>;
}

/* ---------- pick up where you left off (library) ---------- */
type Prog = { pos: number; total: number; at: number; secs?: number };
export function ContinueCard({ onLibrary, onPlay }: { onLibrary: () => void; onPlay: () => void }) {
  const uid = useUid();
  const [item, setItem] = useState<{ title: string; note: string; pct: number; listen: boolean } | null | undefined>(undefined);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "libraryState", uid)).then(async (s) => {
      const prog = (s.get("progress") ?? {}) as Record<string, Prog>;
      const finished = (s.get("finished") ?? []) as string[];
      const top = Object.entries(prog).filter(([k, p]) => p?.total && !finished.includes(k.replace(/^audio:/, ""))).sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0))[0];
      if (!top) { setItem(null); return; }
      const [key, p] = top;
      const listen = key.startsWith("audio:");
      const id = key.replace(/^audio:/, "");
      let title = LIBRARY.find((i) => i.id === id)?.title;
      if (!title) { const d = await getDoc(doc(db, "library", id)).catch(() => null); title = (d?.get("title") as string) ?? "Your book"; }
      const pct = Math.round(((p.pos + 1) / p.total) * 100);
      setItem({ title, listen, pct, note: listen ? `Chapter ${p.pos + 1} of ${p.total}` : `${pct}% read` });
    }).catch(() => setItem(null));
  }, [uid]);

  const { account } = useAuth();
  const [suggest, setSuggest] = useState<{ title: string; author?: string; coverUrl?: string } | null>(null);
  useEffect(() => {
    if (item !== null) return;
    const zone = account?.zone ?? "adult";
    const bands = zone === "kids" ? ["kids"] : zone === "youth" ? ["kids", "teens"] : ["kids", "teens", "adults"];
    getDocs(query(collection(db, "library"), where("status", "==", "published"), limit(30))).then((snap) => {
      const list = snap.docs.map((d) => d.data() as LibraryItem)
        .filter((b) => bands.includes(b.age) && (!b.audience || b.audience === account?.gender))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      const pick = list[0] ?? LIBRARY.find((b) => b.body?.length && bands.includes(b.age));
      if (pick) setSuggest({ title: pick.title, author: pick.author, coverUrl: pick.coverUrl });
    }).catch(() => {});
  }, [item, account?.zone, account?.gender]);

  if (item === undefined) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!item) return <>
    {suggest ? <div className="flex gap-4">
      {suggest.coverUrl && <img src={suggest.coverUrl} alt="" className="h-28 w-20 shrink-0 border-2 border-foreground object-cover" />}
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground"><BookOpen className="size-3.5" /> Start reading</p>
        <h2 className="mt-1 font-serif text-3xl">{suggest.title}</h2>
        {suggest.author && <p className="text-sm text-muted-foreground">{suggest.author}</p>}
      </div>
    </div> : <h2 className="font-serif text-3xl">Start with a quick quiz</h2>}
    <p className="mt-3 text-sm text-muted-foreground">Open a book from the library, or test yourself with a quick quiz.</p>
    <div className="mt-5 flex flex-wrap gap-2"><Button onClick={onLibrary}><BookOpen /> {suggest ? "Start reading" : "Browse the library"}</Button><Button variant="outline" onClick={onPlay}><Play /> Quick quiz</Button></div>
  </>;
  return <>
    <p className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground">{item.listen ? <><Headphones className="size-3.5" /> Continue listening</> : <><BookOpen className="size-3.5" /> Continue reading</>}</p>
    <h2 className="mt-1 font-serif text-3xl">{item.title}</h2>
    <div className="mt-4 flex items-center gap-3"><div className="h-4 flex-1 border-2 border-foreground p-0.5"><div className="h-full bg-secondary" style={{ width: `${item.pct}%` }} /></div><span className="text-sm font-semibold">{item.note}</span></div>
    <div className="mt-5 flex flex-wrap gap-2"><Button onClick={onLibrary}>Continue in Library</Button><Button variant="outline" onClick={onPlay}><Play /> Quick quiz</Button></div>
  </>;
}

/* ---------- today's prayer times ---------- */
const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
/** Aladhan calculation methods. "Auto" uses what's normal in the user's country. */
const METHODS: [string, string][] = [
  ["", "Your country’s usual method (default)"], ["2", "ISNA (North America)"], ["3", "Muslim World League"], ["4", "Umm al-Qura (Makkah)"],
  ["5", "Egyptian General Authority"], ["1", "Karachi (University of Islamic Sciences)"], ["15", "Moonsighting Committee"],
];
export const pickMethod = (pick: string, city: City) => (!pick || pick === "country" ? String(city.method) : pick);

/** A square card of today's prayer times, with the date and city. */
async function prayerImage(rows: { name: string; time: string; next: boolean }[], city: string): Promise<File | null> {
  const f = appFonts();
  const d = new Date();
  const S = 1080;
  const c = document.createElement("canvas"); c.width = S; c.height = S;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, S, S);
  const x = 90, y = 80, bw = S - 180, bh = 830, head = 112;
  drawBox(ctx, f, x, y, bw, bh, head, "Prayer times", d.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase());
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillStyle = C.ink; ctx.font = `700 36px ${f.sans}`; ctx.fillText(d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), x + 44, y + head + 52);
  ctx.fillStyle = C.green; ctx.font = `600 30px ${f.sans}`; ctx.fillText(hijriOf(d), x + 44, y + head + 96);
  ctx.fillStyle = C.muted; ctx.font = `28px ${f.sans}`;
  let cityText = city;
  while (ctx.measureText(cityText).width > bw - 88 && cityText.length > 4) cityText = `${cityText.slice(0, -2)}…`;
  ctx.fillText(cityText, x + 44, y + head + 140);
  let ry = y + head + 190;
  for (const r of rows) {
    if (r.next) { ctx.fillStyle = C.yellow; ctx.fillRect(x + 30, ry, bw - 60, 84); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.strokeRect(x + 30, ry, bw - 60, 84); }
    ctx.fillStyle = C.ink; ctx.font = `${r.next ? 800 : 500} 42px ${f.sans}`;
    ctx.textAlign = "left"; ctx.fillText(r.name, x + 64, ry + 44);
    ctx.textAlign = "right"; ctx.fillText(r.time, x + bw - 64, ry + 44);
    ry += 96;
  }
  drawLogo(ctx, f, S, y + bh + 76);
  return toFile(c, "prayer-times.png");
}

export function PrayerCard() {
  const uid = useUid();
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [times, setTimes] = useState<{ name: string; at: Date }[] | null>(null);
  const [tz, setTz] = useState<string | undefined>();
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [h24, setH24] = useState(false);
  const [methodPick, setMethodPick] = useState("");
  const [adhanOn, setAdhanOn] = useState(true);
  useEffect(() => {
    try { setH24(localStorage.getItem("timeFormat") === "24"); setMethodPick(localStorage.getItem("prayerMethod") ?? ""); setAdhanOn(localStorage.getItem("adhanOn") !== "0"); } catch { /* private mode */ }
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(doc(db, "ramadanProgress", uid), (s) => { const c = s.get("city") as City | undefined; if (c) setCity(c); }, () => {});
  }, [uid]);
  const method = pickMethod(methodPick, city);
  useEffect(() => {
    let off = false;
    const d = new Date();
    const ds = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const q = city.lat != null ? `timings/${ds}?latitude=${city.lat}&longitude=${city.lng}` : `timingsByCity/${ds}?city=${encodeURIComponent(city.name)}&country=${encodeURIComponent(city.country ?? "")}`;
    fetch(`https://api.aladhan.com/v1/${q}&method=${method}&iso8601=true`).then((r) => r.json()).then((j) => {
      const tm = j?.data?.timings;
      if (!tm || off) return;
      setTz(j?.data?.meta?.timezone);
      setTimes(PRAYERS.map((p) => ({ name: p, at: new Date(tm[p]) })));
    }).catch(() => { if (!off) setTimes([]); });
    return () => { off = true; };
  }, [city.name, city.lat, city.lng, city.country, method, dayKey(now)]); // eslint-disable-line react-hooks/exhaustive-deps

  const clock = (d: Date) => {
    const o: Intl.DateTimeFormatOptions = { hour: h24 ? "2-digit" : "numeric", minute: "2-digit", hour12: !h24 };
    try { return d.toLocaleTimeString("en-US", { ...o, timeZone: tz }); } catch { return d.toLocaleTimeString("en-US", o); }
  };
  const next = times?.find((t) => t.at > now);
  const left = next ? Math.max(0, Math.round((next.at.getTime() - now.getTime()) / 60000)) : 0;
  const remember = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
  const cityLabel = city.name.includes(",") ? city.name : [city.name, city.country].filter(Boolean).join(", ");

  return <div>
    {!times ? <p className="text-sm text-muted-foreground">Loading…</p> : times.length === 0 ? <p className="text-sm text-muted-foreground">Couldn't load prayer times.</p> : <>
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        {next ? <p><b>{next.name}</b> in {Math.floor(left / 60) ? `${Math.floor(left / 60)}h ` : ""}{left % 60}m</p> : <span />}
        <span className="flex gap-1"><button type="button" title={adhanOn ? "Adhan is on" : "Adhan is off"} onClick={() => { const v = !adhanOn; setAdhanOn(v); remember("adhanOn", v ? "1" : "0"); window.dispatchEvent(new Event("prayerprefs")); toast(v ? "Adhan on: it will play at prayer times while IlmStation is open." : "Adhan off."); }} className="border-2 border-foreground px-2 py-0.5 text-xs font-bold">{adhanOn ? "🔔 Adhan" : "🔕 Adhan"}</button><button type="button" title="Switch 12h / 24h" onClick={() => { const v = !h24; setH24(v); remember("timeFormat", v ? "24" : "12"); }} className="border-2 border-foreground px-2 py-0.5 text-xs font-bold">{h24 ? "24h" : "12h"}</button></span>
      </div>
      <ul className="grid gap-1">{times.map((t) => <li key={t.name} className={cn("flex justify-between px-2 py-1.5 text-sm", next?.name === t.name && "border-2 border-foreground bg-primary font-semibold")}>
        <span>{t.name}</span><span className="tabular-nums">{clock(t.at)}</span>
      </li>)}</ul>
      <Button variant="outline" size="sm" className="mt-3" disabled={busy} onClick={() => {
        setBusy(true);
        void prayerImage(times.map((t) => ({ name: t.name, time: clock(t.at), next: next?.name === t.name })), cityLabel)
          .then((f) => (f ? shareOrDownload(f, "prayer-times.png", "Today’s prayer times · via IlmStation · ilmstation.com") : undefined))
          .finally(() => setBusy(false));
      }}><Download /> {busy ? "Making…" : "Download card"}</Button>
    </>}
    <div className="mt-3 border-t-2 border-foreground/20 pt-3 text-sm">
      <CityPicker city={city} onPick={(c) => { setCity(c); if (uid) void setDoc(doc(db, "ramadanProgress", uid), { city: c }, { merge: true }).catch(() => {}); }} />
      <label className="mt-3 block text-xs font-bold uppercase text-muted-foreground">Calculation
        <select value={methodPick} onChange={(e) => { setMethodPick(e.target.value); remember("prayerMethod", e.target.value); window.dispatchEvent(new Event("prayerprefs")); }} className="mt-1 block h-9 w-full border-2 border-foreground bg-background px-2 text-sm font-normal normal-case text-foreground">
          {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
    </div>
  </div>;
}

/** Every level, what it gives, and how far the user is. */
export function LevelLadder() {
  const xp = useMyXp();
  const levels = useLevels();
  const l = levelFor(xp, levels);
  return <section className="min-w-0 border-2 border-foreground bg-background shadow-brutal md:col-span-2">
    <div className="flex items-center justify-between gap-3 border-b-2 border-foreground px-4 py-2"><h2 className="font-serif text-xl">Level {l.n} · {l.name}</h2><span className="text-xs font-semibold uppercase text-muted-foreground">{xp.toLocaleString()} XP</span></div>
    <div className="p-4">
      <div className="h-5 border-2 border-foreground p-0.5"><div className="h-full bg-primary" style={{ width: `${l.pct}%` }} /></div>
      <p className="mt-2 text-sm text-muted-foreground">{l.next ? `${(l.next - xp).toLocaleString()} XP to ${l.nextName}` : "Top level reached, masha’Allah."}</p>
      <ol className="mt-5 grid gap-2">{levels.map((lv, i) => {
        const reached = xp >= lv.xp; const current = i + 1 === l.n;
        return <li key={`${lv.name}-${i}`} className={cn("grid grid-cols-[auto_1fr_auto] items-start gap-3 border-2 border-foreground p-3", current ? "bg-primary" : reached ? "bg-secondary/15" : "opacity-70")}>
          <span className="grid size-8 place-items-center border-2 border-foreground bg-background font-serif">{i + 1}</span>
          <div className="min-w-0"><b className="font-serif text-lg font-normal">{lv.name}</b>{lv.perks.length > 0 && <ul className="mt-1 text-xs text-muted-foreground">{lv.perks.map((p) => <li key={p}>• {p}</li>)}</ul>}</div>
          <span className="text-xs font-semibold">{reached ? "✓" : `${lv.xp.toLocaleString()} XP`}</span>
        </li>;
      })}</ol>
    </div>
  </section>;
}

/* ---------- Friday: Surah Al-Kahf ---------- */
type Ayah = { n: number; ar: string; en: string; page: number };
const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const QURAN_FONT = "https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap";
const QFONT = { fontFamily: '"Amiri Quran", "Amiri", serif' };
const arNum = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] ?? d);
type Reciter = { id: string; name: string; url: string };
const FALLBACK_RECITER: Reciter = { id: "alafasy", name: "Mishary Alafasy", url: "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/18.mp3" };

/** Reciters with a full Hafs recitation of Al-Kahf (from mp3quran.net). */
function useReciters(open: boolean) {
  const [list, setList] = useState<Reciter[]>([FALLBACK_RECITER]);
  useEffect(() => {
    if (!open || list.length > 1) return;
    fetch("https://www.mp3quran.net/api/v3/reciters?language=eng").then((r) => r.json()).then((j) => {
      const out: Reciter[] = [];
      for (const r of (j?.reciters ?? []) as { id: number; name: string; moshaf?: { id: number; name: string; server: string; surah_list: string }[] }[]) {
        const m = (r.moshaf ?? []).find((x) => /hafs/i.test(x.name) && x.surah_list.split(",").includes("18"));
        if (m) out.push({ id: `${r.id}-${m.id}`, name: r.name, url: `${m.server.replace(/\/?$/, "/")}018.mp3` });
      }
      out.sort((x, y) => x.name.localeCompare(y.name));
      if (out.length) setList(out);
    }).catch(() => {});
  }, [open, list.length]);
  return list;
}

function KahfReader({ open, onOpenChange, done, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; done: boolean; onDone: () => void }) {
  const [ayat, setAyat] = useState<Ayah[] | null>(null);
  const [mode, setMode] = useState<"mushaf" | "translation">("mushaf");
  const [err, setErr] = useState(false);
  const reciters = useReciters(open);
  const [rid, setRid] = useState("");
  useEffect(() => { try { setRid(localStorage.getItem("kahfReciter") ?? ""); } catch { /* private mode */ } }, []);
  const reciter = reciters.find((r) => r.id === rid) ?? reciters.find((r) => /afas/i.test(r.name)) ?? reciters[0]!;

  useEffect(() => {
    if (!open) return;
    if (!document.querySelector(`link[href="${QURAN_FONT}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = QURAN_FONT; document.head.appendChild(l); }
    if (ayat) return;
    fetch("https://api.alquran.cloud/v1/surah/18/editions/quran-uthmani,en.sahih").then((r) => r.json()).then((j) => {
      const ar = (j?.data?.[0]?.ayahs ?? []) as { numberInSurah: number; text: string; page: number }[];
      const en = (j?.data?.[1]?.ayahs ?? []) as { text: string }[];
      if (!ar.length) { setErr(true); return; }
      setAyat(ar.map((x, i) => ({ n: x.numberInSurah, page: x.page, ar: i === 0 && x.text.startsWith("بِسْمِ") ? x.text.split(" ").slice(4).join(" ") : x.text, en: en[i]?.text ?? "" })));
    }).catch(() => setErr(true));
  }, [open, ayat]);

  // group the ayat into the Madinah mushaf's pages
  const pages: { page: number; ayat: Ayah[] }[] = [];
  for (const x of ayat ?? []) { const last = pages[pages.length - 1]; if (last && last.page === x.page) last.ayat.push(x); else pages.push({ page: x.page, ayat: [x] }); }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-2 border-foreground bg-background shadow-brutal sm:rounded-none">
      <DialogHeader>
        <DialogTitle className="font-serif text-3xl">Surah Al-Kahf <span className="text-2xl" style={QFONT} dir="rtl">سُورَةُ الكَهْفِ</span></DialogTitle>
        <DialogDescription>110 ayat · read or listen</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2 border-2 border-foreground bg-muted p-3">
        <label className="text-xs font-bold uppercase text-muted-foreground">Reciter
          <select className="mt-1 block h-10 w-full border-2 border-foreground bg-background px-2 text-sm font-normal normal-case text-foreground" value={reciter.id}
            onChange={(e) => { setRid(e.target.value); try { localStorage.setItem("kahfReciter", e.target.value); } catch { /* private mode */ } }}>
            {reciters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <audio key={reciter.url} controls preload="none" className="w-full" src={reciter.url} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={mode === "mushaf" ? "default" : "outline"} onClick={() => setMode("mushaf")}>Mushaf</Button>
        <Button size="sm" variant={mode === "translation" ? "default" : "outline"} onClick={() => setMode("translation")}>With translation</Button>
      </div>
      {err ? <p className="text-sm text-muted-foreground">Couldn't load the surah. Check your connection and try again.</p>
        : !ayat ? <p className="text-sm text-muted-foreground">Loading…</p>
        : mode === "mushaf"
        ? <div className="mx-auto grid w-full max-w-2xl gap-4">
          {pages.map((pg, i) => <div key={pg.page} className="border-[6px] border-double border-[#3e7b4f] bg-[#fdf8ec] p-1.5 text-[#1c1a17] shadow-brutal-sm">
            <div className="border-2 border-[#c9a646] px-4 py-5 sm:px-8">
              {i === 0 && <>
                <div className="mb-3 border-4 border-double border-[#c9a646] bg-[#3e7b4f]/10 py-2 text-center"><p className="text-3xl" style={QFONT} dir="rtl">سُورَةُ الكَهْفِ</p></div>
                <p className="mb-3 text-center text-3xl" style={QFONT} dir="rtl" lang="ar">{BASMALA}</p>
              </>}
              <p dir="rtl" lang="ar" className="text-justify text-[26px] leading-[2.5] sm:text-[31px]" style={QFONT}>
                {pg.ayat.map((x) => <span key={x.n}>{x.ar} <span className="text-[#3e7b4f]">﴿{arNum(x.n)}﴾</span> </span>)}
              </p>
              <p className="mt-3 text-center text-sm text-[#6b6458]" style={QFONT}>{arNum(pg.page)}</p>
            </div>
          </div>)}
        </div>
        : <div className="grid gap-4">
          <p className="text-center text-3xl" style={QFONT} dir="rtl" lang="ar">{BASMALA}</p>
          {ayat.map((x) => <div key={x.n} className="border-b border-foreground/20 pb-4">
            <p className="text-2xl leading-[2.3]" style={QFONT} dir="rtl" lang="ar">{x.ar} <span className="text-base text-muted-foreground">﴿{arNum(x.n)}﴾</span></p>
            <p className="mt-2 text-sm text-muted-foreground"><b>{x.n}.</b> {x.en}</p>
          </div>)}
          <p className="text-xs text-muted-foreground">Translation: Saheeh International</p>
        </div>}
      <p className="text-xs text-muted-foreground">Recitation: {reciter.name}</p>
      <Button disabled={done || !ayat} onClick={onDone}>{done ? "Read this Friday ✓" : "I’ve read Al-Kahf"}</Button>
    </DialogContent>
  </Dialog>;
}

export function KahfReminder() {
  const uid = useUid();
  const today = dayKey();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [isFriday, setIsFriday] = useState(false);
  useEffect(() => { setIsFriday(new Date().getDay() === 5); }, []);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "profiles", uid)).then((s) => setDone(s.get("kahfDone") === today)).catch(() => {});
  }, [uid, today]);
  if (!isFriday) return null;
  const markRead = () => {
    setDone(true); setOpen(false);
    toast.success("Masha’Allah! May it be a light for you until next Friday.");
    if (uid) void setDoc(doc(db, "profiles", uid), { kahfDone: today }, { merge: true }).then(() => awardXp("kahf", { date: today })).catch(() => {});
  };
  return <>
    <section className="mt-6 grid gap-4 border-2 border-foreground bg-secondary p-5 text-secondary-foreground shadow-brutal sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-xs font-bold uppercase opacity-80">Jumu’ah Mubarak</p>
        <h2 className="font-serif text-3xl">{done ? "You read Surah Al-Kahf today ✓" : "Read Surah Al-Kahf today"}</h2>
        <p className="mt-1 max-w-2xl text-sm opacity-90">“Whoever reads Surah al-Kahf on Friday, a light will shine for him between the two Fridays.” · Al-Hakim, Sahih al-Jami‘ 6470</p>
      </div>
      <Button onClick={() => setOpen(true)} className="border-2 border-secondary-foreground bg-background text-foreground"><BookOpen /> {done ? "Read again" : "Read Al-Kahf"}</Button>
    </section>
    <KahfReader open={open} onOpenChange={setOpen} done={done} onDone={markRead} />
  </>;
}

/* ---------- adhan at prayer time (while the app is open) ---------- */
const ADHAN = "/audio/adhan.mp3";
const ADHAN_FAJR = "/audio/adhan-fajr.mp3";
function readPrefs() { try { return { method: localStorage.getItem("prayerMethod") ?? "", adhan: localStorage.getItem("adhanOn") !== "0" }; } catch { return { method: "", adhan: true }; } }

export function AdhanWatcher() {
  const uid = useUid();
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [prefs, setPrefs] = useState({ method: "", adhan: true });
  const [times, setTimes] = useState<{ name: string; at: Date }[]>([]);
  const [day, setDay] = useState(dayKey());
  const [playing, setPlaying] = useState<{ name: string; blocked: boolean } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [urls, setUrls] = useState({ main: ADHAN, fajr: ADHAN_FAJR });
  useEffect(() => onSnapshot(doc(db, "siteConfig", "adhan"), (s) => {
    const main = (s.get("url") as string) || ADHAN;
    setUrls({ main, fajr: (s.get("fajrUrl") as string) || main });
  }, () => {}), []);

  useEffect(() => {
    setPrefs(readPrefs());
    const on = () => setPrefs(readPrefs());
    window.addEventListener("prayerprefs", on);
    return () => window.removeEventListener("prayerprefs", on);
  }, []);
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(doc(db, "ramadanProgress", uid), (s) => { const c = s.get("city") as City | undefined; if (c) setCity(c); }, () => {});
  }, [uid]);
  useEffect(() => {
    let off = false;
    const d = new Date();
    const ds = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const q = city.lat != null ? `timings/${ds}?latitude=${city.lat}&longitude=${city.lng}` : `timingsByCity/${ds}?city=${encodeURIComponent(city.name)}&country=${encodeURIComponent(city.country ?? "")}`;
    fetch(`https://api.aladhan.com/v1/${q}&method=${pickMethod(prefs.method, city)}&iso8601=true`).then((r) => r.json()).then((j) => {
      const tm = j?.data?.timings;
      if (tm && !off) setTimes(PRAYERS.map((p) => ({ name: p, at: new Date(tm[p]) })));
    }).catch(() => {});
    return () => { off = true; };
  }, [city.name, city.lat, city.lng, city.country, prefs.method, day]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tick = () => {
      const today = dayKey();
      if (today !== day) setDay(today);
      if (!prefs.adhan) return;
      const now = Date.now();
      for (const t of times) {
        const diff = now - t.at.getTime();
        const key = `adhan:${today}:${t.name}`;
        let seen = false;
        try { seen = !!sessionStorage.getItem(key); } catch { /* private mode */ }
        if (diff >= 0 && diff < 90_000 && !seen) {
          try { sessionStorage.setItem(key, "1"); } catch { /* private mode */ }
          const a = new Audio(t.name === "Fajr" ? urls.fajr : urls.main);
          a.onerror = () => { if (t.name === "Fajr" && a.src !== urls.main) { a.src = urls.main; void a.play().catch(() => {}); } };
          a.onended = () => setPlaying(null);
          audioRef.current = a;
          setPlaying({ name: t.name, blocked: false });
          void a.play().catch(() => setPlaying({ name: t.name, blocked: true }));
        }
      }
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [times, prefs.adhan, day, urls]);

  const stop = () => { audioRef.current?.pause(); audioRef.current = null; setPlaying(null); };
  if (!playing) return null;
  return <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md border-2 border-foreground bg-primary p-4 shadow-brutal lg:bottom-6">
    <p className="text-xs font-bold uppercase">Adhan</p>
    <p className="font-serif text-2xl">It’s time for {playing.name}</p>
    <p className="font-arabic text-xl" dir="rtl">اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {playing.blocked && <Button size="sm" onClick={() => { void audioRef.current?.play().then(() => setPlaying((p) => p && { ...p, blocked: false })).catch(() => {}); }}>▶ Play adhan</Button>}
      <Button size="sm" variant="outline" onClick={stop}>Stop</Button>
      <Button size="sm" variant="ghost" onClick={() => { stop(); try { localStorage.setItem("adhanOn", "0"); } catch { /* private mode */ } window.dispatchEvent(new Event("prayerprefs")); toast("Adhan turned off. You can turn it back on from Prayer times."); }}>Turn off adhan</Button>
    </div>
  </div>;
}
