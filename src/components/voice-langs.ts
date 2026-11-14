import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { setLiveVoiceLangs, VOICE_LANGS, type VoiceLangDef } from "@/components/study-core";

/** The admin's teaching languages (siteConfig/languages), with English always included. */
export function cleanVoiceLangs(v: unknown): VoiceLangDef[] {
  const arr = Array.isArray(v) ? (v as Partial<VoiceLangDef>[]) : [];
  const l: VoiceLangDef[] = arr.filter((x) => x && typeof x.code === "string" && x.code && typeof x.name === "string")
    .map((x) => ({ code: String(x.code), name: String(x.name), ...(x.hidden ? { hidden: true } : {}) }));
  if (!l.length) return VOICE_LANGS.map((x) => ({ code: x.code, name: x.name }));
  if (!l.some((x) => x.code === "en")) l.unshift({ code: "en", name: "English" });
  return l;
}

/** Keeps the live list up to date (call it once in any screen that shows languages). */
export function useVoiceLangs() {
  const [l, setL] = useState<VoiceLangDef[]>(() => cleanVoiceLangs(null));
  useEffect(() => onSnapshot(doc(db, "siteConfig", "languages"), (s) => { const x = cleanVoiceLangs(s.get("voice")); setLiveVoiceLangs(x); setL(x); }, () => {}), []);
  return l;
}
