import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn } from "@/components/kit";

export const Route = createFileRoute("/onboarding/carousel")({
  head: () => ({
    meta: [
      { title: "Learn, Play, Grow — IlmStation" },
      { name: "description", content: "Three reasons IlmStation makes Islamic learning a daily habit." },
      { property: "og:title", content: "Learn, Play, Grow — IlmStation" },
      { property: "og:description", content: "Curriculum-grade Islamic content wrapped in game mechanics." },
    ],
  }),
  component: ValueCarousel,
});

const SLIDES = [
  {
    icon: "📖",
    kicker: "Learn",
    arabic: "اِقْرَأْ",
    title: "Deen with real depth",
    body: "Eight Islamic topics, taught in structured quest chains — from Aqeedah to Tafsir, with every answer explained and sourced.",
    tone: "bg-yellow",
  },
  {
    icon: "🎯",
    kicker: "Play",
    arabic: "تَحَدَّ",
    title: "Turn study into a sport",
    body: "Daily quests, XP, badges, head-to-head duels with friends and a Halaqah room for the whole family.",
    tone: "bg-green-l",
  },
  {
    icon: "🌱",
    kicker: "Grow",
    arabic: "اِنْمُ",
    title: "Consistency you can see",
    body: "Streaks, levels from Beginner to Alim, and points you can convert into real Sadaqah.",
    tone: "bg-pink-l",
  },
];

/** S03 Value Carousel */
function ValueCarousel() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <OnboardShell step={2} total={7} back="/onboarding/language">
      <div className={`brutal-lg anim-pop rounded-r24 p-7 ${slide.tone}`} key={i}>
        <div className="text-[64px]" aria-hidden>
          {slide.icon}
        </div>
        <p className="mono mt-2 text-[11px] font-bold  uppercase">{slide.kicker}</p>
        <p className="arabic mt-1 text-[32px]" lang="ar" dir="rtl">
          {slide.arabic}
        </p>
        <h2 className="mt-3 text-[28px] leading-tight font-black">{slide.title}</h2>
        <p className="mt-2 text-[15px] font-semibold">{slide.body}</p>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {SLIDES.map((_, n) => (
          <button
            key={n}
            onClick={() => setI(n)}
            aria-label={`Slide ${n + 1}`}
            className={`brutal-flat h-3 rounded-rf transition-all ${
              n === i ? "w-8 bg-ink" : "w-3 bg-field"
            }`}
          />
        ))}
        <span className="mono ml-auto text-[11px] font-bold text-ink2">
          {i + 1} / {SLIDES.length}
        </span>
      </div>

      <div className="mt-5 flex gap-2">
        <Btn
          variant="outline"
          onClick={() => (i === 0 ? navigate({ to: "/onboarding/gateway" }) : setI(i - 1))}
        >
          {i === 0 ? "Skip" : "← Back"}
        </Btn>
        <Btn
          size="lg"
          full
          onClick={() => (last ? navigate({ to: "/onboarding/gateway" }) : setI(i + 1))}
        >
          {last ? "Get started →" : "Next →"}
        </Btn>
      </div>
    </OnboardShell>
  );
}
