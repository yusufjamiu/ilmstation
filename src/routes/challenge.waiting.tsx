import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Avatar, Btn, Card, Mono, Pill } from "@/components/kit";
import { FRIENDS, topicById, type TopicId } from "@/lib/data";
import { useApp, useFlow } from "@/lib/store";

export const Route = createFileRoute("/challenge/waiting")({
  head: () => ({
    meta: [
      { title: "Waiting room — IlmStation" },
      { name: "description", content: "Your duel invite is pending. It expires in 24 hours." },
      { property: "og:title", content: "Waiting room — IlmStation" },
      { property: "og:description", content: "Waiting for your opponent to accept." },
    ],
  }),
  component: WaitingRoom,
});

/** P09 Waiting Room */
function WaitingRoom() {
  const { flow } = useFlow();
  const { s } = useApp();
  const navigate = useNavigate();
  const duel = (flow.duel as { opponent: string; topic: TopicId; rounds: number }) ?? {
    opponent: FRIENDS[0].id,
    topic: "hadith" as TopicId,
    rounds: 10,
  };
  const friend = FRIENDS.find((f) => f.id === duel.opponent) ?? FRIENDS[0];
  const topic = topicById(duel.topic);

  const [seconds, setSeconds] = useState(86_400 - 42);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSeconds((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!friend.online) return;
    const t = setTimeout(() => setAccepted(true), 3200);
    return () => clearTimeout(t);
  }, [friend.online]);

  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;

  return (
    <AppShell back={{ to: "/challenge/setup", label: "Challenge setup" }} title="Invite sent">
      <Card tone={accepted ? "green" : "field"} className="rounded-r24 text-center">
        <div className="flex items-center justify-center gap-5">
          <div>
            <Avatar emoji={s.avatar} size={64} ring="yellow" />
            <div className="mt-1 text-[13px] font-black">You</div>
          </div>
          <div className="text-[28px] font-black">⚔️</div>
          <div>
            <Avatar emoji={friend.avatar} size={64} ring={accepted ? "green" : "none"} />
            <div className="mt-1 text-[13px] font-black">{friend.name.split(" ")[0]}</div>
          </div>
        </div>

        <h2 className="mt-4 text-[24px] leading-tight font-black">
          {accepted ? `${friend.name.split(" ")[0]} accepted!` : "Waiting for acceptance…"}
        </h2>
        <p className="mt-1 text-[15px] font-semibold text-ink2">
          {accepted
            ? "Both of you are online — this duel runs live."
            : friend.online
              ? "They're online, so this should be quick."
              : "They're offline. The invite stays open for 24 hours."}
        </p>

        <div className="brutal-sm mt-4 inline-flex items-center gap-2 rounded-rf bg-surface px-4 py-2">
          <Mono className="text-[20px] font-bold">
            {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </Mono>
          <span className="text-[11px] font-black uppercase">until expiry</span>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center gap-3">
          <span className="text-[36px]" aria-hidden>
            {topic.icon}
          </span>
          <div className="flex-1">
            <div className="text-[20px] font-black">{topic.name}</div>
            <Arabic size="md">{topic.arabic}</Arabic>
          </div>
          <div className="text-right">
            <Pill tone="ink">
              <Mono>{duel.rounds}</Mono> rounds
            </Pill>
            <div className="mt-1">
              <Pill tone="yellow">Winner +50% XP</Pill>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Btn
          size="lg"
          full
          disabled={!accepted}
          onClick={() => navigate({ to: "/challenge/duel" })}
        >
          {accepted ? "Start the duel →" : "Waiting for opponent…"}
        </Btn>
        <Btn variant="outline" size="lg" onClick={() => navigate({ to: "/play" })}>
          Cancel invite
        </Btn>
      </div>
    </AppShell>
  );
}
