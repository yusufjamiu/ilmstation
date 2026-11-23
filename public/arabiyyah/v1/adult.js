/* Arabiyyah lesson engine (adult) — shared by every lesson. Built by build.py; do not edit by hand. */
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



/* =========================================== ARABIYYAH ENGINE ===========================================
   Each lesson file sets: LESSON, PASS, GOAL, STEPS_DEF (the lesson's steps, in order) and its data (WORDS, RULES…).
   Step types:  watch · rules · words · repeat · choose · listen · build · spell · exam
   choose/listen items: {show (Arabic shown), say (Arabic spoken), pic, q (English question), ans, opts | pool}
     opts  = the exact options;  pool = candidates, the engine picks 3 wrong ones from it.
   build items: {ar, en}   — tap the words in the right order
   spell items: {ar, en, pic} — tap the letters of the word in order */
const $=s=>document.querySelector(s), view=$("#view");
const rand=a=>a[Math.floor(Math.random()*a.length)], shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
let stepNow=0, maxStep=0, timer=null, missed=new Set();
let ac; function tone(f,d=.1,vol=.12){ if(muted)return; try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)();
  f.forEach((fr,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=fr;const t=ac.currentTime+i*d;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d*1.8);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d*2);});}catch(e){} }
const good=()=>tone([587,880]), bad=()=>tone([196,165],.14,.07);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Praise: shown in English letters, spoken in Arabic
const PRAISE=[{ar:"مَا شَاءَ اللهُ",en:"Masha'Allah!"},{ar:"بَارَكَ اللهُ فِيكُمْ",en:"Barakallahu feekum!"},{ar:"مُمْتَازٌ",en:"Mumtaz! Excellent!"}];
let lastSay=Promise.resolve();
const afterPraise=(fn,ms=1100)=>Promise.all([lastSay,wait(ms)]).then(fn);
function praise(fb){ const p=rand(PRAISE); lastSay=Promise.resolve(speak(p.ar)); if(fb){ fb.className="fb ok"; fb.textContent=p.en; } }
function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),1700); }
$("#sound").onclick=e=>{ muted=!muted; e.currentTarget.textContent=muted?"🔇":"🔊"; if(muted) stopVoice(); };
// what the voice reads: no question marks (the server reads Arabic letters and harakat only)
const sayAr = t => speak(String(t).replace(/[^\u0600-\u06FF\s،.]/g," ").replace(/؟/g," ").replace(/\s+/g," ").trim());

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
const plain = s => String(s).replace(/[ً-ْٰ]/g,"");

/* ---- steps ---- */
const TYPES = { match:Match, watch:Watch, rules:Rules, words:Words, repeat:Repeat, choose:Choose, listen:Choose, build:Build, spell:Spell, exam:Exam };
const VIS = STEPS_DEF.filter(s=>!s.hidden);   // hidden steps are question pools for an exam
const STEPS = VIS.map(s=>s.name);
const L = { next:"Next", start:"Start lesson", cont:"Continue where you stopped", restart:"Start again",
  play:"Play", listen:"Listen", me:"My voice", tap:"Tap the mic and read it aloud", listening:"Listening… tap again to stop", heardL:"We heard:",
  wrong:"Not quite. Listen again and repeat.", selfQ:"We couldn't check automatically. Compare your voice with the teacher's:", selfOk:"I read it correctly", again:"Try again",
  noMic:"Microphone not available. Read it aloud, then continue.", passed:"Passed. Lesson complete", failed:"Not yet. Review and try again",
  backList:"Back to lessons", retry:"Retake exam", review:"Review the lesson", startExam:"Start the exam", check:"Check", ansIs:"answer:" };

async function Intro(){
  await bridgeReady;
  prefetchVoices([...introScenes().flatMap(x=>mixPrefetch(x.say)), ...RULES.flatMap(r=>mixPrefetch(r.say||"")), ...WORDS.map(w=>[plainSay(w.ar)]), ...PRAISE.map(x=>[x.ar])]);
  const resume = savedState && savedState.step>0 && savedState.step<STEPS.length;
  view.innerHTML=`<div class="card intro fade" style="margin-top:22px"><div class="ar" style="font-size:28px;color:var(--em)">${LESSON.ar}</div>
    <h1 style="margin-top:6px">${LESSON.title}</h1><p class="lead" style="margin:0">${LESSON.sub}</p>
    <div class="bookTag">📗 ${LESSON.book} · ${LESSON.pages}</div>
    <div class="wordStrip">${WORDS.slice(0,12).map(w=>picHTML(w.pic,w.en)).join("")}</div>
    <p class="lead">${STEPS.map((s,i)=>`${i+1}. ${s}`).join(" &nbsp;·&nbsp; ")}</p>
    <div class="row" style="justify-content:center">${resume?`<button class="btn sec" id="rs">${L.restart}</button><button class="btn pulse" id="ct">${L.cont}</button>`:`<button class="btn pulse" id="st">${L.start}</button>`}</div></div>`;
  const st=$("#st"); if(st) st.onclick=()=>Lesson(0);
  const ct=$("#ct"); if(ct) ct.onclick=()=>{ maxStep=savedState.step; Lesson(savedState.step); };
  const rs=$("#rs"); if(rs) rs.onclick=()=>Lesson(0);
}
const plainSay = t => String(t).replace(/[؟?!]/g,"").trim();
function Lesson(i){
  clearInterval(timer); stopVoice(); stepNow=i; maxStep=Math.max(maxStep,i); scrollTo(0,0);
  saveState({step:i});
  const def=VIS[i];
  view.innerHTML=`<div class="fade"><div class="steps">${STEPS.map((s,k)=>`<button class="${k<i?'done':k===i?'on':''}" data-k="${k}" title="${s}"></button>`).join("")}</div>
    <div class="stepLabel"><span>Step ${i+1} of ${STEPS.length} · ${def.name}</span></div><div id="stage"></div></div>`;
  view.querySelectorAll(".steps button").forEach(b=>b.onclick=()=>{ const k=+b.dataset.k; if(k<=maxStep) Lesson(k); });
  const talk = def.say || (["watch","rules","exam"].includes(def.type) ? "" : spokenEn(def.sub||""));
  stepIntro = talk ? Promise.resolve(speakMix(talk)).then(()=>wait(250)) : Promise.resolve();
  TYPES[def.type]($("#stage"), def);
}
const nextBtn=(label=L.next)=>`<div class="row end" style="margin-top:18px"><button class="btn pulse" id="nx">${label} →</button></div>`;
function bindNext(){ $("#nx").onclick=()=>Lesson(stepNow+1); }
/* English instructions, made safe to speak: Arabic words become their transliteration */
const SPOKEN = {"هٰذَا":"haadhaa","هٰذِهِ":"haadhihi","ذٰلِكَ":"dhaalika","تِلْكَ":"tilka","مَا":"maa","مَنْ":"man","نَعَمْ":"na'am","لَا":"laa","الْ":"al","ة":"taa marbuutah",
  "فِي":"fee","عَلَى":"'alaa","مِنْ":"min","مِنَ":"mina","إِلَى":"ilaa","هُوَ":"huwa","هِيَ":"hiya","يَا":"yaa","لِ":"li","تَحْتَ":"tahta","أَ":"a","وَ":"wa","ل":"laam"};
