import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Field, Input, Modal, Mono, Pill, SectionTitle, Segmented, Toggle } from "@/components/kit";
import { LANGUAGES, ZONES } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — language, notifications and accessibility — IlmStation" },
      { name: "description", content: "Control theme, language, reminders, sound, motion, text size, Premium and your data." },
      { property: "og:title", content: "Settings — IlmStation" },
      { property: "og:description", content: "Everything is stored on your device." },
    ],
  }),
  component: Settings,
});

/** S07 Settings */
function Settings() {
  const { s, set, reset } = useApp();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const [email, setEmail] = useState(s.email);
  const [saved, setSaved] = useState(false);

  const saveAccount = () => {
    set({ email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell title="Settings" subtitle="Your data lives on this device only." wide>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <Row label="Dark mode" hint="Deep charcoal with the same bold borders.">
            <Toggle on={s.dark} onChange={(v) => set({ dark: v })} label="Dark mode" />
          </Row>
          <Row label="Larger text" hint="Increases the base text size across the app.">
            <Toggle on={s.largeText} onChange={(v) => set({ largeText: v })} label="Larger text" />
          </Row>
          <Row label="Reduce motion" hint="Removes confetti and card animations.">
            <Toggle
              on={s.reduceMotion}
              onChange={(v) => set({ reduceMotion: v })}
              label="Reduce motion"
            />
          </Row>
          <Row label="Sound effects" hint="Correct/incorrect chimes and streak sounds.">
            <Toggle on={s.sound} onChange={(v) => set({ sound: v })} label="Sound effects" />
          </Row>
        </Card>

        <Card>
          <SectionTitle>Learning</SectionTitle>
          <div className="space-y-4">
            <div>
              <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
                Default difficulty
              </p>
              <Segmented
                value={s.difficulty}
                onChange={(v) => set({ difficulty: v as typeof s.difficulty })}
                options={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ]}
              />
            </div>
            <div>
              <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
                Language
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button key={l.code} onClick={() => set({ language: l.code })}>
                    <Pill tone={s.language === l.code ? "yellow" : "field"}>
                      {l.flag} {l.label}
                    </Pill>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
                Age zone
              </p>
              <div className="flex flex-wrap gap-2">
                {ZONES.map((z) => (
                  <button key={z.id} onClick={() => set({ zone: z.id })}>
                    <Pill tone={s.zone === z.id ? "green" : "field"}>
                      {z.icon} {z.range}
                    </Pill>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Notifications</SectionTitle>
          <Row label="All reminders" hint="Daily quest, streak warnings and challenge invites.">
            <Toggle
              on={s.notificationsOn}
              onChange={(v) => set({ notificationsOn: v })}
              label="Notifications"
            />
          </Row>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill tone="field">Daily quest · 07:30</Pill>
            <Pill tone="field">Streak warning · 20:00</Pill>
            <Pill tone="field">Challenge invites · instant</Pill>
          </div>
          <BtnLink to="/notifications" variant="outline" className="mt-3">
            Open notification centre
          </BtnLink>
        </Card>

        <Card>
          <SectionTitle>Account</SectionTitle>
          <div className="space-y-3">
            <Field label="Email">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={saveAccount}>{saved ? "✓ Saved" : "Save email"}</Btn>
              <BtnLink to="/profile" variant="outline">
                Edit profile
              </BtnLink>
            </div>
            <div className="brutal-sm rounded-r12 bg-field p-3">
              <p className="text-[15px] font-black">
                {s.premium ? "⚡ Premium active" : "Free plan"}
              </p>
              <p className="text-[13px] font-semibold text-ink2">
                {s.premium
                  ? "Unlimited IlmBot, all Surahs, Halaqah hosting and advanced topics."
                  : "Premium unlocks unlimited IlmBot, every Surah and Halaqah hosting."}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {s.premium ? (
                  <Btn variant="outline" size="sm" onClick={() => set({ premium: false })}>
                    Switch back to Free
                  </Btn>
                ) : (
                  <BtnLink to="/store" search={{ item: "premium-week" }} size="sm">
                    See Premium
                  </BtnLink>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card tone="pink" className="mt-4">
        <SectionTitle>Data</SectionTitle>
        <p className="text-[15px] font-semibold text-ink2">
          IlmStation stores your progress in this browser. Clearing it resets XP, points, badges,
          bookmarks and onboarding.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn variant="danger" onClick={() => setConfirmReset(true)}>
            Reset all my data
          </Btn>
          <BtnLink to="/offline" variant="outline">
            Offline behaviour
          </BtnLink>
          <BtnLink to="/error" variant="outline">
            Error state demo
          </BtnLink>
        </div>
        <Mono className="mt-3 block text-[11px] font-bold tracking-widest text-ink2 uppercase">
          Version 1.0 · frontend demo · no account required
        </Mono>
      </Card>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset everything?">
        <p className="text-[15px] font-semibold text-ink2">
          This clears your saved progress on this device and takes you back to the start of
          onboarding. It cannot be undone.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Btn
            variant="danger"
            full
            onClick={() => {
              reset();
              navigate({ to: "/onboarding/language" });
            }}
          >
            Yes, reset
          </Btn>
          <Btn variant="outline" full onClick={() => setConfirmReset(false)}>
            Keep my data
          </Btn>
        </div>
      </Modal>
    </AppShell>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/20 py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-[15px] font-black">{label}</p>
        {hint ? <p className="text-[13px] font-semibold text-ink2">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
