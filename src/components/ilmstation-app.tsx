import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/components/auth";
import {
  Baby, Bell, BookOpen, Bot, ChevronRight, CircleUserRound, Crown, Flame, Gift, Globe2, Home,
  Library, LockKeyhole, Menu, MessageCircleQuestion, MoonStar, Play, Search, Settings,
  Share2, ShieldCheck, ShoppingBag, Sparkles, Swords, Trophy, Users, UserPlus, Check, Volume2, Wallet, X,
} from "lucide-react";
import { GraduationCap } from "lucide-react";
import { LockedTag, PremiumTag, Tier, UnlockDialog, usePremium, plans } from "@/components/premium";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChallengeScreen } from "@/components/challenge";
import { StudyScreen } from "@/components/study";
import { HifzScreen } from "@/components/hifz";
import { FamilyScreen } from "@/components/family";
import { ThemeToggle, useTheme } from "@/components/theme";
import { adultBadges, earnedBadges, isEarned, nextBadge, progressToNext, remainingFor, stageOf } from "@/components/kids-progress";
import { ShareActions, type ShareCard } from "@/components/share-actions";
import { QuizVisual, quizQuestionsFor } from "@/components/quiz-visual";

/** Demo learning record for the signed-in adult account. */
const myRecord = { stars: 1250, streak: 12, mastery: 34, kindness: 12 };

function AchievementsTab() {
  const p = myRecord;
  const up = nextBadge(p, adultBadges);
  return <div className="grid gap-5">
    <Panel title={`${stageOf(p)} stage`} tag={`${earnedBadges(p, adultBadges).length} of ${adultBadges.length} badges`}>
      {up ? <>
        <p className="flex items-center justify-between text-sm font-semibold"><span>Next: {up.name}</span><span>{progressToNext(p, adultBadges)}%</span></p>
        <div className="mt-2 h-5 border-2 border-foreground p-0.5"><div className="h-full bg-primary" style={{ width: `${progressToNext(p, adultBadges)}%` }} /></div>
        <p className="mt-2 text-sm text-muted-foreground">Still needs: {remainingFor(p).length ? remainingFor(p).join(", ") : up.criteria}</p>
      </> : <p>Every badge earned, masha’Allah.</p>}
    </Panel>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{adultBadges.map((b) => {
      const got = isEarned(b, p);
      return <button key={b.id} onClick={() => toast(`${b.name}: ${got ? "earned" : b.criteria}`)} className={cn("border-2 border-foreground p-5 text-center shadow-brutal-sm", got ? "bg-primary" : "bg-muted opacity-60")}>
        <Trophy className={cn("mx-auto size-8", !got && "opacity-50")} />
        <b className="mt-3 block font-serif text-xl font-normal leading-tight">{b.name}</b>
        <small className="text-muted-foreground">{got ? b.stage : `${b.points} pts`}</small>
      </button>;
    })}</div>
  </div>;
}
import { cn } from "@/lib/utils";

type Screen = "home" | "study" | "play" | "quests" | "hifz" | "halaqah" | "challenge" | "library" | "wisdom" | "bot" | "community" | "progress" | "rewards" | "ramadan" | "family" | "settings";
type QuizStep = "topics" | "difficulty" | "lobby" | "question" | "reveal" | "results" | "badge";

const topics = ["Aqeedah", "Hadith", "Seerah", "Fiqh", "Arabic", "Qur’an", "Tafsir", "Dua"];
const navGroups = [
  { label: "Today", items: [["home", "Today", Home], ["quests", "Quest map", Sparkles], ["ramadan", "Ramadan", MoonStar]] },
  { label: "Practice", items: [["study", "Study", GraduationCap], ["play", "Play", Play], ["challenge", "Challenge", Swords], ["hifz", "Hifz", BookOpen], ["halaqah", "Halaqah", Users], ["library", "Library", Library], ["bot", "IlmBot", Bot]] },
  { label: "You", items: [["progress", "Progress", Trophy], ["community", "Community", CircleUserRound], ["family", "Family hub", Baby], ["rewards", "Wallet & store", Wallet], ["settings", "Settings", Settings]] },
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
const progressCard: ShareCard = { eyebrow: "IlmStation · Monthly Progress", headline: "680 XP", sub: "12 day streak · 84% accuracy" };
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
  const { premium } = usePremium();
  const { account } = useAuth();
  const selectScreen = (next: Screen) => { setScreen(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto flex max-w-[1440px] gap-5 px-3 py-3 sm:px-5 sm:py-5">
      <Sidebar current={screen} onSelect={selectScreen} className="hidden lg:block" />
      {mobileNav && <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setMobileNav(false)}><Sidebar current={screen} onSelect={selectScreen} className="h-full w-64 bg-background" /></div>}
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></Button>
          <div className="hidden sm:block"><p className="text-xs font-semibold uppercase text-muted-foreground">Wednesday · 12 Rabi al-Awwal 1448</p></div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setStreak(true)}><Flame /> 12 day streak</Button>
            <Button variant={premium ? "secondary" : "outline"} className="hidden sm:inline-flex" onClick={() => selectScreen("rewards")}><Crown /> {premium ? "Premium" : "Go Premium"}</Button>
            <Button variant="outline" size="icon" onClick={() => setNotifications(true)} aria-label="Notifications"><Bell /></Button>
            <ThemeToggle />
            <Button variant="secondary" onClick={() => selectScreen("community")}><span className="grid size-6 place-items-center bg-primary text-primary-foreground">{account?.name?.[0]?.toUpperCase() ?? "?"}</span><span className="hidden sm:inline">{account?.name?.split(/\s+/)[0] ?? "Account"}</span></Button>
          </div>
        </header>
        {screen === "home" && <HomeScreen go={selectScreen} onShare={openShare} />}
        {screen === "play" && <PlayScreen go={selectScreen} onShare={openShare} />}
        {screen === "quests" && <QuestScreen onShare={openShare} />}
        {screen === "hifz" && <HifzScreen />}
        {screen === "halaqah" && <HalaqahScreen onShare={openShare} />}
        {screen === "challenge" && <ChallengeScreen />}
        {screen === "study" && <StudyScreen />}
        {screen === "library" && <LibraryScreen onShare={openShare} />}
        {screen === "wisdom" && <WisdomScreen onShare={openShare} />}
        {screen === "bot" && <BotScreen />}
        {screen === "community" && <CommunityScreen go={selectScreen} onShare={openShare} />}
        {screen === "progress" && <ProgressScreen onShare={openShare} />}
        {screen === "rewards" && <RewardsScreen />}
        {screen === "ramadan" && <RamadanScreen />}
        {screen === "family" && <FamilyScreen />}
        {screen === "settings" && <SettingsScreen onOnboarding={() => setOnboarding(true)} />}
      </main>
    </div>
    <MobileNav current={screen} onSelect={selectScreen} />
    <NotificationDialog open={notifications} onOpenChange={setNotifications} />
    <StreakDialog open={streak} onOpenChange={setStreak} />
    <ShareDialog card={share} onOpenChange={(o) => { if (!o) setShare(null); }} />
    <OnboardingDialog open={onboarding} onOpenChange={setOnboarding} />
  </div>;
}

