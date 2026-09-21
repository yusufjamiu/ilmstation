import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, Card, Mono, Pill, SectionTitle, Segmented, Toggle } from "@/components/kit";
import { SURAHS, TAJWEED_RULES, versesFor } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hifz/session")({
  validateSearch: (search: Record<string, unknown>): { surah: number } => ({
    surah: Number(search.surah ?? 112),
  }),
  head: () => ({
    meta: [
      { title: "Hifz session — IlmStation" },
      { name: "description", content: "Visible, Gapped, Ghost and Hidden view modes with Tajweed colouring and audio control." },
      { property: "og:title", content: "Hifz session — IlmStation" },
      { property: "og:description", content: "Got it, or need practice?" },
    ],
  }),
  component: HifzSession,
});

type View = "visible" | "gapped" | "ghost" | "hidden";

function renderVerse(text: string, view: View, tajweed: boolean) {
  const words = text.split(" ");
  return words.map((w, i) => {
    const hideGapped = view === "gapped" && i % 3 === 1;
    const rule = TAJWEED_RULES[i % TAJWEED_RULES.length];
    if (view === "hidden") return null;
    return (
      <span
        key={`${w}-${i}`}
        className={cn(
          "inline-block px-1",
          view === "ghost" && "opacity-25",
          hideGapped && "brutal-flat mx-1 min-w-14 rounded-r4 bg-field text-transparent select-none",
        )}
        style={tajweed && !hideGapped && view !== "ghost" ? { color: rule.color } : undefined}
      >
        {hideGapped ? "____" : w}
      </span>
    );
  });
}

/** P19 Hifz Session */
function HifzSession() {
  const { surah } = Route.useSearch();
  const { s, set } = useApp();
  const navigate = useNavigate();
  const meta = SURAHS.find((x) => x.num === surah) ?? SURAHS[7];
  const verses = versesFor(surah);

  const [i, setI] = useState(0);
  const [view, setView] = useState<View>("visible");
  const [tajweed, setTajweed] = useState(false);
  const [speed, setSpeed] = useState("1");
  const [loop, setLoop] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sheikh, setSheikh] = useState("Al-Husary");
  const [reviewed, setReviewed] = useState<string[]>([]);

  const v = verses[i];
  const key = `${surah}:${v.n}`;

  const respond = (strong: boolean) => {
    const marked = [...reviewed, key];
    setReviewed(marked);
    set({
      hifzStrong: strong ? Array.from(new Set([...s.hifzStrong, key])) : s.hifzStrong,
      hifzPractice: strong
        ? s.hifzPractice.filter((x) => x !== key)
        : Array.from(new Set([...s.hifzPractice, key])),
    });
    if (i + 1 >= verses.length) {
      navigate({
        to: "/hifz/complete",
        search: { surah, reviewed: marked.length, strong: strong ? 1 : 0 },
      });
      return;
    }
    setI(i + 1);
  };

  return (
    <AppShell
      back={{ to: "/hifz", label: "Surah list" }}
      title={`${meta.name} · ${meta.arabic}`}
      subtitle={`Verse ${v.n} of ${verses.length} · Juz ${meta.juz}`}
    >
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: "visible", label: "Visible" },
          { value: "gapped", label: "Gapped" },
          { value: "ghost", label: "Ghost" },
          { value: "hidden", label: "Hidden" },
        ]}
      />

      <Card className="mt-4 rounded-r20">
        <div className="flex items-center justify-between gap-2">
          <Pill tone="ink">
            {surah}:{v.n}
          </Pill>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-black uppercase">Tajweed</span>
            <Toggle on={tajweed} onChange={setTajweed} label="Tajweed colouring" />
          </div>
        </div>

        <div
          lang="ar"
          dir="rtl"
          className="arabic mt-4 min-h-24 text-center text-[32px] leading-[2]"
        >
          {view === "hidden" ? (
            <span className="text-[18px] font-semibold text-muted">
              Recite from memory, then reveal
            </span>
          ) : (
            renderVerse(v.arabic, view, tajweed)
          )}
        </div>

        {view === "hidden" ? (
          <Btn variant="outline" full className="mt-3" onClick={() => setView("visible")}>
            👁 Reveal the verse
          </Btn>
        ) : null}

        <div className="mt-4 border-t border-border/20 pt-3">
          <Mono className="text-[13px] font-bold text-ink2">{v.translit}</Mono>
          <p className="mt-1 text-[15px] font-semibold">{v.translation}</p>
        </div>

        {tajweed ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {TAJWEED_RULES.map((r) => (
              <span
                key={r.name}
                className="brutal-sm rounded-rf px-2.5 py-1 text-[11px] font-black"
                style={{ background: r.color }}
              >
                {r.name} · {r.note}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      {/* Audio controls */}
      <Card className="mt-4">
        <SectionTitle>Audio</SectionTitle>
        <div className="flex flex-wrap items-center gap-3">
          <Btn variant={playing ? "green" : "primary"} onClick={() => setPlaying(!playing)}>
            {playing ? "⏸ Pause" : "▶️ Play"}
          </Btn>
          <div className="flex-1 min-w-40">
            <Segmented
              value={speed}
              onChange={setSpeed}
              options={[
                { value: "0.75", label: "0.75×" },
                { value: "1", label: "1×" },
                { value: "1.5", label: "1.5×" },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-black uppercase">Loop</span>
            <Toggle on={loop} onChange={setLoop} label="Loop verse" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Al-Husary", "Al-Minshawi", "Al-Afasy"].map((sh) => (
            <button key={sh} onClick={() => setSheikh(sh)}>
              <Pill tone={sheikh === sh ? "yellow" : "field"}>🎙 {sh}</Pill>
            </button>
          ))}
        </div>
        {playing ? (
          <p className="mono mt-3 text-[11px] font-bold tracking-widest text-ink2 uppercase">
            Playing {sheikh} at {speed}× {loop ? "· looping" : ""}
          </p>
        ) : null}
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Btn variant="green" size="lg" full onClick={() => respond(true)}>
          Got it ✓
        </Btn>
        <Btn variant="danger" size="lg" full onClick={() => respond(false)}>
          Need practice 🔁
        </Btn>
      </div>

      <p className="mono mt-3 text-center text-[11px] font-bold tracking-widest text-ink2 uppercase">
        {reviewed.length} of {verses.length} verses reviewed this session
      </p>
    </AppShell>
  );
}
