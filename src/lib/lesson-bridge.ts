import { useEffect, type RefObject } from "react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth";

/** Bridge between the app and an uploaded HTML lesson running in a sandbox.
 *  The sandbox blocks the mic, the login and storage, so the lesson asks the app instead:
 *   - {type:"ilmstation:hello"}                          → {type:"ilmstation:welcome", state, lang, gender}
 *   - {type:"ilmstation:save", state}                    → app keeps the lesson's progress (resume after closing)
 *   - {type:"ilmstation:record", id, ms, check, hint}    → app records the mic; with check it also runs /api/hifz-stt;
 *                                                          replies {type:"ilmstation:recorded", id, audio, mime, text?, error?}
 *   - {type:"ilmstation:stop", id}                       → stop recording early
 *  The login token never leaves the app: the lesson only gets back the audio and the words heard. */
export function useLessonBridge(frame: RefObject<HTMLIFrameElement | null>, key: string, lang = "en") {
  const { account } = useAuth();
  const gender = account?.gender ?? null;   // Brother/Sister: lessons pick the male or female voice
  useEffect(() => {
    // saved progress belongs to the logged-in user, so people sharing a phone never see each other's place
    const store = () => `ilm-lesson:${auth.currentUser?.uid ?? "guest"}:${key}`;
    let rec: MediaRecorder | null = null;
    let timer: number | undefined;
    const reply = (msg: unknown, transfer: Transferable[] = []) =>
      frame.current?.contentWindow?.postMessage(msg, "*", transfer);

    const on = async (e: MessageEvent) => {
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      const d = (e.data ?? {}) as { type?: string; id?: number; ms?: number; check?: boolean; hint?: string; state?: unknown };

      if (d.type === "ilmstation:hello") {
        let state: unknown = null;
        try { state = JSON.parse(localStorage.getItem(store()) ?? "null"); } catch { /* ignore */ }
        let test = false; try { test = localStorage.getItem("ilm-test-mode") === "1"; } catch { /* */ }
        reply({ type: "ilmstation:welcome", state, test, lang, gender });   // the lesson switches its instructions to this language, and its voice to Brother/Sister
      } else if (d.type === "ilmstation:save") {
        try { localStorage.setItem(store(), JSON.stringify(d.state ?? null).slice(0, 50_000)); } catch { /* ignore */ }
      } else if (d.type === "ilmstation:stop") {
        if (rec?.state === "recording") rec.stop();
      } else if (d.type === "ilmstation:record") {
        if (rec?.state === "recording") rec.stop();
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t));
          const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
          rec = r;
          const chunks: Blob[] = [];
          r.ondataavailable = (ev) => chunks.push(ev.data);
          r.onstop = async () => {
            window.clearTimeout(timer);
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunks, { type: r.mimeType || mime || "audio/webm" });
            let text: string | undefined, error: string | undefined;
            if (d.check) {
              try {
                const token = await auth.currentUser?.getIdToken();
                if (!token) error = "login";
                else {
                  const res = await fetch(`/api/hifz-stt?hint=${encodeURIComponent(d.hint ?? "")}`, {
                    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": blob.type }, body: blob,
                  });
                  const j = (await res.json()) as { text?: string; error?: string };
                  if (res.ok) text = j.text ?? ""; else error = j.error ?? "check";
                }
              } catch { error = "network"; }
            }
            const audio = await blob.arrayBuffer();
            reply({ type: "ilmstation:recorded", id: d.id, audio, mime: blob.type, text, error }, [audio]);
          };
          r.start();
          reply({ type: "ilmstation:recording", id: d.id });
          timer = window.setTimeout(() => { if (r.state === "recording") r.stop(); }, Math.min(10_000, d.ms ?? 3000));
        } catch {
          reply({ type: "ilmstation:recorded", id: d.id, error: "mic" });
        }
      }
    };

    window.addEventListener("message", on);
    return () => {
      window.removeEventListener("message", on);
      window.clearTimeout(timer);
      if (rec?.state === "recording") rec.stop();
    };
  }, [frame, key, lang, gender]);
}