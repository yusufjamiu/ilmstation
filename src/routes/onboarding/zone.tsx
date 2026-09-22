import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn } from "@/components/kit";
import { ZONES } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/zone")({
  head: () => ({
    meta: [
      { title: "Pick your zone — IlmStation" },
      { name: "description", content: "Your age zone sets your content difficulty and the tone of the app." },
      { property: "og:title", content: "Pick your zone — IlmStation" },
      { property: "og:description", content: "Three zones: 13–17, 18–25, 26–35." },
    ],
  }),
  component: ZoneScreen,
});

/** S15 Zone Select */
function ZoneScreen() {
  const { s, set } = useApp();
  const navigate = useNavigate();

  return (
    <OnboardShell
      step={5}
      total={7}
      back="/onboarding/verify"
      title="Which one is you?"
      subtitle="This sets your content difficulty baseline and how we talk to you."
      wide
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {ZONES.map((z) => {
          const active = s.zone === z.id;
          return (
            <button
              key={z.id}
              onClick={() => set({ zone: z.id })}
              aria-pressed={active}
              className={`brutal press rounded-r20 p-5 text-left ${active ? "bg-yellow" : "bg-surface"}`}
            >
              <div className="text-[40px]" aria-hidden>
                {z.icon}
              </div>
              <div className="mono mt-2 text-[20px] font-bold">{z.range}</div>
              <div className="mt-1 text-[15px] font-black">{z.label}</div>
              <p className="mt-1.5 text-[13px] font-semibold text-ink2">{z.blurb}</p>
              {active ? <div className="mt-3 text-[13px] font-black">✓ Selected</div> : null}
            </button>
          );
        })}
      </div>

      <Btn
        size="lg"
        full
        className="mt-5"
        onClick={() => navigate({ to: "/onboarding/interests" })}
      >
        Continue →
      </Btn>
    </OnboardShell>
  );
}
