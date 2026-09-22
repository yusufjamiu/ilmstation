import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn, BtnLink, Field, Input } from "@/components/kit";
import { useApp } from "@/lib/store";
import { logIn, logInWithGoogle, authErrorMessage } from "@/lib/auth";

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
  const [email, setEmail] = useState(s.email || "");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finishLogin = (userEmail: string, name: string) => {
    set({ email: userEmail, name: name || s.name || "" });
    finishOnboarding();
    navigate({ to: "/home" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await logIn(email, pw);
      finishLogin(email, user.displayName || "");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const user = await logInWithGoogle();
      finishLogin(user.email || "", user.displayName || "");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
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
        <Btn type="submit" size="lg" full disabled={loading || googleLoading}>
          {loading ? "Logging in…" : "Log in →"}
        </Btn>
      </form>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink/10" />
        <span className="mono text-[11px] font-bold tracking-widest text-ink2 uppercase">or</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <Btn
        type="button"
        variant="outline"
        size="lg"
        full
        onClick={submitGoogle}
        disabled={loading || googleLoading}
      >
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </Btn>

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
