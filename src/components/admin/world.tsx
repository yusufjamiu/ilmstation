import { useState } from "react";
import { toast } from "sonner";
import { Bike, Check, Footprints, Lock, Trophy, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  advertPrices, LAP_METRES, mosques, parseQuiz, schools, seedAdverts, seedLikedHomes, seedRaces, seedSponsoredQuizzes, seedWinners,
  type Advert, type AwardWinner, type HomeEntry, type Race, type RaceKind, type SponsoredQuiz,
} from "./world-data";
import { naira, uid, useAdminStore } from "./store";
import { Choice, DataTable, Field, inputCls, Kpi, Page, Panel, Pill, Toggle, useAudit, useConfirm, type Column } from "./ui";

/* ---------- Shared bits for the IlmWorld sections ---------- */

export function Chips<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[]; label: string }) {
  return <div role="group" aria-label={label} className="flex flex-wrap gap-2">
    {options.map(([v, l]) => <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v}
      className={cn("border-2 border-foreground px-3 py-1.5 text-sm font-semibold", value === v ? "bg-primary shadow-brutal-sm" : "bg-background hover:bg-muted")}>{l}</button>)}
  </div>;
}

export const quizHelp = "One question per block: the question, then each choice on its own line with * before the right one. Optional last line: Why: … Leave an empty line between questions.";

