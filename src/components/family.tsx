import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft, BadgeCheck, Baby, Bell, BookOpen, Check, ChevronRight, Clock, Copy, Eye, Gift,
  Heart, LockKeyhole, Plus, ShieldCheck, Smartphone, Sparkles, Star, Sprout, Trash2, Trophy, UserPlus, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePremium } from "@/components/premium";
import { QuizVisual, visualQuestions, type VisualKind } from "@/components/quiz-visual";
import { createPlayPass, formatCode, revokePlayPass, type PlayPass } from "@/components/playpass";
import {
  badges as badgeList, difficulties, difficultyFor, earnedBadges, isEarned, milestones,
  nextBadge, progressToNext, remainingFor, stageOf, suggestedDifficulty,
  type Difficulty,
} from "@/components/kids-progress";

export type Child = {
  id: string; name: string; age: number; avatar: string; level: string;
  stars: number; streak: number; minutesToday: number; dailyLimit: number;
  garden: number; mastery: number; kindness: number; difficulty: Difficulty;
  perms: { ilmbot: boolean; kidsRooms: boolean; events: boolean; sound: boolean; sharing: boolean };
};

const seedChildren: Child[] = [
  { id: "zayd", name: "Zayd", age: 8, avatar: "🦁", level: "Little Explorer", stars: 348, streak: 6, minutesToday: 14, dailyLimit: 30, garden: 62, mastery: 12, kindness: 6, difficulty: "steady", perms: { ilmbot: true, kidsRooms: false, events: true, sound: true, sharing: false } },
  { id: "maryam", name: "Maryam", age: 6, avatar: "🌸", level: "Seedling", stars: 174, streak: 3, minutesToday: 8, dailyLimit: 20, garden: 35, mastery: 5, kindness: 4, difficulty: "gentle", perms: { ilmbot: false, kidsRooms: false, events: false, sound: true, sharing: false } },
];

const kidQuests = [
  { id: "q1", title: "Say Bismillah", body: "Learn when we say Bismillah and why it matters.", stars: 5, icon: "✨" },
  { id: "q2", title: "The 5 daily prayers", body: "Match each prayer to the time of day.", stars: 8, icon: "🕌" },
  { id: "q3", title: "Surah Al-Ikhlas", body: "Listen, repeat, and read along together.", stars: 10, icon: "📖" },
];

const kidQuiz = [
  { ...visualQuestions.Dua },
  { q: "How many daily prayers are there?", options: ["Three", "Five", "Seven"], answer: 1 },
  { ...visualQuestions.Arabic },
  { ...visualQuestions["Qur’an"] },
] as Array<{ q: string; options: string[]; answer: number; why?: string; visual?: VisualKind }>;

const permLabels: Array<[keyof Child["perms"], string, string]> = [
  ["ilmbot", "IlmBot for kids", "Simplified, filtered answers with no open web access."],
  ["kidsRooms", "Moderated kids circles", "Teacher-led rooms. Off by default; no private messages, ever."],
  ["events", "Family event sign-ups", "Child can request a place; you approve every registration."],
  ["sound", "Sound & recitation", "Audio playback and recitation practice."],
  ["sharing", "Share progress", "Allow a certificate to be shared from your account only."],
];

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} onClick={onChange}
    className={cn("h-8 w-14 shrink-0 border-2 border-foreground p-0.5 shadow-brutal-sm", on ? "bg-secondary" : "bg-muted")}>
    <span className={cn("block size-6 border-2 border-foreground bg-background transition-transform", on && "translate-x-6")} />
  </button>;
}

function Bar({ value, className }: { value: number; className?: string }) {
  return <div className={cn("h-3 w-full border-2 border-foreground bg-background", className)}><div className="h-full bg-secondary" style={{ width: `${Math.min(100, value)}%` }} /></div>;
}

/* ---------------------------------- Kids mode ---------------------------------- */

