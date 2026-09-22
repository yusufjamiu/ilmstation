import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, Btn, Card, Input, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { HALAQAH_BOTS, TOPICS, type TopicId } from "@/lib/data";
import { useApp, useFlow } from "@/lib/store";

export const Route = createFileRoute("/halaqah/")({
  head: () => ({
    meta: [
      { title: "Halaqah — create a room — IlmStation" },
      { name: "description", content: "Host a live Islamic quiz room for up to six players with a shareable room code." },
      { property: "og:title", content: "Halaqah — IlmStation" },
      { property: "og:description", content: "Family and study-circle mode, up to 6 players." },
    ],
  }),
  component: CreateRoom,
});

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `IQ-${Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
}

/** FM01 Create Room */
function CreateRoom() {
  const { s } = useApp();
  const { setFlow } = useFlow();
  const navigate = useNavigate();
  const [code, setCode] = useState("IQ-7F2K");
  const [topic, setTopic] = useState<TopicId>("seerah");
  const [rounds, setRounds] = useState(5);
  const [limit, setLimit] = useState(20);
  const [joined, setJoined] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => setCode(makeCode()), []);

  // Players trickle in while the host waits.
  useEffect(() => {
    if (joined.length >= 5) return;
    const t = setTimeout(() => setJoined((j) => [...j, HALAQAH_BOTS[j.length].id]), 1800);
    return () => clearTimeout(t);
  }, [joined]);

  const players = HALAQAH_BOTS.filter((b) => joined.includes(b.id));

  const start = () => {
    setFlow({ room: { code, topic, rounds, limit, players: players.map((p) => p.id) } });
    navigate({ to: "/halaqah/game" });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AppShell title="Halaqah room" subtitle="Live quiz for up to 6 players in the same circle." wide>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card tone="yellow" className="rounded-r20">
          <SectionTitle>Your room code</SectionTitle>
          <div className="brutal rounded-r16 bg-surface py-6 text-center">
            <Mono className="text-[36px] font-bold ">{code}</Mono>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn variant="ink" size="sm" onClick={copy}>
              {copied ? "✓ Copied" : "🔗 Copy code"}
            </Btn>
            <Btn variant="outline" size="sm" onClick={() => setCode(makeCode())}>
              🔄 New code
            </Btn>
            <Btn variant="outline" size="sm">
              ▣ Show QR
            </Btn>
          </div>
          <p className="mt-3 text-[13px] font-semibold">
            Hosting requires Premium — joining is always free.{" "}
            {s.premium ? "You're on Premium." : "You're hosting on a trial room."}
          </p>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle>Topic</SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopic(t.id)}
                  aria-pressed={topic === t.id}
                  className={`brutal-sm press-sm rounded-r12 p-2 text-center ${
                    topic === t.id ? "bg-yellow" : "bg-field"
                  }`}
                >
                  <div className="text-[20px]" aria-hidden>
                    {t.icon}
                  </div>
                  <div className="text-[11px] font-black">{t.name}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Rounds</SectionTitle>
            <Segmented
              value={String(rounds)}
              onChange={(v) => setRounds(Number(v))}
              options={[
                { value: "5", label: "5" },
                { value: "10", label: "10" },
                { value: "15", label: "15" },
              ]}
            />
            <div className="mt-3">
              <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
                Seconds per question
              </p>
              <Segmented
                value={String(limit)}
                onChange={(v) => setLimit(Number(v))}
                options={[
                  { value: "10", label: "10s" },
                  { value: "20", label: "20s" },
                  { value: "30", label: "30s" },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <SectionTitle
          action={
            <Mono className="text-[13px] font-bold text-ink2">{players.length + 1} / 6 joined</Mono>
          }
        >
          Players
        </SectionTitle>
        <div className="flex flex-wrap gap-3">
          <div className="text-center">
            <Avatar emoji={s.avatar} size={52} ring="yellow" />
            <div className="mt-1 text-[13px] font-black">You (host)</div>
          </div>
          {players.map((p) => (
            <div key={p.id} className="anim-pop text-center">
              <Avatar emoji={p.avatar} size={52} ring="green" />
              <div className="mt-1 text-[13px] font-black">{p.name}</div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 5 - players.length) }).map((_, i) => (
            <div key={i} className="text-center opacity-45">
              <span className="brutal-sm grid h-13 w-13 place-items-center rounded-rf bg-field text-[20px]">
                ⋯
              </span>
              <div className="mt-1 text-[13px] font-black">Waiting</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Btn size="lg" full disabled={players.length === 0} onClick={start}>
          Start the game →
        </Btn>
        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="IQ-XXXX"
            aria-label="Join a room by code"
            className="w-36"
          />
          <Btn variant="outline" size="lg" disabled={joinCode.length < 4} onClick={start}>
            Join
          </Btn>
        </div>
      </div>
      <div className="mt-3">
        <Pill tone="field">Host controls the pace · questions are timed for everyone at once</Pill>
      </div>
    </AppShell>
  );
}
