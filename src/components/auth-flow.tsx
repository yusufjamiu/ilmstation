import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, AtSign, CalendarDays, Check, Eye, EyeOff, Gem, LockKeyhole, Search, User, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { languages, useLanguage, type Lang } from "@/components/language";
import { QuizVisual, quizQuestionsFor, type VisualQuestion } from "@/components/quiz-visual";
import {
  ageFrom, isValidEmail, normaliseEmail, passwordRules, useAuth,
  type Gender, type Level, type Zone,
} from "@/components/auth";
import { cn } from "@/lib/utils";

/* ------------------------------- Shared shell ------------------------------ */

const inputClass = "h-12 w-full border-2 border-foreground bg-background pl-10 pr-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

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
    <span className="relative mt-1.5 block"><Icon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />{children}</span>
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
  const { logIn, loggedIn, account, firstName, logOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) { setError("Enter the email you signed up with."); return; }
    if (!password) { setError("Enter your password."); return; }
    setBusy(true);
    const problem = await logIn(email, password);
    setBusy(false);
    if (problem) { setError(problem); return; }
    toast.success(`Welcome back${account ? `, ${account.name.split(/\s+/)[0]}` : ""}`);
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
      <form noValidate onSubmit={submit} className="mt-8 grid gap-5">
        <Field label="Email address" icon={AtSign}>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="name@example.com" autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password" icon={LockKeyhole} hint={<button type="button" onClick={() => toast("Password reset is coming soon.")} className="mt-1.5 text-sm font-semibold underline underline-offset-4">Forgot password?</button>}>
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

const zones: Record<Zone, { name: string; blurb: string }> = {
  youth: { name: "Youth Zone", blurb: "Guided quests built for teens — Qur’an, Seerah and everyday fiqh at a steady pace." },
  adult: { name: "Adult Zone", blurb: "Deep dives into Islamic knowledge — Fiqh, Aqeedah, Seerah and more." },
};

const levelFor = (score: number): Level => (score >= 4 ? "Advanced" : score >= 2 ? "Intermediate" : "Beginner");

/** Five questions led by the learner's interests, drawn from the shared quiz catalog. */
function buildQuiz(interests: string[]): (VisualQuestion & { topic: string })[] {
  const preferred = interests.map((l) => interestOptions.find((o) => o.label === l)?.topic).filter((t): t is string => !!t);
  const order = [...new Set([...preferred, ...quizTopics])].slice(0, 5);
  return order.flatMap((topic) => { const q = quizQuestionsFor(topic)[0]; return q ? [{ ...q, topic }] : []; });
}

type Draft = { language: Lang; name: string; email: string; password: string; dob: string; gender: Gender | null; interests: string[] };

export function SignupFlow() {
  const { lang, set: setLanguage } = useLanguage();
  const { account, loggedIn, signUp, logOut, firstName } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ language: lang, name: "", email: "", password: "", dob: "", gender: null, interests: [] });
  const [result, setResult] = useState<{ score: number | null; level: Level } | null>(null);
  const [signupError, setSignupError] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const next = () => { setStep((s) => Math.min(steps.length - 1, s + 1)); window.scrollTo({ top: 0 }); };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async (score: number | null) => {
    const age = ageFrom(draft.dob) ?? 18;
    const level = score === null ? "Beginner" : levelFor(score);
    setSignupError("");
    setSigningUp(true);
    const error = await signUp({
      name: draft.name.trim(), email: normaliseEmail(draft.email), password: draft.password, language: draft.language,
      dob: draft.dob, gender: draft.gender ?? "male", zone: age < 18 ? "youth" : "adult", interests: draft.interests,
      level, quizScore: score, xp: 50,
    });
    setSigningUp(false);
    if (error) { setSignupError(error); return; }
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
    {step === 0 && <LanguageStep value={draft.language} onNext={(language) => { update({ language }); setLanguage(language); next(); }} />}
    {step === 1 && <AccountStep draft={draft} existingEmail={account?.email} onBack={back} onNext={(name, email) => { update({ name, email }); next(); }} />}
    {step === 2 && <PasswordStep onBack={back} onNext={(password) => { update({ password }); next(); }} />}
    {step === 3 && <DetailsStep draft={draft} onBack={back} onNext={(dob, gender) => { update({ dob, gender }); next(); }} />}
    {step === 4 && <InterestsStep value={draft.interests} onBack={back} onNext={(interests) => { update({ interests }); next(); }} />}
    {step === 5 && <>
      {signupError && <p role="alert" className="mb-5 border-2 border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive">{signupError}</p>}
      <QuizStep interests={draft.interests} onBack={back} onFinish={finish} busy={signingUp} />
    </>}
    {step === 6 && result && <WelcomeStep name={draft.name} zone={(ageFrom(draft.dob) ?? 18) < 18 ? "youth" : "adult"} interests={draft.interests} {...result} />}
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

function AccountStep({ draft, existingEmail, onBack, onNext }: { draft: Draft; existingEmail?: string | undefined; onBack: () => void; onNext: (name: string, email: string) => void }) {
  const [name, setName] = useState(draft.name);
  const [email, setEmail] = useState(draft.email);
  const [errors, setErrors] = useState<{ name?: string; email?: string; exists?: boolean }>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!isValidEmail(email)) next.email = "Enter a valid email, like name@example.com.";
    else if (existingEmail && normaliseEmail(email) === existingEmail) next.exists = true;
    setErrors(next);
    if (!next.name && !next.email && !next.exists) onNext(name.trim(), email.trim());
  };
  return <form noValidate onSubmit={submit} className="grid gap-5">
    <Field label="Full name" icon={User} error={errors.name}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yusuf Jamiu" autoComplete="name" aria-invalid={!!errors.name} className={inputClass} />
    </Field>
    <Field label="Email address" icon={AtSign} error={errors.email}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" aria-invalid={!!errors.email} className={inputClass} />
    </Field>
    {errors.exists && <p role="alert" className="border-2 border-foreground bg-muted p-3 text-sm">An account with this email already exists. <Link to="/login" className="font-bold underline underline-offset-4">Log in instead</Link></p>}
    <StepNav onBack={onBack} />
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