export function KidsMode({ child, onExit, onEarn }: { child: Child; onExit: () => void; onEarn: (stars: number) => void }) {
  const [view, setView] = useState<"home" | "quiz" | "done">("home");
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | undefined>(undefined);
  const [earned, setEarned] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [exit, setExit] = useState(false);
  const [pin, setPin] = useState("");
  const cfg = difficultyFor(child.difficulty);
  const questions = kidQuiz.slice(0, cfg.questions);
  const question = questions[step];

  const now = { stars: child.stars + earned, streak: child.streak, mastery: child.mastery, kindness: child.kindness };
  const after = { ...now, mastery: child.mastery + correct };
  const upcoming = nextBadge(now);
  const justEarned = view === "done" ? earnedBadges(after).find((b) => !isEarned(b, { stars: child.stars, streak: child.streak, mastery: child.mastery, kindness: child.kindness })) : undefined;

  const answer = (i: number) => {
    if (picked !== undefined) return;
    setPicked(i);
    if (question && i === question.answer) {
      setEarned((e) => e + cfg.starsPerCorrect); setCorrect((c) => c + 1);
      toast.success(`Masha’Allah! +${cfg.starsPerCorrect} points`);
    } else toast(cfg.hints ? "Good try — the answer is highlighted, let’s learn it together." : "Good try — revisit this quest later.");
  };
  const next = () => {
    if (step + 1 < questions.length) { setStep(step + 1); setPicked(undefined); return; }
    onEarn(earned); setView("done");
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-primary">
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="flex items-center gap-3 border-2 border-foreground bg-background p-3 shadow-brutal">
        <span className="grid size-12 place-items-center border-2 border-foreground bg-primary text-2xl">{child.avatar}</span>
        <div className="min-w-0"><b className="block font-serif text-2xl leading-none">Salam, {child.name}!</b><small className="text-muted-foreground">{stageOf(now)} stage · {cfg.name}</small></div>
        <span className="ml-auto flex items-center gap-1 border-2 border-foreground bg-secondary px-3 py-1.5 font-bold text-secondary-foreground"><Star className="size-4 fill-current" />{child.stars + earned}</span>
        <Button variant="outline" size="icon" aria-label="Exit kids mode" onClick={() => setExit(true)}><LockKeyhole /></Button>
      </header>

      {view === "home" && <div className="mt-5 grid gap-4">
        <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Your journey · {stageOf(now)} stage</p>
            <span className="border-2 border-foreground bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{cfg.name} level</span>
          </div>
          {upcoming ? <>
            <h2 className="mt-1 flex items-center gap-2 font-serif text-4xl leading-tight"><Trophy className="size-8 shrink-0" /> Next: {upcoming.name}</h2>
            <Bar value={progressToNext(now)} className="mt-4 h-5" />
            <p className="mt-3 text-sm font-semibold">{remainingFor(now).join(" · ")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{upcoming.meaning}</p>
          </> : <h2 className="mt-1 flex items-center gap-2 font-serif text-4xl"><Trophy className="size-8 shrink-0" /> You have earned every badge, masha’Allah!</h2>}
        </section>

        <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
          <p className="text-xs font-bold uppercase text-muted-foreground">Today’s adventure</p>
          <h2 className="font-serif text-4xl">Three little quests</h2>
          <div className="mt-4 grid gap-3">{kidQuests.map((q, i) => <div key={q.id} className="flex items-center gap-4 border-2 border-foreground bg-muted p-4">
            <span className="grid size-14 shrink-0 place-items-center border-2 border-foreground bg-background text-3xl">{q.icon}</span>
            <div className="min-w-0 flex-1"><b className="block font-serif text-2xl leading-tight">{q.title}</b><small className="text-muted-foreground">{q.body}</small></div>
            <span className="hidden shrink-0 items-center gap-1 font-bold sm:flex"><Star className="size-4 fill-current" />{q.stars}</span>
            <Button size="lg" onClick={() => { setView("quiz"); setStep(Math.min(i, questions.length - 1)); setPicked(undefined); }}>Start</Button>
          </div>)}</div>
        </section>

        <KidsBot name={child.name} />

        <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
          <h3 className="flex items-center gap-2 font-serif text-2xl"><Trophy className="size-5" /> My badge shelf</h3>
          <p className="mt-1 text-sm text-muted-foreground">{earnedBadges(now).length} of {badgeList.length} earned — every one is yours to keep.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{badgeList.map((b) => {
            const got = isEarned(b, now);
            return <div key={b.id} className={cn("border-2 border-foreground p-3 text-center", got ? "bg-primary shadow-brutal-sm" : "bg-muted opacity-60")}>
              <Trophy className={cn("mx-auto size-8", !got && "opacity-40")} />
              <b className="mt-2 block font-serif text-lg leading-tight">{b.name}</b>
              <small className="text-muted-foreground">{got ? b.stage : `${b.points} pts`}</small>
            </div>;
          })}</div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
            <h3 className="flex items-center gap-2 font-serif text-2xl"><Sprout className="size-5" /> My garden</h3>
            <p className="mt-1 text-sm text-muted-foreground">Every quest waters your garden.</p>
            <div className="mt-4 text-5xl">{"🌱".repeat(Math.max(1, Math.round(child.garden / 25)))}</div>
            <Bar value={child.garden} className="mt-4" />
          </section>
          <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
            <h3 className="flex items-center gap-2 font-serif text-2xl"><Sparkles className="size-5" /> Milestones</h3>
            <ul className="mt-4 grid gap-2 text-sm">{milestones.map((m) => <li key={m.at} className={cn("flex items-center gap-2 border-2 border-foreground p-2", now.stars >= m.at ? "bg-secondary text-secondary-foreground" : "bg-muted")}>
              {now.stars >= m.at ? <Check className="size-4 shrink-0" /> : <Star className="size-4 shrink-0" />}<b>{m.label}</b>
            </li>)}</ul>
          </section>
        </div>
      </div>}

      {view === "quiz" && question && <section className="mt-5 border-2 border-foreground bg-background p-6 shadow-brutal">
        <p className="text-xs font-bold uppercase text-muted-foreground">Question {step + 1} of {questions.length} · {cfg.name} level</p>
        <h2 className="mt-2 font-serif text-4xl leading-tight">{question.q}</h2>
        {question.visual && <QuizVisual kind={question.visual} compact />}
        <div className="mt-6 grid gap-3">{question.options.map((o, i) => <Button variant="outline" key={o} onClick={() => answer(i)}
          className={cn("flex min-w-0 items-center gap-3 whitespace-normal break-words border-2 border-foreground p-4 text-left font-serif text-xl shadow-brutal-sm sm:text-2xl",
            picked === undefined && "bg-background hover:bg-primary",
            picked !== undefined && i === question.answer && "bg-secondary text-secondary-foreground",
            picked === i && i !== question.answer && "bg-muted line-through")}>
          <span className="grid size-9 shrink-0 place-items-center border-2 border-foreground bg-background text-base font-bold">{"ABCD"[i]}</span><span className="min-w-0 flex-1">{o}</span>
          {picked !== undefined && i === question.answer && <Check className="ml-auto shrink-0" />}
        </Button>)}</div>
        {picked !== undefined && question.why && <p className="mt-4 border-l-4 border-secondary bg-muted p-3 text-sm">{question.why}</p>}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="lg" onClick={() => setView("home")}>Back</Button>
          <Button size="lg" className="flex-1" disabled={picked === undefined} onClick={next}>{step + 1 < questions.length ? "Next question" : "Finish"} <ChevronRight /></Button>
        </div>
      </section>}

      {view === "done" && <section className="mt-5 border-2 border-foreground bg-background p-8 text-center shadow-brutal">
        <Trophy className="mx-auto size-20" />
        <h2 className="mt-4 font-serif text-5xl">Masha’Allah, {child.name}!</h2>
        <p className="mt-3 text-lg text-muted-foreground">You earned {earned} points and grew your garden.</p>
        {justEarned
          ? <span className="mt-5 inline-block border-2 border-foreground bg-secondary px-4 py-2 font-bold text-secondary-foreground shadow-brutal-sm">New badge unlocked: {justEarned.name}</span>
          : upcoming && <span className="mt-5 inline-block border-2 border-foreground bg-primary px-4 py-2 font-bold shadow-brutal-sm">{remainingFor(after).join(" and ")} until {upcoming.name}</span>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => { setView("home"); setStep(0); setPicked(undefined); setEarned(0); }}>Play again</Button>
          <Button size="lg" variant="outline" onClick={() => setExit(true)}>Finish for today</Button>
        </div>
      </section>}

      <p className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4" /> Kids mode · no chat, no links, guardian exit only</p>
    </div>

    <Dialog open={exit} onOpenChange={setExit}>
      <DialogContent>
        <DialogHeader><DialogTitle>Guardian PIN required</DialogTitle><DialogDescription>Only a parent or guardian can leave kids mode. Demo PIN: 1234</DialogDescription></DialogHeader>
        <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" maxLength={4} placeholder="••••"
          className="h-14 w-full border-2 border-foreground bg-background text-center font-serif text-3xl tracking-[0.5em] outline-none focus:shadow-brutal-sm" />
        <Button className="w-full" onClick={() => { if (pin === "1234") { setExit(false); setPin(""); onExit(); } else toast.error("Incorrect PIN"); }}>Unlock and exit</Button>
      </DialogContent>
    </Dialog>
  </div>;
}

/* --------------------------------- Family hub --------------------------------- */

function PassDialog({ child, onClose }: { child: Child; onClose: () => void }) {
  const [pass, setPass] = useState<PlayPass | undefined>(undefined);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setPass(createPlayPass(child));
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [child.id]);

  const left = pass ? Math.max(0, pass.expiresAt - now) : 0;
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`); }
    catch { toast(`Copy it manually: ${text}`); }
  };

  return <Dialog open onOpenChange={(o) => !o && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Play Pass for {child.name}</DialogTitle>
        <DialogDescription>Enter this code on another phone or tablet at the Kids page. It opens Kids Mode only — never the guardian app.</DialogDescription>
      </DialogHeader>
      {pass && <>
        <div className="border-2 border-foreground bg-primary p-5 text-center shadow-brutal-sm">
          <b className="break-all font-serif text-4xl tracking-[0.08em] sm:text-5xl sm:tracking-[0.15em]">{formatCode(pass.code)}</b>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm font-bold"><Clock className="size-4" /> Expires in {mins}:{String(secs).padStart(2, "0")}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => copy(pass.code, "Code")}><Copy /> Copy code</Button>
          <Button variant="outline" onClick={() => copy(`${window.location.origin}/play?code=${pass.code}`, "Link")}><Smartphone /> Copy link</Button>
        </div>
        <ul className="grid gap-1.5 text-sm text-muted-foreground">
          <li>· Lasts 60 minutes — then the other device locks itself.</li>
          <li>· Stars earned there sync back to {child.name}’s profile.</li>
          <li>· “End pass now” takes effect immediately, even mid-game.</li>
        </ul>
        <Button variant="outline" className="border-destructive text-destructive" onClick={() => { revokePlayPass(pass.code); toast("Play pass ended — the code no longer works"); onClose(); }}>
          <X /> End pass now
        </Button>
      </>}
    </DialogContent>
  </Dialog>;
}

export function FamilyScreen() {
  const [verified, setVerified] = useState<boolean>(() => { try { return localStorage.getItem("iq_guardian_verified") === "1"; } catch { return false; } });
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [children, setChildren] = useState<Child[]>(() => { try { const raw = localStorage.getItem("iq_children"); return raw ? JSON.parse(raw) as Child[] : []; } catch { return []; } });
  const [addOpen, setAddOpen] = useState(false);
  const [active, setActive] = useState<Child | undefined>(undefined);
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [passChild, setPassChild] = useState<Child | undefined>(undefined);
  const [requests, setRequests] = useState([
    { id: "r1", child: "Zayd", text: "Wants to join the moderated “Kids Qur’an Club” circle" },
    { id: "r2", child: "Maryam", text: "Wants 10 extra minutes of learning time today" },
  ]);
  const [newChild, setNewChild] = useState({ name: "", age: "", avatar: "🦊" });
  const { plan, adults, members, inviteAdult, acceptInvite, removeAdult } = usePremium();
  const [inv, setInv] = useState({ name: "", email: "" });
  const seats = adults ?? 1;

  const patch = (id: string, fn: (c: Child) => Child) => setChildren((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));
  const selected = children.find((c) => c.id === detail);

  const persistVerified = (v: boolean) => { try { localStorage.setItem("iq_guardian_verified", v ? "1" : "0"); } catch { /* ignore */ } };
  const persistChildren = (cs: Child[]) => { try { localStorage.setItem("iq_children", JSON.stringify(cs)); } catch { /* ignore */ } };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    setVerified(true); setVerifyOpen(false); setChildren(seedChildren);
    persistVerified(true); persistChildren(seedChildren);
    toast.success("Guardian verified — family controls unlocked");
  };
  const addChild = (e: FormEvent) => {
    e.preventDefault();
    const age = Number(newChild.age);
    if (!newChild.name.trim()) { toast.error("Add the child’s first name"); return; }
    if (!age || age < 3 || age > 15) { toast.error("Age must be between 3 and 15"); return; }
    const created: Child = {
      id: `c${Date.now()}`, name: newChild.name.trim(), age, avatar: newChild.avatar,
      level: age <= 6 ? "Seedling" : "Little Explorer", stars: 0, streak: 0, minutesToday: 0,
      dailyLimit: age <= 6 ? 20 : 30, garden: 5, mastery: 0, kindness: 0,
      difficulty: suggestedDifficulty(age),
      perms: { ilmbot: age >= 8, kidsRooms: false, events: false, sound: true, sharing: false },
    };
    setChildren((cs) => { const next = [...cs, created]; persistChildren(next); return next; });
    setNewChild({ name: "", age: "", avatar: "🦊" }); setAddOpen(false);
    toast.success("Child profile created under your guardianship");
  };

  if (active) return <KidsMode child={active} onExit={() => { toast("Back to guardian view"); setActive(undefined); }}
    onEarn={(s) => patch(active.id, (c) => {
      const grown = { ...c, stars: c.stars + s, garden: Math.min(100, c.garden + 6), minutesToday: c.minutesToday + 5, mastery: c.mastery + (s > 0 ? 1 : 0) };
      const fresh = earnedBadges(grown).find((b) => !isEarned(b, c));
      if (fresh) toast.success(`${c.name} earned the ${fresh.name} badge`);
      return grown;
    })} />;

  return <div className="iq-rise">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase text-muted-foreground">Kids & family</p><h1 className="font-serif text-4xl leading-none sm:text-5xl">Family hub</h1></div>
      {verified && <Button onClick={() => setAddOpen(true)}><Plus /> Add a child</Button>}
    </header>

    {!verified ? <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <section className="border-2 border-foreground bg-primary p-6 shadow-brutal sm:p-8">
        <span className="grid size-14 place-items-center border-2 border-foreground bg-background shadow-brutal-sm"><ShieldCheck className="size-7" /></span>
        <h2 className="mt-5 font-serif text-4xl leading-tight">Children can never sign themselves up.</h2>
        <p className="mt-4 max-w-xl leading-7">A child profile exists only inside a verified parent or guardian account. There is no child login, no child email, and no way for a young learner to create or leave a profile on their own.</p>
        <Button size="lg" className="mt-7" onClick={() => setVerifyOpen(true)}><BadgeCheck /> Verify as parent or guardian</Button>
      </section>
      <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
        <h3 className="font-serif text-2xl">What verification unlocks</h3>
        <ul className="mt-4 grid gap-3 text-sm">{[
          ["Child profiles", "Create, rename, pause, or delete profiles at any time."],
          ["Permissions", "Decide what each child can reach — chat is off by default."],
          ["Screen time", "Set a daily limit; kids mode winds down when it’s reached."],
          ["Difficulty", "Choose Gentle, Steady, or Challenge — and change it any time."],
          ["Progress tracking", "Weekly summaries of quests, stars, and memorisation."],
          ["Approvals", "Every event sign-up and circle request comes to you first."],
        ].map(([t, b]) => <li key={t} className="flex gap-3 border-2 border-foreground p-3"><Check className="mt-0.5 size-5 shrink-0" /><span><b className="block">{t}</b><span className="text-muted-foreground">{b}</span></span></li>)}</ul>
      </section>
    </div> : <div className="mt-6 grid gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {children.map((c) => <article key={c.id} className="border-2 border-foreground bg-background p-5 shadow-brutal">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center border-2 border-foreground bg-primary text-3xl">{c.avatar}</span>
            <div className="min-w-0"><b className="block font-serif text-2xl leading-none">{c.name}</b><small className="text-muted-foreground">{c.age} years · {c.level}</small></div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[[c.stars, "points"], [c.streak, "day streak"], [`${c.minutesToday}/${c.dailyLimit}`, "minutes"]].map(([v, l]) => <div key={String(l)} className="border-2 border-foreground bg-muted p-2"><dt className="font-serif text-xl leading-none">{v}</dt><dd className="text-[10px] font-bold uppercase text-muted-foreground">{l}</dd></div>)}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
            <span className="border-2 border-foreground bg-secondary px-2 py-0.5 text-secondary-foreground">{difficultyFor(c.difficulty).name} level</span>
            <span className="text-muted-foreground">{stageOf(c)} stage · {earnedBadges(c).length}/{badgeList.length} badges</span>
          </div>
          <div className="mt-3 flex gap-1.5">{badgeList.map((b) => <span key={b.id} title={b.name} className={cn("grid size-8 place-items-center border-2 border-foreground", isEarned(b, c) ? "bg-primary" : "bg-muted opacity-50")}><Trophy className="size-4" /></span>)}</div>
          <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">{nextBadge(c) ? `Toward ${nextBadge(c)?.name}` : "All badges earned"}</p>
          <Bar value={progressToNext(c)} className="mt-1" />
          <div className="mt-5 flex gap-2">
            <Button className="flex-1" onClick={() => setActive(c)}><Sparkles /> Kids mode</Button>
            <Button variant="outline" onClick={() => setDetail(c.id)}>Manage</Button>
          </div>
        </article>)}
        <button onClick={() => setAddOpen(true)} className="grid min-h-56 place-items-center border-2 border-dashed border-foreground p-5 text-center hover:bg-muted">
          <span><Baby className="mx-auto size-8" /><b className="mt-3 block font-serif text-2xl">Add another child</b><small className="text-muted-foreground">Created and owned by you</small></span>
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border-2 border-foreground bg-background shadow-brutal">
          <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2"><h2 className="font-serif text-xl">Waiting for your approval</h2><span className="text-xs font-semibold uppercase text-muted-foreground">{requests.length} pending</span></div>
          <div className="grid gap-3 p-4">
            {requests.length === 0 ? <p className="text-sm text-muted-foreground">Nothing pending. Requests from your children appear here.</p> :
              requests.map((r) => <div key={r.id} className="border-2 border-foreground p-3">
                <b className="font-serif text-lg">{r.child}</b><p className="text-sm text-muted-foreground">{r.text}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => { setRequests((x) => x.filter((i) => i.id !== r.id)); toast.success(`Approved for ${r.child}`); }}><Check /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => { setRequests((x) => x.filter((i) => i.id !== r.id)); toast(`Declined — ${r.child} was told kindly`); }}><X /> Decline</Button>
                </div>
              </div>)}
          </div>
        </section>
        <section className="border-2 border-foreground bg-secondary text-secondary-foreground shadow-brutal">
          <div className="border-b-2 border-foreground px-4 py-2"><h2 className="font-serif text-xl">Safety, by default</h2></div>
          <ul className="grid gap-3 p-4 text-sm">{([
            [Eye, "No public profile, no real name shown, no discoverability."],
            [LockKeyhole, "Private messaging is impossible for child profiles."],
            [ShieldCheck, "Only teacher-moderated circles, and only if you switch them on."],
            [Clock, "Daily limit ends the session gently with a dua screen."],
            [Bell, "You get a weekly summary of everything your child did."],
          ] as const).map(([Icon, t]) => <li key={t} className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0" />{t}</li>)}</ul>
        </section>
      </div>

      <section className="border-2 border-foreground bg-background shadow-brutal">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground px-4 py-2"><h2 className="font-serif text-xl">Adults on your plan</h2><span className="text-xs font-semibold uppercase text-muted-foreground">{1 + (members?.length ?? 0)} / {seats} seats</span></div>
        <div className="grid gap-3 p-4">
          {seats > 1 ? <>
            <p className="text-sm text-muted-foreground">Invite another parent or guardian. They get their own login and full Premium, and can help manage the children in this hub after accepting.</p>
            <ul className="grid gap-2">
              <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-2 border-foreground p-3"><div className="min-w-0"><p className="break-words font-semibold">You</p><p className="text-xs text-muted-foreground">Plan owner{plan ? ` · ${plan === "custom" ? "Custom plan" : "Family · 5 Kids"}` : ""}</p></div><span className="border-2 border-foreground bg-primary px-2 py-0.5 text-[10px] font-bold uppercase">Owner</span></li>
              {(members ?? []).map((m) => <li key={m.id} className="grid grid-cols-1 items-center gap-2 border-2 border-foreground p-3 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><p className="break-words font-semibold">{m.name}</p><p className="break-all text-xs text-muted-foreground">{m.email} · {m.status === "invited" ? "Invite sent" : "Active"}</p></div><div className="flex flex-wrap gap-2">{m.status === "invited" && <><Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/?invite=${m.id}`); toast.success("Invite link copied"); }}>Copy link</Button><Button size="sm" variant="outline" onClick={() => { acceptInvite(m.id); toast.success(`${m.name} joined your plan (demo)`); }}>Mark accepted</Button></>}<Button size="sm" variant="outline" onClick={() => { removeAdult(m.id); toast(`${m.name} removed from your plan`); }}>Remove</Button></div></li>)}
            </ul>
            {(members?.length ?? 0) < seats - 1 ? <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={(e) => { e.preventDefault(); const name = inv.name.trim(), email = inv.email.trim(); if (!name) { toast.error("Enter their name"); return; } if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Enter a valid email"); return; } const r = inviteAdult(name, email); if (r === "duplicate") { toast.error("That email is already on your plan"); return; } if (r === "full") { toast.error("All adult seats are taken"); return; } setInv({ name: "", email: "" }); toast.success(`Invite sent to ${email} (demo)`); }}>
              <input aria-label="Adult name" value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} placeholder="Their name" className="h-11 border-2 border-foreground bg-background px-3" />
              <input type="email" aria-label="Adult email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="their@email.com" className="h-11 border-2 border-foreground bg-background px-3" />
              <Button type="submit"><UserPlus /> Send invite</Button>
            </form> : <p className="text-sm font-semibold">All adult seats are filled. Remove someone or upgrade to add more.</p>}
          </> : <p className="text-sm text-muted-foreground"><b className="font-semibold text-foreground">Need a second grown-up?</b> {plan ? "Your current plan includes one adult seat." : "Inviting another parent or guardian is part of our Family plans."} The Family · 5 Kids plan (2 adults) and Custom plans let you invite them with their own login — see <b className="font-semibold text-foreground">Rewards → Premium</b>.</p>}
        </div>
      </section>
    </div>}

    <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Guardian verification</DialogTitle><DialogDescription>Confirm you are the parent or legal guardian of the child you are adding.</DialogDescription></DialogHeader>
        <form onSubmit={verify} className="grid gap-3">
          <label className="text-sm font-semibold">Full legal name<input required className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="Halima Rabiu Mustapha" /></label>
          <label className="text-sm font-semibold">Relationship to child
            <select required className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm">
              <option>Parent</option><option>Legal guardian</option><option>Foster carer</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Date of birth (18+)<input required type="date" className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" /></label>
          <label className="flex items-start gap-3 border-2 border-foreground p-3 text-sm"><input required type="checkbox" className="mt-1 size-4" /><span>I confirm I am 18 or older and the parent or legal guardian, and I consent to managing this child’s learning account.</span></label>
          <Button type="submit"><BadgeCheck /> Complete verification</Button>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={addOpen} onOpenChange={setAddOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a child profile</DialogTitle><DialogDescription>No email, no password, no login for the child. This profile lives inside your account.</DialogDescription></DialogHeader>
        <form onSubmit={addChild} className="grid gap-3">
          <label className="text-sm font-semibold">First name only<input value={newChild.name} onChange={(e) => setNewChild({ ...newChild, name: e.target.value })} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="Zayd" /></label>
          <label className="text-sm font-semibold">Age (3–15)<input value={newChild.age} onChange={(e) => setNewChild({ ...newChild, age: e.target.value })} inputMode="numeric" className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="8" /></label>
          <div><p className="text-sm font-semibold">Choose an avatar</p><div className="mt-2 flex flex-wrap gap-2">{["🦊", "🦁", "🌸", "🐿️", "🌙", "⭐", "🐫", "🕊️"].map((a) => <button type="button" key={a} onClick={() => setNewChild({ ...newChild, avatar: a })} className={cn("grid size-12 place-items-center border-2 border-foreground text-2xl", newChild.avatar === a ? "bg-primary shadow-brutal-sm" : "bg-background")}>{a}</button>)}</div></div>
          <p className="border-2 border-foreground bg-muted p-3 text-sm">Age sets the starting difficulty level, daily limit, and gamification — you can adjust all of it afterwards. Chat stays off until you turn it on.</p>
          <Button type="submit"><Plus /> Create profile</Button>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={!!selected} onOpenChange={(o) => !o && setDetail(undefined)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {selected && <>
          <DialogHeader><DialogTitle>{selected.avatar} {selected.name}’s controls</DialogTitle><DialogDescription>Changes apply immediately on every device.</DialogDescription></DialogHeader>
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-semibold">Difficulty level</p>
              <p className="text-sm text-muted-foreground">Sets quest length, question depth, and how many points each answer is worth. Suggested for age {selected.age}: {difficultyFor(suggestedDifficulty(selected.age)).name}.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">{difficulties.map((d) => <button key={d.id} type="button"
                onClick={() => { patch(selected.id, (c) => ({ ...c, difficulty: d.id })); toast.success(`${selected.name}’s level set to ${d.name}`); }}
                className={cn("border-2 border-foreground p-3 text-left", selected.difficulty === d.id ? "bg-secondary text-secondary-foreground shadow-brutal-sm" : "bg-background hover:bg-muted")}>
                <b className="block font-serif text-lg leading-none">{d.name}</b>
                <small className="mt-1 block text-xs font-semibold uppercase opacity-80">{d.forAges}</small>
                <small className="mt-1 block text-xs leading-snug">{d.blurb}</small>
              </button>)}</div>
            </div>
            <div>
              <p className="flex items-center justify-between text-sm font-semibold"><span>Daily learning limit</span><span>{selected.dailyLimit} min</span></p>
              <input type="range" min={10} max={60} step={5} value={selected.dailyLimit} onChange={(e) => patch(selected.id, (c) => ({ ...c, dailyLimit: Number(e.target.value) }))} className="mt-2 w-full accent-[var(--color-secondary)]" />
            </div>
            <div className="grid gap-2">{permLabels.map(([key, label, body]) => <div key={key} className="flex items-start gap-3 border-2 border-foreground p-3">
              <span className="min-w-0 flex-1 text-sm"><b className="block">{label}</b><span className="text-muted-foreground">{body}</span></span>
              <Toggle label={label} on={selected.perms[key]} onChange={() => { patch(selected.id, (c) => ({ ...c, perms: { ...c.perms, [key]: !c.perms[key] } })); toast.success(`${label} ${selected.perms[key] ? "turned off" : "turned on"} for ${selected.name}`); }} />
            </div>)}</div>
            <section className="border-2 border-foreground bg-background p-4">
              <h3 className="font-serif text-xl">Badge journey</h3>
              <p className="text-sm text-muted-foreground">{earnedBadges(selected).length} of {badgeList.length} earned · {stageOf(selected)} stage. Badges are personal — children are never ranked against each other.</p>
              {nextBadge(selected) && <div className="mt-3 border-2 border-foreground bg-muted p-3">
                <p className="flex items-center justify-between text-sm font-semibold"><span>Next: {nextBadge(selected)?.name}</span><span>{progressToNext(selected)}%</span></p>
                <Bar value={progressToNext(selected)} className="mt-2" />
                <p className="mt-2 text-xs text-muted-foreground">Still needs: {remainingFor(selected).join(", ")}</p>
              </div>}
              <ul className="mt-3 grid gap-2">{badgeList.map((b) => <li key={b.id} className={cn("flex items-start gap-3 border-2 border-foreground p-2 text-sm", isEarned(b, selected) ? "bg-primary" : "bg-background opacity-70")}>
                <Trophy className={cn("size-5 shrink-0", !isEarned(b, selected) && "opacity-40")} />
                <span><b className="block">{b.name}</b><span className="text-muted-foreground">{b.criteria}</span></span>
              </li>)}</ul>
            </section>
            <section className="border-2 border-foreground bg-muted p-4">
              <h3 className="font-serif text-xl">This week</h3>
              <ul className="mt-3 grid gap-2 text-sm">
                <li className="flex justify-between"><span><BookOpen className="mr-2 inline size-4" />Quests completed</span><b>{6 + selected.streak}</b></li>
                <li className="flex justify-between"><span><Star className="mr-2 inline size-4" />Points earned</span><b>{selected.stars}</b></li>
                <li className="flex justify-between"><span><Trophy className="mr-2 inline size-4" />Passed first try</span><b>{selected.mastery}</b></li>
                <li className="flex justify-between"><span><Heart className="mr-2 inline size-4" />Kind acts noticed</span><b>{selected.kindness}</b></li>
                <li className="flex justify-between"><span><Sprout className="mr-2 inline size-4" />Surahs practised</span><b>Al-Fatihah, Al-Ikhlas</b></li>
                <li className="flex justify-between"><span><Clock className="mr-2 inline size-4" />Average session</span><b>{Math.max(6, selected.dailyLimit - 12)} min</b></li>
              </ul>
            </section>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => toast.success(`Weekly summary for ${selected.name} sent to your inbox`)}><Bell /> Email summary</Button>
              <Button variant="outline" onClick={() => setPassChild(selected)}><Smartphone /> Play on another device</Button>
              <Button variant="outline" onClick={() => { toast(`${selected.name}’s profile paused`); setDetail(undefined); }}><Clock /> Pause profile</Button>
              <Button variant="outline" className="border-destructive text-destructive" onClick={() => { setChildren((cs) => { const next = cs.filter((c) => c.id !== selected.id); persistChildren(next); return next; }); setDetail(undefined); toast("Profile and all its data deleted"); }}><Trash2 /> Delete profile</Button>
            </div>
          </div>
        </>}
      </DialogContent>
    </Dialog>
    {passChild && <PassDialog child={passChild} onClose={() => setPassChild(undefined)} />}
  </div>;
}

