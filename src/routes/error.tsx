import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Mono, SectionTitle } from "@/components/kit";

export const Route = createFileRoute("/error")({
  head: () => ({
    meta: [
      { title: "Something went wrong — IlmStation" },
      { name: "description", content: "A friendly error screen with a retry, a way home and a report option." },
      { property: "og:title", content: "Something went wrong — IlmStation" },
      { property: "og:description", content: "Your progress is safe." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ErrorState,
});

/** SY02 Error State */
function ErrorState() {
  const router = useRouter();
  const [reported, setReported] = useState(false);
  const [retrying, setRetrying] = useState(false);

  return (
    <AppShell title="Something went wrong">
      <Card tone="pink" className="rounded-r24 text-center">
        <div className="text-[56px]" aria-hidden>
          🧩
        </div>
        <h2 className="mt-1 text-[26px] font-black">This screen didn't load</h2>
        <p className="mt-2 text-[15px] font-semibold">
          Your XP, points and streak are safe on this device. Nothing you earned was lost.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Btn
            onClick={() => {
              setRetrying(true);
              router.invalidate();
              setTimeout(() => setRetrying(false), 900);
            }}
          >
            {retrying ? "Retrying…" : "🔄 Try again"}
          </Btn>
          <BtnLink to="/home" variant="outline">
            Go home
          </BtnLink>
          <Btn variant="ink" onClick={() => setReported(true)} disabled={reported}>
            {reported ? "✓ Report sent" : "Report a problem"}
          </Btn>
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle>What you can try</SectionTitle>
        <ul className="space-y-2 text-[15px] font-semibold text-ink2">
          <li>1. Retry — most errors are a one-off hiccup.</li>
          <li>2. Go home, then come back to the screen.</li>
          <li>3. Check your connection on the offline screen.</li>
          <li>4. Still stuck? Send a report and keep learning elsewhere in the app.</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <BtnLink to="/offline" variant="outline" size="sm">
            Connection help
          </BtnLink>
          <BtnLink to="/settings" variant="outline" size="sm">
            Settings
          </BtnLink>
        </div>
        <Mono className="mt-3 block text-[11px] font-bold tracking-widest text-ink2 uppercase">
          Reference: IQ-ERR-000 · frontend demo
        </Mono>
      </Card>
    </AppShell>
  );
}
