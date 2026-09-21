import { useApp } from "@/lib/store";
import { Btn, Modal, Mono } from "./kit";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StreakModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, set, spend } = useApp();
  const today = 5; // index in the 7-day grid representing today

  const buyFreeze = () => {
    if (spend(100, "Streak Freeze")) set({ freezes: s.freezes + 1 });
  };

  return (
    <Modal open={open} onClose={onClose} title={`🔥 ${s.streak}-day streak`}>
      <p className="text-[15px] font-bold text-ink2">
        Don&apos;t break the chain. One activity a day keeps it alive.
      </p>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {DAYS.map((d, i) => {
          const done = s.streakWeek[i];
          const isToday = i === today;
          return (
            <div key={d} className="text-center">
              <div className="mb-1 text-[10px] font-black tracking-wide text-ink2 uppercase">
                {d}
              </div>
              <div
                className={`brutal-sm grid aspect-square place-items-center rounded-r8 text-[16px] ${
                  done ? "bg-green text-surface" : isToday ? "bg-yellow" : "bg-field text-muted"
                }`}
              >
                {done ? "✓" : isToday ? "•" : "✗"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="brutal-sm mt-4 flex items-center justify-between rounded-r12 bg-field px-3 py-3">
        <div>
          <div className="text-[15px] font-black">🧊 Streak Freeze</div>
          <div className="text-[13px] text-ink2">
            You own <Mono>{s.freezes}</Mono> · protects one missed day
          </div>
        </div>
        <Btn size="sm" onClick={buyFreeze}>
          Buy · 100 pts
        </Btn>
      </div>

      <Btn full className="mt-4" onClick={onClose}>
        Keep the chain going
      </Btn>
    </Modal>
  );
}
