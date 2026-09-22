import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Btn, Card, Input, Modal, Mono, Pill, Ring, SectionTitle, Segmented } from "@/components/kit";
import { SURAHS } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/hifz/")({
  head: () => ({
    meta: [
      { title: "Hifz Mode — choose a Surah — IlmStation" },
      { name: "description", content: "Memorise Quran with four view modes, Tajweed colouring and spaced repetition." },
      { property: "og:title", content: "Hifz Mode — IlmStation" },
      { property: "og:description", content: "Listen, read, recite, test." },
    ],
  }),
  component: SelectSurah,
});

/** P18 Select Surah */
function SelectSurah() {
  const { s } = useApp();
  const navigate = useNavigate();
  const [juz, setJuz] = useState<"all" | "30" | "1">("all");
  const [query, setQuery] = useState("");
  const [locked, setLocked] = useState<string | null>(null);

  const list = SURAHS.filter(
    (su) =>
      (juz === "all" || String(su.juz) === juz) &&
      (su.name.toLowerCase().includes(query.toLowerCase()) || su.arabic.includes(query)),
  );

  const progressFor = (num: number) => {
    const verses = s.hifzStrong.filter((v) => v.startsWith(`${num}:`)).length;
    const surah = SURAHS.find((x) => x.num === num)!;
    return Math.min(1, verses / Math.min(surah.verses, 7));
  };

  return (
    <AppShell title="Hifz Mode" subtitle="Memorise with spaced repetition — four view modes." wide>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Surah in English or Arabic…"
          aria-label="Search Surahs"
        />
        <Segmented
          value={juz}
          onChange={setJuz}
          options={[
            { value: "all", label: "All Juz" },
            { value: "30", label: "Juz 30" },
            { value: "1", label: "Juz 1" },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((su) => {
          const isLocked = su.premium && !s.premium;
          return (
            <button
              key={su.num}
              onClick={() =>
                isLocked
                  ? setLocked(su.name)
                  : navigate({ to: "/hifz/session", search: { surah: su.num } })
              }
              className="text-left"
            >
              <Card tone={isLocked ? "field" : "surface"} className="press flex items-center gap-3">
                <Ring value={progressFor(su.num)} label={`${su.name} progress`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mono className="text-[11px] font-bold text-ink2">{su.num}</Mono>
                    <span className="text-[18px] font-black">{su.name}</span>
                  </div>
                  <Arabic size="md">{su.arabic}</Arabic>
                  <Mono className="text-[11px] font-bold text-ink2 uppercase">
                    {su.verses} verses · Juz {su.juz}
                  </Mono>
                </div>
                {isLocked ? <Pill tone="ink">🔒</Pill> : null}
              </Card>
            </button>
          );
        })}
      </div>

      <Card className="mt-5">
        <SectionTitle>Your Hifz stats</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Pill tone="green">
            <Mono>{s.hifzSessions}</Mono> sessions
          </Pill>
          <Pill tone="yellow">
            <Mono>{s.hifzStrong.length}</Mono> verses strong
          </Pill>
          <Pill>
            <Mono>{s.hifzPractice.length}</Mono> in review queue
          </Pill>
        </div>
        <Btn
          variant="outline"
          className="mt-3"
          onClick={() => navigate({ to: "/hifz/review" })}
        >
          🔁 Open review queue
        </Btn>
      </Card>

      <Modal open={!!locked} onClose={() => setLocked(null)} title="Premium Surah">
        <p className="text-[15px] font-semibold text-ink2">
          The full Quran is a Premium feature. {locked} is outside the free starter set (Juz Amma).
        </p>
        <Btn full className="mt-4" onClick={() => navigate({ to: "/store" })}>
          See Premium options
        </Btn>
      </Modal>
    </AppShell>
  );
}
