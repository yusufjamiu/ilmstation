import { useEffect, useState } from "react";

/** "Install IlmStation" on phones (Android button, iPhone steps). Hidden once installed. */
type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };
let deferred: Prompt | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as Prompt; window.dispatchEvent(new Event("ilm-installable")); });
}

function useInstall() {
  const [can, setCan] = useState(false);
  const [env, setEnv] = useState({ standalone: true, ios: false });
  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    setEnv({ standalone: window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true, ios: /iphone|ipad|ipod/i.test(nav.userAgent) });
    setCan(!!deferred);
    const on = () => setCan(true);
    window.addEventListener("ilm-installable", on);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => window.removeEventListener("ilm-installable", on);
  }, []);
  const install = async () => { if (!deferred) return; await deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; setCan(false); };
  return { can, install, ...env };
}

const IosSteps = () => <span>Tap <b>Share</b> <span aria-hidden>⬆️</span> at the bottom of Safari, then <b>Add to Home Screen</b>.</span>;

export function InstallBanner() {
  const { can, install, standalone, ios } = useInstall();
  const [hidden, setHidden] = useState(true);
  useEffect(() => { try { setHidden(localStorage.getItem("installDismissed") === "1"); } catch { setHidden(false); } }, []);
  if (standalone || hidden || (!can && !ios)) return null;
  const close = () => { setHidden(true); try { localStorage.setItem("installDismissed", "1"); } catch { /* ignore */ } };
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-2 border-foreground bg-primary p-3 shadow-brutal-sm">
    <span className="text-sm"><b>📲 Install IlmStation</b> on your phone for quick, full-screen access. {ios && !can && <IosSteps />}</span>
    <span className="flex gap-2">
      {can && <button onClick={() => void install()} className="border-2 border-foreground bg-background px-3 py-1.5 text-sm font-bold">Install</button>}
      <button onClick={close} aria-label="Close" className="border-2 border-foreground bg-background px-2.5 py-1.5 text-sm font-bold">✕</button>
    </span>
  </div>;
}

export function InstallCard() {
  const { can, install, standalone, ios } = useInstall();
  return <div className="mt-6 border-2 border-foreground p-5">
    <p className="font-serif text-2xl">📲 Install the app</p>
    {standalone ? <p className="mt-1 text-sm text-muted-foreground">IlmStation is installed on this device. ✓</p>
      : can ? <><p className="mt-1 text-sm text-muted-foreground">Add IlmStation to your home screen. It opens full screen, like an app.</p><button onClick={() => void install()} className="mt-3 border-2 border-foreground bg-primary px-4 py-2 text-sm font-bold">Install IlmStation</button></>
      : ios ? <p className="mt-1 text-sm"><IosSteps /></p>
      : <p className="mt-1 text-sm text-muted-foreground">Open ilmstation.com in Chrome (Android) or Safari (iPhone) to install it on your phone.</p>}
  </div>;
}
