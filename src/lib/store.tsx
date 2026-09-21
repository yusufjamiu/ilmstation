import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BADGES, NOTIFICATIONS_SEED, levelFor, type TopicId } from "./data";

export type PointCategory = "ajr" | "ilm" | "noor" | "hikmah";

export interface Txn {
  id: string;
  label: string;
  category: PointCategory | "spend";
  amount: number;
  at: string;
}

export interface Notif {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  action: string;
}

export interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  name: string;
  email: string;
  username: string;
  avatar: string;
  language: string;
  zone: string;
  interests: TopicId[];
  difficulty: "beginner" | "intermediate" | "advanced";
  xp: number;
  points: Record<PointCategory, number>;
  streak: number;
  streakWeek: boolean[];
  freezes: number;
  badges: string[];
  bookmarks: string[];
  readArticles: string[];
  questStages: Record<string, number>;
  quizzesPlayed: number;
  perfectQuizzes: number;
  duelWins: number;
  duelLosses: number;
  hifzStrong: string[];
  hifzPractice: string[];
  hifzSessions: number;
  dark: boolean;
  premium: boolean;
  sound: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  notificationsOn: boolean;
  ilmbotUsed: number;
  articlesRead: number;
  donated: number;
  txns: Txn[];
  notifs: Notif[];
  ramadanDismissed: boolean;
  ramadanDays: number[];
  tarawih: number[];
}

const initial: AppState = {
  hydrated: false,
  onboarded: false,
  name: "",
  email: "",
  username: "",
  avatar: "🧕",
  language: "en",
  zone: "zone2",
  interests: [],
  difficulty: "intermediate",
  xp: 0,
  points: { ajr: 0, ilm: 0, noor: 0, hikmah: 0 },
  streak: 0,
  streakWeek: [false, false, false, false, false, false, false],
  freezes: 0,
  badges: [],
  bookmarks: [],
  readArticles: [],
  questStages: {},
  quizzesPlayed: 0,
  perfectQuizzes: 0,
  duelWins: 0,
  duelLosses: 0,
  hifzStrong: [],
  hifzPractice: [],
  hifzSessions: 0,
  dark: false,
  premium: false,
  sound: true,
  reduceMotion: false,
  largeText: false,
  notificationsOn: true,
  ilmbotUsed: 0,
  articlesRead: 0,
  donated: 0,
  txns: [],
  notifs: NOTIFICATIONS_SEED.map((n) => ({ ...n })),
  ramadanDismissed: false,
  ramadanDays: [],
  tarawih: [],
};

/** Demo profile applied when onboarding completes, so every screen has real data. */
const demoSeed: Partial<AppState> = {
  xp: 1180,
  points: { ajr: 420, ilm: 610, noor: 240, hikmah: 180 },
  streak: 12,
  streakWeek: [true, true, true, true, true, false, false],
  freezes: 1,
  badges: ["seal"],
  quizzesPlayed: 14,
  perfectQuizzes: 2,
  duelWins: 7,
  duelLosses: 4,
  hifzSessions: 3,
  articlesRead: 2,
  questStages: { iman: 3, pillars: 2 },
  txns: [
    { id: "t1", label: "Daily Quest — Aqeedah", category: "ilm", amount: 80, at: "Today · 08:14" },
    { id: "t2", label: "Streak maintained (day 12)", category: "ajr", amount: 10, at: "Today · 08:14" },
    { id: "t3", label: "Hifz session — Al-Ikhlas", category: "noor", amount: 30, at: "Yesterday" },
    { id: "t4", label: "Duel win vs Amina", category: "hikmah", amount: 60, at: "Yesterday" },
    { id: "t5", label: "Badge: Seal of Knowledge", category: "ajr", amount: 200, at: "2 days ago" },
  ],
};

interface Ctx {
  s: AppState;
  set: (patch: Partial<AppState>) => void;
  award: (xp: number, category: PointCategory, label: string) => void;
  spend: (cost: number, label: string) => boolean;
  unlock: (badgeId: string) => boolean;
  toggleBookmark: (slug: string) => void;
  markArticleRead: (slug: string) => void;
  completeStage: (questId: string, stage: number) => void;
  pushNotif: (n: Omit<Notif, "id" | "unread" | "time">) => void;
  readAllNotifs: () => void;
  totalPoints: number;
  level: ReturnType<typeof levelFor>;
  reset: () => void;
  finishOnboarding: () => void;
}

