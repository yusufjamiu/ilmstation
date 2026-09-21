import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Input, Mono, Pill, SectionTitle } from "@/components/kit";
import { ILMBOT_ANSWERS, ILMBOT_SUGGESTIONS } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ilmbot")({
  head: () => ({
    meta: [
      { title: "IlmBot — ask about Islam, with sources — IlmStation" },
      { name: "description", content: "A study companion that answers with citations and refers fiqh rulings to qualified scholars." },
      { property: "og:title", content: "IlmBot — IlmStation" },
      { property: "og:description", content: "Every answer carries its source." },
    ],
  }),
  component: IlmBot,
});

interface Msg {
  id: number;
  role: "user" | "bot";
  text: string;
  source?: string;
}

const GREETING: Msg = {
  id: 0,
  role: "bot",
  text: "As-salamu alaykum. I'm IlmBot — a study companion, not a mufti. Ask me about Aqeedah, Hadith, Seerah, Quranic Arabic or how to structure your learning. For personal fiqh rulings I'll point you to a qualified scholar.",
  source: "IlmBot · scope notice",
};

const FALLBACK = {
  text: "I don't have a sourced answer for that yet. Try rephrasing it, or pick one of the suggested questions below — those are covered in depth. You can also search the Library, where every article is referenced.",
  source: "IlmBot · no matching reference",
};

/** L03 IlmBot Chat · L03b Answer with citation */
function IlmBot() {
  const { s, set, award } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const limit = s.premium ? Infinity : 10;
  const used = s.ilmbotUsed;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || typing || remaining === 0) return;
    const id = Date.now();
    setMsgs((m) => [...m, { id, role: "user", text: q }]);
    setDraft("");
    setTyping(true);
    set({ ilmbotUsed: used + 1 });

    const lower = q.toLowerCase();
    const hit = ILMBOT_ANSWERS.find((a) => a.match.some((k) => lower.includes(k)));
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { id: id + 1, role: "bot", text: hit?.text ?? FALLBACK.text, source: hit?.source ?? FALLBACK.source },
      ]);
      setTyping(false);
      if (hit) award(10, "hikmah", "IlmBot study question");
    }, 900);
  };

  return (
    <AppShell title="IlmBot" subtitle="Sourced answers · not a fatwa service">
      <Card tone="field" className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="ink">🤖 Study companion</Pill>
          {limit === Infinity ? (
            <Pill tone="green">Premium · unlimited questions</Pill>
          ) : (
            <Pill tone={remaining > 3 ? "yellow" : "pink"}>
              <Mono>{remaining}</Mono> of 10 daily questions left
            </Pill>
          )}
          <Pill tone="surface">+10 Hikmah per sourced answer</Pill>
        </div>
      </Card>

      <div className="space-y-3">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "brutal max-w-[85%] rounded-r16 px-4 py-3",
                m.role === "user" ? "bg-yellow" : "bg-surface",
              )}
            >
              <p className="text-[15px] leading-relaxed font-semibold whitespace-pre-line">
                {m.text}
              </p>
              {m.source ? (
                <p className="mono mt-2 border-t border-border/20 pt-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
                  📖 {m.source}
                </p>
              ) : null}
            </div>
          </div>
        ))}
        {typing ? (
          <div className="flex justify-start">
            <div className="brutal rounded-r16 bg-surface px-4 py-3">
              <span className="mono text-[13px] font-bold text-ink2">IlmBot is checking sources…</span>
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <Card className="mt-4">
        <SectionTitle>Suggested questions</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {ILMBOT_SUGGESTIONS.map((q) => (
            <button key={q} onClick={() => ask(q)} className="press-sm text-left">
              <span className="brutal-sm block rounded-r12 bg-field px-3 py-2 text-[13px] font-bold">
                {q}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={remaining === 0 ? "Daily limit reached — upgrade for unlimited" : "Ask about Aqeedah, Hadith, Seerah…"}
          aria-label="Ask IlmBot a question"
          disabled={remaining === 0}
        />
        <Btn type="submit" size="lg" disabled={!draft.trim() || typing || remaining === 0}>
          Ask →
        </Btn>
      </form>

      {remaining === 0 ? (
        <Card tone="pink" className="mt-3">
          <p className="text-[15px] font-bold">You've used today's 10 free questions.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <BtnLink to="/store" search={{ item: "premium-week" }}>
              Get unlimited with Premium
            </BtnLink>
            <BtnLink to="/library" variant="outline">
              Read the Library instead
            </BtnLink>
          </div>
        </Card>
      ) : null}
    </AppShell>
  );
}
