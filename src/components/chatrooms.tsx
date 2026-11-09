import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Flag, Pencil, Reply, Search, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, increment, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RoomZone = "kids" | "youth" | "adult";
export type RoomGender = "male" | "female";
export type RoomDoc = { id: string; name: string; topic: string; note: string; zone?: RoomZone; audience?: "all" | RoomGender; zones?: RoomZone[]; genders?: RoomGender[]; postMode?: "everyone" | "admins"; active: boolean; order: number; memberCount: number };

/** New rooms list zones/genders; older rooms used a single zone and audience. */
export const roomZones = (r: RoomDoc): RoomZone[] => r.zones ?? (r.zone ? [r.zone] : []);
export const roomGenders = (r: RoomDoc): RoomGender[] => r.genders ?? (!r.audience || r.audience === "all" ? ["male", "female"] : [r.audience]);
export const canSeeRoom = (r: RoomDoc, zone: string, gender: string) => r.active && roomZones(r).includes(zone as RoomZone) && roomGenders(r).includes(gender as RoomGender);
export const roomTag = (r: RoomDoc) => { const g = roomGenders(r); return [g.length === 1 ? (g[0] === "female" ? "Sisters only" : "Brothers only") : "", r.postMode === "admins" ? "Admins post" : ""].filter(Boolean).join(" · "); };
const LINK = /(https?:\/\/\S+|www\.\S+|wa\.me\/\S*|t\.me\/\S*)/gi;
const youtubeId = (text: string) => text.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)?.[1];
type Row = { key: string; name: string; topic: string; note: string; audience: RoomDoc["audience"] };
type Msg = { id: string; uid: string; name: string; text: string; createdAt: number; editedAt?: number; replyTo?: { id: string; name: string; text: string } };

export const audienceLabel = (a: RoomDoc["audience"]) => (a === "female" ? "Sisters only" : a === "male" ? "Brothers only" : "");

const BASE: Row[] = [
  { key: "salam", name: "Salam and introductions", topic: "Community", note: "Say hello and meet other learners.", audience: "all" },
  { key: "quran", name: "Qur’an", topic: "Qur’an", note: "Recitation, memorisation and reflection.", audience: "all" },
  { key: "hadith", name: "Hadith", topic: "Hadith", note: "Sayings of the Prophet ﷺ and their meaning.", audience: "all" },
  { key: "fiqh", name: "Fiqh", topic: "Fiqh", note: "Everyday rulings and practice.", audience: "all" },
  { key: "seerah", name: "Seerah", topic: "Seerah", note: "The life of the Prophet ﷺ.", audience: "all" },
  { key: "arabic", name: "Arabic", topic: "Arabic", note: "Learning the language of the Qur’an.", audience: "all" },
  { key: "aqeedah", name: "Aqeedah", topic: "Aqeedah", note: "Foundations of belief.", audience: "all" },
  { key: "brothers", name: "Brothers’ Corner", topic: "Brothers", note: "A space for brothers to learn and support each other.", audience: "male" },
  { key: "sisters", name: "Sisters’ Circle", topic: "Sisters", note: "A space for sisters to learn and support each other.", audience: "female" },
];

function seedList(): RoomDoc[] {
  const out: RoomDoc[] = [];
  let order = 0;
  for (const zone of ["adult", "youth"] as const) {
    const rows: Row[] = [...BASE];
    if (zone === "adult") rows.push({ key: "parents", name: "Muslim Parents’ Corner", topic: "Family", note: "Raising children with faith and good adab.", audience: "all" });
    for (const r of rows) out.push({ id: `${zone}-${r.key}`, name: r.name, topic: r.topic, note: r.note, zone, audience: r.audience, active: true, order: order++, memberCount: 0 });
  }
  return out;
}

/** Live list of all rooms. Readable without signing in, so the landing page can use it too. */
export function useRooms(): { rooms: RoomDoc[]; loaded: boolean } {
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => onSnapshot(collection(db, "rooms"),
    (snap) => { setRooms(snap.docs.map((d) => ({ ...(d.data() as Omit<RoomDoc, "id">), id: d.id })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))); setLoaded(true); },
    () => setLoaded(true)), []);
  return { rooms, loaded };
}

