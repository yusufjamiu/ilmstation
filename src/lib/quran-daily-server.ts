/* Daily Qur'an challenge: same 5 questions for everyone each (UTC) day, one try each, leaderboard.
   GET  /api/quran-daily?date=YYYY-MM-DD  → top 20, my entry and my rank (token optional)
   POST /api/quran-daily { date, score, total, ms } with the user's Firebase ID token → saves once. */
import { admin } from "./money-server";

const reply = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const day = (offset = 0) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const TOTAL = 5;

export async function handleQuranDaily(request: Request): Promise<Response> {
  const a = await admin();
  if (!a) return reply(500, { error: "server-not-set-up" });
  const url = new URL(request.url);

  let uid: string | null = null;
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (token) { try { uid = (await a.auth.verifyIdToken(token)).uid; } catch { uid = null; } }

  if (request.method === "GET") {
    const date = url.searchParams.get("date") ?? day();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return reply(400, { error: "bad-request" });
    const list = a.db.collection(`quranDaily/${date}/list`);
    const [top, mine, players] = await Promise.all([
      list.orderBy("rankKey").limit(20).get(),
      uid ? list.doc(uid).get() : Promise.resolve(null),
      list.count().get(),
    ]);
    let rank: number | null = null;
    if (mine?.exists) rank = (await list.where("rankKey", "<", mine.get("rankKey")).count().get()).data().count + 1;
    const row = (d: FirebaseFirestore.DocumentSnapshot) => ({ name: String(d.get("name") ?? "Player"), score: Number(d.get("score")), total: TOTAL, secs: Math.round(Number(d.get("ms")) / 1000), me: d.id === uid });
    return reply(200, { top: top.docs.map(row), mine: mine?.exists ? row(mine) : null, rank, players: players.data().count });
  }

  if (request.method !== "POST") return reply(405, { error: "method" });
  if (!uid) return reply(401, { error: "signed-out" });
  let body: { date?: unknown; score?: unknown; total?: unknown; ms?: unknown };
  try { body = await request.json(); } catch { return reply(400, { error: "bad-request" }); }
  const date = String(body.date ?? "");
  const score = Number(body.score), ms = Number(body.ms);
  // the player's own day may be a day ahead/behind UTC
  if (![day(-1), day(), day(1)].includes(date)) return reply(400, { error: "wrong-day" });
  if (Number(body.total) !== TOTAL || !Number.isInteger(score) || score < 0 || score > TOTAL) return reply(400, { error: "bad-request" });
  if (!Number.isFinite(ms) || ms < 8_000 || ms > 3_600_000) return reply(400, { error: "bad-time" });

  const [profile, ua] = await Promise.all([a.db.doc(`profiles/${uid}`).get(), a.db.doc(`userAdmin/${uid}`).get()]);
  if (ua.get("status") === "suspended") return reply(403, { error: "suspended" });
  const name = String(profile.get("name") ?? "").trim().split(/\s+/)[0] || "Player";
  try {
    // more right answers first, then the faster time
    await a.db.doc(`quranDaily/${date}/list/${uid}`).create({ name, score, ms: Math.round(ms), rankKey: (TOTAL - score) * 1e8 + Math.round(ms), at: Date.now() });
  } catch {
    return reply(409, { error: "already-played" });
  }
  return reply(200, { ok: true });
}
