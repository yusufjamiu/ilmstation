/**
 * IlmWorld speaks the language the player chose on IlmStation.
 * Every English text on the game screen is translated once per language (saved on our server for
 * everyone, and on the phone), then swapped in place. Players' own chat is never touched: mark it data-keep.
 */
import { useEffect } from "react";
import { DICT } from "@/lib/i18n-dict";
import { useLanguage } from "@/components/language";

const SKIP = "[data-keep],script,style,textarea,input,select,code,pre,.font-arabic,[lang='ar']:not(html)";
const RTL = new Set(["ar", "ur"]);
const src = new WeakMap<Text, string>(); // the English the game wrote into this text node
const mine = new WeakMap<Text, string>(); // what we last wrote into it
const hasWords = (s: string) => /[A-Za-z]{2}/.test(s);
const keyOf = (s: string) => s.replace(/\d+/g, "{n}");

let cache: Record<string, string> = {};
let cacheLang = "";
const asked = new Set<string>();
let queue: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let onNew: (() => void) | null = null;

function loadCache(lang: string) {
  if (cacheLang === lang) return;
  cacheLang = lang; asked.clear(); queue = [];
  try { cache = JSON.parse(localStorage.getItem(`ilm:world:tr:${lang}`) ?? "{}"); } catch { cache = {}; }
}
function saveCache() {
  try { localStorage.setItem(`ilm:world:tr:${cacheLang}`, JSON.stringify(cache)); } catch { /* phone storage full: still works this visit */ }
}
function lookup(key: string, lang: string): string | undefined {
  return (DICT as Record<string, Record<string, string> | undefined>)[key]?.[lang] ?? cache[key];
}
function ask(key: string) {
  if (asked.has(key) || key.length > 400) return;
  asked.add(key); queue.push(key);
  if (!timer) timer = setTimeout(flush, 350);
}
async function flush() {
  timer = null;
  const lang = cacheLang;
  while (queue.length) {
    const part = queue.splice(0, 30);
    try {
      const r = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts: part, lang }) });
      const j = (await r.json()) as { t?: Record<string, string> };
      if (lang !== cacheLang) return;
      if (j.t) { Object.assign(cache, j.t); saveCache(); onNew?.(); }
      part.filter((k) => !j.t?.[k]).forEach((k) => asked.delete(k)); // try again later
    } catch { part.forEach((k) => asked.delete(k)); return; }
  }
}

/** The English currently behind a text node (what the game wrote, not our translation). */
function english(n: Text): string {
  const v = n.nodeValue ?? "";
  if (mine.has(n) && mine.get(n) === v) return src.get(n) ?? v;
  src.set(n, v); mine.delete(n);
  return v;
}
function write(n: Text, v: string) {
  if (n.nodeValue !== v) n.nodeValue = v;
  mine.set(n, v);
}

/** Translate one run of side-by-side text nodes (React splits "Say salam to {name}." into pieces). */
function doRun(run: Text[], lang: string) {
  const parts = run.map(english);
  const whole = parts.join("");
  const t = whole.trim();
  if (lang === "en" || !hasWords(t)) { run.forEach((n, i) => { if (mine.has(n)) write(n, parts[i]); }); return; }
  const key = keyOf(t);
  const tr = lookup(key, lang);
  if (!tr) { run.forEach((n, i) => { if (mine.has(n)) write(n, parts[i]); }); ask(key); return; }
  const nums = t.match(/\d+/g) ?? []; let k = 0;
  const out = tr.replace(/\{n\}/g, () => nums[k++] ?? "");
  const lead = whole.match(/^\s*/)?.[0] ?? ""; const trail = whole.match(/\s*$/)?.[0] ?? "";
  run.forEach((n, i) => write(n, i === 0 ? lead + out + trail : ""));
}
function doElement(el: Element, lang: string) {
  if (el.closest(SKIP)) return;
  let run: Text[] = [];
  for (const c of Array.from(el.childNodes)) {
    if (c.nodeType === 3) { run.push(c as Text); continue; }
    if (run.length) doRun(run, lang); run = [];
  }
  if (run.length) doRun(run, lang);
  const ph = el.getAttribute("placeholder");
  if (ph != null) {
    const base = el.getAttribute("data-en-ph") ?? ph; el.setAttribute("data-en-ph", base);
    const want = lang === "en" ? base : lookup(keyOf(base), lang) ?? (hasWords(base) ? (ask(keyOf(base)), base) : base);
    if (ph !== want) el.setAttribute("placeholder", want);
  }
}
function sweep(root: Element, lang: string) {
  doElement(root, lang);
  root.querySelectorAll("*").forEach((el) => { if (!el.closest(SKIP)) doElement(el, lang); });
}

/** Put on the game's outer element. Returns the language code so the caller can set dir/lang. */
export function useWorldLanguage(root: { current: HTMLElement | null }) {
  const { lang } = useLanguage();
  useEffect(() => {
    const el = root.current; if (!el) return;
    loadCache(lang);
    el.toggleAttribute("data-world-rtl", RTL.has(lang));
    sweep(el, lang);
    if (lang === "en") return;
    const dirty = new Set<Element>(); let raf = 0;
    const later = (e: Element | null) => { if (!e) return; dirty.add(e); if (!raf) raf = requestAnimationFrame(run); };
    function run() {
      raf = 0; const list = [...dirty]; dirty.clear();
      obs.disconnect();
      for (const e of list) if (e.isConnected) { doElement(e, lang); e.querySelectorAll("*").forEach((x) => doElement(x, lang)); }
      obs.observe(el!, opts);
    }
    const opts = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder"] };
    const obs = new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") later(m.target.parentElement);
        else if (m.type === "attributes") later(m.target as Element);
        else { later(m.target as Element); m.addedNodes.forEach((n) => later(n.nodeType === 1 ? (n as Element) : n.parentElement)); }
      }
    });
    obs.observe(el, opts);
    onNew = () => sweep(el, lang);
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); onNew = null; };
  }, [lang, root]);
  return lang;
}

/** Styles so Arabic and Urdu read right-to-left inside the game while the screen layout stays the same. */
export const WORLD_I18N_CSS = "[data-world-rtl] :is(div,span,p,button,b,li,h1,h2,h3,label,small,strong){unicode-bidi:plaintext}";
