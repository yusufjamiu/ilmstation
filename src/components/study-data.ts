/* Study: React hooks on top of study-core (the pure shapes, shared with the server). */
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useLanguage } from "./language";
import { DEFAULT_CATEGORIES, type Category, type Progress, type Results } from "./study-core";

export * from "./study-core";

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

/** The signed-in learner's lesson progress and exam results, live. */
export function useStudyMe() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [progress, setProgress] = useState<Progress>({});
  const [results, setResults] = useState<Results>({});
  useEffect(() => auth.onAuthStateChanged((u) => setUid(u?.uid ?? null)), []);
  useEffect(() => {
    if (!uid) return;
    const a = onSnapshot(doc(db, "studyProgress", uid), (s) => setProgress((s.data() as Progress) ?? {}), () => {});
    const b = onSnapshot(doc(db, "studyResults", uid), (s) => setResults((s.data() as Results) ?? {}), () => {});
    return () => { a(); b(); };
  }, [uid]);
  return { uid, progress, results };
}

/** The study voice is the app language chosen in Settings: one place to change it. */
export function useVoiceLang() {
  const { lang, set } = useLanguage();
  return { lang: lang as string, set: (c: string) => set(c as Parameters<typeof set>[0]) };
}
