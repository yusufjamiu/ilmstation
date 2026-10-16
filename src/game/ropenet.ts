/* Skipping rope with other real sisters at the same Sisters' Corner. Nobody runs the game:
   everyone works out where the rope is from the round's start time (the rope speeds up the
   same way on every phone), so only small things are shared: who is here, who jumps and who
   turns this round, and when the jumper last jumped. Firebase Realtime Database, or a test
   backend between browser tabs on the dev server (?online=local). */

export type RopeRound = {
  /** when the rope starts turning (shared clock, ms) */
  start: number;
  seq: number;
  jumper: string;
  left: string;
  right: string;
};
export type RopeRoom = {
  players: Record<string, { name: string; at: number }>;
  round: RopeRound | null;
  jumps: Record<string, { at: number; n: number; out?: boolean; seq?: number }>;
};
export interface RopeNet {
  uid: string;
  /** the shared clock */
  now(): number;
  watch(cb: (r: RopeRoom) => void): () => void;
  join(name: string): Promise<void>;
  leave(): Promise<void>;
  setRound(r: RopeRound): void;
  jump(v: { at: number; n: number; out?: boolean; seq?: number }): void;
  close(): void;
}
export const NPC = "npc";
const keyOf = (zoneId: string) => zoneId.replace(/[.#$[\]/:]/g, "_");

/** Who jumps next: the next player after this round's jumper; the others turn. */
export function nextRound(room: RopeRoom, now: number, prev: RopeRound | null): RopeRound | null {
  const ids = Object.entries(room.players)
    .sort((a, b) => a[1].at - b[1].at)
    .map(([u]) => u);
  if (!ids.length) return null;
  const i = prev ? ids.indexOf(prev.jumper) : -1;
  const jumper = ids[(i + 1) % ids.length];
  const rest = ids.filter((u) => u !== jumper);
  return {
    start: now + 3500,
    seq: (prev?.seq ?? 0) + 1,
    jumper,
    left: rest[0] ?? NPC,
    right: rest[1] ?? NPC,
  };
}

/* ---------------- Firebase Realtime Database ---------------- */
export async function connectRope(zoneId: string, uid: string): Promise<RopeNet> {
  const { app } = await import("@/lib/firebase");
  const d = await import("firebase/database");
  const db = d.getDatabase(app);
  const base = `ropes/${keyOf(zoneId)}`;
  const r = (p: string) => d.ref(db, `${base}/${p}`);
  const offs: (() => void)[] = [];
  let offset = 0;
  offs.push(
    d.onValue(d.ref(db, ".info/serverTimeOffset"), (s) => {
      offset = Number(s.val() ?? 0);
    }),
  );
  return {
    uid,
    now: () => Date.now() + offset,
    watch(cb) {
      const off = d.onValue(
        d.ref(db, base),
        (snap) => {
          const v = (snap.val() ?? {}) as Partial<RopeRoom>;
          cb({ players: v.players ?? {}, round: v.round ?? null, jumps: v.jumps ?? {} });
        },
        () => cb({ players: {}, round: null, jumps: {} }),
      );
      offs.push(off);
      return off;
    },
    async join(name) {
      await d.set(r(`players/${uid}`), { name, at: Date.now() + offset });
      await d.onDisconnect(r(`players/${uid}`)).remove();
      await d.onDisconnect(r(`jumps/${uid}`)).remove();
    },
    async leave() {
      await d.remove(r(`players/${uid}`));
      await d.remove(r(`jumps/${uid}`));
    },
    setRound(v) {
      void d.set(r("round"), v).catch(() => {});
    },
    jump(v) {
      void d.set(r(`jumps/${uid}`), v).catch(() => {});
    },
    close() {
      offs.forEach((f) => f());
    },
  };
}

/* ---------------- test backend between tabs (dev only) ---------------- */
export function connectRopeLocal(zoneId: string, uid: string): RopeNet {
  const bc = new BroadcastChannel("ilmcity-rope");
  const base = "ilmcity-rope-" + keyOf(zoneId) + ":";
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
  const edit = <T extends object>(k: string, fn: (v: T) => void) => {
    const v = read<T>(k, {} as T);
    fn(v);
    put(k, v);
  };
  bc.onmessage = () => setTimeout(() => subs.forEach((f) => f()), 30);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(base)) subs.forEach((f) => f());
  };
  window.addEventListener("storage", onStorage);
  const offs: (() => void)[] = [];
  const bye = () => {
    edit<Record<string, unknown>>("players", (v) => delete v[uid]);
    edit<Record<string, unknown>>("jumps", (v) => delete v[uid]);
  };
  window.addEventListener("pagehide", bye);
  return {
    uid,
    now: () => Date.now(),
    watch(cb) {
      const fn = () =>
        cb({
          players: read<RopeRoom["players"]>("players", {}),
          round: read<RopeRound | null>("round", null),
          jumps: read<RopeRoom["jumps"]>("jumps", {}),
        });
      subs.add(fn);
      fn();
      const off = () => void subs.delete(fn);
      offs.push(off);
      return off;
    },
    async join(name) {
      edit<Record<string, unknown>>("players", (v) => (v[uid] = { name, at: Date.now() }));
    },
    async leave() {
      bye();
    },
    setRound(v) {
      put("round", v);
    },
    jump(v) {
      edit<Record<string, unknown>>("jumps", (x) => (x[uid] = v));
    },
    close() {
      offs.forEach((f) => f());
      window.removeEventListener("pagehide", bye);
      window.removeEventListener("storage", onStorage);
      bc.close();
    },
  };
}
