import { admin } from "./money-server";

const DAILY_CAP = 300; // recordings per user per day
const MAX_BYTES = 4 * 1024 * 1024; // about a minute of audio

/** Hifz: turn a recitation recording into words with OpenAI speech-to-text. */
export async function handleStt(request: Request): Promise<Response> {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.OPENAI_API_KEY; if (!key) return json({ error: "Speech checking isn't set up yet." }, 503);
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  let uid = "";
  try { uid = (await admin().auth.verifyIdToken(token)).uid; } catch { return json({ error: "Please log in again." }, 401); }

  // daily cap per user
  const day = new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
  const ref = admin().db.collection("sttUsage").doc(`${uid}_${day}`);
  const used = await admin().db.runTransaction(async (t) => { const n = ((await t.get(ref)).data()?.n as number | undefined) ?? 0; if (n < DAILY_CAP) t.set(ref, { n: n + 1, uid, day }, { merge: true }); return n; });
  if (used >= DAILY_CAP) return json({ error: "You've reached today's limit. Try again tomorrow." }, 429);

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
