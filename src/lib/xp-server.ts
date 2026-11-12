import { admin } from "./money-server";
import { mergeXp, type XpAction } from "./xp-config";

/** XP is only given here, using the amounts the admin set, with daily limits. */
const MULT: Record<string, number> = { Beginner: 1, Intermediate: 1.5, Advanced: 2 };
const int = (v: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const lagosDay = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
const ONCE_A_DAY: XpAction[] = ["daily", "wisdom"];

export async function handleXp(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  let uid: string;
  try { uid = (await a.auth.verifyIdToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""))).uid; } catch { return json({ error: "Not signed in" }, 401); }
  const body = (await request.json().catch(() => ({}))) as { action?: string; data?: Record<string, unknown> };
  const action = String(body.action) as XpAction;
  const d = body.data ?? {};

  const cfg = mergeXp((await a.db.doc("siteConfig/xp").get()).data());
  const r = cfg[action];
  if (!r) return json({ error: "Unknown action" }, 400);
  if (!r.on) return json({ ok: true, gained: 0 });

  // how much this action is worth
  let amount = 0;
  let onceKey: string | null = null;
  if (action === "quiz") { const total = int(d.total, 1, 50); amount = Math.round(int(d.correct, 0, total) * r.amount * (MULT[String(d.difficulty)] ?? 1)); }
  else if (action === "daily") {
    const p = await a.db.doc(`profiles/${uid}`).get();
    const streak = Number((p.get("streak") as { count?: number } | undefined)?.count ?? 0);
    amount = r.amount + (streak > 0 && streak % 30 === 0 ? (r.bonus30 ?? 0) : streak > 0 && streak % 7 === 0 ? (r.bonus7 ?? 0) : 0);
  }
  else if (action === "duel") amount = Math.min(int(d.xp, 0, 10_000), r.amount);
  else if (action === "book") { amount = r.amount; onceKey = d.id ? `book:${String(d.id).slice(0, 80)}` : null; }
  else if (action === "ramadan") { amount = d.all ? (r.bonus ?? 0) : r.amount; onceKey = `rmd:${int(d.year, 0, 9999)}:${int(d.day, 0, 30)}:${d.all ? "all" : String(d.step ?? "").slice(0, 20)}`; }
  else amount = r.amount;

  const ledgerRef = a.db.doc(`xpLedger/${uid}`);
  const playerRef = a.db.doc(`players/${uid}`);
  const today = lagosDay();
  const result = await a.db.runTransaction(async (tx) => {
    const [ledger, player] = await Promise.all([tx.get(ledgerRef), tx.get(playerRef)]);
    const base = Number(player.get("xp") ?? 50);
    const used: Record<string, number> = ledger.get("day") === today ? ((ledger.get("today") as Record<string, number>) ?? {}) : {};
    const once: Record<string, boolean> = (ledger.get("once") as Record<string, boolean>) ?? {};
    if (onceKey && once[onceKey]) return { gained: 0, xp: base };
    if (ONCE_A_DAY.includes(action) && (used[action] ?? 0) > 0) return { gained: 0, xp: base };
    const gained = Math.max(0, Math.min(amount, r.cap - (used[action] ?? 0)));
    const xp = base + gained;
    if (gained > 0) { tx.set(playerRef, { xp }, { merge: true }); tx.set(a.db.doc(`profiles/${uid}`), { xp }, { merge: true }); }
    tx.set(ledgerRef, { day: today, today: { ...used, [action]: (used[action] ?? 0) + gained }, once: onceKey ? { ...once, [onceKey]: true } : once });
    return { gained, xp };
  });
  return json({ ok: true, ...result });
}
