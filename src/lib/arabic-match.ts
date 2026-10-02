/** Strips Arabic diacritics (tashkeel) and normalises common letter variants so recited speech can be compared loosely against the reference ayah. */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\u0621-\u064A\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** For each word of `b`, the index in `a` it was matched to (via longest-common-subsequence backtrack), or null if not found. */
function lcsBacktrackIndices(a: string[], b: string[]): (number | null)[] {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  const matchedIndex: (number | null)[] = new Array(m).fill(null);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { matchedIndex[j - 1] = i - 1; i--; j--; }
    else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) i--;
    else j--;
  }
  return matchedIndex;
}

export type WordCheck = { word: string; ok: boolean };
export type MatchResult = { words: WordCheck[]; ok: boolean };

/**
 * Compares recited speech against a reference ayah, word by word, in order.
 * Every reference word must be found, AND the matched words must sit within a
 * reasonable span of what was heard — this stops someone reciting an unrelated
 * or out-of-order passage from "passing" just because a few common words (Allah,
 * etc.) happen to reappear far apart. A lightweight stand-in for real tajweed
 * grading — not a substitute for a qualified teacher, and limited by how
 * accurately the browser's speech recognition transcribes Arabic.
 */
export function matchAyah(heard: string, reference: string): MatchResult {
  const displayWords = reference.trim().split(/\s+/).filter(Boolean);
  const refNorm = normalizeArabic(reference).split(" ").filter(Boolean);
  const heardNorm = normalizeArabic(heard).split(" ").filter(Boolean);
  const matchedIndex = lcsBacktrackIndices(heardNorm, refNorm);
  const words = displayWords.map((word, i) => ({ word, ok: matchedIndex[i] !== null }));
  const allFound = words.every(w => w.ok) && heardNorm.length > 0;
  if (!allFound) return { words, ok: false };
  const idxs = matchedIndex.filter((x): x is number => x !== null);
  const span = idxs[idxs.length - 1]! - idxs[0]! + 1;
  const ok = span <= refNorm.length * 1.6 + 2;
  return { words, ok };
}

export function diffAgainstReference(heard: string, reference: string): WordCheck[] {
  return matchAyah(heard, reference).words;
}

export function isExactMatch(heard: string, reference: string): boolean {
  return matchAyah(heard, reference).ok;
}
