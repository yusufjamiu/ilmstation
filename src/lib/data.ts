// Static IlmStation content. Frontend-only: no backend, no network calls.

export type TopicId =
  | "aqeedah"
  | "hadith"
  | "seerah"
  | "fiqh"
  | "arabic"
  | "quran"
  | "tafsir"
  | "dua";

export interface Topic {
  id: TopicId;
  name: string;
  arabic: string;
  icon: string;
  scope: string;
  premium: boolean;
  questions: number;
  category: "Foundations" | "Text" | "Practice" | "Language";
}

export const TOPICS: Topic[] = [
  {
    id: "aqeedah",
    name: "Aqeedah",
    arabic: "عَقِيدَة",
    icon: "🕌",
    scope: "Core beliefs: Tawhid, Prophets, Angels, Books, Day of Judgement",
    premium: false,
    questions: 148,
    category: "Foundations",
  },
  {
    id: "hadith",
    name: "Hadith",
    arabic: "حَدِيث",
    icon: "📜",
    scope: "40 Hadith of Imam Nawawi; Sahih collections; Hadith sciences",
    premium: false,
    questions: 210,
    category: "Text",
  },
  {
    id: "seerah",
    name: "Seerah",
    arabic: "سِيرَة",
    icon: "🌙",
    scope: "Life of Prophet Muhammad ﷺ from birth to death; Companions",
    premium: false,
    questions: 176,
    category: "Foundations",
  },
  {
    id: "fiqh",
    name: "Fiqh",
    arabic: "فِقْه",
    icon: "⚖️",
    scope: "Islamic jurisprudence: Salah, Zakat, Fasting, Hajj basics",
    premium: false,
    questions: 194,
    category: "Practice",
  },
  {
    id: "arabic",
    name: "Arabic",
    arabic: "عَرَبِيَّة",
    icon: "🔤",
    scope: "Quranic Arabic vocabulary; root words; basmala and common du'as",
    premium: false,
    questions: 132,
    category: "Language",
  },
  {
    id: "quran",
    name: "Quran",
    arabic: "قُرْآن",
    icon: "📖",
    scope: "Tafsir of key surahs; revelation context; memorisation via Hifz",
    premium: false,
    questions: 160,
    category: "Text",
  },
  {
    id: "tafsir",
    name: "Tafsir",
    arabic: "تَفْسِير",
    icon: "🔍",
    scope: "Exegesis of selected verses; themes; historical context",
    premium: true,
    questions: 118,
    category: "Text",
  },
  {
    id: "dua",
    name: "Dua",
    arabic: "دُعَاء",
    icon: "🤲",
    scope: "Morning/evening adhkar; prophetic supplications; contextual duas",
    premium: true,
    questions: 96,
    category: "Practice",
  },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id) ?? TOPICS[0];

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
export interface Badge {
  id: string;
  icon: string;
  name: string;
  arabic: string;
  condition: string;
  description: string;
  xp: number;
  progress: number; // 0..1 for the demo profile
}

export const BADGES: Badge[] = [
  {
    id: "beacon",
    icon: "🕯️",
    name: "Beacon of Hidayah",
    arabic: "مَنَارَةُ الْهِدَايَة",
    condition: "Guided 5 friends",
    description: "Invite 5 friends who complete their first quiz",
    xp: 150,
    progress: 0.6,
  },
  {
    id: "seal",
    icon: "📜",
    name: "Seal of Knowledge",
    arabic: "خَاتَمُ الْعِلْم",
    condition: "Reach 1,000 total points",
    description: "Accumulate 1,000 points across all activities",
    xp: 200,
    progress: 1,
  },
  {
    id: "garden",
    icon: "🌿",
    name: "Garden of Jannah",
    arabic: "رَوْضَةُ الْجَنَّة",
    condition: "7-day Hifz streak",
    description: "Complete a Hifz session every day for 7 days",
    xp: 180,
    progress: 0.43,
  },
  {
    id: "key",
    icon: "🗝️",
    name: "Key to Understanding",
    arabic: "مِفْتَاحُ الْفَهْم",
    condition: "Complete 10 quests",
    description: "Complete 10 full quests on the Quest Map",
    xp: 160,
    progress: 0.3,
  },
  {
    id: "light",
    icon: "💎",
    name: "Light of Iman",
    arabic: "نُورُ الْإِيمَان",
    condition: "Score 100% on 5 quizzes",
    description: "Achieve a perfect score on 5 different quizzes",
    xp: 170,
    progress: 0.4,
  },
  {
    id: "crown",
    icon: "👑",
    name: "Crown of Sabr",
    arabic: "تَاجُ الصَّبْر",
    condition: "30-day login streak",
    description: "Log in and complete one activity every day for 30 days",
    xp: 250,
    progress: 0.4,
  },
  {
    id: "star",
    icon: "🌠",
    name: "Star of Guidance",
    arabic: "نَجْمُ الْهِدَايَة",
    condition: "Complete Prophets quest",
    description: "Finish all 3 stages of the Prophets & Messengers quest",
    xp: 200,
    progress: 0.66,
  },
  {
    id: "insight",
    icon: "🔮",
    name: "Insight of the Wise",
    arabic: "بَصِيرَةُ الْحَكِيم",
    condition: "Win 20 challenges",
    description: "Win 20 head-to-head Challenge duels",
    xp: 200,
    progress: 0.35,
  },
];

// ── Levels ───────────────────────────────────────────────────────────────
export interface Level {
  level: number;
  name: string;
  arabic: string;
  min: number;
  max: number;
  unlocks: string;
}

