/* What players can buy with real money (Paystack). `price` is in real naira; `units` is the
   game riyals added to the wallet (500 units = SAR 500 in the game). */
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
  { id: "n5k", name: "SAR 500 in IlmWorld", price: 500, units: 500 },
  { id: "n12k", name: "SAR 1,200 in IlmWorld", price: 1000, units: 1200, note: "20% extra" },
  { id: "n35k", name: "SAR 3,500 in IlmWorld", price: 2500, units: 3500, note: "40% extra" },
  { id: "n80k", name: "SAR 8,000 in IlmWorld", price: 5000, units: 8000, note: "60% extra" },
  {
    id: "rich",
    name: "Rich family pack",
    price: 3000,
    units: 2000,
    rich: true,
    note: "A furnished family house of your own, and SAR 2,000",
  },
];
export const packById = (id: string) => PACKS.find((p) => p.id === id);
