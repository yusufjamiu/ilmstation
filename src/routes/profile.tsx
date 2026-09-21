import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Arabic,
  Avatar,
  Bar,
  Btn,
  BtnLink,
  Card,
  Field,
  Input,
  Modal,
  Mono,
  Pill,
  SectionTitle,
  Stat,
} from "@/components/kit";
import { AVATARS, BADGES, FRIENDS, QUESTS, TOPICS, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — level, badges and stats — IlmStation" },
      { name: "description", content: "Your level, XP, streak, badges, favourite topics and friends — all editable." },
      { property: "og:title", content: "My Profile — IlmStation" },
      { property: "og:description", content: "Your learning identity in IlmStation." },
    ],
  }),
  component: Profile,
});

/** S01 My Profile · S01b Edit Profile */
function Profile() {
  const { s, set, level, totalPoints } = useApp();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(s.name);
  const [username, setUsername] = useState(s.username);
  const [avatar, setAvatar] = useState(s.avatar);

  const earned = BADGES.filter((b) => s.badges.includes(b.id));
  const questsDone = QUESTS.filter((q) => (s.questStages[q.id] ?? 0) >= 3).length;
  const inLevel = level.max === Infinity ? 1 : (s.xp - level.min) / (level.max - level.min + 1);
  const interests = s.interests.length ? s.interests : TOPICS.slice(0, 3).map((t) => t.id);

  const save = () => {
    set({ name, username: username.startsWith("@") ? username : `@${username}`, avatar });
    setEdit(false);
  };

  return (
    <AppShell title="My Profile" wide>
      <Card tone="yellow" className="rounded-r24">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar emoji={s.avatar} size={84} ring="green" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[28px] leading-tight font-black">{s.name || "Seeker"}</h2>
            <Mono className="text-[13px] font-bold text-ink2">{s.username || "@seeker"}</Mono>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill tone="ink">
                Level {level.level} · {level.name}
              </Pill>
              <Pill tone="surface">🔥 {s.streak} day streak</Pill>
              <Pill tone="surface">{s.premium ? "⚡ Premium" : "Free plan"}</Pill>
            </div>
            <Arabic size="md" className="mt-1">
              {level.arabic}
            </Arabic>
          </div>
          <div className="flex flex-col gap-2">
            <Btn variant="ink" onClick={() => setEdit(true)}>
              ✏️ Edit profile
            </Btn>
            <BtnLink to="/settings" variant="outline">
              ⚙️ Settings
            </BtnLink>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[13px] font-black">
            <span>Progress to next level</span>
            <Mono>
              {s.xp} / {level.max === Infinity ? "∞" : level.max} XP
            </Mono>
          </div>
          <Bar value={inLevel} tone="green" label="Level progress" />
          <p className="mt-1 text-[13px] font-semibold text-ink2">Unlocks: {level.unlocks}</p>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total XP" value={s.xp} tone="yellow" icon="⚡" />
        <Stat label="Points" value={totalPoints} tone="green" icon="🪙" />
        <Stat label="Quizzes" value={s.quizzesPlayed} icon="🎯" />
        <Stat label="Duels won" value={s.duelWins} icon="⚔️" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            action={
              <BtnLink to="/achievements" variant="outline" size="sm">
                See all
              </BtnLink>
            }
          >
            Badges ({earned.length}/{BADGES.length})
          </SectionTitle>
          {earned.length === 0 ? (
            <p className="text-[15px] font-semibold text-ink2">
              No badges yet — finish a quest or hit a streak milestone to earn your first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {earned.map((b) => (
                <div key={b.id} className="brutal-sm rounded-r12 bg-field p-3 text-center">
                  <div className="text-[28px]" aria-hidden>
                    {b.icon}
                  </div>
                  <div className="mt-1 max-w-24 text-[11px] font-black">{b.name}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>Favourite topics</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {interests.map((id) => {
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
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Quests completed" value={`${questsDone}/${QUESTS.length}`} />
            <Stat label="Articles read" value={s.articlesRead} />
            <Stat label="Hifz sessions" value={s.hifzSessions} />
            <Stat label="Sadaqah points" value={s.donated} />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle
          action={
            <BtnLink to="/friends" variant="outline" size="sm">
              Manage
            </BtnLink>
          }
        >
          Friends ({FRIENDS.length})
        </SectionTitle>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {FRIENDS.map((f) => (
            <button
              key={f.id}
              className="press-sm shrink-0 text-center"
              onClick={() => navigate({ to: "/friends/$friendId", params: { friendId: f.id } })}
            >
              <Avatar emoji={f.avatar} size={52} ring={f.online ? "green" : "none"} />
              <div className="mt-1 max-w-16 truncate text-[11px] font-black">
                {f.name.split(" ")[0]}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <BtnLink to="/progress" size="lg" full>
          📈 My progress
        </BtnLink>
        <BtnLink to="/share" search={{ kind: "progress" }} variant="outline" size="lg" full>
          📤 Share profile card
        </BtnLink>
        <BtnLink to="/wallet" variant="outline" size="lg" full>
          💰 Wallet
        </BtnLink>
      </div>

      {/* Edit profile sheet */}
      <Modal open={edit} onClose={() => setEdit(false)} title="Edit profile">
        <div className="space-y-3">
          <Field label="Display name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Username" hint="Friends find you with this handle.">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
            />
          </Field>
          <div>
            <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
              Avatar
            </p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  aria-pressed={avatar === a}
                  className={cn(
                    "brutal-sm press-sm grid h-12 w-12 place-items-center rounded-rf text-[22px]",
                    avatar === a ? "bg-yellow" : "bg-field",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Btn full onClick={save}>
              Save changes
            </Btn>
            <Btn variant="outline" full onClick={() => setEdit(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
