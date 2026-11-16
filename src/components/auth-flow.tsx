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
      <GoogleButton />
        <form noValidate onSubmit={submit} className="mt-8 grid gap-5">
        <Field label="Email address" icon={AtSign}>
          <input type="text" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="Email (or username for children)" autoComplete="username" autoCapitalize="none" className={inputClass} />
        </Field>
        <Field label="Password" icon={LockKeyhole} hint={<button type="button" onClick={() => void resetPassword()} className="mt-1.5 text-sm font-semibold underline underline-offset-4">Forgot password?</button>}>
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
  const [step, setStep] = useState(0);
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
    {step <= 1 && <GoogleButton />}
    {step === 0 && <LanguageStep value={draft.language} onNext={(language) => { update({ language }); setLanguage(language); next(); }} />}
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
  return <form noValidate onSubmit={submit} className="grid gap-6">
    <fieldset>
      <legend className="text-sm font-semibold">Your age group</legend>
      <p className="mt-1.5 border-2 border-foreground bg-muted p-3 text-sm"><b>Under 13?</b> Ask a parent or guardian to create your account in their <b>Family hub</b>. You’ll log in with a username, no email needed.</p>
      <p className="mt-2 text-xs text-muted-foreground">By creating an account, you agree to our <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold underline">Terms of Use</a> and <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold underline">Privacy Policy</a>.</p>
      <div role="radiogroup" aria-label="Age group" className="mt-1.5 grid gap-3">{(["youth", "adult"] as const).map((z) => { const on = zone === z; return <button key={z} type="button" role="radio" aria-checked={on} onClick={() => setZone(z)} className={cn("flex items-center justify-between border-2 border-foreground px-4 py-3 text-left transition-transform", on ? "bg-primary shadow-brutal" : "bg-background shadow-brutal-sm hover:-translate-y-0.5")}>
        <span><span className="block font-semibold">{zones[z].name}</span><span className="text-xs text-muted-foreground">{zones[z].ages} · {zones[z].blurb}</span></span>
        {on && <span className="grid size-6 shrink-0 place-items-center border-2 border-foreground bg-secondary text-secondary-foreground"><Check className="size-3.5" /></span>}
      </button>; })}</div>
      {tried && !zone && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">Choose your age group to continue.</p>}
    </fieldset>
    <fieldset>
      <legend className="text-sm font-semibold">Gender</legend>
      <div className="mt-1.5 grid grid-cols-2 gap-3">{(["male", "female"] as const).map((g) => { const on = gender === g; return <button key={g} type="button" aria-pressed={on} onClick={() => setGender(g)} className={cn("flex items-center justify-between border-2 border-foreground px-4 py-3 font-semibold capitalize transition-transform", on ? "bg-primary shadow-brutal" : "bg-background shadow-brutal-sm hover:-translate-y-0.5")}>
        {g}{on && <span className="grid size-6 place-items-center border-2 border-foreground bg-secondary text-secondary-foreground"><Check className="size-3.5" /></span>}
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
