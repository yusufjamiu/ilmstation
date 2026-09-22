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
