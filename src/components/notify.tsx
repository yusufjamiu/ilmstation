import { useEffect, useState } from "react";
import { getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { toast } from "sonner";
import { callPremium } from "@/components/premium";

/** Settings → Notifications: turn on push, choose which ones. */
type Prefs = { wisdom: boolean; prayer: boolean; streak: boolean; kahf: boolean; ramadan: boolean; tilawah: boolean };
const LABELS: [keyof Prefs, string, string][] = [
  ["wisdom", "🌅 Daily Wisdom", "Every morning at 7:30"],
  ["prayer", "🕌 Prayer times", "At each of the five prayers"],
  ["tilawah", "📖 Daily tilawah", "At the time you choose below"],
  ["streak", "🔥 Streak reminder", "In the evening, if you haven't learned yet"],
  ["kahf", "📖 Friday Al-Kahf", "Friday morning"],
  ["ramadan", "🏆 Ramadan prize quiz", "When each day's quiz opens"],
];

function where(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((res) => {
    if (!("geolocation" in navigator)) return res(null);
    navigator.geolocation.getCurrentPosition((p) => res({ lat: Math.round(p.coords.latitude * 1000) / 1000, lng: Math.round(p.coords.longitude * 1000) / 1000 }), () => res(null), { timeout: 12000, maximumAge: 86_400_000 });
  });
}

async function register(silent = false): Promise<{ ok: boolean; error?: string; prefs?: Prefs; hasLocation?: boolean }> {
  if (!(await isSupported().catch(() => false)) || !("serviceWorker" in navigator)) return { ok: false, error: "unsupported" };
  const perm = silent ? Notification.permission : await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, error: "denied" };
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(getApp()), { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string, serviceWorkerRegistration: reg });
  let loc: { lat: number; lng: number } | null = null;
  if (silent) { try { const st = await navigator.permissions.query({ name: "geolocation" as PermissionName }); if (st.state === "granted") loc = await where(); } catch { /* skip */ } }
  else loc = await where();
  let method = "";
  try { method = localStorage.getItem("prayerMethod") ?? ""; } catch { /* ignore */ }
  const r = (await callPremium("pushRegister", { token, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, method, ...(loc ?? {}) })) as { ok?: boolean; error?: string; prefs?: Prefs; hasLocation?: boolean };
  return { ok: !!r.ok, error: r.error, prefs: r.prefs, hasLocation: r.hasLocation };
}

/** Turn on push for this device (asks permission). Used by the study plan reminder. */
export async function ensurePush(): Promise<{ ok: boolean; error?: string }> {
  try { const r = await register(false); return { ok: r.ok, error: r.error }; } catch { return { ok: false, error: "unsupported" }; }
}

