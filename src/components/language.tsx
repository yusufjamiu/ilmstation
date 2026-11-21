import { useEffect, useSyncExternalStore } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DICT } from "@/lib/i18n-dict";
import { doc as lDoc, setDoc as lSet, onSnapshot as lSnap } from "firebase/firestore";
import { auth as lAuth, db as lDb } from "@/lib/firebase";

export const languages = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
  { code: "fr", label: "French", native: "Français", dir: "ltr" },
  { code: "ur", label: "Urdu", native: "اردو", dir: "rtl" },
  { code: "ha", label: "Hausa", native: "Hausa", dir: "ltr" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia", dir: "ltr" },
  { code: "tl", label: "Filipino", native: "Filipino", dir: "ltr" },
] as const;
export type Lang = (typeof languages)[number]["code"];

const dict: Record<string, Partial<Record<Lang, string>>> = {
  Home: { ar: "الرئيسية", ha: "Gida", fr: "Accueil", ur: "ہوم" },
  Events: { ar: "الفعاليات", ha: "Taruka", fr: "Événements", ur: "تقریبات" },
  Centres: { ar: "المراكز", ha: "Cibiyoyi", fr: "Centres", ur: "مراکز" },
  Chatrooms: { ar: "الغرف", ha: "Dakunan hira", fr: "Salons", ur: "چیٹ روم" },
  Sponsor: { ar: "ادعم", ha: "Tallafa", fr: "Parrainer", ur: "سرپرستی" },
  "Open dashboard": { ar: "لوحة التحكم", ha: "Buɗe dashboard", fr: "Tableau de bord", ur: "ڈیش بورڈ" },
  "Log in": { ar: "تسجيل الدخول", ha: "Shiga", fr: "Se connecter", ur: "لاگ ان" },
  "Get started": { ar: "ابدأ الآن", ha: "Fara yanzu", fr: "Commencer", ur: "شروع کریں" },
};

const KEY = "iq_lang";
const subs = new Set<() => void>();
const detect = (): Lang => { try { for (const n of navigator.languages ?? [navigator.language]) { const low = n.toLowerCase(); const c = low.startsWith("fil") || low.startsWith("tl") ? "tl" : low.slice(0, 2) === "in" ? "id" : low.slice(0, 2); if (languages.some((l) => l.code === c)) return c as Lang; } } catch { /* ignore */ } return "en"; };
const read = (): Lang => { try { const v = localStorage.getItem(KEY); if (languages.some((l) => l.code === v)) return v as Lang; const d = detect(); localStorage.setItem(KEY, d); return d; } catch { return "en"; } };

export function useLanguage() {
  const lang = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, read, () => "en" as Lang);
  const set = (l: Lang) => { localStorage.setItem(KEY, l); subs.forEach((f) => f()); const u = lAuth.currentUser; if (u) void lSet(lDoc(lDb, "profiles", u.uid), { language: l }, { merge: true }).catch(() => {}); };
  const t = (s: string) => (lang === "en" ? s : (DICT[s] as Record<string, string> | undefined)?.[lang] ?? dict[s]?.[lang] ?? s);
  return { lang, set, t };
}

