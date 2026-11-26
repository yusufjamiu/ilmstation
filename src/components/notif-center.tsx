import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BookMarked, BookOpen, ChevronRight, Clock, Flame, GraduationCap, Sunrise, Trophy, Users, X } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

type N = { id: string; key?: string; title: string; body: string; url: string; at: number; read?: boolean };

function useNotifs() {
  const [uid, setUid] = useState<string | null>(null);
  const [rows, setRows] = useState<N[]>([]);
  useEffect(() => onAuthStateChanged(getAuth(), (u) => setUid(u?.uid ?? null)), []);
  useEffect(() => {
    if (!uid) { setRows([]); return; }
    return onSnapshot(query(collection(db, "notifs", uid, "items"), orderBy("at", "desc"), limit(40)),
      (s) => setRows(s.docs.map((d) => ({ ...(d.data() as Omit<N, "id">), id: d.id }))), () => setRows([]));
  }, [uid]);
  return { uid, rows };
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); return d === 1 ? "yesterday" : `${d} days ago`;
};
const iconFor = (k = "") => k === "wisdom" ? Sunrise : k === "kahf" ? BookMarked : k === "tilawah" ? BookOpen : k === "study" ? GraduationCap
  : k === "streak" ? Flame : k.startsWith("ramadan") || k.startsWith("won") ? Trophy : k.startsWith("p") ? Clock : Bell;
const clean = (t: string) => t.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "");

export function NotifBell({ inboxCount, onInbox, go }: { inboxCount: number; onInbox: () => void; go: (s: string) => void }) {
  // clear IlmStation notifications from the phone's notification bar when the app is opened
  useEffect(() => {
    const clear = () => { if (document.visibilityState !== "visible" || !("serviceWorker" in navigator)) return;
      void navigator.serviceWorker.getRegistration().then((r) => r?.getNotifications().then((ns) => ns.forEach((n) => n.close()))).catch(() => {}); };
    clear(); document.addEventListener("visibilitychange", clear);
    return () => document.removeEventListener("visibilitychange", clear);
  }, []);
  const { uid, rows } = useNotifs();
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);
  const unread = rows.filter((r) => !r.read).length + inboxCount;
  const openPanel = () => {
    const un = rows.filter((r) => !r.read);
    setFresh(un.map((r) => r.id)); setOpen(true);
    if (uid && un.length) { const b = writeBatch(db); un.forEach((r) => b.update(doc(db, "notifs", uid, "items", r.id), { read: true })); void b.commit().catch(() => {}); }
  };
  const list = rows.filter((r) => Date.now() - (r.at || 0) < 7 * 864e5);
  const remove = (id: string) => { if (uid) void deleteDoc(doc(db, "notifs", uid, "items", id)).catch(() => {}); };
  const clearAll = () => { if (!uid || !rows.length) return; const b = writeBatch(db); rows.forEach((r) => b.delete(doc(db, "notifs", uid, "items", r.id))); void b.commit().catch(() => {}); };
  const openItem = (n: N) => { setOpen(false); let s = "home"; try { s = new URL(n.url || "/app", window.location.origin).searchParams.get("s") || "home"; } catch { /* */ } go(s); };
  return <>
    <button type="button" aria-label={unread ? `Notifications, ${unread} new` : "Notifications"} onClick={openPanel}
      className="relative grid size-10 shrink-0 place-items-center border-2 border-foreground bg-background shadow-brutal-sm">
      <Bell className="size-5" />
      {unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#d11a2a] px-1 text-[11px] font-bold leading-none text-white">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {open && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-[1.5px] border-foreground bg-background p-5 pb-10 text-foreground shadow-[0_-4px_24px_rgba(0,0,0,.2)] sm:rounded-3xl sm:pb-5">
        <div className="flex items-center justify-between"><h2 className="font-serif text-3xl">Notifications</h2><span className="ml-auto mr-3">{list.length > 0 && <button onClick={clearAll} className="text-sm font-semibold underline">Clear all</button>}</span>
          <button aria-label="Close" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full border-[1.5px] border-foreground"><X className="size-4" /></button></div>
        {inboxCount > 0 && <button onClick={() => { setOpen(false); onInbox(); }} className="mt-4 flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-foreground bg-primary p-3 text-left text-[#1c1a17]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white"><Users className="size-5" /></span>
          <span className="min-w-0 flex-1"><b className="block text-sm">{inboxCount === 1 ? "1 friend request or challenge" : `${inboxCount} friend requests and challenges`}</b><span className="text-xs">Tap to see them</span></span>
          <ChevronRight className="size-5 shrink-0" /></button>}
        {list.length ? <div className="mt-4 grid gap-2">{list.map((n) => { const I = iconFor(n.key); const isNew = fresh.includes(n.id);
          return <div key={n.id} className="relative"><button onClick={() => openItem(n)} className={`flex w-full items-start gap-3 rounded-2xl border-[1.5px] p-3 pr-10 text-left ${isNew ? "border-foreground bg-primary/15" : "border-foreground/15 opacity-60"}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-[#1c1a17]"><I className="size-5" /></span>
            <span className="min-w-0 flex-1"><b className="block text-sm leading-snug">{clean(n.title)}</b>
              <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{ago(n.at)}{isNew ? " · New" : ""}</span></span>
          </button><button aria-label="Remove" onClick={() => remove(n.id)} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-muted-foreground"><X className="size-4" /></button></div>; })}</div>
          : !inboxCount && <p className="mt-6 rounded-2xl border-[1.5px] border-dashed border-foreground/30 p-5 text-center text-sm text-muted-foreground">No notifications yet. Daily Wisdom, prayer times and your reminders will show here.</p>}
      </div>
    </div>, document.body)}
  </>;
}
