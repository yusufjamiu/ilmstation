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
  /** open house: anyone may walk in without knocking */
  open?: boolean;
};
/** Someone at your door. */
export type Knock = {
  id: string;
  from: string;
  fromName: string;
  to: string;
  /** knocking → let in / not now; a guest who is in can be asked to leave (out) */
  status: "knocking" | "in" | "no" | "out" | "left";
  at: number;
};
export interface Homes {
  publish(h: Omit<ShownHome, "likes" | "likesWeek" | "at">): Promise<void>;
  top(cb: (h: ShownHome[]) => void): () => void;
  get(uid: string): Promise<ShownHome | null>;
  liked(owner: string, me: string): Promise<boolean>;
  like(owner: string, me: string): Promise<boolean>;
  knock(to: string, me: { uid: string; name: string }): Promise<string>;
  answer(id: string, status: Knock["status"]): Promise<void>;
  watchKnock(id: string, cb: (k: Knock | null) => void): () => void;
  /** knocks at your door and guests inside (the last hour) */
  watchDoor(owner: string, cb: (k: Knock[]) => void): () => void;
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
  const {
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    writeBatch,
  } = f;
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
    async knock(to, me) {
      const r = await addDoc(collection(db, "city_knocks"), {
        from: me.uid,
        fromName: me.name,
        to,
        status: "knocking",
        at: Date.now(),
      });
      return r.id;
    },
    async answer(id, status) {
      await updateDoc(doc(db, "city_knocks", id), { status });
    },
    watchKnock(id, cb) {
      return onSnapshot(
        doc(db, "city_knocks", id),
        (s) => cb(s.exists() ? ({ ...(s.data() as Knock), id: s.id } as Knock) : null),
        () => cb(null),
      );
    },
    watchDoor(owner, cb) {
      return onSnapshot(
        query(collection(db, "city_knocks"), where("to", "==", owner)),
        (s) =>
          cb(
            s.docs
              .map((d) => ({ ...(d.data() as Knock), id: d.id }))
              .filter((k) => Date.now() - k.at < 3600_000),
          ),
        () => cb([]),
      );
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
  const readK = (): Record<string, Knock> => {
    try {
      return JSON.parse(localStorage.getItem(K + "-knocks") ?? "{}") as Record<string, Knock>;
    } catch {
      return {};
    }
  };
  const writeK = (v: Record<string, Knock>) =>
    localStorage.setItem(K + "-knocks", JSON.stringify(v));
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
    async knock(to, me) {
      const id = "k" + Date.now().toString(36);
      const all = readK();
      all[id] = { id, from: me.uid, fromName: me.name, to, status: "knocking", at: Date.now() };
      writeK(all);
      return id;
    },
    async answer(id, status) {
      const all = readK();
      if (all[id]) all[id] = { ...all[id], status };
      writeK(all);
    },
    watchKnock(id, cb) {
      let last = "";
      const fn = () => {
        const k = readK()[id] ?? null;
        const key = JSON.stringify(k);
        if (key !== last) {
          last = key;
          cb(k);
        }
      };
      fn();
      const iv = setInterval(fn, 700);
      return () => clearInterval(iv);
    },
    watchDoor(owner, cb) {
      let last = "";
      const fn = () => {
        const list = Object.values(readK()).filter(
          (k) => k.to === owner && Date.now() - k.at < 3600_000,
        );
        const key = JSON.stringify(list);
        if (key !== last) {
          last = key;
          cb(list);
        }
      };
      fn();
      const iv = setInterval(fn, 700);
      return () => clearInterval(iv);
    },
  };
}
