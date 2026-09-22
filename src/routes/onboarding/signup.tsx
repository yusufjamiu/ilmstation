import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardShell } from "@/components/OnboardShell";
import { Btn, Field, Input } from "@/components/kit";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/onboarding/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — IlmStation" },
      { name: "description", content: "Enter your name and email to create your IlmStation account." },
      { property: "og:title", content: "Create your account — IlmStation" },
      { property: "og:description", content: "Name and email — that's all we need to begin." },
    ],
  }),
  component: NameEmail,
});

/** S05 Name & Email */
function NameEmail() {
  const { s, set } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(s.name);
  const [email, setEmail] = useState(s.email);
  const [touched, setTouched] = useState(false);

  const nameErr = name.trim().length < 2 ? "Enter your full name" : "";
  const emailErr = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "Enter a valid email address" : "";
  const valid = !nameErr && !emailErr;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    set({ name: name.trim(), email: email.trim() });
    navigate({ to: "/onboarding/password" });
  };

  return (
    <OnboardShell
      step={3}
      total={7}
      back="/onboarding/gateway"
      title="Who's seeking?"
      subtitle="We'll use your first name to greet you every day."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={touched ? nameErr : ""} hint="e.g. Amina Bello">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </Field>
        <Field label="Email address" error={touched ? emailErr : ""}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </Field>
        <Btn type="submit" size="lg" full>
          Continue →
        </Btn>
      </form>
    </OnboardShell>
  );
}
