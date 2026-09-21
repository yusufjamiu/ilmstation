import { createFileRoute } from "@tanstack/react-router";
import { OnboardShell } from "@/components/OnboardShell";
import { BtnLink } from "@/components/kit";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/check-email")({
  head: () => ({
    meta: [
      { title: "Check your email — IlmStation" },
      { name: "description", content: "We sent you a password reset link. Open your email app to continue." },
      { property: "og:title", content: "Check your email — IlmStation" },
      { property: "og:description", content: "Reset link sent." },
    ],
  }),
  component: CheckEmail,
});

/** S12 Check Email */
function CheckEmail() {
  const { s } = useApp();

  return (
    <OnboardShell step={3} total={7} back="/onboarding/forgot">
      <div className="brutal-lg anim-pop rounded-r24 bg-green-l p-7 text-center">
        <div className="text-[64px]" aria-hidden>
          📬
        </div>
        <h1 className="mt-2 text-[28px] leading-tight font-black">Check your email</h1>
        <p className="mt-2 text-[15px] font-semibold">
          We sent a reset link to{" "}
          <span className="mono font-bold">{s.email || "your email address"}</span>. The link expires
          in 30 minutes.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <BtnLink to="/onboarding/reset" size="lg" full>
          Open email app
        </BtnLink>
        <BtnLink to="/onboarding/login" variant="outline" full>
          Back to log in
        </BtnLink>
      </div>

      <p className="mt-4 text-center text-[13px] text-muted">
        Didn&apos;t get it? Check spam, or resend from the previous screen.
      </p>
    </OnboardShell>
  );
}
