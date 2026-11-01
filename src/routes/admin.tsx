import { createFileRoute } from "@tanstack/react-router";
import { AdminApp, sections, type Section } from "@/components/admin/shell";

type Search = { section?: Section | undefined };

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const section = s["section"];
    return { section: sections.find((x) => x === section) };
  },
  head: () => ({
    meta: [
      { title: "Admin — IlmStation" },
      { name: "description", content: "Manage IlmStation users, content, events, centres and community." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { section } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <AdminApp section={section ?? "dashboard"} onNavigate={(s) => navigate({ search: { section: s === "dashboard" ? undefined : s } })} />;
}
