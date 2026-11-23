/* Arabiyyah kids engine — shared by every kids lesson. Built by build.py; do not edit by hand. */
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
let mixGen = 0;   // a mixed English + Arabic sentence stops when anything else starts speaking
function stopVoice(){ if(!speak._mix) mixGen++; try{ voiceEl.pause(); }catch(e){} if(player){ player.pause(); player=null; } try{ speechSynthesis.cancel(); }catch(e){} }
// adults hear a calm adult narrator; children hear Nuri
const WHO = (typeof LESSON!=="undefined" && /adult/.test(LESSON.course)) ? "adult" : "kid";
function voiceUrl(text, rate=.85, lang="ar"){
  if (AUDIO[text]) return AUDIO[text];
  // instructions (lang "en"): translated and read in the learner's language
  if (lang!=="ar") return `${VOICE_ENDPOINT}?text=${encodeURIComponent(TX(text))}&lang=${LANG}&who=${WHO}&slow=0&v=${["yo","ig","ha"].includes(LANG)?"8e":"4"}`;
  // letter names ending in ـاءْ (بَاءْ تَاءْ…): the voice turns the final hamza into an extra "ha",
  // so it says them the way the alphabet is recited: "baa", "taa" (the screen still shows the full name)
  const spoken = lang==="ar" ? text.replace(/اءْ?(?=\s|$|،)/g, "ا") : text;
  const q = lang==="ar" ? `&say=${encodeURIComponent(sayGuide(spoken))}` : `&lang=${lang}&who=${WHO}`;
  // v = voice version: raise it when the voice rules change, so saved recordings are made again
  return `${VOICE_ENDPOINT}?text=${encodeURIComponent(spoken)}${q}&slow=${rate<.6?1:0}&v=${lang==="ar"?"a3":3}`;
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
  if (muted) return; if(!speak._mix) mixGen++; stopVoice();
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
/** Split a sentence into English parts and Arabic parts: [[isArabic, text], …] */
function mixParts(text){
  const out=[]; const re=/[\u0600-\u06FF][\u0600-\u06FF\u064B-\u0652\u0670\s،؟]*/g; let last=0, m;
  const t=String(text);
  while((m=re.exec(t))){ if(m.index>last) out.push([0,t.slice(last,m.index)]); out.push([1,m[0]]); last=m.index+m[0].length; }
  if(last<t.length) out.push([0,t.slice(last)]);
  return out.map(([a,x])=>[a, a ? x.replace(/[؟ـ]/g," ").replace(/\s+/g," ").trim() : x.replace(/\s+/g," ").replace(/^[\s,.;:]+(?=\w)/,"").trim()])
            .filter(([a,x])=> a ? x : /[A-Za-z0-9]/.test(x));
}
/** English with Arabic words inside: the Arabic voice reads the Arabic words, so they are pronounced correctly. */
async function speakMix(text){
  const parts = mixParts(text), my = ++mixGen;
  for (const [ar, t] of parts){
    if (my !== mixGen || muted) return;
    speak._mix = true; const p = ar ? speak(t) : speakEn(t); speak._mix = false;
    await p;
  }
}
const mixPrefetch = text => mixParts(text).map(([ar,t]) => ar ? [t] : [t,"en"]);

/* ===== LANGUAGES ==========================================================================================
   The app tells the lesson the learner's language (ilmstation:welcome → lang). The lesson then loads
   https://ilmstation.com/qiraah/v1/i18n/<lang>.js, which sets window.QI18N = { "English text": "translation" }.
   Every English text on screen is swapped (exact text, or a pattern with {0} {1}…), and spoken instructions are
   translated and read in that language. The Arabic reading itself never changes. No dictionary → English. */
let LANG = "en";
const I18N_BASE = (typeof VOICE_ENDPOINT!=="undefined" ? VOICE_ENDPOINT.replace(/\/api\/tts$/,"") : "https://ilmstation.com") + "/arabiyyah/v1/i18n/";
let QD = {}, QPAT = [];
const RTL_LANGS = ["ar","ur"];
function setDict(d){
  QD = d || {};
  QPAT = Object.keys(QD).filter(k=>/\{\d\}/.test(k)).map(k=>{
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\\\{(\d)\\\}/g,"(\\d+)");   // {0} {1} … stand for numbers
    return { re: new RegExp("^"+esc+"$"), order: [...k.matchAll(/\{(\d)\}/g)].map(m=>+m[1]), out: QD[k] };
  }).sort((a,b)=>b.re.source.length-a.re.source.length);
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
    const s=document.createElement("script"); s.src=I18N_BASE+lang+".js?v=202611232313";
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
    if (d.type==="ilmstation:welcome" && !bridge){ bridge=true; if(d.lang) window.__wantLang=d.lang; if(d.age!=null) window.__age=+d.age; else if(d.ageGroup) window.__age={"3-5":4,"6-8":7,"9-13":11,"9-12":11}[d.ageGroup]; savedState=d.state; clearInterval(again); loadLang(d.lang).then(()=>res(true)); if(d.test) setTimeout(testTools, 300); }
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


/* Rule cards for ages 9–13: in between child and adult. Short, friendly, still exact. Same order as RULES in each lesson.
   Voice-safe: English parts use only letters, numbers and . , ! ? ' : ; ( ) - */
const KIDNOTES = {
"B1-01":["We use هٰذَا to point at something near us, like a book in your hand. It is for boy words. You will meet the girl word later.",
 "See the two small marks at the end of بَيْتٌ? They say un, and they mean a. So هٰذَا بَيْتٌ means this is a house. Arabic does not need a word for is.",
 "To ask about a thing or an animal, start with مَا. مَا هٰذَا؟ means what is this?"],
"B1-02":["ذٰلِكَ points at something far away, like a car across the street.",
 "Easy way to remember: هٰذَا is near, here with you. ذٰلِكَ is far, over there.",
 "Same as before: مَا asks about things and animals, and مَنْ asks about people."],
"B1-03":["الْ means the. When you add it, the un ending becomes just u. بَيْتٌ is a house, and الْبَيْتُ is the house.",
 "A simple sentence: the thing with الْ, then what it is like. الْقَلَمُ مَكْسُورٌ means the pen is broken. No word for is!",
 "وَ means and. It sticks to the next word, like وَالْمُدَرِّسُ, and the teacher."],
"B1-04":["After فِي, in, and عَلَى, on, the last sound changes to i. الْبَيْتُ becomes فِي الْبَيْتِ.",
 "Ask أَيْنَ to say where. Answer with فِي or عَلَى.",
 "هُوَ is he, for a man or a boy word. هِيَ is she, for a woman or a girl word. Words ending in ة are usually girl words."],
"B1-05":["To say whose something is, put the thing first, then the owner. كِتَابُ مُحَمَّدٍ is Muhammad's book. Arabic says book Muhammad!",
 "The first word loses الْ and un. The second word ends in i. كِتَابُ مُحَمَّدٍ, كِتَابُ الْمُدَرِّسِ.",
 "After a word like بَيْتُ, the name اللهُ becomes اللهِ. بَيْتُ اللهِ is the House of Allah."],
"B1-06":["هٰذَا is for boy words, and هٰذِهِ is for girl words. هٰذِهِ سَاعَةٌ, this is a watch.",
 "Most girl words end in ة. Add it to make a word for a girl: طَالِبٌ is a male student, طَالِبَةٌ is a female student.",
 "Some girl words have no ة, like أُمٌّ, mother, and body parts that come in twos, like عَيْنٌ and يَدٌ."],
"B1-07":["تِلْكَ points at a girl word that is far away. تِلْكَ سَيَّارَةٌ, that is a car.",
 "Both mean that. ذٰلِكَ for boy words, تِلْكَ for girl words.",
 "Four pointing words: near, هٰذَا and هٰذِهِ. Far, ذٰلِكَ and تِلْكَ."],
"B1-08":["Watch الْ! هٰذَا رَجُلٌ is a full sentence: this is a man. هٰذَا الرَّجُلُ is only this man, waiting for more.",
 "It works the same with هٰذِهِ, ذٰلِكَ and تِلْكَ. هٰذِهِ السَّيَّارَةُ means this car.",
 "لِ means for or belongs to. Before الْ the alif drops: لِلتَّاجِرِ, for the merchant."],
"B1-09":["A describing word comes after the noun and copies its ending. تَاجِرٌ غَنِيٌّ, a rich merchant.",
 "If the noun is a girl word, the describing word gets ة too. لُغَةٌ سَهْلَةٌ, an easy language.",
 "If the noun has الْ, the describing word gets الْ too. الْمُدَرِّسُ الْجَدِيدُ, the new teacher."],
"B1-10":["Add a small ending to say my, your, his or her: بَيْتِي, بَيْتُكَ, بَيْتُهُ, بَيْتُهَا. Then no الْ and no un.",
 "مَا اسْمُكَ؟ means what is your name? Answer اسْمِي, my name is. Words with ة change it to ت: سَيَّارَتِي.",
 "أَبٌ, father, and أَخٌ, brother, get a long u before an ending: أَبُوكَ, أَخُوهُ. But my is short: أَبِي, أَخِي."],
"B1-11":["Listen to the story about the house. Tap any sentence to hear it again.",
 "Remember: ة turns into ت before an ending. غُرْفَةٌ, a room, becomes غُرْفَتِي, my room.",
 "فِيهِ means in it, for boy words. فِيهَا means in it, for girl words."],
"B1-12":["To greet a woman, say السَّلَامُ عَلَيْكِ with an i sound at the end.",
 "Talking to a boy or man: أَنْتَ and the ending كَ. Talking to a girl or woman: أَنْتِ and the ending كِ.",
 "Add at to say she did it. ذَهَبَ is he went, ذَهَبَتْ is she went."],
"B1-13":["For many people use هٰؤُلَاءِ, these, and هُمْ, they. Many plurals change inside the word: طَالِبٌ becomes طُلَّابٌ.",
 "There is no single rule for these plurals, so learn each one together with its word.",
 "Some words for men just add uuna at the end: مُسْلِمٌ becomes مُسْلِمُونَ."],
"B1-14":["أَنْتُمْ is you all, talking to a group of boys or men. نَحْنُ is we, for anyone.",
 "New endings: كُمْ for your, to a group, and نَا for our. بَيْتُنَا is our house.",
 "ذَهَبْتُمْ means you all went. ذَهَبْنَا means we went."],
"B1-15":["أَنْتُنَّ is you all, talking to a group of girls or women. Their ending is كُنَّ.",
 "One person: ذَهَبْتَ, you went, to a boy. ذَهَبْتِ, to a girl. ذَهَبْتُ, I went. Listen to the last sound!",
 "Groups: ذَهَبْتُمْ for boys, ذَهَبْتُنَّ for girls, and ذَهَبْنَا for we."],
"B1-16":["For many people, use هٰؤُلَاءِ. For many things or animals, Arabic uses the girl word هٰذِهِ. هٰذِهِ كُتُبٌ, these are books.",
 "Even for many pens or books, we say هٰذِهِ and هِيَ.",
 "Far away: تِلْكَ بُيُوتٌ, those are houses. For people far away, use أُولٰئِكَ."],
"B1-17":["Many things take a girl describing word with ة. الْأَبْوَابُ مَفْتُوحَةٌ, the doors are open.",
 "People get a plural describing word: الطُّلَّابُ جُدُدٌ. Things get the girl word: الْكُتُبُ جَدِيدَةٌ.",
 "كَثِيرٌ, many, follows the same rule: لُغَاتٌ كَثِيرَةٌ, many languages."],
"B1-18":["Arabic has a special form for two! Add aani: كِتَابٌ becomes كِتَابَانِ, two books.",
 "هٰذَانِ for two boy things, هٰتَانِ for two girl things.",
 "After كَمْ, how many, use one word ending in an: كَمْ أَخًا لَكَ؟ How many brothers do you have?"],
"B1-19":["These are the numbers three to ten for boy words. Tap each one and say it.",
 "The number comes first, then the plural word ending in in: ثَلَاثَةُ طُلَّابٍ, three students.",
 "Ask with كَمْ and one word ending in an. Answer with the number and the plural."],
"B1-20":["With girl words, the number has no ة: ثَلَاثُ طَالِبَاتٍ, three female students.",
 "It is the opposite rule! Boy word, number with ة. Girl word, number without ة. ثَلَاثَةُ إِخْوَةٍ but ثَلَاثُ أَخَوَاتٍ.",
 "Listen to two students talking about their class."],
"B1-21":["Listen to the story about the school. Tap any sentence to hear it again.",
 "ذَاكَ is just another way to say ذٰلِكَ, that.",
 "وَلٰكِنْ means but. It joins two ideas that are different."],
"B1-22":["Colours for boy words follow one pattern: أَحْمَرُ, red. أَخْضَرُ, green. أَزْرَقُ, blue.",
 "Colours never take un. They end in just one u: قَلَمٌ أَحْمَرُ, a red pen.",
 "Some words never take un: girls' names like زَيْنَبُ, names with ة like حَمْزَةُ, and words ending in aanu like عُثْمَانُ."],
"B1-23":["After مِنْ and إِلَى most words end in in: مِنْ مُحَمَّدٍ. Words that never take un end in a instead: مِنْ زَيْنَبَ.",
 "The same happens to all the words that never take un: إِلَى مَكَّةَ, لِأَحْمَدَ.",
 "هَاتِ means give me or bring. The teacher says it when he wants something."],
"B1-24":[],
"B2-01":["إِنَّ makes a sentence stronger, like indeed. The word after it ends in a: إِنَّ الْمُدَرِّسَ جَدِيدٌ.",
 "إِنَّ can join a pronoun: إِنَّهُ he, إِنَّهَا she, إِنَّكَ you, إِنِّي I.",
 "لَعَلَّ means perhaps or I hope. It works just like إِنَّ: لَعَلَّكَ بِخَيْرٍ, I hope you are well."],
"B2-02":["لَيْسَ means is not. The next word often gets بِ and ends in i: حَامِدٌ لَيْسَ بِطَالِبٍ.",
 "لَيْسَ changes with the person: هِيَ لَيْسَتْ, هُمْ لَيْسُوا, هُنَّ لَسْنَ.",
 "For you and me: أَنْتَ لَسْتَ, أَنَا لَسْتُ, نَحْنُ لَسْنَا."],
"B2-03":["From 11 to 19 the number is two words, and the noun after it is one, ending in an: أَرْبَعَةَ عَشَرَ طَالِبًا.",
 "To say taller or bigger, use أَفْعَلُ with مِنْ: كَبِيرٌ becomes أَكْبَرُ مِنْ.",
 "Put أَفْعَلُ before a noun to say the most: أَطْوَلُ طَالِبٍ, the tallest student."],
"B2-04":["The past verb changes its ending for each person: ذَهَبَ he, ذَهَبَتْ she, ذَهَبُوا they, ذَهَبْنَ they girls.",
 "For you: ذَهَبْتَ to a boy, ذَهَبْتِ to a girl, ذَهَبْتُمْ to boys, ذَهَبْتُنَّ to girls.",
 "ذَهَبْتُ is I went, ذَهَبْنَا is we went. Listen closely: ذَهَبْتُ and ذَهَبْتَ differ only in the last sound."],
"B2-05":["A verb sentence: first the verb, then the doer ending in u, then the object ending in a. قَرَأَ الطَّالِبُ الْقُرْآنَ.",
 "If the verb comes first, it stays singular even with many doers: ذَهَبَ الطُّلَّابُ.",
 "The object can stick to the verb as an ending: فَتَحْتُهُ, I opened it."],
"B2-06":["Stick him, her or them to the verb: رَأَيْتُهُ I saw him, رَأَيْتُهَا I saw her, رَأَيْتُهُمْ I saw them.",
 "أَنَّ means that. It joins two sentences: أَظُنُّ أَنَّهُ مَرِيضٌ, I think that he is sick.",
 "With girl words, 11 to 19 change: ثَلَاثَ عَشْرَةَ طَالِبَةً, thirteen female students."],
"B2-07":["To a group of boys: ذَهَبْتُمْ. To a group of girls: ذَهَبْتُنَّ. They answer: ذَهَبْنَا, we went.",
 "When it joins تُمْ, a و comes in between: رَأَيْتُمُوهُ, you all saw him.",
 "كَانَ means was. For a girl, كَانَتْ. كَانَ الْمُدَرِّسُ فِي الْفَصْلِ, the teacher was in the class."],
"B2-08":["Review of he and they: ذَهَبَ, ذَهَبُوا. She and they girls: ذَهَبَتْ, ذَهَبْنَ.",
 "Review of you: ذَهَبْتَ, ذَهَبْتُمْ for boys. ذَهَبْتِ, ذَهَبْتُنَّ for girls. And I and we: ذَهَبْتُ, ذَهَبْنَا.",
 "In these verbs the ending tells you who did it: تُ is I, وا is they, نَا is we."],
"B2-09":["To say how amazing!, use مَا with أَفْعَلَ: مَا أَسْهَلَ هٰذَا الدَّرْسَ! How easy this lesson is!",
 "When calling someone with يَا, a one-word name ends in u: يَا مُحَمَّدُ. A two-word name ends in a: يَا عَبْدَ اللهِ.",
 "Plurals ending in aat never end in a as an object. They take i: رَأَيْتُ سَيَّارَاتٍ, I saw cars."],
"B2-10":["The present verb starts with يَـ for he and ends in u: ذَهَبَ, he went, becomes يَذْهَبُ, he goes.",
 "The middle vowel can be u, i or a: يَكْتُبُ, يَجْلِسُ, يَذْهَبُ. Learn it with each verb.",
 "Put لَا before a present verb to say does not: لَا يَذْهَبُ, he does not go."],
"B2-11":["Present verbs for others: يَدْرُسُ he, يَدْرُسُونَ they, تَدْرُسُ she, يَدْرُسْنَ they girls.",
 "تَـ is for you, and also for she. أَ is for I, and نَـ is for we.",
 "Put سَـ at the front for the future: سَأَذْهَبُ, I will go."],
"B2-12":["To a girl, the present verb ends in iina: مَاذَا تَفْعَلِينَ؟ What are you doing?",
 "To boys: تَذْهَبُونَ. To girls: تَذْهَبْنَ. The group answers with نَـ: نَذْهَبُ.",
 "Use إِنَّ at the start or after قَالَ, said. Use أَنَّ after other verbs like سَمِعْتُ, I heard."],
"B2-13":["Review: يَذْهَبُ, يَذْهَبُونَ for boys. تَذْهَبُ, يَذْهَبْنَ for girls.",
 "When you talk to someone, the verb always starts with تَـ. I is أَ, and we is نَـ.",
 "Every present verb starts with one of four letters: أَ, نَ, يَ, تَ."],
"B2-14":["To give a command, drop the تَـ, end with a sukun and add an alif: تَكْتُبُ becomes اُكْتُبْ, write!",
 "If the middle vowel is i or a, start with اِ: اِجْلِسْ, sit! اِذْهَبْ, go!",
 "Two short ones to learn by heart: كُلْ, eat! and خُذْ, take!"],
"B2-15":["To say don't, put لَا before the you verb and end it with a sukun: لَا تَخْرُجْ, don't go out!",
 "Careful: لَا تَأْكُلْ with a sukun means don't eat! لَا تَأْكُلُ with u means you don't eat.",
 "Two hamzas together become one long آ: أَنَا آكُلُ, I eat."],
"B3-01":["يُرِيدُ, he wants, starts with u: يُرِيدُ, تُرِيدُ, أُرِيدُ, نُرِيدُ.",
 "Girl colours change pattern: أَحْمَرُ becomes حَمْرَاءُ. حَقِيبَةٌ حَمْرَاءُ, a red bag.",
 "آخَرُ means another, and for girl words it is أُخْرَى: سُورَةٌ أُخْرَى, another surah."],
"B3-02":["After أَنْ, to, the verb ends in a: أُرِيدُ أَنْ أَذْهَبَ, I want to go.",
 "لِـ means in order to, and the verb ends in a too: خَرَجْتُ لِأَشْرَبَ الْمَاءَ.",
 "يُمْكِنُكَ means you can: يُمْكِنُكَ أَنْ تَجْلِسَ هُنَا, you can sit here."],
"B3-03":["After أَنْ, the long forms lose their ن: يَذْهَبُونَ becomes أَنْ يَذْهَبُوا.",
 "The girls' forms ending in نَ never change: أَنْ يَذْهَبْنَ.",
 "أَنْ and لَا join into أَلَّا: أَرْجُو أَلَّا تَدْخُلَ, please do not come in."],
"B3-04":["لَنْ means will not, and the verb ends in a: لَنْ أَذْهَبَ, I will not go.",
 "After لَنْ, the long forms lose their ن too: لَنْ يَذْهَبُوا.",
 "Three ways to say no: مَا for the past, لَا for now, لَنْ for the future."],
"B3-05":["Two of something ends in aani when it does the action, and ayni otherwise: جَاءَ الْمُدَرِّسَانِ, but رَأَيْتُ الْمُدَرِّسَيْنِ.",
 "After كَمْ, use one word ending in an: كَمْ سُورَةً حَفِظْتَ؟",
 "One of them and the other: أَحَدُهُمَا وَالْآخَرُ for boy words, إِحْدَاهُمَا وَالْأُخْرَى for girl words."],
"B3-06":["لَمْ means did not, with a present verb ending in sukun: لَمْ يَذْهَبْ, he did not go.",
 "After لَمْ the long forms lose their ن: لَمْ يَذْهَبُوا, they did not go.",
 "لَمَّا means not yet: لَمَّا أَكْتُبْ, I have not written yet."],
"B3-07":["The present verb has three endings: u normally, a after أَنْ and لَنْ, and sukun after لَمْ.",
 "The long forms keep the ن normally, and drop it after لَنْ and لَمْ.",
 "The girls' forms with نَ never change at all."],
"B3-08":["The plural uuna becomes iina as an object or after a small word like مِنْ: رَأَيْتُ الْمُدَرِّسِينَ.",
 "The tens work the same way: عِشْرُونَ, twenty, becomes عِشْرِينَ as an object.",
 "In a number like 53, both parts change their ending: قَرَأْنَا ثَلَاثًا وَخَمْسِينَ صَفْحَةً."],
"B3-09":["One and two come after the noun and match it: طَالِبٌ وَاحِدٌ, طَالِبَانِ اثْنَانِ.",
 "Three to ten do the opposite: ثَلَاثَةُ طُلَّابٍ for boys, ثَلَاثُ طَالِبَاتٍ for girls.",
 "From 11 to 99, the noun is one, ending in an: ثَلَاثَةَ عَشَرَ طَالِبًا."],
"B3-10":["كَانَ makes the second word end in a: حَامِدٌ مَرِيضٌ becomes كَانَ حَامِدٌ مَرِيضًا, Hamid was sick.",
 "لَا يَزَالُ means still, and works like كَانَ: لَا يَزَالُ مَرِيضًا, he is still sick.",
 "أَبٌ changes: أَبُوكَ when he does something, أَبَاكَ as an object, أَبِيكَ after a small word."],
"B3-11":["Verbs starting with و drop it in the present: وَجَدَ, he found, becomes يَجِدُ, he finds.",
 "Their commands are very short: قِفْ, stop! ضَعْ, put!",
 "To make something small, use the pattern فُعَيْلٌ: وَلَدٌ becomes وُلَيْدٌ, a little boy."],
"B3-12":["Some verbs have a long vowel in the middle: قَالَ يَقُولُ, بَاعَ يَبِيعُ, نَامَ يَنَامُ.",
 "With endings like تُ the long vowel gets short: قُلْتُ, I said. بِعْتُ, I sold. نِمْتُ, I slept.",
 "With a sukun at the end, it gets short too: لَمْ يَقُلْ, قُلْ, لَا تَقُلْ."],
"B3-13":["Some verbs end in a long vowel: مَشَى يَمْشِي, دَعَا يَدْعُو, نَسِيَ يَنْسَى.",
 "With تُ the ending turns into يْ or وْ: مَشَيْتُ, I walked. دَعَوْتُ, I invited.",
 "After لَمْ, in a command, or with لَا that forbids, the last vowel drops: لَمْ يَمْشِ, اُدْعُ, لَا تَنْسَ."],
"B3-14":["Some verbs have a double letter with a shadda: حَجَّ. With تُ the two letters split: حَجَجْتُ.",
 "After لَمْ and in commands, they stay joined and end in a: لَمْ يَحُجَّ, جُرَّ, pull!",
 "قَطُّ means never for the past. أَبَدًا means never for the future."],
"B3-15":["For two people: أَنْتُمَا, you two, and هُمَا, they two.",
 "Past verbs for two: ذَهَبَا for two boys, ذَهَبَتَا for two girls, ذَهَبْتُمَا for you two.",
 "Present for two: يَذْهَبَانِ and تَذْهَبَانِ. Command: اِذْهَبَا, go, you two!"],
"B3-16":["Five present forms end in aani, uuna or iina. They keep the ن normally and drop it after أَنْ, لَنْ and لَمْ.",
 "A describing word copies its noun in four ways: the ending, boy or girl, how many, and الْ."],
"B3-17":[],
"B4-01":["Some words change their ending, like الْمُدَرِّسُ, الْمُدَرِّسَ, الْمُدَرِّسِ. Others never change, like هٰؤُلَاءِ and الَّذِي.",
 "The main endings for nouns are u, a and i. For present verbs they are u, a and sukun.",
 "Some words use other signs: plurals with aat, names like فِرْعَوْنَ, أَبُوكَ, and the plurals and twos you learned."],
"B4-02":["وَ can mean while, telling how someone was: رَأَيْتُهُ وَهُوَ يَدْخُلُ, I saw him while he was going in.",
 "وَ has three jobs: and, while, and by in an oath like وَاللهِ.",
 "لَعَلَّ can show hope for something good, or worry about something bad."],
"B4-03":["When we don't say who did it, we use the passive: قُتِلَ الْجَاسُوسُ, the spy was killed. The object now ends in u.",
 "Past passive: u on the first letter, i before the last: كُتِبَ. Present passive: u first, a before the last: يُكْتَبُ.",
 "Use it every day: يُفْتَحُ الْمَطْعَمُ, the restaurant opens. سُئِلْتُ, I was asked."],
"B4-04":["The doer noun is on the pattern فَاعِلٌ: سَرَقَ, he stole, gives سَارِقٌ, a thief.",
 "The done-to noun is on the pattern مَفْعُولٌ: مَسْرُوقٌ, stolen. مَكْتُوبٌ, written.",
 "مَا can work like لَيْسَ: مَا أَنَا بِغَافِلٍ, I am not unaware."],
"B4-05":["Verbs with a long middle vowel make doer nouns with a hamza: قَالَ gives قَائِلٌ, بَاعَ gives بَائِعٌ.",
 "Their passive: قِيلَ, it was said. يُبَاعُ, it is sold.",
 "Verbs ending in a vowel: دَعَا gives دَاعٍ, one who calls, and مَدْعُوٌّ, invited."],
"B4-06":["Nouns for a place or a time start with مَـ: مَوْعِدٌ, an appointment.",
 "If the present verb has a or u in the middle, use مَفْعَلٌ: يَلْعَبُ gives مَلْعَبٌ, a playground.",
 "If it has i in the middle, or starts with و, use مَفْعِلٌ: مَجْلِسٌ, مَوْقِفٌ."],
"B4-07":["Tool nouns name the thing we use: فَتَحَ, he opened, gives مِفْتَاحٌ, a key.",
 "Three patterns: مِفْعَالٌ like مِفْتَاحٌ, مِفْعَلٌ like مِقَصٌّ, and مِفْعَلَةٌ like مِكْنَسَةٌ, a broom.",
 "وَيْلٌ لِـ means woe to. Allah warns those who cheat when they weigh."],
"B4-08":["A noun is known, مَعْرِفَةٌ, like مُحَمَّدٌ, or not known, نَكِرَةٌ, like رَجُلٌ, a man.",
 "Known words include pronouns like أَنَا, names like أَحْمَدُ, pointing words like هٰذَا, and joining words like الَّذِي.",
 "Also known: words with الْ, words joined to a known word like كِتَابُ الْمُدَرِّسِ, and someone you call with يَا."],
"B4-09":["When two of something or a uuna plural is joined to another word, the ن drops: قَلَمَا حَامِدٍ, Hamid's two pens.",
 "With my, two becomes قَلَمَايَ as the doer and قَلَمَيَّ as an object.",
 "كِلَا and كِلْتَا mean both: كِلَاهُمَا مَرِيضٌ, both of them are sick."],
"B4-10":["A noun sentence starts with a noun, with أَنْ and a verb, or with إِنَّ: اللهُ غَفُورٌ.",
 "A verb sentence starts with a verb. Some verbs need only a doer, like طَلَعَتِ الشَّمْسُ. Verbs like كَانَ need more.",
 "أَنْ with a verb can be swapped for a verbal noun: أَنْ تَذْهَبُوا means ذَهَابُكُمْ, your going."],
"B4-11":["The subject is what we talk about, and the predicate tells us about it: الْقَمَرُ جَمِيلٌ.",
 "The subject can be not known if a place word comes first: عِنْدَنَا سَيَّارَةٌ, we have a car.",
 "A word can be left out when it is clear: مَا اسْمُكَ؟ حَامِدٌ."],
"B4-12":["A word ending in a can tell when or where: وَصَلْتُ يَوْمَ الثُّلَاثَاءِ, I arrived on Tuesday.",
 "Some time and place words never change: مَتَى, أَيْنَ, أَمْسِ, الْآنَ, حَيْثُ.",
 "Other words can stand in for time or place: سَافَرْنَا كُلَّ النَّهَارِ, we travelled all day."],
"B4-13":["لِـ before a present verb with a sukun makes a command for someone else: لِيَدْخُلْ, let him come in.",
 "لَا that forbids works for others too: لَا يَخْرُجْ أَحَدٌ, no one is to go out.",
 "Four little words give one verb a sukun: لَمْ, لَمَّا, لَا that forbids, and لِـ for commands."],
"B4-14":["إِذَا means when or if: إِذَا جَاءَ رَمَضَانُ فُتِحَتْ أَبْوَابُ الْجَنَّةِ.",
 "The answer starts with فَـ when it is a command, a don't, a question, or a noun sentence: إِذَا جَاءَ فَقُلْ لَهُ.",
 "To say of or from, add يٌّ and drop the ة: مَدْرَسَةٌ gives مَدْرَسِيٌّ."],
"B4-15":["إِنْ means if, and gives both verbs a sukun: إِنْ تَجْتَهِدْ تَنْجَحْ, if you work hard, you will pass.",
 "Other if-words work the same: مَنْ whoever, مَا whatever, مَتَى whenever, مَهْمَا whatever.",
 "The answer also takes فَـ before لَيْسَ, قَدْ, لَنْ or سَـ: مَنْ غَشَّنَا فَلَيْسَ مِنَّا."],
"B4-16":["Most verbs have three root letters, like كَتَبَ. Some have four, like تَرْجَمَ. Some get extra letters, like سَلَّمَ.",
 "Simple three-letter verbs follow six patterns, like كَتَبَ يَكْتُبُ and جَلَسَ يَجْلِسُ.",
 "The pattern with a doubled middle letter: سَلَّمَ, يُسَلِّمُ, سَلِّمْ, تَسْلِيمٌ."],
"B4-17":["The pattern أَفْعَلَ adds a hamza at the start: أَرْسَلَ, he sent. يُرْسِلُ, إِرْسَالٌ, أَرْسِلْ.",
 "Its doer is مُرْسِلٌ, the sender, and its done-to word is مُرْسَلٌ, sent.",
 "لَـ makes a sentence strong: لَهٰذَا مُسْتَحِيلٌ. أَصْبَحَ means became, and works like كَانَ."],
"B4-18":[]
};
/* ============================== ARABIYYAH KIDS ENGINE ==============================
   Uses the same lesson content as the adult course (WORDS, EXTRA, RULES, STEPS_DEF).
   One file, three age versions:  small = 3–5 · mid = 6–8 · big = 9–13
   The age comes from the app (ilmstation:welcome → age), or the child picks it once (remembered). */
const $=s=>document.querySelector(s), view=$("#view");
const rand=a=>a[Math.floor(Math.random()*a.length)], shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let ac; function tone(f,d=.1,vol=.12){ if(muted)return; try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)();
  f.forEach((fr,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=fr;const t=ac.currentTime+i*d;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d*1.8);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d*2);});}catch(e){} }
