import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Arabic, Avatar, Btn, Card, Mono, Pill } from "@/components/kit";
import { HALAQAH_BOTS, questionsFor, topicById, type TopicId } from "@/lib/data";
import { useApp, useFlow } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/halaqah/game")({
  head: () => ({
    meta: [
      { title: "Halaqah live game — IlmStation" },
      { name: "description", content: "Everyone answers the same question at once, with a live leaderboard." },
      { property: "og:title", content: "Halaqah live game — IlmStation" },
      { property: "og:description", content: "Six players, one question at a time." },
    ],
  }),
  component: LiveGame,
});

/** FM02 Live Game */
function LiveGame() {
  const { flow, setFlow } = useFlow();
  const { s } = useApp();
  const navigate = useNavigate();
  const room = (flow.room as {
    code: string;
    topic: TopicId;
    rounds: number;
    limit: number;
    players: string[];
  }) ?? { code: "IQ-7F2K", topic: "seerah" as TopicId, rounds: 5, limit: 20, players: HALAQAH_BOTS.map((b) => b.id) };

  const topic = topicById(room.topic);
  const questions = useMemo(() => questionsFor(room.topic, room.rounds), [room.topic, room.rounds]);
  const bots = HALAQAH_BOTS.filter((b) => room.players.includes(b.id));

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(room.limit);
  const [scores, setScores] = useState<Record<string, number>>(() => ({
    me: 0,
    ...Object.fromEntries(bots.map((b) => [b.id, 0])),
  }));

  const q = questions[i];
  const revealed = picked !== null || left <= 0;

  useEffect(() => {
    if (revealed) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, revealed]);

  const choose = (n: number) => {
    if (revealed) return;
    setPicked(n);
    setScores((sc) => {
      const next = { ...sc };
      if (n === q.answer) next.me += 1;
      bots.forEach((b) => {
        if (Math.random() < 0.62) next[b.id] += 1;
      });
      return next;
    });
  };

  const next = () => {
    if (i + 1 >= questions.length) {
      setFlow({ roomResult: { code: room.code, topic: room.topic, scores, players: room.players } });
      navigate({ to: "/halaqah/results" });
      return;
    }
    setI(i + 1);
    setPicked(null);
    setLeft(room.limit);
  };

  const ranked = [
    { id: "me", name: "You", avatar: s.avatar, score: scores.me },
    ...bots.map((b) => ({ id: b.id, name: b.name, avatar: b.avatar, score: scores[b.id] ?? 0 })),
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-page">
      <header className="brutal-flat sticky top-0 z-20 border-x-0 border-t-0 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Pill tone="ink">{room.code}</Pill>
            <Pill tone="yellow">
              {topic.icon} {topic.name}
            </Pill>
            <Pill>
              Q <Mono>{i + 1}</Mono>/<Mono>{questions.length}</Mono>
            </Pill>
            <span
              className={cn(
                "brutal-sm mono ml-auto rounded-rf px-2.5 py-1 text-[13px] font-bold",
                left <= 5 && !revealed ? "bg-pink" : "bg-field",
              )}
            >
              ⏱ {revealed ? "—" : `${left}s`}
            </span>
          </div>
          <ul className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {ranked.map((p, idx) => (
              <li
                key={p.id}
                className={cn(
                  "brutal-sm flex shrink-0 items-center gap-2 rounded-rf px-2 py-1",
                  idx === 0 ? "bg-yellow" : "bg-field",
                )}
              >
                <span aria-hidden>{p.avatar}</span>
                <span className="text-[13px] font-black">{p.name}</span>
                <Mono className="text-[13px] font-bold">{p.score}</Mono>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-32">
        <Card className="rounded-r20">
          {q.arabic ? <Arabic size="lg">{q.arabic}</Arabic> : null}
          <h1 className="mt-1 text-[24px] leading-snug font-black">{q.prompt}</h1>
        </Card>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {q.options.map((o, n) => {
            const correct = revealed && n === q.answer;
            const wrong = revealed && n === picked && n !== q.answer;
            return (
              <button
                key={o}
                onClick={() => choose(n)}
                disabled={revealed}
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
                <span className="brutal-flat mono grid h-8 w-8 shrink-0 place-items-center rounded-rf bg-field text-[13px] font-bold">
                  {String.fromCharCode(65 + n)}
                </span>
                {o}
              </button>
            );
          })}
        </div>

        {revealed ? (
          <Card tone={picked === q.answer ? "green" : "pink"} className="anim-rise mt-4">
            <p className="text-[15px] font-bold">
              {picked === q.answer ? "✅ Correct" : `💡 Correct answer: ${q.options[q.answer]}`}
            </p>
            <p className="mt-1 text-[13px] font-semibold text-ink2">{q.explanation}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {bots.map((b) => (
                <span key={b.id} className="brutal-sm rounded-rf bg-surface px-2 py-1 text-[11px] font-black">
                  <Avatar emoji={b.avatar} size={18} /> {b.name}: {scores[b.id] ?? 0}
                </span>
              ))}
            </div>
          </Card>
        ) : null}
      </main>

      <div className="brutal-flat fixed bottom-0 w-full border-x-0 border-b-0 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Btn size="lg" full disabled={!revealed} onClick={next}>
            {i + 1 >= questions.length ? "Final podium →" : "Next question →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
