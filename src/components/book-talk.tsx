import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag, MessageSquare, Star, Trash2 } from "lucide-react";
import { addDoc, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "@/components/library-data";

type Review = { uid: string; stars: number };
type Post = { id: string; uid: string; name: string; text: string; note?: string; createdAt: number };
const LINK = /(https?:\/\/|www\.|wa\.me|t\.me)/i;

/** Star ratings and the readers' discussion under a book. */
export function BookTalk({ item, note, canRate = true }: { item: LibraryItem; note: string; canRate?: boolean }) {
  const { account } = useAuth();
  const myId = auth.currentUser?.uid ?? null;
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const off = item.comments === false;
  const kid = account?.zone === "kids";
  const name = account?.username || account?.name?.split(/\s+/)[0] || "Reader";

  useEffect(() => {
    if (!myId) return undefined;
    getDoc(doc(db, "admins", myId)).then((s) => setIsAdmin(s.exists())).catch(() => {});
    return undefined;
  }, [myId]);
  useEffect(() => {
    if (off) return undefined;
    return onSnapshot(collection(db, "library", item.id, "reviews"), (s) => setReviews(s.docs.map((d) => d.data() as Review)), () => {});
  }, [item.id, off]);
  useEffect(() => {
    if (off || kid) return undefined;
    return onSnapshot(query(collection(db, "library", item.id, "posts"), orderBy("createdAt", "desc"), limit(50)),
      (s) => setPosts(s.docs.map((d) => ({ ...(d.data() as Omit<Post, "id">), id: d.id }))), () => {});
  }, [item.id, off, kid]);

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.stars, 0) / reviews.length : 0;
  const myStars = reviews.find((r) => r.uid === myId)?.stars ?? 0;

  const rate = async (stars: number) => {
    if (!myId) { toast("Log in to rate this book."); return; }
    if (!canRate) { toast("Start reading first, then you can rate it."); return; }
    try {
      const token = await auth.currentUser!.getIdToken();
      const r = await fetch("/api/rate", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ bookId: item.id, stars }) });
      const out = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) { toast(out.error === "not-started" ? "Start reading first, then you can rate it." : "Couldn't save your rating. Try again."); return; }
      toast.success("Thanks for rating!");
    }
    catch { toast("Couldn't save your rating. Try again."); }
  };
  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !myId || busy) return;
    if (!isAdmin && LINK.test(value)) { toast("Links aren't allowed here."); return; }
    setBusy(true);
    try {
      await addDoc(collection(db, "library", item.id, "posts"), { uid: myId, name, text: value.slice(0, 500), ...(note ? { note } : {}), createdAt: Date.now() });
      setText("");
    } catch { toast("Couldn't post. Try again."); } finally { setBusy(false); }
  };
  const remove = (p: Post) => {
    if (!window.confirm("Delete this post?")) return;
    void deleteDoc(doc(db, "library", item.id, "posts", p.id)).catch(() => toast("Couldn't delete that post."));
  };
  const report = async (p: Post) => {
    if (!myId) return;
    try {
      await addDoc(collection(db, "reports"), { room: `book:${item.id}`, messageId: p.id, reportedUid: p.uid, reportedName: p.name, text: p.text, by: myId, createdAt: Date.now() });
      toast.success("Thank you. We'll review this post.");
    } catch { toast("Couldn't send that report. Try again."); }
  };

  if (off) return <p className="mt-6 text-sm text-muted-foreground">Comments and ratings are turned off for this {item.kind}.</p>;

  return <section className="mt-6 min-w-0 border-2 border-foreground bg-background p-4 shadow-brutal">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground">Rating</p>
        <p className="font-serif text-2xl">{reviews.length ? `${avg.toFixed(1)} ★` : "No ratings yet"} <span className="text-sm text-muted-foreground">{reviews.length ? `· ${reviews.length} rating${reviews.length === 1 ? "" : "s"}` : ""}</span></p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground">{canRate ? "Your rating" : "Start reading to rate"}</p>
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => void rate(n)}>
          <Star className={cn("size-7", n <= myStars ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} />
        </button>)}</div>
      </div>
    </div>

    <h2 className="mt-8 flex items-center gap-2 font-serif text-2xl"><MessageSquare className="size-5" /> Readers’ discussion</h2>
    {kid ? <p className="mt-2 text-sm text-muted-foreground">The readers’ discussion is open to Teens and Adults.</p> : <>
      <form onSubmit={(e) => void post(e)} className="mt-3 grid gap-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} placeholder="Share your thoughts, or how your reading is going…" aria-label="Your post" className="w-full border-2 border-foreground bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{note ? `Your post will show: ${note}` : "Be kind, and warn before spoilers."}</span>
          <Button type="submit" disabled={busy || !text.trim()}>Post</Button>
        </div>
      </form>
      {posts.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No posts yet. Be the first to share.</p> :
      <ul className="mt-4 grid gap-3">{posts.map((p) => { const mine = p.uid === myId; return <li key={p.id} className="border-2 border-foreground p-3">
        <p className="text-xs"><b>{mine ? "You" : p.name}</b>{p.note && <span className="text-muted-foreground"> · {p.note}</span>}<span className="text-muted-foreground"> · {new Date(p.createdAt).toLocaleDateString()}</span></p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{p.text}</p>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          {!mine && myId && <button type="button" onClick={() => void report(p)} className="flex items-center gap-1 hover:text-foreground"><Flag className="size-3" /> Report</button>}
          {(mine || isAdmin) && <button type="button" onClick={() => remove(p)} className="flex items-center gap-1 hover:text-destructive"><Trash2 className="size-3" /> Delete</button>}
        </div>
      </li>; })}</ul>}
    </>}
  </section>;
}
