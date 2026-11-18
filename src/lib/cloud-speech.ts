/* Replaces the browser's speech recognition with a recorder + OpenAI check (/api/hifz-stt).
   Same shape as SpeechRecognition, so Hifz and Revision work unchanged, on every phone.
   Near-live: while you recite, it sends a piece every 2-3 seconds at a tiny gap between words. */
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
let checks = 0;
function checking(on: boolean) {
  checks = Math.max(0, checks + (on ? 1 : -1));
  let el = document.getElementById("cloud-checking");
  if (!el) {
    el = document.createElement("div"); el.id = "cloud-checking";
    el.style.cssText = "position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:60;background:#1c1a17;color:#f7f3ea;font:600 14px system-ui,sans-serif;padding:8px 14px;border:2px solid #f7f3ea;display:none";
    el.textContent = "Checking…"; document.body.appendChild(el);
  }
  el.style.display = checks > 0 ? "block" : "none";
}

const VOICE = 0.02;        // loudness that counts as speaking
const END_SILENCE = 600;   // ms of silence = you've stopped
const PIECE_MIN = 2500;    // ms of speech before a near-live piece can be sent
const GAP = 150;           // ms of quiet between words where a piece can be cut

class CloudRecognition {
  lang = "ar-SA"; continuous = false; interimResults = false; maxAlternatives = 1;
  onstart: ((e: Ev) => void) | null = null; onaudiostart: ((e: Ev) => void) | null = null; onaudioend: ((e: Ev) => void) | null = null;
  onspeechstart: ((e: Ev) => void) | null = null; onspeechend: ((e: Ev) => void) | null = null; onsoundstart: ((e: Ev) => void) | null = null;
  onresult: ((e: Ev) => void) | null = null; onnomatch: ((e: Ev) => void) | null = null; onerror: ((e: Ev) => void) | null = null; onend: ((e: Ev) => void) | null = null;
  private listeners: Record<string, ((e: Ev) => void)[]> = {};
  private finals: string[] = [];
  private ending = false; private aborted = false; private ended = false; private pending = 0; private timer = 0;
  private cur: { r: MediaRecorder; spoke: boolean; at: number } | null = null;
  addEventListener(t: string, f: (e: Ev) => void) { (this.listeners[t] ??= []).push(f); }
  removeEventListener(t: string, f: (e: Ev) => void) { this.listeners[t] = (this.listeners[t] ?? []).filter((x) => x !== f); }
  private emit(t: string, e: Ev = {}) {
    const ev = { type: t, ...e };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { (this as any)["on" + t]?.(ev); } catch (err) { console.error(err); }
    for (const f of this.listeners[t] ?? []) { try { f(ev); } catch (err) { console.error(err); } }
  }
  private finish() { if (this.ended) return; this.ended = true; clearInterval(this.timer); this.emit("audioend"); this.emit("end"); }
  start() { this.finals = []; this.ending = false; this.aborted = false; this.ended = false; this.pending = 0; void this.run(); }
  stop() { this.ending = true; clearInterval(this.timer); if (this.cur?.r.state === "recording") this.cur.r.stop(); else if (this.pending === 0) this.finish(); }
  abort() { this.aborted = true; this.stop(); }
  private emitResults() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = this.finals.map((t) => { const r: any = [{ transcript: t, confidence: 0.9 }]; r.isFinal = true; r.item = (i: number) => r[i]; return r; });
    results.item = (i: number) => results[i];
    this.emit("result", { resultIndex: this.finals.length - 1, results });
  }
  private async deliver(chunks: Blob[], type: string, spoke: boolean) {
    this.pending++;
    if (spoke && !this.aborted) {
      checking(true);
      try { const text = await transcribe(new Blob(chunks, { type: type || "audio/webm" })); if (text.trim() && !this.aborted) { this.finals.push(text.trim()); this.emitResults(); } }
      catch (e) { this.emit("error", { error: "network", message: (e as Error).message }); }
      checking(false);
    }
    this.pending--;
    if (this.ending && this.pending === 0) this.finish();
  }
  private async run() {
    let stream: MediaStream;
    try { stream = await getStream(); } catch { this.emit("error", { error: "not-allowed" }); this.finish(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") { try { await ctx.resume(); } catch { /* ignore */ } }
    const src = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
    const data = new Float32Array(an.fftSize);
    const mime = pickMime();
    const segment = () => {
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const seg = { r, spoke: false, at: Date.now() };
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      r.onstop = () => { void this.deliver(chunks, r.mimeType || mime, seg.spoke); };
      r.start(250);
      return seg;
    };
    this.cur = segment();
    this.emit("start"); this.emit("audiostart");
    if (this.ending) { this.cur.r.stop(); return; }
    const began = Date.now(); let lastVoice = Date.now(); let quietSince = 0; let anySpeech = false;
    const cut = () => { const old = this.cur!; this.cur = segment(); old.r.stop(); quietSince = 0; };
    this.timer = window.setInterval(() => {
      if (this.ending) return;
      an.getFloatTimeDomainData(data); let sum = 0; for (const v of data) sum += v * v;
      const rms = Math.sqrt(sum / data.length); const now = Date.now(); const seg = this.cur!;
      if (rms > VOICE) {
        if (!anySpeech) { this.emit("soundstart"); this.emit("speechstart"); }
        anySpeech = true; seg.spoke = true; lastVoice = now; quietSince = 0;
      } else if (seg.spoke && !quietSince) quietSince = now;
      if (seg.spoke && now - lastVoice > END_SILENCE) {
        if (this.continuous) cut(); else { this.ending = true; clearInterval(this.timer); seg.r.stop(); }
        return;
      }
      if (seg.spoke && quietSince && now - quietSince >= GAP && now - seg.at >= PIECE_MIN) { cut(); return; }
      if (!anySpeech && now - began > 8000 && !this.continuous) { this.emit("error", { error: "no-speech" }); this.ending = true; clearInterval(this.timer); seg.r.stop(); return; }
      if (now - began > 90000) this.stop();
    }, 50);
  }
}

if (typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && navigator.mediaDevices?.getUserMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).SpeechRecognition = CloudRecognition; (window as any).webkitSpeechRecognition = CloudRecognition;
}
export {};
