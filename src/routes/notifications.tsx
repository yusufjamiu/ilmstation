import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Btn, Card, Empty, Mono, Pill } from "@/components/kit";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — IlmStation" },
      { name: "description", content: "Challenge invites, friend activity, badge unlocks and streak reminders." },
      { property: "og:title", content: "Notifications — IlmStation" },
      { property: "og:description", content: "Everything that happened while you were away." },
    ],
  }),
  component: Notifications,
});

const TARGETS: Record<string, string> = {
  challenge: "/challenge/setup",
  achievements: "/achievements",
  leaderboard: "/leaderboard",
  home: "/home",
  friends: "/friends",
};

/** H04 Notifications */
function Notifications() {
  const { s, set, readAllNotifs } = useApp();
  const unread = s.notifs.filter((n) => n.unread).length;

  return (
    <AppShell
      back={{ to: "/home", label: "Home" }}
      title="Notifications"
      subtitle={unread ? `${unread} unread` : "You're all caught up"}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Btn variant="outline" size="sm" onClick={readAllNotifs} disabled={!unread}>
          Mark all read
        </Btn>
        <Btn variant="outline" size="sm" onClick={() => set({ notifs: [] })} disabled={!s.notifs.length}>
          Clear all
        </Btn>
      </div>

      {s.notifs.length === 0 ? (
        <Empty
          icon="🔔"
          title="Nothing here yet"
          body="Challenge invites, badge unlocks and streak reminders will appear here."
        />
      ) : (
        <ul className="space-y-2">
          {s.notifs.map((n) => (
            <li key={n.id}>
              <Link
                to={TARGETS[n.action] ?? "/home"}
                onClick={() =>
                  set({
                    notifs: s.notifs.map((x) => (x.id === n.id ? { ...x, unread: false } : x)),
                  })
                }
                className="block"
              >
                <Card
                  tone={n.unread ? "yellow" : "surface"}
                  className="press flex items-start gap-3 rounded-r12"
                >
                  <span className="text-[24px]" aria-hidden>
                    {n.icon}
                  </span>
                  <div className="flex-1">
                    <div className="text-[15px] font-black">{n.title}</div>
                    <div className="text-[13px] font-semibold text-ink2">{n.body}</div>
                  </div>
                  <div className="text-right">
                    <Mono className="text-[11px] font-bold text-ink2">{n.time}</Mono>
                    {n.unread ? (
                      <div className="mt-1">
                        <Pill tone="ink">New</Pill>
                      </div>
                    ) : null}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
