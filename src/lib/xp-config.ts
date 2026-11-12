/** XP amounts. The admin can change them (saved in siteConfig/xp); these are the defaults. */
export type XpAction = "quiz" | "daily" | "wisdom" | "duel" | "book" | "hifz" | "ramadan";
export type XpRule = { amount: number; cap: number; on: boolean; bonus?: number; bonus7?: number; bonus30?: number };
export type XpConfig = Record<XpAction, XpRule>;

export const XP_DEFAULTS: XpConfig = {
  quiz: { amount: 15, cap: 600, on: true },
  daily: { amount: 10, cap: 210, on: true, bonus7: 50, bonus30: 200 },
  wisdom: { amount: 5, cap: 5, on: true },
  duel: { amount: 120, cap: 300, on: true },
  book: { amount: 50, cap: 150, on: true },
  hifz: { amount: 10, cap: 50, on: true },
  ramadan: { amount: 5, cap: 40, on: true, bonus: 20 },
};

export const XP_LABELS: Record<XpAction, { label: string; hint: string; amount: string }> = {
  quiz: { label: "Quiz", hint: "Per correct answer, ×1 / ×1.5 / ×2 for difficulty", amount: "XP per correct answer" },
  daily: { label: "Daily visit", hint: "Once a day, when they open the app", amount: "XP per day" },
  wisdom: { label: "Daily Wisdom", hint: "Once a day: save, copy or make a card", amount: "XP" },
  duel: { label: "Duel (Challenge)", hint: "Depends on the result, up to this much per duel", amount: "Max XP per duel" },
  book: { label: "Finish a book", hint: "Once per book or audiobook, ever", amount: "XP per book" },
  hifz: { label: "Hifz", hint: "Per ayah memorised or revised", amount: "XP per ayah" },
  ramadan: { label: "Ramadan quest", hint: "Per step (lesson, dua, reminder, quiz), once each", amount: "XP per step" },
};

export function mergeXp(saved: unknown): XpConfig {
  const s = (saved ?? {}) as Partial<Record<XpAction, Partial<XpRule>>>;
  const out = {} as XpConfig;
  for (const k of Object.keys(XP_DEFAULTS) as XpAction[]) out[k] = { ...XP_DEFAULTS[k], ...(s[k] ?? {}) };
  return out;
}

/** Levels. The admin can change them (saved in siteConfig/levels); these are the defaults. */
export type LevelDef = { name: string; xp: number; perks: string[] };
export const LEVEL_DEFAULTS: LevelDef[] = [
  { name: "Newcomer", xp: 0, perks: ["Your journey begins"] },
  { name: "Seeker", xp: 100, perks: ["“Seeker” shown next to your name on the leaderboard"] },
  { name: "Student", xp: 300, perks: ["“Student” shown next to your name"] },
  { name: "Learner", xp: 700, perks: ["“Learner” shown next to your name"] },
  { name: "Devoted", xp: 1200, perks: ["“Devoted” shown next to your name"] },
  { name: "Guardian", xp: 2000, perks: ["“Guardian” shown next to your name"] },
  { name: "Scholar", xp: 3000, perks: ["“Scholar” shown next to your name"] },
  { name: "Sage", xp: 5000, perks: ["“Sage” shown next to your name"] },
];
export function cleanLevels(v: unknown): LevelDef[] {
  const arr = Array.isArray(v) ? (v as Partial<LevelDef>[]) : [];
  const l = arr.filter((x) => x && typeof x.name === "string" && x.name.trim())
    .map((x) => ({ name: String(x.name), xp: Math.max(0, Number(x.xp) || 0), perks: Array.isArray(x.perks) ? x.perks.map(String) : [] }))
    .sort((a, b) => a.xp - b.xp);
  if (!l.length) return LEVEL_DEFAULTS;
  l[0]!.xp = 0;
  return l;
}
export function levelFor(xp: number, levels: LevelDef[] = LEVEL_DEFAULTS) {
  let i = 0;
  while (i + 1 < levels.length && xp >= levels[i + 1]!.xp) i++;
  const cur = levels[i]!; const nxt = levels[i + 1];
  return { n: i + 1, name: cur.name, xp, perks: cur.perks, next: nxt?.xp ?? null, nextName: nxt?.name ?? null,
    pct: nxt ? Math.round(((xp - cur.xp) / (nxt.xp - cur.xp)) * 100) : 100 };
}
