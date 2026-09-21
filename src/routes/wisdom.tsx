import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { WISDOM } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wisdom")({
  head: () => ({
    meta: [
      { title: "Daily Wisdom — a sourced Hadith or Ayah each day — IlmStation" },
      { name: "description", content: "Today's Hadith or Ayah with Arabic, transliteration, translation and reference, plus the full archive." },
      { property: "og:title", content: "Daily Wisdom — IlmStation" },
      { property: "og:description", content: "One verse or narration a day, always cited." },
    ],
  }),
  component: DailyWisdom,
});

/** L04 Daily Wisdom · L04b Wisdom Archive */
function DailyWisdom() {
  const { s, award, toggleBookmark } = useApp();
  const [view, setView] = useState<"today" | "archive">("today");
  const [claimed, setClaimed] = useState(false);
  const today = WISDOM[0];
  const saved = (id: number) => s.bookmarks.includes(`wisdom-${id}`);

  const claim = () => {
    if (claimed) return;
    setClaimed(true);
    award(15, "hikmah", "Daily Wisdom reflection");
  };

  return (
    <AppShell title="Daily Wisdom" subtitle="Arabic, transliteration, translation — and the reference.">
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: "today", label: "Today" },
          { value: "archive", label: `Archive (${WISDOM.length})` },
        ]}
      />

      {view === "today" ? (
        <>
          <Card tone="yellow" className="mt-4 rounded-r24">
            <div className="flex items-center justify-between">
              <Pill tone="ink">{today.kind}</Pill>
              <Mono className="text-[11px] font-bold tracking-widest uppercase">
                #{today.id} · {today.date}
              </Mono>
            </div>
            <p lang="ar" dir="rtl" className="arabic mt-4 text-center text-[28px] leading-[2]">
              {today.arabic}
            </p>
            <p className="mono mt-3 text-center text-[13px] font-bold text-ink2">{today.translit}</p>
            <p className="mt-3 text-center text-[18px] leading-relaxed font-bold">
              “{today.translation}”
            </p>
            <p className="mono mt-4 border-t border-border/20 pt-3 text-center text-[11px] font-bold tracking-widest uppercase">
              📖 {today.source}
            </p>
          </Card>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Btn variant={claimed ? "green" : "primary"} size="lg" full onClick={claim}>
              {claimed ? "✓ Reflected · +15 Hikmah" : "I reflected on this · +15"}
            </Btn>
            <Btn
              variant="outline"
              size="lg"
              full
              onClick={() => toggleBookmark(`wisdom-${today.id}`)}
            >
              {saved(today.id) ? "🔖 Saved" : "🔖 Save"}
            </Btn>
            <BtnLink to="/share" search={{ kind: "wisdom" }} variant="outline" size="lg" full>
              📤 Share
            </BtnLink>
          </div>

          <Card className="mt-4">
            <SectionTitle>Why this matters</SectionTitle>
            <p className="text-[15px] font-semibold text-ink2">
              Daily Wisdom is deliberately short. One narration, understood and acted on, is worth
              more than a hundred skimmed. Reflect, then take one small action today.
            </p>
          </Card>
        </>
      ) : (
        <div className="mt-4 space-y-3">
          {WISDOM.map((w) => (
            <Card key={w.id} className={cn("rounded-r16", w.id === today.id && "bg-yellow")}>
              <div className="flex items-center justify-between">
                <Pill tone={w.kind === "Ayah" ? "green" : "field"}>{w.kind}</Pill>
                <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                  {w.date}
                </Mono>
              </div>
              <p lang="ar" dir="rtl" className="arabic mt-2 text-right text-[22px] leading-loose">
                {w.arabic}
              </p>
              <p className="mt-2 text-[15px] font-bold">“{w.translation}”</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                  📖 {w.source}
                </Mono>
                <Btn variant="outline" size="sm" onClick={() => toggleBookmark(`wisdom-${w.id}`)}>
                  {saved(w.id) ? "🔖 Saved" : "Save"}
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
