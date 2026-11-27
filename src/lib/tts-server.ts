/** Qira'ah lessons: read Arabic aloud with every harakah (kataba, not katab), using OpenAI text-to-speech.
 *  Called as GET /api/tts?text=كَتَبَ&say=ka-ta-ba  (add &slow=1 for slower),
 *  or for spoken English instructions: GET /api/tts?text=Tap%20the%20mic&lang=en
 *  Hadith lessons add &voice=naya or &voice=abdullah (ElevenLabs reads both the Arabic and the instructions).
 *  GET so Vercel's CDN keeps each word: OpenAI is paid once per word, then it's free and instant. */

const READ_RULE =
  "You are a Qur'an reading teacher reading to a beginner. Use correct Qur'anic (Classical, fusha) pronunciation of every letter, " +
  "exactly as in Qur'an recitation — NO regional or dialect accent (not Egyptian, not Levantine, not Gulf). " +
  "Read the Arabic text exactly as written, clearly. " +
  "SHORT vowels (fatha, kasra, damma) are very short — one quick beat. NEVER stretch a short vowel. " +
  "Only stretch a vowel where there is a long-vowel letter (alif, waw, ya), and then for EXACTLY two counts " +
  "(natural madd, madd tabii): 'taa' is ta + one extra beat, never 'taaaaa'. Never stretch longer than two counts. " +
  "Pronounce the short vowel on the LAST letter of every word too — do not drop it. " +
  "Tanween (ً ٍ ٌ) ends the word with a short vowel plus n: قَلَمٌ is qa-la-mun, three quick equal beats — never 'qaa-la-mu'. A short vowel after the FIRST letter is short too. " +
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
  "You are a confident, warm male Qur'an teacher speaking to adult beginners. Speak crisply and clearly at a natural, lively pace, " +
  "like an energetic teacher in a good class: sharp, bright and engaged, never sleepy or dragging. Keep pauses short and natural. Pronounce every word fully. " + ARABIC_TERMS;

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

// Instructions in other languages: speak that language like a native teacher.
const LANG_NAMES: Record<string, string> = { ar: "Modern Standard Arabic (fusha)", fr: "French", ur: "Urdu", ha: "Hausa", id: "Indonesian", tl: "Filipino (Tagalog)", yo: "Yoruba (with correct tones)", ig: "Igbo", bn: "Bengali", ms: "Malay (Bahasa Melayu)", tr: "Turkish", sw: "Swahili" };
const speakIn = (code: string) => code && code !== "en" && LANG_NAMES[code]
  ? ` The text is in ${LANG_NAMES[code]}: read it in ${LANG_NAMES[code]} with a natural native accent, not an English accent. Keep Arabic and Islamic words in their proper Arabic pronunciation.`
  : "";

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


/** Spitch's Yoruba/Igbo/Hausa voices don't know Arabic: spell Arabic terms the way local Muslims say them,
    and drop Arabic-script letters (they're on the screen; the voice can't read them). */
