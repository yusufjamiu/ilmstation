/* Test mode for admins: every level, subject and lesson opens (no locks), lessons show a 🧪 button to jump to any step
   or mark the lesson passed, and the tester can reset their own progress to try the real learner flow again.
   Only people in admins/{uid} see the switch. It's saved on this device only. */
import { useEffect, useState } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const KEY = "ilm-test-mode";
export const testOn = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

export function StudyTestBar({ uid }: { uid: string | null | undefined }) {
  const [admin, setAdmin] = useState(false);
  const [on, setOn] = useState(testOn());
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "admins", uid)).then((d) => setAdmin(d.exists())).catch(() => setAdmin(false));
  }, [uid]);
  if (!admin || !uid) return null;
  const toggle = () => { const v = !on; try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* */ } setOn(v); toast(v ? "🧪 Test mode on: everything is open." : "Test mode off."); setTimeout(() => location.reload(), 600); };
  const reset = async () => {
    if (!confirm("Reset YOUR study progress? Every lesson goes back to not done (only your account).")) return;
    await setDoc(doc(db, "studyProgress", uid), { done: {}, plans: {} }, { merge: false }).catch(() => null);
    try { Object.keys(localStorage).filter((k) => k.startsWith("ilm-lesson:") || k.startsWith("ilm-stage-up:")).forEach((k) => localStorage.removeItem(k)); } catch { /* */ }
    toast.success("Your progress is reset."); setTimeout(() => location.reload(), 600);
  };
  return <div className="fixed bottom-20 left-3 z-40 sm:bottom-4">
    {open && <div className="mb-2 w-64 border-2 border-foreground bg-background p-3 text-sm shadow-brutal">
      <b className="block">Test mode (admins only)</b>
      <p className="mt-1 text-xs text-muted-foreground">On: all levels and lessons open, and each lesson has a 🧪 button to jump to any step or mark it passed. Learners never see this.</p>
      <button onClick={toggle} className={cn("mt-2 w-full border-2 border-foreground px-3 py-2 font-bold", on ? "bg-secondary text-secondary-foreground" : "bg-primary")}>{on ? "Turn test mode off" : "Turn test mode on"}</button>
      <button onClick={() => void reset()} className="mt-2 flex w-full items-center justify-center gap-2 border-2 border-foreground bg-card px-3 py-2 font-semibold"><RotateCcw className="size-4" /> Reset my progress</button>
    </div>}
    <button onClick={() => setOpen(!open)} className={cn("flex items-center gap-2 border-2 border-foreground px-3 py-2 text-sm font-bold shadow-brutal-sm", on ? "bg-secondary text-secondary-foreground" : "bg-background")}>
      <FlaskConical className="size-4" /> {on ? "Test mode ON" : "Test"}
    </button>
  </div>;
}
