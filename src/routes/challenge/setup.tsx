import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Avatar, Btn, Card, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { FRIENDS, TOPICS, topicById, type TopicId } from "@/lib/data";
import { useApp, useFlow } from "@/lib/store";

export const Route = createFileRoute("/challenge/setup")({
  validateSearch: (search: Record<string, unknown>): { opponent?: string } => ({
    opponent: search.opponent ? String(search.opponent) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Challenge a friend — IlmStation" },
      { name: "description", content: "Pick an opponent, a topic and the number of rounds, then send the duel invite." },
      { property: "og:title", content: "Challenge a friend — IlmStation" },
      { property: "og:description", content: "Head-to-head duels, +50% XP for the winner." },
    ],
  }),
  component: ChallengeSetup,
});

/** P08 Challenge Setup */
function ChallengeSetup() {
  const { s } = useApp();
  const { setFlow } = useFlow();
  const navigate = useNavigate();
  const { opponent: preselect } = Route.useSearch();
  const [opponent, setOpponent] = useState(
    FRIENDS.some((f) => f.id === preselect) ? (preselect as string) : FRIENDS[0].id,
  );
  const [topic, setTopic] = useState<TopicId>("hadith");
  const [rounds, setRounds] = useState(10);

  const friend = FRIENDS.find((f) => f.id === opponent)!;
  const shared = friend.topics;

  const send = () => {
    setFlow({ duel: { opponent, topic, rounds } });
    navigate({ to: "/challenge/waiting" });
  };

  return (
    <AppShell back={{ to: "/play", label: "Play" }} title="Set up a duel" wide>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>1 · Choose your opponent</SectionTitle>
          <ul className="space-y-2">
            {FRIENDS.map((f) => {
              const active = opponent === f.id;
              return (
                <li key={f.id}>
                  <button onClick={() => setOpponent(f.id)} className="w-full" aria-pressed={active}>
                    <div
                      className={`brutal-sm press-sm flex items-center gap-3 rounded-r12 px-3 py-2.5 text-left ${
                        active ? "bg-yellow" : "bg-field"
                      }`}
                    >
                      <Avatar emoji={f.avatar} size={40} ring={f.online ? "green" : "none"} />
                      <div className="flex-1">
                        <div className="text-[15px] font-black">{f.name}</div>
                        <Mono className="text-[11px] font-bold text-ink2">
                          LVL {f.level} · 🔥 {f.streak} · H2H {f.h2h.wins}–{f.h2h.losses}
                        </Mono>
                      </div>
                      {f.online ? <Pill tone="green">Online</Pill> : <Pill>Async</Pill>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle>2 · Choose the topic</SectionTitle>
            <p className="mb-2 text-[13px] font-semibold text-ink2">
              {friend.name.split(" ")[0]} plays {shared.map((t) => topicById(t).name).join(", ")} most.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TOPICS.filter((t) => !t.premium || s.premium).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopic(t.id)}
                  aria-pressed={topic === t.id}
                  className={`brutal-sm press-sm rounded-r12 p-2.5 text-center ${
                    topic === t.id ? "bg-yellow" : "bg-field"
                  }`}
                >
                  <div className="text-[24px]" aria-hidden>
                    {t.icon}
                  </div>
                  <div className="text-[13px] font-black">{t.name}</div>
                  {shared.includes(t.id) ? (
                    <Mono className="text-[10px] font-bold text-ink2">shared</Mono>
                  ) : null}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>3 · Rounds</SectionTitle>
            <Segmented
              value={String(rounds)}
              onChange={(v) => setRounds(Number(v))}
              options={[
                { value: "5", label: "5 questions" },
                { value: "10", label: "10 questions" },
                { value: "15", label: "15 questions" },
              ]}
            />
          </Card>

          <Card tone="yellow">
            <div className="flex items-center gap-3">
              <Avatar emoji={s.avatar} size={44} />
              <span className="text-[20px] font-black">vs</span>
              <Avatar emoji={friend.avatar} size={44} />
              <div className="flex-1">
                <div className="text-[15px] font-black">{topicById(topic).name}</div>
                <Arabic size="sm">{topicById(topic).arabic}</Arabic>
              </div>
              <Pill tone="ink">
                <Mono>{rounds}</Mono> rounds
              </Pill>
            </div>
            <Btn variant="ink" size="lg" full className="mt-4" onClick={send}>
              Send challenge →
            </Btn>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
