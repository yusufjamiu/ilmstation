/* Qira'ah reading engine — shared by every word/phrase lesson. Built by build.py; do not edit by hand. */

/* Turns vowelled Arabic into an exact pronunciation guide for the voice: كَتَبَ → "ka-ta-ba", خَرُوف → "kha-ruuf".
   Short vowels a/i/u, long aa/ii/uu, shadda doubles the letter, sukun closes the syllable. */
const SAY_TR = {"ب":"b","ت":"t","ث":"th","ج":"j","ح":"ḥ","خ":"kh","د":"d","ذ":"dh","ر":"r","ز":"z","س":"s","ش":"sh","ص":"ṣ","ض":"ḍ",
  "ط":"ṭ","ظ":"ẓ","ع":"ʿ","غ":"gh","ف":"f","ق":"q","ك":"k","ل":"l","م":"m","ن":"n","ه":"h","و":"w","ي":"y",
  "ء":"ʾ","أ":"ʾ","إ":"ʾ","ؤ":"ʾ","ئ":"ʾ","ا":"ʾ","ة":"t"};
function sayGuide(text){
  const words = text.split(/\s+/).filter(Boolean).map((word, wi)=>{
    if(/^[\u064B-\u0652\u0670]*ا?لل[\u064B-\u0652\u0670]*ه[\u064B-\u0652]*$/.test(word.replace(/[\u064B-\u0652\u0670]/g,""))) return "al-laah";
    const ch=[...word.replace(/[،.]/g,"")], toks=[]; // {c, v}
    for(let i=0;i<ch.length;i++){
      const c=ch[i]; if(/[ً-ْٰ]/.test(c)) continue;
      let v=null, sh=false, j=i+1;
      while(j<ch.length && /[ً-ْٰ]/.test(ch[j])){ const m=ch[j];
        if(m==="َ")v="a"; else if(m==="ِ")v="i"; else if(m==="ُ")v="u";
        else if(m==="ً")v="an"; else if(m==="ٍ")v="in"; else if(m==="ٌ")v="un";
        else if(m==="ْ")v=""; else if(m==="ّ")sh=true; else if(m==="ٰ")v="aa"; j++; }
      const prev=toks[toks.length-1];
      if(c==="ا" && v===null && i===0){ if(wi===0) toks.push({c:"", v: ch[1]==="ل" ? "a" : "i"}); else toks.push({c:"~",v:""}); continue; }  // Hamzatul Wasl: said only at the start
      if(c==="ا" && v===null && prev && !prev.v.startsWith("a") && prev.v!=="") continue;                 // wasl inside a word: بِٱلَّيْلِ
      if(("اى").includes(c) && v===null && prev && prev.v==="an") continue;                               // the alif after tanween fath is silent
      if(c==="ل" && v===null && !sh && /\u0651/.test(ch.slice(i+1, i+4).join(""))) continue;                // sun laam: written, not said
      // long vowels: plain ا/ى after a, و after u, ي after i
      if(v===null && prev && ((("اى").includes(c)&&prev.v==="a")||(c==="و"&&prev.v==="u")||(c==="ي"&&prev.v==="i"))){ prev.v+=prev.v; continue; }
      if(c==="ة" && v===null){ toks.push({c:"h",v:""}); continue; }          // ta marbuta at a stop
      const cons = SAY_TR[c] ?? c;
      if(sh) toks.push({c:cons,v:""});
      toks.push({c:cons, v: v===null ? "" : v});
    }
    // syllables: a new one starts at each consonant that carries a vowel
    let out=""; toks.forEach((t,k)=>{ if(k && t.v && out && !out.endsWith("-")) out+="-"; out+=t.c+t.v; });
    return out.replace(/^ʾ/,"").replace(/^-/,"");
  });
  // a word starting with Hamzatul Wasl joins the word before it: مَا ٱلْعَقَبَةُ → "mal-ʿa-qa-ba-tu"
  const out=[]; for(const w of words){
    if(w.startsWith("~") && out.length){ let p=out.pop(); p = /(an|in|un)$/.test(p) ? p+"i" : p.replace(/(aa|ii|uu)$/, m=>m[0]); out.push(p + w.slice(1).replace(/^-/,"")); }
    else out.push(w.replace(/^~-?/,""));
  }
  return out.join(" ");
}
/* ===== VOICE: 1) teacher recording  2) OpenAI voice (/api/tts) with exact pronunciation  3) phone voice as last resort =====
   Phones and tablets block sound that starts before the first tap. So: ONE audio player, unlocked by the first tap
   anywhere; if a word was blocked, that first tap plays it. */
const VOICE_ENDPOINT = "https://ilmstation.com/api/tts";
const AUDIO = {};   // teacher recordings later, e.g. {"بَاءْ":"https://…/baa.mp3"}
const SILENT = "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";
let player = null; var muted = false;
const voiceEl = new Audio(); voiceEl.preload = "auto"; voiceEl.setAttribute("playsinline", "");
let unlocked = false, pending = null;
// iPhone/iPad only unlock sound on a full tap (finger lifted) — so listen to all three
function unlockVoice(){
  if (!unlocked) { unlocked = true; if (!pending) { voiceEl.src = SILENT; voiceEl.play().catch(()=>{}); } }
  if (pending) { const [t,l] = pending; pending = null; speak(t,.85,l); }
}
["pointerdown","touchend","click"].forEach(ev => addEventListener(ev, unlockVoice, true));
function stopVoice(){ try{ voiceEl.pause(); }catch(e){} if(player){ player.pause(); player=null; } try{ speechSynthesis.cancel(); }catch(e){} }
// adults hear a calm adult narrator; children hear Nuri
const WHO = (typeof LESSON!=="undefined" && /adult/.test(LESSON.course)) ? "adult" : "kid";
function voiceUrl(text, rate=.85, lang="ar"){
  if (AUDIO[text]) return AUDIO[text];
  // instructions (lang "en"): translated and read in the learner's language
  if (lang!=="ar") return `${VOICE_ENDPOINT}?text=${encodeURIComponent(TX(text))}&lang=${LANG}&who=${WHO}&slow=0&v=${["yo","ig","ha"].includes(LANG)?"6n":"4"}`;
  // letter names ending in ـاءْ (بَاءْ تَاءْ…): the voice turns the final hamza into an extra "ha",
  // so it says them the way the alphabet is recited: "baa", "taa" (the screen still shows the full name)
  const spoken = lang==="ar" ? text.replace(/اءْ?(?=\s|$|،)/g, "ا") : text;
  const q = lang==="ar" ? `&say=${encodeURIComponent(sayGuide(spoken))}` : `&lang=${lang}&who=${WHO}`;
  // v = voice version: raise it when the voice rules change, so saved recordings are made again
  return `${VOICE_ENDPOINT}?text=${encodeURIComponent(spoken)}${q}&slow=${rate<.6?1:0}&v=${lang==="ar"?2:3}`;
}
/** Fetch a lesson's sounds in the background (3 at a time), so they play instantly when tapped. */
async function prefetchVoices(items){
  const urls = [...new Set(items.filter(Boolean).map(([t,l]) => voiceUrl(t, l==="en"?.95:.85, l||"ar")))];
  let k = 0;
  const worker = async () => { while (k < urls.length) { const u = urls[k++]; try { await fetch(u, { mode:"no-cors", cache:"force-cache" }); } catch(e){} } };
  // Yoruba/Igbo/Hausa voices come from a service that prefers one request at a time
  await Promise.all(["yo","ig","ha"].includes(LANG) ? [worker()] : [worker(), worker(), worker()]);
}
/** Arabic by default; speakEn() is the friendly English voice for instructions.
    The audio plays straight from the voice server's address (Safari won't play downloaded copies inside the app's lesson box). */
