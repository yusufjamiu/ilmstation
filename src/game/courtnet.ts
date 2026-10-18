/* Tennis between two real players on the same court. The first player to arrive runs the
   rally on their phone and sends it ten times a second; the other sends where they move
   and when they hit. Firebase Realtime Database, or browser tabs on the dev server. */

import type { TennisInput, TennisSnap } from "./tennis";

export type CourtRoom = {
  players: Record<string, { name: string; at: number }>;
  state: TennisSnap | null;
  input: Record<string, TennisInput>;
};
export interface CourtNet {
  uid: string;
  watch(cb: (r: CourtRoom) => void): () => void;
  join(name: string): Promise<void>;
  leave(): Promise<void>;
  sendState(s: TennisSnap): void;
  sendInput(i: TennisInput): void;
  close(): void;
}
const keyOf = (z: string) => z.replace(/[.#$[\]/:]/g, "_");

export async function connectCourt(zoneId: string, uid: string): Promise<CourtNet> {
  const { app } = await import("@/lib/firebase");
  const d = await import("firebase/database");
  const db = d.getDatabase(app);
  const base = `courts/${keyOf(zoneId)}`;
  const r = (p: string) => d.ref(db, `${base}/${p}`);
  const offs: (() => void)[] = [];
  return {
    uid,
    watch(cb) {
      const off = d.onValue(
        d.ref(db, base),
        (s) => {
          const v = (s.val() ?? {}) as Partial<CourtRoom>;
          cb({ players: v.players ?? {}, state: v.state ?? null, input: v.input ?? {} });
        },
        () => cb({ players: {}, state: null, input: {} }),
      );
      offs.push(off);
      return off;
    },
    async join(name) {
      await d.set(r(`players/${uid}`), { name, at: Date.now() });
      await d.onDisconnect(r(`players/${uid}`)).remove();
      await d.onDisconnect(r(`input/${uid}`)).remove();
    },
    async leave() {
      await d.remove(r(`players/${uid}`));
      await d.remove(r(`input/${uid}`));
    },
    sendState(s) {
      void d.set(r("state"), s).catch(() => {});
    },
    sendInput(i) {
      void d.set(r(`input/${uid}`), i).catch(() => {});
    },
    close() {
      offs.forEach((f) => f());
    },
  };
}

export function connectCourtLocal(zoneId: string, uid: string): CourtNet {
  const bc = new BroadcastChannel("ilmcity-court");
  const base = "ilmcity-court-" + keyOf(zoneId) + ":";
  const subs = new Set<() => void>();
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
  bc.onmessage = () => setTimeout(() => subs.forEach((f) => f()), 30);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(base)) subs.forEach((f) => f());
  };
  window.addEventListener("storage", onStorage);
  const offs: (() => void)[] = [];
  const bye = () => {
    const p = read<Record<string, unknown>>("players", {});
    delete p[uid];
    put("players", p);
  };
  window.addEventListener("pagehide", bye);
  return {
    uid,
    watch(cb) {
      const fn = () => {
        const players = read<CourtRoom["players"]>("players", {});
        const input: Record<string, TennisInput> = {};
        for (const u of Object.keys(players)) {
          const i = read<TennisInput | null>("input-" + u, null);
          if (i) input[u] = i;
        }
        cb({ players, state: read<TennisSnap | null>("state", null), input });
      };
      subs.add(fn);
      fn();
      const off = () => void subs.delete(fn);
      offs.push(off);
      return off;
    },
    async join(name) {
      const p = read<Record<string, unknown>>("players", {});
      p[uid] = { name, at: Date.now() };
      put("players", p);
    },
    async leave() {
      bye();
    },
    sendState(s) {
      put("state", s);
    },
    sendInput(i) {
      put("input-" + uid, i);
    },
    close() {
      offs.forEach((f) => f());
      window.removeEventListener("pagehide", bye);
      window.removeEventListener("storage", onStorage);
      bc.close();
    },
  };
}