const good=()=>tone([587,784,988],.09), soft=()=>tone([330],.12,.05);
$("#sound").onclick=e=>{ muted=!muted; e.currentTarget.textContent=muted?"🔇":"🔊"; if(muted) stopVoice(); };
const sayAr = t => speak(String(t).replace(/[^؀-ۿ\s،.]/g," ").replace(/\s+/g," ").trim());
const sayEn = t => speakMix(t);
const strip = h => String(h||"").replace(/<[^>]+>/g,"");
/* ---- pictures: emoji, or a small drawing for things that have no emoji ---- */
const DRAW = {
  desk:`<svg viewBox="0 0 64 64" width="1em" height="1em"><rect x="6" y="20" width="52" height="7" rx="2" fill="#b07a45"/><rect x="38" y="27" width="18" height="24" rx="2" fill="#c98f55"/><rect x="41" y="31" width="12" height="7" rx="1.5" fill="#e3b27c"/><rect x="41" y="41" width="12" height="7" rx="1.5" fill="#e3b27c"/><rect x="9" y="27" width="4" height="26" rx="1.5" fill="#8a5c33"/><rect x="40" y="51" width="4" height="4" fill="#8a5c33"/><rect x="51" y="51" width="4" height="4" fill="#8a5c33"/><rect x="14" y="14" width="16" height="6" rx="1" fill="#4a7fbf"/></svg>`,
  iron:`<svg viewBox="0 0 64 64" width="1em" height="1em"><path d="M8 46 C10 30 24 24 40 24 L52 24 C56 24 58 28 58 32 L58 46 Z" fill="#6aa7d8" stroke="#2f5f86" stroke-width="2"/><rect x="6" y="46" width="54" height="6" rx="2" fill="#c9d3dc" stroke="#7b8894" stroke-width="1.5"/><path d="M30 24 C30 14 36 12 44 12 L52 12 C55 12 56 14 56 17 L56 24" fill="none" stroke="#2f5f86" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="36" r="3" fill="#ffd23f"/></svg>`,
  fridge:`<svg viewBox="0 0 64 64" width="1em" height="1em"><rect x="16" y="4" width="32" height="56" rx="4" fill="#eef3f7" stroke="#8a9aa8" stroke-width="2.5"/><line x1="16" y1="24" x2="48" y2="24" stroke="#8a9aa8" stroke-width="2.5"/><rect x="21" y="10" width="3" height="9" rx="1.5" fill="#8a9aa8"/><rect x="21" y="29" width="3" height="14" rx="1.5" fill="#8a9aa8"/><rect x="18" y="58" width="5" height="4" fill="#8a9aa8"/><rect x="41" y="58" width="5" height="4" fill="#8a9aa8"/></svg>`,
  sugar:`<svg viewBox="0 0 64 64" width="1em" height="1em"><path d="M14 22 L50 22 L46 58 L18 58 Z" fill="#f3f0ea" stroke="#9aa5b1" stroke-width="2"/><rect x="12" y="16" width="40" height="7" rx="2" fill="#5b8fd1"/><rect x="24" y="30" width="7" height="7" fill="#fff" stroke="#bbb"/><rect x="33" y="34" width="7" height="7" fill="#fff" stroke="#bbb"/><rect x="27" y="42" width="7" height="7" fill="#fff" stroke="#bbb"/><text x="32" y="12" font-size="9" text-anchor="middle" fill="#5b8fd1" font-family="sans-serif" font-weight="700">SUGAR</text></svg>`,
  hanky:`<svg viewBox="0 0 64 64" width="1em" height="1em"><path d="M10 14 L54 14 L50 52 L14 52 Z" fill="#f4f1ea" stroke="#9aa5b1" stroke-width="2.5"/><path d="M16 20 L48 20 L45 46 L19 46 Z" fill="none" stroke="#5b8fd1" stroke-width="2" stroke-dasharray="4 3"/><path d="M10 14 L32 34 L54 14" fill="none" stroke="#c8cdd4" stroke-width="1.5"/></svg>`,
};
// newer emoji that old phones can't show: replaced by the English word
const emojiOK = (()=>{ const memo={}; return e=>{ if(e in memo) return memo[e]; try{ const c=document.createElement("canvas"); c.width=c.height=20; const x=c.getContext("2d");
  x.textBaseline="top"; x.font="16px sans-serif"; x.fillText(e,0,0); const d=x.getImageData(0,0,20,20).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]>0) n++;
  // a missing emoji draws a box/blank: compare with an unknown character
  x.clearRect(0,0,20,20); x.fillText("￿",0,0); const d2=x.getImageData(0,0,20,20).data; let same=true; for(let i=0;i<d.length;i++) if(d[i]!==d2[i]){ same=false; break; }
  return memo[e] = n>0 && !same; }catch(err){ return memo[e]=true; } }; })();
