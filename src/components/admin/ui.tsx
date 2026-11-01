import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { seedAdmins, seedAudit, type Admin, type AuditEntry } from "./data";
import { uid, useAdminStore } from "./store";

export function Page({ eyebrow, title, actions, children }: { eyebrow: string; title: string; actions?: ReactNode; children: ReactNode }) {
  return <section className="iq-rise">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-5">
      <div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">{eyebrow}</p><h1 className="font-serif text-4xl leading-none sm:text-5xl">{title}</h1></div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    {children}
  </section>;
}

export function Panel({ title, tag, actions, className, children }: { title: string; tag?: string | undefined; actions?: ReactNode; className?: string; children: ReactNode }) {
  return <div className={cn("min-w-0 border-2 border-foreground bg-card shadow-brutal-sm", className)}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground px-4 py-3">
      <h2 className="text-sm font-bold uppercase">{title}</h2>
      <div className="flex items-center gap-2">{tag && <span className="text-xs text-muted-foreground">{tag}</span>}{actions}</div>
    </div>
    <div className="p-4">{children}</div>
  </div>;
}

export function Kpi({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "primary" | "secondary" }) {
  // Muted text is unreadable on the dark secondary fill, so that tone uses its own foreground.
  const sub = tone === "secondary" ? "text-secondary-foreground/80" : "text-muted-foreground";
  return <div className={cn("min-w-0 border-2 border-foreground p-4 shadow-brutal-sm", tone === "primary" ? "bg-primary" : tone === "secondary" ? "bg-secondary text-secondary-foreground" : "bg-card")}>
    <p className={cn("text-xs font-bold uppercase", sub)}>{label}</p>
    <p className="mt-2 font-serif text-4xl leading-none tabular-nums">{value}</p>
    {note && <p className={cn("mt-2 text-xs", sub)}>{note}</p>}
  </div>;
}

const pillTone: Record<string, string> = {
  active: "bg-secondary", published: "bg-secondary", confirmed: "bg-secondary", paid: "bg-secondary", live: "bg-secondary", kept: "bg-secondary", approved: "bg-secondary",
  suspended: "bg-destructive text-destructive-foreground", cancelled: "bg-destructive text-destructive-foreground", failed: "bg-destructive text-destructive-foreground", removed: "bg-destructive text-destructive-foreground", declined: "bg-destructive text-destructive-foreground",
  new: "bg-primary", open: "bg-primary", pending: "bg-primary", invited: "bg-primary", contacted: "bg-primary",
};
export function Pill({ value, className }: { value: string; className?: string }) {
  return <span className={cn("inline-block whitespace-nowrap border-2 border-foreground px-2 py-0.5 text-[11px] font-bold uppercase", pillTone[value] ?? "bg-muted", className)}>{value}</span>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2 border-2 border-foreground bg-background px-3 sm:max-w-sm">
    <Search className="size-4 shrink-0" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
  </label>;
}

export function Choice<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[]; label: string; className?: string }) {
  return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)} className={cn("min-h-10 border-2 border-foreground bg-background px-2 text-sm", className)}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>;
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn("grid min-w-0 gap-1 text-sm", className)}><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span>{children}</label>;
}
export const inputCls = "min-h-10 w-full border-2 border-foreground bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type Column<T> = { key: string; label: string; render: (row: T) => ReactNode; className?: string; mobile?: boolean };

/** Table on wide screens, stacked cards on phones. */
export function DataTable<T extends { id: string }>({ rows, columns, actions, empty = "Nothing here yet." }: { rows: T[]; columns: Column<T>[]; actions?: ((row: T) => ReactNode) | undefined; empty?: string }) {
  if (!rows.length) return <p className="border-2 border-dashed border-foreground p-8 text-center text-sm text-muted-foreground">{empty}</p>;
  return <>
    <div className="hidden overflow-x-auto border-2 border-foreground md:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b-2 border-foreground bg-muted"><tr>{columns.map((c) => <th key={c.key} className={cn("px-3 py-2 text-xs font-bold uppercase", c.className)}>{c.label}</th>)}{actions && <th className="px-3 py-2"><span className="sr-only">Actions</span></th>}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-foreground/30 last:border-0 hover:bg-muted/50">
          {columns.map((c) => <td key={c.key} className={cn("px-3 py-2 align-middle", c.className)}>{c.render(r)}</td>)}
          {actions && <td className="px-3 py-2 text-right"><div className="flex justify-end gap-1">{actions(r)}</div></td>}
        </tr>)}</tbody>
      </table>
    </div>
    <div className="grid gap-3 md:hidden">{rows.map((r) => <div key={r.id} className="border-2 border-foreground bg-card p-3 shadow-brutal-sm">
      <dl className="grid gap-1.5 text-sm">{columns.filter((c) => c.mobile !== false).map((c) => <div key={c.key} className="flex items-start justify-between gap-3"><dt className="shrink-0 text-xs font-bold uppercase text-muted-foreground">{c.label}</dt><dd className="min-w-0 text-right">{c.render(r)}</dd></div>)}</dl>
      {actions && <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-foreground/30 pt-3">{actions(r)}</div>}
    </div>)}</div>
  </>;
}

export function Confirm({ open, title, body, confirm = "Confirm", destructive, onConfirm, onOpenChange }: { open: boolean; title: string; body: string; confirm?: string; destructive?: boolean; onConfirm: () => void; onOpenChange: (o: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{body}</DialogDescription></DialogHeader>
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant={destructive ? "destructive" : "default"} onClick={() => { onConfirm(); onOpenChange(false); }}>{confirm}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

/** Small helper for "are you sure?" flows: ask(...) opens, <dialog/> renders. */
export function useConfirm() {
  const [state, setState] = useState<{ title: string; body: string; confirm?: string; destructive?: boolean; run: () => void } | null>(null);
  const dialog = <Confirm open={!!state} title={state?.title ?? ""} body={state?.body ?? ""} {...(state?.confirm ? { confirm: state.confirm } : {})} {...(state?.destructive ? { destructive: true } : {})} onConfirm={() => state?.run()} onOpenChange={(o) => { if (!o) setState(null); }} />;
  return { ask: setState, dialog };
}

export function useAudit() {
  const [log, setLog] = useAdminStore<AuditEntry[]>("audit", seedAudit);
  const [session] = useAdminStore<{ id: string; name: string } | null>("session", null);
  const [admins] = useAdminStore<Admin[]>("admins", seedAdmins);
  const record = (action: string) => {
    const d = new Date();
    const at = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setLog((l) => [{ id: uid(), at, actor: admins.find((a) => a.id === session?.id)?.name ?? session?.name ?? "Admin", action }, ...l].slice(0, 100));
  };
  return { log, record };
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange}
    className={cn("h-8 w-14 shrink-0 border-2 border-foreground p-0.5 shadow-brutal-sm", on ? "bg-secondary" : "bg-muted")}>
    <span className={cn("block size-6 border-2 border-foreground bg-background transition-transform", on && "translate-x-6")} />
  </button>;
}
