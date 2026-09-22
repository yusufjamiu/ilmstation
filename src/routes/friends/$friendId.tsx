import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Avatar, Bar, Btn, BtnLink, Card, Empty, Mono, Pill, SectionTitle, Stat } from "@/components/kit";
import { friendById, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/friends/$friendId")({
  loader: ({ params }) => {
    const friend = friendById(params.friendId);
    if (!friend) throw notFound();
    return { friend };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Friend not found — IlmStation" }, { name: "robots", content: "noindex" }] };
    }
    const { friend } = loaderData;
    return {
      meta: [
        { title: `${friend.name} — friend profile — IlmStation` },
        { name: "description", content: `Level ${friend.level}, ${friend.xp} XP and a ${friend.streak}-day streak. See your head-to-head record.` },
        { property: "og:title", content: `${friend.name} on IlmStation` },
        { property: "og:description", content: `Level ${friend.level} · ${friend.streak}-day streak.` },
      ],
    };
  },
  notFoundComponent: FriendMissing,
  component: FriendProfile,
});

function FriendMissing() {
  return (
    <AppShell title="Friend not found">
      <Empty
        icon="👤"
        title="That profile isn't available"
        body="They may have left IlmStation. Head back to your friends list."
        action={<BtnLink to="/friends">Back to Friends</BtnLink>}
      />
    </AppShell>
  );
}

/** S06 Friend Profile */
function FriendProfile() {
  const { friend } = Route.useLoaderData();
  const { s } = useApp();
  const navigate = useNavigate();
  const total = friend.h2h.wins + friend.h2h.losses;
  const winRate = total ? friend.h2h.wins / total : 0;

  return (
    <AppShell back={{ to: "/friends", label: "Friends" }} title={friend.name}>
      <Card tone="yellow" className="rounded-r24">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar emoji={friend.avatar} size={80} ring={friend.online ? "green" : "none"} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] leading-tight font-black">{friend.name}</h2>
            <Mono className="text-[13px] font-bold text-ink2">{friend.username}</Mono>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill tone="ink">Level {friend.level}</Pill>
              <Pill tone="surface">🔥 {friend.streak} days</Pill>
              <Pill tone="surface">{friend.mutual} mutual friends</Pill>
              {friend.online ? <Pill tone="green">Online now</Pill> : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Their XP" value={friend.xp} tone="yellow" icon="⚡" />
        <Stat label="Your XP" value={s.xp} tone="green" icon="⚡" />
        <Stat label="You won" value={friend.h2h.wins} icon="🏆" />
        <Stat label="You lost" value={friend.h2h.losses} icon="💫" />
      </div>

      <Card className="mt-4">
        <SectionTitle>Head-to-head</SectionTitle>
        <div className="mb-1 flex justify-between text-[13px] font-black">
          <span>
            You {friend.h2h.wins} — {friend.h2h.losses} {friend.name.split(" ")[0]}
          </span>
          <Mono>{Math.round(winRate * 100)}% win rate</Mono>
        </div>
        <Bar value={winRate} tone={winRate >= 0.5 ? "green" : "pink"} label="Head to head" />
        <p className="mt-2 text-[15px] font-semibold text-ink2">
          {winRate >= 0.5
            ? "You have the edge — keep it by playing their strongest topic."
            : "They're ahead. Study their strong topics below, then rematch."}
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle>Their strongest topics</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {friend.topics.map((id) => {
            const t = topicById(id);
            return (
              <BtnLink
                key={id}
                to="/play/difficulty"
                search={{ topic: id, count: 10 }}
                variant="outline"
                size="sm"
              >
                {t.icon} {t.name}
              </BtnLink>
            );
          })}
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Btn
          size="lg"
          full
          onClick={() => navigate({ to: "/challenge/setup", search: { opponent: friend.id } })}
        >
          ⚔️ Challenge {friend.name.split(" ")[0]}
        </Btn>
        <BtnLink to="/leaderboard" variant="outline" size="lg" full>
          🏆 Compare on leaderboard
        </BtnLink>
      </div>
    </AppShell>
  );
}
