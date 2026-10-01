import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KidsMode } from "@/components/family";
import { redeemPlayPass, type PlayPass } from "@/components/playpass";

type Search = { code?: string | undefined };

export const Route = createFileRoute("/play")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const code = s["code"];
    return { code: typeof code === "string" ? code : undefined };
  },
  head: () => ({
    meta: [
      { title: "IlmStation Kids — Enter your play code" },
      { name: "description", content: "Kids Mode opens here with a play pass from a parent or guardian. No accounts, no chat, no links out — just safe, playful learning." },
      { property: "og:title", content: "IlmStation Kids — Enter your play code" },
      { property: "og:description", content: "Enter the play code your grown-up gave you to start your learning adventure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlayEntry,
});

function PlayEntry() {
  const { code } = Route.useSearch();
  const [session, setSession] = useState<PlayPass | undefined>(undefined);
  const [error, setError] = useState<"invalid" | "expired" | undefined>(undefined);
  const [input, setInput] = useState("");
  const [tried, setTried] = useState(false);

  // Redeem a code arriving via /play?code=… exactly once, client-side only.
  useEffect(() => {
    if (!code || tried) return;
    setTried(true);
    const r = redeemPlayPass(code);
    if (r.ok) setSession(r.pass);
    else setError(r.reason);
  }, [code, tried]);

  if (session) {
    return <KidsMode
      child={session.child}
      onExit={() => { toast("Play time finished — see you tomorrow, in shaa Allah"); setSession(undefined); }}
      onEarn={(stars) => { import("@/components/playpass").then((m) => m.creditPassProgress(session.code, stars)); }}
    />;
  }

  const submit = () => {
    setError(undefined);
    const r = redeemPlayPass(input);
    if (r.ok) setSession(r.pass);
    else setError(r.reason);
  };

  return <div className="flex min-h-screen flex-col bg-primary">
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md iq-rise">
        <div className="border-2 border-foreground bg-background p-6 text-center shadow-brutal sm:p-8">
          <span className="mx-auto grid size-16 place-items-center border-2 border-foreground bg-primary text-3xl shadow-brutal-sm">🌟</span>
          <h1 className="mt-5 font-serif text-4xl leading-tight">IlmStation Kids</h1>
          <p className="mt-2 text-muted-foreground">Enter the play code your grown-up gave you.</p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && input.trim() && submit()}
            maxLength={7}
            placeholder="ABC-123"
            aria-label="Play code"
            className="mt-6 h-16 w-full border-2 border-foreground bg-background text-center font-serif text-3xl tracking-[0.2em] outline-none placeholder:text-muted-foreground/40 focus:shadow-brutal-sm sm:text-4xl sm:tracking-[0.3em]"
          />
          {error && <p role="alert" className="mt-3 border-2 border-foreground bg-muted p-3 text-sm font-semibold">
            {error === "expired"
              ? "This play pass has ended. Ask your grown-up for a new one."
              : "That code didn’t work. Check it with your grown-up and try again."}
          </p>}
          <Button size="lg" className="mt-5 w-full" disabled={!input.trim()} onClick={submit}><Sparkles /> Let’s play!</Button>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            A play pass lasts 60 minutes and only opens Kids Mode — never the grown-up app. Your parent can end it at any time.
          </p>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4" /> No chat · no links · guardian exit only</p>
      </div>
    </div>
  </div>;
}
