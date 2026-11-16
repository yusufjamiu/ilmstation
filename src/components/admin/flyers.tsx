import { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import QRCode from "qrcode";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { mergePremium } from "@/lib/premium-config";
import { Button } from "@/components/ui/button";
import { Page, Panel } from "./ui";

type Spec = { tag: string; title: string; subtitle?: string; big?: string; lines: string[]; image?: string; link: string };
type Kind = "book" | "lesson" | "game" | "ramadan" | "promo" | "plans" | "winners" | "partner";
const KINDS: [Kind, string][] = [["book", "📚 Book / audio"], ["lesson", "🎓 Lesson"], ["game", "🎮 Game / quiz"], ["ramadan", "🏆 Ramadan quiz"], ["promo", "🏷️ Promotion"], ["plans", "👑 Premium plans"], ["winners", "🎉 Winners"], ["partner", "🤝 Partner"]];
const SITE = "https://www.ilmstation.com";
const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const nice = (t: number) => new Date(t).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const short = (name: string) => { const [a, b] = name.trim().split(/\s+/); return b ? `${a} ${b[0]}.` : a || "Winner"; };

function loadImg(src: string) {
  return new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

/** Draw a square IlmStation flyer. */
async function render(c: HTMLCanvasElement, s: Spec) {
  const W = 1080; c.width = W; c.height = W;
  const x = c.getContext("2d"); if (!x) return;
  const wrap = (text: string, maxW: number) => { const out: string[] = []; let line = ""; for (const w of text.split(" ")) { const t = line ? `${line} ${w}` : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; };
  const img = s.image ? await loadImg(`/api/img?u=${encodeURIComponent(s.image)}`) : null;
  const qr = await loadImg(await QRCode.toDataURL(s.link, { margin: 1, width: 380, color: { dark: "#1c1a17", light: "#f7f3ea" } }));
  x.fillStyle = "#e8c25b"; x.fillRect(0, 0, W, W);
  x.fillStyle = "#1c1a17"; x.fillRect(74, 74, W - 128, W - 128);
  x.fillStyle = "#f7f3ea"; x.fillRect(54, 54, W - 128, W - 128);
  x.lineWidth = 8; x.strokeStyle = "#1c1a17"; x.strokeRect(54, 54, W - 128, W - 128);
  x.font = "bold 32px Arial, sans-serif"; const tagW = Math.min(820, x.measureText(s.tag).width + 60);
  x.fillStyle = "#e8c25b"; x.fillRect(110, 116, tagW, 62); x.strokeRect(110, 116, tagW, 62);
  x.fillStyle = "#1c1a17"; x.textBaseline = "middle"; x.fillText(s.tag, 140, 148); x.textBaseline = "alphabetic";
  const textW = img ? 480 : 820;
  if (img) {
    const bw = 330, bh = 460, bx = W - 54 - 60 - bw, by = 220;
    const r = Math.max(bw / img.width, bh / img.height); const sw = bw / r, sh = bh / r;
    x.fillStyle = "#1c1a17"; x.fillRect(bx + 14, by + 14, bw, bh);
    x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, bx, by, bw, bh); x.strokeRect(bx, by, bw, bh);
  }
  let y = 290;
  if (s.big) { x.font = "bold 120px Georgia, serif"; for (const l of wrap(s.big, textW).slice(0, 2)) { x.fillText(l, 110, y + 40); y += 130; } y += 10; }
  x.font = "68px Georgia, serif"; for (const l of wrap(s.title, textW).slice(0, 3)) { x.fillText(l, 110, y); y += 78; }
  if (s.subtitle) { x.font = "bold 36px Arial, sans-serif"; for (const l of wrap(s.subtitle, textW).slice(0, 2)) { x.fillText(l, 110, y + 6); y += 46; } }
  y += 34; x.font = "34px Arial, sans-serif";
  for (const p of s.lines.filter(Boolean).slice(0, 6)) {
    if (y > 790) break;
    x.fillStyle = "#1c1a17"; x.fillRect(110, y - 28, 28, 28); x.fillStyle = "#e8c25b"; x.font = "bold 24px Arial"; x.fillText("✓", 114, y - 6);
    x.fillStyle = "#1c1a17"; x.font = "34px Arial, sans-serif"; const ls = wrap(p, (img && y < 700 ? textW : 820) - 50).slice(0, 2);
    ls.forEach((l, i) => x.fillText(l, 158, y + i * 42)); y += 42 * ls.length + 22;
  }
  x.fillStyle = "#1c1a17"; x.fillRect(110, 880, 76, 76); x.fillStyle = "#f7f3ea"; x.font = "54px Georgia, serif"; x.fillText("I", 137, 937);
  x.fillStyle = "#1c1a17"; x.font = "44px Georgia, serif"; x.fillText("IlmStation", 204, 918);
  x.font = "26px Arial, sans-serif"; x.fillText("Scan to open · ilmstation.com", 204, 954);
  if (qr) { x.drawImage(qr, W - 54 - 60 - 190, 790, 190, 190); x.strokeRect(W - 54 - 60 - 190, 790, 190, 190); }
}

type Item = { id: string; label: string; spec: Spec; consent?: boolean };

/** Admin → Flyers */
export function FlyersSection() {
  const [kind, setKind] = useState<Kind>("book");
  const [items, setItems] = useState<Item[]>([]);
  const [pick, setPick] = useState("");
  const [note, setNote] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stop = false; setLoading(true); setItems([]); setPick(""); setOk(false);
    const go = async (): Promise<Item[]> => {
      if (kind === "book") return (await getDocs(collection(db, "library"))).docs.map((d) => d.data()).filter((b) => b.status === "published").map((b, i) => ({
        id: String(i), label: `${b.title}${b.author ? ` · ${b.author}` : ""}`,
        spec: { tag: b.kind === "audiobook" ? "NEW AUDIOBOOK" : "NEW IN THE LIBRARY", title: String(b.title ?? ""), subtitle: b.author ? `by ${b.author}` : undefined, image: b.coverUrl || undefined,
          lines: [b.audioStatus === "available" ? "🎧 Read and listen" : "📖 Read now in the app", b.tier === "premium" ? "👑 Premium" : "Free to read", "Your place is saved as you go"], link: `${SITE}/app?s=library` } }));
      if (kind === "lesson") {
        const subs = Object.fromEntries((await getDocs(collection(db, "studySubjects"))).docs.map((d) => [d.id, String(d.get("name") ?? "")]));
        return (await getDocs(collection(db, "studyLessons"))).docs.map((d) => d.data()).filter((l) => l.status === "published").map((l, i) => ({
          id: String(i), label: `${subs[l.subjectId] ?? "Lesson"} · ${l.title}`,
          spec: { tag: "NEW LESSON", title: String(l.title ?? ""), subtitle: subs[l.subjectId] || undefined, lines: [l.mins ? `${l.mins}-minute lesson` : "Short, step-by-step lesson", l.tier === "premium" ? "👑 Premium" : "Free lesson", "Learn at your own pace in Study"], link: `${SITE}/app?s=study` } }));
      }
      if (kind === "game") return (await getDocs(collection(db, "kidGames"))).docs.map((d) => d.data()).filter((g) => g.status === "published").map((g, i) => ({
        id: String(i), label: `${g.emoji ?? "🎮"} ${g.title}`,
        spec: { tag: "NEW GAME", title: `${g.emoji ?? "🎮"} ${g.title}`, subtitle: g.audience === "all" ? "For everyone" : "For kids", lines: ["Play, learn and earn XP", g.tier === "premium" ? "👑 Premium" : "Free to play"], link: `${SITE}/app?s=${g.audience === "all" ? "games" : "kidgames"}` } }));
      if (kind === "ramadan" || kind === "winners") {
        const days = (await getDocs(collection(db, "ramadanDays"))).docs.filter((d) => d.get("opensAt")).sort((a, b) => Number(a.id) - Number(b.id));
        if (kind === "ramadan") return days.map((d) => { const v = d.data(); const sp = (v.sponsors as string[] | undefined)?.filter(Boolean) ?? []; return { id: d.id, label: `Day ${d.id} · ${v.prize || "prize"}`,
          spec: { tag: `RAMADAN · DAY ${d.id}`, big: String(v.prize || "Prizes"), title: "Daily prize quiz", lines: [`Opens ${nice(Number(v.opensAt))}`, `${v.winners ?? 3} winner${Number(v.winners) === 1 ? "" : "s"}`, sp.length ? `Sponsored by ${sp.join(", ")}` : "Answer correctly and fast to win"], link: `${SITE}/app?s=ramadan` } }; });
        const out: Item[] = [];
        for (const d of days.filter((x) => Number(x.get("resultsAt") ?? 0) <= Date.now())) {
          const w = Number(d.get("winners") ?? 3);
          const rows = (await getDocs(query(collection(db, "ramadanResults", d.id, "list"), orderBy("rankKey"), limit(w * 2)))).docs.map((r) => r.data()).filter((r) => r.correct && !r.recentWinner).slice(0, w);
          if (rows.length) out.push({ id: d.id, label: `Day ${d.id} winners (${rows.length})`, consent: true,
            spec: { tag: `RAMADAN · DAY ${d.id} WINNERS`, title: "Congratulations!", subtitle: d.get("prize") ? `Each wins ${d.get("prize")}` : undefined, lines: rows.map((r) => `🏆 ${short(String(r.name ?? ""))}`), link: `${SITE}/app?s=ramadan` } });
        }
        return out;
      }
      const cfg = mergePremium(((await getDoc(doc(db, "siteConfig", "premium"))).data() ?? {}) as never);
      if (kind === "promo") return cfg.promos.filter((p) => p.on).map((p, i) => ({ id: String(i), label: `${p.name} · ${p.percent}% off`,
        spec: { tag: "SPECIAL OFFER", big: `${p.percent}% OFF`, title: "IlmStation Premium", subtitle: p.name, lines: [`Until ${new Date(p.end).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`, "Every Premium book, audiobook, lesson and game", p.banner || ""], link: `${SITE}/app?s=rewards` } }));
      if (kind === "plans") return [{ id: "plans", label: "All visible plans",
        spec: { tag: "PREMIUM", title: "Learn more with Premium", lines: cfg.plans.filter((p) => p.visible).map((p) => [p.name, p.priceMonthly ? `${naira(p.priceMonthly)}/month` : "", p.priceYearly ? `${naira(p.priceYearly)}/year` : "", !p.priceMonthly && !p.priceYearly ? "Ask for a quote" : ""].filter(Boolean).join(" · ")).slice(0, 5), link: `${SITE}/app?s=rewards` } }];
      const ab = (await getDoc(doc(db, "siteConfig", "about"))).data() ?? {};
      return [{ id: "partner", label: "Partnership flyer", spec: { tag: "PARTNER WITH US", title: String(ab.flyerTitle || "Bring IlmStation to your community"),
        lines: (ab.flyerPoints as string[] | undefined)?.length ? (ab.flyerPoints as string[]) : ["Daily Islamic learning for kids, teens and adults", "Quizzes, library, Qur'an memorisation and lessons", "Special Premium pricing for your students", "Your name on our partners page"], link: `${SITE}/about` } }];
    };
    go().then((list) => { if (!stop) { setItems(list); setPick(list[0]?.id ?? ""); } }).catch(() => toast.error("Couldn't load items.")).finally(() => { if (!stop) setLoading(false); });
    return () => { stop = true; };
  }, [kind]);

  const item = items.find((i) => i.id === pick);
  const spec: Spec | null = item ? { ...item.spec, lines: note.trim() ? [...item.spec.lines, note.trim()] : item.spec.lines } : null;
  useEffect(() => { if (spec && canvas.current) void render(canvas.current, spec); }, [pick, note, items]); // eslint-disable-line react-hooks/exhaustive-deps

  const file = () => new Promise<File | null>((res) => { try { canvas.current?.toBlob((b) => res(b ? new File([b], `ilmstation-${kind}.png`, { type: "image/png" }) : null), "image/png"); } catch { res(null); } });
  const blocked = !!item?.consent && !ok;
  const download = async () => { const f = await file(); if (!f) { toast.error("Couldn't create the image."); return; } const u = URL.createObjectURL(f); const a = document.createElement("a"); a.href = u; a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
  const share = async () => { const f = await file(); if (!f) return; try { await navigator.share({ files: [f], text: spec?.link }); } catch { /* cancelled */ } };

  return <Page eyebrow="Website & app" title="Flyers">
    <p className="-mt-2 mb-5 max-w-3xl text-sm text-muted-foreground">Make a square flyer for WhatsApp, status and posters. Each one has a QR code that opens the right screen in IlmStation.</p>
    <div className="mb-4 flex flex-wrap gap-2">{KINDS.map(([k, l]) => <Button key={k} variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>{l}</Button>)}</div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel title="Choose" tag={loading ? "Loading…" : `${items.length} available`}>
        {!loading && !items.length ? <p className="text-sm text-muted-foreground">{kind === "winners" ? "No results are out yet." : "Nothing published here yet."}</p> : <div className="grid gap-3">
          <select className="h-10 w-full border-2 border-foreground bg-background px-2 text-sm" value={pick} onChange={(e) => setPick(e.target.value)}>{items.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select>
          <label className="text-xs font-bold uppercase">Extra line (optional)<input className="mt-1 h-10 w-full border-2 border-foreground bg-background px-3 text-sm font-normal normal-case" placeholder="e.g. Join us at the masjid this Friday" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          {item?.consent && <label className="flex items-start gap-2 border-2 border-foreground bg-muted p-3 text-sm"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-1" /> I have the winners’ permission to show their first name and initial.</label>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={!spec || blocked} onClick={() => void download()}>📥 Download</Button>
            {typeof navigator !== "undefined" && "share" in navigator && <Button variant="outline" disabled={!spec || blocked} onClick={() => void share()}>Share</Button>}
          </div>
        </div>}
      </Panel>
      <Panel title="Preview" tag="1080 × 1080">
        <canvas ref={canvas} className={`aspect-square w-full border-2 border-foreground ${blocked ? "blur-sm" : ""}`} />
      </Panel>
    </div>
  </Page>;
}
