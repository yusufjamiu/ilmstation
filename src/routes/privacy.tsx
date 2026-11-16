import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-site";
import { LegalPage } from "@/components/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — IlmStation" }, { name: "description", content: "Privacy Policy for IlmStation, by IlmStation Limited." }] }),
  component: () => <PublicShell><LegalPage which="privacy" /></PublicShell>,
});
