import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn, BtnLink, Field, Input } from "@/components/kit";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/login")({
  head: () => ({
    meta: [
      { title: "Log in — IlmStation" },
      { name: "description", content: "Welcome back. Log in to continue your streak and quests." },
      { property: "og:title", content: "Log in — IlmStation" },
      { property: "og:description", content: "Pick up your streak where you left it." },
    ],
  }),
  component: LoginScreen,
});

/** S10 Log In */
function LoginScreen() {
  const { s, set, finishOnboarding } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState(s.email || "amina@ilmstation.com");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || pw.length < 4) {
      setError("Check your email and password (any password of 4+ characters works in this demo)");
      return;
    }
    set({ email, name: s.name || "Amina Bello" });
    finishOnboarding();
    navigate({ to: "/home" });
  };

  return (
    <OnboardShell
      step={3}
      total={7}
      back="/onboarding/gateway"
      title="Welcome back"
      subtitle="Assalamu Alaykum — your streak is waiting."
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Field label="Email address">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={error}>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>
        <Btn type="submit" size="lg" full>
          Log in →
        </Btn>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-center">
        <BtnLink to="/onboarding/forgot" variant="ghost">
          Forgot your password?
        </BtnLink>
        <BtnLink to="/onboarding/signup" variant="outline" full>
          Create an account instead
        </BtnLink>
      </div>
    </OnboardShell>
  );
}
