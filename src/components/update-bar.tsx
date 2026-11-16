import { useEffect, useState } from "react";

/** Shows "A new version is ready" when a newer IlmStation has been released while this page is open. */
export function UpdateBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let base = "", stop = false;
    const get = async () => { try { const r = await fetch("/api/version", { cache: "no-store" }); return String(((await r.json()) as { v?: string }).v ?? ""); } catch { return ""; } };
    const check = async () => { const v = await get(); if (!v || stop) return; if (!base) base = v; else if (v !== base) setShow(true); };
    void check();
    const id = setInterval(() => void check(), 5 * 60_000);
    const vis = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", vis);
    return () => { stop = true; clearInterval(id); document.removeEventListener("visibilitychange", vis); };
  }, []);
  if (!show) return null;
  return <div className="fixed inset-x-3 top-3 z-[70] mx-auto flex max-w-xl items-center gap-3 border-2 border-foreground bg-primary p-3 text-foreground shadow-brutal">
    <span className="flex-1 text-sm"><b>✨ A new version of IlmStation is ready.</b></span>
    <button onClick={() => window.location.reload()} className="border-2 border-foreground bg-background px-3 py-1.5 text-sm font-bold">Update</button>
    <button onClick={() => setShow(false)} aria-label="Close" className="border-2 border-foreground bg-background px-2.5 py-1.5 text-sm font-bold">✕</button>
  </div>;
}
