import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type InboxItem = { id: string; kind: "friend" | "challenge"; title: string; sub: string; at: number };

/** Real notifications for this learner: friend requests and challenge invites waiting for an answer. */
export function useInbox(): InboxItem[] {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [friends, setFriends] = useState<InboxItem[]>([]);
  const [duels, setDuels] = useState<InboxItem[]>([]);
  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);
  useEffect(() => {
    if (!uid) { setFriends([]); setDuels([]); return undefined; }
    const a = onSnapshot(query(collection(db, "friendRequests"), where("to", "==", uid)), (s) => setFriends(s.docs
      .map((d) => ({ id: d.id, ...(d.data() as { fromName?: string; status?: string; createdAt?: number }) }))
      .filter((r) => r.status === "pending")
      .map((r) => ({ id: r.id, kind: "friend" as const, title: `${r.fromName ?? "A learner"}`, sub: "Friend request", at: r.createdAt ?? 0 }))), () => {});
    const b = onSnapshot(query(collection(db, "challenges"), where("to", "==", uid), where("status", "==", "pending")), (s) => setDuels(s.docs
      .map((d) => ({ id: d.id, ...(d.data() as { fromName?: string; topic?: string; createdAt?: number }) }))
      .filter((c) => Date.now() - (c.createdAt ?? 0) < 24 * 3600 * 1000) // old invites don't count
      .map((c) => ({ id: c.id, kind: "challenge" as const, title: `${c.fromName ?? "A learner"}`, sub: c.topic ? `Challenge · ${c.topic}` : "Challenge", at: c.createdAt ?? 0 }))), () => {});
    return () => { a(); b(); };
  }, [uid]);
  return [...friends, ...duels].sort((x, y) => y.at - x.at);
}

/** Small red counter for the profile button. */
export function InboxBadge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[11px] font-bold leading-4 text-white">{count > 9 ? "9+" : count}</span>;
}

export function InboxDialog({ open, onOpenChange, items, onOpen, onProfile }: { open: boolean; onOpenChange: (o: boolean) => void; items: InboxItem[]; onOpen: (i: InboxItem) => void; onProfile: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none">
      <DialogHeader><DialogTitle className="font-serif text-3xl">Notifications</DialogTitle><DialogDescription>{items.length ? "Tap one to answer it." : "Nothing new right now."}</DialogDescription></DialogHeader>
      <div className="space-y-2">{items.map((i) => <button key={i.kind + i.id} onClick={() => onOpen(i)} className="block w-full border-2 border-foreground bg-primary p-3 text-left">
        <b className="block">{i.title}</b><small className="text-muted-foreground">{i.sub}</small>
      </button>)}</div>
      <Button variant="outline" onClick={onProfile}>My profile</Button>
    </DialogContent>
  </Dialog>;
}
