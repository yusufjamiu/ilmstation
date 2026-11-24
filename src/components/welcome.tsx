import { useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Globe, Search } from "lucide-react";
import { addPhrase, languages, useLanguage, useLiveLanguages, type Lang } from "@/components/language";
import { DICT } from "@/lib/i18n-dict";

type Tile = { tag: string; title: string; ar?: string; bg: string; ink?: string };
const TILES: Tile[] = [
  { tag: "Duas", ar: "رَبَّنَا آتِنَا فِي", title: "Dua after Salah", bg: "#ff4fa3" },
  { tag: "Aqeedah", ar: "أركان الإسلام", title: "Five pillars of Islam", bg: "#14c27a" },
  { tag: "Seerah", title: "The Night of Al-Isra wal-Mi’raj", bg: "#b05cf0" },
  { tag: "Qur’an", ar: "بِسْمِ ٱللَّهِ", title: "The Basmala", bg: "#6d7fa0" },
  { tag: "Hadith", title: "40 Hadith of Imam Nawawi", bg: "#f6b700", ink: "#1c1a17" },
  { tag: "Seerah", title: "Prophet Ibrahim (AS)", bg: "#8bd14a", ink: "#1c1a17" },
  { tag: "Qur’an", title: "Suratul Mulk: The Sovereignty", bg: "#f6b700", ink: "#1c1a17" },
  { tag: "Hadith", title: "“Actions are by intentions” · Al-Bukhari", bg: "#ff7a1a" },
  { tag: "Aqeedah", ar: "لَا إِلَٰهَ إِلَّا ٱللَّهُ", title: "The Shahadah", bg: "#0fa86a" },
  { tag: "Fiqh", title: "Purification & Wudu", bg: "#ff7a1a" },
  { tag: "Qur’an", title: "Memorise Al-Kahf", bg: "#8bd14a", ink: "#1c1a17" },
  { tag: "Fiqh", title: "Zakat purifies your wealth", bg: "#14c27a" },
  { tag: "Hadith", ar: "ٱلرَّاحِمُونَ يَرْحَمُهُمُ ٱلرَّحْمَٰنُ", title: "Hadith on Mercy", bg: "#ff4fa3" },
  { tag: "Seerah", title: "The Treaty of Hudaybiyyah", bg: "#b05cf0" },
  { tag: "Arabic", title: "Root words of the Qur’an", bg: "#f6b700", ink: "#1c1a17" },
  { tag: "Aqeedah", title: "Tawhid: the Oneness of Allah", bg: "#1b8fd6" },
  { tag: "History", title: "The Golden Age of Islam", bg: "#b05cf0" },
  { tag: "Fiqh", title: "Salah: the second pillar", bg: "#1b8fd6" },
  { tag: "Seerah", title: "The Battle of Badr", bg: "#0fa86a" },
  { tag: "Qur’an", ar: "أَلَمْ نَشْرَحْ", title: "Surat Al-Inshirah", bg: "#1b8fd6" },
  { tag: "Seerah", title: "Prophet Musa (AS) & the Exodus", bg: "#ff4fa3" },
];

function TileCard({ t }: { t: Tile }) {
  return <div className="mb-3 border-2 border-black p-3 shadow-[3px_3px_0_#000]" style={{ background: t.bg, color: t.ink ?? "#fff", borderRadius: 12 }}>
    <p className="font-mono text-[10px] uppercase opacity-80">{t.tag}</p>
    {t.ar && <p dir="rtl" lang="ar" className="mt-1 text-right font-arabic text-lg leading-snug">{t.ar}</p>}
    <p className="mt-1 text-[15px] font-extrabold leading-tight">{t.title}</p>
  </div>;
}
function Column({ items, secs, reverse }: { items: Tile[]; secs: number; reverse?: boolean }) {
  return <div className="relative h-full overflow-hidden">
    <div className="welcome-col" style={{ animationDuration: `${secs}s`, animationDirection: reverse ? "reverse" : "normal" }}>
      {[...items, ...items].map((t, i) => <TileCard key={i} t={t} />)}
    </div>
  </div>;
}