function Sidebar({ current, onSelect, className }: { current: Screen; onSelect: (s: Screen) => void; className?: string }) {
  return <aside className={cn("w-56 shrink-0 border-2 border-foreground", className)}><Link to="/" className="flex w-full items-center gap-3 border-b-2 border-foreground px-4 py-4 text-left"><span className="grid size-9 place-items-center bg-foreground font-serif text-xl text-background">I</span><span><strong className="block font-serif text-xl font-normal">IlmStation</strong><small className="block uppercase text-muted-foreground">Seek · Learn · Grow</small></span></Link><nav className="p-2">{navGroups.map(group => <div key={group.label}><p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase text-muted-foreground">{group.label}</p>{group.items.map(([id, label, Icon]) => <button key={id} onClick={() => onSelect(id)} className={cn("mb-1 flex w-full items-center gap-2 border-2 border-transparent px-3 py-2 text-sm font-medium", current === id && "border-foreground bg-primary shadow-brutal-sm")}><Icon className="size-4" />{label}</button>)}</div>)}</nav><div className="m-3 border-2 border-foreground bg-foreground p-3 text-background"><p className="text-xs uppercase text-background/60">Level 4</p><p className="font-serif text-2xl">Seeker</p><div className="mt-2 h-2 border border-background/40"><div className="h-full w-3/4 bg-primary" /></div><p className="mt-1 text-xs">2,420 / 3,000 XP</p></div></aside>;
}

function MobileNav({ current, onSelect }: { current: Screen; onSelect: (s: Screen) => void }) {
  const items: [Screen, string, typeof Home][] = [["home", "Today", Home], ["play", "Play", Play], ["quests", "Quests", Sparkles], ["progress", "Progress", Trophy], ["community", "You", CircleUserRound]];
  return <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 border-foreground bg-background lg:hidden">{items.map(([id, label, Icon]) => <button key={id} onClick={() => onSelect(id)} className={cn("flex h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[11px] sm:text-xs", current === id && "bg-primary font-bold")}><Icon className="size-5 shrink-0" /><span className="truncate">{label}</span></button>)}</nav>;
}

function HomeScreen({ go, onShare }: { go: (s: Screen) => void; onShare: (card?: ShareCard) => void }) {
  const { firstName } = useAuth();
  return <Frame eyebrow="Your daily ledger" title={<>Assalamu-alaikum, <em className="text-secondary">{firstName || "Imran"}</em></>} actions={<Button onClick={() => go("play")}><Play /> Quick quiz</Button>}>
    <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-foreground bg-primary px-5 py-3 shadow-brutal"><div><span className="font-serif text-4xl">24</span><span className="ml-2 text-xs font-bold uppercase">days to Ramadan</span></div><p className="text-sm">Prepare your intention, Tarawih plan, and 30-day quest chain.</p><Button variant="outline" onClick={() => go("ramadan")}>Prepare <ChevronRight /></Button></div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]"><div className="grid gap-5 md:grid-cols-3"><Panel title="Today’s Quest" tag="In progress" className="md:col-span-2"><h2 className="font-serif text-3xl">The Night of Power</h2><p className="mt-1 text-sm text-muted-foreground">Read and reflect on Qadr, then pass a four-question check.</p><div className="mt-5 flex items-center gap-3"><div className="h-4 flex-1 border-2 border-foreground p-0.5"><div className="h-full w-2/3 bg-secondary" /></div><span className="font-serif text-xl">12 / 18</span></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2 text-xs font-bold"><span className="border-2 border-foreground bg-secondary px-2 py-1 text-secondary-foreground">+20 XP</span><span className="border-2 border-foreground px-2 py-1">1 badge</span></div><Button onClick={() => go("play")}>Continue quest</Button></div></Panel><Panel title="Daily Wisdom" tag="Qur’an"><p className="font-arabic text-3xl leading-relaxed" dir="rtl">إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ</p><p className="mt-2 text-sm italic">Indeed, We sent it down during the Night of Decree.</p><p className="mt-2 text-xs text-muted-foreground">Al-Qadr · 97:1</p><div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => toast.success("Wisdom saved")}>Save</Button><Button variant="outline" size="sm" onClick={() => onShare(qadrCard)}><Share2 /> Share</Button></div></Panel><Panel title="Play Modes" tag="Choose a practice" className="md:col-span-3"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Hifz Drills","Recite and review","hifz"],["Tafsir Quiz","10 mixed questions","play"],["Halaqah","Learn with family","halaqah"],["IlmBot","Ask and explore","bot"]].map(([a,b,c]) => <button key={a} onClick={() => go(c as Screen)} className="border-2 border-foreground p-4 text-left transition hover:bg-primary"><small className="uppercase text-muted-foreground">Practice</small><strong className="mt-1 block font-serif text-2xl font-normal">{a}</strong><span className="text-sm">{b}</span><ChevronRight className="mt-4 size-4" /></button>)}</div></Panel></div><aside className="space-y-5"><Panel title="The Pillars" tag="Path"><ProgressLine name="Shahada" value={100} /><ProgressLine name="Salah" value={67} /><ProgressLine name="Zakah" value={10} /><Button variant="outline" className="mt-4 w-full" onClick={() => go("quests")}>View quest map</Button></Panel><Panel title="Leaderboard" tag="Weekly"><Rank n="1" name="Yusuf" xp="420" /><Rank n="2" name="Imran" xp="390" active /><Rank n="3" name="Amina" xp="365" /><Button variant="ghost" className="mt-2 w-full" onClick={() => go("progress")}>View all</Button></Panel></aside></div>
  </Frame>;
}

function ProgressLine({ name, value }: { name: string; value: number }) { return <div className="mt-3"><div className="flex justify-between text-sm"><span>{name}</span><span className="font-serif">{value}%</span></div><div className="mt-1 h-2 border border-foreground"><div className="h-full bg-primary" style={{ width: `${value}%` }} /></div></div>; }
function Rank({ n, name, xp, active }: { n: string; name: string; xp: string; active?: boolean }) { return <div className={cn("mt-2 flex items-center justify-between px-2 py-1 text-sm", active && "border-2 border-foreground bg-primary shadow-brutal-sm")}><span><b className="mr-2 font-serif">{n}</b>{name}</span><span className="font-serif text-lg">{xp}</span></div>; }

