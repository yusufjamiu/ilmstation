/* Qira'ah lesson engine (adult) — shared by every lesson. Built by build.py; do not edit by hand. */
/* The whole alphabet (names from Nour al-Bayan p.2). Lessons use it to review earlier letters.
   Harakat lessons set MARK (e.g. fatha "\u064E"): then every letter carries it — بَ تَ ثَ — and is read as its sound (ba ta tha). */
const HAS_MARK = typeof MARK!=="undefined";
const VOWEL = HAS_MARK ? ({"\u064E":"a","\u0650":"i","\u064F":"u"})[MARK] : "";
const MK = l => HAS_MARK ? (l==="ا" ? (MARK==="\u0650" ? "إ" : "أ") : l) + MARK : l;
const ALPHA = [["ا","أَلِفْ","alif","ʾ",["الف"]],["ب","بَاءْ","baa","b",["باء","با"]],["ت","تَاءْ","taa","t",["تاء","تا"]],["ث","ثَاءْ","thaa","th",["ثاء","ثا"]],
 ["ج","جِيمْ","jiim","j",["جيم"]],["ح","حَاءْ","ḥaa","ḥ",["حاء","حا"]],["خ","خَاءْ","khaa","kh",["خاء","خا"]],["د","دَالْ","daal","d",["دال"]],["ذ","ذَالْ","dhaal","dh",["ذال"]],
 ["ر","رَاءْ","raa","r",["راء","را"]],["ز","زَايْ","zaay","z",["زاي","زا"]],["س","سِينْ","siin","s",["سين"]],["ش","شِينْ","shiin","sh",["شين"]],["ص","صَادْ","ṣaad","ṣ",["صاد"]],
 ["ض","ضَادْ","ḍaad","ḍ",["ضاد"]],["ط","طَاءْ","ṭaa","ṭ",["طاء","طا"]],["ظ","ظَاءْ","ẓaa","ẓ",["ظاء","ظا"]],["ع","عَيْنْ","ʿayn","ʿ",["عين"]],["غ","غَيْنْ","ghayn","gh",["غين"]],
 ["ف","فَاءْ","faa","f",["فاء","فا"]],["ق","قَافْ","qaaf","q",["قاف"]],["ك","كَافْ","kaaf","k",["كاف"]],["ل","لَامْ","laam","l",["لام"]],["م","مِيمْ","miim","m",["ميم"]],
 ["ن","نُونْ","nuun","n",["نون"]],["ه","هَاءْ","haa","h",["هاء","ها"]],["و","وَاوْ","waaw","w",["واو"]],["ي","يَاءْ","yaa","y",["ياء","يا"]]]
 .map(([l,n,tn,c,acc]) => HAS_MARK ? ({l:MK(l), n:MK(l), tn:(c==="ʾ"?"":c)+VOWEL, acc:[l+(VOWEL==="a"?"ا":VOWEL==="i"?"ي":"و"), l]}) : ({l,n,tn,acc}));
const BASE28 = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" ");
/** letters taught in earlier lessons (everything in the alphabet before today's first letter) */
const REVIEW = ALPHA.slice(0, ALPHA.findIndex(x=>x.l===LETTERS[0].l));


const T = { en:{
  start:"Start lesson", cont:"Continue where you stopped", restart:"Start again", next:"Next", finish:"Finish",
  steps:["Intro","Learn","Read & repeat","Spot the dots","Match","Listen","Write","Order","Exam"],
  wrT:"Write what you hear", wrS:"Listen, then tap the letters in the order you hear them. Use ⌫ to fix a mistake.", check:"Check",
  learnT:"Meet the letters", learnS:"Tap each letter. Learn its name, its sound and how to recognise it.",
  intro:`Arabic has <b>28 letters</b>, from <span class="ar" style="font-size:20px">ا</span> (alif) to <span class="ar" style="font-size:20px">ي</span> (yaa).`,
  qName:"What is this letter called?", qDots:"What is this letter's name?",
  name:"Name", sound:"Sound", spot:"Recognise", listen:"Listen", me:"My voice",
  repT:"Read & repeat", repS:"Listen to the name, then tap the mic and say it. The app checks you.",
  tap:"Tap the mic and say the name", listening:"Listening… tap again to stop", heardL:"We heard:",
  correct:"Correct — well done", wrong:"Not quite. Listen again and repeat.", selfQ:"We couldn't check automatically. Compare your voice with the teacher's:",
  selfOk:"I said it correctly", again:"Try again", noMic:"Microphone not available — say it aloud, then continue.",
  dotsT:"Spot the dots", dotsS:"Many letters share a shape. The dots tell them apart.",
  matchT:"Match each letter to its name", matchS:"Tap a letter, then its name.",
  lisT:"Listen and choose", lisS:"You will hear a letter's name. Choose the letter.",
  examT:`Lesson ${LESSON.lesson} exam`, examS:`${13+(REVIEW.length?3:0)} questions${REVIEW.length?" (3 review earlier lessons)":""} · ${PASS>=1?"you need every answer right (100%)":`pass mark ${Math.round(PASS*100)}%`} · 5 minutes`, startExam:"Start exam",
  passed:"Passed — lesson complete", failed:"Not yet — review and try again", backList:"Back to lessons", retry:"Retake exam", review:"Review the lesson",
  ansIs:"answer:", play:"Play",
  ordT:"Alphabet order", ordS:"Find the missing letter, then write the letters in order from the beginning.",
  gapQ:"Which letter is missing?", allQ:"Now write every letter you know, in order, starting from ا." } };
