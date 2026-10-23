/* What houses, land and shops cost, shared by the game and the server (which charges the
   wallet). Amounts are in ₦10 units, like the wallet. */
import { ECONOMY, HOUSE_PRICE, SHOP_PRICES, districtById } from "./content";

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
      demand,
  );
  return { base, buy, tier: t };
}
export const LAND_PRICE = ECONOMY.land.points;
/** A shop or a market stall, for a week or a month. */
export function shopPrice(kind: string, days: number) {
  if (kind === "stall") return Math.round(SHOP_PRICES.stall.week.naira / 10);
  return days >= 30 ? SHOP_PRICES.shop.month.points : SHOP_PRICES.shop.week.points;
}
/** The most anyone can be asked to pay over the plain price (Ilm surcharge × demand). */
export const MAX_MARKUP = 2.3;
