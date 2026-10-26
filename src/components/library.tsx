import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Bookmark, BookmarkCheck, ChevronRight, Crown, LockKeyhole, Search, Share2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuth, type Zone } from "@/components/auth";
import { LockedTag, PremiumTag, UnlockDialog, usePremium } from "@/components/premium";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES, CORNERS, LIBRARY, type Age, type LibraryItem } from "@/components/library-data";

type Progress = { pos: number; total: number; at: number };
type LState = { bookmarks: string[]; progress: Record<string, Progress>; finished: string[] };
const EMPTY: LState = { bookmarks: [], progress: {}, finished: [] };
const FINISH_POINTS = 20;

/** Bookmarks, reading place and finished books, saved per account in Firestore. */
function useLibraryState() {
  const [state, setState] = useState<LState>(EMPTY);
  const [uid, setUid] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null)), []);

  useEffect(() => {
    loaded.current = false;
    setState(EMPTY);
    if (!uid) return;
    let off = false;
    getDoc(doc(db, "libraryState", uid))
      .then((s) => {
        if (off) return;
        if (s.exists()) setState({ ...EMPTY, ...(s.data() as Partial<LState>) });
        loaded.current = true;
      })
      .catch(() => {});
    return () => { off = true; };
  }, [uid]);

  useEffect(() => {
    if (!uid || !loaded.current) return;
    const t = setTimeout(() => { setDoc(doc(db, "libraryState", uid), state).catch(() => {}); }, 800);
    return () => clearTimeout(t);
  }, [state, uid]);

  return [state, setState] as const;
}

const bandsFor = (zone: Zone): Age[] => (zone === "kids" ? ["kids"] : zone === "youth" ? ["kids", "teens"] : ["kids", "teens", "adults"]);