const L = Object.assign(T.en, TEXT);
// review lessons: no new letters, so no Learn step; each game uses a random set of the letters
const isReview = typeof MODE!=="undefined" && MODE==="review";
const some = (n) => isReview ? shuffle(LETTERS).slice(0,n) : LETTERS;
if (isReview) L.steps = ["Intro","Read & repeat","Spot the dots","Match","Listen","Write","Order","Exam"];


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



/* =========================================== ENGINE =========================================== */
const $=s=>document.querySelector(s), view=$("#view");
const rand=a=>a[Math.floor(Math.random()*a.length)], shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
let xp=0, stepNow=0, maxStep=0, timer=null, missed=new Set();
let ac; function tone(f,d=.1,vol=.12){ if(muted)return; try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)();
  f.forEach((fr,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=fr;const t=ac.currentTime+i*d;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d*1.8);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d*2);});}catch(e){} }
const good=()=>tone([587,880]), bad=()=>tone([196,165],.14,.07);
// Praise in Arabic, spoken and shown (fits boys, girls and adults)
// shown in English letters (everyone can read it), spoken in Arabic
const PRAISE = [{ar:"مَا شَاءَ اللهُ", en:"Masha'Allah!"}, {ar:"بَارَكَ اللهُ فِيكُمْ", en:"Barakallahu feekum!"}, {ar:"مُمْتَازٌ", en:"Mumtaz! Excellent!"}];
let lastSay = Promise.resolve();
const afterPraise = (fn, ms=1200) => Promise.all([lastSay, new Promise(r=>setTimeout(r,ms))]).then(fn);
function praise(fb){ const p=rand(PRAISE); lastSay=Promise.resolve(speak(p.ar)); if(fb){ fb.className="fb ok"; fb.textContent=`${L.correct} · ${p.en}`; } return p.en; }
function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),1600); }
function addXP(){}   // XP is given by the app (Admin → XP rewards), once per lesson
$("#sound").onclick=e=>{ muted=!muted; e.currentTarget.textContent=muted?"🔇":"🔊"; if(muted) stopVoice(); };
const XP=[0,0,0,0,0,0,0,0];
const byL=l=>LETTERS.find(x=>x.l===l)||ALPHA.find(x=>x.l===l);   // earlier letters come from the full alphabet

async function Intro(){
  await bridgeReady;
  prefetchVoices([...introScenes().map(x=>[x.say,"en"]), ...LETTERS.map(x=>[x.n]), ...PRAISE.map(x=>[x.ar])]);
  const resume = savedState && savedState.step>0;
  view.innerHTML=`<div class="card intro fade" style="margin-top:22px"><div class="ar" style="font-size:26px;color:var(--em)">${LESSON.ar}</div>
    <h1 style="margin-top:6px">${LESSON.title}</h1><p class="lead" style="margin:0">${LESSON.sub}</p>
    <p class="lead" style="margin:10px 0 0">${L.intro} ${L.cover}</p>
    <div class="a28">${ALL28.map(l=>`<span class="${LETTERS.some(x=>x.l===l)?'on':ALL28.indexOf(l)<ALL28.indexOf(LETTERS[0].l)?'was':''}">${l}</span>`).join("")}</div>
    <p class="lead">${L.steps.map((s,i)=>`${i+1}. ${s}`).join(" &nbsp;·&nbsp; ")}</p>
    <div class="row" style="justify-content:center">${resume?`<button class="btn sec" id="rs">${L.restart}</button><button class="btn" id="ct">${L.cont}</button>`:`<button class="btn" id="st">${L.start}</button>`}</div></div>`;
  const st=$("#st"); if(st) st.onclick=()=>Lesson(0);
  const ct=$("#ct"); if(ct) ct.onclick=()=>{ maxStep=savedState.step; Lesson(savedState.step); };
  const rs=$("#rs"); if(rs) rs.onclick=()=>Lesson(0);
}
function Lesson(i){
  clearInterval(timer); stopVoice(); stepNow=i; maxStep=Math.max(maxStep,i); scrollTo(0,0);
  saveState({step:i, xp});
  view.innerHTML=`<div class="fade"><div class="steps">${L.steps.map((s,k)=>`<button class="${k<i?'done':k===i?'on':''}" data-k="${k}" title="${s}"></button>`).join("")}</div>
    <div class="stepLabel"><span>Step ${i+1} of ${L.steps.length} · ${L.steps[i]}</span></div><div id="stage"></div></div>`;
  view.querySelectorAll(".steps button").forEach(b=>b.onclick=()=>{ const k=+b.dataset.k; if(k<=maxStep) Lesson(k); });
  (isReview ? [Watch,Repeat,Dots,Match,Listen,Write,Order,Exam] : [Watch,Learn,Repeat,Dots,Match,Listen,Write,Order,Exam])[i]($("#stage"));
}
const nextBtn=(label=L.next)=>`<div class="row end" style="margin-top:18px"><button class="btn" id="nx">${label} →</button></div>`;
function bindNext(){ $("#nx").onclick=()=>{ addXP(XP[stepNow]); Lesson(stepNow+1); }; }

