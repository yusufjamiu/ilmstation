import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn } from "@/components/kit";
import { TOPICS, type TopicId } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/interests")({
  head: () => ({
    meta: [
      { title: "Choose your interests — IlmStation" },
      { name: "description", content: "Pick the Islamic topics that seed your Quest Map and Daily Quest." },
      { property: "og:title", content: "Choose your interests — IlmStation" },
      { property: "og:description", content: "Eight topics: Aqeedah to Dua." },
    ],
  }),
  component: InterestsScreen,
});

/** S16 Interests */
function InterestsScreen() {
  const { s, set } = useApp();
  const navigate = useNavigate();

  const toggle = (id: TopicId) =>
    set({
      interests: s.interests.includes(id)
        ? s.interests.filter((i) => i !== id)
        : [...s.interests, id],
    });

  return (
    <OnboardShell
      step={6}
      total={7}
      back="/onboarding/zone"
      title="What do you want to learn?"
      subtitle="Pick at least one. This seeds your Quest Map and your Daily Quest."
      wide
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TOPICS.map((t) => {
          const active = s.interests.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              aria-pressed={active}
              className={`brutal press rounded-r16 p-4 text-left ${active ? "bg-yellow" : "bg-surface"}`}
            >
              <div className="text-[32px]" aria-hidden>
                {t.icon}
              </div>
              <div className="mt-1.5 text-[15px] font-black">{t.name}</div>
              <p className="arabic text-[18px]" lang="ar" dir="rtl">
                {t.arabic}
              </p>
              {active ? <div className="mt-1 text-[11px] font-black uppercase">✓ Added</div> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="mono text-[13px] font-bold text-ink2">
          {s.interests.length} selected
        </span>
        <Btn
          size="lg"
          full
          disabled={s.interests.length === 0}
          onClick={() => navigate({ to: "/onboarding/assessment" })}
        >
          Continue →
        </Btn>
      </div>
    </OnboardShell>
  );
}
