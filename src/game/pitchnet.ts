/* Live football between real players. A pitch has one room: who is playing on which
   team, who is waiting on the bench, and the match itself. The first player to arrive
   runs the match on their phone (the host) and sends it to everyone ten times a second;
   the others send what they press. Uses Firebase Realtime Database (fast and free for
   this), or a test backend between browser tabs on the dev server (?online=local). */

import type { NetInput, Snapshot } from "./soccer";

export type Room = {
  status: "waiting" | "playing" | "over";
  host: string;
  at: number;
  /** who plays in each position once the match starts (empty = the computer) */
  slots?: Record<string, { uid: string; name: string } | null> | null;
};
export type PitchRoom = {
  room: Room | null;
  players: Record<string, { name: string; team: 0 | 1; at: number }>;
  queue: Record<string, { name: string; at: number }>;
};
export interface PitchNet {
  uid: string;
  watch(cb: (r: PitchRoom) => void): () => void;
  /** become the host if nobody is running this pitch */
  claim(): Promise<boolean>;
  join(name: string, team: 0 | 1): Promise<void>;
  leave(): Promise<void>;
  enqueue(name: string): Promise<void>;
  setRoom(p: Partial<Room>): Promise<void>;
  setPlayer(uid: string, v: { name: string; team: 0 | 1; at: number } | null): Promise<void>;
  setQueued(uid: string, v: { name: string; at: number } | null): Promise<void>;
  sendInput(i: NetInput): void;
  watchInputs(cb: (all: Record<string, NetInput>) => void): () => void;
  sendState(s: Snapshot): void;
  watchState(cb: (s: Snapshot) => void): () => void;
  close(): void;
}

