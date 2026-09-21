import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Confetti, Mono, Pill, Stat } from "@/components/kit";
import { BadgeUnlock } from "@/components/BadgeUnlock";
import { BADGES, SURAHS } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/hifz/complete")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { surah: number; reviewed?: number; strong?: number } => ({
    surah: Number(search.surah ?? 112),
    reviewed: Number(search.reviewed ?? 0),
    strong: Number(search.strong ?? 0),
  }),
  head: () => ({
    meta: [
      { title: "Hifz session complete — IlmStation" },
      { name: "description", content: "Verses reviewed, retention rate, streak maintained and XP awarded." },
      { property: "og:title", content: "Hifz session complete — IlmStation" },
      { property: "og:description", content: "+30 XP and your streak stays alive." },
    ],
  }),
  component: HifzComplete,
});

/** P21 Hifz Complete */
function HifzComplete() {
  const { surah, reviewed } = Route.useSearch();
  const { s, set, award, unlock } = useApp();
  const meta = SURAHS.find((x) => x.num === surah) ?? SURAHS[7];
  const [applied, setApplied] = useState(false);
  const [badge, setBadge] = useState<string | null>(null);

  const retention = s.hifzStrong.length
    ? Math.round((s.hifzStrong.length / (s.hifzStrong.length + s.hifzPractice.length)) * 100)
    : 100;
  const xp = 30 + (retention === 100 ? 10 : 0);

  useEffect(() => {
    if (applied) return;
    setApplied(true);
    award(xp, "noor", `Hifz session — ${meta.name}`);
    set({ hifzSessions: s.hifzSessions + 1 });
    if (s.hifzSessions + 1 >= 7 && unlock("garden")) setBadge("garden");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  return (
    <AppShell title="Session complete">
      <Confetti count={18} />
      <Card tone="green" className="rounded-r24 text-center">
        <div className="text-[56px]" aria-hidden>
          🌿
        </div>
        <h2 className="mt-1 text-[28px] font-black">
          {meta.name} · {meta.arabic}
        </h2>
        <p className="mt-1 text-[15px] font-bold">
          Small and consistent beats large and rare. Your streak is safe today.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill tone="ink">+{xp} XP · Noor</Pill>
          <Pill tone="surface">🔥 {s.streak} day streak</Pill>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Verses reviewed" value={reviewed} icon="📖" />
        <Stat label="Retention" value={`${retention}%`} tone="green" />
        <Stat label="Strong verses" value={s.hifzStrong.length} tone="yellow" />
        <Stat label="In queue" value={s.hifzPractice.length} />
      </div>

      <Card className="mt-4">
        <p className="mono text-[11px] font-bold tracking-widest text-ink2 uppercase">
          Next review
        </p>
        <p className="mt-1 text-[15px] font-semibold">
          {s.hifzPractice.length
            ? `${s.hifzPractice.length} verse(s) return tomorrow in your review queue.`
            : "Nothing due tomorrow — pick a new Surah when you're ready."}
        </p>
        <Mono className="mt-2 block text-[13px] font-bold text-ink2">
          Sessions completed: {s.hifzSessions}
        </Mono>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <BtnLink to="/hifz/session" search={{ surah }} size="lg" full>
          Continue {meta.name}
        </BtnLink>
        <BtnLink to="/hifz/review" variant="outline" size="lg" full>
          Review queue
        </BtnLink>
        <BtnLink to="/home" variant="outline" size="lg">
          Home
        </BtnLink>
      </div>

      <BadgeUnlock
        badge={badge ? (BADGES.find((b) => b.id === badge) ?? null) : null}
        onClose={() => setBadge(null)}
      />
    </AppShell>
  );
}
