import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, BtnLink, Card, Empty, Input, Mono, Pill, SectionTitle, Segmented } from "@/components/kit";
import { ARTICLES, TOPICS, topicById, type TopicId } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library/")({
  head: () => ({
    meta: [
      { title: "Library — referenced Islamic reading — IlmStation" },
      { name: "description", content: "Short, sourced articles on Aqeedah, Hadith, Seerah, Fiqh, Quran and Arabic — every claim referenced." },
      { property: "og:title", content: "Library — IlmStation" },
      { property: "og:description", content: "Read it, then quiz yourself on it." },
    ],
  }),
  component: Library,
});

/** L01 Library Home */
function Library() {
  const { s } = useApp();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<"all" | TopicId>("all");
  const [sort, setSort] = useState<"featured" | "short" | "unread">("featured");

  let list = ARTICLES.filter(
    (a) =>
      (topic === "all" || a.topic === topic) &&
      (a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(query.toLowerCase())),
  );
  if (sort === "short") list = [...list].sort((a, b) => a.minutes - b.minutes);
  if (sort === "unread") list = list.filter((a) => !s.readArticles.includes(a.slug));
  if (sort === "featured") list = [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

  const featured = ARTICLES.find((a) => a.featured)!;

  return (
    <AppShell title="Library" subtitle="Every article referenced — read, then test yourself." wide>
      <Card tone="green" className="mb-5 rounded-r20">
        <Pill tone="ink">Featured</Pill>
        <h2 className="mt-2 text-[24px] leading-tight font-black">{featured.title}</h2>
        <Arabic size="lg">{featured.arabic}</Arabic>
        <p className="mt-2 max-w-2xl text-[15px] font-semibold text-ink2">{featured.excerpt}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <BtnLink to="/library/$slug" params={{ slug: featured.slug }} variant="ink">
            Read now · {featured.minutes} min
          </BtnLink>
          <BtnLink to="/bookmarks" variant="outline">
            🔖 Bookmarks ({s.bookmarks.length})
          </BtnLink>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          aria-label="Search articles"
        />
        <Segmented
          value={sort}
          onChange={setSort}
          options={[
            { value: "featured", label: "Featured" },
            { value: "short", label: "Quickest" },
            { value: "unread", label: "Unread" },
          ]}
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setTopic("all")}>
          <Pill tone={topic === "all" ? "yellow" : "field"}>All topics</Pill>
        </button>
        {TOPICS.map((t) => (
          <button key={t.id} onClick={() => setTopic(t.id)} className="shrink-0">
            <Pill tone={topic === t.id ? "yellow" : "field"}>
              {t.icon} {t.name}
            </Pill>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-5">
          <Empty
            icon="📚"
            title="Nothing matches that"
            body="Try a different topic or clear the search — there are articles across all eight topics."
            action={
              <BtnLink to="/library" onClick={() => { setQuery(""); setTopic("all"); setSort("featured"); }}>
                Reset filters
              </BtnLink>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => {
            const t = topicById(a.topic);
            const read = s.readArticles.includes(a.slug);
            return (
              <BtnLink
                key={a.slug}
                to="/library/$slug"
                params={{ slug: a.slug }}
                variant="outline"
                className="!block !p-0 !rounded-r16"
              >
                <Card
                  tone={read ? "field" : "surface"}
                  className={cn("h-full border-0 shadow-none rounded-r16 text-left")}
                >
                  <div className="flex items-center justify-between">
                    <Pill tone="field">
                      {t.icon} {t.name}
                    </Pill>
                    <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                      {a.minutes} min
                    </Mono>
                  </div>
                  <h3 className="mt-2 text-[18px] leading-tight font-black">{a.title}</h3>
                  <Arabic size="sm" className="text-ink2">
                    {a.arabic}
                  </Arabic>
                  <p className="mt-2 line-clamp-3 text-[13px] font-semibold text-ink2 normal-case">
                    {a.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {read ? <Pill tone="green">Read ✓</Pill> : <Pill tone="yellow">+30 XP</Pill>}
                    {s.bookmarks.includes(a.slug) ? <Pill tone="pink">🔖 Saved</Pill> : null}
                  </div>
                </Card>
              </BtnLink>
            );
          })}
        </div>
      )}

      <Card tone="field" className="mt-5">
        <SectionTitle>Reading rewards</SectionTitle>
        <p className="text-[15px] font-semibold text-ink2">
          Finishing an article awards 30 Ilm points. You've read {s.articlesRead} of{" "}
          {ARTICLES.length}.
        </p>
      </Card>
    </AppShell>
  );
}