export const LEVELS: Level[] = [
  {
    level: 1,
    name: "Beginner",
    arabic: "مُبْتَدِئ",
    min: 0,
    max: 199,
    unlocks: "Core quiz topics, Hifz Mode starter surahs",
  },
  {
    level: 2,
    name: "Seeker",
    arabic: "طَالِب",
    min: 200,
    max: 499,
    unlocks: "Challenge Mode, Quest Map access",
  },
  {
    level: 3,
    name: "Student",
    arabic: "مُتَعَلِّم",
    min: 500,
    max: 999,
    unlocks: "Advanced topics, Library full access",
  },
  {
    level: 4,
    name: "Scholar",
    arabic: "عَالِم",
    min: 1000,
    max: 1999,
    unlocks: "Halaqah Mode hosting, IlmBot full history",
  },
  {
    level: 5,
    name: "Guardian",
    arabic: "حَافِظ",
    min: 2000,
    max: 3499,
    unlocks: "Ramadan special quests, custom avatar frames",
  },
  {
    level: 6,
    name: "Sage",
    arabic: "حَكِيم",
    min: 3500,
    max: 5999,
    unlocks: "Create custom challenges, mentor badge",
  },
  {
    level: 7,
    name: "Alim",
    arabic: "عَالِمٌ",
    min: 6000,
    max: Infinity,
    unlocks: "Verified Alim badge, leaderboard Hall of Fame entry",
  },
];

