import { useEffect, useState } from "react";
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
    ["library", "Library", "Stories and books", Library, "bg-background"],
  ] as const;
  return <div className="iq-rise">
    <p className="text-xs font-bold uppercase text-muted-foreground">Assalamu alaikum</p>
    <h1 className="font-serif text-5xl leading-none sm:text-6xl">Hi, {firstName || "friend"}! 👋</h1>
    <p className="mt-3 text-lg text-muted-foreground">What would you like to do today?</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">{tiles.map(([id, t, b, Icon, tint]) => <button key={id} onClick={() => go(id)} className={cn("flex min-h-44 flex-col justify-between border-2 border-foreground p-6 text-left shadow-brutal transition hover:-translate-y-1", tint)}>
      <Icon className="size-12" />
      <span><b className="block font-serif text-4xl leading-none">{t}</b><span className="text-sm font-semibold">{b}</span></span>
    </button>)}</div>
    <section className="mt-6 border-2 border-foreground bg-background p-5 shadow-brutal"><ContinueCard onLibrary={() => go("library")} onPlay={() => go("kidgames")} /></section>
  </div>;
}

type KidQ = { q: string; options: string[]; answer: number; why?: string };
type KidGame = { id: string; title: string; emoji: string; tint: string; questions: KidQ[]; kind?: "quiz" | "html"; htmlUrl?: string };
const TINT: Record<string, string> = { yellow: "bg-primary", green: "bg-secondary text-secondary-foreground", white: "bg-background", grey: "bg-muted" };
const STARTERS: KidGame[] = ([["Dua", "🤲", "yellow"], ["Qur’an", "📖", "green"], ["Seerah", "🌙", "white"], ["Arabic", "✍️", "grey"]] as const)
  .map(([t, e, c]) => ({ id: `start-${t}`, title: t, emoji: e, tint: TINT[c]!, questions: quizQuestionsFor(t).slice(0, 5) as KidQ[] }));

/** The admin's published kids games, or the starters until there are some. */
function useKidGames() {
  const [games, setGames] = useState<KidGame[]>(STARTERS);
  useEffect(() => onSnapshot(query(collection(db, "kidGames"), where("status", "==", "published")), (s) => {
    const list = s.docs.map((d) => ({ id: d.id, ...(d.data() as { title: string; emoji: string; color: string; order: number; questions: KidQ[]; kind?: "quiz" | "html"; htmlUrl?: string }) }))
      .sort((a, b) => a.order - b.order)
      .map((g) => ({ id: g.id, title: g.title, emoji: g.emoji, tint: TINT[g.color] ?? "bg-background", questions: g.questions ?? [], kind: g.kind, htmlUrl: g.htmlUrl }))
      .filter((g) => (g.kind === "html" ? !!g.htmlUrl : g.questions.length > 0));
    setGames(list.length ? list : STARTERS);
  }, () => {}), []);
  return games;
}

/** Big, simple quizzes for children. */
export function KidGames() {
  const games = useKidGames();
  const [game, setGame] = useState<KidGame | null>(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const qs = game?.questions ?? [];
  const q = qs[i];
  const start = (g: KidGame) => { setGame(g); setI(0); setPick(null); setScore(0); setDone(false); };

  if (!game) return <div className="iq-rise">
    <p className="text-xs font-bold uppercase text-muted-foreground">Play and learn</p>
    <h1 className="font-serif text-5xl leading-none">Games 🎮</h1>
    <p className="mt-3 text-lg text-muted-foreground">Pick a game. Every right answer gets a star!</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{games.map((g) => <button key={g.id} onClick={() => start(g)} className={cn("flex items-center gap-5 border-2 border-foreground p-6 text-left shadow-brutal transition hover:-translate-y-1", g.tint)}>
      <span className="text-6xl">{g.emoji}</span>
      <span><b className="block font-serif text-4xl leading-none">{g.title}</b><span className="text-sm font-semibold">{g.kind === "html" ? "Tap to play" : `${g.questions.length} questions`}</span></span>
    </button>)}</div>
  </div>;

  if (game.kind === "html" && game.htmlUrl) return <KidHtmlGame game={game} onBack={() => setGame(null)} />;

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
      <span className="flex items-center gap-1 border-2 border-foreground bg-primary px-3 py-1 font-bold"><Star className="size-4 fill-current" /> {score}</span>
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
          void awardXp("quiz", { correct: score, total: qs.length, difficulty: "Beginner", topic: `Kids: ${game.title}` });
        }}>{i + 1 < qs.length ? "Next question" : "See my stars"}</Button>
      </div>}
    </section>
  </div>;
}

/** An uploaded HTML game, in a safe sandbox. It can report the score with postMessage. */
function KidHtmlGame({ game, onBack }: { game: KidGame; onBack: () => void }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data as { type?: string; score?: number; total?: number } | null;
      if (!d || d.type !== "ilmstation:done" || done) return;
      setDone(true);
      const total = Math.max(1, Math.min(50, Number(d.total) || 5));
      const correct = Math.max(0, Math.min(total, Number(d.score ?? total) || 0));
      void awardXp("quiz", { correct, total, difficulty: "Beginner", topic: `Kids: ${game.title}` });
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [done]);
  return <div className="iq-rise">
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={onBack}>← Games</Button>
      <span className="font-serif text-2xl">{game.emoji} {game.title}</span>
    </div>
    {done && <p className="mt-3 border-2 border-foreground bg-primary p-3 font-bold">🎉 Masha’Allah! Well done.</p>}
    <iframe title={game.title} src={game.htmlUrl} sandbox="allow-scripts" className="mt-4 h-[75vh] w-full border-2 border-foreground bg-background" />
    {!done && <Button variant="outline" className="mt-3" onClick={() => { setDone(true); void awardXp("quiz", { correct: 3, total: 5, difficulty: "Beginner", topic: `Kids: ${game.title}` }); }}>I’ve finished</Button>}
  </div>;
}
