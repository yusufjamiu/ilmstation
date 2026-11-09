import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { Bookmark, BookmarkCheck, ChevronRight, Crown, ExternalLink, Headphones, LockKeyhole, Pause, Play, RotateCcw, RotateCw, Search, Share2, SkipBack, SkipForward, Wallet } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuth, type Zone } from "@/components/auth";
import { LockedTag, PremiumTag, UnlockDialog, usePremium } from "@/components/premium";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES, CORNERS, LIBRARY, type Age, type LibraryItem } from "@/components/library-data";
import { BookTalk } from "@/components/book-talk";

type Progress = { pos: number; total: number; at: number; secs?: number };
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

/** Built-in items plus published items uploaded from the admin. */
function useLibraryItems(): LibraryItem[] {
  const [remote, setRemote] = useState<LibraryItem[]>([]);
  useEffect(() => onSnapshot(query(collection(db, "library"), where("status", "==", "published")),
    (snap) => setRemote(snap.docs.map((d) => ({ ...(d.data() as Omit<LibraryItem, "id">), id: d.id })).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))),
    () => setRemote([])), []);
  return useMemo(() => [...remote, ...LIBRARY.filter((i) => !remote.some((r) => r.id === i.id))], [remote]);
}

/** Each book's average rating (kept up to date by the server). */
function useLibraryStats(): Record<string, { avg: number; count: number }> {
  const [stats, setStats] = useState<Record<string, { avg: number; count: number }>>({});
  useEffect(() => onSnapshot(collection(db, "libraryStats"),
    (snap) => setStats(Object.fromEntries(snap.docs.map((d) => [d.id, { avg: Number(d.get("avg")) || 0, count: Number(d.get("count")) || 0 }]))),
    () => {}), []);
  return stats;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const SPEEDS = [1, 1.25, 1.5, 2];

function AudioSection({ item, state, setState }: { item: LibraryItem; state: LState; setState: React.Dispatch<React.SetStateAction<LState>> }) {
  if (item.audioStatus === "soon") return <p className="mt-6 inline-flex items-center gap-2 border-2 border-foreground px-3 py-2 text-sm font-semibold"><Headphones className="size-4" /> Audio coming soon</p>;
  if (item.audioStatus !== "available" || !item.audio?.length) return null;
  return <AudioPlayer item={item} tracks={item.audio} state={state} setState={setState} />;
}

/** Chapter-by-chapter player that remembers the chapter and minute. */
function AudioPlayer({ item, tracks, state, setState }: { item: LibraryItem; tracks: NonNullable<LibraryItem["audio"]>; state: LState; setState: React.Dispatch<React.SetStateAction<LState>> }) {
  const key = `audio:${item.id}`;
  const saved = state.progress[key];
  const [idx, setIdx] = useState(Math.min(saved?.pos ?? 0, tracks.length - 1));
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed, setSpeed] = useState(1);
  const el = useRef<HTMLAudioElement | null>(null);
  const resumeAt = useRef(saved?.secs ?? 0);
  const autoplay = useRef(false);
  const lastSave = useRef(0);
  const track = tracks[idx]!;

  const save = (i: number, secs: number) => setState((s) => ({ ...s, progress: { ...s.progress, [key]: { pos: i, total: tracks.length, secs, at: Date.now() } } }));
  const go = (i: number, play: boolean) => {
    if (i < 0 || i >= tracks.length) return;
    resumeAt.current = 0; autoplay.current = play; setIdx(i); setTime(0); save(i, 0);
  };
  const toggle = () => { const a = el.current; if (!a) return; if (a.paused) void a.play().catch(() => toast("Couldn't play this audio.")); else a.pause(); };
  const skip = (d: number) => { const a = el.current; if (a) a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + d)); };
  useEffect(() => { if (el.current) el.current.playbackRate = speed; }, [speed, idx]);

  return <section className="mt-8 border-2 border-foreground bg-muted/30 p-4">
    <p className="flex items-center gap-2 text-xs font-bold uppercase"><Headphones className="size-4" /> Listen · {tracks.length > 1 ? `Chapter ${idx + 1} of ${tracks.length}` : "Audio"}</p>
    <p className="mt-1 font-serif text-2xl">{track.title}</p>
    <audio ref={el} src={track.url} preload="metadata"
      onLoadedMetadata={(e) => { const a = e.currentTarget; setDur(a.duration || 0); a.playbackRate = speed; if (resumeAt.current) { a.currentTime = resumeAt.current; resumeAt.current = 0; } if (autoplay.current) { autoplay.current = false; void a.play().catch(() => setPlaying(false)); } }}
      onTimeUpdate={(e) => { const t = e.currentTarget.currentTime; setTime(t); if (Date.now() - lastSave.current > 5000) { lastSave.current = Date.now(); save(idx, t); } }}
      onPlay={() => setPlaying(true)}
      onPause={() => { setPlaying(false); save(idx, el.current?.currentTime ?? 0); }}
      onEnded={() => { if (idx < tracks.length - 1) go(idx + 1, true); else setPlaying(false); }} />
    <input type="range" min={0} max={dur || 0} step={1} value={time} aria-label="Position" onChange={(e) => { if (el.current) el.current.currentTime = Number(e.target.value); }} className="mt-3 w-full" />
    <div className="flex justify-between text-xs tabular-nums text-muted-foreground"><span>{fmt(time)}</span><span>{fmt(dur)}</span></div>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button size="icon" variant="outline" aria-label="Previous chapter" disabled={idx === 0} onClick={() => go(idx - 1, playing)}><SkipBack /></Button>
      <Button size="icon" variant="outline" aria-label="Back 15 seconds" onClick={() => skip(-15)}><RotateCcw /></Button>
      <Button size="icon" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <Pause /> : <Play />}</Button>
      <Button size="icon" variant="outline" aria-label="Forward 15 seconds" onClick={() => skip(15)}><RotateCw /></Button>
      <Button size="icon" variant="outline" aria-label="Next chapter" disabled={idx === tracks.length - 1} onClick={() => go(idx + 1, playing)}><SkipForward /></Button>
      <Button size="sm" variant="outline" aria-label="Playback speed" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!)}>{speed}×</Button>
    </div>
    {tracks.length > 1 && <ol className="mt-4 max-h-64 overflow-y-auto border-t-2 border-foreground">
      {tracks.map((t, i) => <li key={i}><button type="button" onClick={() => go(i, true)} className={cn("flex w-full justify-between gap-2 border-b border-foreground/30 px-2 py-2 text-left text-sm", i === idx && "bg-primary font-semibold")}>
        <span>{i + 1}. {t.title}</span>{t.mins ? <span className="tabular-nums text-muted-foreground">{t.mins} min</span> : null}
      </button></li>)}
    </ol>}
  </section>;
}