function Reader({ item, state, setState, onBack, onShare }: {
  item: LibraryItem; state: LState; setState: React.Dispatch<React.SetStateAction<LState>>; onBack: () => void; onShare: () => void;
}) {
  const { addPoints } = usePremium();
  const paras = item.body ?? [];
  const refs = useRef<(HTMLElement | null)[]>([]);
  const settled = useRef(false);
  const saved = state.progress[item.id];
  const [pos, setPos] = useState(saved?.pos ?? 0);
  const isSaved = state.bookmarks.includes(item.id);

  // go back to where the reader stopped, then start tracking
  useEffect(() => {
    settled.current = false;
    const start = saved?.pos ?? 0;
    const t = setTimeout(() => {
      if (start > 0) refs.current[start]?.scrollIntoView({ block: "start" });
      settled.current = true;
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  useEffect(() => {
    if (!paras.length) return;
    const io = new IntersectionObserver((entries) => {
      if (!settled.current) return;
      for (const e of entries) if (e.isIntersecting) setPos(Number((e.target as HTMLElement).dataset.i));
    }, { rootMargin: "0px 0px -60% 0px" });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [item.id, paras.length]);

  useEffect(() => {
    if (!paras.length || !settled.current) return;
    const done = pos >= paras.length - 1;
    setState((s) => {
      const finishedNow = done && !s.finished.includes(item.id);
      if (finishedNow) { addPoints(FINISH_POINTS); toast.success(`Finished! +${FINISH_POINTS} points`); }
      return {
        ...s,
        progress: { ...s.progress, [item.id]: { pos, total: paras.length, at: Date.now() } },
        finished: finishedNow ? [...s.finished, item.id] : s.finished,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  const pct = paras.length ? Math.round(((pos + 1) / paras.length) * 100) : 0;
  const toggleSave = () => {
    setState((s) => ({ ...s, bookmarks: s.bookmarks.includes(item.id) ? s.bookmarks.filter((x) => x !== item.id) : [...s.bookmarks, item.id] }));
    toast.success(isSaved ? "Removed from saved" : "Saved to your bookmarks");
  };

  return (
    <div className="min-w-0 iq-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{item.kind === "book" ? "Library book" : "Library article"} · {item.cats[0]}</p>
          <h1 className="break-words font-serif text-4xl leading-none sm:text-5xl">{item.title}</h1>
          {item.author && <p className="mt-2 text-sm text-muted-foreground">by {item.author}</p>}
        </div>
        <Button variant="outline" onClick={onBack}>Back to library</Button>
      </div>
      <section className="mt-6 min-w-0 border-2 border-foreground bg-background p-4 shadow-brutal">
        {paras.length > 0 ? (
          <>
            <div className="sticky top-0 z-10 mb-8 h-2 border border-foreground bg-background"><div className="h-full bg-secondary" style={{ width: `${pct}%` }} /></div>
            {item.arabic && <p className="font-arabic text-4xl leading-relaxed" dir="rtl">{item.arabic}</p>}
            {item.translation && <p className="mt-2 italic text-muted-foreground">{item.translation}</p>}
            <div className="mt-8 max-w-3xl space-y-4">
              {paras.map((p, i) => (
                <p key={i} data-i={i} ref={(el) => { refs.current[i] = el; }} className={i === 0 ? "font-serif text-3xl" : "leading-7"}>{p}</p>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{pct}% read · your place is saved automatically</p>
          </>
        ) : (
          <p className="max-w-xl leading-7">The full text of this {item.kind} isn’t in the library yet. It will appear here once it has been added.</p>
        )}
        <div className="mt-8 flex gap-3">
          <Button onClick={toggleSave}>{isSaved ? <BookmarkCheck /> : <Bookmark />} {isSaved ? "Saved" : "Save"}</Button>
          <Button variant="outline" onClick={onShare}><Share2 /> Share</Button>
        </div>
      </section>
    </div>
  );
}

export function LibraryScreen({ onShare }: { onShare: () => void }) {
  const { account } = useAuth();
  const { premium, points, canAccess } = usePremium();
  const [state, setState] = useLibraryState();
  const [openId, setOpenId] = useState<string>();
  const [cat, setCat] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [locked, setLocked] = useState<{ id: string; title: string; cost: number }>();

  const zone = account?.zone ?? "youth";
  const gender = account?.gender;
  const bands = bandsFor(zone);

  const visible = useMemo(
    () => LIBRARY.filter((i) => bands.includes(i.age) && (!i.audience || i.audience === gender)),
    [zone, gender], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const chips = useMemo(
    () => [...CATEGORIES].filter((c) => (!CORNERS[c] || CORNERS[c] === gender) && visible.some((i) => i.cats.includes(c))).sort((a, b) => a.localeCompare(b)),
    [visible, gender],
  );

  const open = LIBRARY.find((i) => i.id === openId);
  if (open) return <Reader item={open} state={state} setState={setState} onBack={() => setOpenId(undefined)} onShare={onShare} />;

  const q = query.trim().toLowerCase();
  const list = visible.filter((i) => {
    if (cat === "Saved" && !state.bookmarks.includes(i.id)) return false;
    if (cat !== "All" && cat !== "Saved" && !i.cats.includes(cat)) return false;
    return !q || i.title.toLowerCase().includes(q) || (i.author ?? "").toLowerCase().includes(q);
  });
  const continuing = visible.filter((i) => state.progress[i.id] && !state.finished.includes(i.id) && i.body?.length);

  const openItem = (i: LibraryItem) => (canAccess(i.id, i.tier) ? setOpenId(i.id) : setLocked({ id: i.id, title: i.title, cost: i.cost }));

  return (
    <div className="min-w-0 iq-rise">
      <header className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Read with depth</p>
          <h1 className="break-words font-serif text-4xl leading-none sm:text-5xl">Library</h1>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          {premium ? <PremiumTag /> : <span className="inline-flex items-center gap-1 border-2 border-foreground px-2 py-1 text-xs font-bold"><Wallet className="size-3" /> {points} pts</span>}
          <Button variant="outline" onClick={() => setCat("Saved")}>Bookmarks · {state.bookmarks.length}</Button>
        </div>
      </header>

      <div className="mt-6 min-w-0">
        <div className="relative"><Search className="absolute left-3 top-3 size-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 w-full border-2 border-foreground bg-background pl-10" placeholder="Search titles and authors" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="mt-3 h-11 w-full border-2 border-foreground bg-background px-3 font-semibold sm:hidden">
          {["All", ...chips, "Saved"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
          {["All", ...chips, "Saved"].map((c) => (
            <Button key={c} size="sm" variant={cat === c ? "secondary" : "outline"} onClick={() => setCat(c)}>{c}</Button>
          ))}
        </div>

        {!premium && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-2 border-foreground bg-primary p-5 shadow-brutal">
            <div className="flex-1"><p className="font-serif text-2xl">Premium readings</p><p className="text-sm">Longer, deeper studies. Read them all with Premium, or unlock one at a time with points.</p></div>
            <Button variant="secondary" onClick={() => setLocked({ id: "premium", title: "IlmStation Premium", cost: 1200 })}><Crown /> See Premium</Button>
          </div>
        )}

        {cat === "All" && !q && continuing.length > 0 && (
          <div className="mt-6">
            <h2 className="font-serif text-2xl">Continue reading</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {continuing.map((i) => {
                const p = state.progress[i.id]!;
                return (
                  <button key={i.id} onClick={() => openItem(i)} className="border-2 border-foreground p-4 text-left shadow-brutal">
                    <span className="font-serif text-xl">{i.title}</span>
                    <span className="mt-3 block h-2 border border-foreground"><span className="block h-full bg-secondary" style={{ width: `${Math.round(((p.pos + 1) / p.total) * 100)}%` }} /></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">{cat === "Saved" ? "Nothing saved yet. Open something and tap Save." : "Nothing matches that yet."}</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {list.map((i, n) => {
              const free = canAccess(i.id, i.tier);
              const done = state.finished.includes(i.id);
              return (
                <button key={i.id} onClick={() => openItem(i)} className={cn("relative border-2 border-foreground p-6 text-left shadow-brutal", n === 0 && cat === "All" && !q && "bg-primary", !free && "bg-muted")}>
                  <span className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
                    {i.cats[0]} · {i.kind === "book" ? "Book" : `${i.mins} min`}
                    {i.tier === "premium" && (free ? <PremiumTag /> : <LockedTag cost={i.cost} />)}
                    {done && <span className="border border-foreground px-1">Finished</span>}
                    {state.bookmarks.includes(i.id) && <BookmarkCheck className="size-3.5" />}
                  </span>
                  <h2 className={cn("mt-3 font-serif text-3xl", !free && "opacity-70")}>{i.title}</h2>
                  {i.author && <p className="mt-1 text-sm text-muted-foreground">{i.author}</p>}
                  <span className="mt-5 flex items-center text-sm font-bold">
                    {free ? <>{i.kind === "book" ? "Open book" : "Read article"} <ChevronRight className="size-4" /></> : <><LockKeyhole className="mr-1 size-4" /> Unlock to read</>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <UnlockDialog item={locked} onOpenChange={(o) => { if (!o) setLocked(undefined); }} />
    </div>
  );
}