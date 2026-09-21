import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Arabic, BtnLink, Card, Mono, Pill, Stat } from "@/components/kit";
import { questById, topicById } from "@/lib/data";

export const Route = createFileRoute("/play/lobby")({
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
      { title: "Quiz lobby — IlmStation" },
      { name: "description", content: "Your quiz brief: topic, question count, time estimate and XP preview." },
      { property: "og:title", content: "Quiz lobby — IlmStation" },
      { property: "og:description", content: "Ready when you are." },
    ],
  }),
  component: QuizLobby,
});

const MULT = { beginner: 1, intermediate: 1.5, advanced: 2 } as const;

/** P04 Quiz Lobby */
function QuizLobby() {
  const { topic, count, difficulty, quest } = Route.useSearch();
  const t = topicById(topic);
  const q = quest ? questById(quest) : undefined;
  const mult = MULT[difficulty as keyof typeof MULT] ?? 1.5;
  const xp = Math.round(count * 8 * mult);
  const minutes = Math.max(2, Math.round((count * 22) / 60));

  return (
    <AppShell back={{ to: "/play", label: "Play" }} title={q ? q.name : `${t.name} quiz`}>
      <Card tone="yellow" className="rounded-r20 text-center">
        <span className="text-[56px]" aria-hidden>
          {t.icon}
        </span>
        <h2 className="mt-1 text-[28px] leading-tight font-black">{t.name}</h2>
        <Arabic size="xl" className="text-center">
          {t.arabic}
        </Arabic>
        <p className="mt-2 text-[15px] font-semibold">{t.scope}</p>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Questions" value={count} icon="📝" />
        <Stat label="Est. time" value={`${minutes}m`} icon="⏱" />
        <Stat label="XP reward" value={`+${xp}`} tone="green" />
        <Stat label="Multiplier" value={`${mult}×`} tone="yellow" />
      </div>

      <Card className="mt-4">
        <p className="mono text-[11px] font-bold tracking-widest text-ink2 uppercase">
          How it works
        </p>
        <ul className="mt-2 space-y-1.5 text-[15px] font-semibold text-ink2">
          <li>• Four options per question, one correct.</li>
          <li>• Every answer — right or wrong — opens a full explanation with its source.</li>
          <li>• Skipping costs 5 XP. Running out of time counts as a miss.</li>
          <li>• A perfect score adds a +20 XP bonus.</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="ink">{difficulty}</Pill>
          <Pill>{t.category}</Pill>
          <Pill tone="green">
            <Mono>{t.questions}</Mono> in pool
          </Pill>
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <BtnLink to="/quiz" search={{ topic, count, difficulty, quest }} size="lg" full>
          Start →
        </BtnLink>
        <BtnLink to="/play/difficulty" search={{ topic, count }} variant="outline" size="lg">
          Change difficulty
        </BtnLink>
      </div>
    </AppShell>
  );
}
