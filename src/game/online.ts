/* IlmCity online: other real players in the city, chat between them, and reports.
   Data lives in Firestore (collections city_presence, city_players, city_chats,
   city_reports). On the dev server, `?online=local` swaps in a test backend that
   connects browser tabs on the same computer, so the whole flow can be tried
   without Firebase. */

export type PlayerLook = { female: boolean; skin: number; robe: number; accent: number };
export type Presence = {
  uid: string;
  name: string;
  look: PlayerLook;
  x: number;
  z: number;
  h: number;
  moving: boolean;
  area: string;
  t: number;
};
export type ChatMsg = { id: string; from: string; text: string; at: number };
export type ChatInfo = {
  id: string;
  members: string[];
  names: Record<string, string>;
  lastText: string;
  lastAt: number;
  lastFrom: string;
};
export type PlayerStatus = {
  /** people you have started conversations with */
  partners: string[];
  /** unlimited chat until this time (ms) */
  passUntil: number;
  /** a fine in naira set by the admin after a confirmed report; chat is closed until paid */
  fine: number;
  fineReason?: string;
  blocked: string[];
};
export type Report = {
  reported: string;
  reportedName: string;
  reason: string;
  details: string;
  chatId: string;
  messages: { from: string; text: string }[];
};

export interface Online {
  uid: string;
  setPresence(p: Omit<Presence, "uid" | "t">): void;
  leave(): void;
  watchArea(area: string, cb: (players: Presence[]) => void): () => void;
  watchInbox(cb: (chats: ChatInfo[]) => void): () => void;
  watchChat(chatId: string, cb: (msgs: ChatMsg[]) => void): () => void;
  openChat(other: { uid: string; name: string }, myName: string): Promise<string>;
  send(chatId: string, text: string): Promise<void>;
  status(): Promise<PlayerStatus>;
  saveStatus(s: Partial<PlayerStatus>): Promise<void>;
  report(r: Report): Promise<void>;
}

export const chatIdFor = (a: string, b: string) => [a, b].sort().join("__");
export const ONLINE_LIMITS = {
  freePartners: 3,
  pass: {
    week: { days: 7, naira: 500, points: 50 },
    month: { days: 30, naira: 2000, points: 200 },
  },
  /** players not heard from for this long have left */
  staleMs: 45_000,
};
const emptyStatus = (): PlayerStatus => ({ partners: [], passUntil: 0, fine: 0, blocked: [] });

/* ---------------- Firestore ---------------- */

export async function connectFirestore(uid: string): Promise<Online> {
  const { db } = await import("@/lib/firebase");
  const fs = await import("firebase/firestore");
  const {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    orderBy,
    limit,
    updateDoc,
  } = fs;
  return {
    uid,
    setPresence(p) {
      void setDoc(doc(db, "city_presence", uid), { ...p, uid, t: Date.now() }).catch(() => {});
    },
    leave() {
      void setDoc(doc(db, "city_presence", uid), { t: 0 }, { merge: true }).catch(() => {});
    },
    watchArea(area, cb) {
      return onSnapshot(
        query(collection(db, "city_presence"), where("area", "==", area)),
        (snap) => {
          const now = Date.now();
          cb(
            snap.docs
              .map((d) => d.data() as Presence)
              .filter((p) => p.uid !== uid && now - p.t < ONLINE_LIMITS.staleMs),
          );
        },
        () => cb([]),
      );
    },
    watchInbox(cb) {
      return onSnapshot(
        query(collection(db, "city_chats"), where("members", "array-contains", uid)),
        (snap) =>
          cb(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<ChatInfo, "id">), id: d.id }))
              .sort((a, b) => b.lastAt - a.lastAt),
          ),
        () => cb([]),
      );
    },
    watchChat(chatId, cb) {
      return onSnapshot(
        query(collection(db, "city_chats", chatId, "messages"), orderBy("at"), limit(200)),
        (snap) => cb(snap.docs.map((d) => ({ ...(d.data() as Omit<ChatMsg, "id">), id: d.id }))),
        () => cb([]),
      );
    },
    async openChat(other, myName) {
      const id = chatIdFor(uid, other.uid);
      const ref = doc(db, "city_chats", id);
      const snap = await getDoc(ref).catch(() => null);
      if (!snap?.exists())
        await setDoc(ref, {
          members: [uid, other.uid].sort(),
          names: { [uid]: myName, [other.uid]: other.name },
          lastText: "",
          lastAt: Date.now(),
          lastFrom: uid,
        });
      return id;
    },
    async send(chatId, text) {
      const at = Date.now();
      await addDoc(collection(db, "city_chats", chatId, "messages"), { from: uid, text, at });
      await updateDoc(doc(db, "city_chats", chatId), { lastText: text, lastAt: at, lastFrom: uid });
    },
    async status() {
      const snap = await getDoc(doc(db, "city_players", uid)).catch(() => null);
      return { ...emptyStatus(), ...((snap?.data() as Partial<PlayerStatus>) ?? {}) };
    },
    async saveStatus(s) {
      await setDoc(doc(db, "city_players", uid), s, { merge: true });
    },
    async report(r) {
      await addDoc(collection(db, "city_reports"), {
        ...r,
        reporter: uid,
        at: Date.now(),
        status: "open",
      });
    },
  };
}

