/** Qira'ah lessons: read Arabic aloud with every harakah (kataba, not katab), using OpenAI text-to-speech.
 *  Called as GET /api/tts?text=كَتَبَ&say=ka-ta-ba  (add &slow=1 for slower),
 *  or for spoken English instructions: GET /api/tts?text=Tap%20the%20mic&lang=en
 *  GET so Vercel's CDN keeps each word: OpenAI is paid once per word, then it's free and instant. */

const READ_RULE =
  "You are a Qur'an reading teacher reading to a beginner. Use correct Qur'anic (Classical, fusha) pronunciation of every letter, " +
  "exactly as in Qur'an recitation — NO regional or dialect accent (not Egyptian, not Levantine, not Gulf). " +
  "Read the Arabic text exactly as written, clearly. " +
  "SHORT vowels (fatha, kasra, damma) are very short — one quick beat. NEVER stretch a short vowel. " +
  "Only stretch a vowel where there is a long-vowel letter (alif, waw, ya), and then for EXACTLY two counts " +
  "(natural madd, madd tabii): 'taa' is ta + one extra beat, never 'taaaaa'. Never stretch longer than two counts. " +
  "Pronounce the short vowel on the LAST letter of every word too — do not drop it. " +
  "Only when the last letter carries a written sukun (ْ) do you stop on it without a vowel. " +
  "Example: كَتَبَ is 'ka-ta-ba' — three equal short beats. NOT 'kaa-ta-ba', NOT 'katab'.";

// English instructions in the lessons (children who can't read yet hear every instruction)
const KID_TEACHER =
  "You are Nuri, a warm, cheerful teacher talking to a young child who is learning to read the Qur'an. " +
  "Speak clearly, a little slowly, with a smile in your voice. Say Arabic and Islamic words the proper Arabic way: Assalamu alaykum, Bismillah, Masha'Allah, Barakallahu feekum, Mumtaz, Qur'an, Alif, Baa, Taa, Thaa, Jeem, fatha, kasra, damma, sukun, shadda, tanween, madd.";

// Arabic and Islamic words inside English sentences: say them the Arabic way, never anglicised.
const ARABIC_TERMS =
  "When an Arabic or Islamic word appears inside the English text, pronounce it the proper Arabic way, as a Muslim teacher would: " +
  "Assalamu alaykum (as-salaamu 'alaykum), Wa alaykumus salaam, Bismillah, Alhamdulillah, Masha'Allah (maa shaa' Allaah), In sha Allah, " +
  "Barakallahu feekum, Jazakallahu khairan, Subhanallah, Allahu Akbar, Allah (with a full, deep 'l'), Qur'an (qur-'aan), Mushaf, " +
  "Qira'ah (qi-raa-'ah), Nour al-Bayan, Alif, Baa, Taa, Thaa, Jeem, Haa, Khaa, Daal, Dhaal, Raa, Zaay, Seen, Sheen, Saad, Daad, Taa, Dhaa, 'Ayn, Ghayn, Faa, Qaaf, Kaaf, Laam, Meem, Noon, Waw, Yaa, " +
  "fatha, kasra, damma, sukun, shadda, tanween, madd, harakah, harakat, hamza, Hamzatul Wasl, qalqalah, tajweed, Qamariyyah, Shamsiyyah. " +
  "Short transliterations like 'raka'a', 'sa'ada' or 'mi-ah' are Arabic words: read them as Arabic, with the 'ayn and hamza where shown.";

// Adults hear a calm, deep male teacher (lesson intros and instructions)
const ADULT_TEACHER =
  "You are a calm, kind male Qur'an teacher speaking to adult beginners. Speak slowly and very clearly, like a patient teacher in a class: " +
  "a relaxed pace, a short pause after every sentence and after every comma, and never rush. Pronounce every word fully and warmly. " + ARABIC_TERMS;

