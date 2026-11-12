import { levelFor, useLevels, useMyXp } from "@/components/today";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Download, Lock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { UnlockDialog, usePremium, type Tier } from "@/components/premium";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------- occasions ---------- */
export type Occasion = { id: string; label: string; ar: string; en: string; design: number; messages: string[] };
export const OCCASIONS: Occasion[] = [
  { id: "ramadan", label: "🌙 Ramadan", ar: "رمضان كريم", en: "Ramadan Kareem", design: 8, messages: [
    "May Allah accept your fasting, prayers and good deeds this Ramadan.",
    "Wishing you a blessed Ramadan full of mercy, forgiveness and barakah.",
    "May this Ramadan bring you closer to Allah and to the Qur’an." ] },
  { id: "eid-fitr", label: "🎉 Eid al-Fitr", ar: "عيد مبارك", en: "Eid Mubarak", design: 6, messages: [
    "Taqabbal Allahu minna wa minkum. May Allah accept from us and from you.",
    "Eid Mubarak! May this Eid bring you peace, joy and barakah.",
    "Wishing you and your family a blessed Eid, full of love and mercy." ] },
  { id: "eid-adha", label: "🐑 Eid al-Adha", ar: "عيد أضحى مبارك", en: "Eid al-Adha Mubarak", design: 12, messages: [
    "Taqabbal Allahu minna wa minkum. Eid al-Adha Mubarak!",
    "May Allah accept your sacrifice and fill your home with barakah.",
    "Wishing you a blessed Eid al-Adha with family and loved ones." ] },
  { id: "jumuah", label: "🕌 Jumu’ah", ar: "جمعة مباركة", en: "Jumu’ah Mubarak", design: 7, messages: [
    "Don’t forget Surah al-Kahf and plenty of salawat on the Prophet ﷺ today.",
    "May Allah accept your duas on this blessed day.",
    "Jumu’ah Mubarak! May your week be full of barakah." ] },
  { id: "nikah", label: "💍 Nikah", ar: "بارك الله لكما", en: "Barakallahu lakuma", design: 10, messages: [
    "May Allah bless you both, shower His blessings on you, and unite you in goodness.",
    "Congratulations on your nikah! May your home be filled with love, mercy and sakinah.",
    "May Allah make your marriage a means to Jannah." ] },
  { id: "baby", label: "👶 New baby", ar: "بارك الله لك في الموهوب لك", en: "Congratulations on your baby", design: 13, messages: [
    "May Allah bless the gift He has given you, make the child righteous, and let you see them grow strong.",
    "Alhamdulillah! May your little one be a coolness of the eyes for you.",
    "Congratulations! May Allah make your child among the righteous." ] },
  { id: "hajj", label: "🕋 Hajj & Umrah", ar: "حجاً مبروراً", en: "Hajj Mabrur", design: 9, messages: [
    "May Allah accept your Hajj, forgive your sins and reward your efforts.",
    "Umrah Mabrurah! May Allah accept your worship and duas.",
    "Welcome back! May Allah accept from you and keep you steadfast." ] },
  { id: "congrats", label: "📖 Congratulations", ar: "ما شاء الله تبارك الله", en: "Congratulations", design: 6, messages: [
    "MashaAllah on completing your hifz! May the Qur’an be a light for you in this life and the next.",
    "Congratulations on your khatm! May Allah accept it from you.",
    "Congratulations on your graduation! May Allah bless your next steps." ] },
  { id: "condolence", label: "🤲 Condolence", ar: "إنا لله وإنا إليه راجعون", en: "With sincere condolences", design: 11, messages: [
    "May Allah forgive them, have mercy on them, and grant them Jannatul Firdaws.",
    "May Allah give you patience and ease your pain. You are in our duas.",
    "To Allah belongs what He took and what He gave. May Allah grant you sabr." ] },
];

