import { doc as gpDoc, onSnapshot as gpSnap, setDoc as gpSet } from "firebase/firestore";
import { auth as gpAuth, db as gpDb } from "@/lib/firebase";
import { doc as fsDoc } from "firebase/firestore";
import { callPremium, UnlockDialog, usePremium } from "@/components/premium";
import { levelFor, useLevels, useMyXp } from "@/components/today";
import { useEffect, useRef, useState } from "react";
import { useLessonBridge } from "@/lib/lesson-bridge";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GraduationCap, Library, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { cn } from "@/lib/utils";
import { quizQuestionsFor } from "@/components/quiz-visual";
import { awardXp } from "@/lib/xp";
import { ContinueCard } from "@/components/today";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Go = (s: any) => void;

/** A simple, friendly home for children. */
export function KidHome({ go }: { go: Go }) {
  const { firstName } = useAuth();
  const tiles = [
    ["kidgames", "Games", "Fun quizzes · earn stars", Play, "bg-primary"],
    ["study", "Study", "Your lessons", GraduationCap, "bg-secondary text-secondary-foreground"],
  ] as const;
  return <div className="iq-rise">
    <p className="text-xs font-bold uppercase text-muted-foreground">Assalamu alaikum</p>
    <h1 className="font-serif text-5xl leading-none sm:text-6xl">Hi, {firstName || "friend"}! 👋</h1>
    <p className="mt-3 text-lg text-muted-foreground">What would you like to do today?</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{tiles.map(([id, t, b, Icon, tint]) => <button key={id} onClick={() => go(id)} className={cn("flex min-h-44 flex-col justify-between border-2 border-foreground p-6 text-left shadow-brutal transition hover:-translate-y-1", tint)}>
      <Icon className="size-12" />
      <span><b className="block font-serif text-4xl leading-none">{t}</b><span className="text-sm font-semibold">{b}</span></span>
    </button>)}</div>
    <section className="mt-6 border-2 border-foreground bg-background p-5 shadow-brutal"><ContinueCard onLibrary={() => go("library")} onPlay={() => go("kidgames")} /></section>
  </div>;
}

type KidQ = { q: string; options: string[]; answer: number; why?: string };
type KidGame = { id: string; title: string; emoji: string; tint: string; questions: KidQ[]; kind?: "quiz" | "html"; htmlUrl?: string; audience?: string; tier?: string; cost?: number; minLevel?: number; gameType?: string; subject?: string; order?: number; lang?: string };
const TINT: Record<string, string> = { yellow: "bg-primary", green: "bg-secondary text-secondary-foreground", white: "bg-background", grey: "bg-muted" };
const STARTERS: KidGame[] = ([["Dua", "🤲", "yellow"], ["Qur’an", "📖", "green"], ["Seerah", "🌙", "white"], ["Arabic", "✍️", "grey"]] as const)
  .map(([t, e, c]) => ({ id: `start-${t}`, title: t, emoji: e, tint: TINT[c]!, questions: quizQuestionsFor(t).slice(0, 5) as KidQ[] }));

/** The admin's published kids games, or the starters until there are some. */
function useKidGames(audience: "kids" | "all") {
  const [games, setGames] = useState<KidGame[]>(audience === "kids" ? STARTERS : []);
  useEffect(() => onSnapshot(query(collection(db, "kidGames"), where("status", "==", "published")), (s) => {
    const list = s.docs.map((d) => ({ id: d.id, ...(d.data() as { title: string; emoji: string; color: string; order: number; questions: KidQ[]; kind?: "quiz" | "html"; htmlUrl?: string; audience?: string; tier?: string; cost?: number; minLevel?: number }) }))
      .sort((a, b) => a.order - b.order)
      .map((g) => ({ id: g.id, title: g.title, emoji: g.emoji, tint: TINT[g.color] ?? "bg-background", questions: g.questions ?? [], kind: g.kind, htmlUrl: g.htmlUrl, audience: g.audience ?? "kids", tier: g.tier ?? "free", cost: g.cost ?? 0, minLevel: g.minLevel ?? 0, gameType: (g as { gameType?: string }).gameType ?? "quiz", subject: (g as { subject?: string }).subject || g.title, order: (g as { order?: number }).order ?? 0, lang: (g as { lang?: string }).lang ?? "all" }))
      .filter((g) => g.audience === audience && (g.kind === "html" ? !!g.htmlUrl : g.questions.length > 0)).filter((g, _i, arr) => langOk(g, arr));
    setGames(list.length ? list : audience === "kids" ? STARTERS : []);
  }, () => {}), [audience]);
  return games;
}

