import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { auth } from "@/lib/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { naira } from "./store";
import { Kpi, Page, Panel, Pill, useAudit } from "./ui";
import type { Section } from "./shell";

type Stats = {
  total: number; newWeek: number; online: number; learnersToday: number;
  zones: { kids: number; youth: number; adult: number }; managed: number; families: number; reports: number; books: number;
  premium: { paid: number; trial: number; other: number }; revenue: Record<string, number>;
  signups: { day: string; count: number }[];
  recentPays: { email: string; amount: number; currency: string; planId: string; at: number }[];
  recentUsers: { name: string; email: string; created: number }[];
  quizTopics: { topic: string; plays: number }[];
};
const lineConfig = { count: { label: "New sign-ups", color: "var(--secondary)" } } satisfies ChartConfig;
const barConfig = { count: { label: "Users", color: "var(--secondary)" } } satisfies ChartConfig;
const quizConfig = { plays: { label: "Quiz plays", color: "var(--secondary)" } } satisfies ChartConfig;
const when = (t: number) => (t ? new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

async function loadStats(): Promise<Stats | { error: string }> {
  const u = auth.currentUser;
  if (!u) return { error: "Log in first" };
  try {
    const r = await fetch("/api/admin-stats", { headers: { authorization: `Bearer ${await u.getIdToken()}` } });
    return (await r.json()) as Stats | { error: string };
  } catch { return { error: "Couldn't load the numbers. Check your connection." }; }
}

export function Dashboard({ go }: { go: (s: Section) => void }) {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { log } = useAudit();
  const refresh = () => {
    setBusy(true); setErr("");
    void loadStats().then((r) => { if ("error" in r) setErr(r.error); else setS(r); }).finally(() => setBusy(false));
  };
  useEffect(() => onAuthStateChanged(auth, (u) => { if (u) refresh(); }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const actions = <Button variant="outline" disabled={busy} onClick={refresh}><RefreshCw className={busy ? "animate-spin" : ""} /> Refresh</Button>;
  if (!s) return <Page eyebrow="Overview · App + Web" title="Dashboard" actions={actions}>
    <p className="text-sm text-muted-foreground">{err || "Loading the numbers…"}</p>
  </Page>;

  const zones = [{ zone: "Kids", count: s.zones.kids }, { zone: "Teens", count: s.zones.youth }, { zone: "Adults", count: s.zones.adult }];
  const ngn = s.revenue.NGN ?? 0;
  const usd = s.revenue.USD ?? 0;
  const premiumTotal = s.premium.paid + s.premium.trial + s.premium.other;

  return <Page eyebrow="Overview · App + Web" title="Dashboard" actions={actions}>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Total users" value={s.total.toLocaleString()} note={`+${s.newWeek} this week`} />
      <Kpi label="Online (24h)" value={s.online.toLocaleString()} note={`${s.learnersToday} earned XP today`} tone="primary" />
      <Kpi label="Premium now" value={premiumTotal.toLocaleString()} note={`${s.premium.paid} paid · ${s.premium.trial} on trial`} />
      <Kpi label="Revenue this month" value={naira(ngn)} note={usd ? `+ $${usd.toLocaleString()}` : (s.recentPays.length ? "from Paystack" : "no payments yet")} tone="secondary" />
    </div>

    {s.reports > 0 && <div className="mt-5 border-2 border-foreground bg-muted p-3">
      <button onClick={() => go("community")} className="flex w-full items-center justify-between gap-2 border-2 border-foreground bg-background px-3 py-2 text-left text-sm font-semibold"><span>{s.reports} report{s.reports === 1 ? "" : "s"} to review</span><Pill value="open" /></button>
    </div>}

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Panel title="New sign-ups" tag="Last 14 days">
        <ChartContainer config={lineConfig} className="aspect-auto h-64 w-full">
          <LineChart data={s.signups} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.25} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ChartContainer>
      </Panel>
      <Panel title="Users by zone" tag="Profiles">
        <ChartContainer config={barConfig} className="aspect-auto h-64 w-full">
          <BarChart data={zones} layout="vertical" margin={{ left: 4, right: 12 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="zone" tickLine={false} axisLine={false} width={64} />
            <ChartTooltip cursor={{ fillOpacity: 0.15 }} content={<ChartTooltipContent hideIndicator />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ChartContainer>
      </Panel>
    </div>

    <Panel title="Quiz plays by topic" tag="This month" className="mt-5">
      {s.quizTopics?.length ? <ChartContainer config={quizConfig} className="aspect-auto h-64 w-full">
        <BarChart data={s.quizTopics} layout="vertical" margin={{ left: 4, right: 12 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="topic" tickLine={false} axisLine={false} width={140} />
          <ChartTooltip cursor={{ fillOpacity: 0.15 }} content={<ChartTooltipContent hideIndicator />} />
          <Bar dataKey="plays" fill="var(--color-plays)" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ChartContainer> : <p className="text-sm text-muted-foreground">No quiz plays recorded yet this month. It fills up as people play.</p>}
    </Panel>

    <div className="mt-5 grid gap-5 lg:grid-cols-3">
      <Panel title="Learning" tag="App">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {([["Earned XP today", s.learnersToday], ["Children’s accounts", s.managed], ["Family plans", s.families], ["Books published", s.books]] as const).map(([l, v]) => <div key={l} className="border-2 border-foreground p-3"><dt className="text-xs uppercase text-muted-foreground">{l}</dt><dd className="mt-1 font-serif text-2xl tabular-nums">{v.toLocaleString()}</dd></div>)}
        </dl>
      </Panel>
      <Panel title="Newest sign-ups" tag={`${s.newWeek} this week`} actions={<Button size="sm" variant="outline" onClick={() => go("users")}>All users</Button>}>
        {s.recentUsers.length ? <ul className="grid gap-2 text-sm">{s.recentUsers.map((u, i) => <li key={i} className="flex justify-between gap-2"><span className="min-w-0 truncate"><b>{u.name || "—"}</b> <span className="text-muted-foreground">{u.email}</span></span><span className="shrink-0 tabular-nums text-muted-foreground">{when(u.created)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No sign-ups yet.</p>}
      </Panel>
      <Panel title="Latest payments" tag="Paystack">
        {s.recentPays.length ? <ul className="grid gap-2 text-sm">{s.recentPays.map((p, i) => <li key={i} className="flex justify-between gap-2"><span className="min-w-0 truncate">{p.email || "—"} <span className="text-muted-foreground">· {p.planId}</span></span><span className="shrink-0 font-semibold tabular-nums">{p.currency === "USD" ? `$${p.amount.toLocaleString()}` : naira(p.amount)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No payments yet.</p>}
      </Panel>
    </div>

    <Panel title="Recent admin activity" className="mt-5" actions={<Button size="sm" variant="outline" onClick={() => go("settings")}>Full log</Button>}>
      <ul className="divide-y divide-foreground/30 text-sm">{log.slice(0, 6).map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2"><span><b>{l.actor}</b> · {l.action}</span><span className="text-muted-foreground tabular-nums">{l.at}</span></li>)}</ul>
    </Panel>
  </Page>;
}
