/* Ramadan prize quiz, marked on the server.
   POST /api/ramadan-quiz { day, picks } with the user's Firebase ID token.
   Checks: verified email, not kids, not suspended, quiz open, lesson/dua/reminder done,
   one entry per person, entry limit not reached. Answers stay hidden until results time. */
import { admin } from "./money-server";

const reply = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function handleRamadanQuiz(request: Request): Promise<Response> {
  if (request.method !== "POST") return reply(405, { error: "method" });
  const a = await admin();
  if (!a) return reply(500, { error: "server-not-set-up" });

  let uid: string;
  let verified = false;
  try {
    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const dec = await a.auth.verifyIdToken(token);
    uid = dec.uid;
    verified = dec.email_verified === true || dec.firebase?.sign_in_provider === "google.com";
  } catch {
    return reply(401, { error: "signed-out" });
  }
  if (!verified) return reply(403, { error: "verify-email" });

  let body: { day?: unknown; picks?: unknown };
  try { body = await request.json(); } catch { return reply(400, { error: "bad-request" }); }
  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > 30) return reply(400, { error: "bad-request" });

  const db = a.db;
  const [dayDoc, keyDoc, profile, ua, cfg, prog] = await Promise.all([
    db.doc(`ramadanDays/${day}`).get(), db.doc(`ramadanKeys/${day}`).get(), db.doc(`profiles/${uid}`).get(),
    db.doc(`userAdmin/${uid}`).get(), db.doc("ramadanConfig/current").get(), db.doc(`ramadanProgress/${uid}`).get(),
  ]);
  if (ua.get("status") === "suspended") return reply(403, { error: "suspended" });
  if (profile.get("zone") === "kids") return reply(403, { error: "kids" });

  const d = dayDoc.data();
  const quiz = (d?.quiz ?? []) as { options: string[] }[];
  const answers = (keyDoc.get("answers") ?? []) as number[];
  if (!d || !quiz.length || answers.length !== quiz.length) return reply(404, { error: "no-quiz" });

  const opensAt = Number(d.opensAt) || 0;
  const resultsAt = Number(d.resultsAt) || 0;
  const max = Number(d.maxEntries) || 1000;
  const now = Date.now();
  if (!opensAt || now < opensAt) return reply(403, { error: "not-open" });
  if (now >= resultsAt) return reply(403, { error: "closed" });

  const year = String(cfg.get("year") ?? 1448);
  const steps = (prog.get(`years.${year}.steps.${day}`) ?? []) as string[];
  if (!["lesson", "dua", "reminder"].every((s) => steps.includes(s))) return reply(403, { error: "steps-first" });

  const cooldown = Number(cfg.get("winCooldownDays") ?? 5);
  let recentWinner = false;
  for (let p = Math.max(1, day - cooldown + 1); p < day && !recentWinner; p++) {
    const pd = await db.doc(`ramadanDays/${p}`).get();
    const w = Number(pd.get("winners")) || 0;
    if (!pd.get("resultsAt") || !w) continue;
    const top = await db.collection(`ramadanResults/${p}/list`).orderBy("rankKey").limit(w).get();
    recentWinner = top.docs.some((x) => x.id === uid && x.get("correct") === true && x.get("recentWinner") !== true);
  }

  const picks = body.picks;
  if (!Array.isArray(picks) || picks.length !== quiz.length
    || picks.some((p, i) => !Number.isInteger(p) || p < 0 || p >= (quiz[i]?.options.length ?? 0)))
    return reply(400, { error: "bad-request" });

  const score = (picks as number[]).filter((p, i) => p === answers[i]).length;
  const correct = score === quiz.length;
  const name = (profile.get("username") as string) || String(profile.get("name") ?? "").split(/\s+/)[0] || "Learner";

  const entryRef = db.doc(`ramadanEntries/${day}/list/${uid}`);
  const resultRef = db.doc(`ramadanResults/${day}/list/${uid}`);
  const statsRef = db.doc(`ramadanStats/${day}`);
  try {
    const seq = await db.runTransaction(async (t) => {
      const [e, st] = await Promise.all([t.get(entryRef), t.get(statsRef)]);
      if (e.exists) throw new Error("already");
      const count = Number(st.get("count")) || 0;
      if (count >= max) throw new Error("full");
      const n = count + 1;
      const at = Date.now();
      t.set(entryRef, { uid, picks, seq: n, at });
      t.set(resultRef, { uid, name, score, total: quiz.length, correct, recentWinner, seq: n, at, rankKey: correct ? (recentWinner ? at + 5e12 : at) : at + 1e13 });
      t.set(statsRef, { count: n, max, updatedAt: at }, { merge: true });
      return n;
    });
    return reply(200, { ok: true, seq, max });
  } catch (err) {
    const code = (err as Error).message;
    if (code === "already" || code === "full") return reply(409, { error: code });
    return reply(500, { error: "failed" });
  }
}


