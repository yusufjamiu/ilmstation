import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Btn, Card, Mono, Pill } from "@/components/kit";
import { Arabic } from "@/components/kit";
import { FRIENDS, questionsFor, topicById, type TopicId } from "@/lib/data";
import { useApp, useFlow } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/challenge/duel")({
  head: () => ({
    meta: [
      { title: "Live duel — IlmStation" },
      { name: "description", content: "Split-screen head-to-head quiz with a live score bar." },
      { property: "og:title", content: "Live duel — IlmStation" },
      { property: "og:description", content: "Answer faster, score higher." },
    ],
  }),
  component: LiveDuel,
});

/** P10 Live Duel */
function LiveDuel() {
  const { flow, setFlow } = useFlow();
  const { s } = useApp();
  const navigate = useNavigate();
  const duel = (flow.duel as { opponent: string; topic: TopicId; rounds: number }) ?? {
    opponent: FRIENDS[0].id,
    topic: "hadith" as TopicId,
    rounds: 10,
  };
  const friend = FRIENDS.find((f) => f.id === duel.opponent) ?? FRIENDS[0];
  const topic = topicById(duel.topic);
  const questions = useMemo(() => questionsFor(duel.topic, duel.rounds), [duel.topic, duel.rounds]);

  const [i, setI] = useState(0);
  const [mine, setMine] = useState(0);
  const [theirs, setTheirs] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(15);
  const [oppAnswered, setOppAnswered] = useState(false);

  const q = questions[i];
  const revealed = picked !== null;

  useEffect(() => {
    if (revealed || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, revealed]);

  useEffect(() => {
    if (left > 0 || revealed) return;
    setPicked(-1);
  }, [left, revealed]);

  // Opponent answers on a delay with ~70% accuracy.
  useEffect(() => {
    setOppAnswered(false);
    const delay = 2200 + Math.random() * 5200;
    const t = setTimeout(() => {
      setOppAnswered(true);
      if (Math.random() < 0.7) setTheirs((x) => x + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [i]);

  const choose = (n: number) => {
    if (revealed) return;
    setPicked(n);
    if (n === q.answer) setMine((x) => x + 1);
  };

  const next = () => {
    if (i + 1 >= questions.length) {
      setFlow({
        duelResult: {
          opponent: duel.opponent,
          topic: duel.topic,
          rounds: duel.rounds,
          mine,
          theirs,
        },
      });
      navigate({ to: "/challenge/results" });
      return;
    }
    setI(i + 1);
    setPicked(null);
    setLeft(15);
  };

  const total = Math.max(1, mine + theirs);

  return (
    <div className="min-h-screen bg-page">
      {/* Split score bar */}
      <header className="brutal-flat sticky top-0 z-20 border-x-0 border-t-0 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar emoji={s.avatar} size={36} ring="yellow" />
            <Mono className="text-[20px] font-bold">{mine}</Mono>
            <div className="brutal-flat flex h-5 flex-1 overflow-hidden rounded-rf bg-field">
              <div
                className="bg-yellow transition-[width] duration-500"
                style={{ width: `${(mine / total) * 100}%` }}
              />
              <div
                className="bg-green transition-[width] duration-500"
                style={{ width: `${(theirs / total) * 100}%` }}
              />
            </div>
            <Mono className="text-[20px] font-bold">{theirs}</Mono>
            <Avatar emoji={friend.avatar} size={36} ring="green" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Pill tone="yellow">
              {topic.icon} {topic.name}
            </Pill>
            <Pill tone="ink">
              Round <Mono>{i + 1}</Mono>/<Mono>{questions.length}</Mono>
            </Pill>
            <span
              className={cn(
                "brutal-sm mono ml-auto rounded-rf px-2.5 py-1 text-[13px] font-bold",
                left <= 4 && !revealed ? "bg-pink" : "bg-field",
              )}
            >
              ⏱ {revealed ? "—" : `${left}s`}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-32">
        <div className="mb-3 flex items-center gap-2">
          <Avatar emoji={friend.avatar} size={28} />
          <span className={cn("text-[13px] font-bold", oppAnswered ? "text-green" : "text-ink2")}>
            {oppAnswered
              ? `${friend.name.split(" ")[0]} answered`
              : `${friend.name.split(" ")[0]} is thinking…`}
          </span>
          {!oppAnswered ? <span className="anim-float text-[15px]">💭</span> : null}
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
              {picked === q.answer ? "✅ Point to you." : `💡 Correct: ${q.options[q.answer]}`}
            </p>
            <p className="mt-1 text-[13px] font-semibold text-ink2">{q.explanation}</p>
          </Card>
        ) : null}
      </main>

      <div className="brutal-flat fixed bottom-0 w-full border-x-0 border-b-0 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Btn size="lg" full disabled={!revealed} onClick={next}>
            {!revealed
              ? "Answer to continue"
              : i + 1 >= questions.length
                ? "See duel result →"
                : "Next round →"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
