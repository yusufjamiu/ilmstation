import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpenCheck, CalendarDays, CreditCard, ExternalLink, HandHeart, LayoutDashboard, LogOut, MapPin, Megaphone,
  Flag, Gift, Landmark, LibraryBig, Menu, MoonStar, Palette, Quote, MessagesSquare, Settings, ShieldCheck, Trophy, Tv, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { seedAdmins, seedReports, seedSponsors, type Admin, type AdminRole, type Report, type Sponsor } from "./data";
import { useAdminStore } from "./store";
import { Dashboard } from "./dashboard";
import { UsersSection } from "./users";
import { ContentSection } from "./content";
import { LibrarySection } from "./library";
import { RamadanSection } from "./ramadan";
import { CardsSection } from "./cards";
import { WisdomSection } from "./wisdom";
import { EventsSection } from "./events";
import { CentresSection } from "./centres";
import { CommunitySection } from "./community";
import { SponsorsSection } from "./sponsors";
import { BillingSection } from "./billing";
import { AnnouncementsSection, SettingsSection } from "./settings";
import { WorldAdvertsSection, WorldAwardSection, WorldQuizzesSection, WorldRacesSection } from "./world";
import { WorldContentSection } from "./world-content";
import { seedAdverts, type Advert } from "./world-data";

export const sections = ["dashboard", "users", "library", "ramadan", "cards", "wisdom", "content", "events", "centres", "community", "sponsors", "billing", "world-adverts", "world-award", "world-quizzes", "world-races", "world-content", "announcements", "settings"] as const;
export type Section = (typeof sections)[number];

const nav: { id: Section; label: string; icon: typeof Users; group: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { id: "users", label: "Users", icon: Users, group: "App" },
  { id: "library", label: "Library", icon: LibraryBig, group: "App" },
  { id: "ramadan", label: "Ramadan", icon: MoonStar, group: "App" },
  { id: "cards", label: "Card designs", icon: Palette, group: "App" },
  { id: "wisdom", label: "Daily Wisdom", icon: Quote, group: "App" },
  { id: "content", label: "Quiz content", icon: BookOpenCheck, group: "App" },
  { id: "billing", label: "Plans & billing", icon: CreditCard, group: "App" },
  { id: "events", label: "Events & pricing", icon: CalendarDays, group: "Web" },
  { id: "centres", label: "Centres", icon: MapPin, group: "Web" },
  { id: "sponsors", label: "Sponsorships", icon: HandHeart, group: "Web" },
  { id: "world-adverts", label: "Adverts", icon: Tv, group: "IlmWorld" },
  { id: "world-award", label: "Weekly award", icon: Trophy, group: "IlmWorld" },
  { id: "world-quizzes", label: "Sponsored quizzes", icon: Gift, group: "IlmWorld" },
  { id: "world-races", label: "Races", icon: Flag, group: "IlmWorld" },
  { id: "world-content", label: "World content", icon: Landmark, group: "IlmWorld" },
  { id: "community", label: "Community", icon: MessagesSquare, group: "App + Web" },
  { id: "announcements", label: "Announcements", icon: Megaphone, group: "App + Web" },
  { id: "settings", label: "Settings", icon: Settings, group: "Platform" },
];

/** Which sections each admin role can open. Frontend-only: a real build enforces this on the server. */
const access: Record<AdminRole, Section[]> = {
  owner: [...sections],
  admin: [...sections],
  editor: ["dashboard", "library", "ramadan", "cards", "wisdom", "content", "events", "centres", "sponsors", "world-award", "world-quizzes", "world-races", "world-content", "announcements"],
  moderator: ["dashboard", "users", "community", "world-adverts", "announcements"],
  support: ["dashboard", "users", "billing"],
};

export type AdminSession = { id: string; name: string; role: AdminRole };
type Session = AdminSession | null;

export const isAdminRole = (r: unknown): r is AdminRole => typeof r === "string" && r in access;

/** The /admin route has already checked Firebase (signed in + listed in "admins"). */
export function AdminApp({ session, section, onNavigate }: { session: AdminSession; section: Section; onNavigate: (s: Section) => void }) {
  const logout = async () => { await signOut(auth); window.location.href = "/"; };
  return <Shell session={session} section={section} onNavigate={onNavigate} onLogout={logout} />;
}

