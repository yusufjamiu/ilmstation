import { createLink, Link } from "@tanstack/react-router";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";


/* ── Button ─────────────────────────────────────────────────────────── */
type BtnVariant = "primary" | "green" | "outline" | "ghost" | "danger" | "ink";
type BtnSize = "sm" | "md" | "lg";

const variantClass: Record<BtnVariant, string> = {
  primary: "bg-yellow text-ink hover:bg-yellow-d",
  green: "bg-green text-surface hover:brightness-95",
  outline: "bg-surface text-ink hover:bg-field",
  ghost: "bg-transparent border-transparent shadow-none text-ink2 hover:text-ink hover:bg-field",
  danger: "bg-pink text-ink hover:brightness-105",
  ink: "bg-ink text-page hover:opacity-90",
};

const sizeClass: Record<BtnSize, string> = {
  sm: "text-[13px] px-3 py-2 rounded-r8",
  md: "text-[14px] px-4 py-2.5 rounded-r8",
  lg: "text-[16px] px-5 py-3.5 rounded-r12",
};

export function btnClass(variant: BtnVariant = "primary", size: BtnSize = "md", full = false) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-bold select-none",
    "brutal-sm press-sm disabled:opacity-45 disabled:pointer-events-none min-h-11",
    variantClass[variant],
    sizeClass[size],
    full && "w-full",
  );
}

export function Btn({
  variant = "primary",
  size = "md",
  full,
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: BtnVariant; size?: BtnSize; full?: boolean }) {
  return <button className={cn(btnClass(variant, size, full), className)} {...rest} />;
}

/**
 * Button-styled router link. Built with createLink so `to`, `params` and
 * `search` keep full type inference from the generated route tree.
 */
const StyledAnchor = forwardRef<
  HTMLAnchorElement,
  ComponentProps<"a"> & { variant?: BtnVariant; size?: BtnSize; full?: boolean }
>(({ variant = "primary", size = "md", full, className, ...rest }, ref) => (
  <a ref={ref} className={cn(btnClass(variant, size, full), className)} {...rest} />
));
StyledAnchor.displayName = "StyledAnchor";

export const BtnLink = createLink(StyledAnchor);


/* ── Surfaces ───────────────────────────────────────────────────────── */
export function Card({
  className,
  children,
  tone,
  ...rest
}: ComponentProps<"div"> & { tone?: "surface" | "yellow" | "green" | "pink" | "field" | "ink" }) {
  const tones = {
    surface: "bg-surface",
    yellow: "bg-yellow text-ink",
    green: "bg-green-l",
    pink: "bg-pink-l",
    field: "bg-field",
    ink: "bg-ink text-page",
  };
  return (
    <div className={cn("brutal-flat rounded-r16 p-5", tones[tone ?? "surface"], className)} {...rest}>
      {children}
    </div>
  );
}

export function Pill({
  className,
  children,
  tone = "field",
}: {
  className?: string;
  children: ReactNode;
  tone?: "field" | "yellow" | "green" | "pink" | "ink" | "surface";
}) {
  const tones = {
    field: "bg-field text-ink2",
    yellow: "bg-yellow text-ink",
    green: "bg-green text-surface",
    pink: "bg-pink text-ink",
    ink: "bg-ink text-page",
    surface: "bg-surface text-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-rf border border-border/30 px-2.5 py-1 text-[10px] font-bold uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <h2 className="text-[19px] font-black">{children}</h2>
      {action}
    </div>
  );
}

