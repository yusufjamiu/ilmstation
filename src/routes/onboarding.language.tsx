import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn } from "@/components/kit";
import { LANGUAGES } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/language")({
  head: () => ({
    meta: [
      { title: "Choose your language — IlmStation" },
      { name: "description", content: "Pick from English, Arabic, Urdu, Bahasa Melayu, French or Hausa." },
      { property: "og:title", content: "Choose your language — IlmStation" },
      { property: "og:description", content: "IlmStation speaks six languages at launch." },
    ],
  }),
  component: LanguageSelect,
});

/** S02 Language Select */
function LanguageSelect() {
  const { s, set } = useApp();
  const navigate = useNavigate();

  return (
    <OnboardShell
      step={1}
      total={7}
      back="/"
      title="Choose your language"
      subtitle="You can change this anytime in Settings."
    >
      <div className="grid gap-2">
        {LANGUAGES.map((l) => {
          const active = s.language === l.code;
          return (
            <button
              key={l.code}
              onClick={() => set({ language: l.code })}
              className={`brutal press flex min-h-11 items-center gap-3 rounded-r12 px-4 py-3 text-left ${
                active ? "bg-yellow" : "bg-surface"
              }`}
              aria-pressed={active}
            >
              <span className="text-[24px]" aria-hidden>
                {l.flag}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-black">{l.label}</span>
                <span className="block text-[13px] text-ink2">{l.native}</span>
              </span>
              {active ? <span aria-hidden>✓</span> : null}
            </button>
          );
        })}
      </div>

      <Btn full size="lg" className="mt-5" onClick={() => navigate({ to: "/onboarding/carousel" })}>
        Continue →
      </Btn>
    </OnboardShell>
  );
}