function picHTML(pic, en=""){
  if(!pic) return "";
  if(pic.startsWith("draw:")) return `<span class="pic">${DRAW[pic.slice(5)]||""}</span>`;
  if(/🫏|🪿|🫎/.test(pic) && !emojiOK(pic)) return `<span class="pic word">${en.replace(/^an? /,"")}</span>`;
  return `<span class="pic">${pic}</span>`;
}
const W = ar => WORDS.find(w=>w.ar===ar) || (typeof EXTRA!=="undefined" && EXTRA.find(w=>w.ar===ar)) || {};
/* Meanings in the learner's language: each word carries m:"fr|ha|ur|id|tl|yo|ig|bn|ms" */
const MLANGS = ["fr","ha","ur","id","tl","yo","ig","bn","ms"];
const wantLang = () => window.__wantLang || window.__qlang || LANG || "en";
function mean(en){
  const lg = wantLang(); if(!en || lg==="en") return en;
  const w = [...WORDS, ...(typeof EXTRA!=="undefined"?EXTRA:[])].find(x=>x.en===en);
  const k = MLANGS.indexOf(lg);
  if (w && w.m && k>=0){ const t = w.m.split("|")[k]; if(t) return `${t}<small class="enSub"> · ${en}</small>`; }
  return TX(en);
}


