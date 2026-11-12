import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { arrayUnion, collection, doc, getDoc, getDocs, limit, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { BookOpen, Copy, Download, Headphones, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { awardXp } from "@/lib/xp";
import { LIBRARY, type LibraryItem } from "@/components/library-data";
import { CityPicker, DEFAULT_CITY, type City } from "@/components/ramadan";
import type { ShareCard } from "@/components/share-actions";

/* ---------- dates ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (key: string, n: number) => { const [y, m, d] = key.split("-").map(Number); return dayKey(new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + n)); };

/** e.g. "Thursday · 12 November · 2 Jumada II 1448 AH" */
export function todayLabel() {
  const d = new Date();
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const greg = d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  let hijri = "";
  try { hijri = `${new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(d).replace(/\s*AH$/, "")} AH`; } catch { /* older browsers */ }
  return [weekday, greg, hijri].filter(Boolean).join(" · ");
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
const LEVELS: [number, string][] = [[0, "Newcomer"], [100, "Seeker"], [300, "Student"], [700, "Learner"], [1200, "Devoted"], [2000, "Guardian"], [3000, "Scholar"], [5000, "Sage"]];
export function levelFor(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1]![0]) i++;
  const [min, name] = LEVELS[i]!;
  const next = LEVELS[i + 1]?.[0] ?? null;
  return { n: i + 1, name, xp, next, pct: next ? Math.round(((xp - min) / (next - min)) * 100) : 100 };
}
export function useMyXp() {
  const uid = useUid();
  const { account } = useAuth();
  const [xp, setXp] = useState<number | null>(null);
  useEffect(() => { if (!uid) return undefined; return onSnapshot(doc(db, "players", uid), (s) => setXp(Number(s.get("xp") ?? 50)), () => {}); }, [uid]);
  return xp ?? account?.xp ?? 0;
}
export function LevelCard() {
  const l = levelFor(useMyXp());
  return <div className="m-3 border-2 border-foreground bg-foreground p-3 text-background">
    <p className="text-xs uppercase text-background/60">Level {l.n}</p>
    <p className="font-serif text-2xl">{l.name}</p>
    <div className="mt-2 h-2 border border-background/40"><div className="h-full bg-primary" style={{ width: `${l.pct}%` }} /></div>
    <p className="mt-1 text-xs">{l.xp.toLocaleString()}{l.next ? ` / ${l.next.toLocaleString()}` : ""} XP</p>
  </div>;
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
export function todaysWisdom() {
  const d = new Date();
  const dayOfYear = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000);
  const i = dayOfYear % WISDOM.length;
  return { ...WISDOM[i]!, index: i };
}
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&display=swap";
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
/** A 1080×1350 image card of today's wisdom. */
async function wisdomImage(w: Wisdom): Promise<File | null> {
  if (!document.querySelector(`link[href="${FONT_LINK}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = FONT_LINK; document.head.appendChild(l); }
  await document.fonts.load('700 80px "Amiri"', "الله").catch(() => {});
  // IlmStation colours and fonts (the same look as the app's boxes)
  const C = { bg: "#f7f3ea", ink: "#1c1a17", muted: "#6b6458", yellow: "#e8c25b", green: "#3e7b4f" };
  const probe = document.createElement("span"); probe.className = "font-serif"; probe.style.display = "none"; document.body.appendChild(probe);
  const serif = getComputedStyle(probe).fontFamily || "Georgia, serif"; probe.remove();
  const sans = getComputedStyle(document.body).fontFamily || "sans-serif";

  const S = 1080;
  const c = document.createElement("canvas"); c.width = S; c.height = S;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, S, S);

  // the box with its offset shadow
  const x = 90, y = 110, bw = S - 180, bh = 790, head = 112;
  ctx.fillStyle = C.ink; ctx.fillRect(x + 18, y + 18, bw, bh);
  ctx.fillStyle = C.bg; ctx.fillRect(x, y, bw, bh);
  ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.strokeRect(x, y, bw, bh);
  // header bar
  ctx.beginPath(); ctx.moveTo(x, y + head); ctx.lineTo(x + bw, y + head); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.font = `56px ${serif}`; ctx.fillText("Daily Wisdom", x + 40, y + head / 2 + 2);
  // yellow tag
  const tag = KIND_TAG[w.kind] ?? String(w.kind).toUpperCase();
  ctx.font = `800 28px ${sans}`;
  const tw = ctx.measureText(tag).width + 40;
  ctx.fillStyle = C.yellow; ctx.fillRect(x + bw - 40 - tw, y + head / 2 - 26, tw, 52);
  ctx.lineWidth = 4; ctx.strokeRect(x + bw - 40 - tw, y + head / 2 - 26, tw, 52);
  ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.fillText(tag, x + bw - 40 - tw / 2, y + head / 2 + 1);

  // measure the body text, then centre it in the box
  const trPx = w.arabic.trim() ? 42 : 56;
  ctx.textBaseline = "top"; ctx.direction = "rtl";
  let arPx = 82; let ar: string[] = [];
  for (; arPx >= 46; arPx -= 4) { ctx.font = `700 ${arPx}px "Amiri", serif`; ar = wrapLines(ctx, w.arabic, bw - 120); if (ar.length <= 3) break; }
  ctx.direction = "ltr"; ctx.font = `italic ${trPx}px ${sans}`;
  const tr = wrapLines(ctx, w.text, bw - 140).slice(0, 5);
  const blockH = ar.length * arPx * 1.55 + 40 + tr.length * trPx * 1.4 + 30 + 34;
  let ty = y + head + (bh - head - blockH) / 2;

  ctx.fillStyle = C.ink; ctx.direction = "rtl"; ctx.font = `700 ${arPx}px "Amiri", serif`;
  for (const l of ar) { ctx.fillText(l, S / 2, ty); ty += arPx * 1.55; }
  ctx.direction = "ltr"; ty += 40;
  ctx.font = `italic ${trPx}px ${sans}`;
  for (const l of tr) { ctx.fillText(l, S / 2, ty); ty += trPx * 1.4; }
  ty += 30;
  ctx.fillStyle = C.green; ctx.font = `700 32px ${sans}`; ctx.fillText(w.source, S / 2, ty);

  // logo row: black "I" square + IlmStation
  const ly = y + bh + 70;
  ctx.font = `60px ${serif}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const name = "IlmStation"; const nameW = ctx.measureText(name).width;
  ctx.font = `28px ${sans}`; const urlW = ctx.measureText("· ilmstation.com").width;
  const total = 64 + 18 + nameW + 18 + urlW;
  let lx = S / 2 - total / 2;
  ctx.fillStyle = C.ink; ctx.fillRect(lx, ly - 32, 64, 64);
  ctx.fillStyle = C.bg; ctx.font = `44px ${serif}`; ctx.textAlign = "center"; ctx.fillText("I", lx + 32, ly + 2);
  lx += 64 + 18; ctx.textAlign = "left";
  ctx.fillStyle = C.ink; ctx.font = `60px ${serif}`; ctx.fillText(name, lx, ly + 2);
  lx += nameW + 18;
  ctx.fillStyle = C.muted; ctx.font = `28px ${sans}`; ctx.fillText("· ilmstation.com", lx, ly + 4);

  return new Promise((res) => c.toBlob((bl) => res(bl ? new File([bl], "daily-wisdom.png", { type: "image/png" }) : null), "image/png"));
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
  const d = new Date();
  const doy = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000);
  return pool[doy % pool.length]!;
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
      if (navigator.canShare?.({ files: [f] }) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        try { await navigator.share({ files: [f], text: "Daily Wisdom · via IlmStation · ilmstation.com" }); } catch { /* cancelled */ }
      } else {
        const url = URL.createObjectURL(f);
        const el = document.createElement("a"); el.href = url; el.download = "daily-wisdom.png"; el.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
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
export function PrayerCard() {
  const uid = useUid();
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [times, setTimes] = useState<{ name: string; at: Date }[] | null>(null);
  const [tz, setTz] = useState<string | undefined>();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(doc(db, "ramadanProgress", uid), (s) => { const c = s.get("city") as City | undefined; if (c) setCity(c); }, () => {});
  }, [uid]);
  useEffect(() => {
    let off = false;
    const d = new Date();
    const ds = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const q = city.lat != null ? `timings/${ds}?latitude=${city.lat}&longitude=${city.lng}` : `timingsByCity/${ds}?city=${encodeURIComponent(city.name)}&country=${encodeURIComponent(city.country ?? "")}`;
    fetch(`https://api.aladhan.com/v1/${q}&method=${city.method}&iso8601=true`).then((r) => r.json()).then((j) => {
      const tm = j?.data?.timings;
      if (!tm || off) return;
      setTz(j?.data?.meta?.timezone);
      setTimes(PRAYERS.map((p) => ({ name: p, at: new Date(tm[p]) })));
    }).catch(() => { if (!off) setTimes([]); });
    return () => { off = true; };
  }, [city.name, city.lat, city.lng, city.method, city.country, dayKey(now)]); // eslint-disable-line react-hooks/exhaustive-deps

  const clock = (d: Date) => { try { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz }); } catch { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } };
  const next = times?.find((t) => t.at > now);
  const left = next ? Math.max(0, Math.round((next.at.getTime() - now.getTime()) / 60000)) : 0;

  return <div>
    {!times ? <p className="text-sm text-muted-foreground">Loading…</p> : times.length === 0 ? <p className="text-sm text-muted-foreground">Couldn't load prayer times.</p> : <>
      {next && <p className="mb-3 text-sm"><b>{next.name}</b> in {Math.floor(left / 60) ? `${Math.floor(left / 60)}h ` : ""}{left % 60}m</p>}
      <ul className="grid gap-1">{times.map((t) => <li key={t.name} className={cn("flex justify-between px-2 py-1.5 text-sm", next?.name === t.name && "border-2 border-foreground bg-primary font-semibold")}>
        <span>{t.name}</span><span className="tabular-nums">{clock(t.at)}</span>
      </li>)}</ul>
    </>}
    <div className="mt-3 border-t-2 border-foreground/20 pt-3 text-sm">
      <CityPicker city={city} onPick={(c) => { setCity(c); if (uid) void setDoc(doc(db, "ramadanProgress", uid), { city: c }, { merge: true }).catch(() => {}); }} />
    </div>
  </div>;
}