/* ---------------- local test backend (dev only) ---------------- */

export function connectLocal(uid: string): Online {
  const bc = new BroadcastChannel("ilmcity-online");
  const subs = new Set<() => void>();
  const read = <T>(k: string, d: T): T => {
    try {
      return (JSON.parse(localStorage.getItem("ilmcity-online-" + k) ?? "null") as T) ?? d;
    } catch {
      return d;
    }
  };
  const write = (k: string, v: unknown) => {
    localStorage.setItem("ilmcity-online-" + k, JSON.stringify(v));
    bc.postMessage(k);
    subs.forEach((f) => f());
  };
  bc.onmessage = () => subs.forEach((f) => f());
  const watch = (fn: () => void) => {
    subs.add(fn);
    fn();
    const iv = setInterval(fn, 1000);
    return () => {
      subs.delete(fn);
      clearInterval(iv);
    };
  };
  return {
    uid,
    setPresence(p) {
      const all = read<Record<string, Presence>>("presence", {});
      all[uid] = { ...p, uid, t: Date.now() };
      write("presence", all);
    },
    leave() {
      const all = read<Record<string, Presence>>("presence", {});
      delete all[uid];
      write("presence", all);
    },
    watchArea(area, cb) {
      return watch(() => {
        const now = Date.now();
        cb(
          Object.values(read<Record<string, Presence>>("presence", {})).filter(
            (p) => p.uid !== uid && p.area === area && now - p.t < ONLINE_LIMITS.staleMs,
          ),
        );
      });
    },
    watchInbox(cb) {
      return watch(() =>
        cb(
          Object.values(read<Record<string, ChatInfo>>("chats", {}))
            .filter((c) => c.members.includes(uid))
            .sort((a, b) => b.lastAt - a.lastAt),
        ),
      );
    },
    watchChat(chatId, cb) {
      return watch(() => cb(read<ChatMsg[]>("msgs-" + chatId, [])));
    },
    async openChat(other, myName) {
      const id = chatIdFor(uid, other.uid);
      const chats = read<Record<string, ChatInfo>>("chats", {});
      if (!chats[id]) {
        chats[id] = {
          id,
          members: [uid, other.uid].sort(),
          names: { [uid]: myName, [other.uid]: other.name },
          lastText: "",
          lastAt: Date.now(),
          lastFrom: uid,
        };
        write("chats", chats);
      }
      return id;
    },
    async send(chatId, text) {
      const at = Date.now();
      const msgs = read<ChatMsg[]>("msgs-" + chatId, []);
      msgs.push({ id: String(at) + Math.random(), from: uid, text, at });
      write("msgs-" + chatId, msgs);
      const chats = read<Record<string, ChatInfo>>("chats", {});
      if (chats[chatId])
        chats[chatId] = { ...chats[chatId], lastText: text, lastAt: at, lastFrom: uid };
      write("chats", chats);
    },
    async status() {
      return { ...emptyStatus(), ...read<Partial<PlayerStatus>>("status-" + uid, {}) };
    },
    async saveStatus(s) {
      write("status-" + uid, { ...read<Partial<PlayerStatus>>("status-" + uid, {}), ...s });
    },
    async report(r) {
      write("reports", [
        ...read<unknown[]>("reports", []),
        { ...r, reporter: uid, at: Date.now() },
      ]);
    },
  };
}

/** Words that are never sent in chat. Kept short; reports handle the rest. */
const BLOCKED_WORDS = ["fuck", "shit", "bitch", "ashawo", "olosho", "nude", "sex"];
export function cleanText(t: string) {
  let out = t.slice(0, 400);
  for (const w of BLOCKED_WORDS) out = out.replace(new RegExp(w, "gi"), "•••");
  return out;
}
/** Simple guard against sharing phone numbers and bank details with strangers. */
export const looksLikeContact = (t: string) => /(\d[\s-]?){10,}/.test(t);