/* ---------- prize payouts: winners give a Nigerian bank account, checked with Paystack ---------- */
const PAYSTACK = () => process.env.PAYSTACK_SECRET_KEY ?? "";
let bankCache: { at: number; banks: { name: string; code: string }[] } | null = null;
async function nigerianBanks() {
  if (bankCache && Date.now() - bankCache.at < 86_400_000) return bankCache.banks;
  const r = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=200", { headers: { authorization: `Bearer ${PAYSTACK()}` } });
  const j = (await r.json()) as { data?: { name: string; code: string }[] };
  const banks = (j.data ?? []).map((b) => ({ name: b.name, code: b.code })).sort((a, b) => a.name.localeCompare(b.name));
  if (banks.length) bankCache = { at: Date.now(), banks };
  return banks;
}
async function resolveAccount(accountNumber: string, bankCode: string): Promise<string | null> {
  const r = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${encodeURIComponent(bankCode)}`,
    { headers: { authorization: `Bearer ${PAYSTACK()}` } });
  const j = (await r.json().catch(() => ({}))) as { status?: boolean; data?: { account_name?: string } };
  return r.ok && j.status && j.data?.account_name ? j.data.account_name : null;
}

export async function handleRamadanPayout(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.searchParams.get("action") === "banks") {
    try { return reply(200, { banks: await nigerianBanks() }); } catch { return reply(500, { error: "banks" }); }
  }
  if (request.method !== "POST") return reply(405, { error: "method" });
  const a = await admin();
  if (!a) return reply(500, { error: "server-not-set-up" });

  let uid: string;
  try {
    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    uid = (await a.auth.verifyIdToken(token)).uid;
  } catch {
    return reply(401, { error: "signed-out" });
  }

  let body: { action?: unknown; day?: unknown; bankCode?: unknown; accountNumber?: unknown; phone?: unknown };
  try { body = await request.json(); } catch { return reply(400, { error: "bad-request" }); }
  const day = Number(body.day);
  const bankCode = typeof body.bankCode === "string" ? body.bankCode : "";
  const acct = typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!Number.isInteger(day) || day < 1 || day > 30 || !bankCode || !/^\d{10}$/.test(acct)) return reply(400, { error: "bad-request" });

  const db = a.db;
  // only real winners of that day, after results
  const dd = await db.doc(`ramadanDays/${day}`).get();
  const w = Number(dd.get("winners")) || 0;
  if (!dd.get("resultsAt") || Date.now() < Number(dd.get("resultsAt"))) return reply(403, { error: "not-out" });
  const top = await db.collection(`ramadanResults/${day}/list`).orderBy("rankKey").limit(w).get();
  const winner = top.docs.some((x) => x.id === uid && x.get("correct") === true && x.get("recentWinner") !== true);
  if (!winner) return reply(403, { error: "not-winner" });

  const accountName = await resolveAccount(acct, bankCode);
  if (!accountName) return reply(400, { error: "bad-account" });
  if (body.action === "resolve") return reply(200, { accountName });

  if (phone.length < 7 || phone.length > 20) return reply(400, { error: "bad-phone" });
  const id = `${day}_${uid}`;
  const existing = await db.doc(`ramadanPayouts/${id}`).get();
  if (existing.get("paid") === true) return reply(409, { error: "paid" });
  // one prize per bank account per day
  const dup = await db.collection("ramadanPayouts").where("day", "==", String(day)).where("accountNumber", "==", acct).get();
  if (dup.docs.some((d) => d.id !== id)) return reply(409, { error: "duplicate" });

  const bank = (await nigerianBanks()).find((b) => b.code === bankCode)?.name ?? bankCode;
  await db.doc(`ramadanPayouts/${id}`).set({
    uid, day: String(day), accountName, bank, bankCode, accountNumber: acct, accountLast4: acct.slice(-4), phone, paid: false, at: Date.now(),
  }, { merge: true });
  return reply(200, { ok: true, accountName });
}