export function levelFor(xp: number): Level {
  return [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
}

// ── Quests ───────────────────────────────────────────────────────────────
export interface Quest {
  id: string;
  chapter: string;
  name: string;
  arabic: string;
  topic: TopicId;
  stages: { name: string; questions: number; multiplier: number }[];
  xp: number;
  badge?: string;
  prereq?: string;
}

export const QUESTS: Quest[] = [
  {
    id: "iman",
    chapter: "Chapter 1 · Foundations",
    name: "The Six Pillars of Iman",
    arabic: "أَرْكَانُ الْإِيمَان",
    topic: "aqeedah",
    stages: [
      { name: "Intro", questions: 6, multiplier: 1 },
      { name: "Core", questions: 9, multiplier: 1.25 },
      { name: "Advanced", questions: 11, multiplier: 1.5 },
    ],
    xp: 240,
  },
  {
    id: "pillars",
    chapter: "Chapter 1 · Foundations",
    name: "The Five Pillars of Islam",
    arabic: "أَرْكَانُ الْإِسْلَام",
    topic: "fiqh",
    stages: [
      { name: "Intro", questions: 5, multiplier: 1 },
      { name: "Core", questions: 8, multiplier: 1.25 },
      { name: "Advanced", questions: 10, multiplier: 1.5 },
    ],
    xp: 220,
    prereq: "iman",
  },
  {
    id: "nawawi",
    chapter: "Chapter 2 · The Prophetic Word",
    name: "The 40 Nawawi — First 10",
    arabic: "الْأَرْبَعُونَ النَّوَوِيَّة",
    topic: "hadith",
    stages: [
      { name: "Intro", questions: 7, multiplier: 1 },
      { name: "Core", questions: 10, multiplier: 1.25 },
      { name: "Advanced", questions: 12, multiplier: 1.5 },
    ],
    xp: 280,
    badge: "seal",
    prereq: "pillars",
  },
  {
    id: "prophets",
    chapter: "Chapter 2 · The Prophetic Word",
    name: "Prophets & Messengers",
    arabic: "الْأَنْبِيَاءُ وَالْمُرْسَلُون",
    topic: "seerah",
    stages: [
      { name: "Intro", questions: 6, multiplier: 1 },
      { name: "Core", questions: 9, multiplier: 1.25 },
      { name: "Advanced", questions: 11, multiplier: 1.5 },
    ],
    xp: 300,
    badge: "star",
    prereq: "nawawi",
  },
  {
    id: "isra",
    chapter: "Chapter 3 · The Night Journey",
    name: "The Night of Al-Isra wal-Mi'raj",
    arabic: "الْإِسْرَاءُ وَالْمِعْرَاج",
    topic: "seerah",
    stages: [
      { name: "Intro", questions: 5, multiplier: 1 },
      { name: "Core", questions: 8, multiplier: 1.25 },
      { name: "Advanced", questions: 10, multiplier: 1.5 },
    ],
    xp: 260,
    prereq: "prophets",
  },
  {
    id: "fatiha",
    chapter: "Chapter 3 · The Night Journey",
    name: "Surah Al-Fatiha — Verse by Verse",
    arabic: "سُورَةُ الْفَاتِحَة",
    topic: "quran",
    stages: [
      { name: "Intro", questions: 6, multiplier: 1 },
      { name: "Core", questions: 9, multiplier: 1.25 },
      { name: "Advanced", questions: 11, multiplier: 1.5 },
    ],
    xp: 250,
    prereq: "isra",
  },
  {
    id: "roots",
    chapter: "Chapter 4 · The Language",
    name: "30 Quranic Root Words",
    arabic: "جُذُورُ الْقُرْآن",
    topic: "arabic",
    stages: [
      { name: "Intro", questions: 7, multiplier: 1 },
      { name: "Core", questions: 10, multiplier: 1.25 },
      { name: "Advanced", questions: 12, multiplier: 1.5 },
    ],
    xp: 270,
    prereq: "fatiha",
  },
  {
    id: "ikhlas",
    chapter: "Chapter 4 · The Language",
    name: "The Meaning of Al-Ikhlas",
    arabic: "مَعْنَى الْإِخْلَاص",
    topic: "tafsir",
    stages: [
      { name: "Intro", questions: 5, multiplier: 1 },
      { name: "Core", questions: 8, multiplier: 1.25 },
      { name: "Advanced", questions: 10, multiplier: 1.5 },
    ],
    xp: 290,
    prereq: "roots",
  },
  {
    id: "adhkar",
    chapter: "Chapter 5 · Daily Practice",
    name: "Duas for Daily Life",
    arabic: "أَدْعِيَةُ الْيَوْم",
    topic: "dua",
    stages: [
      { name: "Intro", questions: 6, multiplier: 1 },
      { name: "Core", questions: 9, multiplier: 1.25 },
      { name: "Advanced", questions: 11, multiplier: 1.5 },
    ],
    xp: 240,
    prereq: "ikhlas",
  },
  {
    id: "sabr",
    chapter: "Chapter 5 · Daily Practice",
    name: "Sabr & Gratitude",
    arabic: "الصَّبْرُ وَالشُّكْر",
    topic: "aqeedah",
    stages: [
      { name: "Intro", questions: 5, multiplier: 1 },
      { name: "Core", questions: 8, multiplier: 1.25 },
      { name: "Advanced", questions: 10, multiplier: 1.5 },
    ],
    xp: 260,
    badge: "key",
    prereq: "adhkar",
  },
];

export const questById = (id: string) => QUESTS.find((q) => q.id === id);

// ── Hifz ─────────────────────────────────────────────────────────────────
export interface Surah {
  num: number;
  name: string;
  arabic: string;
  verses: number;
  juz: number;
  premium: boolean;
}

export const SURAHS: Surah[] = [
  { num: 1, name: "Al-Fatiha", arabic: "الْفَاتِحَة", verses: 7, juz: 1, premium: false },
  { num: 78, name: "An-Naba", arabic: "النَّبَأ", verses: 40, juz: 30, premium: false },
  { num: 93, name: "Ad-Duha", arabic: "الضُّحَى", verses: 11, juz: 30, premium: false },
  { num: 94, name: "Ash-Sharh", arabic: "الشَّرْح", verses: 8, juz: 30, premium: false },
  { num: 97, name: "Al-Qadr", arabic: "الْقَدْر", verses: 5, juz: 30, premium: false },
  { num: 103, name: "Al-Asr", arabic: "الْعَصْر", verses: 3, juz: 30, premium: false },
  { num: 108, name: "Al-Kawthar", arabic: "الْكَوْثَر", verses: 3, juz: 30, premium: false },
  { num: 112, name: "Al-Ikhlas", arabic: "الْإِخْلَاص", verses: 4, juz: 30, premium: false },
  { num: 113, name: "Al-Falaq", arabic: "الْفَلَق", verses: 5, juz: 30, premium: false },
  { num: 114, name: "An-Nas", arabic: "النَّاس", verses: 6, juz: 30, premium: false },
  { num: 2, name: "Al-Baqarah", arabic: "الْبَقَرَة", verses: 286, juz: 1, premium: true },
  { num: 18, name: "Al-Kahf", arabic: "الْكَهْف", verses: 110, juz: 15, premium: true },
  { num: 36, name: "Ya-Sin", arabic: "يٰس", verses: 83, juz: 22, premium: true },
  { num: 55, name: "Ar-Rahman", arabic: "الرَّحْمٰن", verses: 78, juz: 27, premium: true },
];

export interface Verse {
  n: number;
  arabic: string;
  translit: string;
  translation: string;
}

export const VERSES: Record<number, Verse[]> = {
  1: [
    {
      n: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translit: "Bismillahir-Rahmanir-Rahim",
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    },
    {
      n: 2,
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      translit: "Alhamdu lillahi Rabbil-'alamin",
      translation: "All praise is due to Allah, Lord of the worlds.",
    },
    {
      n: 3,
      arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
      translit: "Ar-Rahmanir-Rahim",
      translation: "The Entirely Merciful, the Especially Merciful.",
    },
    {
      n: 4,
      arabic: "مَالِكِ يَوْمِ الدِّينِ",
      translit: "Maliki yawmid-din",
      translation: "Sovereign of the Day of Recompense.",
    },
    {
      n: 5,
      arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translit: "Iyyaka na'budu wa iyyaka nasta'in",
      translation: "You alone we worship, and You alone we ask for help.",
    },
    {
      n: 6,
      arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      translit: "Ihdinas-siratal-mustaqim",
      translation: "Guide us to the straight path.",
    },
    {
      n: 7,
      arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      translit: "Siratal-ladhina an'amta 'alayhim ghayril-maghdubi 'alayhim wa lad-dallin",
      translation:
        "The path of those upon whom You have bestowed favour, not of those who earned anger, nor of those who went astray.",
    },
  ],
  112: [
    {
      n: 1,
      arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      translit: "Qul huwa Allahu ahad",
      translation: "Say: He is Allah, the One.",
    },
    {
      n: 2,
      arabic: "اللَّهُ الصَّمَدُ",
      translit: "Allahus-samad",
      translation: "Allah, the Eternal, Absolute.",
    },
    {
      n: 3,
      arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
      translit: "Lam yalid wa lam yulad",
      translation: "He neither begets nor is born.",
    },
    {
      n: 4,
      arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
      translit: "Wa lam yakun lahu kufuwan ahad",
      translation: "And there is none comparable to Him.",
    },
  ],
  103: [
    {
      n: 1,
      arabic: "وَالْعَصْرِ",
      translit: "Wal-'asr",
      translation: "By time.",
    },
    {
      n: 2,
      arabic: "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ",
      translit: "Innal-insana lafi khusr",
      translation: "Indeed mankind is in loss.",
    },
    {
      n: 3,
      arabic:
        "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
      translit: "Illal-ladhina amanu wa 'amilus-salihati wa tawasaw bil-haqqi wa tawasaw bis-sabr",
      translation:
        "Except those who believe, do righteous deeds, enjoin truth upon one another, and enjoin patience.",
    },
  ],
};

export function versesFor(surah: number): Verse[] {
  return VERSES[surah] ?? VERSES[112];
}

export const TAJWEED_RULES = [
  { name: "Ikhfa", arabic: "إِخْفَاء", color: "#F5C842", note: "Hidden nasal sound" },
  { name: "Idgham", arabic: "إِدْغَام", color: "#2A7A50", note: "Merging of letters" },
  { name: "Iqlab", arabic: "إِقْلَاب", color: "#FFB3B3", note: "Nun becomes meem" },
  { name: "Izhar", arabic: "إِظْهَار", color: "#5B8DEF", note: "Clear pronunciation" },
  { name: "Madd", arabic: "مَدّ", color: "#C77DFF", note: "Elongation" },
];

// ── Library ──────────────────────────────────────────────────────────────
export interface Article {
  slug: string;
  title: string;
  arabic: string;
  topic: TopicId;
  minutes: number;
  excerpt: string;
  featured?: boolean;
  body: { heading?: string; text?: string; arabic?: string; translation?: string }[];
}

export const ARTICLES: Article[] = [
  {
    slug: "six-pillars-of-iman",
    title: "The Six Pillars of Iman",
    arabic: "أَرْكَانُ الْإِيمَان",
    topic: "aqeedah",
    minutes: 6,
    featured: true,
    excerpt:
      "Faith in Islam is not a vague feeling — it has a defined structure of six articles the Prophet ﷺ named explicitly.",
    body: [
      {
        text: "When Jibril عليه السلام came to the Prophet ﷺ in the form of a man and asked him about Iman, the answer was not abstract. It was a list. Six things, named in order, that together define what it means for a Muslim to believe.",
      },
      {
        arabic: "أَنْ تُؤْمِنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الْآخِرِ وَتُؤْمِنَ بِالْقَدَرِ",
        translation:
          "That you believe in Allah, His angels, His books, His messengers, the Last Day, and that you believe in divine decree.",
      },
      {
        heading: "1. Belief in Allah",
        text: "This is belief in His existence, His lordship, His exclusive right to worship, and His names and attributes as He described them — without distortion, denial, or comparison to creation.",
      },
      {
        heading: "2. Belief in the Angels",
        text: "Angels are created from light, they do not disobey, and they carry out specific commands. Jibril conveys revelation, Mika'il is charged with rain and provision, Israfil will blow the horn.",
      },
      {
        heading: "3. Belief in the Books",
        text: "The Tawrah, Zabur, Injil, the scrolls of Ibrahim, and the Quran — which confirms and completes what came before it and is preserved from alteration.",
      },
      {
        heading: "4. Belief in the Messengers",
        text: "Every nation received a warner. We affirm them all and do not distinguish between them in belief, while affirming Muhammad ﷺ as the final messenger.",
      },
      {
        heading: "5. Belief in the Last Day",
        text: "Resurrection, the reckoning, the scale, the bridge, Jannah and Jahannam. This belief is what converts private conviction into daily accountability.",
      },
      {
        heading: "6. Belief in Divine Decree",
        text: "Allah knows, has written, wills, and creates all that occurs — and the human being still acts by genuine choice and is answerable for it. Holding both truths together is the mark of sound Aqeedah.",
      },
    ],
  },
  {
    slug: "understanding-tawhid",
    title: "Understanding Tawhid",
    arabic: "التَّوْحِيد",
    topic: "aqeedah",
    minutes: 7,
    excerpt:
      "The three categories of Tawhid, and why the second one is where most of humanity historically stumbled.",
    body: [
      {
        text: "Scholars organised Tawhid into three categories not to invent doctrine, but to teach it clearly. Each category answers a different question about the relationship between Allah and creation.",
      },
      {
        heading: "Tawhid ar-Rububiyyah",
        text: "Allah alone creates, sustains, gives life and death, and controls the affairs of the universe. Even the pagans of Makkah largely affirmed this — which is exactly why it was never sufficient on its own.",
      },
      {
        arabic: "قُلْ مَن يَرْزُقُكُم مِّنَ السَّمَاءِ وَالْأَرْضِ",
        translation: "Say: Who provides for you from the heaven and the earth?",
      },
      {
        heading: "Tawhid al-Uluhiyyah",
        text: "Worship belongs to Allah alone. Prayer, supplication, vows, sacrifice, hope, fear, reliance — directing any of these to another is the shirk the messengers were sent to dismantle.",
      },
      {
        heading: "Tawhid al-Asma was-Sifat",
        text: "We affirm the names and attributes Allah affirmed for Himself, in the manner befitting Him, without likening Him to creation and without denying what He affirmed.",
      },
    ],
  },
  {
    slug: "nawawi-first-ten",
    title: "The 40 Nawawi: First Ten",
    arabic: "الْأَرْبَعُونَ النَّوَوِيَّة",
    topic: "hadith",
    minutes: 9,
    featured: true,
    excerpt:
      "Imam Nawawi's collection opens with intention and closes the first ten with lawful earning. The sequencing is not accidental.",
    body: [
      {
        text: "Imam an-Nawawi selected forty hadith that between them cover the foundations of religion, worship, character, and law. The first ten alone would reform a life if internalised.",
      },
      {
        arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        translation:
          "Deeds are only by intention, and every person will have only what they intended.",
      },
      {
        heading: "Why intention comes first",
        text: "Because a deed without intention is motion without meaning, and an intention without sincerity is a transaction with the wrong party. Nawawi placed it first so that every hadith after it is read through it.",
      },
      {
        heading: "The hadith of Jibril",
        text: "The second and third hadith establish Islam, Iman, and Ihsan as three ascending levels — outward submission, inner conviction, and worship as though you see Him.",
      },
      {
        heading: "Lawful earning",
        text: "The tenth hadith states that Allah is pure and accepts only what is pure — tying spiritual acceptance directly to how a Muslim earns and eats.",
      },
    ],
  },
  {
    slug: "night-journey",
    title: "The Night Journey",
    arabic: "الْإِسْرَاءُ وَالْمِعْرَاج",
    topic: "seerah",
    minutes: 8,
    excerpt:
      "After the hardest year of his life, the Prophet ﷺ was taken by night from Makkah to Jerusalem and through the heavens.",
    body: [
      {
        text: "The year before the Hijrah was the Prophet's ﷺ hardest: Khadijah رضي الله عنها had died, Abu Talib had died, and Ta'if had rejected him. It was precisely then that Allah honoured him with Al-Isra wal-Mi'raj.",
      },
      {
        arabic: "سُبْحَانَ الَّذِي أَسْرَى بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى",
        translation:
          "Glory be to the One who took His servant by night from the Sacred Mosque to the Farthest Mosque.",
      },
      {
        heading: "The prayer was prescribed",
        text: "During the ascent, fifty daily prayers were prescribed and reduced to five, with the reward of fifty retained. The prayer is therefore the one obligation given directly above the heavens, not through Jibril on earth.",
      },
      {
        heading: "Abu Bakr's certainty",
        text: "When Makkah mocked the account, Abu Bakr رضي الله عنه said: if he said it, he told the truth. That response earned him the title As-Siddiq.",
      },
    ],
  },
  {
    slug: "five-pillars",
    title: "The Five Pillars of Islam",
    arabic: "أَرْكَانُ الْإِسْلَام",
    topic: "fiqh",
    minutes: 5,
    excerpt: "Shahadah, Salah, Zakat, Sawm, Hajj — the load-bearing structure of Muslim practice.",
    body: [
      {
        text: "The Prophet ﷺ used the image of a building: Islam is built upon five. Remove one and the structure is compromised.",
      },
      {
        arabic: "بُنِيَ الْإِسْلَامُ عَلَى خَمْسٍ",
        translation: "Islam is built upon five.",
      },
      {
        heading: "Shahadah",
        text: "The testimony that there is no deity worthy of worship except Allah and that Muhammad is His messenger — the doorway and the standard for everything else.",
      },
      {
        heading: "Salah",
        text: "Five daily prayers at appointed times, structuring the day around remembrance rather than fitting remembrance around the day.",
      },
      {
        heading: "Zakat",
        text: "2.5% of qualifying saved wealth annually, transferred as a right of the poor, not a favour from the rich.",
      },
      {
        heading: "Sawm",
        text: "Fasting Ramadan from dawn to sunset — training in restraint, empathy, and God-consciousness.",
      },
      {
        heading: "Hajj",
        text: "The pilgrimage to Makkah once in a lifetime for those with the means and ability.",
      },
    ],
  },
  {
    slug: "quranic-roots",
    title: "30 Quranic Root Words",
    arabic: "جُذُورُ الْقُرْآن",
    topic: "arabic",
    minutes: 10,
    excerpt:
      "Learn roots, not words. A handful of three-letter roots unlocks a large fraction of Quranic vocabulary.",
    body: [
      {
        text: "Arabic is built on roots. From a single three-letter root, dozens of related words are derived along predictable patterns. Learning fifty roots gets you further than learning five hundred isolated words.",
      },
      {
        arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
        translation: "And say: My Lord, increase me in knowledge.",
      },
      {
        heading: "ع-ل-م — knowledge",
        text: "'ilm (knowledge), 'alim (scholar), ta'lim (instruction), ma'lum (known), 'alamin (worlds).",
      },
      {
        heading: "ك-ت-ب — writing",
        text: "kitab (book), katib (writer), maktub (written/decreed), maktabah (library).",
      },
      {
        heading: "ر-ح-م — mercy",
        text: "Rahman, Rahim, rahmah (mercy), marham, and rahim (womb) — mercy and kinship share a root.",
      },
      {
        heading: "س-ل-م — peace and submission",
        text: "Islam, Muslim, salam, sallama, saleem — safety through submission.",
      },
    ],
  },
  {
    slug: "fatiha-verse-by-verse",
    title: "Surah Al-Fatiha, Verse by Verse",
    arabic: "سُورَةُ الْفَاتِحَة",
    topic: "quran",
    minutes: 8,
    featured: true,
    excerpt:
      "Seven verses recited in every unit of every prayer. Here is what each one is actually doing.",
    body: [
      {
        text: "Al-Fatiha is a conversation. The first three verses are praise, the fourth is the turning point, and the last three are the request — the most important request a human being can make.",
      },
      {
        arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        translation: "You alone we worship, and You alone we ask for help.",
      },
      {
        heading: "The hinge verse",
        text: "Verse five is where the surah pivots from speaking about Allah to speaking to Him. The fronting of 'Iyyaka' makes the meaning exclusive: You alone.",
      },
      {
        heading: "The request",
        text: "Guidance to the straight path — and then a definition of that path by the company you keep on it: those favoured, not those who earned anger, not those astray.",
      },
    ],
  },
  {
    slug: "meaning-of-al-ikhlas",
    title: "The Meaning of Al-Ikhlas",
    arabic: "مَعْنَى الْإِخْلَاص",
    topic: "tafsir",
    minutes: 6,
    excerpt: "Four verses the Prophet ﷺ said equal a third of the Quran. Why?",
    body: [
      {
        text: "Al-Ikhlas contains no command, no story, and no law. It is pure description of Allah — which is why scholars said it equals a third of the Quran: the Quran's themes are Tawhid, law, and narrative, and this surah exhausts the first.",
      },
      {
        arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ",
        translation: "Say: He is Allah, the One. Allah, the Eternal, Absolute.",
      },
      {
        heading: "Ahad, not wahid",
        text: "Ahad denotes a oneness that admits no division or plurality at all — not merely one in number but unique in being.",
      },
      {
        heading: "As-Samad",
        text: "The One free of every need, upon whom all creation depends — perfect in every attribute, deficient in none.",
      },
    ],
  },
  {
    slug: "duas-daily-life",
    title: "Duas for Daily Life",
    arabic: "أَدْعِيَةُ الْيَوْم",
    topic: "dua",
    minutes: 5,
    excerpt: "The prophetic supplications that mark waking, eating, leaving home, and sleeping.",
    body: [
      {
        text: "The sunnah covers the whole day with short supplications. None of them is long. Together they turn ordinary routine into continuous remembrance.",
      },
      {
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
        translation: "We have entered the morning and the dominion belongs to Allah.",
      },
      {
        heading: "Leaving the house",
        text: "Bismillah, tawakkaltu 'ala Allah, wa la hawla wa la quwwata illa billah — in the name of Allah, I rely on Allah, there is no power except by Allah.",
      },
      {
        heading: "Before sleep",
        text: "Recite Ayat al-Kursi, the three final surahs, and say: Bismika Allahumma amutu wa ahya.",
      },
    ],
  },
  {
    slug: "sabr-and-shukr",
    title: "Sabr & Shukr: Two Halves of Iman",
    arabic: "الصَّبْرُ وَالشُّكْر",
    topic: "aqeedah",
    minutes: 7,
    excerpt: "Patience in hardship, gratitude in ease — and why the believer profits either way.",
    body: [
      {
        text: "The Prophet ﷺ described the believer's situation as entirely advantageous: given ease, they are grateful and that is good for them; given hardship, they are patient and that is good for them.",
      },
      {
        arabic: "عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْر",
        translation: "How wonderful is the affair of the believer — all of it is good.",
      },
      {
        heading: "Sabr is active",
        text: "Patience is not passivity. It is restraining the tongue from complaint, the limbs from despair, and the heart from resentment while still striving.",
      },
      {
        heading: "Shukr is structural",
        text: "Gratitude is expressed with the tongue, the heart, and the limbs — using the blessing in the way its Giver intended.",
      },
    ],
  },
];

export const articleBySlug = (slug: string) => ARTICLES.find((a) => a.slug === slug);

// ── Daily Wisdom ─────────────────────────────────────────────────────────
export interface Wisdom {
  id: number;
  kind: "Hadith" | "Ayah";
  arabic: string;
  translit: string;
  translation: string;
  source: string;
  date: string;
}

export const WISDOM: Wisdom[] = [
  {
    id: 97,
    kind: "Hadith",
    arabic: "مَنْ سَلَكَ طَرِيقًا يَطْلُبُ فِيهِ عِلْمًا سَلَكَ اللَّهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    translit: "Man salaka tariqan yatlubu fihi 'ilman salaka Allahu bihi tariqan ilal-jannah",
    translation:
      "Whoever travels a path in search of knowledge, Allah will place them on a path to Paradise.",
    source: "Sunan at-Tirmidhi 2646",
    date: "Today",
  },
  {
    id: 96,
    kind: "Ayah",
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    translit: "Wa qul Rabbi zidni 'ilma",
    translation: "And say: My Lord, increase me in knowledge.",
    source: "Quran 20:114",
    date: "Yesterday",
  },
  {
    id: 95,
    kind: "Hadith",
    arabic: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
    translit: "Ahabbul-a'mali ilallahi adwamuha wa in qall",
    translation: "The deeds most beloved to Allah are the most consistent, even if small.",
    source: "Sahih al-Bukhari 6464",
    date: "2 days ago",
  },
  {
    id: 94,
    kind: "Ayah",
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translit: "Inna ma'al-'usri yusra",
    translation: "Indeed, with hardship comes ease.",
    source: "Quran 94:6",
    date: "3 days ago",
  },
  {
    id: 93,
    kind: "Hadith",
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    translit: "Al-muslimu man salimal-muslimuna min lisanihi wa yadih",
    translation: "The Muslim is one from whose tongue and hand other Muslims are safe.",
    source: "Sahih al-Bukhari 10",
    date: "4 days ago",
  },
  {
    id: 92,
    kind: "Ayah",
    arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    translit: "Wa man yattaqillaha yaj'al lahu makhraja",
    translation: "Whoever is conscious of Allah, He will make a way out for them.",
    source: "Quran 65:2",
    date: "5 days ago",
  },
];

// ── Social ───────────────────────────────────────────────────────────────
export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  topics: TopicId[];
  h2h: { wins: number; losses: number };
  mutual: number;
  online: boolean;
}