/* ---------- built-in designs ---------- */
type Pattern = "stars" | "crescent" | "border" | "dots" | "geometric" | "mihrab" | "lanterns" | "floral";
type Design = { name: string; bg: [string, string]; fg: string; accent: string; pattern: Pattern; extra?: Pattern[]; font?: "ruqaa" | "amiri"; gold?: boolean; moon?: boolean };
const DESIGNS: Design[] = [
  // the original six
  { name: "Emerald", bg: ["#0f5132", "#052e1c"], fg: "#fef3c7", accent: "#fbbf24", pattern: "stars" },
  { name: "Midnight", bg: ["#1e1b4b", "#0b1026"], fg: "#fde68a", accent: "#facc15", pattern: "crescent" },
  { name: "Sand", bg: ["#f5e6c8", "#e2c792"], fg: "#3b2f1e", accent: "#b45309", pattern: "border" },
  { name: "Rose", bg: ["#fce7f3", "#f9a8d4"], fg: "#831843", accent: "#be185d", pattern: "dots" },
  { name: "Ocean", bg: ["#0c4a6e", "#082f49"], fg: "#e0f2fe", accent: "#38bdf8", pattern: "stars" },
  { name: "Ivory", bg: ["#fafaf9", "#e7e5e4"], fg: "#1c1917", accent: "#15803d", pattern: "border" },
  // upgraded designs
  { name: "Mihrab Gold", bg: ["#0b3d2e", "#03170f"], fg: "#fdf6e3", accent: "#d4af37", pattern: "mihrab", extra: ["geometric"], font: "ruqaa", gold: true },
  { name: "Geometric Night", bg: ["#111827", "#020617"], fg: "#f9fafb", accent: "#c9a227", pattern: "geometric", font: "amiri", gold: true },
  { name: "Lanterns", bg: ["#3b0764", "#140b33"], fg: "#fef9c3", accent: "#f59e0b", pattern: "lanterns", extra: ["stars"], font: "ruqaa", gold: true, moon: false },
  { name: "Royal", bg: ["#065f46", "#022c22"], fg: "#ecfdf5", accent: "#e5c158", pattern: "border", extra: ["geometric"], font: "ruqaa", gold: true },
  { name: "Blossom", bg: ["#fff1f2", "#fecdd3"], fg: "#881337", accent: "#e11d48", pattern: "floral", font: "ruqaa", moon: false },
  { name: "Serene", bg: ["#f1f5f9", "#cbd5e1"], fg: "#1e293b", accent: "#64748b", pattern: "border", font: "amiri", moon: false },
  { name: "Desert Dusk", bg: ["#7c2d12", "#2a0e05"], fg: "#fff7ed", accent: "#fdba74", pattern: "mihrab", extra: ["dots"], font: "amiri" },
  { name: "Pearl", bg: ["#f8fafc", "#dbe4ff"], fg: "#312e81", accent: "#a16207", pattern: "geometric", font: "ruqaa", gold: true },
];

/* ---------- designer cards (Admin → Card designs) ---------- */
export type CustomDesign = {
  id: string; name: string; imageUrl: string; tier: "free" | "premium"; cost?: number; minLevel?: number;
  textColor: string; accentColor: string; layout: "upper" | "middle" | "lower"; hideTitle?: boolean;
  occasions: string[]; active: boolean; createdAt?: number;
};

const W = 1080, H = 1350;
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&display=swap";
const seeded = (seed: number) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const hexA = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const isLight = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150; };

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, max: number, width: number) {
  let px = max;
  for (; px > 40; px -= 6) { ctx.font = font(px); if (ctx.measureText(text).width <= width) break; }
  ctx.font = font(px);
  return px;
}

