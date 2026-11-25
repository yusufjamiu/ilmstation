import { NotifBell } from "@/components/notif-center";
import { Lamp as BLamp, KeyRound as BKey, Sprout as BSprout, Star as BStar, Sun as BSun, Eye as BEye, BookOpen as BBook, Crown as BCrown } from "lucide-react";
import { createPortal as yPortal } from "react-dom";
import { QuizFeedback, QuizNext, QuizOption, QuizProgress, QuizQuestion } from "@/components/quiz-ui";
import { Moon as HMoon } from "lucide-react";
import { useRamadanCountdown } from "@/components/ramadan";
import { BookOpen as HBook, Target as HTarget, Users as HUsers, Bot as HBot, ChevronRight as HChev } from "lucide-react";
import { useRef } from "react";
import { doc as docLB, setDoc as setDocLB } from "firebase/firestore";
import { FamilyHalaqah as FamilyHalaqahLive } from "@/components/halaqah";
import { QuestMap as QuestMapReal } from "@/components/study";
import { TrendingUp as YTrend, Target as YTarget, Award as YAward, Wallet as YWallet, Users as YUsers, Baby as YFamily, Crown as YCrown, Share2 as YShare, BookOpen as YBook, Settings as YCog, HelpCircle as YHelp, FileText as YDoc, LogOut as YLogOut, ChevronRight as YChevron, Star as YStar, Zap as YZap, Flame as YFlame } from "lucide-react";
import { doc as yDoc, getDoc as yGet } from "firebase/firestore";
import { auth as yAuth, db as yDb } from "@/lib/firebase";
import { useLanguage as useAppLang, useLiveLanguages as useLiveAppLangs, type Lang as AppLang } from "@/components/language";
import { NotifyCard, NotifyPrompt } from "@/components/notify";
import { InboxBadge, InboxDialog, useInbox } from "@/components/inbox";
import { LanguageSelect } from "@/components/language";
import { InstallBanner, InstallCard } from "@/components/install-app";
import { DeleteMyAccount, MyCustomPlans, QuoteButton } from "@/components/premium";
import { consumeFeature } from "@/components/premium";
import { isQuote, lagosDate } from "@/lib/premium-config";
import { KidGames, KidHome, TimeUp, usePlaytime, useShowQuickQuiz } from "@/components/kids";
import { AdhanWatcher } from "@/components/today";
import { KahfReminder } from "@/components/today";
import { KIND_LABEL, useTodaysWisdom } from "@/components/today";
import { LevelLadder, levelFor, useLevels } from "@/components/today";
import { ContinueCard, DailyWisdom, LevelCard, PrayerCard, dayKey, todayLabel, todaysWisdom, useStreak, type StreakInfo } from "@/components/today";
import { Mail as CardsIcon } from "lucide-react";
import { CardsScreen } from "@/components/eid-card";
import { RamadanBanner, RamadanScreen } from "@/components/ramadan";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/components/auth";
import {
  Baby, Bell, BookOpen, Bot, ChevronRight, CircleUserRound, Crown, Flame, Gift, Globe2, Home,
  Library, LockKeyhole, Menu, MessageCircleQuestion, MoonStar, Play, Search, Settings,
  Share2, ShieldCheck, ShoppingBag, Sparkles, Swords, Trophy, Users, UserPlus, Check, Volume2, Wallet, X,
} from "lucide-react";
import { GraduationCap } from "lucide-react";
import { LockedTag, PremiumTag, Tier, UnlockDialog, usePremium, plans, priceLabel, priceFor, useFx } from "@/components/premium";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChallengeScreen, PresenceBeat, useLeaderboard } from "@/components/challenge";
import { MessagesSquare } from "lucide-react";
import { ChatroomsScreen } from "@/components/chatrooms";
import { FriendsPanel, useFriendIds } from "@/components/friends";
import { StudyScreen } from "@/components/study";
import { QuranScreen } from "@/components/quran";
import { FamilyScreen } from "@/components/family";
import { LibraryScreen } from "@/components/library";
import { ThemeToggle, useTheme } from "@/components/theme";
import { adultBadges, earnedBadges, isEarned, nextBadge, progressToNext, remainingFor, stageOf } from "@/components/kids-progress";
import { ShareActions, type ShareCard } from "@/components/share-actions";
import { QuizVisual, quizQuestionsFor } from "@/components/quiz-visual";

type BadgeT = (typeof adultBadges)[number];
const BADGE_AR: Record<string, string> = { hidayah: "مَنارَةُ الهِدايَة", understanding: "مِفْتاحُ الفَهْم", garden: "رَوْضَةُ العِلْم", ihsan: "نَجْمَةُ الإحْسان", yaqeen: "نُورُ اليَقِين", basirah: "عَيْنُ البَصِيرَة", seal: "خاتَمُ العِلْم", taqwa: "تاجُ التَّقْوَى" };
const BADGE_ICON: Record<string, typeof Trophy> = { hidayah: BLamp, understanding: BKey, garden: BSprout, ihsan: BStar, yaqeen: BSun, basirah: BEye, seal: BBook, taqwa: BCrown };
/* real record: badge points = lifetime XP; quests-first-try and kind acts are not tracked yet, so they don't block badges */
function useMyRecord() {
  const [r, setR] = useState({ stars: 0, streak: 0, mastery: 1e9, kindness: 1e9 });
  useEffect(() => {
    const u = yAuth.currentUser; if (!u) return;
    void Promise.all([yGet(yDoc(yDb, "players", u.uid)), yGet(yDoc(yDb, "profiles", u.uid))]).then(([a, b]) => {
      const pa = (a.data() ?? {}) as Record<string, unknown>, pb = (b.data() ?? {}) as Record<string, unknown>;
      const num = (v: unknown) => (typeof v === "number" ? v : 0);
      setR({ stars: num(pa.xp) || num(pb.xp), streak: num(pa.streak) || num(pb.streak), mastery: 1e9, kindness: 1e9 });
    }).catch(() => {});
  }, []);
  return r;
}
const reqText = (b: BadgeT) => `${b.points.toLocaleString()} XP${b.streak ? ` and a ${b.streak}-day streak` : ""}`;
function Medal({ b, got, size }: { b: BadgeT; got: boolean; size: number }) {
  const I = BADGE_ICON[b.id] ?? Trophy;
  return <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size,
    background: got ? "radial-gradient(circle at 35% 30%,#fff3b0,#f5c542 45%,#b8861a 100%)" : "radial-gradient(circle at 35% 30%,#f2f2f2,#bdbdbd 60%,#8a8a8a)",
    boxShadow: `0 0 0 ${Math.max(2, size / 30)}px #1c1a17, 0 0 0 ${Math.max(4, size / 15)}px ${got ? "#c8961e" : "#8a8a8a"}` }}>
    <span className="grid place-items-center rounded-full" style={{ width: size * 0.7, height: size * 0.7, background: got ? "#f8d86a" : "#d4d4d4", boxShadow: "inset 0 2px 6px rgba(0,0,0,.25)" }}>
      <I style={{ width: size * 0.34, height: size * 0.34, color: "#1c1a17" }} strokeWidth={1.8} /></span></span>;
}
async function shareBadge(b: BadgeT) {
  const data = { title: "IlmStation", text: `I earned the "${b.name}" badge (${BADGE_AR[b.id] ?? ""}) on IlmStation!`, url: "https://www.ilmstation.com" };
  try { if (navigator.share) { await navigator.share(data); return; } await navigator.clipboard.writeText(`${data.text} ${data.url}`); toast.success("Copied, paste it anywhere"); } catch { /* cancelled */ }
}