/** Plain-text quiz editor with a live count of questions that parse correctly. */
export function QuizText({ value, onChange, label = "Questions", rows = 10, placeholder }: { value: string; onChange: (v: string) => void; label?: string; rows?: number; placeholder?: string }) {
  const n = parseQuiz(value).length;
  return <Field label={label}>
    <span className="text-xs text-muted-foreground">{quizHelp}</span>
    <textarea rows={rows} className={cn(inputCls, "font-mono")} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    <span className={cn("text-xs font-semibold", n ? "text-foreground" : "text-muted-foreground")}>{n} question{n === 1 ? "" : "s"} read correctly</span>
  </Field>;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const today = () => new Date().toISOString().slice(0, 10);
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

/** Ranked results with the top N marked as winners; admins pay winners outside the app and tick them off here. */
function Ranking({ rows, winners, onPaid }: { rows: { id: string; player: string; detail: string; paid: boolean }[]; winners: number; onPaid: (id: string) => void }) {
  if (!rows.length) return <p className="border-2 border-dashed border-foreground p-6 text-center text-sm text-muted-foreground">No entries yet.</p>;
  return <ol className="grid gap-2">{rows.map((r, i) => <li key={r.id} className={cn("flex items-center gap-3 border-2 border-foreground px-3 py-2 text-sm", i < winners ? "bg-secondary/30" : "bg-card")}>
    <span className="w-6 font-serif text-xl tabular-nums">{i + 1}</span>
    <span className="min-w-0 flex-1"><b className="block truncate">{r.player}</b><span className="text-xs text-muted-foreground">{r.detail}</span></span>
    {i < winners && (r.paid ? <Pill value="paid" /> : <Button size="sm" variant="outline" onClick={() => onPaid(r.id)}><Check /> Mark paid</Button>)}
  </li>)}</ol>;
}

/* ---------- Billboard adverts ---------- */

export function WorldAdvertsSection() {
  const [adverts, setAdverts] = useAdminStore<Advert[]>("world_adverts", seedAdverts);
  const { record } = useAudit();
  const update = (a: Advert, patch: Partial<Advert>, action: string) => { setAdverts((l) => l.map((x) => (x.id === a.id ? { ...x, ...patch } : x))); record(action); };
  const live = adverts.filter((a) => a.status === "approved");

  const columns: Column<Advert>[] = [
    { key: "who", label: "Advertiser", render: (a) => <div><p className="font-semibold">{a.advertiser}</p><p className="text-xs text-muted-foreground">{a.phone} · {a.at}</p></div> },
    { key: "msg", label: "Billboard", render: (a) => <div className="max-w-sm"><p className="text-xs font-bold uppercase text-muted-foreground">{a.billboard}</p><p>“{a.message}”</p></div> },
    { key: "plan", label: "Plan", render: (a) => <span className="tabular-nums">{naira(advertPrices[a.plan])} / {a.plan}</span> },
    { key: "paid", label: "Paid", render: (a) => <Toggle on={a.paid} label={`${a.advertiser} has paid`} onChange={() => update(a, { paid: !a.paid }, `${a.paid ? "Unmarked" : "Confirmed"} payment from ${a.advertiser}`)} /> },
    { key: "status", label: "Status", render: (a) => <Pill value={a.status} /> },
  ];

  return <Page eyebrow="IlmWorld · billboards" title="Adverts">
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Awaiting approval" value={String(adverts.filter((a) => a.status === "pending").length)} tone="primary" />
      <Kpi label="On billboards" value={String(live.length)} />
      <Kpi label="Unpaid requests" value={String(adverts.filter((a) => a.status === "pending" && !a.paid).length)} />
      <Kpi label="Live advert revenue" value={naira(live.reduce((s, a) => s + advertPrices[a.plan], 0))} tone="secondary" />
    </div>
    <p className="mb-4 border-2 border-foreground bg-muted px-3 py-2 text-sm">Confirm the advertiser has paid ({naira(advertPrices.week)} a week, {naira(advertPrices.month)} a month) before you approve. Approved adverts appear on their billboard straight away.</p>
    <DataTable rows={adverts} columns={columns} empty="No advert requests yet." actions={(a) => <>
      {a.status !== "approved" && <Button size="sm" disabled={!a.paid} title={a.paid ? undefined : "Confirm payment first"} onClick={() => { update(a, { status: "approved" }, `Approved advert from ${a.advertiser}`); toast.success("Advert is live on the billboard"); }}><Check /> Approve</Button>}
      {a.status === "approved" && <Button size="sm" variant="outline" onClick={() => update(a, { status: "pending" }, `Took down advert from ${a.advertiser}`)}>Take down</Button>}
      {a.status === "pending" && <Button size="sm" variant="outline" aria-label="Decline" onClick={() => update(a, { status: "declined" }, `Declined advert from ${a.advertiser}`)}><X /></Button>}
    </>} />
  </Page>;
}

/* ---------- Weekly award ---------- */

function weekEnding() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

export function WorldAwardSection() {
  const [homes] = useAdminStore<HomeEntry[]>("world_liked_homes", seedLikedHomes);
  const [winners, setWinners] = useAdminStore<AwardWinner[]>("world_award_winners", seedWinners);
  const [form, setForm] = useState({ player: "", home: "", message: "May Allah bless your home!" });
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();
  const week = weekEnding();
  const announced = winners.find((w) => w.week === week);
  const ready = form.player.trim() && form.home.trim();

  const announce = () => ask({
    title: `Announce ${form.player} as this week's winner?`, body: "Every player sees the winner when they next open IlmWorld.", confirm: "Announce",
    run: () => {
      setWinners((l) => [{ id: uid(), week, ...form }, ...l.filter((w) => w.week !== week)]);
      record(`Announced ${form.player} as best furnished home (week ending ${week})`);
      toast.success("Winner announced");
      setForm({ player: "", home: "", message: "May Allah bless your home!" });
    },
  });

  return <Page eyebrow="IlmWorld · weekly award" title="Award">
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Panel title="Best furnished home · every Saturday" tag={`Week ending ${week}`}>
        <p className="text-sm text-muted-foreground">Every player sees the winner when they next open IlmWorld. Pick from the most liked homes this week, or type a name.</p>
        {announced && <p className="mt-3 border-2 border-foreground bg-secondary/30 px-3 py-2 text-sm"><Trophy className="mr-1 inline size-4" /> Already announced this week: <b>{announced.player}</b>. Announcing again replaces them.</p>}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {homes.length ? [...homes].sort((a, b) => b.likes - a.likes).map((h) => <button key={h.id} type="button" onClick={() => setForm((f) => ({ ...f, player: h.player, home: h.home }))}
            className={cn("border-2 border-foreground p-3 text-left text-sm shadow-brutal-sm hover:-translate-y-0.5", form.player === h.player && form.home === h.home ? "bg-primary" : "bg-card")}>
            <b className="block">{h.player}</b><span className="text-xs text-muted-foreground">{h.home}</span><span className="mt-1 block font-semibold tabular-nums">♥ {h.likes}</span>
          </button>) : <p className="text-sm text-muted-foreground">No likes yet this week.</p>}
        </div>
        <div className="mt-4 grid gap-3">
          <Field label="Player's name"><input className={inputCls} value={form.player} onChange={(e) => setForm({ ...form, player: e.target.value })} /></Field>
          <Field label="Their home (e.g. No. 12, Sabr Avenue, Lekki)"><input className={inputCls} value={form.home} onChange={(e) => setForm({ ...form, home: e.target.value })} /></Field>
          <Field label="Message"><input className={inputCls} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
          <Button disabled={!ready} onClick={announce}><Trophy /> Announce the winner</Button>
        </div>
      </Panel>
      <Panel title="Past winners">
        {winners.length ? <ul className="grid gap-2">{winners.map((w) => <li key={w.id} className="border-2 border-foreground bg-card p-3 text-sm">
          <p className="text-xs font-bold uppercase text-muted-foreground">Week ending {w.week}</p><b className="block">{w.player}</b><span className="text-muted-foreground">{w.home}</span>
          {w.message && <p className="mt-1 italic">“{w.message}”</p>}
        </li>)}</ul> : <p className="text-sm text-muted-foreground">No winners yet.</p>}
      </Panel>
    </div>
    {dialog}
  </Page>;
}

/* ---------- Sponsored quizzes ---------- */

const places = [...mosques, ...schools];
const blankQuiz = () => ({ title: "", sponsor: "", place: places[0]!, prize: 5000, winners: 3, days: 7, questions: "" });

export function WorldQuizzesSection() {
  const [quizzes, setQuizzes] = useAdminStore<SponsoredQuiz[]>("world_sponsored_quizzes", seedSponsoredQuizzes);
  const [form, setForm] = useState(blankQuiz);
  const [open, setOpen] = useState<string | null>(null);
  const { record } = useAudit();
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const count = parseQuiz(form.questions).length;
  const viewing = quizzes.find((q) => q.id === open);

  const create = () => {
    if (!form.title.trim() || !form.sponsor.trim()) { toast.error("Add a title and sponsor"); return; }
    if (!count) { toast.error("Add at least one question in the format shown"); return; }
    setQuizzes((l) => [{ id: uid(), ...form, opened: today(), status: "live", entries: [] }, ...l]);
    record(`Opened sponsored quiz “${form.title}” (${naira(form.prize)} × ${form.winners})`);
    toast.success("Sponsored quiz is live");
    setForm(blankQuiz());
  };
  const patch = (id: string, fn: (q: SponsoredQuiz) => SponsoredQuiz) => setQuizzes((l) => l.map((q) => (q.id === id ? fn(q) : q)));
  const ranked = (q: SponsoredQuiz) => [...q.entries].sort((a, b) => b.score - a.score || a.seconds - b.seconds);

  return <Page eyebrow="IlmWorld · sponsored prizes" title="Sponsored quizzes">
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="New sponsored quiz">
        <p className="mb-4 text-sm text-muted-foreground">Entry is free and each player answers once. Players never see the answers: you rank the entries here and pay the winners yourself.</p>
        <div className="grid gap-3">
          <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Sponsor"><input className={inputCls} value={form.sponsor} onChange={(e) => set({ sponsor: e.target.value })} /></Field>
          <Field label="Masjid or school"><Choice label="Masjid or school" className="w-full" value={form.place} onChange={(place) => set({ place })} options={places.map((p) => [p, p] as const)} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Prize each (₦)"><input type="number" min={0} className={inputCls} value={form.prize} onChange={(e) => set({ prize: Math.max(0, Number(e.target.value)) })} /></Field>
            <Field label="Winners"><input type="number" min={1} className={inputCls} value={form.winners} onChange={(e) => set({ winners: Math.max(1, Number(e.target.value)) })} /></Field>
            <Field label="Days open"><input type="number" min={1} className={inputCls} value={form.days} onChange={(e) => set({ days: Math.max(1, Number(e.target.value)) })} /></Field>
          </div>
          <QuizText value={form.questions} onChange={(questions) => set({ questions })} placeholder={"How many pillars of Islam are there?\n* Five\nFour\nSix\n\nWho was the first caliph?\n* Abu Bakr\nUmar\nUthman"} />
          <Button onClick={create}>Open the quiz · {naira(form.prize * form.winners)} in prizes</Button>
        </div>
      </Panel>
      <Panel title="Quizzes" tag={`${quizzes.filter((q) => q.status === "live").length} live`}>
        {quizzes.length ? <ul className="grid gap-3">{quizzes.map((q) => <li key={q.id} className="border-2 border-foreground bg-card p-3 text-sm shadow-brutal-sm">
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="block">{q.title}</b><span className="text-xs text-muted-foreground">{q.sponsor} · {q.place}</span></div><Pill value={q.status} /></div>
          <p className="mt-2 text-xs text-muted-foreground">{naira(q.prize)} × {q.winners} winners · {parseQuiz(q.questions).length} questions · opened {q.opened} for {q.days} days</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(q.id)}><Users /> Entries · {q.entries.length}</Button>
            {q.status === "live" && <Button size="sm" variant="outline" onClick={() => { patch(q.id, (x) => ({ ...x, status: "closed" })); record(`Closed sponsored quiz “${q.title}”`); }}><Lock /> Close</Button>}
          </div>
        </li>)}</ul> : <p className="text-sm text-muted-foreground">No sponsored quizzes yet.</p>}
      </Panel>
    </div>
    <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setOpen(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto">
      {viewing && <>
        <DialogHeader><DialogTitle>{viewing.title}</DialogTitle><DialogDescription>Ranked by score, then fastest time. Top {viewing.winners} win {naira(viewing.prize)} each — pay them yourself, then mark them paid.</DialogDescription></DialogHeader>
        <Ranking winners={viewing.winners} rows={ranked(viewing).map((e) => ({ id: e.id, player: e.player, paid: e.paid, detail: `${e.score}/${parseQuiz(viewing.questions).length || "?"} correct · ${clock(e.seconds)}` }))}
          onPaid={(id) => { patch(viewing.id, (x) => ({ ...x, entries: x.entries.map((e) => (e.id === id ? { ...e, paid: true } : e)) })); record(`Marked a “${viewing.title}” winner paid`); }} />
      </>}
    </DialogContent></Dialog>
  </Page>;
}

/* ---------- Races ---------- */

const blankRace = () => {
  const now = new Date();
  return { kind: "running" as RaceKind, title: "", prize: "", winners: 3, laps: 2, opens: localInput(now), closes: localInput(new Date(now.getTime() + 3 * 86400000)) };
};

export function WorldRacesSection() {
  const [races, setRaces] = useAdminStore<Race[]>("world_races", seedRaces);
  const [form, setForm] = useState(blankRace);
  const [open, setOpen] = useState<string | null>(null);
  const { record } = useAudit();
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const viewing = races.find((r) => r.id === open);
  const ready = form.title.trim() && form.prize.trim() && form.closes > form.opens;
  const state = (r: Race) => { const now = localInput(new Date()); return now < r.opens ? "pending" : now > r.closes ? "closed" : "live"; };

  const create = () => {
    setRaces((l) => [{ id: uid(), ...form, times: [] }, ...l]);
    record(`Set ${form.kind} race “${form.title}” (${form.laps} laps)`);
    toast.success("Race set");
    setForm(blankRace());
  };

  return <Page eyebrow="IlmWorld · Sports Arena" title="Races">
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Set a race">
        <p className="mb-4 text-sm text-muted-foreground">Players run or ride the track at the IlmWorld Sports Arena while the race is open. Each keeps their best time; the fastest win. You pay the winners and mark them paid.</p>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">{([["running", "Running race", Footprints], ["cycling", "Cycling race", Bike]] as const).map(([k, l, Icon]) =>
            <Button key={k} type="button" variant={form.kind === k ? "default" : "outline"} aria-pressed={form.kind === k} onClick={() => set({ kind: k })}><Icon /> {l}</Button>)}</div>
          <Field label="Title"><input className={inputCls} placeholder="e.g. Jumu'ah 2-lap dash" value={form.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Prize (real money)"><input className={inputCls} placeholder="e.g. ₦5,000 each" value={form.prize} onChange={(e) => set({ prize: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Winners"><input type="number" min={1} className={inputCls} value={form.winners} onChange={(e) => set({ winners: Math.max(1, Number(e.target.value)) })} /></Field>
            <Field label={`Laps (one lap = ${LAP_METRES} m)`}><input type="number" min={1} className={inputCls} value={form.laps} onChange={(e) => set({ laps: Math.max(1, Number(e.target.value)) })} /></Field>
            <Field label="Opens"><input type="datetime-local" className={inputCls} value={form.opens} onChange={(e) => set({ opens: e.target.value })} /></Field>
            <Field label="Closes"><input type="datetime-local" className={inputCls} value={form.closes} onChange={(e) => set({ closes: e.target.value })} /></Field>
          </div>
          {form.closes <= form.opens && <p className="text-sm font-semibold text-destructive">The race must close after it opens.</p>}
          <Button disabled={!ready} onClick={create}>Set the race · {(form.laps * LAP_METRES).toLocaleString()} m</Button>
        </div>
      </Panel>
      <Panel title="Races">
        {races.length ? <ul className="grid gap-3">{races.map((r) => <li key={r.id} className="border-2 border-foreground bg-card p-3 text-sm shadow-brutal-sm">
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="flex items-center gap-1">{r.kind === "running" ? <Footprints className="size-4" /> : <Bike className="size-4" />} {r.title}</b><span className="text-xs text-muted-foreground">{r.prize} · top {r.winners} · {r.laps} laps ({(r.laps * LAP_METRES).toLocaleString()} m)</span></div><Pill value={state(r) === "pending" ? "scheduled" : state(r)} /></div>
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">{r.opens.replace("T", " ")} → {r.closes.replace("T", " ")}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(r.id)}><Trophy /> Leaderboard · {r.times.length}</Button>
        </li>)}</ul> : <p className="text-sm text-muted-foreground">No races yet.</p>}
      </Panel>
    </div>
    <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setOpen(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto">
      {viewing && <>
        <DialogHeader><DialogTitle>{viewing.title}</DialogTitle><DialogDescription>Best time per player, fastest first. Top {viewing.winners} win {viewing.prize}.</DialogDescription></DialogHeader>
        <Ranking winners={viewing.winners} rows={[...viewing.times].sort((a, b) => a.seconds - b.seconds).map((t) => ({ id: t.id, player: t.player, paid: t.paid, detail: clock(t.seconds) }))}
          onPaid={(id) => { setRaces((l) => l.map((r) => (r.id === viewing.id ? { ...r, times: r.times.map((t) => (t.id === id ? { ...t, paid: true } : t)) } : r))); record(`Marked a “${viewing.title}” winner paid`); }} />
      </>}
    </DialogContent></Dialog>
  </Page>;
}
