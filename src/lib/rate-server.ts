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
      // recount every rating for this book, so old ratings are always included
      const all = await t.get(db.collection(`library/${bookId}/reviews`));
      let sum = stars;
      let count = 1;
      all.docs.forEach((d) => {
        if (d.id === uid) return;
        const v = Number(d.get("stars")) || 0;
        if (v >= 1 && v <= 5) { sum += v; count += 1; }
      });
      t.set(reviewRef, { uid, stars, counted: true, updatedAt: Date.now() });
      t.set(statsRef, { sum, count, avg: Math.round((sum / count) * 10) / 10, updatedAt: Date.now() });
    });
  } catch {
    return reply(500, { error: "failed" });
  }
  return reply(200, { ok: true });
}
