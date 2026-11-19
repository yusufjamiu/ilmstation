/** Qira'ah lessons: read Arabic aloud with every harakah (kataba, not katab), using OpenAI text-to-speech.
 *  Called as GET /api/tts?text=كَتَبَ  (add &slow=1 for slower).
 *  GET so Vercel's CDN keeps each word: OpenAI is paid once per word, then it's free and instant. */

const READ_RULE =
  "You are a Qur'an reading teacher. Read the Arabic text exactly as written, slowly and clearly. " +
  "Pronounce EVERY short vowel (fatha, kasra, damma), including on the LAST letter of every word. " +
  "Never stop on a sukun. Example: كَتَبَ is read 'kataba', not 'katab'.";

export async function handleTts(request: Request): Promise<Response> {
  const cors = { "access-control-allow-origin": "*" }; // lesson files may be served from storage
  const json = (o: unknown, status = 200) =>
    new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", ...cors } });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "GET") return json({ error: "GET only" }, 405);

  const key = process.env.OPENAI_API_KEY;
  if (!key) return json({ error: "Voice isn't set up yet." }, 503);

  const url = new URL(request.url);
  const text = (url.searchParams.get("text") ?? "").trim();
  // Only short Arabic text, so nobody can use this to read other things on your bill
  if (!text || text.length > 80 || !/^[؀-ۿ\s،.]+$/.test(text))
    return json({ error: "Arabic text only (max 80 characters)." }, 400);
  const slow = url.searchParams.get("slow") === "1";

  try {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "onyx", // also try "ash" or "sage"; keep the clearest Arabic
        input: text,
        instructions: READ_RULE,
        speed: slow ? 0.7 : 0.85,
        response_format: "mp3",
      }),
    });
    if (!r.ok) return json({ error: "Voice service error." }, 502);
    return new Response(await r.arrayBuffer(), {
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "public, max-age=86400, s-maxage=31536000, immutable",
        ...cors,
      },
    });
  } catch {
    return json({ error: "Couldn't reach the voice service." }, 502);
  }
}