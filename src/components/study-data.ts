/* Study section — shared shape used by the app (study.tsx) and the admin (admin/study.tsx).

   Firestore: collection "studySubjects", one doc per subject.
   A subject belongs to one category and is taught in one or more stages (e.g. Beginner 1–3).
   Each stage has its own syllabus, uploaded by an admin. */

export type CategoryId = "madrasah" | "languages" | "development" | "creativity";
export type Category = { id: CategoryId; name: string; nameAr: string; blurb: string; live: boolean };

export const CATEGORIES: Category[] = [
  { id: "madrasah", name: "Madrasah", nameAr: "المدرسة", blurb: "Islamic education, step by step.", live: true },
  { id: "languages", name: "Languages", nameAr: "اللغات", blurb: "Learn new languages.", live: false },
  { id: "development", name: "Development", nameAr: "التطوير", blurb: "Personal, professional and technical growth.", live: false },
  { id: "creativity", name: "Creativity", nameAr: "الإبداع", blurb: "Creative skills and practical talents.", live: false },
];

export type LevelId = "beginner" | "intermediate" | "advanced";
export const LEVELS: { id: LevelId; name: string; nameAr: string }[] = [
  { id: "beginner", name: "Beginner", nameAr: "المستوى المبتدئ" },
  { id: "intermediate", name: "Intermediate", nameAr: "المستوى المتوسط" },
  { id: "advanced", name: "Advanced", nameAr: "المستوى المتقدم" },
];

/** "beginner-1" … "advanced-3" — 9 stages in total. */
export type StageId = `${LevelId}-${1 | 2 | 3}`;
export const STAGES: { id: StageId; level: LevelId; n: 1 | 2 | 3; name: string }[] = LEVELS.flatMap((l) =>
  ([1, 2, 3] as const).map((n) => ({ id: `${l.id}-${n}` as StageId, level: l.id, n, name: `${l.name} ${n}` })));
export const stageName = (id: StageId) => STAGES.find((s) => s.id === id)?.name ?? id;

export type Syllabus = {
  /** One topic per line, in teaching order. */
  outline: string;
  /** Optional full syllabus document. */
  pdfUrl?: string;
  updatedAt?: number;
};

export type Subject = {
  id: string;
  category: CategoryId;
  name: string;
  nameAr?: string;
  description?: string;
  stages: StageId[];
  /** Keyed by stage — each stage has its own syllabus. */
  syllabus: Partial<Record<StageId, Syllabus>>;
  order: number;
  status: "draft" | "published";
  createdAt: number;
};

/** Starter Madrasah subjects for Beginner 1–3 (admin can add one click, then edit or remove). */
export const DEFAULT_MADRASAH: Pick<Subject, "name" | "nameAr">[] = [
  { name: "Qira'ah", nameAr: "القراءة" },
  { name: "Arabiyyah", nameAr: "العربية" },
  { name: "Hadith", nameAr: "الحديث" },
  { name: "Fiqh", nameAr: "الفقه" },
  { name: "Seerah", nameAr: "السيرة" },
];

export const topics = (s?: Syllabus) => (s?.outline ?? "").split("\n").map((t) => t.trim()).filter(Boolean);
