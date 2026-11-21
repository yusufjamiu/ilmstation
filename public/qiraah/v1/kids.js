/* Qira'ah lesson engine (kids) — shared by every lesson. Built by build.py; do not edit by hand. */
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


const T = { en:{ start:"Start", cont:"Continue", restart:"Start again", next:"Next", done:"Done",
  introT:"Let's read Arabic!", introS:"Today: Alif to Kha · 7 letters", v1:"Arabic has 28 letters, from Alif to Ya!", v2:"Today we learn the first 7: Alif to Kha!", v3:"Masha'Allah! Now it's your turn to play!",
  introOld:"Today you will meet 7 letters!", learnT:"Meet the letters", learnS:"Tap the card to hear its name",
  repT:"Your turn — say it!", repS:"Listen, then tap the mic and say the letter's name",
  listen:"Listen", me:"My voice", tap:"Tap and speak", listening:"Listening…", checking:"Checking…",
  good:["Excellent!","Masha'Allah!","Perfect!","Super!"], tryAgain:"Almost! Listen and try again 👂",
  selfQ:"Did you say it like the teacher?", yes:"Yes 👍", again:"Try again",
  noMic:"No microphone — just say it out loud 🙂", traceT:"Trace the letter", traceS:"Follow the dots with your finger",
  check:"Check", clear:"Clear", show:"Show me", tryMore:"Almost! Trace a bit more", popT:"Pop the balloon!", popS:"Listen, then pop the right letter",
  matchT:"Match the picture", matchS:"Each picture starts with a letter. Tap the picture, then its letter.",
  orderT:"Find the missing letter", orderS:"Which letter is hiding?", allT:"Write them in order", allS:"Tap the letters from Alif to Kha", writeT:"Write what you hear", writeS:"Listen, then tap the letters you hear", bubbleT:"Bubble catch!", bubbleS:"Tap only", play:"Play", quizT:"Final check", quizS:"Get them all right to win the badge",
  q1:"Which letter is this?", q2:"Which letter does it start with?", oops:"Try again!",
  rewardT:"Masha'Allah!", rewardS:"You know أ – خ!", badge:"🏅 Letter Explorer", retry:"Try the check again", need:"You need 95% — let's practise the ones you missed",
  great:["Great!","Masha'Allah!","Super!","Yes!"] } };
const L = Object.assign(T.en, TEXT);
// What Nuri says out loud on each screen (children who can't read yet hear every instruction)
const SAY = { en:{
  v1:"Assalamu alaikum! I am Nuri. Arabic has 28 letters, from Alif to Ya.",
  v2:"Today we will learn the first seven letters, from Alif to Kha. Let's go!",
  v3:"Masha'Allah! You met seven letters. Now it is your turn to play!",
  repeat:"Your turn! Listen to the letter, then tap the microphone and say its name.",
  trace:"Now trace the letter with your finger. Follow the dots.",
  pop:"Listen carefully, then pop the balloon with the right letter.",
  match:"Tap a picture, then tap the letter it starts with.",
  bubble:"Bubble time! Tap the green button, then catch only the bubbles with this letter.",
  quiz:"Final check! Listen or look, then choose the right letter.",
  write:"Writing time! Listen, then tap the letter you hear.",
  order:"Some letters are hiding! Find the missing letter.",
  orderAll:"Now write all the letters in order, from Alif to Kha. Start with Alif!",
  reward:"Masha'Allah! You know Alif to Kha! You earned the Letter Explorer badge.",
  good:["Excellent!","Masha'Allah!","Well done!","Super!"], tryAgain:"Almost! Listen and try again." } }.en;
Object.assign(SAY, SAYTEXT);


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
  if (lang!=="ar") return `${VOICE_ENDPOINT}?text=${encodeURIComponent(TX(text))}&lang=${LANG}&who=${WHO}&slow=0&v=3`;
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
  await Promise.all([worker(), worker(), worker()]);
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
const isReview = typeof MODE!=="undefined" && MODE==="review";   // review lessons: no video or new letters, just games and the big check
const STEPS = isReview ? ["pop","match","bubble","write","order","quiz","reward"] : ["watch","repeat","trace","pop","match","bubble","write","order","quiz","reward"];
const ALL28 = BASE28.map(MK);   // with the lesson's harakah, if any (بَ تَ ثَ…)
const wait = ms => new Promise(r=>setTimeout(r,ms));
const atLeast = (p, ms=900) => Promise.all([p, wait(ms)]);   // keeps the pace even if a sound can't play
let introP = Promise.resolve();
/** Run something after the screen's spoken instruction has finished (only once per screen). */
const TODAY = LETTERS.map(x=>x.l), FIRST = ALL28.indexOf(TODAY[0]);
const cls28 = l => TODAY.includes(l) ? "hl" : ALL28.indexOf(l) < FIRST ? "learned" : "dim";   // today · already learned · later
function afterIntro(fn){ const p=introP; introP=Promise.resolve(); p.then(fn); }
let stars = 0, step = -1, missed = new Set(), quizScore = {right:0,total:1};
const $ = s => document.querySelector(s), screen = $("#screen");
const rand = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
let ac; function tone(f,d=.12,type="sine",vol=.18){ if(muted)return; try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)();
  f.forEach((fr,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=fr;const t=ac.currentTime+i*d;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d*1.6);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d*1.7);});}catch(e){} }
