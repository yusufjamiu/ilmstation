/* Kids progression: difficulty levels + the eight-badge journey.
   Badges are earned, never ranked against other children. */

export type Difficulty = "gentle" | "steady" | "challenge";

export type DifficultyConfig = {
  id: Difficulty;
  name: string;
  blurb: string;
  forAges: string;
  questions: number;
  starsPerCorrect: number;
  hints: boolean;
};

export const difficulties: DifficultyConfig[] = [
  { id: "gentle", name: "Gentle", blurb: "Short quests, picture cues, lots of encouragement.", forAges: "Best for 3–6", questions: 2, starsPerCorrect: 4, hints: true },
  { id: "steady", name: "Steady", blurb: "Balanced quests with a little recall and reflection.", forAges: "Best for 7–10", questions: 3, starsPerCorrect: 5, hints: true },
  { id: "challenge", name: "Challenge", blurb: "Longer quests, no hints, deeper questions.", forAges: "Best for 11–15", questions: 4, starsPerCorrect: 7, hints: false },
];

export const difficultyFor = (d: Difficulty): DifficultyConfig =>
  difficulties.find((x) => x.id === d) ?? difficulties[1]!;

export const suggestedDifficulty = (age: number): Difficulty =>
  age <= 6 ? "gentle" : age <= 10 ? "steady" : "challenge";

/* --------------------------------- Badges --------------------------------- */

export type Stage = "Seeking" | "Growing" | "Deepening" | "Mastery";

export type Badge = {
  id: string;
  name: string;
  stage: Stage;
  points: number;              // points threshold
  streak?: number;             // consistency criterion (days)
  mastery?: number;            // quests passed first try
  kindness?: number;           // positive engagement acts
  meaning: string;             // why it matters, for the learner
  criteria: string;            // plain wording for the guardian
};

/* Adult / main account journey — the eight named badges. */
export const adultBadges: Badge[] = [
  { id: "hidayah", name: "Beacon of Hidayah", stage: "Seeking", points: 50, meaning: "Your very first steps on the path.", criteria: "50 points from any quests." },
  { id: "understanding", name: "Key of Understanding", stage: "Seeking", points: 150, mastery: 5, meaning: "You unlocked your first ideas.", criteria: "150 points and 5 quests passed first try." },
  { id: "garden", name: "Garden of Ilm", stage: "Growing", points: 300, streak: 7, meaning: "Knowledge you water every day.", criteria: "300 points and a 7-day learning streak." },
  { id: "ihsan", name: "Star of Ihsan", stage: "Growing", points: 500, kindness: 10, meaning: "Doing things beautifully, even when no one sees.", criteria: "500 points and 10 kind acts in circles or with family." },
  { id: "yaqeen", name: "Light of Yaqeen", stage: "Deepening", points: 800, streak: 14, meaning: "Certainty that grows with steady effort.", criteria: "800 points and a 14-day streak." },
  { id: "basirah", name: "Eye of Basirah", stage: "Deepening", points: 1200, mastery: 30, meaning: "Seeing the meaning behind what you learn.", criteria: "1,200 points and 30 quests passed first try." },
  { id: "seal", name: "Seal of Knowledge", stage: "Mastery", points: 1700, mastery: 50, meaning: "What you learned is truly yours now.", criteria: "1,700 points and 50 quests passed first try." },
  { id: "taqwa", name: "Crown of Taqwa", stage: "Mastery", points: 2500, streak: 30, kindness: 30, meaning: "Knowledge carried with care and good character.", criteria: "2,500 points, a 30-day streak, and 30 kind acts." },
];

/* Kids journey — five gentler badges, same spirit, child-sized thresholds. */
export const kidBadges: Badge[] = [
  { id: "seed", name: "Seed of Ilm", stage: "Seeking", points: 50, meaning: "Your very first steps on the path.", criteria: "50 points from any quests." },
  { id: "lantern", name: "Lantern of Hidayah", stage: "Seeking", points: 150, mastery: 5, meaning: "You are lighting your own way.", criteria: "150 points and 5 quests passed first try." },
  { id: "sabr", name: "Garden of Sabr", stage: "Growing", points: 350, streak: 7, meaning: "Knowledge you water every day.", criteria: "350 points and a 7-day learning streak." },
  { id: "ikhlas", name: "Star of Ikhlas", stage: "Deepening", points: 700, kindness: 10, meaning: "Doing things beautifully, even when no one sees.", criteria: "700 points and 10 kind acts." },
  { id: "akhlaq", name: "Crown of Akhlaq", stage: "Mastery", points: 1200, streak: 21, mastery: 25, meaning: "Knowledge carried with care and good character.", criteria: "1,200 points, a 21-day streak, and 25 quests passed first try." },
];

/** Default badge set (kids) — kept as `badges` for existing kid screens. */
export const badges: Badge[] = kidBadges;

export type ProgressInput = { stars: number; streak: number; mastery: number; kindness: number };

export const isEarned = (b: Badge, p: ProgressInput) =>
  p.stars >= b.points &&
  (b.streak === undefined || p.streak >= b.streak) &&
  (b.mastery === undefined || p.mastery >= b.mastery) &&
  (b.kindness === undefined || p.kindness >= b.kindness);

export const earnedBadges = (p: ProgressInput, set: Badge[] = badges) => set.filter((b) => isEarned(b, p));

export const nextBadge = (p: ProgressInput, set: Badge[] = badges) => set.find((b) => !isEarned(b, p));

/** 0–100 toward the next badge, averaged across its criteria. */
export const progressToNext = (p: ProgressInput, set: Badge[] = badges) => {
  const b = nextBadge(p, set);
  if (!b) return 100;
  const prev = set[set.indexOf(b) - 1]?.points ?? 0;
  const parts = [Math.min(1, (p.stars - prev) / Math.max(1, b.points - prev))];
  if (b.streak !== undefined) parts.push(Math.min(1, p.streak / b.streak));
  if (b.mastery !== undefined) parts.push(Math.min(1, p.mastery / b.mastery));
  if (b.kindness !== undefined) parts.push(Math.min(1, p.kindness / b.kindness));
  return Math.round((parts.reduce((a, x) => a + Math.max(0, x), 0) / parts.length) * 100);
};

/** Remaining criteria for the next badge, phrased for a child. */
export const remainingFor = (p: ProgressInput) => {
  const b = nextBadge(p);
  if (!b) return [];
  const out: string[] = [];
  if (p.stars < b.points) out.push(`${b.points - p.stars} more points`);
  if (b.streak !== undefined && p.streak < b.streak) out.push(`${b.streak - p.streak} more days in a row`);
  if (b.mastery !== undefined && p.mastery < b.mastery) out.push(`${b.mastery - p.mastery} more quests passed first try`);
  if (b.kindness !== undefined && p.kindness < b.kindness) out.push(`${b.kindness - p.kindness} more kind acts`);
  return out;
};

export const stageOf = (p: ProgressInput): Stage => {
  const last = earnedBadges(p).at(-1);
  return last ? last.stage : "Seeking";
};

/** Milestones sit between badges so small wins still feel seen. */
export const milestones = [
  { at: 25, label: "First 25 points" },
  { at: 100, label: "100 points" },
  { at: 250, label: "250 points" },
  { at: 750, label: "750 points" },
  { at: 1500, label: "1,500 points" },
  { at: 2000, label: "2,000 points" },
];
