/** Premium settings. The admin changes them (siteConfig/premium); these are the defaults. */
export type PlanDef = { id: string; name: string; price: number; priceUsd?: number; adults?: number; forUid?: string; priceMonthly?: number; priceYearly?: number; usdMonthly?: number; usdYearly?: number; period: "month" | "year"; seats: string; kids: number; points: string[]; visible: boolean };
export type RedeemOpt = { points: number; days: number; on: boolean };
export type PremiumConfig = { trialDays: number; plans: PlanDef[]; redeem: RedeemOpt[]; topicCost: number; premiumTopics: string[]; cardMarkPerk: boolean; usdAbroad: boolean; promos: Promo[];
  features: Record<string, { on: boolean; free: number; premium: number }>; ticks: Record<string, boolean>; unlockDays: number; pointsPerXp: number };

export const QUIZ_TOPICS = ["Aqeedah", "Hadith", "Seerah", "Fiqh", "Arabic", "Qur’an", "Tafsir", "Dua"];

export const DEFAULT_PREMIUM: PremiumConfig = {
  trialDays: 7,
  plans: [
    { id: "individual", name: "Individual", price: 3500, period: "month", seats: "1 adult", kids: 0, points: ["Every Premium book, card and lesson", "All quiz topics", "Remove the IlmStation mark on cards"], visible: true },
    { id: "child", name: "Child", price: 1500, period: "month", seats: "1 child", kids: 1, points: ["Premium for one child account", "Every Premium game, quiz and lesson", "No daily play-time limit"], visible: false },
    { id: "family2", name: "Family · 2 Kids", price: 6000, period: "month", seats: "1 adult + up to 2 kids", kids: 2, points: ["Everything in Individual", "Premium for 2 children"], visible: true },
    { id: "family5", name: "Family · 5 Kids", price: 10000, period: "month", seats: "2 adults + up to 5 kids", kids: 5, points: ["Everything in Individual", "Premium for 5 children"], visible: true },
    { id: "custom", name: "Custom", price: 0, period: "month", seats: "Schools, madrasahs, large families", kids: 99, points: ["Tailored quote from our team"], visible: true },
  ],
  redeem: [{ points: 100, days: 3, on: true }, { points: 200, days: 7, on: true }, { points: 700, days: 30, on: true }],
  topicCost: 50,
  premiumTopics: ["Tafsir", "Dua"],
  cardMarkPerk: true,
  usdAbroad: false,
  promos: [],
  features: {},
  ticks: {},
  unlockDays: 30,
  pointsPerXp: 1,
};

export function mergePremium(d: unknown): PremiumConfig {
  const s = (d ?? {}) as Partial<PremiumConfig>;
  return {
    trialDays: Math.max(0, Math.min(365, Number(s.trialDays ?? DEFAULT_PREMIUM.trialDays) || 0)),
    plans: (Array.isArray(s.plans) && s.plans.length ? s.plans : DEFAULT_PREMIUM.plans).map((p) => ({ ...p, adults: p.adults ?? (p.id === "family5" ? 2 : 1),
      priceMonthly: p.priceMonthly ?? (p.period === "year" ? 0 : p.price ?? 0), priceYearly: p.priceYearly ?? (p.period === "year" ? p.price ?? 0 : 0),
      usdMonthly: p.usdMonthly ?? (p.period === "year" ? 0 : p.priceUsd ?? 0), usdYearly: p.usdYearly ?? (p.period === "year" ? p.priceUsd ?? 0 : 0) })),
    redeem: Array.isArray(s.redeem) ? s.redeem : DEFAULT_PREMIUM.redeem,
    topicCost: Math.max(0, Number(s.topicCost ?? DEFAULT_PREMIUM.topicCost) || 0),
    premiumTopics: Array.isArray(s.premiumTopics) ? s.premiumTopics : DEFAULT_PREMIUM.premiumTopics,
    cardMarkPerk: s.cardMarkPerk ?? DEFAULT_PREMIUM.cardMarkPerk,
    usdAbroad: s.usdAbroad ?? false,
    promos: Array.isArray(s.promos) ? s.promos : [],
    features: Object.fromEntries(FEATURE_LIMITS.map((f) => [f.id, { on: f.on, free: f.free, premium: 0, ...((s.features as Record<string, object> | undefined)?.[f.id] ?? {}) }])),
    ticks: Object.fromEntries(FEATURE_TICKS.map((t) => [t.id, (s.ticks as Record<string, boolean> | undefined)?.[t.id] ?? t.on])),
    unlockDays: Number(s.unlockDays ?? 30),
    pointsPerXp: s.pointsPerXp == null ? 1 : Math.max(0, Math.min(100, Number(s.pointsPerXp) || 0)),
  };
}

export type Period = "month" | "year";
export type Promo = { id: string; name: string; percent: number; plans: string[]; periods: Period[]; start: string; end: string; code?: string; banner?: string; on: boolean };
/** Today's date in Nigeria, e.g. "2027-02-08". */
export const lagosDate = (t = Date.now()) => new Date(t + 3_600_000).toISOString().slice(0, 10);
export const isQuote = (p: PlanDef) => !(p.priceMonthly || p.priceYearly);
export function basePrice(p: PlanDef, period: Period, usd: boolean) {
  return (usd ? (period === "year" ? p.usdYearly : p.usdMonthly) : (period === "year" ? p.priceYearly : p.priceMonthly)) ?? 0;
}
/** The best promotion running today for this plan and billing period (codes must match). */
export function activePromo(cfg: PremiumConfig, planId: string, period: Period, code?: string, t = Date.now()) {
  const d = lagosDate(t); void code;
  return cfg.promos.filter((x) => x.on && x.percent > 0 && x.start <= d && d <= x.end
    && (!x.plans?.length || x.plans.includes(planId)) && (!x.periods?.length || x.periods.includes(period))).sort((a, b) => b.percent - a.percent)[0];
}
export function finalPrice(cfg: PremiumConfig, p: PlanDef, period: Period, usd: boolean, code?: string) {
  const base = basePrice(p, period, usd);
  const promo = base > 0 ? activePromo(cfg, p.id, period, code) : undefined;
  const raw = promo ? base * (100 - Math.min(90, promo.percent)) / 100 : base;
  return { base, final: usd ? Math.round(raw * 100) / 100 : Math.round(raw), promo };
}

/** Daily limits for free and Premium users (0 = unlimited). */
export const FEATURE_LIMITS = [
  { id: "ilmbot", label: "IlmBot questions", on: true, free: 5 },
  { id: "quickquiz", label: "Quick Quiz rounds", on: false, free: 5 },
  { id: "duels", label: "Live duels", on: false, free: 3 },
  { id: "halaqah", label: "Family Halaqah games (hosting)", on: true, free: 2 },
  { id: "lessons", label: "Study lessons", on: false, free: 2 },
  { id: "cards", label: "Cards created", on: false, free: 3 },
];
/** Features that are for Premium members only when ticked. */
export const FEATURE_TICKS = [
  { id: "worksheets", label: "Study worksheets (PDF download)", on: true },
  { id: "reciters", label: "Choice of reciter (Hifz and Al-Kahf)", on: false },
  { id: "report", label: "Weekly parent report email", on: false },
  { id: "badge", label: "👑 Premium badge on profile and leaderboard", on: true },
];
