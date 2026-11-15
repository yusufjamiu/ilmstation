/** Premium settings. The admin changes them (siteConfig/premium); these are the defaults. */
export type PlanDef = { id: string; name: string; price: number; period: "month" | "year"; seats: string; kids: number; points: string[]; visible: boolean };
export type RedeemOpt = { points: number; days: number; on: boolean };
export type PremiumConfig = { trialDays: number; plans: PlanDef[]; redeem: RedeemOpt[]; topicCost: number; premiumTopics: string[]; cardMarkPerk: boolean };

export const QUIZ_TOPICS = ["Aqeedah", "Hadith", "Seerah", "Fiqh", "Arabic", "Qur’an", "Tafsir", "Dua"];

export const DEFAULT_PREMIUM: PremiumConfig = {
  trialDays: 7,
  plans: [
    { id: "individual", name: "Individual", price: 3500, period: "month", seats: "1 adult", kids: 0, points: ["Every Premium book, card and lesson", "All quiz topics", "Remove the IlmStation mark on cards"], visible: true },
    { id: "family2", name: "Family · 2 Kids", price: 6000, period: "month", seats: "1 adult + up to 2 kids", kids: 2, points: ["Everything in Individual", "Premium for 2 children"], visible: true },
    { id: "family5", name: "Family · 5 Kids", price: 10000, period: "month", seats: "2 adults + up to 5 kids", kids: 5, points: ["Everything in Individual", "Premium for 5 children"], visible: true },
    { id: "custom", name: "Custom", price: 0, period: "month", seats: "Schools, madrasahs, large families", kids: 99, points: ["Tailored quote from our team"], visible: true },
  ],
  redeem: [{ points: 1000, days: 3, on: true }, { points: 2000, days: 7, on: true }, { points: 7000, days: 30, on: true }],
  topicCost: 500,
  premiumTopics: ["Tafsir", "Dua"],
  cardMarkPerk: true,
};

export function mergePremium(d: unknown): PremiumConfig {
  const s = (d ?? {}) as Partial<PremiumConfig>;
  return {
    trialDays: Math.max(0, Math.min(365, Number(s.trialDays ?? DEFAULT_PREMIUM.trialDays) || 0)),
    plans: Array.isArray(s.plans) && s.plans.length ? s.plans : DEFAULT_PREMIUM.plans,
    redeem: Array.isArray(s.redeem) ? s.redeem : DEFAULT_PREMIUM.redeem,
    topicCost: Math.max(0, Number(s.topicCost ?? DEFAULT_PREMIUM.topicCost) || 0),
    premiumTopics: Array.isArray(s.premiumTopics) ? s.premiumTopics : DEFAULT_PREMIUM.premiumTopics,
    cardMarkPerk: s.cardMarkPerk ?? DEFAULT_PREMIUM.cardMarkPerk,
  };
}
