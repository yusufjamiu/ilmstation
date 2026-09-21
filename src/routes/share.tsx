import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { BADGES, SHARE_THEMES, WISDOM } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/share")({
  validateSearch: (search: Record<string, unknown>): { kind?: string } => ({
    kind: String(search.kind ?? "progress"),
  }),
  head: () => ({
    meta: [
      { title: "Share cards — IlmStation" },
      { name: "description", content: "Build a share card for your progress, a badge, your rank, a narration or an invite." },
      { property: "og:title", content: "Share cards — IlmStation" },
      { property: "og:description", content: "Five card types, five themes." },
    ],
  }),
  component: ShareCards,
});

type Kind = "progress" | "badge" | "rank" | "wisdom" | "invite" | "quest";

/** SH01 Share Card Builder · SH02 Card Preview */
function ShareCards() {
  const { kind: initial } = Route.useSearch();
  const { s, level, totalPoints } = useApp();
  const [kind, setKind] = useState<Kind>((initial as Kind) ?? "progress");
  const [theme, setTheme] = useState(SHARE_THEMES[0].id);
  const [showArabic, setShowArabic] = useState(true);
  const [copied, setCopied] = useState(false);

  const t = SHARE_THEMES.find((x) => x.id === theme) ?? SHARE_THEMES[0];
  const badge = BADGES.find((b) => s.badges.includes(b.id)) ?? BADGES[1];
  const wisdom = WISDOM[0];

  const card = {
    progress: {
      title: `${s.xp} XP earned`,
      arabic: level.arabic,
      lines: [
        `Level ${level.level} · ${level.name}`,
        `${s.streak}-day streak · ${totalPoints} points`,
        `${s.quizzesPlayed} quizzes completed`,
      ],
      caption: "My IlmStation progress this week",
    },
    badge: {
      title: `${badge.icon} ${badge.name}`,
      arabic: badge.arabic,
      lines: [badge.description, `+${badge.xp} XP`, badge.condition],
      caption: "New badge unlocked on IlmStation",
    },
    rank: {
      title: "Top 3 this week",
      arabic: "الْمُتَصَدِّرُون",
      lines: [`${s.xp} XP total`, `Level ${level.level}`, `🔥 ${s.streak}-day streak`],
      caption: "My weekly leaderboard rank",
    },
    wisdom: {
      title: wisdom.translation,
      arabic: wisdom.arabic,
      lines: [wisdom.translit, `📖 ${wisdom.source}`],
      caption: "Today's wisdom from IlmStation",
    },
    invite: {
      title: "Learn your Deen with me",
      arabic: "طَلَبُ الْعِلْم",
      lines: ["Join IlmStation free", "We both get 50 XP", "ilmstation.app/invite/seeker"],
      caption: "Come learn with me on IlmStation",
    },
    quest: {
      title: "Quest complete",
      arabic: "أَتْمَمْتُ الرِّحْلَة",
      lines: [`Level ${level.level} · ${level.name}`, `${s.xp} XP`, "3 / 3 stages"],
      caption: "Another quest finished on IlmStation",
    },
  }[kind];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${card.caption} — ${card.lines.join(" · ")}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AppShell title="Share cards" subtitle="Build a card, pick a theme, share it." wide>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <Card>
            <SectionTitle>Card type</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "progress", label: "📈 Progress" },
                  { id: "badge", label: "🏅 Badge" },
                  { id: "rank", label: "🏆 Rank" },
                  { id: "wisdom", label: "☪️ Wisdom" },
                  { id: "quest", label: "🗺️ Quest" },
                  { id: "invite", label: "🤝 Invite" },
                ] as { id: Kind; label: string }[]
              ).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setKind(o.id)}
                  aria-pressed={kind === o.id}
                  className={cn(
                    "brutal-sm press-sm rounded-r12 px-3 py-2.5 text-[15px] font-black",
                    kind === o.id ? "bg-yellow" : "bg-field",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="mt-4">
            <SectionTitle>Theme</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {SHARE_THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  aria-pressed={theme === th.id}
                  className={cn(
                    "brutal-sm press-sm flex items-center gap-2 rounded-rf px-3 py-2 text-[13px] font-black",
                    theme === th.id ? "ring-4 ring-ink" : "",
                  )}
                  style={{ background: th.bg, color: th.fg }}
                >
                  {th.name}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Segmented
                value={showArabic ? "on" : "off"}
                onChange={(v) => setShowArabic(v === "on")}
                options={[
                  { value: "on", label: "Show Arabic" },
                  { value: "off", label: "English only" },
                ]}
              />
            </div>
          </Card>

          <Card className="mt-4">
            <SectionTitle>Caption</SectionTitle>
            <p className="text-[15px] font-semibold text-ink2">{card.caption}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn onClick={copy}>{copied ? "✓ Caption copied" : "🔗 Copy caption"}</Btn>
              <Btn
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(card.caption)}`,
                    "_blank",
                    "noopener",
                  )
                }
              >
                𝕏 Post
              </Btn>
              <Btn
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(card.caption)}`,
                    "_blank",
                    "noopener",
                  )
                }
              >
                💬 WhatsApp
              </Btn>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-24">
          <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
            Preview · 1080 × 1350
          </p>
          <div
            className="brutal flex aspect-[4/5] flex-col justify-between rounded-r24 p-6"
            style={{ background: t.bg, color: t.fg }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-black">IlmStation</span>
              <span className="mono text-[11px] font-bold tracking-widest uppercase">
                {kind}
              </span>
            </div>
            <div>
              {showArabic ? (
                <p lang="ar" dir="rtl" className="arabic text-right text-[26px] leading-loose">
                  {card.arabic}
                </p>
              ) : null}
              <h2 className="mt-2 text-[26px] leading-tight font-black">{card.title}</h2>
              <ul className="mt-3 space-y-1">
                {card.lines.map((l) => (
                  <li key={l} className="text-[15px] font-bold opacity-90">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[26px]" aria-hidden>
                {s.avatar}
              </span>
              <Mono className="text-[11px] font-bold tracking-widest uppercase">
                ilmstation.app
              </Mono>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="field">Cards render on device — nothing is uploaded</Pill>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Btn size="lg" full onClick={copy}>
              {copied ? "✓ Copied" : "📤 Share this card"}
            </Btn>
            <BtnLink to="/home" variant="outline" size="lg" full>
              Back to Home
            </BtnLink>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