/* 0 — INTRO VIDEO: what this lesson (and, in Lesson 1, the whole course) is about — narrated, with captions */
const wait0 = ms => new Promise(r=>setTimeout(r,ms));
function introScenes(){
  const pct = Math.round(PASS*100), sc = [];
  if (LESSON.level==="preparatory" && LESSON.lesson===1) sc.push(
    {show:"logo", say:"Assalamu alaikum, and welcome to the Qira'ah class. In this course you will learn to read the Qur'an correctly, step by step, with the book Nour al-Bayan."},
    {show:"parts", say:"The course has five levels. Preparatory: the letters and the short vowels, called harakat. Beginner 1: madd, the long vowels. Beginner 2: sukun and tanween. Beginner 3: shadda. Beginner 4: the rules of tajweed, and Qur'anic spelling. Each level ends with a final exam and a certificate."},
    {show:"all", say:"We start at the very beginning: the twenty eight letters of the Arabic alphabet, from Alif to Yaa."});
  sc.push({show:"today", say:GOAL},
          {show:"steps", say:`In each lesson you learn, you say it out loud and the app checks you, you practise with short exercises, and you finish with an exam. You need ${pct} percent to pass, and you can retake it as many times as you like.`},
          {show:"go", say:"Take your time, and listen carefully. Bismillah, let's begin."});
  return sc;
}
function Watch(st){
  const scenes=introScenes(); let k=0, paused=false, token=0;
  st.innerHTML=`<div class="card vid"><div class="vstage" id="vs"></div><div class="vcap" id="cap"></div>
    <div class="vbar"><button id="pp" aria-label="Pause">⏸</button><div class="vdots" id="vd">${scenes.map(()=>"<i></i>").join("")}</div>
    <button id="rp" aria-label="Replay">↺</button><button id="sk" aria-label="Skip">⏭</button></div></div><div id="nxw"></div>`;
  const vs=$("#vs"), cap=$("#cap"), pp=$("#pp"), alive=my=>my===token && st.isConnected;
  const parts=[["Preparatory","الحروف والحركات","letters and harakat"],["Beginner 1","المدود","madd"],["Beginner 2","السكون والتنوين","sukun and tanween"],["Beginner 3","الشدة","shadda"],["Beginner 4","أحكام التجويد","tajweed rules"]];
  function visual(sh){
    if(sh==="logo") return `<div class="vlogo">ن</div><h2 style="margin:0">Qira'ah</h2><div class="lead" style="margin:0">Nour al-Bayan · <span class="ar">نور البيان</span></div>`;
    if(sh==="parts") return `<div class="vparts">${parts.map((x,i)=>`<div style="animation-delay:${i*.9}s"><b>${x[0]}</b> · ${x[2]} <span class="ar">${x[1]}</span></div>`).join("")}</div>`;
    if(sh==="all") return `<div class="a28 pop">${ALL28.map((l,i)=>`<span class="on" style="animation-delay:${i*.08}s">${l}</span>`).join("")}</div>`;
    if(sh==="today") return `<div class="ar" style="font-size:20px;color:var(--em)">${LESSON.ar}</div><h2 style="margin:0">${LESSON.title} · ${LESSON.sub}</h2>
      <div class="a28">${ALL28.map(l=>`<span class="${LETTERS.some(x=>x.l===l)?'on':ALL28.indexOf(l)<ALL28.indexOf(LETTERS[0].l)?'was':''}">${l}</span>`).join("")}</div>`;
    if(sh==="steps") return `<div class="vsteps">${L.steps.slice(1).map((x,i)=>`<span style="animation-delay:${i*.35}s">${i+1}. ${x}</span>`).join("")}</div>`;
    return `<div style="font-size:54px">📖</div><div class="ar" style="font-size:34px;color:var(--em)">بِسْمِ اللهِ</div>`;
  }
  function dots(){ st.querySelectorAll("#vd i").forEach((d,i)=>{ d.className=i<k?"done":i===k?"on":""; d.onclick=()=>jump(i); }); }
  function jump(i){ k=Math.max(0,Math.min(scenes.length-1,i)); paused=false; pp.textContent="⏸"; play(); }
  async function play(){ const my=++token; stopVoice();
    while(k<scenes.length){ dots(); const sc=scenes[k]; vs.innerHTML=visual(sc.show); cap.textContent=sc.say;
      await Promise.all([speakEn(sc.say), wait0(1500)]); if(!alive(my)) return; await wait0(500); if(!alive(my)) return; k++; }
    dots(); done(); }
  function done(){ if(!$("#nx")){ $("#nxw").innerHTML=nextBtn("Start the lesson"); bindNext(); } }
  pp.onclick=()=>{ if(paused){ paused=false; pp.textContent="⏸"; play(); } else { paused=true; token++; stopVoice(); pp.textContent="▶"; } };
  $("#rp").onclick=()=>jump(k);
  $("#sk").onclick=()=>{ if(k>=scenes.length-1){ token++; stopVoice(); k=scenes.length; dots(); done(); } else jump(k+1); };
  play(); done();   // the button is there from the start: people who've seen it before can skip
}

