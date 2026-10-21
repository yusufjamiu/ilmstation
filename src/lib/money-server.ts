/* IlmWorld money, kept on the server.
   Every player's naira lives in city_wallets/{uid}, which players can read but never write.
   The game asks this endpoint to change it:
   - spending is refused when the wallet doesn't hold enough;
   - earning is limited per event and per day, so a tampered game can't print money;
   - buying a house from another player moves the money and the house in one step;
   - selling a house to the city is checked against who really owns it.
   It needs FIREBASE_SERVICE_ACCOUNT (the service account JSON, or the same base64-encoded)
   in the server's environment. */

/** wallet amounts are in ₦10 units, like the game */
export const LIMITS = {
  /** the most a single earning can add */
  earnPerEvent: 2000,
  /** the most a player can earn in a day from the game (not counting house sales) */
  earnPerDay: 3000,
  /** the most a house sold to the city can pay, once a day */
  sellHousePerDay: 20000,
  /** the most one player can send another at a time */
  sendPerTransfer: 5000,
  /** biggest single change accepted at all */
  maxChange: 200000,
};
/** What a new wallet starts with: ₦200 for a new player; players from before the wallets
    start again with their welcome gift included (the old test money is not carried over). */
export function startingMoney(path: string | undefined, existing: boolean) {
  if (!existing) return 20;
  return path === "rich" ? 620 : 120;
}

export type Wallet = {
  naira: number;
  day: string;
  earnedToday: number;
  soldHouseDay?: string;
  createdAt: number;
  updatedAt: number;
};
const today = (now: number) => new Date(now).toISOString().slice(0, 10);

/** The rules for one change, without the database: what the wallet becomes, or why not. */
export function applyChange(
  w: Wallet,
  delta: number,
  now: number,
): { ok: true; wallet: Wallet; credited: number } | { ok: false; error: string } {
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > LIMITS.maxChange)
    return { ok: false, error: "bad-amount" };
  const d = today(now);
  const earned = w.day === d ? w.earnedToday : 0;
  if (delta < 0) {
    if (w.naira + delta < 0) return { ok: false, error: "not-enough" };
    return {
      ok: true,
      credited: delta,
      wallet: { ...w, naira: w.naira + delta, day: d, earnedToday: earned, updatedAt: now },
    };
  }
  const room = Math.max(0, LIMITS.earnPerDay - earned);
  const add = Math.min(delta, LIMITS.earnPerEvent, room);
  if (add <= 0) return { ok: false, error: "daily-limit" };
  return {
    ok: true,
    credited: add,
    wallet: { ...w, naira: w.naira + add, day: d, earnedToday: earned + add, updatedAt: now },
  };
}

type Admin = {
  db: import("firebase-admin/firestore").Firestore;
  auth: import("firebase-admin/auth").Auth;
};
let adminP: Promise<Admin | null> | null = null;
export function admin(): Promise<Admin | null> {
  if (adminP) return adminP;
  adminP = (async () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) return null;
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const cred = JSON.parse(json) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    const { getAuth } = await import("firebase-admin/auth");
    const app =
      getApps().find((a) => a.name === "ilmworld") ??
      initializeApp(
        {
          credential: cert({
            projectId: cred.project_id,
            clientEmail: cred.client_email,
            privateKey: cred.private_key.replace(/\\n/g, "\n"),
          }),
        },
        "ilmworld",
      );
    return { db: getFirestore(app), auth: getAuth(app) };
  })().catch((e) => {
    console.error("IlmWorld money: could not start Firebase Admin", e);
    adminP = null;
    return null;
  });
  return adminP;
}

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

type Body = {
  op: "init" | "change" | "buyHouse" | "sellHouse" | "send";
  to?: string;
  fromName?: string;
  toName?: string;
  note?: string;
  delta?: number;
  reason?: string;
  path?: string;
  existing?: boolean;
  plot?: string;
  amount?: number;
  name?: string;
};

