/* Study section — shared shape used by the app (study.tsx) and the admin (admin/study.tsx).

   Firestore:
   - "studyCategories": one doc per category (Madrasah, Languages…), each with its own levels.
     If the collection is empty, the app shows DEFAULT_CATEGORIES.
   - "studySubjects": one doc per subject. A subject belongs to one category and is taught in
     one or more stages. Each stage has its own syllabus, uploaded by an admin.

   A stage id is "<levelId>-<n>", e.g. "beginner-2". Level ids never change after creation,
   so renaming a level keeps every subject's stages and syllabus. */

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

/** Live list of categories from Firebase, sorted; falls back to the defaults until an admin saves any. */
export function useStudyCategories() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => onSnapshot(collection(db, "studyCategories"), (snap) => {
    const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Category, "id">), id: d.id }));
    setSaved(list.length > 0);
    setCats((list.length ? list : DEFAULT_CATEGORIES).map((c) => ({ ...c, levels: c.levels ?? [] })).sort((a, b) => a.order - b.order));
  }, () => { setSaved(false); setCats(DEFAULT_CATEGORIES); }), []);
  return { cats, saved };
}

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
