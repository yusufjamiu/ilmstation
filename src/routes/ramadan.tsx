import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Bar, Btn, BtnLink, Card, Mono, Pill, SectionTitle, Stat, Toggle } from "@/components/kit";
import { RAMADAN_QUESTS } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ramadan")({
  head: () => ({
    meta: [
      { title: "Ramadan Mode — 30 daily quests — IlmStation" },
      { name: "description", content: "A themed quest for each day of Ramadan, a Tarawih tracker and a Laylatul Qadr countdown." },
      { property: "og:title", content: "Ramadan Mode — IlmStation" },
      { property: "og:description", content: "Thirty days, thirty themed quests." },
    ],
  }),
  component: Ramadan,
});

/** R01 Ramadan Mode */
function Ramadan() {
  const { s, set, award } = useApp();
  const navigate = useNavigate();
  const [nightMode, setNightMode] = useState(s.dark);
  const today = Math.min(30, s.ramadanDays.length + 1);

  const done = (day: number) => s.ramadanDays.includes(day);
  const tarawihDone = (day: number) => s.tarawih.includes(day);

  const startDay = (day: number) => {
    const quest = RAMADAN_QUESTS.find((q) => q.day === day) ?? RAMADAN_QUESTS[0];
    if (!done(day)) {
      set({ ramadanDays: [...s.ramadanDays, day] });
      award(quest.xp, "ajr", `Ramadan Day ${day} — ${quest.theme}`);
    }
    navigate({
      to: "/play/lobby",
      search: { topic: "dua", count: 8, difficulty: "intermediate" },
    });
  };

  const toggleTarawih = (day: number) => {
    set({
      tarawih: tarawihDone(day) ? s.tarawih.filter((d) => d !== day) : [...s.tarawih, day],
    });
  };

  return (
    <AppShell title="Ramadan Mode" subtitle="Special quests, Tarawih tracking and night-friendly reading." wide>
      <Card tone="ink" className="rounded-r24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mono text-[11px] font-bold tracking-widest uppercase opacity-70">
              Ramadan · Day {today} of 30
            </p>
            <h2 className="text-[28px] leading-tight font-black">
              🌙 {RAMADAN_QUESTS.find((q) => q.day === Math.min(today, 7))?.name}
            </h2>
            <p className="mt-1 text-[15px] font-bold opacity-90">
              Laylatul Qadr window opens in {Math.max(0, 21 - today)} days — the last ten nights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-black uppercase">Night mode</span>
            <Toggle
              on={nightMode}
              onChange={(v) => {
                setNightMode(v);
                set({ dark: v });
              }}
              label="Night mode"
            />
          </div>
        </div>
        <div className="mt-4">
          <Bar value={s.ramadanDays.length / 30} tone="green" label="Ramadan quests complete" />
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Days completed" value={`${s.ramadanDays.length}/30`} tone="green" icon="✅" />
        <Stat label="Tarawih nights" value={s.tarawih.length} icon="🕌" />
        <Stat label="Streak" value={`${s.streak} days`} icon="🔥" />
        <Stat label="Sadaqah points" value={s.donated} icon="🤲" />
      </div>

      <Card className="mt-4">
        <SectionTitle>Daily quests</SectionTitle>
        <div className="space-y-3">
          {RAMADAN_QUESTS.map((q) => {
            const complete = done(q.day);
            const locked = q.day > today;
            return (
              <div
                key={q.day}
                className={cn(
                  "brutal-sm flex flex-wrap items-center gap-3 rounded-r12 px-3 py-3",
                  complete ? "bg-green-l" : locked ? "bg-field opacity-70" : "bg-surface",
                )}
              >
                <span className="brutal-sm mono grid h-10 w-10 shrink-0 place-items-center rounded-rf bg-yellow text-[15px] font-bold">
                  {q.day}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-tight font-black">{q.name}</p>
                  <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                    {q.theme} · +{q.xp} XP
                  </Mono>
                </div>
                {complete ? (
                  <Pill tone="green">Done ✓</Pill>
                ) : locked ? (
                  <Pill tone="field">Opens day {q.day}</Pill>
                ) : (
                  <Btn size="sm" onClick={() => startDay(q.day)}>
                    Start
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
        <p className="mono mt-3 text-[11px] font-bold tracking-widest text-ink2 uppercase">
          Days 8–30 unlock one per day through the month.
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle>Tarawih tracker</SectionTitle>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              onClick={() => toggleTarawih(day)}
              aria-pressed={tarawihDone(day)}
              aria-label={`Tarawih night ${day}`}
              className={cn(
                "brutal-sm press-sm mono grid aspect-square place-items-center rounded-r8 text-[13px] font-bold",
                tarawihDone(day) ? "bg-green text-surface" : "bg-field",
                day > 20 && !tarawihDone(day) ? "bg-pink-l" : "",
              )}
            >
              {tarawihDone(day) ? "✓" : day}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[13px] font-semibold text-ink2">
          Rose squares mark the last ten nights — the window in which Laylatul Qadr falls.
        </p>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Btn size="lg" full onClick={() => startDay(today)}>
          Start today's Ramadan quest →
        </Btn>
        <BtnLink to="/store" search={{ item: "sadaqah" }} variant="outline" size="lg" full>
          🤲 Give Sadaqah
        </BtnLink>
        <BtnLink to="/wisdom" variant="outline" size="lg" full>
          ☪️ Daily Wisdom
        </BtnLink>
      </div>
    </AppShell>
  );
}
