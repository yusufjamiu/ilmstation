/* The player's naira, held by the server (city_wallets/{uid}). The game shows the wallet's
   balance and asks the server for every change; if the server isn't set up yet, the game
   keeps working with the money in its own save. */

export type MoneyResult = { ok: boolean; naira?: number; credited?: number; error?: string };
export type WalletNet = {
  /** true once the server holds this player's money */
  active: boolean;
  change(delta: number): Promise<MoneyResult>;
  buyHouse(plot: string, name: string): Promise<MoneyResult>;
  sellHouse(plot: string, amount: number): Promise<MoneyResult>;
  stop(): void;
};

async function call(body: Record<string, unknown>): Promise<MoneyResult & { status: number }> {
  const { auth } = await import("@/lib/firebase");
  const token = await auth.currentUser?.getIdToken();
  if (!token) return { ok: false, error: "sign-in", status: 401 };
  try {
    const r = await fetch("/api/money", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as MoneyResult;
    return { ...j, ok: r.ok && j.ok !== false, status: r.status };
  } catch {
    return { ok: false, error: "offline", status: 0 };
  }
}

/** Watch the wallet; create it on first use (with the starting money). */
export async function connectWallet(
  uid: string,
  start: { path?: string; existing: boolean },
  onBalance: (naira: number) => void,
): Promise<WalletNet | null> {
  const { db } = await import("@/lib/firebase");
  const { doc, onSnapshot, getDoc } = await import("firebase/firestore");
  const ref = doc(db, "city_wallets", uid);
  let snap = await getDoc(ref).catch(() => null);
  if (!snap) return null;
  if (!snap.exists()) {
    const r = await call({ op: "init", path: start.path, existing: start.existing });
    // the server isn't set up (no service account yet): keep the game's own money
    if (!r.ok) return null;
    snap = await getDoc(ref).catch(() => null);
    if (!snap?.exists()) return null;
  }
  const off = onSnapshot(
    ref,
    (s) => {
      const d = s.data() as { naira?: number } | undefined;
      if (typeof d?.naira === "number") onBalance(d.naira);
    },
    () => {},
  );
  return {
    active: true,
    change: (delta) => call({ op: "change", delta }),
    buyHouse: (plot, name) => call({ op: "buyHouse", plot, name }),
    sellHouse: (plot, amount) => call({ op: "sellHouse", plot, amount }),
    stop: off,
  };
}