function PlayScreen({ go, onShare }: { go: (s: Screen) => void; onShare: (card?: ShareCard) => void }) {
  const [step, setStep] = useState<QuizStep>("topics"); const [topic, setTopic] = useState("Aqeedah"); const [difficulty, setDifficulty] = useState("Intermediate"); const [answer, setAnswer] = useState<string>(); const [question, setQuestion] = useState(1);
  const [correct, setCorrect] = useState(0);
  const questions = quizQuestionsFor(topic);
  const active = questions[question - 1];
  const isCorrect = active?.options[active.answer] === answer;
  const [locked, setLocked] = useState<{id:string;title:string;cost:number}>();
  const { canAccess } = usePremium();
  const reset = () => { setStep("topics"); setAnswer(undefined); setQuestion(1); setCorrect(0); };
  return <Frame eyebrow="Play & learn" title="Quick Quiz" actions={step !== "topics" ? <Button variant="outline" onClick={reset}>Exit quiz</Button> : <Button onClick={() => go("challenge")}><Swords /> Challenge a friend</Button>}>
    {step === "topics" && <Panel title="Choose a topic" tag="8 paths"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{topics.map((t,i) => { const open = canAccess(`topic-${t}`, i > 5 ? "premium" : "free"); return <button key={t} onClick={() => { if(!open) { setLocked({id:`topic-${t}`,title:`${t} topic`,cost:500}); return; } setTopic(t); setStep("difficulty"); }} className={cn("border-2 border-foreground p-5 text-left shadow-brutal-sm hover:bg-primary", !open && "bg-muted")}><span className="font-serif text-2xl">{t}</span><p className="mt-2 text-xs text-muted-foreground">{!open ? <><LockKeyhole className="mr-1 inline size-3" /> Premium · </> : null}{quizQuestionsFor(t).length} questions</p></button>})}</div><UnlockDialog item={locked} onOpenChange={(o)=>{if(!o)setLocked(undefined)}}/></Panel>}
    {step === "difficulty" && <Panel title="Set the difficulty" tag={topic}><div className="grid gap-4 md:grid-cols-3">{[["Beginner","1× XP"],["Intermediate","1.5× XP"],["Advanced","2× XP"]].map(([a,b]) => <button key={a} onClick={() => setDifficulty(a ?? "Beginner")} className={cn("border-2 border-foreground p-6 text-left", difficulty === a ? "bg-primary shadow-brutal" : "bg-background")}><span className="font-serif text-3xl">{a}</span><p className="mt-2">{b}</p></button>)}</div><Button className="mt-6" onClick={() => setStep("lobby")}>Continue</Button></Panel>}
    {step === "lobby" && <Panel title="Ready when you are" tag={`${topic} · ${difficulty}`}><div className="grid gap-6 md:grid-cols-2"><div><h2 className="font-serif text-4xl">{topic} practice</h2><p className="mt-3 text-muted-foreground">Identify clues, think through the choices, and learn from every answer.</p></div><div className="grid grid-cols-2 border-2 border-foreground"><Stat label="Questions" value={String(questions.length)}/><Stat label="Format" value="Visual + text"/><Stat label="Reward" value="+15 per answer"/><Stat label="Difficulty" value={difficulty}/></div></div><Button className="mt-6" onClick={() => setStep("question")}><Play /> Start quiz</Button></Panel>}
    {step === "question" && active && <Panel title={`Question ${question} of ${questions.length}`} tag={question === 1 ? "Visual identification" : "Knowledge check"}><div className="h-3 border-2 border-foreground p-0.5"><div className="h-full bg-secondary" style={{width:`${question / questions.length * 100}%`}} /></div><h2 className="mt-6 max-w-3xl font-serif text-3xl sm:text-4xl">{active.q}</h2>{question === 1 && <QuizVisual kind={active.visual}/>}<div className="mt-6 grid gap-3 md:grid-cols-2">{active.options.map(a => <Button key={a} variant="outline" onClick={() => setAnswer(a)} className={cn("min-h-14 justify-start text-left", answer===a && "bg-primary text-primary-foreground")}>{a}</Button>)}</div><div className="mt-6 flex flex-wrap justify-between gap-2"><Button variant="ghost" onClick={() => { setAnswer(undefined); if(question < questions.length) setQuestion(q=>q+1); else setStep("results"); }}>Skip question</Button><Button disabled={!answer} onClick={() => { if(isCorrect) setCorrect(c=>c+1); setStep("reveal"); }}>Check answer</Button></div></Panel>}
    {step === "reveal" && active && <Panel title={isCorrect ? "Correct — well done" : "Not quite — keep learning"} tag={isCorrect ? "+15 XP" : "Teaching moment"} className={isCorrect ? "shadow-[5px_5px_0_var(--secondary)]" : "shadow-[5px_5px_0_var(--destructive)]"}><p className="font-serif text-3xl">{active.options[active.answer]}</p><p className="mt-3 max-w-3xl text-muted-foreground">{active.why}</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => { if(question < questions.length){setQuestion(q=>q+1);setAnswer(undefined);setStep("question")} else setStep("results") }}>{question < questions.length ? "Next question" : "See results"} <ChevronRight /></Button></div></Panel>}
    {step === "results" && <Panel title="Practice complete" tag={correct === questions.length ? "Excellent work" : "Keep growing"}><div className="grid gap-4 sm:grid-cols-3"><Stat label="Score" value={`${correct} / ${questions.length}`}/><Stat label="XP earned" value={`+${correct * 15}`}/><Stat label="Accuracy" value={`${Math.round(correct / questions.length * 100)}%`}/></div><div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={reset}>Play another topic</Button><Button variant="outline" onClick={() => { setAnswer(undefined); setQuestion(1); setCorrect(0); setStep("question"); }}>Try again</Button><Button variant="outline" onClick={() => onShare({ eyebrow: "IlmStation · Quiz result", headline: `${correct} / ${questions.length}`, sub: `${topic} · ${difficulty} · +${correct * 15} XP`, meta: "Score" })}><Share2/> Share</Button></div></Panel>}
  </Frame>;
}