function AchievementsTab() {
  const p = useMyRecord();
  const [open, setOpen] = useState<BadgeT | null>(null);
  const earned = adultBadges.filter((b) => isEarned(b, p));
  const up = adultBadges.find((b) => !isEarned(b, p));
  const stage = earned.at(-1)?.stage ?? "Seeking";
  const prev = up ? (adultBadges[adultBadges.indexOf(up) - 1]?.points ?? 0) : 0;
  const parts = up ? [Math.min(1, Math.max(0, (p.stars - prev) / Math.max(1, up.points - prev)))].concat(up.streak ? [Math.min(1, p.streak / up.streak)] : []) : [1];
  const pct = Math.round((parts.reduce((a, x) => a + x, 0) / parts.length) * 100);
  const needs = up ? [p.stars < up.points ? `${(up.points - p.stars).toLocaleString()} more XP` : "", up.streak && p.streak < up.streak ? `${up.streak - p.streak} more days in a row` : ""].filter(Boolean) : [];
  const got = open ? isEarned(open, p) : false;
  return <div className="grid gap-5">
    <Panel title={`${stage} stage`} tag={`${earned.length} of ${adultBadges.length} badges`}>
      {up ? <>
        <p className="flex items-center justify-between text-sm font-semibold"><span>Next: {up.name}</span><span>{pct}%</span></p>
        <div className="mt-2 h-5 overflow-hidden border-2 border-foreground p-0.5 max-sm:rounded-full"><div className="h-full bg-primary max-sm:rounded-full" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-sm text-muted-foreground">Still needs: {needs.join(", ")}</p>
        <p className="mt-1 text-xs text-muted-foreground">You have {p.stars.toLocaleString()} XP{p.streak ? ` · ${p.streak}-day streak` : ""}</p>
      </> : <p>Every badge earned, masha’Allah.</p>}
    </Panel>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{adultBadges.map((b) => {
      const g = isEarned(b, p);
      return <button key={b.id} onClick={() => setOpen(b)} className={cn("flex flex-col items-center border-2 border-foreground p-4 text-center shadow-brutal-sm", g ? "bg-primary/25" : "bg-muted")}>
        <Medal b={b} got={g} size={64} />
        <span dir="rtl" lang="ar" className="mt-4 font-arabic text-base leading-tight">{BADGE_AR[b.id]}</span>
        <b className="block font-serif text-lg font-normal leading-tight">{b.name}</b>
        <small className="text-muted-foreground">{g ? "Earned ✓" : `${b.points.toLocaleString()} XP`}</small>
      </button>;
    })}</div>
    {open && typeof document !== "undefined" && yPortal(<div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-5" onClick={() => setOpen(null)}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border-2 border-black bg-[#1c1a17] text-white shadow-[0_6px_0_#000]">
          <p className={cn("py-3 text-center text-lg font-black uppercase tracking-wide text-[#1c1a17]", got ? "bg-[#f5c542]" : "bg-[#bdbdbd]")}>{got ? "Badge unlocked!" : "Locked badge"}</p>
          <div className="relative flex flex-col items-center px-6 pb-7 pt-9">
            <span className={cn("absolute right-4 top-4 rounded-lg px-2 py-0.5 text-sm font-black text-[#1c1a17]", got ? "bg-[#f5c542]" : "bg-[#bdbdbd]")}>{open.points.toLocaleString()} XP</span>
            <Medal b={open} got={got} size={150} />
            <p dir="rtl" lang="ar" className="mt-7 font-arabic text-2xl">{BADGE_AR[open.id]}</p>
            <p className="mt-1 text-center font-mono text-lg font-bold uppercase tracking-widest">{open.name}</p>
            <p className="mt-2 text-center text-sm text-white/80">{open.meaning}</p>
            {!got && <p className="mt-3 text-center text-xs text-white/60">To unlock: {reqText(open)}</p>}
          </div>
        </div>
        {got && <button onClick={() => void shareBadge(open)} className="mt-6 w-full rounded-2xl border-2 border-black bg-[#f5c542] py-3.5 font-black uppercase text-[#1c1a17] shadow-[0_4px_0_#000]">Share this badge ▶</button>}
        <button onClick={() => setOpen(null)} className="mt-3 w-full rounded-2xl border-2 border-black bg-white py-3.5 font-black uppercase text-[#1c1a17] shadow-[0_4px_0_#000]">Close</button>
      </div>
    </div>, document.body)}
  </div>;
}
import { cn } from "@/lib/utils";
import { awardXp } from "@/lib/xp";

type Screen = "home" | "you" | "kidrank" | "study" | "play" | "quests" | "hifz" | "halaqah" | "chatrooms" | "challenge" | "library" | "wisdom" | "bot" | "community" | "progress" | "rewards" | "ramadan" | "family" | "settings" | "cards" | "kidgames" | "games";
type QuizStep = "choose" | "topics" | "difficulty" | "lobby" | "question" | "reveal" | "results" | "badge";

const topics = ["Aqeedah", "Hadith", "Seerah", "Fiqh", "Arabic", "Qur’an", "Tafsir", "Dua"];
const KID_SCREENS = ["kidrank", "home", "kidgames", "study", "library", "settings"];
const kidNav = [
  { label: "Learn & play", items: [["home", "Home", Home], ["kidrank", "Leaderboard", Trophy], ["kidgames", "Games", Play], ["study", "Study", GraduationCap], ["library", "Library", Library]] },
  { label: "You", items: [["settings", "Settings", Settings]] },
] as const;
const navGroups = [
  { label: "Today", items: [["home", "Today", Home], ["quests", "Quest map", Sparkles], ["ramadan", "Ramadan", MoonStar], ["cards", "Cards", CardsIcon]] },
  { label: "Practice", items: [["study", "Study", GraduationCap], ["play", "Play", Play], ["challenge", "Challenge", Swords], ["hifz", "Quran", BookOpen], ["halaqah", "Halaqah", Users], ["chatrooms", "Chatrooms", MessagesSquare], ["library", "Library", Library], ["bot", "IlmBot", Bot]] },
  { label: "You", items: [["quests", "Quests", Sparkles], ["progress", "Progress", Trophy], ["community", "Community", CircleUserRound], ["family", "Family hub", Baby], ["rewards", "Wallet & store", Wallet], ["settings", "Settings", Settings]] },
] as const;

function Frame({ title, eyebrow, actions, children }: { title: React.ReactNode; eyebrow: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return <div className="min-w-0 iq-rise"><header className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><p className="text-xs font-semibold uppercase text-muted-foreground">{eyebrow}</p><h1 className="break-words font-serif text-4xl leading-none sm:text-5xl">{title}</h1></div>{actions && <div className="flex min-w-0 flex-wrap gap-2">{actions}</div>}</header><div className="mt-6 min-w-0">{children}</div></div>;
}

function Panel({ title, tag, className, children }: { title?: string; tag?: string; className?: string; children: React.ReactNode }) {
  return <section className={cn("min-w-0 border-2 border-foreground bg-background shadow-brutal", className)}>{(title || tag) && <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b-2 border-foreground px-4 py-2"><h2 className="min-w-0 break-words font-serif text-xl leading-tight">{title}</h2>{tag && <span className="max-w-32 text-right text-xs font-semibold uppercase leading-tight text-muted-foreground sm:max-w-none">{tag}</span>}</div>}<div className="min-w-0 p-4">{children}</div></section>;
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return <label className="block text-sm font-semibold">{label}<input type={type} placeholder={placeholder} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" /></label>;
}

export type { ShareCard };
const progressCard: ShareCard = { eyebrow: "IlmStation · Monthly Progress", headline: "Your progress", sub: "Keep learning to grow your record" };
const qadrCard: ShareCard = { eyebrow: "IlmStation · Daily Wisdom", arabic: "إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ", headline: "Indeed, We sent it down during the Night of Decree.", sub: "Al-Qadr · 97:1", meta: "Qur’an" };
const patienceCard: ShareCard = { eyebrow: "IlmStation · Daily Wisdom", arabic: "وَمَن يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ", headline: "“Whoever strives to be patient, Allah will make him patient.”", sub: "Sahih al-Bukhari 1469 · Authenticated", meta: "Hadith" };

export function IlmStationApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [share, setShare] = useState<ShareCard | null>(null);
  const openShare = (card?: ShareCard) => setShare(card ?? progressCard);
  const [streak, setStreak] = useState(false);
  const streakInfo = useStreak();
  const { premium } = usePremium();
  const { account } = useAuth();
  const isKid = account ? account.zone === "kids" : (() => { try { return localStorage.getItem("ilm:kid") === "1"; } catch { return false; } })();
  useEffect(() => { if (!account) return; try { localStorage.setItem("ilm:kid", account.zone === "kids" ? "1" : "0"); } catch { /* ignore */ }
    const u = yAuth.currentUser; if (u) void setDocLB(docLB(yDb, "players", u.uid), { zone: account.zone ?? "adult" }, { merge: true }).catch(() => {}); }, [account?.zone]); // eslint-disable-line react-hooks/exhaustive-deps
  const inbox = useInbox();
  const profileScreen: Screen = isKid ? "settings" : "community";
  const selectScreen = (next: Screen) => { setScreen(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  // children only reach their own screens
  useEffect(() => { if (isKid && !KID_SCREENS.includes(screen)) setScreen("home"); }, [isKid, screen]);
  // links from the homepage open a screen directly: /app?s=hifz
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    const ok = ["home", "study", "play", "quests", "hifz", "halaqah", "chatrooms", "challenge", "library", "wisdom", "bot", "community", "progress", "rewards", "ramadan", "family", "settings", "cards", "games"];
    if (s && ok.includes(s)) { setScreen(s as Screen); window.history.replaceState(null, "", window.location.pathname); }
  }, []);

  return <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto flex max-w-[1440px] gap-5 px-3 py-3 sm:px-5 sm:py-5">
      <Sidebar kid={isKid} current={screen} onSelect={selectScreen} className="hidden lg:block" />
      {mobileNav && <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setMobileNav(false)}><Sidebar kid={isKid} current={screen} onSelect={selectScreen} className="h-full w-64 overflow-y-auto overscroll-contain bg-background pb-24" /></div>}
      <main data-soft className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header data-topbar className="sticky top-0 z-40 -mt-2 mb-2 sm:mb-6 flex items-center justify-between gap-3 bg-background py-2">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></Button>
          <div className="hidden sm:block"><p className="text-xs font-semibold uppercase text-muted-foreground">{todayLabel()}</p></div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setStreak(true)}><Flame /> {streakInfo && streakInfo.count > 0 ? `${streakInfo.count} day streak` : "Start your streak"}</Button>
            {!isKid && <Button variant={premium ? "secondary" : "outline"} className="hidden sm:inline-flex" onClick={() => selectScreen("rewards")}><Crown /> {premium ? "Premium" : "Go Premium"}</Button>}
            <LanguageSelect className="h-10 px-2.5" />
            <NotifBell inboxCount={inbox.length} onInbox={() => setNotifications(true)} go={(sc) => selectScreen(sc as Screen)} />
            <span className="contents max-sm:hidden"><ThemeToggle /></span>
            <Button variant="secondary" data-avatar className="relative max-sm:size-11 max-sm:p-0" aria-label={inbox.length ? `Profile, ${inbox.length} notifications` : "Profile"} onClick={() => selectScreen(profileScreen)}><span className="grid size-6 place-items-center bg-primary text-primary-foreground max-sm:size-8 max-sm:rounded-full max-sm:text-base max-sm:font-bold">{account?.name?.[0]?.toUpperCase() ?? "?"}</span><span className="hidden sm:inline">{account?.name?.split(/\s+/)[0] ?? "Account"}</span></Button>
          </div>
        </header>
        <PresenceBeat />
        <AdhanWatcher />
        <InstallBanner />
        <NotifyPrompt />
        {screen === "home" && (isKid ? <KidHome go={selectScreen} /> : <HomeScreen go={selectScreen} onShare={openShare} />)}
        {screen === "kidrank" && <KidLeaderboard />}
        {!isKid && <PremiumEnded go={selectScreen} />}
        {screen === "kidgames" && <KidGames />}
        {screen === "games" && <KidGames audience="all" />}
        {screen === "play" && <PlayScreen go={selectScreen} onShare={openShare} />}
        {screen === "quests" && <QuestScreen onShare={openShare} />}
        {screen === "hifz" && <QuranScreen />}
        {screen === "halaqah" && <HalaqahScreen onShare={openShare} />}
        {screen === "chatrooms" && <ChatroomsScreen />}
        {screen === "challenge" && <ChallengeScreen />}
        {screen === "study" && <StudyScreen />}
        {screen === "library" && <LibraryScreen onShare={openShare} />}
        {screen === "wisdom" && <WisdomScreen onShare={openShare} />}
        {screen === "bot" && <BotScreen />}
        {screen === "community" && <CommunityScreen go={selectScreen} onShare={openShare} />}
        {screen === "you" && <YouScreen go={selectScreen} />}
        {screen === "progress" && <ProgressScreen onShare={openShare} />}
        {screen === "rewards" && <RewardsScreen />}
        {screen === "ramadan" && <RamadanScreen />}
        {screen === "cards" && <CardsScreen />}
        {screen === "family" && <FamilyScreen />}
        {screen === "settings" && <SettingsScreen onOnboarding={() => setOnboarding(true)} />}
        {screen === "settings" && <NotifyCard />}
        {screen === "settings" && <InstallCard />}
        {screen === "settings" && <DeleteMyAccount />}
      </main>
    </div>
    <MobileNav kid={isKid} current={screen} onSelect={selectScreen} />
    <InboxDialog open={notifications} onOpenChange={setNotifications} items={inbox}
      onOpen={(i) => { setNotifications(false); if (i.kind === "friend") { try { sessionStorage.setItem("iq_comm_tab", "Requests"); } catch { /* ignore */ } selectScreen("community"); } else selectScreen("challenge"); }}
      onProfile={() => { setNotifications(false); selectScreen(profileScreen); }} />
    <StreakDialog open={streak} onOpenChange={setStreak} streak={streakInfo} />
    <ShareDialog card={share} onOpenChange={(o) => { if (!o) setShare(null); }} />
  </div>;
}

