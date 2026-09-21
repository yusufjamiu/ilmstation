import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Arabic, Card, Mono, Pill } from "@/components/kit";
import { QUESTS, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/play/")({
  head: () => ({
    meta: [
      { title: "Play Hub — IlmStation" },
      { name: "description", content: "Five ways to play: Daily Quest, Quick Quiz, Challenge, Hifz Mode and Halaqah." },
      { property: "og:title", content: "Play Hub — IlmStation" },
      { property: "og:description", content: "Pick a mode and earn XP." },
    ],
  }),
  component: PlayHub,
});

/** P01 Play Hub */
function PlayHub() {
  const { s } = useApp();
  const quest = QUESTS.find((q) => (s.questStages[q.id] ?? 0) < 3) ?? QUESTS[0];

  const MODES = [
    {
      to: "/play/lobby",
      search: { topic: quest.topic, count: 10, difficulty: s.difficulty, quest: quest.id },
      icon: "🎯",
      name: "Daily Quest",
      arabic: "مُهِمَّةُ الْيَوْم",
      note: "Today: " + quest.name,
      xp: "+80 XP",
      tone: "yellow" as const,
    },
    {
      to: "/play/topics",
      icon: "⚡",
      name: "Quick Quiz",
      arabic: "اِخْتِبَارٌ سَرِيع",
      note: "Any topic, any difficulty",
      xp: "1× – 2× XP",
      tone: "surface" as const,
    },
    {
      to: "/challenge/setup",
      icon: "⚔️",
      name: "Challenge",
      arabic: "تَحَدِّي",
      note: "Duel a friend head-to-head",
      xp: "+50% XP",
      tone: "pink" as const,
    },
    {
      to: "/hifz",
      icon: "📖",
      name: "Hifz Mode",
      arabic: "حِفْظ",
      note: "Memorise with spaced repetition",
      xp: "+30 XP",
      tone: "green" as const,
    },
    {
      to: "/halaqah",
      icon: "👨‍👩‍👧",
      name: "Halaqah",
      arabic: "حَلَقَة",
      note: "Live room for up to 6 players",
      xp: "Host: Premium",
      tone: "field" as const,
    },
  ];

  return (
    <AppShell title="Play" subtitle="Five modes. Every one of them earns XP.">
      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => (
          <Link key={m.name} to={m.to} search={m.search as never}>
            <Card tone={m.tone} className="press h-full rounded-r20">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[40px]" aria-hidden>
                  {m.icon}
                </span>
                <Pill tone={m.tone === "yellow" ? "ink" : "yellow"}>{m.xp}</Pill>
              </div>
              <h2 className="mt-2 text-[24px] leading-tight font-black">{m.name}</h2>
              <Arabic size="md">{m.arabic}</Arabic>
              <p className="mt-1.5 text-[13px] font-semibold text-ink2">{m.note}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[24px]" aria-hidden>
            {topicById(quest.topic).icon}
          </span>
          <div className="flex-1">
            <div className="mono text-[11px] font-bold tracking-widest text-ink2 uppercase">
              Difficulty baseline
            </div>
            <div className="text-[15px] font-black capitalize">{s.difficulty}</div>
          </div>
          <Link to="/play/difficulty" search={{ topic: quest.topic, count: 10 }}>
            <Pill tone="yellow">Change ›</Pill>
          </Link>
        </div>
        <p className="mt-2 text-[13px] text-ink2">
          Higher difficulty multiplies XP: Beginner 1×, Intermediate 1.5×, Advanced 2×. Your{" "}
          <Mono>{s.quizzesPlayed}</Mono> quizzes so far set this baseline.
        </p>
      </Card>
    </AppShell>
  );
}