async function speak(text, rate=.85, lang="ar"){
  if (muted) return; stopVoice();
  // letter names ending in ـاءْ (بَاءْ تَاءْ…): the voice turns the final hamza into an extra "ha",
  // so it says them the way the alphabet is recited: "baa", "taa" (the screen still shows the full name)
  const url = voiceUrl(text, rate, lang);
  try{
    voiceEl.src = url;
    await voiceEl.play(); pending = null;
    // wait for the whole sentence (long intro sentences can run 20–30 seconds); the timer is only a safety net
    return new Promise(res=>{ voiceEl.onended = res; voiceEl.onpause = res; voiceEl.onerror = res;
      const cap = () => setTimeout(res, ((isFinite(voiceEl.duration) && voiceEl.duration > 0) ? voiceEl.duration : 60) * 1000 + 3000);
      if (voiceEl.readyState >= 1) cap(); else voiceEl.onloadedmetadata = cap; });
  }catch(e){
    if (e && e.name === "NotAllowedError"){ pending = [text,lang]; return; }   // blocked until the first tap
  }
  // the voice server can't be reached: the phone's own voice as a last resort
  if (!("speechSynthesis" in window)) return;
  const sl = lang==="ar" ? "ar" : LANG, said = lang==="ar" ? text : TX(text);
  const u = new SpeechSynthesisUtterance(said); u.lang = sl==="ar" ? "ar-SA" : sl==="en" ? "en-US" : sl; u.rate = rate;
  const vv = speechSynthesis.getVoices().find(x=>x.lang.toLowerCase().startsWith(sl)); if (vv) u.voice = vv;
  // some phones never report the end of speech, so never wait longer than the text could take
  return new Promise(res=>{ u.onend = res; u.onerror = res; setTimeout(res, 1200 + text.length*90); speechSynthesis.speak(u); });
}
const speakEn = (text) => speak(text, .95, "en");

/* ===== LANGUAGES ==========================================================================================
   The app tells the lesson the learner's language (ilmstation:welcome → lang). The lesson then loads
   https://ilmstation.com/qiraah/v1/i18n/<lang>.js, which sets window.QI18N = { "English text": "translation" }.
   Every English text on screen is swapped (exact text, or a pattern with {0} {1}…), and spoken instructions are
   translated and read in that language. The Arabic reading itself never changes. No dictionary → English. */
let LANG = "en";
const I18N_BASE = (typeof VOICE_ENDPOINT!=="undefined" ? VOICE_ENDPOINT.replace(/\/api\/tts$/,"") : "https://ilmstation.com") + "/qiraah/v1/i18n/";
let QD = {}, QPAT = [];
const RTL_LANGS = ["ar","ur"];
function setDict(d){
  QD = d || {};
  QPAT = Object.keys(QD).filter(k=>/\{\d\}/.test(k)).map(k=>{
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\\\{(\d)\\\}/g,"(.+?)");
    return { re: new RegExp("^"+esc+"$"), order: [...k.matchAll(/\{(\d)\}/g)].map(m=>+m[1]), out: QD[k] };
  });
}
/** Translate one English string (exact, then patterns; the pieces of a pattern are translated too). */
function TX(s){
  if (LANG==="en" || s==null) return s;
  const str = String(s), t = str.trim();
  if (!t) return str;
  if (QD[t]!=null) return str.replace(t, QD[t]);
  for (const p of QPAT){ const m = t.match(p.re); if (m){ let o=p.out; p.order.forEach((n,i)=>{ o=o.replace("{"+n+"}", TX(m[i+1])); }); return str.replace(t,o); } }
  const num = t.match(/^(\d+)\.\s+(.+)$/);                                  // "3. Read & repeat"
  if (num) return str.replace(t, num[1]+". "+TX(num[2]));
  if (/\s·\s/.test(t)) return str.replace(t, t.split(/(\s+·\s+)/).map(x=>/·/.test(x)?x:TX(x)).join(""));   // "Fatha · Part 2 · رَ – عَ"
  if (typeof window!=="undefined") (window.__missing ||= new Set()).add(t);   // for building dictionaries
  return str;
}
/** Swap every English text node under root (keeps the English in node.__en, so a second pass is harmless). */
function translateTree(root){
  if (LANG==="en" || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes){
    const p=n.parentNode; if(!p || /^(SCRIPT|STYLE)$/.test(p.nodeName)) continue;
    const v=n.nodeValue; if(!/[A-Za-z]{2}/.test(v)) continue;           // only English text
    if(n.__out===v) continue;
    const o=TX(v); n.__en=v; n.__out=o; if(o!==v) n.nodeValue=o;
  }
  root.querySelectorAll?.("[title],[aria-label],[placeholder]").forEach(el=>{
    for (const a of ["title","aria-label","placeholder"]){ const v=el.getAttribute(a); if(v && /[A-Za-z]{2}/.test(v)){ const o=TX(v); if(o!==v) el.setAttribute(a,o); } }
  });
}
let i18nObs=null;
function startTranslating(){
  if (LANG==="en" || i18nObs) return;
  document.documentElement.lang = LANG;
  if (RTL_LANGS.includes(LANG)) document.documentElement.dir = "rtl";
  translateTree(document.body);
  i18nObs = new MutationObserver(ms=>{ for(const m of ms){ if(m.type==="characterData") translateTree(m.target.parentNode); else m.addedNodes.forEach(n=>{ if(n.nodeType===3) translateTree(n.parentNode); else if(n.nodeType===1) translateTree(n); }); } });
  i18nObs.observe(document.body, {childList:true, subtree:true, characterData:true});
}
/** Load a language's dictionary (a small script, so it also works inside the app's sandbox). */
function loadLang(lang){
  return new Promise(res=>{
    if (!lang || lang==="en") return res(false);
    const s=document.createElement("script"); s.src=I18N_BASE+lang+".js?v=1";
    const done=ok=>{ clearTimeout(t); if(ok && window.QI18N){ LANG=lang; setDict(window.QI18N); startTranslating(); } res(ok); };
    const t=setTimeout(()=>done(false), 4000);
    s.onload=()=>done(true); s.onerror=()=>done(false);
    document.head.appendChild(s);
  });
}
// testing outside the app: add ?lang=fr to the lesson's address
try { const q=new URLSearchParams(location.search).get("lang"); if(q) window.__qlang=q; } catch(e){}

/* ===== READ & REPEAT + SAVE ======================================================================
   Inside IlmStation the APP records the mic and checks the words (your login never enters this file).
   Opened on its own, this file records locally and the student compares by ear (no auto-check). */
