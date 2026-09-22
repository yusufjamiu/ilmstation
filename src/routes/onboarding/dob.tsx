import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn } from "@/components/kit";

export const Route = createFileRoute("/onboarding/dob")({
  head: () => ({
    meta: [
      { title: "Date of birth — IlmStation" },
      { name: "description", content: "Your age sets the tone and difficulty of your IlmStation content." },
      { property: "og:title", content: "Date of birth — IlmStation" },
      { property: "og:description", content: "Age gate with a scrolling picker." },
    ],
  }),
  component: DobScreen,
});

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const YEARS = Array.from({ length: 60 }, (_, i) => 2013 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function Drum<T extends string | number>({
  items,
  value,
  onChange,
  label,
}: {
  items: T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex-1">
      <p className="mono mb-1 text-center text-[10px] font-bold tracking-widest text-ink2 uppercase">
        {label}
      </p>
      <div
        className="brutal-flat no-scrollbar h-44 overflow-y-auto rounded-r12 bg-field p-1"
        role="listbox"
        aria-label={label}
      >
        {items.map((it) => (
          <button
            key={String(it)}
            role="option"
            aria-selected={it === value}
            onClick={() => onChange(it)}
            className={`mono block w-full rounded-r8 py-2 text-[16px] font-bold ${
              it === value ? "brutal-flat bg-yellow" : "text-ink2"
            }`}
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  );
}

/** S07 Date of Birth */
function DobScreen() {
  const navigate = useNavigate();
  const [day, setDay] = useState<number>(14);
  const [month, setMonth] = useState<string>("Mar");
  const [year, setYear] = useState<number>(2004);
  const age = 2026 - year;
  const tooYoung = age < 13;

  return (
    <OnboardShell
      step={4}
      total={7}
      back="/onboarding/password"
      title="When were you born?"
      subtitle="This sets your age zone and the tone of your content."
    >
      <div className="flex gap-2">
        <Drum items={DAYS} value={day} onChange={setDay} label="Day" />
        <Drum items={MONTHS} value={month} onChange={setMonth} label="Month" />
        <Drum items={YEARS} value={year} onChange={setYear} label="Year" />
      </div>

      <div className="brutal-sm mt-4 rounded-r12 bg-surface px-4 py-3 text-[15px] font-bold">
        {day} {month} {year} · <span className="mono">{age}</span> years old
      </div>

      {tooYoung ? (
        <p className="brutal-sm mt-3 rounded-r12 bg-pink-l px-4 py-3 text-[13px] font-bold">
          IlmStation is designed for ages 13 and up. Ask a parent to set up a Family account.
        </p>
      ) : null}

      <Btn
        size="lg"
        full
        className="mt-5"
        disabled={tooYoung}
        onClick={() => navigate({ to: "/onboarding/avatar" })}
      >
        Continue →
      </Btn>
    </OnboardShell>
  );
}
