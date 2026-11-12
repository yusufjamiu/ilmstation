import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SponsorTier = { id: string; name: string; amount: string; per: string; covers: string; perks: string[]; highlight?: boolean; active?: boolean };
export type SponsorConfig = { eyebrow: string; headline: string; intro: string; tiers: SponsorTier[] };

/** Shown until the admin saves their own. */
export const DEFAULT_SPONSOR: SponsorConfig = {
  eyebrow: "Sadaqah jariyah",
  headline: "Sponsor a learner’s journey.",
  intro: "₦500 a month helps keep a child learning, and the reward continues with every ayah they carry.",
  tiers: [
    { id: "seed", name: "Seed a learner", amount: "₦500", per: "per month", covers: "One child’s learning", perks: ["One sponsored learner", "Impact updates", "Named on the sponsors wall"], active: true },
    { id: "circle", name: "Sponsor a circle", amount: "₦2,000", per: "per month", covers: "A small group of learners", perks: ["Several sponsored learners", "Progress report", "Sponsor certificate"], highlight: true, active: true },
    { id: "partner", name: "Partner with us", amount: "Custom", per: "organisations", covers: "A programme, term by term", perks: ["Named programme", "Branded presence", "Impact reporting", "Dedicated partnership contact"], active: true },
  ],
};

export function useSponsorConfig() {
  const [c, setC] = useState<SponsorConfig>(DEFAULT_SPONSOR);
  useEffect(() => onSnapshot(doc(db, "siteConfig", "sponsorship"),
    (s) => { if (s.exists()) setC({ ...DEFAULT_SPONSOR, ...(s.data() as Partial<SponsorConfig>) }); }, () => {}), []);
  return c;
}
