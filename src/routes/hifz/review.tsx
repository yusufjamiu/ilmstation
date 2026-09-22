import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Card, Empty, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { SURAHS, versesFor } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/hifz/review")({
  head: () => ({
    meta: [
      { title: "Hifz review queue — IlmStation" },
      { name: "description", content: "Verses due for review, ordered by the spaced repetition algorithm." },
      { property: "og:title", content: "Hifz review queue — IlmStation" },
      { property: "og:description", content: "Review beats re-memorising." },
    ],
  }),
  component: SessionReview,
});

type View = "visible" | "gapped" | "ghost" | "hidden";

/** P20 Session Review */
function SessionReview() {
  const { s, set, award } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("gapped");

  const queue = s.hifzPractice.length
    ? s.hifzPractice
    : ["112:1", "112:3", "1:5"]; // seeded demo queue

  const cardFor = (key: string) => {
    const [su, vn] = key.split(":").map(Number);
    const verse = versesFor(su).find((v) => v.n === vn);
    const surah = SURAHS.find((x) => x.num === su);
    return { verse, surah };
  };

  const clear = (key: string) => {
    set({
      hifzPractice: s.hifzPractice.filter((x) => x !== key),
      hifzStrong: Array.from(new Set([...s.hifzStrong, key])),
    });
  };

  const finish = () => {
    award(30, "noor", "Hifz review session");
    set({ hifzSessions: s.hifzSessions + 1 });
    navigate({ to: "/hifz/complete", search: { surah: 112, reviewed: queue.length, strong: 1 } });
  };

  return (
    <AppShell
      back={{ to: "/hifz", label: "Hifz Mode" }}
      title="Review queue"
      subtitle="Ordered by spaced repetition — weakest verses first."
    >
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: "visible", label: "Visible" },
          { value: "gapped", label: "Gapped" },
          { value: "ghost", label: "Ghost" },
          { value: "hidden", label: "Hidden" },
        ]}
      />

      {queue.length === 0 ? (
        <div className="mt-4">
          <Empty
            icon="🌿"
            title="Queue is clear"
            body="Nothing due for review. Start a new Hifz session to add verses."
            action={
              <Btn onClick={() => navigate({ to: "/hifz" })}>Choose a Surah</Btn>
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {queue.map((key, idx) => {
            const { verse, surah } = cardFor(key);
            if (!verse || !surah) return null;
            return (
              <Card key={key} className="rounded-r16">
                <div className="flex items-center justify-between">
                  <Pill tone="ink">
                    {surah.name} {key}
                  </Pill>
                  <Pill tone={idx === 0 ? "pink" : "field"}>
                    {idx === 0 ? "Due now" : `Due in ${idx}d`}
                  </Pill>
                </div>
                <p
                  lang="ar"
                  dir="rtl"
                  className={`arabic mt-3 text-center text-[26px] ${
                    view === "ghost" ? "opacity-25" : ""
                  }`}
                >
                  {view === "hidden"
                    ? "• • • • •"
                    : view === "gapped"
                      ? verse.arabic
                          .split(" ")
                          .map((w, i) => (i % 3 === 1 ? "____" : w))
                          .join(" ")
                      : verse.arabic}
                </p>
                <p className="mt-2 text-center text-[13px] font-semibold text-ink2">
                  {verse.translation}
                </p>
                <div className="mt-3 flex gap-2">
                  <Btn variant="green" size="sm" full onClick={() => clear(key)}>
                    Got it ✓
                  </Btn>
                  <Btn variant="outline" size="sm" full onClick={() => setView("visible")}>
                    Show fully
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card tone="field" className="mt-5">
        <SectionTitle>Session summary</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Pill tone="surface">
            <Mono>{queue.length}</Mono> due
          </Pill>
          <Pill tone="green">
            <Mono>{s.hifzStrong.length}</Mono> strong
          </Pill>
        </div>
        <Btn size="lg" full className="mt-3" onClick={finish}>
          Finish review · +30 XP
        </Btn>
      </Card>
    </AppShell>
  );
}
