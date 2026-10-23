/* Market stalls and shops are shared by every player: one player rents a stall at a time,
   and everyone sees its name and products. Firestore, or the browser on the dev server
   (?online=local). */

export type SharedShop = {
  sid: string;
  owner: string;
  ownerName: string;
  name: string;
  products: { name: string; price: string; img: string }[];
  /** rent paid up to */
  until: number;
  at: number;
};
export interface Shops {
  /** Take a stall or shop. True if it is now yours (or already was). */
  claim(s: Omit<SharedShop, "at">): Promise<boolean>;
  /** Change your shop's name and products (the rent itself is paid through the server). */
  update(
    sid: string,
    o: { name: string; products: SharedShop["products"]; ownerName: string },
  ): Promise<void>;
  /** Every stall and shop rented right now, by anyone. */
  watch(cb: (s: SharedShop[]) => void): () => void;
}
const live = (s: SharedShop) => s.until > Date.now();

export async function connectShops(): Promise<Shops> {
  const { db } = await import("@/lib/firebase");
  const { doc, collection, query, where, onSnapshot, runTransaction, updateDoc } =
    await import("firebase/firestore");
  return {
    async claim(s) {
      const ref = doc(db, "city_shops", s.sid);
      return runTransaction(db, async (tx) => {
        const got = await tx.get(ref);
        const cur = got.exists() ? (got.data() as SharedShop) : null;
        if (cur && cur.owner !== s.owner && live(cur)) return false;
        tx.set(ref, { ...s, at: Date.now() });
        return true;
      });
    },
    async update(sid, o) {
      await updateDoc(doc(db, "city_shops", sid), o);
    },
    watch(cb) {
      return onSnapshot(
        query(collection(db, "city_shops"), where("until", ">", Date.now())),
        (snap) => cb(snap.docs.map((d) => d.data() as SharedShop).filter(live)),
        () => cb([]),
      );
    },
  };
}

export function connectShopsLocal(): Shops {
  const K = "ilmcity-shops";
  const read = (): Record<string, SharedShop> => {
    try {
      return JSON.parse(localStorage.getItem(K) ?? "{}") as Record<string, SharedShop>;
    } catch {
      return {};
    }
  };
  return {
    async claim(s) {
      const all = read();
      const cur = all[s.sid];
      if (cur && cur.owner !== s.owner && live(cur)) return false;
      all[s.sid] = { ...s, at: Date.now() };
      localStorage.setItem(K, JSON.stringify(all));
      return true;
    },
    async update(sid, o) {
      const all = read();
      if (all[sid]) all[sid] = { ...all[sid], ...o };
      localStorage.setItem(K, JSON.stringify(all));
    },
    watch(cb) {
      let last = "";
      const fn = () => {
        const list = Object.values(read()).filter(live);
        const key = JSON.stringify(list.map((s) => [s.sid, s.at]));
        if (key !== last) {
          last = key;
          cb(list);
        }
      };
      fn();
      const iv = setInterval(fn, 1500);
      return () => clearInterval(iv);
    },
  };
}
