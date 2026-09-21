import { Arabic, Btn, BtnLink, Confetti, Mono, Pill } from "./kit";
import type { Badge } from "@/lib/data";

/** P07u Badge Unlock — full-screen celebration. */
export function BadgeUnlock({ badge, onClose }: { badge: Badge | null; onClose: () => void }) {
  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 px-4 backdrop-blur-[2px]">
      <Confetti count={34} />
      <div className="brutal anim-pop w-full max-w-md rounded-r24 bg-yellow p-7 text-center">
        <Pill tone="ink">Badge unlocked</Pill>
        <Arabic size="xl" className="mt-4 text-center">
          {badge.arabic}
        </Arabic>
        <div className="mt-2 text-[64px]" aria-hidden>
          {badge.icon}
        </div>
        <h2 className="mt-2 text-[28px] leading-tight font-black">{badge.name}</h2>
        <p className="mt-2 text-[15px] font-bold">{badge.description}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-rf border border-border/25 bg-surface px-4 py-2">
          <Mono className="text-[20px] font-bold">+{badge.xp} XP</Mono>
        </div>
        <div className="mt-5 space-y-2">
          <BtnLink to="/share" search={{ kind: "badge" }} variant="ink" full size="lg">
            📤 Share this badge
          </BtnLink>
          <Btn variant="outline" full onClick={onClose}>
            Continue
          </Btn>
        </div>
      </div>
    </div>
  );
}