let bridge = false, savedState = null;
// Say hello to the app, and keep saying it until the app answers (it may not be listening yet at first).
const bridgeReady = new Promise(res=>{
  if (parent===window) return loadLang(window.__qlang).then(()=>res(false));
  const hello = () => { try{ parent.postMessage({type:"ilmstation:hello"},"*"); }catch(e){} };
  let tries = 0; const again = setInterval(()=>{ if(bridge || ++tries>25) clearInterval(again); else hello(); }, 400);
  addEventListener("message", e => {
    const d = e.data || {};
    if (d.type==="ilmstation:ping") hello();                                   // the app asks "are you there?"
    if (d.type==="ilmstation:welcome" && !bridge){ bridge=true; savedState=d.state; clearInterval(again); loadLang(d.lang).then(()=>res(true)); if(d.test) setTimeout(testTools, 300); }
  });
  hello(); setTimeout(()=>{ if(!bridge) loadLang(window.__qlang).then(()=>res(false)); }, 2000);
});
/** Admin test mode (turned on in the app): jump to any step, or mark the lesson passed. Learners never see this. */
function testTools(){
  if (document.getElementById("ilmTest")) return;
  const names = typeof ACTS!=="undefined" ? ACTS.map(a=>(typeof STEP_INFO!=="undefined"&&STEP_INFO[a]?.t)||a)
    : typeof L!=="undefined" && L.steps ? L.steps : typeof STEPS!=="undefined" ? STEPS : [];
  const goTo = i => { try{ if (typeof Lesson==="function") Lesson(i); else if (typeof go==="function") go(i); }catch(e){ console.log(e); } box.style.display="none"; };
  const btn = document.createElement("button"); btn.id="ilmTest"; btn.textContent="🧪";
  btn.style.cssText="position:fixed;right:10px;bottom:10px;z-index:99;width:44px;height:44px;border-radius:50%;border:2px solid #111;background:#ffd23f;font-size:20px;cursor:pointer";
  const box = document.createElement("div");
  box.style.cssText="position:fixed;right:10px;bottom:62px;z-index:99;display:none;background:#fff;border:2px solid #111;border-radius:12px;padding:10px;max-width:260px;font:600 14px system-ui;box-shadow:0 4px 0 #111";
  box.innerHTML = `<div style="margin-bottom:6px">Test mode · jump to step</div>${names.map((n,i)=>`<button data-i="${i}" style="display:block;width:100%;text-align:left;margin:3px 0;padding:6px 8px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;cursor:pointer">${i+1}. ${n}</button>`).join("")}
    <button id="ilmPass" style="display:block;width:100%;margin-top:8px;padding:8px;border:2px solid #111;border-radius:8px;background:#3ddc97;cursor:pointer">✓ Mark lesson passed</button>`;
  box.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>goTo(+b.dataset.i));
  btn.onclick=()=>{ box.style.display = box.style.display==="none" ? "block" : "none"; };
  document.body.append(btn, box);
  box.querySelector("#ilmPass").onclick=()=>{ const info = typeof LESSON!=="undefined" ? LESSON : {}; finishLesson(1, 1, { ...info, percent:100, test:true }); box.style.display="none"; btn.textContent="✓"; };
}
function saveState(state){ try{ if(bridge) parent.postMessage({type:"ilmstation:save", state},"*"); }catch(e){} }
function finishLesson(score, total, extra={}){ try{ parent.postMessage({type:"ilmstation:done", score, total, ...extra},"*"); }catch(e){} saveState(null); }
let recSeq = 0, localRec = null;
/** Records the student. Returns {url (their voice), text (words heard, "" if not checked), error} */
function record({ms=2600, check=true, hint=""}={}){
  const id = ++recSeq;
  if (bridge) return new Promise(res=>{
    const on = e => { const d=e.data; if(!d || d.id!==id || d.type!=="ilmstation:recorded") return; removeEventListener("message",on);
      res({ url: d.audio ? URL.createObjectURL(new Blob([d.audio],{type:d.mime||"audio/webm"})) : null, text: d.text||"", error: d.error||null }); };
    addEventListener("message", on);
    parent.postMessage({type:"ilmstation:record", id, ms, check, hint}, "*");
  });
  return new Promise(async res=>{
    try{
      const stream = await navigator.mediaDevices.getUserMedia({audio:true}); const r = new MediaRecorder(stream), ch=[]; localRec=r;
      r.ondataavailable = e=>ch.push(e.data);
      r.onstop = ()=>{ stream.getTracks().forEach(t=>t.stop()); res({url:URL.createObjectURL(new Blob(ch,{type:r.mimeType})), text:"", error:"nocheck"}); };
      r.start(); setTimeout(()=>{ if(r.state==="recording") r.stop(); }, ms);
    }catch(e){ res({url:null, text:"", error:"mic"}); }
  });
}
function stopRecord(){ try{ if(bridge) parent.postMessage({type:"ilmstation:stop", id:recSeq},"*"); else if(localRec && localRec.state==="recording") localRec.stop(); }catch(e){} }
/* compare what was heard with what was expected (vowel marks and hamza shapes ignored) */
const normAr = s => (s||"").replace(/[ً-ْٰـ]/g,"").replace(/[أإآٱ]/g,"ا").replace(/[ءؤئ]/g,"").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[^ء-ي]/g,"");
function lev(a,b){ const m=[...Array(b.length+1).keys()]; for(let i=1;i<=a.length;i++){ let p=m[0]; m[0]=i; for(let j=1;j<=b.length;j++){ const t=m[j]; m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]===b[j-1]?0:1)); p=t; } } return m[b.length]; }
function heardRight(text, accept){
  const t = normAr(text); if(!t) return false;
  return accept.some(a=>{ const n=normAr(a); if(!n) return false; if(t===n) return true;
    return n.length>1 && (t.split(/\s+/).includes(n) || t.startsWith(n) || (n.length>2 && lev(t,n)<=1)); });
}



/* =================================== READING ENGINE =================================== */
const KIDS = /kids/.test(LESSON.course);
document.body.classList.add(KIDS ? "kids" : "adult");
if (window.parent !== window) document.body.classList.add("embedded");
const $ = s => document.querySelector(s), view = $("#view");
const rand = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const wait = ms => new Promise(r=>setTimeout(r,ms));
const atLeast = (p, ms=700) => Promise.all([p, wait(ms)]);
const F = "َ";
const LET28 = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" ");
const FKEYS = LET28.map(l => (l==="ا" ? "أ" : l) + F);
/** كَتَبَ → ["كَ","تَ","بَ"] (a letter with its marks) */
// marks that sit on a letter: harakat, sukun, shadda, tanween, dagger alif, maddah, hamza above/below, small waw/ya, round zero
const MARK_RE = /[ً-ٰٕ۟۠ۢۥۦۭ]/;
/** كَتَبَ → ["كَ","تَ","بَ"]; a madd letter joins the syllable before it: قَامَ → ["قَا","مَ"], تُوبُوا۟ → ["تُو","بُوا۟"] */
const syl = w => { const out=[], ch=[...w];
  for (let i=0;i<ch.length;i++){ const c=ch[i], nx=ch[i+1]||"", prev=out[out.length-1]||"";
    if (c===" "){ out.push(" "); continue; }
    if (MARK_RE.test(c) && out.length){ out[out.length-1]+=c; continue; }
    const ownVowel = /[ً-ْ]/.test(nx);
    const madd = prev && prev!==" " && !ownVowel && (
      (c==="ا" && /[ًَُِٰ]$|و$/.test(prev)) ||
      (c==="ى" && /[ًَِ]$/.test(prev)) ||
      (c==="و" && /ُ$/.test(prev)) || (c==="ي" && /ِ$/.test(prev)));
    if (madd || prev==="ٱ" || prev==="ا") out[out.length-1]+=c; else out.push(c);
  }
  return out; };
/** what the voice gets: Qur'anic-only marks turned into plain spelling (same sound) */
// disjoined letters at the start of a surah are read by their names (الٓمٓ → Alif Laam Meem)
const MUQ = {"الٓمٓ":"أَلِفْ لَآمْ مِيٓمْ","الٓمٓصٓ":"أَلِفْ لَآمْ مِيٓمْ صَآدْ","الٓر":"أَلِفْ لَآمْ رَا","الٓمٓر":"أَلِفْ لَآمْ مِيٓمْ رَا","طسٓمٓ":"طَا سِيٓنْ مِيٓمْ","طسٓ":"طَا سِيٓنْ",
  "يسٓ":"يَا سِيٓنْ","حمٓ":"حَا مِيٓمْ","عٓسٓقٓ":"عَيٓنْ سِيٓنْ قَآفْ","قٓ":"قَآفْ","صٓ":"صَآدْ","نٓ":"نُوٓنْ","طه":"طَا هَا","كٓهيعٓصٓ":"كَآفْ هَا يَا عَيٓنْ صَآدْ"};
const spoken = t => t.split(" ").map(x=>MUQ[x]||x).join(" ");
const audioForm = (t, keepMadd=false) => { t = spoken(t).replace(/ـَٰٔ/g,"ءَا").replace(/ـَٔ/g,"ءَ").replace(/ـِٔ/g,"ئِ").replace(/ـ/g,"").replace(/ٱ/g,"ا").replace(/ىٰ/g,"ى").replace(/ٰ/g,"ا")
  .replace(/ۥ/g,"و").replace(/ۦ/g,"ي").replace(/[ۭ۟۠ۢ]/g,"").replace(/ٔ/g,""); return keepMadd ? t : t.replace(/ٓ/g,""); };
const tr = w => sayGuide(audioForm(w));
{ const _vu = voiceUrl; voiceUrl = (t, r, l="ar") => { if (l!=="ar") return _vu(t, r, l);
    let u = _vu(audioForm(t), r, l);
    if (typeof TAJWEED!=="undefined" && TAJWEED) u = u.replace(/text=[^&]*/, "text="+encodeURIComponent(audioForm(t, true))) + "&tj=1";   // tajweed: keep ٓ (4–6 counts)
    return u; }; }
