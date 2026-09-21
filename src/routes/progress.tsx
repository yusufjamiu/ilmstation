import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Bar, BtnLink, Card, Mono, Pill, SectionTitle, Segmented, Stat } from "@/components/kit";
import { IQ_TOPIC_PERF, LEVELS, QUESTS, TOPICS } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — XP, accuracy and topic mastery — IlmStation" },
      { name: "description", content: "Weekly XP chart, accuracy per topic, level ladder and your strongest and weakest areas." },
      { property: "og:title", content: "My Progress — IlmStation" },
      { property: "og:description", content: "See exactly where you're strong and where to revise." },
    ],
  }),
  component: Progress,
});

/** Q04 My Progress */
function Progress() {
  const { s, level, totalPoints } = useApp();
  const [range, setRange] = useState<"week" | "month" | "all">("week");

  const bars =
    range === "week"
      ? [120, 180, 90, 240, 160, 60, 200]
      : range === "month"
        ? [640, 820, 510, 900]
        : [1200, 2400, 3100, 4200];
  const labels =
    range === "week"
      ? ["M", "T", "W", "T", "F", "S", "S"]
      : range === "month"
        ? ["W1", "W2", "W3", "W4"]
        : ["Q1", "Q2", "Q3", "Q4"];
  const peak = Math.max(...bars);

  const questsDone = QUESTS.filter((q) => (s.questStages[q.id] ?? 0) >= 3).length;
  const accuracy = s.quizzesPlayed ? Math.min(96, 68 + s.perfectQuizzes * 4) : 0;
  const strongest = [...IQ_TOPIC_PERF].sort((a, b) => b.pct - a.pct)[0];
  const weakest = [...IQ_TOPIC_PERF].sort((a, b) => a.pct - b.pct)[0];
  const inLevel =
    level.max === Infinity ? 1 : (s.xp - level.min) / (level.max - level.min + 1);

  return (
    <AppShell title="My Progress" subtitle="Your learning, measured honestly." wide>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total XP" value={s.xp} tone="yellow" icon="⚡" />
        <Stat label="Accuracy" value={`${accuracy}%`} tone="green" />
        <Stat label="Quizzes played" value={s.quizzesPlayed} icon="🎯" />
        <Stat label="Current streak" value={`${s.streak} days`} icon="🔥" />
      </div>

      <Card className="mt-4">
        <SectionTitle
          action={
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "all", label: "All" },
              ]}
            />
          }
        >
          XP earned
        </SectionTitle>
        <div className="flex h-40 items-end gap-2">
          {bars.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <Mono className="text-[11px] font-bold text-ink2">{v}</Mono>
              <div
                className="brutal-flat w-full rounded-t-r8 bg-yellow"
                style={{ height: `${Math.max(8, (v / peak) * 118)}px` }}
                role="img"
                aria-label={`${labels[i]}: ${v} XP`}
              />
              <Mono className="text-[11px] font-bold">{labels[i]}</Mono>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Accuracy by topic</SectionTitle>
          <ul className="space-y-3">
            {IQ_TOPIC_PERF.map((t) => (
              <li key={t.topic}>
                <div className="mb-1 flex justify-between text-[13px] font-black">
                  <span>{t.topic}</span>
                  <Mono>{t.pct}%</Mono>
                </div>
                <Bar value={t.pct / 100} tone={t.pct >= 80 ? "green" : t.pct >= 65 ? "yellow" : "pink"} />
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="green">Strongest: {strongest.topic}</Pill>
            <Pill tone="pink">Needs work: {weakest.topic}</Pill>
          </div>
          <BtnLink
            to="/play/difficulty"
            search={{ topic: weakest.topic.toLowerCase() }}
            variant="outline"
            className="mt-3"
          >
            Revise {weakest.topic} →
          </BtnLink>
        </Card>

        <Card>
          <SectionTitle>Level ladder</SectionTitle>
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-[13px] font-black">
              <span>
                Level {level.level} · {level.name}
              </span>
              <Mono>
                {s.xp} / {level.max === Infinity ? "∞" : level.max} XP
              </Mono>
            </div>
            <Bar value={inLevel} tone="green" label="Level progress" />
            <Arabic size="md" className="mt-1">
              {level.arabic}
            </Arabic>
          </div>
          <ul className="space-y-2">
            {LEVELS.map((l) => {
              const reached = s.xp >= l.min;
              return (
                <li
                  key={l.level}
                  className={`brutal-sm flex items-center gap-3 rounded-r12 px-3 py-2 ${
                    l.level === level.level ? "bg-yellow" : reached ? "bg-green-l" : "bg-field"
                  }`}
                >
                  <Mono className="w-5 text-[13px] font-bold">{l.level}</Mono>
                  <div className="flex-1">
                    <div className="text-[15px] font-black">{l.name}</div>
                    <div className="text-[11px] font-semibold text-ink2">{l.unlocks}</div>
                  </div>
                  <Mono className="text-[11px] font-bold">{l.min}+</Mono>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle>Activity mix</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Quests completed" value={`${questsDone}/${QUESTS.length}`} />
          <Stat label="Hifz sessions" value={s.hifzSessions} />
          <Stat label="Articles read" value={s.articlesRead} />
          <Stat label="Duel record" value={`${s.duelWins}W · ${s.duelLosses}L`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="field">
            Total points: <Mono>{totalPoints}</Mono>
          </Pill>
          <Pill tone="field">
            Interests: {s.interests.length || TOPICS.length} topics
          </Pill>
        </div>
      </Card>
    </AppShell>
  );
}
