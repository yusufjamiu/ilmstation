import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Admin = lazy(() => import("@/game/Admin"));

export const Route = createFileRoute("/admin/world")({
  head: () => ({
    meta: [{ title: "IlmWorld admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Admin />
    </Suspense>
  );
}
