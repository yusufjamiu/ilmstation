import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Theme = "light" | "dark";
const KEY = "iq_theme";

const apply = (t: Theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
};

const read = (): Theme => {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/** Theme state shared through the `dark` class on <html>; persists in localStorage. */
export function useTheme() {
  // Always start light so server and first client render agree, then sync.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = read();
    setTheme(initial);
    apply(initial);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setTheme(e.newValue);
        apply(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const set = (t: Theme) => {
    setTheme(t);
    apply(t);
    window.localStorage.setItem(KEY, t);
  };

  return { theme, setTheme: set, toggle: () => set(theme === "dark" ? "light" : "dark") };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return <Button
    variant="outline"
    size="icon"
    className={className}
    aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    onClick={toggle}
  >
    {theme === "dark" ? <Sun /> : <Moon />}
  </Button>;
}
