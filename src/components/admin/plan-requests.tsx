import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { callPremium } from "@/components/premium";
import { Panel } from "./ui";

type Req = { id: string; uid: string; email: string; name: string; org: string; phone: string; note: string; adults: number; kids: number;
  status: "new" | "approved" | "declined" | "paid"; createdAt: number; price?: number; period?: string; adminNote?: string };
const box = "h-10 w-full border-2 border-foreground bg-background px-2 text-sm";
const tone: Record<string, string> = { new: "bg-primary", approved: "bg-secondary text-secondary-foreground", paid: "bg-foreground text-background", declined: "bg-muted" };

/** Custom plan requests: approve with a price (creates a private plan) or decline. */
export function PlanRequests() {
  const [rows, setRows] = useState<Req[]>([]);
  const [form, setForm] = useState<Record<string, { price: number; period: string; adults: number; kids: number; note: string }>>({});
  const [busy, setBusy] = useState("");
  useEffect(() => onSnapshot(query(collection(db, "planRequests"), orderBy("createdAt", "desc"), limit(50)),
    (s) => setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Req, "id">) }))), () => {}), []);
  const f = (r: Req) => form[r.id] ?? { price: 0, period: "month", adults: r.adults || 1, kids: r.kids || 0, note: "" };
  const setF = (r: Req, patch: Partial<ReturnType<typeof f>>) => setForm({ ...form, [r.id]: { ...f(r), ...patch } });
  const act = async (r: Req, action: "approveQuote" | "declineQuote") => {
    const v = f(r);
    if (action === "approveQuote" && v.price <= 0) { toast.error("Enter a price"); return; }
    if (action === "declineQuote" && !window.confirm(`Decline ${r.org || r.name}'s request? They'll get an email.`)) return;
    setBusy(r.id);
    const res = await callPremium(action, { id: r.id, ...v });
    setBusy("");
    if (res.ok) toast.success(action === "approveQuote" ? "Approved. They've been emailed how to pay." : "Declined. They've been emailed.");
    else toast.error(res.error ?? "Couldn't save.");
  };
  const waiting = rows.filter((r) => r.status === "new").length;
  return <div className="mb-6"><Panel title="Plan requests" tag={waiting ? `${waiting} waiting` : `${rows.length} total`}>
    {!rows.length ? <p className="text-sm text-muted-foreground">No custom plan requests yet. They appear here when someone taps “Ask for a quote”.</p>
    : <div className="grid gap-3">{rows.map((r) => { const v = f(r); return <div key={r.id} className="grid gap-2 border-2 border-foreground p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="font-semibold">{r.org || r.name} <span className="font-normal text-muted-foreground">· {r.name} · {r.email}{r.phone ? ` · ${r.phone}` : ""}</span></p>
          <p className="text-sm">{r.adults} adult{r.adults === 1 ? "" : "s"} · {r.kids} child{r.kids === 1 ? "" : "ren"} · {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
          {r.note && <p className="mt-1 text-sm text-muted-foreground">“{r.note}”</p>}
          {r.status !== "new" && r.price ? <p className="mt-1 text-sm">Offered ₦{r.price.toLocaleString()} / {r.period}</p> : null}
        </div>
        <span className={`border-2 border-foreground px-2 py-0.5 text-xs font-bold uppercase ${tone[r.status] ?? ""}`}>{r.status}</span>
      </div>
      {r.status === "new" && <>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="text-xs font-bold uppercase">Price (₦)<input type="number" min={0} className={box} value={v.price} onChange={(e) => setF(r, { price: Math.max(0, Number(e.target.value) || 0) })} /></label>
          <label className="text-xs font-bold uppercase">Per<select className={box} value={v.period} onChange={(e) => setF(r, { period: e.target.value })}><option value="month">month</option><option value="year">year</option></select></label>
          <label className="text-xs font-bold uppercase">Adults (incl. payer)<input type="number" min={1} className={box} value={v.adults} onChange={(e) => setF(r, { adults: Math.max(1, Number(e.target.value) || 1) })} /></label>
          <label className="text-xs font-bold uppercase">Children<input type="number" min={0} className={box} value={v.kids} onChange={(e) => setF(r, { kids: Math.max(0, Number(e.target.value) || 0) })} /></label>
        </div>
        <input className={box} placeholder="Note in the email (optional)" value={v.note} onChange={(e) => setF(r, { note: e.target.value })} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy === r.id} onClick={() => void act(r, "approveQuote")}>Approve and email payment details</Button>
          <Button variant="outline" disabled={busy === r.id} onClick={() => void act(r, "declineQuote")}>Decline</Button>
        </div>
      </>}
    </div>; })}</div>}
  </Panel></div>;
}

/** Admin: give someone a free Family plan with chosen seats. */
export function GiftFamily() {
  const [f, setF] = useState({ email: "", days: 365, adults: 2, kids: 4 });
  const [busy, setBusy] = useState(false);
  const give = async () => {
    if (!f.email.trim()) { toast.error("Enter their email"); return; }
    setBusy(true);
    const r = await callPremium("grantFamily", f);
    setBusy(false);
    if (r.ok) { toast.success("Free Family plan given. They've been emailed."); setF({ ...f, email: "" }); } else toast.error(r.error ?? "Couldn't do that.");
  };
  return <div className="mb-6"><Panel title="🎁 Give a free Family plan" tag="Partners, scholars, gifts">
    <p className="-mt-1 mb-3 text-xs text-muted-foreground">They need an IlmStation account. They'll invite adults and create children's accounts in Family hub. 18250 days = forever.</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_7rem_6rem_6rem_auto] sm:items-end">
      <label className="col-span-2 text-xs font-bold uppercase sm:col-span-1">Their email<input className={box} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="sheikh@example.com" /></label>
      <label className="text-xs font-bold uppercase">Days<input type="number" min={1} className={box} value={f.days} onChange={(e) => setF({ ...f, days: Math.max(1, Number(e.target.value) || 1) })} /></label>
      <label className="text-xs font-bold uppercase">Adults<input type="number" min={1} className={box} value={f.adults} onChange={(e) => setF({ ...f, adults: Math.max(1, Number(e.target.value) || 1) })} /></label>
      <label className="text-xs font-bold uppercase">Children<input type="number" min={0} className={box} value={f.kids} onChange={(e) => setF({ ...f, kids: Math.max(0, Number(e.target.value) || 0) })} /></label>
      <Button className="col-span-2 sm:col-span-1" disabled={busy} onClick={() => void give()}>{busy ? "Giving…" : "Give"}</Button>
    </div>
  </Panel></div>;
}
