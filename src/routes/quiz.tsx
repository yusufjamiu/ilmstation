import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — IlmStation" },
      { name: "description", content: "Test your Islamic knowledge with a focused IlmStation quiz." },
      { property: "og:title", content: "Quiz — IlmStation" },
      { property: "og:description", content: "A focused Islamic learning quiz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Outlet />,
});