export const FRIENDS: Friend[] = [
  {
    id: "amina",
    name: "Amina Bello",
    username: "@amina.b",
    avatar: "🧕",
    level: 4,
    xp: 1420,
    streak: 23,
    topics: ["seerah", "hadith", "dua"],
    h2h: { wins: 7, losses: 4 },
    mutual: 12,
    online: true,
  },
  {
    id: "hassan",
    name: "Hassan Yusuf",
    username: "@hassan.dev",
    avatar: "🧑🏽",
    level: 5,
    xp: 2380,
    streak: 41,
    topics: ["quran", "arabic", "tafsir"],
    h2h: { wins: 3, losses: 9 },
    mutual: 8,
    online: true,
  },
  {
    id: "khalid",
    name: "Umm Khalid",
    username: "@ummkhalid",
    avatar: "👩🏻",
    level: 3,
    xp: 820,
    streak: 12,
    topics: ["fiqh", "dua", "aqeedah"],
    h2h: { wins: 5, losses: 5 },
    mutual: 4,
    online: false,
  },
  {
    id: "ibrahim",
    name: "Ibrahim Sani",
    username: "@ibro",
    avatar: "🧔🏽",
    level: 2,
    xp: 460,
    streak: 6,
    topics: ["aqeedah", "seerah"],
    h2h: { wins: 2, losses: 1 },
    mutual: 15,
    online: false,
  },
  {
    id: "maryam",
    name: "Maryam Diallo",
    username: "@maryam.d",
    avatar: "👩🏾",
    level: 6,
    xp: 4100,
    streak: 67,
    topics: ["hadith", "tafsir", "quran"],
    h2h: { wins: 1, losses: 6 },
    mutual: 6,
    online: true,
  },
  {
    id: "yaseen",
    name: "Yaseen Rahman",
    username: "@yaseen",
    avatar: "👨🏽",
    level: 3,
    xp: 940,
    streak: 9,
    topics: ["arabic", "fiqh"],
    h2h: { wins: 4, losses: 3 },
    mutual: 3,
    online: false,
  },
];

