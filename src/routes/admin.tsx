import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AdminApp, isAdminRole, sections, type AdminSession, type Section } from "@/components/admin/shell";

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

type Gate =
  | { status: "loading" | "signed-out" | "denied" | "no-role" }
  | { status: "ok"; session: AdminSession };

/** Real check: signed in with Firebase AND listed in "admins" with a valid role. */
function useAdminGate(): Gate {
  const [gate, setGate] = useState<Gate>({ status: "loading" });
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return setGate({ status: "signed-out" });
      try {
        const snap = await getDoc(doc(db, "admins", u.uid));
        if (!snap.exists()) return setGate({ status: "denied" });
        const role = snap.data().role;
        if (!isAdminRole(role)) return setGate({ status: "no-role" });
        setGate({ status: "ok", session: { id: u.uid, name: u.displayName || u.email || "Admin", role } });
      } catch {
        setGate({ status: "denied" });
      }
    });
  }, []);
  return gate;
}

function Notice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="max-w-sm border-2 border-foreground bg-card p-8 text-center">
        <p className="font-serif text-2xl">{title}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}

function AdminPage() {
  const gate = useAdminGate();
  const { section } = Route.useSearch();
  const navigate = Route.useNavigate();

  if (gate.status === "loading") return <Notice title="Checking access…" />;
  if (gate.status === "signed-out")
    return <Notice title="Admins only"><Link to="/login" className="font-semibold underline">Log in with your IlmStation account</Link></Notice>;
  if (gate.status === "denied")
    return <Notice title="No access"><p className="text-sm">This account isn't an admin.</p></Notice>;
  if (gate.status === "no-role")
    return <Notice title="Role not set"><p className="text-sm">Add a "role" field (owner, editor, moderator or support) to your admins document in Firebase.</p></Notice>;

  return <AdminApp session={gate.session} section={section ?? "dashboard"} onNavigate={(s) => navigate({ search: { section: s === "dashboard" ? undefined : s } })} />;
}
