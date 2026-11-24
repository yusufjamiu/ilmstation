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
  useEffect(() => { void translateCards(lang); }, [lang, step]);
  const list = live.filter((l) => !q.trim() || `${l.native} ${l.label}`.toLowerCase().includes(q.trim().toLowerCase()));
  const cols = useMemo(() => [TILES.filter((_, i) => i % 3 === 0), TILES.filter((_, i) => i % 3 === 1), TILES.filter((_, i) => i % 3 === 2)], []);

  if (step === "lang") return <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-[#f7f3ea] px-5 pb-6 pt-10 text-[#1c1a17]">
    <h1 className="text-3xl font-extrabold tracking-tight">Choose a language</h1>
    <label className="mt-5 flex items-center gap-3 rounded-2xl bg-black/5 px-4 py-3">
      <Search className="size-5 opacity-70" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search languages…" className="w-full bg-transparent font-mono text-sm outline-none" />
    </label>
    <div className="mt-4 grid flex-1 content-start gap-3 overflow-y-auto pb-4">
      {list.map((l) => { const on = l.code === pick; return <button key={l.code} type="button" onClick={() => { setPick(l.code); set(l.code); }}
        className={`flex items-center justify-between rounded-full border-2 border-black px-6 py-3.5 text-left shadow-[0_4px_0_#000] transition active:translate-y-0.5 active:shadow-[0_2px_0_#000] ${on ? "bg-[#f6b700]" : "bg-white"}`}>
        <span className="font-mono text-base" dir={l.dir}>{l.native}</span>
        {on && <span className="grid size-6 place-items-center rounded-full bg-[#0fa86a] text-white"><Check className="size-4" /></span>}
      </button>; })}
    </div>
    <button type="button" onClick={() => { set(pick); try { localStorage.setItem("ilm:welcomeLang", "1"); } catch { /* ignore */ } setStep("welcome"); }}
      className="mt-2 rounded-full border-2 border-black bg-[#f6b700] py-4 text-lg font-extrabold uppercase shadow-[0_5px_0_#000] active:translate-y-0.5 active:shadow-[0_2px_0_#000]">Continue</button>
  </main>;

  return <main className="relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-black text-white">
    <style>{"@keyframes welcomeScroll{from{transform:translateY(0)}to{transform:translateY(-50%)}}.welcome-col{animation:welcomeScroll linear infinite}@media (prefers-reduced-motion: reduce){.welcome-col{animation:none}}"}</style>
    <div className="pointer-events-none absolute inset-x-0 top-0 grid h-[78%] grid-cols-3 gap-3 px-3" aria-hidden>
      <Column items={cols[0]!} secs={46} />
      <Column items={cols[1]!} secs={38} reverse />
      <Column items={cols[2]!} secs={52} />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-black" />
    </div>
    <button type="button" onClick={() => setStep("lang")} aria-label="Change language" className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border-2 border-white/80 bg-black/70 px-3 py-1.5 text-xs font-bold uppercase"><Globe className="size-4" />{lang}</button>
    <div className="relative z-10 mt-auto px-6 pb-8 text-center">
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
