import { admin } from "./money-server";

const LANGS: Record<string, string> = { en: "English", ar: "Arabic", fr: "French", ur: "Urdu", ha: "Hausa", id: "Indonesian", tl: "Filipino", yo: "Yoruba", ig: "Igbo", ms: "Malay", bn: "Bengali" };

const SYSTEM = (lang: string) => `You are IlmBot, the learning assistant inside IlmStation, an Islamic learning app.
- Help people learn about Islam: Qur'an, tafsir, hadith, seerah, aqeedah, basic fiqh, du'a, adab, Arabic and Islamic history. You may also help with general study questions.
- Follow mainstream Sunni scholarship. Where the four madhhabs differ, say so briefly and fairly.
- Give sources: Qur'an as (Surah name chapter:verse); hadith with the collection and number only when you are confident. Never invent a reference. If unsure of the exact number, name the collection only or say you are not certain.
- Mention the grading of a hadith when it matters (sahih, hasan, da'if).
- You are not a mufti. For personal rulings (divorce, inheritance shares, specific worship problems, medical or legal matters, disputes), give the general teaching and advise them to ask a qualified scholar.
- Be warm, clear and concise: usually under 180 words, short paragraphs, **bold** for key terms. No emojis.
- Do not take sides in sectarian, political or personal disputes, and never insult any group or person.
- If someone seems to be in distress or danger, respond with care and encourage them to reach out to someone they trust or to local emergency help.
- Reply in ${lang}. Quote Qur'an verses and du'a in Arabic, followed by a translation in ${lang}.`;

/** IlmBot: Islamic learning questions answered by OpenAI, with a daily limit. */
export async function handleBot(request: Request): Promise<Response> {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.OPENAI_API_KEY; if (!key) return json({ error: "IlmBot isn't set up yet." }, 503);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = await Promise.resolve((admin as any)());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbAuth: any = typeof a.auth === "function" ? a.auth() : a.auth;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = typeof a.db === "function" ? a.db() : a.db;
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  let uid = "";
  try { uid = (await fbAuth.verifyIdToken(token)).uid; } catch { return json({ error: "Please log in again." }, 401); }

  const body = (await request.json().catch(() => ({}))) as { messages?: { role: string; content: string }[]; lang?: string; peek?: boolean };
  const day = new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
  const [ent, cfgDoc, prof] = await Promise.all([db.doc(`entitlements/${uid}`).get(), db.doc("siteConfig/premium").get(), db.doc(`profiles/${uid}`).get()]);
  if (prof.get("zone") === "kids") return json({ error: "IlmBot is for teens and adults." }, 403);
  const premium = Math.max(Number(ent.get("premiumUntil") ?? 0), Number(ent.get("familyUntil") ?? 0)) > Date.now();
  const feat = ((cfgDoc.get("features") as { id: string; on?: boolean; free?: number; premium?: number }[] | undefined) ?? []).find((f) => f.id === "bot");
  const limit = premium ? (Number(feat?.premium ?? 0) || 50) : Number(feat?.free ?? 5);
  const ref = db.collection("botUsage").doc(`${uid}_${day}`);

  if (body.peek) { const n = Number((await ref.get()).get("n") ?? 0); return json({ left: Math.max(0, limit - n), limit, premium }); }

  const msgs = (body.messages ?? []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-10).map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "Ask a question first." }, 400);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const used: number = await db.runTransaction(async (t: any) => { const n = Number((await t.get(ref)).get("n") ?? 0); if (n < limit) t.set(ref, { n: n + 1, uid, day }, { merge: true }); return n; });
  if (used >= limit) return json({ error: premium ? "You've reached today's IlmBot limit. Please come back tomorrow." : `You've used today's ${limit} free questions. Go Premium for more, or come back tomorrow.`, left: 0, limit }, 429);

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.4, max_tokens: 700, messages: [{ role: "system", content: SYSTEM(LANGS[body.lang ?? "en"] ?? "English") }, ...msgs] }),
    });
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
    if (!r.ok) return json({ error: "IlmBot is busy right now. Please try again." }, 502);
    return json({ reply: (j.choices?.[0]?.message?.content ?? "").trim(), left: Math.max(0, limit - used - 1), limit });
  } catch { return json({ error: "Couldn't reach IlmBot. Check your connection." }, 502); }
}
