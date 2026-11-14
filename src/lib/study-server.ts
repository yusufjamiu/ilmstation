import { admin } from "./money-server";
import {
  DEFAULT_CATEGORIES, isRight, reachedIndex, stagesOf, subjectExamId,
  type Category, type Exam, type Key, type Results,
} from "@/components/study-core";

/* Study exams are marked here so answers never reach the browser.
   POST /api/study-exam { action: "start", examId }            → a random set of questions
   POST /api/study-exam { action: "submit", examId, answers }  → score, pass/fail, explanations
   Passing a promotion exam opens the next stage. Taking one early (to skip ahead) is allowed
   once every exam.waitDays days. */

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const DAY = 86_400_000;
const GRACE = 2 * 60_000;
const shuffle = <T>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; };

type Db = NonNullable<Awaited<ReturnType<typeof admin>>>["db"];

async function category(db: Db, id: string): Promise<Category | undefined> {
  const s = await db.doc(`studyCategories/${id}`).get();
  if (s.exists) return { ...(s.data() as Omit<Category, "id">), id };
  const any = await db.collection("studyCategories").limit(1).get();
  return any.empty ? DEFAULT_CATEGORIES.find((c) => c.id === id) : undefined;
}

/** Can this learner sit the exam now? Returns a reason when not. `early` = skipping ahead. */
async function gate(db: Db, uid: string, exam: Exam, results: Results): Promise<{ ok: true; early: boolean } | { ok: false; reason: string }> {
  const cat = await category(db, exam.category);
  const stages = stagesOf(cat);
  const idx = stages.findIndex((s) => s.id === exam.stage);
  if (idx < 0) return { ok: false, reason: "This stage no longer exists." };
  const reached = reachedIndex(results, exam.category, stages);
  const last = results.exams?.[exam.id]?.last ?? 0;

  if (exam.kind === "subject") {
    if (idx > reached) return { ok: false, reason: "Open this stage first." };
    const [lessons, prog] = await Promise.all([
      db.collection("studyLessons").where("subjectId", "==", exam.subjectId).where("stage", "==", exam.stage).where("status", "==", "published").get(),
      db.doc(`studyProgress/${uid}`).get(),
    ]);
    const done = (prog.get("done") as Record<string, number> | undefined) ?? {};
    if (lessons.docs.some((l) => !done[l.id])) return { ok: false, reason: "Finish all the lessons first." };
    return { ok: true, early: false };
  }

  // promotion: normal once every published subject exam in this stage is passed
  const subjects = await db.collection("studySubjects").where("category", "==", exam.category).where("status", "==", "published").get();
  const ids = subjects.docs.filter((d) => ((d.get("stages") as string[] | undefined) ?? []).includes(exam.stage)).map((d) => subjectExamId(d.id, exam.stage));
  const live = ids.length ? (await db.getAll(...ids.map((id) => db.doc(`studyExams/${id}`)))).filter((s) => s.exists && s.get("status") === "published").map((s) => s.id) : [];
  const allPassed = live.every((id) => results.exams?.[id]?.passed);
  const early = idx > reached || !allPassed;
  if (early && last && Date.now() - last < exam.waitDays * DAY) {
    const days = Math.ceil((last + exam.waitDays * DAY - Date.now()) / DAY);
    return { ok: false, reason: `You can try skipping ahead again in ${days} day${days > 1 ? "s" : ""}.` };
  }
  return { ok: true, early };
}

export async function handleStudyExam(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  let uid: string;
  try { uid = (await a.auth.verifyIdToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""))).uid; } catch { return json({ error: "Not signed in" }, 401); }
  const body = (await request.json().catch(() => ({}))) as { action?: string; examId?: string; answers?: Record<string, unknown> };
  const examId = String(body.examId ?? "").slice(0, 200);
  if (!examId) return json({ error: "Missing exam" }, 400);

  const db = a.db;
  const examSnap = await db.doc(`studyExams/${examId}`).get();
  if (!examSnap.exists || examSnap.get("status") !== "published") return json({ error: "This exam isn't available." }, 404);
  const exam = { ...(examSnap.data() as Omit<Exam, "id">), id: examId };
  const resRef = db.doc(`studyResults/${uid}`);
  const attemptRef = db.doc(`studyAttempts/${uid}_${examId}`);
  const results = ((await resRef.get()).data() as Results | undefined) ?? {};

  if (body.action === "start") {
    const g = await gate(db, uid, exam, results);
    if (!g.ok) return json({ error: g.reason }, 403);
    const n = Math.max(1, Math.min(exam.perAttempt || exam.questions.length, exam.questions.length));
    const picked = shuffle(exam.questions).slice(0, n);
    const startedAt = Date.now();
    await attemptRef.set({ ids: picked.map((q) => q.id), startedAt, early: g.early });
    return json({ questions: picked, startedAt, minutes: exam.minutes, early: g.early });
  }

  if (body.action === "submit") {
    const att = await attemptRef.get();
    if (!att.exists) return json({ error: "Start the exam first." }, 400);
    const ids = att.get("ids") as string[];
    const startedAt = Number(att.get("startedAt"));
    const late = exam.minutes > 0 && Date.now() > startedAt + exam.minutes * 60_000 + GRACE;
    const keys = new Map((((await db.doc(`studyExamKeys/${examId}`).get()).get("keys") as Key[] | undefined) ?? []).map((k) => [k.id, k]));
    const answers = body.answers ?? {};
    const marks = ids.map((id) => {
      const k = keys.get(id);
      const given = answers[id] as number | boolean | string | undefined;
      return { id, correct: !late && !!k && isRight(k.answer, given), why: k?.why ?? "" };
    });
    const score = Math.round((marks.filter((m) => m.correct).length / Math.max(1, ids.length)) * 100);
    const passed = score >= exam.passMark;
    const prev = results.exams?.[examId];
    const update: Record<string, unknown> = {
      [`exams.${examId}`]: { best: Math.max(prev?.best ?? 0, score), passed: !!prev?.passed || passed, last: Date.now(), tries: (prev?.tries ?? 0) + 1 },
    };
    let promoted = false;
    if (exam.kind === "promotion" && passed) {
      const stages = stagesOf(await category(db, exam.category));
      const idx = stages.findIndex((s) => s.id === exam.stage);
      const next = stages[idx + 1];
      if (idx >= 0 && next && idx + 1 > reachedIndex(results, exam.category, stages)) {
        update[`at.${exam.category}`] = next.id;
        update[`reached.${exam.category}`] = idx + 1;
        promoted = true;
      }
    }
    await resRef.set({}, { merge: true });
    await resRef.update(update);
    await attemptRef.delete();
    return json({ score, passed, passMark: exam.passMark, late, promoted, marks });
  }

  return json({ error: "Unknown action" }, 400);
}