const sfx={good:()=>tone([660,880,1100]),bad:()=>tone([220,180],.15,"square",.08),pop:()=>tone([900,1400],.05,"triangle"),tap:()=>tone([520],.06,"triangle",.1),win:()=>tone([523,659,784,1047,1319],.13)};
function addStars(n,el){ stars+=n; $("#starN").textContent=stars; const b=$("#starBox"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  if(el){ const r=el.getBoundingClientRect(), f=document.createElement("div"); f.className="float-txt"; f.textContent="+"+n+"⭐";
    f.style.cssText=`position:fixed;left:${r.left+r.width/2-20}px;top:${r.top}px`; document.body.appendChild(f); setTimeout(()=>f.remove(),800); } }
function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),1200); }
// Praise in Arabic (works for boys, girls and adults alike), spoken and shown
// shown in English letters (everyone can read it), spoken in Arabic
const PRAISE = [{ar:"مَا شَاءَ اللهُ", en:"Masha'Allah!"}, {ar:"بَارَكَ اللهُ فِيكُمْ", en:"Barakallahu feekum!"}, {ar:"مُمْتَازٌ", en:"Mumtaz! Excellent!"}];
let lastSay = Promise.resolve();
function praise(){ const p=rand(PRAISE); toast(p.en); lastSay=Promise.resolve(speak(p.ar)); return p.en; }
/** move on once the praise has been heard (and at least ms has passed) */
const afterPraise = (fn, ms=1200) => Promise.all([lastSay, wait(ms)]).then(fn);
function cheer(){ sfx.good(); praise(); }
function confetti(n=60){ const cols=["#ff6fa8","#ffd23f","#3ddc97","#8a5cff","#4aa8ff","#ff9f43"];
  for(let i=0;i<n;i++){ const c=document.createElement("div"); c.className="confetti"; c.style.left=Math.random()*100+"vw"; c.style.background=rand(cols);
    c.style.animationDuration=(1.8+Math.random()*1.8)+"s"; c.style.animationDelay=(Math.random()*.6)+"s"; document.body.appendChild(c); setTimeout(()=>c.remove(),4200); } }
