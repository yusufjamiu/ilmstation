import { useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";

const norm = (w: string) => w.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\u0621-\u064A]/g, "").replace(/([اوي])\1+/g, "$1");
const words = (t: string) => t.trim().split(/\s+/).map(norm).filter(Boolean);

/** Record a verse and see what the speech AI heard. Used to test Hifz checking. */
export async function transcribe(blob: Blob, hint = "", ms = 0): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Please log in first.");
  const r = await fetch(`/api/hifz-stt${hint ? `?hint=${encodeURIComponent(hint)}` : ""}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": blob.type || "audio/webm", "x-audio-ms": String(Math.round(ms)) }, body: blob });
  const j = (await r.json()) as { text?: string; error?: string };
  if (!r.ok) throw new Error(j.error ?? "Something went wrong.");
  return j.text ?? "";
}
export function pickMime() {
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(m)) return m;
  return "";
}

export function HifzSpeechTest() {
  const [expected, setExpected] = useState("قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ");
  const [useHint, setUseHint] = useState(false);
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState("");
  const [err, setErr] = useState("");
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const start = async () => {
    setErr(""); setHeard("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime = pickMime();
      const m = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      m.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      m.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: m.mimeType || mime || "audio/webm" });
        setBusy(true);
        try { setHeard(await transcribe(blob, useHint ? expected : "")); } catch (e) { setErr((e as Error).message); }
        setBusy(false);
      };
      m.start(); mr.current = m; setRec(true);
    } catch { setErr("Microphone not available. Allow the microphone and try again."); }
  };
  const stop = () => { mr.current?.stop(); setRec(false); };
  const exp = words(expected), got = new Set(words(heard));
  return <main className="mx-auto max-w-xl px-4 py-10">
    <p className="text-xs font-bold uppercase text-muted-foreground">Hifz · speech test</p>
    <h1 className="font-serif text-4xl">What does the AI hear?</h1>
    <label className="mt-6 block text-sm font-semibold">The verse you will recite</label>
    <textarea dir="rtl" lang="ar" value={expected} onChange={(e) => setExpected(e.target.value)} rows={3} className="mt-1 w-full border-2 border-foreground bg-background p-3 font-arabic text-2xl leading-loose" />
    <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={useHint} onChange={(e) => setUseHint(e.target.checked)} /> Give the verse to the AI as a hint</label>
    <div className="mt-5">{rec ? <Button className="w-full" variant="destructive" onClick={stop}><Square /> Stop</Button> : <Button className="w-full" disabled={busy} onClick={() => void start()}>{busy ? <Loader2 className="animate-spin" /> : <Mic />} {busy ? "Checking…" : "Record"}</Button>}</div>
    {rec && <p className="mt-2 text-sm font-semibold">Recording… recite the verse, then tap Stop.</p>}
    {err && <p className="mt-4 border-2 border-foreground bg-destructive/10 p-3 text-sm">{err}</p>}
    {heard && <section className="mt-6 border-2 border-foreground p-4">
      <p className="text-xs font-bold uppercase text-muted-foreground">The AI heard</p>
      <p dir="rtl" lang="ar" className="mt-1 font-arabic text-2xl leading-loose">{heard}</p>
      <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Word check</p>
      <p dir="rtl" lang="ar" className="mt-1 flex flex-wrap gap-2 font-arabic text-2xl">{expected.trim().split(/\s+/).map((w, i) => <span key={i} className={got.has(exp[i]) ? "text-secondary" : "text-destructive"}>{w}</span>)}</p>
      <p className="mt-2 text-sm">{exp.filter((w) => got.has(w)).length} of {exp.length} words matched</p>
    </section>}
  </main>;
}
