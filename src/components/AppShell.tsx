import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Compass,
  Flame,
  Home,
  Library,
  Menu,
  MoreHorizontal,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { Avatar, Bar, Btn, Modal, Mono } from "./kit";
import { StreakModal } from "./StreakModal";

const NAV = [
  { to: "/home", label: "Overview", icon: Home },
  { to: "/play", label: "Play", icon: Target },
  { to: "/quests", label: "My quests", icon: Compass },
  { to: "/library", label: "Library", icon: Library },
  { to: "/ilmbot", label: "IlmBot", icon: Bot },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile", icon: CircleUserRound },
] as const;

const MORE = [
  { to: "/hifz", label: "Hifz Mode", icon: BookOpen },
  { to: "/halaqah", label: "Halaqah", icon: CircleUserRound },
  { to: "/challenge/setup", label: "Challenge", icon: Target },
  { to: "/progress", label: "My Progress", icon: Trophy },
  { to: "/achievements", label: "Achievements", icon: Sparkles },
  { to: "/wallet", label: "Points Wallet", icon: CircleUserRound },
  { to: "/store", label: "Points Store", icon: Compass },
  { to: "/wisdom", label: "Daily Wisdom", icon: BookOpen },
  { to: "/bookmarks", label: "Bookmarks", icon: Library },
  { to: "/friends", label: "Friends", icon: CircleUserRound },
  { to: "/ramadan", label: "Ramadan Mode", icon: Sparkles },
  { to: "/share", label: "Share Cards", icon: MoreHorizontal },
  { to: "/settings", label: "Settings", icon: MoreHorizontal },
] as const;

function NavLink({ to, label, icon: Icon, collapsed, path }: {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  collapsed: boolean;
  path: string;
}) {
  const active = path === to || path.startsWith(to + "/");
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-r8 px-3 text-[14px] font-bold transition-colors",
        active ? "bg-yellow text-ink" : "text-ink2 hover:bg-field hover:text-ink",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon size={19} strokeWidth={active ? 2.5 : 2} />
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}

