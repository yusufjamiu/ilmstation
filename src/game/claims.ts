/* Who lives where. Houses and land in the city are shared by every player, so a house can
   only be rented or owned by one player at a time: the first to claim it gets it, and a
   rented house is free again once the rent runs out. Flats in the estates are unlimited:
   every player has their own flat number. Firestore, or the browser on the dev server
   (?online=local). */

export type Claim = {
  plot: string;
  area: string;
  owner: string;
  name: string;
  kind: "rented" | "owned";
  /** rent paid up to (owned: far in the future) */
  until: number;
  at: number;
};
export interface Claims {
  /** Take a house or land. True if it is now yours (or already was). */
  claim(c: Omit<Claim, "at">): Promise<boolean>;
  /** Give it back. */
  release(plot: string, owner: string): Promise<void>;
  /** Houses taken in one area, by anyone. */
  watchArea(area: string, cb: (c: Claim[]) => void): () => void;
}
const live = (c: Claim) => c.until > Date.now();

/* ---------------- Firestore ---------------- */
export async function connectClaims(): Promise<Claims> {
  const { db } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  const { doc, collection, query, where, onSnapshot, runTransaction, deleteDoc, getDoc } = f;
  return {
    async claim(c) {
      const ref = doc(db, "city_plots", c.plot);
      return runTransaction(db, async (tx) => {
        const s = await tx.get(ref);
        const cur = s.exists() ? (s.data() as Claim) : null;
        if (cur && cur.owner !== c.owner && live(cur)) return false;
        tx.set(ref, { ...c, at: Date.now() });
        return true;
      });
    },
    async release(plot, owner) {
      const ref = doc(db, "city_plots", plot);
      const s = await getDoc(ref);
      if (s.exists() && (s.data() as Claim).owner === owner) await deleteDoc(ref);
    },
    watchArea(area, cb) {
      return onSnapshot(
        query(collection(db, "city_plots"), where("area", "==", area)),
        (s) => cb(s.docs.map((d) => d.data() as Claim).filter(live)),
        () => cb([]),
      );
    },
  };
}

/* ---------------- test backend (dev only) ---------------- */
export function connectClaimsLocal(): Claims {
  const K = "ilmcity-claims";
  const read = (): Record<string, Claim> => {
    try {
      return JSON.parse(localStorage.getItem(K) ?? "{}") as Record<string, Claim>;
    } catch {
      return {};
    }
  };
  const write = (v: Record<string, Claim>) => localStorage.setItem(K, JSON.stringify(v));
  return {
    async claim(c) {
      const all = read();
      const cur = all[c.plot];
      if (cur && cur.owner !== c.owner && live(cur)) return false;
      all[c.plot] = { ...c, at: Date.now() };
      write(all);
      return true;
    },
    async release(plot, owner) {
      const all = read();
      if (all[plot]?.owner === owner) delete all[plot];
      write(all);
    },
    watchArea(area, cb) {
      let last = "";
      const fn = () => {
        const list = Object.values(read()).filter((c) => c.area === area && live(c));
        const key = JSON.stringify(list);
        if (key !== last) {
          last = key;
          cb(list);
        }
      };
      fn();
      const iv = setInterval(fn, 1000);
      return () => clearInterval(iv);
    },
  };
}

/** Your own flat in an estate: a block letter and flat number that are yours alone. */
export function flatFor(uid: string) {
  let h = 2166136261;
  for (let i = 0; i < uid.length; i++) {
    h ^= uid.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  const block = "ABCDEFGHJKLMNPQRSTUVWXYZ"[h % 24];
  const flat = 1 + ((h >>> 5) % 9999);
  return { label: `Block ${block}, Flat ${flat}`, seed: h };
}