export async function handleMoney(request: Request): Promise<Response> {
  if (request.method !== "POST") return reply(405, { error: "post-only" });
  const a = await admin();
  if (!a) return reply(503, { error: "not-configured" });
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  let uid: string;
  try {
    uid = (await a.auth.verifyIdToken(token)).uid;
  } catch {
    return reply(401, { error: "sign-in" });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return reply(400, { error: "bad-request" });
  }
  const { db } = a;
  const walletRef = db.collection("city_wallets").doc(uid);
  const now = Date.now();
  try {
    if (body.op === "init") {
      // a player who already started (their save is in the cloud) gets the welcome gift back
      const saved = await db
        .collection("city_saves")
        .doc(uid)
        .get()
        .catch(() => null);
      let existing = !!body.existing;
      let path = body.path;
      if (saved?.exists) {
        try {
          const d = JSON.parse(String((saved.data() as { data?: string }).data ?? "{}")) as {
            profile?: unknown;
            path?: string;
          };
          if (d.profile) existing = true;
          path = path ?? d.path;
        } catch {
          /* an unreadable save: treat as new */
        }
      }
      const out = await db.runTransaction(async (tx) => {
        const s = await tx.get(walletRef);
        if (s.exists) return s.data() as Wallet;
        const w: Wallet = {
          naira: startingMoney(path, existing),
          day: today(now),
          earnedToday: 0,
          createdAt: now,
          updatedAt: now,
        };
        tx.set(walletRef, w);
        return w;
      });
      return reply(200, { ok: true, naira: out.naira });
    }

    if (body.op === "change") {
      const out = await db.runTransaction(async (tx) => {
        const s = await tx.get(walletRef);
        if (!s.exists) return { ok: false as const, error: "no-wallet" };
        const r = applyChange(s.data() as Wallet, Math.round(Number(body.delta)), now);
        if (r.ok) tx.set(walletRef, r.wallet);
        return r;
      });
      if (!out.ok) return reply(409, out);
      return reply(200, { ok: true, naira: out.wallet.naira, credited: out.credited });
    }

    if (body.op === "buyHouse" && body.plot) {
      const saleRef = db.collection("city_house_sales").doc(body.plot);
      const plotRef = db.collection("city_plots").doc(body.plot);
      const out = await db.runTransaction(async (tx) => {
        const [saleS, mine] = await Promise.all([tx.get(saleRef), tx.get(walletRef)]);
        if (!saleS.exists) return { ok: false, error: "not-for-sale" };
        const sale = saleS.data() as {
          status: string;
          seller: string;
          price: number;
          area: string;
        };
        if (sale.status !== "listed" || sale.seller === uid)
          return { ok: false, error: "not-for-sale" };
        if (!mine.exists) return { ok: false, error: "no-wallet" };
        const w = mine.data() as Wallet;
        if (w.naira < sale.price) return { ok: false, error: "not-enough" };
        const sellerRef = db.collection("city_wallets").doc(sale.seller);
        const sellerS = await tx.get(sellerRef);
        tx.set(walletRef, { ...w, naira: w.naira - sale.price, updatedAt: now });
        if (sellerS.exists) {
          const sw = sellerS.data() as Wallet;
          tx.set(sellerRef, { ...sw, naira: sw.naira + sale.price, updatedAt: now });
        }
        tx.update(saleRef, {
          status: "sold",
          buyer: uid,
          buyerName: String(body.name ?? "A player").slice(0, 60),
          soldAt: now,
          // the seller's money is already in their wallet
          paid: true,
          paidByServer: true,
        });
        tx.set(plotRef, {
          plot: body.plot,
          area: sale.area,
          owner: uid,
          name: String(body.name ?? "A player").slice(0, 60),
          kind: "owned",
          until: now + 100 * 365 * 86400000,
          at: now,
        });
        return { ok: true, naira: w.naira - sale.price };
      });
      return reply(out.ok ? 200 : 409, out);
    }

    if (body.op === "sellHouse" && body.plot) {
      const amount = Math.round(Number(body.amount));
      if (!(amount > 0) || amount > LIMITS.sellHousePerDay)
        return reply(409, { ok: false, error: "bad-amount" });
      const plotRef = db.collection("city_plots").doc(body.plot);
      const saleRef = db.collection("city_house_sales").doc(body.plot);
      const out = await db.runTransaction(async (tx) => {
        const [p, mine, sale] = await Promise.all([
          tx.get(plotRef),
          tx.get(walletRef),
          tx.get(saleRef),
        ]);
        if (!p.exists || (p.data() as { owner: string }).owner !== uid)
          return { ok: false, error: "not-yours" };
        // a house must have been yours for a few days before the city buys it back
        if (now - ((p.data() as { at?: number }).at ?? 0) < 3 * 86400000)
          return { ok: false, error: "too-new" };
        if (!mine.exists) return { ok: false, error: "no-wallet" };
        const w = mine.data() as Wallet;
        if (w.soldHouseDay === today(now)) return { ok: false, error: "one-a-day" };
        tx.delete(plotRef);
        if (sale.exists) tx.delete(saleRef);
        tx.set(walletRef, {
          ...w,
          naira: w.naira + amount,
          soldHouseDay: today(now),
          updatedAt: now,
        });
        return { ok: true, naira: w.naira + amount };
      });
      return reply(out.ok ? 200 : 409, out);
    }
    if (body.op === "send" && body.to && body.to !== uid) {
      const amount = Math.round(Number(body.amount));
      if (!(amount > 0) || amount > LIMITS.sendPerTransfer)
        return reply(409, { ok: false, error: "bad-amount" });
      const theirRef = db.collection("city_wallets").doc(body.to);
      const tRef = db.collection("city_transfers").doc();
      const out = await db.runTransaction(async (tx) => {
        const [mine, theirs] = await Promise.all([tx.get(walletRef), tx.get(theirRef)]);
        if (!mine.exists || !theirs.exists) return { ok: false, error: "no-wallet" };
        const w = mine.data() as Wallet,
          t = theirs.data() as Wallet;
        if (w.naira < amount) return { ok: false, error: "not-enough" };
        tx.set(walletRef, { ...w, naira: w.naira - amount, updatedAt: now });
        tx.set(theirRef, { ...t, naira: t.naira + amount, updatedAt: now });
        tx.set(tRef, {
          from: uid,
          fromName: String(body.fromName ?? "A player").slice(0, 60),
          to: body.to,
          toName: String(body.toName ?? "").slice(0, 60),
          amount,
          ...(body.note ? { note: String(body.note).slice(0, 80) } : {}),
          status: "sent",
          serverPaid: true,
          at: now,
        });
        return { ok: true, naira: w.naira - amount };
      });
      return reply(out.ok ? 200 : 409, out);
    }
    return reply(400, { error: "bad-request" });
  } catch (e) {
    console.error("IlmWorld money", e);
    return reply(500, { error: "server" });
  }
}