// "صَعَ|دَ" in the content = read صَعَ as one chunk, then دَ (book p.10)
const PARTS = {}; WORDS.forEach((w,i)=>{ const c=w.replace(/\|/g,"").replace(/([\u064B-\u0650\u0652])\u0651/g,"\u0651$1"); w=w.replace(/([\u064B-\u0650\u0652])\u0651/g,"\u0651$1"); if(w.includes("|")) PARTS[c]=w.split("|"); WORDS[i]=c; });
const partsOf = w => PARTS[w] || (w.includes(" ") ? w.split(" ") : syl(w));
const isPh = w => (w||"").includes(" ");
const multi = w => partsOf(w).length>1;
const SHOW = typeof SHOWCASE!=="undefined" ? SHOWCASE : WORDS;
const LNOTES = typeof NOTES!=="undefined" ? NOTES : {};
// look-alike letters: used to make tricky wrong answers
const TWINS = [["ب","ت","ث","ن","ي"],["ج","ح","خ"],["د","ذ"],["ر","ز"],["س","ش"],["ص","ض"],["ط","ظ"],["ع","غ"],["ف","ق"],["ك","ق"],["ه","ح"],["ذ","ز","ظ"],["س","ص","ث"],["ت","ط"],["د","ض"],["أ","ع"]];
function variants(w, n=3){
  const s=syl(w), out=new Set(); let guard=0;
  while (out.size<n && guard++<300){
    const c=s.slice(), i=Math.floor(Math.random()*c.length); if (c[i]===" ") continue;
    const mk=(c[i].match(/[ً-ِْ]/)||[])[0];
    const VM=[..."ًٌٍَُِْ"].filter(m=>WORDS.some(x=>x.includes(m)));
    const hasMadd = /[اوىيۥۦ]/.test(c[i].slice(1).replace(/[ً-ٕ]/g,""));
    if (SHADDA_LESSON && Math.random()<.4 && !/[ٱا]/.test(c[i][0])){                   // قَطَعَ ↔ قَطَّعَ
      c[i] = c[i].includes("\u0651") ? c[i].replace("\u0651","") : c[i][0]+"\u0651"+c[i].slice(1);
      const v=c.join(""); if(v!==w) out.add(v); continue; }
    if (MADD_LESSON && mk && /[\u064E\u0650\u064F]/.test(mk) && Math.random()<.45){                     // long ↔ short: قَامَ ↔ قَمَ
      c[i] = hasMadd ? c[i].replace(/[اىويۥۦ](?=[۟]?$)/,"") : c[i]+({"َ":"ا","ِ":"ي","ُ":"و"})[mk];
      const v=c.join(""); if(v!==w) out.add(v); continue; }
    if (VM.length>1 && mk && !hasMadd && Math.random()<.5){ c[i]=c[i].replace(mk, rand(VM.filter(x=>x!==mk))); const v=c.join(""); if(v!==w) out.add(v); continue; }
    const base=c[i][0], groups=TWINS.filter(g=>g.includes(base)); if(!groups.length) continue;
    c[i]=rand(rand(groups).filter(x=>x!==base))+c[i].slice(1);
    const v=c.join(""); if (v!==w) out.add(v);
  }
  return [...out];
}
let stars=0, missed=new Set(), timer=null;
const SHADDA_LESSON = WORDS.some(w=>w.includes("\u0651"));
const MADD_LESSON = WORDS.some(w=>syl(w).some(x=>/[اوىي\u06E5\u06E6\u0670]/.test(x.slice(1).replace(/[\u064B-\u0652]/g,""))));
let ac; function tone(f,d=.1,vol=.12){ if(muted)return; try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); f.forEach((fr,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=fr;const t=ac.currentTime+i*d;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d*1.8);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d*2);});}catch(e){} }
const good=()=>tone([587,880]), bad=()=>tone([196,165],.14,.07);
function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),1300); }
function confetti(n=40){ const cols=["#ff6fa8","#ffd23f","#3ddc97","#8a5cff","#4aa8ff"]; for(let i=0;i<n;i++){ const c=document.createElement("div"); c.className="confetti"; c.style.left=Math.random()*100+"vw"; c.style.background=rand(cols); c.style.animationDuration=(1.6+Math.random()*1.6)+"s"; document.body.appendChild(c); setTimeout(()=>c.remove(),3500);} }
function addStars(n){ if(!KIDS) return; stars+=n; $("#starN").textContent=stars; }
if (KIDS) $("#starBox").style.display="flex";
// praise: shown in English letters, spoken in Arabic
const PRAISE = [{ar:"مَا شَاءَ اللهُ", en:"Masha'Allah!"}, {ar:"بَارَكَ اللهُ فِيكُمْ", en:"Barakallahu feekum!"}, {ar:"مُمْتَازٌ", en:"Mumtaz! Excellent!"}];
let lastSay = Promise.resolve();
function praise(fb){ const p=rand(PRAISE); lastSay=Promise.resolve(speak(p.ar)); if(KIDS){ toast(p.en); confetti(18); } if(fb){ fb.className="fb ok"; fb.textContent=p.en; } return p.en; }
const afterPraise = (fn, ms=1100) => Promise.all([lastSay, wait(ms)]).then(fn);
$("#sound").onclick=e=>{ muted=!muted; e.currentTarget.textContent=muted?"🔇":"🔊"; if(muted) stopVoice(); };
$("#closeBtn").onclick=()=>{ stopVoice(); clearInterval(timer); try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
$("#lsub").textContent = KIDS ? `Level ${LESSON.level} · Lesson ${LESSON.lesson}` : `${String(LESSON.level).replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} · Lesson ${LESSON.lesson}`;

/* ---------- words for each screen (kids hear every instruction from Nuri) ---------- */
const STEP_INFO = {
  intro:   {t:"Intro"},
  forms:   {t:"Letter shapes", s:"A letter changes its shape at the start, middle and end of a word, but its sound stays the same.", say:"A letter changes its shape at the start, the middle and the end of a word. But the sound stays the same!"},
  formquiz:{t:"Which letter?", s:"Look at the shape, then choose the letter it belongs to.", say:"Look at the shape. Which letter is it?"},
  heavy:   {t:"Heavy letters", s:"Seven letters are always heavy (the mouth is full): خ ص ض غ ط ق ظ. Is the letter heavy or light?", say:"Some letters are heavy, and fill your mouth. Listen, and choose heavy or light."},
  pairs:   {t:"Look-alike letters", s:"These pairs look or sound alike. Tap each one to hear the difference.", say:"These letters look alike, or sound alike. Tap each one and listen carefully."},
  pairquiz:{t:"Which one?", s:"Listen, then tap the one you hear.", say:"Listen carefully, then tap the one you hear."},
  spell:   {t:"Spell & read", s:"Tap ▶ Spell: each letter is read, then the whole word. Read along with it.", say:"Let's read words! Each letter is read by itself, then together as one word. Read along with me."},
  repeat:  {t:"Read & repeat", s:"Read the word aloud, then tap the mic. The app checks you.", say:"Your turn! Read the word, then tap the microphone and say it."},
  build:   {t:"Build the word", s:"Tap the pieces in order. Arabic is read right to left.", say:"Build the word! Tap the pieces in order, starting from the right."},
  listen:  {t:"Listen & choose", s:"The choices differ by one letter or one harakah. Listen carefully.", say:"Listen carefully, then tap the word you hear."},
  write:   {t:"Write what you hear", s:"Listen, then tap the letters in order. Use ⌫ to fix a mistake.", say:"Writing time! Listen, then tap the letters you hear."},
  exam:    {t: KIDS ? "Final check" : "Exam", s:"", say:"Final check! You can do it."},
};
const ACTS = ACTIVITIES.filter(a=>STEP_INFO[a]);
let stepNow=0;
function Lesson(i){
  clearInterval(timer); stopVoice(); stepNow=i; scrollTo(0,0);
  saveState({step:i, stars});
  const key=ACTS[i], info=STEP_INFO[key];
  view.innerHTML=`<div class="fade"><div class="steps">${ACTS.map((_,k)=>`<i class="${k<i?'done':k===i?'on':''}"></i>`).join("")}</div>
    <div class="stepLabel">Step ${i+1} of ${ACTS.length} · ${info.t}</div><div id="stage"></div></div>`;
  ({intro:Intro2,forms:Forms,formquiz:FormQuiz,heavy:Heavy,pairs:Pairs,pairquiz:PairQuiz,spell:Spell,repeat:Repeat,build:Build,listen:Listen,write:Write,exam:Exam})[key]($("#stage"));
  if (KIDS && info.say && key!=="exam") { introSay = Promise.resolve(speakEn(info.say)); view.querySelectorAll("p.lead").forEach(p=>p.onclick=()=>speakEn(info.say)); }
  else introSay = Promise.resolve();
}
let introSay = Promise.resolve();
const head = (key, extra="") => `<h2>${STEP_INFO[key].t}</h2>${STEP_INFO[key].s?`<p class="lead">${STEP_INFO[key].s}</p>`:""}${extra}`;
const nextBtn = (label="Next") => `<div class="row end" style="margin-top:16px"><button class="btn" id="nx">${label} →</button></div>`;
function bindNext(){ $("#nx").onclick=()=>Lesson(stepNow+1); }
function doneCard(icon, text){ return `<div class="card" style="text-align:center"><div style="font-size:44px">${icon}</div><h2>${text}</h2></div>${nextBtn()}`; }

/* ---------- start screen ---------- */
async function Start(){
  await bridgeReady;
  prefetchVoices([...SHOW.slice(0,24).map(w=>[w]), ...PRAISE.map(p=>[p.ar]), [GOAL,"en"]]);
  const resume = savedState && savedState.step>0 && savedState.step<ACTS.length;
  view.innerHTML=`<div class="card fade" style="margin-top:20px;text-align:center">
    ${KIDS?`<div class="nuri">🌙</div>`:`<div class="ar" style="font-size:22px;color:var(--em)">${LESSON.ar||""}</div>`}
    <h1 style="margin-top:6px">${LESSON.title}</h1><p class="lead" style="margin:0 0 10px">${LESSON.sub||""}</p>
    <div class="${(SHOW[0]||"").includes(" ")?"phrase":"word"}" style="font-size:min(46px,11vw)">${SHOW.slice(0,4).join(" · ")}</div>
    <p class="lead">${ACTS.map((a,i)=>`${i+1}. ${STEP_INFO[a].t}`).join(" · ")}</p>
    <div class="row mid">${resume?`<button class="btn sec" id="rs">Start again</button><button class="btn" id="ct">Continue ▶</button>`:`<button class="btn" id="st">Start ▶</button>`}</div></div>`;
  const st=$("#st"); if(st) st.onclick=()=>Lesson(0);
  const ct=$("#ct"); if(ct) ct.onclick=()=>{ stars=savedState.stars||0; addStars(0); Lesson(savedState.step); };
  const rs=$("#rs"); if(rs) rs.onclick=()=>Lesson(0);
}

/* ---------- 0 · intro: what this lesson is about (narrated, with captions) ---------- */
function Intro2(st){
  const scenes=[{show:`<div class="${(SHOW[0]||"").includes(" ")?"phrase":"word"}" style="font-size:min(50px,12vw)">${SHOW.slice(0,3).join("<br>")}</div>`, say:GOAL},
    {show:`<div class="row mid">${ACTS.slice(1).map((a,i)=>`<span class="ghost" style="cursor:default">${i+1}. ${STEP_INFO[a].t}</span>`).join("")}</div>`,
     say:`You will practise step by step, and finish with ${KIDS?"a final check":"an exam"}. You need ${Math.round(PASS*100)} percent to pass, and you can try again as many times as you like.`}];
  if (typeof RULE!=="undefined") scenes.splice(1,0,{show:`<div class="card" style="text-align:start;line-height:1.6">${TX(RULE.text)}</div>${RULE.pairs?`<div class="row mid" style="margin-top:12px;direction:rtl">${RULE.pairs.map(p=>`<span class="syl">${p[0]}</span><span style="font-size:22px">←</span><span class="syl hl">${p[1]}</span>`).join("")}</div>`:""}`, say:RULE.say||TX(RULE.text).replace(/<[^>]+>/g,""), ar:(RULE.pairs||[]).flat()});
  let k=0, token=++introTok;
  st.innerHTML=`<div class="card" style="padding:0;overflow:hidden">${KIDS?`<div class="nuri" style="padding-top:14px">🌙</div>`:""}<div class="vstage" id="vs"></div><div class="vcap" id="cap"></div></div>${nextBtn(KIDS?"Let's go":"Start the lesson")}`;
  bindNext();
  (async()=>{ while(k<scenes.length && token===introTok && st.isConnected){ $("#vs").innerHTML=scenes[k].show; $("#cap").textContent=scenes[k].say;
      await atLeast(speakEn(scenes[k].say),1500); for(const a of (scenes[k].ar||[])){ if(token!==introTok||!st.isConnected) return; await atLeast(speak(a),700); await wait(250); } await wait(400); k++; } })();
}
let introTok=0;

/* ---------- letter shapes (book p.6) ---------- */
// shapes of a letter with fatha: alone, start, middle, end (letters that don't join to the left have only alone + end)
const NOJOIN = ["ا","أ","د","ذ","ر","ز","و"];
function shapes(l){ const b=l==="ا"?"أ":l; return NOJOIN.includes(l) ? [[b+F,"alone"],["ـ"+b+F,"end"]] : [[b+F,"alone"],[b+F+"ـ","start"],["ـ"+b+F+"ـ","middle"],["ـ"+b+F,"end"]]; }
function Forms(st){
  let i=0; const list=FORMS_LETTERS;
  function draw(){ if(!st.isConnected) return;
    if(i>=list.length){ st.innerHTML=doneCard("🔤", "Same letter, same sound, different shapes"); bindNext(); return; }
    const l=list[i], sh=shapes(l);
    st.innerHTML=head("forms")+`<div class="card" style="text-align:center"><span class="counter">${i+1} / ${list.length}</span>
      <div class="forms" style="margin:12px 0">${sh.map(([f,n])=>`<span>${f}<small>${n}</small></span>`).join("")}</div>
      <div class="tr">${tr((l==="ا"?"أ":l)+F)}</div>${LNOTES[l]?`<p class="lead" style="margin-top:8px">${LNOTES[l]}</p>`:""}
      <div class="row mid" style="margin-top:10px"><button class="btn sec" id="ls">🔊 Listen</button><button class="btn" id="nl">Next →</button></div></div>`;
    const say=()=>speak((l==="ا"?"أ":l)+F); $("#ls").onclick=say; introSay.then(()=>{ if(st.isConnected) say(); }); introSay=Promise.resolve();
    $("#nl").onclick=()=>{ i++; draw(); };
  }
  draw();
}
function FormQuiz(st){
  const qs=shuffle(FORMS_LETTERS.filter(l=>!NOJOIN.includes(l))).slice(0,8); let i=0, right=0;
  function q(){ if(!st.isConnected) return;
    if(i>=qs.length){ st.innerHTML=doneCard("✅", `${right} / ${qs.length} correct`); bindNext(); return; }
    const l=qs[i], sh=rand(shapes(l).slice(1)), tw=TWINS.find(g=>g.includes(l))||[], pool=[...new Set([l,...tw.filter(x=>LET28.includes(x)),...shuffle(LET28)])].filter(x=>x!=="ا").slice(0,4);
    st.innerHTML=head("formquiz")+`<div class="card" style="text-align:center"><span class="counter">${i+1} / ${qs.length} · ${sh[1]} of a word</span>
      <div class="word">${sh[0]}</div><div class="opts">${shuffle(pool).map(x=>`<button class="opt ar" data-l="${x}">${x+F}</button>`).join("")}</div><div class="fb" id="fb"></div></div>`;
    st.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ const ok=b.dataset.l===l; st.querySelectorAll(".opt").forEach(z=>{ z.disabled=true; if(z.dataset.l===l) z.classList.add("right"); });
      if(ok){ right++; good(); addStars(1); praise($("#fb")); afterPraise(()=>{ i++; q(); }); } else { bad(); missed.add(l+F); b.classList.add("wrong"); speak(l+F); setTimeout(()=>{ i++; q(); },1800); } });
  }
  q();
}
const HEAVY = ["خ","ص","ض","غ","ط","ق","ظ"];
function Heavy(st){
  const qs=shuffle([...HEAVY, ...shuffle(LET28.filter(l=>!HEAVY.includes(l)&&l!=="ر")).slice(0,5)]).slice(0,10); let i=0, right=0;
  function q(){ if(!st.isConnected) return;
    if(i>=qs.length){ st.innerHTML=doneCard("💪", `${right} / ${qs.length} correct · heavy letters: <span class="ar">خُصَّ ضَغْطٍ قِظْ</span>`); bindNext(); return; }
    const l=qs[i], heavy=HEAVY.includes(l);
    st.innerHTML=head("heavy")+`<div class="card" style="text-align:center"><span class="counter">${i+1} / ${qs.length}</span>
      <div class="word">${(l==="ا"?"أ":l)+F}</div><button class="ghost" id="ls">🔊 Listen</button>
      <div class="opts"><button class="opt" data-h="1">💪 Heavy</button><button class="opt" data-h="0">🪶 Light</button></div><div class="fb" id="fb"></div></div>`;
    const say=()=>speak((l==="ا"?"أ":l)+F); $("#ls").onclick=say; introSay.then(()=>{ if(st.isConnected) say(); }); introSay=Promise.resolve();
    st.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ const ok=(b.dataset.h==="1")===heavy; st.querySelectorAll(".opt").forEach(z=>{ z.disabled=true; if((z.dataset.h==="1")===heavy) z.classList.add("right"); });
      if(ok){ right++; good(); addStars(1); praise($("#fb")); afterPraise(()=>{ i++; q(); }); } else { bad(); b.classList.add("wrong"); $("#fb").className="fb no"; $("#fb").textContent=heavy?"Heavy: one of خ ص ض غ ط ق ظ":"Light"; setTimeout(()=>{ i++; q(); },2000); } });
  }
  q();
}