function Shell({ session, section, onNavigate, onLogout }: { session: NonNullable<Session>; section: Section; onNavigate: (s: Section) => void; onLogout: () => void }) {
  const [menu, setMenu] = useState(false);
  const [reports] = useAdminStore<Report[]>("reports", seedReports);
  const [sponsors] = useAdminStore<Sponsor[]>("sponsors", seedSponsors);
  const [admins] = useAdminStore<Admin[]>("admins", seedAdmins);
  const [adverts] = useAdminStore<Advert[]>("world_adverts", seedAdverts);
  const name = admins.find((a) => a.id === session.id)?.name ?? session.name;
  const allowed = access[session.role];
  const current = allowed.includes(section) ? section : "dashboard";
  const badges: Partial<Record<Section, number>> = {
    community: reports.filter((r) => r.status === "open").length,
    sponsors: sponsors.filter((s) => s.status === "new").length,
    "world-adverts": adverts.filter((a) => a.status === "pending").length,
  };
  const go = (s: Section) => { onNavigate(s); setMenu(false); window.scrollTo({ top: 0 }); };
  const items = nav.filter((n) => allowed.includes(n.id));
  const groups = [...new Set(items.map((n) => n.group))];

  const sidebar = <nav aria-label="Admin sections" className="grid gap-4 p-3">
    {groups.map((g) => <div key={g}>
      <p className="px-2 pb-1 text-[11px] font-bold uppercase text-muted-foreground">{g}</p>
      {items.filter((n) => n.group === g).map(({ id, label, icon: Icon }) => <button key={id} onClick={() => go(id)} aria-current={current === id ? "page" : undefined}
        className={cn("flex w-full items-center gap-2 px-2 py-2 text-left text-sm font-semibold", current === id ? "border-2 border-foreground bg-primary shadow-brutal-sm" : "border-2 border-transparent hover:bg-muted")}>
        <Icon className="size-4 shrink-0" /><span className="flex-1">{label}</span>
        {!!badges[id] && <span className="min-w-5 border-2 border-foreground bg-background px-1 text-center text-[11px] tabular-nums">{badges[id]}</span>}
      </button>)}
    </div>)}
  </nav>;

  const brand = <div className="flex items-center gap-2 border-b-2 border-foreground px-4 py-4"><span className="grid size-9 shrink-0 place-items-center bg-foreground font-serif text-xl text-background">I</span><span className="min-w-0"><strong className="block font-serif text-xl font-normal leading-none">IlmStation</strong><small className="text-xs font-bold uppercase text-muted-foreground">Admin</small></span></div>;

  return <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto flex max-w-[1600px] gap-5 px-3 py-3 sm:px-5 sm:py-5">
      <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-60 shrink-0 overflow-y-auto border-2 border-foreground bg-card lg:block">{brand}{sidebar}</aside>
      {menu && <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setMenu(false)}>
        <aside className="h-full w-72 max-w-[85vw] overflow-y-auto border-r-2 border-foreground bg-background" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between pr-3">{brand}<Button size="icon" variant="outline" aria-label="Close menu" onClick={() => setMenu(false)}><X /></Button></div>{sidebar}
        </aside>
      </div>}
      <div className="min-w-0 flex-1">
        <header className="mb-6 flex items-center gap-2">
          <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMenu(true)}><Menu /></Button>
          <span className="hidden items-center gap-1 border-2 border-foreground bg-muted px-2 py-1 text-xs font-bold uppercase sm:flex"><ShieldCheck className="size-4" /> Sample data</span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" className="hidden md:inline-flex"><Link to="/">Website <ExternalLink /></Link></Button>
            <Button asChild variant="outline" className="hidden md:inline-flex"><Link to="/app">App <ExternalLink /></Link></Button>
            <ThemeToggle />
            <span className="hidden text-right text-sm leading-tight sm:block"><b className="block">{name}</b><span className="text-xs capitalize text-muted-foreground">{session.role}</span></span>
            <Button variant="outline" size="icon" aria-label="Sign out" onClick={onLogout}><LogOut /></Button>
          </div>
        </header>
        <main className="pb-12">
          {current === "dashboard" && <Dashboard go={go} />}
          {current === "users" && <UsersSection />}
          {current === "library" && <LibrarySection />}
          {current === "ramadan" && <RamadanSection />}
          {current === "cards" && <CardsSection />}
          {current === "wisdom" && <WisdomSection />}
          {current === "content" && <ContentSection />}
          {current === "events" && <EventsSection />}
          {current === "centres" && <CentresSection />}
          {current === "community" && <CommunitySection />}
          {current === "sponsors" && <SponsorsSection />}
          {current === "billing" && <BillingSection />}
          {current === "world-adverts" && <WorldAdvertsSection />}
          {current === "world-award" && <WorldAwardSection />}
          {current === "world-quizzes" && <WorldQuizzesSection />}
          {current === "world-races" && <WorldRacesSection />}
          {current === "world-content" && <WorldContentSection />}
          {current === "announcements" && <AnnouncementsSection />}
          {current === "settings" && <SettingsSection role={session.role} />}
        </main>
      </div>
    </div>
  </div>;
}