/* ------------------------------ Sponsorship page ------------------------------ */

const tiers = [
  { id: "seed", name: "Seed a learner", amount: "₦5,000", per: "per month", covers: "1 child’s full learning year", tint: "bg-background", perks: ["One sponsored child profile", "Quarterly impact note", "Named in the sponsors wall"] },
  { id: "circle", name: "Sponsor a circle", amount: "₦45,000", per: "per month", covers: "A weekend halaqah of 15 learners", tint: "bg-primary", perks: ["15 learners for a full term", "Teacher stipend contribution", "Circle photos and progress report", "Sponsor certificate"] },
  { id: "centre", name: "Partner a centre", amount: "Custom", per: "organisations", covers: "A whole centre, term by term", tint: "bg-secondary text-secondary-foreground", perks: ["Named centre programme", "Branded presence at events", "CSR impact reporting", "Dedicated partnership lead"] },
] as const;

export function SponsorshipSection() {
  return <section id="sponsorship" className="border-y-2 border-foreground bg-muted">
    <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase text-muted-foreground">Sadaqah jariyah</p><h2 className="font-serif text-5xl">Sponsor a learner’s whole year.</h2></div>
        <p className="max-w-md text-muted-foreground">₦5,000 a month keeps one child in structured, teacher-guided learning — and the reward continues with every ayah they carry.</p>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">{tiers.map((t) => <article key={t.id} className={cn("flex flex-col border-2 border-foreground p-6 shadow-brutal", t.tint)}>
        <p className="text-xs font-bold uppercase">{t.name}</p>
        <p className="mt-3 font-serif text-5xl leading-none">{t.amount}</p>
        <small className="mt-1 font-semibold">{t.per}</small>
        <p className="mt-4 border-t-2 border-foreground pt-4 font-serif text-xl leading-tight">{t.covers}</p>
        <ul className="mt-4 grid flex-1 gap-2 text-sm">{t.perks.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" />{p}</li>)}</ul>
        <Button asChild className="mt-6 w-full" variant={t.id === "circle" ? "secondary" : "default"}><a href="/sponsorship">Sponsor this <ChevronRight /></a></Button>
      </article>)}</div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-2 border-foreground bg-foreground p-6 text-background shadow-brutal">
        <p className="font-serif text-3xl">Organisations, masjids, and CSR teams welcome.</p>
        <Button asChild size="lg" className="border-2 border-background bg-primary text-foreground"><a href="/sponsorship"><Heart /> Explore sponsorship</a></Button>
      </div>
    </div>
  </section>;
}

