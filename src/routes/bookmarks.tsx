import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Empty, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { articleBySlug, WISDOM } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — your saved articles and narrations — IlmStation" },
      { name: "description", content: "Everything you saved from the Library and Daily Wisdom, in one place." },
      { property: "og:title", content: "Bookmarks — IlmStation" },
      { property: "og:description", content: "Saved for revision." },
    ],
  }),
  component: Bookmarks,
});

/** L05 Bookmarks */
function Bookmarks() {
  const { s, toggleBookmark } = useApp();
  const [tab, setTab] = useState<"all" | "articles" | "wisdom">("all");

  const articles = s.bookmarks.map(articleBySlug).filter(Boolean);
  const wisdoms = s.bookmarks
    .filter((b) => b.startsWith("wisdom-"))
    .map((b) => WISDOM.find((w) => `wisdom-${w.id}` === b))
    .filter(Boolean);

  const empty =
    (tab === "all" && articles.length + wisdoms.length === 0) ||
    (tab === "articles" && articles.length === 0) ||
    (tab === "wisdom" && wisdoms.length === 0);

  return (
    <AppShell title="Bookmarks" subtitle="Saved articles and narrations for revision.">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "all", label: `All (${articles.length + wisdoms.length})` },
          { value: "articles", label: `Articles (${articles.length})` },
          { value: "wisdom", label: `Wisdom (${wisdoms.length})` },
        ]}
      />

      {empty ? (
        <div className="mt-5">
          <Empty
            icon="🔖"
            title="Nothing saved yet"
            body="Tap the bookmark button on any article or Daily Wisdom card and it will appear here."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <BtnLink to="/library">Browse Library</BtnLink>
                <BtnLink to="/wisdom" variant="outline">
                  Daily Wisdom
                </BtnLink>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {tab !== "wisdom" &&
            articles.map((a) =>
              a ? (
                <Card key={a.slug} className="rounded-r16">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-[18px] leading-tight font-black">{a.title}</h3>
                      <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                        Article · {a.minutes} min
                      </Mono>
                      <p className="mt-1 line-clamp-2 text-[13px] font-semibold text-ink2">
                        {a.excerpt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <BtnLink to="/library/$slug" params={{ slug: a.slug }} size="sm">
                        Read
                      </BtnLink>
                      <Btn variant="outline" size="sm" onClick={() => toggleBookmark(a.slug)}>
                        Remove
                      </Btn>
                    </div>
                  </div>
                </Card>
              ) : null,
            )}

          {tab !== "articles" &&
            wisdoms.map((w) =>
              w ? (
                <Card key={w.id} tone="field" className="rounded-r16">
                  <Pill tone={w.kind === "Ayah" ? "green" : "surface"}>{w.kind}</Pill>
                  <p lang="ar" dir="rtl" className="arabic mt-2 text-right text-[22px] leading-loose">
                    {w.arabic}
                  </p>
                  <p className="mt-2 text-[15px] font-bold">“{w.translation}”</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                      📖 {w.source}
                    </Mono>
                    <Btn variant="outline" size="sm" onClick={() => toggleBookmark(`wisdom-${w.id}`)}>
                      Remove
                    </Btn>
                  </div>
                </Card>
              ) : null,
            )}
        </div>
      )}

      <Card tone="field" className="mt-5">
        <SectionTitle>Tip</SectionTitle>
        <p className="text-[15px] font-semibold text-ink2">
          Bookmarks are stored on this device only, so they stay private and work offline.
        </p>
      </Card>
    </AppShell>
  );
}
