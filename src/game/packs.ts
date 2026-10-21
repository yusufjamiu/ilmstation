/* What players can buy with real money (Paystack). `price` is in real naira; `units` is the
   game naira added to the wallet, in ₦10 units (500 units = ₦5,000 in the game). */
export type Pack = {
  id: string;
  name: string;
  price: number;
  units: number;
  note?: string;
  /** a furnished family house of your own, in your home area */
  rich?: boolean;
};
export const PACKS: Pack[] = [
  { id: "n5k", name: "₦5,000 in IlmWorld", price: 500, units: 500 },
  { id: "n12k", name: "₦12,000 in IlmWorld", price: 1000, units: 1200, note: "20% extra" },
  { id: "n35k", name: "₦35,000 in IlmWorld", price: 2500, units: 3500, note: "40% extra" },
  { id: "n80k", name: "₦80,000 in IlmWorld", price: 5000, units: 8000, note: "60% extra" },
  {
    id: "rich",
    name: "Rich family pack",
    price: 3000,
    units: 2000,
    rich: true,
    note: "A furnished family house of your own, and ₦20,000",
  },
];
export const packById = (id: string) => PACKS.find((p) => p.id === id);
