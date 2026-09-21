import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, BtnLink, Card, Empty, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { FRIENDS, GLOBAL_LEADERBOARD } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — friends, global and local — IlmStation" },
      { name: "description", content: "Weekly and all-time rankings across friends, your city and the world." },
      { property: "og:title", content: "Leaderboard — IlmStation" },
      { property: "og:description", content: "Compete gently, learn seriously." },
    ],
  }),
  component: Leaderboard,
});

type Scope = "friends" | "global" | "local";

/** S03 Leaderboard */
function Leaderboard() {
  const { s, level } = useApp();
  const [scope, setScope] = useState<Scope>("friends");
  const [range, setRange] = useState<"week" | "all">("week");

  const me = {
    id: "me",
    name: s.name || "You",
    avatar: s.avatar,
    xp: range === "week" ? Math.round(s.xp * 0.35) : s.xp,
    level: level.level,
    streak: s.streak,
    friend: false,
  };

  const pool =
    scope === "friends"
      ? FRIENDS.map((f) => ({
          id: f.id,
          name: f.name,
          avatar: f.avatar,
          xp: f.xp,
          level: f.level,
          streak: f.streak,
          friend: true,
        }))
      : scope === "local"
        ? GLOBAL_LEADERBOARD.slice(0, 6)
        : GLOBAL_LEADERBOARD;

  const rows = [...pool, me]
    .map((r) => ({ ...r, xp: range === "week" ? Math.round(r.xp * 0.35) : r.xp }))
    .sort((a, b) => b.xp - a.xp);

  const myRank = rows.findIndex((r) => r.id === "me") + 1;
  const above = rows[myRank - 2];

  return (
    <AppShell title="Leaderboard" subtitle="Ranked by XP earned — reset every Monday." wide>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { value: "friends", label: "Friends" },
            { value: "local", label: "Local" },
            { value: "global", label: "Global" },
          ]}
        />
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: "week", label: "This week" },
            { value: "all", label: "All time" },
          ]}
        />
      </div>

      {/* Podium */}
      <Card tone="yellow" className="rounded-r20">
        <div className="flex items-end justify-center gap-4">
          {[rows[1], rows[0], rows[2]].filter(Boolean).map((r, idx) => (
            <div key={r.id} className="text-center">
              <Avatar
                emoji={r.avatar}
                size={idx === 1 ? 60 : 46}
                ring={r.id === "me" ? "yellow" : idx === 1 ? "green" : "none"}
              />
              <div className="mt-1 max-w-24 truncate text-[13px] font-black">{r.name}</div>
              <Mono className="text-[13px] font-bold">{r.xp} XP</Mono>
              <div
                className={cn(
                  "brutal-flat mt-1 grid w-16 place-items-end justify-center rounded-t-r8 bg-surface pb-1 text-[15px] font-black",
                  idx === 1 ? "h-24" : idx === 0 ? "h-16" : "h-12",
                )}
              >
                {idx === 1 ? "🥇" : idx === 0 ? "🥈" : "🥉"}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* My rank */}
      <Card tone="ink" className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Mono className="text-[26px] font-bold">#{myRank}</Mono>
          <Avatar emoji={s.avatar} size={40} />
          <div className="flex-1">
            <p className="text-[15px] font-black">{me.name} — you</p>
            <Mono className="text-[11px] font-bold tracking-widest uppercase opacity-70">
              {me.xp} XP · Level {level.level} · 🔥 {s.streak}
            </Mono>
          </div>
          {above ? (
            <Pill tone="yellow">{above.xp - me.xp} XP behind {above.name.split(" ")[0]}</Pill>
          ) : (
            <Pill tone="green">Top of the board</Pill>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle
          action={<Mono className="text-[13px] font-bold text-ink2">{rows.length} learners</Mono>}
        >
          {scope === "friends" ? "Your friends" : scope === "local" ? "Your city" : "Worldwide"}
        </SectionTitle>
        {rows.length <= 1 ? (
          <Empty
            icon="🤝"
            title="No one to compare with yet"
            body="Add friends and you'll see a friendly weekly ranking here."
            action={<BtnLink to="/friends">Find friends</BtnLink>}
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r, idx) => (
              <li key={r.id}>
                <div
                  className={cn(
                    "brutal-sm flex items-center gap-3 rounded-r12 px-3 py-2.5",
                    r.id === "me" ? "bg-yellow" : "bg-field",
                  )}
                >
                  <Mono className="w-7 text-[15px] font-bold">{idx + 1}</Mono>
                  <Avatar emoji={r.avatar} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-black">{r.name}</p>
                    <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                      Level {r.level} · 🔥 {r.streak}
                    </Mono>
                  </div>
                  <Mono className="text-[15px] font-bold">{r.xp}</Mono>
                  {r.id !== "me" && FRIENDS.some((f) => f.id === r.id) ? (
                    <BtnLink
                      to="/friends/$friendId"
                      params={{ friendId: r.id }}
                      variant="outline"
                      size="sm"
                    >
                      View
                    </BtnLink>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <BtnLink to="/challenge/setup" size="lg" full>
          ⚔️ Challenge a friend
        </BtnLink>
        <BtnLink to="/share" search={{ kind: "rank" }} variant="outline" size="lg" full>
          📤 Share my rank
        </BtnLink>
      </div>
    </AppShell>
  );
}