/** Big, simple quizzes for children. */
export function KidGames({ audience = "kids" }: { audience?: "kids" | "all" }) {
  const games = useKidGames(audience);
  const { canAccess } = usePremium();
  const myLevel = levelFor(useMyXp(), useLevels()).n;
  const [locked, setLocked] = useState<{ id: string; title: string; cost: number } | undefined>();
  const open = (g: KidGame) => g.tier !== "premium" || canAccess(`game-${g.id}`, "premium") || (!!g.minLevel && myLevel >= g.minLevel);
  const [game, setGame] = useState<KidGame | null>(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const qs = game?.questions ?? [];
  const q = qs[i];
  const start = (g: KidGame) => { if (!open(g)) { setLocked({ id: `game-${g.id}`, title: g.title, cost: g.cost ?? 0 }); return; } setGame(g); setI(0); setPick(null); setScore(0); setDone(false); };
  const pt = usePlaytime(!!game && !done);

  if (!game && audience === "kids") return <KidGameHub games={games} open={open} start={start} locked={locked} setLocked={setLocked} />;
  if (!game) return <div className="iq-rise">
    <p className="text-xs font-bold uppercase text-muted-foreground">Play and learn</p>
    <h1 className="font-serif text-5xl leading-none">{audience === "all" ? "Games & quizzes" : "Games 🎮"}</h1>
    <p className="mt-3 text-lg text-muted-foreground">{audience === "all" ? "Quizzes and games from IlmStation. Every right answer earns XP." : "Pick a game. Every right answer gets a star!"}</p>
    {games.length === 0 && <p className="mt-6 border-2 border-dashed border-foreground p-6 text-sm text-muted-foreground">New games are coming soon, in shaa Allah.</p>}
    <UnlockDialog item={locked} onOpenChange={(o) => { if (!o) setLocked(undefined); }} />
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{games.map((g) => <button key={g.id} onClick={() => start(g)} className={cn("flex items-center gap-5 border-2 border-foreground p-6 text-left shadow-brutal transition hover:-translate-y-1", g.tint)}>
      <span className="text-6xl">{g.emoji}</span>
      <span><b className="block font-serif text-4xl leading-none">{g.title}</b><span className="text-sm font-semibold">{!open(g) ? `🔒 Premium${g.minLevel ? ` · free at level ${g.minLevel}` : ""}` : g.kind === "html" ? "Tap to play" : `${g.questions.length} questions`}</span></span>
    </button>)}</div>
  </div>;

  if (pt.locked) return <TimeUp resetsAt={pt.resetsAt} kid={audience === "kids"} onBack={() => setGame(null)} />;
  if (game.kind === "html" && game.htmlUrl) return <KidHtmlGame game={game} left={pt.left} onBack={() => setGame(null)} />;

  if (done || !q) return <div className="iq-rise mx-auto max-w-2xl border-2 border-foreground bg-primary p-8 text-center shadow-brutal">
    <p className="text-6xl">🎉</p>
    <h2 className="mt-3 font-serif text-5xl">Masha’Allah!</h2>
    <p className="mt-2 text-xl font-semibold">{score} out of {qs.length}</p>
    <p className="mt-3 flex flex-wrap justify-center gap-1">{qs.map((_, k) => <Star key={k} className={cn("size-9", k < score ? "fill-current" : "opacity-30")} />)}</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Button size="lg" onClick={() => start(game)}>Play again</Button>
      <Button size="lg" variant="outline" className="bg-background" onClick={() => setGame(null)}>Pick another game</Button>
    </div>
  </div>;

  const right = pick !== null && pick === q.answer;
  return <div className="iq-rise mx-auto max-w-3xl">
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={() => setGame(null)}>← Games</Button>
      <span className="flex items-center gap-2">{pt.left >= 0 && <span className="border-2 border-foreground px-2 py-1 text-sm font-bold">⏱ {Math.ceil(pt.left / 60)} min</span>}<span className="flex items-center gap-1 border-2 border-foreground bg-primary px-3 py-1 font-bold"><Star className="size-4 fill-current" /> {score}</span></span>
    </div>
    <section className="mt-4 border-2 border-foreground bg-background p-6 shadow-brutal">
      <p className="text-sm font-bold uppercase text-muted-foreground">{game.emoji} {game.title} · question {i + 1} of {qs.length}</p>
      <h2 className="mt-2 font-serif text-4xl leading-tight" dir="auto">{q.q}</h2>
      <div className="mt-6 grid gap-3">{q.options.map((o, k) => <button key={`${k}-${o}`} disabled={pick !== null} dir="auto" onClick={() => { setPick(k); if (k === q.answer) setScore((n) => n + 1); }}
        className={cn("flex items-center gap-3 border-2 border-foreground p-4 text-left font-serif text-2xl shadow-brutal-sm",
          pick === null && "bg-background hover:bg-primary",
          pick !== null && k === q.answer && "bg-secondary text-secondary-foreground",
          pick === k && k !== q.answer && "bg-muted line-through")}>
        <span className="grid size-10 shrink-0 place-items-center border-2 border-foreground bg-background text-base font-bold text-foreground">{"ABCD"[k]}</span>{o}
      </button>)}</div>
      {pick !== null && <div className="mt-5">
        <p className="text-xl font-bold">{right ? "⭐ Well done!" : "Good try! Now you know."}</p>
        {q.why && <p className="mt-2 border-l-4 border-secondary bg-muted p-3" dir="auto">{q.why}</p>}
        <Button size="lg" className="mt-4 w-full" onClick={() => {
          if (i + 1 < qs.length) { setI(i + 1); setPick(null); return; }
          setDone(true);
          void awardXp("quiz", { correct: score, total: qs.length, difficulty: "Beginner", topic: `Kids: ${game.title}` }); markPlayed(game.id, score, qs.length);
        }}>{i + 1 < qs.length ? "Next question" : "See my stars"}</Button>
      </div>}
    </section>
  </div>;
}

/** An uploaded HTML game, in a safe sandbox. It can report the score with postMessage. */
function KidHtmlGame({ game, onBack, left = -1 }: { game: KidGame; onBack: () => void; left?: number }) {
  const [done, setDone] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  useLessonBridge(frameRef, `kids-${game.id}`); // mic, speech checking and resume for Qira'ah kids lessons
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data as { type?: string; score?: number; total?: number } | null;
      if (!d || d.type !== "ilmstation:done" || done) return;
      setDone(true);
      const total = Math.max(1, Math.min(50, Number(d.total) || 5));
      const correct = Math.max(0, Math.min(total, Number(d.score ?? total) || 0));
      void awardXp("quiz", { correct, total, difficulty: "Beginner", topic: `Kids: ${game.title}` }); markPlayed(game.id, correct, total);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [done]);
  return <div className="iq-rise">
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={onBack}>← Games</Button>
      <span className="flex items-center gap-3">{left >= 0 && <span className="border-2 border-foreground px-2 py-1 text-sm font-bold">⏱ {Math.ceil(left / 60)} min</span>}<span className="font-serif text-2xl">{game.emoji} {game.title}</span></span>
    </div>
    {done && <p className="mt-3 border-2 border-foreground bg-primary p-3 font-bold">🎉 Masha’Allah! Well done.</p>}
    <iframe ref={frameRef} title={game.title} src={game.htmlUrl} sandbox="allow-scripts" allow="autoplay" className="mt-4 h-[75vh] w-full border-2 border-foreground bg-background" />
    {!done && <Button variant="outline" className="mt-3" onClick={() => { setDone(true); void awardXp("quiz", { correct: 3, total: 5, difficulty: "Beginner", topic: `Kids: ${game.title}` }); markPlayed(game.id, 3, 5); }}>I’ve finished</Button>}
  </div>;
}