function Sidebar({ current, onSelect, className, kid }: { current: Screen; onSelect: (s: Screen) => void; className?: string; kid?: boolean }) {
  return <aside className={cn("sticky top-4 max-h-[calc(100vh-2rem)] w-56 shrink-0 self-start overflow-y-auto border-2 border-foreground", className)}><Link to="/" className="flex w-full items-center gap-3 border-b-2 border-foreground px-4 py-4 text-left"><span className="grid size-9 place-items-center bg-foreground font-serif text-xl text-background">I</span><span><strong className="block font-serif text-xl font-normal">IlmStation</strong><small className="block uppercase text-muted-foreground">Seek · Learn · Grow</small></span></Link><nav className="p-2">{(kid ? kidNav : navGroups).map((group: { label: string; items: readonly (readonly [string, string, typeof Home])[] }) => <div key={group.label}><p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase text-muted-foreground">{group.label}</p>{group.items.map(([id, label, Icon]) => <button key={id} onClick={() => onSelect(id as Screen)} className={cn("mb-1 flex w-full items-center gap-2 border-2 border-transparent px-3 py-2 text-sm font-medium", current === id && "border-foreground bg-primary shadow-brutal-sm")}><Icon className="size-4" />{label}</button>)}</div>)}</nav><LevelCard /></aside>;
}

function MobileNav({ current, onSelect, kid }: { current: Screen; onSelect: (s: Screen) => void; kid?: boolean }) {
  const items: [Screen, string, typeof Home][] = kid ? [["home", "Home", Home], ["kidgames", "Games", Play], ["study", "Study", GraduationCap], ["library", "Library", Library], ["you", "Me", CircleUserRound]] : [["home", "Today", Home], ["hifz", "Qur’an", BookOpen], ["study", "Study", GraduationCap], ["play", "Play", Play], ["you", "You", CircleUserRound]];
  return <nav className="fixed inset-x-3 z-30 flex items-stretch justify-between gap-0.5 rounded-[26px] border border-foreground/20 bg-background/95 px-1.5 py-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.18)] backdrop-blur lg:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom) + 10px)" }}>{items.map(([id, label, Icon]) => { const on = current === id; return <button key={id} onClick={() => onSelect(id)} aria-current={on ? "page" : undefined} aria-label={label} className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-0.5 text-[11px] leading-none transition-colors", on ? "font-bold text-foreground" : "text-muted-foreground")}><span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", on && "bg-primary")}><Icon className="size-5 shrink-0" /></span><span className="max-w-full truncate px-0.5">{label}</span></button>; })}</nav>;
}

function HomeScreen({ go, onShare }: { go: (s: Screen) => void; onShare: (card?: ShareCard) => void }) {
  const { firstName } = useAuth();
  const wisdom = useTodaysWisdom();
  const pts = (usePremium() as unknown as { points?: number }).points ?? 0;
  const initial = (firstName || "?").trim().charAt(0).toUpperCase();
  const tile = (Icon: typeof HBook, title: string, sub: string, to: Screen) => <button key={title} onClick={() => go(to)} className="flex min-w-0 flex-col items-start rounded-2xl border-[1.5px] border-foreground bg-background p-4 text-left shadow-[0_4px_0_var(--foreground)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--foreground)]">
    <Icon className="size-7" /><b className="mt-3 block leading-tight">{title}</b><span className="text-xs text-muted-foreground">{sub}</span></button>;
  return <div className="min-w-0 iq-rise">
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0"><h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl"><span>Assalamu-alaikum,</span> <span className="text-secondary">{firstName || "friend"}</span>!</h1><p className="text-sm text-muted-foreground">Your daily quest is waiting.</p></div>
    </header>
    <div className="mt-4 grid gap-4"><RamadanMini onOpen={() => go("ramadan")} /><KahfReminder /></div>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <HCard tone="dark" title="Pick up where you left off" className="md:col-span-2"><ContinueCard onLibrary={() => go("library")} onPlay={() => go("play")} /></HCard>
      <LevelCard onOpen={() => go("progress")} />
      <button onClick={() => go("rewards")} className="rounded-2xl border-[1.5px] border-foreground bg-primary p-4 text-left shadow-[0_4px_0_var(--foreground)] active:translate-y-1">
        <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-70"><span>Points balance</span><span className="flex items-center gap-1 normal-case tracking-normal opacity-100">View wallet <HChev className="size-4" /></span></span>
        <b className="mt-1 block text-4xl font-extrabold tabular-nums">{pts.toLocaleString()}</b>
      </button>
      <button onClick={() => go("play")} className="flex items-center gap-3 rounded-2xl border-[1.5px] border-foreground bg-primary p-4 text-left shadow-[0_4px_0_var(--foreground)] active:translate-y-1">
        <HTarget className="size-8 shrink-0" /><span><b className="block text-lg leading-tight">Quick quiz</b><span className="text-sm opacity-80">Test your knowledge</span></span>
      </button>
      <div className="grid grid-cols-2 gap-3 md:col-span-2 lg:grid-cols-4">
        {tile(HBook, "Hifz Drills", "Recite and review", "hifz")}
        {tile(HTarget, "Tafsir Quiz", "10 mixed questions", "play")}
        {tile(HUsers, "Halaqah", "Learn with family", "halaqah")}
        {tile(HBot, "IlmBot", "Ask and explore", "bot")}
      </div>
      <HCard title="Prayer times" tag="Today"><PrayerCard /></HCard>
      <HCard title="Leaderboard" tag="Weekly"><YouRank /><p className="mt-2 text-xs text-muted-foreground">Invite friends to see the leaderboard.</p><Button variant="ghost" className="mt-2 w-full" onClick={() => go("progress")}>View all</Button></HCard>
      <HCard tone="dark" title="Daily Wisdom" tag={KIND_LABEL[wisdom.kind] ?? wisdom.kind} className="md:col-span-2"><DailyWisdom onShare={onShare} w={wisdom} /></HCard>
    </div>
  </div>;
}
/** Rounded card for Today: light (default), or dark with a yellow title. */
function HCard({ title, tag, tone = "light", className, children }: { title?: string; tag?: string; tone?: "light" | "dark"; className?: string; children: React.ReactNode }) {
  const dark = tone === "dark";
  return <section className={cn("min-w-0 rounded-2xl border-[1.5px] p-4", dark ? "hcard-dark dark border-black bg-background text-foreground shadow-[0_4px_0_rgba(0,0,0,0.85)]" : "border-foreground bg-background shadow-[0_4px_0_var(--foreground)]", className)}>
    {(title || tag) && <div className="mb-3 flex items-center justify-between gap-3"><p className={cn("text-xs font-bold uppercase tracking-wider", dark ? "text-primary" : "text-muted-foreground")}>{title}</p>{tag && <span className="text-xs font-semibold uppercase text-muted-foreground">{tag}</span>}</div>}
    {children}
  </section>;
}

