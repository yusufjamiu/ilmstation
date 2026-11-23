import { admin } from "./money-server";

const LANGS: Record<string, string> = { fr: "French", ha: "Hausa", ur: "Urdu", id: "Indonesian", tl: "Filipino (Tagalog)" };

/** Translates a Daily Wisdom once per language with OpenAI and saves it on the wisdom (admins can correct it). */
export async function handleTranslate(request: Request): Promise<Response> {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.OPENAI_API_KEY; if (!key) return json({ error: "Not set up" }, 503);
  const { id, lang } = (await request.json().catch(() => ({}))) as { id?: string; lang?: string };
  if (!id || !lang || !LANGS[lang]) return json({ error: "Bad request" }, 400);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = await Promise.resolve((admin as any)()); const db = typeof a.db === "function" ? a.db() : a.db;
  const ref = db.collection("wisdom").doc(id); const snap = await ref.get();
  if (!snap.exists) return json({ error: "Not found" }, 404);
  const w = snap.data() as { text?: string; source?: string; kind?: string; tr?: Record<string, string> };
  if (w.tr?.[lang]?.trim()) return json({ text: w.tr[lang] });
  if (!w.text?.trim()) return json({ error: "Empty" }, 400);
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, messages: [
        { role: "system", content: `You translate short Islamic texts (Qur'an meanings, hadith, sayings of scholars) from English into ${LANGS[lang]}. Translate faithfully and respectfully, in clear everyday ${LANGS[lang]}. Keep names of Allah, the Prophet ﷺ and Islamic terms in their common form for ${LANGS[lang]} speakers. Reply with the translation only, no quotes or notes.` },
        { role: "user", content: w.text },
      ] }),
    });
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const text = j.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return json({ error: "No translation" }, 502);
    await ref.set({ tr: { [lang]: text }, trAuto: { [lang]: true } }, { merge: true });
    return json({ text });
  } catch { return json({ error: "Translation failed" }, 502); }
}
