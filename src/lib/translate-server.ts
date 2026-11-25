import { createHash } from "node:crypto";
import { admin } from "./money-server";

const NAMES: Record<string, string> = { tl: "Filipino (Tagalog)", ha: "Hausa", yo: "Yoruba", ig: "Igbo", ms: "Malay", bn: "Bengali" };
const langName = (c: string) => { if (NAMES[c]) return NAMES[c]; try { return new Intl.DisplayNames(["en"], { type: "language" }).of(c) ?? ""; } catch { return ""; } };

/** Translates a short English Islamic text (a Daily Wisdom meaning) once per language with OpenAI; remembered for everyone. */
export async function handleTranslate(request: Request): Promise<Response> {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.OPENAI_API_KEY; if (!key) return json({ error: "Not set up" }, 503);
  const body = (await request.json().catch(() => ({}))) as { text?: string; lang?: string; texts?: string[]; game?: boolean };
  if (Array.isArray(body.texts)) return translateMany(body.texts, body.lang ?? "", key, json);
  const { text, lang } = body;
  const src = (text ?? "").trim().slice(0, 1200);
  const name = lang && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang) && lang !== "en" ? langName(lang) : "";
  if (!src || !name) return json({ error: "Bad request" }, 400);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = await Promise.resolve((admin as any)()); const db = typeof a.db === "function" ? a.db() : a.db;
  const ref = db.collection("trCache").doc(createHash("sha256").update(`${lang}|${src}`).digest("hex"));
  const cached = await ref.get();
  if (cached.exists && cached.data()?.text) return json({ text: cached.data().text });
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, messages: [
        { role: "system", content: `You translate short Islamic texts (Qur'an meanings, hadith, sayings of scholars) from English into ${name}. Translate faithfully and respectfully, in clear everyday ${name}. Keep names of Allah, the Prophet ﷺ and Islamic terms in their common form for ${name} speakers. Reply with the translation only, no quotes or notes.` },
        { role: "user", content: src },
      ] }),
    });
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const out = j.choices?.[0]?.message?.content?.trim() ?? "";
    if (!out) return json({ error: "No translation" }, 502);
    await ref.set({ text: out, src, lang, at: Date.now() });
    return json({ text: out });
  } catch { return json({ error: "Translation failed" }, 502); }
}

/** IlmWorld screens: up to 30 short game texts per call, each translated once per language and remembered for everyone. */
async function translateMany(list: string[], lang: string, key: string, json: (o: unknown, status?: number) => Response): Promise<Response> {
  const name = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang) && lang !== "en" ? langName(lang) : "";
  const texts = [...new Set(list.filter((t) => typeof t === "string").map((t) => t.trim()).filter((t) => t && t.length <= 400))].slice(0, 30);
  if (!name || !texts.length) return json({ error: "Bad request" }, 400);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = await Promise.resolve((admin as any)()); const db = typeof a.db === "function" ? a.db() : a.db;
  const refs = texts.map((t) => db.collection("trCache").doc(createHash("sha256").update(`game|${lang}|${t}`).digest("hex")));
  const snaps = await db.getAll(...refs);
  const out: Record<string, string> = {}; const missing: number[] = [];
  snaps.forEach((s: { exists: boolean; data: () => { text?: string } }, i: number) => { const v = s.exists ? s.data()?.text : ""; if (v) out[texts[i]] = v; else missing.push(i); });
  if (missing.length) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" }, messages: [
          { role: "system", content: `You translate the on-screen text of IlmWorld, a respectful Islamic life game set in Madinah, from English into ${name}. You get a JSON object {"t":[...]} of short texts (buttons, labels, messages, hadith, du'a meanings). Reply with {"t":[...]} holding the translations in the same order, same count. Rules: clear everyday ${name}; keep {n} placeholders exactly as they are; keep emoji, ﷺ, Arabic script, currency signs and numbers; keep people's names, place names, brand and shop names unchanged; translate Qur'an and hadith meanings faithfully; keep Islamic terms in the form ${name} speakers use. A text may be a fragment of a sentence: translate it as a fragment.` },
          { role: "user", content: JSON.stringify({ t: missing.map((i) => texts[i]) }) },
        ] }),
      });
      const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      const got = (JSON.parse(j.choices?.[0]?.message?.content ?? "{}") as { t?: unknown }).t;
      if (Array.isArray(got) && got.length === missing.length) {
        const batch = db.batch();
        missing.forEach((i, k) => { const v = typeof got[k] === "string" ? (got[k] as string).trim() : ""; if (!v) return; out[texts[i]] = v; batch.set(refs[i], { text: v, src: texts[i], lang, game: true, at: Date.now() }); });
        await batch.commit();
      }
    } catch { /* send what we have */ }
  }
  return json({ t: out });
}
