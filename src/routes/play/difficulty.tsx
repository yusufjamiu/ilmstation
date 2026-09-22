import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Btn, Card, Mono, Pill, Segmented } from "@/components/kit";
import { topicById } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/play/difficulty")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { topic: string; count?: number } => ({
    topic: String(search.topic ?? "aqeedah"),
    count: search.count ? Number(search.count) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Choose difficulty — IlmStation" },
      { name: "description", content: "Beginner, Intermediate or Advanced — each tier multiplies the XP you earn." },
      { property: "og:title", content: "Choose difficulty — IlmStation" },
      { property: "og:description", content: "1×, 1.5× or 2× XP." },
    ],
  }),
  component: DifficultyPicker,
});

const TIERS = [
  {
    id: "beginner" as const,
    name: "Beginner",
    arabic: "مُبْتَدِئ",
    mult: "1×",
    note: "Definitions and basic recall. 25 seconds per question.",
  },
  {
    id: "intermediate" as const,
    name: "Intermediate",
    arabic: "مُتَوَسِّط",
    mult: "1.5×",
    note: "Contextual application. 20 seconds per question.",
  },
  {
    id: "advanced" as const,
    name: "Advanced",
    arabic: "مُتَقَدِّم",
    mult: "2×",
    note: "Synthesis and scholarly nuance. 15 seconds per question.",
  },
];

/** P03 Difficulty */
function DifficultyPicker() {
  const { topic, count } = Route.useSearch();
  const { s, set } = useApp();
  const navigate = useNavigate();
  const t = topicById(topic);
  const [tier, setTier] = useState(s.difficulty);
  const [len, setLen] = useState<number>(count ?? 10);

  return (
    <AppShell back={{ to: "/play/topics", label: "Topics" }} title="Set your difficulty">
      <Card tone="field" className="flex items-center gap-3">
        <span className="text-[36px]" aria-hidden>
          {t.icon}
        </span>
        <div>
          <div className="text-[20px] font-black">{t.name}</div>
          <Arabic size="md">{t.arabic}</Arabic>
        </div>
        <Mono className="ml-auto text-[13px] font-bold text-ink2">{t.questions} in pool</Mono>
      </Card>

      <div className="mt-4 grid gap-3">
        {TIERS.map((tr) => {
          const active = tier === tr.id;
          return (
            <button key={tr.id} onClick={() => setTier(tr.id)} aria-pressed={active}>
              <Card tone={active ? "yellow" : "surface"} className="press flex items-center gap-4 text-left">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[20px] font-black">{tr.name}</span>
                    <Arabic size="sm" className="text-ink2">
                      {tr.arabic}
                    </Arabic>
                  </div>
                  <p className="mt-1 text-[13px] font-semibold text-ink2">{tr.note}</p>
                </div>
                <Pill tone={active ? "ink" : "green"}>{tr.mult} XP</Pill>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
          Question count
        </p>
        <Segmented
          value={String(len)}
          onChange={(v) => setLen(Number(v))}
          options={[
            { value: "5", label: "5 questions" },
            { value: "10", label: "10 questions" },
            { value: "15", label: "15 questions" },
          ]}
        />
      </div>

      <Btn
        size="lg"
        full
        className="mt-5"
        onClick={() => {
          set({ difficulty: tier });
          navigate({
            to: "/play/lobby",
            search: { topic, count: len, difficulty: tier },
          });
        }}
      >
        Continue →
      </Btn>
    </AppShell>
  );
}
