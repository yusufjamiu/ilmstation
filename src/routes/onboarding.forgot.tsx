import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn, Field, Input } from "@/components/kit";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/forgot")({
  head: () => ({
    meta: [
      { title: "Forgot password — IlmStation" },
      { name: "description", content: "Enter your email address and we'll send a reset link." },
      { property: "og:title", content: "Forgot password — IlmStation" },
      { property: "og:description", content: "Reset your IlmStation password." },
    ],
  }),
  component: ForgotScreen,
});

/** S11 Forgot Password */
function ForgotScreen() {
  const { s, set } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState(s.email);
  const [error, setError] = useState("");

  return (
    <OnboardShell
      step={3}
      total={7}
      back="/onboarding/login"
      title="Reset your password"
      subtitle="We'll email you a secure link to set a new one."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            setError("Enter a valid email address");
            return;
          }
          set({ email });
          navigate({ to: "/onboarding/check-email" });
        }}
        noValidate
      >
        <Field label="Email address" error={error}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </Field>
        <Btn type="submit" size="lg" full>
          Send reset link →
        </Btn>
      </form>
    </OnboardShell>
  );
}