export function SponsorshipPage() {
  const [tier, setTier] = useState<string>("circle");
  const [learners, setLearners] = useState(15);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", org: "", note: "" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Please add your name"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Please add a valid email address"); return; }
    setOpen(false); setDone(true);
    toast.success("Sponsorship enquiry received — we’ll respond within 2 working days");
  };

  return <main>
    <section className="border-b-2 border-foreground">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.2fr_.8fr]">
        <div className="px-4 py-16 sm:px-8 sm:py-24 lg:border-r-2 lg:border-foreground lg:px-14">
          <p className="mb-5 text-xs font-bold uppercase">Sponsorship & partnership</p>
          <h1 className="max-w-3xl break-words font-serif text-5xl leading-[.92] sm:text-7xl">Give knowledge.<br /><em className="text-secondary">Keep earning.</em></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">Every sponsored place funds lessons, a teacher’s time, and a safe learning space for a child or young adult who otherwise could not attend.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setOpen(true)}><Heart /> Become a sponsor</Button>
            <Button size="lg" variant="outline" asChild><a href="#impact">See the impact</a></Button>
          </div>
        </div>
        <div className="grid grid-cols-2 bg-primary">
          {[["1,240", "learners sponsored"], ["38", "circles funded"], ["9", "partner centres"], ["100%", "to programmes"]].map(([v, l]) => <div key={l} className="flex min-h-40 flex-col justify-end border-b-2 border-r-2 border-foreground p-6 last:border-r-0 even:border-r-0"><b className="font-serif text-5xl">{v}</b><span className="text-sm font-semibold">{l}</span></div>)}
        </div>
      </div>
    </section>

    <SponsorshipSection />

    <section id="impact" className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">Impact calculator</p>
          <h2 className="font-serif text-5xl">See what your sponsorship does.</h2>
          <p className="mt-4 text-muted-foreground">Move the slider to the number of learners you’d like to support, then send an enquiry — no payment is taken here.</p>
          <label className="mt-8 block text-sm font-semibold">Learners sponsored: {learners}</label>
          <input type="range" min={1} max={100} value={learners} onChange={(e) => setLearners(Number(e.target.value))} className="mt-3 w-full accent-[var(--color-secondary)]" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[[`₦${(learners * 5000).toLocaleString()}`, "per month"], [`${learners * 4}`, "lessons weekly"], [`${Math.max(1, Math.round(learners / 15))}`, "circles enabled"]].map(([v, l]) => <div key={l} className="border-2 border-foreground bg-primary p-4 shadow-brutal"><b className="block font-serif text-3xl leading-none">{v}</b><small className="font-semibold">{l}</small></div>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setOpen(true)}>Sponsor {learners} learners</Button>
            <Button size="lg" variant="outline" onClick={() => toast.success("Sponsorship brochure download started")}><Gift /> Download brochure</Button>
          </div>
        </div>
        <div className="grid gap-4">
          {[["Where your money goes", [["Teaching and stipends", 55], ["Learning materials", 20], ["Centre running costs", 18], ["Safeguarding & training", 7]]] as const].map(([title, rows]) => <section key={title} className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h3 className="font-serif text-2xl">{title}</h3>
            <ul className="mt-4 grid gap-4">{rows.map(([l, v]) => <li key={l}><p className="flex justify-between text-sm font-semibold"><span>{l}</span><span>{v}%</span></p><Bar value={v} className="mt-1" /></li>)}</ul>
          </section>)}
          <figure className="border-2 border-foreground bg-secondary p-6 text-secondary-foreground shadow-brutal">
            <p className="font-arabic text-3xl" dir="rtl">مَن دَلَّ عَلَىٰ خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ</p>
            <blockquote className="mt-3 font-serif text-2xl leading-snug">“Whoever guides someone to good will have a reward like the one who does it.”</blockquote>
            <figcaption className="mt-3 text-sm">Sahih Muslim</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section className="border-y-2 border-foreground bg-muted">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase text-muted-foreground">Simple process</p>
        <h2 className="font-serif text-5xl">How sponsorship works</h2>
        <div className="mt-8 grid gap-px border-2 border-foreground bg-foreground shadow-brutal md:grid-cols-4">
          {[["01", "Tell us your intention", "Share how many learners or which programme you’d like to support."],
            ["02", "We match you", "You’re matched to a real child, circle, or centre with a genuine need."],
            ["03", "Set it up", "Choose monthly or one-off. Stop or change it whenever you need to."],
            ["04", "Follow the journey", "Quarterly reports, progress notes, and invitations to the circle."]].map(([n, t, b]) => <div key={n} className="bg-background p-6"><b className="font-serif text-5xl text-secondary">{n}</b><h3 className="mt-4 font-serif text-2xl">{t}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{b}</p></div>)}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">Take action</p>
          <h2 className="font-serif text-5xl">Start a sponsorship.</h2>
          <p className="mt-4 text-muted-foreground">Tell us a little about you and we’ll come back with a matched learner or circle. Individuals and organisations both welcome.</p>
          <div className="mt-6 grid gap-2 text-sm">
            {[["Choose your tier", "Seed, circle, or centre partnership."], ["No payment here", "This is an enquiry — nothing is charged."], ["Full transparency", "Every sponsorship comes with reporting."]].map(([t, b]) => <p key={t} className="flex gap-3 border-2 border-foreground bg-background p-3"><Check className="mt-0.5 size-4 shrink-0" /><span><b>{t}</b> — <span className="text-muted-foreground">{b}</span></span></p>)}
          </div>
        </div>
        <div className="border-2 border-foreground bg-background p-6 shadow-brutal">
          {done ? <div className="py-10 text-center">
            <span className="mx-auto grid size-16 place-items-center border-2 border-foreground bg-secondary text-secondary-foreground shadow-brutal-sm"><Check className="size-8" /></span>
            <h3 className="mt-5 font-serif text-4xl">Jazak Allahu khayran</h3>
            <p className="mt-3 text-muted-foreground">Your enquiry is with our partnerships team. We reply within two working days.</p>
            <Button className="mt-6" variant="outline" onClick={() => { setDone(false); setForm({ name: "", email: "", org: "", note: "" }); }}>Send another enquiry</Button>
          </div> : <>
            <h3 className="font-serif text-3xl">Sponsorship enquiry</h3>
            <div className="mt-4 flex flex-wrap gap-2">{tiers.map((t) => <button key={t.id} onClick={() => setTier(t.id)} className={cn("border-2 border-foreground px-3 py-2 text-sm font-bold", tier === t.id ? "bg-primary shadow-brutal-sm" : "bg-background")}>{t.name}</button>)}</div>
            <form onSubmit={submit} className="mt-5 grid gap-3">
              <label className="text-sm font-semibold">Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="Halima Rabiu" /></label>
              <label className="text-sm font-semibold">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="you@example.com" /></label>
              <label className="text-sm font-semibold">Organisation (optional)<input value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="Company, masjid, or foundation" /></label>
              <label className="text-sm font-semibold">Anything we should know?<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="mt-1 w-full border-2 border-foreground bg-background p-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="We’d like to sponsor a weekend circle in Kano." /></label>
              <Button type="submit" size="lg"><Heart /> Send enquiry</Button>
            </form>
          </>}
        </div>
      </div>
    </section>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Become a sponsor</DialogTitle><DialogDescription>Sponsoring {learners} learner{learners > 1 ? "s" : ""} · ₦{(learners * 5000).toLocaleString()} per month. No payment is taken in this demo.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <label className="text-sm font-semibold">Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="Halima Rabiu" /></label>
          <label className="text-sm font-semibold">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-11 w-full border-2 border-foreground bg-background px-3 font-normal outline-none focus:shadow-brutal-sm" placeholder="you@example.com" /></label>
          <Button type="submit"><ArrowLeft className="hidden" /><Heart /> Confirm enquiry</Button>
        </form>
      </DialogContent>
    </Dialog>
  </main>;
}

