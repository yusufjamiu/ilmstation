import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-site";
import { SponsorshipPage } from "@/components/family";

export const Route = createFileRoute("/sponsorship")({
  head: () => ({
    meta: [
      { title: "Sponsor a Learner — IlmStation" },
      { name: "description", content: "Sponsor a child, a weekend circle, or a whole learning centre. Transparent tiers, real impact reporting, and sadaqah jariyah that keeps growing." },
      { property: "og:title", content: "Sponsor a Learner — IlmStation" },
      { property: "og:description", content: "Fund lessons, teachers, and safe learning spaces for children who otherwise could not attend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PublicShell><SponsorshipPage /></PublicShell>,
});
