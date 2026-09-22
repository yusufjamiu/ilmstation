import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Btn, BtnLink, Card, Empty, Mono, Pill, SectionTitle } from "@/components/kit";
import { ARTICLES, articleBySlug, topicById } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/library/$slug")({
  loader: ({ params }) => {
    const article = articleBySlug(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article unavailable — IlmStation" }, { name: "robots", content: "noindex" }] };
    }
    const { article } = loaderData;
    return {
      meta: [
        { title: `${article.title} — IlmStation Library` },
        { name: "description", content: article.excerpt.slice(0, 155) },
        { property: "og:title", content: `${article.title} — IlmStation` },
        { property: "og:description", content: article.excerpt.slice(0, 155) },
      ],
    };
  },
  notFoundComponent: ArticleMissing,
  component: ArticleReader,
});

function ArticleMissing() {
  return (
    <AppShell title="Article unavailable">
      <Empty
        icon="📄"
        title="We couldn't find that article"
        body="The link may be old. Browse the Library and pick another sourced read."
        action={<BtnLink to="/library">Back to Library</BtnLink>}
      />
    </AppShell>
  );
}

/** L02 Article Reader */
function ArticleReader() {
  const { article } = Route.useLoaderData();
  const { s, toggleBookmark, markArticleRead } = useApp();
  const [size, setSize] = useState(17);
  const t = topicById(article.topic);
  const read = s.readArticles.includes(article.slug);
  const saved = s.bookmarks.includes(article.slug);
  const related = ARTICLES.filter((a) => a.topic === article.topic && a.slug !== article.slug).slice(0, 3);

  return (
    <AppShell back={{ to: "/library", label: "Library" }} title={article.title}>
      <Card tone="yellow" className="rounded-r20">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="ink">
            {t.icon} {t.name}
          </Pill>
          <Pill tone="surface">{article.minutes} min read</Pill>
          {read ? <Pill tone="green">Completed ✓</Pill> : <Pill tone="surface">+30 Ilm on finish</Pill>}
        </div>
        <Arabic size="xl" className="mt-3">
          {article.arabic}
        </Arabic>
        <p className="mt-2 text-[15px] font-bold">{article.excerpt}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn variant="ink" size="sm" onClick={() => toggleBookmark(article.slug)}>
            {saved ? "🔖 Saved" : "🔖 Bookmark"}
          </Btn>
          <Btn variant="outline" size="sm" onClick={() => setSize(Math.min(22, size + 2))}>
            A+
          </Btn>
          <Btn variant="outline" size="sm" onClick={() => setSize(Math.max(15, size - 2))}>
            A−
          </Btn>
        </div>
      </Card>

      <article className="mt-4 space-y-4" style={{ fontSize: size }}>
        {article.body.map((block, i) => (
          <div key={i}>
            {block.heading ? (
              <h2 className="mt-4 text-[22px] font-black tracking-tight">{block.heading}</h2>
            ) : null}
            {block.text ? (
              <p className="mt-2 leading-relaxed font-medium text-ink2">{block.text}</p>
            ) : null}
            {block.arabic ? (
              <Card tone="field" className="mt-3 rounded-r16">
                <p lang="ar" dir="rtl" className="arabic text-center text-[24px] leading-loose">
                  {block.arabic}
                </p>
                {block.translation ? (
                  <p className="mt-2 text-center text-[15px] font-bold">“{block.translation}”</p>
                ) : null}
              </Card>
            ) : null}
          </div>
        ))}
      </article>

      <Card className="mt-5">
        <SectionTitle>Finished reading?</SectionTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Btn
            size="lg"
            full
            variant={read ? "green" : "primary"}
            onClick={() => markArticleRead(article.slug)}
            disabled={read}
          >
            {read ? "✓ Marked complete" : "Mark as read · +30 Ilm"}
          </Btn>
          <BtnLink
            to="/play/difficulty"
            search={{ topic: article.topic, count: 10 }}
            variant="outline"
            size="lg"
            full
          >
            🎯 Quiz me on this
          </BtnLink>
        </div>
        <Mono className="mt-3 block text-[11px] font-bold tracking-widest text-ink2 uppercase">
          Articles read: {s.articlesRead}
        </Mono>
      </Card>

      {related.length ? (
        <>
          <SectionTitle className="mt-5">More in {t.name}</SectionTitle>
          <div className="grid gap-3 md:grid-cols-3">
            {related.map((r) => (
              <Card key={r.slug} className="rounded-r16">
                <h3 className="text-[15px] leading-tight font-black">{r.title}</h3>
                <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                  {r.minutes} min
                </Mono>
                <BtnLink
                  to="/library/$slug"
                  params={{ slug: r.slug }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Read
                </BtnLink>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