/* 1 — LEARN */
function Learn(st){
  let cur=0; const seen=new Set();
  st.innerHTML=`<h2>${L.learnT}</h2><p class="lead">${L.learnS}</p><div class="lcards" id="lc" style="grid-template-columns:repeat(${LETTERS.length},1fr)"></div><div class="card" id="dt"></div><div id="nxw"></div>`;
  function draw(){ seen.add(cur); const x=LETTERS[cur];
    $("#lc").innerHTML=LETTERS.map((y,k)=>`<button class="lc ${k===cur?'on':''} ${seen.has(k)?'seen':''}" data-k="${k}">${y.l}</button>`).join("");
    $("#lc").querySelectorAll(".lc").forEach(b=>b.onclick=()=>{ cur=+b.dataset.k; draw(); });
    $("#dt").innerHTML=`<div class="detail"><div class="big">${x.l}</div><div class="kv">
      <b>${L.name}</b><span><span class="ar">${x.n}</span> &nbsp;<b style="color:var(--em)">${x.tn}</b></span>
      <b>${L.sound}</b><span>${x.snd}</span><b>${L.spot}</b><span>${x.tip}</span></div></div>
      <div class="row end" style="margin-top:10px"><button class="btn sec" id="ls">🔊 ${L.listen}</button>${cur<LETTERS.length-1?`<button class="btn" id="nl">${L.next} letter →</button>`:""}</div>`;
    $("#ls").onclick=()=>speak(x.n); const nl=$("#nl"); if(nl) nl.onclick=()=>{ cur++; draw(); };
    speak(x.n);
    if(seen.size===LETTERS.length && !$("#nx")){ $("#nxw").innerHTML=nextBtn(); bindNext(); }
  }
  draw();
}

/* 2 — READ & REPEAT (checked by the app's speech service) */
function Repeat(st){
  let i=0, ok=0; const RL=some(8);
  function draw(){ if(!st.isConnected) return;
    if(i>=RL.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">🎙️</div><h2>${ok} / ${RL.length} said correctly</h2></div>${nextBtn()}`; bindNext(); return; }
    const x=RL[i]; let tries=0, myUrl=null, busy=false;
    st.innerHTML=`<h2>${L.repT}</h2><p class="lead">${L.repS}</p>
      <div class="card" style="text-align:center"><span class="counter">${i+1} / ${RL.length}</span>
        <div class="big" style="font-size:96px">${x.l}</div><div class="ar" style="font-size:30px">${x.n}</div><div class="tr" style="font-size:18px">${x.tn}</div>
        <div class="row" style="justify-content:center;margin:10px 0"><button class="btn sec" id="ls">🔊 ${L.listen}</button><button class="btn sec" id="mine" style="display:none">▶ ${L.me}</button></div>
        <button class="micBtn" id="mic">🎤</button><div class="fb" id="fb">${L.tap}</div><div class="heard" id="hd"></div><div id="act"></div></div>`;
    const fb=$("#fb"), hd=$("#hd"), mic=$("#mic"), mine=$("#mine"), act=$("#act");
    $("#ls").onclick=()=>speak(x.n); setTimeout(()=>speak(x.n),300);
    mine.onclick=()=>{ if(myUrl){ stopVoice(); player=new Audio(myUrl); player.play(); } };
    mic.onclick=async()=>{
      if(busy){ stopRecord(); return; }
      busy=true; stopVoice(); act.innerHTML=""; hd.textContent=""; mic.classList.add("rec"); mic.textContent="⏹"; fb.className="fb"; fb.textContent=L.listening;
      const r=await record({ms:2800, check:true}); busy=false; mic.classList.remove("rec"); mic.textContent="🎤";
      if(r.url){ myUrl=r.url; mine.style.display=""; }
      if(r.error){ fb.textContent = r.error==="mic" ? L.noMic : L.selfQ; return self(); }
      hd.textContent = r.text ? `${L.heardL} ${r.text}` : "";
      if(heardRight(r.text,[x.n,...x.acc])){ ok++; good(); praise(fb); afterPraise(()=>{ i++; draw(); }); return; }
      tries++; bad(); missed.add(x.l); fb.className="fb no"; fb.textContent=L.wrong; speak(x.n);
      if(tries>=3) self();
    };
    function self(){ if(myUrl){ player=new Audio(myUrl); player.play(); player.onended=()=>speak(x.n); }
      act.innerHTML=`<div class="row" style="justify-content:center;margin-top:10px"><button class="btn sec" id="ag">${L.again}</button><button class="btn" id="ys">${L.selfOk}</button></div>`;
      $("#ag").onclick=()=>{ act.innerHTML=""; fb.textContent=L.tap; }; $("#ys").onclick=()=>{ ok++; i++; draw(); }; }
  }
  draw();
}

/* 3 — SPOT THE DOTS */
function Dots(st){
  const qs=shuffle(LETTERS.filter(x=>GROUPS.some(g=>g.letters.includes(x.l)))).slice(0, isReview?10:99); let i=0, right=0;   // only letters that have a look-alike
  function q(){ if(!st.isConnected) return;
    if(i>=qs.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">🔍</div><h2>${right} / ${qs.length} correct</h2></div>${nextBtn()}`; bindNext(); return; }
    const x=qs[i], grp=GROUPS.find(g=>g.letters.includes(x.l));
    st.innerHTML=`<h2>${L.dotsT}</h2><p class="lead">${L.dotsS}</p>
      ${i===0?`<div class="dotsGrp">${GROUPS.map(g=>`<div class="card"><div class="ar">${g.letters.join(" ")}</div><small>${g.note}</small></div>`).join("")}</div>`:""}
      <div class="card" style="text-align:center"><span class="counter">${i+1} / ${qs.length}</span><div class="qtext">${L.qDots}</div><div class="qar">${x.l}</div>
        <div class="opts">${shuffle(grp.letters).map(l=>`<button class="opt" data-l="${l}">${byL(l).tn} · <span class="ar" style="font-size:22px">${byL(l).n}</span></button>`).join("")}</div><div class="fb" id="fb"></div></div>`;
    st.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ const c=b.dataset.l===x.l;
      st.querySelectorAll(".opt").forEach(z=>{ z.disabled=true; if(z.dataset.l===x.l) z.classList.add("right"); });
      if(c){ right++; good(); $("#fb").className="fb ok"; $("#fb").textContent=L.correct; } else { b.classList.add("wrong"); missed.add(x.l); bad(); $("#fb").className="fb no"; $("#fb").textContent=x.tip; }
      speak(x.n); setTimeout(()=>{ i++; q(); }, c?1000:2200); });
  }
  q();
}