/* ---------- styles for the kids' screens ---------- */
document.head.insertAdjacentHTML("beforeend", `<style>
.kid h2{font-size:26px;text-align:center}.kid .lead{text-align:center}
.nuri{font-size:64px;text-align:center;line-height:1;animation:bob 2.4s ease-in-out infinite}
@keyframes bob{50%{transform:translateY(-8px)}}
.ages{display:grid;gap:14px;margin-top:16px}.ages button{font:800 22px Manrope,system-ui;padding:20px;border-radius:22px;border:3px solid var(--line,#ddd);background:#fff;cursor:pointer;display:flex;align-items:center;gap:14px}
.ages button span{font-size:40px}
.bigpic{font-size:120px;text-align:center;line-height:1.1;cursor:pointer}.bigpic .pic.word{font-size:28px;padding:18px 22px}
.bigar{font:700 46px var(--ar);text-align:center;direction:rtl;margin:6px 0}
.kopts{display:grid;gap:16px;margin-top:18px}.kopts.n2{grid-template-columns:1fr 1fr}.kopts.n3{grid-template-columns:1fr 1fr 1fr}
.kopts>*{min-width:0}.kopt img,.kopt svg{max-width:100%;height:auto}.kopts.n3{gap:10px}.kopts.n3 .kopt{font-size:58px;min-height:112px;border-radius:20px}
.kpair{display:flex;direction:rtl;justify-content:center;align-items:flex-start;gap:10px;flex-wrap:wrap;margin:4px 0 8px}.kpair>div{text-align:center}.kpair .ar{font:700 34px var(--ar)}.kpair small{display:block;color:#6b665c;font-size:15px;direction:ltr}.kpair .sep{font-size:26px;color:#9a948a;padding-top:6px}
.wcard.say{border-color:var(--gold);box-shadow:0 0 0 4px var(--goldSoft)}
.kopt{position:relative;overflow:hidden;border:4px solid #e6e1d6;background:#fff;border-radius:26px;min-height:140px;font-size:84px;display:grid;place-items:center;cursor:pointer;transition:transform .15s}
.kopt.txt{font:700 24px var(--ar);direction:rtl;padding:14px;min-height:96px}.kopt.mean{font:700 18px Manrope,system-ui;padding:12px;min-height:90px}
.kopt.glow{border-color:var(--gold);animation:glow 1s ease-in-out infinite}@keyframes glow{50%{transform:scale(1.06);box-shadow:0 0 0 8px var(--goldSoft)}}
.kopt.right{border-color:var(--em);background:var(--emSoft)}.kopt.shake{animation:shake .35s}@keyframes shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.hand{position:fixed;font-size:56px;z-index:50;pointer-events:none;transition:left .9s ease,top .9s ease,transform .2s;transform-origin:20% 10%}
.hand.tap{transform:scale(.8)}
.stars{font-size:36px;text-align:center;letter-spacing:4px;margin:6px 0}
.pop{position:fixed;font-size:60px;z-index:60;pointer-events:none;animation:pop .8s ease-out forwards}@keyframes pop{to{transform:translateY(-80px) scale(1.4);opacity:0}}
.wlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:12px}
.wcard{background:#fff;border:2px solid #e6e1d6;border-radius:16px;padding:12px;text-align:center;cursor:pointer}.wcard .ar{font:700 24px var(--ar)}.wcard small{display:block;color:#666;margin-top:4px;font:600 13px Manrope,system-ui,sans-serif;line-height:1.3}
.tip{background:var(--goldSoft);border-radius:14px;padding:10px 14px;font-weight:700;text-align:center;margin-top:12px}
.dots{display:flex;gap:6px;justify-content:center;margin:4px 0 10px}.dots i{width:12px;height:12px;border-radius:50%;background:#e6e1d6}.dots i.on{background:var(--em)}
.chg{background:none;border:0;color:#777;text-decoration:underline;cursor:pointer;font:600 13px Manrope,system-ui,sans-serif;display:block;margin:14px auto 0}
</style>`);

