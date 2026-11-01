import { useSyncExternalStore } from "react";

/* Demo admin store: each collection lives in localStorage under iq_admin_<name>,
   seeded on first read. A real build would replace this with API calls. */

type Entry = { value: unknown; hydrated: boolean; listeners: Set<() => void> };
const entries = new Map<string, Entry>();

function entry(key: string, seed: unknown): Entry {
  let e = entries.get(key);
  if (!e) { e = { value: seed, hydrated: false, listeners: new Set() }; entries.set(key, e); }
  return e;
}

/* Bump when the seed data changes so browsers drop data saved from the old seed.
   The sign-in session is kept; its display name is looked up from the admins list. */
const SEED_VERSION = "2";
let migrated = false;
function migrate() {
  if (migrated) return;
  migrated = true;
  try {
    if (window.localStorage.getItem("iq_admin_version") === SEED_VERSION) return;
    Object.keys(window.localStorage).filter((k) => k.startsWith("iq_admin_") && k !== "iq_admin_session").forEach((k) => window.localStorage.removeItem(k));
    window.localStorage.setItem("iq_admin_version", SEED_VERSION);
  } catch { /* ignore */ }
}

function hydrate(key: string, e: Entry) {
  if (e.hydrated || typeof window === "undefined") return;
  migrate();
  e.hydrated = true;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) e.value = JSON.parse(raw);
  } catch { /* ignore */ }
}

export function useAdminStore<T>(name: string, seed: T) {
  const key = `iq_admin_${name}`;
  const e = entry(key, seed);
  const value = useSyncExternalStore(
    (l) => { hydrate(key, e); e.listeners.add(l); return () => { e.listeners.delete(l); }; },
    () => e.value as T,
    () => seed,
  );
  const set = (next: T | ((prev: T) => T)) => {
    e.value = typeof next === "function" ? (next as (prev: T) => T)(e.value as T) : next;
    try { window.localStorage.setItem(key, JSON.stringify(e.value)); } catch { /* ignore */ }
    e.listeners.forEach((l) => l());
  };
  return [value, set] as const;
}

/** Wipes every iq_admin_* key so the seed data returns on next load. */
export function resetAdminData() {
  try {
    Object.keys(window.localStorage).filter((k) => k.startsWith("iq_admin_") && k !== "iq_admin_session").forEach((k) => window.localStorage.removeItem(k));
  } catch { /* ignore */ }
  entries.clear();
  window.location.reload();
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const naira = (n: number) => `₦${n.toLocaleString()}`;