/* 4 — MATCH */
function Match(st){
  const set=shuffle(LETTERS).slice(0,5); let sel=null, left=5, miss=0;
  st.innerHTML=`<h2>${L.matchT}</h2><p class="lead">${L.matchS}</p><div class="mcols"><div id="cA"></div><div id="cB"></div></div><div class="fb" id="fb"></div><div id="nxw"></div>`;
  shuffle(set).forEach(x=>{ const b=document.createElement("button"); b.className="mi ar"; b.textContent=x.l; b._k=x.l;
    b.onclick=()=>{ st.querySelectorAll("#cA .mi").forEach(z=>z.classList.remove("sel")); sel=b; b.classList.add("sel"); }; $("#cA").appendChild(b); });
  shuffle(set).forEach(x=>{ const b=document.createElement("button"); b.className="mi"; b.innerHTML=`${x.tn} · <span class="ar" style="font-size:22px">${x.n}</span>`; b._k=x.l;
    b.onclick=()=>{ if(!sel){ speak(x.n); return; }
      if(sel._k===b._k){ sel.classList.remove("sel"); sel.classList.add("ok"); b.classList.add("ok"); good(); speak(x.n); sel=null;
        if(--left===0){ $("#fb").className="fb ok"; $("#fb").textContent=`All matched · ${miss} mistake${miss===1?"":"s"}`; $("#nxw").innerHTML=nextBtn(); bindNext(); } }
      else { miss++; missed.add(sel._k); bad(); [b,sel].forEach(z=>{ z.classList.remove("bad"); void z.offsetWidth; z.classList.add("bad"); }); } };
    $("#cB").appendChild(b); });
}

/* 5 — LISTEN AND CHOOSE (look-alike letters as options) */
function Listen(st){
  const rounds=shuffle(some(10)); let r=0, score=0;
  function q(){ if(!st.isConnected) return;
    if(r>=rounds.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">🎧</div><h2>${score} / ${rounds.length} heard correctly</h2><p class="lead" style="margin:0">Next: the lesson exam.</p></div>${nextBtn("Go to exam")}`; bindNext(); return; }
    const x=rounds[r], grp=GROUPS.find(g=>g.letters.includes(x.l));
    let opts=grp?[...grp.letters]:[x.l]; while(opts.length<4){ const y=rand(LETTERS).l; if(!opts.includes(y)) opts.push(y); }
    st.innerHTML=`<h2>${L.lisT}</h2><p class="lead">${L.lisS}</p><div class="card" style="text-align:center"><span class="counter">${r+1} / ${rounds.length}</span><br><br>
      <button class="btn gold" id="pl">🔊 ${L.play}</button><div class="opts">${shuffle(opts).map(l=>`<button class="opt ar">${l}</button>`).join("")}</div><div class="fb" id="fb"></div></div>`;
    $("#pl").onclick=()=>speak(x.n); setTimeout(()=>speak(x.n),300);
    st.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ const c=b.textContent===x.l;
      st.querySelectorAll(".opt").forEach(z=>{ z.disabled=true; if(z.textContent===x.l) z.classList.add("right"); });
      if(c){ score++; good(); $("#fb").className="fb ok"; $("#fb").textContent=`${L.correct} · ${x.tn}`; } else { b.classList.add("wrong"); missed.add(x.l); bad(); $("#fb").className="fb no"; $("#fb").textContent=`That was ${x.tn} (${x.l})`; }
      setTimeout(()=>{ r++; q(); },1500); });
  }
  q();
}

