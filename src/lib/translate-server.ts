import { createHash } from "node:crypto";
import { admin } from "./money-server";

const NAMES: Record<string, string> = { tl: "Filipino (Tagalog)", ha: "Hausa", yo: "Yoruba", ig: "Igbo", ms: "Malay", bn: "Bengali" };
const langName = (c: string) => { if (NAMES[c]) return NAMES[c]; try { return new Intl.DisplayNames(["en"], { type: "language" }).of(c) ?? ""; } catch { return ""; } };

/** Translates a short English Islamic text (a Daily Wisdom meaning) once per language with OpenAI; remembered for everyone. */
export async function handleTranslate(request: Request): Promise<Response> {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.OPENAI_API_KEY; if (!key) return json({ error: "Not set up" }, 503);
  const { text, lang } = (await request.json().catch(() => ({}))) as { text?: string; lang?: string };
  const src = (text ?? "").trim().slice(0, 1200);
  const name = lang && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang) && lang !== "en" && lang !== "ar" ? langName(lang) : "";
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
