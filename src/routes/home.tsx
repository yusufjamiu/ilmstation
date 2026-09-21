import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Bot, ChevronRight, Flame, Play, Sparkles, Target, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Bar, BtnLink, Card, Mono, Pill, SectionTitle } from "@/components/kit";
import { StreakModal } from "@/components/StreakModal";
import { QUESTS, WISDOM, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — IlmStation" },
      { name: "description", content: "Your daily Islamic learning home: today's quest, progress, play modes and wisdom." },
      { property: "og:title", content: "Home — IlmStation" },
      { property: "og:description", content: "Continue your daily learning journey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeFeed,
});

const MODES = [
  { to: "/play/topics", icon: Target, name: "Quick quiz", note: "A focused five-minute round", tone: "bg-yellow" },
  { to: "/hifz", icon: BookOpen, name: "Hifz mode", note: "Continue memorisation", tone: "bg-green-l" },
  { to: "/challenge/setup", icon: Trophy, name: "Challenge", note: "Invite a friend to play", tone: "bg-pink-l" },
  { to: "/halaqah", icon: Users, name: "Halaqah", note: "Learn together in a room", tone: "bg-field" },
] as const;

function HomeFeed() {
  const { s, level } = useApp();
  const [streakOpen, setStreakOpen] = useState(false);
  const first = (s.name || "Seeker").split(" ")[0];
  const wisdom = WISDOM[0];
  const quest = QUESTS.find((item) => (s.questStages[item.id] ?? 0) < 3) ?? QUESTS[0];
  const topic = topicById(quest.topic);
  const levelProgress = level.max === Infinity ? 1 : (s.xp - level.min) / (level.max - level.min + 1);

  return (
    <AppShell wide>
      <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mono text-[11px] font-bold uppercase text-muted">Level {level.level} · {level.name}</p>
          <h1 className="mt-2 text-[36px] leading-tight font-black sm:text-[44px]">Assalamu Alaykum, {first}</h1>
          <p className="mt-2 text-[16px] text-ink2">Here is a clear path for today’s learning.</p>
        </div>
        {!s.ramadanDismissed ? (
          <Link to="/ramadan" className="flex items-center gap-3 rounded-r12 border border-border/25 bg-ink px-4 py-3 text-page transition-transform hover:-translate-y-0.5">
            <Sparkles size={19} />
            <span><span className="block text-[13px] font-bold">Ramadan mode</span><span className="block text-[11px] opacity-70">Today’s quest and tracker</span></span>
            <ChevronRight size={17} />
          </Link>
        ) : null}
      </section>

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <Link to="/progress" className="rounded-r12 border border-border/20 bg-surface p-3 transition-colors hover:bg-field sm:p-5">
          <div className="flex items-center justify-between"><span className="mono text-[10px] font-bold uppercase text-muted">Total XP</span><Sparkles size={18} /></div>
          <p className="mt-4 text-[20px] font-black sm:mt-5 sm:text-[30px]"><Mono>{s.xp.toLocaleString()}</Mono></p>
          <p className="mt-1 hidden text-[12px] font-bold text-green sm:block">Keep building your level</p>
        </Link>
        <button onClick={() => setStreakOpen(true)} className="rounded-r12 border border-border/20 bg-surface p-3 text-left transition-colors hover:bg-field sm:p-5">
          <div className="flex items-center justify-between"><span className="mono text-[10px] font-bold uppercase text-muted">Current streak</span><Flame size={18} /></div>
          <p className="mt-4 text-[20px] font-black sm:mt-5 sm:text-[30px]"><Mono>{s.streak}</Mono><span className="ml-1 text-[12px] sm:text-[22px]">days</span></p>
          <p className="mt-1 hidden text-[12px] font-bold text-pink sm:block">One activity keeps it alive</p>
        </button>
        <Link to="/leaderboard" className="rounded-r12 border border-border/20 bg-surface p-3 transition-colors hover:bg-field sm:p-5">
          <div className="flex items-center justify-between"><span className="mono text-[10px] font-bold uppercase text-muted">Learning record</span><Trophy size={18} /></div>
          <p className="mt-4 text-[20px] font-black sm:mt-5 sm:text-[30px]"><Mono>{s.quizzesPlayed}</Mono><span className="ml-1 text-[12px] sm:text-[22px]">played</span></p>
          <p className="mt-1 hidden text-[12px] font-bold text-ink2 sm:block">{s.badges.length} badges earned</p>
        </Link>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]">
        <div className="space-y-8">
          <div>
            <SectionTitle action={<Link to="/quests" className="text-[13px] font-bold text-ink2 hover:text-ink">View quest map</Link>}>Today’s focus</SectionTitle>
            <Card tone="yellow" className="brutal p-6 sm:p-8">
              <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <Pill tone="surface">Daily quest · +80 XP</Pill>
                  <h2 className="mt-4 text-[28px] leading-tight font-black sm:text-[34px]">{quest.name}</h2>
                  <Arabic size="lg" className="mt-1 text-left">{quest.arabic}</Arabic>
                  <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink2">A ten-question session on {topic.name.toLowerCase()}, designed to fit into five focused minutes.</p>
                </div>
                <div className="grid h-20 w-20 place-items-center rounded-r16 border border-border/30 bg-surface/70">
                  <BookOpen size={34} />
                </div>
              </div>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <BtnLink to="/play/lobby" search={{ topic: quest.topic, count: 10, difficulty: s.difficulty, quest: quest.id }} variant="ink" size="lg">
                  <Play size={17} fill="currentColor" /> Start quest
                </BtnLink>
                <BtnLink to="/home/quest" variant="outline" size="lg">View details</BtnLink>
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle action={<Link to="/play" className="text-[13px] font-bold text-ink2 hover:text-ink">All modes</Link>}>Choose another activity</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                return <Link key={mode.to} to={mode.to} className="group flex items-center gap-4 rounded-r12 border border-border/25 bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--border)]">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-r8 ${mode.tone}`}><Icon size={22} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] font-black">{mode.name}</span><span className="mt-0.5 block text-[12px] text-muted">{mode.note}</span></span>
                  <ChevronRight size={17} className="text-muted group-hover:text-ink" />
                </Link>;
              })}
            </div>
          </div>

          <div>
            <SectionTitle action={<Link to="/wisdom" className="text-[13px] font-bold text-ink2 hover:text-ink">Open archive</Link>}>Daily wisdom</SectionTitle>
            <Link to="/wisdom" className="block rounded-r16 border border-border/25 bg-green-l p-6 transition-colors hover:bg-green-l/70 sm:p-7">
              <div className="flex items-center gap-2"><BookOpen size={17} /><span className="mono text-[10px] font-bold uppercase">{wisdom.kind} of the day</span></div>
              <Arabic size="lg" className="mt-5 text-left">{wisdom.arabic}</Arabic>
              <p className="mt-3 max-w-2xl text-[16px] font-bold leading-relaxed">“{wisdom.translation}”</p>
              <p className="mono mt-4 text-[10px] font-bold uppercase text-ink2">{wisdom.source}</p>
            </Link>
          </div>
        </div>

        <aside className="space-y-5">
          <Card>
            <SectionTitle>Your progress</SectionTitle>
            <div className="flex items-end justify-between gap-4"><div><p className="text-[28px] font-black">Level {level.level}</p><p className="text-[13px] text-ink2">{level.name}</p></div><Mono className="text-[12px] font-bold text-muted">{Math.round(levelProgress * 100)}%</Mono></div>
            <Bar value={levelProgress} className="mt-4" />
            <p className="mt-4 border-t border-border/15 pt-4 text-[12px] leading-relaxed text-ink2">Next unlock: {level.unlocks}</p>
          </Card>

          <Card tone="field">
            <SectionTitle action={<Link to="/leaderboard" className="text-[12px] font-bold text-ink2">View all</Link>}>Quest leaders</SectionTitle>
            <ol className="space-y-1">
              {[
                { n: "Maryam Diallo", a: "MD", xp: 4100 },
                { n: "Hassan Yusuf", a: "HY", xp: 2380 },
                { n: "Amina Bello", a: "AB", xp: 1420 },
              ].map((friend, index) => <li key={friend.n} className="flex items-center gap-3 rounded-r8 px-2 py-2.5 hover:bg-surface">
                <Mono className="w-5 text-[11px] font-bold text-muted">0{index + 1}</Mono>
                <span className="grid h-9 w-9 place-items-center rounded-rf bg-surface text-[10px] font-black">{friend.a}</span>
                <span className="min-w-0 flex-1 text-[13px] font-bold">{friend.n}</span>
                <Mono className="text-[11px] font-bold text-ink2">{friend.xp}</Mono>
              </li>)}
            </ol>
          </Card>

          <Link to="/ilmbot" className="flex items-center gap-4 rounded-r12 border border-border/25 bg-pink-l p-5 transition-transform hover:-translate-y-0.5">
            <span className="grid h-11 w-11 place-items-center rounded-r8 bg-surface"><Bot size={22} /></span>
            <span className="flex-1"><span className="block text-[15px] font-black">Ask IlmBot</span><span className="block text-[12px] text-ink2">Explore a question with sources</span></span>
            <ChevronRight size={17} />
          </Link>
        </aside>
      </section>

      <StreakModal open={streakOpen} onClose={() => setStreakOpen(false)} />
    </AppShell>
  );
}