import { admin } from "./money-server";

/** XP is only given here, with daily caps, so nobody can fake it. */
const MULT: Record<string, number> = { Beginner: 1, Intermediate: 1.5, Advanced: 2 };
const int = (v: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));
type Ctx = { streak: number };
type Rule = { cap: number; calc: (d: Record<string, unknown>, c: Ctx) => number; once?: (d: Record<string, unknown>) => string | null; daily?: boolean };

const RULES: Record<string, Rule> = {
  quiz: { cap: 600, calc: (d) => { const total = int(d.total, 1, 50); return Math.round(int(d.correct, 0, total) * 15 * (MULT[String(d.difficulty)] ?? 1)); } },
  daily: { cap: 210, daily: true, calc: (_d, c) => 10 + (c.streak > 0 && c.streak % 30 === 0 ? 200 : c.streak > 0 && c.streak % 7 === 0 ? 50 : 0) },
  wisdom: { cap: 5, daily: true, calc: () => 5 },
  duel: { cap: 300, calc: (d) => int(d.xp, 0, 120) },
  book: { cap: 150, calc: () => 50, once: (d) => (d.id ? `book:${String(d.id).slice(0, 80)}` : null) },
  chapter: { cap: 100, calc: () => 10, once: (d) => (d.id ? `ch:${String(d.id).slice(0, 80)}:${int(d.n, 0, 999)}` : null) },
  hifz: { cap: 50, calc: () => 10 },
  ramadan: { cap: 40, calc: (d) => (d.all ? 20 : 5), once: (d) => `rmd:${int(d.year, 0, 9999)}:${int(d.day, 0, 30)}:${String(d.step ?? "all").slice(0, 20)}` },
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const lagosDay = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);

export async function handleXp(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  let uid: string;
  try { uid = (await a.auth.verifyIdToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""))).uid; } catch { return json({ error: "Not signed in" }, 401); }
  const body = (await request.json().catch(() => ({}))) as { action?: string; data?: Record<string, unknown> };
  const rule = RULES[String(body.action)];
  if (!rule) return json({ error: "Unknown action" }, 400);
  const data = body.data ?? {};
  const action = String(body.action);

  const profile = await a.db.doc(`profiles/${uid}`).get();
  const streak = Number((profile.get("streak") as { count?: number } | undefined)?.count ?? 0);
  const ledgerRef = a.db.doc(`xpLedger/${uid}`);
  const playerRef = a.db.doc(`players/${uid}`);
  const today = lagosDay();

  const result = await a.db.runTransaction(async (tx) => {
    const [ledger, player] = await Promise.all([tx.get(ledgerRef), tx.get(playerRef)]);
    const sameDay = ledger.get("day") === today;
    const used: Record<string, number> = sameDay ? ((ledger.get("today") as Record<string, number>) ?? {}) : {};
    const once: Record<string, boolean> = (ledger.get("once") as Record<string, boolean>) ?? {};
    const key = rule.once?.(data) ?? null;
    if (key && once[key]) return { gained: 0, xp: Number(player.get("xp") ?? 50) };
    if (rule.daily && (used[action] ?? 0) > 0) return { gained: 0, xp: Number(player.get("xp") ?? 50) };
    const gained = Math.max(0, Math.min(rule.calc(data, { streak }), rule.cap - (used[action] ?? 0)));
    const xp = Number(player.get("xp") ?? 50) + gained;
    if (gained > 0) {
      tx.set(playerRef, { xp }, { merge: true });
      tx.set(a.db.doc(`profiles/${uid}`), { xp }, { merge: true });
    }
    tx.set(ledgerRef, { day: today, today: { ...used, [action]: (used[action] ?? 0) + gained }, once: key ? { ...once, [key]: true } : once }, { merge: false });
    return { gained, xp };
  });
  return json({ ok: true, ...result });
}
