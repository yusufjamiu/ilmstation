import type { ReactNode } from "react";
import { ArrowRight, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared quiz look: question card, answer pills, feedback, progress and next button. */
export function QuizProgress({ value }: { value: number }) {
  return <div className="h-1 overflow-hidden rounded-full bg-foreground/10"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function QuizQuestion({ topic, arabic, text, children }: { topic?: string; arabic?: string; text: ReactNode; children?: ReactNode }) {
  return <div className="rounded-2xl border-[1.5px] border-foreground bg-muted p-4 shadow-[0_4px_0_var(--foreground)]">
    {topic && <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2a9cb8]/60 bg-[#e3f5fa] px-3 py-0.5 text-sm text-[#1d84a0]"><BookMarked className="size-3.5" />{topic}</span>}
    {arabic && <p dir="rtl" lang="ar" className="mt-2 text-right font-arabic text-base">{arabic}</p>}
    <h2 className="mt-2 text-[22px] font-bold leading-snug">{text}</h2>
    {children}
  </div>;
}

export type OptionState = "idle" | "picked" | "correct" | "wrong";
export function QuizOption({ letter, text, state = "idle", disabled, onClick }: { letter: string; text: ReactNode; state?: OptionState; disabled?: boolean; onClick?: () => void }) {
  const tone = state === "correct" ? "bg-[#2f7352] text-white" : state === "wrong" ? "bg-[#c94653] text-white" : state === "picked" ? "bg-primary" : "bg-background";
  return <button data-plain type="button" disabled={disabled} onClick={onClick}
    className={cn("flex w-full items-center gap-3 rounded-full border-[1.5px] border-foreground px-2 py-2 text-left font-semibold shadow-[0_3px_0_var(--foreground)] transition disabled:cursor-default", tone, !disabled && "active:translate-y-0.5")}>
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border-[1.5px] font-bold", state === "correct" || state === "wrong" ? "border-white/80" : "border-current")}>{letter}</span>
    <span className="min-w-0">{text}</span>
  </button>;
}

export function QuizFeedback({ ok, text, source }: { ok: boolean; text?: ReactNode; source?: ReactNode }) {
  return <div aria-live="polite" className={cn("rounded-xl border p-3 text-[#1c1a17]", ok ? "border-[#2f7352] bg-[#c9f2dc]" : "border-[#c94653] bg-[#fdecef]")}>
    <p className={cn("text-sm font-bold", ok ? "text-[#2f7352]" : "text-[#c94653]")}>{ok ? "Correct!" : "Incorrect"}</p>
    {text && <p className="mt-1 text-sm leading-relaxed">{text}</p>}
    {source && <p className="mt-2 font-mono text-xs">{source}</p>}
  </div>;
}

export function QuizNext({ label, onClick, disabled }: { label: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button data-plain type="button" disabled={disabled} onClick={onClick}
    className="flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-foreground bg-primary py-3.5 text-base font-extrabold uppercase shadow-[0_4px_0_var(--foreground)] transition active:translate-y-0.5 disabled:opacity-50">
    {label} <ArrowRight className="size-5" />
  </button>;
}