const kidBotAnswers: Record<string, string> = {
  "Who made the stars?": "Allah made the stars, the moon and the sun! He put them in the sky to light up the night and to help people find their way. ✨",
  "Why do we pray?": "We pray to talk to Allah and say thank you for everything He gives us. Five times a day is like five little visits with Allah. 🤲",
  "Tell me a Prophet story": "Prophet Nuh (AS) built a giant ark because Allah told him to. People laughed, but he kept going with patience — and Allah kept him and the animals safe! 🚢",
  "What is sadaqah?": "Sadaqah is giving to help others — money, food, or even a smile! The Prophet ﷺ said a smile is sadaqah. 😊",
};

/** Child-safe IlmBot: suggested questions plus a short free-text box. */
function KidsBot({ name }: { name: string }) {
  const [chat, setChat] = useState<{ from: "kid" | "bot"; text: string }[]>([]);
  const [text, setText] = useState("");
  const ask = (q: string) => {
    const clean = q.trim().slice(0, 120);
    if (!clean) return;
    const answer = kidBotAnswers[clean] ?? "Great question! That’s a good one to explore with your grown-up too. Here’s a little fact: the Qur’an has 114 surahs, and the shortest is Al-Kawthar! 📖";
    setChat((c) => [...c, { from: "kid", text: clean }, { from: "bot", text: answer }]);
    setText("");
  };
  return <section className="border-2 border-foreground bg-background p-5 shadow-brutal">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 font-serif text-2xl">🤖 Ask IlmBot Junior</h3>
      <span className="border-2 border-foreground bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">Kid-safe</span>
    </div>
    <p className="mt-1 text-sm text-muted-foreground">Hi {name}! Ask me about Allah, the Prophets, and being kind. Your grown-up can see what we talk about.</p>
    {chat.length > 0 && <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">{chat.map((m, i) => <p key={i} className={cn("max-w-[85%] break-words border-2 border-foreground p-3 text-sm", m.from === "kid" ? "ml-auto bg-primary" : "bg-muted")}>{m.text}</p>)}</div>}
    <div className="mt-4 flex flex-wrap gap-2">{Object.keys(kidBotAnswers).map((q) => <Button key={q} variant="outline" size="sm" onClick={() => ask(q)}>{q}</Button>)}</div>
    <form className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
      <input aria-label="Ask IlmBot Junior" value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder="Type a question…" className="h-11 border-2 border-foreground bg-background px-3" />
      <Button type="submit" disabled={!text.trim()}>Ask</Button>
    </form>
  </section>;
}
