/* Study plan: the learner picks a pace for a subject's level, sees a finish date and whether they're on track,
   and can get a daily reminder at a time they choose (sent by the notify cron, skipped if they already studied). */
import { useState } from "react";
import { BellRing, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { callPremium } from "@/components/premium";
import { ensurePush } from "@/components/notify";
import { cn } from "@/lib/utils";
import type { Plan } from "@/components/study-core";

export const PACES: { id: Plan["pace"]; label: string; perWeek: number; note: string }[] = [
  { id: "relaxed", label: "Relaxed", perWeek: 3, note: "3 lessons a week" },
  { id: "steady", label: "Steady", perWeek: 5, note: "5 lessons a week · recommended" },
  { id: "fast", label: "Fast", perWeek: 14, note: "2 lessons a day" },
];
const DAY = 86_400_000;
const fmt = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
const weeks = (lessons: number, perWeek: number) => { const d = Math.ceil((lessons / perWeek) * 7); return d < 10 ? `about ${d} days` : `about ${Math.round(d / 7)} week${Math.round(d / 7) > 1 ? "s" : ""}`; };

export function planStatus(plan: Plan, total: number, doneNow: number, now = Date.now()) {
  const p = PACES.find((x) => x.id === plan.pace) ?? PACES[1];
  const perDay = p.perWeek / 7;
  const left = Math.max(0, total - plan.base);
  const finish = plan.start + Math.ceil(left / perDay) * DAY;
  const expected = Math.min(total, plan.base + Math.floor(((now - plan.start) / DAY + 1) * perDay));
  const diff = doneNow - expected;
  return { pace: p, finish, diff, expected };
}

export function StudyPlanCard({ uid, planKey, plan, subject, level, total, doneNow }: {
  uid: string; planKey: string; plan?: Plan; subject: string; level: string; total: number; doneNow: number;
}) {
  const [editing, setEditing] = useState(!plan);
  const [pace, setPace] = useState<Plan["pace"]>(plan?.pace ?? "steady");
  const [remind, setRemind] = useState(!!plan?.at);
  const [at, setAt] = useState(plan?.at ?? "18:00");
  const [busy, setBusy] = useState(false);
  const left = Math.max(0, total - doneNow);
  if (!total || left === 0) return null;

  async function save() {
    setBusy(true);
    try {
      let reminderAt = remind ? at : "";
      if (remind) {
        const on = await ensurePush();
        if (!on.ok) { reminderAt = ""; toast(on.error === "denied" ? "Notifications are blocked for this site. Your plan is saved without a reminder." : "This device can't show notifications. Your plan is saved without a reminder."); }
      }
      const next: Plan = { pace, start: plan && plan.pace === pace ? plan.start : Date.now(), base: plan && plan.pace === pace ? plan.base : doneNow, ...(reminderAt ? { at: reminderAt } : {}) };
      await setDoc(doc(db, "studyProgress", uid), { plans: { [planKey]: next } }, { merge: true });
      if (reminderAt || plan?.at) await callPremium("studyRemind", { at: reminderAt, label: subject }).catch(() => null);
      toast.success(reminderAt ? `Plan saved. We'll remind you at ${reminderAt}.` : "Plan saved.");
      setEditing(false);
    } finally { setBusy(false); }
  }

  if (!editing && plan) {
    const st = planStatus(plan, total, doneNow);
    const tone = st.diff >= 0 ? "bg-secondary text-secondary-foreground" : "bg-primary";
    return <div className={cn("mt-4 flex flex-wrap items-center gap-4 border-2 border-foreground p-4 shadow-brutal-sm", tone)}>
      <CalendarCheck className="size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <b className="block">{st.diff > 0 ? `Ahead of plan by ${st.diff} 🚀` : st.diff === 0 ? "On track ✓" : `Behind by ${-st.diff} lesson${st.diff < -1 ? "s" : ""}. One today gets you closer.`}</b>
        <span className="text-sm">{st.pace.label} · {st.pace.note.split(" · ")[0]} · finish {level} by {fmt(st.finish)}{plan.at ? ` · reminder ${plan.at}` : ""}</span>
      </div>
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Change</Button>
    </div>;
  }

  return <div className="mt-4 border-2 border-foreground bg-card p-4 shadow-brutal-sm">
    <h3 className="font-serif text-2xl">Plan your pace</h3>
    <p className="text-sm text-muted-foreground">{left} lessons left in {subject} · {level}. Pick a pace that fits your week.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-3">{PACES.map((p) => <button key={p.id} onClick={() => setPace(p.id)}
      className={cn("border-2 border-foreground p-3 text-left", pace === p.id ? "bg-primary shadow-brutal-sm" : "bg-background")}>
      <b className="block">{p.label}</b><span className="text-xs">{p.note}</span>
      <span className="mt-1 block text-xs font-semibold">{weeks(left, p.perWeek)} · by {fmt(Date.now() + Math.ceil((left / p.perWeek) * 7) * DAY)}</span>
    </button>)}</div>
    <label className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
      <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} className="size-4" />
      <BellRing className="size-4" /> Remind me every day at
      <input type="time" value={at} disabled={!remind} onChange={(e) => setAt(e.target.value)} className="border-2 border-foreground bg-background px-2 py-1 disabled:opacity-50" />
      <span className="text-xs font-normal text-muted-foreground">(skipped on days you've already studied)</span>
    </label>
    <div className="mt-3 flex gap-2">
      <Button disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save my plan"}</Button>
      {plan && <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}
    </div>
  </div>;
}
