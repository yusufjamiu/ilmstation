import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where, type QuerySnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { normaliseUsername, useAuth } from "@/components/auth";
import { Button } from "@/components/ui/button";

type Req = { id: string; from: string; to: string; fromName: string; fromUsername: string; toName: string; toUsername: string; status: "pending" | "accepted" | "declined"; createdAt: number };

const readReqs = (snap: QuerySnapshot): Req[] => snap.docs.map((d) => ({ ...(d.data() as Omit<Req, "id">), id: d.id }));
const pairId = (a: string, b: string) => [a, b].sort().join("_");
const box = "border-2 border-foreground bg-background shadow-brutal";

function useRequests() {
  const [myId, setMyId] = useState<string | null>(null);
  const [sent, setSent] = useState<Req[]>([]);
  const [got, setGot] = useState<Req[]>([]);
  useEffect(() => onAuthStateChanged(auth, (u) => setMyId(u?.uid ?? null)), []);
  useEffect(() => {
    if (!myId) { setSent([]); setGot([]); return undefined; }
    const a = onSnapshot(query(collection(db, "friendRequests"), where("from", "==", myId)), (s) => setSent(readReqs(s)), () => {});
    const b = onSnapshot(query(collection(db, "friendRequests"), where("to", "==", myId)), (s) => setGot(readReqs(s)), () => {});
    return () => { a(); b(); };
  }, [myId]);
  return { myId, reqs: [...sent, ...got] };
}

/** User ids of everyone who has accepted a friend request with this learner. */
export function useFriendIds(): string[] {
  const { myId, reqs } = useRequests();
  return reqs.filter((r) => r.status === "accepted").map((r) => (r.from === myId ? r.to : r.from));
}

type Found = { uid: string; name: string; username: string; level: string };

export function FriendsPanel({ tab }: { tab: string }) {
  const { myId, reqs } = useRequests();
  const { account } = useAuth();
  const [text, setText] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const friends = reqs.filter((r) => r.status === "accepted");
  const incoming = reqs.filter((r) => r.status === "pending" && r.to === myId);
  const outgoing = reqs.filter((r) => r.status === "pending" && r.from === myId);
  const other = (r: Req) => (r.from === myId ? { name: r.toName, username: r.toUsername } : { name: r.fromName, username: r.fromUsername });
  const relation = found && myId ? reqs.find((r) => r.id === pairId(myId, found.uid)) : undefined;

  async function search() {
    const value = normaliseUsername(text);
    setFound(null); setMessage("");
    if (value.length < 3) { setMessage("Type at least 3 characters of a username."); return; }
    setBusy(true);
    try {
      const u = await getDoc(doc(db, "usernames", value));
      if (!u.exists()) { setMessage("No one has that username."); return; }
      const uid = (u.data() as { uid: string }).uid;
      if (uid === myId) { setMessage("That's you."); return; }
      const p = await getDoc(doc(db, "players", uid));
      const d = (p.exists() ? p.data() : {}) as { name?: string; level?: string };
      setFound({ uid, name: d.name ?? value, username: value, level: d.level ?? "Beginner" });
    } catch { setMessage("We couldn't search right now. Try again."); } finally { setBusy(false); }
  }

  async function addFriend(f: Found) {
    if (!myId) return;
    try {
      await setDoc(doc(db, "friendRequests", pairId(myId, f.uid)), { from: myId, to: f.uid, fromName: account?.name ?? "A learner", fromUsername: account?.username ?? "", toName: f.name, toUsername: f.username, status: "pending", createdAt: Date.now() });
      toast.success("Friend request sent");
    } catch { toast("We couldn't send that request. Try again."); }
  }
  const respond = (r: Req, status: "accepted" | "declined") => updateDoc(doc(db, "friendRequests", r.id), { status }).then(() => toast.success(status === "accepted" ? "Friend added" : "Request declined")).catch(() => toast("Something went wrong. Try again."));
  const remove = (r: Req) => deleteDoc(doc(db, "friendRequests", r.id)).catch(() => toast("Something went wrong. Try again."));

  const row = "flex flex-wrap items-center gap-3 border-2 border-foreground p-3";
  const avatar = (n: string) => <span className="grid size-10 place-items-center bg-primary font-serif text-xl">{n[0] ?? "?"}</span>;

  return <section className={box}>
    <div className="border-b-2 border-foreground px-4 py-2"><h2 className="font-serif text-xl">{tab}</h2></div>
    <div className="p-4">
      {tab === "Friends" && (friends.length ? <div className="space-y-3">{friends.map((r) => { const o = other(r); return <div key={r.id} className={row}>{avatar(o.name)}<div className="flex-1"><b>{o.name}</b>{o.username && <p className="text-xs text-muted-foreground">@{o.username}</p>}</div><Button size="sm" variant="outline" onClick={() => void remove(r)}>Remove</Button></div>; })}<p className="text-xs text-muted-foreground">Open Challenge and pick the Friends filter to duel them.</p></div> : <p className="text-sm text-muted-foreground">No friends yet. Use Find friends to add someone.</p>)}

      {tab === "Requests" && <div className="space-y-3">
        {incoming.map((r) => <div key={r.id} className={row}>{avatar(r.fromName)}<div className="flex-1"><b>{r.fromName}</b>{r.fromUsername && <p className="text-xs text-muted-foreground">@{r.fromUsername}</p>}</div><Button size="sm" onClick={() => void respond(r, "accepted")}>Accept</Button><Button size="sm" variant="outline" onClick={() => void respond(r, "declined")}>Decline</Button></div>)}
        {outgoing.map((r) => <div key={r.id} className={row}>{avatar(r.toName)}<div className="flex-1"><b>{r.toName}</b><p className="text-xs text-muted-foreground">Request sent, waiting</p></div><Button size="sm" variant="outline" onClick={() => void remove(r)}>Cancel</Button></div>)}
        {!incoming.length && !outgoing.length && <p className="text-sm text-muted-foreground">No requests right now.</p>}
      </div>}

      {tab === "Find friends" && <div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void search(); }}>
          <label className="flex h-10 flex-1 items-center gap-2 border-2 border-foreground px-3"><Search className="size-4 shrink-0" /><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search by username" className="w-full bg-transparent outline-none" aria-label="Search by username" /></label>
          <Button type="submit" disabled={busy}>{busy ? "Searching…" : "Search"}</Button>
        </form>
        {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
        {found && <div className={cn2(row, "mt-4")}>{avatar(found.name)}<div className="flex-1"><b>{found.name}</b><p className="text-xs text-muted-foreground">@{found.username} · {found.level}</p></div>
          {!relation || relation.status === "declined" ? <Button size="sm" onClick={() => void addFriend(found)}><UserPlus /> Add friend</Button> : relation.status === "accepted" ? <span className="text-sm font-semibold">Friends</span> : <span className="text-sm font-semibold">Request pending</span>}
        </div>}
      </div>}
    </div>
  </section>;
}

function cn2(...parts: string[]) { return parts.join(" "); }