export function AppShell({ children, title, subtitle, back, wide }: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: { to: string; label?: string };
  wide?: boolean;
}) {
  const { s, level, totalPoints } = useApp();
  const path = useRouterState({ select: (st) => st.location.pathname });
  const [streakOpen, setStreakOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const unread = s.notifs.filter((n) => n.unread).length;
  const inLevel = level.max === Infinity ? 1 : (s.xp - level.min) / (level.max - level.min + 1);

  return (
    <div className="min-h-screen bg-page lg:flex">
      <aside className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/25 bg-surface px-4 py-6 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <Link to="/home" className="flex items-center gap-2.5 font-black">
            <span className="brutal-sm grid h-10 w-10 shrink-0 place-items-center rounded-r8 bg-yellow">
              <Sparkles size={19} strokeWidth={2.5} />
            </span>
            {!collapsed ? <span className="text-[19px]">IlmStation</span> : null}
          </Link>
          {!collapsed ? (
            <Btn variant="ghost" size="sm" className="h-9 min-h-0 w-9 p-0" onClick={() => setCollapsed(true)} aria-label="Collapse navigation">
              <ChevronLeft size={17} />
            </Btn>
          ) : null}
        </div>

        {collapsed ? (
          <Btn variant="ghost" size="sm" className="mx-auto mt-3 h-9 min-h-0 w-9 p-0" onClick={() => setCollapsed(false)} aria-label="Expand navigation">
            <ChevronRight size={17} />
          </Btn>
        ) : null}

        <nav className="mt-10 space-y-1" aria-label="Main">
          {NAV.map((item) => <NavLink key={item.to} {...item} collapsed={collapsed} path={path} />)}
          <Btn variant="ghost" full className={cn("justify-start border-transparent px-3 font-bold shadow-none", collapsed && "px-0")} onClick={() => setMenuOpen(true)}>
            <MoreHorizontal size={19} /> {!collapsed ? "More" : null}
          </Btn>
        </nav>

        <div className="mt-auto">
          {!collapsed ? (
            <button onClick={() => setStreakOpen(true)} className="w-full rounded-r12 border border-border/30 bg-green-l p-4 text-left transition-colors hover:bg-green-l/70">
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] font-bold uppercase text-ink2">Current streak</span>
                <Flame size={17} />
              </div>
              <div className="mt-1 text-[22px] font-black">{s.streak} days</div>
              <Bar value={Math.min(1, s.streak / 14)} className="mt-3" tone="green" label="Streak milestone" />
            </button>
          ) : (
            <Btn variant="ghost" className="mx-auto w-11 px-0" onClick={() => setStreakOpen(true)} aria-label={`${s.streak} day streak`}>
              <Flame size={19} />
            </Btn>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border/20 bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/home" className="flex items-center gap-2 font-black lg:hidden">
              <span className="brutal-sm grid h-9 w-9 place-items-center rounded-r8 bg-yellow"><Sparkles size={17} /></span>
              <span className="hidden sm:block">IlmStation</span>
            </Link>
            <div className="hidden lg:block">
              <p className="text-[15px] font-black">{title ?? "Student dashboard"}</p>
              <p className="text-[12px] text-muted">Level {level.level} · {level.name}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Link to="/wallet" className="hidden rounded-r8 bg-field px-3 py-2 text-[12px] font-bold sm:block">
                <Mono>{totalPoints}</Mono> pts
              </Link>
              <Link to="/notifications" className="relative grid h-10 w-10 place-items-center rounded-r8 border border-border/20 hover:bg-field" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                <Bell size={19} />
                {unread > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-rf bg-pink" /> : null}
              </Link>
              <Link to="/profile" className="flex items-center gap-3 border-l border-border/20 pl-3">
                <span className="hidden text-right md:block">
                  <span className="block text-[13px] font-bold">{s.name || "Seeker"}</span>
                  <span className="block text-[11px] text-muted">{s.xp} XP</span>
                </span>
                <Avatar emoji={s.avatar} size={38} ring="green" />
              </Link>
              <Btn variant="ghost" className="h-10 min-h-0 w-10 p-0 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </Btn>
            </div>
          </div>
        </header>

        <main className={cn("mx-auto px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-12", wide ? "max-w-[1500px]" : "max-w-4xl")}>
          {(title || back) ? (
            <div className="mb-7">
              {back ? <Link to={back.to} className="mb-3 inline-flex items-center gap-2 text-[13px] font-bold text-ink2 hover:text-ink"><ChevronLeft size={16} />{back.label ?? "Back"}</Link> : null}
              {title ? <h1 className="text-[34px] leading-tight font-black">{title}</h1> : null}
              {subtitle ? <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink2">{subtitle}</p> : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/25 bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden" aria-label="Primary">
        {NAV.slice(0, 5).map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return <Link key={item.to} to={item.to} className={cn("flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold", active ? "text-ink" : "text-muted")}>
            <span className={cn("grid h-7 w-9 place-items-center rounded-rf", active && "bg-yellow")}><Icon size={18} strokeWidth={active ? 2.5 : 2} /></span>
            {item.label === "My quests" ? "Quests" : item.label}
          </Link>;
        })}
      </nav>

      <StreakModal open={streakOpen} onClose={() => setStreakOpen(false)} />
      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Explore IlmStation" wide>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...NAV, ...MORE].map((item) => {
            const Icon = item.icon;
            return <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-r8 border border-border/20 bg-field px-3 py-3 text-[14px] font-bold hover:bg-yellow">
              <Icon size={18} /> {item.label}
            </Link>;
          })}
        </div>
        <Btn variant="outline" full className="mt-4" onClick={() => setMenuOpen(false)}><X size={17} /> Close</Btn>
      </Modal>
    </div>
  );
}