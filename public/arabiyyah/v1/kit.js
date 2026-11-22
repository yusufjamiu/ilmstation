/* Arabiyyah lesson kit — loaded before each lesson's content, so lessons stay short.
   w(ar, tr, en, pic, m, opts)  → a word. m = meanings "fr|ha|ur|id|tl|yo|ig|bn|ms". opts: {g:"group title", who:1, np:1 (no picture games)}
   kitSteps({...})              → the standard order of steps:
     Intro · Learn · New words · Match pictures · Match meanings · Read & repeat · (practice…) · Listen · Meaning · Build · Write · Exam */
function w(ar, tr, en, pic, m, o){ return Object.assign({ar, tr, en, pic:pic||"", m:m||""}, o||{}); }
const kRand = a => a[Math.floor(Math.random()*a.length)];
/** a choose item with a gap: fill("الْحَجَرُ ___.", "ثَقِيلٌ", [...wrong], {pic}) */
function fill(show, ans, wrong, o){ return Object.assign({show, q:"Choose the word that fits the gap.", ans, opts:[ans, ...wrong]}, o||{}); }
function kitSteps(c){
  const words = WORDS, extra = typeof EXTRA!=="undefined" ? EXTRA : [];
  const picWords = words.filter(x=>x.pic && !x.np);
  const groups = [...new Set(words.map(x=>x.g||"New words"))];
  const S = [{name:"Intro", type:"watch"}, {name:"Learn", type:"rules", title:"The rule", sub:"Read each card and tap the examples to hear them."}];
  groups.forEach((g,i)=>S.push({name: groups.length>1 ? `Words ${i+1}` : "New words", type:"words", title: g==="New words" ? g : "New words: "+g,
    sub:"Tap every word to hear it. Say it aloud.", words: words.filter(x=>(x.g||"New words")===g).map(x=>x.ar)}));
  if (picWords.length>=4) S.push({name:"Match pictures", type:"match", mode:"pic", title:"Match the picture to the word", sub:"Tap a picture, then tap its Arabic word.", words:picWords.map(x=>x.ar)});
  S.push({name:"Match meanings", type:"match", mode:"meaning", title:"Match the word to its meaning", sub:"Tap an Arabic word, then tap its meaning.", words:[...words, ...extra].map(x=>x.ar)});
  if (c.repeat) S.push({name:"Read & repeat", type:"repeat", title:"Read & repeat", sub:"Listen, then tap the mic and read the sentence aloud. The app checks you.", items:c.repeat});
  (c.practice||[]).forEach(p=>S.push(Object.assign({type:"choose", max:10}, p)));
  if (picWords.length>=4) S.push({name:"Listen", type:"listen", title:"Listen and choose", sub:"Listen to the word, then tap its picture.",
    items:picWords.map(x=>({say:x.ar, q:"Which picture is it?", kind:"pic", ans:x.pic, pool:picWords.map(y=>y.pic)})), max:8});
  const mw = [...words, ...extra];
  S.push({name:"Meaning", type:"choose", title:"What does it mean?", sub:"Choose the meaning of the Arabic.",
    items:[...mw.map(x=>({show:x.ar, say:x.ar, q:"What does this word mean?", kind:"en", ans:x.en, pool:mw.map(y=>y.en)})), ...(c.meaning||[])], max:10});
  if (c.build) S.push({name:"Build", type:"build", title:"Build the sentence", sub:"Tap the words in the right order (Arabic goes from right to left).", extra:c.buildExtra||[], items:c.build, max:6});
  const sp = (c.spell || picWords.filter(x=>x.ar.replace(/[ً-ْٰ]/g,"").length<=5).map(x=>x.ar)).map(a=>{ const x=[...words, ...extra].find(y=>y.ar===a)||{}; return {ar:a, en:x.en||"", pic:x.pic||""}; });
  if (sp.length) S.push({name:"Write", type:"spell", title:"Read & write", sub:"Listen, then tap the letters to write the word.", items:sp, max:5});
  // exam: 15 questions — most from this lesson's own practice
  const pr = (c.practice||[]).map(p=>p.name), has = n => S.some(s=>s.name===n);
  const fixed = [["Listen",2],["Meaning",2],["Build",2],["Write",1]].filter(([n])=>has(n));
  let left = 15 - fixed.reduce((a,[,k])=>a+k,0); const from = [];
  pr.forEach((n,i)=>{ const k = Math.max(1, Math.round(left/(pr.length-i))); from.push([n,k]); left-=k; });
  if (left>0) fixed[0] && (fixed[0][1]+=left);
  S.push({name:"Exam", type:"exam", minutes:c.minutes||9, from: c.exam || [...from, ...fixed]});
  return S;
}