export const friendById = (id: string) => FRIENDS.find((f) => f.id === id);

export const SUGGESTED = [
  { id: "s1", name: "Zainab Okoro", username: "@zainab.o", avatar: "🧕🏾", shared: "Seerah, Hadith" },
  { id: "s2", name: "Bilal Ahmad", username: "@bilal", avatar: "🧑🏻", shared: "Quran, Arabic" },
  { id: "s3", name: "Safiyya Nur", username: "@safiyya", avatar: "👩🏽", shared: "Fiqh, Dua" },
  { id: "s4", name: "Musa Kamara", username: "@musa.k", avatar: "👨🏿", shared: "Aqeedah" },
];

export const PENDING_REQUESTS = [
  { id: "p1", name: "Fatima Adewale", username: "@fatima.a", avatar: "🧕🏿", mutual: 5 },
  { id: "p2", name: "Idris Bello", username: "@idris", avatar: "🧑🏾", mutual: 2 },
];

export interface LeaderRow {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  friend: boolean;
}

export const GLOBAL_LEADERBOARD: LeaderRow[] = [
  { id: "g1", name: "Maryam Diallo", avatar: "👩🏾", xp: 4100, level: 6, streak: 67, friend: true },
  { id: "g2", name: "Omar Haddad", avatar: "🧔🏻", xp: 3890, level: 6, streak: 52, friend: false },
  { id: "g3", name: "Hassan Yusuf", avatar: "🧑🏽", xp: 2380, level: 5, streak: 41, friend: true },
  { id: "g4", name: "Nadia Farouk", avatar: "🧕", xp: 2110, level: 5, streak: 33, friend: false },
  { id: "g5", name: "Amina Bello", avatar: "🧕", xp: 1420, level: 4, streak: 23, friend: true },
  { id: "g6", name: "Yaseen Rahman", avatar: "👨🏽", xp: 940, level: 3, streak: 9, friend: true },
  { id: "g7", name: "Umm Khalid", avatar: "👩🏻", xp: 820, level: 3, streak: 12, friend: true },
  { id: "g8", name: "Ibrahim Sani", avatar: "🧔🏽", xp: 460, level: 2, streak: 6, friend: true },
  { id: "g9", name: "Sumayya Ali", avatar: "🧕🏽", xp: 390, level: 2, streak: 4, friend: false },
];