// Intermediate level (tajweed lessons, ?tj=1): read as a qualified reciter, Hafs 'an 'Asim.
const TAJWEED_RULE =
  "You are a qualified Qur'an reciter teaching tajweed. Use correct Qur'anic (Classical) pronunciation, NO dialect accent. " +
  "Read slowly and clearly (tartil), applying the rules of tajweed in the narration of Hafs 'an 'Asim: " +
  "a natural long vowel (alif, waw, ya after its matching vowel) is two counts; where the maddah sign (ٓ) is written, stretch the long vowel 4 to 5 counts, " +
  "and 6 counts when a shadda or sukun follows in the same word (like ٱلضَّآلِّينَ, ٱلْحَآقَّةُ). " +
  "Ghunnah (nasal sound, two counts) on noon and meem with shadda; idgham with ghunnah when noon sakinah or tanween meets ي ن م و; " +
  "idgham without ghunnah before ل and ر; iqlab before ب (the noon becomes a hidden meem with ghunnah); ikhfa (hidden noon with ghunnah) before the other ikhfa letters; " +
  "clear noon (izhar) before ء ه ع ح غ خ; ikhfa shafawi when meem sakinah meets ب, idgham when it meets م, otherwise a clear meem. " +
  "Qalqalah (a light echo) on ق ط ب ج د with sukun. Short vowels stay short. Pronounce the last vowel of every word unless a sukun is written. " +
  "Disjoined letters at the start of a surah are read by their letter names. ";

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
  const adult = url.searchParams.get("who") === "adult";   // adult narrator, otherwise Nuri for children
  // Only short lesson text, so nobody can use this to read other things on your bill
  if (english) {
    if (!text || text.length > 400 || !/^[A-Za-z0-9\s.,!?'’:;()\-]+$/.test(text))
      return json({ error: "Short English text only (max 400 characters)." }, 400);
  } else if (!text || text.length > 120 || !/^[\u0600-\u06FF\s،.]+$/.test(text))
    return json({ error: "Arabic text only (max 120 characters)." }, 400);
  const tajweed = !english && url.searchParams.get("tj") === "1";   // Intermediate lessons: full tajweed
  const slow = url.searchParams.get("slow") === "1";
  // Exact pronunciation sent by the lesson, e.g. "ka-ta-ba" (a/i/u short, aa/ii/uu long)
  const say = (url.searchParams.get("say") ?? "").trim();
  const guide = say && say.length <= 160 && /^[a-zA-Zʾʿḥṣḍṭẓ\- ]+$/.test(say)
    ? ` Pronounce it EXACTLY as: "${say}". In this guide a, i, u are SHORT (one beat); aa, ii, uu are long. Each hyphen is a new syllable.`
    : "";
  const notes = [...new Set([...text].filter((c) => LETTER_NOTES[c]))].map((c) => " " + LETTER_NOTES[c]).join("");

  const audio = (buf: ArrayBuffer) => new Response(buf, {
    headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=86400, s-maxage=31536000, immutable", ...cors },
  });

  // English narration: ElevenLabs if you add ELEVENLABS_API_KEY in Vercel (more natural), otherwise OpenAI.
  // Optional: ELEVENLABS_VOICE_ID (adults) and ELEVENLABS_KID_VOICE_ID (children) to pick the voices.
  const eleven = process.env.ELEVENLABS_API_KEY;
  if (english && eleven) {
    try {
      const voiceId = (adult ? process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB" /* Adam: male */ : process.env.ELEVENLABS_KID_VOICE_ID ?? process.env.ELEVENLABS_VOICE_ID) ?? "21m00Tcm4TlvDq8ikWAM";
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": eleven, "content-type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.75 } }),
      });
      if (r.ok) return audio(await r.arrayBuffer());
      // if ElevenLabs fails (e.g. out of credits), fall through to OpenAI
    } catch { /* fall through to OpenAI */ }
  }

  try {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: english ? (adult ? "onyx" : "coral") : "onyx", // adults: the same deep male voice as the Arabic reading
        input: text,
        instructions: english ? (adult ? ADULT_TEACHER : KID_TEACHER) : tajweed ? TAJWEED_RULE + notes : READ_RULE + guide + notes,
        speed: english ? (adult ? 0.85 : 0.92) : tajweed ? (slow ? 0.8 : 0.92) : slow ? 0.8 : 1.0, // slower speeds make the voice stretch Arabic vowels
        response_format: "mp3",
      }),
    });
    if (!r.ok) return json({ error: "Voice service error." }, 502);
    return audio(await r.arrayBuffer());
  } catch {
    return json({ error: "Couldn't reach the voice service." }, 502);
  }
}
