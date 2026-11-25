import { UserRound as WhoAdult, Baby as WhoChild } from "lucide-react";
import { createUserWithEmailAndPassword as cuParent, signInWithCustomToken as sictKid, signInWithEmailAndPassword as siParent, signInWithPopup as popParent, GoogleAuthProvider as GoogleParent } from "firebase/auth";
import { doc as dK, getDoc as gK, setDoc as sK } from "firebase/firestore";
import { auth as aK, db as dbK } from "@/lib/firebase";
import { useEffect as useEffectL, useState as useStateL } from "react";
import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { useEffect as useGEffect, useState as useGState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth as resetAuth } from "@/lib/firebase";
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, AtSign, Check, Eye, EyeOff, Gem, LockKeyhole, Search, User, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { languages, useLanguage, type Lang } from "@/components/language";
import { QuizVisual, quizQuestionsFor, type VisualQuestion } from "@/components/quiz-visual";
import {
  isEmailRegistered, isUsernameAvailable, isValidEmail, isValidUsername, normaliseEmail, normaliseUsername, passwordRules, useAuth,
  type Gender, type Level, type Zone,
} from "@/components/auth";
import { cn } from "@/lib/utils";

/* ------------------------------- Shared shell ------------------------------ */

const inputClass = "h-12 w-full rounded-2xl border-0 bg-foreground/[0.06] pl-11 pr-3 font-mono text-sm sm:rounded-none sm:border-2 sm:border-foreground sm:bg-background sm:pl-10 sm:font-sans sm:text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function AuthShell({ aside, children, mode }: { aside: ReactNode; children: ReactNode; mode: "login" | "signup" }) {
  const { loggedIn } = useAuth();
  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b-2 border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3"><span className="grid size-10 shrink-0 place-items-center bg-foreground font-serif text-2xl text-background">I</span><strong className="truncate font-serif text-xl font-normal">IlmStation</strong></Link>
        <ThemeToggle className="ml-auto" />
        {!loggedIn && (mode === "signup"
          ? <Button asChild variant="outline" size="sm"><Link to="/login">Log in</Link></Button>
          : <Button asChild size="sm"><Link to="/signup">Get started</Link></Button>)}
      </div>
    </header>
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="hidden flex-col justify-between border-r-2 border-foreground bg-foreground p-10 text-background lg:flex">{aside}</aside>
      <main className="flex justify-center px-4 py-10 sm:px-6 sm:py-14"><div className="w-full max-w-xl">{children}</div></main>
    </div>
  </div>;
}

function Field({ label, icon: Icon, error, hint, children }: { label: string; icon: typeof User; error?: string | undefined; hint?: ReactNode; children: ReactNode }) {
  return <label className="block">
    <span className="text-sm font-semibold">{label}</span>
    <span className="relative mt-1.5 block"><Icon aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-70 sm:left-3 sm:opacity-100" />{children}</span>
    {hint}
    {error && <span role="alert" className="mt-1.5 block text-sm font-semibold text-destructive">{error}</span>}
  </label>;
}

