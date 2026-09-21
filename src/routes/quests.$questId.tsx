import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Arabic, Bar, Btn, BtnLink, Card, Empty, Mono, Pill, SectionTitle } from "@/components/kit";
import { BADGES, QUESTS, questById, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quests/$questId")({
  loader: ({ params }) => {
    const quest = questById(params.questId);
    if (!quest) throw notFound();
    return { quest };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Quest not found — IlmStation" }, { name: "robots", content: "noindex" }] };
    }
    const { quest } = loaderData;
    return {
      meta: [
        { title: `${quest.name} — Quest — IlmStation` },
        { name: "description", content: `Three stages, ${quest.xp} XP and rising multipliers on ${quest.name}.` },
        { property: "og:title", content: `${quest.name} — IlmStation` },
        { property: "og:description", content: `Quest in ${quest.chapter}.` },
      ],
    };
  },
  notFoundComponent: QuestMissing,
  component: QuestDetail,
});

function QuestMissing() {
  return (
    <AppShell title="Quest not found">
      <Empty
        icon="🗺️"
        title="That quest isn't on the map"
        body="It may have been renamed. Head back to the Quest Map and pick your next step."
        action={<BtnLink to="/quests">Back to Quest Map</BtnLink>}
      />
    </AppShell>
  );
}

/** Q02 Quest Detail */
function QuestDetail() {
  const { quest } = Route.useLoaderData();
  const { s } = useApp();
  const navigate = useNavigate();
  const t = topicById(quest.topic);
  const done = s.questStages[quest.id] ?? 0;
  const badge = quest.badge ? BADGES.find((b) => b.id === quest.badge) : undefined;
  const next = quest.stages[Math.min(done, 2)];
  const index = QUESTS.findIndex((q) => q.id === quest.id);
  const after = QUESTS[index + 1];

  return (
    <AppShell back={{ to: "/quests", label: "Quest Map" }} title={quest.name}>
      <Card tone="yellow" className="rounded-r20">
        <Pill tone="ink">{quest.chapter}</Pill>
        <Arabic size="lg" className="mt-2">
          {quest.arabic}
        </Arabic>
        <p className="mt-2 text-[15px] font-bold">
          {t.icon} {t.name} · {quest.stages.reduce((a, st) => a + st.questions, 0)} questions across 3
          stages
        </p>
        <div className="mt-3">
          <Bar value={done / 3} tone="green" label="Stages complete" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="surface">+{quest.xp} XP total</Pill>
          <Pill tone="surface">{done}/3 stages done</Pill>
          {badge ? (
            <Pill tone="pink">
              {badge.icon} {badge.name}
            </Pill>
          ) : null}
        </div>
      </Card>

      <SectionTitle className="mt-5">Stages</SectionTitle>
      <ol className="space-y-3">
        {quest.stages.map((st, i) => {
          const complete = i < done;
          const current = i === done;
          const locked = i > done;
          return (
            <li key={st.name}>
              <Card
                tone={complete ? "green" : current ? "surface" : "field"}
                className={cn("rounded-r16", locked && "opacity-70")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "brutal-flat mono grid h-10 w-10 shrink-0 place-items-center rounded-rf text-[15px] font-bold",
                      complete ? "bg-green text-surface" : current ? "bg-yellow" : "bg-surface",
                    )}
                    aria-hidden
                  >
                    {complete ? "✓" : locked ? "🔒" : i + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-black">
                      Stage {i + 1} · {st.name}
                    </h3>
                    <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                      {st.questions} questions · {st.multiplier}× XP
                    </Mono>
                  </div>
                  {current ? (
                    <Btn
                      onClick={() =>
                        navigate({
                          to: "/play/lobby",
                          search: {
                            topic: quest.topic,
                            count: st.questions,
                            difficulty: i === 0 ? "beginner" : i === 1 ? "intermediate" : "advanced",
                            quest: quest.id,
                          },
                        })
                      }
                    >
                      {done === 0 ? "Start" : "Continue"}
                    </Btn>
                  ) : complete ? (
                    <Pill tone="green">Done</Pill>
                  ) : (
                    <Pill tone="field">Locked</Pill>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {done >= 3 ? (
        <Card tone="green" className="mt-5">
          <p className="text-[18px] font-black">Quest complete ✓</p>
          <p className="mt-1 text-[15px] font-semibold text-ink2">
            {after ? `${after.name} is now open on the map.` : "You've reached the end of the path."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BtnLink to="/quests/complete" search={{ quest: quest.id }} variant="ink">
              View reward summary
            </BtnLink>
            <BtnLink to="/quests" variant="outline">
              Back to map
            </BtnLink>
          </div>
        </Card>
      ) : (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Btn
            size="lg"
            full
            onClick={() =>
              navigate({
                to: "/play/lobby",
                search: {
                  topic: quest.topic,
                  count: next.questions,
                  difficulty: done === 0 ? "beginner" : done === 1 ? "intermediate" : "advanced",
                  quest: quest.id,
                },
              })
            }
          >
            {done === 0 ? "Begin Stage 1" : `Continue Stage ${done + 1}`} →
          </Btn>
          <BtnLink to="/library" variant="outline" size="lg" full>
            📚 Read up first
          </BtnLink>
        </div>
      )}
    </AppShell>
  );
}
