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