/** Counts play time on the server (every 30 seconds while a game is open). */
export function usePlaytime(active: boolean) {
  const [st, setSt] = useState<{ left: number; resetsAt: number } | null>(null);
  useEffect(() => {
    if (!active) return undefined;
    let stop = false;
    const tick = (add: number) => callPremium("playtime", { add }).then((r) => {
      const x = r as { ok?: boolean; left?: number; resetsAt?: number };
      if (!stop && x.ok) setSt({ left: Number(x.left ?? -1), resetsAt: Number(x.resetsAt ?? 0) });
    });
    void tick(0);
    const id = setInterval(() => void tick(30), 30_000);
    return () => { stop = true; clearInterval(id); };
  }, [active]);
  return { left: st?.left ?? -1, resetsAt: st?.resetsAt ?? 0, locked: !!st && st.left === 0 };
}

export function TimeUp({ resetsAt, kid, onBack }: { resetsAt: number; kid: boolean; onBack: () => void }) {
  const { premium, activatePremium } = usePremium();
  const at = resetsAt ? new Date(resetsAt).toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" }) : "tomorrow";
  return <div className="iq-rise mx-auto max-w-2xl border-2 border-foreground bg-background p-8 text-center shadow-brutal">
    <p className="text-6xl">🌙</p>
    <h2 className="mt-3 font-serif text-4xl">Time’s up for today</h2>
    <p className="mt-2 text-muted-foreground">You’ve used today’s play time. Come back {at}.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Button variant="outline" onClick={onBack}>← Back</Button>
      {!kid && !premium && <Button onClick={() => activatePremium()}>Get Premium for more time</Button>}
    </div>
  </div>;
}