export function NotifyCard() {
  const [state, setState] = useState<"loading" | "off" | "on" | "unsupported" | "denied">("loading");
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [hasLoc, setHasLoc] = useState(true);
  const [tAt, setTAt] = useState("05:30");
  const [tDays, setTDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void (async () => {
      const ok = (await isSupported().catch(() => false)) && "Notification" in window && "serviceWorker" in navigator;
      if (!ok) { setState("unsupported"); return; }
      if (Notification.permission === "denied") { setState("denied"); return; }
      const r = (await callPremium("pushGet", {})) as { ok?: boolean; on?: boolean; prefs?: Prefs; hasLocation?: boolean; tilawahAt?: string; tilawahDays?: number[] };
      setPrefs(r.prefs ?? null); setHasLoc(r.hasLocation !== false);
      if (r.tilawahAt) setTAt(r.tilawahAt); if (r.tilawahDays) setTDays(r.tilawahDays);
      setState(r.on && Notification.permission === "granted" ? "on" : "off");
    })();
  }, []);
  const turnOn = async () => {
    setBusy(true);
    try {
      const r = await register();
      if (r.ok) { setState("on"); setPrefs(r.prefs ?? null); setHasLoc(!!r.hasLocation); toast.success("Notifications are on"); }
      else if (r.error === "denied") setState("denied");
      else if (r.error === "unsupported") setState("unsupported");
      else toast.error(r.error ?? "Couldn't turn on notifications.");
    } catch { toast.error("Couldn't turn on notifications. Try again."); } finally { setBusy(false); }
  };
  const toggle = async (k: keyof Prefs, v: boolean) => {
    if (!prefs) return;
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    const r = await callPremium("pushPrefs", { prefs: next, tilawahAt: tAt, tilawahDays: tDays });
    if (!r.ok) toast.error("Couldn't save.");
  };
  return <div className="mt-6 border-2 border-foreground p-5">
    <p className="font-serif text-2xl">🔔 Notifications</p>
    {state === "loading" && <p className="mt-1 text-sm text-muted-foreground">Checking…</p>}
    {state === "unsupported" && <p className="mt-1 text-sm text-muted-foreground">This browser can’t receive notifications. On iPhone, install IlmStation first (Add to Home Screen), then open it from your home screen.</p>}
    {state === "denied" && <p className="mt-1 text-sm text-muted-foreground">Notifications are blocked for IlmStation. Allow them in your phone or browser settings, then come back here.</p>}
    {state === "off" && <><p className="mt-1 text-sm text-muted-foreground">Get Daily Wisdom each morning, prayer times, and gentle reminders, even when the app is closed.</p>
      <button disabled={busy} onClick={() => void turnOn()} className="mt-3 border-2 border-foreground bg-primary px-4 py-2 text-sm font-bold disabled:opacity-50">{busy ? "Turning on…" : "Turn on notifications"}</button></>}
    {state === "on" && prefs && <>
      <div className="mt-3 grid gap-2">{LABELS.map(([k, t, d]) => <label key={k} className="flex items-center justify-between gap-3 border-2 border-foreground p-3">
        <span><b className="text-sm">{t}</b><br /><span className="text-xs text-muted-foreground">{k === "prayer" && !hasLoc ? "Needs your location: tap “Update” below" : d}</span></span>
        <input type="checkbox" className="size-5" checked={prefs[k]} onChange={(e) => void toggle(k, e.target.checked)} />
      </label>)}</div>
      {prefs.tilawah && <div className="mt-2 grid gap-2 border-2 border-foreground bg-muted p-3">
        <label className="flex items-center justify-between gap-3 text-sm font-semibold">Tilawah time
          <input type="time" value={tAt} onChange={(e) => setTAt(e.target.value)} onBlur={() => void callPremium("pushPrefs", { prefs, tilawahAt: tAt, tilawahDays: tDays }).then((r) => r.ok ? toast.success("Tilawah time saved") : toast.error("Couldn't save."))} className="h-9 border-2 border-foreground bg-background px-2" />
        </label>
        <div className="flex flex-wrap gap-1">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => { const on = tDays.includes(i); return <button key={d} onClick={() => { const next = on ? tDays.filter((x) => x !== i) : [...tDays, i].sort(); setTDays(next); void callPremium("pushPrefs", { prefs, tilawahAt: tAt, tilawahDays: next }); }} className={`border-2 border-foreground px-2 py-1 text-xs font-bold ${on ? "bg-primary" : "bg-background"}`}>{d}</button>; })}</div>
      </div>}
      <div className="mt-3 flex flex-wrap gap-4">
        <button onClick={() => void callPremium("pushTest", {}).then((r) => r.ok ? toast.success("Test sent. Check your notifications.") : toast.error(r.error ?? "Couldn't send."))} className="border-2 border-foreground bg-primary px-3 py-1.5 text-sm font-bold">Send me a test</button>
        <button disabled={busy} onClick={() => void turnOn()} className="text-sm font-semibold underline">{busy ? "Updating…" : "Update this device and my location"}</button>
      </div>
    </>}
  </div>;
}

/** On app open: ask once per visit (one tap), or turn on quietly if already allowed. */
export function NotifyPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void (async () => {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported().catch(() => false))) return;
      if (Notification.permission === "granted") {
        try { if (sessionStorage.getItem("notifySynced")) return; sessionStorage.setItem("notifySynced", "1"); } catch { /* ignore */ }
        void register(true).catch(() => {});
        return;
      }
      if (Notification.permission === "denied") return;
      try { if (sessionStorage.getItem("notifyAsked")) return; } catch { /* ignore */ }
      setTimeout(() => setShow(true), 2500);
    })();
  }, []);
  if (!show) return null;
  const later = () => { setShow(false); try { sessionStorage.setItem("notifyAsked", "1"); } catch { /* ignore */ } };
  const on = async () => {
    setBusy(true);
    try { const r = await register(); if (r.ok) toast.success("Notifications are on"); else if (r.error === "denied") toast("You can turn them on later in Settings."); }
    catch { toast.error("Couldn't turn on notifications."); } finally { setBusy(false); later(); }
  };
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-2 border-foreground bg-secondary p-3 text-secondary-foreground shadow-brutal-sm">
    <span className="text-sm"><b>🔔 Stay on track</b><br />Get Daily Wisdom every morning and prayer time reminders.</span>
    <span className="flex gap-2">
      <button disabled={busy} onClick={() => void on()} className="border-2 border-foreground bg-primary px-3 py-1.5 text-sm font-bold text-foreground disabled:opacity-50">{busy ? "…" : "Turn on"}</button>
      <button onClick={later} className="border-2 border-foreground bg-background px-3 py-1.5 text-sm font-bold text-foreground">Not now</button>
    </span>
  </div>;
}
