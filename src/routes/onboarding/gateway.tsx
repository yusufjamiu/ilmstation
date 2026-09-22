import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn, BtnLink } from "@/components/kit";
import { useApp } from "@/lib/store";
import { logInWithGoogle, authErrorMessage } from "@/lib/auth";

export const Route = createFileRoute("/onboarding/gateway")({
  head: () => ({
    meta: [
      { title: "Sign up or log in — IlmStation" },
      { name: "description", content: "Create your IlmStation account or continue with Google or Apple." },
      { property: "og:title", content: "Sign up or log in — IlmStation" },
      { property: "og:description", content: "Two taps to start your first quest." },
    ],
  }),
  component: Gateway,
});

/** S04 Gateway */
function Gateway() {
  const { set, finishOnboarding } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const continueWithGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await logInWithGoogle();
      set({ name: user.displayName || "", email: user.email || "" });
      finishOnboarding();
      navigate({ to: "/onboarding/zone" });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardShell
      step={3}
      total={7}
      back="/onboarding/carousel"
      title="Your quest starts here"
      subtitle="Create an account to save your streak, XP and badges."
    >
      <div className="space-y-2">
        <BtnLink to="/onboarding/signup" size="lg" full>
          Sign up with email
        </BtnLink>
        <BtnLink to="/onboarding/login" variant="outline" size="lg" full>
          Log in
        </BtnLink>
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-0.5 flex-1 bg-field" />
        <span className="mono text-[11px] font-bold tracking-widest text-muted uppercase">or</span>
        <span className="h-0.5 flex-1 bg-field" />
      </div>

      {error && (
        <p className="mb-2 text-center text-[13px] font-semibold text-pink">{error}</p>
      )}

      <div className="space-y-2">
        <Btn variant="outline" full onClick={continueWithGoogle} disabled={loading}>
          <span aria-hidden>🇬</span> {loading ? "Connecting…" : "Continue with Google"}
        </Btn>
        <Btn variant="ink" full disabled title="Coming soon">
          <span aria-hidden></span> Continue with Apple (coming soon)
        </Btn>
      </div>

      <p className="mt-5 text-center text-[13px] text-muted">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </OnboardShell>
  );
}