const NAIJA_SAY: [RegExp, string][] = [
  [/\bAssalamu alaikum\b|\bAssalamu-alaikum\b/gi, "Asalaamu alaikum"], [/\bMasha'?Allah\b|\bMasya Allah\b/gi, "Maasha Allah"],
  [/\bBarakallahu fee?kum\b/gi, "Baarakallahu fiikum"], [/\bBismillah\b/gi, "Bisimillah"], [/\bAlhamdulillah\b/gi, "Alhamdulillahi"],
  [/\bQira'ah\b/gi, "Kiraa'a"], [/\bNour al-Bayan\b/gi, "Nuurul Bayaan"], [/\bMumtaz\b/gi, "Mumtaazu"],
  [/\bAlif\b/g, "Alifu"], [/\bBaa\b/g, "Baa"], [/\bJeem\b|\bJiim\b/g, "Jiimu"], [/\bDaal\b/g, "Daali"], [/\bDhaal\b/g, "Zaali"],
  [/\bSeen\b/g, "Siini"], [/\bSheen\b/g, "Shiini"], [/\bSaad\b/g, "Saadi"], [/\bDaad\b/g, "Daadi"], [/\bAyn\b/g, "Aini"], [/\bGhayn\b/g, "Gaini"],
  [/\bQaaf\b/g, "Kaafu"], [/\bKaaf\b/g, "Kaafu"], [/\bLaam\b/g, "Laamu"], [/\bMeem\b/g, "Miimu"], [/\bNoon\b/g, "Nuunu"], [/\bWaw\b/g, "Waawu"],
  [/\bfatha\b/gi, "fataha"], [/\bkasra\b/gi, "kasira"], [/\bsukun\b/gi, "sukuun"], [/\btanween\b/gi, "tanwiini"], [/\bmadd\b/gi, "maddu"],
  [/\bshadda\b/gi, "shaddah"], [/\btajweed\b/gi, "tajwiidi"], [/\bghunnah\b/gi, "gunnah"], [/\bqalqalah\b/gi, "kalkalah"],
  [/\bHamzatul Wasl\b/gi, "Hamzatul Wasli"], [/\bMus'?hafi?\b/gi, "Musihafi"], [/\bKùránì\b/g, "Kurani"],
];
function forNaija(text: string): string {
  let t = text.replace(/[؀-ۿݐ-ݿࢠ-ࣿ]+/g, " ");
  for (const [re, to] of NAIJA_SAY) t = t.replace(re, to);
  return t.replace(/\(\s*\)/g, "").replace(/\s*[–—-]\s*(?=[.,!?:]|$)/g, "").replace(/\s{2,}/g, " ").replace(/\s+([.,!?:])/g, "$1").trim();
}


/** Numbers and level names the Nigerian voices trip over: "Beginner 1" → "Beginner one", "95%" → "95 percent";
    each sentence on its own line so the voice pauses at full stops. */
const NUM_EN = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const NUM_HA = ["sifili", "ɗaya", "biyu", "uku", "huɗu", "biyar", "shida", "bakwai", "takwas", "tara", "goma"];
function speakable(text: string, lang: string): string {
  let t = text
    .replace(/\b(Beginner|Mafari|Level|Ìpele|Ọkwa|Mataki)\s+(\d{1,2})\b/g, (_m, w: string, n: string) => `${w} ${lang === "ha" ? `na ${NUM_HA[+n] ?? n}` : NUM_EN[+n] ?? n}`)
    .replace(/(\d+)\s*%/g, "$1 percent")
    .replace(/\s*·\s*/g, ". ")
    .replace(/([.!?])\s+/g, "$1\n");
  return t.trim();
}


/* ---- Permanent voice store: paid voices (ElevenLabs/Spitch) are made once, kept in Firebase Storage, reused forever ---- */
type Bucket = { file: (p: string) => { exists: () => Promise<[boolean]>; download: () => Promise<[Buffer]>; save: (b: Buffer, o: object) => Promise<void> } };
let bucketP: Promise<Bucket | null> | null = null;
function voiceBucket(): Promise<Bucket | null> {
  if (bucketP) return bucketP;
  bucketP = (async () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const name = process.env.FIREBASE_STORAGE_BUCKET ?? process.env.VITE_FIREBASE_STORAGE_BUCKET;
    if (!raw || !name) return null;
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const cred = JSON.parse(json) as { project_id: string; client_email: string; private_key: string };
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getStorage } = await import("firebase-admin/storage");
    const app = getApps().find((a) => a.name === "voices") ?? initializeApp({
      credential: cert({ projectId: cred.project_id, clientEmail: cred.client_email, privateKey: cred.private_key.replace(/\\n/g, "\n") }),
      storageBucket: name,
    }, "voices");
    return getStorage(app).bucket(name) as unknown as Bucket;
  })().catch((e) => { console.error("voice store", e); bucketP = null; return null; });
  return bucketP;
}
async function voiceKey(parts: string[]): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts.join("\u0001")));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function storedVoice(key: string): Promise<ArrayBuffer | null> {
  try {
    const b = await voiceBucket(); if (!b) return null;
    const f = b.file(`tts-cache/${key}.mp3`);
    const [ok] = await f.exists(); if (!ok) return null;
    const [buf] = await f.download();
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch { return null; }
}
async function keepVoice(key: string, buf: ArrayBuffer): Promise<void> {
  try { const b = await voiceBucket(); if (b) await b.file(`tts-cache/${key}.mp3`).save(Buffer.from(buf), { contentType: "audio/mpeg", resumable: false }); } catch { /* not fatal */ }
}

/** Sample rate of an MP3 (ElevenLabs files here are 44.1 kHz, OpenAI's are 24 kHz): tells which voice made a stored file. */
function mp3Rate(buf: ArrayBuffer): number {
  const b = new Uint8Array(buf); let i = 0;
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) i = 10 + ((b[6] & 127) << 21 | (b[7] & 127) << 14 | (b[8] & 127) << 7 | (b[9] & 127));
  const end = Math.min(b.length - 3, i + 4096);
  for (; i < end; i++) {
    if (b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0) {
      const ver = (b[i + 1] >> 3) & 3, sr = (b[i + 2] >> 2) & 3;
      const T: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
      return T[ver]?.[sr] ?? 0;
    }
  }
  return 0;
}