/* ---------- data from the lesson ---------- */
const K_ALLW = [...WORDS, ...(typeof EXTRA!=="undefined"?EXTRA:[])];
const K_PICW = WORDS.filter(x=>x.pic && !x.np && !(x.pic.startsWith("draw:") && !DRAW[x.pic.slice(5)]));
const K_SENT = (()=>{ const out=[], seen=new Set();
  const add=(ar,en)=>{ if(!ar||!en||seen.has(ar)) return; const n=ar.split(/\s+/).length; if(n<2||n>6||/[←·=+…]/.test(ar)) return; seen.add(ar); out.push({ar,en}); };
  (typeof RULES!=="undefined"?RULES:[]).forEach(R=>(R.ex||[]).forEach(e=>!R.read && add(e[0], e[1])));
  STEPS_DEF.filter(s=>s.type==="repeat").forEach(s=>(s.items||[]).forEach(i=>add(i[0], i[1])));
  return out; })();
const K_POOLQ = STEPS_DEF.filter(s=>["choose","listen"].includes(s.type) && s.items && !["Meaning","Listen"].includes(s.name))
  .flatMap(s=>s.items.map(q=>({...q, tag:s.title||s.name})))
  .filter(q=>q.ans!=null && (q.opts || q.pool) && q.kind!=="pic");
