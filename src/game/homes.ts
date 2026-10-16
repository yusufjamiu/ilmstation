/* Homes on show: every player who furnishes their home can be visited by others, who can
   like it once a week. The weeks run to Saturday, when the admin names the best home from the
   most liked. Firestore, or the browser on the dev server (?online=local). */

export type ShownHome = {
  uid: string;
  name: string;
  /** where it is, e.g. "Family house · Lekki" */
  place: string;
  items: string[];
  /** likes this week */
  likes: number;
  likesWeek: string;
  at: number;
};
export interface Homes {
  publish(h: Omit<ShownHome, "likes" | "likesWeek" | "at">): Promise<void>;
  top(cb: (h: ShownHome[]) => void): () => void;
  get(uid: string): Promise<ShownHome | null>;
  liked(owner: string, me: string): Promise<boolean>;
  like(owner: string, me: string): Promise<boolean>;
}

/** The Saturday that ends this week (today, if it is Saturday). */
export function weekKey(now = Date.now()) {
  const d = new Date(now);
  const add = (6 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0, 10);
}
const likesNow = (h: ShownHome) => (h.likesWeek === weekKey() ? h.likes : 0);

/* ---------------- Firestore ---------------- */
export async function connectHomes(): Promise<Homes> {
  const { db } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  const { doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot, writeBatch } = f;
  return {
    async publish(h) {
      const ref = doc(db, "city_homes", h.uid);
      const cur = await getDoc(ref).catch(() => null);
      const old = cur?.exists() ? (cur.data() as ShownHome) : null;
      await setDoc(ref, {
        ...h,
        likes: old ? old.likes : 0,
        likesWeek: old ? old.likesWeek : weekKey(),
        at: Date.now(),
      });
    },
    top(cb) {
      return onSnapshot(
        query(collection(db, "city_homes"), orderBy("likes", "desc"), limit(40)),
        (s) => {
          const all = s.docs.map((d) => d.data() as ShownHome);
          cb(
            all
              .map((h) => ({ ...h, likes: likesNow(h) }))
              .sort((a, b) => b.likes - a.likes || b.items.length - a.items.length),
          );
        },
        () => cb([]),
      );
    },
    async get(uid) {
      const s = await getDoc(doc(db, "city_homes", uid));
      return s.exists() ? (s.data() as ShownHome) : null;
    },
    async liked(owner, me) {
      const s = await getDoc(doc(db, "city_home_likes", `${weekKey()}_${owner}_${me}`));
      return s.exists();
    },
    async like(owner, me) {
      const wk = weekKey();
      const ref = doc(db, "city_homes", owner);
      const s = await getDoc(ref);
      if (!s.exists()) return false;
      const h = s.data() as ShownHome;
      const b = writeBatch(db);
      b.set(doc(db, "city_home_likes", `${wk}_${owner}_${me}`), {
        owner,
        from: me,
        week: wk,
        at: Date.now(),
      });
      b.update(ref, { likes: h.likesWeek === wk ? h.likes + 1 : 1, likesWeek: wk });
      await b.commit();
      return true;
    },
  };
}

/* ---------------- test backend (dev only) ---------------- */
export function connectHomesLocal(): Homes {
  const K = "ilmcity-homes";
  const read = (): Record<string, ShownHome> => {
    try {
      return JSON.parse(localStorage.getItem(K) ?? "{}") as Record<string, ShownHome>;
    } catch {
      return {};
    }
  };
  const write = (v: Record<string, ShownHome>) => localStorage.setItem(K, JSON.stringify(v));
  return {
    async publish(h) {
      const all = read();
      const old = all[h.uid];
      all[h.uid] = {
        ...h,
        likes: old?.likes ?? 0,
        likesWeek: old?.likesWeek ?? weekKey(),
        at: Date.now(),
      };
      write(all);
    },
    top(cb) {
      const fn = () =>
        cb(
          Object.values(read())
            .map((h) => ({ ...h, likes: likesNow(h) }))
            .sort((a, b) => b.likes - a.likes),
        );
      fn();
      const iv = setInterval(fn, 1500);
      return () => clearInterval(iv);
    },
    async get(uid) {
      return read()[uid] ?? null;
    },
    async liked(owner, me) {
      return !!localStorage.getItem(`${K}-like-${weekKey()}_${owner}_${me}`);
    },
    async like(owner, me) {
      const all = read();
      const h = all[owner];
      if (!h) return false;
      const wk = weekKey();
      localStorage.setItem(`${K}-like-${wk}_${owner}_${me}`, "1");
      all[owner] = { ...h, likes: h.likesWeek === wk ? h.likes + 1 : 1, likesWeek: wk };
      write(all);
      return true;
    },
  };
}
