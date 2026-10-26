/* What players learn, as the IlmWorld team writes it in the admin page. Every piece is one
   Firestore document in city_content; when a document isn't there yet, the game's own
   built-in content is used.

   - course_<CODE>        a university course: its topics (up to 12), each with notes and
                          quiz questions. Courses are shared by every university.
   - dept_<CODE>          a department's own list of courses at each level (100 to 500)
   - uni_<area>           faculties added to a university
   - faculty_<KEY>        departments added to a kind of faculty (Arts, Science, Law…)
   - mosque_<id>          a mosque's lectures and its own quiz
   - school_<id>_<subject>_<band>   a school subject's quiz for primary, JSS or SS
   - mssn_<id>            an MSSN centre's quiz */

export type QItem = { q: string; o: string[]; a: number; e?: string };
export type Topic = { title: string; notes?: string; qs: QItem[] };
export type CourseDoc = { title?: string; topics: Topic[] };
export type CourseRef = { code: string; title: string };
export type DeptDoc = { courses: Record<string, CourseRef[]> };
/** faculties the team added to a university (taught in its Faculties Complex) */
export type UniDoc = { faculties: string[] };
export type FacultyDoc = { depts: { name: string; code: string }[] };
export type MosqueLecture = {
  title: string;
  speaker: string;
  /** "HH:MM" */
  start: string;
  minutes: number;
  /** 0 = Sunday … 6 = Saturday; empty for every day */
  days?: number[];
  audioUrl?: string;
};
export type MosqueDoc = { lectures: MosqueLecture[]; quiz: QItem[] };
export type QuizDoc = { book?: string; quiz: QItem[] };

export const MAX_TOPICS = 12;
/** Firestore document ids can't hold spaces or slashes. */
export const keyOf = (...parts: string[]) => parts.map((p) => p.replace(/[\s/]+/g, "-")).join("_");

const cache = new Map<string, { at: number; v: unknown }>();
const fs = async () => {
  const { db } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  return { db, ...f };
};
/** One piece of content (cached for a few minutes); null when the team hasn't written it. */
export async function getContent<T>(id: string, fresh = false): Promise<T | null> {
  const c = cache.get(id);
  if (!fresh && c && Date.now() - c.at < 5 * 60000) return c.v as T | null;
  try {
    const { db, doc, getDoc } = await fs();
    const s = await getDoc(doc(db, "city_content", id));
    const v = s.exists() ? (s.data() as T) : null;
    cache.set(id, { at: Date.now(), v });
    return v;
  } catch {
    return null;
  }
}
/** Save a piece of content (admins only). */
export async function setContent(id: string, v: object) {
  const { db, doc, setDoc } = await fs();
  await setDoc(doc(db, "city_content", id), { ...v, updatedAt: Date.now() });
  cache.set(id, { at: Date.now(), v });
}
export async function removeContent(id: string) {
  const { db, doc, deleteDoc } = await fs();
  await deleteDoc(doc(db, "city_content", id));
  cache.delete(id);
}

/* Questions are written as plain text: the question on one line, then the choices one per
   line with a * before the right one, and an empty line between questions. An optional
   line starting "Why:" explains the answer. */
export function parseQs(text: string): QItem[] {
  const out: QItem[] = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const why = lines.find((l) => /^why:/i.test(l));
    const rest0 = lines.filter((l) => l !== why);
    if (rest0.length < 3) continue;
    const [q, ...rest] = rest0;
    const a = rest.findIndex((l) => l.startsWith("*"));
    if (a < 0) continue;
    out.push({
      q,
      o: rest.map((l) => l.replace(/^\*\s*/, "")),
      a,
      ...(why ? { e: why.replace(/^why:\s*/i, "") } : {}),
    });
  }
  return out;
}
export const formatQs = (qs: QItem[]) =>
  qs
    .map((x) =>
      [
        x.q,
        ...x.o.map((o, i) => (i === x.a ? "* " : "") + o),
        ...(x.e ? ["Why: " + x.e] : []),
      ].join("\n"),
    )
    .join("\n\n");
