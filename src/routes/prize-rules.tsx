import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-site";
import { LegalPage } from "@/components/legal";

export const Route = createFileRoute("/prize-rules")({
  head: () => ({ meta: [{ title: "Prize Rules — IlmStation" }, { name: "description", content: "Prize Rules for IlmStation quizzes, by IlmStation Limited." }] }),
  component: () => <PublicShell><LegalPage which="prizes" /></PublicShell>,
});
