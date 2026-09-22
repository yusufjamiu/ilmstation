import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Arabic, Bar, BtnLink, Card, Mono, Pill, SectionTitle } from "@/components/kit";
import { IQ_TOPIC_PERF, QUESTS, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/home/quest")({
  head: () => ({
    meta: [
      { title: "Today's Daily Quest — IlmStation" },
      { name: "description", content: "The full brief for today's quest: stages, topics, rewards and your stats." },
      { property: "og:title", content: "Today's Daily Quest — IlmStation" },
      { property: "og:description", content: "10 questions, 5 minutes, +80 XP." },
    ],
  }),
  component: DailyQuestExpanded,
});

/** H02 Daily Quest Expanded */
function DailyQuestExpanded() {
  const { s } = useApp();
  const quest = QUESTS.find((q) => (s.questStages[q.id] ?? 0) < 3) ?? QUESTS[0];
  const topic = topicById(quest.topic);
  const done = s.questStages[quest.id] ?? 0;

  return (
    <AppShell back={{ to: "/home", label: "Home" }} title="Today's Daily Quest">
      <Card tone="yellow" className="rounded-r20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[28px] leading-tight font-black">{quest.name}</h2>
            <Arabic size="xl" className="mt-1">
              {quest.arabic}
            </Arabic>
          </div>
          <span className="text-[52px]" aria-hidden>
            {topic.icon}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill tone="surface">⏱ 5 min</Pill>
          <Pill tone="surface">📝 10 questions</Pill>
          <Pill tone="surface">{topic.name}</Pill>
          <Pill tone="ink">+80 XP · {s.difficulty}</Pill>
        </div>
        <p className="mt-3 text-[15px] font-semibold">
          Today&apos;s quest was picked for you from {topic.name} — a topic in your interests where
          your accuracy has room to grow. Every answer comes with a full explanation and its source.
        </p>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionTitle>Stage progress</SectionTitle>
          <ul className="space-y-2">
            {quest.stages.map((st, i) => (
              <li
                key={st.name}
                className="brutal-sm flex items-center gap-3 rounded-r12 bg-field px-3 py-2.5"
              >
                <span
                  className={`brutal-flat grid h-7 w-7 place-items-center rounded-rf text-[13px] font-black ${
                    i < done ? "bg-green text-surface" : i === done ? "bg-yellow" : "bg-surface text-muted"
                  }`}
                >
                  {i < done ? "✓" : i + 1}
                </span>
                <span className="flex-1 text-[15px] font-bold">
                  {st.name}
                  <Mono className="ml-2 text-[11px] text-ink2">
                    {st.questions} Q · {st.multiplier}×
                  </Mono>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Bar value={done / 3} label="Quest progress" />
            <p className="mono mt-1 text-[11px] font-bold text-ink2 uppercase">
              {done} of 3 stages complete
            </p>
          </div>
        </Card>

        <Card>
          <SectionTitle>Your topic accuracy</SectionTitle>
          <ul className="space-y-3">
            {IQ_TOPIC_PERF.map((t) => (
              <li key={t.topic}>
                <div className="mb-1 flex justify-between text-[13px] font-bold">
                  <span>{t.topic}</span>
                  <Mono>{t.pct}%</Mono>
                </div>
                <Bar value={t.pct / 100} tone={t.pct >= 75 ? "green" : "yellow"} label={t.topic} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <BtnLink
          to="/play/lobby"
          search={{ topic: quest.topic, count: 10, difficulty: s.difficulty, quest: quest.id }}
          size="lg"
          full
        >
          Start quest →
        </BtnLink>
        <BtnLink to="/share" search={{ kind: "quest" }} variant="outline" size="lg">
          📤 Share
        </BtnLink>
      </div>
    </AppShell>
  );
}