function PasswordInput({ value, onChange, placeholder, autoComplete, invalid }: { value: string; onChange: (v: string) => void; placeholder: string; autoComplete: string; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return <>
    <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={invalid} className={cn(inputClass, "pr-12")} />
    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center hover:bg-muted">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
  </>;
}

/* ---------------------------------- Login ---------------------------------- */

export function LoginPage() {
  const [who, setWho] = useStateL<null | "adult" | "kid">(null);
  const kid = who === "kid";
  void useEffectL;
  const { logIn, loggedIn, account, firstName, logOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const loginEmail = email.includes("@") ? email : `${email.trim().toLowerCase()}@kids.ilmstation.com`;
    if (!isValidEmail(loginEmail)) { setError("Enter your email, or your username if a parent made your account."); return; }
    if (!password) { setError("Enter your password."); return; }
    setBusy(true);
    const problem = await logIn(loginEmail, password);
    setBusy(false);
    if (problem) { setError(problem); return; }
    toast.success(`Welcome back${account ? `, ${account.name.split(/\s+/)[0]}` : ""}`);
    if (backToCity()) return;
    void navigate({ to: "/app" });
  };

  const aside = <>
    <p className="text-xs font-bold uppercase text-background/60">Welcome back</p>
    <div>
      <p className="font-arabic text-4xl leading-relaxed" dir="rtl" lang="ar">وَقُل رَّبِّ زِدْنِي عِلْمًا</p>
      <p className="mt-4 font-serif text-5xl leading-[1]">“My Lord, increase me in knowledge.”</p>
      <p className="mt-3 text-sm text-background/70">Ta-Ha 20:114</p>
    </div>
    <p className="max-w-sm text-sm text-background/70">Your streak, badges and Hifz plan are waiting where you left them.</p>
  </>;

  return <AuthShell mode="login" aside={aside}>
    {loggedIn ? <div className="border-2 border-foreground bg-primary p-6 shadow-brutal">
      <p className="text-xs font-bold uppercase">Already signed in</p>
      <h1 className="mt-2 font-serif text-4xl">Assalamu alaikum, {firstName}</h1>
      <p className="mt-2 text-sm">You’re logged in as {account?.email}.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild className="bg-foreground text-background"><Link to="/app">Open dashboard <ArrowRight /></Link></Button>
        <Button variant="outline" onClick={() => { logOut(); toast("Logged out"); }}>Log out</Button>
      </div>
    </div> : <>
      <p className="text-xs font-bold uppercase text-secondary">Seek · Learn · Grow</p>
      <h1 className="mt-2 font-serif text-5xl leading-none sm:text-6xl">Log in</h1>
      <p className="mt-3 text-muted-foreground">Pick up today’s quest where you left it.</p>
      {!who ? <div data-login-pick className="mt-6 grid gap-3">
        <button type="button" onClick={() => setWho("adult")} className="flex w-full items-center gap-4 rounded-3xl border-2 border-foreground p-5 text-left shadow-[0_5px_0_var(--foreground)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--foreground)] bg-primary">
          <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-foreground bg-background text-foreground"><WhoAdult className="size-8" /></span>
          <span><b className="block text-xl">Teen & Adult</b><span className="text-sm text-muted-foreground">Log in with Google or your email</span></span>
        </button>
        <button type="button" onClick={() => setWho("kid")} className="flex w-full items-center gap-4 rounded-3xl border-2 border-foreground p-5 text-left shadow-[0_5px_0_var(--foreground)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--foreground)] bg-secondary text-secondary-foreground">
          <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-foreground bg-background text-foreground"><WhoChild className="size-8" /></span>
          <span><b className="block text-xl">Child</b><span className="text-sm text-muted-foreground">Log in with the username your parent gave you</span></span>
        </button>
        <p className="mt-3 text-sm">New to IlmStation? <a href="/signup" className="font-bold underline underline-offset-4">Create an account</a></p>
      </div> : <div className="mb-4 mt-5 flex items-center justify-between rounded-full bg-foreground/[0.06] py-2 pl-2 pr-4 sm:rounded-none sm:border-2 sm:border-foreground sm:bg-transparent sm:px-4 sm:py-3">
        <b className="flex items-center gap-2"><span className={`grid size-8 place-items-center rounded-full ${kid ? "bg-secondary text-secondary-foreground" : "bg-primary"}`}>{kid ? <WhoChild className="size-4" /> : <WhoAdult className="size-4" />}</span>{kid ? "Child" : "Teen & Adult"}</b>
        <button type="button" onClick={() => setWho(null)} className="text-sm font-semibold underline underline-offset-4">Change</button>
      </div>}
      {!who && <style>{"[data-login-pick] ~ *{display:none!important}"}</style>}
      {who && (kid ? <p className="mt-4 border-2 border-foreground bg-primary/25 p-3 text-sm font-semibold">👋 Ask your parent for your username and password.</p> : <GoogleButton />)}
        <form noValidate onSubmit={submit} className="mt-8 grid gap-5">
        <Field label={kid ? "Username" : "Email address"} icon={AtSign}>
          <input type="text" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder={kid ? "e.g. amina_10" : "Email address"} autoComplete="username" autoCapitalize="none" className={inputClass} />
        </Field>
        <Field label="Password" icon={LockKeyhole} hint={kid ? <p className="mt-1.5 text-sm text-muted-foreground">Forgot it? Ask your parent.</p> : <button type="button" onClick={() => void resetPassword()} className="mt-1.5 text-sm font-semibold underline underline-offset-4">Forgot password?</button>}>
          <PasswordInput value={password} onChange={(v) => { setPassword(v); setError(""); }} placeholder="Your password" autoComplete="current-password" />
        </Field>
        {error && <p role="alert" className="border-2 border-destructive p-3 text-sm font-semibold text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={busy} className="w-full">{busy ? "Logging in…" : "Log in"} <ArrowRight /></Button>
      </form>
      <p className="mt-8 border-t-2 border-foreground pt-5 text-sm">New to IlmStation? <Link to="/signup" className="font-bold underline underline-offset-4">Create an account</Link></p>
    </>}
  </AuthShell>;
}

/* --------------------------------- Sign up --------------------------------- */

const steps = ["Language", "Account", "Password", "Details", "Interests", "Knowledge check", "Welcome"] as const;

const interestOptions: { label: string; topic: string }[] = [
  { label: "Qur’an", topic: "Qur’an" }, { label: "Aqeedah", topic: "Aqeedah" }, { label: "Tawheed", topic: "Aqeedah" },
  { label: "Seerah", topic: "Seerah" }, { label: "Tajweed", topic: "Qur’an" }, { label: "Hifz", topic: "Qur’an" },
  { label: "Tafsir", topic: "Tafsir" }, { label: "Tadabbur", topic: "Tafsir" }, { label: "Hadith", topic: "Hadith" },
  { label: "Adhkar", topic: "Dua" }, { label: "Dua", topic: "Dua" }, { label: "Salah", topic: "Fiqh" },
  { label: "Fiqh", topic: "Fiqh" }, { label: "Zakat", topic: "Fiqh" }, { label: "Umrah", topic: "Fiqh" },
  { label: "Arabic", topic: "Arabic" },
];
const quizTopics = ["Seerah", "Qur’an", "Aqeedah", "Fiqh", "Hadith", "Arabic", "Tafsir", "Dua"];

const zones: Record<Zone, { name: string; ages: string; blurb: string }> = {
  kids: { name: "Kids Zone", ages: "Under 13", blurb: "Gentle, safe quests and stories made for children." },
  youth: { name: "Teens & Young Adults Zone", ages: "13 to 24", blurb: "Guided quests for teens and young adults — Qur’an, Seerah and everyday fiqh at a steady pace." },
  adult: { name: "Adult Zone", ages: "25 and above", blurb: "Deep dives into Islamic knowledge — Fiqh, Aqeedah, Seerah and more." },
};

const levelFor = (score: number): Level => (score >= 4 ? "Advanced" : score >= 2 ? "Intermediate" : "Beginner");

/** Five questions led by the learner's interests, drawn from the shared quiz catalog. */
function buildQuiz(interests: string[]): (VisualQuestion & { topic: string })[] {
  const preferred = interests.map((l) => interestOptions.find((o) => o.label === l)?.topic).filter((t): t is string => !!t);
  const order = [...new Set([...preferred, ...quizTopics])].slice(0, 5);
  return order.flatMap((topic) => { const q = quizQuestionsFor(topic)[0]; return q ? [{ ...q, topic }] : []; });
}

type Draft = { language: Lang; name: string; username: string; email: string; password: string; zone: Zone | null; gender: Gender | null; interests: string[] };

export function SignupFlow() {
  const { lang, set: setLanguage } = useLanguage();
  const { account, loggedIn, signUp, logOut, firstName } = useAuth();
  const [step, setStep] = useState(() => {
    try { if (localStorage.getItem("ilm:welcomeLang")) { sessionStorage.setItem("signupLang", localStorage.getItem("iq_lang") ?? "en"); return 1; } } catch { /* ignore */ }
    return 0;
  });
  const [forChild, setForChild] = useStateL(false);
  const [whoChosen, setWhoChosen] = useStateL(false);
  const [draft, setDraft] = useState<Draft>({ language: lang, name: "", username: "", email: "", password: "", zone: null, gender: null, interests: [] });
  const [result, setResult] = useState<{ score: number | null; level: Level } | null>(null);
  const [signupError, setSignupError] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [accountError, setAccountError] = useState("");
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const next = () => { setStep((s) => Math.min(steps.length - 1, s + 1)); window.scrollTo({ top: 0 }); };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async (score: number | null) => {
    const level = score === null ? "Beginner" : levelFor(score);
    setSignupError("");
    setSigningUp(true);
    try {
      await signUp({
        name: draft.name.trim(), username: draft.username, email: normaliseEmail(draft.email), password: draft.password, language: draft.language,
        gender: draft.gender ?? "male", zone: draft.zone ?? "youth", interests: draft.interests,
        level, quizScore: score, xp: 50,
      });
    } catch (err) {
      setSigningUp(false);
      const code = (err as { code?: string })?.code ?? "";
      if ((err as Error)?.message === "USERNAME_TAKEN") { setAccountError("That username was just taken. Please choose another."); setStep(1); window.scrollTo({ top: 0 }); return; }
      if (code === "auth/email-already-in-use") { setAccountError("An account with this email already exists. Try logging in instead."); setStep(1); window.scrollTo({ top: 0 }); return; }
      setSignupError(code === "auth/weak-password" ? "Your password is too weak. Go back and choose a stronger one." : "We couldn't create your account. Please try again.");
      return;
    }
    setSigningUp(false);
    setResult({ score, level });
    next();
  };

  const aside = <>
    <div>
      <p className="text-xs font-bold uppercase text-background/60">Create your account</p>
      <p className="mt-3 font-serif text-5xl leading-[1]">A few small steps, then your first quest.</p>
    </div>
    <ol className="grid gap-2">{steps.map((label, i) => <li key={label} className={cn("flex items-center gap-3 border-2 px-3 py-2.5 text-sm font-semibold", i === step ? "border-background bg-primary text-primary-foreground" : i < step ? "border-background/40" : "border-background/15 text-background/50")}>
      <span className={cn("grid size-6 shrink-0 place-items-center border-2 text-xs", i < step ? "border-secondary bg-secondary text-secondary-foreground" : "border-current")}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>{label}
    </li>)}</ol>
    <p className="font-arabic text-3xl" dir="rtl" lang="ar">طَلَبُ الْعِلْمِ فَرِيضَةٌ</p>
  </>;

  if (loggedIn && !result) {
    return <AuthShell mode="signup" aside={aside}>
      <div className="border-2 border-foreground bg-primary p-6 shadow-brutal">
        <p className="text-xs font-bold uppercase">You already have an account</p>
        <h1 className="mt-2 font-serif text-4xl">Assalamu alaikum, {firstName}</h1>
        <p className="mt-2 text-sm">You’re logged in as {account?.email}.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild className="bg-foreground text-background"><Link to="/app">Open dashboard <ArrowRight /></Link></Button>
          <Button variant="outline" onClick={() => { logOut(); toast("Logged out — you can create a new account"); }}>Log out and start over</Button>
        </div>
      </div>
    </AuthShell>;
  }

  return <AuthShell mode="signup" aside={aside}>
    {step < steps.length - 1 && <StepHeader step={step} />}
    {step === 1 && !forChild && !whoChosen && <div data-who-pick className="grid gap-4">
      <p className="font-serif text-2xl">Who is this account for?</p>
      <button type="button" onClick={() => setWhoChosen(true)} className="flex w-full items-center gap-4 rounded-3xl border-2 border-foreground p-5 text-left shadow-[0_5px_0_var(--foreground)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--foreground)] bg-primary">
        <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-foreground bg-background"><WhoAdult className="size-8" /></span>
        <span><b className="block text-2xl leading-tight">For me</b><span className="text-sm">Teen or adult</span></span>
      </button>
      <button type="button" onClick={() => { setWhoChosen(true); setForChild(true); }} className="flex w-full items-center gap-4 rounded-3xl border-2 border-foreground p-5 text-left shadow-[0_5px_0_var(--foreground)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--foreground)] bg-secondary text-secondary-foreground">
        <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-foreground bg-background text-foreground"><WhoChild className="size-8" /></span>
        <span><b className="block text-2xl leading-tight">For my child</b><span className="text-sm opacity-90">Ages 3 to 13 · safe and simple</span></span>
      </button>
    </div>}
    {step === 1 && !forChild && !whoChosen && <style>{"[data-who-pick] ~ *{display:none!important}"}</style>}
    {step === 1 && forChild && <ChildSignup onBack={() => { setForChild(false); setWhoChosen(false); }} />}
    {step === 1 && forChild && <style>{"[data-child-signup] ~ *{display:none!important}"}</style>}
    {step === 1 && !forChild && <GoogleButton />}
    {step === 0 && <LanguageStep value={draft.language} onNext={(language) => { update({ language }); setLanguage(language); try { sessionStorage.setItem("signupLang", language); } catch { /* ignore */ } next(); }} />}
    {step === 1 && <AccountStep draft={draft} existingEmail={account?.email} serverError={accountError} onBack={back} onNext={(name, username, email) => { setAccountError(""); update({ name, username, email }); next(); }} />}
    {step === 2 && <PasswordStep onBack={back} onNext={(password) => { update({ password }); next(); }} />}
    {step === 3 && <DetailsStep draft={draft} onBack={back} onNext={(zone, gender) => { update({ zone, gender }); next(); }} />}
    {step === 4 && <InterestsStep value={draft.interests} onBack={back} onNext={(interests) => { update({ interests }); next(); }} />}
    {step === 5 && <>
      {signupError && <p role="alert" className="mb-5 border-2 border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive">{signupError}</p>}
      <QuizStep interests={draft.interests} onBack={back} onFinish={finish} busy={signingUp} />
    </>}
    {step === 6 && result && <WelcomeStep name={draft.name} zone={draft.zone ?? "youth"} interests={draft.interests} {...result} />}
  </AuthShell>;
}

const stepCopy: { title: string; sub: string }[] = [
  { title: "Choose a language", sub: "You can change this any time from the site header." },
  { title: "Create your account", sub: "Tell us who you are and where to reach you." },
  { title: "Set a password", sub: "One strong password and you’re in." },
  { title: "A little about you", sub: "This places you in the right learning zone." },
  { title: "Your interests", sub: "Pick your favourite topics — choose at least 3." },
  { title: "Quick knowledge check", sub: "Optional: 5 questions to set your starting level. No pressure." },
];

function StepHeader({ step }: { step: number }) {
  const copy = stepCopy[step];
  return <div className="mb-8">
    <div className="flex gap-1.5" aria-hidden>{steps.slice(0, -1).map((s, i) => <span key={s} className={cn("h-2.5 flex-1 border-2 border-foreground", i < step ? "bg-secondary" : i === step ? "bg-primary" : "bg-background")} />)}</div>
    <p className="mt-5 text-xs font-bold uppercase text-secondary">Step {step + 1} of {steps.length - 1} · {steps[step]}</p>
    <h1 className="mt-2 font-serif text-5xl leading-none sm:text-6xl">{copy?.title}</h1>
    <p className="mt-3 text-muted-foreground">{copy?.sub}</p>
  </div>;
}

function StepNav({ onBack, nextLabel = "Continue", disabled, type = "submit", onNext }: { onBack?: () => void; nextLabel?: string; disabled?: boolean; type?: "submit" | "button"; onNext?: () => void }) {
  return <div className="mt-10 flex items-center gap-3">
    {onBack && <Button type="button" variant="outline" size="lg" onClick={onBack}><ArrowLeft /> Back</Button>}
    <Button type={type} size="lg" disabled={disabled} onClick={onNext} className="ml-auto flex-1 sm:flex-none">{nextLabel} <ArrowRight /></Button>
  </div>;
}

function LanguageStep({ value, onNext }: { value: Lang; onNext: (l: Lang) => void }) {
  const [selected, setSelected] = useState<Lang>(value);
  const [query, setQuery] = useState("");
  const visible = languages.filter((l) => `${l.label} ${l.native}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <form onSubmit={(e) => { e.preventDefault(); onNext(selected); }}>
    <label className="relative block"><Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2" /><input aria-label="Search languages" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search languages" className={inputClass} /></label>
    <div role="radiogroup" aria-label="Language" className="mt-4 grid gap-2.5">
      {visible.map((l) => { const on = l.code === selected; return <button key={l.code} type="button" role="radio" aria-checked={on} onClick={() => setSelected(l.code)} className={cn("flex items-center justify-between border-2 border-foreground px-4 py-3 text-left transition-transform", on ? "bg-primary shadow-brutal" : "bg-background shadow-brutal-sm hover:-translate-y-0.5")}>
        <span><span className="block text-lg font-semibold" dir={l.dir}>{l.native}</span><span className="text-xs text-muted-foreground">{l.label}</span></span>
        {on && <span className="grid size-7 place-items-center border-2 border-foreground bg-secondary text-secondary-foreground"><Check className="size-4" /></span>}
      </button>; })}
      {visible.length === 0 && <p className="border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">No language matches “{query}”. More languages are on the way.</p>}
    </div>
    <StepNav />
  </form>;
}

function AccountStep({ draft, existingEmail, serverError, onBack, onNext }: { draft: Draft; existingEmail?: string | undefined; serverError?: string | undefined; onBack: () => void; onNext: (name: string, username: string, email: string) => void }) {
  const [name, setName] = useState(draft.name);
  const [username, setUsername] = useState(draft.username);
  const [email, setEmail] = useState(draft.email);
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "error">("idle");
  const [errors, setErrors] = useState<{ name?: string; email?: string; exists?: boolean }>({});
  const [emailTaken, setEmailTaken] = useState(false);

  useEffect(() => {
    const value = normaliseEmail(email);
    if (!isValidEmail(value)) { setEmailTaken(false); return undefined; }
    let cancelled = false;
    const id = setTimeout(() => {
      isEmailRegistered(value).then((taken) => { if (!cancelled) setEmailTaken(taken); }).catch(() => {});
    }, 400);
    return () => { cancelled = true; clearTimeout(id); };
  }, [email]);

  useEffect(() => {
    const value = normaliseUsername(username);
    if (!value) { setStatus("idle"); return undefined; }
    if (!isValidUsername(value)) { setStatus("invalid"); return undefined; }
    setStatus("checking");
    let cancelled = false;
    const id = setTimeout(() => {
      isUsernameAvailable(value).then(ok => { if (!cancelled) setStatus(ok ? "available" : "taken"); }).catch(() => { if (!cancelled) setStatus("error"); });
    }, 400);
    return () => { cancelled = true; clearTimeout(id); };
  }, [username]);

  const usernameError = status === "invalid" ? "Use 3 to 20 letters, numbers or underscores." : status === "taken" ? "Already taken, choose another." : status === "error" ? "We couldn't check this name. Check your connection." : undefined;
  const usernameHint = status === "available" ? <span className="mt-1.5 block text-sm font-semibold text-secondary">Available</span> : status === "checking" ? <span className="mt-1.5 block text-sm text-muted-foreground">Checking…</span> : !usernameError ? <span className="mt-1.5 block text-sm text-muted-foreground">3 to 20 letters, numbers or underscores. This is how others find you.</span> : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!isValidEmail(email)) next.email = "Enter a valid email, like name@example.com.";
    else if (existingEmail && normaliseEmail(email) === existingEmail) next.exists = true;
    setErrors(next);
    if (!next.name && !next.email && !next.exists && !emailTaken && status === "available") onNext(name.trim(), normaliseUsername(username), email.trim());
  };
  return <form noValidate onSubmit={submit} className="grid gap-5">
    {serverError && <p role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive">{serverError}</p>}
    <Field label="Full name" icon={User} error={errors.name}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yusuf Jamiu" autoComplete="name" aria-invalid={!!errors.name} className={inputClass} />
    </Field>
    <Field label="Username" icon={AtSign} error={usernameError} hint={usernameHint}>
      <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} placeholder="e.g. yusuf_learns" autoComplete="username" autoCapitalize="none" maxLength={20} aria-invalid={!!usernameError} className={inputClass} />
    </Field>
    <Field label="Email address" icon={AtSign} error={errors.email}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" aria-invalid={!!errors.email} className={inputClass} />
    </Field>
    {(errors.exists || emailTaken) && <p role="alert" className="border-2 border-foreground bg-muted p-3 text-sm">An account with this email already exists. <Link to="/login" className="font-bold underline underline-offset-4">Log in instead</Link></p>}
    <StepNav onBack={onBack} disabled={status !== "available" || emailTaken} />
  </form>;
}

function PasswordStep({ onBack, onNext }: { onBack: () => void; onNext: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const allPass = passwordRules.every((r) => r.test(password));
  const matches = password === confirm && confirm.length > 0;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (allPass && matches) onNext(password);
  };
  return <form noValidate onSubmit={submit} className="grid gap-5">
    <Field label="Password" icon={LockKeyhole} error={tried && !allPass ? "Your password needs every item below." : undefined} hint={
      <ul aria-label="Password requirements" className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">{passwordRules.map((r) => { const ok = r.test(password); return <li key={r.id} className={cn("flex items-center gap-1.5 border-2 px-2 py-1 text-xs font-semibold", ok ? "border-foreground bg-secondary text-secondary-foreground" : "border-foreground/30 text-muted-foreground")}>{ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}{r.label}</li>; })}</ul>
    }>
      <PasswordInput value={password} onChange={setPassword} placeholder="Create a password" autoComplete="new-password" invalid={tried && !allPass} />
    </Field>
    <Field label="Confirm password" icon={LockKeyhole} error={tried && !matches ? "The passwords don’t match yet." : undefined}>
      <PasswordInput value={confirm} onChange={setConfirm} placeholder="Type it again" autoComplete="new-password" invalid={tried && !matches} />
    </Field>
    <StepNav onBack={onBack} />
  </form>;
}

function DetailsStep({ draft, onBack, onNext }: { draft: Draft; onBack: () => void; onNext: (zone: Zone, gender: Gender) => void }) {
  const [zone, setZone] = useState<Zone | null>(draft.zone);
  const [gender, setGender] = useState<Gender | null>(draft.gender);
  const [tried, setTried] = useState(false);
  const isKid = zone === "kids";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (zone && !isKid && gender) onNext(zone, gender);
  };
  const pill = "rounded-full border-[1.5px] border-foreground shadow-[0_3px_0_var(--foreground)] active:translate-y-0.5 sm:rounded-none sm:border-2 sm:shadow-none";
  return <form noValidate onSubmit={submit} className="grid gap-6">
    <fieldset>
      <legend className="text-sm font-semibold">Your age group</legend>
      <p className="mt-1.5 rounded-2xl bg-muted p-3 text-sm sm:rounded-none sm:border-2 sm:border-foreground"><b>Under 13?</b> Ask a parent or guardian to create your account in their <b>Family hub</b>. You’ll log in with a username, no email needed.</p>
      <p className="mt-2 text-xs text-muted-foreground">By creating an account, you agree to our <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold underline">Terms of Use</a> and <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold underline">Privacy Policy</a>.</p>
      <div role="radiogroup" aria-label="Age group" className="mt-2 grid gap-3">{(["youth", "adult"] as const).map((z) => { const on = zone === z; return <button key={z} data-plain type="button" role="radio" aria-checked={on} onClick={() => setZone(z)} className={cn("relative flex items-center justify-center px-10 py-2.5 transition-transform", pill, on ? "bg-primary sm:shadow-brutal" : "bg-background sm:shadow-brutal-sm sm:hover:-translate-y-0.5")}>
        <span className="text-center"><span className="block font-semibold">{zones[z].name}</span><span className="text-xs text-muted-foreground">{zones[z].ages}</span></span>
        {on && <span className="absolute right-3 grid size-6 place-items-center rounded-full bg-secondary text-secondary-foreground sm:rounded-none sm:border-2 sm:border-foreground"><Check className="size-3.5" /></span>}
      </button>; })}</div>
      {tried && !zone && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">Choose your age group to continue.</p>}
    </fieldset>
    <fieldset>
      <legend className="text-sm font-semibold">Gender</legend>
      <div className="mt-2 grid grid-cols-2 gap-3">{(["male", "female"] as const).map((g) => { const on = gender === g; const Fig = g === "male" ? MaleFigure : FemaleFigure; return <button key={g} data-plain type="button" aria-pressed={on} onClick={() => setGender(g)} className={cn("flex items-center gap-2.5 px-4 py-2.5 font-mono text-[15px] capitalize transition-transform sm:font-sans sm:font-semibold sm:py-3", pill, on ? "bg-primary sm:shadow-brutal" : "bg-background sm:shadow-brutal-sm sm:hover:-translate-y-0.5")}>
        <Fig className="size-6 shrink-0" /><span className="flex-1 text-left">{g}</span>
        {on && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground sm:rounded-none sm:border-2 sm:border-foreground"><Check className="size-3.5" /></span>}
      </button>; })}</div>
      {tried && !gender && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">Choose one to continue.</p>}
    </fieldset>
    {isKid && <div role="alert" className="border-2 border-foreground bg-muted p-4">
      <p className="font-serif text-2xl">Under 13? Join through a parent.</p>
      <p className="mt-1 text-sm text-muted-foreground">Children never sign up on their own. A parent or guardian can add you from their family hub, where they verify once and keep you safe.</p>
    </div>}
    <StepNav onBack={onBack} disabled={isKid} />
  </form>;
}
function MaleFigure({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M8.6 6.2c.6-2.4 6.2-2.4 6.8 0" /><circle cx="12" cy="8" r="3.4" /><path d="M5 21c0-4 3.1-6.8 7-6.8s7 2.8 7 6.8" /><path d="M12 14.2v3" /></svg>;
}
function FemaleFigure({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d="M12 2.6c-3.5 0-5.9 2.8-5.9 6.4 0 2.2.8 4 2.1 5.2C6.3 15.4 5 17.8 5 21h14c0-3.2-1.3-5.6-3.2-6.8 1.3-1.2 2.1-3 2.1-5.2 0-3.6-2.4-6.4-5.9-6.4z" /><ellipse cx="12" cy="9.2" rx="2.7" ry="3.3" /></svg>;
}
function InterestsStep({ value, onBack, onNext }: { value: string[]; onBack: () => void; onNext: (v: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>(value);
  const toggle = (l: string) => setPicked((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));
  const enough = picked.length >= 3;
  const ROWS = 5, cols = Math.ceil(interestOptions.length / ROWS);
  return <form onSubmit={(e) => { e.preventDefault(); if (enough) onNext(picked); }}>
    <style>{"@keyframes interestBob{0%,100%{translate:0 0}50%{translate:0 -6px}}.interest-bob{animation:interestBob 4.5s ease-in-out infinite}@media (prefers-reduced-motion: reduce){.interest-bob{animation:none}}"}</style>
    {/* phones and tablets: packed bubbles, swipe sideways */}
    <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] lg:hidden">
      <div className="relative" style={{ width: Math.ceil(interestOptions.length / 4) * 104 + 70, height: 4 * 92 + 32 }}>
        {interestOptions.map(({ label }, i) => { const on = picked.includes(label); const c = Math.floor(i / 4), r = i % 4;
          return <button key={label} data-plain type="button" aria-pressed={on} onClick={() => toggle(label)}
            className={cn("interest-bob absolute grid size-[118px] place-items-center rounded-full p-3 text-center text-[15px] font-bold leading-tight shadow-[0_2px_10px_rgba(0,0,0,0.10)] transition-[transform,background-color] duration-300", on ? "z-10 scale-105 bg-primary text-foreground" : "bg-muted")}
            style={{ left: c * 104 + (r % 2) * 52, top: r * 92, animationDelay: `${(i % 7) * 0.45}s` }}>{label}</button>; })}
      </div>
    </div>
    {/* computers: as before */}
    <div className="hidden grid-cols-2 gap-2.5 lg:grid lg:grid-cols-4">{interestOptions.map(({ label }) => { const on = picked.includes(label); return <button key={label} type="button" aria-pressed={on} onClick={() => toggle(label)} className={cn("flex min-h-14 items-center justify-center gap-1.5 border-2 border-foreground px-2 py-3 text-sm font-semibold transition-transform", on ? "bg-primary shadow-brutal" : "bg-background shadow-brutal-sm hover:-translate-y-0.5")}>
      {on && <Check className="size-4 shrink-0" />}{label}
    </button>; })}</div>
    <p className={cn("mt-4 text-sm font-semibold", enough ? "text-secondary" : "text-muted-foreground")} aria-live="polite">{picked.length} selected{enough ? " — great choices" : ` · pick ${3 - picked.length} more`}</p>
    <StepNav onBack={onBack} disabled={!enough} />
  </form>;
}
function QuizStep({ interests, onBack, onFinish, busy }: { interests: string[]; onBack: () => void; onFinish: (score: number | null) => void | Promise<void>; busy?: boolean }) {
  const questions = useMemo(() => buildQuiz(interests), [interests]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = questions[index];
  if (!q) return null;
  const answered = choice !== null;
  const last = index === questions.length - 1;
  const choose = (i: number) => { if (answered) return; setChoice(i); if (i === q.answer) setScore((s) => s + 1); };
  const advance = () => { if (last) { void onFinish(score); return; } setIndex(index + 1); setChoice(null); };

  return <div>
    <div className="flex items-center justify-between text-sm"><span className="font-mono font-bold">Q{index + 1}/{questions.length}</span><span className="text-muted-foreground">No pressure!</span></div>
    <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10 sm:h-3 sm:rounded-none sm:border-2 sm:border-foreground sm:bg-transparent"><div className="h-full rounded-full bg-primary transition-[width] sm:rounded-none" style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
    <div className="mt-5 rounded-3xl border-[1.5px] border-foreground bg-muted p-5 shadow-[0_4px_0_var(--foreground)] sm:mt-6 sm:rounded-none sm:border-2 sm:shadow-brutal">
      <span className="inline-block rounded-full border-[1.5px] border-secondary bg-secondary/15 px-3 py-0.5 font-mono text-xs font-bold text-secondary sm:rounded-none sm:border-2 sm:border-foreground sm:bg-secondary sm:font-sans sm:uppercase sm:text-secondary-foreground">{q.topic}</span>
      <h2 className="mt-3 text-2xl font-bold leading-snug sm:font-serif sm:text-3xl sm:font-normal sm:leading-tight">{q.q}</h2>
      <QuizVisual kind={q.visual} compact />
    </div>
    <div className="mt-5 grid gap-3">{q.options.map((o, i) => {
      const correct = answered && i === q.answer;
      const wrong = answered && i === choice && i !== q.answer;
      return <button key={o} data-plain type="button" disabled={answered} onClick={() => choose(i)} className={cn("flex items-center gap-3 rounded-full border-[1.5px] border-foreground px-2 py-2 text-left font-semibold shadow-[0_3px_0_var(--foreground)] transition-transform disabled:cursor-default sm:rounded-none sm:border-2 sm:px-3 sm:py-3 sm:shadow-none", correct ? "bg-secondary text-secondary-foreground sm:shadow-brutal" : wrong ? "bg-destructive/15" : "bg-background sm:shadow-brutal-sm", !answered && "active:translate-y-0.5 sm:hover:-translate-y-0.5")}>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border-[1.5px] border-current font-bold sm:rounded-none sm:border-2", correct && "bg-background text-foreground")}>{correct ? <Check className="size-4" /> : wrong ? <X className="size-4" /> : "ABCD"[i]}</span>{o}
      </button>;
    })}</div>
    {answered && <p aria-live="polite" className="mt-5 rounded-2xl border-l-4 border-secondary bg-muted p-4 text-sm sm:rounded-none"><b>{choice === q.answer ? "Correct. " : "Not quite. "}</b>{q.why}</p>}
    <div className="mt-8 flex items-center gap-3">
      {index === 0 && !answered && <Button type="button" variant="outline" size="lg" onClick={onBack}><ArrowLeft /> Back</Button>}
      <Button type="button" size="lg" disabled={!answered || busy} onClick={advance} className="ml-auto flex-1 sm:flex-none">{last ? (busy ? "Creating account…" : "See my level") : "Next question"} <ArrowRight /></Button>
    </div>
    <p className="mt-5 text-center"><button type="button" disabled={busy} onClick={() => void onFinish(null)} className="text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">Skip assessment</button></p>
  </div>;
}
function WelcomeStep({ name, zone, interests, score, level }: { name: string; zone: Zone; interests: string[]; score: number | null; level: Level }) {
  const first = name.trim().split(/\s+/)[0];
  return <div className="border-2 border-foreground bg-primary p-6 text-center text-primary-foreground shadow-brutal sm:p-10">
    <p className="font-arabic text-4xl leading-relaxed" dir="rtl" lang="ar">بِسْمِ ٱللَّهِ</p>
    <h1 className="mt-2 font-serif text-5xl leading-none sm:text-6xl">Bismillah, {first}!</h1>
    <p className="mx-auto mt-4 max-w-sm">Your quest begins now. You’ve already earned your first XP.</p>
    <div className="mx-auto mt-8 w-fit border-2 border-foreground bg-foreground px-8 py-5 text-background shadow-brutal">
      <Gem aria-hidden className="mx-auto size-8 text-primary" />
      <p className="mt-2 font-serif text-6xl leading-none text-primary">+50 XP</p>
      <p className="mt-2 text-xs font-bold uppercase text-background/70">Account setup bonus</p>
    </div>
    <dl className="mt-8 grid gap-2 text-left sm:grid-cols-3">{[
      ["Zone", zones[zone].name],
      ["Starting level", score === null ? `${level} · quiz skipped` : `${level} · ${score}/5`],
      ["Interests", `${interests.length} topics`],
    ].map(([k, v]) => <div key={k} className="border-2 border-foreground bg-background p-3 text-foreground"><dt className="text-[10px] font-bold uppercase text-muted-foreground">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>)}</dl>
    {cityReturn() ? (
      <Button asChild size="lg" className="mt-8 w-full bg-foreground text-background sm:w-auto"><a href="/world" onClick={() => backToCity()}>Back to IlmWorld <ArrowRight /></a></Button>
    ) : (
      <Button asChild size="lg" className="mt-8 w-full bg-foreground text-background sm:w-auto"><Link to="/app">Start my first quest <ArrowRight /></Link></Button>
    )}
  </div>;
}

/* People who came from IlmCity go back to the city after logging in or signing up. */
function cityReturn() {
  try {
    return typeof window !== "undefined" && sessionStorage.getItem("ilmcity-return") === "1";
  } catch {
    return false;
  }
}
function backToCity() {
  if (!cityReturn()) return false;
  try {
    sessionStorage.removeItem("ilmcity-return");
  } catch {
    /* storage blocked */
  }
  window.location.href = "/world";
  return true;
}

/** "Forgot password?": email a reset link (children: their parent resets it in Family hub). */
async function resetPassword() {
  const entered = window.prompt("Enter the email you use for IlmStation. We'll send you a link to set a new password.")?.trim().toLowerCase();
  if (!entered) return;
  if (!entered.includes("@")) { toast("Children's passwords are reset by their parent in Family hub."); return; }
  try { await fetch("/api/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: entered }) }); }
  catch { toast.error("Couldn't reach IlmStation. Check your connection and try again."); return; }
  toast.success("If an account uses this email, a reset link is on its way. Check your inbox and spam folder.");
}

/** "Continue with Google" (pop-up, or a full page if pop-ups are blocked). */
function GoogleButton() {
  const [busy, setBusy] = useGState(false);
  useGEffect(() => { void getRedirectResult(resetAuth).then((r) => { if (r?.user) window.location.href = "/app"; }).catch(() => {}); }, []);
  const go = async () => {
    setBusy(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try { await signInWithPopup(resetAuth, provider); window.location.href = "/app"; }
    catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code.includes("popup-blocked") || code.includes("operation-not-supported")) { await signInWithRedirect(resetAuth, provider); return; }
      if (!code.includes("popup-closed") && !code.includes("cancelled-popup")) toast.error("Google sign-in didn't work. Try again, or use your email and password.");
      setBusy(false);
    }
  };
  return <div className="mb-5">
    <button type="button" disabled={busy} onClick={() => void go()} className="flex w-full items-center justify-center gap-3 border-2 border-foreground bg-background px-4 py-3 font-bold shadow-brutal-sm disabled:opacity-50">
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      {busy ? "Opening Google…" : "Continue with Google"}
    </button>
    <div className="mt-5 flex items-center gap-3 text-xs font-bold uppercase text-muted-foreground"><span className="h-px flex-1 bg-foreground/30" />or<span className="h-px flex-1 bg-foreground/30" /></div>
  </div>;
}

/** Sign up for a child: a light parent account in the background + the child account, then open the kids' zone. */
function ChildSignup({ onBack }: { onBack: () => void }) {
  const [childName, setChildName] = useStateL(""); const [age, setAge] = useStateL(7); const [gender, setGender] = useStateL<"male" | "female" | "">("");
  const [username, setUsername] = useStateL(""); const [childPass, setChildPass] = useStateL("");
  const [email, setEmail] = useStateL(""); const [parentPass, setParentPass] = useStateL(""); const [consent, setConsent] = useStateL(false);
  const [busy, setBusy] = useStateL(false); const [err, setErr] = useStateL("");
  const box = "mt-1 h-11 w-full border-2 border-foreground bg-background px-3";
  const create = async (useGoogle = false) => {
    setErr("");
    const un = username.trim().toLowerCase(); let em = email.trim().toLowerCase();
    if (!childName.trim()) return setErr("Add your child's first name.");
    if (!gender) return setErr("Choose boy or girl.");
    if (!/^[a-z0-9_]{3,20}$/.test(un)) return setErr("Username: 3–20 letters, numbers or _.");
    if (childPass.length < 6) return setErr("Child's password: at least 6 characters.");
    if (!useGoogle && !/^\S+@\S+\.\S+$/.test(em)) return setErr("Enter a valid email, like name@example.com.");
    if (!useGoogle && parentPass.length < 6) return setErr("Your password: at least 6 characters.");
    if (!consent) return setErr("Please confirm you're this child's parent or guardian.");
    setBusy(true);
    try {
      if ((await gK(dK(dbK, "usernames", un))).exists()) throw new Error("That username is taken. Try another.");
      // a new parent account, or the parent's existing one
      let pu; let existing = false;
      if (useGoogle) {
        try { pu = (await popParent(aK, new GoogleParent())).user; } catch { throw new Error("Google sign-in didn't open. Allow pop-ups, or use your email and password."); }
        em = (pu.email ?? "").toLowerCase();
        existing = (await gK(dK(dbK, "profiles", pu.uid))).exists();
      } else try { pu = (await cuParent(aK, em, parentPass)).user; }
      catch (e) {
        if ((e as { code?: string }).code !== "auth/email-already-in-use") throw new Error("Couldn't create the parent account. Check the email and password.");
        try { pu = (await siParent(aK, em, parentPass)).user; existing = true; }
        catch { throw new Error("This email already has an account, but the password doesn't match. If you sign in with Google, log in and add your child in Family hub."); }
      }
      if (!existing) {
        let pun = (em.split("@")[0]!.replace(/[^a-z0-9_]/g, "").slice(0, 14) || "parent");
        for (let i = 0; i < 6; i++) { const c = `${pun}${Math.floor(1000 + Math.random() * 9000)}`; if (!(await gK(dK(dbK, "usernames", c))).exists()) { pun = c; break; } }
        const lang = (() => { try { return sessionStorage.getItem("signupLang") || localStorage.getItem("iq_lang") || "en"; } catch { return "en"; } })();
        await sK(dK(dbK, "usernames", pun), { uid: pu.uid });
        await sK(dK(dbK, "profiles", pu.uid), { name: "Parent", username: pun, email: em, language: lang, zone: "adult", level: "Beginner", xp: 50, interests: [], parentOnly: true, createdAt: Date.now() });
        await sK(dK(dbK, "emails", em), { uid: pu.uid }).catch(() => {});
      }
      const token = await pu.getIdToken();
      const call = (body: Record<string, unknown>) => fetch("/api/family", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json() as Promise<{ ok?: boolean; error?: string; uid?: string; token?: string }>);
      const r1 = await call({ action: "createChild", name: childName.trim(), age, gender, username: un, password: childPass });
      if (!r1.ok) throw new Error(r1.error ?? "Couldn't create your child's account.");
      const r2 = r1.uid ? await call({ action: "childLogin", uid: r1.uid }) : { ok: false };
      if (r2.ok && r2.token) { await sictKid(aK, r2.token); try { localStorage.setItem("ilm:kid", age <= 12 ? "1" : "0"); } catch { /* ignore */ } window.location.href = "/app"; return; }
      window.location.href = "/login";
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return <div data-child-signup className="space-y-4">
    <div className="flex items-center justify-between"><p className="font-serif text-2xl">🧒 A child account</p><button type="button" onClick={onBack} className="text-sm font-semibold underline underline-offset-4">Back</button></div>
    <section className="space-y-3 border-2 border-foreground p-4">
      <p className="text-xs font-bold uppercase text-muted-foreground">Your child</p>
      <label className="block text-sm font-semibold">First name<input value={childName} onChange={(e) => setChildName(e.target.value)} className={box} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold">Age<select value={age} onChange={(e) => setAge(Number(e.target.value))} className={box}>{Array.from({ length: 11 }, (_, i) => i + 3).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <div className="text-sm font-semibold">Boy or girl<div className="mt-1 grid grid-cols-2 gap-2">{(["male", "female"] as const).map((g) => <button key={g} type="button" onClick={() => setGender(g)} className={`h-11 border-2 border-foreground font-bold ${gender === g ? "bg-primary" : "bg-background"}`}>{g === "male" ? "Boy" : "Girl"}</button>)}</div></div>
      </div>
      <label className="block text-sm font-semibold">Username (to log in)<input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))} placeholder="e.g. amina_10" autoCapitalize="none" className={box} /></label>
      <label className="block text-sm font-semibold">Child's password<input type="password" value={childPass} onChange={(e) => setChildPass(e.target.value)} autoComplete="new-password" className={box} /></label>
    </section>
    <section className="space-y-3 border-2 border-foreground p-4">
      <p className="text-xs font-bold uppercase text-muted-foreground">You (parent or guardian)</p>
      <button type="button" disabled={busy} onClick={() => void create(true)} className="flex h-11 w-full items-center justify-center gap-2 border-2 border-foreground bg-background font-bold shadow-brutal-sm disabled:opacity-60"><svg viewBox="0 0 48 48" className="size-5" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Continue with Google</button>
      <p className="text-center text-xs font-bold text-muted-foreground">OR</p>
      <label className="block text-sm font-semibold">Your email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={box} /></label>
      <label className="block text-sm font-semibold">Your password<input type="password" value={parentPass} onChange={(e) => setParentPass(e.target.value)} autoComplete="new-password" className={box} /></label>
      <p className="text-xs text-muted-foreground">Already have an IlmStation account? Use the same email and password, and your child joins your family. New here? This creates a parent account for password resets and Family hub.</p>
    </section>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" /> <span>I’m this child’s parent or guardian, and I agree to the <a href="/terms" target="_blank" rel="noreferrer" className="underline">Terms</a> and <a href="/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a>.</span></label>
    {err && <p className="border-2 border-foreground bg-destructive/10 p-3 text-sm">{err}</p>}
    <button type="button" disabled={busy} onClick={() => void create(false)} className="h-12 w-full border-2 border-foreground bg-primary font-bold shadow-brutal disabled:opacity-60">{busy ? "Creating…" : "Create my child’s account"}</button>
  </div>;
}
