import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { usePremium } from "@/components/premium";

/**
 * Medina: the kids' 3D game world (10 games, 100 levels), served from /games/medina.html.
 * The game talks to the app with postMessage:
 *   app  -> game: { source: "ilmstation", type: "init" | "premium", profile, progress, premium }
 *   game -> app : { source: "medina", type: "ready" | "save" | "upgrade" | "exit", progress?, game?, level? }
 * Progress is kept in gameProgress/{uid}.medina (the same doc the other kids games use).
 */
export const MEDINA_SRC = "/games/medina.html";
const OPEN_FLAG = "iq_open_medina";

/** Ask the Games screen to open Medina straight away (used by the Home card). */
export function requestOpenMedina() {
  try {
    sessionStorage.setItem(OPEN_FLAG, "1");
  } catch {
    /* ignore */
  }
}
/** True once if the Home card asked to open Medina. */
export function takeOpenMedinaRequest() {
  try {
    const v = sessionStorage.getItem(OPEN_FLAG) === "1";
    sessionStorage.removeItem(OPEN_FLAG);
    return v;
  } catch {
    return false;
  }
}

/** Whether today's daily chest in Medina is still waiting to be opened. */
export function useMedinaChestReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return undefined;
    return onSnapshot(
      doc(db, "gameProgress", uid),
      (s) => {
        const last = (s.get("medina") as { lastChest?: string } | undefined)?.lastChest ?? "";
        setReady(last !== new Date().toISOString().slice(0, 10));
      },
      () => {},
    );
  }, []);
  return ready;
}

/** Full-screen Medina, synced with the kid's account. */
export function MedinaPlayer({ onExit, onUpgrade }: { onExit: () => void; onUpgrade: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { firstName, account } = useAuth();
  const { canAccess } = usePremium();
  const premium = canAccess("game-medina", "premium");
  const pending = useRef<unknown>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const post = (msg: Record<string, unknown>) =>
    frameRef.current?.contentWindow?.postMessage({ source: "ilmstation", ...msg }, "*");

  const flush = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !pending.current) return;
    const progress = pending.current;
    pending.current = null;
    try {
      await setDoc(doc(db, "gameProgress", uid), { medina: progress }, { merge: true });
    } catch {
      /* try again on the next save */
    }
  };

  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      const m = e.data as { source?: string; type?: string; progress?: unknown } | null;
      if (!m || m.source !== "medina" || e.source !== frameRef.current?.contentWindow) return;
      if (m.type === "ready") {
        let progress: unknown = null;
        const uid = auth.currentUser?.uid;
        if (uid) {
          progress = await new Promise((res) => {
            const stop = onSnapshot(
              doc(db, "gameProgress", uid),
              (s) => {
                stop();
                res(s.get("medina") ?? null);
              },
              () => res(null),
            );
          });
        }
        post({
          type: "init",
          profile: { name: firstName || "Friend", gender: account?.gender ?? "male" },
          progress,
          premium,
        });
      } else if (m.type === "save") {
        pending.current = m.progress;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), 1500);
      } else if (m.type === "upgrade") {
        onUpgrade();
      } else if (m.type === "exit") {
        if (timer.current) clearTimeout(timer.current);
        await flush();
        onExit();
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, account?.gender]);

  // tell the game when Premium changes while the kid is playing
  useEffect(() => {
    post({ type: "premium", premium });
  }, [premium]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#f6d9a8]">
      <iframe
        ref={frameRef}
        title="Medina"
        src={MEDINA_SRC}
        sandbox="allow-scripts"
        allow="autoplay"
        className="block h-full w-full border-0"
      />
    </div>
  );
}
