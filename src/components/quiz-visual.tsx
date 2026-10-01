import { BookOpen, Landmark, Moon, Sun, Sunrise, Sunset, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type VisualKind = "arabic" | "prayer" | "seerah" | "fiqh" | "quran" | "hadith" | "aqeedah" | "dua" | "tafsir";
export type VisualQuestion = { q: string; options: string[]; answer: number; why: string; visual: VisualKind };

// Each illustration depicts a concept the learner must identify, rather than decorating an ordinary recall question.
export const visualQuestions = {
  Arabic: { q: "Match the letter tile to the word that begins with it.", options: ["بَيْتٌ (house)", "تَمْرٌ (dates)", "نَهْرٌ (river)", "ثَوْبٌ (garment)"], answer: 0, why: "بَيْتٌ starts with ب, which has one dot underneath. ت has two dots above; ث has three.", visual: "arabic" },
  Fiqh: { q: "Which prayer belongs to this time of day?", options: ["Fajr", "Dhuhr", "Maghrib", "Isha"], answer: 2, why: "Maghrib begins just after sunset. The sun is dipping below the horizon here.", visual: "prayer" },
  Seerah: { q: "Which city was the destination of the Hijrah?", options: ["Makkah", "Madinah", "Ta’if", "Jerusalem"], answer: 1, why: "The Prophet ﷺ migrated from Makkah to Madinah in the Hijrah.", visual: "seerah" },
  "Qur’an": { q: "Which surah is shown in this opening verse?", options: ["Al-Fatihah", "Al-Ikhlas", "Al-Falaq", "An-Nas"], answer: 1, why: "قُلْ هُوَ ٱللَّهُ أَحَدٌ is the opening verse of Surah Al-Ikhlas (112:1).", visual: "quran" },
  Tafsir: { q: "Which surah does this short passage come from?", options: ["Al-Asr", "Al-Kawthar", "Al-Fil", "Al-Qadr"], answer: 0, why: "وَٱلْعَصْرِ means ‘By time’ and opens Surah Al-Asr (103:1).", visual: "tafsir" },
  Hadith: { q: "What does the highlighted link in this chain represent?", options: ["A narrator", "A surah", "A prayer time", "A city"], answer: 0, why: "A chain of narration connects people who transmitted a report. Each link is a narrator.", visual: "hadith" },
  Aqeedah: { q: "What idea does this diagram illustrate?", options: ["Tawhid", "Zakah", "Hijrah", "Sawm"], answer: 0, why: "Tawhid is affirming Allah’s oneness in Lordship, worship, and Names and Attributes.", visual: "aqeedah" },
  Dua: { q: "Which phrase is shown before beginning an action?", options: ["Alhamdulillah", "Bismillah", "Subhanallah", "Allahu akbar"], answer: 1, why: "بِسْمِ ٱللَّهِ means ‘In the name of Allah’ — Bismillah.", visual: "dua" },
} satisfies Record<string, VisualQuestion>;

const followUps: Record<string, Array<Omit<VisualQuestion, "visual"> & { visual?: VisualKind }>> = {
  Aqeedah: [
    { q: "How many pillars of Iman are there?", options: ["Four", "Five", "Six", "Seven"], answer: 2, why: "The six pillars include belief in Allah, angels, books, messengers, the Last Day and divine decree." },
    { q: "Which category concerns worshipping Allah alone?", options: ["Rububiyyah", "Uluhiyyah", "Asma wa’s-Sifat", "Hijrah"], answer: 1, why: "Uluhiyyah means directing worship to Allah alone." },
    { q: "Which of these is a pillar of Iman?", options: ["Belief in the angels", "Fasting Ramadan", "Hajj", "Zakah"], answer: 0, why: "Belief in the angels is a pillar of Iman; the other options are pillars of Islam." },
  ],
  Arabic: [
    { q: "Which vowel sign makes an ‘a’ sound?", options: ["Fatha", "Kasra", "Damma", "Sukun"], answer: 0, why: "Fatha sits above a letter and gives it a short ‘a’ sound." },
    { q: "Arabic is read in which direction?", options: ["Left to right", "Right to left", "Top to bottom", "Either way"], answer: 1, why: "Arabic writing is read from right to left." },
    { q: "How many letters are in the Arabic alphabet?", options: ["26", "28", "30", "32"], answer: 1, why: "Arabic has 28 letters." },
  ],
  Fiqh: [
    { q: "How many obligatory daily prayers are there?", options: ["Three", "Four", "Five", "Six"], answer: 2, why: "There are five obligatory daily prayers." },
    { q: "What comes before salah when water is available?", options: ["Wudu", "Tayammum", "Zakah", "Sawm"], answer: 0, why: "Wudu is the ritual washing done before prayer." },
    { q: "Which prayer is before sunrise?", options: ["Isha", "Asr", "Maghrib", "Fajr"], answer: 3, why: "Fajr begins at dawn before the sun rises." },
  ],
  Seerah: [
    { q: "In which city was the Prophet ﷺ born?", options: ["Makkah", "Madinah", "Ta’if", "Jerusalem"], answer: 0, why: "The Prophet ﷺ was born in Makkah." },
    { q: "Where did the first revelation come?", options: ["Cave of Thawr", "Cave of Hira", "Mount Uhud", "Safa"], answer: 1, why: "The first revelation came in the Cave of Hira." },
    { q: "Who was the Prophet’s ﷺ first wife?", options: ["Aisha", "Hafsah", "Khadijah", "Zaynab"], answer: 2, why: "Khadijah was the Prophet’s ﷺ first wife." },
  ],
  Hadith: [
    { q: "What is the chain of narrators called?", options: ["Isnad", "Matn", "Tafsir", "Fiqh"], answer: 0, why: "The isnad is the chain of people who transmitted a hadith." },
    { q: "What is the text of a hadith called?", options: ["Isnad", "Matn", "Surah", "Ayah"], answer: 1, why: "The matn is the wording of the report itself." },
    { q: "Why examine narrators?", options: ["To count them", "To assess reliability", "To learn geography", "To order chapters"], answer: 1, why: "Scholars assess narrators to evaluate a report’s reliability." },
  ],
  "Qur’an": [
    { q: "How many surahs are in the Qur’an?", options: ["100", "110", "114", "120"], answer: 2, why: "The Qur’an contains 114 surahs." },
    { q: "Which surah opens the Qur’an?", options: ["Al-Fatihah", "Al-Baqarah", "Al-Ikhlas", "An-Nas"], answer: 0, why: "Al-Fatihah is the opening surah." },
    { q: "What is an ayah?", options: ["A chapter", "A verse", "A juz", "A reciter"], answer: 1, why: "An ayah is a verse of the Qur’an." },
  ],
  Tafsir: [
    { q: "What does tafsir study?", options: ["Qur’anic meaning", "Prayer times", "Family trees", "Calendar dates"], answer: 0, why: "Tafsir explains the meanings of the Qur’an." },
    { q: "Surah Al-Asr opens with an oath by what?", options: ["The moon", "Time", "The sun", "The stars"], answer: 1, why: "Al-Asr opens وَٱلْعَصْرِ — ‘By time.’" },
    { q: "What does Al-Asr emphasize?", options: ["Faith and good deeds", "A journey", "A battle", "A calendar"], answer: 0, why: "It emphasizes faith, good deeds, truth and patience." },
  ],
  Dua: [
    { q: "What does dua mean?", options: ["Supplication", "Fasting", "Pilgrimage", "Charity"], answer: 0, why: "Dua is calling upon Allah in supplication." },
    { q: "What does Alhamdulillah express?", options: ["Gratitude and praise", "A greeting", "A farewell", "A prayer time"], answer: 0, why: "Alhamdulillah means ‘Praise be to Allah.’" },
    { q: "Which phrase is commonly said when beginning to eat?", options: ["Bismillah", "Subhanallah", "Inna lillah", "Allahu akbar"], answer: 0, why: "Bismillah is said before beginning, including before eating." },
  ],
};

export function quizQuestionsFor(topic: string): VisualQuestion[] {
  const visual = (visualQuestions as Record<string, VisualQuestion>)[topic] ?? visualQuestions.Aqeedah;
  return [visual, ...(followUps[topic] ?? followUps['Aqeedah'] ?? []).map(q => ({ ...q, visual: q.visual ?? visual.visual }))];
}

export function QuizVisual({ kind, compact = false }: { kind: VisualKind; compact?: boolean }) {
  const card = "flex min-h-20 min-w-0 flex-col items-center justify-center border-2 border-foreground bg-background px-3 py-3 text-center";
  const caption = "mt-3 text-center text-xs font-semibold text-muted-foreground";
  return <div role="img" aria-label={`Illustration for the ${kind} question`} className={cn("mt-5 overflow-hidden border-2 border-foreground bg-muted p-3 shadow-brutal-sm sm:p-5", compact ? "max-w-xl" : "max-w-2xl")}>
    <div className="mb-3 flex items-center justify-between gap-2 text-[10px] font-bold uppercase text-muted-foreground"><span>Look closely</span><span>Identify the clue</span></div>

    {kind === "arabic" && <div>
      <p className="mb-3 text-center text-sm font-semibold">This letter tile begins one of the words below:</p>
      <div className="mb-3 flex justify-center"><div className={cn(card, "min-h-16 w-20 bg-secondary text-secondary-foreground")}><span className="font-arabic text-5xl" lang="ar">ب</span><span className="mt-1 text-[10px] font-bold uppercase">Bā — one dot below</span></div></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["بَيْتٌ","a house"],["تَمْرٌ","dates"],["نَهْرٌ","a river"],["ثَوْبٌ","a garment"]].map(([word,meaning])=><div key={word} className={cn(card, "min-h-24 bg-primary")}><span className="font-arabic text-3xl sm:text-4xl" dir="rtl" lang="ar">{word}</span><span className="mt-1 text-[10px] font-semibold text-muted-foreground">{meaning}</span></div>)}</div>
    </div>}

    {kind === "prayer" && <div>
      <div className="relative flex min-h-44 items-end justify-center overflow-hidden border-2 border-foreground bg-primary pb-5">
        <Sun aria-hidden className="absolute bottom-9 size-16 text-secondary" strokeWidth={1.5}/>
        <div className="absolute bottom-10 h-1 w-full bg-foreground"/>
        <span className="absolute left-3 top-3 text-xs font-bold uppercase">The sun is dipping below the horizon</span>
        <div className="relative flex w-full justify-between px-5 text-center text-[10px] font-bold uppercase">
          <span className="flex flex-col items-center gap-1"><Sunrise className="size-6"/>Dawn</span>
          <span className="flex flex-col items-center gap-1"><Sun className="size-6"/>Midday</span>
          <span className="flex flex-col items-center gap-1 border-b-4 border-secondary pb-1"><Sunset className="size-6"/>Now</span>
          <span className="flex flex-col items-center gap-1"><Moon className="size-6"/>Night</span>
        </div>
      </div>
      <p className={caption}>A day’s prayer timeline — the marker shows where we are now.</p>
    </div>}

    {kind === "seerah" && <div>
      <p className="mb-3 text-center text-sm font-semibold">The Hijrah, 622 CE — the Prophet ﷺ left his home city for safety:</p>
      <div className="flex items-center gap-2 sm:gap-5">
        <div className={cn(card, "flex-1 bg-primary")}><Landmark className="size-7"/><span className="mt-2 font-serif text-xl">Makkah</span><span className="text-[10px] font-semibold text-muted-foreground">His birthplace</span></div>
        <div className="min-w-8 flex-1 text-center"><div className="border-t-2 border-dashed border-foreground"/><span className="text-xl">→</span><p className="text-[10px] font-bold uppercase">8 days’ journey</p></div>
        <div className={cn(card, "flex-1 bg-secondary text-secondary-foreground")}><Landmark className="size-7"/><span className="mt-2 font-serif text-xl">?</span><span className="text-[10px] font-semibold">Where did he arrive?</span></div>
      </div>
    </div>}

    {(kind === "quran" || kind === "tafsir") && <div>
      <div className={cn(card, "min-h-36 bg-primary")}>
        <BookOpen className="size-6"/>
        <span className="mt-2 font-arabic text-3xl leading-loose sm:text-5xl" dir="rtl" lang="ar">{kind === "quran" ? "قُلْ هُوَ ٱللَّهُ أَحَدٌ" : "وَٱلْعَصْرِ"}</span>
        <span className="mt-1 text-sm font-semibold">{kind === "quran" ? "“Say: He is Allah, the One.”" : "“By time,”"}</span>
      </div>
      <p className={caption}>{kind === "quran" ? "The opening verse of a short surah of four verses." : "The opening oath of a surah about how people spend their lives."}</p>
    </div>}

    {kind === "hadith" && <div>
      <p className="mb-3 text-center text-sm font-semibold">How a hadith reaches us — each person passed it to the next:</p>
      <div className="flex flex-wrap items-stretch justify-center gap-2">
        {["Ā’ishah (RA)","Her student","?","Imam al-Bukhari"].map((s,i)=><div key={s} className="flex items-center gap-2">
          <div className={cn(card, "min-h-24 min-w-24", i===2 ? "bg-secondary text-secondary-foreground" : "bg-primary")}>
            <span className="text-2xl">{i===2 ? "?" : "◯"}</span>
            <span className="mt-1 text-xs font-semibold">{s}</span>
          </div>
          {i<3&&<span className="text-xl">→</span>}
        </div>)}
      </div>
      <p className={caption}>This chain of people is called the isnād. What is each person in it?</p>
    </div>}

    {kind === "aqeedah" && <div>
      <p className="mb-3 text-center text-sm font-semibold">One belief, understood through three meanings:</p>
      <div className="flex justify-center"><div className={cn(card, "min-h-14 w-40 bg-secondary text-secondary-foreground")}><span className="font-serif text-xl">?</span></div></div>
      <div className="mx-auto my-1 h-4 w-0.5 bg-foreground"/>
      <div className="grid grid-cols-3 gap-2">
        {[["Lordship","Allah alone creates and sustains"],["Worship","Allah alone is worshipped"],["Names & Attributes","Allah is known as He described Himself"]].map(([t,b])=><div key={t} className={cn(card, "min-h-28 bg-primary")}><Sparkles className="size-5"/><span className="mt-1 text-xs font-bold sm:text-sm">{t}</span><span className="mt-1 text-[10px] text-muted-foreground">{b}</span></div>)}
      </div>
      <p className={caption}>Which core belief do these three categories explain?</p>
    </div>}

    {kind === "dua" && <div>
      <div className={cn(card, "min-h-36 bg-primary")}>
        <Star className="size-6"/>
        <span className="mt-2 font-arabic text-5xl leading-relaxed" dir="rtl" lang="ar">بِسْمِ ٱللَّهِ</span>
        <span className="mt-1 text-sm font-semibold">“In the name of Allah.”</span>
      </div>
      <p className={caption}>Said before eating, reading, travelling — before we begin anything good.</p>
    </div>}
  </div>;
}