import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Arabic, Btn, Card, Input, Modal, Mono, Pill, Segmented } from "@/components/kit";
import { TOPICS, type Topic } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/play/topics")({
  head: () => ({
    meta: [
      { title: "Browse topics — IlmStation" },
      { name: "description", content: "Eight Islamic topics from Aqeedah to Dua. Filter by category and start a quiz." },
      { property: "og:title", content: "Browse topics — IlmStation" },
      { property: "og:description", content: "Pick your topic, pick your difficulty." },
    ],
  }),
  component: TopicBrowser,
});

type Cat = "all" | Topic["category"];

/** P02 Topic Browser */
function TopicBrowser() {
  const { s } = useApp();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Cat>("all");
  const [query, setQuery] = useState("");
  const [locked, setLocked] = useState<Topic | null>(null);

  const list = TOPICS.filter(
    (t) =>
      (cat === "all" || t.category === cat) &&
      (t.name.toLowerCase().includes(query.toLowerCase()) || t.arabic.includes(query)),
  );

  const open = (t: Topic) => {
    if (t.premium && !s.premium) {
      setLocked(t);
      return;
    }
    navigate({ to: "/play/difficulty", search: { topic: t.id, count: 10 } });
  };

  return (
    <AppShell back={{ to: "/play", label: "Play" }} title="Choose a topic" wide>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics in English or Arabic…"
          aria-label="Search topics"
        />
        <Segmented
          value={cat}
          onChange={setCat}
          options={[
            { value: "all", label: "All" },
            { value: "Foundations", label: "Foundations" },
            { value: "Text", label: "Text" },
            { value: "Practice", label: "Practice" },
            { value: "Language", label: "Language" },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((t) => {
          const isLocked = t.premium && !s.premium;
          return (
            <button key={t.id} onClick={() => open(t)} className="text-left">
              <Card
                tone={isLocked ? "field" : "surface"}
                className="press h-full rounded-r16"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[36px]" aria-hidden>
                    {t.icon}
                  </span>
                  {isLocked ? <Pill tone="ink">🔒 Premium</Pill> : <Pill tone="green">Free</Pill>}
                </div>
                <h2 className="mt-2 text-[20px] font-black">{t.name}</h2>
                <Arabic size="md">{t.arabic}</Arabic>
                <p className="mt-1.5 text-[13px] font-semibold text-ink2">{t.scope}</p>
                <Mono className="mt-2 block text-[11px] font-bold text-ink2 uppercase">
                  {t.questions} questions · {t.category}
                </Mono>
              </Card>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 text-center text-[15px] font-bold text-ink2">
          No topic matches “{query}”.
        </p>
      ) : null}

      <Modal open={!!locked} onClose={() => setLocked(null)} title="Premium topic">
        <p className="text-[15px] font-semibold text-ink2">
          <strong className="text-ink">{locked?.name}</strong> is an advanced topic. Unlock it with
          Premium, or buy a Topic Pack for 500 points in the Points Store.
        </p>
        <div className="mt-4 space-y-2">
          <Link to="/store" onClick={() => setLocked(null)}>
            <Btn full size="lg">
              🛒 Open Points Store
            </Btn>
          </Link>
          <Btn variant="outline" full onClick={() => setLocked(null)}>
            Maybe later
          </Btn>
        </div>
      </Modal>
    </AppShell>
  );
}
