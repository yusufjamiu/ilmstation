import { toast } from "sonner";
import { auth } from "@/lib/firebase";

/** Ask the server for XP. Shows "+N XP" when some was given. */
export async function awardXp(action: string, data: Record<string, unknown> = {}) {
  const u = auth.currentUser;
  if (!u) return 0;
  try {
    const r = await fetch("/api/xp", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await u.getIdToken()}` }, body: JSON.stringify({ action, data }) });
    const j = (await r.json().catch(() => ({}))) as { gained?: number };
    const g = Number(j.gained ?? 0);
    if (g > 0) toast.success(`+${g} XP`);
    return g;
  } catch { return 0; }
}