export function LanguageSelect({ className }: { className?: string }) {
  const { lang, set } = useLanguage();
  const liveLangs = useLiveLanguages();
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
      {liveLangs.map((l) => <DropdownMenuItem key={l.code} onSelect={() => { set(l.code); toast.success(`Language set to ${l.label}`); }} className={cn("flex cursor-pointer items-center justify-between rounded-none px-3 py-2", l.code === lang && "bg-primary text-foreground focus:bg-primary")}>
        <span><span className="block font-semibold" dir={l.dir}>{l.native}</span><span className="text-xs text-muted-foreground">{l.label}</span></span>
        {l.code === lang && <Check className="size-4" />}
      </DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

/* ---------- whole-app translator: swaps known phrases on screen, flips Arabic/Urdu to right-to-left ---------- */
const orig = new WeakMap<Text, string>();
const SKIP = "script,style,textarea,code,pre,[data-no-translate],[lang='ar']:not(html),.font-arabic";
function trWord(key: string, lang: Lang): string | undefined { return lang === "en" ? undefined : (DICT[key] as Record<string, string> | undefined)?.[lang]; }
const RTL_FIX = "[dir=rtl] .ml-auto{margin-left:0!important;margin-right:auto!important}[dir=rtl] .mr-auto{margin-right:0!important;margin-left:auto!important}[dir=rtl] [class*='space-x-']>:not([hidden])~:not([hidden]){--tw-space-x-reverse:1}" +
  [["1", ".25rem"], ["1.5", ".375rem"], ["2", ".5rem"], ["3", ".75rem"], ["4", "1rem"]].map(([k, v]) => { const c = k.replace(".", "\\."); return `[dir=rtl] .ml-${c}{margin-left:0!important;margin-right:${v}!important}[dir=rtl] .mr-${c}{margin-right:0!important;margin-left:${v}!important}`; }).join("");
function trAny(s: string, lang: Lang, deep = 0): string | undefined {
  if (lang === "en") return undefined;
  const d = (DICT[s] as Record<string, string> | undefined)?.[lang]; if (d) return d;
  const nn = s.match(/\d+/g);
  if (nn) { const t = (DICT[s.replace(/\d+/g, "{n}")] as Record<string, string> | undefined)?.[lang]; if (t) { let k = 0; return t.replace(/\{n\}/g, () => nn[k++] ?? ""); } }
  if (deep < 3 && /: | · /.test(s)) { // titles like "The Alphabet: أ – خ" or "Continue · 1 of 27 done": translate piece by piece
    const bits = s.split(/(: | · )/); let hit = false;
    const out = bits.map((b, i) => { if (i % 2 || !/[A-Za-z]/.test(b)) return b; const t = trAny(b.trim(), lang, deep + 1); if (t) { hit = true; return t; } return b; });
    if (hit) return out.join("");
  }
  const nums = s.match(/\d+/g); if (!nums) return undefined;
  const t = (DICT[s.replace(/\d+/g, "{n}")] as Record<string, string> | undefined)?.[lang]; if (!t) return undefined;
  let k = 0; return t.replace(/\{n\}/g, () => nums[k++] ?? "");
}
const isKey = (s: string): boolean => !!DICT[s] || (/\d/.test(s) && !!DICT[s.replace(/\d+/g, "{n}")]) || (/: | · /.test(s) && s.split(/: | · /).some((b) => isKey(b.trim())));
function fixText(n: Text, lang: Lang) {
  const raw = n.nodeValue ?? ""; const cur = raw.trim(); if (!cur) return;
  const el = n.parentElement; if (!el || el.closest(SKIP)) return;
  const was = orig.get(n);
  const known = !!was && (cur === was || (["ar", "fr", "ur", "ha", "id", "tl"] as Lang[]).some((l) => trAny(was, l) === cur));
  const key = known ? was : (isKey(cur) ? cur : undefined);
  if (!key) return;
  orig.set(n, key);
  const want = trAny(key, lang) ?? key;
  if (cur !== want) n.nodeValue = raw.replace(cur, want);
}
function fixAttrs(el: Element, lang: Lang) {
  for (const a of ["placeholder", "aria-label", "title"]) {
    const v = el.getAttribute(a); if (!v) continue;
    const store = `data-i18n-${a}`; const base = el.getAttribute(store) ?? (DICT[v] ? v : null); if (!base) continue;
    el.setAttribute(store, base); const want = trWord(base, lang) ?? base; if (v !== want) el.setAttribute(a, want);
  }
}
function sweep(root: Node, lang: Lang) {
  if (root.nodeType === 3) { fixText(root as Text, lang); return; }
  if (root.nodeType !== 1) return;
  const el = root as Element; if (el.closest(SKIP)) return;
  fixAttrs(el, lang); el.querySelectorAll("[placeholder],[aria-label],[title]").forEach((x) => fixAttrs(x, lang));
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t: Node | null; while ((t = w.nextNode())) fixText(t as Text, lang);
}
let obs: MutationObserver | null = null;
/** Put once near the top of the app: applies language, direction and the translator. */
export function LanguageBoot() {
  const { lang, set } = useLanguage();
  const liveL = useLiveLanguages();
  useEffect(() => { if (liveReady && !liveL.some((l) => l.code === lang)) set("en"); }, [lang, liveL]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const dir = languages.find((l) => l.code === lang)?.dir ?? "ltr";
    document.documentElement.lang = lang; document.documentElement.dir = dir;
    document.getElementById("i18n-bidi")?.remove(); { const st = document.createElement("style"); st.id = "i18n-bidi"; st.textContent = ["p", "li", "h1", "h2", "h3", "span", "b", "small", "label"].map((t) => `[dir=rtl] ${t}:not([dir]):not([lang='ar']):not([lang='ar'] *):not([dir] *)`).join(",") + "{unicode-bidi:plaintext}" + RTL_FIX; document.head.appendChild(st); }
    obs?.disconnect();
    sweep(document.body, lang);
    obs = new MutationObserver((list) => { for (const m of list) { if (m.type === "characterData") fixText(m.target as Text, lang); else m.addedNodes.forEach((n) => sweep(n, lang)); } });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => obs?.disconnect();
  }, [lang]);
  return null;
}
/** Settings card: choose the app language. */
export function LanguageCard() {
  return <div className="mt-6 border-2 border-foreground p-5">
    <p className="font-serif text-2xl">🌍 Language</p>
    <p className="mt-1 text-sm text-muted-foreground">English · العربية · Français · اردو · Hausa</p>
    <div className="mt-3"><LanguageSelect /></div>
  </div>;
}

/** Qur'an meaning in the user's language (trusted published translations). */
const QURAN_EDITIONS: Record<string, string> = { en: "en.sahih", ar: "ar.muyassar", fr: "fr.hamidullah", ur: "ur.jalandhry", ha: "ha.gumi", id: "id.indonesian", tl: "en.sahih" };
export function quranEdition(): string {
  try { return QURAN_EDITIONS[localStorage.getItem("iq_lang") ?? "en"] ?? "en.sahih"; } catch { return "en.sahih"; }
}

/** Languages the admin has switched on (Admin → Languages). English is always on. */
export const DEFAULT_LIVE = ["en", "ar", "fr", "ur", "ha"];
let live: string[] = DEFAULT_LIVE; let liveReady = false; let liveStarted = false;
const liveSubs = new Set<() => void>();
function startLive() {
  if (liveStarted) return; liveStarted = true;
  lSnap(lDoc(lDb, "siteConfig", "languages"), (snap) => {
    const e = snap.data()?.enabled; live = Array.isArray(e) ? ["en", ...e.filter((x: string) => x !== "en")] : DEFAULT_LIVE; liveReady = true; liveSubs.forEach((f) => f());
  }, () => { liveReady = true; });
}
export function useLiveLanguages() {
  const v = useSyncExternalStore((cb) => { startLive(); liveSubs.add(cb); return () => liveSubs.delete(cb); }, () => live, () => DEFAULT_LIVE);
  return languages.filter((l) => v.includes(l.code));
}
