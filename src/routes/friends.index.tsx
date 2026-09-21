import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, Btn, BtnLink, Card, Empty, Input, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { FRIENDS, PENDING_REQUESTS, SUGGESTED } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/friends/")({
  head: () => ({
    meta: [
      { title: "Friends — study together — IlmStation" },
      { name: "description", content: "Your friends list, pending requests and suggestions, with challenge shortcuts." },
      { property: "og:title", content: "Friends — IlmStation" },
      { property: "og:description", content: "Learn alongside people you know." },
    ],
  }),
  component: Friends,
});

/** S04 Friends List · S05 Find Friends */
function Friends() {
  const { pushNotif } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"friends" | "requests" | "find">("friends");
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const [handled, setHandled] = useState<Record<string, "accepted" | "declined">>({});
  const [copied, setCopied] = useState(false);

  const list = FRIENDS.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.username.toLowerCase().includes(query.toLowerCase()),
  );

  const invite = async () => {
    try {
      await navigator.clipboard.writeText("https://ilmstation.app/invite/seeker");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AppShell title="Friends" subtitle="Challenge, compare and encourage each other." wide>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "friends", label: `Friends (${FRIENDS.length})` },
          { value: "requests", label: `Requests (${PENDING_REQUESTS.length})` },
          { value: "find", label: "Find people" },
        ]}
      />

      {tab === "friends" ? (
        <>
          <div className="mt-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your friends…"
              aria-label="Search friends"
            />
          </div>
          {list.length === 0 ? (
            <div className="mt-4">
              <Empty
                icon="🔍"
                title="No friends match that"
                body="Try another name, or switch to Find people to add someone new."
                action={<Btn onClick={() => setTab("find")}>Find people</Btn>}
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {list.map((f) => (
                <Card key={f.id} className="rounded-r16">
                  <div className="flex items-center gap-3">
                    <Avatar emoji={f.avatar} size={52} ring={f.online ? "green" : "none"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[18px] font-black">{f.name}</p>
                      <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                        {f.username} · Level {f.level} · 🔥 {f.streak}
                      </Mono>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Pill tone="field">
                          H2H <Mono>{f.h2h.wins}–{f.h2h.losses}</Mono>
                        </Pill>
                        {f.online ? <Pill tone="green">Online</Pill> : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn
                      size="sm"
                      onClick={() =>
                        navigate({ to: "/challenge/setup", search: { opponent: f.id } })
                      }
                    >
                      ⚔️ Challenge
                    </Btn>
                    <BtnLink
                      to="/friends/$friendId"
                      params={{ friendId: f.id }}
                      variant="outline"
                      size="sm"
                    >
                      View profile
                    </BtnLink>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}

      {tab === "requests" ? (
        <div className="mt-4 space-y-3">
          {PENDING_REQUESTS.map((r) => {
            const state = handled[r.id];
            return (
              <Card key={r.id} className="rounded-r16">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar emoji={r.avatar} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-black">{r.name}</p>
                    <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                      {r.username} · {r.mutual} mutual friends
                    </Mono>
                  </div>
                  {state ? (
                    <Pill tone={state === "accepted" ? "green" : "field"}>
                      {state === "accepted" ? "Accepted ✓" : "Declined"}
                    </Pill>
                  ) : (
                    <div className="flex gap-2">
                      <Btn
                        size="sm"
                        onClick={() => {
                          setHandled((h) => ({ ...h, [r.id]: "accepted" }));
                          pushNotif({
                            icon: "🤝",
                            title: `${r.name} is now your friend`,
                            body: "Challenge them to a duel to start your head-to-head record.",
                            action: "friends",
                          });
                        }}
                      >
                        Accept
                      </Btn>
                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => setHandled((h) => ({ ...h, [r.id]: "declined" }))}
                      >
                        Decline
                      </Btn>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          {PENDING_REQUESTS.length === 0 ? (
            <Empty icon="📭" title="No pending requests" body="You're all caught up." />
          ) : null}
        </div>
      ) : null}

      {tab === "find" ? (
        <div className="mt-4 space-y-4">
          <Card tone="yellow">
            <SectionTitle>Invite by link</SectionTitle>
            <p className="text-[15px] font-semibold">
              Share your invite link. When a friend joins and finishes their first quiz, you both earn
              50 XP — and it counts towards the Beacon of Hidayah badge.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn variant="ink" onClick={invite}>
                {copied ? "✓ Link copied" : "🔗 Copy invite link"}
              </Btn>
              <BtnLink to="/share" search={{ kind: "invite" }} variant="outline">
                📤 Share card
              </BtnLink>
            </div>
          </Card>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or @username…"
            aria-label="Search people"
          />

          <div className="grid gap-3 md:grid-cols-2">
            {SUGGESTED.filter(
              (p) =>
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.username.toLowerCase().includes(query.toLowerCase()),
            ).map((p) => (
              <Card key={p.id} className="rounded-r16">
                <div className="flex items-center gap-3">
                  <Avatar emoji={p.avatar} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-black">{p.name}</p>
                    <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                      {p.username} · shares {p.shared}
                    </Mono>
                  </div>
                  <Btn
                    size="sm"
                    variant={added.includes(p.id) ? "green" : "primary"}
                    onClick={() => setAdded((a) => [...a, p.id])}
                    disabled={added.includes(p.id)}
                  >
                    {added.includes(p.id) ? "Requested ✓" : "Add friend"}
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
