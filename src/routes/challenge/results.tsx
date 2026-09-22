import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, Btn, BtnLink, Card, Confetti, Mono, Pill, SectionTitle, Stat } from "@/components/kit";
import { BadgeUnlock } from "@/components/BadgeUnlock";
import { BADGES, FRIENDS, topicById, type TopicId } from "@/lib/data";
import { useApp, useFlow } from "@/lib/store";

export const Route = createFileRoute("/challenge/results")({
  head: () => ({
    meta: [
      { title: "Duel results — IlmStation" },
      { name: "description", content: "Win, loss or draw — with your updated head-to-head record and a rematch option." },
      { property: "og:title", content: "Duel results — IlmStation" },
      { property: "og:description", content: "Winner takes a 50% XP bonus." },
    ],
  }),
  component: DuelResults,
});

/** P11 Duel Results */
function DuelResults() {
  const { flow } = useFlow();
  const { s, set, award, unlock } = useApp();
  const navigate = useNavigate();
  const r = (flow.duelResult as {
    opponent: string;
    topic: TopicId;
    rounds: number;
    mine: number;
    theirs: number;
  }) ?? { opponent: FRIENDS[0].id, topic: "hadith" as TopicId, rounds: 10, mine: 0, theirs: 0 };

  const friend = FRIENDS.find((f) => f.id === r.opponent) ?? FRIENDS[0];
  const topic = topicById(r.topic);
  const won = r.mine > r.theirs;
  const draw = r.mine === r.theirs;
  const xp = won ? 60 + r.mine * 4 : draw ? 30 + r.mine * 2 : r.mine * 3;

  const [applied, setApplied] = useState(false);
  const [badge, setBadge] = useState<string | null>(null);

  useEffect(() => {
    if (applied) return;
    setApplied(true);
    award(xp, "hikmah", `Duel vs ${friend.name.split(" ")[0]} — ${won ? "win" : draw ? "draw" : "loss"}`);
    set({
      duelWins: s.duelWins + (won ? 1 : 0),
      duelLosses: s.duelLosses + (!won && !draw ? 1 : 0),
    });
    if (won && s.duelWins + 1 >= 20 && unlock("insight")) setBadge("insight");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const h2hWins = friend.h2h.wins + (won ? 1 : 0);
  const h2hLosses = friend.h2h.losses + (!won && !draw ? 1 : 0);

  return (
    <AppShell title={won ? "You won!" : draw ? "It's a draw" : "You lost this one"}>
      {won ? <Confetti /> : null}

      <Card tone={won ? "green" : draw ? "field" : "pink"} className="rounded-r24 text-center">
        <div className="text-[56px]" aria-hidden>
          {won ? "🏆" : draw ? "🤝" : "💪"}
        </div>
        <div className="mt-3 flex items-center justify-center gap-6">
          <div>
            <Avatar emoji={s.avatar} size={56} ring="yellow" />
            <Mono className="mt-1 block text-[28px] font-bold">{r.mine}</Mono>
            <div className="text-[13px] font-black">You</div>
          </div>
          <div className="text-[20px] font-black">vs</div>
          <div>
            <Avatar emoji={friend.avatar} size={56} ring="green" />
            <Mono className="mt-1 block text-[28px] font-bold">{r.theirs}</Mono>
            <div className="text-[13px] font-black">{friend.name.split(" ")[0]}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Pill tone="ink">+{xp} XP</Pill>
          {won ? <Pill tone="yellow">Win bonus +50%</Pill> : null}
          <Pill tone="surface">
            {topic.icon} {topic.name}
          </Pill>
          <Pill tone="surface">
            <Mono>{r.rounds}</Mono> rounds
          </Pill>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Your wins" value={h2hWins} tone="yellow" />
        <Stat label="Their wins" value={h2hLosses} />
        <Stat label="Total duels" value={h2hWins + h2hLosses + (draw ? 1 : 0)} tone="field" />
      </div>

      <Card className="mt-4">
        <SectionTitle>Head-to-head record</SectionTitle>
        <p className="text-[15px] font-semibold text-ink2">
          You lead {friend.name} {h2hWins}–{h2hLosses} across {topic.name} and other topics. Your
          overall duel record is now{" "}
          <Mono className="font-bold text-ink">
            {s.duelWins}–{s.duelLosses}
          </Mono>
          .
        </p>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Btn size="lg" full onClick={() => navigate({ to: "/challenge/duel" })}>
          🔁 Rematch
        </Btn>
        <BtnLink to="/friends/$friendId" params={{ friendId: friend.id }} variant="outline" size="lg" full>
          View {friend.name.split(" ")[0]}&apos;s profile
        </BtnLink>
        <BtnLink to="/share" search={{ kind: "score" }} variant="outline" size="lg">
          📤 Share
        </BtnLink>
      </div>

      <BadgeUnlock
        badge={badge ? (BADGES.find((b) => b.id === badge) ?? null) : null}
        onClose={() => setBadge(null)}
      />
    </AppShell>
  );
}