/* ---- ElevenLabs readers per language (Hadith lessons, and the instructions in Qira'ah and Arabiyyah) ----
   male = men (Hadith) and adult lessons; female = women and kids. AR also reads the hadith itself.
   To change one without editing code, set e.g. HADITH_AR_MALE_VOICE_ID in Vercel (it wins over this list). */
const LANG_VOICES: Record<string, { male?: string; female?: string }> = {
  AR: { male: "drMurExmkWVIH5nW8snR", female: "jAAHNNqlbAX9iWjJPEtE" },   // Khaled Alnajjar / Sara (the hadith + Arabic)
  EN: { male: "z7i51AlFqQJ8JzM16o7e", female: "ZF6FPAbjXT4488VcRRnw" },   // Nathaniel / Amelia
  FR: { male: "a5n9pJUnAhX4fn7lx3uo", female: "WQKwBV2Uzw1gSGr69N8I" },   // Martin Dupont / Mylène
  MS: { male: "NpVSXJvYSdIbjOaMbShj", female: "qAJVXEQ6QgjOQ25KuoU8" },   // Jawid Iqbal Anwar / Aisyah
  TL: { male: "HyI7lAFGUyIWLOTuaREJ", female: "RnW8EXHv9GqGMgyP0sXG" },   // Ate Jen / Ate Lyn (Filipino)
  ID: { male: "ACRfKVNOAnzVitkYerdl", female: "I7sakys8pBZ1Z5f0UhT9" },   // Mizan / Putri Maharani (Indonesian)
  UR: { male: "vH5LP38dcYJ3CIbC2rKX", female: "UT6USLtoAlXHj5k4sOLY" },   // Amjid / Reva (Urdu)
  BN: { male: "j5PhP1QJv2DvlhRv3mEv", female: "q4yUdydpWxqfmkQH7gK7" },   // Subhajit / Swati S (Bengali)
};
function langVoice(lang: string, male: boolean): string | undefined {
  const L = lang.toUpperCase();
  return process.env[`HADITH_${L}_${male ? "MALE" : "FEMALE"}_VOICE_ID`] || LANG_VOICES[L]?.[male ? "male" : "female"];
}

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
  // instructions: ?lang=<code> (en, ar, fr, ur, ha, id, tl, yo…); the Arabic reading has no lang
  const ilang = (url.searchParams.get("lang") ?? "").toLowerCase();
  const english = /^[a-z]{2,3}$/.test(ilang);          // "english" = spoken instructions, in the learner's language
  const adult = url.searchParams.get("who") === "adult";   // adult narrator, otherwise Nuri for children

  // ---- Hadith lessons (?voice=naya|abdullah): ElevenLabs reads the Arabic AND the instructions ----
  // Naya = kids and women, Abdullah = men. Made once, kept in Firebase Storage (tts-cache), then free.
  const HADITH_VOICES: Record<string, string> = { naya: "pG78raDdMo3wMovvBZyC", abdullah: "usjDi9nBY6UHvtKrL4ba" };
  const hv = url.searchParams.get("voice") ?? "";
  if (HADITH_VOICES[hv]) {
    const arabic = !english;
    const okText = arabic
      ? text.length <= 200 && /^[\u0600-\u06FF\uFD3E\uFD3F\s:.!\-]+$/.test(text)
      : text.length <= 500 && /^[\p{L}\p{M}\p{N}\s.,!?'’ʿʾ:;()\-–—«»"“”،؟·۔।%]+$/u.test(text);
    if (!text || !okText) return json({ error: "Hadith lesson text only." }, 400);
    const eleven = process.env.ELEVENLABS_API_KEY;
    if (!eleven) return json({ error: "Voice isn't set up yet." }, 503);
    // Which reader: the LANG_VOICES list above (AR = the hadith itself and Arabic instructions).
    // "female" = women and all kids. Yoruba, Igbo, Hausa use your Qira'ah settings (Yomi / Olufunmilola).
    // Any other language: Abdullah (men) / Naya (women and kids).
    const L = (arabic ? "ar" : ilang).toUpperCase();
    const male = hv === "abdullah";
    const naija = ["YO", "IG", "HA"].includes(L)
      ? (male ? process.env[`ELEVENLABS_${L}_VOICE_ID`] ?? process.env.ELEVENLABS_NAIJA_VOICE_ID
              : process.env[`ELEVENLABS_${L}_KID_VOICE_ID`] ?? process.env.ELEVENLABS_NAIJA_KID_VOICE_ID)
      : undefined;
    const voiceId = naija
      || langVoice(L, male)
      || HADITH_VOICES[hv];
    const hKey = await voiceKey([process.env.TTS_STORE_VERSION ?? "1", "hadith", voiceId, ilang, text]);
    const send = (buf: ArrayBuffer) => new Response(buf, {
      headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=86400, s-maxage=31536000, immutable", ...cors },
    });
    const keptH = await storedVoice(hKey);
    if (keptH) return send(keptH);
    const said = arabic ? text : speakable(text, ilang);
    const settings = { stability: 0.7, similarity_boost: 0.8, speed: arabic ? 0.85 : 0.92 };  // slow and clear
    for (const body of [
      { text: said, model_id: "eleven_v4", language_code: arabic ? "ar" : ilang, voice_settings: settings },
      { text: said, model_id: "eleven_multilingual_v2", voice_settings: settings },   // if a setting is refused
    ]) {
      try {
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
          method: "POST",
          headers: { "xi-api-key": eleven, "content-type": "application/json", accept: "audio/mpeg" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20000),
        });
        if (r.ok) { const buf = await r.arrayBuffer(); if (buf.byteLength > 1000) { await keepVoice(hKey, buf); return send(buf); } }
        else { console.error("eleven hadith", r.status, (await r.text().catch(() => "")).slice(0, 300)); if (r.status === 401) break; }
      } catch (e) { console.error("eleven hadith", String(e)); }
    }
    return json({ error: "Voice service error." }, 502);
  }
  // Only short lesson text, so nobody can use this to read other things on your bill
  if (english) {
    const ok = ilang === "en" ? /^[A-Za-z0-9\s.,!?'’:;()\-]+$/.test(text) : /^[\p{L}\p{M}\p{N}\s.,!?'’:;()\-–—«»"“”،؟·۔।]+$/u.test(text);
    if (!text || text.length > 500 || !ok)
      return json({ error: "Short lesson text only (max 500 characters)." }, 400);
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

  let backup = false; // a native voice was wanted but isn't available: don't cache the stand-in for long
  const respond = (buf: ArrayBuffer) => new Response(buf, {
    headers: { "content-type": "audio/mpeg", "cache-control": backup ? "public, max-age=600" : "public, max-age=86400, s-maxage=31536000, immutable", ...cors },
  });

  // Every voice (OpenAI, ElevenLabs, Spitch) is made once and kept in Firebase Storage. To make them all again:
  // delete the "tts-cache" folder in Firebase Storage, or change TTS_STORE_VERSION in Vercel.
  const L = ilang.toUpperCase();
  const storeKey = await voiceKey([
    process.env.TTS_STORE_VERSION ?? "1", url.searchParams.get("v") ?? "", ilang, adult ? "adult" : "kid", tajweed ? "tj" : "", slow ? "slow" : "", say, text,
    ["yo", "ig", "ha"].includes(ilang) ? (process.env[`ELEVENLABS_${L}_${adult ? "" : "KID_"}VOICE_ID`] ?? process.env[`ELEVENLABS_NAIJA_${adult ? "" : "KID_"}VOICE_ID`] ?? "")
      : english ? (langVoice(ilang, adult) ?? "") : "",   // a new reader for a language = made again once in that voice
  ]);
  const kept = await storedVoice(storeKey);
  // made before: no cost. But if an instruction was saved in a backup voice while ElevenLabs is the chosen voice,
  // make it again so every part of a sentence has the same voice.
  if (kept && !(english && process.env.ELEVENLABS_API_KEY && mp3Rate(kept) !== 44100)) return respond(kept);
  const audio = async (buf: ArrayBuffer) => {         // stand-ins (backup) aren't kept, so the right voice replaces them later
    if (!backup && buf.byteLength > 1000) await keepVoice(storeKey, buf);
    return respond(buf);
  };

  // Yoruba, Igbo and Hausa: ElevenLabs Eleven v4 first (it reads the Arabic words well too), then Spitch, then OpenAI.
  // Vercel: ELEVENLABS_API_KEY, and optionally ELEVENLABS_NAIJA_VOICE_ID (adults) / ELEVENLABS_NAIJA_KID_VOICE_ID (kids).
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (english && elevenKey && ["yo", "ig", "ha"].includes(ilang)) {
    // each language can have its own readers: ELEVENLABS_YO_VOICE_ID / ELEVENLABS_YO_KID_VOICE_ID (also IG, HA)
    const vid = adult
      ? process.env[`ELEVENLABS_${L}_VOICE_ID`] ?? process.env.ELEVENLABS_NAIJA_VOICE_ID ?? process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB"
      : process.env[`ELEVENLABS_${L}_KID_VOICE_ID`] ?? process.env.ELEVENLABS_NAIJA_KID_VOICE_ID ?? process.env.ELEVENLABS_KID_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
    const said = speakable(text, ilang);
    // "robust" stability: the expressive model then reads every word instead of skipping some
    for (const body of [
      { text: said, model_id: "eleven_v4", language_code: ilang, voice_settings: { stability: 1.0, similarity_boost: 0.8 } },
      { text: said, model_id: "eleven_v4" },                 // if a setting is refused
    ]) {
      try {
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=mp3_44100_128`, {
          method: "POST",
          headers: { "xi-api-key": elevenKey, "content-type": "application/json", accept: "audio/mpeg" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20000),
        });
        if (r.ok) { const buf = await r.arrayBuffer(); if (buf.byteLength > 1000) return audio(buf); }
        else { console.error("eleven", r.status, (await r.text().catch(() => "")).slice(0, 300)); if (r.status === 401 || r.status === 429) break; }
      } catch (e) { console.error("eleven", String(e)); break; }
    }
  }

  // Yoruba, Igbo and Hausa: native Nigerian voices from Spitch (add SPITCH_API_KEY in Vercel). Falls back to the voices below.
  const spitch = process.env.SPITCH_API_KEY;
  const NAIJA: Record<string, [string, string]> = { yo: ["segun", "funmi"], ig: ["ebuka", "ngozi"], ha: ["aliyu", "zainab"] }; // [adult man, kids woman]
  if (english && spitch && NAIJA[ilang]) {
    // up to 3 tries: Spitch can refuse requests that arrive together ("too many requests") or be slow
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch("https://api.spitch.app/v1/speech", {
          method: "POST",
          headers: { authorization: `Bearer ${spitch}`, "content-type": "application/json" },
          body: JSON.stringify({ text: speakable(forNaija(text) || text, ilang), language: ilang, voice: NAIJA[ilang]![adult ? 0 : 1], format: "mp3", speed: adult ? 1.0 : 0.95 }),
          signal: AbortSignal.timeout(12000),
        });
        if (r.ok) {
          const buf = await r.arrayBuffer();
          if (buf.byteLength > 1000) { if (elevenKey) backup = true; return audio(buf); } // ElevenLabs is the chosen voice: Spitch only stands in
        } else {
          console.error("spitch", r.status, (await r.text().catch(() => "")).slice(0, 300));
          if (r.status !== 429 && r.status < 500) break; // a real error (e.g. text too long): use the backup voice
        }
      } catch (e) { console.error("spitch", String(e)); }
      await new Promise((ok) => setTimeout(ok, 800 * (attempt + 1)));
    }
  }
  if (english && NAIJA[ilang]) backup = true;

  // English narration: ElevenLabs if you add ELEVENLABS_API_KEY in Vercel (more natural), otherwise OpenAI.
  // Optional: ELEVENLABS_VOICE_ID (adults) and ELEVENLABS_KID_VOICE_ID (children) to pick the voices.
  const eleven = process.env.ELEVENLABS_API_KEY;
  if (english && eleven && !["yo", "ig", "ha"].includes(ilang)) {
    const voiceId = langVoice(ilang, adult)   // the language's reader from LANG_VOICES (adult = male, kids = female)
      ?? (adult ? process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB" /* Adam: male */ : process.env.ELEVENLABS_KID_VOICE_ID ?? process.env.ELEVENLABS_VOICE_ID) ?? "21m00Tcm4TlvDq8ikWAM";
    for (let attempt = 0; attempt < 2; attempt++) {   // ElevenLabs can refuse requests that arrive together: try twice
      try {
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
          method: "POST",
          headers: { "xi-api-key": eleven, "content-type": "application/json", accept: "audio/mpeg" },
          body: JSON.stringify(attempt === 0
            ? { text, model_id: "eleven_v4", language_code: ilang, voice_settings: { stability: 0.55, similarity_boost: 0.75 } }
            : { text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.75 } }),
          signal: AbortSignal.timeout(20000),
        });
        if (r.ok) { const buf = await r.arrayBuffer(); if (buf.byteLength > 1000) return audio(buf); }
        else { console.error("eleven", r.status, (await r.text().catch(() => "")).slice(0, 200)); if (r.status !== 429 && r.status < 500) break; }
      } catch (e) { console.error("eleven", String(e)); }
      await new Promise((ok) => setTimeout(ok, 900));
    }
    backup = true;   // OpenAI only stands in: not kept, so ElevenLabs replaces it next time
  }

  try {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: english ? (adult ? "onyx" : "coral") : "onyx", // adults: the same deep male voice as the Arabic reading
        input: text,
        instructions: english ? (adult ? ADULT_TEACHER : KID_TEACHER) + speakIn(ilang) : tajweed ? TAJWEED_RULE + notes : READ_RULE + guide + notes,
        speed: english ? (adult ? 1.05 : 0.97) : tajweed ? (slow ? 0.8 : 0.92) : slow ? 0.8 : 1.0, // slower speeds make the voice stretch Arabic vowels
        response_format: "mp3",
      }),
    });
    if (!r.ok) return json({ error: "Voice service error." }, 502);
    return audio(await r.arrayBuffer());
  } catch {
    return json({ error: "Couldn't reach the voice service." }, 502);
  }
}