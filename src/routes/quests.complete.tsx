import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Arabic, BtnLink, Card, Confetti, Mono, Pill, Stat } from "@/components/kit";
import { BADGES, QUESTS, questById } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/quests/complete")({
  validateSearch: (search: Record<string, unknown>): { quest?: string } => ({
    quest: search.quest ? String(search.quest) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Quest complete — IlmStation" },
      { name: "description", content: "Total XP earned, the badge awarded and the next quest now unlocked." },
      { property: "og:title", content: "Quest complete — IlmStation" },
      { property: "og:description", content: "One chapter closer to the end of the path." },
    ],
  }),
  component: QuestComplete,
});

/** Q03 Quest Complete */
function QuestComplete() {
  const { quest: id } = Route.useSearch();
  const { s } = useApp();
  const quest = (id ? questById(id) : undefined) ?? QUESTS[0];
  const badge = quest.badge ? BADGES.find((b) => b.id === quest.badge) : undefined;
  const index = QUESTS.findIndex((q) => q.id === quest.id);
  const after = QUESTS[index + 1];
  const questions = quest.stages.reduce((a, st) => a + st.questions, 0);

  return (
    <AppShell title="Quest complete">
      <Confetti />
      <Card tone="green" className="rounded-r24 text-center">
        <div className="text-[56px]" aria-hidden>
          🏁
        </div>
        <h2 className="mt-1 text-[28px] leading-tight font-black">{quest.name}</h2>
        <Arabic size="lg" className="mt-1">
          {quest.arabic}
        </Arabic>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill tone="ink">+{quest.xp} XP</Pill>
          <Pill tone="surface">{quest.chapter}</Pill>
          <Pill tone="surface">3 / 3 stages</Pill>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Questions answered" value={questions} icon="❓" />
        <Stat label="Quest XP" value={quest.xp} tone="yellow" />
        <Stat label="Total XP" value={s.xp} tone="green" />
        <Stat label="Badges" value={s.badges.length} icon="🏅" />
      </div>

      {badge ? (
        <Card tone="pink" className="mt-4 text-center">
          <div className="text-[44px]" aria-hidden>
            {badge.icon}
          </div>
          <p className="text-[18px] font-black">{badge.name}</p>
          <Arabic size="md">{badge.arabic}</Arabic>
          <p className="mt-1 text-[13px] font-semibold text-ink2">{badge.description}</p>
        </Card>
      ) : null}

      <Card className="mt-4">
        <p className="mono text-[11px] font-bold tracking-widest text-ink2 uppercase">
          Next on the map
        </p>
        {after ? (
          <>
            <p className="mt-1 text-[18px] font-black">{after.name}</p>
            <Arabic size="md" className="text-ink2">
              {after.arabic}
            </Arabic>
            <Mono className="mt-1 block text-[13px] font-bold text-ink2">
              {after.chapter} · +{after.xp} XP
            </Mono>
          </>
        ) : (
          <p className="mt-1 text-[15px] font-semibold">
            You've finished every quest on the map. New chapters arrive with Ramadan Mode.
          </p>
        )}
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {after ? (
          <BtnLink to="/quests/$questId" params={{ questId: after.id }} size="lg" full>
            Start {after.name} →
          </BtnLink>
        ) : (
          <BtnLink to="/quests" size="lg" full>
            Back to Quest Map
          </BtnLink>
        )}
        <BtnLink to="/share" search={{ kind: "quest" }} variant="outline" size="lg" full>
          📤 Share this
        </BtnLink>
        <BtnLink to="/achievements" variant="outline" size="lg">
          Achievements
        </BtnLink>
      </div>
    </AppShell>
  );
}
