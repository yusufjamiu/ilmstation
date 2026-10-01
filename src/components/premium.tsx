import { useSyncExternalStore } from "react";
import { Crown, LockKeyhole, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const KEY = "iq_premium";

export type PlanId = "individual" | "family2" | "family5" | "custom";
export type PremiumState = { premium: boolean; points: number; unlocked: string[]; plan?: PlanId | undefined; kids?: number | undefined; adults?: number | undefined; members?: Member[] | undefined };
export type Member = { id: string; name: string; email: string; status: "invited" | "active" };
const initial: PremiumState = { premium: false, points: 1280, unlocked: [] };

export const plans: { id: PlanId; name: string; price: string; seats: string; kids: number; points: string[] }[] = [
  { id: "individual", name: "Individual", price: "₦3,500 / month", seats: "1 adult", kids: 0, points: ["Primary account holder", "Every Premium reading and topic", "Unlimited IlmBot"] },
  { id: "family2", name: "Family · 2 Kids", price: "₦6,000 / month", seats: "1 adult + up to 2 kids", kids: 2, points: ["Everything in Individual", "Premium Kids Mode for 2 children", "IlmBot Junior for each child"] },
  { id: "family5", name: "Family · 5 Kids", price: "₦10,000 / month", seats: "2 adults + up to 5 kids", kids: 5, points: ["Everything in Individual", "Premium Kids Mode for 5 children", "Family progress reports"] },
  { id: "custom", name: "Custom", price: "Custom pricing", seats: "Adults grow with the kids", kids: 99, points: ["Schools, madrasahs, large families", "Roughly 1 adult seat per 3 kids", "Tailored quote from our team"] },
];

let state: PremiumState = initial;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  if (!hydrated) {
    hydrated = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { state = { ...initial, ...(JSON.parse(raw) as Partial<PremiumState>) }; }
    } catch { /* ignore */ }
  }
  listeners.add(l);
  return () => { listeners.delete(l); };
}

const getSnapshot = () => state;
const getServerSnapshot = () => initial;

/** Demo premium + points wallet, kept in the browser only. */
export function usePremium() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...s,
    /** True when the item is readable: premium subscription or already unlocked with points. */
    canAccess: (id: string, tier: Tier) => tier === "free" || s.premium || s.unlocked.includes(id),
    activatePremium: (plan: PlanId = "individual", kids?: number, adults?: number) => {
      const seats = adults ?? (plan === "family5" ? 2 : 1);
      const members = (state.members ?? []).slice(0, Math.max(0, seats - 1));
      state = { ...state, premium: true, plan, kids: kids ?? plans.find((p) => p.id === plan)?.kids ?? 0, adults: seats, members }; persist();
    },
    cancelPremium: () => { state = { ...state, premium: false, plan: undefined, kids: undefined, adults: undefined, members: [] }; persist(); },
    inviteAdult: (name: string, email: string) => {
      const m = state.members ?? [];
      if (m.length >= (state.adults ?? 1) - 1) return "full" as const;
      if (m.some((x) => x.email.toLowerCase() === email.toLowerCase())) return "duplicate" as const;
      state = { ...state, members: [...m, { id: `m-${Date.now()}`, name, email, status: "invited" }] }; persist(); return "ok" as const;
    },
    acceptInvite: (id: string) => { state = { ...state, members: (state.members ?? []).map((x) => x.id === id ? { ...x, status: "active" as const } : x) }; persist(); },
    removeAdult: (id: string) => { state = { ...state, members: (state.members ?? []).filter((x) => x.id !== id) }; persist(); },
    addPoints: (n: number) => { state = { ...state, points: state.points + n }; persist(); },
    unlockWithPoints: (id: string, cost: number) => {
      if (state.points < cost) return false;
      state = { ...state, points: state.points - cost, unlocked: [...state.unlocked, id] };
      persist();
      return true;
    },
  };
}

export type Tier = "free" | "premium";

export function PremiumTag({ className }: { className?: string }) {
  return <span className={`inline-flex items-center gap-1 border-2 border-foreground bg-primary px-2 py-0.5 text-[10px] font-bold uppercase ${className ?? ""}`}><Crown className="size-3" /> Premium</span>;
}

export function LockedTag({ cost }: { cost: number }) {
  return <span className="inline-flex items-center gap-1 border-2 border-foreground bg-muted px-2 py-0.5 text-[10px] font-bold uppercase"><LockKeyhole className="size-3" /> {cost} pts or Premium</span>;
}

/** Dialog offering the two ways in: subscribe, or spend points on this one item. */
export function UnlockDialog({ item, onOpenChange }: { item?: { id: string; title: string; cost: number } | undefined; onOpenChange: (open: boolean) => void }) {
  const { points, unlockWithPoints, activatePremium } = usePremium();
  return <Dialog open={!!item} onOpenChange={onOpenChange}>
    <DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none">
      <DialogHeader>
        <DialogTitle className="font-serif text-3xl">Unlock “{item?.title}”</DialogTitle>
        <DialogDescription>This is a Premium reading. Subscribe for everything, or spend points on this one.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <div className="border-2 border-foreground bg-primary p-4 shadow-brutal-sm">
          <p className="flex items-center gap-2 font-serif text-2xl"><Crown className="size-5" /> IlmStation Premium</p>
          <p className="mt-1 text-sm">From ₦3,500 / month · Individual or Family plans in Rewards → Premium.</p>
          <Button className="mt-3 w-full" variant="secondary" onClick={() => { activatePremium("individual"); onOpenChange(false); toast.success("Individual Premium active — everything is unlocked (demo)"); }}>Start Premium</Button>
        </div>
        <div className="border-2 border-foreground p-4 shadow-brutal-sm">
          <p className="flex items-center gap-2 font-serif text-2xl"><Sparkles className="size-5" /> Use your points</p>
          <p className="mt-1 text-sm text-muted-foreground">{item?.cost} points · you have {points}.</p>
          <Button className="mt-3 w-full" variant="outline" disabled={!item || points < item.cost} onClick={() => {
            if (!item) return;
            if (unlockWithPoints(item.id, item.cost)) { onOpenChange(false); toast.success(`Unlocked with ${item.cost} points`); }
            else toast.error("Not enough points yet");
          }}>{item && points < item.cost ? "Not enough points" : `Unlock for ${item?.cost} points`}</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
