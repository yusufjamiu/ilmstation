/* Admin: what players learn. University courses (topics with notes and quizzes), each
   mosque's lectures and quiz, school subject quizzes, and MSSN centre quizzes. Everything is
   saved to city_content; the game uses it straight away (built-in content until then). */
import { useEffect, useState } from "react";
import { DISTRICTS, type Landmark } from "./content";
import {
  MAX_TOPICS,
  formatQs,
  getContent,
  keyOf,
  parseQs,
  removeContent,
  setContent,
  type CourseDoc,
  type CourseRef,
  type DeptDoc,
  type FacultyDoc,
  type MosqueDoc,
  type MosqueLecture,
  type QuizDoc,
  type Topic,
} from "./learning";
import { SUBJECTS, bandOf, quizFor } from "./school";
import {
  LEVELS,
  courseTopics,
  coursesLive,
  departmentsLive,
  facultyKey,
  type Dept,
} from "./university";

const input = "w-full rounded-xl border border-black/15 bg-white px-3 py-2";
const area = "w-full rounded-xl border border-black/15 bg-white px-3 py-2 font-mono text-[13px]";
const btn = "rounded-xl px-4 py-2 font-bold";
const pickBtn = (on: boolean) =>
  `rounded-xl px-3 py-1.5 text-[13px] font-bold ${on ? "bg-[#1f6f63] text-white" : "bg-white"}`;
const QS_HELP =
  "One question per block: the question, then each choice on its own line with * before the right one. Optional last line: Why: … Leave an empty line between questions.";

const all = () => DISTRICTS.flatMap((d) => d.landmarks.map((l) => ({ l, d })));

