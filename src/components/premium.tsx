import { useSyncExternalStore } from "react";
import { Crown, LockKeyhole, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { basePrice, DEFAULT_PREMIUM, finalPrice, isQuote, mergePremium, type Period, type PlanDef, type PremiumConfig } from "@/lib/premium-config";

export type PlanId = string;
export type Tier = "free" | "premium";
export type Member = { id: string; name: string; email: string; status: "invited" | "active" };
/** Kept for older screens; the real plans come from the admin (config.plans). */
export const plans = DEFAULT_PREMIUM.plans.map((p) => ({ ...p, price: p.price ? `₦${p.price.toLocaleString()} / ${p.period}` : "Custom pricing" }));

/** Ask the Premium server to do something. */
export async function callPremium(action: string, data: Record<string, unknown> = {}): Promise<{ ok?: boolean; error?: string; until?: number; url?: string; country?: string; paid?: number; pending?: boolean }> {
  const u = auth.currentUser;
  if (!u) return { ok: false, error: "Log in first." };
  try {
    const r = await fetch("/api/premium", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await u.getIdToken()}` }, body: JSON.stringify({ action, data }) });
    return (await r.json().catch(() => ({ ok: false, error: "Something went wrong." }))) as { ok?: boolean; error?: string; until?: number; url?: string; country?: string; paid?: number; pending?: boolean };
  } catch { return { ok: false, error: "Check your connection and try again." }; }
}

type Ent = { premiumUntil: number; plan?: string; source?: string; points: number; unlocked: string[] };
type Family = { plan?: string; kids?: number; adults?: number; members: Member[] };
type Snap = { ent: Ent; cfg: PremiumConfig; fam: Family; country: string };
const EMPTY: Ent = { premiumUntil: 0, points: 0, unlocked: [] };
const SERVER_SNAP: Snap = { ent: EMPTY, cfg: DEFAULT_PREMIUM, fam: { members: [] }, country: "" };
let snap: Snap = SERVER_SNAP;
let started = false;
const listeners = new Set<() => void>();
const emit = (p: Partial<Snap>) => { snap = { ...snap, ...p }; listeners.forEach((l) => l()); };

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  onSnapshot(doc(db, "siteConfig", "premium"), (s) => emit({ cfg: mergePremium(s.data()) }), () => {});
  let unsub: (() => void) | null = null;
  onAuthStateChanged(auth, (u) => {
    unsub?.(); unsub = null;
    emit({ ent: EMPTY });
    if (!u) return;
    unsub = onSnapshot(doc(db, "entitlements", u.uid), (s) => {
      const d = s.data() ?? {};
      emit({ ent: { premiumUntil: Math.max(Number(d.premiumUntil ?? 0), Number(d.familyUntil ?? 0)), plan: d.plan as string | undefined, source: d.source as string | undefined, points: Number(d.points ?? 0), unlocked: Array.isArray(d.unlocked) ? (d.unlocked as string[]) : [] } });
    }, () => {});
    // starts the free trial the first time, and finishes a payment left open
    void callPremium("status").then((r) => {
      if (r.country) emit({ country: r.country });
      if (r.paid) toast.success(`Payment received. Premium until ${new Date(r.paid).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`);
    });
    // just back from Paystack?
    const ref = new URLSearchParams(window.location.search).get("reference");
    if (ref) void callPremium("confirm", { reference: ref }).then((r) => {
      if (r.ok && r.until) toast.success(`Payment received. Premium until ${new Date(r.until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`);
      else if (r.pending) toast("We’re still waiting for Paystack to confirm your payment. It will show here soon.");
    });
  });
}
function subscribe(l: () => void) { start(); listeners.add(l); return () => { listeners.delete(l); }; }

/** Premium, points and settings, all from the server. */
export function usePremium() {
  const s = useSyncExternalStore(subscribe, () => snap, () => SERVER_SNAP);
  const premium = s.ent.premiumUntil > Date.now();
  const fam = s.fam;
  return {
    premium,
    premiumUntil: s.ent.premiumUntil,
    plan: s.ent.plan,
    trial: premium && s.ent.source === "trial",
    points: s.ent.points,
    unlocked: s.ent.unlocked,
    config: s.cfg,
    kids: fam.kids, adults: fam.adults, members: fam.members,
    canAccess: (id: string, tier: Tier) => tier === "free" || premium || s.ent.unlocked.includes(id),
    /** Paystack checkout comes in the next step. */
    country: s.country,
    /** Opens Paystack for the chosen plan. */
    activatePremium: (planId?: string, period?: unknown, code?: unknown) => {
      const id = planId ?? s.cfg.plans.find((p) => p.visible && !isQuote(p))?.id;
      if (!id) { toast("No plans are available right now."); return; }
      toast("Opening Paystack…");
      void callPremium("checkout", { planId: id, period: period === "year" ? "year" : "month", code: typeof code === "string" ? code : "" })
        .then((r) => { if (r.ok && r.url) window.location.href = r.url; else toast.error(r.error ?? "Couldn't start the payment."); });
    },
    cancelPremium: () => { toast("Nothing to cancel yet: Premium ends by itself on its end date."); },
    // family seats: still a preview until family plans are paid for
    inviteAdult: (name: string, email: string) => {
      const m = fam.members;
      if (m.length >= (fam.adults ?? 1) - 1) return "full" as const;
      if (m.some((x) => x.email.toLowerCase() === email.toLowerCase())) return "duplicate" as const;
      emit({ fam: { ...fam, members: [...m, { id: `m-${Date.now()}`, name, email, status: "invited" }] } }); return "ok" as const;
    },
    acceptInvite: (id: string) => emit({ fam: { ...fam, members: fam.members.map((x) => (x.id === id ? { ...x, status: "active" as const } : x)) } }),
    removeAdult: (id: string) => emit({ fam: { ...fam, members: fam.members.filter((x) => x.id !== id) } }),
    /** Points now come from the server with XP; kept so older code still runs. */
    addPoints: (_n: number) => {},
    unlockWithPoints: async (id: string, _cost?: number) => {
      const r = await callPremium("unlock", { id });
      if (!r.ok) { toast.error(r.error ?? "Couldn't unlock."); return false; }
      return true;
    },
    redeem: async (i: number) => {
      const r = await callPremium("redeem", { i });
      if (!r.ok) { toast.error(r.error ?? "Couldn't redeem."); return false; }
      return true;
    },
  };
}

export function PremiumTag({ className }: { className?: string }) {
  return <span className={`inline-flex items-center gap-1 border-2 border-foreground bg-primary px-2 py-0.5 text-[10px] font-bold uppercase ${className ?? ""}`}><Crown className="size-3" /> Premium</span>;
}

export function LockedTag({ cost }: { cost: number }) {
  return <span className="inline-flex items-center gap-1 border-2 border-foreground bg-muted px-2 py-0.5 text-[10px] font-bold uppercase"><LockKeyhole className="size-3" /> {cost ? `${cost} pts or Premium` : "Premium"}</span>;
}

/** Two ways in: Premium, or spend points on this one item. */
export function UnlockDialog({ item, onOpenChange }: { item?: { id: string; title: string; cost: number } | undefined; onOpenChange: (open: boolean) => void }) {
  const { points, unlockWithPoints, activatePremium, config } = usePremium();
  const cheapest = config.redeem.filter((o) => o.on).sort((a, b) => a.points - b.points)[0];
  return <Dialog open={!!item} onOpenChange={onOpenChange}>
    <DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none">
      <DialogHeader>
        <DialogTitle className="font-serif text-3xl">Unlock “{item?.title}”</DialogTitle>
        <DialogDescription>This is Premium. Get Premium for everything, or spend points on this one.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <div className="border-2 border-foreground bg-primary p-4 shadow-brutal-sm">
          <p className="flex items-center gap-2 font-serif text-2xl"><Crown className="size-5" /> IlmStation Premium</p>
          <p className="mt-1 text-sm">Plans in Wallet & store → Premium.{cheapest ? ` Or ${cheapest.points.toLocaleString()} points = ${cheapest.days} days.` : ""}</p>
          <Button className="mt-3 w-full" variant="secondary" onClick={() => { activatePremium(); onOpenChange(false); }}>Get Premium</Button>
        </div>
        {!!item?.cost && <div className="border-2 border-foreground p-4 shadow-brutal-sm">
          <p className="flex items-center gap-2 font-serif text-2xl"><Sparkles className="size-5" /> Use your points</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.cost} points · you have {points}.</p>
          <Button className="mt-3 w-full" variant="outline" disabled={points < item.cost} onClick={() => {
            void unlockWithPoints(item.id, item.cost).then((ok) => { if (ok) { onOpenChange(false); toast.success(`Unlocked with ${item.cost} points`); } });
          }}>{points < item.cost ? "Not enough points yet" : `Unlock for ${item.cost} points`}</Button>
        </div>}
      </div>
    </DialogContent>
  </Dialog>;
}

/** The price to show for a plan, billing period and country (with any promotion). */
export function priceFor(p: PlanDef, period: Period, country: string, cfg: PremiumConfig, code?: string) {
  const usd = cfg.usdAbroad && !!country && country !== "NG" && basePrice(p, period, true) > 0;
  const pr = finalPrice(cfg, p, period, usd, code);
  const fmt = (n: number) => (usd ? `$${n.toLocaleString()}` : `₦${n.toLocaleString()}`);
  return { available: pr.base > 0, text: fmt(pr.final), was: pr.promo ? fmt(pr.base) : undefined, promo: pr.promo, base: pr.base };
}
export function priceLabel(p: PlanDef, country: string, cfg: PremiumConfig) {
  const m = priceFor(p, "month", country, cfg);
  if (m.available) return `${m.text} / month`;
  const y = priceFor(p, "year", country, cfg);
  return y.available ? `${y.text} / year` : "Custom pricing";
}