const bandsFor = (zone: Zone): Age[] => (zone === "kids" ? ["kids"] : zone === "youth" ? ["kids", "teens"] : ["kids", "teens", "adults"]);

const PdfReader = lazy(() => import("@/components/pdf-reader"));
function ClientPdf(props: { url: string; startPage: number; onPage: (page: number, total: number) => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const wait = <p className="text-sm text-muted-foreground">Loading book…</p>;
  if (!ready) return wait;
  return <Suspense fallback={wait}><PdfReader {...props} /></Suspense>;
}

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
  const talkNote = (() => {
    if (state.finished.includes(item.id)) return "finished it";
    const pp = state.progress[item.id];
    if (item.pdfUrl && pp) return `on page ${pp.pos + 1} of ${pp.total}`;
    const ap = state.progress[`audio:${item.id}`];
    if (ap) return `on chapter ${ap.pos + 1} of ${ap.total}`;
    if (pp?.total) return `${Math.round(((pp.pos + 1) / pp.total) * 100)}% through`;
    return "";
  })();
  const savePdf = (page: number, total: number) => setState((s) => {
    const finishedNow = page >= total && !s.finished.includes(item.id);
    if (finishedNow) { addPoints(FINISH_POINTS); toast.success(`Finished! +${FINISH_POINTS} points`); }
    return {
      ...s,
      progress: { ...s.progress, [item.id]: { pos: page - 1, total, at: Date.now() } },
      finished: finishedNow ? [...s.finished, item.id] : s.finished,
    };
  });

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
        ) : item.pdfUrl ? (
          <div>
            <ClientPdf url={item.pdfUrl} startPage={(saved?.pos ?? 0) + 1} onPage={savePdf} />
            <a href={item.pdfUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline"><ExternalLink className="size-4" /> Open full screen</a>
          </div>
        ) : (
          <p className="max-w-xl leading-7">{item.audioStatus === "available" ? "This title is available to listen to below." : `The full text of this ${item.kind} isn’t in the library yet. It will appear here once it has been added.`}</p>
        )}
        <AudioSection item={item} state={state} setState={setState} />
        <div className="mt-8 flex gap-3">
          <Button onClick={toggleSave}>{isSaved ? <BookmarkCheck /> : <Bookmark />} {isSaved ? "Saved" : "Save"}</Button>
          <Button variant="outline" onClick={onShare}><Share2 /> Share</Button>
        </div>
      </section>
      <BookTalk item={item} note={talkNote} canRate={state.finished.includes(item.id) || (state.progress[item.id]?.pos ?? 0) >= 1 || !!state.progress[`audio:${item.id}`]?.secs} />
    </div>
  );
}

