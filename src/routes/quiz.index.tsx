import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Arabic, Btn, BtnLink, Card, Mono, Pill } from "@/components/kit";
import { questionsFor, topicById, type Question, type TopicId } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quiz/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { topic: string; count: number; difficulty: string; quest?: string } => ({
    topic: String(search.topic ?? "aqeedah"),
    count: Number(search.count ?? 10),
    difficulty: String(search.difficulty ?? "intermediate"),
    quest: search.quest ? String(search.quest) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Quiz in progress — IlmStation" },
      { name: "description", content: "Answer, learn the explanation, and move on. Every question is sourced." },
      { property: "og:title", content: "Quiz in progress — IlmStation" },
      { property: "og:description", content: "Never punish learning — wrong answers teach." },
    ],
  }),
  component: QuizRunner,
});

const SECONDS = { beginner: 25, intermediate: 20, advanced: 15 } as const;

/** P05 Question · P06 Answer Reveal · P06b Wrong Answer */
function QuizRunner() {
  const { topic, count, difficulty, quest } = Route.useSearch();
  const navigate = useNavigate();
  const t = topicById(topic);
  const limit = SECONDS[difficulty as keyof typeof SECONDS] ?? 20;

  const questions = useMemo(() => questionsFor(topic as TopicId, count), [topic, count]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [left, setLeft] = useState<number>(limit);
  const [elapsed, setElapsed] = useState(0);

  const q: Question = questions[i];
  const isCorrect = picked === q.answer;

  useEffect(() => {
    const t2 = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t2);
  }, []);

  useEffect(() => {
    if (revealed) return;
    if (left <= 0) {
      setPicked(-1);
      setRevealed(true);
      return;
    }
    const timer = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, revealed]);

  const choose = (n: number) => {
    if (revealed) return;
    setPicked(n);
    setRevealed(true);
    if (n === q.answer) setScore((sc) => sc + 1);
  };

  const skip = () => {
    setPenalty((p) => p + 5);
    setPicked(-1);
    setRevealed(true);
  };

  const advance = () => {
    if (i + 1 >= questions.length) {
      navigate({
        to: "/quiz/results",
        search: {
          topic,
          count,

          score,
          total: questions.length,
          seconds: elapsed,
          difficulty,
          penalty,
          quest,
        },
      });
      return;
    }
    setI(i + 1);
    setPicked(null);
    setRevealed(false);
    setLeft(limit);
  };

  return (
    <div className="min-h-screen bg-page">
      {/* Quiz chrome */}
      <header className="brutal-flat sticky top-0 z-20 border-x-0 border-t-0 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            to="/play"
            className="brutal-sm press-sm grid h-9 w-9 place-items-center rounded-r8 bg-surface"
            aria-label="Quit quiz"
          >
            ✕
          </Link>
          <div className="flex-1">
            <div className="brutal-flat h-3.5 w-full overflow-hidden rounded-rf bg-field">
              <div
                className="h-full bg-green transition-[width] duration-300"
                style={{ width: `${((i + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <Mono className="text-[13px] font-bold">
            {i + 1}/{questions.length}
          </Mono>
          <span
            className={cn(
              "brutal-sm mono rounded-rf px-2.5 py-1 text-[13px] font-bold",
              left <= 5 && !revealed ? "bg-pink" : "bg-field",
            )}
            aria-label={`${left} seconds left`}
          >
            ⏱ {revealed ? "—" : `${left}s`}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-32">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Pill tone="yellow">
            {t.icon} {t.name}
          </Pill>
          <Pill tone="ink">{difficulty}</Pill>
          <Pill tone="green">
            Score <Mono>{score}</Mono>
          </Pill>
        </div>

        <Card className="rounded-r20">
          {q.arabic ? <Arabic size="lg">{q.arabic}</Arabic> : null}
          <h1 className="mt-1 text-[24px] leading-snug font-black">{q.prompt}</h1>
        </Card>

        <div className="mt-3 grid gap-2">
          {q.options.map((o, n) => {
            const correct = revealed && n === q.answer;
            const wrong = revealed && n === picked && n !== q.answer;
            return (
              <button
                key={o}
                onClick={() => choose(n)}
                disabled={revealed}
                aria-pressed={picked === n}
                className={cn(
                  "brutal press flex min-h-11 items-center gap-3 rounded-r16 px-4 py-3.5 text-left text-[15px] font-bold",
                  correct
                    ? "bg-green text-surface"
                    : wrong
                      ? "bg-pink"
                      : revealed
                        ? "bg-field text-ink2"
                        : "bg-surface",
                )}
              >
                <span
                  className={cn(
                    "brutal-flat mono grid h-8 w-8 shrink-0 place-items-center rounded-rf text-[13px] font-bold",
                    correct ? "bg-surface text-ink" : "bg-field",
                  )}
                >
                  {String.fromCharCode(65 + n)}
                </span>
                <span className="flex-1">{o}</span>
                {correct ? <span aria-hidden>✓</span> : null}
                {wrong ? <span aria-hidden>✕</span> : null}
              </button>
            );
          })}
        </div>

        {/* P06 / P06b reveal */}
        {revealed ? (
          <Card
            tone={isCorrect ? "green" : "pink"}
            className="anim-rise mt-4 rounded-r20"
          >
            <div className="flex items-center gap-2">
              <span className="text-[28px]" aria-hidden>
                {isCorrect ? "✅" : picked === -1 ? "⏭️" : "💡"}
              </span>
              <h2 className="text-[20px] font-black">
                {isCorrect
                  ? "Correct — well done"
                  : picked === -1
                    ? "Skipped — here's the answer"
                    : "That's okay, here's why…"}
              </h2>
            </div>

            {!isCorrect ? (
              <p className="mt-2 text-[15px] font-black">
                Correct answer: {q.options[q.answer]}
              </p>
            ) : null}

            <p className="mt-2 text-[15px] font-semibold">{q.explanation}</p>

            <div className="brutal-sm mt-3 rounded-r12 bg-surface p-3">
              <Arabic size="md">{q.sourceArabic}</Arabic>
              <Mono className="mt-1 block text-[11px] font-bold tracking-wide text-ink2 uppercase">
                {q.source}
              </Mono>
            </div>

            {q.articleSlug ? (
              <BtnLink
                to="/library/$slug"
                params={{ slug: q.articleSlug }}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                📚 Library: read more
              </BtnLink>
            ) : null}
          </Card>
        ) : null}
      </main>

      {/* Sticky action bar */}
      <div className="brutal-flat fixed bottom-0 w-full border-x-0 border-b-0 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          {revealed ? (
            <Btn size="lg" full onClick={advance}>
              {i + 1 >= questions.length ? "See results →" : "Next question →"}
            </Btn>
          ) : (
            <>
              <Btn variant="outline" onClick={skip}>
                Skip · −5 XP
              </Btn>
              <Btn size="lg" full disabled>
                Pick an answer
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