/* 6 — WRITE WHAT YOU HEAR (dictation on an on-screen Arabic keyboard: all 28 letters, so no guessing) */
const ALL28 = BASE28.map(MK);   // with the lesson's harakah, if any (بَ تَ ثَ…)
const wait = ms => new Promise(r=>setTimeout(r,ms));
const atLeast = (p, ms=700) => Promise.all([p, wait(ms)]);
async function sayLetters(seq, slow){ for(const l of seq){ await atLeast(speak(byL(l).n, slow?.5:.85)); await wait(280); } }
const keyboardHTML = () => `<div class="kb">${ALL28.map(l=>`<button class="key" data-l="${l}">${l}</button>`).join("")}<button class="key wide" data-l="⌫">⌫ Delete</button></div>`;
/** slot + keyboard; calls onChange(typed) on every tap */
function bindKeyboard(root, max, onChange){ let typed=[];
  root.querySelectorAll(".key").forEach(b=>b.onclick=()=>{ const l=b.dataset.l; if(l==="⌫") typed.pop(); else if(typed.length<max) typed.push(l); tone([520],.04,.05); onChange(typed); });
  return ()=>typed; }
function Write(st){
  const L7=LETTERS.map(x=>x.l), rounds=[...shuffle(L7).slice(0,3).map(l=>[l]), shuffle(L7).slice(0,2), shuffle(L7).slice(0,2), shuffle(L7).slice(0,3)];
  let r=0, right=0;
  function q(){ if(!st.isConnected) return;
    if(r>=rounds.length){ st.innerHTML=`<div class="card flash"><div style="font-size:44px">✍️</div><h2>${right} / ${rounds.length} written correctly</h2><p class="lead" style="margin:0">Next: the lesson exam.</p></div>${nextBtn("Go to exam")}`; bindNext(); return; }
    const seq=rounds[r];
    st.innerHTML=`<h2>${L.wrT}</h2><p class="lead">${L.wrS}</p><div class="card" style="text-align:center"><span class="counter">${r+1} / ${rounds.length} · ${seq.length===1?"1 letter":seq.length+" letters"}</span>
      <div class="row" style="justify-content:center;margin:10px 0"><button class="btn gold" id="pl">🔊 ${L.play}</button><button class="ghost" id="sl">🐢 Slower</button></div>
      <div class="slot" id="slot"></div>${keyboardHTML()}<div class="fb" id="fb"></div>
      <div class="row end" style="margin-top:10px"><button class="btn" id="ck" disabled>${L.check}</button></div></div>`;
    $("#pl").onclick=()=>sayLetters(seq); $("#sl").onclick=()=>sayLetters(seq,true); setTimeout(()=>sayLetters(seq),300);
    const slot=$("#slot"), ck=$("#ck");
    const typed=bindKeyboard(st, seq.length, t=>{ slot.textContent=t.join(" "); ck.disabled=!t.length; });
    ck.onclick=()=>{ const t=typed(), ok=t.join("")===seq.join("");
      st.querySelectorAll(".key").forEach(k=>k.disabled=true); ck.disabled=true;
      if(ok){ right++; good(); slot.classList.add("ok"); praise($("#fb")); }
      else { bad(); seq.forEach(l=>missed.add(l)); $("#fb").className="fb no";
        $("#fb").innerHTML=`${L.ansIs} <span class="ar" style="font-size:28px">${seq.join(" ")}</span> (${seq.map(l=>byL(l).tn).join(", ")})`; }
      if(ok) afterPraise(()=>{ r++; q(); }); else setTimeout(()=>{ r++; q(); }, 2800); };
  }
  q();
}

