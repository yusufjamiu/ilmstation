import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Btn, BtnLink, Card, Modal, Mono, Pill, SectionTitle } from "@/components/kit";
import { CHARITIES, FRIENDS, STORE_ITEMS } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store")({
  validateSearch: (search: Record<string, unknown>): { item?: string } => ({
    item: search.item ? String(search.item) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Points Store — turn points into Sadaqah — IlmStation" },
      { name: "description", content: "Spend points on Sadaqah donations, streak freezes, Premium weeks, gifts and topic packs." },
      { property: "og:title", content: "Points Store — IlmStation" },
      { property: "og:description", content: "500 points = $1 donated to a vetted charity." },
    ],
  }),
  component: Store,
});

type Item = (typeof STORE_ITEMS)[number];

/** Q07 Points Store · Sadaqah flow */
function Store() {
  const { item: preselect } = Route.useSearch();
  const { s, set, spend, totalPoints } = useApp();
  const [open, setOpen] = useState<Item | null>(
    STORE_ITEMS.find((i) => i.id === preselect) ?? null,
  );
  const [charity, setCharity] = useState(CHARITIES[0].id);
  const [amount, setAmount] = useState(500);
  const [friend, setFriend] = useState(FRIENDS[0].id);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = (it: Item) => {
    const cost = it.id === "sadaqah" ? amount : it.cost;
    if (totalPoints < cost) {
      setError(`You need ${cost - totalPoints} more points for ${it.name}.`);
      return;
    }
    const label =
      it.id === "sadaqah"
        ? `Sadaqah — ${CHARITIES.find((c) => c.id === charity)?.name}`
        : it.id === "gift"
          ? `Gift Premium — ${FRIENDS.find((f) => f.id === friend)?.name}`
          : it.name;
    if (!spend(cost, label)) {
      setError("Something went wrong deducting points. Try again.");
      return;
    }
    if (it.id === "sadaqah") set({ donated: s.donated + cost });
    if (it.id === "freeze") set({ freezes: s.freezes + 1 });
    if (it.id === "premium-week") set({ premium: true });
    setOpen(null);
    setReceipt(
      it.id === "sadaqah"
        ? `Jazak Allahu khayran. ${cost} points became about $${(cost / 500).toFixed(2)} for ${
            CHARITIES.find((c) => c.id === charity)?.name
          }.`
        : it.id === "gift"
          ? `${FRIENDS.find((f) => f.id === friend)?.name} now has a month of Premium from you.`
          : `${it.name} applied to your account.`,
    );
  };

  return (
    <AppShell title="Points Store" subtitle="Points buy meaning, never answers." wide>
      <Card tone="ink" className="mb-5 rounded-r20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mono text-[11px] font-bold tracking-widest uppercase opacity-70">
              Available balance
            </p>
            <Mono className="text-[32px] leading-none font-bold">{totalPoints}</Mono>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="yellow">🧊 {s.freezes} freezes</Pill>
            <Pill tone="green">{s.premium ? "Premium active" : "Free plan"}</Pill>
            <BtnLink to="/wallet" variant="outline" size="sm">
              Wallet
            </BtnLink>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {STORE_ITEMS.map((it) => {
          const affordable = totalPoints >= it.cost;
          return (
            <Card
              key={it.id}
              tone={it.flagship ? "green" : "surface"}
              className={cn("flex h-full flex-col rounded-r16", it.flagship && "md:col-span-2")}
            >
              <div className="flex items-start gap-3">
                <span className="brutal-flat grid h-12 w-12 shrink-0 place-items-center rounded-rf bg-surface text-[22px]">
                  {it.icon}
                </span>
                <div className="flex-1">
                  <h3 className="text-[18px] font-black">{it.name}</h3>
                  <Mono className="text-[11px] font-bold tracking-widest text-ink2 uppercase">
                    {it.cost} pts · {it.unit}
                  </Mono>
                  <p className="mt-1 text-[13px] font-semibold text-ink2">{it.note}</p>
                </div>
              </div>
              <div className="mt-auto pt-3">
                <Btn
                  full
                  variant={it.flagship ? "ink" : affordable ? "primary" : "outline"}
                  onClick={() => {
                    setError(null);
                    setOpen(it);
                  }}
                >
                  {affordable ? (it.flagship ? "Donate now" : "Redeem") : `Need ${it.cost - totalPoints} more`}
                </Btn>
              </div>
            </Card>
          );
        })}
      </div>

      <Card tone="field" className="mt-5">
        <SectionTitle>How the Sadaqah conversion works</SectionTitle>
        <p className="text-[15px] font-semibold text-ink2">
          Every 500 points is matched to roughly $1, funded from IlmStation Premium revenue and paid to
          vetted charities monthly. You'll always see which charity your points went to.
        </p>
      </Card>

      {/* Redeem sheet */}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open ? (
          <div>
            <p className="text-[15px] font-semibold text-ink2">{open.note}</p>

            {open.id === "sadaqah" ? (
              <div className="mt-4">
                <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
                  Choose a charity
                </p>
                <ul className="space-y-2">
                  {CHARITIES.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setCharity(c.id)}
                        aria-pressed={charity === c.id}
                        className={cn(
                          "brutal-sm press-sm flex w-full items-center gap-3 rounded-r12 px-3 py-2.5 text-left",
                          charity === c.id ? "bg-yellow" : "bg-field",
                        )}
                      >
                        <span className="text-[20px]" aria-hidden>
                          {c.icon}
                        </span>
                        <span className="text-[15px] font-black">{c.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mono mt-4 mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
                  Amount
                </p>
                <div className="flex flex-wrap gap-2">
                  {[500, 1000, 2000].map((a) => (
                    <button key={a} onClick={() => setAmount(a)}>
                      <Pill tone={amount === a ? "green" : "field"}>
                        {a} pts · ${(a / 500).toFixed(0)}
                      </Pill>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {open.id === "gift" ? (
              <div className="mt-4">
                <p className="mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase">
                  Send to
                </p>
                <div className="flex flex-wrap gap-2">
                  {FRIENDS.slice(0, 4).map((f) => (
                    <button key={f.id} onClick={() => setFriend(f.id)}>
                      <Pill tone={friend === f.id ? "yellow" : "field"}>
                        {f.avatar} {f.name}
                      </Pill>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 text-[13px] font-bold text-destructive">{error}</p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Btn full onClick={() => confirm(open)}>
                Confirm · {open.id === "sadaqah" ? amount : open.cost} pts
              </Btn>
              <Btn variant="outline" full onClick={() => setOpen(null)}>
                Cancel
              </Btn>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Receipt */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Confirmed">
        <div className="text-center">
          <div className="text-[48px]" aria-hidden>
            🤲
          </div>
          <p className="mt-2 text-[15px] font-semibold">{receipt}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <BtnLink to="/wallet" full>
              View wallet
            </BtnLink>
            <Btn variant="outline" full onClick={() => setReceipt(null)}>
              Keep shopping
            </Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
