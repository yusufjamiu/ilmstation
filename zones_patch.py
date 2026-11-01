import re
def load(p): return open(p).read()
def save(p,s): open(p,'w').write(s)
def swap(s,name,old,new):
    if old in s:
        print("OK",name); return s.replace(old,new,1)
    print("WARNING missing:",name); return s

# ---------- auth.tsx ----------
p='src/components/auth.tsx'; s=load(p)
s=swap(s,"zone type",'export type Zone = "youth" | "adult";','export type Zone = "kids" | "youth" | "adult";')
s=swap(s,"dob optional","  dob: string;\n","  dob?: string;\n")
s=swap(s,"import setDoc",'import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";','import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";') if 'setDoc' in s.split('from "firebase/firestore"')[0] else swap(s,"import setDoc",'import { doc, getDoc, writeBatch } from "firebase/firestore";','import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";')
s=swap(s,"email check helper","export const passwordRules = [",
'''/** True when an account already uses this email. Works before login. */
export async function isEmailRegistered(email: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "emails", normaliseEmail(email)));
  return snap.exists();
}

export const passwordRules = [''')
s=swap(s,"save email at signup",
'        if (username) batch.set(doc(db, "usernames", username), { uid: cred.user.uid });',
'        if (username) batch.set(doc(db, "usernames", username), { uid: cred.user.uid });\n        batch.set(doc(db, "emails", normaliseEmail(profile.email)), { uid: cred.user.uid });')
s=swap(s,"backfill emails",
'''async function fetchProfile(uid: string): Promise<Account | null> {
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? (snap.data() as Account) : null;
}''',
'''/** Older accounts are added to the email list the first time they log in. */
async function backfillEmail(uid: string, email: string) {
  try {
    const ref = doc(db, "emails", normaliseEmail(email));
    if (!(await getDoc(ref)).exists()) await setDoc(ref, { uid });
  } catch { /* best effort */ }
}

async function fetchProfile(uid: string): Promise<Account | null> {
  const snap = await getDoc(doc(db, "profiles", uid));
  if (!snap.exists()) return null;
  const profile = snap.data() as Account;
  void backfillEmail(uid, profile.email);
  return profile;
}''')
save(p,s)

# ---------- auth-flow.tsx ----------
p='src/components/auth-flow.tsx'; s=load(p)
s=swap(s,"imports","  ArrowLeft, ArrowRight, AtSign, CalendarDays, Check,","  ArrowLeft, ArrowRight, AtSign, Check,")
s=swap(s,"import isEmailRegistered","  ageFrom, isUsernameAvailable, isValidEmail,","  isEmailRegistered, isUsernameAvailable, isValidEmail,")
s=swap(s,"zones map",
'''const zones: Record<Zone, { name: string; blurb: string }> = {
  youth: { name: "Youth Zone", blurb: "Guided quests built for teens — Qur’an, Seerah and everyday fiqh at a steady pace." },
  adult: { name: "Adult Zone", blurb: "Deep dives into Islamic knowledge — Fiqh, Aqeedah, Seerah and more." },
};''',
'''const zones: Record<Zone, { name: string; ages: string; blurb: string }> = {
  kids: { name: "Kids Zone", ages: "Under 13", blurb: "Gentle, safe quests and stories made for children." },
  youth: { name: "Teens & Young Adults Zone", ages: "13 to 24", blurb: "Guided quests for teens and young adults — Qur’an, Seerah and everyday fiqh at a steady pace." },
  adult: { name: "Adult Zone", ages: "25 and above", blurb: "Deep dives into Islamic knowledge — Fiqh, Aqeedah, Seerah and more." },
};''')
s=swap(s,"Draft type","password: string; dob: string; gender: Gender | null;","password: string; zone: Zone | null; gender: Gender | null;")
s=swap(s,"Draft init",'password: "", dob: "", gender: null,','password: "", zone: null, gender: null,')
s=swap(s,"finish age","    const age = ageFrom(draft.dob) ?? 18;\n","")
s=swap(s,"signup payload",'dob: draft.dob, gender: draft.gender ?? "male", zone: age < 18 ? "youth" : "adult",','gender: draft.gender ?? "male", zone: draft.zone ?? "youth",')
s=swap(s,"details onNext",'onNext={(dob, gender) => { update({ dob, gender }); next(); }}','onNext={(zone, gender) => { update({ zone, gender }); next(); }}')
s=swap(s,"welcome zone",'zone={(ageFrom(draft.dob) ?? 18) < 18 ? "youth" : "adult"}','zone={draft.zone ?? "youth"}')