const optsFor = (Q, n=3) => Q.opts ? shuffle([...new Set(Q.opts)]) : shuffle([Q.ans, ...shuffle([...new Set(Q.pool)].filter(x=>x!==Q.ans)).slice(0,n-1)]);
const meanT = en => strip(mean(en));

/* ---------- age ---------- */
const K_BANDS = { small:{age:"3–5", e:"🧸"}, mid:{age:"6–8", e:"🎈"}, big:{age:"9–13", e:"🎒"} };
const ageBand = a => a==null||isNaN(a) ? null : a<=5 ? "small" : a<=8 ? "mid" : "big";
let K_BAND = null;
const store = { get(){ try{ return localStorage.getItem("arabiyyah.kidsBand"); }catch(e){ return null; } }, set(v){ try{ localStorage.setItem("arabiyyah.kidsBand", v); }catch(e){} } };
function pickAge(){
  stopVoice();
  view.innerHTML = `<div class="card kid"><div class="nuri">🦉</div><h2>How old are you?</h2>
    <div class="ages">${Object.entries(K_BANDS).map(([k,b])=>`<button data-b="${k}"><span>${b.e}</span>${b.age}</button>`).join("")}</div></div>`;
  view.querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>{ K_BAND=b.dataset.b; store.set(K_BAND); hello(); });
  setTimeout(()=>sayEn("Hello! How old are you? Tap your age."), 300);
}

/* ---------- the helping hand and little rewards ---------- */
let handEl=null;
async function showHand(target, doTap=true){
  if(!target || !target.isConnected) return;
  if(!handEl){ handEl=document.createElement("div"); handEl.className="hand"; handEl.textContent="👆"; document.body.append(handEl); }
  const r=target.getBoundingClientRect();
  handEl.style.display="block"; handEl.style.left=(innerWidth/2-20)+"px"; handEl.style.top=(innerHeight-90)+"px";
  await wait(60); handEl.style.left=(r.left+r.width/2-14)+"px"; handEl.style.top=(r.top+r.height/2-6)+"px";
  await wait(950); if(doTap){ handEl.classList.add("tap"); await wait(220); handEl.classList.remove("tap"); }
}
const hideHand = () => { if(handEl) handEl.style.display="none"; };
function pop(el, e="⭐"){ const r=el.getBoundingClientRect(), p=document.createElement("div"); p.className="pop"; p.textContent=e;
  p.style.left=(r.left+r.width/2-30)+"px"; p.style.top=(r.top)+"px"; document.body.append(p); setTimeout(()=>p.remove(),900); }
const K_PRAISE=["مَا شَاءَ اللهُ","أَحْسَنْتَ","مُمْتَازٌ","بَارَكَ اللهُ فِيكَ"];
const dots = (i,n) => `<div class="dots">${Array.from({length:n},(_,k)=>`<i class="${k<i?"on":""}"></i>`).join("")}</div>`;

