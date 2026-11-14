import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Lightbulb, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { awardXp } from "@/lib/xp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isHtmlLesson, isRight, pick, voiceName, youtubeId, type Lesson, type Screen, type Voices } from "@/components/study-data";

/* ---------------- voice ---------------- */

let current: HTMLAudioElement | null = null;
/** Plays the recorded clip in the learner's voice language; if there is none, the phone reads `text` aloud. */
export function speak(voices: Voices | undefined, lang: string, text?: string, textLang = "ar") {
  try { current?.pause(); window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  const url = pick(voices, lang);
  if (url) { current = new Audio(url); void current.play().catch(() => {}); return; }
  if (!text || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = textLang; u.rate = 0.85;
  window.speechSynthesis.speak(u);
}
const hasArabic = (s = "") => /[؀-ۿ]/.test(s);
const sayLang = (s: string, lang: string) => (hasArabic(s) ? "ar" : lang);

function Speaker({ onClick, label = "Listen" }: { onClick: () => void; label?: string }) {
  return <button type="button" onClick={onClick} aria-label={label} className="grid size-12 shrink-0 place-items-center border-2 border-foreground bg-primary shadow-brutal-sm active:translate-y-0.5"><Volume2 className="size-6" /></button>;
}

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; };
const PRAISE = ["أحسنت!", "ممتاز!", "MashaAllah!", "Great job!"];

/* ---------------- player ---------------- */

export function LessonPlayer({ lesson, lang, uid, done, note, onExit, onFinished }: {
  lesson: Lesson; lang: string; uid: string | null; done: boolean; note: string;
  onExit: () => void; onFinished: () => void;
}) {
  if (isHtmlLesson(lesson)) return <HtmlLesson lesson={lesson} lang={lang} uid={uid} done={done} note={note} onExit={onExit} onFinished={onFinished} />;
  return <ScreensLesson lesson={lesson} lang={lang} uid={uid} done={done} note={note} onExit={onExit} onFinished={onFinished} />;
}

type PlayerProps = { lesson: Lesson; lang: string; uid: string | null; done: boolean; note: string; onExit: () => void; onFinished: () => void };

async function markDone(uid: string | null, lessonId: string, done: boolean) {
  if (!uid || done) return;
  await setDoc(doc(db, "studyProgress", uid), { done: { [lessonId]: Date.now() } }, { merge: true }).catch(() => {});
  void awardXp("lesson", { id: lessonId });
}

/* ---------------- HTML lesson: the uploaded page, in the learner's voice language ---------------- */

function HtmlLesson({ lesson, lang, uid, done, note, onExit, onFinished }: PlayerProps) {
  const langs = Object.entries(lesson.html ?? {}).filter(([, u]) => u).map(([k]) => k);
  const [chosen, setChosen] = useState(lesson.html?.[lang as keyof typeof lesson.html] ? lang : langs.includes("en") ? "en" : langs[0] ?? "");
  const url = lesson.html?.[chosen as keyof typeof lesson.html];
  const [finished, setFinished] = useState(false);
  const [myNote, setMyNote] = useState(note);
  const finish = async () => { await markDone(uid, lesson.id, done); setFinished(true); onFinished(); };
  useEffect(() => {
    const on = (e: MessageEvent) => { const d = e.data as { type?: string } | null; if (d?.type === "ilmstation:done") void finish(); };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  const saveNote = () => { if (uid) void setDoc(doc(db, "studyProgress", uid), { notes: { [lesson.id]: myNote } }, { merge: true }).catch(() => {}); };

  return <div className="iq-rise">
    <div className="flex flex-wrap items-center gap-3">
      <button aria-label="Close lesson" onClick={() => { saveNote(); onExit(); }} className="grid size-10 place-items-center border-2 border-foreground bg-background"><X className="size-5" /></button>
      <div className="min-w-0 flex-1">
        <h1 className="font-serif text-2xl leading-tight sm:text-3xl">{lesson.title}</h1>
        {(lesson.book || lesson.part) && <p dir="auto" className="text-sm text-muted-foreground">{[lesson.book, lesson.part].filter(Boolean).join(" · ")}</p>}
      </div>
      {langs.length > 1 && <select value={chosen} onChange={(e) => setChosen(e.target.value)} aria-label="Lesson voice" className="border-2 border-foreground bg-background px-2 py-2 text-sm font-semibold">{langs.map((l) => <option key={l} value={l}>🔊 {voiceName(l)}</option>)}</select>}
    </div>
    {url ? <iframe key={url} src={url} title={lesson.title} sandbox="allow-scripts allow-popups" allow="autoplay; fullscreen"
      className="mt-4 h-[75vh] min-h-[480px] w-full border-2 border-foreground bg-background shadow-brutal" />
      : <p className="mt-4 border-2 border-dashed border-foreground p-6 text-sm text-muted-foreground">This lesson isn't uploaded yet.</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div className="border-2 border-foreground bg-card p-4 shadow-brutal-sm">
        <h2 className="font-serif text-xl">My notes</h2>
        <textarea value={myNote} onChange={(e) => setMyNote(e.target.value)} onBlur={saveNote} rows={2} aria-label="My notes" placeholder="Write what you learnt…" className="mt-2 w-full border-2 border-foreground bg-background p-2 text-sm outline-none" />
        {lesson.pdfUrl && <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold underline">Download the worksheet</a>}
      </div>
      {finished || done ? <div className="flex flex-col items-center gap-2 border-2 border-foreground bg-secondary p-4 text-secondary-foreground shadow-brutal-sm"><Trophy className="size-8" /><b>Lesson complete</b><Button variant="outline" className="bg-background text-foreground" onClick={() => { saveNote(); onExit(); }}>Back to lessons <ChevronRight /></Button></div>
        : <Button size="lg" onClick={() => void finish()}><Check /> I've finished this lesson</Button>}
    </div>
  </div>;
}

/* ---------------- screens lesson (built in the admin) ---------------- */

function ScreensLesson({ lesson, lang, uid, done, note, onExit, onFinished }: PlayerProps) {
  const screens = lesson.screens ?? [];
  const [i, setI] = useState(0);
  const [ok, setOk] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const [myNote, setMyNote] = useState(note);
  const s = screens[i];
  const passive = !s || s.type === "explain" || s.type === "video" || s.type === "game";

  useEffect(() => { setOk(passive); }, [i, passive]);

  const next = async () => {
    if (i + 1 < screens.length) { setI(i + 1); return; }
    setFinished(true);
    await markDone(uid, lesson.id, done);
    onFinished();
  };
  const saveNote = () => { if (uid) void setDoc(doc(db, "studyProgress", uid), { notes: { [lesson.id]: myNote } }, { merge: true }).catch(() => {}); };

  if (finished || !screens.length) {
    const asked = screens.filter((x) => !["explain", "video", "game"].includes(x.type)).length;
    return <div className="iq-rise mx-auto max-w-xl">
      <div className="border-2 border-foreground bg-primary p-8 text-center shadow-brutal">
        <Trophy className="mx-auto size-14" />
        <h1 className="mt-3 font-serif text-4xl">{screens.length ? "Lesson complete" : "This lesson has no screens yet"}</h1>
        <p className="mt-1">{lesson.title}</p>
        {asked > 0 && <p className="mt-2 text-sm">{mistakes === 0 ? "No mistakes. Excellent!" : `${mistakes} mistake${mistakes > 1 ? "s" : ""} on the way. Keep going!`}</p>}
      </div>
      <div className="mt-5 border-2 border-foreground bg-card p-5 shadow-brutal-sm">
        <h2 className="font-serif text-2xl">My notes</h2>
        <textarea value={myNote} onChange={(e) => setMyNote(e.target.value)} onBlur={saveNote} rows={3} aria-label="My notes" placeholder="Write what you learnt…" className="mt-2 w-full border-2 border-foreground bg-background p-3 text-sm outline-none" />
        {lesson.pdfUrl && <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold underline">Download the worksheet</a>}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => { setI(0); setFinished(false); setMistakes(0); }}><RotateCcw /> Do it again</Button>
        <Button onClick={() => { saveNote(); onExit(); }}>Back to lessons <ChevronRight /></Button>
      </div>
    </div>;
  }

  return <div className="iq-rise mx-auto flex min-h-[70vh] max-w-2xl flex-col">
    <div className="flex items-center gap-3">
      <button aria-label="Close lesson" onClick={onExit} className="grid size-10 place-items-center border-2 border-foreground bg-background"><X className="size-5" /></button>
      <div className="h-4 flex-1 border-2 border-foreground p-0.5"><div className="h-full bg-secondary transition-all" style={{ width: `${(i / screens.length) * 100}%` }} /></div>
      <span className="text-sm font-bold tabular-nums">{i + 1}/{screens.length}</span>
    </div>
    <div className="mt-5 flex-1 border-2 border-foreground bg-card p-5 shadow-brutal sm:p-7">
      <ScreenView key={s!.id + i} s={s!} lang={lang} onRight={() => setOk(true)} onWrong={() => setMistakes((m) => m + 1)} />
    </div>
    <div className="mt-4 flex items-center justify-between gap-3">
      <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft /> Back</Button>
      <Button size="lg" disabled={!ok} onClick={() => void next()}>{i + 1 < screens.length ? "Next" : "Finish"} <ChevronRight /></Button>
    </div>
  </div>;
}

/* ---------------- one screen ---------------- */

function ScreenView({ s, lang, onRight, onWrong }: { s: Screen; lang: string; onRight: () => void; onWrong: () => void }) {
  const said = useRef(false);
  const autoText = s.type === "explain" ? `${s.big ?? ""} ${s.text}` : "prompt" in s ? s.prompt : "";
  const say = () => { if ("voice" in s) speak(s.voice, lang, autoText, sayLang(autoText, lang)); };
  useEffect(() => { if (!said.current && "voice" in s && pick(s.voice, lang)) { said.current = true; say(); } });

  if (s.type === "explain") return <div className="flex flex-col items-center gap-4 text-center">
    {s.title && <h2 className="font-serif text-3xl">{s.title}</h2>}
    {s.big && <p dir="auto" className="font-serif text-8xl leading-none sm:text-9xl">{s.big}</p>}
    {s.emoji && <p className="text-7xl">{s.emoji}</p>}
    {s.imageUrl && <img src={s.imageUrl} alt="" className="max-h-64 border-2 border-foreground object-contain" />}
    <p dir="auto" className="max-w-prose whitespace-pre-line text-lg leading-8">{s.text}</p>
    <Speaker onClick={say} />
  </div>;

  if (s.type === "choose") return <Choose s={s} lang={lang} say={say} onRight={onRight} onWrong={onWrong} />;
  if (s.type === "match") return <Match s={s} say={say} onRight={onRight} onWrong={onWrong} />;
  if (s.type === "tf" || s.type === "fill") return <Answer s={s} say={say} onRight={onRight} onWrong={onWrong} />;

  if (s.type === "video") {
    const v = pick(s.videos, lang);
    const yt = youtubeId(v?.youtube);
    return <div className="grid gap-3">
      {s.title && <h2 className="font-serif text-3xl">{s.title}</h2>}
      {yt ? <div className="aspect-video border-2 border-foreground"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0`} title={s.title ?? "Video"} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
        : v?.url ? <video src={v.url} controls playsInline className="w-full border-2 border-foreground" />
          : <p className="text-sm text-muted-foreground">Video coming soon.</p>}
    </div>;
  }

  return <Game s={s} />;
}

function Choose({ s, lang, say, onRight, onWrong }: { s: Extract<Screen, { type: "choose" }>; lang: string; say: () => void; onRight: () => void; onWrong: () => void }) {
  const order = useMemo(() => shuffle(s.options.map((_, k) => k)), [s]);
  const [right, setRight] = useState(false);
  const [wrong, setWrong] = useState<number[]>([]);
  return <div className="flex flex-col items-center gap-5 text-center">
    <div className="flex items-center gap-3"><h2 dir="auto" className="font-serif text-3xl sm:text-4xl">{s.prompt}</h2><Speaker onClick={say} /></div>
    {s.big && <p dir="auto" className="font-serif text-7xl">{s.big}</p>}
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">{order.map((k) => { const o = s.options[k]!; const isAns = k === s.answer; return <button key={k} type="button" disabled={right}
      onClick={() => {
        speak(o.voice, lang, o.label, sayLang(o.label, lang));
        if (isAns) { setRight(true); onRight(); } else if (!wrong.includes(k)) { setWrong([...wrong, k]); onWrong(); }
      }}
      className={cn("flex aspect-square flex-col items-center justify-center gap-1 border-2 border-foreground bg-background p-2 shadow-brutal-sm transition-transform active:scale-95",
        right && isAns && "bg-secondary text-secondary-foreground", wrong.includes(k) && "animate-pulse border-destructive opacity-50", right && !isAns && "opacity-40")}>
      {o.imageUrl ? <img src={o.imageUrl} alt="" className="max-h-24 object-contain" /> : o.emoji && <span className="text-5xl sm:text-6xl">{o.emoji}</span>}
      <span dir="auto" className={cn("font-serif", o.emoji || o.imageUrl ? "text-xl" : "text-5xl sm:text-6xl")}>{o.label}</span>
    </button>; })}</div>
    <p className={cn("min-h-8 font-serif text-2xl", right ? "text-secondary" : "text-destructive")}>{right ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : wrong.length ? "Try again" : ""}</p>
    {s.hint && !right && wrong.length > 0 && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Lightbulb className="size-4" />{s.hint}</p>}
  </div>;
}

function Match({ s, say, onRight, onWrong }: { s: Extract<Screen, { type: "match" }>; say: () => void; onRight: () => void; onWrong: () => void }) {
  const left = useMemo(() => shuffle(s.pairs.map((_, k) => k)), [s]);
  const right = useMemo(() => shuffle(s.pairs.map((_, k) => k)), [s]);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [bad, setBad] = useState<number | null>(null);
  const tap = (k: number) => {
    if (sel === null || done.includes(k)) return;
    if (k === sel) { const d = [...done, k]; setDone(d); setSel(null); if (d.length === s.pairs.length) onRight(); }
    else { setBad(k); onWrong(); setTimeout(() => setBad(null), 500); }
  };
  const cell = (on: boolean, ok: boolean, no: boolean) => cn("min-h-14 border-2 border-foreground px-3 py-2 font-serif text-xl shadow-brutal-sm", ok ? "bg-secondary text-secondary-foreground opacity-70" : on ? "bg-primary" : "bg-background", no && "animate-pulse border-destructive");
  return <div className="grid gap-4">
    <div className="flex items-center justify-center gap-3 text-center"><h2 dir="auto" className="font-serif text-3xl">{s.prompt}</h2><Speaker onClick={say} /></div>
    <p className="text-center text-sm text-muted-foreground">Tap one on the left, then its match on the right.</p>
    <div className="grid grid-cols-2 gap-3">
      <div className="grid gap-2">{left.map((k) => <button key={k} dir="auto" disabled={done.includes(k)} onClick={() => setSel(k)} className={cell(sel === k, done.includes(k), false)}>{s.pairs[k]!.left}</button>)}</div>
      <div className="grid gap-2">{right.map((k) => <button key={k} dir="auto" disabled={done.includes(k)} onClick={() => tap(k)} className={cell(false, done.includes(k), bad === k)}>{s.pairs[k]!.right}</button>)}</div>
    </div>
    {done.length === s.pairs.length && <p className="text-center font-serif text-2xl text-secondary">All matched!</p>}
  </div>;
}

function Answer({ s, say, onRight, onWrong }: { s: Extract<Screen, { type: "tf" | "fill" }>; say: () => void; onRight: () => void; onWrong: () => void }) {
  const [given, setGiven] = useState<boolean | string | undefined>(undefined);
  const [text, setText] = useState("");
  const [state, setState] = useState<"" | "right" | "wrong">("");
  const check = (g: boolean | string) => {
    setGiven(g);
    if (isRight(s.answer, g)) { setState("right"); onRight(); } else { setState("wrong"); onWrong(); }
  };
  return <div className="flex flex-col items-center gap-5 text-center">
    <div className="flex items-center gap-3"><h2 dir="auto" className="font-serif text-3xl sm:text-4xl">{s.prompt}</h2><Speaker onClick={say} /></div>
    {s.type === "tf" ? <div className="grid w-full max-w-sm grid-cols-2 gap-3">{([true, false] as const).map((v) => <button key={String(v)} disabled={state === "right"} onClick={() => check(v)}
      className={cn("min-h-20 border-2 border-foreground font-serif text-2xl shadow-brutal-sm", given === v && state === "right" && "bg-secondary text-secondary-foreground", given === v && state === "wrong" && "border-destructive bg-destructive/10")}>{v ? "True ✓" : "False ✗"}</button>)}</div>
      : <form className="flex w-full max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) check(text); }}>
        <input dir="auto" value={text} disabled={state === "right"} onChange={(e) => { setText(e.target.value); if (state === "wrong") setState(""); }} aria-label="Your answer" className="min-h-12 flex-1 border-2 border-foreground bg-background px-3 text-lg outline-none" />
        <Button type="submit" disabled={state === "right"}>Check</Button>
      </form>}
    {state === "right" && <p className="flex items-center gap-2 font-serif text-2xl text-secondary"><Check /> Correct</p>}
    {state === "wrong" && <p className="font-serif text-2xl text-destructive">Not quite. Try again.</p>}
    {state === "right" && s.why && <p className="flex max-w-prose items-start gap-2 border-2 border-foreground bg-muted p-3 text-left text-sm"><Lightbulb className="size-4 shrink-0" />{s.why}</p>}
  </div>;
}

function Game({ s }: { s: Extract<Screen, { type: "game" }> }) {
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    const on = (e: MessageEvent) => { const d = e.data as { type?: string; score?: number } | null; if (d?.type === "ilmstation:done") setScore(Number(d.score ?? 0)); };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);
  return <div className="grid gap-3">
    {s.title && <h2 className="font-serif text-3xl">{s.title}</h2>}
    {/* sandboxed: the game can run scripts but can't reach the app, the account or cookies */}
    <iframe src={s.url} title={s.title ?? "Game"} sandbox="allow-scripts" allow="autoplay" className="h-[70vh] min-h-[420px] w-full border-2 border-foreground bg-background" />
    {score !== null && <p className="text-center font-serif text-2xl text-secondary">Game finished · score {score}</p>}
  </div>;
}
