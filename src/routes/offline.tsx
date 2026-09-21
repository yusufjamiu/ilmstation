import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Mono, Pill, SectionTitle } from "@/components/kit";

export const Route = createFileRoute("/offline")({
  head: () => ({
    meta: [
      { title: "You're offline — IlmStation" },
      { name: "description", content: "What still works without a connection, and what syncs when you're back online." },
      { property: "og:title", content: "You're offline — IlmStation" },
      { property: "og:description", content: "Saved quizzes and articles keep working." },
    ],
  }),
  component: Offline,
});

/** SY01 Offline State */
function Offline() {
  const [online, setOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const retry = () => {
    setRetrying(true);
    setTimeout(() => setRetrying(false), 1200);
  };

  return (
    <AppShell title={online ? "Connection looks fine" : "You're offline"}>
      <Card tone={online ? "green" : "pink"} className="rounded-r24 text-center">
        <div className="text-[56px]" aria-hidden>
          {online ? "📶" : "📴"}
        </div>
        <h2 className="mt-1 text-[26px] font-black">
          {online ? "You're connected" : "No internet connection"}
        </h2>
        <p className="mt-2 text-[15px] font-semibold">
          {online
            ? "Everything is live. This screen is how IlmStation looks when the connection drops."
            : "Your progress is saved on this device and nothing is lost. Some screens need a connection."}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Btn onClick={retry}>{retrying ? "Retrying…" : "🔄 Retry connection"}</Btn>
          <BtnLink to="/bookmarks" variant="outline">
            🔖 Read saved items
          </BtnLink>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionTitle>Works offline</SectionTitle>
          <ul className="space-y-2 text-[15px] font-semibold">
            <li>✅ Bookmarked articles</li>
            <li>✅ Hifz review queue</li>
            <li>✅ Downloaded quizzes and your progress</li>
            <li>✅ Points wallet and history</li>
          </ul>
        </Card>
        <Card tone="field">
          <SectionTitle>Needs a connection</SectionTitle>
          <ul className="space-y-2 text-[15px] font-semibold">
            <li>⛔ Challenge duels and Halaqah rooms</li>
            <li>⛔ Leaderboards</li>
            <li>⛔ IlmBot answers</li>
            <li>⛔ Recitation audio streaming</li>
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionTitle>Pending sync</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Pill tone="yellow">2 quiz results queued</Pill>
          <Pill tone="yellow">1 Hifz session queued</Pill>
        </div>
        <Mono className="mt-3 block text-[11px] font-bold tracking-widest text-ink2 uppercase">
          These upload automatically as soon as you're back online.
        </Mono>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <BtnLink to="/home" size="lg" full>
          Back to Home
        </BtnLink>
        <BtnLink to="/hifz/review" variant="outline" size="lg" full>
          📖 Hifz review (offline)
        </BtnLink>
      </div>
    </AppShell>
  );
}
