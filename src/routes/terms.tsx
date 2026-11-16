import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-site";
import { LegalPage } from "@/components/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Use — IlmStation" }, { name: "description", content: "Terms of Use for IlmStation, by IlmStation Limited." }] }),
  component: () => <PublicShell><LegalPage which="terms" /></PublicShell>,
});
