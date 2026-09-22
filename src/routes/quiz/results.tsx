import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Bar, Btn, BtnLink, Card, Confetti, Mono, Pill, SectionTitle, Stat } from "@/components/kit";
import { BadgeUnlock } from "@/components/BadgeUnlock";
import { BADGES, questById, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/quiz/results")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    topic: string;
    count?: number;
    score: number;
    total: number;
    seconds: number;
    penalty?: number;
    difficulty: string;
    quest?: string;
  } => ({
    topic: String(search.topic ?? "aqeedah"),
    score: Number(search.score ?? 0),
    total: Number(search.total ?? 10),
    seconds: Number(search.seconds ?? 0),
    penalty: Number(search.penalty ?? 0),
    difficulty: String(search.difficulty ?? "intermediate"),
    quest: search.quest ? String(search.quest) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Quiz results — IlmStation" },
      { name: "description", content: "Your score, XP earned, accuracy and time — plus a share card." },
      { property: "og:title", content: "Quiz results — IlmStation" },
      { property: "og:description", content: "See how you did and share the card." },
    ],
  }),
  component: QuizResults,
});

const MULT = { beginner: 1, intermediate: 1.5, advanced: 2 } as const;

/** P07 Quiz Results · P07u Badge Unlock */
function QuizResults() {
  const { topic, score, total, seconds, penalty = 0, difficulty, quest } = Route.useSearch();
  const { award, unlock, set, s, completeStage } = useApp();
  const navigate = useNavigate();
  const t = topicById(topic);
  const q = quest ? questById(quest) : undefined;

  const accuracy = total ? score / total : 0;
  const mult = MULT[difficulty as keyof typeof MULT] ?? 1.5;
  const base = Math.round(score * 8 * mult);
  const perfect = score === total && total > 0;
  const xp = Math.max(0, base + (perfect ? 20 : 0) - penalty);

  const [badge, setBadge] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (applied) return;
    setApplied(true);
    award(xp, "ilm", `${t.name} quiz — ${score}/${total}`);
    set({
      quizzesPlayed: s.quizzesPlayed + 1,
      perfectQuizzes: s.perfectQuizzes + (perfect ? 1 : 0),
    });
    if (quest) completeStage(quest, Math.min(3, (s.questStages[quest] ?? 0) + 1));
    if (perfect && unlock("light")) setBadge("light");
    else if (s.xp + xp >= 1000 && unlock("seal")) setBadge("seal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const shareLine = `I scored ${score}/${total} (${Math.round(accuracy * 100)}%) on ${t.name} in IlmStation and earned ${xp} XP.`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AppShell title={perfect ? "Perfect score!" : "Quiz complete"}>
      {perfect ? <Confetti /> : null}

      <Card tone={accuracy >= 0.6 ? "green" : "pink"} className="rounded-r24 text-center">
        <div className="text-[56px]" aria-hidden>
          {perfect ? "🏆" : accuracy >= 0.6 ? "🎉" : "📚"}
        </div>
        <Mono className="mt-1 block text-[44px] leading-none font-bold">
          {score}/{total}
        </Mono>
        <p className="mt-1 text-[18px] font-black">
          {Math.round(accuracy * 100)}% accuracy · {t.name}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill tone="ink">+{xp} XP</Pill>
          <Pill tone="surface">{difficulty} · {mult}×</Pill>
          {perfect ? <Pill tone="yellow">+20 perfect bonus</Pill> : null}
          {penalty ? <Pill tone="surface">−{penalty} skipped</Pill> : null}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Correct" value={score} icon="✓" tone="green" />
        <Stat label="Missed" value={total - score} icon="✕" />
        <Stat label="Time" value={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`} />
        <Stat label="XP earned" value={`+${xp}`} tone="yellow" />
      </div>

      <Card className="mt-4">
        <SectionTitle>Topic breakdown</SectionTitle>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-[13px] font-bold">
              <span>
                {t.icon} {t.name}
              </span>
              <Mono>{Math.round(accuracy * 100)}%</Mono>
            </div>
            <Bar value={accuracy} tone={accuracy >= 0.75 ? "green" : "yellow"} label={t.name} />
          </div>
          <p className="text-[13px] font-semibold text-ink2">
            {accuracy >= 0.75
              ? "Strong. This topic will move down your remediation priority."
              : "Below 75% — expect this topic to reappear in your Daily Quest for reinforcement."}
          </p>
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle>Share your score</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" onClick={copy}>
            {copied ? "✓ Copied" : "🔗 Copy result"}
          </Btn>
          <BtnLink to="/share" search={{ kind: "score" }} variant="outline" size="sm">
            🖼 Share card
          </BtnLink>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareLine)}`}
            target="_blank"
            rel="noreferrer"
            className="brutal press-sm inline-flex min-h-11 items-center rounded-r8 bg-surface px-3 py-1.5 text-[13px] font-extrabold"
          >
            𝕏 Post
          </a>
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Btn
          size="lg"
          full
          onClick={() =>
            navigate({ to: "/quiz", search: { topic, count: total, difficulty, quest } })
          }
        >
          Play again
        </Btn>
        <BtnLink to={q ? "/quests" : "/home"} variant="outline" size="lg" full>
          {q ? "Back to Quest Map" : "Next quest →"}
        </BtnLink>
      </div>

      <BadgeUnlock
        badge={badge ? (BADGES.find((b) => b.id === badge) ?? null) : null}
        onClose={() => setBadge(null)}
      />
    </AppShell>
  );
}