export function ChatroomsScreen() {
  const { account } = useAuth();
  const zone = account?.zone ?? "adult";
  const gender = account?.gender ?? "male";
  const { rooms, loaded } = useRooms();
  const [myId, setMyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [joined, setJoined] = useState<string[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [find, setFind] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<Msg | null>(null);
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);
  const lastSent = useRef(0);
  const bottom = useRef<HTMLDivElement | null>(null);

  const visible = useMemo(() => rooms.filter((r) => (isAdmin || canSeeRoom(r, zone, gender)) && `${r.name} ${r.topic}`.toLowerCase().includes(find.toLowerCase())), [rooms, zone, gender, find, isAdmin]);
  const room = visible.find((r) => r.id === pick) ?? visible[0];
  const isJoined = !!room && joined.includes(room.id);
  const canPost = isJoined && (room?.postMode !== "admins" || isAdmin);

  useEffect(() => onAuthStateChanged(auth, (u) => setMyId(u?.uid ?? null)), []);
  useEffect(() => {
    if (!myId) { setIsAdmin(false); setJoined([]); return undefined; }
    getDoc(doc(db, "admins", myId)).then((s) => setIsAdmin(s.exists())).catch(() => setIsAdmin(false));
    return onSnapshot(doc(db, "memberships", myId), (s) => setJoined(s.exists() ? ((s.data() as { rooms?: string[] }).rooms ?? []) : []), () => {});
  }, [myId]);

  const roomId = room?.id;
  useEffect(() => {
    setMsgs([]); setError(""); setEditing(null); setMenuFor(null); setReplyingTo(null);
    if (!myId || !roomId) return undefined;
    return onSnapshot(query(collection(db, "rooms", roomId, "messages"), orderBy("createdAt", "desc"), limit(100)),
      (snap) => setMsgs(snap.docs.map((d) => ({ ...(d.data() as Omit<Msg, "id">), id: d.id })).reverse()),
      () => setError("We couldn't load this room. Check your connection and try again."));
  }, [roomId, myId]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [msgs.length, roomId]);

  async function seed() {
    setBusy(true);
    try {
      const b = writeBatch(db);
      for (const { id, ...rest } of seedList()) b.set(doc(db, "rooms", id), rest);
      await b.commit();
      toast.success("Rooms are set up.");
    } catch { toast("We couldn't set up the rooms. Check you are an admin and the rules are published."); } finally { setBusy(false); }
  }
  async function join(r: RoomDoc) {
    if (!myId || busy) return;
    setBusy(true);
    try {
      const b = writeBatch(db);
      b.set(doc(db, "memberships", myId), { rooms: arrayUnion(r.id) }, { merge: true });
      b.update(doc(db, "rooms", r.id), { memberCount: increment(1) });
      await b.commit();
    } catch { toast("We couldn't join that room. Try again."); } finally { setBusy(false); }
  }
  async function leave(r: RoomDoc) {
    if (!myId || busy) return;
    setBusy(true);
    try {
      const b = writeBatch(db);
      b.set(doc(db, "memberships", myId), { rooms: arrayRemove(r.id) }, { merge: true });
      if (r.memberCount > 0) b.update(doc(db, "rooms", r.id), { memberCount: increment(-1) });
      await b.commit();
    } catch { toast("We couldn't leave that room. Try again."); } finally { setBusy(false); }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !myId || !roomId || !canPost) return;
    if (!isAdmin && /(https?:\/\/|www\.|wa\.me|t\.me)/i.test(value)) { toast("Links aren't allowed in chatrooms."); return; }
    if (editing) {
      const m = editing; setEditing(null); setText("");
      try { await updateDoc(doc(db, "rooms", roomId, "messages", m.id), { text: value.slice(0, 500), editedAt: Date.now() }); }
      catch { toast("We couldn't edit that message. Try again."); }
      return;
    }
    if (Date.now() - lastSent.current < 3000) { toast("Please wait a moment between messages."); return; }
    lastSent.current = Date.now();
    setText("");
    const r = replyingTo;
    setReplyingTo(null);
    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        uid: myId, name: account?.username || account?.name?.split(/\s+/)[0] || "Learner", text: value.slice(0, 500), createdAt: Date.now(),
        ...(r ? { replyTo: { id: r.id, name: r.name, text: r.text.replace(LINK, "[link]").slice(0, 120) } } : {}),
      });
    } catch { setText(value); setReplyingTo(r); toast("We couldn't send that message. Try again."); }
  }
  async function report(m: Msg) {
    if (!myId || !roomId) return;
    try {
      await addDoc(collection(db, "reports"), { room: roomId, messageId: m.id, reportedUid: m.uid, reportedName: m.name, text: m.text, by: myId, createdAt: Date.now() });
      toast.success("Thank you. We'll review this message.");
    } catch { toast("We couldn't send that report. Try again."); }
  }
  const remove = (m: Msg) => { setMenuFor(null); if (!roomId || !window.confirm("Delete this message?")) return; void deleteDoc(doc(db, "rooms", roomId, "messages", m.id)).catch(() => toast("We couldn't delete that message. Try again.")); };
  const copy = (m: Msg) => { setMenuFor(null); void navigator.clipboard.writeText(m.text).then(() => toast.success("Copied")).catch(() => toast("Couldn't copy.")); };
  const startEdit = (m: Msg) => { setMenuFor(null); setEditing(m); setText(m.text); };

  return <div className="min-w-0 iq-rise">
    <header>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{zone === "kids" ? "Kids Zone" : zone === "youth" ? "Teens & Young Adults Zone" : "Adult Zone"} · moderated</p>
      <h1 className="font-serif text-4xl leading-none sm:text-5xl">Chatrooms</h1>
    </header>

    {loaded && rooms.length === 0 ? <section className="mt-5 max-w-xl border-2 border-foreground bg-background p-5 shadow-brutal">
      {isAdmin ? <><h2 className="font-serif text-2xl">Set up the rooms</h2><p className="mt-2 text-sm text-muted-foreground">There are no rooms yet. This creates the starting set for the Adult and Youth zones, including Brothers’ Corner and Sisters’ Circle.</p><Button className="mt-4" disabled={busy} onClick={() => void seed()}>{busy ? "Setting up…" : "Set up rooms"}</Button></>
        : <p className="text-sm text-muted-foreground">The rooms are being set up. Please check back soon.</p>}
    </section> : <div className="mt-5 grid min-w-0 border-2 border-foreground bg-background shadow-brutal md:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border-b-2 border-foreground md:border-b-0 md:border-r-2">
        <div className="p-3"><label className="flex h-10 items-center gap-2 border-2 border-foreground px-3"><Search className="size-4 shrink-0" /><input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find a room" aria-label="Find a room" className="w-full bg-transparent outline-none" /></label></div>
        <ul className="max-h-60 overflow-y-auto border-t-2 border-foreground md:max-h-[60vh]">
          {visible.map((r) => <li key={r.id}><button type="button" onClick={() => setPick(r.id)} className={cn("flex w-full items-start justify-between gap-2 border-b-2 border-foreground px-4 py-3 text-left", room?.id === r.id ? "bg-primary" : "bg-background hover:bg-muted")}>
            <span className="min-w-0"><b className="block font-serif text-xl font-normal leading-tight">{r.name}</b><small className="text-xs text-muted-foreground">{r.memberCount ?? 0} members · {r.topic}{isAdmin ? ` · ${roomZones(r).map((z) => (z === "kids" ? "Kids" : z === "youth" ? "Teens" : "Adult")).join(" + ")}` : ""}{roomTag(r) ? ` · ${roomTag(r)}` : ""}</small></span>
            {joined.includes(r.id) && <span className="mt-1 size-2.5 shrink-0 bg-secondary" aria-label="Joined" />}
          </button></li>)}
          {!visible.length && <li className="p-4 text-sm text-muted-foreground">No rooms match.</li>}
        </ul>
      </aside>

      {room ? <section className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground px-4 py-3">
          <div className="min-w-0"><h2 className="font-serif text-2xl">{room.name}</h2><p className="text-xs text-muted-foreground">{room.note} · {room.memberCount ?? 0} members. Be kind and keep to good adab.</p></div>
          {isJoined ? <Button variant="outline" size="sm" disabled={busy} onClick={() => void leave(room)}>Leave room</Button> : <Button size="sm" disabled={busy} onClick={() => void join(room)}>Join room</Button>}
        </div>
        <div className="h-[50vh] min-h-64 space-y-3 overflow-y-auto bg-muted/30 p-4">
          {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
          {!error && msgs.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Join the room and start with a salam.</p>}
          {msgs.map((m) => { const mine = m.uid === myId; return <div key={m.id} id={`msg-${m.id}`} className={cn("flex", mine && "justify-end")}>
            <div role="button" tabIndex={0} onClick={() => setMenuFor(menuFor === m.id ? null : m.id)} onKeyDown={(e) => { if (e.key === "Enter") setMenuFor(menuFor === m.id ? null : m.id); }} className={cn("max-w-[85%] cursor-pointer border-2 border-foreground px-3 py-2", mine ? "bg-primary" : "bg-background", menuFor === m.id && "ring-2 ring-ring")}>
              <p className="text-xs font-bold">{mine ? "You" : m.name} <span className="font-normal text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{m.editedAt ? " · edited" : ""}</span></p>
              {m.replyTo && <button type="button" onClick={(e) => { e.stopPropagation(); document.getElementById(`msg-${m.replyTo?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="mt-1 block w-full border-l-4 border-foreground bg-foreground/10 px-2 py-1 text-left text-xs"><b>{m.replyTo.name}</b><span className="line-clamp-2 block">{m.replyTo.text}</span></button>}
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{m.text}</p>
              {room.postMode === "admins" && youtubeId(m.text) && <div className="mt-2 aspect-video w-[min(560px,75vw)] border-2 border-foreground"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${youtubeId(m.text)}?rel=0`} title="Video" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
              {menuFor === m.id && <div className="mt-2 flex flex-wrap gap-3 border-t border-foreground/30 pt-2 text-xs font-semibold" onClick={(e) => e.stopPropagation()}>
                {canPost && <button type="button" onClick={() => { setMenuFor(null); setEditing(null); setReplyingTo(m); }} className="flex items-center gap-1"><Reply className="size-3" /> Reply</button>}
                <button type="button" onClick={() => copy(m)} className="flex items-center gap-1"><Copy className="size-3" /> Copy</button>
                {mine && Date.now() - m.createdAt < 15 * 60 * 1000 && <button type="button" onClick={() => startEdit(m)} className="flex items-center gap-1"><Pencil className="size-3" /> Edit</button>}
                {(mine || isAdmin) && <button type="button" onClick={() => remove(m)} className="flex items-center gap-1 text-destructive"><Trash2 className="size-3" /> Delete</button>}
                {!mine && <button type="button" onClick={() => { setMenuFor(null); void report(m); }} className="flex items-center gap-1"><Flag className="size-3" /> Report</button>}
              </div>}
            </div>
          </div>; })}
          <div ref={bottom} />
        </div>
        {replyingTo && <div className="flex items-center justify-between gap-2 border-t-2 border-foreground bg-muted px-3 py-2 text-xs"><span className="min-w-0 truncate"><b>Replying to {replyingTo.uid === myId ? "yourself" : replyingTo.name}:</b> {replyingTo.text}</span><button type="button" onClick={() => setReplyingTo(null)} className="flex shrink-0 items-center gap-1 font-semibold"><X className="size-3" /> Cancel</button></div>}
        {editing && <div className="flex items-center justify-between border-t-2 border-foreground bg-muted px-3 py-2 text-xs font-semibold"><span>Editing your message</span><button type="button" onClick={() => { setEditing(null); setText(""); }} className="flex items-center gap-1"><X className="size-3" /> Cancel</button></div>}
        <form onSubmit={(e) => void send(e)} className="flex gap-2 border-t-2 border-foreground p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} disabled={!canPost} placeholder={!isJoined ? "Join this room to write a message" : !canPost ? "Only admins post in this room" : room.postMode === "admins" ? "Post a message or a YouTube link" : `Message ${room.name}`} aria-label="Message" className="h-10 min-w-0 flex-1 border-2 border-foreground bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60" />
          <Button type="submit" disabled={!canPost || !text.trim()}><Send /> {editing ? "Save" : "Send"}</Button>
        </form>
      </section> : <p className="p-6 text-sm text-muted-foreground">{loaded ? "No rooms are available for you yet." : "Loading rooms…"}</p>}
    </div>}
  </div>;
}