/* ---- ornaments ---- */
function star8(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  for (const rot of [0, Math.PI / 4]) {
    ctx.beginPath();
    for (let k = 0; k < 4; k++) { const a = rot + (k * Math.PI) / 2; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath(); ctx.stroke();
  }
}
function lantern(ctx: CanvasRenderingContext2D, x: number, len: number, s: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
  const y = len;
  const g = ctx.createRadialGradient(x, y + s * 1.2, 4, x, y + s * 1.2, s * 2.6);
  g.addColorStop(0, "rgba(253,230,138,0.55)"); g.addColorStop(1, "rgba(253,230,138,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y + s * 1.2, s * 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * 0.6, y + s * 0.35); ctx.lineTo(x - s * 0.6, y + s * 0.35); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.55, y + s * 0.35); ctx.lineTo(x + s * 0.55, y + s * 0.35); ctx.lineTo(x + s * 0.72, y + s * 1.2);
  ctx.lineTo(x + s * 0.55, y + s * 2.05); ctx.lineTo(x - s * 0.55, y + s * 2.05); ctx.lineTo(x - s * 0.72, y + s * 1.2); ctx.closePath();
  ctx.fillStyle = "rgba(253,230,138,0.35)"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.lineTo(x, y + s * 2.05); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - s * 0.3, y + s * 2.05); ctx.lineTo(x + s * 0.3, y + s * 2.05); ctx.lineTo(x, y + s * 2.6); ctx.closePath(); ctx.fill();
}
function flower(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = hexA(color, 0.28);
  for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(x, y); ctx.rotate((k * Math.PI) / 3); ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 0.32, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = hexA(color, 0.7); ctx.beginPath(); ctx.arc(x, y, r * 0.18, 0, Math.PI * 2); ctx.fill();
}
function drawPattern(ctx: CanvasRenderingContext2D, p: Pattern, d: Design, rand: () => number) {
  ctx.save();
  if (p === "stars" || p === "crescent") {
    ctx.fillStyle = d.accent;
    for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.25 + rand() * 0.6; ctx.beginPath(); ctx.arc(rand() * W, rand() * H * 0.55, 1.5 + rand() * 3.5, 0, Math.PI * 2); ctx.fill(); }
  }
  if (p === "dots") {
    ctx.fillStyle = d.accent; ctx.globalAlpha = 0.12;
    for (let x = 40; x < W; x += 60) for (let y = 40; y < H; y += 60) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
  }
  if (p === "geometric") {
    ctx.strokeStyle = d.accent; ctx.globalAlpha = 0.16; ctx.lineWidth = 2;
    for (let x = 0; x <= W + 60; x += 120) for (let y = 0; y <= H + 60; y += 120) { star8(ctx, x, y, 44); ctx.beginPath(); ctx.arc(x + 60, y + 60, 6, 0, Math.PI * 2); ctx.stroke(); }
  }
  if (p === "border") {
    ctx.strokeStyle = d.accent; ctx.globalAlpha = 0.9; ctx.lineWidth = 6; ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.lineWidth = 2; ctx.strokeRect(62, 62, W - 124, H - 124);
    ctx.fillStyle = d.accent;
    for (const [x, y] of [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]] as const) {
      ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x + 22, y); ctx.lineTo(x, y + 22); ctx.lineTo(x - 22, y); ctx.closePath(); ctx.fill();
    }
  }
  if (p === "mihrab") {
    const arch = (inset: number) => {
      const l = 130 + inset, r = W - 130 - inset, base = H - 130 - inset, top = 330 + inset, spring = 600;
      ctx.beginPath(); ctx.moveTo(l, base); ctx.lineTo(l, spring);
      ctx.quadraticCurveTo(l, top + 70, W / 2, top); ctx.quadraticCurveTo(r, top + 70, r, spring); ctx.lineTo(r, base); ctx.closePath();
    };
    arch(0); ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fill();
    const gg = ctx.createLinearGradient(0, 300, 0, H);
    gg.addColorStop(0, "#fff1b8"); gg.addColorStop(0.5, d.accent); gg.addColorStop(1, "#8a6d1d");
    ctx.strokeStyle = gg; ctx.lineWidth = 9; arch(0); ctx.stroke();
    ctx.lineWidth = 2; arch(24); ctx.stroke();
  }
  if (p === "lanterns") {
    lantern(ctx, 210, 140, 46, d.accent); lantern(ctx, W / 2, 70, 58, d.accent); lantern(ctx, W - 210, 190, 42, d.accent);
  }
  if (p === "floral") {
    for (const [x, y, r] of [[90, 90, 120], [W - 90, 90, 120], [90, H - 90, 120], [W - 90, H - 90, 120], [W / 2, 180, 70], [200, 330, 50], [W - 200, 330, 50]] as const) flower(ctx, x, y, r, d.accent);
  }
  ctx.restore();
}

type Fonts = { arabic: string; serif: string; sans: string };
type Texts = { to: string; message: string; from: string };