export const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "ur", label: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "ms", label: "Bahasa Melayu", native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "fr", label: "Français", native: "Français", flag: "🇫🇷" },
  { code: "ha", label: "Hausa", native: "Hausa", flag: "🇳🇬" },
];

export const AVATARS = ["🧕", "🧑🏽", "🧔🏽", "👩🏾", "👨🏿", "🧕🏻", "🧑🏻", "👩🏽"];

export const ZONES = [
  {
    id: "zone1",
    range: "13 – 17",
    label: "Young Muslim",
    icon: "🌱",
    blurb: "Earn badges, compete with friends, and look knowledgeable.",
  },
  {
    id: "zone2",
    range: "18 – 25",
    label: "University / New Adult",
    icon: "🎓",
    blurb: "Build Islamic knowledge independently and hold your identity.",
  },
  {
    id: "zone3",
    range: "26 – 35",
    label: "Young Parent / Professional",
    icon: "🏡",
    blurb: "Learn alongside your children and keep Deen in a busy life.",
  },
];

export const STORE_ITEMS = [
  {
    id: "sadaqah",
    icon: "🤲",
    name: "Sadaqah Donation",
    cost: 500,
    unit: "= $1 donated",
    note: "Donate to a vetted Islamic charity. Minimum 500 pts, no cap.",
    flagship: true,
  },
  {
    id: "freeze",
    icon: "🧊",
    name: "Streak Freeze",
    cost: 100,
    unit: "one missed day",
    note: "Protects your streak for one day. Max 2 per week.",
  },
  {
    id: "premium-week",
    icon: "⚡",
    name: "Premium Week",
    cost: 700,
    unit: "7 days",
    note: "Full Premium access trial for Free users.",
  },
  {
    id: "gift",
    icon: "🎁",
    name: "Gift Premium",
    cost: 1500,
    unit: "1 month",
    note: "Send a month of Premium to any friend.",
  },
  {
    id: "topic-pack",
    icon: "🔓",
    name: "Topic Pack (Advanced)",
    cost: 500,
    unit: "1 topic",
    note: "Unlocks one advanced topic permanently.",
  },
];

