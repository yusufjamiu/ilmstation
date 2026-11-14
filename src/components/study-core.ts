/* Study section — shared shape used by the app (study.tsx) and the admin (admin/study.tsx).

   Firestore:
   - "studyCategories": one doc per category (Madrasah, Languages…), each with its own levels.
     If the collection is empty, the app shows DEFAULT_CATEGORIES.
   - "studySubjects": one doc per subject. A subject belongs to one category and is taught in
     one or more stages. Each stage has its own syllabus, uploaded by an admin.

   A stage id is "<levelId>-<n>", e.g. "beginner-2". Level ids never change after creation,
   so renaming a level keeps every subject's stages and syllabus. */


export type Level = { id: string; name: string; nameAr?: string; stages: number };
export type IconKey = "graduation" | "languages" | "sprout" | "palette" | "book" | "calculator" | "code" | "heart" | "flask" | "globe";
export type Category = {
  id: string; name: string; nameAr?: string; blurb?: string; icon: IconKey;
  live: boolean; order: number; levels: Level[];
};

const THREE: Level[] = [
  { id: "beginner", name: "Beginner", nameAr: "المستوى المبتدئ", stages: 3 },
  { id: "intermediate", name: "Intermediate", nameAr: "المستوى المتوسط", stages: 3 },
  { id: "advanced", name: "Advanced", nameAr: "المستوى المتقدم", stages: 3 },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "madrasah", name: "Madrasah", nameAr: "المدرسة", blurb: "Islamic education, step by step.", icon: "graduation", live: true, order: 0, levels: THREE },
  { id: "languages", name: "Languages", nameAr: "اللغات", blurb: "Learn new languages.", icon: "languages", live: false, order: 1, levels: THREE },
  { id: "development", name: "Development", nameAr: "التطوير", blurb: "Personal, professional and technical growth.", icon: "sprout", live: false, order: 2, levels: THREE },
  { id: "creativity", name: "Creativity", nameAr: "الإبداع", blurb: "Creative skills and practical talents.", icon: "palette", live: false, order: 3, levels: THREE },
];

export type Stage = { id: string; level: Level; n: number; name: string };
export const stagesOf = (c?: Category): Stage[] => (c?.levels ?? []).flatMap((l) =>
  Array.from({ length: Math.max(1, l.stages) }, (_, i) => ({ id: `${l.id}-${i + 1}`, level: l, n: i + 1, name: `${l.name} ${i + 1}` })));
export const stageName = (c: Category | undefined, id: string) => stagesOf(c).find((s) => s.id === id)?.name ?? id;

export type Syllabus = {
  /** One topic per line, in teaching order. */
  outline: string;
  /** Optional full syllabus document. */
  pdfUrl?: string;
  updatedAt?: number;
};

export type Subject = {
  id: string;
  category: string;
  name: string;
  nameAr?: string;
  description?: string;
  stages: string[];
  /** Keyed by stage id — each stage has its own syllabus. */
  syllabus: Record<string, Syllabus>;
  order: number;
  status: "draft" | "published";
  createdAt: number;
};

/** Starter Madrasah subjects for Beginner 1–3 (admin adds them in one click, then edits or removes). */
export const DEFAULT_MADRASAH: Pick<Subject, "name" | "nameAr">[] = [
  { name: "Qira'ah", nameAr: "القراءة" },
  { name: "Arabiyyah", nameAr: "العربية" },
  { name: "Hadith", nameAr: "الحديث" },
  { name: "Fiqh", nameAr: "الفقه" },
  { name: "Seerah", nameAr: "السيرة" },
];

export const topics = (s?: Syllabus) => (s?.outline ?? "").split("\n").map((t) => t.trim()).filter(Boolean);
export const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

/* ---------------- Lessons ----------------
   Firestore "studyLessons": one doc per lesson, linked to a subject and a stage.
   A lesson is a list of screens (like Duolingo). Text is shared; voice clips and videos
   are per "voice language", so Yoruba can be a teaching voice without being an app language. */

export const VOICE_LANGS = [
  { code: "en", name: "English" }, { code: "ar", name: "العربية" }, { code: "yo", name: "Yorùbá" }, { code: "ha", name: "Hausa" },
  { code: "fr", name: "Français" }, { code: "ur", name: "اردو" }, { code: "bn", name: "বাংলা" }, { code: "id", name: "Bahasa Indonesia" },
  { code: "tr", name: "Türkçe" }, { code: "sw", name: "Kiswahili" },
] as const;
export type VoiceLang = (typeof VOICE_LANGS)[number]["code"];
export const voiceName = (c: string) => VOICE_LANGS.find((l) => l.code === c)?.name ?? c;
/** One clip per voice language. */
export type Voices = Partial<Record<VoiceLang, string>>;