# DetailsStep
a=s.index("function DetailsStep("); b=s.index("function InterestsStep(")
blk=s[a:b]
i0=blk.index("  const [dob, setDob]"); i1=blk.index("  return <form noValidate onSubmit={submit}")
blk=blk[:i0]+'''  const [zone, setZone] = useState<Zone | null>(draft.zone);
  const [gender, setGender] = useState<Gender | null>(draft.gender);
  const [tried, setTried] = useState(false);
  const isKid = zone === "kids";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (zone && !isKid && gender) onNext(zone, gender);
  };
'''+blk[i1:]
blk=blk.replace("onNext: (dob: string, gender: Gender) => void","onNext: (zone: Zone, gender: Gender) => void",1)
f0=blk.index('    <Field label="Date of birth"'); f1=blk.index("</Field>\n",f0)+len("</Field>\n")
blk=blk[:f0]+'''    <fieldset>
      <legend className="text-sm font-semibold">Your age group</legend>
      <div role="radiogroup" aria-label="Age group" className="mt-1.5 grid gap-3">{(["kids", "youth", "adult"] as const).map((z) => { const on = zone === z; return <button key={z} type="button" role="radio" aria-checked={on} onClick={() => setZone(z)} className={cn("flex items-center justify-between border-2 border-foreground px-4 py-3 text-left transition-transform", on ? "bg-primary shadow-brutal" : "bg-background shadow-brutal-sm hover:-translate-y-0.5")}>
        <span><span className="block font-semibold">{zones[z].name}</span><span className="text-xs text-muted-foreground">{zones[z].ages} · {zones[z].blurb}</span></span>
        {on && <span className="grid size-6 shrink-0 place-items-center border-2 border-foreground bg-secondary text-secondary-foreground"><Check className="size-3.5" /></span>}
      </button>; })}</div>
      {tried && !zone && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">Choose your age group to continue.</p>}
    </fieldset>
'''+blk[f1:]
blk=blk.replace("{tooYoung && <div","{isKid && <div",1)
blk=blk.replace("disabled={tooYoung}","disabled={isKid}",1)
blk,n=re.subn(r'    \{zone && <div className="border-2 border-foreground bg-secondary.*?</div>\}\n','',blk,count=1,flags=re.S)
print("OK" if n else "WARNING missing:","remove zone-assigned box")
s=s[:a]+blk+s[b:]

# AccountStep: early email check
s=swap(s,"email state",
'  const [errors, setErrors] = useState<{ name?: string; email?: string; exists?: boolean }>({});\n',
'''  const [errors, setErrors] = useState<{ name?: string; email?: string; exists?: boolean }>({});
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
''')
s=swap(s,"email submit block",
"if (!next.name && !next.email && !next.exists && status === \"available\") onNext(",
"if (!next.name && !next.email && !next.exists && !emailTaken && status === \"available\") onNext(")
s=swap(s,"email message","{errors.exists && <p role=\"alert\"","{(errors.exists || emailTaken) && <p role=\"alert\"")
s=swap(s,"email disable",'<StepNav onBack={onBack} disabled={status !== "available"} />','<StepNav onBack={onBack} disabled={status !== "available" || emailTaken} />')
save(p,s)

# ---------- library.tsx ----------
p='src/components/library.tsx'; s=load(p)
s=swap(s,"bands",
'const bandsFor = (zone: "youth" | "adult"): Age[] => (zone === "youth" ? ["kids", "teens"] : ["kids", "teens", "adults"]);',
'const bandsFor = (zone: Zone): Age[] => (zone === "kids" ? ["kids"] : zone === "youth" ? ["kids", "teens"] : ["kids", "teens", "adults"]);')
s=swap(s,"import Zone",'import { useAuth } from "@/components/auth";','import { useAuth, type Zone } from "@/components/auth";')
save(p,s)

# ---------- chatrooms.tsx ----------
p='src/components/chatrooms.tsx'; s=load(p)
s=swap(s,"zone label",'{zone === "youth" ? "Youth Zone" : "Adult Zone"} · moderated','{zone === "kids" ? "Kids Zone" : zone === "youth" ? "Teens & Young Adults Zone" : "Adult Zone"} · moderated')
save(p,s)