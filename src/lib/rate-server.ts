/* Book ratings, kept on the server so the averages on library cards can't be faked.
   POST /api/rate { bookId, stars } with the reader's Firebase ID token.
   Reuses the IlmWorld money server's Firebase admin setup. */
import { admin } from "./money-server";

const reply = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function handleRate(request: Request): Promise<Response> {
  if (request.method !== "POST") return reply(405, { error: "method" });
  const a = await admin();
  if (!a) return reply(500, { error: "server-not-set-up" });

  let uid: string;
  try {
    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    uid = (await a.auth.verifyIdToken(token)).uid;
  } catch {
    return reply(401, { error: "signed-out" });
  }

  let body: { bookId?: unknown; stars?: unknown };
  try { body = await request.json(); } catch { return reply(400, { error: "bad-request" }); }
  const bookId = typeof body.bookId === "string" ? body.bookId : "";
  const stars = body.stars;
  if (!/^[\w-]{1,100}$/.test(bookId) || typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5)
    return reply(400, { error: "bad-request" });

  const db = a.db;
  const [book, state] = await Promise.all([db.doc(`library/${bookId}`).get(), db.doc(`libraryState/${uid}`).get()]);
  if (book.exists && book.get("comments") === false) return reply(403, { error: "off" });

  // only readers who have started: page 2+, some audio played, or finished
  const s = (state.data() ?? {}) as { progress?: Record<string, { pos?: number; secs?: number }>; finished?: string[] };
  const started = (s.finished ?? []).includes(bookId) || (s.progress?.[bookId]?.pos ?? 0) >= 1 || !!s.progress?.[`audio:${bookId}`]?.secs;
  if (!started) return reply(403, { error: "not-started" });

  const reviewRef = db.doc(`library/${bookId}/reviews/${uid}`);
  const statsRef = db.doc(`libraryStats/${bookId}`);
  try {
    await db.runTransaction(async (t) => {
      const [rev, st] = await Promise.all([t.get(reviewRef), t.get(statsRef)]);
      // ratings saved before the server existed were never counted: treat them as new
      const counted = rev.exists && rev.get("counted") === true;
      const old = counted ? Number(rev.get("stars")) || 0 : 0;
      const sum = (st.exists ? Number(st.get("sum")) || 0 : 0) - old + stars;
      const count = (st.exists ? Number(st.get("count")) || 0 : 0) + (counted ? 0 : 1);
      t.set(reviewRef, { uid, stars, counted: true, updatedAt: Date.now() });
      t.set(statsRef, { sum, count, avg: count ? Math.round((sum / count) * 10) / 10 : 0, updatedAt: Date.now() });
    });
  } catch {
    return reply(500, { error: "failed" });
  }
  return reply(200, { ok: true });
}
