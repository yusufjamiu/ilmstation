/* Houses players sell to each other. The seller lists a house at a price (within the game's
   limits); a buyer takes it in one step, which also moves the house's record to them, and the
   seller's game collects the money. Firestore, or the browser on the dev server. */

export type HouseSale = {
  plot: string;
  area: string;
  seller: string;
  sellerName: string;
  /** in ₦10 units, like the wallet */
  price: number;
  kind: "bought" | "built";
  floors: number;
  label: string;
  status: "listed" | "sold";
  buyer?: string;
  buyerName?: string;
  paid?: boolean;
  at: number;
};
export interface HouseSales {
  list(s: Omit<HouseSale, "status" | "at">): Promise<void>;
  unlist(plot: string): Promise<void>;
  /** True if the house is now yours. */
  buy(plot: string, buyer: string, buyerName: string): Promise<boolean>;
  markPaid(plot: string): Promise<void>;
  /** Houses listed for sale in an area. */
  watchArea(area: string, cb: (s: HouseSale[]) => void): () => void;
  /** Your own sales: listed, and sold but not yet paid out. */
  watchMine(seller: string, cb: (s: HouseSale[]) => void): () => void;
}
const FAR = 100 * 365 * 86400000;

export async function connectHouseSales(): Promise<HouseSales> {
  const { db } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  const {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    runTransaction,
    setDoc,
    deleteDoc,
    updateDoc,
  } = f;
  return {
    async list(s) {
      await setDoc(doc(db, "city_house_sales", s.plot), { ...s, status: "listed", at: Date.now() });
    },
    async unlist(plot) {
      await deleteDoc(doc(db, "city_house_sales", plot));
    },
    async buy(plot, buyer, buyerName) {
      const saleRef = doc(db, "city_house_sales", plot);
      const plotRef = doc(db, "city_plots", plot);
      return runTransaction(db, async (tx) => {
        const got = await tx.get(saleRef);
        if (!got.exists()) return false;
        const s = got.data() as HouseSale;
        if (s.status !== "listed" || s.seller === buyer) return false;
        tx.update(saleRef, { status: "sold", buyer, buyerName, soldAt: Date.now() });
        tx.set(plotRef, {
          plot,
          area: s.area,
          owner: buyer,
          name: buyerName,
          kind: "owned",
          until: Date.now() + FAR,
          at: Date.now(),
        });
        return true;
      });
    },
    async markPaid(plot) {
      await updateDoc(doc(db, "city_house_sales", plot), { paid: true });
    },
    watchArea(area, cb) {
      return onSnapshot(
        query(
          collection(db, "city_house_sales"),
          where("area", "==", area),
          where("status", "==", "listed"),
        ),
        (snap) => cb(snap.docs.map((d) => d.data() as HouseSale)),
        () => cb([]),
      );
    },
    watchMine(seller, cb) {
      return onSnapshot(
        query(collection(db, "city_house_sales"), where("seller", "==", seller)),
        (snap) => cb(snap.docs.map((d) => d.data() as HouseSale)),
        () => cb([]),
      );
    },
  };
}

export function connectHouseSalesLocal(): HouseSales {
  const K = "ilmcity-house-sales";
  const read = (): Record<string, HouseSale> => {
    try {
      return JSON.parse(localStorage.getItem(K) ?? "{}") as Record<string, HouseSale>;
    } catch {
      return {};
    }
  };
  const write = (v: Record<string, HouseSale>) => localStorage.setItem(K, JSON.stringify(v));
  const poll = (pick: (all: HouseSale[]) => HouseSale[], cb: (s: HouseSale[]) => void) => {
    let last = "";
    const fn = () => {
      const list = pick(Object.values(read()));
      const key = JSON.stringify(list);
      if (key !== last) {
        last = key;
        cb(list);
      }
    };
    fn();
    const iv = setInterval(fn, 1000);
    return () => clearInterval(iv);
  };
  return {
    async list(s) {
      const all = read();
      all[s.plot] = { ...s, status: "listed", at: Date.now() };
      write(all);
    },
    async unlist(plot) {
      const all = read();
      delete all[plot];
      write(all);
    },
    async buy(plot, buyer, buyerName) {
      const all = read();
      const s = all[plot];
      if (!s || s.status !== "listed" || s.seller === buyer) return false;
      all[plot] = { ...s, status: "sold", buyer, buyerName };
      write(all);
      // move the house's record to the buyer
      const claims = JSON.parse(localStorage.getItem("ilmcity-claims") ?? "{}");
      claims[plot] = {
        plot,
        area: s.area,
        owner: buyer,
        name: buyerName,
        kind: "owned",
        until: Date.now() + FAR,
        at: Date.now(),
      };
      localStorage.setItem("ilmcity-claims", JSON.stringify(claims));
      return true;
    },
    async markPaid(plot) {
      const all = read();
      if (all[plot]) all[plot].paid = true;
      write(all);
    },
    watchArea(area, cb) {
      return poll((all) => all.filter((s) => s.area === area && s.status === "listed"), cb);
    },
    watchMine(seller, cb) {
      return poll((all) => all.filter((s) => s.seller === seller), cb);
    },
  };
}
