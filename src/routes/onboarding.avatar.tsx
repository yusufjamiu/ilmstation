import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn } from "@/components/kit";
import { AVATARS } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/avatar")({
  head: () => ({
    meta: [
      { title: "Pick your avatar — IlmStation" },
      { name: "description", content: "Choose one of eight IlmStation avatars or upload your own picture." },
      { property: "og:title", content: "Pick your avatar — IlmStation" },
      { property: "og:description", content: "Your face on the leaderboard." },
    ],
  }),
  component: AvatarScreen,
});

/** S08 Profile Picture */
function AvatarScreen() {
  const { s, set } = useApp();
  const navigate = useNavigate();

  return (
    <OnboardShell
      step={4}
      total={7}
      back="/onboarding/dob"
      title="Choose your face"
      subtitle="This shows on the leaderboard, duels and share cards."
    >
      <div className="flex flex-col items-center">
        <span className="brutal-lg grid h-28 w-28 place-items-center rounded-rf bg-yellow text-[56px]">
          {s.avatar}
        </span>
        <label className="brutal press-sm mt-4 cursor-pointer rounded-r12 bg-surface px-4 py-2.5 text-[13px] font-extrabold">
          📷 Upload a photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => set({ avatar: "🖼️" })}
          />
        </label>
      </div>

      <p className="mono mt-6 mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
        Or pick a generated avatar
      </p>
      <div className="grid grid-cols-4 gap-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            onClick={() => set({ avatar: a })}
            aria-pressed={s.avatar === a}
            aria-label={`Avatar ${a}`}
            className={`brutal press grid aspect-square place-items-center rounded-r16 text-[32px] ${
              s.avatar === a ? "bg-yellow" : "bg-surface"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <Btn size="lg" full className="mt-5" onClick={() => navigate({ to: "/onboarding/verify" })}>
        Continue →
      </Btn>
    </OnboardShell>
  );
}
