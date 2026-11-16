import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-site";
import { AboutPage } from "@/components/about";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — IlmStation" }, { name: "description", content: "Our mission, advisors and partners. IlmStation is a home for Islamic learning, built for Muslim families." }] }),
  component: () => <PublicShell><AboutPage /></PublicShell>,
});
