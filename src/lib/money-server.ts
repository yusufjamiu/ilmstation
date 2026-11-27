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
/** For tests: use a stand-in for Firebase. */
export function setAdminForTest(a: Admin) {
  adminP = Promise.resolve(a);
}
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

/** Every house, plot of land and shop in the world (made from the game's map by
    scripts/world-catalog.py), so the server knows what each one is and what it costs. */
type Catalog = {
  plots: Record<string, { d: string; k: "h" | "l" | "s"; f?: number; t?: string }>;
  shops: Record<string, { d: string; k: string }>;
};
let catalogP: Promise<Catalog> | null = null;
const catalog = () =>
  (catalogP ??= import("./world-catalog.json").then((m) => (m.default ?? m) as Catalog));
/** "lekki-49~2" (phase 2 of house lekki-49) → "lekki-49" */
const plotBase = (id: string) => id.split("~")[0];
const DAY = 86400000;
const FOREVER = 100 * 365 * DAY;

/** What a fresh start empties: every player's progress, houses, shops, money and messages.
    Adverts, awards, nasheeds, sponsored quizzes, reports and payment records are kept. */
export const FRESH_START_WIPES = [
  "city_saves",
  "city_wallets",
  "city_plots",
  "city_shops",
  "city_house_sales",
  "city_transfers",
  "city_rooms",
  "city_homes",
  "city_home_likes",
  "city_knocks",
  "city_calls",
  "city_chats",
  "city_matches",
  "city_enquiries",
  "city_presence",
  "city_players",
  "city_race_runs",
];

/** The admin's price levels (city_config/prices), read at most once a minute. */
let pricesAt = 0;
async function loadPrices(db: FirebaseFirestore.Firestore) {
  if (Date.now() - pricesAt < 60000) return;
  const { applyPrices } = await import("../game/prices");
  const d = await db.collection("city_config").doc("prices").get().catch(() => null);
  applyPrices(d?.data());
  pricesAt = Date.now();
}
/** Blocked players (city_config/bans: uid → reason), read at most every 30 seconds. */
let bansAt = 0;
let bans: Record<string, string> = {};
async function bannedReason(db: FirebaseFirestore.Firestore, uid: string) {
  if (Date.now() - bansAt > 30000) {
    const d = await db.collection("city_config").doc("bans").get().catch(() => null);
    bans = ((d?.data() as { uids?: Record<string, string> } | undefined)?.uids ?? {}) as Record<string, string>;
    bansAt = Date.now();
  }
  return bans[uid] ?? null;
}
type SaveInfo = { uid: string; name: string; area: string; female: boolean; savedAt: number };
function saveInfo(id: string, d: FirebaseFirestore.DocumentData): SaveInfo {
  let name = "",
    area = "",
    female = false;
  try {
    const j = JSON.parse(String(d.data ?? "{}")) as {
      profile?: { name?: string; female?: boolean };
      homeArea?: string;
    };
    name = j.profile?.name ?? "";
    female = !!j.profile?.female;
    area = j.homeArea ?? "";
  } catch {
    /* unreadable */
  }
  return { uid: id, name, area, female, savedAt: Number(d.savedAt ?? 0) };
}

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