function Stat({ label, value }: { label:string; value:string }) { return <div className="border-b-2 border-r-2 border-foreground p-4 last:border-r-0"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-serif text-2xl">{value}</p></div>; }

function QuestScreen({ onShare }: { onShare: () => void }) { const [selected,setSelected]=useState(2); return <Frame eyebrow="Curriculum journey" title="Quest Map" actions={<Button variant="outline" onClick={onShare}><Share2/> Share progress</Button>}><Panel title="The Pillars" tag="Chapter 1 · 42%"><div className="overflow-x-auto py-8"><div className="flex min-w-[720px] items-center justify-between px-8">{["Shahada","Salah","Zakah","Sawm","Hajj"].map((n,i)=><button key={n} onClick={()=>setSelected(i)} className="relative flex flex-col items-center gap-3"><span className={cn("grid size-16 place-items-center border-2 border-foreground font-serif text-2xl shadow-brutal",i<2?"bg-secondary text-secondary-foreground":i===2?"bg-primary":"bg-muted text-muted-foreground")}>{i<2?"✓":i+1}</span><b>{n}</b>{i<4&&<span className="absolute left-[70px] top-8 h-0.5 w-[82px] bg-foreground"/>}</button>)}</div></div></Panel><div className="mt-6 grid gap-5 md:grid-cols-2"><Panel title={["Witnessing Faith","The Daily Prayer","Purifying Wealth","The Month of Fasting","The Pilgrimage"][selected] ?? "Quest detail"} tag={selected<2?"Complete":selected===2?"Unlocked":"Locked"}><p className="font-arabic text-3xl" dir="rtl">أركان الإسلام</p><p className="mt-3 text-muted-foreground">Three stages · 12 questions · 180 XP · unlocks a bilingual badge.</p><Button className="mt-5" disabled={selected>2} onClick={()=>toast.success(selected<2?"Review started":"Quest started")}>{selected<2?"Review quest":selected===2?"Start quest":"Complete prerequisite"}</Button></Panel><Panel title="Next reward" tag="At 3,000 XP"><div className="flex items-center gap-4"><div className="grid size-20 place-items-center border-2 border-foreground bg-primary"><Trophy className="size-10"/></div><div><h3 className="font-serif text-2xl">Guardian level</h3><p className="text-sm text-muted-foreground">Ramadan quests and a custom profile frame.</p></div></div></Panel></div></Frame>; }


function HalaqahScreen({onShare}:{onShare:()=>void}){
  const [phase,setPhase]=useState(0);
  const [topic,setTopic]=useState("Aqeedah");
  const [round,setRound]=useState(0);
  const [choice,setChoice]=useState<number>();
  const [score,setScore]=useState(0);
  const rounds=quizQuestionsFor(topic);
  const current=rounds[round];
  const start=()=>{setRound(0);setScore(0);setChoice(undefined);setPhase(2)};
  const [invitee,setInvitee]=useState("");
  const [invited,setInvited]=useState<string[]>([]);
  const sendInvite=()=>{
    const v=invitee.trim();
    if(!v)return;
    const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if(!isEmail&&v.length<3){toast.error("Enter a username or email");return}
    if(invited.some(i=>i.toLowerCase()===v.toLowerCase())){toast.error("Already invited");return}
    setInvited(p=>[...p,v]);setInvitee("");
    toast.success(`Invite sent to ${v}`);
  };
  if(phase===0)return <Frame eyebrow="Family learning" title="Halaqah"><div className="grid gap-5 md:grid-cols-2"><Panel title="Create a room" tag="Host"><label className="text-sm font-semibold">Topic<select value={topic} onChange={e=>setTopic(e.target.value)} className="mt-1 block h-11 w-full border-2 border-foreground bg-background px-3">{topics.map(t=><option key={t}>{t}</option>)}</select></label><p className="mt-4 text-sm text-muted-foreground">{rounds.length} rounds · visual and knowledge questions</p><Button className="mt-5" onClick={()=>setPhase(1)}>Create room</Button></Panel><Panel title="Join a room" tag="Guest"><Field label="Room code" placeholder="IQ-XXXX"/><Button variant="outline" className="mt-5" onClick={start}>Join game</Button></Panel></div></Frame>;
  if(phase===1)return <Frame eyebrow="Waiting room" title="IQ-7K4M"><Panel title="Invite your family" tag={`${3+invited.length} of 6 joined`}>
    <div className="grid grid-cols-3 gap-3">{["Imran","Amina","Maryam"].map(n=><div className="border-2 border-foreground bg-muted p-4 text-center" key={n}><span className="mx-auto grid size-12 place-items-center bg-primary font-serif text-xl">{n[0]}</span><b className="mt-2 block">{n}</b></div>)}</div>
    <div className="mt-6 border-2 border-foreground bg-muted/50 p-4">
      <b className="text-sm">Invite by username or email</b>
      <div className="mt-2 flex gap-2">
        <input value={invitee} onChange={e=>setInvitee(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendInvite()} placeholder="@username or name@email.com" className="h-11 min-w-0 flex-1 border-2 border-foreground bg-background px-3 text-sm" />
        <Button onClick={sendInvite}><UserPlus/> Invite</Button>
      </div>
      {invited.length>0&&<div className="mt-3 flex flex-wrap gap-2">{invited.map(i=><span key={i} className="inline-flex items-center gap-1.5 border-2 border-foreground bg-background px-2 py-1 text-xs font-bold"><Check className="size-3.5"/> {i} · invited</span>)}</div>}
    </div>
    <div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={()=>toast.success("Room code copied")}>Copy code</Button><Button onClick={start}>Start game</Button></div>
  </Panel></Frame>;
  if(phase===2&&current)return <Frame eyebrow={`Live game · Round ${round+1} of ${rounds.length}`} title="Family Halaqah"><Panel title={current.q} tag={topic}>{current.visual&&round===0&&<QuizVisual kind={current.visual} compact/>}<div className="mt-5 grid gap-3 sm:grid-cols-2">{current.options.map((a,i)=><Button key={a} variant="outline" className={cn("min-h-14 justify-start text-left", choice!==undefined&&i===current.answer&&"bg-secondary text-secondary-foreground",choice===i&&i!==current.answer&&"bg-destructive text-destructive-foreground")} disabled={choice!==undefined} onClick={()=>{setChoice(i);if(i===current.answer)setScore(s=>s+1)}}>{a}</Button>)}</div>{choice!==undefined&&<div className="mt-5"><p className="text-sm">{current.why}</p><Button className="mt-3" onClick={()=>{if(round+1<rounds.length){setRound(r=>r+1);setChoice(undefined)}else setPhase(3)}}>{round+1<rounds.length?"Next round":"See results"}</Button></div>}</Panel></Frame>;
  return <Frame eyebrow="Family results" title="Learning together"><Panel title="Your round summary" tag="Room IQ-7K4M"><div className="grid gap-3 sm:grid-cols-2"><Stat label="Correct answers" value={`${score} / ${rounds.length}`}/><Stat label="Topic" value={topic}/></div><p className="mt-5 text-sm text-muted-foreground">Every answer is a chance to learn together. Try another topic as a family.</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={()=>setPhase(0)}>Play again</Button><Button variant="outline" onClick={onShare}><Share2/> Share results</Button></div></Panel></Frame>
}



const articles=[
  {id:"tawakkul",t:"Understanding Tawakkul",c:"Aqeedah",m:"8 min",tier:"free" as Tier,cost:0},
  {id:"mercy",t:"Mercy in the Prophetic Tradition",c:"Hadith",m:"12 min",tier:"free" as Tier,cost:0},
  {id:"hudaybiyyah",t:"The Treaty of Hudaybiyyah",c:"Seerah",m:"10 min",tier:"premium" as Tier,cost:300},
  {id:"wudu",t:"A Practical Guide to Wudu",c:"Fiqh",m:"6 min",tier:"free" as Tier,cost:0},
  {id:"tafsir-mulk",t:"Tafsir of Surah Al-Mulk",c:"Tafsir",m:"22 min",tier:"premium" as Tier,cost:450},
  {id:"arabic-grammar",t:"Classical Arabic: Building Sentences",c:"Arabic",m:"18 min",tier:"premium" as Tier,cost:400},
];
function LibraryScreen({onShare}:{onShare:()=>void}){
  const[article,setArticle]=useState<string>();
  const[bookmarks,setBookmarks]=useState<string[]>([articles[1]?.t ?? "Mercy in the Prophetic Tradition"]);
  const[locked,setLocked]=useState<{id:string;title:string;cost:number}>();
  const{premium,points,canAccess}=usePremium();
  if(article)return <Frame eyebrow="Library article" title={article} actions={<Button variant="outline" onClick={()=>setArticle(undefined)}>Back to library</Button>}><Panel><div className="sticky top-0 mb-8 h-2 border border-foreground bg-background"><div className="h-full w-2/3 bg-secondary"/></div><p className="font-arabic text-4xl leading-relaxed" dir="rtl">وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ</p><p className="mt-2 italic text-muted-foreground">Whoever relies upon Allah — then He is sufficient for him. Qur’an 65:3</p><div className="prose mt-8 max-w-3xl"><h2 className="font-serif text-3xl">Reliance is active, not passive</h2><p className="mt-3 leading-7">Tawakkul joins sincere effort with trust in Allah’s decree. The believer takes the available means, asks for guidance, and releases anxiety about the outcome.</p><p className="mt-3 leading-7">The Prophetic model consistently paired preparation with reliance: journeys were planned, counsel was sought, and every action remained anchored in remembrance.</p></div><div className="mt-8 flex gap-3"><Button onClick={()=>{setBookmarks(b=>b.includes(article)?b.filter(x=>x!==article):[...b,article]);toast.success("Bookmark updated")}}>Bookmark</Button><Button variant="outline" onClick={onShare}><Share2/> Share</Button></div></Panel></Frame>;
  return <Frame eyebrow="Read with depth" title="Library" actions={<div className="flex flex-wrap gap-2">{premium?<PremiumTag/>:<span className="inline-flex items-center gap-1 border-2 border-foreground px-2 py-1 text-xs font-bold"><Wallet className="size-3"/> {points} pts</span>}<Button variant="outline" onClick={()=>toast(`${bookmarks.length} saved article${bookmarks.length===1?"":"s"}`)}>Bookmarks · {bookmarks.length}</Button></div>}>
    <div className="flex flex-wrap gap-3"><div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-3 size-4"/><input className="h-11 w-full border-2 border-foreground bg-background pl-10" placeholder="Search the library"/></div>{topics.slice(0,4).map(t=><Button key={t} variant="outline" size="sm">{t}</Button>)}</div>
    {!premium&&<div className="mt-5 flex flex-wrap items-center gap-3 border-2 border-foreground bg-primary p-5 shadow-brutal"><div className="flex-1"><p className="font-serif text-2xl">Premium readings</p><p className="text-sm">Longer, deeper studies. Read them all with Premium, or unlock one at a time with points.</p></div><Button variant="secondary" onClick={()=>setLocked({id:"premium",title:"IlmStation Premium",cost:1200})}><Crown/> See Premium</Button></div>}
    <div className="mt-6 grid gap-4 md:grid-cols-2">{articles.map((a,i)=>{const open=canAccess(a.id,a.tier);return <button key={a.id} onClick={()=>open?setArticle(a.t):setLocked({id:a.id,title:a.t,cost:a.cost})} className={cn("relative border-2 border-foreground p-6 text-left shadow-brutal",i===0&&"bg-primary",!open&&"bg-muted")}>
      <span className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">{a.c} · {a.m} {a.tier==="premium"&&(open?<PremiumTag/>:<LockedTag cost={a.cost}/>)}</span>
      <h2 className={cn("mt-3 font-serif text-3xl",!open&&"opacity-70")}>{a.t}</h2>
      <p className={cn("mt-2 text-sm text-muted-foreground",!open&&"blur-[2px] select-none")}>A clear, sourced guide for everyday learning and reflection.</p>
      <span className="mt-5 flex items-center text-sm font-bold">{open?<>Read article <ChevronRight className="size-4"/></>:<><LockKeyhole className="mr-1 size-4"/> Unlock to read</>}</span>
    </button>})}</div>
    <UnlockDialog item={locked} onOpenChange={(o)=>{if(!o)setLocked(undefined)}}/>
  </Frame>;
}

function WisdomScreen({onShare}:{onShare:(card?:ShareCard)=>void}){const[saved,setSaved]=useState(false);return <Frame eyebrow="A new entry every Fajr" title="Daily Wisdom"><Panel title="Today · Patience" tag="Hadith"><p className="font-arabic text-4xl leading-loose" dir="rtl">وَمَن يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ</p><p className="mt-4 font-serif text-3xl italic">“Whoever strives to be patient, Allah will make him patient.”</p><p className="mt-3 text-sm text-muted-foreground">Sahih al-Bukhari 1469 · Authenticated</p><div className="mt-6 flex gap-3"><Button onClick={()=>{setSaved(!saved);toast.success(saved?"Removed from bookmarks":"Wisdom saved")}}>{saved?"Saved ✓":"Bookmark"}</Button><Button variant="outline" onClick={() => onShare(patienceCard)}><Share2/> Share</Button></div></Panel><h2 className="mb-4 mt-8 font-serif text-3xl">Recent wisdom</h2><div className="grid gap-3 md:grid-cols-3">{["Gratitude","Sincerity","Good character"].map((x,i)=><button key={x} className="border-2 border-foreground p-5 text-left hover:bg-primary"><span className="text-xs uppercase text-muted-foreground">{i+1} day ago</span><h3 className="mt-2 font-serif text-2xl">{x}</h3><p className="mt-2 text-sm">A sourced reflection from Qur’an and Sunnah.</p></button>)}</div></Frame>}

function BotScreen(){const[messages,setMessages]=useState<{from:string;text:string}[]>([]);const[input,setInput]=useState("");const send=(text=input)=>{if(!text.trim())return;setMessages(m=>[...m,{from:"you",text},{from:"bot",text:"Sabr is steadfast patience rooted in trust in Allah. The Qur’an pairs patience with prayer as sources of help. For personal religious rulings, please consult a qualified scholar. · Source: Qur’an 2:153"}]);setInput("")};return <Frame eyebrow="8 of 10 sessions remaining" title="Ask IlmBot"><Panel title="Sourced Islamic learning assistant" tag="Not a fatwa service"><div className="min-h-80 space-y-3">{messages.length===0?<div><p className="font-serif text-3xl">What would you like to understand?</p><div className="mt-5 flex flex-wrap gap-2">{["Explain sabr simply","What is the meaning of Ihsan?","Tell me about Surah Al-Mulk"].map(q=><Button key={q} variant="outline" onClick={()=>send(q)}>{q}</Button>)}</div></div>:messages.map((m,i)=><div key={i} className={cn("max-w-2xl border-2 border-foreground p-4",m.from==="you"?"ml-auto bg-primary":"bg-muted")}><b className="text-xs uppercase">{m.from==="you"?"You":"IlmBot"}</b><p className="mt-1">{m.text}</p></div>)}</div><form className="mt-5 flex gap-2 border-t-2 border-foreground pt-4" onSubmit={e=>{e.preventDefault();send()}}><input aria-label="Ask IlmBot" value={input} onChange={e=>setInput(e.target.value)} className="h-11 flex-1 border-2 border-foreground bg-background px-3" placeholder="Ask a learning question…"/><Button type="submit">Send</Button></form></Panel></Frame>}

function CommunityScreen({go,onShare}:{go:(s:Screen)=>void;onShare:()=>void}){
  const[tab,setTab]=useState("Profile");
  const{account}=useAuth();
  const displayName=account?.name??"Your name";
  const username=account?.name?account.name.toLowerCase().replace(/\s+/g,""):"username";
  const initial=account?.name?.[0]?.toUpperCase()??"?";
  const level=account?.level??"Beginner";
  return <Frame eyebrow="Your circle" title="Community" actions={<Button onClick={()=>go("challenge")}><Trophy/> New challenge</Button>}><div className="mb-5 flex flex-wrap gap-2">{["Profile","Friends","Requests","Find friends"].map(t=><Button key={t} variant={tab===t?"default":"outline"} onClick={()=>setTab(t)}>{t}</Button>)}</div>{tab==="Profile"?<div className="grid gap-5 md:grid-cols-[1fr_2fr]"><Panel><div className="grid size-24 place-items-center bg-primary font-serif text-5xl">{initial}</div><h2 className="mt-4 font-serif text-3xl">{displayName}</h2><p className="text-muted-foreground">@{username} · {level} Seeker</p><Button className="mt-5" variant="outline" onClick={onShare}><Share2/> Share profile</Button></Panel><Panel title="Learning record" tag="2,420 XP"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Quests" value="42"/><Stat label="Streak" value="12"/><Stat label="Badges" value="5"/><Stat label="Accuracy" value="84%"/></div><h3 className="mt-6 font-serif text-2xl">Recent badges</h3><div className="mt-3 flex gap-3">{["علم","نور","حكمة"].map(x=><span key={x} className="grid size-16 place-items-center border-2 border-foreground bg-primary font-arabic text-xl shadow-brutal-sm">{x}</span>)}</div></Panel></div>:<Panel title={tab} tag={tab==="Requests"?"2 pending":"Social learning"}><div className="space-y-3">{["Amina Rahman","Hassan Bello","Maryam Idris"].map((n,i)=><div key={n} className="flex flex-wrap items-center gap-3 border-2 border-foreground p-3"><span className="grid size-10 place-items-center bg-primary font-serif text-xl">{n[0]}</span><div className="flex-1"><b>{n}</b><p className="text-xs text-muted-foreground">Level {5-i} · {14+i*3} day streak</p></div><Button size="sm" variant={tab==="Requests"?"default":"outline"} onClick={()=>toast.success(tab==="Requests"?"Request accepted":"Friend profile opened")}>{tab==="Requests"?"Accept":"View"}</Button></div>)}</div>{tab==="Find friends"&&<div className="mt-5 flex gap-2"><input className="h-10 flex-1 border-2 border-foreground bg-background px-3" placeholder="Search by username"/><Button>Search</Button></div>}</Panel>}</Frame>}

const GLOBAL_BOARD:[string,string][]=[["Yusuf","2,140 XP"],["Amina","1,980 XP"],["Imran","1,860 XP"],["Hassan","1,720 XP"],["Maryam","1,640 XP"],["Bilal","1,590 XP"],["You","1,540 XP"],["Zayd","1,480 XP"],["Khadija","1,410 XP"],["Umar","1,350 XP"]];
const FRIENDS_BOARD:[string,string][]=[["Amina","790 XP"],["You","760 XP"],["Imran","710 XP"],["Maryam","680 XP"],["Hassan","640 XP"]];
function LeaderboardTab(){const[scope,setScope]=useState<"friends"|"global">("friends");const board=scope==="friends"?FRIENDS_BOARD:GLOBAL_BOARD;const you=board.findIndex(([n])=>n==="You")+1;return <Panel title="Weekly leaderboard" tag={scope==="friends"?"Among friends":"Global"}>
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div className="flex gap-2"><Button size="sm" variant={scope==="friends"?"default":"outline"} onClick={()=>setScope("friends")}>Friends</Button><Button size="sm" variant={scope==="global"?"default":"outline"} onClick={()=>setScope("global")}>Global</Button></div>
    <span className="border-2 border-foreground bg-primary px-3 py-1 text-sm font-bold">Your position: #{you} of {board.length}</span>
  </div>
  <div className="space-y-2">{board.map(([n,xp],i)=><Rank key={n} n={`${i+1}`} name={n} xp={xp} active={n==="You"}/>)}</div>
  {scope==="friends"&&<p className="mt-3 text-xs text-muted-foreground">Friends are people you’ve challenged or invited to a Halaqah.</p>}
</Panel>}
function ProgressScreen({onShare}:{onShare:()=>void}){const[tab,setTab]=useState("Progress");return <Frame eyebrow="Your learning record" title="Growth" actions={<Button variant="outline" onClick={onShare}><Share2/> Share month</Button>}><div className="mb-5 flex gap-2"><Button variant={tab==="Progress"?"default":"outline"} onClick={()=>setTab("Progress")}>Progress</Button><Button variant={tab==="Achievements"?"default":"outline"} onClick={()=>setTab("Achievements")}>Achievements</Button><Button variant={tab==="Leaderboard"?"default":"outline"} onClick={()=>setTab("Leaderboard")}>Leaderboard</Button></div>{tab==="Progress"&&<div className="grid gap-5 md:grid-cols-2"><Panel title="Level 4 · Seeker" tag="580 XP to Guardian"><div className="h-5 border-2 border-foreground p-0.5"><div className="h-full w-4/5 bg-primary"/></div><div className="mt-6 grid grid-cols-2 gap-3"><Stat label="This month" value="680 XP"/><Stat label="Study time" value="4h 12m"/></div></Panel><Panel title="Topic performance" tag="Accuracy"><ProgressLine name="Aqeedah" value={88}/><ProgressLine name="Hadith" value={82}/><ProgressLine name="Seerah" value={75}/><ProgressLine name="Fiqh" value={62}/></Panel></div>}{tab==="Achievements"&&<AchievementsTab/>}{tab==="Leaderboard"&&<LeaderboardTab/>}</Frame>}

function RewardsScreen(){
  const[tab,setTab]=useState("Wallet");
  const{points,premium,activatePremium,cancelPremium,unlockWithPoints}=usePremium();
  const store:[string,string,number][]=[["Sadaqah donation","500 pts = $1",500],["Streak Freeze","100 pts",100],["Premium week","700 pts",700],["Gift Premium","1,500 pts",1500],["Advanced topic","500 pts",500]];
  return <Frame eyebrow="Earn, redeem, give" title="Rewards" actions={premium?<PremiumTag/>:undefined}>
    <div className="mb-5 flex gap-2"><Button variant={tab==="Wallet"?"default":"outline"} onClick={()=>setTab("Wallet")}>Wallet</Button><Button variant={tab==="Store"?"default":"outline"} onClick={()=>setTab("Store")}>Points store</Button><Button variant={tab==="Premium"?"default":"outline"} onClick={()=>setTab("Premium")}><Crown/> Premium</Button></div>
    {tab==="Wallet"&&<div className="grid gap-5 md:grid-cols-[1fr_2fr]"><Panel title="Balance" tag="All categories"><p className="font-serif text-6xl">{points.toLocaleString()}</p><p className="text-muted-foreground">points available</p><div className="mt-5 grid grid-cols-2 gap-2 text-sm"><span className="bg-primary p-2">Ajr 420</span><span className="bg-secondary p-2 text-secondary-foreground">Ilm 380</span><span className="bg-muted p-2">Noor 300</span><span className="border-2 border-foreground p-2">Hikmah 180</span></div></Panel><Panel title="Recent activity" tag="September"><ul className="divide-y-2 divide-foreground">{["Daily Quest · +40 Ilm","Hifz review · +30 Noor","Challenge win · +60 Hikmah","Article complete · +30 Ilm"].map(x=><li key={x} className="flex justify-between py-3"><span>{x.split(" · ")[0]}</span><b>{x.split(" · ")[1]}</b></li>)}</ul></Panel></div>}
    {tab==="Store"&&<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{store.map(([a,b,cost],i)=><Panel key={a} title={a} tag={b}><div className="grid size-12 place-items-center border-2 border-foreground bg-primary">{i===0?<Gift/>:<ShoppingBag/>}</div><p className="mt-3 text-sm text-muted-foreground">Redeem your learning points for something meaningful.</p><Button className="mt-4" disabled={points<cost} onClick={()=>{if(!unlockWithPoints(`store-${i}-${Date.now()}`,cost)){toast.error("Not enough points yet");return}if(i===2||i===3){activatePremium();toast.success("Premium unlocked for a week (demo)")}else toast.success(i===0?"Donation preview opened":"Item redeemed")}}>{points<cost?"Not enough points":"Redeem"}</Button></Panel>)}</div>}
    {tab==="Premium"&&<PlansPanel/>}
  </Frame>;
}

function RamadanScreen(){const[tarawih,setTarawih]=useState(false);return <Frame eyebrow="Ramadan 1448" title="Your Ramadan"><Panel title="Iftar countdown · Lagos" tag="18:42 local"><div className="flex flex-wrap items-end gap-4"><span className="font-serif text-5xl sm:text-6xl">04:17:32</span><p className="pb-2 text-muted-foreground">until Maghrib</p></div></Panel><div className="mt-5 grid gap-5 md:grid-cols-2"><Panel title="30-day quest chain" tag="Day 12"><div className="grid grid-cols-6 gap-2">{Array.from({length:30},(_,i)=><span key={i} className={cn("grid aspect-square place-items-center border border-foreground text-xs",i<11?"bg-secondary text-secondary-foreground":i===11?"bg-primary":"bg-muted")}>{i+1}</span>)}</div><Button className="mt-5" onClick={()=>toast.success("Today’s Taqwa quest started")}>Start day 12</Button></Panel><Panel title="Tarawih tracker" tag="8 night streak"><p className="font-serif text-3xl">Did you pray Tarawih tonight?</p><Button className="mt-5" variant={tarawih?"secondary":"default"} onClick={()=>{setTarawih(!tarawih);toast.success("Tarawih check-in updated")}}>{tarawih?"Checked in ✓":"Check in"}</Button><p className="mt-4 text-sm text-muted-foreground">12,480 learners checked in tonight.</p></Panel></div></Frame>}

function SettingsScreen({onOnboarding}:{onOnboarding:()=>void}){const{theme,setTheme}=useTheme();const{loggedIn,logOut}=useAuth();const navigate=useNavigate();const dark=theme==="dark";const[toggles,setToggles]=useState([true,true,false]);return <Frame eyebrow="Preferences & account" title="Settings"><div className="grid gap-5 md:grid-cols-2"><Panel title="Experience" tag="Saved automatically">{["Quest reminders","Sound effects","Reduced motion"].map((x,i)=><label className="flex items-center justify-between border-b-2 border-foreground py-4"><span>{x}</span><input type="checkbox" checked={toggles[i]} onChange={()=>setToggles(t=>t.map((v,j)=>j===i?!v:v))} className="size-5 accent-foreground"/></label>)}<label className="mt-4 block text-sm font-semibold">Language<select className="mt-1 block h-11 w-full border-2 border-foreground bg-background px-3"><option>English</option><option>العربية</option><option>Français</option><option>Bahasa Melayu</option><option>اردو</option></select></label></Panel><Panel title="Account" tag="Frontend demo"><Button variant="outline" className="mb-3 w-full justify-start" onClick={onOnboarding}><Globe2/> Replay onboarding</Button><Button variant="outline" className="mb-3 w-full justify-start" onClick={()=>toast("Privacy centre opened")}><ShieldCheck/> Privacy & accessibility</Button><Button variant="outline" className="mb-3 w-full justify-start" onClick={()=>toast("Offline demo: Hifz and saved articles remain available")}><MoonStar/> Preview offline state</Button>{loggedIn?<Button variant="destructive" className="w-full" onClick={()=>{logOut();toast("Logged out");void navigate({to:"/"})}}>Log out</Button>:<Button asChild className="w-full"><Link to="/login">Log in</Link></Button>}<label className="mt-5 flex items-center justify-between border-t-2 border-foreground pt-4"><span>Dark theme preview</span><input type="checkbox" checked={dark} onChange={()=>{setTheme(dark?"light":"dark");toast("Theme preference saved")}} className="size-5 accent-foreground"/></label></Panel></div></Frame>}

function NotificationDialog({open,onOpenChange}:{open:boolean;onOpenChange:(x:boolean)=>void}){return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none"><DialogHeader><DialogTitle className="font-serif text-3xl">Notifications</DialogTitle><DialogDescription>Your learning circle is active.</DialogDescription></DialogHeader>{["Amina challenged you to Seerah","You unlocked First Light","Your 12-day streak is safe"].map((x,i)=><button key={x} onClick={()=>toast.success("Notification marked as read")} className={cn("border-2 border-foreground p-3 text-left",i===0&&"bg-primary")}><b>{x}</b><small className="block text-muted-foreground">{i+1} hour ago</small></button>)}</DialogContent></Dialog>}
function StreakDialog({open,onOpenChange}:{open:boolean;onOpenChange:(x:boolean)=>void}){return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none"><DialogHeader><DialogTitle className="font-serif text-3xl">12 day streak</DialogTitle><DialogDescription>Don’t break the chain.</DialogDescription></DialogHeader><div className="grid grid-cols-7 gap-2">{["M","T","W","T","F","S","S"].map((d,i)=><span className={cn("grid aspect-square place-items-center border-2 border-foreground",i<5?"bg-secondary text-secondary-foreground":"bg-primary")}>{d}<small>{i<5?"✓":"·"}</small></span>)}</div><Button onClick={()=>toast.success("Streak Freeze reserved for 100 points")}>Get a Streak Freeze</Button></DialogContent></Dialog>}
function ShareDialog({card,onOpenChange}:{card:ShareCard|null;onOpenChange:(x:boolean)=>void}){const[theme,setTheme]=useState(0);const c=card;const wisdom=!!c?.arabic;return <Dialog open={!!c} onOpenChange={onOpenChange}><DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none"><DialogHeader><DialogTitle className="font-serif text-3xl">{wisdom?"Share this wisdom":"Share your progress"}</DialogTitle><DialogDescription>Choose a card style, then copy it or post it straight to a platform.</DialogDescription></DialogHeader>{c&&<div className={cn("border-2 border-foreground p-8 text-center shadow-brutal",theme===0?"bg-primary":theme===1?"bg-secondary text-secondary-foreground":"bg-foreground text-background")}><p className="text-xs font-bold uppercase">{c.eyebrow}{c.meta?` · ${c.meta}`:""}</p>{c.arabic&&<p className="mt-4 font-arabic text-3xl leading-relaxed" dir="rtl">{c.arabic}</p>}<p className={cn("mt-3",wisdom?"font-serif text-2xl italic leading-snug":"font-serif text-5xl")}>{c.headline}</p><p className="mt-2 text-sm">{c.sub}</p></div>}<div className="flex gap-2">{[0,1,2].map(i=><button key={i} aria-label={`Theme ${i+1}`} onClick={()=>setTheme(i)} className={cn("size-9 border-2 border-foreground",i===0?"bg-primary":i===1?"bg-secondary":"bg-foreground")}/>)}</div>{c&&<ShareActions card={c} onDone={()=>onOpenChange(false)}/>}</DialogContent></Dialog>}

function OnboardingDialog({open,onOpenChange}:{open:boolean;onOpenChange:(x:boolean)=>void}){const[step,setStep]=useState(0);const[interests,setInterests]=useState<string[]>([]);const next=()=>setStep(s=>Math.min(7,s+1));return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto border-2 border-foreground bg-background shadow-brutal sm:max-w-2xl sm:rounded-none"><DialogHeader><p className="text-xs font-bold uppercase">Step {step+1} of 8</p><DialogTitle className="font-serif text-4xl">{["Welcome to IlmStation","Choose your language","Learn. Play. Grow.","Create your account","Build your profile","Choose your interests","Quick assessment","You’re ready, Imran"][step]}</DialogTitle><DialogDescription>Seek · Learn · Grow</DialogDescription></DialogHeader>{step===0&&<div className="grid min-h-56 place-items-center bg-primary"><span className="grid size-24 place-items-center border-2 border-foreground bg-foreground font-serif text-6xl text-background shadow-brutal">I</span></div>}{step===1&&<div className="grid grid-cols-2 gap-2">{["English","العربية","اردو","Bahasa Melayu","Français"].map(x=><Button key={x} variant="outline" onClick={next}>{x}</Button>)}</div>}{step===2&&<div className="grid gap-3 sm:grid-cols-3">{[["Learn","Trusted, structured Islamic knowledge."],["Play","Quizzes that teach after every answer."],["Grow","Visible progress, streaks, and community."]].map(([a,b])=><div className="border-2 border-foreground bg-primary p-5"><h3 className="font-serif text-3xl">{a}</h3><p className="mt-2 text-sm">{b}</p></div>)}</div>}{step===3&&<div className="space-y-3"><Field label="Name" placeholder="Imran Yusuf"/><Field label="Email" type="email" placeholder="imran@example.com"/><Field label="Password" type="password" placeholder="At least 8 characters"/><div className="h-2 border border-foreground"><div className="h-full w-3/4 bg-secondary"/></div><Button variant="outline" className="w-full">Continue with Google</Button></div>}{step===4&&<div className="grid gap-4 sm:grid-cols-2"><Field label="Date of birth" type="date"/><div><p className="text-sm font-semibold">Choose an avatar</p><div className="mt-2 grid grid-cols-4 gap-2">{["I","A","Y","M"].map(x=><button className="grid aspect-square place-items-center border-2 border-foreground bg-primary font-serif text-2xl">{x}</button>)}</div></div><label className="sm:col-span-2 text-sm font-semibold">Learning zone<select className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3"><option>18–25 · University / New Adult</option><option>13–17 · Young Muslim</option><option>26–35 · Parent / Professional</option></select></label></div>}{step===5&&<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{topics.map(t=><Button key={t} variant={interests.includes(t)?"default":"outline"} onClick={()=>setInterests(v=>v.includes(t)?v.filter(x=>x!==t):[...v,t])}>{t}</Button>)}</div>}{step===6&&<div><p className="font-serif text-3xl">How many pillars of Iman are there?</p><div className="mt-4 grid grid-cols-2 gap-2">{["Five","Six","Seven","Eight"].map(x=><Button variant="outline" onClick={next}>{x}</Button>)}</div></div>}{step===7&&<div className="border-2 border-foreground bg-primary p-8 text-center"><Sparkles className="mx-auto size-12"/><p className="mt-4 font-serif text-5xl">+50 XP</p><p className="mt-2">Your Seeker journey begins now.</p></div>}{step!==1&&step!==6&&<Button disabled={step===5&&interests.length===0} onClick={()=>{if(step===7){onOpenChange(false);setStep(0);toast.success("Welcome to IlmStation") } else next()}}>{step===7?"Begin your first quest":"Continue"}</Button>}</DialogContent></Dialog>}
function PlansPanel(){
  const{premium,plan,kids,points,activatePremium,cancelPremium}=usePremium();
  const[custom,setCustom]=useState(false);const[adults,setAdults]=useState(2);const[kidCount,setKidCount]=useState(8);const[email,setEmail]=useState("");
  const current=plans.find(p=>p.id===plan);
  const Step=({label,value,set,min}:{label:string;value:number;set:(n:number)=>void;min:number})=><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-2 border-foreground p-3"><span className="font-semibold">{label}</span><div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" aria-label={`Fewer ${label}`} onClick={()=>set(Math.max(min,value-1))}>−</Button><span className="w-8 text-center font-serif text-2xl">{value}</span><Button type="button" size="sm" variant="outline" aria-label={`More ${label}`} onClick={()=>set(Math.min(200,value+1))}>+</Button></div></div>;
  return <div className="grid gap-5">
    {premium&&<div className="grid grid-cols-1 items-center gap-3 border-2 border-foreground bg-primary p-5 shadow-brutal sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-serif text-2xl">Active: {current?.name??"Premium"}</p><p className="text-sm">{current?.id==="custom"?`Custom · ${kids} kids`:current?.seats}</p></div><Button variant="outline" onClick={()=>{cancelPremium();toast("Premium turned off")}}>Cancel plan</Button></div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.map(p=>{const active=premium&&plan===p.id;return <div key={p.id} className={cn("flex min-w-0 flex-col border-2 border-foreground p-5 shadow-brutal-sm",active?"bg-primary":"bg-background",p.id==="family2"&&!active&&"bg-secondary/10")}>
      {p.id==="family2"&&<span className="mb-2 w-fit border-2 border-foreground bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-secondary-foreground">Most popular</span>}
      <p className="font-serif text-3xl leading-tight">{p.name}</p><p className="mt-1 font-bold">{p.price}</p><p className="text-sm text-muted-foreground">{p.seats}</p>
      <ul className="mt-4 flex-1 space-y-2 text-sm">{p.points.map(x=><li key={x} className="flex gap-2"><ShieldCheck className="size-4 shrink-0"/>{x}</li>)}</ul>
      <Button className="mt-5 w-full" variant={active?"outline":"default"} disabled={active} onClick={()=>{if(p.id==="custom"){setCustom(true);return}activatePremium(p.id);toast.success(`${p.name} plan active (demo — no payment taken)`)}}>{active?"Current plan":p.id==="custom"?"Build a plan":premium?"Switch plan":"Choose plan"}</Button>
    </div>})}</div>
    <Panel title="Prefer to earn it?" tag={`${points} pts`}><p className="text-sm text-muted-foreground">Every Premium reading can also be unlocked one at a time with the points you earn from quests, Hifz reviews and duels — no subscription needed. Kids on a Family plan get IlmBot Junior and Premium Kids Mode.</p></Panel>
    <Dialog open={custom} onOpenChange={setCustom}><DialogContent className="border-2 border-foreground bg-background shadow-brutal sm:rounded-none"><DialogHeader><DialogTitle className="font-serif text-3xl">Build a custom plan</DialogTitle><DialogDescription>Tell us how many people need access. We’ll send a tailored price.</DialogDescription></DialogHeader>
      <form className="grid gap-3" onSubmit={e=>{e.preventDefault();if(!/\S+@\S+\.\S+/.test(email)){toast.error("Enter a valid email");return}activatePremium("custom",kidCount,adults);setCustom(false);toast.success(`Quote requested for ${adults} adults + ${kidCount} kids — trial active meanwhile (demo)`)}}>
        <Step label="Adults" value={adults} set={setAdults} min={1}/><Step label="Kids" value={kidCount} set={setKidCount} min={0}/>
        <p className="text-sm text-muted-foreground">{adults+kidCount} accounts in total · suggested for {kidCount} kids: {Math.max(1,Math.ceil(kidCount/3))} adult{Math.max(1,Math.ceil(kidCount/3))>1?"s":""} <button type="button" className="font-bold underline" onClick={()=>setAdults(Math.max(1,Math.ceil(kidCount/3)))}>Apply</button></p>
        <input type="email" required aria-label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="h-11 border-2 border-foreground bg-background px-3"/>
        <Button type="submit">Request custom quote</Button>
      </form></DialogContent></Dialog>
  </div>;
}