/* ---------- screens ---------- */
let plan=[], at=0, firstTry=0, rounds=0;
function next(){ hideHand(); at++; if(at<plan.length) plan[at](); }
function hello(){
  if(!K_BAND){ pickAge(); return; }
  plan = K_BAND==="small" ? planSmall() : K_BAND==="mid" ? planMid() : planBig(); at=0; firstTry=0; rounds=0;
  if(!plan.length){ notForAge(); return; }
  const parentTip = K_BAND==="small" ? `<div class="tip">👨‍👩‍👧 For parents: sit with your child for the first lessons and tap together.</div>` : "";
  view.innerHTML = `<div class="card kid"><div class="nuri">🦉</div><h2>Assalamu alaikum!</h2>
    <p class="lead">${K_BAND==="big" ? strip(LESSON.title) : "I'm Nuri. Let's learn Arabic words!"}</p>${parentTip}
    <div class="row" style="justify-content:center;margin-top:18px"><button class="btn gold pulse" id="go" style="font-size:22px;padding:18px 40px">▶ Start</button></div>
    <button class="chg" id="chg">Not ${K_BANDS[K_BAND].age}? Change age</button></div>`;
  $("#go").onclick=()=>{ stopVoice(); plan[0](); };
  $("#chg").onclick=pickAge;
  setTimeout(()=>sayEn(K_BAND==="big" ? "السَّلَامُ عَلَيْكُمْ. I am Nuri. Tap start to begin the lesson." : "السَّلَامُ عَلَيْكُمْ. I am Nuri. Tap the big button to start!"), 300);
}
function notForAge(){
  view.innerHTML = `<div class="card kid"><div class="nuri">🦉</div><h2>This one is for bigger children</h2>
    <p class="lead">This lesson is for ages 6 and up. You can go on to the next lesson.</p>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn pulse" id="bk">✓ Go on</button></div>
    <button class="chg" id="chg">Change age</button></div>`;
  window.__q={result:true}; finishLesson(1, 1, {...LESSON, percent:100, band:K_BAND, skipped:true});
  $("#bk").onclick=()=>{ try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
  $("#chg").onclick=pickAge; setTimeout(()=>sayEn("This lesson is for bigger children. Well done, you can go on!"), 300);
}

/* Learn: one big word at a time, read by Nuri */
function learnStep(list){ return ()=>{
  let i=0;
  const show=async()=>{ if(i>=list.length) return next();
    const w=list[i], hasPic=!!(w.pic && !w.np);
    view.innerHTML=`<div class="card kid">${dots(i,list.length)}<h2>Listen and say</h2>
      <div class="bigpic" id="bp">${hasPic?picHTML(w.pic,w.en):`<span class="pic word">${meanT(w.en)}</span>`}</div>
      <div class="bigar" id="ba">${w.ar}</div>${K_BAND!=="small"?`<p class="lead">${meanT(w.en)}</p>`:""}
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn sec" id="ag">🔊 Again</button><button class="btn pulse" id="nx" style="display:none">Next →</button></div></div>`;
    window.__q={learn:true};
    const say=()=>sayAr(w.ar); $("#bp").onclick=say; $("#ba").onclick=say; $("#ag").onclick=say;
    $("#nx").onclick=()=>{ stopVoice(); i++; show(); };
    const me=$("#nx"); await say(); await wait(500); if(me.isConnected) await sayAr(w.ar); if(me.isConnected){ me.style.display=""; if(K_BAND==="small"){ await wait(1500); if(me.isConnected){ i++; show(); } } }
  };
  show();
}; }

/* Tap game: hear a word, tap its picture (or meaning). Demo hand first; glow and hand when the child waits. */
function tapStep(list, n, nOpts, demoFirst){ return ()=>{
  const items=shuffle(list).slice(0,n); while(items.length<n && list.length) items.push(rand(list));
  let i=0, demoDone=!demoFirst;
  const round=()=>{ if(i>=items.length) return next();
    const w=items[i], others=shuffle(list.filter(x=>x.ar!==w.ar)).slice(0,nOpts-1), opts=shuffle([w,...others]);
    const picMode = opts.every(o=>o.pic && !o.np);
    view.innerHTML=`<div class="card kid">${dots(i,items.length)}<h2>${picMode?"Tap the picture":"Tap the meaning"}</h2>
      <div style="text-align:center"><button class="btn gold" id="pl" style="font-size:20px">🔊 ${w.ar}</button></div>
      <div class="kopts n${opts.length}">${opts.map((o,j)=>`<button class="kopt ${picMode?"":"mean"}" data-j="${j}">${picMode?picHTML(o.pic,o.en):meanT(o.en)}</button>`).join("")}</div></div>`;
    const right=view.querySelector(`.kopt[data-j="${opts.indexOf(w)}"]`); window.__q={ans:opts.indexOf(w)};
    let wrongs=0, t1, t2, done=false;
    const ask=()=>sayEn(`Where is ${w.ar}?`);
    const idle=()=>{ clearTimeout(t1); clearTimeout(t2);
      t1=setTimeout(()=>{ if(done||!right.isConnected) return; right.classList.add("glow"); sayAr(w.ar); }, K_BAND==="small"?5000:8000);
      t2=setTimeout(()=>{ if(done||!right.isConnected) return; showHand(right,false); }, K_BAND==="small"?10000:15000); };
    $("#pl").onclick=()=>sayAr(w.ar);
    view.querySelectorAll(".kopt").forEach(b=>b.onclick=async()=>{ if(done) return; hideHand();
      if(b===right){ done=true; clearTimeout(t1); clearTimeout(t2); b.classList.remove("glow"); b.classList.add("right"); good(); pop(b);
        rounds++; if(!wrongs) firstTry++; await speak(rand(K_PRAISE)); await wait(300); i++; round(); }
      else { wrongs++; soft(); b.classList.add("shake"); setTimeout(()=>b.classList.remove("shake"),400); right.classList.add("glow"); sayAr(w.ar); idle(); }
    });
    (async()=>{
      if(!demoDone){ demoDone=true; await sayEn(`Tap like this! Where is ${w.ar}?`); await showHand(right,true); right.classList.add("right"); good(); pop(right); await wait(900); hideHand(); round(); return; }
      await ask(); idle();
    })();
  };
  round();
}; }

/* Hear a sentence, tap the right one (6–8) */
function sentStep(list, n){ return ()=>{
  const items=shuffle(list).slice(0,n); let i=0;
  const round=()=>{ if(i>=items.length) return next();
    const s=items[i], other=rand(list.filter(x=>x.ar!==s.ar)), opts=shuffle([s,other]);
    view.innerHTML=`<div class="card kid">${dots(i,items.length)}<h2>Listen. Which one did Nuri say?</h2>
      <div style="text-align:center"><button class="btn gold" id="pl" style="font-size:20px">🔊 Listen</button></div>
      <div class="kopts">${opts.map((o,j)=>`<button class="kopt txt" data-j="${j}">${o.ar}</button>`).join("")}</div></div>`;
    const right=view.querySelector(`.kopt[data-j="${opts.indexOf(s)}"]`); window.__q={ans:opts.indexOf(s)};
    let wrongs=0, done=false;
    $("#pl").onclick=()=>sayAr(s.ar);
    view.querySelectorAll(".kopt").forEach(b=>b.onclick=async()=>{ if(done) return;
      if(b===right){ done=true; b.classList.add("right"); good(); pop(b); rounds++; if(!wrongs) firstTry++;
        b.insertAdjacentHTML("beforeend", `<small style="display:block;font:600 14px Manrope;direction:ltr;margin-top:6px">${TX(s.en)}</small>`);
        await speak(rand(K_PRAISE)); await wait(1200); i++; round(); }
      else { wrongs++; soft(); b.classList.add("shake"); setTimeout(()=>b.classList.remove("shake"),400); right.classList.add("glow"); sayAr(s.ar); }
    });
    setTimeout(()=>sayAr(s.ar), 300);
  };
  round();
}; }

/* 9–13: short rule cards */
function rulesStep(rules){ return ()=>{
  let i=0;
  const show=()=>{ if(i>=rules.length) return next();
    const R=rules[i], ex=(R.ex||[]).slice(0,3), kn=(KIDNOTES[LESSON.adultLesson]||[])[i];
    view.innerHTML=`<div class="card kid">${dots(i,rules.length)}${ruleHead(R)}
      <p style="font-size:17px;line-height:1.7">${arWrapK(kn || R.note)}</p>
      <div class="wlist">${ex.map((e,k)=>`<div class="wcard" data-k="${k}"><div class="ar">${e[0]}</div><small>${TX(e[1])}</small></div>`).join("")}</div>
      <div class="row end" style="margin-top:16px"><button class="btn pulse" id="nx">Next →</button></div></div>`;
    window.__q={learn:true};
    view.querySelectorAll(".wcard").forEach(c=>c.onclick=()=>sayAr(ex[+c.dataset.k][0]));
    const my=++K_RTOK;
    $("#nx").onclick=()=>{ K_RTOK++; stopVoice(); i++; show(); };
    // Nuri reads the card by herself: the Arabic, then the explanation, then each example (the card lights up)
    (async()=>{ await wait(300); const heads=String(R.ar).split(/\s*[·≠→←|]\s*/).filter(x=>/[؀-ۿ]/.test(x));
      for(const h of heads){ if(my!==K_RTOK) return; await sayAr(h); await wait(250); }
      if(my!==K_RTOK) return; await sayEn(kn || R.say || strip(R.note));
      const cards=[...view.querySelectorAll(".wcard")];
      for(let k=0;k<cards.length;k++){ if(my!==K_RTOK) return; await wait(400); if(my!==K_RTOK) return; cards[k].classList.add("say"); await sayAr(ex[k][0]); cards[k].classList.remove("say"); }
    })();
  };
  show();
}; }
let K_RTOK=0;
/* rule title: "هٰذَا · ذٰلِكَ" with "this · that": each meaning sits under its own Arabic word (Arabic reads right to left) */
function ruleHead(R){
  const seps=String(R.ar).match(/[·≠→←|]/g)||[], A=String(R.ar).split(/\s*[·≠→←|]\s*/), E=String(TX(R.en||"")).split(/\s*·\s*/);
  if(A.length>1 && A.length===E.length){
    return `<div class="kpair">${A.map((a,k)=>`${k?`<span class="sep">${seps[k-1]}</span>`:""}<div><div class="ar">${a}</div><small>${E[k]}</small></div>`).join("")}</div>`;
  }
  return `<h2 class="ar" style="direction:rtl">${R.ar}</h2><p class="lead">${R.en}</p>`;
}
const arWrapK = h => String(h||"").replace(/([؀-ۿ][؀-ۿً-ْٰ\s،.؟/]*[؀-ۿً-ْٰ])/g,'<bdi class="ar" style="font-size:1.15em">$1</bdi>');

/* 9–13: word list */
function wordsStep(list){ return ()=>{
  view.innerHTML=`<div class="card kid"><h2>New words</h2><p class="lead">Tap each word to hear it.</p>
    <div class="wlist">${list.map((w,k)=>`<div class="wcard" data-k="${k}">${w.pic&&!w.np?`<div style="font-size:38px">${picHTML(w.pic,w.en)}</div>`:""}<div class="ar">${w.ar}</div><small>${meanT(w.en)}</small></div>`).join("")}</div>
    <div class="row end" style="margin-top:16px"><button class="btn pulse" id="nx">Next →</button></div></div>`;
  window.__q={learn:true};
  view.querySelectorAll(".wcard").forEach(c=>c.onclick=()=>sayAr(list[+c.dataset.k].ar));
  $("#nx").onclick=()=>{ stopVoice(); next(); };
  setTimeout(()=>sayEn("Tap each word to hear it, and say it after Nuri."), 300);
}; }

/* 9–13: questions (practice and quiz) */
function makeQs(n){
  const qs=[];
  const mw=K_ALLW.filter(x=>x.en);
  shuffle(mw).slice(0, Math.min(4, mw.length)).forEach(x=>qs.push({show:x.ar, say:x.ar, q:"What does it mean?", kind:"en", ans:x.en, pool:mw.map(y=>y.en)}));
  shuffle(K_POOLQ).slice(0, n).forEach(q=>qs.push(q));
  return shuffle(qs).slice(0, n);
}
function quizStep(n, isQuiz){ return ()=>{
  const qs=makeQs(n); if(!qs.length) return next();
  let i=0, right=0;
  const q=()=>{ if(i>=qs.length) return isQuiz ? result() : next();
    const Q=qs[i], opts=optsFor(Q,3);
    view.innerHTML=`<div class="card kid">${dots(i,qs.length)}<h2>${isQuiz?"Quiz":"Practice"}</h2>
      ${Q.pic?`<div style="font-size:72px;text-align:center">${picHTML(Q.pic,Q.picEn||"")}</div>`:""}${Q.show?`<div class="bigar" id="sh" style="font-size:34px;cursor:pointer">${Q.show}</div>`:""}
      <p class="lead">${arWrapK(TX(strip(Q.q||"")))}</p>
      <div class="kopts">${opts.map((o,j)=>`<button class="kopt ${Q.kind==="en"?"mean":"txt"}" data-j="${j}">${Q.kind==="en"?meanT(o):o}</button>`).join("")}</div>
      <div class="fb" id="fb"></div></div>`;
    window.__q={ans:opts.indexOf(Q.ans)};
    const sh=$("#sh"); if(sh) sh.onclick=()=>sayAr(Q.say||Q.show); if(Q.say) setTimeout(()=>sayAr(Q.say),300);
    let tried=false;
    view.querySelectorAll(".kopt").forEach(b=>b.onclick=async()=>{
      const ok=opts[+b.dataset.j]===Q.ans;
      if(ok){ if(!tried) right++; b.classList.add("right"); good(); pop(b); await speak(rand(K_PRAISE)); await wait(300); i++; q(); }
      else { soft(); b.classList.add("shake"); setTimeout(()=>b.classList.remove("shake"),400);
        if(isQuiz){ tried=true; const r=view.querySelector(`.kopt[data-j="${opts.indexOf(Q.ans)}"]`); r.classList.add("glow"); setTimeout(()=>{ i++; q(); }, 1400); view.querySelectorAll(".kopt").forEach(x=>x.onclick=null); }
        else tried=true; }
    });
  };
  const result=()=>{ const pct=Math.round(right/qs.length*100), pass=pct>=70;
    view.innerHTML=`<div class="card kid result"><div class="nuri">${pass?"🎉":"🦉"}</div><div class="score ${pass?"pass":"fail"}">${pct}%</div>
      <h2>${pass?"Well done!":"Let's try again"}</h2><p class="lead">${right} of ${qs.length} right${pass?"":" · you need 70%"}</p>
      <div class="row" style="justify-content:center">${pass?`<button class="btn pulse" id="bk">✓ Finish</button>`:`<button class="btn pulse" id="rt">Try again</button>`}</div></div>`;
    window.__q={result:pass};
    if(pass){ tone([523,659,784,1047],.12); speak("مَا شَاءَ اللهُ"); finishLesson(right, qs.length, {...LESSON, percent:pct, band:K_BAND});
      $("#bk").onclick=()=>{ try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} }; }
    else { soft(); $("#rt").onclick=()=>quizStep(n,true)(); sayEn("Good try! Let's try again."); }
  };
  q();
}; }

