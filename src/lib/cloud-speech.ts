/* Replaces the browser's speech recognition with a recorder + OpenAI check (/api/hifz-stt).
   Same shape as SpeechRecognition, so Hifz and Revision work unchanged, on every phone. */
import { pickMime, transcribe } from "@/components/hifz-stt";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ev = any;
let shared: MediaStream | null = null;
let ctx: AudioContext | null = null;
async function getStream() {
  if (shared && shared.getAudioTracks().some((t) => t.readyState === "live")) return shared;
  shared = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  return shared;
}

class CloudRecognition {
  lang = "ar-SA"; continuous = false; interimResults = false; maxAlternatives = 1;
  onstart: ((e: Ev) => void) | null = null; onaudiostart: ((e: Ev) => void) | null = null; onaudioend: ((e: Ev) => void) | null = null;
  onspeechstart: ((e: Ev) => void) | null = null; onspeechend: ((e: Ev) => void) | null = null; onsoundstart: ((e: Ev) => void) | null = null;
  onresult: ((e: Ev) => void) | null = null; onnomatch: ((e: Ev) => void) | null = null; onerror: ((e: Ev) => void) | null = null; onend: ((e: Ev) => void) | null = null;
  private listeners: Record<string, ((e: Ev) => void)[]> = {};
  private rec: MediaRecorder | null = null;
  private stopped = false; private aborted = false; private timer = 0;
  addEventListener(t: string, f: (e: Ev) => void) { (this.listeners[t] ??= []).push(f); }
  removeEventListener(t: string, f: (e: Ev) => void) { this.listeners[t] = (this.listeners[t] ?? []).filter((x) => x !== f); }
  private emit(t: string, e: Ev = {}) {
    const ev = { type: t, ...e };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { (this as any)["on" + t]?.(ev); } catch (err) { console.error(err); }
    for (const f of this.listeners[t] ?? []) { try { f(ev); } catch (err) { console.error(err); } }
  }
  start() { this.stopped = false; this.aborted = false; void this.run(); }
  stop() { this.stopped = true; if (this.rec?.state === "recording") this.rec.stop(); }
  abort() { this.aborted = true; this.stop(); }
  private async run() {
    let stream: MediaStream;
    try { stream = await getStream(); } catch { this.emit("error", { error: "not-allowed" }); this.emit("end"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") { try { await ctx.resume(); } catch { /* ignore */ } }
    const src = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
    const data = new Float32Array(an.fftSize);
    const mime = pickMime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); this.rec = rec;
    const chunks: Blob[] = [];
    let spoke = false; let lastVoice = Date.now(); const began = Date.now();
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      clearInterval(this.timer); try { src.disconnect(); } catch { /* ignore */ }
      this.emit("audioend");
      if (this.aborted) { this.emit("end"); return; }
      if (!spoke) { this.emit("error", { error: "no-speech" }); this.emit("end"); return; }
      this.emit("speechend");
      try {
        const text = await transcribe(new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = [{ transcript: text, confidence: 0.9 }]; result.isFinal = true; result.item = (i: number) => result[i];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any = [result]; results.item = (i: number) => results[i];
        if (text.trim()) this.emit("result", { resultIndex: 0, results }); else this.emit("nomatch");
      } catch (e) { this.emit("error", { error: "network", message: (e as Error).message }); }
      this.emit("end");
    };
    rec.start(250); this.emit("start"); this.emit("audiostart");
    this.timer = window.setInterval(() => {
      an.getFloatTimeDomainData(data); let sum = 0; for (const v of data) sum += v * v;
      const rms = Math.sqrt(sum / data.length); const now = Date.now();
      if (rms > 0.02) { if (!spoke) { this.emit("soundstart"); this.emit("speechstart"); } spoke = true; lastVoice = now; }
      if ((spoke && now - lastVoice > 1500) || (!spoke && now - began > 8000) || now - began > 45000) { if (rec.state === "recording") rec.stop(); }
    }, 100);
    if (this.stopped && rec.state === "recording") rec.stop();
  }
}

if (typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && navigator.mediaDevices?.getUserMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).SpeechRecognition = CloudRecognition; (window as any).webkitSpeechRecognition = CloudRecognition;
}
export {};
