/* Races at the IlmWorld Sports Arena. Only an admin sets a race (running or cycling), with a
   prize, a number of laps and the days it is open. While it is open, players come to the
   track and run (or ride) it against the clock; each keeps their best time, and everyone sees
   the leaderboard. The admin pays the winners.
   Firestore: city_races/{race} and city_races/{race}/entries/{uid}. */

export type Race = {
  id: string;
  kind: "run" | "bike";
  title: string;
  /** what the winners get, as the admin wrote it */
  prize: string;
  winners: number;
  laps: number;
  from: number;
  until: number;
  at: number;
  status: "open" | "closed";
};
export type RaceEntry = {
  uid: string;
  name: string;
  /** best time, in milliseconds */
  ms: number;
  tries: number;
  at: number;
  paid?: boolean;
};

const fs = async () => {
  const { db } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  return { db, ...f };
};

/** Races still running or coming soon. */
export function watchRaces(cb: (r: Race[]) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, query, where, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        query(collection(db, "city_races"), where("status", "==", "open")),
        (snap) => {
          const now = Date.now();
          cb(
            snap.docs
              .map((d) => ({ ...(d.data() as Race), id: d.id }))
              .filter((r) => r.until > now)
              .sort((a, b) => a.from - b.from),
          );
        },
        () => cb([]),
      );
    })
    .catch(() => cb([]));
  return () => {
    live = false;
    off();
  };
}

/** Races that finished in the last week (closed or past their closing time): the results. */
export function watchFinished(cb: (r: Race[]) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, query, where, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        query(collection(db, "city_races"), where("until", ">", Date.now() - 7 * 86400000)),
        (snap) => {
          const now = Date.now();
          cb(
            snap.docs
              .map((d) => ({ ...(d.data() as Race), id: d.id }))
              .filter((r) => r.status === "closed" || r.until <= now)
              .sort((a, b) => b.until - a.until),
          );
        },
        () => cb([]),
      );
    })
    .catch(() => cb([]));
  return () => {
    live = false;
    off();
  };
}
/** The final leaderboard of a race, once. */
export async function resultsOf(race: string) {
  const { db, collection, getDocs } = await fs();
  const snap = await getDocs(collection(db, "city_races", race, "entries"));
  return snap.docs.map((d) => d.data() as RaceEntry).sort((a, b) => a.ms - b.ms);
}

/** The leaderboard: fastest first. */
export function watchEntries(race: string, cb: (e: RaceEntry[]) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        collection(db, "city_races", race, "entries"),
        (snap) => cb(snap.docs.map((d) => d.data() as RaceEntry).sort((a, b) => a.ms - b.ms)),
        () => cb([]),
      );
    })
    .catch(() => cb([]));
  return () => {
    live = false;
    off();
  };
}

/** Record a finished attempt; only a better time replaces the old one. */
export async function sendTime(race: string, uid: string, name: string, ms: number) {
  const { db, doc, runTransaction } = await fs();
  const ref = doc(db, "city_races", race, "entries", uid);
  return runTransaction(db, async (tx) => {
    const old = await tx.get(ref);
    const prev = old.exists() ? (old.data() as RaceEntry) : null;
    const best = prev ? Math.min(prev.ms, ms) : ms;
    tx.set(ref, { uid, name, ms: best, tries: (prev?.tries ?? 0) + 1, at: Date.now() });
    return { best, improved: !prev || ms < prev.ms };
  });
}

/* ---------------- for the admin ---------------- */
export async function createRace(r: Omit<Race, "id" | "at" | "status">) {
  const { db, collection, addDoc } = await fs();
  await addDoc(collection(db, "city_races"), { ...r, at: Date.now(), status: "open" });
}
export async function closeRace(id: string) {
  const { db, doc, updateDoc } = await fs();
  await updateDoc(doc(db, "city_races", id), { status: "closed" });
}
export async function markRacePaid(race: string, uid: string) {
  const { db, doc, updateDoc } = await fs();
  await updateDoc(doc(db, "city_races", race, "entries", uid), { paid: true });
}
/** Every race, newest first (the admin page). */
export function watchAllRaces(cb: (r: Race[]) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        collection(db, "city_races"),
        (snap) =>
          cb(
            snap.docs.map((d) => ({ ...(d.data() as Race), id: d.id })).sort((a, b) => b.at - a.at),
          ),
        () => cb([]),
      );
    })
    .catch(() => cb([]));
  return () => {
    live = false;
    off();
  };
}

/** "1:07.4" */
export const fmtTime = (ms: number) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, "0")}`;
};
/** The fastest a lap can honestly be done (a little faster than the best bicycle). */
export const MIN_LAP_MS = { run: 38000, bike: 17000 };
