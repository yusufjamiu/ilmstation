/** Qira'ah lessons: read Arabic aloud with every harakah (kataba, not katab), using OpenAI text-to-speech.
 *  Called as GET /api/tts?text=كَتَبَ&say=ka-ta-ba  (add &slow=1 for slower),
 *  or for spoken English instructions: GET /api/tts?text=Tap%20the%20mic&lang=en
 *  GET so Vercel's CDN keeps each word: OpenAI is paid once per word, then it's free and instant. */

const READ_RULE =
  "You are a Qur'an reading teacher reading to a beginner. Use correct Qur'anic (Classical, fusha) pronunciation of every letter, " +
  "exactly as in Qur'an recitation — NO regional or dialect accent (not Egyptian, not Levantine, not Gulf). " +
  "Read the Arabic text exactly as written, clearly. " +
  "SHORT vowels (fatha, kasra, damma) are very short — one quick beat. NEVER stretch a short vowel. " +
  "Only stretch a vowel where there is a long-vowel letter (alif, waw, ya). " +
  "Pronounce the short vowel on the LAST letter of every word too — do not drop it. " +
  "Only when the last letter carries a written sukun (ْ) do you stop on it without a vowel. " +
  "Example: كَتَبَ is 'ka-ta-ba' — three equal short beats. NOT 'kaa-ta-ba', NOT 'katab'.";

// English instructions in the lessons (children who can't read yet hear every instruction)
const KID_TEACHER =
  "You are Nuri, a warm, cheerful teacher talking to a young child who is learning to read the Qur'an. " +
  "Speak clearly, a little slowly, with a smile in your voice. Say Arabic letter names correctly: Alif, Baa, Taa, Thaa, Jiim, Haa, Khaa.";

// Letters that dialects often change. A note is added only for letters that appear in the word.
const LETTER_NOTES: Record<string, string> = {
  "ث": "ث (tha) is 'th' as in English 'think' — tongue between the teeth. NEVER 's' or 'z'.",
  "ذ": "ذ (dhal) is 'th' as in English 'this' — tongue between the teeth. NEVER 'z' or 'd'.",
  "ظ": "ظ (dha) is a heavy 'th' as in 'this', tongue between the teeth. NEVER 'z'.",
  "ق": "ق (qaf) is a deep 'q' from the back of the throat. NEVER a glottal stop and NEVER 'g'.",
  "ج": "ج (jim) is 'j' as in 'jam'. NEVER 'g' and NEVER soft 'zh'.",
  "ض": "ض (dad) is a heavy, full 'd'. NEVER 'z'.",
  "ح": "ح (ha) is a breathy 'h' from the middle of the throat, different from ه.",
  "ع": "ع (ayn) is the voiced throat sound — keep it clearly.",
  "خ": "خ (kha) is 'kh' like Scottish 'loch'.",
  "ص": "ص (sad) is a heavy 's'. ط (ta) is a heavy 't'.",
  "ط": "ط (ta) is a heavy 't'.",
};

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
  const english = url.searchParams.get("lang") === "en";
  // Only short lesson text, so nobody can use this to read other things on your bill
  if (english) {
    if (!text || text.length > 220 || !/^[A-Za-z0-9\s.,!?'’:;()\-]+$/.test(text))
      return json({ error: "Short English text only (max 220 characters)." }, 400);
  } else if (!text || text.length > 80 || !/^[\u0600-\u06FF\s،.]+$/.test(text))
    return json({ error: "Arabic text only (max 80 characters)." }, 400);
  const slow = url.searchParams.get("slow") === "1";
  // Exact pronunciation sent by the lesson, e.g. "ka-ta-ba" (a/i/u short, aa/ii/uu long)
  const say = (url.searchParams.get("say") ?? "").trim();
  const guide = say && say.length <= 160 && /^[a-zA-Zʾʿḥṣḍṭẓ\- ]+$/.test(say)
    ? ` Pronounce it EXACTLY as: "${say}". In this guide a, i, u are SHORT (one beat); aa, ii, uu are long. Each hyphen is a new syllable.`
    : "";
  const notes = [...new Set([...text].filter((c) => LETTER_NOTES[c]))].map((c) => " " + LETTER_NOTES[c]).join("");

  try {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: english ? "coral" : "onyx", // Arabic: also try "ash" or "sage"; keep the clearest
        input: text,
        instructions: english ? KID_TEACHER : READ_RULE + guide + notes,
        speed: english ? 0.95 : slow ? 0.8 : 1.0, // slower speeds make the voice stretch Arabic vowels
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