function DetailsStep({ draft, onBack, onNext }: { draft: Draft; onBack: () => void; onNext: (dob: string, gender: Gender) => void }) {
  const [dob, setDob] = useState(draft.dob);
  const [gender, setGender] = useState<Gender | null>(draft.gender);
  const [tried, setTried] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const age = dob ? ageFrom(dob) : null;
  const validAge = age !== null && age >= 0 && age <= 120;
  const tooYoung = validAge && age < 13;
  const zone: Zone | null = validAge && !tooYoung ? (age < 18 ? "youth" : "adult") : null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (zone && gender) onNext(dob, gender);
  };
  return <form noValidate onSubmit={submit} className="grid gap-6">
    <Field label="Date of birth" icon={CalendarDays} error={tried && !validAge ? "Enter your date of birth." : undefined}>
      <input type="date" value={dob} max={today} min="1900-01-01" onChange={(e) => setDob(e.target.value)} aria-invalid={tried && !validAge} className={inputClass} />
    </Field>
    <fieldset>
      <legend className="text-sm font-semibold">Gender</legend>
      <div className="mt-1.5 grid grid-cols-2 gap-3">{(["male", "female"] as const).map((g) => { const on = gender === g; return <button key={g} type="button" aria-pressed={on} onClick={() => setGender(g)} className={cn("flex items-center justify-between border-2 border-foreground px-4 py-3 font-semibold capitalize transition-transform", on ? "bg-primary shadow-brutal" : "bg-background shadow-brutal-sm hover:-translate-y-0.5")}>
        {g}{on && <span className="grid size-6 place-items-center border-2 border-foreground bg-secondary text-secondary-foreground"><Check className="size-3.5" /></span>}
      </button>; })}</div>
      {tried && !gender && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">Choose one to continue.</p>}
    </fieldset>
    {tooYoung && <div role="alert" className="border-2 border-foreground bg-muted p-4">
      <p className="font-serif text-2xl">Under 13? Join through a parent.</p>
      <p className="mt-1 text-sm text-muted-foreground">Children never sign up on their own. A parent or guardian can add you from their family hub, where they verify once and keep you safe.</p>
    </div>}
    {zone && <div className="border-2 border-foreground bg-secondary p-4 text-secondary-foreground shadow-brutal-sm" aria-live="polite">
      <p className="text-xs font-bold uppercase opacity-80">Zone assigned</p>
      <p className="mt-1 font-serif text-3xl">{zones[zone].name}</p>
      <p className="mt-1 text-sm">{zones[zone].blurb}</p>
    </div>}
    <StepNav onBack={onBack} disabled={tooYoung} />
  </form>;
}

function InterestsStep({ value, onBack, onNext }: { value: string[]; onBack: () => void; onNext: (v: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>(value);
  const toggle = (l: string) => setPicked((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));
  const enough = picked.length >= 3;
  return <form onSubmit={(e) => { e.preventDefault(); if (enough) onNext(picked); }}>
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{interestOptions.map(({ label }) => { const on = picked.includes(label); return <button key={label} type="button" aria-pressed={on} onClick={() => toggle(label)} className={cn("flex min-h-14 items-center justify-center gap-1.5 border-2 border-foreground px-2 py-3 text-sm font-semibold transition-transform", on ? "bg-primary shadow-brutal" : "bg-background shadow-brutal-sm hover:-translate-y-0.5")}>
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
    <div className="flex items-center justify-between text-sm font-bold"><span>Q{index + 1}/{questions.length}</span><span className="text-muted-foreground">No pressure!</span></div>
    <div className="mt-2 h-3 border-2 border-foreground"><div className="h-full bg-primary transition-[width]" style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
    <div className="mt-6 border-2 border-foreground bg-muted p-5 shadow-brutal">
      <span className="inline-block border-2 border-foreground bg-secondary px-2 py-0.5 text-xs font-bold uppercase text-secondary-foreground">{q.topic}</span>
      <h2 className="mt-3 font-serif text-3xl leading-tight">{q.q}</h2>
      <QuizVisual kind={q.visual} compact />
    </div>
    <div className="mt-5 grid gap-3">{q.options.map((o, i) => {
      const correct = answered && i === q.answer;
      const wrong = answered && i === choice && i !== q.answer;
      return <button key={o} type="button" disabled={answered} onClick={() => choose(i)} className={cn("flex items-center gap-3 border-2 border-foreground px-3 py-3 text-left font-semibold transition-transform disabled:cursor-default", correct ? "bg-secondary text-secondary-foreground shadow-brutal" : wrong ? "bg-destructive/15" : "bg-background shadow-brutal-sm", !answered && "hover:-translate-y-0.5")}>
        <span className={cn("grid size-9 shrink-0 place-items-center border-2 border-current font-bold", correct && "bg-background text-foreground")}>{correct ? <Check className="size-4" /> : wrong ? <X className="size-4" /> : "ABCD"[i]}</span>{o}
      </button>;
    })}</div>
    {answered && <p aria-live="polite" className="mt-5 border-l-4 border-secondary bg-muted p-4 text-sm"><b>{choice === q.answer ? "Correct. " : "Not quite. "}</b>{q.why}</p>}
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
    <Button asChild size="lg" className="mt-8 w-full bg-foreground text-background sm:w-auto"><Link to="/app">Start my first quest <ArrowRight /></Link></Button>
  </div>;
}
