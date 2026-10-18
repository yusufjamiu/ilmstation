/* Sending money to another player. The sender's wallet goes down at once and a transfer
   is written; when the other player is in the game, their phone marks it received (once,
   in a transaction) and adds it to their wallet. Firestore, or browser tabs on the dev
   server (?online=local). Amounts are in game units (₦10 each). */

export type Transfer = {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  note?: string;
  status: "sent" | "received";
  at: number;
};
export interface Transfers {
  send(t: Omit<Transfer, "id" | "status" | "at">): Promise<string>;
  /** money sent to you that you haven't taken in yet */
  watchIncoming(uid: string, cb: (t: Transfer[]) => void): () => void;
  /** take it in: true only the first time */
  receive(id: string): Promise<boolean>;
}

/** The most one transfer can carry (game units). */
export const MAX_TRANSFER = 5000;

/* ---------------- Firestore ---------------- */
export async function connectTransfers(): Promise<Transfers> {
  const { db } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  const { doc, addDoc, collection, query, where, onSnapshot, runTransaction } = f;
  return {
    async send(t) {
      // Firestore refuses undefined fields
      const clean = Object.fromEntries(Object.entries(t).filter(([, v]) => v !== undefined));
      const r = await addDoc(collection(db, "city_transfers"), {
        ...clean,
        status: "sent",
        at: Date.now(),
      });
      return r.id;
    },
    watchIncoming(uid, cb) {
      return onSnapshot(
        query(
          collection(db, "city_transfers"),
          where("to", "==", uid),
          where("status", "==", "sent"),
        ),
        (s) => cb(s.docs.map((d) => ({ ...(d.data() as Transfer), id: d.id }))),
        () => cb([]),
      );
    },
    async receive(id) {
      const ref = doc(db, "city_transfers", id);
      return runTransaction(db, async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists() || (s.data() as Transfer).status !== "sent") return false;
        tx.update(ref, { status: "received" });
        return true;
      });
    },
  };
}

/* ---------------- test backend (dev only) ---------------- */
export function connectTransfersLocal(): Transfers {
  const K = "ilmcity-transfers";
  const read = (): Record<string, Transfer> => {
    try {
      return JSON.parse(localStorage.getItem(K) ?? "{}") as Record<string, Transfer>;
    } catch {
      return {};
    }
  };
  const write = (v: Record<string, Transfer>) => localStorage.setItem(K, JSON.stringify(v));
  return {
    async send(t) {
      const id = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const all = read();
      all[id] = { ...t, id, status: "sent", at: Date.now() };
      write(all);
      return id;
    },
    watchIncoming(uid, cb) {
      let last = "";
      const fn = () => {
        const list = Object.values(read()).filter((t) => t.to === uid && t.status === "sent");
        const key = JSON.stringify(list.map((t) => t.id));
        if (key !== last) {
          last = key;
          cb(list);
        }
      };
      fn();
      const iv = setInterval(fn, 800);
      return () => clearInterval(iv);
    },
    async receive(id) {
      const all = read();
      if (!all[id] || all[id].status !== "sent") return false;
      all[id] = { ...all[id], status: "received" };
      write(all);
      return true;
    },
  };
}