function shake(el){ el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
let cleanup=null;
function go(i){
  if(cleanup){cleanup();cleanup=null;} stopVoice(); step=i; screen.innerHTML=""; screen.scrollTop=0;
  $("#prog").style.width=(i/(STEPS.length-1)*100)+"%";
  if(i>0 && i<STEPS.length-1) saveState({step:i, stars});
  const box=document.createElement("div"); box.className="fade"; box.style.cssText="display:flex;flex-direction:column;flex:1"; screen.appendChild(box);
  const key = STEPS[i];
  introP = SAY[key] ? Promise.resolve(speakEn(SAY[key])) : Promise.resolve();      // Nuri says what to do
  ({watch:Watch,repeat:Repeat,trace:Trace,pop:Pop,match:Match,bubble:Bubble,write:Write,order:Order,quiz:Quiz,reward:Reward})[key](box);
  box.querySelectorAll(".sub").forEach(p=>p.onclick=()=>speakEn(SAY[key]||p.textContent));   // tap to hear it again
}
const next=()=>go(step+1);
function mascot(){ return `<svg class="mascot bob" viewBox="0 0 100 100" aria-hidden="true"><defs><mask id="m"><rect width="100" height="100" fill="#fff"/><circle cx="64" cy="40" r="34" fill="#000"/></mask></defs>
  <circle cx="48" cy="52" r="40" fill="#ffd23f" mask="url(#m)"/><circle cx="26" cy="50" r="4" fill="#25304a"/><circle cx="27.5" cy="48.5" r="1.4" fill="#fff"/>
  <path d="M22 62 q8 8 16 0" stroke="#25304a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="18" cy="58" r="4" fill="#ff9fc4" opacity=".7"/>
  <path d="M78 14 l3 7 7 1 -5 5 1.5 7 -6.5-3.5 -6.5 3.5 1.5-7 -5-5 7-1z" fill="#ff6fa8"/></svg>`; }

/* ---------- intro (with "continue where you stopped") ---------- */
async function Intro(){
  screen.innerHTML=""; $("#prog").style.width="0";
  await bridgeReady;
  // fetch this lesson's sounds in the background, so they play instantly
  prefetchVoices([...Object.values(SAY).filter(x=>typeof x==="string").map(x=>[x,"en"]), ...LETTERS.flatMap(x=>[[x.n],[x.w]]), ...PRAISE.map(x=>[x.ar])]);
  const resume = savedState && savedState.step>0 && savedState.step<STEPS.length-1;
  screen.innerHTML=`<div class="intro fade">${mascot()}<h1>${L.introT}</h1><p class="sub" style="cursor:default">${L.introS}</p>
    <div class="grid28">${ALL28.map(l=>`<span class="${cls28(l)}">${l}</span>`).join("")}</div>
    <div class="center" style="margin-top:20px">${resume?`<button class="btn white" id="rs">↻ ${L.restart}</button><button class="btn" id="ct">▶ ${L.cont}</button>`:`<button class="btn" id="st">▶ ${L.start}</button>`}</div></div>`;
  const st=$("#st"); if(st) st.onclick=()=>{ sfx.tap(); go(0); };
  const ct=$("#ct"); if(ct) ct.onclick=()=>{ stars=savedState.stars||0; $("#starN").textContent=stars; go(savedState.step); };
  const rs=$("#rs"); if(rs) rs.onclick=()=>go(0);
}

/* ---------- 1. watch: a short "video" with Nuri ---------- */
function Watch(el){
  const scenes=[sIntro, ...LETTERS.map(x=>my=>sLetter(x,my)), sOutro];
  let scene=0, paused=false, token=0;
  el.innerHTML=`<div class="video"><div class="vstage" id="vs"></div>
    <div class="vbar"><button id="pp" aria-label="Pause">⏸</button><div class="vdots" id="vd">${scenes.map(()=>"<i></i>").join("")}</div>
    <button id="rp" aria-label="Replay">↺</button><button id="sk" aria-label="Skip">⏭</button></div></div>`;
  const vs=el.querySelector("#vs"), pp=el.querySelector("#pp");
  const alive=my=>my===token && el.isConnected;
  function dots(){ el.querySelectorAll("#vd i").forEach((d,k)=>{ d.className=k<scene?"done":k===scene?"on":""; d.onclick=()=>jump(k); }); }
  function jump(k){ scene=Math.max(0,Math.min(scenes.length-1,k)); paused=false; pp.textContent="⏸"; play(); }
  async function play(){ const my=++token; stopVoice();
    while(scene<scenes.length){ dots(); await scenes[scene](my); if(!alive(my)) return; scene++; }
    addStars(3, pp); next(); }
  pp.onclick=()=>{ if(paused){ paused=false; pp.textContent="⏸"; play(); } else { paused=true; token++; stopVoice(); pp.textContent="▶"; } };
  el.querySelector("#rp").onclick=()=>jump(scene);
  el.querySelector("#sk").onclick=()=>{ if(scene>=scenes.length-1){ token++; stopVoice(); next(); } else jump(scene+1); };
  async function sIntro(my){
    vs.style.background="#eef7ff";
    vs.innerHTML=`${mascot()}<div class="vcap">${L.v1}</div><div class="grid28" id="g">${ALL28.map((l,k)=>`<span style="animation-delay:${k*.09}s">${l}</span>`).join("")}</div>`;
    await atLeast(speakEn(SAY.v1), ALL28.length*90+500); if(!alive(my)) return;
    vs.querySelectorAll("#g span").forEach((sp,k)=>sp.classList.add(cls28(ALL28[k])));
    vs.querySelector(".vcap").textContent=L.v2;
    await atLeast(speakEn(SAY.v2), 1500); if(!alive(my)) return; await wait(400);
  }
  async function sLetter(x,my){
    vs.style.background=x.c+"22";
    vs.innerHTML=`<div class="vletter" style="color:${x.c}">${x.l}</div><div class="vname">${x.n}</div><div class="vpic">${x.e}</div><div class="vword">${x.w}</div>`;
    await wait(1300); if(!alive(my)) return;
    vs.querySelector(".vname").classList.add("show");
    await atLeast(speak(x.n)); if(!alive(my)) return; await wait(250);
    await atLeast(speak(x.n)); if(!alive(my)) return;
    vs.querySelector(".vpic").classList.add("show"); vs.querySelector(".vword").classList.add("show");
    await wait(350); await atLeast(speak(x.w)); if(!alive(my)) return; await wait(700);
  }
  async function sOutro(my){
    vs.style.background="#fff7d6";
    vs.innerHTML=`${mascot()}<div class="dance" style="font-family:var(--ar);font-size:min(50px,11vw);direction:rtl">${LETTERS.map((x,k)=>`<span style="animation-delay:${k*.12}s;color:${x.c}">${x.l}</span>`).join(" ")}</div><div class="vcap">${L.v3}</div>`;
    confetti(40); await atLeast(speakEn(SAY.v3), 1800); if(!alive(my)) return; await wait(300);
  }
  cleanup=()=>{ token++; };
  play();
}

/* ---------- (old card step, kept for reference) ---------- */
function Learn(el){
  let i=0; const seen=new Set();
  function draw(){ seen.add(i); const x=LETTERS[i];
    el.innerHTML=`<h2>${L.learnT}</h2><p class="sub">${L.learnS}</p>
      <div class="lcard" id="card"><button class="iconbtn say" id="say">🔊</button>
        <div class="biglet" style="color:${x.c};text-shadow:0 6px 0 ${x.c}33">${x.l}</div>
        <div class="lname">${x.n}</div>
        <div class="emoji" style="font-size:64px;margin-top:6px">${x.e}</div><div class="lword" style="font-size:32px">${x.w}</div></div>
      <div class="dots">${LETTERS.map((_,k)=>`<b class="${k===i?'on':seen.has(k)?'seen':''}"></b>`).join("")}</div>
      <div class="center"><button class="btn white" id="pv" ${i?'':'disabled'}>◀</button>
        ${i<LETTERS.length-1?`<button class="btn" id="nx">${L.next} ▶</button>`:`<button class="btn pink" id="fn">${L.done} ✔</button>`}</div>`;
    const say=async()=>{ await speak(x.n); speak(x.w); };
    el.querySelector("#card").onclick=say;
    el.querySelector("#pv").onclick=()=>{ if(i){i--;draw();} };
    const nx=el.querySelector("#nx"); if(nx) nx.onclick=e=>{ e.stopPropagation(); i++; sfx.tap(); draw(); };
    const fn=el.querySelector("#fn"); if(fn) fn.onclick=()=>{ addStars(3,fn); cheer(); setTimeout(next,600); };
    setTimeout(say,250);
  }
  draw();
}

/* ---------- 2. read & repeat ---------- */
function Repeat(el){
  let i=0, tries=0;
  function draw(){ if(!el.isConnected) return; const x=LETTERS[i]; tries=0;
    el.innerHTML=`<h2>${L.repT}</h2><p class="sub">${L.repS}</p>
      <div class="lcard"><div class="biglet" style="font-size:120px;color:${x.c}">${x.l}</div><div class="lname">${x.n}</div>
        <div class="minirow" style="margin-top:8px"><button class="btn grape sm" id="ls">🔊 ${L.listen}</button><button class="btn white sm" id="mine" style="display:none">▶ ${L.me}</button></div></div>
      <button class="mic" id="mic" aria-label="${L.tap}">🎤</button>
      <div class="result" id="res">${L.tap}</div>
      <div class="dots">${LETTERS.map((_,k)=>`<b class="${k<i?'seen':k===i?'on':''}"></b>`).join("")}</div>`;
    const res=el.querySelector("#res"), mic=el.querySelector("#mic"), mine=el.querySelector("#mine");
    let myUrl=null, busy=false;
    el.querySelector("#ls").onclick=()=>speak(x.n);
    mine.onclick=()=>{ if(myUrl){ stopVoice(); player=new Audio(myUrl); player.play(); } };
    afterIntro(()=>{ if(el.isConnected) speak(x.n); });
    mic.onclick=async()=>{
      if(busy){ stopRecord(); return; }
      busy=true; stopVoice(); mic.classList.add("rec"); mic.textContent="⏹"; res.className="result"; res.textContent=L.listening;
      const r = await record({ms:2600, check:true});
      mic.classList.remove("rec"); mic.textContent="🎤"; busy=false;
      if(r.url){ myUrl=r.url; mine.style.display="inline-flex"; }
      if(r.error==="mic"){ res.textContent=L.noMic; return selfCheck(); }
      if(r.error){ return selfCheck(); }                      // not checked (opened alone / offline / daily limit)
      if(heardRight(r.text, [x.n, ...x.acc])) return win(2);
      tries++; sfx.bad(); res.className="result no"; res.textContent=L.tryAgain; Promise.resolve(speakEn(SAY.tryAgain)).then(()=>speak(x.n));
      if(tries>=2) setTimeout(selfCheck,1400);                 // never block a child: after 2 tries, ask them
    };
    function selfCheck(){
      res.className="result"; res.innerHTML=`${L.selfQ}<div class="minirow" style="margin-top:8px"><button class="btn white sm" id="ag">↻ ${L.again}</button><button class="btn sm" id="ys">${L.yes}</button></div>`;
      if(myUrl){ player=new Audio(myUrl); player.play(); player.onended=()=>speak(x.n); }
      res.querySelector("#ys").onclick=()=>win(1);
      res.querySelector("#ag").onclick=()=>{ res.textContent=L.tap; };
    }
    function win(n){ res.className="result ok"; sfx.good(); res.textContent=praise(); addStars(n,mic); sfx.good(); confetti(20);
      afterPraise(()=>{ i++; i<LETTERS.length? draw() : next(); }); }
  }
  draw();
}

/* ---------- 3. tracing ---------- */
function Trace(el){
  let cur=0, color="#ff6fa8", done=new Set(), drawing=false, last=null, maskPts=[], W=0, H=0; const dpr=Math.min(2,devicePixelRatio||1);
  el.innerHTML=`<h2>${L.traceT}</h2><p class="sub">${L.traceS}</p><div class="chips" id="chips"></div>
    <div class="traceWrap" id="tw"><canvas id="g"></canvas><canvas id="d"></canvas></div><div class="colors" id="cols"></div>
    <div class="center"><button class="btn white" id="clr">🧽 ${L.clear}</button><button class="btn grape" id="show">👀 ${L.show}</button><button class="btn" id="chk">✔ ${L.check}</button></div>
    <div class="center" style="padding-top:8px"><button class="btn pink" id="nx" style="display:none">${L.next} ▶</button></div>`;
  const tw=el.querySelector("#tw"), g=el.querySelector("#g"), d=el.querySelector("#d"), gx=g.getContext("2d"), dx=d.getContext("2d");
  const off=document.createElement("canvas"), ox=off.getContext("2d");
  ["#ff6fa8","#8a5cff","#3ddc97","#ff9f43","#4aa8ff"].forEach((c,k)=>{ const b=document.createElement("button"); b.style.background=c; if(!k)b.classList.add("on");
    b.onclick=()=>{color=c; el.querySelectorAll("#cols button").forEach(z=>z.classList.remove("on")); b.classList.add("on");}; el.querySelector("#cols").appendChild(b); });
  function chips(){ el.querySelector("#chips").innerHTML=LETTERS.map((x,k)=>`<button class="chip ${k===cur?'on':''} ${done.has(k)?'done':''}" data-k="${k}">${x.l}</button>`).join("");
    el.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{cur=+b.dataset.k; setup();}); }
  function glyph(ctx,fill,stroke){ ctx.font=`700 ${W*.62}px 'Noto Naskh Arabic','Geeza Pro',serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.direction="rtl";
    if(fill){ctx.fillStyle=fill; ctx.fillText(LETTERS[cur].l,W/2,H*.42);}
    if(stroke){ctx.save(); ctx.setLineDash([2*dpr,9*dpr]); ctx.lineCap="round"; ctx.lineWidth=4*dpr; ctx.strokeStyle=stroke; ctx.strokeText(LETTERS[cur].l,W/2,H*.42); ctx.restore();} }
  function setup(){ const r=tw.getBoundingClientRect(); W=Math.round(r.width*dpr); H=Math.round(r.height*dpr); [g,d,off].forEach(c=>{c.width=W;c.height=H;});
    glyph(gx,"#ffe9a8","#ff9f43"); ox.clearRect(0,0,W,H); glyph(ox,"#000");
    const img=ox.getImageData(0,0,W,H).data, st=Math.round(5*dpr); maskPts=[];
    for(let y=0;y<H;y+=st) for(let x=0;x<W;x+=st) if(img[(y*W+x)*4+3]>128) maskPts.push([x,y]);
    el.querySelector("#nx").style.display=done.size>=3?"inline-flex":"none"; chips(); afterIntro(()=>{ if(el.isConnected) speak(LETTERS[cur].n); }); }
  const ptr=e=>{const r=d.getBoundingClientRect(); return [(e.clientX-r.left)*dpr,(e.clientY-r.top)*dpr];};
  d.addEventListener("pointerdown",e=>{drawing=true; last=ptr(e); d.setPointerCapture(e.pointerId); dx.fillStyle=color; dx.beginPath(); dx.arc(last[0],last[1],W*.045,0,7); dx.fill();});
  d.addEventListener("pointermove",e=>{ if(!drawing)return; const p=ptr(e); dx.strokeStyle=color; dx.lineWidth=W*.09; dx.lineCap="round"; dx.lineJoin="round";
    dx.beginPath(); dx.moveTo(last[0],last[1]); dx.lineTo(p[0],p[1]); dx.stroke(); last=p; });
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>d.addEventListener(ev,()=>drawing=false));
  function score(){ const img=dx.getImageData(0,0,W,H).data, om=ox.getImageData(0,0,W,H).data; let hit=0,ink=0,out=0; const st=Math.round(8*dpr);
    maskPts.forEach(([x,y])=>{ if(img[(y*W+x)*4+3]>0) hit++; });
    for(let y=0;y<H;y+=st) for(let x=0;x<W;x+=st){ const i=(y*W+x)*4+3; if(img[i]>0){ink++; if(om[i]<10)out++;} }
    return {cov:maskPts.length?hit/maskPts.length:0, out:ink?out/ink:1}; }
  el.querySelector("#clr").onclick=()=>dx.clearRect(0,0,W,H);
  el.querySelector("#chk").onclick=e=>{ const s=score();
    if(s.cov>.6 && s.out<.7){ addStars(s.cov>.82?3:2,e.currentTarget); cheer(); confetti(30); done.add(cur);
      setTimeout(()=>{ if(done.size<LETTERS.length){ cur=LETTERS.findIndex((_,k)=>!done.has(k)); setup(); } else chips(); el.querySelector("#nx").style.display=done.size>=3?"inline-flex":"none"; },1200);
    } else { sfx.bad(); toast(L.tryMore); shake(tw); } };
  el.querySelector("#show").onclick=()=>{ dx.clearRect(0,0,W,H); let t=0; const a=()=>{ t+=.025; dx.save(); dx.beginPath(); dx.rect(W*(1-t),0,W*t,H); dx.clip(); glyph(dx,color); dx.restore();
    if(t<1) requestAnimationFrame(a); else setTimeout(()=>dx.clearRect(0,0,W,H),700); }; a(); };
  el.querySelector("#nx").onclick=next;
  (document.fonts?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(setup,50));
  const onR=()=>setup(); addEventListener("resize",onR); cleanup=()=>removeEventListener("resize",onR);
}

/* ---------- 4. balloon pop ---------- */
function Pop(el){
  const rounds=shuffle(LETTERS).slice(0,5); let r=0, timers=[];
  el.innerHTML=`<h2>${L.popT}</h2><p class="sub">${L.popS}</p><div class="center" style="margin:0;padding:0"><button class="btn grape" id="ag">🔊 ${L.listen}</button></div>
    <div class="sky" id="sky"></div><div class="dots" id="pd"></div>`;
  const sky=el.querySelector("#sky");
  function round(){ if(!el.isConnected) return; sky.innerHTML=""; const t=rounds[r];
    el.querySelector("#pd").innerHTML=rounds.map((_,k)=>`<b class="${k<r?'seen':k===r?'on':''}"></b>`).join("");
    const opts=shuffle([t,...shuffle(LETTERS.filter(x=>x!==t)).slice(0,2)]), xs=shuffle([8,38,68]);
    opts.forEach((o,k)=>{ const b=document.createElement("button"); b.className="balloon"; b.textContent=o.l; b.style.background=o.c; b.style.left=xs[k]+"%"; b.style.animationDelay=(k*.25)+"s";
      b.onclick=()=>{ if(o===t){ b.classList.add("pop"); sfx.pop(); addStars(2,b); cheer(); timers.push(setTimeout(()=>{ r++; r<rounds.length?round():next(); },900)); }
        else { sfx.bad(); missed.add(t.l); shake(b); speak(t.n); } };
      sky.appendChild(b); });
    afterIntro(()=>{ if(el.isConnected) speak(t.n); }); }
  el.querySelector("#ag").onclick=()=>speak(rounds[r].n);
  round(); cleanup=()=>timers.forEach(clearTimeout);
}

/* ---------- 5. picture match ---------- */
function Match(el){
  const set=shuffle(LETTERS).slice(0,4); let pick=null, left=4;
  el.innerHTML=`<h2>${L.matchT}</h2><p class="sub">${L.matchS}</p><div class="matchGrid" id="mg"></div>`;
  const mg=el.querySelector("#mg"), pics=shuffle(set), lets=shuffle(set);
  for(let k=0;k<4;k++){
    const a=document.createElement("button"); a.className="mcard"; a.textContent=pics[k].e; a._x=pics[k];
    a.onclick=()=>{ if(pick)pick.classList.remove("sel"); pick=a; a.classList.add("sel"); speak(a._x.w); };
    const b=document.createElement("button"); b.className="mcard ar"; b.textContent=lets[k].l; b._x=lets[k];
    b.onclick=()=>{ if(!pick){ speak(b._x.n); shake(b); return; }
      if(pick._x===b._x){ pick.classList.remove("sel"); pick.classList.add("ok"); b.classList.add("ok"); addStars(2,b); cheer(); pick=null; if(--left===0) setTimeout(next,1100); }
      else { sfx.bad(); missed.add(pick._x.l); [pick,b].forEach(shake); } };
    mg.appendChild(a); mg.appendChild(b);
  }
}

/* ---------- 6. bubble catch ---------- */
function Bubble(el){
  const withTwin=LETTERS.filter(x=>GROUPS.some(g=>g.includes(x.l))), target=rand(withTwin.length?withTwin:LETTERS);
  const tricky=[...(GROUPS.find(g=>g.includes(target.l))||[]), ...EXTRA_KEYS].filter(x=>x!==target.l);   // same shape, different dots
  el.innerHTML=`<h2>${L.bubbleT}</h2><div class="hud"><div class="pill">⏱ <span id="tm">25</span></div>
    <div class="pill" style="display:flex;align-items:center;gap:8px">${L.bubbleS} <span class="target">${target.l}</span></div><div class="pill">🫧 <span id="sc">0</span></div></div>
    <div class="pond" id="pond"><div style="position:absolute;inset:0;display:grid;place-items:center" id="sb"><button class="btn pink" id="go">▶ ${L.play}</button></div></div>`;
  const pond=el.querySelector("#pond"); let sc=0, tm=25, sT, cT, run=false;
  function spawn(){ const isT=Math.random()<.42, b=document.createElement("button"); b.className="bubble";
    b.textContent=isT?target.l:rand(tricky); b.style.left=(4+Math.random()*72)+"%"; b.style.animationDuration=(4+Math.random()*2.5)+"s";
    b.onclick=()=>{ if(!run)return; if(b.textContent===target.l){ sc++; el.querySelector("#sc").textContent=sc; sfx.pop(); b.style.animation="pop .3s forwards"; setTimeout(()=>b.remove(),300); } else { sfx.bad(); shake(b); } };
    b.addEventListener("animationend",e=>{ if(e.animationName==="up") b.remove(); }); pond.appendChild(b); }
  el.querySelector("#go").onclick=()=>{ el.querySelector("#sb").remove(); run=true; speak(target.n); spawn(); sT=setInterval(spawn,650);
    cT=setInterval(()=>{ tm--; el.querySelector("#tm").textContent=tm; if(tm<=0){ stop(); const n=Math.max(1,Math.min(5,Math.round(sc/2))); addStars(n,pond); sfx.win(); toast("🫧 "+sc+" → +"+n+"⭐"); setTimeout(next,1500);} },1000); };
  function stop(){ run=false; clearInterval(sT); clearInterval(cT); } cleanup=stop;
}

/* ---------- 7. write what you hear ---------- */
function Write(el){
  const L7 = LETTERS.map(x=>x.l);
  const rounds = [...shuffle(L7).slice(0,4).map(l=>[l]), shuffle(L7).slice(0,2), shuffle(L7).slice(0,2)];
  // big keys: today's letters + look-alikes (in a review: the letters asked + a few others, so there aren't 28 buttons)
  const keys = isReview ? shuffle([...new Set([...rounds.flat(), ...shuffle(L7)])].slice(0,12)) : shuffle([...L7, ...EXTRA_KEYS]);
  let r=0;
  const nameOf = l => (LETTERS.find(x=>x.l===l)||{n:l}).n;
  async function sayAll(seq){ for(const l of seq){ await atLeast(speak(nameOf(l)),700); await wait(250); } }
  function q(){ if(!el.isConnected) return;
    if(r>=rounds.length) return next();
    const seq=rounds[r]; let typed=[], tries=0;
    el.innerHTML=`<h2>${L.writeT}</h2><p class="sub">${L.writeS} · ${r+1}/${rounds.length}</p>
      <div class="center" style="margin:0;padding:0"><button class="btn grape" id="pl">🔊 ${L.listen}</button></div>
      <div class="kslot" id="slot">${seq.map(()=>"<span style='opacity:.25'>?</span>").join("")}</div>
      <div class="kkeys">${keys.map(l=>`<button class="kkey" data-l="${l}">${l}</button>`).join("")}<button class="kkey del" data-l="⌫">⌫</button></div>`;
    el.querySelector(".sub").onclick=()=>speakEn(SAY.write);
    const slot=el.querySelector("#slot"); el.querySelector("#pl").onclick=()=>sayAll(seq);
    afterIntro(()=>{ if(el.isConnected) sayAll(seq); });
    const draw=()=>{ slot.className="kslot"; slot.innerHTML=seq.map((_,k)=>typed[k]?`<span>${typed[k]}</span>`:"<span style='opacity:.25'>?</span>").join(""); };
    el.querySelectorAll(".kkey").forEach(b=>b.onclick=()=>{ const l=b.dataset.l;
      if(l==="⌫"){ typed.pop(); draw(); return; }
      if(typed.length>=seq.length) return;
      typed.push(l); sfx.tap(); draw();
      if(typed.length===seq.length){                              // checks by itself when full
        if(typed.join("")===seq.join("")){ slot.classList.add("ok"); addStars(2,slot); sfx.good(); praise(); confetti(20); afterPraise(()=>{ r++; q(); }); }
        else { tries++; seq.forEach(x=>missed.add(x)); slot.classList.add("no"); sfx.bad(); shake(slot);
          if(tries>=2){ slot.innerHTML=seq.map(x=>`<span style="color:#14a86b">${x}</span>`).join(""); sayAll(seq); setTimeout(()=>{ r++; q(); },2600); }
          else { Promise.resolve(speakEn(SAY.tryAgain)).then(()=>sayAll(seq)); setTimeout(()=>{ typed=[]; draw(); },900); } }
      } });
  }
  q();
}

/* ---------- 8. missing letter, then write them all in order ---------- */
// UPTO = every letter learned so far (Lesson 2 will be ا → ض), so each lesson revises the ones before
function Order(el){
  const UPTO = ALL28.slice(0, ALL28.indexOf(LETTERS[LETTERS.length-1].l)+1);
  const nameOf = l => (LETTERS.find(x=>x.l===l)||{n:l}).n;
  const gaps = shuffle(UPTO.map((_,k)=>k)).slice(0,3);
  let g=0;
  function missing(){ if(!el.isConnected) return;
    if(g>=gaps.length) return writeAll();
    const k=gaps[g], ans=UPTO[k];
    const opts=shuffle([ans, ...shuffle(UPTO.filter(x=>x!==ans)).slice(0,2)]);
    el.innerHTML=`<h2>${L.orderT}</h2><p class="sub">${L.orderS} · ${g+1}/${gaps.length}</p>
      <div class="seq">${UPTO.map((l,j)=>`<span class="${j===k?'gap':''}">${j===k?'?':l}</span>`).join("")}</div>
      <div class="qopts">${opts.map(o=>`<button class="qopt">${o}</button>`).join("")}</div>`;
    el.querySelector(".sub").onclick=()=>speakEn(SAY.order);
    el.querySelectorAll(".qopt").forEach(b=>b.onclick=()=>{
      if(b.textContent===ans){ const gp=el.querySelector(".gap"); gp.textContent=ans; gp.className="fill"; b.classList.add("ok"); addStars(2,b); cheer(); afterPraise(()=>{ g++; missing(); }); }
      else { sfx.bad(); missed.add(ans); b.classList.add("no"); shake(b); } });
  }
  function writeAll(){ if(!el.isConnected) return;
    let pos=0, slips=0;
    el.innerHTML=`<h2>${L.allT}</h2><p class="sub">${L.allS}</p>
      <div class="seq" id="sq">${UPTO.map(()=>`<span style="opacity:.25">?</span>`).join("")}</div>
      <div class="kkeys">${shuffle(UPTO).map(l=>`<button class="kkey" data-l="${l}">${l}</button>`).join("")}</div>`;
    el.querySelector(".sub").onclick=()=>speakEn(SAY.orderAll);
    speakEn(SAY.orderAll);
    const cells=el.querySelectorAll("#sq span");
    el.querySelectorAll(".kkey").forEach(b=>b.onclick=()=>{
      if(pos>=UPTO.length) return;
      if(b.dataset.l===UPTO[pos]){ cells[pos].textContent=b.dataset.l; cells[pos].style.opacity=1; cells[pos].className="fill"; sfx.tap(); speak(nameOf(b.dataset.l)); pos++;
        if(pos===UPTO.length){ addStars(slips?3:5, el.querySelector("#sq")); sfx.win(); confetti(50); setTimeout(()=>{ praise(); setTimeout(next,1600); },700); } }
      else { slips++; sfx.bad(); shake(b); missed.add(UPTO[pos]); speak(nameOf(UPTO[pos])); }   // a hint: says the letter that comes next
    });
  }
  missing();
}

/* ---------- 9. final check (95% to pass) ---------- */
function Quiz(el){
  // every letter twice: once by sound, once by picture → 14 questions; practice-first for anything missed earlier
  const qs=shuffle([...LETTERS.flatMap(x=>[{x,kind:"sound"},{x,kind:"pic"}]), ...shuffle(LETTERS).slice(0,3).map(x=>({x,kind:"gap"})),
    ...shuffle(REVIEW).slice(0,3).map(x=>({x,kind:"sound",pool:[...REVIEW,...LETTERS]}))]).slice(0, typeof QUIZ_MAX!=="undefined"?QUIZ_MAX:999); let i=0, right=0;   // review earlier lessons
  function q(){ if(!el.isConnected) return;
    if(i>=qs.length){ const pct=right/qs.length; quizScore={right,total:qs.length};
      if(pct>=PASS) return next();
      el.innerHTML=`<div class="intro">${mascot()}<h2>${Math.round(pct*100)}%</h2><p class="sub">${L.need}</p><div class="center"><button class="btn" id="rt">↻ ${L.retry}</button></div></div>`;
      el.querySelector("#rt").onclick=()=>go(STEPS.indexOf("pop")); return; }   // practise again, then retake
    const Q=qs[i], opts=shuffle([Q.x,...shuffle((Q.pool||LETTERS).filter(z=>z.l!==Q.x.l)).slice(0,2)]);
    el.innerHTML=`<h2>${L.quizT}</h2><p class="sub">${L.quizS} · ${i+1}/${qs.length}</p>
      <div class="lcard">${Q.kind==="sound"?`<div style="font-size:20px;font-weight:800">${L.q1}</div><button class="btn grape" id="pl" style="margin-top:10px">🔊 ${L.listen}</button>`
        :Q.kind==="gap"?`<div style="font-size:20px;font-weight:800">${L.orderS}</div><div class="seq" style="margin-bottom:0">${LETTERS.map(y=>`<span class="${y===Q.x?'gap':''}">${y===Q.x?'?':y.l}</span>`).join("")}</div>`
        :`<div style="font-size:20px;font-weight:800">${L.q2}</div><div class="qemoji">${Q.x.e}</div>`}</div>
      <div class="qopts">${opts.map(o=>`<button class="qopt">${o.l}</button>`).join("")}</div>`;
    const say=()=>Q.kind==="gap"?speakEn(SAY.order):speak(Q.kind==="sound"?Q.x.n:Q.x.w); const pl=el.querySelector("#pl"); if(pl) pl.onclick=say; afterIntro(()=>{ if(el.isConnected) say(); });
    el.querySelectorAll(".qopt").forEach(b=>b.onclick=()=>{ const ok=b.textContent===Q.x.l;
      el.querySelectorAll(".qopt").forEach(z=>z.disabled=true);
      if(ok){ right++; b.classList.add("ok"); sfx.good(); } else { b.classList.add("no"); missed.add(Q.x.l); sfx.bad();
        el.querySelectorAll(".qopt").forEach(z=>{ if(z.textContent===Q.x.l) z.classList.add("ok"); }); speak(Q.x.n); }
      setTimeout(()=>{ i++; q(); }, ok?700:1600); });
  }
  q();
}

/* ---------- 8. reward ---------- */
function Reward(el){
  sfx.win(); confetti(120);
  el.style.justifyContent="center";
  el.innerHTML=`<div class="trophy">🏆</div><h1>${L.rewardT}</h1><p class="sub">${L.rewardS}</p>
    <div class="badge">${L.badge}<div style="font-size:15px;font-weight:700">${stars} ⭐</div></div>
    <div class="guide" style="justify-content:center">${mascot()}<div class="speech ar" style="font-size:30px">${LETTERS.map(x=>x.l).join(" ")}</div></div>
    <div class="center"><button class="btn white" id="rp">↻ ${L.restart}</button></div>`;
  el.querySelector("#rp").onclick=()=>{ stars=0; $("#starN").textContent=0; go(0); };
  finishLesson(quizScore.right, quizScore.total, { ...LESSON, stars, struggled:[...missed] });   // tells the app: lesson complete + letters to review
}

$("#muteBtn").onclick=e=>{ muted=!muted; e.currentTarget.textContent=muted?"🔇":"🔊"; if(muted) stopVoice(); };
Intro();
