import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, Btn, BtnLink, Card, Confetti, Mono, Pill, SectionTitle } from "@/components/kit";
import { HALAQAH_BOTS, topicById, type TopicId } from "@/lib/data";
import { useApp, useFlow } from "@/lib/store";

export const Route = createFileRoute("/halaqah/results")({
  head: () => ({
    meta: [
      { title: "Halaqah results — IlmStation" },
      { name: "description", content: "The final podium, every player's score and a group share card." },
      { property: "og:title", content: "Halaqah results — IlmStation" },
      { property: "og:description", content: "Who topped the circle?" },
    ],
  }),
  component: FamilyResults,
});

/** FM03 Family Results */
function FamilyResults() {
  const { flow } = useFlow();
  const { s, award } = useApp();
  const navigate = useNavigate();
  const res = (flow.roomResult as {
    code: string;
    topic: TopicId;
    scores: Record<string, number>;
    players: string[];
  }) ?? { code: "IQ-7F2K", topic: "seerah" as TopicId, scores: { me: 0 }, players: [] };

  const topic = topicById(res.topic);
  const [applied, setApplied] = useState(false);

  const rows = [
    { id: "me", name: "You", avatar: s.avatar, score: res.scores.me ?? 0 },
    ...HALAQAH_BOTS.filter((b) => res.players.includes(b.id)).map((b) => ({
      id: b.id,
      name: b.name,
      avatar: b.avatar,
      score: res.scores[b.id] ?? 0,
    })),
  ].sort((a, b) => b.score - a.score);

  const myRank = rows.findIndex((r) => r.id === "me") + 1;
  const xp = 40 + (res.scores.me ?? 0) * 6 + (myRank === 1 ? 30 : 0);

  useEffect(() => {
    if (applied) return;
    setApplied(true);
    award(xp, "ajr", `Halaqah ${res.code} — rank ${myRank}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const podium = [rows[1], rows[0], rows[2]].filter(Boolean);
  const heights = ["h-20", "h-28", "h-14"];

  return (
    <AppShell title={myRank === 1 ? "You topped the circle!" : "Halaqah complete"}>
      {myRank === 1 ? <Confetti /> : null}

      <Card tone="yellow" className="rounded-r24">
        <div className="flex items-end justify-center gap-3">
          {podium.map((p, idx) => (
            <div key={p.id} className="text-center">
              <Avatar emoji={p.avatar} size={idx === 1 ? 56 : 44} ring={idx === 1 ? "green" : "none"} />
              <div className="mt-1 text-[13px] font-black">{p.name}</div>
              <Mono className="text-[13px] font-bold">{p.score}</Mono>
              <div
                className={`brutal-flat mt-1 grid ${heights[idx]} w-16 place-items-end justify-center rounded-t-r8 bg-surface pb-1 text-[13px] font-black`}
              >
                {idx === 1 ? "🥇" : idx === 0 ? "🥈" : "🥉"}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill tone="ink">{res.code}</Pill>
          <Pill tone="surface">
            {topic.icon} {topic.name}
          </Pill>
          <Pill tone="surface">+{xp} XP</Pill>
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle>Full ranking</SectionTitle>
        <ul className="space-y-2">
          {rows.map((r, idx) => (
            <li
              key={r.id}
              className={`brutal-sm flex items-center gap-3 rounded-r12 px-3 py-2.5 ${
                r.id === "me" ? "bg-yellow" : "bg-field"
              }`}
            >
              <Mono className="w-6 text-[15px] font-bold">{idx + 1}</Mono>
              <Avatar emoji={r.avatar} size={36} />
              <span className="flex-1 text-[15px] font-black">{r.name}</span>
              <Mono className="text-[15px] font-bold">{r.score}</Mono>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Btn size="lg" full onClick={() => navigate({ to: "/halaqah" })}>
          Play again
        </Btn>
        <BtnLink to="/share" search={{ kind: "progress" }} variant="outline" size="lg" full>
          📤 Share results
        </BtnLink>
        <BtnLink to="/home" variant="outline" size="lg">
          Home
        </BtnLink>
      </div>
    </AppShell>
  );
}