export const CHARITIES = [
  { id: "c1", name: "Islamic Relief — Water Wells", icon: "💧" },
  { id: "c2", name: "Orphan Sponsorship Fund", icon: "🧒" },
  { id: "c3", name: "Masjid Building Project", icon: "🕌" },
  { id: "c4", name: "Quran Distribution", icon: "📖" },
];

export const SHARE_THEMES = [
  { id: "yellow", name: "Yellow Ink", bg: "var(--yellow)", fg: "oklch(0.218 0 89.9)" },
  { id: "green", name: "Forest", bg: "var(--green)", fg: "oklch(1 0 89.9)" },
  { id: "ink", name: "Midnight", bg: "oklch(0.218 0 89.9)", fg: "oklch(0.946 0 89.9)" },
  { id: "pink", name: "Rose", bg: "var(--pink)", fg: "oklch(0.218 0 89.9)" },
  { id: "paper", name: "Paper", bg: "var(--field)", fg: "oklch(0.218 0 89.9)" },
];

export const IQ_TOPIC_PERF: { topic: string; pct: number }[] = [
  { topic: "Aqeedah", pct: 88 },
  { topic: "Hadith", pct: 82 },
  { topic: "Seerah", pct: 75 },
  { topic: "Fiqh", pct: 62 },
];

