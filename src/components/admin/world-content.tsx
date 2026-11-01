import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  builtInSchoolQuizzes, levels, MAX_TOPICS, mosques, mssnCentres, schoolLevels, schoolQuizKey, schools, seedCourseLinks, seedCourses, seedLectures,
  subjects, universities, weekDays, type Course, type CourseLink, type Lecture,
} from "./world-data";
import { uid, useAdminStore } from "./store";
import { Choice, Field, inputCls, Page, Panel, SearchBox, useAudit, useConfirm } from "./ui";
import { Chips, QuizText } from "./world";

const tabs = [["university", "University courses"], ["mosque", "Mosque lectures & quizzes"], ["school", "School quizzes"], ["mssn", "MSSN quizzes"]] as const;
type Tab = (typeof tabs)[number][0];

export function WorldContentSection() {
  const [tab, setTab] = useState<Tab>("university");
  return <Page eyebrow="IlmWorld · campuses, mosques & schools" title="World content">
    <div className="mb-5"><Chips label="Content type" value={tab} onChange={setTab} options={tabs} /></div>
    {tab === "university" && <UniversityCourses />}
    {tab === "mosque" && <MosqueLectures />}
    {tab === "school" && <SchoolQuizzes />}
    {tab === "mssn" && <MssnQuizzes />}
  </Page>;
}

/** Draft-and-save quiz editor. Give it a `key` per selection so the draft resets when the selection changes. */
function SavedQuiz({ saved, fallback, onSave, onReset, note }: { saved: string | undefined; fallback?: string; onSave: (text: string) => void; onReset?: () => void; note?: string }) {
  const [draft, setDraft] = useState(saved ?? fallback ?? "");
  const dirty = draft !== (saved ?? fallback ?? "");
  return <div className="grid gap-3">
    {note && <p className="text-xs text-muted-foreground">{note}</p>}
    <QuizText value={draft} onChange={setDraft} rows={12} />
    <div className="flex flex-wrap gap-2">
      <Button disabled={!dirty && saved !== undefined} onClick={() => onSave(draft)}>Save quiz</Button>
      {dirty && <Button variant="outline" onClick={() => setDraft(saved ?? fallback ?? "")}>Discard changes</Button>}
      {onReset && saved !== undefined && <Button variant="outline" onClick={onReset}>Use built-in questions</Button>}
    </div>
  </div>;
}

/* ---------- University courses ---------- */

/** "eng101" → "ENG 101", so the same course code always matches across universities. */
const normCode = (c: string) => c.toUpperCase().replace(/\s+/g, "").replace(/^([A-Z]+)(\d+)$/, "$1 $2");