export type Choice = { label: string; emoji?: string; imageUrl?: string; voice?: Voices };
export type Screen =
  | { id: string; type: "explain"; title?: string; text: string; big?: string; emoji?: string; imageUrl?: string; voice?: Voices }
  | { id: string; type: "choose"; prompt: string; big?: string; options: Choice[]; answer: number; voice?: Voices; hint?: string }
  | { id: string; type: "match"; prompt: string; pairs: { left: string; right: string }[]; voice?: Voices }
  | { id: string; type: "tf"; prompt: string; answer: boolean; why?: string; voice?: Voices }
  | { id: string; type: "fill"; prompt: string; /** accepted answers, separated by | */ answer: string; why?: string; voice?: Voices }
  | { id: string; type: "video"; title?: string; videos: Partial<Record<VoiceLang, { youtube?: string; url?: string }>> }
  | { id: string; type: "game"; title?: string; url: string };
export type ScreenType = Screen["type"];
export const SCREEN_LABEL: Record<ScreenType, string> = {
  explain: "Explain (text, picture, voice)", choose: "Tap the answer", match: "Match pairs",
  tf: "True or false", fill: "Fill in the blank", video: "Video", game: "HTML game",
};

export type Lesson = {
  id: string; subjectId: string; stage: string; order: number;
  title: string; mins: number; tier: "free" | "premium"; status: "draft" | "published";
  /** "html" (default): one uploaded HTML page per voice language. "screens": built in the admin. */
  kind?: "html" | "screens";
  html?: Partial<Record<VoiceLang, string>>;
  /** The book this lesson explains, e.g. Al-Ajurrumiyyah · Bab al-Kalam (pp. 3–5). */
  book?: string; part?: string;
  screens: Screen[]; pdfUrl?: string; createdAt: number;
};
export const isHtmlLesson = (l: Pick<Lesson, "kind" | "screens">) => (l.kind ? l.kind === "html" : !l.screens?.length);

/* ---------------- Exams ----------------
   "studyExams": questions everyone signed in can read (no answers).
   "studyExamKeys": the answers, admins only. The server marks exams (/api/study-exam).
   Subject exam id:   sub__<subjectId>__<stage>
   Promotion exam id: promo__<categoryId>__<stage>  — passing it opens the next stage.
   Anyone can take a promotion exam early to skip ahead, once every `waitDays` days. */

export type Question =
  | { id: string; type: "mcq"; q: string; options: string[] }
  | { id: string; type: "tf"; q: string }
  | { id: string; type: "fill"; q: string };
export type Key = { id: string; answer: number | boolean | string; why?: string };
export type Exam = {
  id: string; kind: "subject" | "promotion"; category: string; stage: string; subjectId?: string;
  title: string; passMark: number; minutes: number; perAttempt: number; waitDays: number;
  status: "draft" | "published"; questions: Question[];
};
export const subjectExamId = (subjectId: string, stage: string) => `sub__${subjectId}__${stage}`;
export const promoExamId = (category: string, stage: string) => `promo__${category}__${stage}`;

/* ---------------- Progress ----------------
   "studyProgress/{uid}": lessons done, last lesson, notes (the learner writes it).
   "studyResults/{uid}": exam results and opened stages (only the server writes it). */
export type Progress = { done?: Record<string, number>; notes?: Record<string, string> };
export type Results = {
  exams?: Record<string, { best: number; passed: boolean; last: number; tries: number }>;
  /** Older records: highest stage index reached per category (0 = first stage). */
  reached?: Record<string, number>;
  /** The learner's current open stage per category, by stage id (e.g. "beginner-3").
      Saved by id so admins can add or rearrange levels without moving anyone. */
  at?: Record<string, string>;
};

/** Index of the learner's open stage. Stages before it count as done. */
export function reachedIndex(r: Results | undefined, catId: string, stages: { id: string }[]): number {
  const id = r?.at?.[catId];
  const i = id ? stages.findIndex((s) => s.id === id) : -1;
  if (i >= 0) return i;
  return Math.min(r?.reached?.[catId] ?? 0, Math.max(0, stages.length - 1));
}

export const youtubeId = (s = "") => s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1] ?? (/^[\w-]{11}$/.test(s.trim()) ? s.trim() : "");
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[ً-ْ̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export const isRight = (answer: number | boolean | string, given: number | boolean | string | undefined) =>
  typeof answer === "string" ? answer.split("|").some((a) => norm(a) === norm(String(given ?? ""))) : answer === given;
/** The learner's voice language if recorded, else English, else the first one recorded. */
export const pick = <T>(m: Partial<Record<string, T>> | undefined, want: string): T | undefined =>
  m ? (m[want] ?? m.en ?? Object.values(m).find(Boolean)) : undefined;
