import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn } from "@/components/kit";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/verify")({
  head: () => ({
    meta: [
      { title: "Verify your email — IlmStation" },
      { name: "description", content: "Enter the 6-digit code sent to your email to verify your IlmStation account." },
      { property: "og:title", content: "Verify your email — IlmStation" },
      { property: "og:description", content: "Six digits and you're in." },
    ],
  }),
  component: VerifyScreen,
});

/** S09 Email Verify */
function VerifyScreen() {
  const { s } = useApp();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(45);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError("");
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const code = digits.join("");

  const verify = () => {
    if (code.length < 6) {
      setError("Enter all six digits");
      return;
    }
    navigate({ to: "/onboarding/zone" });
  };

  return (
    <OnboardShell
      step={4}
      total={7}
      back="/onboarding/avatar"
      title="Check your inbox"
      subtitle={`We sent a 6-digit code to ${s.email || "your email"}. Demo tip: any 6 digits work.`}
    >
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
            }}
            inputMode="numeric"
            aria-label={`Digit ${i + 1}`}
            className="brutal mono h-16 w-full rounded-r12 bg-field text-center text-[24px] font-bold focus:ring-2 focus:ring-yellow focus:outline-none"
          />
        ))}
      </div>

      {error ? <p className="mt-2 text-[13px] font-bold">⚠ {error}</p> : null}

      <Btn size="lg" full className="mt-5" onClick={verify}>
        Verify email →
      </Btn>

      <div className="mt-4 text-center text-[13px] font-semibold text-ink2">
        {seconds > 0 ? (
          <>
            Resend code in <span className="mono">{seconds}s</span>
          </>
        ) : (
          <button onClick={() => setSeconds(45)} className="font-black underline">
            Resend code
          </button>
        )}
      </div>
    </OnboardShell>
  );
}