function UniversityCourses() {
  const [customFaculties, setCustomFaculties] = useAdminStore<Record<string, string[]>>("world_custom_faculties", {});
  const [courses, setCourses] = useAdminStore<Record<string, Course>>("world_courses", seedCourses);
  const [links, setLinks] = useAdminStore<CourseLink[]>("world_course_links", seedCourseLinks);
  const [uni, setUni] = useState(universities[0]!.id);
  const [faculty, setFaculty] = useState(universities[0]!.faculties[1] ?? "");
  const [department, setDepartment] = useState("Computer Science");
  const [level, setLevel] = useState(levels[0]!);
  const [newFaculty, setNewFaculty] = useState("");
  const [newCourse, setNewCourse] = useState({ code: "", title: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  const u = universities.find((x) => x.id === uni)!;
  const faculties = [...u.faculties, ...(customFaculties[uni] ?? [])];
  const departments = [...new Set(links.filter((l) => l.uni === uni && l.faculty === faculty).map((l) => l.department))];
  const here = links.filter((l) => l.uni === uni && l.faculty === faculty && l.department.toLowerCase() === department.trim().toLowerCase() && l.level === level);
  const course = selected ? courses[selected] : undefined;
  const sharedAt = (code: string) => links.filter((l) => l.code === code).length;

  const pickUni = (id: string) => { setUni(id); setFaculty(universities.find((x) => x.id === id)!.faculties[0] ?? ""); setSelected(null); };
  const addFaculty = () => {
    const name = newFaculty.trim();
    if (!name || faculties.some((f) => f.toLowerCase() === name.toLowerCase())) { toast.error(name ? "That faculty already exists" : "Type a faculty name"); return; }
    setCustomFaculties((m) => ({ ...m, [uni]: [...(m[uni] ?? []), name] }));
    record(`Added ${name} at ${u.name}`); setFaculty(name); setNewFaculty("");
  };
  const addCourse = () => {
    const code = normCode(newCourse.code);
    if (!/^[A-Z]{2,4} \d{3}$/.test(code)) { toast.error("Use a course code like ENG 101"); return; }
    if (!department.trim()) { toast.error("Choose or type a department"); return; }
    if (here.some((l) => l.code === code)) { toast.error(`${code} is already taught here`); return; }
    const existing = courses[code];
    if (!existing && !newCourse.title.trim()) { toast.error("Give the new course a title"); return; }
    if (!existing) setCourses((m) => ({ ...m, [code]: { code, title: newCourse.title.trim(), topics: [] } }));
    setLinks((l) => [...l, { id: uid(), uni, faculty, department: department.trim(), level, code }]);
    record(`Added ${code} to ${u.name} · ${department.trim()} ${level}L`);
    toast.success(existing ? `${code} linked — it shares topics with ${sharedAt(code)} other place${sharedAt(code) === 1 ? "" : "s"}` : `${code} created`);
    setSelected(code); setNewCourse({ code: "", title: "" });
  };
  const editCourse = (fn: (c: Course) => Course) => { if (selected) setCourses((m) => ({ ...m, [selected]: fn(m[selected]!) })); };

  return <div className="grid gap-5">
    <Panel title="Where it's taught">
      <p className="mb-4 text-sm text-muted-foreground">Choose a university and faculty, then a department, level and course. Each course can have up to {MAX_TOPICS} topics, each with notes and quiz questions. Courses are shared: a course code (e.g. ENG 101) is the same at every university.</p>
      <div className="grid gap-4">
        <Chips label="University" value={uni} onChange={pickUni} options={universities.map((x) => [x.id, x.name] as const)} />
        <div className="border-t-2 border-foreground pt-4"><Chips label="Faculty" value={faculty} onChange={(f) => { setFaculty(f); setSelected(null); }} options={faculties.map((f) => [f, f] as const)} /></div>
        <div className="flex flex-wrap gap-2">
          <input className={cn(inputCls, "max-w-xs")} placeholder="New faculty, e.g. Faculty of Veterinary" value={newFaculty} onChange={(e) => setNewFaculty(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addFaculty(); }} />
          <Button variant="outline" onClick={addFaculty}><Plus /> Add faculty</Button>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">Built-in faculties each have their own building on campus. Faculties you add here are taught in the Faculties Complex.</p>
        <div className="grid gap-3 border-t-2 border-foreground pt-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Field label="Department">
            <input className={inputCls} list="world-departments" value={department} onChange={(e) => { setDepartment(e.target.value); setSelected(null); }} placeholder="e.g. Computer Science" />
            <datalist id="world-departments">{departments.map((d) => <option key={d} value={d} />)}</datalist>
          </Field>
          <Field label="Level"><Chips label="Level" value={level} onChange={(l) => { setLevel(l); setSelected(null); }} options={levels.map((l) => [l, `${l}L`] as const)} /></Field>
        </div>
      </div>
    </Panel>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Panel title="Courses" tag={`${u.name} · ${department || "—"} · ${level}L`}>
        {here.length ? <ul className="grid gap-2">{here.map((l) => { const c = courses[l.code]; return <li key={l.id} className="flex items-center gap-2">
          <button type="button" onClick={() => setSelected(l.code)} className={cn("min-w-0 flex-1 border-2 border-foreground px-3 py-2 text-left text-sm", selected === l.code ? "bg-primary shadow-brutal-sm" : "bg-card hover:bg-muted")}>
            <b>{l.code}</b> · {c?.title}<span className="block text-xs text-muted-foreground">{c?.topics.length ?? 0}/{MAX_TOPICS} topics · taught in {sharedAt(l.code)} place{sharedAt(l.code) === 1 ? "" : "s"}</span>
          </button>
          <Button size="icon" variant="outline" aria-label={`Remove ${l.code} from here`} onClick={() => ask({ title: `Remove ${l.code} from ${department} ${level}L?`, body: "Only this listing is removed. The course and its topics stay wherever else it is taught.", confirm: "Remove", destructive: true, run: () => { setLinks((x) => x.filter((y) => y.id !== l.id)); if (selected === l.code) setSelected(null); record(`Removed ${l.code} from ${u.name} · ${department} ${level}L`); } })}><Trash2 /></Button>
        </li>; })}</ul> : <p className="text-sm text-muted-foreground">No courses here yet.</p>}
        <div className="mt-4 grid gap-2 border-t-2 border-foreground pt-4">
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
            <input className={inputCls} placeholder="ENG 101" aria-label="Course code" value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} />
            <input className={inputCls} aria-label="Course title" placeholder={courses[normCode(newCourse.code)]?.title ?? "Course title"} disabled={!!courses[normCode(newCourse.code)]} value={courses[normCode(newCourse.code)] ? "" : newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
          </div>
          {courses[normCode(newCourse.code)] && <p className="text-xs text-muted-foreground">{normCode(newCourse.code)} already exists — it will be shared with its topics.</p>}
          <Button variant="outline" onClick={addCourse}><Plus /> Add course</Button>
        </div>
      </Panel>

      <Panel title={course ? `${course.code} topics` : "Topics"} tag={course ? `${course.topics.length}/${MAX_TOPICS}` : undefined}>
        {!course ? <p className="text-sm text-muted-foreground">Pick a course to edit its topics.</p> : <div className="grid gap-4">
          <Field label="Course title"><input className={inputCls} value={course.title} onChange={(e) => editCourse((c) => ({ ...c, title: e.target.value }))} /></Field>
          {sharedAt(course.code) > 1 && <p className="border-2 border-foreground bg-muted px-3 py-2 text-xs">Shared course: changes here show at all {sharedAt(course.code)} places that teach {course.code}.</p>}
          {course.topics.map((t, i) => <div key={t.id} className="grid gap-3 border-2 border-foreground bg-background p-3">
            <div className="flex items-end gap-2">
              <Field label={`Topic ${i + 1}`} className="flex-1"><input className={inputCls} value={t.title} onChange={(e) => editCourse((c) => ({ ...c, topics: c.topics.map((x) => (x.id === t.id ? { ...x, title: e.target.value } : x)) }))} /></Field>
              <Button size="icon" variant="outline" aria-label={`Delete topic ${i + 1}`} onClick={() => ask({ title: `Delete “${t.title || `Topic ${i + 1}`}”?`, body: "Its notes and quiz questions are removed everywhere this course is taught.", confirm: "Delete", destructive: true, run: () => { editCourse((c) => ({ ...c, topics: c.topics.filter((x) => x.id !== t.id) })); record(`Deleted a topic from ${course.code}`); } })}><Trash2 /></Button>
            </div>
            <Field label="Notes"><textarea rows={4} className={inputCls} value={t.notes} onChange={(e) => editCourse((c) => ({ ...c, topics: c.topics.map((x) => (x.id === t.id ? { ...x, notes: e.target.value } : x)) }))} /></Field>
            <QuizText label="Quiz questions" rows={5} value={t.quiz} onChange={(quiz) => editCourse((c) => ({ ...c, topics: c.topics.map((x) => (x.id === t.id ? { ...x, quiz } : x)) }))} />
          </div>)}
          <Button variant="outline" disabled={course.topics.length >= MAX_TOPICS} onClick={() => { editCourse((c) => ({ ...c, topics: [...c.topics, { id: uid(), title: "", notes: "", quiz: "" }] })); record(`Added a topic to ${course.code}`); }}>
            <Plus /> {course.topics.length >= MAX_TOPICS ? `${MAX_TOPICS} topics is the limit` : "Add topic"}
          </Button>
        </div>}
      </Panel>
    </div>
    {dialog}
  </div>;
}

/* ---------- Mosque lectures & quizzes ---------- */

function MosqueLectures() {
  const [lectures, setLectures] = useAdminStore<Record<string, Lecture[]>>("world_lectures", seedLectures);
  const [quizzes, setQuizzes] = useAdminStore<Record<string, string>>("world_mosque_quizzes", {});
  const [q, setQ] = useState("");
  const [mosque, setMosque] = useState(mosques[0]!);
  const { record } = useAudit();
  const matches = mosques.filter((m) => m.toLowerCase().includes(q.toLowerCase()));
  const list = lectures[mosque] ?? [];
  const setList = (fn: (l: Lecture[]) => Lecture[]) => setLectures((m) => ({ ...m, [mosque]: fn(m[mosque] ?? []) }));
  const edit = (id: string, patch: Partial<Lecture>) => setList((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return <div className="grid gap-5">
    <Panel title="Mosque">
      <div className="grid gap-2 sm:grid-cols-2">
        <SearchBox value={q} onChange={(v) => { setQ(v); const first = mosques.find((m) => m.toLowerCase().includes(v.toLowerCase())); if (first) setMosque(first); }} placeholder="Search mosques" />
        <Choice label="Mosque" className="w-full" value={matches.includes(mosque) ? mosque : matches[0] ?? mosque} onChange={setMosque} options={(matches.length ? matches : mosques).map((m) => [m, m] as const)} />
      </div>
    </Panel>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Lectures" tag={`${list.length} scheduled`}>
        <p className="mb-4 text-sm text-muted-foreground">Each lecture plays at its time when a player is in this mosque. Leave the days empty for every day. Audio link optional (for example from Firebase Storage).</p>
        <div className="grid gap-3">
          {list.map((l) => <div key={l.id} className="grid gap-2 border-2 border-foreground bg-background p-3">
            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} aria-label="Lecture title" placeholder="Title" value={l.title} onChange={(e) => edit(l.id, { title: e.target.value })} />
              <input className={inputCls} aria-label="Speaker" placeholder="Speaker" value={l.speaker} onChange={(e) => edit(l.id, { speaker: e.target.value })} />
              <Field label="Starts"><input type="time" className={inputCls} value={l.time} onChange={(e) => edit(l.id, { time: e.target.value })} /></Field>
              <Field label="Minutes"><input type="number" min={1} className={inputCls} value={l.minutes} onChange={(e) => edit(l.id, { minutes: Math.max(1, Number(e.target.value)) })} /></Field>
            </div>
            <div role="group" aria-label="Days" className="flex flex-wrap gap-1">{weekDays.map((d, i) => <button key={d} type="button" aria-pressed={l.days.includes(i)} onClick={() => edit(l.id, { days: l.days.includes(i) ? l.days.filter((x) => x !== i) : [...l.days, i].sort() })}
              className={cn("min-w-11 border-2 border-foreground px-2 py-1 text-xs font-bold", l.days.includes(i) ? "bg-primary" : "bg-card")}>{d}</button>)}
              <span className="self-center pl-1 text-xs text-muted-foreground">{l.days.length ? "" : "Every day"}</span></div>
            <input className={inputCls} aria-label="Audio link" placeholder="Audio link (optional)" value={l.audio} onChange={(e) => edit(l.id, { audio: e.target.value })} />
            <Button size="sm" variant="outline" onClick={() => { setList((x) => x.filter((y) => y.id !== l.id)); record(`Removed lecture “${l.title || "untitled"}” at ${mosque}`); }}><Trash2 /> Remove lecture</Button>
          </div>)}
          <Button variant="outline" onClick={() => { setList((x) => [...x, { id: uid(), title: "", speaker: "", time: "17:00", minutes: 45, days: [], audio: "" }]); record(`Added a lecture at ${mosque}`); }}><Plus /> Add lecture</Button>
        </div>
      </Panel>
      <Panel title="This mosque's quiz">
        <SavedQuiz key={mosque} saved={quizzes[mosque]} note="Asked by the mosque's sheikh, before the general questions."
          onSave={(text) => { setQuizzes((m) => ({ ...m, [mosque]: text })); record(`Saved quiz for ${mosque}`); toast.success("Mosque quiz saved"); }} />
      </Panel>
    </div>
  </div>;
}

/* ---------- School quizzes ---------- */

function SchoolQuizzes() {
  const [saved, setSaved] = useAdminStore<Record<string, string>>("world_school_quizzes", {});
  const [school, setSchool] = useState(schools[0]!);
  const [subject, setSubject] = useState(subjects[0]!);
  const [level, setLevel] = useState<(typeof schoolLevels)[number]>("Primary");
  const { record } = useAudit();
  const key = schoolQuizKey(school, subject, level);
  const builtIn = builtInSchoolQuizzes[`${subject}|${level}`] ?? "";

  return <Panel title="School quizzes">
    <div className="grid gap-4">
      <Choice label="School" className="w-full" value={school} onChange={setSchool} options={schools.map((s) => [s, s] as const)} />
      <Chips label="Subject" value={subject} onChange={setSubject} options={subjects.map((s) => [s, s] as const)} />
      <Chips label="Level" value={level} onChange={setLevel} options={schoolLevels.map((l) => [l, l] as const)} />
      <SavedQuiz key={key} saved={saved[key]} fallback={builtIn}
        note={`${saved[key] !== undefined ? "Saved for this school." : builtIn ? "Built-in questions (not saved yet)." : "No built-in questions for this subject yet."} Players get up to 10 at a time.`}
        onSave={(text) => { setSaved((m) => ({ ...m, [key]: text })); record(`Saved ${subject} ${level} quiz for ${school}`); toast.success("School quiz saved"); }}
        onReset={() => { setSaved((m) => { const { [key]: _, ...rest } = m; return rest; }); record(`Reset ${subject} ${level} quiz for ${school} to built-in`); }} />
    </div>
  </Panel>;
}

/* ---------- MSSN quizzes ---------- */

function MssnQuizzes() {
  const [saved, setSaved] = useAdminStore<Record<string, string>>("world_mssn_quizzes", {});
  const [centre, setCentre] = useState(mssnCentres[0]!);
  const { record } = useAudit();
  return <Panel title="MSSN centre quizzes">
    <div className="grid gap-4">
      <Choice label="MSSN centre" className="w-full" value={centre} onChange={setCentre} options={mssnCentres.map((c) => [c, c] as const)} />
      <SavedQuiz key={centre} saved={saved[centre]} note="Asked when a player takes the quiz at this MSSN centre, before the general questions."
        onSave={(text) => { setSaved((m) => ({ ...m, [centre]: text })); record(`Saved MSSN quiz for ${centre}`); toast.success("MSSN quiz saved"); }} />
    </div>
  </Panel>;
}
