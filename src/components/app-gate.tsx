import { useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/components/auth";
import { IlmStationApp } from "@/components/ilmstation-app";

/** /app: logged in → the app; not logged in → welcome screen with Create account / Log in. */
export function AppGate() {
  const { account, ready, loggedIn } = useAuth();
  if (!ready) return <div className="grid min-h-screen place-items-center bg-background">
    <div className="grid size-16 animate-pulse place-items-center border-2 border-foreground bg-foreground font-serif text-3xl text-background">I</div>
  </div>;
  if (account) return <IlmStationApp />;
  if (loggedIn) return <CompleteProfile />;
  return <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
    <div className="w-full max-w-md">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center border-2 border-foreground bg-foreground font-serif text-3xl text-background">I</span>
        <span className="font-serif text-4xl">IlmStation</span>
      </div>
      <h1 className="mt-8 font-serif text-5xl leading-none">Learn a little every day.</h1>
      <p className="mt-3 text-muted-foreground">Islamic learning for kids, teens and adults.</p>
      <ul className="mt-6 grid gap-3">
        {[["🌅", "Daily Wisdom", "An ayah, hadith or reminder each day"], ["⚡", "Quizzes and streaks", "Earn XP and level up"], ["📚", "Library and Qur'an", "Books, audio and memorisation"]].map(([e, t, d]) => <li key={t} className="flex items-start gap-3 border-2 border-foreground bg-background p-3 shadow-brutal-sm">
          <span className="text-2xl">{e}</span><span><b>{t}</b><br /><span className="text-sm text-muted-foreground">{d}</span></span>
        </li>)}
      </ul>
      <div className="mt-8 grid gap-3">
        <Link to="/signup" className="border-2 border-foreground bg-primary px-4 py-3 text-center font-bold shadow-brutal">Create account</Link>
        <Link to="/login" className="border-2 border-foreground bg-background px-4 py-3 text-center font-bold">Log in</Link>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Under 13? A parent or guardian creates your account in their Family hub.</p>
    </div>
  </main>;
}

/** After a first Google sign-in: name, Teen/Adult, Brother/Sister, then into the app. */
function CompleteProfile() {
  const u = auth.currentUser;
  const [name, setName] = useState(u?.displayName ?? "");
  const [uname, setUname] = useState(((u?.email ?? "").split("@")[0] || (u?.displayName ?? "")).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20));
  const [zone, setZone] = useState<"youth" | "adult" | "">("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!u) return;
    if (name.trim().length < 2 || !zone || !gender) { toast.error("Please fill in your name, and choose Teen/Adult and Brother/Sister."); return; }
    const un = uname.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(un)) { toast.error("Username: 3–20 letters, numbers or _ (no spaces)."); return; }
    setBusy(true);
    try {
      const email = (u.email ?? "").trim().toLowerCase();
      if ((await getDoc(doc(db, "usernames", un))).exists()) { toast.error("That username is taken. Please choose another."); setBusy(false); return; }
      await setDoc(doc(db, "usernames", un), { uid: u.uid });
      await setDoc(doc(db, "profiles", u.uid), { name: name.trim(), username: un, email, language: (() => { try { return sessionStorage.getItem("signupLang") || document.documentElement.lang || "en"; } catch { return "en"; } })(), gender, zone, interests: [], level: "Beginner", quizScore: null, xp: 0, createdAt: new Date().toISOString() });
      if (email) await setDoc(doc(db, "emails", email), { uid: u.uid }).catch(() => {});
      window.location.reload();
    } catch { toast.error("Couldn't save. Try again."); setBusy(false); }
  };
  const pickBtn = (on: boolean) => `border-2 border-foreground px-4 py-3 font-bold ${on ? "bg-primary" : "bg-background"}`;
  return <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
    <div className="w-full max-w-md">
      <span className="grid size-14 place-items-center border-2 border-foreground bg-foreground font-serif text-3xl text-background">I</span>
      <h1 className="mt-6 font-serif text-5xl leading-none">Almost there!</h1>
      <p className="mt-2 text-muted-foreground">Tell us a little about you, so we can set up your learning.</p>
      <label className="mt-6 block text-xs font-bold uppercase">Your name<input className="mt-1 h-12 w-full border-2 border-foreground bg-background px-3 text-base font-normal normal-case" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="mt-4 block text-xs font-bold uppercase">Username<span className="mt-1 flex items-center border-2 border-foreground bg-background"><span className="pl-3 text-muted-foreground">@</span><input className="h-12 w-full bg-transparent px-1 text-base font-normal normal-case outline-none" value={uname} onChange={(e) => setUname(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))} /></span></label>
      <p className="mt-1 text-xs text-muted-foreground">Friends find you by this on the leaderboard and in duels.</p>
      <p className="mt-5 text-xs font-bold uppercase">I am a</p>
      <div className="mt-1 grid grid-cols-2 gap-2"><button className={pickBtn(zone === "youth")} onClick={() => setZone("youth")}>Teen (13–17)</button><button className={pickBtn(zone === "adult")} onClick={() => setZone("adult")}>Adult (18+)</button></div>
      <div className="mt-2 grid grid-cols-2 gap-2"><button className={pickBtn(gender === "male")} onClick={() => setGender("male")}>Brother</button><button className={pickBtn(gender === "female")} onClick={() => setGender("female")}>Sister</button></div>
      <p className="mt-3 text-xs text-muted-foreground">Under 13? A parent or guardian creates your account in their Family hub.</p>
      <button disabled={busy} onClick={() => void save()} className="mt-6 w-full border-2 border-foreground bg-primary px-4 py-3 font-bold shadow-brutal disabled:opacity-50">{busy ? "Saving…" : "Continue"}</button>
      <button onClick={() => void signOut(auth).then(() => window.location.reload())} className="mt-3 w-full text-sm underline">Not you? Log out</button>
    </div>
  </main>;
}