/* ---------- look-alike pairs (book p.7) ---------- */
function Pairs(st){
  const all=[...PAIRS_LOOK.map(p=>[p,"look"]), ...PAIRS_SOUND.map(p=>[p,"sound"])]; let i=0;
  function draw(){ if(!st.isConnected) return;
    if(i>=all.length){ st.innerHTML=doneCard("👀", "Now let's test your ears!"); bindNext(); return; }
    const [p,kind]=all[i];
    st.innerHTML=head("pairs")+`<div class="card" style="text-align:center"><span class="counter">${i+1} / ${all.length} · alike in ${kind==="look"?"shape":"sound"}</span>
      <div class="pair" style="margin:14px 0">${p.map(x=>`<button data-x="${x}">${x}</button>`).join("")}</div>
      <div class="tr">${p.map(tr).join("  ·  ")}</div><div class="row mid" style="margin-top:12px"><button class="btn" id="nl">Next →</button></div></div>`;
    st.querySelectorAll(".pair button").forEach(b=>b.onclick=()=>speak(b.dataset.x));
    introSay.then(async()=>{ for(const x of p){ if(!st.isConnected) return; await atLeast(speak(x),800); await wait(300); } }); introSay=Promise.resolve();
    $("#nl").onclick=()=>{ i++; draw(); };
  }
  draw();
}
function PairQuiz(st){
  const qs=shuffle([...PAIRS_SOUND, ...PAIRS_LOOK]).slice(0,10); let i=0, right=0;
  function q(){ if(!st.isConnected) return;
    if(i>=qs.length){ st.innerHTML=doneCard("🎧", `${right} / ${qs.length} heard correctly`); bindNext(); return; }
    const p=qs[i], ans=rand(p);
    st.innerHTML=head("pairquiz")+`<div class="card" style="text-align:center"><span class="counter">${i+1} / ${qs.length}</span><br>
      <button class="btn gold" id="pl" style="margin:12px 0">🔊 Play</button><div class="pair">${shuffle(p).map(x=>`<button data-x="${x}">${x}</button>`).join("")}</div><div class="fb" id="fb"></div></div>`;
    const say=()=>speak(ans); $("#pl").onclick=say; introSay.then(()=>{ if(st.isConnected) say(); }); introSay=Promise.resolve();
    st.querySelectorAll(".pair button").forEach(b=>b.onclick=()=>{ const ok=b.dataset.x===ans; st.querySelectorAll(".pair button").forEach(z=>{ z.disabled=true; if(z.dataset.x===ans) z.classList.add("right"); });
      if(ok){ right++; good(); addStars(1); praise($("#fb")); afterPraise(()=>{ i++; q(); }); } else { bad(); missed.add(ans); b.classList.add("wrong"); $("#fb").className="fb no"; $("#fb").textContent=`It was ${tr(ans)}`; speak(ans); setTimeout(()=>{ i++; q(); },2000); } });
  }
  q();
}

