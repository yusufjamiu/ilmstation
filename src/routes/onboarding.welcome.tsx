import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Arabic, Btn, Confetti, Mono, Pill } from "@/components/kit";
import { TOPICS } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to IlmStation — +50 XP" },
      { name: "description", content: "Your welcome bonus is here. Begin your first quest." },
      { property: "og:title", content: "Welcome to IlmStation — +50 XP" },
      { property: "og:description", content: "Assalamu Alaykum. Your first quest is ready." },
    ],
  }),
  component: WelcomeScreen,
});

/** S18 Welcome */
function WelcomeScreen() {
  const { s, finishOnboarding } = useApp();
  const navigate = useNavigate();
  const [claimed, setClaimed] = useState(false);
  const first = (s.name || "Seeker").split(" ")[0];

  useEffect(() => {
    if (!claimed) return;
    const t = setTimeout(() => {
      finishOnboarding();
    }, 400);
    return () => clearTimeout(t);
  }, [claimed, finishOnboarding]);

  return (
    <OnboardShell>
      {claimed ? <Confetti /> : null}
      <div className="brutal-lg anim-pop rounded-r24 bg-yellow p-7 text-center">
        <Arabic size="xl" className="text-center">
          السَّلَامُ عَلَيْكُمْ
        </Arabic>
        <h1 className="mt-2 text-[32px] leading-tight font-black">
          Assalamu Alaykum, {first}!
        </h1>
        <p className="mt-2 text-[15px] font-bold">
          Your quest begins now. Here&apos;s a gift to start you off.
        </p>
        <div className="brutal mt-5 inline-flex items-center gap-2 rounded-rf bg-surface px-5 py-3">
          <span className="text-[24px]" aria-hidden>
            ✨
          </span>
          <Mono className="text-[24px] font-bold">+50 XP</Mono>
        </div>
      </div>

      <div className="brutal mt-4 rounded-r16 bg-surface p-4">
        <p className="mono text-[11px] font-bold tracking-widest text-ink2 uppercase">
          Your starting setup
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill tone="green">Difficulty: {s.difficulty}</Pill>
          <Pill>Zone: {s.zone.replace("zone", "Zone ")}</Pill>
          {s.interests.map((id) => (
            <Pill key={id} tone="yellow">
              {TOPICS.find((t) => t.id === id)?.name}
            </Pill>
          ))}
        </div>
      </div>

      {claimed ? (
        <Btn size="lg" full className="mt-5" onClick={() => navigate({ to: "/quests" })}>
          Begin your first quest →
        </Btn>
      ) : (
        <Btn size="lg" full className="mt-5" onClick={() => setClaimed(true)}>
          Claim +50 XP
        </Btn>
      )}
      <Btn variant="outline" full className="mt-2" onClick={() => {
        finishOnboarding();
        navigate({ to: "/home" });
      }}>
        Take me to Home
      </Btn>
    </OnboardShell>
  );
}
