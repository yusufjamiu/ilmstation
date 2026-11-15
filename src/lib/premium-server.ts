import { admin } from "./money-server";
import { mergePremium } from "./premium-config";

/** Premium and points live on the server: trial, unlocking with points, redeeming points, admin grants. */
const DAY = 86_400_000;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const int = (v: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));

export async function handlePremium(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  let uid: string;
  try { uid = (await a.auth.verifyIdToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""))).uid; } catch { return json({ error: "Not signed in" }, 401); }
  const { action, data = {} } = (await request.json().catch(() => ({}))) as { action?: string; data?: Record<string, unknown> };
  const cfg = mergePremium((await a.db.doc("siteConfig/premium").get()).data());
  const ref = a.db.doc(`entitlements/${uid}`);
  const now = Date.now();

  // first visit: start the free trial (once per account)
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
    return json({ ok: true });
  }

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
      const plan = cur > now && e.get("source") !== "trial" ? e.get("plan") : "points";
      tx.set(ref, { points: pts - o.points, premiumUntil: until, plan, source: plan === "points" ? "points" : e.get("source") }, { merge: true });
      return { ok: true, until };
    });
    return json(r);
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
