import { esc, layout, sendEmail } from "./email-server";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "./money-server";
import { mergePremium } from "./premium-config";

/** Premium and points live on the server: trial, Paystack payments, unlocking with points, redeeming points, admin grants. */
const DAY = 86_400_000;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const int = (v: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));
type Admin = NonNullable<Awaited<ReturnType<typeof admin>>>;
type Pending = { ref: string; amount: number; currency: string; planId: string; days: number; at: number };

async function paystack(path: string, init?: RequestInit) {
  const r = await fetch(`https://api.paystack.co${path}`, { ...init, headers: { authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ""}`, "content-type": "application/json", ...(init?.headers ?? {}) } });
  return (await r.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: Record<string, unknown> };
}

/** Check a payment with Paystack and give Premium (once per payment). */
async function applyPayment(a: Admin, uid: string, ref: string): Promise<{ ok: boolean; until?: number; error?: string; pending?: boolean }> {
  const entRef = a.db.doc(`entitlements/${uid}`);
  const pending = (await entRef.get()).get("pending") as Pending | undefined;
  if (!pending || pending.ref !== ref) {
    // already applied?
    const done = await a.db.doc(`payments/${ref}`).get();
    return done.exists && done.get("uid") === uid ? { ok: true } : { ok: false, error: "We couldn't find this payment." };
  }
  const r = await paystack(`/transaction/verify/${encodeURIComponent(ref)}`);
  const d = r.data ?? {};
  if (!r.status || d.status !== "success") {
    const stillOpen = d.status === "ongoing" || d.status === "pending" || d.status === "abandoned";
    if (!stillOpen || Date.now() - pending.at > DAY) await entRef.set({ pending: FieldValue.delete() }, { merge: true });
    return { ok: false, pending: stillOpen, error: "The payment wasn't completed." };
  }
  const meta = (d.metadata ?? {}) as { uid?: string; kind?: string };
  if (meta.kind !== "premium" || meta.uid !== uid || Number(d.amount) < pending.amount || String(d.currency) !== pending.currency) {
    return { ok: false, error: "This payment doesn't match. Contact admin@ilmstation.com." };
  }
  const now = Date.now();
  const until = await a.db.runTransaction(async (tx) => {
    const payRef = a.db.doc(`payments/${ref}`);
    const [p, e] = await Promise.all([tx.get(payRef), tx.get(entRef)]);
    if (p.exists) return Number(e.get("premiumUntil") ?? 0);
    const u = Math.max(now, Number(e.get("premiumUntil") ?? 0)) + pending.days * DAY;
    tx.set(entRef, { premiumUntil: u, plan: pending.planId, source: "paystack", pending: FieldValue.delete() }, { merge: true });
    tx.set(payRef, { uid, kind: "premium", planId: pending.planId, days: pending.days, amount: Number(d.amount), currency: pending.currency, email: (d.customer as { email?: string } | undefined)?.email ?? null, at: now });
    return u;
  });
  const custEmail = (d.customer as { email?: string } | undefined)?.email ?? "";
  if (custEmail && until) {
    const paid = `${pending.currency === "USD" ? "$" : "₦"}${(Number(d.amount) / 100).toLocaleString()}`;
    await sendEmail(custEmail, "Payment received: IlmStation Premium", layout("Thank you, payment received",
      `<p>We received <b>${paid}</b> for IlmStation Premium.</p><p>Your Premium is active until <b>${new Date(until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</b>.</p><p style="font-size:13px;color:#6b6458">Reference: ${esc(ref)}</p>`,
      { label: "Open IlmStation", url: "https://ilmstation.com/app" }));
  }
  const fam = await a.db.doc(`families/${uid}`).get();
  await Promise.all((((fam.get("memberUids") as string[]) ?? [])).map((m) => a.db.doc(`entitlements/${m}`).set({ familyUntil: until }, { merge: true })));
  return { ok: true, until };
}

export async function handlePremium(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  let uid: string; let email: string | undefined;
  try { const t = await a.auth.verifyIdToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "")); uid = t.uid; email = t.email; } catch { return json({ error: "Not signed in" }, 401); }
  const { action, data = {} } = (await request.json().catch(() => ({}))) as { action?: string; data?: Record<string, unknown> };
  const cfg = mergePremium((await a.db.doc("siteConfig/premium").get()).data());
  const ref = a.db.doc(`entitlements/${uid}`);
  const now = Date.now();
  const country = (request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();

  // first visit: start the free trial (once); finish any payment left open
  if (action === "status") {
    await a.db.runTransaction(async (tx) => {
      const e = await tx.get(ref);
      if (e.exists && e.get("trialUsed")) return;
      const cur = Number(e.get("premiumUntil") ?? 0);
      const trialEnd = cfg.trialDays > 0 ? now + cfg.trialDays * DAY : 0;
      tx.set(ref, {
        trialUsed: true, points: Number(e.get("points") ?? 0), unlocked: (e.get("unlocked") as string[]) ?? [], createdAt: now,
        ...(trialEnd > cur ? { premiumUntil: trialEnd, plan: "trial", source: "trial" } : {}),
      }, { merge: true });
    });
    const pending = (await ref.get()).get("pending") as Pending | undefined;
    const paid = pending ? await applyPayment(a, uid, pending.ref) : null;
    return json({ ok: true, country, paid: paid?.ok ? paid.until : undefined });
  }

  // start a Paystack payment for a plan (the price comes from the admin's settings)
  if (action === "checkout") {
    const plan = cfg.plans.find((p) => p.id === String(data.planId ?? "") && p.visible);
    if (!plan || plan.price <= 0) return json({ ok: false, error: "That plan isn't available." });
    if (!email) return json({ ok: false, error: "Your account needs an email address to pay." });
    if (!process.env.PAYSTACK_SECRET_KEY) return json({ ok: false, error: "Payments aren't set up yet." });
    const usd = cfg.usdAbroad && !!country && country !== "NG" && (plan.priceUsd ?? 0) > 0;
    const currency = usd ? "USD" : "NGN";
    const amount = usd ? Math.round((plan.priceUsd ?? 0) * 100) : Math.round(plan.price * 100);
    const days = plan.period === "year" ? 365 : 30;
    const origin = new URL(request.url).origin;
    const r = await paystack("/transaction/initialize", { method: "POST", body: JSON.stringify({
      email, amount, currency, callback_url: `${origin}/app?s=rewards`,
      metadata: { kind: "premium", uid, planId: plan.id, days, custom_fields: [{ display_name: "Plan", variable_name: "plan", value: plan.name }] },
    }) });
    const url = r.data?.authorization_url as string | undefined;
    const reference = r.data?.reference as string | undefined;
    if (!r.status || !url || !reference) return json({ ok: false, error: "Couldn't start the payment. Try again." });
    await ref.set({ pending: { ref: reference, amount, currency, planId: plan.id, days, at: now } satisfies Pending }, { merge: true });
    return json({ ok: true, url });
  }

  // back from Paystack: check the payment
  if (action === "confirm") return json(await applyPayment(a, uid, String(data.reference ?? "").slice(0, 100)));

  // spend points on one item (the price comes from the server, not the app)
  if (action === "unlock") {
    const id = String(data.id ?? "").slice(0, 120);
    let cost = 0;
    if (id.startsWith("topic-")) {
      if (!cfg.premiumTopics.includes(id.slice(6))) return json({ ok: false, error: "This topic is free." });
      cost = cfg.topicCost;
    } else if (id.startsWith("card-")) {
      const d = await a.db.doc(`cardDesigns/${id.slice(5)}`).get();
      if (!d.exists || d.get("tier") !== "premium") return json({ ok: false, error: "Card not found." });
      cost = Number(d.get("cost") ?? 0);
    } else {
      const d = await a.db.doc(`library/${id}`).get();
      if (!d.exists || d.get("tier") !== "premium") return json({ ok: false, error: "This one can only be opened with Premium." });
      cost = Number(d.get("cost") ?? 0);
    }
    if (cost <= 0) return json({ ok: false, error: "This one can only be opened with Premium." });
    const r = await a.db.runTransaction(async (tx) => {
      const e = await tx.get(ref);
      const pts = Number(e.get("points") ?? 0);
      const un = (e.get("unlocked") as string[]) ?? [];
      if (un.includes(id)) return { ok: true };
      if (pts < cost) return { ok: false, error: `You need ${cost} points (you have ${pts}).` };
      tx.set(ref, { points: pts - cost, unlocked: [...un, id] }, { merge: true });
      return { ok: true };
    });
    return json(r);
  }

  // turn points into Premium days
  if (action === "redeem") {
    const o = cfg.redeem[int(data.i, 0, 50)];
    if (!o || !o.on || o.points <= 0 || o.days <= 0) return json({ ok: false, error: "That option isn't available." });
    const r = await a.db.runTransaction(async (tx) => {
      const e = await tx.get(ref);
      const pts = Number(e.get("points") ?? 0);
      if (pts < o.points) return { ok: false, error: `You need ${o.points} points (you have ${pts}).` };
      const cur = Number(e.get("premiumUntil") ?? 0);
      const until = Math.max(now, cur) + o.days * DAY;
      const keep = cur > now && e.get("source") !== "trial";
      tx.set(ref, { points: pts - o.points, premiumUntil: until, plan: keep ? e.get("plan") : "points", source: keep ? e.get("source") : "points" }, { merge: true });
      return { ok: true, until };
    });
    return json(r);
  }

  // owners and admins look up any account by email (for adding team members)
  if (action === "findUser") {
    const role = (await a.db.doc(`admins/${uid}`).get()).get("role");
    if (role !== "owner" && role !== "admin") return json({ ok: false, error: "Owners and admins only." }, 403);
    try { const u = await a.auth.getUserByEmail(String(data.email ?? "").trim().toLowerCase()); return json({ ok: true, uid: u.uid, name: u.displayName ?? "" }); }
    catch { return json({ ok: false, error: "No IlmStation account uses this email. Ask them to sign up first." }); }
  }

  // email a new team member
  if (action === "notifyTeam") {
    const myRole = (await a.db.doc(`admins/${uid}`).get()).get("role");
    if (myRole !== "owner" && myRole !== "admin") return json({ ok: false }, 403);
    const roleName = ({ owner: "Owner", admin: "Admin", editor: "Editor", moderator: "Moderator", support: "Support" } as Record<string, string>)[String(data.role)] ?? "team member";
    const ok = await sendEmail(String(data.email ?? ""), "You’ve been added to the IlmStation team", layout("You’re on the IlmStation team",
      `<p>Assalamu alaikum. You’ve been added to the IlmStation admin team as <b>${esc(roleName)}</b>.</p><p>Log in with this email address to open the admin panel.</p>`,
      { label: "Open the admin panel", url: "https://ilmstation.com/admin" }));
    return json(ok === true ? { ok: true } : { ok: false, error: ok });
  }

  // admins give Premium to someone by email
  if (action === "grant") {
    if (!(await a.db.doc(`admins/${uid}`).get()).exists) return json({ ok: false, error: "Admins only." }, 403);
    const days = int(data.days, 1, 3650);
    let target: string;
    try { target = (await a.auth.getUserByEmail(String(data.email ?? "").trim().toLowerCase())).uid; } catch { return json({ ok: false, error: "No account with that email." }); }
    const tref = a.db.doc(`entitlements/${target}`);
    const until = await a.db.runTransaction(async (tx) => {
      const e = await tx.get(tref);
      const u = Math.max(now, Number(e.get("premiumUntil") ?? 0)) + days * DAY;
      tx.set(tref, { premiumUntil: u, plan: "gift", source: "admin", grantedBy: uid }, { merge: true });
      return u;
    });
    return json({ ok: true, until });
  }

  return json({ error: "Unknown action" }, 400);
}
