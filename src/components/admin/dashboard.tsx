import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  activity, planNames, planPrices, quizzesByTopic, seedEvents, seedPayments, seedReports, seedSponsors, seedUsers,
  type AdminEvent, type AdminUser, type Payment, type Plan, type Report, type Sponsor,
} from "./data";
import { naira, useAdminStore } from "./store";
import { Kpi, Page, Panel, Pill, useAudit } from "./ui";
import type { Section } from "./shell";

const lineConfig = { learners: { label: "Active learners", color: "var(--secondary)" } } satisfies ChartConfig;
const barConfig = { plays: { label: "Quiz plays", color: "var(--secondary)" } } satisfies ChartConfig;

export function Dashboard({ go }: { go: (s: Section) => void }) {
  const [users] = useAdminStore<AdminUser[]>("users", seedUsers);
  const [events] = useAdminStore<AdminEvent[]>("events", seedEvents);
  const [reports] = useAdminStore<Report[]>("reports", seedReports);
  const [sponsors] = useAdminStore<Sponsor[]>("sponsors", seedSponsors);
  const [payments] = useAdminStore<Payment[]>("payments", seedPayments);
  const { log } = useAudit();

  const paying = users.filter((u) => u.plan !== "free" && u.status === "active");
  const mrr = paying.reduce((s, u) => s + planPrices[u.plan], 0);
  const sponsorMonthly = sponsors.filter((s) => s.status === "active").reduce((s, x) => s + x.monthly, 0);
  const openReports = reports.filter((r) => r.status === "open").length;
  const newSponsors = sponsors.filter((s) => s.status === "new").length;
  const failed = payments.filter((p) => p.status === "failed").length;
  const kids = users.reduce((s, u) => s + u.kids, 0);
  const hifz = users.filter((u) => u.hifzJuz > 0).length;
  const upcoming = events.filter((e) => e.status === "published").sort((a, b) => a.date.localeCompare(b.date));
  const planMix = (Object.keys(planNames) as Plan[]).map((p) => ({ plan: p, count: users.filter((u) => u.plan === p).length }));
  const maxPlan = Math.max(...planMix.map((p) => p.count), 1);

  return <Page eyebrow="Overview · App + Web" title="Dashboard">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Total users" value={users.length.toLocaleString()} note={`${users.filter((u) => u.status === "active").length} active`} />
      <Kpi label="Active today" value="618" note="+2.6% vs yesterday" tone="primary" />
      <Kpi label="Subscription MRR" value={naira(mrr)} note={`${paying.length} paying accounts`} />
      <Kpi label="Sponsorship / mo" value={naira(sponsorMonthly)} note={`${sponsors.filter((s) => s.status === "active").length} active sponsors`} tone="secondary" />
    </div>

    {(openReports > 0 || newSponsors > 0 || failed > 0) && <div className="mt-5 grid gap-2 border-2 border-foreground bg-muted p-3 sm:grid-cols-3">
      {openReports > 0 && <button onClick={() => go("community")} className="flex items-center justify-between gap-2 border-2 border-foreground bg-background px-3 py-2 text-left text-sm font-semibold"><span>{openReports} chat reports to review</span><Pill value="open" /></button>}
      {newSponsors > 0 && <button onClick={() => go("sponsors")} className="flex items-center justify-between gap-2 border-2 border-foreground bg-background px-3 py-2 text-left text-sm font-semibold"><span>{newSponsors} new sponsor enquiries</span><Pill value="new" /></button>}
      {failed > 0 && <button onClick={() => go("billing")} className="flex items-center justify-between gap-2 border-2 border-foreground bg-background px-3 py-2 text-left text-sm font-semibold"><span>{failed} failed payments</span><Pill value="failed" /></button>}
    </div>}

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Panel title="Active learners" tag="Last 14 days">
        <ChartContainer config={lineConfig} className="aspect-auto h-64 w-full">
          <LineChart data={activity} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.25} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="learners" stroke="var(--color-learners)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ChartContainer>
      </Panel>
      <Panel title="Quiz plays by topic" tag="This month">
        <ChartContainer config={barConfig} className="aspect-auto h-64 w-full">
          <BarChart data={quizzesByTopic} layout="vertical" margin={{ left: 4, right: 12 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="topic" tickLine={false} axisLine={false} width={72} />
            <ChartTooltip cursor={{ fillOpacity: 0.15 }} content={<ChartTooltipContent hideIndicator />} />
            <Bar dataKey="plays" fill="var(--color-plays)" radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ChartContainer>
      </Panel>
    </div>

    <div className="mt-5 grid gap-5 lg:grid-cols-3">
      <Panel title="Plan mix" tag={`${users.length} accounts`}>
        <ul className="grid gap-3">{planMix.map((p) => <li key={p.plan} className="text-sm">
          <div className="flex justify-between"><span>{planNames[p.plan]}</span><span className="font-semibold tabular-nums">{p.count}</span></div>
          <div className="mt-1 h-3 border-2 border-foreground bg-background"><div className="h-full bg-primary" style={{ width: `${(p.count / maxPlan) * 100}%` }} /></div>
        </li>)}</ul>
      </Panel>
      <Panel title="Learning" tag="App">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[["Kids profiles", kids], ["Hifz learners", hifz], ["Avg. streak", `${Math.round(users.reduce((s, u) => s + u.streak, 0) / Math.max(users.length, 1))} d`], ["Quizzes today", "1,483"]].map(([l, v]) => <div key={l} className="border-2 border-foreground p-3"><dt className="text-xs uppercase text-muted-foreground">{l}</dt><dd className="mt-1 font-serif text-2xl tabular-nums">{v}</dd></div>)}
        </dl>
      </Panel>
      <Panel title="Upcoming events" tag="Web" actions={<Button size="sm" variant="outline" onClick={() => go("events")}>Manage</Button>}>
        <ul className="grid gap-2">{upcoming.slice(0, 4).map((e) => <li key={e.id} className="text-sm">
          <div className="flex justify-between gap-2"><span className="truncate font-semibold">{e.title}</span><span className="shrink-0 tabular-nums">{e.booked}/{e.total}</span></div>
          <div className="mt-1 h-2 border border-foreground"><div className="h-full bg-secondary" style={{ width: `${(e.booked / e.total) * 100}%` }} /></div>
        </li>)}</ul>
      </Panel>
    </div>

    <Panel title="Recent admin activity" className="mt-5" actions={<Button size="sm" variant="outline" onClick={() => go("settings")}>Full log</Button>}>
      <ul className="divide-y divide-foreground/30 text-sm">{log.slice(0, 6).map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2"><span><b>{l.actor}</b> · {l.action}</span><span className="text-muted-foreground tabular-nums">{l.at}</span></li>)}</ul>
    </Panel>
  </Page>;
}