function drawText(ctx: CanvasRenderingContext2D, t: { fg: string; accent: string; gold?: boolean; arabic: string; offset: number; hideTitle?: boolean; shadow?: boolean; mark?: boolean }, o: Occasion, f: Texts, fonts: Fonts) {
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  if (t.shadow) { ctx.shadowColor = isLight(t.fg) ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)"; ctx.shadowBlur = 14; }
  const arFont = (px: number) => `700 ${px}px ${t.arabic}`;
  const enFont = (px: number) => `600 ${px}px ${fonts.serif}`;
  const arPx = t.hideTitle ? 0 : fit(ctx, o.ar, arFont, 160, 900);
  const enPx = t.hideTitle ? 0 : fit(ctx, o.en, enFont, 62, 900);
  ctx.font = `42px ${fonts.sans}`;
  const msg = wrap(ctx, f.message.trim(), 820).slice(0, 6);
  const to = f.to.trim(), from = f.from.trim();
  // measure everything, then centre it in the space below the moon/ornaments
  const h = (t.hideTitle ? 0 : arPx * 1.25 + 16 + enPx * 1.3 + 56) + (to ? 80 : 0) + msg.length * 62 + (from ? 86 : 0);
  const top = 340, bottom = H - 150;
  let y = Math.max(top - 60, (top + bottom) / 2 - h / 2 + t.offset);
  if (!t.hideTitle) {
    if (t.gold) {
      const gg = ctx.createLinearGradient(W / 2 - 420, 0, W / 2 + 420, 0);
      gg.addColorStop(0, "#b8860b"); gg.addColorStop(0.5, "#ffe9a8"); gg.addColorStop(1, "#b8860b");
      ctx.fillStyle = gg;
    } else ctx.fillStyle = t.fg;
    ctx.font = arFont(arPx); ctx.fillText(o.ar, W / 2, y); y += arPx * 1.25 + 16;
    ctx.fillStyle = t.accent; ctx.font = enFont(enPx); ctx.fillText(o.en, W / 2, y); y += enPx * 1.3 + 56;
  }
  ctx.fillStyle = t.fg;
  if (to) { ctx.font = `600 46px ${fonts.serif}`; ctx.fillText(`Dear ${to},`, W / 2, y); y += 80; }
  ctx.font = `42px ${fonts.sans}`;
  for (const l of msg) { ctx.fillText(l, W / 2, y); y += 62; }
  if (from) { y += 36; ctx.font = `italic 46px ${fonts.serif}`; ctx.fillText(`— ${from}`, W / 2, y); }
  if (t.mark !== false) { ctx.textBaseline = "alphabetic"; ctx.globalAlpha = 0.8; ctx.font = `30px ${fonts.sans}`; ctx.fillText("Made with IlmStation · ilmstation.com", W / 2, H - 80); }
  ctx.restore();
}

function drawBuiltin(c: HTMLCanvasElement, d: Design, o: Occasion, f: Texts, fonts: Fonts, mark = true) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, d.bg[0]); bg.addColorStop(1, d.bg[1]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const rand = seeded(7);
  for (const p of [d.pattern, ...(d.extra ?? [])]) drawPattern(ctx, p, d, rand);
  if (d.moon !== false) {
    const mx = d.pattern === "crescent" ? W - 230 : W / 2, my = d.pattern === "crescent" ? 230 : 210, mr = d.pattern === "crescent" ? 130 : 95;
    ctx.fillStyle = d.accent; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(mx + mr * 0.42, my - mr * 0.18, mr * 0.88, 0, Math.PI * 2); ctx.fill();
  }
  const arabic = d.font === "ruqaa" ? `"Aref Ruqaa", ${fonts.arabic}` : d.font === "amiri" ? `"Amiri", ${fonts.arabic}` : fonts.arabic;
  drawText(ctx, { fg: d.fg, accent: d.accent, gold: d.gold, arabic, offset: 0, shadow: !!d.gold, mark }, o, f, fonts);
}

function drawCustom(c: HTMLCanvasElement, img: HTMLImageElement, cd: CustomDesign, o: Occasion, f: Texts, fonts: Fonts, preview: boolean, mark = true) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const scale = Math.max(W / img.width, H / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const offset = cd.layout === "upper" ? -150 : cd.layout === "lower" ? 200 : 0;
  drawText(ctx, { fg: cd.textColor, accent: cd.accentColor, arabic: `"Aref Ruqaa", ${fonts.arabic}`, offset, hideTitle: cd.hideTitle, shadow: true, mark }, o, f, fonts);
  if (preview) {
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 6); ctx.globalAlpha = 0.3; ctx.fillStyle = "#ffffff";
    ctx.font = `800 170px ${fonts.sans}`; ctx.textAlign = "center"; ctx.fillText("PREVIEW", 0, 0); ctx.restore();
  }
}

type Sel = { kind: "builtin"; i: number } | { kind: "custom"; id: string };

