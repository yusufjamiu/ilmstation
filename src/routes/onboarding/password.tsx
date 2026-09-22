import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn, Field, Input } from "@/components/kit";
import { useApp } from "@/lib/store";
import { signUp, authErrorMessage } from "@/lib/auth";

export const Route = createFileRoute("/onboarding/password")({
  head: () => ({
    meta: [
      { title: "Create a password — IlmStation" },
      { name: "description", content: "Set a strong password for your IlmStation account." },
      { property: "og:title", content: "Create a password — IlmStation" },
      { property: "og:description", content: "Strength meter included." },
    ],
  }),
  component: PasswordScreen,
});

export function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const LABELS = ["Too short", "Weak", "Fair", "Strong", "Excellent"];
const TONES = ["bg-field", "bg-pink", "bg-yellow", "bg-green", "bg-green"];

/** S06 Password */
function PasswordScreen() {
  const { s } = useApp();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const score = strength(pw);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 2) return;
    setError("");
    setLoading(true);
    try {
      await signUp(s.email, pw, s.name);
      navigate({ to: "/onboarding/dob" });
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
      back="/onboarding/signup"
      title="Lock it down"
      subtitle="8+ characters, with a number and a capital letter."
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Password" error={error}>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pr-20"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-r8 px-2 py-1 text-[11px] font-black uppercase"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`brutal-flat h-2.5 flex-1 rounded-rf ${i < score ? TONES[score] : "bg-field"}`}
              />
            ))}
          </div>
          <p className="mono mt-1.5 text-[11px] font-bold tracking-widest uppercase">
            {LABELS[score]}
          </p>
        </div>

        <ul className="space-y-1 text-[13px] font-semibold text-ink2">
          {[
            { ok: pw.length >= 8, t: "At least 8 characters" },
            { ok: /[A-Z]/.test(pw), t: "One capital letter" },
            { ok: /[0-9]/.test(pw), t: "One number" },
            { ok: /[^A-Za-z0-9]/.test(pw), t: "One symbol (optional)" },
          ].map((r) => (
            <li key={r.t}>
              <span className={r.ok ? "text-green" : "text-muted"}>{r.ok ? "✓" : "○"}</span> {r.t}
            </li>
          ))}
        </ul>

        <Btn type="submit" size="lg" full disabled={score < 2 || loading}>
          {loading ? "Creating account…" : "Continue →"}
        </Btn>
      </form>
    </OnboardShell>
  );
}
