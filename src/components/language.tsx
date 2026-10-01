import { useEffect, useSyncExternalStore } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const languages = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
  { code: "fr", label: "French", native: "Français", dir: "ltr" },
  { code: "ur", label: "Urdu", native: "اردو", dir: "rtl" },
] as const;
export type Lang = (typeof languages)[number]["code"];

const dict: Record<string, Partial<Record<Lang, string>>> = {
  Home: { ar: "الرئيسية", fr: "Accueil", ur: "ہوم" },
  Events: { ar: "الفعاليات", fr: "Événements", ur: "تقریبات" },
  Centres: { ar: "المراكز", fr: "Centres", ur: "مراکز" },
  Chatrooms: { ar: "الغرف", fr: "Salons", ur: "چیٹ روم" },
  Sponsor: { ar: "ادعم", fr: "Parrainer", ur: "سرپرستی" },
  "Open dashboard": { ar: "لوحة التحكم", fr: "Tableau de bord", ur: "ڈیش بورڈ" },
  "Log in": { ar: "تسجيل الدخول", fr: "Se connecter", ur: "لاگ ان" },
  "Get started": { ar: "ابدأ الآن", fr: "Commencer", ur: "شروع کریں" },
};

const KEY = "iq_lang";
const subs = new Set<() => void>();
const read = (): Lang => { try { const v = localStorage.getItem(KEY); return (languages.some((l) => l.code === v) ? v : "en") as Lang; } catch { return "en"; } };

export function useLanguage() {
  const lang = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, read, () => "en" as Lang);
  const set = (l: Lang) => { localStorage.setItem(KEY, l); subs.forEach((f) => f()); };
  const t = (s: string) => dict[s]?.[lang] ?? s;
  return { lang, set, t };
}

export function LanguageSelect({ className }: { className?: string }) {
  const { lang, set } = useLanguage();
  const current = languages.find((l) => l.code === lang)!;
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" className={cn("gap-1.5", className)} aria-label={`Language: ${current.label}`}>
        <Globe /><span className="font-bold uppercase">{current.code}</span><ChevronDown className="size-3 opacity-70" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56 rounded-none border-2 border-foreground p-1 shadow-brutal">
      <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">Choose language</DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-foreground" />
      {languages.map((l) => <DropdownMenuItem key={l.code} onSelect={() => { set(l.code); toast.success(`Language set to ${l.label}`); }} className={cn("flex cursor-pointer items-center justify-between rounded-none px-3 py-2", l.code === lang && "bg-primary text-foreground focus:bg-primary")}>
        <span><span className="block font-semibold" dir={l.dir}>{l.native}</span><span className="text-xs text-muted-foreground">{l.label}</span></span>
        {l.code === lang && <Check className="size-4" />}
      </DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}
