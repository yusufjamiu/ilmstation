/* Paystack: players buy IlmWorld naira with real money.
   /api/pay/init     starts a payment and returns Paystack's checkout page
   /api/pay/verify   after checkout, asks Paystack if it was paid and fills the wallet
   /api/pay/webhook  Paystack tells us directly (in case the player closed the page)
   A payment fills the wallet once only (city_payments/{reference}).
   Needs PAYSTACK_SECRET_KEY (and FIREBASE_SERVICE_ACCOUNT) in the server's environment. */

import { createHmac } from "node:crypto";
import { admin, type Wallet } from "./money-server";
import { packById } from "../game/packs";

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
const secret = () => process.env.PAYSTACK_SECRET_KEY ?? "";

async function paystack(path: string, init?: RequestInit) {
  const r = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${secret()}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return (await r.json()) as {
    status: boolean;
    message?: string;
    data?: {
      authorization_url?: string;
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
      metadata?: { uid?: string; pack?: string };
    };
  };
}

/** Fill the wallet for a successful payment, once. */
async function credit(reference: string, uid: string, packId: string, amountKobo: number) {
  const a = await admin();
  if (!a) throw new Error("not-configured");
  const pack = packById(packId);
  if (!pack || amountKobo < pack.price * 100) return { ok: false, error: "wrong-amount" };
  const { db } = a;
  const payRef = db.collection("city_payments").doc(reference);
  const walletRef = db.collection("city_wallets").doc(uid);
  return db.runTransaction(async (tx) => {
    const [pay, w] = await Promise.all([tx.get(payRef), tx.get(walletRef)]);
    if (pay.exists && (pay.data() as { status?: string }).status === "credited")
      return { ok: true, already: true, naira: (w.data() as Wallet | undefined)?.naira };
    const now = Date.now();
    const wallet = (w.exists ? w.data() : null) as
      (Wallet & { packs?: Record<string, number> }) | null;
    const naira = (wallet?.naira ?? 0) + pack.units;
    tx.set(walletRef, {
      ...(wallet ?? { day: "", earnedToday: 0, createdAt: now }),
      naira,
      updatedAt: now,
      // a pack that gives something besides money is noted for the game to hand over
      ...(pack.rich ? { packs: { ...(wallet?.packs ?? {}), rich: now } } : {}),
    });
    tx.set(payRef, {
      uid,
      pack: pack.id,
      price: pack.price,
      units: pack.units,
      status: "credited",
      at: now,
    });
    return { ok: true, naira, pack: pack.id };
  });
}

async function who(request: Request) {
  const a = await admin();
  if (!a) return null;
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  try {
    const t = await a.auth.verifyIdToken(token);
    return { uid: t.uid, email: t.email ?? "" };
  } catch {
    return null;
  }
}

export async function handlePay(request: Request, path: string): Promise<Response> {
  if (request.method !== "POST") return reply(405, { error: "post-only" });
  if (!secret()) return reply(503, { error: "not-configured" });
  try {
    if (path === "/api/pay/webhook") {
      const raw = await request.text();
      const sig = request.headers.get("x-paystack-signature") ?? "";
      const want = createHmac("sha512", secret()).update(raw).digest("hex");
      if (sig !== want) return reply(401, { error: "bad-signature" });
      const ev = JSON.parse(raw) as {
        event: string;
        data: {
          reference: string;
          amount: number;
          currency: string;
          status: string;
          metadata?: { uid?: string; pack?: string };
        };
      };
      if (
        ev.event === "charge.success" &&
        ev.data.status === "success" &&
        ev.data.currency === "NGN" &&
        ev.data.metadata?.uid &&
        ev.data.metadata.pack
      )
        await credit(
          ev.data.reference,
          ev.data.metadata.uid,
          ev.data.metadata.pack,
          ev.data.amount,
        );
      return reply(200, { ok: true });
    }

    const me = await who(request);
    if (!me) return reply(401, { error: "sign-in" });
    const body = (await request.json().catch(() => ({}))) as { pack?: string; reference?: string };

    if (path === "/api/pay/init") {
      const pack = packById(String(body.pack));
      if (!pack) return reply(400, { error: "no-such-pack" });
      if (!me.email) return reply(400, { error: "no-email" });
      const origin = new URL(request.url).origin;
      const r = await paystack("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
          email: me.email,
          amount: pack.price * 100,
          currency: "NGN",
          callback_url: `${origin}/world`,
          metadata: { uid: me.uid, pack: pack.id },
        }),
      });
      if (!r.status || !r.data?.authorization_url) return reply(502, { error: "paystack" });
      return reply(200, { ok: true, url: r.data.authorization_url, reference: r.data.reference });
    }

    if (path === "/api/pay/verify") {
      const ref = String(body.reference ?? "").replace(/[^\w.-]/g, "");
      if (!ref) return reply(400, { error: "no-reference" });
      const r = await paystack(`/transaction/verify/${encodeURIComponent(ref)}`);
      const d = r.data;
      if (!r.status || d?.status !== "success" || d.currency !== "NGN")
        return reply(409, { ok: false, error: "not-paid" });
      if (d.metadata?.uid !== me.uid) return reply(403, { ok: false, error: "not-yours" });
      const out = await credit(ref, me.uid, String(d.metadata?.pack), Number(d.amount));
      return reply(out.ok ? 200 : 409, out);
    }
    return reply(404, { error: "not-found" });
  } catch (e) {
    console.error("IlmWorld pay", e);
    return reply(500, { error: "server" });
  }
}
