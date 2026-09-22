import { createFileRoute } from "@tanstack/react-router";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn, BtnLink } from "@/components/kit";
import { useApp } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";

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
  const { set } = useApp();
  const navigate = useNavigate();

  const social = (provider: string) => {
    set({ name: "Amina Bello", email: `amina@${provider}.com` });
    navigate({ to: "/onboarding/zone" });
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

      <div className="space-y-2">
        <Btn variant="outline" full onClick={() => social("google")}>
          <span aria-hidden>🇬</span> Continue with Google
        </Btn>
        <Btn variant="ink" full onClick={() => social("icloud")}>
          <span aria-hidden></span> Continue with Apple
        </Btn>
      </div>

      <p className="mt-5 text-center text-[13px] text-muted">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </OnboardShell>
  );
}
