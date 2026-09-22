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
