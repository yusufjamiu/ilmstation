/* Journey views for Study:
   - KidRoad: a winding road of round lesson stops (⭐ done, 👉 next with Nuri 🌙, 🔒 ahead) and a 🏆 at the end of every level
   - LessonPath (adults): a clean vertical path with a "Continue" card, the final exam as a 🎓 stop and the certificate after it
   - StageRail (adults): the levels as one road, each with a progress bar */
import { useEffect, useRef, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type L = { id: string; title: string; mins?: number; tier?: string };
const isFinal = (t: string) => /final (exam|check)/i.test(t);
const short = (t: string) => t.replace(/\s*·.*$/, "");

/* ---------------- kids: winding road ---------------- */
const SWAY = [50, 70, 80, 70, 50, 30, 20, 30];          // x position (%) of each stop, repeating
const ROW = 118;                                      // px between stops

export function KidRoad({ lessons, isDone, nextId, isShut, isPremiumLocked, onOpen, trophy, trophyDone, footer }: {
  lessons: L[]; isDone: (id: string) => boolean; nextId?: string; isShut: (id: string) => boolean; isPremiumLocked: (l: L) => boolean;
  onOpen: (l: L) => void; trophy: string; trophyDone: boolean; footer?: ReactNode;
}) {
  const nextRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { nextRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [nextId]);
  const pts = [...lessons.map((_, i) => ({ x: SWAY[i % SWAY.length], y: 60 + i * ROW })), { x: 50, y: 60 + lessons.length * ROW }];
  const h = pts[pts.length - 1].y + 90;
  const d = pts.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `C ${pts[i - 1].x} ${pts[i - 1].y + ROW / 2}, ${p.x} ${p.y - ROW / 2}, ${p.x} ${p.y}`).join(" ");
  const doneUpTo = lessons.findIndex((l) => !isDone(l.id));
  const dDone = pts.slice(0, (doneUpTo === -1 ? pts.length : doneUpTo + 1)).map((p, i, a) => i === 0 ? `M ${p.x} ${p.y}` : `C ${a[i - 1].x} ${a[i - 1].y + ROW / 2}, ${p.x} ${p.y - ROW / 2}, ${p.x} ${p.y}`).join(" ");
  return <div className="relative mx-auto w-full max-w-md" style={{ height: h }}>
    <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="26" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {dDone && <path d={dDone} fill="none" stroke="#f5c542" strokeWidth="26" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
    </svg>
    {lessons.map((l, i) => {
      const done = isDone(l.id), next = l.id === nextId, shut = isShut(l.id), prem = isPremiumLocked(l), fin = isFinal(l.title);
      return <div key={l.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${pts[i].x}%`, top: pts[i].y }}>
        <button ref={next ? nextRef : undefined} onClick={() => onOpen(l)} aria-label={l.title}
          className={cn("relative grid place-items-center rounded-full border-[3px] border-foreground font-serif shadow-brutal transition-transform active:translate-y-0.5",
            next ? "size-[84px] bg-secondary text-4xl text-secondary-foreground" : "size-[70px] text-3xl",
            done ? "bg-primary" : !next && "bg-background", (shut || prem) && "opacity-55")}>
          {next && <span className="absolute inset-0 animate-ping rounded-full border-4 border-secondary opacity-40" />}
          {done ? (fin ? "🏆" : "⭐") : next ? <span className="animate-bounce">👉</span> : prem ? "💎" : shut ? "🔒" : fin ? "🎯" : i + 1}
          {next && <span className="absolute -right-9 -top-3 text-3xl" aria-hidden>🌙</span>}
        </button>
        <span className={cn("mt-1 max-w-[150px] truncate rounded-full border-2 border-foreground bg-background px-2 text-center text-xs font-bold", next && "bg-foreground text-background")}>{next ? "Play ▶ " : ""}{short(l.title)}</span>
      </div>;
    })}
    <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: "50%", top: pts[pts.length - 1].y }}>
      <span className={cn("grid size-[86px] place-items-center rounded-2xl border-[3px] border-foreground text-5xl shadow-brutal", trophyDone ? "bg-primary" : "bg-muted grayscale")}>🏆</span>
      <span className="mt-1 rounded-full border-2 border-foreground bg-background px-3 text-xs font-bold">{trophy}</span>
    </div>
    {footer}
  </div>;
}

/* ---------------- adults: lesson path ---------------- */
export function LessonPath({ lessons, isDone, firstOpen, canOpen, premiumLocked, onOpen, levelName, certificate }: {
  lessons: L[]; isDone: (id: string) => boolean; firstOpen: number; canOpen: (i: number) => boolean; premiumLocked: (l: L) => boolean;
  onOpen: (l: L) => void; levelName: string; certificate: "earned" | "locked";
}) {
  const doneN = lessons.filter((l) => isDone(l.id)).length;
  const cur = firstOpen >= 0 ? lessons[firstOpen] : undefined;
  return <div>
    {cur && <button onClick={() => onOpen(cur)} className="mt-3 flex w-full items-center gap-4 border-2 border-foreground bg-primary p-4 text-left shadow-brutal">
      <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-foreground bg-background font-serif text-xl">{firstOpen + 1}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase">{`${doneN ? "Continue" : "Start here"} · ${doneN} of ${lessons.length} done`}</span>
        <span className="block truncate font-serif text-xl leading-tight">{cur.title}</span></span>
      <span className="shrink-0 animate-pulse border-2 border-foreground bg-foreground px-3 py-1.5 text-sm font-bold text-background">{doneN ? "Continue ▶" : "Start ▶"}</span>
    </button>}
    <div className="mt-2 h-2 w-full border-2 border-foreground bg-background"><div className="h-full bg-secondary" style={{ width: `${(doneN / Math.max(1, lessons.length)) * 100}%` }} /></div>
    <ol className="relative mt-4 pl-11">
      <span className="absolute bottom-6 left-[18px] top-4 w-[3px] bg-foreground/15" aria-hidden />
      <span className="absolute left-[18px] top-4 w-[3px] bg-secondary" style={{ height: lessons.length ? `calc(${(doneN / lessons.length) * 100}% - 1rem)` : 0 }} aria-hidden />
      {lessons.map((l, i) => {
        const done = isDone(l.id), cur = i === firstOpen, open = canOpen(i), prem = premiumLocked(l), fin = isFinal(l.title);
        return <li key={l.id} className="relative pb-2">
          <span className={cn("absolute -left-11 top-2.5 grid place-items-center rounded-full border-2 border-foreground text-sm font-bold",
            fin ? "size-10 -left-[46px] text-lg" : "size-9", done ? "bg-secondary text-secondary-foreground" : cur ? "bg-primary" : "bg-background")}>
            {fin ? "🎓" : done ? "✓" : !open ? <Lock className="size-4" /> : i + 1}
          </span>
          <button disabled={!open} onClick={() => onOpen(l)}
            className={cn("flex w-full items-center gap-3 border-2 border-foreground p-3 text-left disabled:opacity-50",
              cur ? "bg-primary shadow-brutal" : fin ? "bg-card shadow-brutal-sm border-dashed" : "bg-card shadow-brutal-sm")}>
            <span className="min-w-0 flex-1"><span className="block font-semibold leading-tight">{l.title}</span>
              <span className="text-xs text-muted-foreground">{fin ? "Final exam · opens the next level" : `Lesson ${i + 1}${l.mins ? ` · ${l.mins} min` : ""}`}{l.tier === "premium" ? " · Premium" : ""}</span></span>
            {prem ? <span className="border-2 border-foreground px-2 text-xs font-bold">Premium</span>
              : cur ? <span className="shrink-0 border-2 border-foreground bg-foreground px-2.5 py-1 text-xs font-bold text-background">Start ▶</span>
              : done ? <span className="shrink-0 text-xs font-bold underline">Review</span> : null}
          </button>
        </li>;
      })}
      {lessons.length > 0 && <li className="relative">
        <span className={cn("absolute -left-[46px] top-1.5 grid size-10 place-items-center rounded-full border-2 border-foreground text-lg", certificate === "earned" ? "bg-primary" : "bg-muted grayscale")}>🏅</span>
        <div className={cn("border-2 border-foreground p-3", certificate === "earned" ? "bg-primary" : "bg-muted")}>
          <b className="block">{levelName} certificate</b>
          <span className="text-xs">{certificate === "earned" ? "Earned. Download it above." : "Pass the final exam to earn it."}</span>
        </div>
      </li>}
    </ol>
  </div>;
}

/* ---------------- adults: the levels as one road ---------------- */
export function StageRail({ items }: { items: { key: string; state: "done" | "open" | "locked" | "soon"; current: boolean; node: ReactNode }[] }) {
  return <ol className="relative mt-3 grid gap-3 pl-9">
    <span className="absolute bottom-6 left-[13px] top-6 w-[3px] bg-foreground/15" aria-hidden />
    {items.map((it) => <li key={it.key} className="relative">
      <span className={cn("absolute -left-9 top-5 grid size-7 place-items-center rounded-full border-2 border-foreground text-xs font-bold",
        it.state === "done" ? "bg-secondary text-secondary-foreground" : it.current ? "bg-primary" : "bg-background")}>
        {it.state === "done" ? "✓" : it.state === "locked" ? <Lock className="size-3.5" /> : it.current ? "▶" : "•"}
      </span>
      {it.node}
    </li>)}
  </ol>;
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  if (!total) return null;
  return <span className="mt-2 block">
    <span className="block h-2 w-full border-2 border-foreground bg-background"><span className="block h-full bg-secondary" style={{ width: `${(done / total) * 100}%` }} /></span>
    <span className="mt-0.5 block text-xs text-muted-foreground">{`${done} of ${total} lessons`}</span>
  </span>;
}