function spokenEn(t){
  let s = String(t).replace(/<[^>]+>/g," ")
    // endings and vowel names: said by the Arabic voice
    .replace(/\(?-ati\b\)?/g," تِ ").replace(/\(?-aani\b\)?/g," آنِ ").replace(/\(?-at\b\)?/g," تَاءْ ").replace(/\(?-un\b\)?/g," أُنْ ").replace(/\(?-an\b\)?/g," أَنْ ")
    .replace(/\(?-i\b\)?/g," كَسْرَةْ ").replace(/\bkasra\b/g,"كَسْرَةْ").replace(/\bdamma\b/g,"ضَمَّةْ").replace(/\bfatha\b/g,"فَتْحَةْ").replace(/\bsukun\b/g,"سُكُونْ").replace(/\bshadda\b/g,"شَدَّةْ")
    .replace(/(^|[^\u0600-\u06FF\u064B-\u0652])ة(?=$|[^\u0600-\u06FF\u064B-\u0652])/g,"$1 تَاءْ مَرْبُوطَةْ ").replace(/(^|[^\u0600-\u06FF\u064B-\u0652])ت(?=$|[^\u0600-\u06FF\u064B-\u0652])/g,"$1 تَاءْ ").replace(/\s*→\s*/g,": use ").replace(/\+/g," plus ").replace(/[·≠←]/g,", ").replace(/[“”"…]/g,"")
    .normalize("NFC").replace(/[ʿʾ]/g,"'");
  return s.replace(/[^A-Za-z0-9\s.,!?':;()\-\u0600-\u06FF\u064B-\u0652\u0670]/g," ").replace(/\s+([.,!?])/g,"$1").replace(/\(\s*\)/g,"").replace(/\s+/g," ").trim();
}
let stepIntro = Promise.resolve();
const firstSay = (st, fn) => stepIntro.then(()=>{ if(st.isConnected) fn(); });
const head = def => `<h2>${arWrap(def.title||def.name)}</h2>${def.sub?`<p class="lead">${arWrap(def.sub)}</p>`:""}`;

/* ---- WATCH: a short narrated intro with captions ---- */
function introScenes(){
  const sc=[];
  if (LESSON.final) return [{show:"today", say:GOAL}, {show:"go", say:"Take your time and read each question carefully. بِسْمِ اللهِ. Good luck."}];
  if (LESSON.level==="beginner-1" && LESSON.lesson===1) sc.push(
    {show:"logo", say:"السَّلَامُ عَلَيْكُمْ. Welcome to the Arabic class. In this course you will learn to understand, read and speak Arabic, the language of the Qur'an, step by step."},
    {show:"book", say:"We follow the famous book, Lessons in Arabic Language, by Dr. V. عَبْدِ الرَّحِيمْ, taught at the Islamic University of Madinah."},
    {show:"parts", say:"The course has four levels. Beginner 1 is Book 1. Beginner 2 is the first half of Book 2. Beginner 3 is the second half of Book 2. Beginner 4 is Book 3. Each level ends with a final exam and a certificate."});
  const LEVEL_INFO = {"beginner-2":["Beginner 2","the first half of Book 2, lessons 1 to 15"], "beginner-3":["Beginner 3","the second half of Book 2, lessons 16 to 31"], "beginner-4":["Beginner 4","Book 3"]};
  if (LESSON.lesson===1 && LEVEL_INFO[LESSON.level]) { const [nm,what]=LEVEL_INFO[LESSON.level];
    sc.push({show:"parts", say:`السَّلَامُ عَلَيْكُمْ. Welcome to ${nm}. In this level you will study ${what}. It ends with a final exam and a certificate. مَا شَاءَ اللهُ, you have come far. Keep going.`}); }
  sc.push({show:"today", say:GOAL},
    {show:"steps", say:`In each lesson you learn the new rule and the new words, you read sentences aloud and the app checks you, you practise with short exercises, and you finish with an exam. You need ${Math.round(PASS*100)} percent to pass, and you can retake it as many times as you like.`},
    {show:"go", say:"Listen carefully and repeat everything aloud. بِسْمِ اللهِ. Let's begin."});
  return sc;
}
function Watch(st){
  const scenes=introScenes(); let k=0, paused=false, token=0;
  st.innerHTML=`<div class="card vid"><div class="vstage" id="vs"></div><div class="vcap" id="cap"></div>
    <div class="vbar"><button id="pp" aria-label="Pause">⏸</button><div class="vdots" id="vd">${scenes.map(()=>"<i></i>").join("")}</div>
    <button id="rp" aria-label="Replay">↺</button><button id="sk" aria-label="Skip">⏭</button></div></div><div id="nxw"></div>`;
  const vs=$("#vs"), cap=$("#cap"), pp=$("#pp"), alive=my=>my===token && st.isConnected;
  const parts=[["Beginner 1","Book 1","الجزء الأول"],["Beginner 2","Book 2, lessons 1 to 15","الجزء الثاني"],["Beginner 3","Book 2, lessons 16 to 31","الجزء الثاني"],["Beginner 4","Book 3","الجزء الثالث"]];
  function visual(sh){
    if(sh==="logo") return `<div class="vlogo">ع</div><h2 style="margin:0">Arabiyyah</h2><div class="ar" style="font-size:26px">اللُّغَةُ الْعَرَبِيَّةُ</div>`;
    if(sh==="book") return `<div style="font-size:64px">📗</div><div class="ar" style="font-size:30px">دُرُوسُ اللُّغَةِ الْعَرَبِيَّةِ</div><div class="lead" style="margin:0">Dr. V. Abdur-Raheem · Islamic University of Madinah</div>`;
    if(sh==="parts") return `<div class="vparts">${parts.map((x,i)=>`<div style="animation-delay:${i*.9}s"><b>${x[0]}</b> · ${x[1]} <span class="ar">${x[2]}</span></div>`).join("")}</div>`;
    if(sh==="today") return `<div class="ar" style="font-size:24px;color:var(--em)">${LESSON.ar}</div><h2 style="margin:0">${LESSON.title}</h2><div class="lead" style="margin:0">${LESSON.sub}</div>
      <div class="wordStrip pop">${WORDS.slice(0,10).map((w,i)=>`<span style="animation-delay:${i*.12}s">${picHTML(w.pic,w.en)}</span>`).join("")}</div>`;
    if(sh==="steps") return `<div class="vsteps">${STEPS.slice(1).map((x,i)=>`<span style="animation-delay:${i*.3}s">${i+1}. ${x}</span>`).join("")}</div>`;
    return `<div style="font-size:54px">📖</div><div class="ar" style="font-size:34px;color:var(--em)">بِسْمِ اللهِ</div>`;
  }
  function dots(){ st.querySelectorAll("#vd i").forEach((d,i)=>{ d.className=i<k?"done":i===k?"on":""; d.onclick=()=>jump(i); }); }
  function jump(i){ k=Math.max(0,Math.min(scenes.length-1,i)); paused=false; pp.textContent="⏸"; play(); }
  async function play(){ const my=++token; stopVoice();
    while(k<scenes.length){ dots(); const sc=scenes[k]; vs.innerHTML=visual(sc.show); cap.textContent=sc.say;
      await Promise.all([speakMix(sc.say), wait(1500)]); if(!alive(my)) return; await wait(500); if(!alive(my)) return; k++; }
    dots(); done(); }
  function done(){ if(!$("#nx")){ $("#nxw").innerHTML=nextBtn("Start the lesson"); bindNext(); } }
  pp.onclick=()=>{ if(paused){ paused=false; pp.textContent="⏸"; play(); } else { paused=true; token++; stopVoice(); pp.textContent="▶"; } };
  $("#rp").onclick=()=>jump(k);
  $("#sk").onclick=()=>{ if(k>=scenes.length-1){ token++; stopVoice(); k=scenes.length; dots(); done(); } else jump(k+1); };
  play(); done();
}

/* ---- RULES: one card per rule, with examples to hear ---- */
/** "مَا ≠ مَنْ" + "maa · man" + "what · who" → columns, so each meaning sits under its own Arabic word */
const arSize = a => { const n=String(a).replace(/[\u064B-\u0652\u0670]/g,"").length; return n>16?" long":n>9?" mid":""; };
function ruleHead(R){
  const sp = x => String(x).split(/\s+[·≠←]\s+/);
  const A=sp(R.ar), T=sp(R.tr), E=sp(R.en), sep=/≠/.test(R.ar)?"≠":/←/.test(R.ar)?"←":"·";
  if (A.length<2 || T.length!==A.length) return `<div class="ruleAr ar${arSize(R.ar)}">${arWrap(R.ar,true)}</div><div class="tr">${R.tr}</div><div class="ruleEn">${R.en}</div>`;
  const eCols = E.length===A.length;
  return `<div class="rhead${A.some(a=>arSize(a))?" stack":""}">${A.map((a,i)=>`${i&&A.length===2?`<div class="rsep">${sep==="←"&&A.some(a=>arSize(a))?"↓":sep}</div>`:""}<div class="rcol"><div class="ruleAr ar${arSize(a)}">${a}</div><div class="tr">${T[i]}</div>${eCols?`<div class="ruleEn">${E[i]}</div>`:""}</div>`).join("")}</div>${eCols?"":`<div class="ruleEn">${R.en}</div>`}`;
}
/** keep Arabic inside English text together and in the right order */
function arWrap(html, whole){
  if (whole) return html;
  return String(html).replace(/[\u0600-\u06FF][\u0600-\u06FF\u064B-\u0652\u0670\s←،؟.…]*[\u0600-\u06FF\u064B-\u0652\u0670؟]|[\u0600-\u06FF][\u064B-\u0652\u0670]*/g,
    m => `<bdi class="arIn${m.length>28?" lw":""}">${m}</bdi>`);
}
function Rules(st, def){
  let r=0;
  function draw(){
    const R=RULES[r], last=r===RULES.length-1;
    st.innerHTML=`${head(def)}<div class="card rule fade"><span class="counter">${r+1} / ${RULES.length}</span>
      ${ruleHead(R)}
      <p class="ruleNote">${arWrap(R.note)}</p>${R.cmp?`<div class="cmp">${R.cmp.map(c=>`<div><b class="ar${c.ar.length>16?" sm":""}">${c.ar}</b>${c.en}<br><span>${c.pics}</span></div>`).join("")}</div>`:""}
      <div class="exs${R.read?" read":""}">${R.ex.map(([ar,en,pic],j)=>`<button class="ex" data-j="${j}">${pic?picHTML(pic,en):""}<span class="ar">${ar}</span><small>${en}</small><i>🔊</i></button>`).join("")}</div></div>
      <div class="row end" style="margin-top:16px">${r?`<button class="btn sec" id="pv">← Back</button>`:""}<button class="btn pulse" id="nr">${last?L.next+" →":"Next rule →"}</button></div>`;
    const play=async()=>{ for(const [ar] of R.ex){ if(!st.isConnected||R!==RULES[r]) return; await sayAr(ar); await wait(350); } };
    st.querySelectorAll(".ex").forEach(b=>b.onclick=()=>{ st.querySelectorAll(".ex").forEach(x=>x.classList.remove("on")); b.classList.add("on"); sayAr(R.ex[+b.dataset.j][0]); });
    (async()=>{ await speakMix(R.say||spokenEn(R.note)); if(st.isConnected && RULES[r]===R) play(); })();
    $("#nr").onclick=()=>{ if(last) Lesson(stepNow+1); else { r++; draw(); } };
    const pv=$("#pv"); if(pv) pv.onclick=()=>{ r--; draw(); };
  }
  draw();
}

/* ---- WORDS: tap every word (hear it, see its meaning) before going on ---- */
function Words(st, def){
  const list=def.words ? def.words.map(W) : WORDS, seen=new Set(); let auto=0;
  st.innerHTML=`${head(def)}<div class="wgrid">${list.map((w,i)=>`<button class="wcard" data-i="${i}">${picHTML(w.pic,w.en)}<span class="ar">${w.ar}</span><span class="wtr">${w.tr}</span><span class="wen">${mean(w.en)}</span></button>`).join("")}</div>
    <div class="row end" style="margin-top:16px"><button class="btn sec" id="ra">▶ Read all</button><span class="counter" id="wc">0 / ${list.length} heard</span><span class="sp"></span><button class="btn" id="nx" disabled>${L.next} →</button></div>`;
  const cards=[...st.querySelectorAll(".wcard")];
  const mark=i=>{ const b=cards[i]; b.classList.add("seen"); seen.add(list[i].ar); $("#wc").textContent=`${seen.size} / ${list.length} heard`;
    if(seen.size===list.length){ const n=$("#nx"); n.disabled=false; n.classList.add("pulse"); } };
  const light=i=>{ cards.forEach(c=>c.classList.remove("on")); if(cards[i]) { cards[i].classList.add("on"); cards[i].scrollIntoView({block:"nearest",behavior:"smooth"}); } };
  async function readAll(){ const my=++auto;
    for(let i=0;i<list.length;i++){ if(my!==auto || !st.isConnected) return; light(i); await Promise.all([sayAr(list[i].ar), wait(900)]); if(my!==auto) return; mark(i); await wait(250); }
    light(-1); }
  cards.forEach((b,i)=>b.onclick=()=>{ auto++; light(i); setTimeout(()=>b.classList.remove("on"),700); sayAr(list[i].ar); mark(i); });
  $("#ra").onclick=()=>{ stopVoice(); readAll(); };
  $("#nx").onclick=()=>{ auto++; Lesson(stepNow+1); };
  firstSay(st, readAll);
}

/* ---- MATCH: pair pictures with Arabic words, or Arabic with meanings (rounds of 4) ---- */
function Match(st, def){
  const all=(def.words||WORDS.map(w=>w.ar)).map(W), rounds=[]; const sh=shuffle(all);
  for(let i=0;i<sh.length;i+=4) rounds.push(sh.slice(i,i+4));
  if(rounds.length>1 && rounds[rounds.length-1].length<3) rounds[rounds.length-2].push(...rounds.pop());
  let r=0, mistakes=0;
  const left = w => def.mode==="pic" ? {html:picHTML(w.pic,w.en), cls:"picm"} : {html:w.ar, cls:"ar"};
  const right = w => def.mode==="pic" ? {html:w.ar, cls:"ar"} : {html:mean(w.en), cls:""};
  function draw(){ if(!st.isConnected) return;
    if(r>=rounds.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">🔗</div><h2>All pairs matched</h2><p class="lead">${mistakes?mistakes+" wrong tap"+(mistakes>1?"s":"")+" along the way":"No mistakes. Masha'Allah!"}</p></div>${nextBtn()}`; bindNext(); return; }
    const set=rounds[r], A=shuffle([...set]), B=shuffle([...set]); let sel=null, left_=0; window.__q={A:A.map(w=>w.ar),B:B.map(w=>w.ar)};
    st.innerHTML=`${head(def)}<div class="card"><span class="counter">Round ${r+1} / ${rounds.length}</span>
      <div class="mgrid"><div class="mcol">${A.map((w,i)=>{const x=left(w); return `<button class="mi2 ${x.cls}" data-s="a" data-i="${i}">${x.html}</button>`;}).join("")}</div>
      <div class="mcol">${B.map((w,i)=>{const x=right(w); return `<button class="mi2 ${x.cls}" data-s="b" data-i="${i}">${x.html}</button>`;}).join("")}</div></div><div class="fb" id="fb"></div></div>`;
    const fb=$("#fb");
    st.querySelectorAll(".mi2").forEach(b=>b.onclick=()=>{
      if(b.classList.contains("ok")) return;
      const w=(b.dataset.s==="a"?A:B)[+b.dataset.i];
      if(def.mode==="meaning" ? b.dataset.s==="a" : b.dataset.s==="b") sayAr(w.ar);
      if(!sel || sel.dataset.s===b.dataset.s){ st.querySelectorAll(".mi2.sel").forEach(x=>x.classList.remove("sel")); b.classList.add("sel"); sel=b; return; }
      const w0=(sel.dataset.s==="a"?A:B)[+sel.dataset.i];
      if(w0===w){ [sel,b].forEach(x=>{ x.classList.remove("sel"); x.classList.add("ok"); }); good(); sel=null; left_++;
        if(def.mode==="pic") sayAr(w.ar);
        if(left_===set.length){ praise(fb); afterPraise(()=>{ r++; draw(); }, 1200); } }
      else { mistakes++; bad(); missed.add(w0.ar); [sel,b].forEach(x=>{ x.classList.remove("sel"); x.classList.add("no"); setTimeout(()=>x.classList.remove("no"),400); }); sel=null; }
    });
  }

  draw();
}

/* ---- READ & REPEAT: read a sentence aloud, the app checks it ---- */
const normWords = s => (s||"").replace(/[ً-ْٰـ]/g,"").replace(/[أإآٱ]/g,"ا").replace(/[ءؤئ]/g,"").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[^ء-ي\s]/g," ").split(/\s+/).filter(Boolean);
function heardSentence(text, target){
  const h=normWords(text), t=normWords(target); if(!h.length) return false;
  const hit=t.filter(w=>h.some(x=>x===w || (w.length>2 && lev(x,w)<=1))).length;
  return hit/t.length >= .75;
}
function Repeat(st, def){
  const list=def.items; let i=0, ok=0;
  function draw(){ if(!st.isConnected) return;
    if(i>=list.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">🎙️</div><h2>${ok} / ${list.length} read correctly</h2></div>${nextBtn()}`; bindNext(); return; }
    const [ar,en,pic]=list[i]; let tries=0, myUrl=null, busy=false;
    st.innerHTML=`${head(def)}<div class="card" style="text-align:center"><span class="counter">${i+1} / ${list.length}</span>
        ${pic?`<div class="qpic">${picHTML(pic,en)}</div>`:""}<div class="sent ar">${ar}</div><div class="wen" style="font-size:16px">${en}</div>
        <div class="row" style="justify-content:center;margin:10px 0"><button class="btn sec" id="ls">🔊 ${L.listen}</button><button class="btn sec" id="mine" style="display:none">▶ ${L.me}</button></div>
        <button class="micBtn" id="mic">🎤</button><div class="fb" id="fb">${L.tap}</div><div class="heard" id="hd"></div><div id="act"></div></div>`;
    const fb=$("#fb"), hd=$("#hd"), mic=$("#mic"), mine=$("#mine"), act=$("#act");
    $("#ls").onclick=()=>sayAr(ar); firstSay(st, ()=>{ if($("#ls")) sayAr(ar); });
    mine.onclick=()=>{ if(myUrl){ stopVoice(); player=new Audio(myUrl); player.play(); } };
    mic.onclick=async()=>{
      if(busy){ stopRecord(); return; }
      busy=true; stopVoice(); act.innerHTML=""; hd.textContent=""; mic.classList.add("rec"); mic.textContent="⏹"; fb.className="fb"; fb.textContent=L.listening;
      const r=await record({ms:Math.min(6000, 2200+plain(ar).length*120), check:true, hint:plain(ar)}); busy=false; mic.classList.remove("rec"); mic.textContent="🎤";
      if(r.url){ myUrl=r.url; mine.style.display=""; }
      if(r.error){ fb.textContent = r.error==="mic" ? L.noMic : L.selfQ; return self(); }
      hd.textContent = r.text ? `${L.heardL} ${r.text}` : "";
      if(heardSentence(r.text, ar)){ ok++; good(); praise(fb); afterPraise(()=>{ i++; draw(); }); return; }
      tries++; bad(); fb.className="fb no"; fb.textContent=L.wrong; sayAr(ar);
      if(tries>=3) self();
    };
    function self(){ if(myUrl){ player=new Audio(myUrl); player.play(); player.onended=()=>sayAr(ar); }
      act.innerHTML=`<div class="row" style="justify-content:center;margin-top:10px"><button class="btn sec" id="ag">${L.again}</button><button class="btn" id="ys">${L.selfOk}</button></div>`;
      $("#ag").onclick=()=>{ act.innerHTML=""; fb.textContent=L.tap; }; $("#ys").onclick=()=>{ ok++; i++; draw(); }; }
  }
  draw();
}

/* ---- CHOOSE / LISTEN: multiple choice. A wrong answer comes back at the end, until every item is right ---- */
function optionsFor(Q){
  if(Q.opts) return shuffle([...Q.opts]);
  const wrong=shuffle([...new Set(Q.pool)].filter(x=>x!==Q.ans)).slice(0, Q.n ? Q.n-1 : 3);
  return shuffle([Q.ans, ...wrong]);
}
const optLabel = (o, kind) => kind==="pic" ? picHTML(o, (WORDS.find(w=>w.pic===o)||{}).en||"") : kind==="en" ? mean(o) : o;
function qCard(Q, opts, counter){
  const kind=Q.kind||"ar";
  return `<div class="card"><div class="examTop"><span class="counter">${counter}</span>${Q.tag?`<span class="qtype" style="margin:0">${Q.tag}</span>`:""}</div>
    <div class="qtext">${Q.q||""}</div>
    ${Q.pic?`<div class="qpic">${picHTML(Q.pic, Q.picEn||"")}</div>`:""}
    ${Q.show?`<div class="sent ar">${Q.show}${Q.say?` <button class="say" id="pl" aria-label="Play">🔊</button>`:""}</div>`:""}
    ${!Q.show && Q.say?`<div style="text-align:center;margin:14px 0"><button class="btn gold" id="pl">🔊 ${L.play}</button></div>`:""}
    <div class="opts k-${kind}">${opts.map((o,j)=>`<button class="opt ${kind==="ar"?"ar sm":kind==="pic"?"picOpt":""}" data-j="${j}">${optLabel(o,kind)}</button>`).join("")}</div>
    <div class="fb" id="fb"></div><div id="nxw"></div></div>`;
}
function Choose(st, def){
  const queue=shuffle([...def.items]).slice(0, def.max||99), total=queue.length; let done=0, firstTry=0;
  const tried=new Set();
  function draw(){ if(!st.isConnected) return;
    if(!queue.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">✅</div><h2>${firstTry} / ${total} right first time</h2><p class="lead">Every answer is now correct.</p></div>${nextBtn()}`; bindNext(); return; }
    const Q=queue[0], opts=optionsFor(Q); window.__q={ans:Q.ans,opts};
    st.innerHTML=head(def)+qCard(Q, opts, `${done+1} / ${total}`);
    const pl=$("#pl"); if(pl) pl.onclick=()=>sayAr(Q.say);
    if(Q.say) firstSay(st, ()=>{ if(queue[0]===Q) sayAr(Q.say); });
    st.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
      const o=opts[+b.dataset.j], fb=$("#fb"); st.querySelectorAll(".opt").forEach(x=>x.disabled=true);
      if(o===Q.ans){ b.classList.add("right"); good(); if(!tried.has(Q)) firstTry++; done++; queue.shift();
        if(Q.kind!=="pic" && Q.kind!=="en" && Q.speakAns!==false){ lastSay=Promise.resolve(sayAr(Q.ans)).then(()=>{ praise(fb); return lastSay; }); fb.className="fb ok"; fb.textContent="✓"; }
        else praise(fb);
        afterPraise(draw, 1300);
      } else {
        b.classList.add("wrong"); bad(); tried.add(Q); missed.add(Q.ans);
        st.querySelectorAll(".opt").forEach((x,j)=>{ if(opts[j]===Q.ans) x.classList.add("right"); });
        fb.className="fb no"; fb.innerHTML=`${Q.why?Q.why+" ":""}The answer is: <b class="${Q.kind==="ar"||!Q.kind?"ar":""}">${Q.kind==="pic"?"":Q.kind==="en"?mean(Q.ans):Q.ans}</b>`;
        if(Q.kind!=="pic" && Q.kind!=="en") sayAr(Q.ans);
        queue.push(queue.shift());   // it comes back later
        $("#nxw").innerHTML=`<div class="row end" style="margin-top:10px"><button class="btn" id="go">${L.next} →</button></div>`; $("#go").onclick=draw;
      }
    });
  }
  draw();
}

/* ---- BUILD: tap the words in order ---- */
function Build(st, def){
  const queue=shuffle([...def.items]).slice(0, def.max||99), total=queue.length; let done=0;
  function draw(){ if(!st.isConnected) return;
    if(!queue.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">🧩</div><h2>${total} sentences built</h2></div>${nextBtn()}`; bindNext(); return; }
    const S=queue[0], words=S.ar.split(" "), extra=(def.extra||[]).filter(x=>!words.includes(x)), tiles=shuffle([...words, ...shuffle(extra).slice(0,2)]);
    window.__q={tiles,ans:S.ar.split(' ')}; let picked=[];
    st.innerHTML=`${head(def)}<div class="card"><span class="counter">${done+1} / ${total}</span>
      <div class="qtext" style="text-align:center">${S.pic?`<div class="qpic">${picHTML(S.pic,S.en)}</div>`:""}${S.en}</div>
      <div class="bslot ar" id="slot"></div><div class="tiles">${tiles.map((t,j)=>`<button class="tile wt" data-j="${j}">${t}</button>`).join("")}</div>
      <div class="row end" style="margin-top:12px"><button class="btn sec" id="cl">⌫</button><span class="sp"></span><button class="btn" id="ck" disabled>${L.check}</button></div><div class="fb" id="fb"></div></div>`;
    const slot=$("#slot"), ck=$("#ck");
    const show=()=>{ slot.textContent=picked.map(j=>tiles[j]).join(" "); ck.disabled=!picked.length; };
    st.querySelectorAll(".wt").forEach(b=>b.onclick=()=>{ const j=+b.dataset.j; if(picked.includes(j)) return; picked.push(j); b.classList.add("used"); sayAr(tiles[j]); show(); });
    $("#cl").onclick=()=>{ const j=picked.pop(); if(j!=null) st.querySelector(`.wt[data-j="${j}"]`).classList.remove("used"); show(); };
    ck.onclick=()=>{ const fb=$("#fb");
      if(picked.map(j=>tiles[j]).join(" ")===S.ar){ slot.classList.add("ok"); good(); done++; queue.shift(); lastSay=Promise.resolve(sayAr(S.ar)).then(()=>{ praise(fb); return lastSay; }); afterPraise(draw,1400); }
      else { bad(); missed.add(S.ar); fb.className="fb no"; fb.innerHTML=`Not quite. The answer is: <b class="ar">${S.ar}</b>`; sayAr(S.ar); queue.push(queue.shift());
        ck.textContent=L.next+" →"; ck.onclick=draw; } };
  }
  draw();
}

/* ---- SPELL: hear a word, tap its letters in order (the book's "read and write") ---- */
const LETTER_POOL = "ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" ");
function Spell(st, def){
  const queue=shuffle([...def.items]).slice(0, def.max||99), total=queue.length; let done=0;
  function draw(){ if(!st.isConnected) return;
    if(!queue.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">✍️</div><h2>${total} words written</h2></div>${nextBtn()}`; bindNext(); return; }
    const S=queue[0], target=[...plain(S.ar).replace(/[ٌٍ]/g,"")], extra=shuffle(LETTER_POOL.filter(l=>!target.includes(l))).slice(0,3), tiles=shuffle([...target, ...extra]);
    window.__q={tiles,ans:target}; let picked=[];
    st.innerHTML=`${head(def)}<div class="card" style="text-align:center"><span class="counter">${done+1} / ${total}</span>
      <div class="qpic">${picHTML(S.pic,S.en)}</div><div class="wen" style="font-size:17px">${S.en}</div>
      <div style="margin:8px 0"><button class="btn gold" id="pl">🔊 ${L.play}</button></div>
      <div class="slot" id="slot"></div><div class="tiles">${tiles.map((t,j)=>`<button class="tile lt" data-j="${j}">${t}</button>`).join("")}</div>
      <div class="row end" style="margin-top:12px"><button class="btn sec" id="cl">⌫</button><span class="sp"></span><button class="btn" id="ck" disabled>${L.check}</button></div><div class="fb" id="fb"></div></div>`;
    const slot=$("#slot"), ck=$("#ck");
    $("#pl").onclick=()=>sayAr(S.ar); firstSay(st, ()=>{ if(queue[0]===S) sayAr(S.ar); });
    const show=()=>{ slot.textContent=picked.map(j=>tiles[j]).join(""); ck.disabled=picked.length<target.length; };
    st.querySelectorAll(".lt").forEach(b=>b.onclick=()=>{ const j=+b.dataset.j; if(picked.includes(j)||picked.length>=target.length) return; picked.push(j); b.classList.add("used"); show(); });
    $("#cl").onclick=()=>{ const j=picked.pop(); if(j!=null) st.querySelector(`.lt[data-j="${j}"]`).classList.remove("used"); show(); };
    ck.onclick=()=>{ const fb=$("#fb");
      if(picked.map(j=>tiles[j]).join("")===target.join("")){ slot.classList.add("ok"); slot.textContent=S.ar; good(); done++; queue.shift(); praise(fb); afterPraise(draw,1300); }
      else { bad(); missed.add(S.ar); fb.className="fb no"; fb.innerHTML=`Not quite. It is written: <b class="ar" style="font-size:30px">${S.ar}</b>`; sayAr(S.ar); queue.push(queue.shift());
        ck.textContent=L.next+" →"; ck.disabled=false; ck.onclick=draw; } };
  }
  draw();
}

/* ---- EXAM ---- */
function makeExam(def){
  const qs=[];
  def.from.forEach(([name, n])=>{ const s=STEPS_DEF.find(x=>x.name===name); if(!s) return;
    shuffle(s.items).slice(0,n).forEach(it=>qs.push(s.type==="build" ? {...it, build:true, tag:"Build"} : s.type==="spell" ? {...it, spell:true, tag:"Write"} : {...it, tag:s.title||s.name})); });
  return shuffle(qs);
}
function Exam(st, def){
  const n=def.from.reduce((a,[,k])=>a+k,0);
  st.innerHTML=`<div class="card result"><div style="font-size:46px">📝</div><h2>${LESSON.final?"Final exam":"Lesson "+LESSON.lesson+" exam"}</h2>
    <p class="lead">${n} questions · ${Math.round(def.minutes||8)} minutes · pass mark ${Math.round(PASS*100)}%</p><button class="btn gold pulse" id="se">${L.startExam}</button></div>`;
  $("#se").onclick=()=>run(st, def);
}
function run(st, def){
  const qs=makeExam(def), ans=[]; let i=0, left=Math.round((def.minutes||8)*60);
  const fmt=()=>`${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`;
  clearInterval(timer); timer=setInterval(()=>{ left--; const t=$("#tm"); if(t) t.textContent=fmt(); if(left<=0){ clearInterval(timer); results(); } },1000);
  function q(){ if(!st.isConnected) return; if(i>=qs.length){ clearInterval(timer); return results(); }
    const Q=qs[i], counter=`Question ${i+1} / ${qs.length} · <span id="tm">${fmt()}</span>`;
    if(Q.build || Q.spell){
      const target = Q.build ? Q.ar.split(" ") : [...plain(Q.ar).replace(/[ٌٍ]/g,"")];
      const tiles = shuffle(Q.build ? [...target] : [...target, ...shuffle(LETTER_POOL.filter(l=>!target.includes(l))).slice(0,3)]);
      window.__q={tiles,ans:target}; let picked=[];
      st.innerHTML=`<div class="card"><div class="examTop"><span class="counter">${counter}</span><span class="qtype" style="margin:0">${Q.tag}</span></div>
        <div class="qtext" style="text-align:center">${Q.pic?`<div class="qpic">${picHTML(Q.pic,Q.en)}</div>`:""}${Q.build?Q.en:`Listen, then write the word. (${Q.en})`}</div>
        ${Q.spell?`<div style="text-align:center"><button class="btn gold" id="pl">🔊 ${L.play}</button></div>`:""}
        <div class="${Q.build?"bslot ar":"slot"}" id="slot"></div><div class="tiles">${tiles.map((t,j)=>`<button class="tile xt" data-j="${j}">${t}</button>`).join("")}</div>
        <div class="row end" style="margin-top:12px"><button class="btn sec" id="cl">⌫</button><span class="sp"></span><button class="btn" id="wn" disabled>${L.next} →</button></div></div>`;
      const sep=Q.build?" ":"", slot=$("#slot"), wn=$("#wn");
      if(Q.spell){ $("#pl").onclick=()=>sayAr(Q.ar); setTimeout(()=>sayAr(Q.ar),300); }
      const show=()=>{ slot.textContent=picked.map(j=>tiles[j]).join(sep); wn.disabled=picked.length<target.length; };
      st.querySelectorAll(".xt").forEach(b=>b.onclick=()=>{ const j=+b.dataset.j; if(picked.includes(j)||picked.length>=target.length) return; picked.push(j); b.classList.add("used"); show(); });
      $("#cl").onclick=()=>{ const j=picked.pop(); if(j!=null) st.querySelector(`.xt[data-j="${j}"]`).classList.remove("used"); show(); };
      wn.onclick=()=>{ ans.push(picked.map(j=>tiles[j]).join(sep)===target.join(sep) ? "✓" : picked.map(j=>tiles[j]).join(sep)); i++; q(); };
      return;
    }
    const opts=optionsFor(Q); Q._opts=opts; window.__q={ans:Q.ans,opts};
    st.innerHTML=qCard(Q, opts, counter);
    const pl=$("#pl"); if(pl) pl.onclick=()=>sayAr(Q.say); if(Q.say) setTimeout(()=>sayAr(Q.say),300);
    st.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ ans.push(opts[+b.dataset.j]); tone([440],.05,.06); i++; q(); });
  }
  const isRight=(Q,k)=> (Q.build||Q.spell) ? ans[k]==="✓" : ans[k]===Q.ans;
  const showAns=(Q)=> Q.build||Q.spell ? `<bdi class="ar"><b>${Q.ar}</b></bdi>` : Q.kind==="pic" ? picHTML(Q.ans, (WORDS.find(w=>w.pic===Q.ans)||{}).en||"") : `<bdi class="${Q.kind==="en"?"":"ar"}"><b>${Q.kind==="en"?mean(Q.ans):Q.ans}</b></bdi>`;
  function results(){
    const right=qs.filter(isRight).length, pct=Math.round(right/qs.length*100), pass=pct>=PASS*100;
    qs.forEach((Q,k)=>{ if(!isRight(Q,k)) missed.add(Q.ar||Q.ans); });
    if(pass){ tone([523,659,784,1047],.12); setTimeout(()=>speak("مَا شَاءَ اللهُ، بَارَكَ اللهُ فِيكُمْ"),700); } else bad();
    st.innerHTML=`<div class="card result"><div style="font-size:46px">${pass?"🎉":"📖"}</div><div class="score ${pass?'pass':'fail'}">${pct}%</div><h2>${pass?L.passed:L.failed}</h2>${pass?`<div style="font-size:20px;font-weight:800;color:var(--em)">Masha'Allah · Barakallahu feekum</div>`:""}
      <p class="lead">${right} of ${qs.length} correct${pass?(bridge?" · XP added to your account":""):` · you need ${Math.round(PASS*100)}% to pass. Check the answers below, then try again.`}</p>
      <div class="row" style="justify-content:center">${pass
        ? `<button class="btn sec" id="rt">${L.retry}</button>${bridge?`<button class="btn pulse" id="bk">✓ ${L.backList}</button>`:""}`
        : `<button class="btn sec" id="rv">${L.review}</button><button class="btn pulse" id="rt">${L.retry}</button>`}</div></div>
      <div class="card" style="margin-top:14px"><b>Answer review</b><ol class="review">${qs.map((Q,k)=>{ const ok=isRight(Q,k);
        return `<li><div>${ok?"✅":"❌"} ${Q.build?Q.en:Q.spell?"Write: "+Q.en:(Q.q||"")}</div>${(Q.show||(Q.pic&&!Q.build&&!Q.spell))?`<div class="rvq">${Q.pic&&!Q.build&&!Q.spell?picHTML(Q.pic,Q.picEn||""):""} ${Q.show?`<bdi class="ar">${Q.show}</bdi>`:""}</div>`:""}
          <div class="rva">${ok?"":`<span class="no">You chose: ${ans[k]==null?"—":(Q.build||Q.spell)?`<bdi class="ar">${ans[k]}</bdi>`:Q.kind==="pic"?picHTML(ans[k],""):`<bdi class="${Q.kind==="en"?"":"ar"}">${Q.kind==="en"?mean(ans[k]):ans[k]}</bdi>`}</span><br>`}${ok?"":"Answer: "}${showAns(Q)}</div></li>`; }).join("")}</ol></div>`;
    $("#rt").onclick=()=>run(st, def); const rv=$("#rv"); if(rv) rv.onclick=()=>Lesson(0);
    const bk=$("#bk"); if(bk) bk.onclick=()=>{ try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
    if(pass) finishLesson(right, qs.length, { ...LESSON, percent:pct, struggled:[...missed].filter(Boolean).slice(0,20) });
  }
  q();
}

if (window.parent !== window) document.body.classList.add("embedded");
$("#lsub").textContent = `${LESSON.level.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} · ${LESSON.final?"Final exam":"Lesson "+LESSON.lesson}`;
$("#closeBtn").onclick = () => { stopVoice(); clearInterval(timer); try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
Intro();