/* ---------- words: spell and read (book pp.8–12) ---------- */
const pick = n => shuffle(WORDS).slice(0,n);
function Spell(st){
  const list=pick(8); let i=0;
  function draw(){ if(!st.isConnected) return;
    if(i>=list.length){ st.innerHTML=doneCard("📖", `${list.length} ${IS_PHRASE?"phrases":"words"} read`); bindNext(); return; }
    const w=list[i], parts=partsOf(w);
    st.innerHTML=head("spell")+`<div class="card" style="text-align:center"><span class="counter">${i+1} / ${list.length}</span>
      <div class="sylls ${isPh(w)?"ph":""}">${parts.map((p,k)=>`<span class="syl" data-k="${k}">${p}</span>`).join("")}</div>
      <div class="${isPh(w)?"phrase":"word"}" id="whole" style="opacity:.25">${w}</div><div class="tr" id="t" style="opacity:0">${tr(w)}</div>
      <div class="row mid" style="margin-top:10px"><button class="btn gold" id="sp">▶ Spell</button><button class="btn sec" id="wh">🔊 Whole ${isPh(w)?"phrase":"word"}</button><button class="btn" id="nl">Next →</button></div></div>`;
    const cells=st.querySelectorAll(".syl");
    async function spell(){ for(let k=0;k<parts.length;k++){ if(!st.isConnected) return; cells.forEach(c=>c.classList.remove("hl")); cells[k].classList.add("hl"); await atLeast(speak(parts[k]),700); await wait(200); }
      cells.forEach(c=>c.classList.remove("hl")); if(!st.isConnected) return; $("#whole").style.opacity=1; $("#t").style.opacity=1; await atLeast(speak(w),800); }
    $("#sp").onclick=spell; $("#wh").onclick=()=>{ $("#whole").style.opacity=1; $("#t").style.opacity=1; speak(w); };
    $("#nl").onclick=()=>{ i++; draw(); };
    introSay.then(()=>{ if(st.isConnected) spell(); }); introSay=Promise.resolve();
  }
  draw();
}
function Repeat(st){
  const list=pick(6); let i=0, ok=0;
  function draw(){ if(!st.isConnected) return;
    if(i>=list.length){ st.innerHTML=doneCard("🎙️", `${ok} / ${list.length} read correctly`); bindNext(); return; }
    const w=list[i]; let tries=0, myUrl=null, busy=false;
    st.innerHTML=head("repeat")+`<div class="card" style="text-align:center"><span class="counter">${i+1} / ${list.length}</span>
      <div class="${isPh(w)?"phrase":"word"}">${w}</div><div class="tr" id="t" style="opacity:0">${tr(w)}</div>
      <div class="row mid" style="margin:8px 0"><button class="btn sec" id="ls">🔊 Listen</button><button class="btn sec" id="mine" style="display:none">▶ My voice</button></div>
      <button class="micBtn" id="mic">🎤</button><div class="fb" id="fb">Read it, then tap the mic</div><div id="act"></div></div>`;
    const fb=$("#fb"), mic=$("#mic"), act=$("#act");
    $("#ls").onclick=()=>{ $("#t").style.opacity=1; speak(w); };
    $("#mine").onclick=()=>{ if(myUrl){ stopVoice(); player=new Audio(myUrl); player.play(); } };
    mic.onclick=async()=>{
      if(busy){ stopRecord(); return; }
      busy=true; stopVoice(); act.innerHTML=""; mic.classList.add("rec"); mic.textContent="⏹"; fb.className="fb"; fb.textContent="Listening… tap again to stop";
      const r=await record({ms: isPh(w) ? 2400+w.split(" ").length*1300 : 3200, check:true, hint:w}); busy=false; mic.classList.remove("rec"); mic.textContent="🎤";
      if(r.url){ myUrl=r.url; $("#mine").style.display=""; }
      if(r.error){ fb.textContent = r.error==="mic" ? "Microphone not available. Read it aloud, then continue." : "Compare your voice with the teacher's:"; return self(); }
      if(heardRight(r.text,[w])){ ok++; good(); addStars(2); praise(fb); afterPraise(()=>{ i++; draw(); }); return; }
      tries++; bad(); missed.add(w); fb.className="fb no"; fb.textContent="Not quite. Listen, then try again."; $("#t").style.opacity=1; speak(w);
      if(tries>=2) self();
    };
    function self(){ if(myUrl){ player=new Audio(myUrl); player.play(); player.onended=()=>speak(w); } $("#t").style.opacity=1;
      act.innerHTML=`<div class="row mid" style="margin-top:10px"><button class="btn sec" id="ag">Try again</button><button class="btn" id="ys">I read it correctly</button></div>`;
      $("#ag").onclick=()=>{ act.innerHTML=""; }; $("#ys").onclick=()=>{ ok++; i++; draw(); }; }
  }
  draw();
}
function Build(st){
  const list=shuffle(WORDS.filter(multi)).slice(0,5); let r=0;
  function q(){ if(!st.isConnected) return;
    if(r>=list.length){ st.innerHTML=doneCard("🧩", "All built!"); bindNext(); return; }
    const w=list[r], parts=partsOf(w);
    const extra = isPh(w) ? [] : shuffle([...new Set(variants(w,6).flatMap(v=>PARTS[w]?[]:syl(v)).filter(s=>!parts.includes(s)))]).slice(0,2);
    let built=[];
    st.innerHTML=head("build")+`<div class="card"><div class="row" style="justify-content:space-between"><span class="counter">${r+1} / ${list.length}</span><button class="ghost" id="hr">🔊 Hear it</button></div>
      <div class="slot" id="slot" style="margin-top:10px"></div><div class="tiles" id="tiles">${shuffle([...parts,...extra]).map(p=>`<button class="tile">${p}</button>`).join("")}</div>
      <div class="row end" style="margin-top:12px"><button class="btn sec" id="ud">Undo</button></div></div>`;
    const slot=$("#slot"); $("#hr").onclick=()=>speak(w); introSay.then(()=>{ if(st.isConnected) speak(w); }); introSay=Promise.resolve();
    st.querySelectorAll(".tile").forEach(b=>b.onclick=()=>{ built.push(b); b.classList.add("used"); draw(); });
    function draw(){ slot.className="slot"; slot.textContent=built.map(b=>b.textContent).join(isPh(w)?" ":"");
      if(built.length===parts.length){
        if(slot.textContent===w){ slot.classList.add("ok"); good(); addStars(2); praise(); afterPraise(()=>{ r++; q(); }); }
        else { bad(); missed.add(w); slot.classList.add("no"); setTimeout(()=>{ built.forEach(b=>b.classList.remove("used")); built=[]; draw(); },700); } } }
    $("#ud").onclick=()=>{ const b=built.pop(); if(b){ b.classList.remove("used"); draw(); } };
  }
  q();
}
function Listen(st){
  const list=pick(6); let r=0, score=0;
  function q(){ if(!st.isConnected) return;
    if(r>=list.length){ st.innerHTML=doneCard("🎧", `${score} / ${list.length} heard correctly`); bindNext(); return; }
    const w=list[r], opts=shuffle([w,...variants(w, KIDS?2:3)]);
    st.innerHTML=head("listen")+`<div class="card" style="text-align:center"><span class="counter">${r+1} / ${list.length}</span><br>
      <button class="btn gold" id="pl" style="margin:12px 0">🔊 Play</button> <button class="ghost" id="sl">🐢 Slower</button>
      <div class="opts ${isPh(w)?"ph":""}" style="${KIDS&&opts.length===3?'grid-template-columns:1fr':''}">${opts.map(o=>`<button class="opt ar">${o}</button>`).join("")}</div><div class="fb" id="fb"></div></div>`;
    $("#pl").onclick=()=>speak(w); $("#sl").onclick=()=>speak(w,.45); introSay.then(()=>{ if(st.isConnected) speak(w); }); introSay=Promise.resolve();
    st.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ const ok=b.textContent===w; st.querySelectorAll(".opt").forEach(z=>{ z.disabled=true; if(z.textContent===w) z.classList.add("right"); });
      if(ok){ score++; good(); addStars(1); praise($("#fb")); afterPraise(()=>{ r++; q(); }); } else { bad(); missed.add(w); b.classList.add("wrong"); $("#fb").className="fb no"; $("#fb").textContent=`It was ${tr(w)}`; setTimeout(()=>{ r++; q(); },2200); } });
  }
  q();
}
const writable = w => !isPh(w) && /^[ء-يً-ْ]+$/.test(w) && !/[آىٱ]/.test(w) && !/^ا/.test(w) && syl(w).every(x=>/[ً-ِْ]/.test(x));
const MARKS = [..."ًٌٍَُِْ"].filter(m=>WORDS.filter(writable).some(w=>w.includes(m)));
const MADDS = [..."اوي"].filter(m=>WORDS.filter(writable).some(w=>syl(w).some(x=>x.length>2 && x.endsWith(m))));
const ONE = MARKS.length<=1 ? (MARKS[0]||F) : null;           // one harakah in the lesson → keys carry it
const BASES = (()=>{ const b=LET28.map(l=>l==="ا"?"أ":l); WORDS.filter(writable).join("").replace(/[ً-ْ]/g,"").split("").forEach(c=>{ if(!b.includes(c) && "ءأإؤئة".includes(c)) b.push(c); }); return b; })();
const SHADDA = WORDS.filter(writable).some(w=>w.includes("\u0651"));
const MNAME = {"َ":"fatha","ِ":"kasra","ُ":"damma","ْ":"sukun","ً":"fathatan","ٍ":"kasratan","ٌ":"dammatan"};
const keyboard = () => `<div class="kb">${BASES.map(k=>`<button class="key" data-k="${ONE?k+ONE:k}">${ONE?k+ONE:k}</button>`).join("")}
  ${SHADDA?`<button class="key mk" data-s="1" style="grid-column:span 2;font-size:14px;font-family:var(--ui);font-weight:700;padding:6px"><span class="ar" style="font-size:26px">ـّ</span> shadda</button>`:""}
  ${MADDS.map(a=>`<button class="key mk" data-a="${a}" style="grid-column:span 2;font-size:14px;font-family:var(--ui);font-weight:700;padding:6px"><span class="ar" style="font-size:24px">${a}</span> madd</button>`).join("")}
  ${ONE?"":MARKS.map(m=>`<button class="key mk" data-m="${m}" style="grid-column:span 2;font-size:15px;font-family:var(--ui);font-weight:700;padding:6px"><span class="ar" style="font-size:26px">ـ${m}</span> ${MNAME[m]}</button>`).join("")}
  <button class="key wide" data-k="⌫">⌫ Delete</button></div>`;
