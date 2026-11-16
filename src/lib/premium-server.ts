import { createHash } from "node:crypto";
import { esc, layout, sendEmail } from "./email-server";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "./money-server";
import { basePrice, FEATURE_LIMITS, finalPrice, isQuote, mergePremium, type Period } from "./premium-config";

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
  if (String(pending.planId ?? "").startsWith("custom-")) await a.db.doc(`planRequests/${String(pending.planId).slice(7)}`).set({ status: "paid", paidAt: Date.now() }, { merge: true }).catch(() => {});
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
    const emailKey = email ? createHash("sha256").update(email.toLowerCase()).digest("hex") : "";
    const usedBefore = emailKey ? (await a.db.doc(`trialEmails/${emailKey}`).get()).exists : false;
    const isNew = await a.db.runTransaction(async (tx) => {
      const e = await tx.get(ref);
      if (e.exists && e.get("trialUsed")) return false;
      const cur = Number(e.get("premiumUntil") ?? 0);
      const trialEnd = cfg.trialDays > 0 ? now + cfg.trialDays * DAY : 0;
      tx.set(ref, {
        trialUsed: true, points: Number(e.get("points") ?? 0), unlocked: (e.get("unlocked") as string[]) ?? [], createdAt: now,
        ...(trialEnd > cur ? { premiumUntil: trialEnd, plan: "trial", source: "trial" } : {}),
      }, { merge: true });
      return true;
    });
    // this email already had a trial on an earlier (deleted) account: no new trial, no welcome
    if (isNew && usedBefore) await ref.set({ premiumUntil: 0, source: "trial-used" }, { merge: true });
    if (emailKey && !usedBefore) await a.db.doc(`trialEmails/${emailKey}`).set({ at: now });
    // first visit: welcome email (once)
    if (isNew && email && !usedBefore) {
      const name = (((await a.db.doc(`profiles/${uid}`).get()).get("name") as string) ?? "").split(" ")[0] || "friend";
      const trialEnd = cfg.trialDays > 0 ? new Date(now + cfg.trialDays * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : "";
      await sendEmail(email, "Welcome to IlmStation", layout(`Welcome, ${name}!`,
        `<p>Assalamu alaikum, and welcome to IlmStation, a place to learn a little every day.</p>
        <ul style="padding-left:18px;line-height:1.7">
          <li><b>Daily Wisdom</b>: an ayah, hadith or word of the scholars each day</li>
          <li><b>Quizzes and streaks</b>: earn XP and level up</li>
          <li><b>Library</b>: books and audiobooks that remember your place</li>
          <li><b>Study</b>: lessons step by step</li>
          <li><b>IlmWorld</b>: live a Muslim life in our 3D world</li>
        </ul>
        ${trialEnd ? `<p>Your <b>free Premium trial</b> is active until <b>${trialEnd}</b>. Enjoy everything!</p>` : ""}`,
        { label: "Open IlmStation", url: "https://www.ilmstation.com/app" }));
    }
    const pending = (await ref.get()).get("pending") as Pending | undefined;
    const paid = pending ? await applyPayment(a, uid, pending.ref) : null;
    return json({ ok: true, country, paid: paid?.ok ? paid.until : undefined });
  }

  // start a Paystack payment for a plan (the price comes from the admin's settings)
  if (action === "checkout") {
    const plan = cfg.plans.find((p) => p.id === String(data.planId ?? "") && (p.visible || p.forUid === uid));
    if (!plan || isQuote(plan)) return json({ ok: false, error: "That plan isn't available." });
    if (!email) return json({ ok: false, error: "Your account needs an email address to pay." });
    if (!process.env.PAYSTACK_SECRET_KEY) return json({ ok: false, error: "Payments aren't set up yet." });
    const period: Period = data.period === "year" ? "year" : "month";
    const usd = cfg.usdAbroad && !!country && country !== "NG" && basePrice(plan, period, true) > 0;
    const pr = finalPrice(cfg, plan, period, usd, String(data.code ?? ""));
    if (pr.final <= 0) return json({ ok: false, error: period === "year" ? "This plan isn’t available yearly." : "This plan isn’t available monthly." });
    const currency = usd ? "USD" : "NGN";
    const amount = Math.round(pr.final * 100);
    const days = period === "year" ? 365 : 30;
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

  // notifications: this device, location for prayer times, and which ones are on
  if (action === "pushRegister" || action === "pushGet" || action === "pushPrefs") {
    const pref = a.db.doc(`push/${uid}`);
    const cur = (await pref.get()).data() ?? {};
    const defaults = { wisdom: true, prayer: true, streak: true, kahf: true, ramadan: true };
    const prefsNow = { ...defaults, ...((cur.prefs as object) ?? {}) };
    if (action === "pushGet") return json({ ok: true, on: ((cur.tokens as string[]) ?? []).length > 0, prefs: prefsNow, hasLocation: typeof cur.lat === "number" });
    if (action === "pushPrefs") {
      const p = (data.prefs ?? {}) as Record<string, unknown>;
      const next = Object.fromEntries(Object.keys(defaults).map((k) => [k, p[k] !== false]));
      await pref.set({ prefs: next }, { merge: true });
      return json({ ok: true, prefs: next });
    }
    const token = String(data.token ?? "");
    if (!token || token.length > 4096) return json({ ok: false, error: "No device token." });
    const tokens = [token, ...((cur.tokens as string[]) ?? []).filter((x) => x !== token)].slice(0, 5);
    const lat = Number(data.lat), lng = Number(data.lng);
    const loc = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : {};
    await pref.set({ tokens, prefs: prefsNow, tz: String(data.tz ?? "Africa/Lagos").slice(0, 60), method: String(data.method ?? "").slice(0, 20), ...loc, times: null, at: now }, { merge: true });
    return json({ ok: true, prefs: prefsNow, hasLocation: "lat" in loc || typeof cur.lat === "number" });
  }

  // daily limits (IlmBot questions, quick quizzes, duels, lessons, cards)
  if (action === "use") {
    const key = String(data.feature ?? "");
    const f = cfg.features[key];
    if (!f || !f.on) return json({ ok: true, left: -1 });
    const e = await ref.get();
    const isPrem = Math.max(Number(e.get("premiumUntil") ?? 0), Number(e.get("familyUntil") ?? 0)) > now;
    const limit = isPrem ? f.premium : f.free;
    if (!limit) return json({ ok: true, left: -1 });
    const label = FEATURE_LIMITS.find((x) => x.id === key)?.label.toLowerCase() ?? key;
    const uref = a.db.doc(`usage/${uid}`);
    const r = await a.db.runTransaction(async (tx) => {
      const u = await tx.get(uref);
      const today = new Date(now + 3_600_000).toISOString().slice(0, 10);
      const counts = u.get("day") === today ? ((u.get("counts") as Record<string, number>) ?? {}) : {};
      const used = Number(counts[key] ?? 0);
      if (used >= limit) return { ok: false, left: 0, premium: isPrem, error: `You’ve used today’s ${limit} ${label}.` };
      tx.set(uref, { day: today, counts: { ...counts, [key]: used + 1 } });
      return { ok: true, left: limit - used - 1 };
    });
    return json(r);
  }

  // daily play time for games (admin sets the minutes)
  if (action === "playtime") {
    const pc = ((await a.db.doc("siteConfig/play").get()).data() ?? {}) as { on?: boolean; freeMinutes?: number; premiumMinutes?: number; kidsMinutes?: number; reset?: string };
    const zone = (await a.db.doc(`profiles/${uid}`).get()).get("zone");
    const e = await ref.get();
    const isPrem = Math.max(Number(e.get("premiumUntil") ?? 0), Number(e.get("familyUntil") ?? 0)) > now;
    const mins = pc.on === false ? 0 : zone === "kids" ? Number(pc.kidsMinutes ?? 30) : isPrem ? Number(pc.premiumMinutes ?? 0) : Number(pc.freeMinutes ?? 15);
    if (!mins) return json({ ok: true, left: -1 });
    const add = int(data.add, 0, 60);
    const pref = a.db.doc(`playtime/${uid}`);
    const r = await a.db.runTransaction(async (tx) => {
      const p = await tx.get(pref);
      const today = new Date(now + 3_600_000).toISOString().slice(0, 10);
      let start = Number(p.get("start") ?? 0); let used = Number(p.get("used") ?? 0);
      if (pc.reset === "24h") { if (!start || now - start >= DAY) { start = now; used = 0; } }
      else if (p.get("day") !== today) used = 0;
      used += add;
      tx.set(pref, { start, used, day: today });
      const resetsAt = pc.reset === "24h" ? start + DAY : Date.parse(`${today}T00:00:00+01:00`) + DAY;
      return { left: Math.max(0, mins * 60 - used), resetsAt };
    });
    return json({ ok: true, ...r });
  }

  // spend points on one item (the price comes from the server, not the app)
  if (action === "unlock") {
    const id = String(data.id ?? "").slice(0, 120);
    let cost = 0;
    if (id.startsWith("topic-")) {
      if (!cfg.premiumTopics.includes(id.slice(6))) return json({ ok: false, error: "This topic is free." });
      cost = cfg.topicCost;
    } else if (id.startsWith("game-")) {
      const d = await a.db.doc(`kidGames/${id.slice(5)}`).get();
      if (!d.exists || d.get("tier") !== "premium") return json({ ok: false, error: "Game not found." });
      cost = Number(d.get("cost") ?? 0);
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

  // someone asks for a custom plan
  if (action === "requestQuote") {
    const prof = await a.db.doc(`profiles/${uid}`).get();
    if (prof.get("managed")) return json({ ok: false, error: "Please ask your parent to request a plan." });
    if (!email) return json({ ok: false, error: "Your account needs an email address." });
    const mine = await a.db.collection("planRequests").where("uid", "==", uid).get();
    if (mine.docs.some((d) => d.get("status") === "new")) return json({ ok: false, error: "You already have a request waiting. We’ll email you soon." });
    const org = String(data.org ?? "").trim().slice(0, 80), phone = String(data.phone ?? "").trim().slice(0, 30), note = String(data.note ?? "").trim().slice(0, 600);
    const adults = int(data.adults, 1, 50), kids = int(data.kids, 0, 500), name = String(prof.get("name") ?? "");
    await a.db.collection("planRequests").add({ uid, email, name, org, phone, note, adults, kids, status: "new", createdAt: now });
    const summary = `<p><b>${esc(org || name)}</b> · ${adults} adult${adults === 1 ? "" : "s"} · ${kids} child${kids === 1 ? "" : "ren"}</p>${note ? `<p>“${esc(note)}”</p>` : ""}`;
    await sendEmail(email, "We’ve received your plan request", layout("Thank you, request received",
      `<p>Assalamu alaikum ${esc(name.split(" ")[0] || "")}. We’ve received your request for a custom IlmStation plan:</p>${summary}<p>Our team will review it and email you a payment link, usually within 1–2 working days.</p>`));
    const team = await a.db.collection("admins").where("role", "in", ["owner", "admin"]).get();
    await Promise.all(team.docs.map((d) => String(d.get("email") ?? "")).filter(Boolean).map((to) => sendEmail(to, `New custom plan request from ${org || name}`,
      layout("New custom plan request", `${summary}<p>From ${esc(name)} · ${esc(email)}${phone ? ` · ${esc(phone)}` : ""}</p>`, { label: "Review the request", url: "https://www.ilmstation.com/admin?section=premium" }))));
    return json({ ok: true });
  }

  // owners and admins approve (private plan + email) or decline a custom plan request
  if (action === "approveQuote" || action === "declineQuote") {
    const myRole = (await a.db.doc(`admins/${uid}`).get()).get("role");
    if (myRole !== "owner" && myRole !== "admin") return json({ ok: false, error: "Only owners and admins can do this." }, 403);
    const id = String(data.id ?? "");
    const rref = a.db.doc(`planRequests/${id}`);
    const req = await rref.get();
    if (!req.exists) return json({ ok: false, error: "Request not found." });
    const to = String(req.get("email") ?? ""), who = String(req.get("name") ?? "").split(" ")[0] || "there";
    const note = String(data.note ?? "").trim().slice(0, 500);
    if (action === "declineQuote") {
      await rref.set({ status: "declined", adminNote: note, decidedBy: uid, decidedAt: now }, { merge: true });
      await sendEmail(to, "About your IlmStation plan request", layout("About your plan request",
        `<p>Assalamu alaikum ${esc(who)}. Thank you for your interest in IlmStation. We’re not able to offer this plan right now.</p>${note ? `<p>${esc(note)}</p>` : ""}<p>You’re welcome to reply to this email with any questions.</p>`));
      return json({ ok: true });
    }
    const price = int(data.price, 1, 100_000_000), period = data.period === "year" ? "year" : "month";
    const adults = int(data.adults, 1, 50), kids = int(data.kids, 0, 500);
    const planId = `custom-${id}`, org = String(req.get("org") ?? "") || String(req.get("name") ?? "");
    const seats = `${adults} adult${adults === 1 ? "" : "s"} + ${kids} child${kids === 1 ? "" : "ren"}`;
    const plan = { id: planId, name: `Custom · ${org}`.slice(0, 60), price, period, priceMonthly: period === "month" ? price : 0, priceYearly: period === "year" ? price : 0,
      usdMonthly: 0, usdYearly: 0, adults, kids, seats, points: ["Tailored plan for your group", ...(note ? [note] : [])], visible: false, forUid: String(req.get("uid")) };
    const pref = a.db.doc("siteConfig/premium");
    await a.db.runTransaction(async (tx) => {
      const d = await tx.get(pref);
      const plans = mergePremium((d.data() ?? {}) as never).plans.filter((p) => p.id !== planId);
      tx.set(pref, { plans: [...plans, plan] }, { merge: true });
    });
    await rref.set({ status: "approved", price, period, adults, kids, planId, adminNote: note, decidedBy: uid, decidedAt: now }, { merge: true });
    await sendEmail(to, "Your IlmStation plan is ready", layout("Your custom plan is ready",
      `<p>Assalamu alaikum ${esc(who)}. Your custom IlmStation plan is ready:</p><p><b>₦${price.toLocaleString()} per ${period}</b> · ${seats}</p>${note ? `<p>${esc(note)}</p>` : ""}<p>To pay, log in and open <b>Wallet &amp; store → Premium</b>, then tap <b>Pay now</b> on “Your custom plan”.</p>`,
      { label: "Open IlmStation", url: "https://www.ilmstation.com/app?s=rewards" }));
    return json({ ok: true });
  }

  // a user deletes their own account
  if (action === "deleteMe") {
    if (String(data.confirm ?? "") !== "DELETE") return json({ ok: false, error: "Type DELETE to confirm." });
    if ((await a.db.doc(`profiles/${uid}`).get()).get("managed")) return json({ ok: false, error: "Children’s accounts are deleted by their parent in Family hub." });
    if ((await a.db.doc(`admins/${uid}`).get()).get("role") === "owner" && (await a.db.collection("admins").where("role", "==", "owner").get()).size <= 1)
      return json({ ok: false, error: "You’re the only owner. Add another owner before deleting your account." });
    await wipeAccount(a, uid);
    return json({ ok: true });
  }

  // owners and admins delete an account (and everything that belongs to it)
  if (action === "deleteUser") {
    const myRole = (await a.db.doc(`admins/${uid}`).get()).get("role");
    if (myRole !== "owner" && myRole !== "admin") return json({ ok: false, error: "Only owners and admins can delete accounts." }, 403);
    const target = String(data.uid ?? "");
    if (!target) return json({ ok: false, error: "No account chosen." });
    if (target === uid) return json({ ok: false, error: "You can’t delete your own account here." });
    if ((await a.db.doc(`admins/${target}`).get()).get("role") === "owner" && myRole !== "owner") return json({ ok: false, error: "Only owners can delete an owner." });
    await wipeAccount(a, target);
    return json({ ok: true });
  }

  // owners and admins add someone to the team, and they get a welcome email
  if (action === "addTeam") {
    const myRole = (await a.db.doc(`admins/${uid}`).get()).get("role");
    if (myRole !== "owner" && myRole !== "admin") return json({ ok: false, error: "Only owners and admins can manage the team." }, 403);
    const role = String(data.role ?? "");
    if (!["owner", "admin", "editor", "moderator", "support"].includes(role)) return json({ ok: false, error: "Choose a role." });
    if (role === "owner" && myRole !== "owner") return json({ ok: false, error: "Only owners can add owners." });
    const em = String(data.email ?? "").trim().toLowerCase();
    let target: { uid: string; displayName?: string };
    try { target = await a.auth.getUserByEmail(em); } catch { return json({ ok: false, error: "No IlmStation account uses this email. Ask them to sign up first." }); }
    if (target.uid === uid) return json({ ok: false, error: "You can’t change your own role." });
    if ((await a.db.doc(`admins/${target.uid}`).get()).get("role") === "owner" && myRole !== "owner") return json({ ok: false, error: "Only owners can change an owner." });
    const prof = await a.db.doc(`profiles/${target.uid}`).get();
    await a.db.doc(`admins/${target.uid}`).set({ role, email: em, name: (prof.get("name") as string) ?? target.displayName ?? "", addedBy: uid, addedAt: Date.now() });
    const roleName = ({ owner: "Owner", admin: "Admin", editor: "Editor", moderator: "Moderator", support: "Support" } as Record<string, string>)[role] ?? "team member";
    const sent = await sendEmail(em, "You’ve been added to the IlmStation team", layout("You’re on the IlmStation team",
      `<p>Assalamu alaikum. You’ve been added to the IlmStation admin team as <b>${esc(roleName)}</b>.</p><p>Log in with this email address to open the admin panel.</p>`,
      { label: "Open the admin panel", url: "https://www.ilmstation.com/admin" }));
    return json({ ok: true, emailed: sent === true, emailError: sent === true ? undefined : sent });
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

/** Remove an account and everything that belongs to it. Children a parent created go too. */
export async function wipeAccount(a: Admin, target: string): Promise<void> {
  const prof = await a.db.doc(`profiles/${target}`).get();
  const username = prof.get("username") as string | undefined;
  const email = prof.get("email") as string | undefined;
  type FM = { uid: string; status: string; managed?: boolean };

  // they own a family plan: close it, and delete children they created
  const famRef = a.db.doc(`families/${target}`);
  const fam = await famRef.get();
  if (fam.exists) {
    for (const m of ((fam.get("members") as FM[]) ?? [])) {
      if (m.managed) { await wipeAccount(a, m.uid); continue; }
      if (m.status === "active") {
        await a.db.doc(`profiles/${m.uid}`).set({ familyOf: FieldValue.delete() }, { merge: true }).catch(() => {});
        await a.db.doc(`entitlements/${m.uid}`).set({ familyUntil: FieldValue.delete() }, { merge: true }).catch(() => {});
      }
    }
    await famRef.delete().catch(() => {});
  }
  // they are in someone else's family: take them out
  const owner = prof.get("familyOf") as string | undefined;
  if (owner && owner !== target) {
    const oref = a.db.doc(`families/${owner}`);
    const o = await oref.get();
    if (o.exists) {
      const members = ((o.get("members") as FM[]) ?? []).filter((m) => m.uid !== target);
      await oref.set({ members, memberUids: members.filter((m) => m.status === "active").map((m) => m.uid) }, { merge: true }).catch(() => {});
    }
  }
  await Promise.all([
    "profiles", "entitlements", "players", "xpLedger", "libraryState", "userAdmin", "admins",
    "hifz", "memberships", "ramadanProgress", "studyProgress", "studyResults", "city_players", "city_saves",
  ].map((c) => a.db.doc(`${c}/${target}`).delete().catch(() => {})));
  if (username) await a.db.doc(`usernames/${username}`).delete().catch(() => {});
  if (email) await a.db.doc(`emails/${email.toLowerCase()}`).delete().catch(() => {});
  // everything else that points at them (payments and prize records are kept)
  const delQ = async (q: FirebaseFirestore.Query) => { try { const snap = await q.get(); await Promise.all(snap.docs.map((d) => a.db.recursiveDelete(d.ref))); } catch { /* not used, or needs an index */ } };
  const col = (c: string) => a.db.collection(c);
  await Promise.all([
    ...["city_presence", "city_wallets", "city_homes", "usage", "playtime", "push"].map((c) => a.db.doc(`${c}/${target}`).delete().catch(() => {})),
    delQ(col("friendRequests").where("from", "==", target)), delQ(col("friendRequests").where("to", "==", target)),
    delQ(col("challenges").where("from", "==", target)), delQ(col("challenges").where("to", "==", target)),
    delQ(col("city_chats").where("members", "array-contains", target)),
    delQ(col("city_phones").where("uid", "==", target)), delQ(col("city_plots").where("owner", "==", target)),
    delQ(col("city_knocks").where("from", "==", target)), delQ(col("city_knocks").where("to", "==", target)),
    delQ(col("city_matches").where("a", "==", target)), delQ(col("city_matches").where("b", "==", target)),
    delQ(col("city_rooms").where("owner", "==", target)), delQ(col("city_enquiries").where("from", "==", target)),
    delQ(col("city_ads").where("from", "==", target)), delQ(col("city_home_likes").where("from", "==", target)),
    delQ(col("city_transfers").where("from", "==", target)), delQ(col("city_transfers").where("to", "==", target)),
    delQ(a.db.collectionGroup("posts").where("uid", "==", target)),
    delQ(a.db.collectionGroup("messages").where("uid", "==", target)),
  ]);
  await a.auth.deleteUser(target).catch(() => {});
}
