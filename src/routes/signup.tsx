import { createFileRoute } from "@tanstack/react-router";
import { SignupFlow } from "@/components/auth-flow";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Get Started — IlmStation" },
      { name: "description", content: "Create your IlmStation account: choose a language, set your interests, and take a quick knowledge check to start your first quest." },
      { property: "og:title", content: "Get Started — IlmStation" },
      { property: "og:description", content: "A few small steps, then your first quest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupFlow,
});