/* 7 — ALPHABET ORDER: missing letter, then write from the beginning to where they've reached */
// UPTO = every letter learned so far (Lesson 2 will be ا → ض), so each lesson revises the ones before
const UPTO = () => ALL28.slice(0, ALL28.indexOf(LETTERS[LETTERS.length-1].l)+1);
function Order(st){
  const up=UPTO(), gaps=[...shuffle(up.map((_,k)=>k)).slice(0,3).map(k=>[k]), shuffle(up.map((_,k)=>k)).slice(0,2)];
  let g=0, right=0;
  function missing(){ if(!st.isConnected) return;
    if(g>=gaps.length) return writeAll();
    const ks=gaps[g], ans=ks.map(k=>up[k]);
    st.innerHTML=`<h2>${L.ordT}</h2><p class="lead">${L.ordS}</p><div class="card" style="text-align:center"><span class="counter">${g+1} / ${gaps.length} · ${ks.length===1?"1 missing":ks.length+" missing (right to left)"}</span>
      <div class="qar" style="font-size:44px;letter-spacing:10px">${up.map((l,j)=>ks.includes(j)?'<span style="color:var(--gold)">؟</span>':l).join(" ")}</div>
      <div class="slot" id="slot"></div>${keyboardHTML()}<div class="fb" id="fb"></div>
      <div class="row end" style="margin-top:10px"><button class="btn" id="ck" disabled>${L.check}</button></div></div>`;
    const typed=bindKeyboard(st, ans.length, t=>{ $("#slot").textContent=t.join(" "); $("#ck").disabled=t.length<ans.length; });
    $("#ck").onclick=()=>{ const ok=typed().join("")===ans.join(""); st.querySelectorAll(".key").forEach(k=>k.disabled=true); $("#ck").disabled=true;
      if(ok){ right++; good(); praise($("#fb")); } else { bad(); ans.forEach(l=>missed.add(l)); $("#fb").className="fb no"; $("#fb").innerHTML=`${L.ansIs} <span class="ar" style="font-size:28px">${ans.join(" ")}</span>`; }
      if(ok) afterPraise(()=>{ g++; missing(); }); else setTimeout(()=>{ g++; missing(); }, 2600); };
  }
  function writeAll(){ if(!st.isConnected) return;
    st.innerHTML=`<h2>${L.ordT}</h2><div class="card" style="text-align:center"><div class="qtext">${L.allQ}</div>
      <div class="slot" id="slot" style="font-size:40px;letter-spacing:6px;min-height:90px"></div>${keyboardHTML()}<div class="fb" id="fb"></div>
      <div class="row end" style="margin-top:10px"><button class="btn" id="ck" disabled>${L.check}</button></div></div>`;
    const typed=bindKeyboard(st, up.length, t=>{ $("#slot").textContent=t.join(" "); $("#ck").disabled=!t.length; });
    $("#ck").onclick=()=>{ const t=typed(), bad1=up.findIndex((l,k)=>t[k]!==l), ok=bad1<0 && t.length===up.length;
      st.querySelectorAll(".key").forEach(k=>k.disabled=true); $("#ck").disabled=true;
      if(ok){ right++; good(); praise($("#fb")); }
      else { bad(); missed.add(up[bad1]); $("#fb").className="fb no";
        $("#fb").innerHTML=`Letter ${bad1+1} should be <span class="ar" style="font-size:28px">${up[bad1]}</span> (${byL(up[bad1]).tn}). The full order: <span class="ar" style="font-size:24px">${up.join(" ")}</span>`; }
      setTimeout(()=>{ st.innerHTML=`<div class="card flash"><div style="font-size:44px">🔤</div><h2>${right} / ${gaps.length+1} correct</h2><p class="lead" style="margin:0">Next: the lesson exam.</p></div>${nextBtn("Go to exam")}`; bindNext(); }, ok?1700:4200); };
  }
  missing();
}