/* the end for 3–5 and 6–8: stars, never a fail */
function doneStep(){ return ()=>{
  const n = Math.max(rounds,1), s = firstTry>=n*0.8 ? 3 : firstTry>=n*0.5 ? 2 : 1;
  view.innerHTML=`<div class="card kid result"><div class="nuri">🎉</div><div class="stars">${"⭐".repeat(s)}${"☆".repeat(3-s)}</div>
    <h2>Masha'Allah! You did it!</h2>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn sec" id="ag">↻ Play again</button><button class="btn pulse" id="bk">✓ Finish</button></div></div>`;
  window.__q={result:true};
  tone([523,659,784,1047],.12); sayEn("مَا شَاءَ اللهُ. You did it! Well done.");
  finishLesson(firstTry, n, {...LESSON, percent:Math.round(firstTry/n*100), stars:s, band:K_BAND});
  $("#ag").onclick=()=>hello();
  $("#bk").onclick=()=>{ try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
}; }

/* ---------- the three plans ---------- */
function planSmall(){
  if (LESSON.final || K_PICW.length<2) return [];
  const list = K_PICW.slice(0, 4);
  return [learnStep(list), tapStep(list, 6, 2, true), doneStep()];
}
function planMid(){
  const P=[];
  if (!LESSON.final){
    const list = (K_PICW.length>=3 ? K_PICW : WORDS).slice(0, 6);
    if (list.length>=2){ P.push(learnStep(list)); P.push(tapStep(list, 8, Math.min(3,list.length), true)); }
    if (K_SENT.length>=2) P.push(sentStep(K_SENT, 3));
  } else if (K_POOLQ.length) P.push(quizStep(8,false));
  if (P.length) P.push(doneStep());
  return P;
}
function planBig(){
  const P=[];
  if (!LESSON.final){
    const rules=(typeof RULES!=="undefined"?RULES:[]).slice(0,3);
    if (rules.length) P.push(rulesStep(rules));
    if (WORDS.length) P.push(wordsStep(WORDS.slice(0,12)));
    P.push(quizStep(6,false));
    P.push(quizStep(8,true));
  } else P.push(quizStep(12,true));
  return P;
}

/* ---------- start ---------- */
if (window.parent !== window) document.body.classList.add("embedded");
$("#lsub").textContent = `Kids · ${LESSON.level.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} · ${LESSON.final?"Final":"Lesson "+LESSON.lesson}`;
$("#closeBtn").onclick = () => { stopVoice(); try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
view.innerHTML = `<div class="card kid"><div class="nuri">🦉</div></div>`;
bridgeReady.then(()=>{
  const q = new URLSearchParams(location.search).get("band");
  K_BAND = (q && K_BANDS[q]) ? q : ageBand(window.__age) || store.get();
  if (!K_BANDS[K_BAND]) K_BAND = null;
  hello();
});