/** Whether adults see the built-in Quick Quiz (admin switch). */
export function useShowQuickQuiz() {
  const [v, setV] = useState(true);
  useEffect(() => onSnapshot(fsDoc(db, "siteConfig", "play"), (snap) => setV(snap.get("showQuickQuiz") !== false), () => {}), []);
  return v;
}

/* ---------- Kids games: type → subject → Quiz 1, 2, 3 (continue where you stopped) ---------- */
type Played = Record<string, { score: number; total: number; at: number }>;
function markPlayed(id: string, score: number, total: number) {
  const uid = gpAuth.currentUser?.uid;
  if (uid) void gpSet(gpDoc(gpDb, "gameProgress", uid), { done: { [id]: { score, total, at: Date.now() } } }, { merge: true }).catch(() => {});
}
function useGameProgress(): Played {
  const [done, setDone] = useState<Played>({});
  useEffect(() => { const uid = gpAuth.currentUser?.uid; if (!uid) return undefined; return gpSnap(gpDoc(gpDb, "gameProgress", uid), (s) => setDone((s.get("done") as Played) ?? {}), () => {}); }, []);
  return done;
}
const GAME_TYPES: [string, string, string][] = [["quiz", "🧠", "Quizzes"], ["puzzle", "🧩", "Puzzles"], ["memory", "🃏", "Memory games"]];
function KidGameHub({ games, open, start, locked, setLocked }: {
  games: KidGame[]; open: (g: KidGame) => boolean; start: (g: KidGame) => void;
  locked: { id: string; title: string; cost: number } | undefined; setLocked: (v: { id: string; title: string; cost: number } | undefined) => void;
}) {
  const done = useGameProgress();
  const [type, setType] = useState<string | undefined>();
  const [subj, setSubj] = useState<string | undefined>();
  const subjOf = (g: KidGame) => g.subject || g.title;
  const typeOf = (g: KidGame) => g.gameType ?? "quiz";
  const inSubject = (t: string, sb: string) => games.filter((g) => typeOf(g) === t && subjOf(g) === sb).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const label = (t: string) => (GAME_TYPES.find(([id]) => id === t)?.[2] ?? "Games").replace(/s$/, "").replace(/ games$/, "");
  // continue: the subject played most recently → its next unfinished game
  const last = games.filter((g) => done[g.id]).sort((a, b) => done[b.id].at - done[a.id].at)[0];
  const cont = last ? inSubject(typeOf(last), subjOf(last)).find((g) => !done[g.id]) : undefined;
  const contN = cont ? inSubject(typeOf(cont), subjOf(cont)).indexOf(cont) + 1 : 0;
  const back = (t: string, f: () => void) => <button onClick={f} className="mb-4 border-2 border-foreground bg-background px-4 py-2 text-lg font-bold">← {t}</button>;
  const dialog = <UnlockDialog item={locked} onOpenChange={(o) => { if (!o) setLocked(undefined); }} />;
  const play = (g: KidGame) => (open(g) ? start(g) : setLocked({ id: `game-${g.id}`, title: g.title, cost: g.cost ?? 0 }));

  if (type && subj) { const list = inSubject(type, subj); const next = list.find((g) => !done[g.id]); return <div className="iq-rise">{dialog}
    {back("Subjects", () => setSubj(undefined))}
    <h1 className="font-serif text-5xl leading-none">{list[0]?.emoji ?? "🎮"} {subj}</h1>
    <p className="mt-2 text-lg text-muted-foreground">{list.filter((g) => done[g.id]).length} of {list.length} done ⭐</p>
    <div className="mt-6 grid gap-4">{list.map((g, i) => { const d = done[g.id]; const isNext = g === next; return <button key={g.id} onClick={() => play(g)}
      className={cn("flex items-center gap-4 border-2 border-foreground p-5 text-left shadow-brutal transition-transform hover:-translate-y-0.5", d ? "bg-primary" : isNext ? "bg-secondary text-secondary-foreground" : "bg-background")}>
      <span className="grid size-14 shrink-0 place-items-center border-2 border-foreground bg-background font-serif text-2xl text-foreground">{d ? "⭐" : i + 1}</span>
      <span className="min-w-0 flex-1"><b className="block text-xl leading-tight">Level {i + 1}{g.title && g.title !== subj ? ` · ${g.title}` : ""}</b>
        <span className="text-sm">{!open(g) ? "🔒 Premium" : d ? `${d.score} of ${d.total} right · play again` : isNext ? "▶ Next" : g.kind === "html" ? "Tap to play" : `${g.questions.length} questions`}</span></span>
    </button>; })}</div>
  </div>; }

  if (type) { const subs = [...new Set(games.filter((g) => typeOf(g) === type).map(subjOf))]; return <div className="iq-rise">{dialog}
    {back("Games", () => setType(undefined))}
    <h1 className="font-serif text-5xl leading-none">{GAME_TYPES.find(([id]) => id === type)?.[1]} {GAME_TYPES.find(([id]) => id === type)?.[2]}</h1>
    <p className="mt-3 text-lg text-muted-foreground">Pick a subject!</p>
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{subs.map((sb, i) => { const list = inSubject(type, sb); return <button key={sb} onClick={() => setSubj(sb)}
      className={cn("flex aspect-square flex-col items-center justify-center gap-2 border-2 border-foreground p-4 text-center shadow-brutal transition-transform hover:-translate-y-1", ["bg-primary", "bg-secondary text-secondary-foreground", "bg-[#d7ecd9] text-[#1c1a17]", "bg-[#f7d9c4] text-[#1c1a17]"][i % 4])}>
      <span className="text-5xl">{list[0]?.emoji ?? "🎮"}</span><b className="text-xl leading-tight">{sb}</b>
      <span className="text-sm font-semibold">{list.filter((g) => done[g.id]).length} of {list.length} ⭐</span>
    </button>; })}</div>
  </div>; }

  return <div className="iq-rise">{dialog}
    <p className="text-xs font-bold uppercase text-muted-foreground">Play and learn</p>
    <h1 className="font-serif text-5xl leading-none">Games 🎮</h1>
    <p className="mt-3 text-lg text-muted-foreground">What do you want to play?</p>
    {cont && <button onClick={() => play(cont)} className="mt-6 flex w-full items-center gap-4 border-2 border-foreground bg-secondary p-5 text-left text-secondary-foreground shadow-brutal">
      <span className="text-4xl">▶</span><span><b className="block text-xl">Continue</b><span className="text-sm">{subjOf(cont)} · Level {contN}</span></span>
    </button>}
    <div className="mt-6 grid gap-4 sm:grid-cols-3">{GAME_TYPES.map(([id, e, name], i) => { const has = games.some((g) => typeOf(g) === id); return <button key={id} disabled={!has} onClick={() => setType(id)}
      className={cn("flex min-h-40 flex-col justify-between border-2 border-foreground p-6 text-left shadow-brutal transition-transform", has ? "hover:-translate-y-1" : "opacity-60", ["bg-primary", "bg-secondary text-secondary-foreground", "bg-background"][i % 3])}>
      <span className="text-5xl">{e}</span><span><b className="block font-serif text-3xl leading-none">{name}</b><span className="text-sm font-semibold">{has ? "Tap to play" : "Coming soon"}</span></span>
    </button>; })}</div>
  </div>;
}

/** Games in the user's language (+ "all"); English when their language has none yet. */
function langOk(g: { lang?: string }, arr: { lang?: string }[]) {
  let ui = "en"; try { ui = localStorage.getItem("iq_lang") ?? "en"; } catch { /* ignore */ }
  const l = g.lang ?? "all";
  if (l === "all" || l === ui) return true;
  return l === "en" && !arr.some((x) => x.lang === ui);
}