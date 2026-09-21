import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Bar, BtnLink, Card, Empty, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { useApp, type PointCategory } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Points Wallet — four kinds of reward — IlmStation" },
      { name: "description", content: "Ajr, Ilm, Noor and Hikmah points with a full transaction history." },
      { property: "og:title", content: "Points Wallet — IlmStation" },
      { property: "og:description", content: "Every point you earned, and where it came from." },
    ],
  }),
  component: Wallet,
});

const CATS: {
  id: PointCategory;
  name: string;
  arabic: string;
  icon: string;
  how: string;
  tone: string;
}[] = [
  { id: "ajr", name: "Ajr", arabic: "أَجْر", icon: "🤲", how: "Streaks, badges and consistency", tone: "bg-green-l" },
  { id: "ilm", name: "Ilm", arabic: "عِلْم", icon: "📗", how: "Quizzes, quests and articles", tone: "bg-yellow" },
  { id: "noor", name: "Noor", arabic: "نُور", icon: "🕯️", how: "Hifz and Quran recitation", tone: "bg-pink-l" },
  { id: "hikmah", name: "Hikmah", arabic: "حِكْمَة", icon: "🔮", how: "Daily Wisdom and IlmBot study", tone: "bg-field" },
];

/** Q06 Points Wallet */
function Wallet() {
  const { s, totalPoints } = useApp();
  const [filter, setFilter] = useState<"all" | PointCategory | "spend">("all");

  const txns = s.txns.filter((t) => (filter === "all" ? true : t.category === filter));

  return (
    <AppShell title="Points Wallet" subtitle="Four categories, one balance — spend it in the Store." wide>
      <Card tone="ink" className="rounded-r24">
        <p className="mono text-[11px] font-bold tracking-widest uppercase opacity-70">
          Total balance
        </p>
        <div className="flex items-end gap-2">
          <Mono className="text-[40px] leading-none font-bold">{totalPoints}</Mono>
          <span className="text-[15px] font-black">points</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <BtnLink to="/store" variant="primary" size="sm">
            🛒 Spend in Store
          </BtnLink>
          <BtnLink to="/store" search={{ item: "sadaqah" }} variant="green" size="sm">
            🤲 Give Sadaqah
          </BtnLink>
        </div>
        {s.donated > 0 ? (
          <p className="mt-3 text-[13px] font-bold">
            You've donated {s.donated} points — about ${(s.donated / 500).toFixed(2)}.
          </p>
        ) : null}
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATS.map((c) => (
          <div key={c.id} className={cn("brutal rounded-r16 p-4", c.tone)}>
            <div className="flex items-center justify-between">
              <span className="text-[26px]" aria-hidden>
                {c.icon}
              </span>
              <Mono className="text-[22px] font-bold">{s.points[c.id]}</Mono>
            </div>
            <h3 className="mt-1 text-[18px] font-black">
              {c.name} · <span className="arabic">{c.arabic}</span>
            </h3>
            <p className="text-[13px] font-semibold text-ink2">{c.how}</p>
            <div className="mt-2">
              <Bar
                value={totalPoints ? s.points[c.id] / totalPoints : 0}
                label={`${c.name} share`}
              />
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <SectionTitle
          action={
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All" },
                { value: "ilm", label: "Ilm" },
                { value: "ajr", label: "Ajr" },
                { value: "spend", label: "Spent" },
              ]}
            />
          }
        >
          Transaction history
        </SectionTitle>
        {txns.length === 0 ? (
          <Empty
            icon="🧾"
            title="No transactions here yet"
            body="Play a quiz, read an article or finish a Hifz session and it will show up in this list."
            action={<BtnLink to="/play">Go play</BtnLink>}
          />
        ) : (
          <ul className="space-y-2">
            {txns.map((t) => (
              <li
                key={t.id}
                className="brutal-sm flex items-center gap-3 rounded-r12 bg-field px-3 py-2.5"
              >
                <span className="brutal-sm grid h-9 w-9 shrink-0 place-items-center rounded-rf bg-surface text-[15px]">
                  {t.amount > 0 ? "＋" : "－"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-black">{t.label}</p>
                  <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                    {t.at} · {t.category}
                  </Mono>
                </div>
                <Mono
                  className={cn(
                    "text-[15px] font-bold",
                    t.amount > 0 ? "text-green" : "text-ink2",
                  )}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </Mono>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Pill tone="field">Points never expire · earn by learning, not by paying</Pill>
        </div>
      </Card>
    </AppShell>
  );
}
