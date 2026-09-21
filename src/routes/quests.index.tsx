import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Bar, Btn, Card, Modal, Mono, Pill, SectionTitle } from "@/components/kit";
import { QUESTS, questById, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quests/")({
  head: () => ({
    meta: [
      { title: "Quest Map — a path through Islamic knowledge — IlmStation" },
      { name: "description", content: "Ten structured quests across five chapters, each with three stages and rising XP multipliers." },
      { property: "og:title", content: "Quest Map — IlmStation" },
      { property: "og:description", content: "Follow the path, chapter by chapter." },
    ],
  }),
  component: QuestMap,
});

/** Q01 Quest Map */
function QuestMap() {
  const { s } = useApp();
  const navigate = useNavigate();
  const [lockedNote, setLockedNote] = useState<string | null>(null);

  const stagesDone = (id: string) => s.questStages[id] ?? 0;
  const isComplete = (id: string) => stagesDone(id) >= 3;
  const isUnlocked = (q: (typeof QUESTS)[number]) => !q.prereq || isComplete(q.prereq);

  const chapters = Array.from(new Set(QUESTS.map((q) => q.chapter)));
  const completed = QUESTS.filter((q) => isComplete(q.id)).length;

  return (
    <AppShell title="Quest Map" subtitle="A structured path — finish one quest to open the next." wide>
      <Card tone="yellow" className="mb-5 rounded-r20">
        <SectionTitle
          action={
            <Mono className="text-[13px] font-bold">
              {completed}/{QUESTS.length} quests
            </Mono>
          }
        >
          Your journey
        </SectionTitle>
        <Bar value={completed / QUESTS.length} tone="green" label="Quests completed" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="surface">Level {s.badges.length ? "up next" : "keep going"}</Pill>
          <Pill tone="ink">3 stages per quest</Pill>
          <Pill tone="surface">Multipliers 1× → 1.5×</Pill>
        </div>
      </Card>

      <div className="space-y-6">
        {chapters.map((ch) => (
          <section key={ch}>
            <SectionTitle>{ch}</SectionTitle>
            <div className="grid gap-3 md:grid-cols-2">
              {QUESTS.filter((q) => q.chapter === ch).map((q) => {
                const done = stagesDone(q.id);
                const unlocked = isUnlocked(q);
                const t = topicById(q.topic);
                return (
                  <button
                    key={q.id}
                    className="text-left"
                    onClick={() =>
                      unlocked
                        ? navigate({ to: "/quests/$questId", params: { questId: q.id } })
                        : setLockedNote(questById(q.prereq!)?.name ?? "the previous quest")
                    }
                  >
                    <Card
                      tone={done >= 3 ? "green" : unlocked ? "surface" : "field"}
                      className={cn("press h-full rounded-r16", !unlocked && "opacity-70")}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "brutal-flat grid h-12 w-12 shrink-0 place-items-center rounded-rf text-[22px]",
                            done >= 3 ? "bg-green text-surface" : unlocked ? "bg-yellow" : "bg-surface",
                          )}
                          aria-hidden
                        >
                          {done >= 3 ? "✓" : unlocked ? t.icon : "🔒"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[18px] leading-tight font-black">{q.name}</h3>
                          <Arabic size="sm" className="text-ink2">
                            {q.arabic}
                          </Arabic>
                          <div className="mt-2 flex items-center gap-1.5">
                            {q.stages.map((st, i) => (
                              <span
                                key={st.name}
                                title={`${st.name} · ${st.multiplier}×`}
                                className={cn(
                                  "brutal-sm h-3 flex-1 rounded-rf",
                                  i < done ? "bg-green" : "bg-field",
                                )}
                              />
                            ))}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Pill tone="field">
                              {done}/3 stages
                            </Pill>
                            <Pill tone="field">+{q.xp} XP</Pill>
                            {q.badge ? <Pill tone="pink">🏅 Badge</Pill> : null}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Modal open={!!lockedNote} onClose={() => setLockedNote(null)} title="Quest locked">
        <p className="text-[15px] font-semibold text-ink2">
          Finish all three stages of <strong>{lockedNote}</strong> to open this quest. The path is
          sequential on purpose — each quest builds on the one before.
        </p>
        <Btn full className="mt-4" onClick={() => setLockedNote(null)}>
          Got it
        </Btn>
      </Modal>
    </AppShell>
  );
}