type Body = {
  op:
    | "init"
    | "change"
    | "buyHouse"
    | "sellHouse"
    | "send"
    | "freshStart"
    | "adminStats"
    | "plot"
    | "shop"
    | "starterShop"
    | "richHouse"
    | "starterHouse"
    | "raceStart"
    | "raceFinish"
    | "adminPlayers"
    | "adminPlayer"
    | "adminGive"
    | "adminBan"
    | "adminRentals"
    | "adminFree"
    | "adminPrices"
    | "adminNotice";
  q?: string;
  uid?: string;
  ban?: boolean;
  kind?: "plot" | "shop";
  id?: string;
  levels?: Record<string, unknown>;
  text?: string;
  hours?: number;
  race?: string;
  /** plot: rent a house, buy it, or buy land */
  how?: "rent" | "buy" | "land";
  days?: number;
  price?: number;
  sid?: string;
  products?: unknown[];
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
    if (String(body.op ?? "").startsWith("admin")) {
      const out = await adminOp(db, uid, body, now);
      if (out) return out;
    } else if (body.op !== "init") {
      // a blocked player can't spend, earn or rent
      const why = await bannedReason(db, uid);
      if (why !== null) return reply(403, { ok: false, error: "blocked", reason: why });
    }
    if (body.op === "plot" && body.plot) {
      // rent a house, buy one, or buy land: the price is checked, the money taken and the
      // house recorded as yours in one step
      const { housePrice, landPrice, MAX_MARKUP, r10 } = await import("../game/prices");
      await loadPrices(db);
      const cat = (await catalog()).plots[plotBase(body.plot)];
      const how = body.how;
      if (!cat || !how) return reply(400, { ok: false, error: "no-such-place" });
      if ((how === "land") !== (cat.k === "l") || cat.k === "s")
        return reply(400, { ok: false, error: "wrong-kind" });
      const hp = housePrice(cat.d, cat.f ?? 1, cat.t);
      const days = how === "rent" ? (Number(body.days) >= 30 ? 30 : 7) : 0;
      if (how === "rent" && cat.t === "tower") return reply(400, { ok: false, error: "buy-only" });
      const floor =
        how === "land"
          ? landPrice()
          : how === "buy"
            ? hp.buy
            : days === 30
              ? r10(hp.base * 3.4)
              : hp.base;
      const price = Math.round(Number(body.price) || 0);
      if (price < floor || price > floor * MAX_MARKUP)
        return reply(409, { ok: false, error: "wrong-price", floor });
      const plotRef = db.collection("city_plots").doc(body.plot);
      const out = await db.runTransaction(async (tx) => {
        const [p, mine] = await Promise.all([tx.get(plotRef), tx.get(walletRef)]);
        const cur = p.exists
          ? (p.data() as { owner: string; until: number; at?: number; kind: string })
          : null;
        if (cur && cur.owner !== uid && cur.until > now) return { ok: false, error: "taken" };
        if (!mine.exists) return { ok: false, error: "no-wallet" };
        const w = mine.data() as Wallet;
        if (w.naira < price) return { ok: false, error: "not-enough" };
        const same = !!cur && cur.owner === uid;
        const until =
          how === "rent" ? Math.max(now, same ? cur!.until : 0) + days * DAY : now + FOREVER;
        tx.set(walletRef, { ...w, naira: w.naira - price, updatedAt: now });
        tx.set(plotRef, {
          plot: body.plot,
          area: cat.d,
          owner: uid,
          name: String(body.name ?? "A player").slice(0, 60),
          kind: how === "rent" ? "rented" : "owned",
          until,
          at: same ? (cur!.at ?? now) : now,
        });
        return { ok: true, naira: w.naira - price, until };
      });
      return reply(out.ok ? 200 : 409, out);
    }

    if ((body.op === "shop" || body.op === "starterShop") && body.sid) {
      // rent a shop or a market stall (the first shop of a new trader is free for a week)
      const { shopPrice, MAX_MARKUP } = await import("../game/prices");
      await loadPrices(db);
      const cat = (await catalog()).shops[body.sid];
      if (!cat) return reply(400, { ok: false, error: "no-such-place" });
      const starter = body.op === "starterShop";
      const days = starter ? 7 : Number(body.days) >= 30 && cat.k === "shop" ? 30 : 7;
      const floor = starter ? 0 : shopPrice(cat.k, days);
      const price = starter ? 0 : Math.round(Number(body.price) || 0);
      if (price < floor || price > Math.max(floor, 1) * MAX_MARKUP)
        return reply(409, { ok: false, error: "wrong-price", floor });
      const shopRef = db.collection("city_shops").doc(body.sid);
      const out = await db.runTransaction(async (tx) => {
        const [sh, mine] = await Promise.all([tx.get(shopRef), tx.get(walletRef)]);
        const cur = sh.exists
          ? (sh.data() as { owner: string; until: number; name?: string; products?: unknown[] })
          : null;
        if (cur && cur.owner !== uid && cur.until > now) return { ok: false, error: "taken" };
        if (!mine.exists) return { ok: false, error: "no-wallet" };
        const w = mine.data() as Wallet & { starterShop?: number };
        if (starter && w.starterShop) return { ok: false, error: "already" };
        if (w.naira < price) return { ok: false, error: "not-enough" };
        const same = !!cur && cur.owner === uid;
        const until = Math.max(now, same ? cur!.until : 0) + days * DAY;
        tx.set(walletRef, {
          ...w,
          naira: w.naira - price,
          updatedAt: now,
          ...(starter ? { starterShop: now } : {}),
        });
        tx.set(shopRef, {
          sid: body.sid,
          owner: uid,
          ownerName: String(body.name ?? "A player").slice(0, 60),
          name: same ? (cur!.name ?? "") : "",
          products: same ? (cur!.products ?? []) : [],
          until,
          at: now,
        });
        return { ok: true, naira: w.naira - price, until };
      });
      return reply(out.ok ? 200 : 409, out);
    }

    if (body.op === "richHouse" && body.plot) {
      // the Rich family pack, bought with Paystack: one house of your own, free
      const cat = (await catalog()).plots[plotBase(body.plot)];
      if (!cat || cat.k !== "h" || cat.t === "tower")
        return reply(400, { ok: false, error: "no-such-place" });
      const plotRef = db.collection("city_plots").doc(body.plot);
      const out = await db.runTransaction(async (tx) => {
        const [p, mine] = await Promise.all([tx.get(plotRef), tx.get(walletRef)]);
        if (!mine.exists) return { ok: false, error: "no-wallet" };
        const w = mine.data() as Wallet & { packs?: { rich?: number; richHouse?: number } };
        if (!w.packs?.rich) return { ok: false, error: "no-pack" };
        if (w.packs.richHouse) return { ok: false, error: "already" };
        const cur = p.exists ? (p.data() as { owner: string; until: number }) : null;
        if (cur && cur.owner !== uid && cur.until > now) return { ok: false, error: "taken" };
        tx.set(walletRef, { ...w, packs: { ...w.packs, richHouse: now }, updatedAt: now });
        tx.set(plotRef, {
          plot: body.plot,
          area: cat.d,
          owner: uid,
          name: String(body.name ?? "A player").slice(0, 60),
          kind: "owned",
          until: now + FOREVER,
          at: now,
        });
        return { ok: true, naira: w.naira };
      });
      return reply(out.ok ? 200 : 409, out);
    }

    if (body.op === "starterHouse" && body.plot) {
      // every new player is given one small house of their own, free, in the area they choose
      const cat = (await catalog()).plots[plotBase(body.plot)];
      if (!cat || cat.k !== "h" || cat.t === "tower" || (cat.f ?? 1) > 1)
        return reply(400, { ok: false, error: "no-such-place" });
      const plotRef = db.collection("city_plots").doc(body.plot);
      const out = await db.runTransaction(async (tx) => {
        const [p, mine] = await Promise.all([tx.get(plotRef), tx.get(walletRef)]);
        if (!mine.exists) return { ok: false, error: "no-wallet" };
        const w = mine.data() as Wallet & { starterHouse?: number };
        if (w.starterHouse) return { ok: false, error: "already" };
        const cur = p.exists ? (p.data() as { owner: string; until: number }) : null;
        if (cur && cur.owner !== uid && cur.until > now) return { ok: false, error: "taken" };
        tx.set(walletRef, { ...w, starterHouse: now, updatedAt: now });
        tx.set(plotRef, {
          plot: body.plot,
          area: cat.d,
          owner: uid,
          name: String(body.name ?? "A player").slice(0, 60),
          kind: "owned",
          until: now + FOREVER,
          at: now,
        });
        return { ok: true, naira: w.naira };
      });
      return reply(out.ok ? 200 : 409, out);
    }

    if ((body.op === "raceStart" || body.op === "raceFinish") && body.race) {
      // race times are kept by the server's clock: the game says when you start and when you
      // cross the line, and the server works out the time and keeps your best
      const { MIN_LAP_MS } = await import("../game/races");
      const raceRef = db.collection("city_races").doc(body.race);
      const runRef = db.collection("city_race_runs").doc(`${body.race}_${uid}`);
      const r = await raceRef.get();
      const race = r.data() as
        | { status: string; from: number; until: number; laps: number; kind: "run" | "bike" }
        | undefined;
      if (!race || race.status !== "open" || race.from > now || race.until < now)
        return reply(409, { ok: false, error: "closed" });
      if (body.op === "raceStart") {
        await runRef.set({ uid, race: body.race, start: now });
        return reply(200, { ok: true });
      }
      const run = (await runRef.get()).data() as { start: number } | undefined;
      if (!run) return reply(409, { ok: false, error: "no-start" });
      const ms = now - run.start;
      await runRef.delete();
      if (ms < MIN_LAP_MS[race.kind] * race.laps)
        return reply(409, { ok: false, error: "too-fast", ms });
      if (ms > 30 * 60000) return reply(409, { ok: false, error: "too-slow", ms });
      const entryRef = raceRef.collection("entries").doc(uid);
      const out = await db.runTransaction(async (tx) => {
        const old = await tx.get(entryRef);
        const prev = old.exists
          ? (old.data() as { ms: number; tries?: number; paid?: boolean })
          : null;
        const best = prev ? Math.min(prev.ms, ms) : ms;
        tx.set(entryRef, {
          uid,
          name: String(body.name ?? "A player").slice(0, 60),
          ms: best,
          tries: (prev?.tries ?? 0) + 1,
          at: now,
          ...(prev?.paid ? { paid: true } : {}),
        });
        return { best, improved: !prev || ms < prev.ms };
      });
      return reply(200, { ok: true, ms, ...out });
    }

    if (body.op === "adminStats") {
      // admins only: how IlmWorld is doing, at a glance
      const isAdmin = (await db.collection("admins").doc(uid).get()).exists;
      if (!isAdmin) return reply(403, { error: "admins-only" });
      const count = async (q: FirebaseFirestore.Query) => (await q.count().get()).data().count;
      const day = 86400000;
      const [players, active, houses, shops, wallets, reports] = await Promise.all([
        count(db.collection("city_saves")),
        count(db.collection("city_saves").where("savedAt", ">", now - day)),
        count(db.collection("city_plots").where("until", ">", now)),
        count(db.collection("city_shops").where("until", ">", now)),
        db.collection("city_wallets").select("naira").get(),
        count(db.collection("city_reports").where("status", "==", "open")),
      ]);
      const money = wallets.docs.reduce((a, d) => a + (Number(d.get("naira")) || 0), 0);
      const byArea: Record<string, number> = {};
      const plots = await db.collection("city_plots").where("until", ">", now).select("area").get();
      for (const d of plots.docs) {
        const a = String(d.get("area") ?? "?");
        byArea[a] = (byArea[a] ?? 0) + 1;
      }
      const reset = (await db.collection("city_config").doc("reset").get()).data()?.at ?? null;
      return reply(200, { ok: true, players, active, houses, shops, money, reports, byArea, reset });
    }
    if (body.op === "freshStart") {
      // admins only: everyone starts IlmWorld again from nothing (accounts are kept)
      const isAdmin = (await db.collection("admins").doc(uid).get()).exists;
      if (!isAdmin) return reply(403, { error: "admins-only" });
      await db.collection("city_config").doc("reset").set({ at: now, by: uid });
      const counts: Record<string, number> = {};
      for (const name of FRESH_START_WIPES) {
        const ref = db.collection(name);
        counts[name] = (await ref.count().get()).data().count;
        await db.recursiveDelete(ref);
      }
      return reply(200, { ok: true, at: now, counts });
    }
    if (body.op === "init") {
      // a player who already started (their save is in the cloud) gets the welcome gift back
      const saved = await db
        .collection("city_saves")
        .doc(uid)
        .get()
        .catch(() => null);
      let existing = !!body.existing;
      let path = body.path;
      // a save from before the last fresh start doesn't count
      const reset = Number(
        ((await db.collection("city_config").doc("reset").get()).data() as { at?: number })?.at ??
          0,
      );
      if (saved?.exists && Number((saved.data() as { savedAt?: number }).savedAt ?? 0) >= reset) {
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
      const why = await bannedReason(db, uid);
      return reply(200, { ok: true, naira: out.naira, ...(why !== null ? { blocked: why || "—" } : {}) });
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

/** The admin's tools: players, money, blocking, who rents what, prices and notices.
    Returns null for ops it doesn't know (adminStats and freshStart are handled above). */
async function adminOp(
  db: FirebaseFirestore.Firestore,
  uid: string,
  body: Body,
  now: number,
): Promise<Response | null> {
  const ops = ["adminPlayers", "adminPlayer", "adminGive", "adminBan", "adminRentals", "adminFree", "adminPrices", "adminNotice"];
  if (!ops.includes(body.op)) return null;
  if (!(await db.collection("admins").doc(uid).get()).exists) return reply(403, { error: "admins-only" });
  const log = (what: string, extra: Record<string, unknown> = {}) =>
    db.collection("city_admin_log").add({ by: uid, what, at: now, ...extra });
  const bansRef = db.collection("city_config").doc("bans");
  const banList = async () =>
    ((await bansRef.get()).data() as { uids?: Record<string, string> } | undefined)?.uids ?? {};

  if (body.op === "adminPlayers") {
    // the players who played most recently, or those whose name or number matches
    const q = String(body.q ?? "").trim().toLowerCase();
    const snap = await db.collection("city_saves").orderBy("savedAt", "desc").limit(q ? 1500 : 80).get();
    let list = snap.docs.map((d) => saveInfo(d.id, d.data()));
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.uid.toLowerCase().includes(q));
    list = list.slice(0, 60);
    const wallets = list.length
      ? await db.getAll(...list.map((p) => db.collection("city_wallets").doc(p.uid)))
      : [];
    const b = await banList();
    return reply(200, {
      ok: true,
      players: list.map((p, i) => ({
        ...p,
        money: Number(wallets[i]?.get("naira") ?? 0),
        blocked: b[p.uid] ?? null,
      })),
    });
  }
  if (body.op === "adminPlayer" && body.uid) {
    const [plots, shops, w, sv] = await Promise.all([
      db.collection("city_plots").where("owner", "==", body.uid).get(),
      db.collection("city_shops").where("owner", "==", body.uid).get(),
      db.collection("city_wallets").doc(body.uid).get(),
      db.collection("city_saves").doc(body.uid).get(),
    ]);
    return reply(200, {
      ok: true,
      player: sv.exists ? saveInfo(sv.id, sv.data()!) : { uid: body.uid, name: "", area: "", female: false, savedAt: 0 },
      money: Number(w.get("naira") ?? 0),
      places: [
        ...plots.docs.map((d) => ({ kind: "plot", id: d.id, area: d.get("area"), how: d.get("kind"), until: d.get("until") })),
        ...shops.docs.map((d) => ({ kind: "shop", id: d.id, name: d.get("name") ?? "", until: d.get("until") })),
      ],
    });
  }
  if (body.op === "adminGive" && body.uid) {
    const delta = Math.round(Number(body.delta));
    if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 1000000)
      return reply(400, { ok: false, error: "bad-amount" });
    const ref = db.collection("city_wallets").doc(body.uid);
    const out = await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists) return { ok: false, error: "no-wallet" };
      const n = Math.max(0, Number(s.get("naira") ?? 0) + delta);
      tx.update(ref, { naira: n, updatedAt: now });
      return { ok: true, naira: n };
    });
    if (out.ok) await log("money", { uid: body.uid, delta, note: String(body.note ?? "").slice(0, 120) });
    return reply(out.ok ? 200 : 409, out);
  }
  if (body.op === "adminBan" && body.uid) {
    const reason = String(body.reason ?? "").slice(0, 160);
    await db.runTransaction(async (tx) => {
      const s = await tx.get(bansRef);
      const uids = { ...(((s.data() as { uids?: Record<string, string> } | undefined)?.uids) ?? {}) };
      if (body.ban) uids[body.uid!] = reason;
      else delete uids[body.uid!];
      tx.set(bansRef, { uids, at: now });
    });
    bansAt = 0;
    await log(body.ban ? "block" : "unblock", { uid: body.uid, reason });
    return reply(200, { ok: true });
  }
  if (body.op === "adminRentals") {
    const [plots, shops] = await Promise.all([
      db.collection("city_plots").where("until", ">", now).get(),
      db.collection("city_shops").where("until", ">", now).get(),
    ]);
    return reply(200, {
      ok: true,
      places: [
        ...plots.docs.map((d) => ({
          kind: "plot",
          id: d.id,
          area: String(d.get("area") ?? ""),
          how: String(d.get("kind") ?? ""),
          owner: String(d.get("owner") ?? ""),
          ownerName: String(d.get("name") ?? ""),
          until: Number(d.get("until") ?? 0),
        })),
        ...shops.docs.map((d) => ({
          kind: "shop",
          id: d.id,
          area: d.id.split("-")[0],
          how: d.id.includes("-m") ? "stall" : "shop",
          owner: String(d.get("owner") ?? ""),
          ownerName: String(d.get("ownerName") ?? ""),
          name: String(d.get("name") ?? ""),
          until: Number(d.get("until") ?? 0),
        })),
      ],
    });
  }
  if (body.op === "adminFree" && body.id && (body.kind === "plot" || body.kind === "shop")) {
    const col = body.kind === "plot" ? "city_plots" : "city_shops";
    const ref = db.collection(col).doc(body.id);
    const was = (await ref.get()).data();
    await ref.delete();
    if (body.kind === "plot") await db.collection("city_house_sales").doc(body.id).delete().catch(() => {});
    await log("free", { kind: body.kind, id: body.id, owner: was?.owner ?? null });
    return reply(200, { ok: true });
  }
  if (body.op === "adminPrices") {
    const { cleanLevels } = await import("../game/prices");
    const ref = db.collection("city_config").doc("prices");
    if (body.levels) {
      const levels = cleanLevels(body.levels);
      await ref.set({ ...levels, at: now, by: uid });
      pricesAt = 0;
      await log("prices", { levels });
      return reply(200, { ok: true, levels });
    }
    return reply(200, { ok: true, levels: cleanLevels((await ref.get()).data()) });
  }
  if (body.op === "adminNotice") {
    const ref = db.collection("city_config").doc("notice");
    if (body.text === undefined) return reply(200, { ok: true, notice: (await ref.get()).data() ?? null });
    const text = String(body.text).trim().slice(0, 240);
    const hours = Math.min(24 * 30, Math.max(1, Number(body.hours) || 24));
    await ref.set(text ? { text, at: now, until: now + hours * 3600000, by: uid } : { text: "", at: now, until: 0, by: uid });
    await log("notice", { text, hours });
    return reply(200, { ok: true });
  }
  return null;
}