/** Positions on each team: three outfield players each. Keepers are always the computer. */
export const SLOT_KEYS: [string[], string[]] = [
  ["s0", "s1", "s2"],
  ["s3", "s4", "s5"],
];
export const MAX_PER_TEAM = 3;
const keyOf = (zoneId: string) => zoneId.replace(/[.#$[\]/:]/g, "_");

/* ---------------- Firebase Realtime Database ---------------- */
export async function connectPitch(zoneId: string, uid: string): Promise<PitchNet> {
  const { app } = await import("@/lib/firebase");
  const d = await import("firebase/database");
  const db = d.getDatabase(app);
  const base = `pitches/${keyOf(zoneId)}`;
  const r = (p: string) => d.ref(db, `${base}/${p}`);
  const offs: (() => void)[] = [];
  return {
    uid,
    watch(cb) {
      const off = d.onValue(
        d.ref(db, base),
        (snap) => {
          const v = (snap.val() ?? {}) as Partial<PitchRoom>;
          cb({ room: v.room ?? null, players: v.players ?? {}, queue: v.queue ?? {} });
        },
        () => cb({ room: null, players: {}, queue: {} }),
      );
      offs.push(off);
      return off;
    },
    async claim() {
      const res = await d.runTransaction(r("room"), (cur: Room | null) => {
        if (cur && cur.status !== "over" && Date.now() - cur.at < 15 * 60000) return; // taken
        return { status: "waiting", host: uid, at: Date.now() } as Room;
      });
      if (res.committed) {
        // if the host's phone goes away, the room closes
        await d.onDisconnect(r("room")).update({ status: "over" });
        await d.onDisconnect(r("state")).remove();
      }
      return res.committed;
    },
    async join(name, team) {
      await d.set(r(`players/${uid}`), { name, team, at: Date.now() });
      await d.onDisconnect(r(`players/${uid}`)).remove();
      await d.remove(r(`queue/${uid}`));
    },
    async leave() {
      await d.remove(r(`players/${uid}`));
      await d.remove(r(`queue/${uid}`));
      await d.remove(r(`input/${uid}`));
    },
    async enqueue(name) {
      await d.set(r(`queue/${uid}`), { name, at: Date.now() });
      await d.onDisconnect(r(`queue/${uid}`)).remove();
    },
    async setRoom(p) {
      await d.update(r("room"), p);
    },
    async setPlayer(u, v) {
      await d.set(r(`players/${u}`), v);
    },
    async setQueued(u, v) {
      await d.set(r(`queue/${u}`), v);
    },
    sendInput(i) {
      void d.set(r(`input/${uid}`), i).catch(() => {});
    },
    watchInputs(cb) {
      const off = d.onValue(r("input"), (s) => cb((s.val() ?? {}) as Record<string, NetInput>));
      offs.push(off);
      return off;
    },
    sendState(s) {
      void d.set(r("state"), s).catch(() => {});
    },
    watchState(cb) {
      const off = d.onValue(r("state"), (s) => {
        const v = s.val() as Snapshot | null;
        if (v) cb(v);
      });
      offs.push(off);
      return off;
    },
    close() {
      offs.forEach((f) => f());
    },
  };
}

/* ---------------- test backend between tabs (dev only) ---------------- */
export function connectPitchLocal(zoneId: string, uid: string): PitchNet {
  const bc = new BroadcastChannel("ilmcity-pitch");
  const base = "ilmcity-pitch-" + keyOf(zoneId) + ":";
  const subs = new Set<() => void>();
  // each part is stored on its own, as in the real database, so writes don't overwrite each other
  const read = <T>(k: string, d: T): T => {
    try {
      return (JSON.parse(localStorage.getItem(base + k) ?? "null") as T) ?? d;
    } catch {
      return d;
    }
  };
  const put = (k: string, v: unknown) => {
    if (v === null || v === undefined) localStorage.removeItem(base + k);
    else localStorage.setItem(base + k, JSON.stringify(v));
    bc.postMessage(k);
    subs.forEach((f) => f());
  };
  const edit = <T extends object>(k: string, fn: (v: T) => void) => {
    const v = read<T>(k, {} as T);
    fn(v);
    put(k, v);
  };
  // another tab's saved data can arrive a moment after its message: listen for both
  bc.onmessage = () => setTimeout(() => subs.forEach((f) => f()), 30);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(base)) subs.forEach((f) => f());
  };
  window.addEventListener("storage", onStorage);
  const sub = (fn: () => void) => {
    subs.add(fn);
    fn();
    return () => void subs.delete(fn);
  };
  const offs: (() => void)[] = [];
  const bye = () => {
    edit<Record<string, unknown>>("players", (v) => delete v[uid]);
    edit<Record<string, unknown>>("queue", (v) => delete v[uid]);
    const room = read<Room | null>("room", null);
    if (room?.host === uid) put("room", { ...room, status: "over" });
  };
  window.addEventListener("pagehide", bye);
  return {
    uid,
    watch(cb) {
      const off = sub(() =>
        cb({
          room: read<Room | null>("room", null),
          players: read<PitchRoom["players"]>("players", {}),
          queue: read<PitchRoom["queue"]>("queue", {}),
        }),
      );
      offs.push(off);
      return off;
    },
    async claim() {
      const cur = read<Room | null>("room", null);
      if (cur && cur.status !== "over") return false;
      put("players", {});
      put("state", null);
      put("room", { status: "waiting", host: uid, at: Date.now() });
      return true;
    },
    async join(name, team) {
      edit<Record<string, unknown>>("players", (v) => (v[uid] = { name, team, at: Date.now() }));
      edit<Record<string, unknown>>("queue", (v) => delete v[uid]);
    },
    async leave() {
      edit<Record<string, unknown>>("players", (v) => delete v[uid]);
      edit<Record<string, unknown>>("queue", (v) => delete v[uid]);
    },
    async enqueue(name) {
      edit<Record<string, unknown>>("queue", (v) => (v[uid] = { name, at: Date.now() }));
    },
    async setRoom(p) {
      put("room", { ...read<Room | null>("room", null), ...p });
    },
    async setPlayer(u, val) {
      edit<Record<string, unknown>>("players", (v) => {
        if (val) v[u] = val;
        else delete v[u];
      });
    },
    async setQueued(u, val) {
      edit<Record<string, unknown>>("queue", (v) => {
        if (val) v[u] = val;
        else delete v[u];
      });
    },
    sendInput(i) {
      put("input-" + uid, i);
    },
    watchInputs(cb) {
      const off = sub(() => {
        const all: Record<string, NetInput> = {};
        for (const u of Object.keys(read<PitchRoom["players"]>("players", {}))) {
          const i = read<NetInput | null>("input-" + u, null);
          if (i) all[u] = i;
        }
        cb(all);
      });
      offs.push(off);
      return off;
    },
    sendState(s) {
      put("state", s);
    },
    watchState(cb) {
      const off = sub(() => {
        const s = read<Snapshot | null>("state", null);
        if (s) cb(s);
      });
      offs.push(off);
      return off;
    },
    close() {
      offs.forEach((f) => f());
      window.removeEventListener("pagehide", bye);
      window.removeEventListener("storage", onStorage);
      bc.close();
    },
  };
}
