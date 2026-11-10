import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, X } from "lucide-react";
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Field, inputCls, Page, Panel, useAudit, useConfirm } from "./ui";

type Config = { year: number; start: string; days: number; winCooldownDays?: number; eidCards?: boolean };
type QuizQ = { q: string; options: string[]; answer: number };
type Form = {
  title: string; lesson: string; duaArabic: string; duaText: string; hadith: string; quiz: QuizQ[];
  opens: string; results: string; maxEntries: number; winners: number; prize: string; sponsors: string;
};
type SavedDay = { title?: string; lesson?: string; duaArabic?: string; duaText?: string; hadith?: string; quiz?: { q: string; options: string[] }[];
  opensAt?: number; resultsAt?: number; maxEntries?: number; winners?: number; prize?: string; sponsors?: string[] };

const EMPTY: Form = { title: "", lesson: "", duaArabic: "", duaText: "", hadith: "", quiz: [], opens: "", results: "", maxEntries: 1000, winners: 3, prize: "", sponsors: "" };
const blankQ = (): QuizQ => ({ q: "", options: ["", "", "", ""], answer: 0 });
const toInput = (ms?: number) => (ms ? new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const nice = (iso: string, add = 0) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d + add).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export function RamadanSection() {
  const [config, setConfig] = useState<Config>({ year: 1448, start: "2027-02-08", days: 30, winCooldownDays: 5 });
  const [filled, setFilled] = useState<Record<string, SavedDay>>({});
  const [day, setDay] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    getDoc(doc(db, "ramadanConfig", "current"))
      .then((s) => { if (s.exists()) setConfig((c) => ({ ...c, ...(s.data() as Partial<Config>) })); })
      .catch(() => {});
  }, []);
  useEffect(() => onSnapshot(collection(db, "ramadanDays"),
    (snap) => setFilled(Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as SavedDay]))), () => {}), []);

  // load the day, with its hidden answers
  useEffect(() => {
    const saved = filled[String(day)];
    const base: Form = {
      ...EMPTY, title: saved?.title ?? "", lesson: saved?.lesson ?? "", duaArabic: saved?.duaArabic ?? "", duaText: saved?.duaText ?? "", hadith: saved?.hadith ?? "",
      quiz: (saved?.quiz ?? []).map((q) => ({ q: q.q, options: [...q.options, "", "", "", ""].slice(0, 4), answer: 0 })),
      opens: toInput(saved?.opensAt), results: toInput(saved?.resultsAt), maxEntries: saved?.maxEntries ?? 1000, winners: saved?.winners ?? 3,
      prize: saved?.prize ?? "", sponsors: (saved?.sponsors ?? []).join("\n"),
    };
    setForm(base);
    getDoc(doc(db, "ramadanKeys", String(day))).then((s) => {
      const answers = (s.get("answers") ?? []) as number[];
      setForm((f) => ({ ...f, quiz: f.quiz.map((q, i) => ({ ...q, answer: answers[i] ?? 0 })) }));
    }).catch(() => {});
  }, [day, filled]);

  const saveConfig = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(config.start)) return toast.error("Pick a start date");
    if (![29, 30].includes(Number(config.days))) return toast.error("Ramadan is 29 or 30 days");
    setBusy(true);
    try {
      await setDoc(doc(db, "ramadanConfig", "current"), { year: Number(config.year), start: config.start, days: Number(config.days), winCooldownDays: Number(config.winCooldownDays ?? 5), eidCards: config.eidCards !== false });
      record(`Set Ramadan ${config.year} to start ${config.start}`); toast.success("Ramadan dates saved");
    } catch { toast.error("Couldn't save. Check you are an admin."); } finally { setBusy(false); }
  };

  const saveDay = async () => {
    if (!form.title.trim()) return toast.error("Add a title for this day");
    const quiz: QuizQ[] = [];
    for (const [i, q] of form.quiz.entries()) {
      if (!q.q.trim()) return toast.error(`Question ${i + 1} has no text`);
      const opts = q.options.map((o, oi) => ({ o: o.trim(), oi })).filter((x) => x.o);
      if (opts.length < 2) return toast.error(`Question ${i + 1} needs at least 2 options`);
      const answer = opts.findIndex((x) => x.oi === q.answer);
      if (answer < 0) return toast.error(`Question ${i + 1}: the correct answer is empty`);
      quiz.push({ q: q.q.trim(), options: opts.map((x) => x.o), answer });
    }
    const prizeOn = !!form.opens;
    const opensAt = prizeOn ? new Date(form.opens).getTime() : 0;
    const resultsAt = prizeOn ? new Date(form.results).getTime() : 0;
    if (prizeOn) {
      if (!form.results) return toast.error("Set the results time");
      if (resultsAt <= opensAt) return toast.error("Results time must be after the open time");
      if (!quiz.length) return toast.error("A prize day needs at least one question");
      if (form.maxEntries < 1) return toast.error("Entry limit must be at least 1");
    }
    const sponsors = form.sponsors.split("\n").map((x) => x.trim()).filter(Boolean);
    setBusy(true);
    try {
      await setDoc(doc(db, "ramadanDays", String(day)), {
        title: form.title.trim(), lesson: form.lesson.trim(), duaArabic: form.duaArabic.trim(), duaText: form.duaText.trim(), hadith: form.hadith.trim(),
        quiz: quiz.map(({ q, options }) => ({ q, options })), // answers are NOT stored here
        ...(prizeOn ? { opensAt, resultsAt, maxEntries: Number(form.maxEntries), winners: Number(form.winners), prize: form.prize.trim(), sponsors } : {}),
      });
      await setDoc(doc(db, "ramadanKeys", String(day)), { answers: quiz.map((q) => q.answer) }); // admin-only until results time
      record(`Saved Ramadan day ${day}: ${form.title.trim()}`); toast.success(`Day ${day} saved`);
    } catch { toast.error("Couldn't save. Check you are an admin."); } finally { setBusy(false); }
  };

  const clearDay = () => ask({
    title: `Clear day ${day}?`, body: "Users will see “Coming soon” for this day.", confirm: "Clear", destructive: true,
    run: () => {
      void Promise.all([deleteDoc(doc(db, "ramadanDays", String(day))), deleteDoc(doc(db, "ramadanKeys", String(day)))])
        .then(() => { record(`Cleared Ramadan day ${day}`); toast.success("Cleared"); }).catch(() => toast.error("Couldn't clear."));
    },
  });

  const setQ = (i: number, patch: Partial<QuizQ>) => setForm((f) => ({ ...f, quiz: f.quiz.map((q, k) => (k === i ? { ...q, ...patch } : q)) }));
  const today0 = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
  const [sy, sm, sd] = config.start.split("-").map(Number);
  const diff = Math.round((today0 - new Date(sy ?? 2027, (sm ?? 1) - 1, sd ?? 1).getTime()) / 86_400_000);
  const isPast = (n: number) => n <= diff;
  const over = diff >= config.days;
  // open on today's day (or the last day once Ramadan is over)
  useEffect(() => { if (diff >= 0) setDay(Math.min(diff + 1, config.days)); }, [config.start, config.days]); // eslint-disable-line react-hooks/exhaustive-deps
  const count = Object.keys(filled).filter((k) => Number(k) <= config.days).length;
  const saved = filled[String(day)];

  return <Page eyebrow="App · seasonal" title="Ramadan">
    <Panel title="Ramadan dates" tag={`Ramadan ${config.year}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Hijri year"><input type="number" className={inputCls} value={config.year} onChange={(e) => setConfig({ ...config, year: Number(e.target.value) })} /></Field>
        <Field label="First day of fasting"><input type="date" className={inputCls} value={config.start} onChange={(e) => setConfig({ ...config, start: e.target.value })} /></Field>
        <Field label="Number of days"><select className={inputCls} value={config.days} onChange={(e) => setConfig({ ...config, days: Number(e.target.value) })}><option value={30}>30 days</option><option value={29}>29 days</option></select></Field>
        <Field label="Can win again after (days)"><input type="number" min={0} className={inputCls} value={config.winCooldownDays ?? 5} onChange={(e) => setConfig({ ...config, winCooldownDays: Number(e.target.value) })} /></Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold"><input type="checkbox" checked={config.eidCards !== false} onChange={(e) => setConfig({ ...config, eidCards: e.target.checked })} /> Eid card maker on</label>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Day 1: <b>{nice(config.start)}</b> · Last day: <b>{nice(config.start, config.days - 1)}</b>. Update this when the moon is sighted.</p>
      <Button className="mt-4" disabled={busy} onClick={() => void saveConfig()}><Save /> Save dates</Button>
    </Panel>

    <div className="mt-6">
      <Panel title="Daily quest" tag={`${count} of ${config.days} written`}>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">{Array.from({ length: config.days }, (_, i) => i + 1).map((n) => <button key={n} type="button" onClick={() => setDay(n)}
          className={cn("relative grid aspect-square place-items-center border-2 border-foreground text-sm font-semibold",
            n === day ? "bg-primary" : isPast(n) ? "bg-muted text-muted-foreground" : filled[String(n)] ? "bg-secondary text-secondary-foreground" : "bg-background hover:bg-muted")}>
          {n}{filled[String(n)]?.opensAt ? <span className="absolute right-0.5 top-0 text-[10px]">🏆</span> : null}
        </button>)}</div>
        <p className="mt-2 text-xs text-muted-foreground">Green = written · 🏆 = prize quiz · Yellow = editing · Grey = passed (view only).</p>
        {over && <p className="mt-3 border-2 border-foreground bg-muted p-3 text-sm font-semibold">Ramadan {config.year} has ended. Set the dates for the next Ramadan above to start writing again.</p>}

        <div className="mt-5 grid gap-3">
          <h3 className="font-serif text-2xl">Day {day}</h3>
          {isPast(day) && <p className="border-2 border-foreground bg-muted p-3 text-sm">This day has passed, so it can’t be edited. Its winners and payouts are below.</p>}
          <fieldset disabled={isPast(day)} className="contents">
          <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The meaning of Taqwa" /></Field>

          <p className="mt-2 text-xs font-bold uppercase">① Today’s lesson</p>
          <textarea rows={6} aria-label="Lesson" className={`${inputCls} h-auto py-2`} value={form.lesson} onChange={(e) => setForm({ ...form, lesson: e.target.value })} />
          <p className="mt-2 text-xs font-bold uppercase">② Dua</p>
          <textarea rows={2} dir="rtl" aria-label="Dua in Arabic" className={`${inputCls} h-auto py-2 font-arabic text-xl`} value={form.duaArabic} onChange={(e) => setForm({ ...form, duaArabic: e.target.value })} placeholder="الدعاء بالعربية" />
          <input aria-label="Dua translation" className={inputCls} value={form.duaText} onChange={(e) => setForm({ ...form, duaText: e.target.value })} placeholder="Translation" />
          <p className="mt-2 text-xs font-bold uppercase">③ Reminder</p>
          <textarea rows={2} aria-label="Reminder" className={`${inputCls} h-auto py-2`} value={form.hadith} onChange={(e) => setForm({ ...form, hadith: e.target.value })} placeholder="A hadith or reminder, with its source" />

          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase">④ Quiz <span className="font-normal normal-case text-muted-foreground">(up to 3 questions)</span></p>
            {form.quiz.length < 3 && <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, quiz: [...f.quiz, blankQ()] }))}><Plus /> Add question</Button>}
          </div>
          {form.quiz.map((q, i) => <div key={i} className="border-2 border-foreground p-3">
            <div className="flex items-center gap-2">
              <input className={`${inputCls} flex-1`} value={q.q} onChange={(e) => setQ(i, { q: e.target.value })} placeholder={`Question ${i + 1}`} aria-label={`Question ${i + 1}`} />
              <Button size="icon" variant="outline" aria-label={`Remove question ${i + 1}`} onClick={() => setForm((f) => ({ ...f, quiz: f.quiz.filter((_, k) => k !== i) }))}><X /></Button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">{q.options.map((o, oi) => <label key={oi} className="flex items-center gap-2">
              <input type="radio" name={`answer-${i}`} checked={q.answer === oi} onChange={() => setQ(i, { answer: oi })} aria-label={`Option ${oi + 1} is correct`} />
              <input className={`${inputCls} flex-1`} value={o} onChange={(e) => setQ(i, { options: q.options.map((x, k) => (k === oi ? e.target.value : x)) })} placeholder={`Option ${oi + 1}`} />
            </label>)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Tick the correct answer. Users can’t see it until results time.</p>
          </div>)}

          <fieldset className="mt-2 border-2 border-foreground p-3">
            <legend className="px-1 text-xs font-bold uppercase">⑤ Prize (optional)</legend>
            <p className="text-xs text-muted-foreground">Leave “Quiz opens” empty for a normal practice quiz. Times are in your timezone ({tz}); users see them in theirs.</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="Quiz opens"><input type="datetime-local" className={inputCls} value={form.opens} onChange={(e) => setForm({ ...form, opens: e.target.value })} /></Field>
              <Field label="Results shown (e.g. after Tarawih)"><input type="datetime-local" className={inputCls} value={form.results} onChange={(e) => setForm({ ...form, results: e.target.value })} /></Field>
              <Field label="Entry limit"><input type="number" min={1} className={inputCls} value={form.maxEntries} onChange={(e) => setForm({ ...form, maxEntries: Number(e.target.value) })} /></Field>
              <Field label="Number of winners"><input type="number" min={1} className={inputCls} value={form.winners} onChange={(e) => setForm({ ...form, winners: Number(e.target.value) })} /></Field>
              <Field label="Prize (per winner)"><input className={inputCls} value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} placeholder="e.g. ₦5,000 each" /></Field>
              <Field label="Sponsors (one per line)"><textarea rows={3} className={`${inputCls} h-auto py-2`} value={form.sponsors} onChange={(e) => setForm({ ...form, sponsors: e.target.value })} placeholder={"Al-Barakah Foods\nCrescent Bank"} /></Field>
            </div>
          </fieldset>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void saveDay()}><Save /> Save day {day}</Button>
            {saved && <Button variant="outline" onClick={clearDay}><Trash2 /> Clear</Button>}
          </div>
          </fieldset>

          {saved?.opensAt && saved.resultsAt && <Winners day={day} resultsAt={saved.resultsAt} winners={saved.winners ?? 0} max={saved.maxEntries ?? 1000} />}
        </div>
      </Panel>
    </div>
    {dialog}
  </Page>;
}

type Row = { uid: string; name: string; at: number; correct: boolean; recentWinner?: boolean };
type Payout = { accountName?: string; bank?: string; accountNumber?: string; accountLast4?: string; phone?: string; paid?: boolean };

function Winners({ day, resultsAt, winners, max }: { day: number; resultsAt: number; winners: number; max: number }) {
  const [count, setCount] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [payouts, setPayouts] = useState<Record<string, Payout>>({});
  const out = Date.now() >= resultsAt;

  const load = () => {
    getDoc(doc(db, "ramadanStats", String(day))).then((s) => setCount(Number(s.get("count")) || 0)).catch(() => {});
    getDocs(query(collection(db, "ramadanResults", String(day), "list"), orderBy("rankKey"), limit(Math.max(winners * 2, 10))))
      .then(async (s) => {
        const all = s.docs.map((d) => d.data() as Row).filter((r) => r.correct);
        setRows(all);
        const win = all.filter((r) => !r.recentWinner).slice(0, winners);
        const ps = await Promise.all(win.map((r) => getDoc(doc(db, "ramadanPayouts", `${day}_${r.uid}`)).then((p) => [r.uid, p.data() as Payout | undefined] as const)));
        setPayouts(Object.fromEntries(ps.filter(([, p]) => p) as [string, Payout][]));
      }).catch(() => {});
  };
  useEffect(load, [day, winners]); // eslint-disable-line react-hooks/exhaustive-deps

  const markPaid = async (uid: string) => {
    try {
      await updateDoc(doc(db, "ramadanPayouts", `${day}_${uid}`), { paid: true, paidAt: Date.now(), accountNumber: deleteField() });
      toast.success("Marked as paid. The account number has been deleted.");
      load();
    } catch { toast.error("Couldn't update. Try again."); }
  };
  const winIds = rows.filter((r) => !r.recentWinner).slice(0, winners).map((r) => r.uid);

  return <div className="mt-4 border-2 border-foreground p-3">
    <p className="font-semibold">Entries: {count.toLocaleString()} of {max.toLocaleString()} {out ? "· results are out" : "· results not out yet"}</p>
    {rows.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No all-correct entries yet.</p> :
      <ol className="mt-2 grid gap-1 text-sm">{rows.map((r, i) => { const isWin = winIds.includes(r.uid); const p = payouts[r.uid]; return <li key={r.uid} className={cn("border-2 border-foreground px-3 py-2", isWin && "bg-primary")}>
        <div className="flex justify-between gap-2"><b>{isWin ? "🏆 " : ""}{i + 1}. {r.name}{r.recentWinner && <span className="font-normal"> · recent winner</span>}</b><span className="tabular-nums">{new Date(r.at).toLocaleTimeString()}</span></div>
        {isWin && (!p ? <p className="mt-1 text-xs">Payout details not sent yet</p> : <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>{p.accountName} · {p.bank} · {p.accountNumber ?? `••••${p.accountLast4 ?? ""}`} · {p.phone}</span>
          {p.paid ? <b>Paid ✓</b> : <Button size="sm" onClick={() => void markPaid(r.uid)}>Mark as paid</Button>}
        </div>)}
      </li>; })}</ol>}
  </div>;
}