function ProgressLine({ name, value }: { name: string; value: number }) { return <div className="mt-3"><div className="flex justify-between text-sm"><span>{name}</span><span className="font-serif">{value}%</span></div><div className="mt-1 h-2 border border-foreground"><div className="h-full bg-primary" style={{ width: `${value}%` }} /></div></div>; }
function YouRank() { const appT = useAppLang().t; const { rows } = useLeaderboard(); const levels = useLevels(); return <>{rows.slice(0, 3).map((r, i) => <Rank key={r.id} n={String(i + 1)} name={`${r.name} · ${appT(levelFor(r.xp, levels).name)}`} xp={`${r.xp} XP`} active={r.me} />)}</>; }
function Rank({ n, name, xp, active }: { n: string; name: string; xp: string; active?: boolean }) {
  const [user, level] = name.split(" · ");
  return <div className={cn("mb-3 flex items-center gap-3 px-4 py-3", active && "border-2 border-foreground bg-primary shadow-brutal-sm")}>
    <span className="w-6 shrink-0 text-center font-serif text-xl">{n}</span>
    <span className="min-w-0 flex-1 text-start"><span className="block truncate font-semibold" style={{ unicodeBidi: "isolate" }}>{user}</span>{level ? <span className="block text-xs text-muted-foreground" style={{ unicodeBidi: "isolate" }}>{level}</span> : null}</span>
    <span className="shrink-0 font-serif text-lg" style={{ unicodeBidi: "isolate" }}>{xp}</span>
  </div>;
}
function PlayScreen({ go, onShare }: { go: (s: Screen) => void; onShare: (card?: ShareCard) => void }) {
  const [step, setStep] = useState<QuizStep>("choose"); const [topic, setTopic] = useState("Aqeedah"); const [difficulty, setDifficulty] = useState("Intermediate"); const [answer, setAnswer] = useState<string>(); const [question, setQuestion] = useState(1);
  const [correct, setCorrect] = useState(0);
  const questions = quizQuestionsFor(topic);
  const active = questions[question - 1];
  const isCorrect = active?.options[active.answer] === answer;
  const [locked, setLocked] = useState<{id:string;title:string;cost:number}>();
  const { canAccess, config } = usePremium();
  const showQQ = useShowQuickQuiz();
  const reset = () => { setStep("topics"); setAnswer(undefined); setQuestion(1); setCorrect(0); };
  // XP when a quiz finishes (the server caps it per day)
  useEffect(() => { if (step === "results" && correct > 0) void awardXp("quiz", { correct, total: questions.length, difficulty, topic }); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  if (step === "choose") return <Frame eyebrow="Play & learn" title="Play">
    <div className="grid gap-5 md:grid-cols-2">
      {showQQ && <button onClick={() => setStep("topics")} className="border-2 border-foreground bg-primary p-6 text-left shadow-brutal transition hover:-translate-y-0.5">
        <small className="text-xs font-bold uppercase">Test yourself</small>
        <strong className="mt-2 block font-serif text-4xl font-normal">Quick Quiz</strong>
        <p className="mt-2 text-sm">Aqeedah, Hadith, Seerah, Fiqh, Arabic, Qur’an and more. Short quizzes, XP for every right answer, and challenges with friends.</p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold">Choose a topic <ChevronRight className="size-4" /></span>
      </button>}
      <a href="/world" className="group relative block overflow-hidden border-2 border-foreground bg-[#10201e] text-left text-[#fdf8ec] shadow-brutal transition hover:-translate-y-0.5">
        <img src="/ilmworld-preview.jpg" alt="A street in IlmWorld with a masjid" loading="lazy" className="aspect-[9/5] w-full object-cover transition group-hover:scale-[1.02]" />
        <span className="absolute left-3 top-3 bg-[#e6b84a] px-2 py-1 text-[11px] font-bold uppercase text-[#2a1c05]">New · 3D world</span>
        <div className="flex flex-wrap items-end justify-between gap-3 p-4">
          <span><strong className="block font-serif text-3xl font-normal leading-none">IlmWorld</strong><span className="mt-1 block text-sm opacity-85">Live a Muslim life in Lagos and Ilorin.</span></span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#e6b84a]">Enter IlmWorld <ChevronRight className="size-4" /></span>
        </div>
      </a>
      <button onClick={() => go("games")} className="border-2 border-foreground bg-secondary p-6 text-left text-secondary-foreground shadow-brutal transition hover:-translate-y-0.5 md:col-span-2">
        <small className="text-xs font-bold uppercase">New</small>
        <strong className="mt-2 block font-serif text-4xl font-normal">Games &amp; quizzes</strong>
        <p className="mt-2 text-sm opacity-90">Fresh quizzes and interactive games from the IlmStation team.</p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold">Play now <ChevronRight className="size-4" /></span>
      </button>
    </div>
  </Frame>;
  return <Frame eyebrow="Play & learn" title="Quick Quiz" actions={step !== "topics" ? <Button variant="outline" onClick={reset}>Exit quiz</Button> : <><Button variant="outline" onClick={() => setStep("choose")}>Back</Button><Button onClick={() => go("challenge")}><Swords /> Challenge a friend</Button></>}>
    {step === "topics" && <Panel title="Choose a topic" tag="8 paths"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{topics.map((t,i) => { const open = canAccess(`topic-${t}`, config.premiumTopics.includes(t) ? "premium" : "free"); return <button key={t} onClick={() => { if(!open) { setLocked({id:`topic-${t}`,title:`${t} topic`,cost:config.topicCost}); return; } setTopic(t); setStep("difficulty"); }} className={cn("border-2 border-foreground p-5 text-left shadow-brutal-sm hover:bg-primary", !open && "bg-muted")}><span className="font-serif text-2xl">{t}</span><p className="mt-2 text-xs text-muted-foreground">{!open ? <><LockKeyhole className="mr-1 inline size-3" /> Premium · </> : null}{quizQuestionsFor(t).length} questions</p></button>})}</div><UnlockDialog item={locked} onOpenChange={(o)=>{if(!o)setLocked(undefined)}}/></Panel>}
    {step === "difficulty" && <Panel title="Set the difficulty" tag={topic}><div className="grid gap-4 md:grid-cols-3">{[["Beginner","1× XP"],["Intermediate","1.5× XP"],["Advanced","2× XP"]].map(([a,b]) => <button key={a} onClick={() => setDifficulty(a ?? "Beginner")} className={cn("border-2 border-foreground p-6 text-left", difficulty === a ? "bg-primary shadow-brutal" : "bg-background")}><span className="font-serif text-3xl">{a}</span><p className="mt-2">{b}</p></button>)}</div><Button className="mt-6" onClick={() => setStep("lobby")}>Continue</Button></Panel>}
    {step === "lobby" && <Panel title="Ready when you are" tag={`${topic} · ${difficulty}`}><div className="grid gap-6 md:grid-cols-2"><div><h2 className="font-serif text-4xl">{topic} practice</h2><p className="mt-3 text-muted-foreground">Identify clues, think through the choices, and learn from every answer.</p></div><div className="grid grid-cols-2 border-2 border-foreground"><Stat label="Questions" value={String(questions.length)}/><Stat label="Format" value="Visual + text"/><Stat label="Reward" value="+15 per answer"/><Stat label="Difficulty" value={difficulty}/></div></div><Button className="mt-6" onClick={() => setStep("question")}><Play /> Start quiz</Button></Panel>}
    {step === "question" && active && <div className="grid gap-4"><div className="flex items-center justify-between text-sm"><span className="font-bold">Question {question} of {questions.length}</span><span className="text-muted-foreground">{topic}</span></div><QuizProgress value={(question - 1) / questions.length * 100} /><QuizQuestion topic={topic} text={active.q}>{question === 1 && <QuizVisual kind={active.visual} />}</QuizQuestion><div className="grid gap-3 md:grid-cols-2">{active.options.map((a, i) => <QuizOption key={a} letter={"ABCD"[i] ?? "•"} text={a} state={answer === a ? "picked" : "idle"} onClick={() => setAnswer(a)} />)}</div><QuizNext label="Check answer" disabled={!answer} onClick={() => { if (isCorrect) setCorrect(c => c + 1); setStep("reveal"); }} /><button type="button" className="text-center text-sm font-semibold text-muted-foreground underline underline-offset-4" onClick={() => { setAnswer(undefined); if (question < questions.length) setQuestion(q => q + 1); else setStep("results"); }}>Skip question</button></div>}
    {step === "reveal" && active && <div className="grid gap-4"><div className="flex items-center justify-between text-sm"><span className="font-bold">Question {question} of {questions.length}</span><span className="text-muted-foreground">{topic}</span></div><QuizProgress value={question / questions.length * 100} /><QuizQuestion topic={topic} text={active.q} /><div className="grid gap-3 md:grid-cols-2">{active.options.map((a, i) => <QuizOption key={a} letter={"ABCD"[i] ?? "•"} text={a} disabled state={i === active.answer ? "correct" : answer === a ? "wrong" : "idle"} />)}</div><QuizFeedback ok={isCorrect} text={active.why} source={isCorrect ? "+15 XP" : undefined} /><QuizNext label={question < questions.length ? "Next question" : "See results"} onClick={() => { if (question < questions.length) { setQuestion(q => q + 1); setAnswer(undefined); setStep("question"); } else setStep("results"); }} /></div>}
    {step === "results" && <Panel title="Practice complete" tag={correct === questions.length ? "Excellent work" : "Keep growing"}><div className="grid gap-4 sm:grid-cols-3"><Stat label="Score" value={`${correct} / ${questions.length}`}/><Stat label="XP earned" value={`+${correct * 15}`}/><Stat label="Accuracy" value={`${Math.round(correct / questions.length * 100)}%`}/></div><div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={reset}>Play another topic</Button><Button variant="outline" onClick={() => { setAnswer(undefined); setQuestion(1); setCorrect(0); setStep("question"); }}>Try again</Button><Button variant="outline" onClick={() => onShare({ eyebrow: "IlmStation · Quiz result", headline: `${correct} / ${questions.length}`, sub: `${topic} · ${difficulty} · +${correct * 15} XP`, meta: "Score" })}><Share2/> Share</Button></div></Panel>}
  </Frame>;
}

function Stat({ label, value }: { label:string; value:string }) { return <div className="border-b-2 border-r-2 border-foreground p-4 last:border-r-0"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-serif text-2xl">{value}</p></div>; }

function QuestScreen({ onShare }: { onShare: () => void }) { void onShare; return <Frame eyebrow="Curriculum journey" title="Quest Map"><QuestMapReal /></Frame>; }


function HalaqahScreen({ onShare }: { onShare: () => void }) { void onShare; return <Frame eyebrow="Family learning" title="Family Halaqah"><FamilyHalaqahLive /></Frame>; }
function WisdomScreen({onShare}:{onShare:(card?:ShareCard)=>void}){const[saved,setSaved]=useState(false);return <Frame eyebrow="A new entry every Fajr" title="Daily Wisdom"><Panel title="Today · Patience" tag="Hadith"><p className="font-arabic text-4xl leading-loose" dir="rtl">وَمَن يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ</p><p className="mt-4 font-serif text-3xl italic">“Whoever strives to be patient, Allah will make him patient.”</p><p className="mt-3 text-sm text-muted-foreground">Sahih al-Bukhari 1469 · Authenticated</p><div className="mt-6 flex gap-3"><Button onClick={()=>{setSaved(!saved);toast.success(saved?"Removed from bookmarks":"Wisdom saved")}}>{saved?"Saved ✓":"Bookmark"}</Button><Button variant="outline" onClick={() => onShare(patienceCard)}><Share2/> Share</Button></div></Panel><h2 className="mb-4 mt-8 font-serif text-3xl">Recent wisdom</h2><div className="grid gap-3 md:grid-cols-3">{["Gratitude","Sincerity","Good character"].map((x,i)=><button key={x} className="border-2 border-foreground p-5 text-left hover:bg-primary"><span className="text-xs uppercase text-muted-foreground">{i+1} day ago</span><h3 className="mt-2 font-serif text-2xl">{x}</h3><p className="mt-2 text-sm">A sourced reflection from Qur’an and Sunnah.</p></button>)}</div></Frame>}

function BotScreen(){const[messages,setMessages]=useState<{from:string;text:string}[]>([]);const[input,setInput]=useState("");const send=(text=input)=>{if(!text.trim())return;setMessages(m=>[...m,{from:"you",text},{from:"bot",text:"Sabr is steadfast patience rooted in trust in Allah. The Qur’an pairs patience with prayer as sources of help. For personal religious rulings, please consult a qualified scholar. · Source: Qur’an 2:153"}]);setInput("")};return <Frame eyebrow="8 of 10 sessions remaining" title="Ask IlmBot"><Panel title="Sourced Islamic learning assistant" tag="Not a fatwa service"><div className="min-h-80 space-y-3">{messages.length===0?<div><p className="font-serif text-3xl">What would you like to understand?</p><div className="mt-5 flex flex-wrap gap-2">{["Explain sabr simply","What is the meaning of Ihsan?","Tell me about Surah Al-Mulk"].map(q=><Button key={q} variant="outline" onClick={()=>send(q)}>{q}</Button>)}</div></div>:messages.map((m,i)=><div key={i} className={cn("max-w-2xl border-2 border-foreground p-4",m.from==="you"?"ml-auto bg-primary":"bg-muted")}><b className="text-xs uppercase">{m.from==="you"?"You":"IlmBot"}</b><p className="mt-1">{m.text}</p></div>)}</div><form className="mt-5 flex gap-2 border-t-2 border-foreground pt-4" onSubmit={e=>{e.preventDefault();send()}}><input aria-label="Ask IlmBot" value={input} onChange={e=>setInput(e.target.value)} className="h-11 flex-1 border-2 border-foreground bg-background px-3" placeholder="Ask a learning question…"/><Button type="submit">Send</Button></form></Panel></Frame>}

function CommunityScreen({go,onShare}:{go:(s:Screen)=>void;onShare:()=>void}){
  const[tab,setTab]=useState(()=>{try{const t=sessionStorage.getItem("iq_comm_tab");sessionStorage.removeItem("iq_comm_tab");return t||"Profile";}catch{return "Profile";}});
  const{account}=useAuth();
  const displayName=account?.name??"Your name";
  const username=account?.name?(account.username ?? account.name.toLowerCase().replace(/\s+/g,"")):"username";
  const initial=account?.name?.[0]?.toUpperCase()??"?";
  const level=account?.level??"Beginner";
  return <Frame eyebrow="Your circle" title="Community" actions={<Button onClick={()=>go("challenge")}><Trophy/> New challenge</Button>}><div className="mb-5 flex flex-wrap gap-2 max-sm:-mx-4 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-2">{["Profile","Friends","Requests","Find friends"].map(t=><Button key={t} className="shrink-0" variant={tab===t?"default":"outline"} onClick={()=>setTab(t)}>{t}</Button>)}</div>{tab==="Profile"?<CommunityProfile name={displayName} username={username} initial={initial} onShare={onShare}/>:<FriendsPanel tab={tab} />}</Frame>}

function LeaderboardTab(){const[scope,setScope]=useState<"friends"|"global">("global");const{rows}=useLeaderboard();const friendIds=useFriendIds();const board=rows.filter(r=>scope==="global"||r.me||friendIds.includes(r.id));const you=board.findIndex(r=>r.me)+1;const levels=useLevels();return <Panel title="Leaderboard" tag={scope==="friends"?"Among friends":"All time"}>
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div className="flex gap-2"><Button size="sm" variant={scope==="friends"?"default":"outline"} onClick={()=>setScope("friends")}>Friends</Button><Button size="sm" variant={scope==="global"?"default":"outline"} onClick={()=>setScope("global")}>Global</Button></div>
    <span className="border-2 border-foreground bg-primary px-3 py-1 text-sm font-bold">Your position: #{you||"-"} of {board.length}</span>
  </div>
  <div className="space-y-2">{board.map((r,i)=><Rank key={r.id} n={`${i+1}`} name={`${r.me?`${r.name} (you)`:r.name} · ${levelFor(r.xp,levels).name}`} xp={`${r.xp} XP`} active={r.me}/>)}</div>
  {scope==="friends"&&board.length<2&&<p className="mt-3 text-xs text-muted-foreground">Add friends from Community to see them here.</p>}
</Panel>}
function ProgressScreen({onShare}:{onShare:()=>void}){const{account}=useAuth();const[tab,setTab]=useState(()=>{try{const t=sessionStorage.getItem("iq_growth_tab");sessionStorage.removeItem("iq_growth_tab");return t||"Progress";}catch{return "Progress";}});return <Frame eyebrow="Your learning record" title="Growth" actions={<Button variant="outline" onClick={onShare}><Share2/> Share month</Button>}><div className="mb-5 flex gap-2"><Button variant={tab==="Progress"?"default":"outline"} onClick={()=>setTab("Progress")}>Progress</Button><Button variant={tab==="Achievements"?"default":"outline"} onClick={()=>setTab("Achievements")}>Achievements</Button><Button variant={tab==="Leaderboard"?"default":"outline"} onClick={()=>setTab("Leaderboard")}>Leaderboard</Button></div>{tab==="Progress"&&<div className="grid gap-5 md:grid-cols-2"><LevelLadder/><Panel title="Topic performance" tag="Accuracy"><ProgressLine name="Aqeedah" value={0}/><ProgressLine name="Hadith" value={0}/><ProgressLine name="Seerah" value={0}/><ProgressLine name="Fiqh" value={0}/></Panel></div>}{tab==="Achievements"&&<AchievementsTab/>}{tab==="Leaderboard"&&<LeaderboardTab/>}</Frame>}

function RewardsScreen(){
  const[tab,setTab]=useState(()=>{try{const t=sessionStorage.getItem("iq_rewards_tab");sessionStorage.removeItem("iq_rewards_tab");return t||"Premium";}catch{return "Premium";}});
  const{points,premium,config,redeem}=usePremium();
  const[busy,setBusy]=useState<number|null>(null);
  const opts=config.redeem.map((o,i)=>({...o,i})).filter(o=>o.on);
  return <Frame eyebrow="Earn, redeem, give" title="Rewards" actions={premium?<PremiumTag/>:undefined}>
    <div className="mb-5 flex flex-wrap gap-2"><Button variant={tab==="Premium"?"default":"outline"} onClick={()=>setTab("Premium")}><Crown/> Premium</Button><Button variant={tab==="Wallet"?"default":"outline"} onClick={()=>setTab("Wallet")}>Wallet</Button><Button variant={tab==="Redeem"?"default":"outline"} onClick={()=>setTab("Redeem")}><Gift/> Use points</Button></div>
    {tab==="Wallet"&&<div className="grid gap-5 md:grid-cols-[1fr_2fr]">
      <section className="rounded-2xl border-[1.5px] border-foreground bg-primary p-5 text-[#1c1a17] shadow-[0_4px_0_var(--foreground)]"><p className="text-xs font-bold uppercase tracking-wide">Points balance</p><p className="mt-1 font-serif text-6xl leading-none">{points.toLocaleString()}</p><p className="mt-1 text-sm opacity-80">points available{opts[0] ? ` · ${opts[0].points} points = ${opts[0].days} days of Premium` : ""}</p><button onClick={()=>setTab("Redeem")} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1c1a17] px-5 py-2.5 text-sm font-bold text-white"><Gift className="size-4"/> Use points</button></section>
      <Panel title="How to earn" tag="From new levels"><p className="text-sm text-muted-foreground">You get points each time you reach a new level (see the levels in Progress). Earn XP from the activities below to level up. Spending points never lowers your level.</p><ul className="mt-3 divide-y-2 divide-foreground">{["Quizzes","Opening the app daily (streak bonuses at 7 and 30 days)","Daily Wisdom","Finishing books and audiobooks","Hifz","Ramadan quest","Surah Al-Kahf on Friday","Duels"].map(x=><li key={x} className="py-2 text-sm">{x}</li>)}</ul></Panel>
    </div>}
    {tab==="Redeem"&&<p className="mb-4 max-w-2xl text-sm text-muted-foreground">You have <b>{points.toLocaleString()} points</b>. Swap them for Premium days: when you have enough, tap <b>Get it</b>. The points are taken and Premium starts straight away, or is added to the Premium you already have.</p>}
    {tab==="Redeem"&&(opts.length?<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{opts.map(o=><Panel key={o.i} title={`${o.days} days of Premium`} tag={`${o.points.toLocaleString()} pts`}><div className="grid size-12 place-items-center border-2 border-foreground bg-primary"><Crown/></div><p className="mt-3 text-sm text-muted-foreground">Every Premium book, card, lesson and topic for {o.days} days. Adds to any Premium you already have.</p><Button className="mt-4" disabled={points<o.points||busy!==null} onClick={()=>{setBusy(o.i);void redeem(o.i).then(ok=>{setBusy(null);if(ok)toast.success(`Premium extended by ${o.days} days`);});}}>{busy===o.i?"Redeeming…":points<o.points?`Need ${(o.points-points).toLocaleString()} more`:"Get it"}</Button></Panel>)}</div>:<p className="text-sm text-muted-foreground">No redeem options right now.</p>)}
    {tab==="Premium"&&<PlansPanel/>}
  </Frame>;
}


function SettingsScreen({onOnboarding}:{onOnboarding:()=>void}){const{theme,setTheme}=useTheme();const{loggedIn,logOut}=useAuth();const navigate=useNavigate();const dark=theme==="dark";const appLang=useAppLang();const appLangs=useLiveAppLangs();const[toggles,setToggles]=useState([true,true,false]);return <Frame eyebrow="Preferences & account" title="Settings"><div className="grid gap-5 md:grid-cols-2"><Panel title="Experience" tag="Saved automatically"><label className="mt-4 block text-sm font-semibold">Language<select value={appLang.lang} onChange={e=>{appLang.set(e.target.value as AppLang);toast.success("Language saved")}} className="mt-1 block h-11 w-full border-2 border-foreground bg-background px-3">{appLangs.map(l=><option key={l.code} value={l.code}>{l.native}{l.code!=="en"?` · ${l.label}`:""}</option>)}</select></label></Panel><Panel title="Account" tag="">{loggedIn?<Button variant="outline" className="w-full border-[#d11a2a] text-[#d11a2a]" onClick={()=>{logOut();toast("Logged out");void navigate({ to: "/app" })}}>Log out</Button>:<Button asChild className="w-full"><Link to="/login">Log in</Link></Button>}<div className="mt-5 flex items-center justify-between border-t-2 border-foreground pt-4"><span>Dark mode</span><button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={()=>{setTheme(dark?"light":"dark");toast("Theme preference saved")}} className={cn("relative h-7 w-12 shrink-0 rounded-full border-[1.5px] border-foreground transition-colors",dark?"bg-primary":"bg-muted")}><span className={cn("absolute top-[3px] size-5 rounded-full bg-foreground transition-all",dark?"left-[22px]":"left-[3px]")}/></button></div></Panel></div></Frame>}

function NotificationDialog({open,onOpenChange}:{open:boolean;onOpenChange:(x:boolean)=>void}){return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none"><DialogHeader><DialogTitle className="font-serif text-3xl">Notifications</DialogTitle><DialogDescription>Your learning circle is active.</DialogDescription></DialogHeader>{["Amina challenged you to Seerah","You unlocked First Light","Your 12-day streak is safe"].map((x,i)=><button key={x} onClick={()=>toast.success("Notification marked as read")} className={cn("border-2 border-foreground p-3 text-left",i===0&&"bg-primary")}><b>{x}</b><small className="block text-muted-foreground">{i+1} hour ago</small></button>)}</DialogContent></Dialog>}
function StreakDialog({open,onOpenChange,streak}:{open:boolean;onOpenChange:(x:boolean)=>void;streak:StreakInfo|null}){
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
  const done=new Set(streak?.days??[]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none"><DialogHeader><DialogTitle className="font-serif text-3xl">{streak?.count?`${streak.count} day streak 🔥`:"Start your streak"}</DialogTitle><DialogDescription>Open IlmStation every day to keep your streak going. Your best: {streak?.best??0} days.</DialogDescription></DialogHeader><div className="grid grid-cols-7 gap-2">{days.map(d=>{const k=dayKey(d);const on=done.has(k);return <span key={k} className={cn("grid aspect-square place-items-center border-2 border-foreground text-xs",on?"bg-secondary text-secondary-foreground":"bg-background")}>{d.toLocaleDateString("en-GB",{weekday:"narrow"})}<small>{on?"✓":"·"}</small></span>;})}</div></DialogContent></Dialog>;
}
function ShareDialog({card,onOpenChange}:{card:ShareCard|null;onOpenChange:(x:boolean)=>void}){const[theme,setTheme]=useState(0);const c=card;const wisdom=!!c?.arabic;return <Dialog open={!!c} onOpenChange={onOpenChange}><DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none"><DialogHeader><DialogTitle className="font-serif text-3xl">{wisdom?"Share this wisdom":"Share your progress"}</DialogTitle><DialogDescription>Choose a card style, then copy it or post it straight to a platform.</DialogDescription></DialogHeader>{c&&<div className={cn("border-2 border-foreground p-8 text-center shadow-brutal",theme===0?"bg-primary":theme===1?"bg-secondary text-secondary-foreground":"bg-foreground text-background")}><p className="text-xs font-bold uppercase">{c.eyebrow}{c.meta?` · ${c.meta}`:""}</p>{c.arabic&&<p className="mt-4 font-arabic text-3xl leading-relaxed" dir="rtl">{c.arabic}</p>}<p className={cn("mt-3",wisdom?"font-serif text-2xl italic leading-snug":"font-serif text-5xl")}>{c.headline}</p><p className="mt-2 text-sm">{c.sub}</p></div>}<div className="flex gap-2">{[0,1,2].map(i=><button key={i} aria-label={`Theme ${i+1}`} onClick={()=>setTheme(i)} className={cn("size-9 border-2 border-foreground",i===0?"bg-primary":i===1?"bg-secondary":"bg-foreground")}/>)}</div>{c&&<ShareActions card={c} onDone={()=>onOpenChange(false)}/>}</DialogContent></Dialog>}

function PlansPanel(){
  const{premium,premiumUntil,trial,plan,config,activatePremium,country}=usePremium();
  const fx=useFx(country);
  const[period,setPeriod]=useState<"month"|"year">("month");
  const[code,setCode]=useState("");const[applied,setApplied]=useState("");
  const until=premiumUntil?new Date(premiumUntil).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):"";
  const daysLeft=Math.max(0,Math.ceil((premiumUntil-Date.now())/86400000));
  const shown=config.plans.filter(p=>p.visible);
  const anyYear=shown.some(p=>priceFor(p,"year",country,config).available);
  const today=lagosDate();
  const banner=config.promos.find(x=>x.on&&x.banner&&x.start<=today&&today<=x.end);
  const applyCode=()=>{const c=code.trim().toUpperCase();if(!c){setApplied("");toast("Code removed");return;}const ok=config.promos.find(x=>x.on&&x.code&&x.code.toUpperCase()===c&&x.start<=today&&today<=x.end);if(ok){setApplied(c);toast.success(`Code applied: ${ok.percent}% off`);}else{setApplied("");toast.error("That code isn’t valid right now");}};
  return <div className="grid gap-5">
    {premium?<div className="border-2 border-foreground bg-primary p-5 shadow-brutal"><p className="font-serif text-2xl">{trial?`Free trial · ${daysLeft} day${daysLeft===1?"":"s"} left`:"Premium is active"}</p><p className="text-sm">Until {until}{plan&&!trial?` · ${plan}`:""}</p></div>
      :<div className="border-2 border-foreground bg-muted p-5"><p className="font-serif text-2xl">You’re on the free plan</p><p className="text-sm text-muted-foreground">Choose a plan, or turn your points into Premium days in Use points.</p></div>}
    <MyCustomPlans/>
    {banner&&<div className="border-2 border-foreground bg-secondary p-4 text-secondary-foreground shadow-brutal-sm"><b>{banner.name}</b> · {banner.banner}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      {anyYear?<div className="inline-flex border-2 border-foreground">{(["month","year"] as const).map(x=><button key={x} onClick={()=>setPeriod(x)} className={cn("px-4 py-2 text-sm font-bold",period===x?"bg-primary":"bg-background")}>{x==="month"?"Monthly":"Yearly"}</button>)}</div>:<span/>}
      
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{shown.map(p=>{
      const pr=priceFor(p,period,country,config,applied);
      const m=priceFor(p,"month",country,config);
      const save=period==="year"&&m.available&&pr.available?Math.round((1-pr.base/(m.base*12))*100):0;
      const quote=isQuote(p);
      return <div key={p.id} className="flex min-w-0 flex-col border-2 border-foreground bg-background p-5 shadow-brutal-sm">
        <p className="font-serif text-3xl leading-tight">{p.name}</p>
        {quote?<p className="mt-1 font-bold">Custom pricing</p>:pr.available?<p className="mt-1"><b>{pr.text}</b> / {period}{pr.was&&<span className="ml-2 text-sm text-muted-foreground line-through">{pr.was}</span>}{fx&&<span className="block text-xs text-muted-foreground">≈ {fx.fmt(pr.final,pr.usd?"USD":"NGN")} · you pay in {pr.usd?"US dollars":"naira"}</span>}</p>:<p className="mt-1 text-sm text-muted-foreground">Not available {period==="year"?"yearly":"monthly"}</p>}
        {(pr.promo||save>0)&&<p className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold uppercase">{pr.promo&&<span className="border-2 border-foreground bg-secondary px-1.5 py-0.5 text-secondary-foreground">{pr.promo.name} · {pr.promo.percent}% off</span>}{save>0&&<span className="border-2 border-foreground bg-primary px-1.5 py-0.5">Save {save}%</span>}</p>}
        <p className="text-sm text-muted-foreground">{p.seats}</p>
        <ul className="mt-4 flex-1 space-y-2 text-sm">{p.points.map(x=><li key={x} className="flex gap-2"><ShieldCheck className="size-4 shrink-0"/>{x}</li>)}</ul>
        {quote?<QuoteButton/>
          :<Button className="mt-5 w-full" disabled={!pr.available} onClick={()=>activatePremium(p.id,period,applied)}>Choose plan</Button>}
      </div>;
    })}</div>
  </div>;
}

/** "You": everything about the user in one place. */
function YouScreen({ go }: { go: (s: Screen) => void }) {
  const { logOut } = useAuth(); const navigate = useNavigate();
  const pr = usePremium() as unknown as { premium: boolean; trial?: boolean; premiumUntil?: number | string | null; points?: number };
  const [me, setMe] = useState<{ name?: string; username?: string; zone?: string; xp?: number; level?: number; streak?: number }>({});
  useEffect(() => {
    const u = yAuth.currentUser; if (!u) return;
    void Promise.all([yGet(yDoc(yDb, "profiles", u.uid)), yGet(yDoc(yDb, "players", u.uid))]).then(([a, b]) => {
      const pa = (a.data() ?? {}) as Record<string, unknown>, pb = (b.data() ?? {}) as Record<string, unknown>;
      const num = (v: unknown) => (typeof v === "number" ? v : undefined);
      setMe({ name: (pa.name ?? pa.displayName ?? u.displayName ?? "") as string, username: pa.username as string, zone: pa.zone as string,
        xp: num(pb.xp) ?? num(pa.xp), level: num(pb.level) ?? num(pa.level), streak: num(pb.streak) ?? num(pa.streak) });
    }).catch(() => {});
  }, []);
  const kid = me.zone === "kids";
  const until = pr.premiumUntil ? new Date(pr.premiumUntil).toLocaleDateString() : "";
  const status = pr.premium ? `${pr.trial ? "Free trial" : "Premium"}${until ? ` · until ${until}` : ""}` : "Free plan";
  let yti = 0; const YTINTS = ["max-sm:bg-primary", "max-sm:bg-[#d7ecd9]", "max-sm:bg-[#f7d9c4]", "max-sm:bg-[#d9e3f7]"];
  const tile = (Icon: typeof YTrend, title: string, sub: string, on: () => void) => <button key={title} onClick={on} className="flex items-center gap-3 border-2 border-foreground bg-background p-4 text-left shadow-brutal-sm transition hover:bg-primary/15 max-sm:border-0 max-sm:border-b max-sm:border-foreground/10 max-sm:bg-transparent max-sm:py-3 max-sm:shadow-none max-sm:last:border-b-0">
    <span className={`grid size-11 shrink-0 place-items-center border-2 border-foreground bg-primary max-sm:rounded-xl max-sm:border-0 max-sm:text-[#1c1a17] ${YTINTS[yti++ % 4]}`}><Icon className="size-5" /></span>
    <span className="min-w-0"><b className="block">{title}</b><span className="text-xs text-muted-foreground">{sub}</span></span><span className="ml-auto pl-2 text-2xl leading-none text-muted-foreground sm:hidden">›</span></button>;
  const invite = async () => {
    const data = { title: "IlmStation", text: "Learn, play and grow with me on IlmStation", url: "https://www.ilmstation.com" };
    try { if (navigator.share) { await navigator.share(data); return; } await navigator.clipboard.writeText(data.url); toast.success("Link copied"); } catch { /* cancelled */ }
  };
  const initial = (me.name || me.username || "?").trim().charAt(0).toUpperCase();
  const row = "flex w-full items-center justify-between border-b-2 border-foreground py-3.5 text-left font-semibold max-sm:border-b max-sm:border-foreground/10 max-sm:last:border-b-0";
  const label = (Icon: typeof YTrend, text: string) => <span className="flex items-center gap-3"><Icon className="size-5" />{text}</span>;
  const chip = "flex items-center gap-1.5 border-2 border-foreground bg-background px-2 py-1 max-sm:rounded-full max-sm:border-[1.5px] max-sm:px-3";
  return <Frame eyebrow="Your account" title={kid ? "Me" : "You"}>
    <section className="border-2 border-foreground bg-primary p-5 text-[#1c1a17] shadow-brutal max-sm:rounded-2xl max-sm:border-[1.5px] max-sm:shadow-[0_4px_0_var(--foreground)]">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center border-2 border-foreground max-sm:rounded-full bg-foreground font-serif text-3xl text-background">{initial}</span>
        <div className="min-w-0">
          <p className="truncate font-serif text-3xl leading-tight">{me.name || "Your profile"}</p>
          {me.username && <p className="text-sm font-semibold">@{me.username}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
        {me.level !== undefined && <span className={chip}><YStar className="size-4" /><span>Level</span> {me.level}</span>}
        {me.xp !== undefined && <span className={chip}><YZap className="size-4" />{me.xp} XP</span>}
        {me.streak !== undefined && <span className={chip}><YFlame className="size-4" />{me.streak}</span>}
        {!kid && <span className={chip}><YCrown className="size-4" />{status}</span>}
      </div>
    </section>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 max-sm:gap-0 max-sm:overflow-hidden max-sm:rounded-2xl max-sm:border-[1.5px] max-sm:border-foreground max-sm:bg-card max-sm:shadow-[0_4px_0_var(--foreground)]">
      {kid ? <>
        {tile(YTrend, "My progress", "Stars, levels and streak", () => go("progress"))}
        {tile(YAward, "My badges", "Everything you’ve earned", () => { try { sessionStorage.setItem("iq_growth_tab", "Achievements"); } catch { /* */ } go("progress"); })}
        {tile(YBook, "My lessons", "Keep learning", () => go("study"))}
        {tile(YCog, "Settings", "Language and more", () => go("settings"))}
      </> : <>
        {tile(YTrend, "Progress", "Your learning record", () => go("progress"))}
        {tile(YTarget, "Quest Map", "Your learning journey", () => go("quests"))}
        {tile(YAward, "Badges", "Everything you’ve earned", () => { try { sessionStorage.setItem("iq_growth_tab", "Achievements"); } catch { /* */ } go("progress"); })}
        {tile(YCrown, "Premium & points", `${pr.premium ? (pr.trial ? "Free trial" : "Premium") : "Free plan"} · ${pr.points ?? 0} points`, () => go("rewards"))}
        {tile(YUsers, "Friends & challenges", "Your circle", () => go("community"))}
        {tile(YFamily, "Family hub", "Children’s accounts and family plan", () => go("family"))}
        {tile(YShare, "Invite friends", "Share IlmStation", () => void invite())}
      </>}
    </div>
    <div className="mt-6 border-t-2 border-foreground max-sm:mt-5 max-sm:px-4 max-sm:overflow-hidden max-sm:rounded-2xl max-sm:border-[1.5px] max-sm:border-foreground max-sm:bg-card max-sm:shadow-[0_4px_0_var(--foreground)]">
      {!kid && <button className={row} onClick={() => go("settings")}>{label(YCog, "Settings")}<YChevron className="size-4" /></button>}
      <a className={row} href="mailto:admin@ilmstation.com">{label(YHelp, "Help & contact")}<YChevron className="size-4" /></a>
      <a className={row} href="/privacy" target="_blank" rel="noreferrer">{label(YDoc, "Privacy Policy")}<YChevron className="size-4" /></a>
      <a className={row} href="/terms" target="_blank" rel="noreferrer">{label(YDoc, "Terms of Use")}<YChevron className="size-4" /></a>
      <button className={`${row} text-destructive`} onClick={() => { logOut(); toast("Logged out"); void navigate({ to: "/app" }); }}>{label(YLogOut, "Log out")}<YChevron className="size-4" /></button>
    </div>
  </Frame>;
}

/** Kids' leaderboard: only kids, first names only. */
function KidLeaderboard() {
  const { rows } = useLeaderboard(true);
  return <Frame eyebrow="Kids" title="Leaderboard">
    {rows.length ? <div className="border-2 border-foreground bg-background p-3 shadow-brutal">{rows.slice(0, 10).map((r, i) => <Rank key={r.id} n={String(i + 1)} name={r.name} xp={`${r.xp} XP`} active={r.me} />)}</div>
      : <p className="border-2 border-dashed border-foreground p-6 text-lg">Play games and finish lessons to get on the leaderboard!</p>}
  </Frame>;
}

/** Once, when Premium or the free trial has ended: renew, use points, or continue free. */
function PremiumEnded({ go }: { go: (s: Screen) => void }) {
  const pr = usePremium() as unknown as { premium: boolean; trial?: boolean; plan?: string; premiumUntil?: number | null };
  const [show, setShow] = useState<null | "trial" | "premium">(null);
  const latest = useRef(pr); latest.current = pr;
  useEffect(() => {
    // wait a few seconds so the Premium status has loaded before deciding
    const t = setTimeout(() => {
      const p = latest.current;
      try {
        if (p.premium) { localStorage.setItem("ilm:wasPremium", p.trial || p.plan === "trial" ? "trial" : "premium"); return; }
        const was = localStorage.getItem("ilm:wasPremium");
        if (was) { localStorage.removeItem("ilm:wasPremium"); setShow(was === "trial" ? "trial" : "premium"); }
      } catch { /* ignore */ }
    }, 4000);
    return () => clearTimeout(t);
  }, [pr.premium]);
  if (!show) return null;
  const close = () => setShow(null);
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4" onClick={close}>
    <div className="w-full max-w-sm border-2 border-foreground bg-background p-6 shadow-brutal" onClick={(e) => e.stopPropagation()}>
      <Crown className="size-10" />
      <p className="mt-2 font-serif text-3xl leading-tight">{show === "trial" ? "Your free trial has ended" : "Your Premium has ended"}</p>
      <p className="mt-2 text-sm text-muted-foreground">Thank you for learning with IlmStation. Renew to keep everything unlocked.</p>
      <div className="mt-5 grid gap-2">
        <Button onClick={() => { close(); try { sessionStorage.setItem("iq_rewards_tab", "Premium"); } catch { /* */ } go("rewards"); }}>See plans</Button>
        <Button variant="outline" onClick={() => { close(); try { sessionStorage.setItem("iq_rewards_tab", "Redeem"); } catch { /* */ } go("rewards"); }}>Use my points</Button>
        <Button variant="ghost" onClick={close}>Continue free</Button>
      </div>
    </div>
  </div>;
}

if (typeof document !== "undefined" && !document.getElementById("hcard-style")) {
  const st = document.createElement("style"); st.id = "hcard-style";
  st.textContent = "html.dark .hcard-dark{background:#2a2620!important;border-color:rgba(255,255,255,.16)!important;box-shadow:0 4px 0 rgba(0,0,0,.6)!important}";
  document.head.appendChild(st);
}
/** Small Ramadan card: countdown before, day number during. */
function RamadanMini({ onOpen }: { onOpen: () => void }) {
  const { day, daysLeft } = useRamadanCountdown();
  if (day === -1) return null;
  return <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-black bg-[#1b1d36] px-4 py-3 text-left text-white shadow-[0_4px_0_rgba(0,0,0,0.85)] active:translate-y-1">
    <HMoon className="size-9 shrink-0 text-[#f6b700]" />
    <span className="min-w-0">
      {day === 0 ? <b className="block text-lg leading-tight text-[#f6b700]">{daysLeft} days to Ramadan</b> : <b className="block text-lg leading-tight text-[#f6b700]">Ramadan Kareem! Day {day}</b>}
      <span className="block text-xs text-white/70">{day === 0 ? "Prepare your intention, Tarawih plan, and 30-day quest chain." : "Tap for your Ramadan quest"}</span>
    </span>
  </button>;
}
/** Level and XP towards the next level. */
function LevelCard({ onOpen }: { onOpen: () => void }) {
  const { rows } = useLeaderboard();
  const raw = useLevels() as unknown;
  const me = rows.find((r) => r.me);
  if (!me) return null;
  const list = (Array.isArray(raw) ? raw : ((raw as { levels?: unknown[] } | null)?.levels ?? [])) as Record<string, unknown>[];
  const lv = levelFor(me.xp, raw as never) as unknown as Record<string, unknown>;
  const min = (l?: Record<string, unknown>) => Number(l?.xp ?? l?.min ?? l?.minXp ?? l?.from ?? l?.at ?? 0);
  const idx = list.findIndex((l) => l.name === lv?.name);
  const next = idx >= 0 ? list[idx + 1] : undefined;
  const lo = min(lv), hi = next ? min(next) : 0;
  const ok = next && hi > lo;
  const pct = ok ? Math.max(0, Math.min(100, ((me.xp - lo) / (hi - lo)) * 100)) : 100;
  return <button onClick={onOpen} className="block w-full rounded-2xl border-[1.5px] border-foreground bg-background p-4 text-left shadow-[0_4px_0_var(--foreground)] active:translate-y-1 md:col-span-2">
    <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider"><span className="text-muted-foreground">Level {idx >= 0 ? idx + 1 : ""} ({String(lv?.name ?? "")})</span><span className="text-secondary">{me.xp}{ok ? `/${hi}` : ""} XP</span></span>
    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-foreground/10"><span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></span>
    {ok && <span className="mt-2 block text-xs text-muted-foreground">{hi - me.xp} XP to Level {idx + 2} ({String(next!.name ?? "")})</span>}
  </button>;
}

/* phones: round, light top bar */
if (typeof document !== "undefined" && !document.getElementById("topbar-style")) {
  const st = document.createElement("style"); st.id = "topbar-style";
  st.textContent = "@media (max-width:639px){"
    + "[data-topbar] button,[data-topbar] select,[data-topbar] [role=combobox]{border-radius:999px!important;border-width:1.5px!important;box-shadow:0 2px 8px rgba(0,0,0,.10)!important;min-height:44px}"
    + "[data-topbar] button[aria-label='Open navigation']{width:44px;height:44px}"
    + "[data-topbar] [data-avatar]{width:44px;height:44px;padding:0!important;display:grid!important;place-items:center}"
    + "}";
  document.head.appendChild(st);
}

/* phones: soft, rounded look on every page */
if (typeof document !== "undefined" && !document.getElementById("soft-style")) {
  const st = document.createElement("style"); st.id = "soft-style";
  const X = ":not([data-plain]):not([data-plain] *)";
  st.textContent = "@media (max-width:639px){"
    + "[data-soft] .shadow-brutal" + X + ",[data-soft] .shadow-brutal-sm" + X + "{border-radius:16px!important;border-width:1.5px!important;box-shadow:0 4px 0 var(--foreground)!important}"
    + "[data-soft] span.bg-foreground.text-background" + X + ",[data-soft] button.bg-foreground.text-background" + X + "{border-radius:999px!important;box-shadow:none!important}"
    + "[data-soft] .border-dashed" + X + "{border-radius:16px}"
    + "[data-soft] .size-9.border-2,[data-soft] .size-10.border-2,[data-soft] .size-11.border-2,[data-soft] .size-12.border-2{border-radius:12px;border-width:1.5px}"
    + "[data-soft] input:not([type=checkbox]):not([type=radio]):not([type=range]),[data-soft] select,[data-soft] textarea{border-radius:12px!important}"
    + "[data-soft] button.border-2:not(.rounded-full)" + X + "{border-radius:12px}"
    + "[data-soft] .border-2" + X + ":not(.rounded-full):not(.rounded-2xl){border-radius:12px}"
    + "[data-soft] .h-2.border-2,[data-soft] .h-3.border-2,[data-soft] .h-5.border-2,[data-soft] .h-2.border,[data-soft] .h-3.border{border-radius:999px!important;overflow:hidden}"
    + "}";
  document.head.appendChild(st);
}

/* Community → Profile: real level, XP, streak and badges */
function CommunityProfile({ name, username, initial, onShare }: { name: string; username: string; initial: string; onShare: () => void }) {
  const p = useMyRecord(); const levels = useLevels(); const lv = levelFor(p.stars, levels);
  const earned = adultBadges.filter((b) => isEarned(b, p));
  const stats: [string, string][] = [["Level", lv.name], ["XP", p.stars.toLocaleString()], ["Streak", `${p.streak} ${p.streak === 1 ? "day" : "days"}`], ["Badges", `${earned.length} of ${adultBadges.length}`]];
  return <div className="grid gap-5 md:grid-cols-[1fr_2fr]">
    <Panel>
      <div className="grid size-24 place-items-center rounded-full border-[1.5px] border-foreground bg-primary font-serif text-5xl text-[#1c1a17]">{initial}</div>
      <h2 className="mt-4 font-serif text-3xl">{name}</h2>
      <p className="text-muted-foreground">@{username} · {lv.name}</p>
      <Button className="mt-5" variant="outline" onClick={onShare}><Share2 /> Share profile</Button>
    </Panel>
    <Panel title="Learning record" tag={`${p.stars.toLocaleString()} XP`}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(([l, v]) => <div key={l} className="rounded-xl border-[1.5px] border-foreground/20 bg-muted/40 p-3">
        <p className="text-xs uppercase text-muted-foreground">{l}</p><p className="mt-1 font-serif text-2xl leading-tight">{v}</p></div>)}</div>
      <h3 className="mt-6 font-serif text-2xl">Recent badges</h3>
      {earned.length ? <div className="mt-4 flex flex-wrap gap-5">{earned.slice(-4).reverse().map((b) => <div key={b.id} className="flex w-20 flex-col items-center text-center">
        <Medal b={b} got size={52} /><span className="mt-3 text-xs font-semibold leading-tight">{b.name}</span></div>)}</div>
        : <p className="mt-3 text-sm text-muted-foreground">No badges yet. Keep learning to earn your first one.</p>}
    </Panel>
  </div>;
}