export function LibraryScreen({ onShare }: { onShare: () => void }) {
  const { account } = useAuth();
  const { premium, points, canAccess } = usePremium();
  const [state, setState] = useLibraryState();
  const all = useLibraryItems();
  const stats = useLibraryStats();
  const [openId, setOpenId] = useState<string>();
  const [cat, setCat] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [locked, setLocked] = useState<{ id: string; title: string; cost: number }>();

  const zone = account?.zone ?? "youth";
  const gender = account?.gender;
  const bands = bandsFor(zone);

  const visible = useMemo(
    () => all.filter((i) => bands.includes(i.age) && (!i.audience || i.audience === gender)),
    [all, zone, gender], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const chips = useMemo(
    () => [...CATEGORIES].filter((c) => (!CORNERS[c] || CORNERS[c] === gender) && visible.some((i) => i.cats.includes(c))).sort((a, b) => a.localeCompare(b)),
    [visible, gender],
  );

  const open = all.find((i) => i.id === openId);
  if (open) return <Reader item={open} state={state} setState={setState} onBack={() => setOpenId(undefined)} onShare={onShare} />;

  const q = query.trim().toLowerCase();
  const list = visible.filter((i) => {
    if (cat === "Saved" && !state.bookmarks.includes(i.id)) return false;
    if (cat !== "All" && cat !== "Saved" && !i.cats.includes(cat)) return false;
    return !q || i.title.toLowerCase().includes(q) || (i.author ?? "").toLowerCase().includes(q);
  });
  const continuing = visible.filter((i) => state.progress[i.id] && !state.finished.includes(i.id) && (i.body?.length || i.pdfUrl));

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
                    {i.audioStatus === "available" && <span className="inline-flex items-center gap-1 border border-foreground px-1"><Headphones className="size-3" /> Audio</span>}
                    {i.audioStatus === "soon" && <span className="border border-foreground px-1">Audio soon</span>}
                  </span>
                  {i.coverUrl && <img src={i.coverUrl} alt="" loading="lazy" className="mt-3 h-40 w-28 border-2 border-foreground object-cover" />}
                  <h2 className={cn("mt-3 font-serif text-3xl", !free && "opacity-70")}>{i.title}</h2>
                  {i.author && <p className="mt-1 text-sm text-muted-foreground">{i.author}</p>}
                  {stats[i.id]?.count ? <p className="mt-1 text-sm font-semibold">★ {stats[i.id]!.avg.toFixed(1)} <span className="font-normal text-muted-foreground">({stats[i.id]!.count})</span></p> : null}
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