import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/public-site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IlmStation — Seek Knowledge, Grow Together" },
      { name: "description", content: "Daily Islamic learning, trusted teachers, local centres, events, and thoughtful community conversations." },
      { property: "og:title", content: "IlmStation — Seek Knowledge, Grow Together" },
      { property: "og:description", content: "A living school for daily Islamic learning and community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <LandingPage />;
}
