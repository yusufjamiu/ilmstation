import { useState } from "react";
import { toast } from "sonner";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plans } from "@/components/premium";
import { planNames, planPrices, seedPayments, seedUsers, type AdminUser, type Payment } from "./data";
import { naira, useAdminStore } from "./store";
import { Choice, DataTable, Kpi, Page, Pill, useAudit, useConfirm } from "./ui";

export function BillingSection() {
  const [users] = useAdminStore<AdminUser[]>("users", seedUsers);
  const [payments, setPayments] = useAdminStore<Payment[]>("payments", seedPayments);
  const [filter, setFilter] = useState<Payment["status"] | "all">("all");
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();
  const paid = payments.filter((p) => p.status === "paid");
  const mrr = users.filter((u) => u.plan !== "free" && u.status === "active").reduce((s, u) => s + planPrices[u.plan], 0);
  const conversion = Math.round((users.filter((u) => u.plan !== "free").length / Math.max(users.length, 1)) * 100);

  const setStatus = (p: Payment, status: Payment["status"], msg: string) => {
    setPayments((l) => l.map((x) => (x.id === p.id ? { ...x, status } : x)));
    record(msg); toast.success(msg);
  };

  return <Page eyebrow="App · Premium subscriptions" title="Plans & billing">
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="MRR" value={naira(mrr)} tone="primary" />
      <Kpi label="Collected this month" value={naira(paid.reduce((s, p) => s + p.amount, 0))} />
      <Kpi label="Free → paid" value={`${conversion}%`} />
      <Kpi label="Failed payments" value={String(payments.filter((p) => p.status === "failed").length)} />
    </div>

    <h2 className="mb-3 text-sm font-bold uppercase">Plans</h2>
    <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{plans.map((p) => {
      const subs = users.filter((u) => u.plan === p.id).length;
      return <article key={p.id} className="border-2 border-foreground bg-card p-4 shadow-brutal-sm">
        <p className="text-xs font-bold uppercase text-muted-foreground">{p.seats}</p>
        <h3 className="font-serif text-2xl">{p.name}</h3>
        <p className="font-semibold">{p.price}</p>
        <p className="mt-3 border-t border-foreground/30 pt-2 text-sm"><b className="tabular-nums">{subs}</b> subscribers · <span className="tabular-nums">{naira(subs * planPrices[p.id])}</span>/mo</p>
      </article>;
    })}</div>

    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-bold uppercase">Payments · October</h2><Choice label="Filter payments" value={filter} onChange={setFilter} options={[["all", "All"], ["paid", "Paid"], ["failed", "Failed"], ["refunded", "Refunded"]]} /></div>
    <DataTable rows={payments.filter((p) => filter === "all" || p.status === filter)} columns={[
      { key: "u", label: "Customer", render: (p) => <span className="font-semibold">{p.user}</span> },
      { key: "pl", label: "Plan", render: (p) => planNames[p.plan] },
      { key: "a", label: "Amount", render: (p) => <span className="tabular-nums">{naira(p.amount)}</span>, className: "text-right" },
      { key: "d", label: "Date", render: (p) => <span className="tabular-nums">{p.date}</span> },
      { key: "s", label: "Status", render: (p) => <Pill value={p.status} /> },
    ]} actions={(p) => <>
      {p.status === "failed" && <Button size="sm" variant="secondary" onClick={() => setStatus(p, "paid", `Retried payment for ${p.user}`)}><Check /> Retry</Button>}
      {p.status === "paid" && <Button size="sm" variant="outline" onClick={() => ask({ title: `Refund ${naira(p.amount)}?`, body: `Refund ${p.user}’s ${planNames[p.plan]} payment from ${p.date}.`, confirm: "Refund", destructive: true, run: () => setStatus(p, "refunded", `Refunded ${naira(p.amount)} to ${p.user}`) })}><RotateCcw /> Refund</Button>}
    </>} />
    {dialog}
  </Page>;
}