export function CardMaker({ initial = "eid-fitr", title = "Make a card" }: { initial?: string; title?: string }) {
  const { account } = useAuth();
  const { canAccess, premium } = usePremium();
  const myLevel = levelFor(useMyXp(), useLevels()).n;
  const levelOpen = (c: { minLevel?: number }) => !!c.minLevel && myLevel >= c.minLevel;
  const [showMark, setShowMark] = useState(true);
  const start = OCCASIONS.find((o) => o.id === initial) ?? OCCASIONS[1]!;
  const [occ, setOcc] = useState<Occasion>(start);
  const [sel, setSel] = useState<Sel>({ kind: "builtin", i: start.design });
  const [to, setTo] = useState("");
  const [message, setMessage] = useState(start.messages[0]!);
  const [from, setFrom] = useState("");
  const [fonts, setFonts] = useState<Fonts>({ arabic: "serif", serif: "serif", sans: "sans-serif" });
  const [fontTick, setFontTick] = useState(0);
  const [customs, setCustoms] = useState<CustomDesign[]>([]);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [unlock, setUnlock] = useState<{ id: string; title: string; cost: number }>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const probeA = useRef<HTMLSpanElement>(null);
  const probeS = useRef<HTMLSpanElement>(null);

  useEffect(() => { if (!from && account?.name) setFrom(account.name.split(/\s+/)[0] ?? ""); }, [account?.name]); // eslint-disable-line react-hooks/exhaustive-deps
  // the app's fonts, plus calligraphy fonts for the cards
  useEffect(() => {
    if (!document.querySelector(`link[href="${FONT_LINK}"]`)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = FONT_LINK; document.head.appendChild(l);
    }
    void document.fonts.ready.then(() => setFonts({
      arabic: probeA.current ? getComputedStyle(probeA.current).fontFamily : "serif",
      serif: probeS.current ? getComputedStyle(probeS.current).fontFamily : "serif",
      sans: getComputedStyle(document.body).fontFamily || "sans-serif",
    }));
    void Promise.all([document.fonts.load('700 80px "Aref Ruqaa"', "عيد"), document.fonts.load('700 80px "Amiri"', "عيد")])
      .then(() => setFontTick((t) => t + 1)).catch(() => {});
  }, []);
  useEffect(() => onSnapshot(collection(db, "cardDesigns"),
    (s) => setCustoms(s.docs.map((d) => ({ ...(d.data() as Omit<CustomDesign, "id">), id: d.id })).filter((c) => c.active).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))),
    () => {}), []);

  const forOcc = customs.filter((c) => c.occasions.includes("all") || c.occasions.includes(occ.id));
  const custom = sel.kind === "custom" ? customs.find((c) => c.id === sel.id) : undefined;
  const locked = !!custom && custom.tier === "premium" && !canAccess(`card-${custom.id}`, "premium" as Tier) && !levelOpen(custom);
  const mark = !premium || showMark;

  useEffect(() => {
    if (!custom) { setImg(null); return; }
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.onerror = () => { setImg(null); toast("Couldn't load this design."); };
    i.src = custom.imageUrl;
  }, [custom?.imageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const f = { to, message, from };
    if (sel.kind === "builtin") drawBuiltin(c, DESIGNS[sel.i] ?? DESIGNS[0]!, occ, f, fonts, mark);
    else if (custom && img) drawCustom(c, img, custom, occ, f, fonts, locked, mark);
  }, [sel, occ, to, message, from, fonts, fontTick, img, custom, locked, mark]);

  const pickOccasion = (o: Occasion) => { setOcc(o); setSel({ kind: "builtin", i: o.design }); setMessage(o.messages[0]!); };
  const askUnlock = () => { if (custom) setUnlock({ id: `card-${custom.id}`, title: custom.name, cost: custom.cost ?? 100 }); };
  const fileName = `${occ.id}-card.png`;
  const toFile = () => new Promise<File | null>((res) => canvas.current?.toBlob((b) => res(b ? new File([b], fileName, { type: "image/png" }) : null), "image/png"));
  const download = async () => {
    if (locked) { askUnlock(); return; }
    const f = await toFile();
    if (!f) return;
    const url = URL.createObjectURL(f);
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const share = async () => {
    if (locked) { askUnlock(); return; }
    const f = await toFile();
    if (f && navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f], text: `${occ.en} · Made with IlmStation · ilmstation.com` }); } catch { /* cancelled */ }
    } else { await download(); toast("Saved. Now share it from your photos."); }
  };

  const input = "h-10 w-full border-2 border-foreground bg-background px-3";
  return <section className="mt-5 min-w-0 border-2 border-foreground bg-background p-5 shadow-brutal">
    <span ref={probeA} className="hidden font-arabic" /><span ref={probeS} className="hidden font-serif" />
    <h2 className="font-serif text-2xl">{title}</h2>
    <div className="mt-3 flex flex-wrap gap-2">{OCCASIONS.map((o) => <button key={o.id} type="button" onClick={() => pickOccasion(o)}
      className={cn("border-2 border-foreground px-3 py-1.5 text-sm font-semibold", occ.id === o.id ? "bg-primary" : "bg-background hover:bg-muted")}>{o.label}</button>)}</div>

    <div className="mt-4 grid gap-5 md:grid-cols-2">
      <canvas ref={canvas} width={W} height={H} className="w-full border-2 border-foreground" aria-label="Your card preview" />
      <div className="grid content-start gap-3">
        <p className="text-xs font-bold uppercase">Designs</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{DESIGNS.map((d, i) => <button key={d.name} type="button" title={d.name} onClick={() => setSel({ kind: "builtin", i })}
          className={cn("h-12 border-2 border-foreground text-[10px] font-bold leading-tight", sel.kind === "builtin" && sel.i === i && "ring-2 ring-ring ring-offset-2")}
          style={{ background: `linear-gradient(135deg, ${d.bg[0]}, ${d.bg[1]})`, color: d.fg }}>{d.name}</button>)}</div>

        {forOcc.length > 0 && <>
          <p className="text-xs font-bold uppercase">Designer cards</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{forOcc.map((c) => { const open = c.tier === "free" || canAccess(`card-${c.id}`, "premium" as Tier) || levelOpen(c); return <button key={c.id} type="button" title={c.name} onClick={() => setSel({ kind: "custom", id: c.id })}
            className={cn("relative aspect-[4/5] overflow-hidden border-2 border-foreground bg-cover bg-center", sel.kind === "custom" && sel.id === c.id && "ring-2 ring-ring ring-offset-2")}
            style={{ backgroundImage: `url(${c.imageUrl})` }}>
            {c.tier === "premium" && <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 bg-foreground px-1 text-[10px] font-bold text-background">{open ? "👑" : <><Lock className="size-2.5" /> {c.minLevel ? `Lvl ${c.minLevel}` : "Premium"}</>}</span>}
          </button>; })}</div>
        </>}

        <input className={input} placeholder="To (optional), e.g. Mum" value={to} onChange={(e) => setTo(e.target.value)} maxLength={30} />
        <textarea className="w-full border-2 border-foreground bg-background p-3" rows={4} maxLength={220} value={message} onChange={(e) => setMessage(e.target.value)} aria-label="Your message" />
        <div className="flex flex-wrap gap-2">{occ.messages.map((m, i) => <button key={i} type="button" onClick={() => setMessage(m)} className="border border-foreground px-2 py-1 text-xs hover:bg-muted">Message {i + 1}</button>)}</div>
        <input className={input} placeholder="From (your name)" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={30} />
        {premium
          ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showMark} onChange={(e) => setShowMark(e.target.checked)} /> Show “Made with IlmStation” mark</label>
          : <p className="text-xs text-muted-foreground">👑 Premium members can remove the IlmStation mark.</p>}
        {locked
          ? <div className="border-2 border-foreground bg-primary p-3">
              <p className="text-sm font-semibold">👑 This is a Premium design.</p>
              <p className="text-xs">Go Premium to use all designer cards, or unlock this one with points.</p>
              <Button className="mt-2" onClick={askUnlock}>Unlock this design</Button>
            </div>
          : <div className="flex flex-wrap gap-2">
              <Button onClick={() => void share()}><Share2 /> Share</Button>
              <Button variant="outline" onClick={() => void download()}><Download /> Download</Button>
            </div>}
      </div>
    </div>
    <UnlockDialog item={unlock} onOpenChange={(o) => { if (!o) setUnlock(undefined); }} />
  </section>;
}

/** Used inside the Ramadan screen at the end of Ramadan. */
export function EidCardMaker() { return <CardMaker initial="eid-fitr" title="Make an Eid card" />; }

/** The Cards screen in the sidebar. */
export function CardsScreen() {
  return <div className="min-w-0 iq-rise">
    <header>
      <p className="text-xs font-semibold uppercase text-muted-foreground">Share the joy</p>
      <h1 className="font-serif text-4xl leading-none sm:text-5xl">Cards</h1>
      <p className="mt-2 text-muted-foreground">Make a beautiful card for Eid, Ramadan, a nikah, a new baby and more, then share it on WhatsApp.</p>
    </header>
    <CardMaker initial="jumuah" />
  </div>;
}
