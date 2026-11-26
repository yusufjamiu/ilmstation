import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Loader2, RotateCcw } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/components/language";

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "ilmbot:chat";
const SUGGEST = ["Explain sabr simply", "What is the meaning of Ihsan?", "Tell me about Surah Al-Mulk", "How can I focus more in salah?"];

async function call(body: object) {
  const t = await auth.currentUser?.getIdToken().catch(() => "");
  const r = await fetch("/api/ilmbot", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${t ?? ""}` }, body: JSON.stringify(body) }).catch(() => null);
  return ((await r?.json().catch(() => ({}))) ?? {}) as { reply?: string; left?: number; limit?: number; error?: string };
}

/** **bold** and line breaks */
function Rich({ text }: { text: string }) {
  return <>{text.split(/\n{2,}/).map((para, i) => <p key={i} className={i ? "mt-2" : ""}>
    {para.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith("**") && part.endsWith("**")
      ? <b key={j}>{part.slice(2, -2)}</b>
      : part.split("\n").map((line, k, arr) => <span key={`${j}-${k}`}>{line}{k < arr.length - 1 && <br />}</span>))}
  </p>)}</>;
}

export function IlmBot() {
  const { lang } = useLanguage();
  const [msgs, setMsgs] = useState<Msg[]>(() => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as Msg[]; } catch { return []; } });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const lastA = useRef<HTMLDivElement>(null);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* ignore */ } if (!msgs.length) return; const last = msgs[msgs.length - 1]; if (last.role === "assistant" && !busy) lastA.current?.scrollIntoView({ behavior: "smooth", block: "start" }); else end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);
  useEffect(() => auth.onAuthStateChanged((u) => { if (u) void call({ peek: true }).then((r) => { if (typeof r.left === "number") setLeft(r.left); }); }), []);

  const send = async (text = input) => {
    const q = text.trim(); if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next); setInput(""); setBusy(true);
    const r = await call({ messages: next.slice(-10), lang });
    setBusy(false);
    setMsgs([...next, { role: "assistant", content: r.reply || r.error || "Sorry, I couldn't answer just now. Please try again." }]);
    if (typeof r.left === "number") setLeft(r.left);
  };

  return <div className="grid gap-4">
    <div className="flex items-start gap-3 rounded-2xl border-[1.5px] border-foreground bg-card p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-[#1c1a17]"><Bot className="size-6" /></span>
      <div className="min-w-0 flex-1 text-sm">
        <p>Ask about the Qur'an, hadith, seerah, du'a and Islamic manners. I give sources where I can.</p>
        <p className="mt-1 text-xs text-muted-foreground">Not a fatwa service: for personal rulings, please ask a qualified scholar.{left !== null ? ` · ${left} ${left === 1 ? "question" : "questions"} left today` : ""}</p>
      </div>
    </div>

    {!msgs.length && <div>
      <p className="font-serif text-2xl">What would you like to understand?</p>
      <div className="mt-3 flex flex-wrap gap-2">{SUGGEST.map((q) => <button key={q} type="button" onClick={() => void send(q)} className="rounded-full border-[1.5px] border-foreground bg-background px-3 py-2 text-sm font-semibold">{q}</button>)}</div>
    </div>}

    <div className="grid gap-3">{msgs.map((m, i) => m.role === "user"
      ? <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[#1c1a17]">{m.content}</div>
      : <div key={i} ref={i === msgs.length - 1 ? lastA : undefined} className="mr-auto max-w-[92%] scroll-mt-28 rounded-2xl rounded-bl-md border-[1.5px] border-foreground/20 bg-card px-4 py-3 leading-relaxed"><Rich text={m.content} /></div>)}
      {busy && <div className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-md border-[1.5px] border-foreground/20 bg-card px-4 py-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Thinking…</div>}
      <div ref={end} className="h-2 scroll-mb-44" />
    </div>

    <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="sticky bottom-[calc(env(safe-area-inset-bottom)+88px)] z-10 flex items-end gap-2 bg-background pt-2 lg:bottom-4">
      {msgs.length > 0 && <button type="button" aria-label="New chat" onClick={() => setMsgs([])} className="grid size-12 shrink-0 place-items-center rounded-full border-[1.5px] border-foreground bg-background"><RotateCcw className="size-5" /></button>}
      <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
        rows={1} placeholder="Ask a question…" aria-label="Ask IlmBot" className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl border-[1.5px] border-foreground bg-background px-4 py-3 outline-none" />
      <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid size-12 shrink-0 place-items-center rounded-full bg-[#1c1a17] text-white disabled:opacity-40"><ArrowUp className="size-5" /></button>
    </form>
  </div>;
}
