import { Link } from "@tanstack/react-router";
import { useAuth } from "@/components/auth";
import { IlmStationApp } from "@/components/ilmstation-app";

/** /app: logged in → the app; not logged in → welcome screen with Create account / Log in. */
export function AppGate() {
  const { account, ready } = useAuth();
  if (!ready) return <div className="grid min-h-screen place-items-center bg-background">
    <div className="grid size-16 animate-pulse place-items-center border-2 border-foreground bg-foreground font-serif text-3xl text-background">I</div>
  </div>;
  if (account) return <IlmStationApp />;
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