export const ILMBOT_SUGGESTIONS = [
  "What are the conditions of a valid Salah?",
  "Explain the difference between Zakat and Sadaqah",
  "Who compiled Sahih al-Bukhari and when?",
  "What does 'Bismillah' mean word by word?",
  "How do I start memorising Quran consistently?",
];

export const ILMBOT_ANSWERS: { match: string[]; text: string; source: string }[] = [
  {
    match: ["salah", "prayer", "pray"],
    text: "A valid Salah requires: being in a state of purity (wudu), covering the 'awrah, facing the qiblah, praying within the appointed time window, and having the intention. Inside the prayer, the pillars include the opening takbir, standing, reciting Al-Fatiha, ruku', sujud, sitting, and the final tasleem. Missing a pillar invalidates the prayer; missing a wajib requires the forgetfulness prostration.",
    source: "Fiqh as-Sunnah; Sahih al-Bukhari 757",
  },
  {
    match: ["zakat", "sadaqah", "charity"],
    text: "Zakat is obligatory, fixed at 2.5% of qualifying wealth held for a lunar year above the nisab, and payable to eight categories named in Surah At-Tawbah 9:60. Sadaqah is voluntary, unlimited in amount, and may be given to anyone in any form — including a kind word or removing harm from a path.",
    source: "Quran 9:60; Sahih Muslim 1009",
  },
  {
    match: ["bukhari", "hadith", "compiled"],
    text: "Imam Muhammad ibn Isma'il al-Bukhari (194–256 AH) compiled Sahih al-Bukhari over roughly sixteen years, selecting about 7,275 narrations (around 2,600 without repetition) from a pool he reported as near 600,000. He applied strict conditions of continuous chain and contemporaneity between narrators.",
    source: "Ibn Hajar, Hadyu as-Sari",
  },
  {
    match: ["bismillah", "meaning", "word"],
    text: "Bi-smi-llah: 'bi' is a preposition meaning 'with' or 'in', 'ism' means name, 'Allah' is the proper name of God. Ar-Rahman is the intensive form of mercy — vast and encompassing all creation; Ar-Rahim is the sustained form — mercy specifically continuing toward the believers.",
    source: "Tafsir Ibn Kathir, 1:1",
  },
  {
    match: ["memoris", "memoriz", "hifz", "quran"],
    text: "Consistency beats volume. Pick a fixed time daily (after Fajr is ideal), memorise a small portion — even three lines — and never move on until yesterday's portion is secure. Recite to a teacher or partner, use one mushaf layout permanently so page positions anchor memory, and review far more than you memorise.",
    source: "Prophetic principle: Sahih al-Bukhari 6464",
  },
  {
    match: ["halal", "haram", "ruling", "divorce", "inherit"],
    text: "This touches a specific fiqh ruling that depends on your circumstances and school of thought. IlmStation is not a fatwa service — please bring this to a qualified scholar or your local imam who can ask the necessary follow-up questions. I can still explain the general principles and the evidences scholars work from, if that would help.",
    source: "IlmBot scholarly-referral policy",
  },
];

export const NOTIFICATIONS_SEED = [
  {
    id: "n1",
    kind: "challenge" as const,
    icon: "⚔️",
    title: "Hassan challenged you",
    body: "Hadith · 10 rounds · expires in 22h",
    time: "12m",
    unread: true,
    action: "challenge",
  },
  {
    id: "n2",
    kind: "badge" as const,
    icon: "📜",
    title: "Badge unlocked: Seal of Knowledge",
    body: "You crossed 1,000 total points. +200 XP",
    time: "2h",
    unread: true,
    action: "achievements",
  },
  {
    id: "n3",
    kind: "friend" as const,
    icon: "🔥",
    title: "Maryam hit a 67-day streak",
    body: "She's ranked #1 on the global leaderboard",
    time: "5h",
    unread: false,
    action: "leaderboard",
  },
  {
    id: "n4",
    kind: "reminder" as const,
    icon: "⏰",
    title: "Your streak needs today's quest",
    body: "Complete one activity to keep 12 days alive",
    time: "8h",
    unread: false,
    action: "home",
  },
  {
    id: "n5",
    kind: "friend" as const,
    icon: "👋",
    title: "Fatima sent a friend request",
    body: "5 mutual friends",
    time: "1d",
    unread: false,
    action: "friends",
  },
];

export const HALAQAH_BOTS = [
  { id: "b1", name: "Amina", avatar: "🧕" },
  { id: "b2", name: "Hassan", avatar: "🧑🏽" },
  { id: "b3", name: "Ibrahim", avatar: "🧔🏽" },
  { id: "b4", name: "Maryam", avatar: "👩🏾" },
  { id: "b5", name: "Yaseen", avatar: "👨🏽" },
];

export const RAMADAN_QUESTS = [
  { day: 1, name: "Taqwa: The Purpose of Fasting", theme: "Taqwa", xp: 90 },
  { day: 2, name: "The Night Prayer of Ramadan", theme: "Qiyam", xp: 90 },
  { day: 3, name: "Sadaqah in the Blessed Month", theme: "Sadaqah", xp: 90 },
  { day: 4, name: "The Month of the Quran", theme: "Quran", xp: 90 },
  { day: 5, name: "Gratitude at the Table", theme: "Gratitude", xp: 90 },
  { day: 6, name: "Guarding the Tongue While Fasting", theme: "Taqwa", xp: 90 },
  { day: 7, name: "Laylatul Qadr: Searching the Nights", theme: "Qiyam", xp: 110 },
];
