import { admin } from "./money-server";

/** Real numbers for the admin dashboard (admins only). */
const DAY = 86_400_000;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });

export async function handleStats(request: Request): Promise<Response> {
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  let uid: string;
  try { uid = (await a.auth.verifyIdToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""))).uid; } catch { return json({ error: "Not signed in" }, 401); }
  if (!(await a.db.doc(`admins/${uid}`).get()).exists) return json({ error: "Admins only" }, 403);
  const now = Date.now();

  const users: { email: string; name: string; created: number }[] = [];
  let token: string | undefined;
  do {
    const page = await a.auth.listUsers(1000, token);
    for (const u of page.users) users.push({ email: u.email ?? "", name: u.displayName ?? "", created: Date.parse(u.metadata.creationTime) || 0 });
    token = page.pageToken;
  } while (token && users.length < 20000);
  const days = Array.from({ length: 14 }, (_, i) => new Date(now - (13 - i) * DAY).toISOString().slice(0, 10));
  const signups = days.map((d) => ({ day: d.slice(5), count: users.filter((u) => new Date(u.created).toISOString().slice(0, 10) === d).length }));

  const cnt = async (q: FirebaseFirestore.Query) => (await q.count().get()).data().count;
  const lagosToday = new Date(now + 3_600_000).toISOString().slice(0, 10);
  const [kids, youth, adult, managed, families, reports, books, online, learnersToday] = await Promise.all([
    cnt(a.db.collection("profiles").where("zone", "==", "kids")),
    cnt(a.db.collection("profiles").where("zone", "==", "youth")),
    cnt(a.db.collection("profiles").where("zone", "==", "adult")),
    cnt(a.db.collection("profiles").where("managed", "==", true)),
    cnt(a.db.collection("families")),
    cnt(a.db.collection("reports")),
    cnt(a.db.collection("library").where("status", "==", "published")),
    cnt(a.db.collection("players").where("lastSeen", ">=", now - DAY)).catch(() => 0),
    cnt(a.db.collection("xpLedger").where("day", "==", lagosToday)),
  ]);

  let paid = 0, trial = 0, other = 0;
  (await a.db.collection("entitlements").where("premiumUntil", ">", now).get()).forEach((d) => {
    const s = d.get("source");
    if (s === "trial") trial++; else if (s === "paystack") paid++; else other++;
  });

  const d0 = new Date(now);
  const monthStart = new Date(d0.getFullYear(), d0.getMonth(), 1).getTime();
  const revenue: Record<string, number> = {};
  (await a.db.collection("payments").where("at", ">=", monthStart).get()).forEach((p) => {
    const c = String(p.get("currency") ?? "NGN");
    revenue[c] = (revenue[c] ?? 0) + Number(p.get("amount") ?? 0) / 100;
  });
  const recentPays = (await a.db.collection("payments").orderBy("at", "desc").limit(5).get()).docs.map((p) => ({
    email: String(p.get("email") ?? ""), amount: Number(p.get("amount") ?? 0) / 100, currency: String(p.get("currency") ?? "NGN"), planId: String(p.get("planId") ?? ""), at: Number(p.get("at") ?? 0),
  }));
  const recentUsers = [...users].sort((x, y) => y.created - x.created).slice(0, 6).map((u) => ({
    name: u.name, email: u.email.endsWith("@kids.ilmstation.com") ? `${u.email.split("@")[0]} (child)` : u.email, created: u.created,
  }));

  // quiz plays by topic, this month
  const ym = lagosToday.slice(0, 8);
  const dayRefs = Array.from({ length: Number(lagosToday.slice(8, 10)) }, (_, i) => a.db.doc(`statsDaily/${ym}${String(i + 1).padStart(2, "0")}`));
  const totals: Record<string, number> = {};
  for (const snap of dayRefs.length ? await a.db.getAll(...dayRefs) : []) {
    for (const [t, n] of Object.entries((snap.get("quiz") as Record<string, number>) ?? {})) totals[t] = (totals[t] ?? 0) + Number(n);
  }
  const quizTopics = Object.entries(totals).map(([topic, plays]) => ({ topic, plays })).sort((x, y) => y.plays - x.plays).slice(0, 8);

  return json({
    ok: true, quizTopics, total: users.length, newWeek: users.filter((u) => u.created >= now - 7 * DAY).length,
    online, learnersToday, zones: { kids, youth, adult }, managed, families, reports, books,
    premium: { paid, trial, other }, revenue, signups, recentPays, recentUsers,
  });
}
