export interface Question {
  id: string;
  topic: TopicId;
  prompt: string;
  arabic?: string;
  options: string[];
  answer: number;
  explanation: string;
  source: string;
  sourceArabic: string;
  articleSlug?: string;
}

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    topic: "aqeedah",
    prompt: "How many pillars of Iman (faith) are there?",
    arabic: "أَرْكَانُ الْإِيمَان",
    options: ["Five", "Six", "Seven", "Four"],
    answer: 1,
    explanation:
      "There are six pillars of Iman: belief in Allah, His angels, His books, His messengers, the Last Day, and divine decree. The Prophet ﷺ listed them when Jibril asked him about faith.",
    source: "Sahih Muslim 8",
    sourceArabic: "أَنْ تُؤْمِنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الْآخِرِ",
    articleSlug: "six-pillars-of-iman",
  },
  {
    id: "q2",
    topic: "aqeedah",
    prompt: "What does Tawhid al-Uluhiyyah refer to?",
    options: [
      "Oneness of Allah's names",
      "Oneness of worship directed to Allah alone",
      "Oneness of Allah's lordship over creation",
      "Oneness of the Muslim community",
    ],
    answer: 1,
    explanation:
      "Tawhid al-Uluhiyyah is the oneness of worship: all acts of devotion — prayer, supplication, sacrifice, reliance — belong to Allah alone. It is the category of Tawhid most people historically fell short in.",
    source: "Quran 51:56",
    sourceArabic: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
    articleSlug: "understanding-tawhid",
  },
  {
    id: "q3",
    topic: "aqeedah",
    prompt: "Which angel is charged with conveying revelation?",
    options: ["Mika'il", "Israfil", "Jibril", "Malik"],
    answer: 2,
    explanation:
      "Jibril (Gabriel) عليه السلام is the angel of revelation, described in the Quran as Ar-Ruh al-Amin — the trustworthy spirit — who brought the Quran to the heart of the Prophet ﷺ.",
    source: "Quran 26:193",
    sourceArabic: "نَزَلَ بِهِ الرُّوحُ الْأَمِينُ",
  },
  {
    id: "q4",
    topic: "hadith",
    prompt: "The first hadith of Imam Nawawi's collection concerns which principle?",
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
    options: [
      "Intentions (niyyah)",
      "Purity (taharah)",
      "Charity (sadaqah)",
      "Patience (sabr)",
    ],
    answer: 0,
    explanation:
      "The opening hadith establishes that deeds are judged by intention. Scholars placed it first because it governs the validity of every other act of worship in Islam.",
    source: "Sahih al-Bukhari 1",
    sourceArabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    articleSlug: "nawawi-first-ten",
  },
  {
    id: "q5",
    topic: "hadith",
    prompt: "What is the term for the chain of narrators of a hadith?",
    options: ["Matn", "Isnad", "Ijaza", "Rawi"],
    answer: 1,
    explanation:
      "The isnad is the chain of transmission; the matn is the text itself. Hadith scholars evaluated the isnad narrator by narrator, which is why Islamic scholarship developed the science of rijal.",
    source: "Introduction to Sahih Muslim",
    sourceArabic: "الْإِسْنَادُ مِنَ الدِّينِ",
  },
  {
    id: "q6",
    topic: "hadith",
    prompt: "A hadith graded 'Sahih' is one that is:",
    options: [
      "Weak in chain but good in meaning",
      "Authentic — sound chain and text, free of defect",
      "Narrated by only one companion",
      "Reported without a chain",
    ],
    answer: 1,
    explanation:
      "Sahih means the hadith has a continuous chain of trustworthy, precise narrators, with no hidden defect ('illah) and no contradiction of stronger reports (shadh).",
    source: "Ibn Hajar, Nukhbat al-Fikr",
    sourceArabic: "الصَّحِيحُ مَا اتَّصَلَ سَنَدُهُ بِالْعُدُولِ الضَّابِطِين",
  },
  {
    id: "q7",
    topic: "seerah",
    prompt: "In which year did the Hijrah to Madinah take place?",
    options: ["610 CE", "622 CE", "630 CE", "632 CE"],
    answer: 1,
    explanation:
      "The Hijrah occurred in 622 CE and became year one of the Islamic calendar — marking not merely a migration but the founding of the first Muslim community and state.",
    source: "Ibn Hisham, As-Seerah",
    sourceArabic: "وَهَاجَرَ رَسُولُ اللَّهِ ﷺ إِلَى الْمَدِينَة",
    articleSlug: "night-journey",
  },
  {
    id: "q8",
    topic: "seerah",
    prompt: "During Al-Isra wal-Mi'raj, the Prophet ﷺ travelled from Makkah to:",
    options: [
      "Madinah, then to Jannah",
      "Al-Masjid al-Aqsa, then ascended through the heavens",
      "Ta'if, then to Sinai",
      "Badr, then returned",
    ],
    answer: 1,
    explanation:
      "The night journey took the Prophet ﷺ from Al-Masjid al-Haram to Al-Masjid al-Aqsa, and from there he ascended through the seven heavens, where the five daily prayers were prescribed.",
    source: "Quran 17:1",
    sourceArabic:
      "سُبْحَانَ الَّذِي أَسْرَى بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى",
    articleSlug: "night-journey",
  },
  {
    id: "q9",
    topic: "seerah",
    prompt: "Who was the first person to accept Islam among adult men?",
    options: ["Umar ibn al-Khattab", "Abu Bakr As-Siddiq", "Ali ibn Abi Talib", "Uthman ibn Affan"],
    answer: 1,
    explanation:
      "Abu Bakr رضي الله عنه was the first adult man to embrace Islam, accepting immediately without hesitation — which is why he carries the title As-Siddiq, the truthful affirmer.",
    source: "Ibn Kathir, Al-Bidayah",
    sourceArabic: "أَوَّلُ مَنْ أَسْلَمَ مِنَ الرِّجَالِ أَبُو بَكْر",
  },
  {
    id: "q10",
    topic: "fiqh",
    prompt: "How many pillars does Islam have?",
    options: ["Four", "Five", "Six", "Seven"],
    answer: 1,
    explanation:
      "The five pillars are Shahadah, Salah, Zakat, Sawm of Ramadan, and Hajj. They are the structural framework of a Muslim's practice.",
    source: "Sahih al-Bukhari 8",
    sourceArabic: "بُنِيَ الْإِسْلَامُ عَلَى خَمْس",
    articleSlug: "five-pillars",
  },
  {
    id: "q11",
    topic: "fiqh",
    prompt: "What is the standard rate of Zakat on saved wealth?",
    options: ["1%", "2.5%", "5%", "10%"],
    answer: 1,
    explanation:
      "Zakat on monetary wealth held for a lunar year above the nisab threshold is 2.5%. Different rates apply to crops, livestock, and mined wealth.",
    source: "Sunan Abu Dawud 1572",
    sourceArabic: "فِي كُلِّ أَرْبَعِينَ دِرْهَمًا دِرْهَم",
    articleSlug: "five-pillars",
  },
  {
    id: "q12",
    topic: "fiqh",
    prompt: "Which action invalidates wudu?",
    options: ["Laughing", "Passing wind", "Reciting Quran", "Drinking water"],
    answer: 1,
    explanation:
      "Anything exiting the two passages, including passing wind, nullifies wudu. Eating, drinking, and reciting Quran do not.",
    source: "Sahih al-Bukhari 135",
    sourceArabic: "لَا وُضُوءَ إِلَّا مِنْ صَوْتٍ أَوْ رِيح",
  },
  {
    id: "q13",
    topic: "arabic",
    prompt: "The root ع-ل-م relates to which meaning?",
    arabic: "ع - ل - م",
    options: ["Mercy", "Knowledge", "Patience", "Light"],
    answer: 1,
    explanation:
      "From ع-ل-م come 'ilm (knowledge), 'alim (scholar), ta'lim (teaching), and 'alamin (worlds). Recognising roots multiplies your Quranic vocabulary quickly.",
    source: "Quran 20:114",
    sourceArabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    articleSlug: "quranic-roots",
  },
  {
    id: "q14",
    topic: "arabic",
    prompt: "What does 'Ar-Rahman' emphasise about Allah's mercy?",
    options: [
      "Mercy specific to believers",
      "Vast, all-encompassing mercy",
      "Mercy in the Hereafter only",
      "Mercy earned through deeds",
    ],
    answer: 1,
    explanation:
      "Ar-Rahman is the intensive form denoting mercy vast in scope, covering all creation; Ar-Rahim is the continuous form, denoting mercy sustained especially for the believers.",
    source: "Quran 1:1",
    sourceArabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    articleSlug: "quranic-roots",
  },
  {
    id: "q15",
    topic: "quran",
    prompt: "How many verses are in Surah Al-Fatiha?",
    options: ["Five", "Six", "Seven", "Eight"],
    answer: 2,
    explanation:
      "Al-Fatiha has seven verses and is called Umm al-Kitab, the mother of the Book. It is recited in every unit of every prayer.",
    source: "Quran 15:87",
    sourceArabic: "وَلَقَدْ آتَيْنَاكَ سَبْعًا مِّنَ الْمَثَانِي",
    articleSlug: "fatiha-verse-by-verse",
  },
  {
    id: "q16",
    topic: "quran",
    prompt: "Surah Al-Ikhlas is primarily about:",
    options: ["Prophethood", "The oneness of Allah", "The Day of Judgement", "Charity"],
    answer: 1,
    explanation:
      "Al-Ikhlas declares Allah's absolute oneness and self-sufficiency, negating offspring, parentage, and any equal. The Prophet ﷺ said it equals a third of the Quran in reward.",
    source: "Quran 112:1-4",
    sourceArabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ",
    articleSlug: "meaning-of-al-ikhlas",
  },
  {
    id: "q17",
    topic: "tafsir",
    prompt: "'As-Samad' in Surah Al-Ikhlas is understood to mean:",
    options: [
      "The Creator of all things",
      "The Eternal, self-sufficient One whom all depend upon",
      "The Most Merciful",
      "The Hearer of prayers",
    ],
    answer: 1,
    explanation:
      "Classical mufassirun explain As-Samad as the One free of all need, upon whom every creature depends absolutely — perfect in every attribute without deficiency.",
    source: "Tafsir Ibn Kathir, 112:2",
    sourceArabic: "اللَّهُ الصَّمَدُ",
    articleSlug: "meaning-of-al-ikhlas",
  },
  {
    id: "q18",
    topic: "tafsir",
    prompt: "Surah Al-Fatiha's verse 'Iyyaka na'budu' places the object first to convey:",
    options: [
      "Poetic rhythm only",
      "Exclusivity — You alone do we worship",
      "A question",
      "Past tense",
    ],
    answer: 1,
    explanation:
      "Fronting the object 'Iyyaka' creates hasr — restriction. The meaning is not merely 'we worship You' but 'You alone do we worship', the grammatical heart of Tawhid.",
    source: "Tafsir As-Sa'di, 1:5",
    sourceArabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    articleSlug: "fatiha-verse-by-verse",
  },
  {
    id: "q19",
    topic: "dua",
    prompt: "Which dua did the Prophet ﷺ teach for entering the morning?",
    options: [
      "Allahumma inni as'aluka al-jannah",
      "Asbahna wa asbaha al-mulku lillah",
      "Rabbana atina fid-dunya hasanah",
      "Bismillahi tawakkaltu 'ala Allah",
    ],
    answer: 1,
    explanation:
      "'Asbahna wa asbaha al-mulku lillah' — we have entered the morning and the dominion belongs to Allah — is part of the prophetic morning adhkar, reorienting the day toward Allah at its start.",
    source: "Sahih Muslim 2723",
    sourceArabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّه",
    articleSlug: "duas-daily-life",
  },
  {
    id: "q20",
    topic: "dua",
    prompt: "The dua 'Rabbana atina fid-dunya hasanatan...' asks for:",
    options: [
      "Wealth only",
      "Good in this world and the next, and safety from the Fire",
      "Victory in battle",
      "Knowledge of the unseen",
    ],
    answer: 1,
    explanation:
      "This comprehensive Quranic dua asks for good in both abodes and protection from the Fire — which is why the Prophet ﷺ used it more than any other supplication.",
    source: "Quran 2:201",
    sourceArabic:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    articleSlug: "duas-daily-life",
  },
];

export function questionsFor(topic: TopicId, count: number): Question[] {
  const own = QUESTIONS.filter((q) => q.topic === topic);
  const rest = QUESTIONS.filter((q) => q.topic !== topic);
  const pool = [...own, ...rest];
  const out: Question[] = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  return out.map((q, i) => ({ ...q, id: `${q.id}-${i}` }));
}

export const ASSESSMENT: Question[] = [QUESTIONS[0], QUESTIONS[9], QUESTIONS[14]];

// ── Badges ───────────────────────────────────────────────────────────────
