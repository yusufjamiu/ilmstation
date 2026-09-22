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
