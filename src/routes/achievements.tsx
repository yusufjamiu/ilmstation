import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Bar, Btn, BtnLink, Card, Modal, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { BADGES, type Badge } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — eight Islamic badges — IlmStation" },
      { name: "description", content: "Track every badge, its Arabic name, unlock condition and how close you are." },
      { property: "og:title", content: "Achievements — IlmStation" },
      { property: "og:description", content: "Badges with meaning, not just points." },
    ],
  }),
  component: Achievements,
});

/** Q05 Achievements */
function Achievements() {
  const { s } = useApp();
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");
  const [open, setOpen] = useState<Badge | null>(null);

  const earned = (b: Badge) => s.badges.includes(b.id);
  const list = BADGES.filter((b) =>
    filter === "all" ? true : filter === "earned" ? earned(b) : !earned(b),
  );
  const count = BADGES.filter(earned).length;

  return (
    <AppShell title="Achievements" subtitle="Eight badges, each tied to real practice." wide>
      <Card tone="yellow" className="mb-5 rounded-r20">
        <SectionTitle
          action={
            <Mono className="text-[13px] font-bold">
              {count}/{BADGES.length}
            </Mono>
          }
        >
          Badge collection
        </SectionTitle>
        <Bar value={count / BADGES.length} tone="green" label="Badges earned" />
        <div className="mt-3">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "earned", label: "Earned" },
              { value: "locked", label: "Locked" },
            ]}
          />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((b) => {
          const got = earned(b);
          return (
            <button key={b.id} onClick={() => setOpen(b)} className="text-left">
              <Card
                tone={got ? "yellow" : "field"}
                className={cn("press h-full rounded-r16 text-center", !got && "opacity-80")}
              >
                <div className={cn("text-[40px]", !got && "grayscale")} aria-hidden>
                  {b.icon}
                </div>
                <h3 className="mt-1 text-[15px] leading-tight font-black">{b.name}</h3>
                <Arabic size="sm" className="text-ink2">
                  {b.arabic}
                </Arabic>
                <div className="mt-2">
                  <Bar
                    value={got ? 1 : b.progress}
                    tone={got ? "green" : "yellow"}
                    label={`${b.name} progress`}
                  />
                </div>
                <Mono className="mt-1 block text-[11px] font-bold text-ink2 uppercase">
                  {got ? "Earned ✓" : `${Math.round(b.progress * 100)}%`}
                </Mono>
              </Card>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 text-center text-[15px] font-semibold text-ink2">
          Nothing in this filter yet — switch to “All” to see the full set.
        </p>
      ) : null}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open ? (
          <div className="text-center">
            <div className="text-[56px]" aria-hidden>
              {open.icon}
            </div>
            <Arabic size="lg">{open.arabic}</Arabic>
            <p className="mt-2 text-[15px] font-semibold">{open.description}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Pill tone="ink">{open.condition}</Pill>
              <Pill tone="yellow">+{open.xp} XP</Pill>
              <Pill tone={earned(open) ? "green" : "field"}>
                {earned(open) ? "Earned" : `${Math.round(open.progress * 100)}% there`}
              </Pill>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {earned(open) ? (
                <BtnLink to="/share" search={{ kind: "badge" }} full>
                  📤 Share badge
                </BtnLink>
              ) : (
                <BtnLink to="/play" full>
                  Work towards it
                </BtnLink>
              )}
              <Btn variant="outline" full onClick={() => setOpen(null)}>
                Close
              </Btn>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
