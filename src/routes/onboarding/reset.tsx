import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn, Field, Input } from "@/components/kit";
import { strength } from "./onboarding.password";

export const Route = createFileRoute("/onboarding/reset")({
  head: () => ({
    meta: [
      { title: "Set a new password — IlmStation" },
      { name: "description", content: "Choose a new password for your IlmStation account." },
      { property: "og:title", content: "Set a new password — IlmStation" },
      { property: "og:description", content: "New password, same streak." },
    ],
  }),
  component: ResetScreen,
});

/** S13 Reset Password */
function ResetScreen() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const mismatch = confirm.length > 0 && pw !== confirm;
  const ok = strength(pw) >= 2 && pw === confirm;

  if (done) {
    return (
      <OnboardShell>
        <div className="brutal-lg anim-pop rounded-r24 bg-green-l p-7 text-center">
          <div className="text-[64px]" aria-hidden>
            ✅
          </div>
          <h1 className="mt-2 text-[28px] font-black">Password updated</h1>
          <p className="mt-2 text-[15px] font-semibold">You can log in with your new password now.</p>
        </div>
        <Btn size="lg" full className="mt-5" onClick={() => navigate({ to: "/onboarding/login" })}>
          Log in →
        </Btn>
      </OnboardShell>
    );
  }

  return (
    <OnboardShell
      back="/onboarding/check-email"
      title="New password"
      subtitle="Make it strong — at least 8 characters with a number."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) setDone(true);
        }}
      >
        <Field label="New password">
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Confirm password" error={mismatch ? "Passwords don't match" : ""}>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Btn type="submit" size="lg" full disabled={!ok}>
          Save password →
        </Btn>
      </form>
    </OnboardShell>
  );
}
