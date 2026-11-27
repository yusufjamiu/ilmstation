/* What houses, land and shops cost, shared by the game and the server (which charges the
   wallet). Amounts are in ₦10 units, like the wallet. */
import { ECONOMY, HOUSE_PRICE, PRICE_X, SHOP_PRICES, districtById } from "./content";

export const TIER_RENT: Record<number, number> = { 1: 2, 2: 1.4, 3: 1, 4: 0.8 };
export const FLOOR_RENT: Record<number, number> = { 1: 1, 2: 1.5, 3: 2 };
export const r10 = (n: number) => Math.max(10, Math.round(n / 10) * 10);
/** A glass tower costs a fortune: you buy the whole tower and let its flats. */
export const TOWER_PRICE = 60000;

/** A house's rent and price. `demand` is how full the area is (0 to 1): up to half again. */
export function housePrice(area: string, floors: number, type?: string, demand0 = 0) {
  const t = districtById(area).tier ?? 2;
  // a face-me-I-face-you house is the cheapest home there is
  const kindX = type === "faceme" ? 0.6 : 1;
  const demand = 1 + 0.5 * Math.min(1, demand0);
  const base = r10(
    150 *
      PRICE_X.rent *
      (TIER_RENT[t] ?? 1) *
      (FLOOR_RENT[Math.min(3, Math.max(1, floors))] ?? 1) *
      demand *
      kindX,
  );
  const buy = r10(
    (type === "tower"
      ? TOWER_PRICE
      : (HOUSE_PRICE[Math.min(3, Math.max(1, floors))] ?? HOUSE_PRICE[1]) * kindX) *
      (TIER_RENT[t] ?? 1) *
      demand *
      PRICE_X.buy,
  );
  return { base, buy, tier: t };
}
/** (read when used: the admin can change it) */
export const landPrice = () => ECONOMY.land.points;
/** A shop or a market stall, for a week or a month. */
export function shopPrice(kind: string, days: number) {
  if (kind === "stall") return Math.round(SHOP_PRICES.stall.week.naira / 10);
  return days >= 30 ? SHOP_PRICES.shop.month.points : SHOP_PRICES.shop.week.points;
}
/** The most anyone can be asked to pay over the plain price (Ilm surcharge × demand). */
export const MAX_MARKUP = 2.3;

/* ---------- price levels set in the admin ----------
   Stored in city_config/prices as percentages (100 = normal). The game and the server both
   apply them, so what a player is shown is what the server charges. */
export type PriceLevels = { rent: number; buy: number; land: number; shop: number; stall: number; food: number };
export const PRICE_KEYS = ["rent", "buy", "land", "shop", "stall", "food"] as const;
const BASE = {
  land: ECONOMY.land.points,
  shopWeek: SHOP_PRICES.shop.week.points,
  shopMonth: SHOP_PRICES.shop.month.points,
  stall: SHOP_PRICES.stall.week.naira,
};
const pct = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(400, Math.max(25, Math.round(n))) : 100;
};
export function cleanLevels(o: Partial<Record<string, unknown>> | undefined): PriceLevels {
  return {
    rent: pct(o?.rent),
    buy: pct(o?.buy),
    land: pct(o?.land),
    shop: pct(o?.shop),
    stall: pct(o?.stall),
    food: pct(o?.food),
  };
}
export function applyPrices(o: Partial<Record<string, unknown>> | undefined) {
  const l = cleanLevels(o);
  for (const k of PRICE_KEYS) PRICE_X[k] = l[k] / 100;
  ECONOMY.land.points = r10(BASE.land * PRICE_X.land);
  ECONOMY.land.naira = ECONOMY.land.points * 10;
  SHOP_PRICES.shop.week.points = r10(BASE.shopWeek * PRICE_X.shop);
  SHOP_PRICES.shop.week.naira = SHOP_PRICES.shop.week.points * 10;
  SHOP_PRICES.shop.month.points = r10(BASE.shopMonth * PRICE_X.shop);
  SHOP_PRICES.shop.month.naira = SHOP_PRICES.shop.month.points * 10;
  SHOP_PRICES.stall.week.naira = r10(BASE.stall * PRICE_X.stall);
  return l;
}