function bindKeys(root, max, onChange){ let t=[];
  root.querySelectorAll(".key").forEach(b=>b.onclick=()=>{ const k=b.dataset.k, m=b.dataset.m;
    const a=b.dataset.a, tail=x=>(x.slice(1).match(/[اوي]$/)||[""])[0];
    if(b.dataset.s){ if(t.length){ const x=t[t.length-1]; t[t.length-1] = x.includes("\u0651") ? x.replace("\u0651","") : x[0]+"\u0651"+x.slice(1); } }
    else if(a){ if(t.length && !tail(t[t.length-1])) t[t.length-1]+=a; }
    else if(m){ if(t.length){ const x=t[t.length-1], md=tail(x), base=md?x.slice(0,-1):x; t[t.length-1]=base.replace(/[ً-ِْ]/g,"")+m+md; } }
    else if(k==="⌫") t.pop(); else if(t.length<max) t.push(k);
    tone([520],.04,.05); onChange(t); }); return ()=>t; }
function Write(st){
  const list=shuffle(WORDS.filter(writable)).slice(0,5); let r=0, right=0;
  function q(){ if(!st.isConnected) return;
    if(r>=list.length){ st.innerHTML=doneCard("✍️", `${right} / ${list.length} written correctly`); bindNext(); return; }
    const w=list[r], parts=syl(w);
    st.innerHTML=head("write")+`<div class="card" style="text-align:center"><span class="counter">${r+1} / ${list.length}</span><br>
      <button class="btn gold" id="pl" style="margin:10px 0">🔊 Play</button> <button class="ghost" id="sl">🐢 Slower</button>
      <div class="slot" id="slot"></div>${keyboard()}${ONE?"":`<p class="lead" style="margin:6px 0 0;font-size:13px">Tap a letter, then its mark.</p>`}<div class="fb" id="fb"></div><div class="row end" style="margin-top:10px"><button class="btn" id="ck" disabled>Check</button></div></div>`;
    $("#pl").onclick=()=>speak(w); $("#sl").onclick=()=>speak(w,.45); introSay.then(()=>{ if(st.isConnected) speak(w); }); introSay=Promise.resolve();
    const typed=bindKeys(st, parts.length, t=>{ $("#slot").textContent=t.join(""); $("#ck").disabled=t.length<parts.length || t.some(x=>!/[\u064B-\u0650\u0652]/.test(x)); });
    $("#ck").onclick=()=>{ const ok=typed().join("")===w; st.querySelectorAll(".key").forEach(k=>k.disabled=true); $("#ck").disabled=true;
      if(ok){ right++; good(); addStars(2); $("#slot").classList.add("ok"); praise($("#fb")); afterPraise(()=>{ r++; q(); }); }
      else { bad(); missed.add(w); $("#slot").classList.add("no"); $("#fb").className="fb no"; $("#fb").innerHTML=`It was <span class="ar" style="font-size:28px">${w}</span> (${tr(w)})`; setTimeout(()=>{ r++; q(); },2800); } };
  }
  q();
}