export default function ContentAdmin() {
  const [tab, setTab] = useState<"uni" | "mosque" | "school" | "mssn">("uni");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["uni", "🎓 University courses"],
            ["mosque", "🕌 Mosque lectures & quizzes"],
            ["school", "🏫 School quizzes"],
            ["mssn", "🤝 MSSN quizzes"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={pickBtn(tab === k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "uni" && <Universities />}
      {tab === "mosque" && <Mosques />}
      {tab === "school" && <Schools />}
      {tab === "mssn" && <Mssn />}
    </div>
  );
}

function Saved({ msg }: { msg: string | null }) {
  return msg ? <p className="text-[13px] font-bold text-[#1d6b3a]">{msg}</p> : null;
}

/* ---------------- universities ---------------- */
function Universities() {
  const unis = DISTRICTS.filter((d) => d.campus && d.landmarks.some((l) => l.kind === "faculty"));
  const [uni, setUni] = useState(unis[0]?.id ?? "");
  const facs = (DISTRICTS.find((d) => d.id === uni)?.landmarks ?? []).filter(
    (l) => l.kind === "faculty" && !l.id.endsWith("-library"),
  );
  const [fac, setFac] = useState<Landmark | null>(null);
  const [depts, setDepts] = useState<Dept[] | null>(null);
  const [dept, setDept] = useState<Dept | null>(null);
  const [level, setLevel] = useState(100);
  const [courses, setCourses] = useState<CourseRef[] | null>(null);
  const [course, setCourse] = useState<CourseRef | null>(null);
  const [nd, setNd] = useState({ name: "", code: "" });
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setDepts(null);
    setDept(null);
    if (fac) void departmentsLive(fac.name).then(setDepts);
  }, [fac]);
  useEffect(() => {
    setCourses(null);
    setCourse(null);
    if (dept) void coursesLive(dept, level).then(setCourses);
  }, [dept, level]);
  return (
    <div className="space-y-4">
      <div className="max-w-3xl space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold">University courses</h2>
        <p className="text-[13px] opacity-75">
          Choose a university and faculty, then a department, level and course. Each course can have
          up to {MAX_TOPICS} topics, each with notes and quiz questions. Courses are shared: a
          course code (e.g. ENG 101) is the same at every university.
        </p>
        <div className="flex flex-wrap gap-2">
          {unis.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setUni(u.id);
                setFac(null);
              }}
              className={pickBtn(uni === u.id)}
            >
              {u.campus?.gate ?? u.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {facs.map((f) => (
            <button key={f.id} onClick={() => setFac(f)} className={pickBtn(fac?.id === f.id)}>
              {f.name.split(" · ")[0]}
            </button>
          ))}
        </div>
        {fac && (
          <div className="space-y-2">
            <div className="text-[13px] font-bold">
              Departments ({facultyKey(fac.name)} kind of faculty: any university with this kind of
              faculty shares them)
            </div>
            <div className="flex flex-wrap gap-2">
              {!depts && <span className="text-[13px]">Loading…</span>}
              {depts?.map((d) => (
                <button
                  key={d.code}
                  onClick={() => setDept(d)}
                  className={pickBtn(dept?.code === d.code)}
                >
                  {d.name} ({d.code})
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={input + " max-w-[220px]"}
                placeholder="New department name"
                value={nd.name}
                onChange={(e) => setNd({ ...nd, name: e.target.value })}
              />
              <input
                className={input + " max-w-[110px]"}
                placeholder="Code, e.g. SOC"
                value={nd.code}
                onChange={(e) => setNd({ ...nd, code: e.target.value.toUpperCase() })}
              />
              <button
                disabled={!nd.name.trim() || !/^[A-Z]{2,5}$/.test(nd.code)}
                onClick={async () => {
                  const id = keyOf("faculty", facultyKey(fac.name));
                  const cur = (await getContent<FacultyDoc>(id, true)) ?? { depts: [] };
                  await setContent(id, {
                    depts: [
                      ...cur.depts.filter((d) => d.code !== nd.code),
                      { name: nd.name.trim(), code: nd.code },
                    ],
                  });
                  setNd({ name: "", code: "" });
                  setDepts(null);
                  void departmentsLive(fac.name).then(setDepts);
                  setMsg("Department added. Now set its courses.");
                }}
                className={`${btn} bg-[#1f6f63] text-white disabled:opacity-40`}
              >
                Add department
              </button>
            </div>
          </div>
        )}
        {dept && (
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)} className={pickBtn(level === l)}>
                {l} L
              </button>
            ))}
          </div>
        )}
        <Saved msg={msg} />
      </div>
      {dept && courses && (
        <CourseList
          dept={dept}
          level={level}
          courses={courses}
          onPick={setCourse}
          picked={course}
          onSaved={(c) => {
            setCourses(c);
            setCourse(null);
          }}
        />
      )}
      {dept && course && fac && (
        <CourseEditor key={course.code} dept={dept} faculty={fac.name} course={course} />
      )}
    </div>
  );
}

