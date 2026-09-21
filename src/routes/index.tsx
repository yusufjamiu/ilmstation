import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Btn, BtnLink } from "@/components/kit";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IlmStation — Seek · Learn · Grow" },
      {
        name: "description",
        content:
          "Start your IlmStation: gamified Islamic learning with daily quests, streaks, Hifz mode and friend duels.",
      },
      { property: "og:title", content: "IlmStation — Seek · Learn · Grow" },
      {
        property: "og:description",
        content: "Gamified Islamic learning. Daily quests, streaks, Hifz mode, duels and Sadaqah.",
      },
    ],
  }),
  component: Splash,
});

/** S01 Splash — brand moment, then route by onboarding state. */
function Splash() {
  const { s } = useApp();
  const navigate = useNavigate();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (waited && s.hydrated && s.onboarded) navigate({ to: "/home" });
  }, [waited, s.hydrated, s.onboarded, navigate]);

  const ready = waited && s.hydrated;

  return (
    <div className="grid-paper flex min-h-screen flex-col items-center justify-center bg-page px-5">
      <div className="anim-pop text-center">
        <div className="brutal-lg anim-float mx-auto grid h-28 w-28 place-items-center rounded-r24 bg-yellow text-[56px]">
          ☪
        </div>
        <h1 className="mt-6 text-[56px] leading-none font-black tracking-tight sm:text-[72px]">
          ILMSTATION
        </h1>
        <p className="mono mt-2 text-[13px] font-bold  text-ink2 uppercase">
          Seek · Learn · Grow
        </p>
      </div>

      <div className="mt-10 w-full max-w-sm">
        {!ready ? (
          <div className="brutal-flat h-3 w-full overflow-hidden rounded-rf bg-field">
            <div className="h-full w-1/2 animate-pulse bg-green" />
          </div>
        ) : s.onboarded ? (
          <Btn full size="lg" onClick={() => window.location.assign("/home")}>
            Continue →
          </Btn>
        ) : (
          <div className="anim-rise space-y-2">
            <BtnLink to="/onboarding/language" full size="lg">
              Begin →
            </BtnLink>
            <BtnLink to="/onboarding/login" variant="outline" full>
              I already have an account
            </BtnLink>
          </div>
        )}
      </div>

      <p className="mt-8 max-w-sm text-center text-[13px] font-semibold text-muted">
        A gamified Islamic learning platform. 71 screens, working end to end in your browser — your
        progress is saved on this device.
      </p>
    </div>
  );
}