/** First screen for people who aren't logged in: choose a language once, then the welcome screen. */
export function Welcome({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const { lang, set } = useLanguage();
  const live = useLiveLanguages();
  const [step, setStep] = useState<"lang" | "welcome">(() => { try { return localStorage.getItem("ilm:welcomeLang") ? "welcome" : "lang"; } catch { return "lang"; } });
  const [pick, setPick] = useState<Lang>(lang);
  const [q, setQ] = useState("");
  useEffect(() => setPick(lang), [lang]);
  const list = live.filter((l) => !q.trim() || `${l.native} ${l.label}`.toLowerCase().includes(q.trim().toLowerCase()));
  const cols = useMemo(() => [0, 7, 14, 4, 11].map((k) => [...TILES.slice(k), ...TILES.slice(0, k)]), []);

  if (step === "lang") return <div className="min-h-[100dvh] bg-[#f7f3ea]"><main className="mx-auto flex h-[100dvh] max-w-md flex-col bg-[#f7f3ea] px-6 pb-5 pt-12 text-[#1c1a17]">
    <h1 className="text-[26px] font-extrabold tracking-tight">Choose a language</h1>
    <label className="mt-4 flex items-center gap-3 rounded-xl bg-black/5 px-4 py-2.5">
      <Search className="size-4 opacity-70" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search languages…" className="w-full bg-transparent font-mono text-[13px] outline-none" />
    </label>
    <div className="-mx-1 mt-3 grid flex-1 content-start gap-2.5 overflow-y-auto px-1 pb-3 pt-1">
      {list.map((l) => { const on = l.code === pick; return <button key={l.code} type="button" onClick={() => { setPick(l.code); set(l.code); }}
        className={`flex items-center justify-between rounded-full border-[1.5px] border-black px-5 py-2.5 text-left shadow-[0_3px_0_#000] transition active:translate-y-0.5 active:shadow-[0_1px_0_#000] ${on ? "bg-[#f6b700]" : "bg-white"}`}>
        <span className={l.dir === "rtl" ? "font-sans text-[15px]" : "font-mono text-[14px]"} dir={l.dir}>{l.native}</span>
        {on && <span className="grid size-5 place-items-center rounded-full bg-[#0fa86a] text-white"><Check className="size-3.5" /></span>}
      </button>; })}
    </div>
    <button type="button" onClick={() => { set(pick); try { localStorage.setItem("ilm:welcomeLang", "1"); } catch { /* ignore */ } setStep("welcome"); }}
      className="mt-2 rounded-full border-[1.5px] border-black bg-[#f6b700] py-3 text-base font-extrabold uppercase shadow-[0_3px_0_#000] active:translate-y-0.5 active:shadow-[0_1px_0_#000]">Continue</button>
  </main></div>;

  return <main className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-black text-white">
    <style>{"@keyframes welcomeScroll{from{transform:translateY(0)}to{transform:translateY(-50%)}}.welcome-col{animation:welcomeScroll linear infinite}@media (prefers-reduced-motion: reduce){.welcome-col{animation:none}}"}</style>
    <div data-no-translate className="pointer-events-none absolute inset-x-0 top-0 grid h-[78%] grid-cols-3 gap-3 px-3 sm:grid-cols-5 sm:gap-4 sm:px-4" aria-hidden>
      <Column items={cols[0]!} secs={46} />
      <Column items={cols[1]!} secs={38} reverse />
      <Column items={cols[2]!} secs={52} />
      <div className="hidden sm:block"><Column items={cols[3]!} secs={44} reverse /></div>
      <div className="hidden sm:block"><Column items={cols[4]!} secs={49} /></div>
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-black" />
    </div>
    <button type="button" onClick={() => setStep("lang")} aria-label="Change language" className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border-2 border-white/80 bg-black/70 px-3 py-1.5 text-xs font-bold uppercase"><Globe className="size-4" />{lang}</button>
    <div className="relative z-10 mx-auto mt-auto w-full max-w-md px-6 pb-8 text-center">
      <p className="font-serif text-5xl leading-none tracking-tight">Ilm<span className="text-[#f6b700]">Station</span></p>
      <p className="mt-3 font-mono text-sm leading-relaxed text-white/80">Seek knowledge.<br />Grow together.</p>
      <button type="button" onClick={onSignup} className="mt-6 w-full rounded-full border-2 border-black bg-[#f6b700] py-4 text-lg font-extrabold uppercase text-black shadow-[0_5px_0_#7a5a00] active:translate-y-0.5">Begin your journey</button>
      <p className="mt-4 font-mono text-xs text-white/60">Already learning? <button type="button" onClick={onLogin} className="font-sans font-bold text-[#f6b700] underline-offset-4 hover:underline">Log in</button></p>
      <p className="mt-5 flex justify-center gap-4 font-mono text-[11px] uppercase tracking-widest text-white/40"><a href="/privacy">Privacy</a><span>|</span><a href="/terms">Terms</a></p>
    </div>
  </main>;
}
void languages;

/** Translates the topic cards once per language (saved on the phone and on our server). */
async function translateCards(lang: string) {
  if (lang === "en") return;
  const key = `ilm:cards:${lang}`;
  let saved: Record<string, string> = {};
  try { saved = JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { /* ignore */ }
  const texts = [...new Set(TILES.flatMap((t) => [t.tag, t.title]))];
  const known = (t: string) => (DICT as Record<string, Record<string, string>>)[t]?.[lang];
  for (const t of texts) if (!known(t) && saved[t]) addPhrase(t, lang, saved[t]);
  const missing = texts.filter((t) => !known(t) && !saved[t]);
  await Promise.all(missing.map((t) => fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t, lang }) })
    .then((r) => r.json()).then((j: { text?: string }) => { if (j.text) { saved[t] = j.text; addPhrase(t, lang, j.text); } }).catch(() => {})));
  try { localStorage.setItem(key, JSON.stringify(saved)); } catch { /* ignore */ }
}

/** In the home-screen app, the website homepage jumps straight to the app. */
export function AppHomeOnly() {
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone && window.location.pathname === "/") window.location.replace("/app");
  }, []);
  return null;
}

/** Log in and sign up on phones: smaller titles, pill buttons. */
export function AuthMobileStyle() {
  const path = useRouterState({ select: (st) => st.location.pathname });
  const on = path === "/login" || path === "/signup";
  useEffect(() => { if (on) document.body.dataset.auth = "1"; else delete document.body.dataset.auth; }, [on]);
  if (!on) return null;
  return <style>{`@media (max-width: 767px){
    body[data-auth] h1{font-size:30px!important;line-height:1.1!important;letter-spacing:-.01em}
    body[data-auth] h2{font-size:24px!important;line-height:1.15!important}
    body[data-auth] main :is(button,a)[class*="border-2"]:not([data-who-pick] *):not([class*="rounded-3xl"]){border-radius:9999px!important;border-width:1.5px!important;box-shadow:0 3px 0 hsl(var(--foreground))!important}
    body[data-auth] main :is(button,a)[class*="h-11"],body[data-auth] main :is(button,a)[class*="h-12"]{min-height:46px;font-size:15px}
    body[data-auth] main button[type=submit],body[data-auth] main button[class*="bg-primary"]{border-radius:9999px!important;border:1.5px solid hsl(var(--foreground))!important;box-shadow:0 3px 0 hsl(var(--foreground))!important;font-weight:800;text-transform:uppercase}
  }`}</style>;
}