/* ── Progress ───────────────────────────────────────────────────────── */
export function Bar({
  value,
  className,
  tone = "green",
  label,
}: {
  value: number;
  className?: string;
  tone?: "green" | "yellow" | "ink" | "pink";
  label?: string;
}) {
  const tones = { green: "bg-green", yellow: "bg-yellow", ink: "bg-ink", pink: "bg-pink" };

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-rf bg-field", className)}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <div
        className={cn("h-full transition-[width] duration-500", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

export function Ring({ value, size = 44, label }: { value: number; size?: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className="brutal-flat relative grid shrink-0 place-items-center rounded-rf bg-field"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--green) ${pct * 3.6}deg, var(--field) 0deg)`,
      }}
      role="img"
      aria-label={label ? `${label}: ${pct}%` : `${pct}%`}
    >
      <span className="mono grid place-items-center rounded-rf bg-surface text-[10px] font-bold" style={{ width: size - 14, height: size - 14 }}>
        {pct}
      </span>
    </div>
  );
}

/* ── Text ───────────────────────────────────────────────────────────── */
export function Arabic({
  children,
  className,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-[15px]",
    md: "text-[18px]",
    lg: "text-[22px]",
    xl: "text-[32px]",
  };
  return (
    <p lang="ar" dir="rtl" className={cn("arabic", sizes[size], className)}>
      {children}
    </p>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("mono", className)}>{children}</span>;
}

export function Avatar({
  emoji,
  size = 44,
  ring,
}: {
  emoji: string;
  size?: number;
  ring?: "yellow" | "green" | "none";
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-r12 border border-border/25",
        ring === "yellow" ? "bg-yellow" : ring === "green" ? "bg-green-l" : "bg-field",
      )}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

export function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  icon?: string;
  tone?: "surface" | "yellow" | "green" | "field";
}) {
  const tones = {
    surface: "bg-surface",
    yellow: "bg-yellow",
    green: "bg-green-l",
    field: "bg-field",
  };
  return (
    <div className={cn("rounded-r12 border border-border/20 p-3 text-center", tones[tone ?? "surface"])}>
      <div className="mono text-[20px] leading-tight font-bold">
        {icon ? <span className="mr-1">{icon}</span> : null}
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-bold tracking-wide text-ink2 uppercase">{label}</div>
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  children,
  title,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "brutal anim-rise relative max-h-[92vh] w-full overflow-y-auto rounded-t-r24 bg-surface p-6 sm:rounded-r24",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        {title ? (
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-[24px] font-black">{title}</h2>
            <Btn variant="outline" size="sm" onClick={onClose} aria-label="Close dialog">
              ✕
            </Btn>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/* ── Form fields ────────────────────────────────────────────────────── */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[13px] font-bold text-ink2">⚠ {error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[13px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-r8 border border-border/35 bg-surface px-3.5 py-3 text-[15px] font-semibold",
        "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-yellow",
        className,
      )}
      {...rest}
    />
  );
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "brutal-sm press-sm h-7 w-13 shrink-0 rounded-rf p-0.5",
        on ? "bg-green" : "bg-field",
      )}
    >
      <span
        className={cn(
          "brutal-flat block h-5.5 w-5.5 rounded-rf bg-surface transition-transform",
          on && "translate-x-6",
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 rounded-r12 bg-field p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-9 flex-1 rounded-r8 px-2 py-1.5 text-[13px] font-extrabold transition-colors",
             value === o.value ? "border border-border/30 bg-surface text-ink" : "text-ink2 hover:bg-surface",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-r16 border border-border/25 bg-field px-6 py-12 text-center">
      <div className="text-[44px]" aria-hidden>
        {icon}
      </div>
      <h3 className="mt-2 text-[18px] font-black">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-[15px] text-ink2">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Confetti({ count = 26 }: { count?: number }) {
  const colors = ["var(--yellow)", "var(--green)", "var(--pink)", "var(--ink)"];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="brutal-flat absolute top-0 block h-3 w-3"
          style={{
            left: `${(i * 97) % 100}%`,
            background: colors[i % colors.length],
            animation: `iq-confetti ${1.6 + (i % 5) * 0.35}s linear ${(i % 7) * 0.12}s 1 both`,
          }}
        />
      ))}
    </div>
  );
}
