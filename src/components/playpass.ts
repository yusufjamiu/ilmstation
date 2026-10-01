import type { Child } from "@/components/family";

/* In-memory demo store backed by localStorage: play passes survive reloads and
   work across tabs on the same browser. A real build would sync via the backend. */

export type PlayPass = {
  code: string;
  child: Child;
  createdAt: number;
  expiresAt: number; // epoch ms — 60 minutes after creation
  revoked: boolean;
};

const KEY = "iq_play_passes";
const TTL = 60 * 60 * 1000;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — kid-friendly to read out

function load(): PlayPass[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as PlayPass[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function save(passes: PlayPass[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(passes));
}

function makeCode(): string {
  return Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
}

export function formatCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/** Issue a fresh pass for one child. Any earlier live pass for that child is replaced. */
export function createPlayPass(child: Child): PlayPass {
  const pass: PlayPass = {
    code: makeCode(),
    child: { ...child },
    createdAt: Date.now(),
    expiresAt: Date.now() + TTL,
    revoked: false,
  };
  save([pass, ...load().filter((p) => p.child.id !== child.id)]);
  return pass;
}

export function listPlayPasses(): PlayPass[] {
  return load();
}

export function revokePlayPass(code: string) {
  save(load().map((p) => (p.code === code ? { ...p, revoked: true } : p)));
}

export type RedeemResult = { ok: true; pass: PlayPass } | { ok: false; reason: "invalid" | "expired" };

export function redeemPlayPass(input: string): RedeemResult {
  const code = input.trim().toUpperCase().replace(/[\s-]/g, "");
  const pass = load().find((p) => p.code === code);
  if (!pass || pass.revoked) return { ok: false, reason: "invalid" };
  if (Date.now() > pass.expiresAt) return { ok: false, reason: "expired" };
  return { ok: true, pass };
}

/** Stars and garden growth earned on the other device sync back to the pass. */
export function creditPassProgress(code: string, stars: number) {
  save(load().map((p) =>
    p.code === code
      ? { ...p, child: { ...p.child, stars: p.child.stars + stars, garden: Math.min(100, p.child.garden + 6), minutesToday: Math.min(p.child.dailyLimit, p.child.minutesToday + 5) } }
      : p,
  ));
}