/* 8 — EXAM */
function makeExam(){
  const qs=[], pick3=(x)=>{ const g=GROUPS.find(gg=>gg.letters.includes(x.l)); let o=g?[...g.letters]:[x.l]; while(o.length<4){const y=rand(LETTERS).l; if(!o.includes(y)) o.push(y);} return shuffle(o); };
  shuffle(LETTERS).slice(0,3).forEach(x=>qs.push({type:"Name",text:L.qName,ar:x.l,opts:shuffle([x,...shuffle(LETTERS.filter(y=>y!==x)).slice(0,3)]).map(y=>y.tn),ans:x.tn}));
  shuffle(LETTERS).slice(0,3).forEach(x=>qs.push({type:"Listening",text:"Listen, then choose the letter.",listen:x.n,opts:pick3(x),ans:x.l,arOpts:true}));
  shuffle(DOTQ).slice(0,2).forEach(([l,d])=>qs.push({type:"Dots",text:`Which letter has ${d}?`,opts:pick3(byL(l)),ans:l,arOpts:true}));
  shuffle(SNDQ).slice(0,2).forEach(([l,d])=>qs.push({type:"Sound",text:`Which letter makes ${d}?`,opts:pick3(byL(l)),ans:l,arOpts:true}));
  // review: letters from earlier lessons come back in every exam
  if (REVIEW.length){
    const pool=[...REVIEW, ...LETTERS];
    shuffle(REVIEW).slice(0,2).forEach(x=>qs.push({type:"Review · Name",text:"From an earlier lesson: "+L.qName.toLowerCase(),ar:x.l,opts:shuffle([x,...shuffle(pool.filter(y=>y.l!==x.l)).slice(0,3)]).map(y=>y.tn),ans:x.tn,rl:x.l}));
    shuffle(REVIEW).slice(0,1).forEach(x=>qs.push({type:"Review · Listening",text:"From an earlier lesson: listen, then choose the letter.",listen:x.n,opts:shuffle([x.l,...shuffle(pool.filter(y=>y.l!==x.l)).slice(0,3).map(y=>y.l)]),ans:x.l,arOpts:true}));
  }
  const L7=LETTERS.map(x=>x.l);
  { const up=UPTO(), k=Math.floor(Math.random()*up.length);
    qs.push({type:"Order",text:"Which letter is missing?",ar:up.map((l,j)=>j===k?"؟":l).join(" "),opts:shuffle([up[k],...shuffle(up.filter(x=>x!==up[k])).slice(0,3)]),ans:up[k],arOpts:true}); }
  [shuffle(L7).slice(0,1), shuffle(L7).slice(0,2)].forEach(seq=>qs.push({type:"Dictation",text:`Listen, then write the ${seq.length===1?"letter":seq.length+" letters"} you hear.`,write:seq,ans:seq.join(" "),arOpts:true}));
  return shuffle(qs);
}
function Exam(st){
  st.innerHTML=`<div class="card result"><div style="font-size:46px">📝</div><h2>${L.examT}</h2><p class="lead">${L.examS}</p><button class="btn gold" id="se">${L.startExam}</button></div>`;
  $("#se").onclick=()=>run(st);
}
function run(st){
  const qs=makeExam(), ans=[]; let i=0, left=300;
  const fmt=()=>`${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`;
  clearInterval(timer); timer=setInterval(()=>{ left--; const t=$("#tm"); if(t) t.textContent=fmt(); if(left<=0){ clearInterval(timer); results(); } },1000);
  function q(){ if(!st.isConnected) return; if(i>=qs.length){ clearInterval(timer); return results(); }
    const Q=qs[i];
    st.innerHTML=`<div class="card"><div class="examTop"><span class="counter">Question ${i+1} / ${qs.length}</span><span class="timer" id="tm">${fmt()}</span></div>
      <div class="qtype">${Q.type}</div><div class="qtext">${Q.text}</div>${Q.ar?`<div class="qar">${Q.ar}</div>`:""}
      ${Q.listen||Q.write?`<div style="text-align:center;margin:18px 0"><button class="btn gold" id="pl">🔊 ${L.play}</button></div>`:""}
      ${Q.write?`<div class="slot" id="slot"></div>${keyboardHTML()}<div class="row end" style="margin-top:10px"><button class="btn" id="wn" disabled>${L.next} →</button></div>`
        :`<div class="opts">${Q.opts.map(o=>`<button class="opt ${Q.arOpts?'ar':''}">${o}</button>`).join("")}</div>`}</div>`;
    if(Q.write){ $("#pl").onclick=()=>sayLetters(Q.write); setTimeout(()=>sayLetters(Q.write),300);
      const typed=bindKeyboard(st, Q.write.length, t=>{ $("#slot").textContent=t.join(" "); $("#wn").disabled=!t.length; });
      $("#wn").onclick=()=>{ ans.push(typed().join(" ")); i++; q(); }; return; }
    if(Q.listen){ $("#pl").onclick=()=>speak(Q.listen); setTimeout(()=>speak(Q.listen),300); }
    st.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ ans.push(b.textContent); tone([440],.05,.06); i++; q(); }); }
  function results(){
    const right=qs.filter((Q,k)=>ans[k]===Q.ans).length, pct=Math.round(right/qs.length*100), pass=pct>=PASS*100;
    qs.forEach((Q,k)=>{ if(ans[k]!==Q.ans) (Q.write||[Q.rl||(Q.arOpts?Q.ans:(LETTERS.find(x=>x.tn===Q.ans)||{}).l)]).forEach(l=>missed.add(l)); });
    if(pass){ tone([523,659,784,1047],.12); setTimeout(()=>speak("مَا شَاءَ اللهُ، بَارَكَ اللهُ فِيكُمْ"),700); } else bad();
    st.innerHTML=`<div class="card result"><div style="font-size:46px">${pass?"🎉":"📖"}</div><div class="score ${pass?'pass':'fail'}">${pct}%</div><h2>${pass?L.passed:L.failed}</h2>${pass?`<div style="font-size:20px;font-weight:800;color:var(--em)">Masha'Allah · Barakallahu feekum</div>`:""}
      <p class="lead">${right} of ${qs.length} correct${pass?(bridge?" · XP added to your account":""):` · you need ${Math.round(PASS*100)}% to pass. Check the answers below, then try again.`}</p>
      <div class="row" style="justify-content:center">${pass
        ? `<button class="btn sec" id="rt">${L.retry}</button>${bridge?`<button class="btn" id="bk">✓ ${L.backList}</button>`:""}`
        : `<button class="btn sec" id="rv">${L.review}</button><button class="btn" id="rt">${L.retry}</button>`}</div></div>
      <div class="card" style="margin-top:14px"><b>Answer review</b><ol class="review">${qs.map((Q,k)=>{ const ok=ans[k]===Q.ans;
        return `<li>${ok?"✅":"❌"} ${Q.text} <span class="ar">${Q.ar||""}</span> — ${ok?`<b class="${Q.arOpts?'ar':''}">${Q.ans}</b>`:`you chose <b class="${Q.arOpts?'ar':''}">${ans[k]??"—"}</b>, ${L.ansIs} <b class="${Q.arOpts?'ar':''}">${Q.ans}</b>`}</li>`; }).join("")}</ol></div>`;
    $("#rt").onclick=()=>run(st); const rv=$("#rv"); if(rv) rv.onclick=()=>Lesson(0);
    const bk=$("#bk"); if(bk) bk.onclick=()=>{ try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
    if(pass) finishLesson(right, qs.length, { ...LESSON, percent:pct, xp, struggled:[...missed].filter(Boolean) });
  }
  q();
}

if (window.parent !== window) document.body.classList.add("embedded");
$("#lsub").textContent = `${LESSON.level.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} · Lesson ${LESSON.lesson}`;
$("#closeBtn").onclick = () => { stopVoice(); clearInterval(timer); try{ parent.postMessage({type:"ilmstation:close"},"*"); }catch(e){} };
Intro();
