import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/auth-flow";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — IlmStation" },
      { name: "description", content: "Log in to IlmStation and pick up today’s quest where you left it." },
      { property: "og:title", content: "Log In — IlmStation" },
      { property: "og:description", content: "Pick up today’s quest where you left it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});