const AppCtx = createContext<Ctx | null>(null);
const KEY = "ilmstation.v1";

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<AppState>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...initial, ...(JSON.parse(raw) as AppState), hydrated: true });
      else setS((p) => ({ ...p, hydrated: true }));
    } catch {
      setS((p) => ({ ...p, hydrated: true }));
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!s.hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...s, hydrated: undefined }));
    } catch {
      /* storage full or unavailable — state still lives in memory */
    }
  }, [s]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", s.dark);
    document.documentElement.style.fontSize = s.largeText ? "18px" : "";
  }, [s.dark, s.largeText]);

  const set = useCallback((patch: Partial<AppState>) => setS((p) => ({ ...p, ...patch })), []);

  const award = useCallback((xp: number, category: PointCategory, label: string) => {
    setS((p) => ({
      ...p,
      xp: p.xp + xp,
      points: { ...p.points, [category]: p.points[category] + xp },
      txns: [
        { id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`, label, category, amount: xp, at: "Just now" },
        ...p.txns,
      ].slice(0, 40),
    }));
  }, []);

  const spend = useCallback((cost: number, label: string) => {
    let ok = false;
    setS((p) => {
      const total = p.points.ajr + p.points.ilm + p.points.noor + p.points.hikmah;
      if (total < cost) return p;
      ok = true;
      // Deduct proportionally across categories, largest first.
      let left = cost;
      const next = { ...p.points };
      const order: PointCategory[] = (["ilm", "ajr", "noor", "hikmah"] as PointCategory[]).sort(
        (a, b) => next[b] - next[a],
      );
      for (const k of order) {
        const take = Math.min(next[k], left);
        next[k] -= take;
        left -= take;
      }
      return {
        ...p,
        points: next,
        txns: [
          {
            id: `t${Date.now()}`,
            label,
            category: "spend" as const,
            amount: -cost,
            at: "Just now",
          },
          ...p.txns,
        ].slice(0, 40),
      };
    });
    return ok;
  }, []);

  const unlock = useCallback((badgeId: string) => {
    let granted = false;
    setS((p) => {
      if (p.badges.includes(badgeId)) return p;
      const badge = BADGES.find((b) => b.id === badgeId);
      if (!badge) return p;
      granted = true;
      return {
        ...p,
        badges: [...p.badges, badgeId],
        xp: p.xp + badge.xp,
        points: { ...p.points, ajr: p.points.ajr + badge.xp },
        txns: [
          {
            id: `t${Date.now()}`,
            label: `Badge: ${badge.name}`,
            category: "ajr" as const,
            amount: badge.xp,
            at: "Just now",
          },
          ...p.txns,
        ].slice(0, 40),
        notifs: [
          {
            id: `n${Date.now()}`,
            icon: badge.icon,
            title: `Badge unlocked: ${badge.name}`,
            body: `${badge.description} · +${badge.xp} XP`,
            time: "now",
            unread: true,
            action: "achievements",
          },
          ...p.notifs,
        ],
      };
    });
    return granted;
  }, []);

  const toggleBookmark = useCallback((slug: string) => {
    setS((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(slug)
        ? p.bookmarks.filter((b) => b !== slug)
        : [...p.bookmarks, slug],
    }));
  }, []);

  const markArticleRead = useCallback((slug: string) => {
    setS((p) =>
      p.readArticles.includes(slug)
        ? p
        : {
            ...p,
            readArticles: [...p.readArticles, slug],
            articlesRead: p.articlesRead + 1,
            xp: p.xp + 30,
            points: { ...p.points, ilm: p.points.ilm + 30 },
            txns: [
              {
                id: `t${Date.now()}`,
                label: "Library article completed",
                category: "ilm" as const,
                amount: 30,
                at: "Just now",
              },
              ...p.txns,
            ].slice(0, 40),
          },
    );
  }, []);

  const completeStage = useCallback((questId: string, stage: number) => {
    setS((p) => ({
      ...p,
      questStages: { ...p.questStages, [questId]: Math.max(p.questStages[questId] ?? 0, stage) },
    }));
  }, []);

  const pushNotif = useCallback((n: Omit<Notif, "id" | "unread" | "time">) => {
    setS((p) => ({
      ...p,
      notifs: [{ ...n, id: `n${Date.now()}`, unread: true, time: "now" }, ...p.notifs],
    }));
  }, []);

  const readAllNotifs = useCallback(() => {
    setS((p) => ({ ...p, notifs: p.notifs.map((n) => ({ ...n, unread: false })) }));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setS({ ...initial, hydrated: true });
  }, []);

  const finishOnboarding = useCallback(() => {
    setS((p) => ({
      ...p,
      ...demoSeed,
      xp: (demoSeed.xp ?? 0) + 50,
      onboarded: true,
      username: p.username || `@${(p.name || "seeker").split(" ")[0].toLowerCase()}`,
      txns: [
        {
          id: "t-welcome",
          label: "Welcome bonus",
          category: "ajr" as const,
          amount: 50,
          at: "Just now",
        },
        ...(demoSeed.txns ?? []),
      ],
    }));
  }, []);

  const totalPoints = s.points.ajr + s.points.ilm + s.points.noor + s.points.hikmah;

  const value = useMemo<Ctx>(
    () => ({
      s,
      set,
      award,
      spend,
      unlock,
      toggleBookmark,
      markArticleRead,
      completeStage,
      pushNotif,
      readAllNotifs,
      totalPoints,
      level: levelFor(s.xp),
      reset,
      finishOnboarding,
    }),
    [
      s,
      set,
      award,
      spend,
      unlock,
      toggleBookmark,
      markArticleRead,
      completeStage,
      pushNotif,
      readAllNotifs,
      totalPoints,
      reset,
      finishOnboarding,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/** Session-scoped scratch state for multi-screen flows (quiz setup, duels, rooms). */
type Flow = Record<string, unknown>;
const FlowCtx = createContext<{
  flow: Flow;
  setFlow: (patch: Flow) => void;
} | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [flow, setFlowState] = useState<Flow>({});
  const setFlow = useCallback((patch: Flow) => setFlowState((p) => ({ ...p, ...patch })), []);
  const value = useMemo(() => ({ flow, setFlow }), [flow, setFlow]);
  return <FlowCtx.Provider value={value}>{children}</FlowCtx.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowCtx);
  if (!ctx) throw new Error("useFlow must be used inside FlowProvider");
  return ctx;
}
