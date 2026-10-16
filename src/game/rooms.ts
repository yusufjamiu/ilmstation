/* Rooms to let between real players. An owner lists an empty room in a house they own;
   another player rents it for a week with points. The owner's game collects the rent the
   next time it sees the room was taken. Firestore, or the browser on the dev server. */

export type RoomAd = {
  id: string;
  owner: string;
  ownerName: string;
  plot: string;
  area: string;
  /** "No. 5, Sabr Avenue, Lekki" */
  label: string;
  /** room number in the house (0-based) */
  i: number;
  rent: number;
  tenant?: string | null;
  tenantName?: string | null;
  until?: number;
  /** the owner has collected this week's rent */
  paid?: boolean;
  at: number;
};
export interface RoomsNet {
  list(owner: string, plot: string, i: number, v: Omit<RoomAd, "id" | "at">): Promise<void>;
  unlist(id: string): Promise<void>;
  watchFree(cb: (r: RoomAd[]) => void): () => void;
  watchMine(owner: string, cb: (r: RoomAd[]) => void): () => void;
  rent(id: string, me: { uid: string; name: string }): Promise<RoomAd | null>;
  collected(id: string): Promise<void>;
}
export const roomId = (owner: string, plot: string, i: number) => `${owner}_${plot}_${i}`;
const free = (r: RoomAd) => !r.tenant || (r.until ?? 0) < Date.now();

/* ---------------- Firestore ---------------- */
export async function connectRooms(): Promise<RoomsNet> {
  const { db } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  const {
    doc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    onSnapshot,
    runTransaction,
    updateDoc,
  } = f;
  return {
    async list(owner, plot, i, v) {
      await setDoc(doc(db, "city_rooms", roomId(owner, plot, i)), { ...v, at: Date.now() });
    },
    async unlist(id) {
      await deleteDoc(doc(db, "city_rooms", id));
    },
    watchFree(cb) {
      return onSnapshot(
        collection(db, "city_rooms"),
        (s) => cb(s.docs.map((d) => ({ ...(d.data() as RoomAd), id: d.id })).filter(free)),
        () => cb([]),
      );
    },
    watchMine(owner, cb) {
      return onSnapshot(
        query(collection(db, "city_rooms"), where("owner", "==", owner)),
        (s) => cb(s.docs.map((d) => ({ ...(d.data() as RoomAd), id: d.id }))),
        () => cb([]),
      );
    },
    async rent(id, me) {
      const ref = doc(db, "city_rooms", id);
      return runTransaction(db, async (t) => {
        const s = await t.get(ref);
        if (!s.exists()) return null;
        const r = { ...(s.data() as RoomAd), id };
        if (!free(r) || r.owner === me.uid) return null;
        const next = {
          tenant: me.uid,
          tenantName: me.name,
          until: Date.now() + 7 * 86400000,
          paid: false,
        };
        t.update(ref, next);
        return { ...r, ...next };
      });
    },
    async collected(id) {
      await updateDoc(doc(db, "city_rooms", id), { paid: true });
    },
  };
}

/* ---------------- test backend (dev only) ---------------- */
export function connectRoomsLocal(): RoomsNet {
  const K = "ilmcity-rooms";
  const read = (): Record<string, RoomAd> => {
    try {
      return JSON.parse(localStorage.getItem(K) ?? "{}") as Record<string, RoomAd>;
    } catch {
      return {};
    }
  };
  const write = (v: Record<string, RoomAd>) => localStorage.setItem(K, JSON.stringify(v));
  const poll = (fn: () => void) => {
    fn();
    const iv = setInterval(fn, 1200);
    return () => clearInterval(iv);
  };
  return {
    async list(owner, plot, i, v) {
      const all = read();
      const id = roomId(owner, plot, i);
      all[id] = { ...v, id, at: Date.now() };
      write(all);
    },
    async unlist(id) {
      const all = read();
      delete all[id];
      write(all);
    },
    watchFree(cb) {
      return poll(() => cb(Object.values(read()).filter(free)));
    },
    watchMine(owner, cb) {
      return poll(() => cb(Object.values(read()).filter((r) => r.owner === owner)));
    },
    async rent(id, me) {
      const all = read();
      const r = all[id];
      if (!r || !free(r) || r.owner === me.uid) return null;
      all[id] = {
        ...r,
        tenant: me.uid,
        tenantName: me.name,
        until: Date.now() + 7 * 86400000,
        paid: false,
      };
      write(all);
      return all[id];
    },
    async collected(id) {
      const all = read();
      if (all[id]) all[id] = { ...all[id], paid: true };
      write(all);
    },
  };
}