/* ---------- exam / final check ---------- */
const EXAM_N = typeof EXAM_SIZE!=="undefined" ? EXAM_SIZE : 12;
const BIG = EXAM_N>12, LISTEN_N=BIG?7:4, READ_N=BIG?5:3, BUILD_N=BIG?4:2, WRITE_N=BIG?4:2;
function makeExam(){
  const qs=[];
  if (WORDS.length){
    pick(LISTEN_N).forEach(w=>qs.push({type:"Listening", text:"Listen, then choose what you hear.", listen:w, opts:shuffle([w,...variants(w,KIDS?2:3)]), ans:w, ar:true}));
    if(!KIDS) pick(READ_N).forEach(w=>qs.push({type:"Reading", text:"How is this read?", show:w, opts:shuffle([tr(w),...variants(w,3).map(tr)].filter((v,i,a)=>a.indexOf(v)===i)), ans:tr(w)}));
    else pick(2).forEach(w=>qs.push({type:"Reading", text:"Which one matches what you hear?", listen:w, opts:shuffle([w,...variants(w,2)]), ans:w, ar:true}));
    shuffle(WORDS.filter(multi)).slice(0,BUILD_N).forEach(w=>qs.push({type:"Build", text:"Build what you hear.", build:w}));
    shuffle(WORDS.filter(writable)).slice(0,WRITE_N).forEach(w=>qs.push({type:"Writing", text:"Listen, then write it.", write:w}));
  }
  if (typeof FORMS_LETTERS!=="undefined"){
    shuffle(FORMS_LETTERS.filter(l=>!NOJOIN.includes(l))).slice(0,6).forEach(l=>{ const sh=rand(shapes(l).slice(1)), tw=TWINS.find(g=>g.includes(l))||[];
      qs.push({type:"Shapes", text:`Which letter is this (${sh[1]} of a word)?`, show:sh[0], opts:shuffle([...new Set([l,...tw.filter(x=>LET28.includes(x)),...shuffle(LET28)])].filter(x=>x!=="ا").slice(0,4)).map(x=>x+F), ans:l+F, ar:true}); });
    shuffle(LET28).slice(0,4).forEach(l=>qs.push({type:"Heavy or light", text:"Is this letter heavy or light?", show:(l==="ا"?"أ":l)+F, opts:["💪 Heavy","🪶 Light"], ans:HEAVY.includes(l)?"💪 Heavy":"🪶 Light"}));
  }
  if (typeof PAIRS_SOUND!=="undefined") shuffle([...PAIRS_SOUND,...PAIRS_LOOK]).slice(0,8).forEach(p=>{ const a=rand(p); qs.push({type:"Look-alikes", text:"Listen, then choose.", listen:a, opts:shuffle(p), ans:a, ar:true}); });
  return shuffle(qs).slice(0,EXAM_N);
}
function Exam(st){
  st.innerHTML=`<div class="card" style="text-align:center"><div style="font-size:46px">${KIDS?"🏆":"📝"}</div><h2>${STEP_INFO.exam.t}</h2>
    <p class="lead">${KIDS?"":`${EXAM_N} questions · `}you need ${Math.round(PASS*100)}% to pass${KIDS?"":` · ${Math.ceil(EXAM_N*30/60)} minutes`}</p><button class="btn gold" id="se">Start ▶</button></div>`;
  $("#se").onclick=()=>run(st);
}
function run(st){
  const qs=makeExam(), ans=[]; let i=0, left=EXAM_N*30;
  const fmt=()=>`${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`;
  clearInterval(timer); if(!KIDS) timer=setInterval(()=>{ left--; const t=$("#tm"); if(t) t.textContent=fmt(); if(left<=0){ clearInterval(timer); results(); } },1000);
  function q(){ if(!st.isConnected) return; if(i>=qs.length){ clearInterval(timer); return results(); }
    const Q=qs[i];
    st.innerHTML=`<div class="card"><div class="row" style="justify-content:space-between"><span class="counter">Question ${i+1} / ${qs.length}</span>${KIDS?"":`<span class="stat" id="tm">${fmt()}</span>`}</div>
      <div class="counter" style="color:var(--gold);margin-top:8px">${Q.type}</div><div style="font-weight:700;font-size:18px;margin:4px 0">${Q.text}</div>
      ${Q.show?`<div class="${Q.show.includes(" ")?"phrase":"word"}">${Q.show}</div>`:""}
      ${Q.listen||Q.build||Q.write?`<div class="row mid" style="margin:12px 0"><button class="btn gold" id="pl">🔊 Play</button></div>`:""}
      <div id="ans"></div></div>`;
    const sayW=Q.listen||Q.build||Q.write; if(sayW){ $("#pl").onclick=()=>speak(sayW); setTimeout(()=>speak(sayW),300); }
    const box=$("#ans");
    if(Q.opts){ box.innerHTML=`<div class="opts ${Q.opts.some(isPh)?"ph":""}">${Q.opts.map(o=>`<button class="opt ${Q.ar?'ar':''}">${o}</button>`).join("")}</div>`;
      box.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ ans.push(b.textContent); tone([440],.05,.06); i++; q(); }); }
    else if(Q.build){ const parts=partsOf(Q.build); let built=[];
      box.innerHTML=`<div class="slot" id="slot"></div><div class="tiles">${shuffle(parts).map(p=>`<button class="tile">${p}</button>`).join("")}</div>`;
      box.querySelectorAll(".tile").forEach(b=>b.onclick=()=>{ built.push(b.textContent); b.classList.add("used"); $("#slot").textContent=built.join(isPh(Q.build)?" ":"");
        if(built.length===parts.length){ ans.push($("#slot").textContent); setTimeout(()=>{ i++; q(); },400); } }); }
    else if(Q.write){ const parts=syl(Q.write);
      box.innerHTML=`<div class="slot" id="slot"></div>${keyboard()}<div class="row end" style="margin-top:10px"><button class="btn" id="wn" disabled>Next →</button></div>`;
      const typed=bindKeys(box, parts.length, t=>{ $("#slot").textContent=t.join(""); $("#wn").disabled=t.length<parts.length || t.some(x=>!/[\u064B-\u0650\u0652]/.test(x)); });
      $("#wn").onclick=()=>{ ans.push(typed().join("")); i++; q(); }; }
  }
  function results(){
    const key=Q=>Q.ans||Q.build||Q.write;
    const right=qs.filter((Q,k)=>ans[k]===key(Q)).length, pct=Math.round(right/qs.length*100), pass=pct>=PASS*100;
    qs.forEach((Q,k)=>{ if(ans[k]!==key(Q)) missed.add(Q.listen||Q.show||Q.build||Q.write); });
    if(pass){ tone([523,659,784,1047],.12); confetti(KIDS?80:30); setTimeout(()=>speak("مَا شَاءَ اللهُ، بَارَكَ اللهُ فِيكُمْ"),700); } else bad();
    st.innerHTML=`<div class="card" style="text-align:center"><div style="font-size:46px">${pass?"🎉":"📖"}</div><div class="score ${pass?'pass':'fail'}">${pct}%</div>
      <h2>${pass?"Passed — lesson complete":"Not yet — practise and try again"}</h2>${pass?`<div style="font-weight:800;color:var(--em)">Masha'Allah · Barakallahu feekum</div>`:""}
      <p class="lead">${right} of ${qs.length} correct${pass?"":` · you need ${Math.round(PASS*100)}%`}</p>
      <div class="row mid">${pass?`<button class="btn sec" id="rt">Try again</button>${bridge?`<button class="btn" id="bk">✓ Back to lessons</button>`:""}`
        :`<button class="btn sec" id="rv">Practise again</button><button class="btn" id="rt">Retake</button>`}</div></div>
      ${KIDS?"":`<div class="card" style="margin-top:12px"><b>Answer review</b><ol class="review">${qs.map((Q,k)=>{ const ok=ans[k]===key(Q);
        return `<li>${ok?"✅":"❌"} ${Q.text} <span class="ar">${Q.show||""}</span> — ${ok?`<b class="${Q.ar||Q.build||Q.write?'ar':''}">${key(Q)}</b>`:`you: <b class="${Q.ar||Q.build||Q.write?'ar':''}">${ans[k]??"—"}</b>, answer: <b class="${Q.ar||Q.build||Q.write?'ar':''}">${key(Q)}</b>`}</li>`; }).join("")}</ol></div>`}`;
    $("#rt").onclick=()=>run(st); const rv=$("#rv"); if(rv) rv.onclick=()=>Lesson(1);
    const bk=$("#bk"); if(bk) bk.onclick=()=>{ try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
    if(pass) finishLesson(right, qs.length, { ...LESSON, percent:pct, stars, struggled:[...missed].filter(Boolean).slice(0,20) });
  }
  q();
}

const IS_PHRASE = WORDS.every(isPh);
Start();
