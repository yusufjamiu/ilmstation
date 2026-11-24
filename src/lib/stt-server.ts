import { admin } from "./money-server";

const DAILY_CAP = 300; // recordings per user per day
const MAX_BYTES = 4 * 1024 * 1024; // about a minute of audio

/** Hifz: turn a recitation recording into words with OpenAI speech-to-text. */
export async function handleStt(request: Request): Promise<Response> {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.OPENAI_API_KEY; if (!key) return json({ error: "Speech checking isn't set up yet." }, 503);

  // works whether admin() returns the services directly or as functions, now or as a promise
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = await Promise.resolve((admin as any)());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbAuth: any = typeof a.auth === "function" ? a.auth() : a.auth;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = typeof a.db === "function" ? a.db() : a.db;

  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  let uid = "";
  try { uid = (await fbAuth.verifyIdToken(token)).uid; } catch (e) { console.error("stt auth", e); return json({ error: "Please log in again." }, 401); }

  // daily voice minutes: free users get the admin's number (3 by default), Premium is unlimited (2-hour fair-use cap)
  const day = new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
  const ms = Math.min(120000, Math.max(1000, Number(request.headers.get("x-audio-ms") ?? 0) || 5000));
  const [ent, cfgDoc] = await Promise.all([db.doc(`entitlements/${uid}`).get(), db.doc("siteConfig/premium").get()]);
  const now = Date.now();
  const premium = Math.max(Number(ent.get("premiumUntil") ?? 0), Number(ent.get("familyUntil") ?? 0)) > now;
  const feat = ((cfgDoc.get("features") as { id: string; on?: boolean; free?: number; premium?: number }[] | undefined) ?? []).find((f) => f.id === "voice");
  const freeMin = feat?.on === false ? 0 : Number(feat?.free ?? 3);
  const premMin = Number(feat?.premium ?? 0) || 120;
  const limit = (premium ? premMin : freeMin) * 60000;
  const ref = db.collection("sttUsage").doc(`${uid}_${day}`);
  const used: number = await db.runTransaction(async (t: any) => { const d = (await t.get(ref)).data() ?? {}; const u = Number(d.ms ?? 0); const n = Number(d.n ?? 0); if (limit > 0 && u < limit && n < DAILY_CAP * 10) t.set(ref, { ms: u + ms, n: n + 1, uid, day }, { merge: true }); return limit > 0 ? u : Number.MAX_SAFE_INTEGER; }); // eslint-disable-line @typescript-eslint/no-explicit-any
  if (feat?.on === false && !premium) { /* voice checking switched off as a limit: free for everyone */ }
  else if (used >= limit) return json({ error: premium ? "You've reached today's voice limit. Try again tomorrow." : `You've used today's ${freeMin} free voice minutes. Go Premium for unlimited, or continue tomorrow.` }, 429);

  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: "No audio received." }, 400);
  if (buf.byteLength > MAX_BYTES) return json({ error: "That recording is too long. Recite one verse at a time." }, 413);
  const type = request.headers.get("content-type") || "audio/webm";
  const ext = type.includes("mp4") || type.includes("m4a") ? "mp4" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";
  const hint = (new URL(request.url).searchParams.get("hint") ?? "").slice(0, 600);

  const form = new FormData();
  form.append("file", new Blob([buf], { type }), `recitation.${ext}`);
  form.append("model", "gpt-4o-mini-transcribe");
  form.append("language", "ar");
  form.append("response_format", "json");
  if (hint) form.append("prompt", hint);
  try {
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form });
    const j = (await r.json()) as { text?: string; error?: { message?: string } };
    if (!r.ok) return json({ error: j.error?.message ?? "Speech service error." }, 502);
    return json({ text: j.text ?? "" });
  } catch { return json({ error: "Couldn't reach the speech service." }, 502); }
}
