import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Arabic, Btn, Pill } from "@/components/kit";
import { ASSESSMENT } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/assessment")({
  head: () => ({
    meta: [
      { title: "Quick assessment — IlmStation" },
      { name: "description", content: "Three questions to calibrate your starting difficulty." },
      { property: "og:title", content: "Quick assessment — IlmStation" },
      { property: "og:description", content: "Three questions, no pressure." },
    ],
  }),
  component: AssessmentScreen,
});

/** S17 Assessment */
function AssessmentScreen() {
  const { set } = useApp();
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  const q = ASSESSMENT[i];
  const last = i === ASSESSMENT.length - 1;

  const next = () => {
    if (picked === null) return;
    const got = picked === q.answer ? 1 : 0;
    const score = correct + got;
    if (last) {
      const difficulty = score >= 3 ? "advanced" : score >= 2 ? "intermediate" : "beginner";
      set({ difficulty });
      navigate({ to: "/onboarding/welcome" });
      return;
    }
    setCorrect(score);
    setPicked(null);
    setI(i + 1);
  };

  return (
    <OnboardShell
      step={7}
      total={7}
      back="/onboarding/interests"
      title="Three quick questions"
      subtitle="No pressure — this only calibrates where you start."
    >
      <div className="mb-3 flex items-center gap-2">
        <Pill tone="ink">
          Q {i + 1} of {ASSESSMENT.length}
        </Pill>
        <div className="brutal-flat h-3 flex-1 overflow-hidden rounded-rf bg-field">
          <div
            className="h-full bg-green transition-[width] duration-300"
            style={{ width: `${((i + (picked !== null ? 1 : 0)) / ASSESSMENT.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="brutal rounded-r16 bg-surface p-5">
        {q.arabic ? <Arabic size="lg">{q.arabic}</Arabic> : null}
        <h2 className="mt-1 text-[20px] leading-snug font-black">{q.prompt}</h2>
      </div>

      <div className="mt-3 grid gap-2">
        {q.options.map((o, n) => (
          <button
            key={o}
            onClick={() => setPicked(n)}
            aria-pressed={picked === n}
            className={`brutal press min-h-11 rounded-r16 px-4 py-3 text-left text-[15px] font-bold ${
              picked === n ? "bg-yellow" : "bg-surface"
            }`}
          >
            <span className="mono mr-2 font-bold">{String.fromCharCode(65 + n)}</span>
            {o}
          </button>
        ))}
      </div>

      <Btn size="lg" full className="mt-5" disabled={picked === null} onClick={next}>
        {last ? "Finish assessment →" : "Next question →"}
      </Btn>
    </OnboardShell>
  );
}
