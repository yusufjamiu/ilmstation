/* Certificates: one per subject per level (e.g. Qira'ah · Beginner 1), drawn in the browser and saved as a PNG.
   Earned when every lesson of that subject in that level is done (the last lesson is the level's final exam). */
import { useState } from "react";
import { Award, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { cn } from "@/lib/utils";

export type CertInfo = {
  uid: string; subject: string; subjectAr?: string; level: string; category: string;
  /** When it was earned (ms). */
  date: number; kids?: boolean;
  /** Level number in the course (Beginner 1 = 1, Beginner 2 = 2…): shown as stars. */
  stars?: number;
};

/** Each subject has its own colour on the certificate; Qira'ah keeps the IlmStation green. */
const SUBJECT_COLORS: [RegExp, string][] = [
  [/qir|read|قراء/i, "#0f6b54"], [/arab|عرب|lugh/i, "#1f4e9c"], [/hadith|حديث/i, "#8a2b2b"], [/fiqh|فقه/i, "#1d3f5e"],
  [/seer|sira|سير/i, "#5b2d8a"], [/aqid|aqee|tawh|عقيد|توحيد/i, "#7a4b12"], [/tajw|تجويد/i, "#0d6e7a"], [/hifz|qur|حفظ|قرآن/i, "#2e6b1f"],
];
const PALETTE = ["#0f6b54", "#1f4e9c", "#8a2b2b", "#5b2d8a", "#7a4b12", "#0d6e7a", "#9c3d6b", "#3d5a1f"];
export function subjectColor(name: string) {
  const hit = SUBJECT_COLORS.find(([re]) => re.test(name));
  if (hit) return hit[1];
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Short, stable certificate number: same learner + subject + level → same number. */
export function certNumber(c: Pick<CertInfo, "uid" | "subject" | "level">) {
  let h = 2166136261;
  for (const ch of `${c.uid}|${c.subject}|${c.level}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return `ILM-${(h >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
}

const AR = "'Amiri','Noto Naskh Arabic','Geeza Pro','Arial',serif";
const SERIF = "'Georgia','Times New Roman',serif";
const SANS = "'Helvetica Neue','Arial',sans-serif";

function draw(c: CertInfo, name: string): HTMLCanvasElement {
  const W = 2000, H = 1414, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!;
  const ink = "#1c1a17", gold = c.kids ? "#ff9f43" : "#b8892c", green = c.kids ? "#22b573" : subjectColor(c.subject);
  // paper
  g.fillStyle = c.kids ? "#fffaf0" : "#fbf7ee"; g.fillRect(0, 0, W, H);
  if (c.kids) { // confetti dots
    const cols = ["#ff6fa8", "#ffd23f", "#3ddc97", "#8a5cff", "#4aa8ff"];
    for (let i = 0; i < 400; i++) { const x = (i * 377) % W, y = (i * 613) % H;
      if (x > 130 && x < W - 130 && y > 130 && y < H - 130) continue;     // only around the edges, never over the text
      g.fillStyle = cols[i % cols.length]; g.globalAlpha = .55; g.beginPath(); g.arc(x, y, 6 + (i % 5) * 3, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  if (!c.kids) { g.fillStyle = green; g.fillRect(50, 50, W - 100, 22); g.fillRect(50, H - 72, W - 100, 22); }
  // frame
  g.strokeStyle = ink; g.lineWidth = 10; g.strokeRect(50, 50, W - 100, H - 100);
  g.strokeStyle = gold; g.lineWidth = 4; g.strokeRect(80, 80, W - 160, H - 160);
  g.lineWidth = 2; g.strokeRect(96, 96, W - 192, H - 192);
  // corner ornaments
  g.fillStyle = gold; for (const [x, y] of [[96, 96], [W - 96, 96], [96, H - 96], [W - 96, H - 96]]) { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-16, -16, 32, 32); g.restore(); }

  const center = (t: string, y: number, font: string, color = ink, rtl = false) => {
    g.font = font; g.fillStyle = color; g.textAlign = "center"; g.direction = rtl ? "rtl" : "ltr"; g.fillText(t, W / 2, y);
  };
  // brand
  g.fillStyle = ink; g.fillRect(W / 2 - 42, 150, 84, 84);
  center("I", 222, `700 64px ${SERIF}`, "#fbf7ee");
  center("IlmStation", 290, `700 44px ${SERIF}`);
  center(c.kids ? "⭐  CERTIFICATE OF ACHIEVEMENT  ⭐" : "CERTIFICATE OF COMPLETION", 400, `700 ${c.kids ? 64 : 72}px ${SERIF}`, green);
  center(c.kids ? "شَهَادَةُ تَفَوُّقٍ" : "شَهَادَةُ إِتْمَامٍ", 480, `700 56px ${AR}`, gold, true);
  center("This certifies that", 580, `400 38px ${SANS}`, "#6c6a64");
  // name (shrink to fit)
  let size = 110; g.font = `700 ${size}px ${SERIF}`;
  while (g.measureText(name).width > W - 500 && size > 50) { size -= 4; g.font = `700 ${size}px ${SERIF}`; }
  center(name, 710, `700 ${size}px ${SERIF}`);
  g.strokeStyle = gold; g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2 - 520, 745); g.lineTo(W / 2 + 520, 745); g.stroke();
  center(c.kids ? "has finished, with excellence," : "has successfully completed", 820, `400 38px ${SANS}`, "#6c6a64");
  center(`${c.subject} · ${c.level}`, 920, `700 76px ${SERIF}`, green);
  if (c.subjectAr) center(c.subjectAr, 985, `700 48px ${AR}`, ink, true);
  if (c.stars && c.stars > 0) {                       // one star per level: Beginner 1 ★, Beginner 2 ★★ …
    const n = Math.min(c.stars, 10), gap = 54, x0 = W / 2 - ((n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) star(g, x0 + i * gap, 1030, 22, gold);
  }
  center(`${c.category} · IlmStation Study`, 1088, `400 32px ${SANS}`, "#6c6a64");
  // footer: date · seal · number
  const d = new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  g.font = `400 30px ${SANS}`; g.fillStyle = ink; g.textAlign = "center"; g.direction = "ltr";
  g.fillText(d, 470, 1215); g.fillText(certNumber(c), W - 470, 1215);
  g.strokeStyle = ink; g.lineWidth = 2;
  for (const x of [470, W - 470]) { g.beginPath(); g.moveTo(x - 200, 1170); g.lineTo(x + 200, 1170); g.stroke(); }
  g.font = `700 22px ${SANS}`; g.fillStyle = "#6c6a64"; g.fillText("DATE", 470, 1255); g.fillText("CERTIFICATE NO.", W - 470, 1255);
  // seal
  g.save(); g.translate(W / 2, 1222); g.scale(.78, .78);
  g.fillStyle = gold; g.beginPath(); for (let i = 0; i < 48; i++) { const r = i % 2 ? 98 : 112, a = (i / 48) * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
  g.fillStyle = "#fbf7ee"; g.beginPath(); g.arc(0, 0, 80, 0, 7); g.fill();
  g.fillStyle = gold; g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill();
  g.font = `700 52px ${AR}`; g.fillStyle = "#fbf7ee"; g.textAlign = "center"; g.direction = "rtl"; g.fillText("عِلْم", 0, 16);
  g.restore();
  return cv;
}

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  g.save(); g.translate(x, y); g.fillStyle = color; g.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, a = -Math.PI / 2 + (i * Math.PI) / 5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.restore();
}

async function toBlob(cv: HTMLCanvasElement) {
  return new Promise<Blob>((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("no image"))), "image/png"));
}

/** A card with the certificate and Download / Share buttons. */
export function CertificateCard({ info, className }: { info: CertInfo; className?: string }) {
  const { account } = useAuth();
  const [busy, setBusy] = useState(false);
  const name = (account?.name || account?.username || "Learner").trim();
  const file = `IlmStation-${info.subject}-${info.level}`.replace(/[^\w-]+/g, "-") + ".png";
  async function save(share: boolean) {
    setBusy(true);
    try {
      await document.fonts?.ready;
      const blob = await toBlob(draw(info, name));
      const f = new File([blob], file, { type: "image/png" });
      if (share && navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: "My IlmStation certificate" }); return; }
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = file; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success("Certificate saved");
    } catch (e) { if ((e as Error)?.name !== "AbortError") toast.error("Couldn't make the certificate. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className={cn("flex flex-wrap items-center gap-4 border-2 border-foreground bg-primary p-5 shadow-brutal", className)}>
    <Award className="size-10 shrink-0" />
    <div className="min-w-0 flex-1">
      <h2 className="font-serif text-2xl leading-tight">{info.kids ? "You earned a certificate! ⭐" : "Certificate earned"}</h2>
      <p className="text-sm">{info.subject} · {info.level} {info.stars ? <span className="tracking-tight">{"★".repeat(Math.min(info.stars, 10))}</span> : null} · {certNumber(info)}</p>
    </div>
    <div className="flex gap-2">
      <Button disabled={busy} onClick={() => save(false)}><Download /> Download</Button>
      {typeof navigator !== "undefined" && "share" in navigator && <Button variant="outline" disabled={busy} onClick={() => save(true)}><Share2 /> Share</Button>}
    </div>
  </div>;
}