function CourseList({
  dept,
  level,
  courses,
  picked,
  onPick,
  onSaved,
}: {
  dept: Dept;
  level: number;
  courses: CourseRef[];
  picked: CourseRef | null;
  onPick: (c: CourseRef) => void;
  onSaved: (c: CourseRef[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="max-w-3xl space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">
          {dept.name} · {level} Level courses
        </h3>
        <button
          onClick={() => {
            setText(courses.map((c) => `${c.code} | ${c.title}`).join("\n"));
            setEditing(!editing);
          }}
          className={`${btn} bg-black/5 text-[13px]`}
        >
          {editing ? "Close" : "Edit the course list"}
        </button>
      </div>
      {editing ? (
        <div className="space-y-2">
          <p className="text-[12.5px] opacity-70">
            One course per line: CODE | Title (e.g. ENG 101 | Use of English)
          </p>
          <textarea
            className={area}
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={async () => {
              const list = text
                .split("\n")
                .map((l) => l.split("|").map((x) => x.trim()))
                .filter(([c, t]) => c && t)
                .map(([code, title]) => ({ code: code.toUpperCase(), title }));
              const id = keyOf("dept", dept.code);
              const cur = (await getContent<DeptDoc>(id, true)) ?? { courses: {} };
              await setContent(id, { courses: { ...cur.courses, [String(level)]: list } });
              setEditing(false);
              onSaved(list);
            }}
            className={`${btn} bg-[#1f6f63] text-white`}
          >
            Save course list
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {!courses.length && (
            <span className="text-[13px] opacity-70">No courses yet: add some.</span>
          )}
          {courses.map((c) => (
            <button
              key={c.code}
              onClick={() => onPick(c)}
              className={pickBtn(picked?.code === c.code)}
            >
              {c.code} · {c.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type TopicDraft = { title: string; notes: string; qs: string };
function CourseEditor({
  dept,
  faculty,
  course,
}: {
  dept: Dept;
  faculty: string;
  course: CourseRef;
}) {
  const id = keyOf("course", course.code);
  const [topics, setTopics] = useState<TopicDraft[] | null>(null);
  const [custom, setCustom] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      const doc = await getContent<CourseDoc>(id, true);
      setCustom(!!doc?.topics?.length);
      const t: Topic[] = doc?.topics?.length
        ? doc.topics
        : await courseTopics(dept, faculty, course);
      setTopics(t.map((x) => ({ title: x.title, notes: x.notes ?? "", qs: formatQs(x.qs) })));
    })();
  }, [id, dept, faculty, course]);
  if (!topics) return <p>Loading…</p>;
  const set = (i: number, p: Partial<TopicDraft>) =>
    setTopics(topics.map((t, k) => (k === i ? { ...t, ...p } : t)));
  return (
    <div className="max-w-3xl space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold">
        {course.code} · {course.title}
      </h3>
      <p className="text-[12.5px] opacity-70">
        {custom
          ? "Your own topics."
          : "Built-in content (not saved yet): edit and save to make it yours."}{" "}
        {QS_HELP}
      </p>
      {topics.map((t, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-black/10 p-3">
          <div className="flex items-center gap-2">
            <b className="shrink-0 text-[13px]">Topic {i + 1}</b>
            <input
              className={input}
              placeholder="Topic title"
              value={t.title}
              onChange={(e) => set(i, { title: e.target.value })}
            />
            <button
              onClick={() => setTopics(topics.filter((_, k) => k !== i))}
              className={`${btn} shrink-0 bg-black/5 text-[12px]`}
            >
              Remove
            </button>
          </div>
          <textarea
            className={area}
            rows={4}
            placeholder="Notes players read before the quiz (optional)"
            value={t.notes}
            onChange={(e) => set(i, { notes: e.target.value })}
          />
          <textarea
            className={area}
            rows={6}
            placeholder={"What is 2 + 2?\n3\n* 4\n5\nWhy: two and two make four."}
            value={t.qs}
            onChange={(e) => set(i, { qs: e.target.value })}
          />
          <div className="text-[12px] opacity-70">
            {parseQs(t.qs).length} questions read correctly
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          disabled={topics.length >= MAX_TOPICS}
          onClick={() => setTopics([...topics, { title: "", notes: "", qs: "" }])}
          className={`${btn} bg-black/5 disabled:opacity-40`}
        >
          + Add topic ({topics.length}/{MAX_TOPICS})
        </button>
        <button
          onClick={async () => {
            const clean = topics
              .filter((t) => t.title.trim())
              .slice(0, MAX_TOPICS)
              .map((t) => ({ title: t.title.trim(), notes: t.notes.trim(), qs: parseQs(t.qs) }));
            await setContent(id, { title: course.title, topics: clean });
            setCustom(true);
            setMsg(`Saved ${clean.length} topics. Players see them now.`);
          }}
          className={`${btn} bg-[#1f6f63] text-white`}
        >
          Save course
        </button>
        {custom && (
          <button
            onClick={async () => {
              await removeContent(id);
              setCustom(false);
              setMsg("Back to the built-in content.");
            }}
            className={`${btn} bg-black/5`}
          >
            Use built-in content
          </button>
        )}
      </div>
      <Saved msg={msg} />
    </div>
  );
}

/* ---------------- mosques ---------------- */
function Mosques() {
  const list = all().filter(
    ({ l }) => l.kind === "masjid" || l.kind === "haram" || l.kind === "nabawi",
  );
  const [sel, setSel] = useState<string>(list[0]?.l.id ?? "");
  const [lecs, setLecs] = useState<MosqueLecture[]>([]);
  const [quiz, setQuiz] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    setMsg(null);
    void getContent<MosqueDoc>(keyOf("mosque", sel), true).then((d) => {
      setLecs(d?.lectures ?? []);
      setQuiz(formatQs(d?.quiz ?? []));
    });
  }, [sel]);
  const setL = (i: number, p: Partial<MosqueLecture>) =>
    setLecs(lecs.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="max-w-3xl space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">Mosque lectures and quizzes</h2>
      <input
        className={input}
        placeholder="Search mosques…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select className={input} value={sel} onChange={(e) => setSel(e.target.value)}>
        {list
          .filter(({ l, d }) => (l.name + d.name).toLowerCase().includes(q.toLowerCase()))
          .map(({ l, d }) => (
            <option key={l.id} value={l.id}>
              {l.name} · {d.name}
            </option>
          ))}
      </select>
      <h3 className="font-bold">Lectures</h3>
      <p className="text-[12.5px] opacity-70">
        Each lecture plays at its time when a player is in this mosque. Leave the days empty for
        every day. Audio link optional (for example from Firebase Storage).
      </p>
      {lecs.map((l, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-black/10 p-3 sm:grid-cols-2">
          <input
            className={input}
            placeholder="Title"
            value={l.title}
            onChange={(e) => setL(i, { title: e.target.value })}
          />
          <input
            className={input}
            placeholder="Speaker"
            value={l.speaker}
            onChange={(e) => setL(i, { speaker: e.target.value })}
          />
          <input
            className={input}
            type="time"
            value={l.start}
            onChange={(e) => setL(i, { start: e.target.value })}
          />
          <input
            className={input}
            inputMode="numeric"
            placeholder="Minutes"
            value={l.minutes || ""}
            onChange={(e) => setL(i, { minutes: Number(e.target.value.replace(/\D/g, "")) || 0 })}
          />
          <div className="flex flex-wrap gap-1 sm:col-span-2">
            {DAYS.map((d, k) => (
              <button
                key={d}
                onClick={() =>
                  setL(i, {
                    days: (l.days ?? []).includes(k)
                      ? (l.days ?? []).filter((x) => x !== k)
                      : [...(l.days ?? []), k],
                  })
                }
                className={pickBtn((l.days ?? []).includes(k))}
              >
                {d}
              </button>
            ))}
          </div>
          <input
            className={input + " sm:col-span-2"}
            placeholder="Audio link (optional)"
            value={l.audioUrl ?? ""}
            onChange={(e) => setL(i, { audioUrl: e.target.value })}
          />
          <button
            onClick={() => setLecs(lecs.filter((_, k) => k !== i))}
            className={`${btn} bg-black/5 text-[12px] sm:col-span-2`}
          >
            Remove lecture
          </button>
        </div>
      ))}
      <button
        onClick={() => setLecs([...lecs, { title: "", speaker: "", start: "17:00", minutes: 45 }])}
        className={`${btn} bg-black/5`}
      >
        + Add lecture
      </button>
      <h3 className="font-bold">This mosque's quiz</h3>
      <p className="text-[12.5px] opacity-70">
        Asked by the mosque's sheikh, before the general questions. {QS_HELP}
      </p>
      <textarea className={area} rows={10} value={quiz} onChange={(e) => setQuiz(e.target.value)} />
      <div className="text-[12px] opacity-70">{parseQs(quiz).length} questions read correctly</div>
      <button
        onClick={async () => {
          await setContent(keyOf("mosque", sel), {
            lectures: lecs
              .filter((l) => l.title.trim() && /^\d\d:\d\d$/.test(l.start) && l.minutes > 0)
              .map((l) => ({ ...l, days: l.days ?? [], audioUrl: l.audioUrl?.trim() || "" })),
            quiz: parseQs(quiz),
          });
          setMsg("Saved. Players see it now.");
        }}
        className={`${btn} bg-[#1f6f63] text-white`}
      >
        Save mosque
      </button>
      <Saved msg={msg} />
    </div>
  );
}

/* ---------------- schools ---------------- */
function Schools() {
  const list = all().filter(({ l }) => l.classes?.length && l.kind !== "faculty");
  const [sel, setSel] = useState(list[0]?.l.id ?? "");
  const school = list.find((x) => x.l.id === sel)?.l;
  const subjects = SUBJECTS.filter((s) => !school?.subjects || school.subjects.includes(s.id));
  const bands = [...new Set((school?.classes ?? []).map(bandOf))];
  const [sub, setSub] = useState(subjects[0]?.id ?? "");
  const [band, setBand] = useState(bands[0] ?? "primary");
  const [text, setText] = useState("");
  const [custom, setCustom] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const id = keyOf("school", sel, sub, band);
  useEffect(() => {
    setMsg(null);
    void getContent<QuizDoc>(id, true).then((d) => {
      setCustom(!!d?.quiz?.length);
      const cls = school?.classes?.find((c) => bandOf(c) === band) ?? "Primary 1";
      setText(formatQs(d?.quiz?.length ? d.quiz : quizFor(sub, cls)));
    });
  }, [id, sub, band, school]);
  return (
    <div className="max-w-3xl space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">School quizzes</h2>
      <select className={input} value={sel} onChange={(e) => setSel(e.target.value)}>
        {list.map(({ l, d }) => (
          <option key={l.id} value={l.id}>
            {l.name} · {d.name}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)} className={pickBtn(sub === s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {bands.map((b) => (
          <button key={b} onClick={() => setBand(b)} className={pickBtn(band === b)}>
            {b === "primary" ? "Primary" : b === "junior" ? "JSS" : "SS"}
          </button>
        ))}
      </div>
      <p className="text-[12.5px] opacity-70">
        {custom ? "This school's own questions." : "Built-in questions (not saved yet)."} Players
        get up to 10 at a time. {QS_HELP}
      </p>
      <textarea className={area} rows={14} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="text-[12px] opacity-70">{parseQs(text).length} questions read correctly</div>
      <button
        onClick={async () => {
          await setContent(id, { quiz: parseQs(text) });
          setCustom(true);
          setMsg("Saved. Players see it now.");
        }}
        className={`${btn} bg-[#1f6f63] text-white`}
      >
        Save quiz
      </button>
      <Saved msg={msg} />
    </div>
  );
}

/* ---------------- MSSN centres ---------------- */
function Mssn() {
  const list = all().filter(({ l }) => l.id.endsWith("-mssn"));
  const [sel, setSel] = useState(list[0]?.l.id ?? "");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setMsg(null);
    void getContent<QuizDoc>(keyOf("mssn", sel), true).then((d) =>
      setText(formatQs(d?.quiz ?? [])),
    );
  }, [sel]);
  return (
    <div className="max-w-3xl space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">MSSN centre quizzes</h2>
      <select className={input} value={sel} onChange={(e) => setSel(e.target.value)}>
        {list.map(({ l, d }) => (
          <option key={l.id} value={l.id}>
            {l.name} · {d.name}
          </option>
        ))}
      </select>
      <p className="text-[12.5px] opacity-70">
        Asked when a player takes the quiz at this MSSN centre, before the general questions.{" "}
        {QS_HELP}
      </p>
      <textarea className={area} rows={14} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="text-[12px] opacity-70">{parseQs(text).length} questions read correctly</div>
      <button
        onClick={async () => {
          await setContent(keyOf("mssn", sel), { quiz: parseQs(text) });
          setMsg("Saved. Players see it now.");
        }}
        className={`${btn} bg-[#1f6f63] text-white`}
      >
        Save quiz
      </button>
      <Saved msg={msg} />
    </div>
  );
}
