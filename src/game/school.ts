/* School subjects, books and quiz questions for the Ikorodu schools.
   Classes are grouped into three bands: primary, junior (JSS) and senior (SS).
   Book titles and questions can later be edited from the admin page. */

export type Band = "primary" | "junior" | "senior";
export type Q = { q: string; o: string[]; a: number };

export const bandOf = (cls: string): Band =>
  cls.startsWith("SS") ? "senior" : cls.startsWith("JSS") ? "junior" : "primary";
/** 1 for Primary 1 … 6 for Primary 6, 7–9 for JSS, 10–12 for SS */
export const levelOf = (cls: string) => {
  const n = Number(cls.replace(/\D/g, "")) || 1;
  return cls.startsWith("SS") ? 9 + n : cls.startsWith("JSS") ? 6 + n : n;
};

export type Subject = { id: string; name: string; book: (cls: string) => string };
const num = (cls: string) => cls.replace(/^\D+/, "");
export const SUBJECTS: Subject[] = [
  {
    id: "quran",
    name: "Qur'an & Tajweed",
    book: (c) =>
      ({
        primary: "Al-Qa'idah An-Nuraniyyah",
        junior: "Tuhfat al-Atfal",
        senior: "Al-Muqaddimah al-Jazariyyah",
      })[bandOf(c)],
  },
  {
    id: "arabic",
    name: "Arabic Language",
    book: (c) =>
      ({
        primary: "Durus al-Lughah al-Arabiyyah, Book 1",
        junior: "Durus al-Lughah al-Arabiyyah, Book 2",
        senior: "Durus al-Lughah al-Arabiyyah, Book 3",
      })[bandOf(c)],
  },
  {
    id: "fiqh",
    name: "Fiqh",
    book: (c) =>
      ({
        primary: "Mukhtasar al-Akhdari",
        junior: "Matn al-Ashmawiyyah",
        senior: "Ar-Risalah of Ibn Abi Zayd",
      })[bandOf(c)],
  },
  {
    id: "tawheed",
    name: "Tawheed",
    book: (c) =>
      ({
        primary: "Pillars of Iman, Book " + num(c),
        junior: "Al-Aqidah at-Tahawiyyah (selections)",
        senior: "Al-Aqidah at-Tahawiyyah",
      })[bandOf(c)],
  },
  {
    id: "hadith",
    name: "Hadith",
    book: (c) =>
      ({
        primary: "Al-Arba'un an-Nawawiyyah (first ten)",
        junior: "Al-Arba'un an-Nawawiyyah",
        senior: "Bulugh al-Maram",
      })[bandOf(c)],
  },
  {
    id: "seerah",
    name: "Seerah",
    book: (c) =>
      ({
        primary: "Nur al-Yaqin (selections)",
        junior: "Nur al-Yaqin",
        senior: "Ar-Raheeq al-Makhtum",
      })[bandOf(c)],
  },
  { id: "english", name: "English Language", book: (c) => `English Language, ${c}` },
  { id: "maths", name: "Mathematics", book: (c) => `Mathematics, ${c}` },
];

const Q = (q: string, a: string, ...wrong: string[]): Q => {
  const o = [a, ...wrong];
  // put the right answer in a steady but varied place
  const k = q.length % o.length;
  [o[0], o[k]] = [o[k], o[0]];
  return { q, o, a: k };
};

export const BANK: Record<string, Record<Band, Q[]>> = {
  quran: {
    primary: [
      Q("How many surahs are in the Qur'an?", "114", "100", "99", "120"),
      Q('Which surah is called "The Opening"?', "Al-Fatihah", "Al-Baqarah", "An-Nas", "Yasin"),
      Q(
        "Which surah do we recite in every rak'ah of salah?",
        "Al-Fatihah",
        "Al-Ikhlas",
        "Al-Kawthar",
        "Al-Asr",
      ),
      Q(
        "Surah Al-Ikhlas is mainly about…",
        "The Oneness of Allah",
        "Fasting",
        "The story of Musa",
        "Zakah",
      ),
      Q("What is the last surah of the Qur'an?", "An-Nas", "Al-Falaq", "Al-Ikhlas", "Al-Fatihah"),
      Q(
        "What was the first word revealed to the Prophet ﷺ?",
        "Iqra' (Read)",
        "Bismillah",
        "Qul (Say)",
        "Alhamdulillah",
      ),
    ],
    junior: [
      Q(
        "What is Tajweed?",
        "Reciting the Qur'an correctly",
        "Memorising the Qur'an",
        "Explaining the Qur'an",
        "Writing the Qur'an",
      ),
      Q("How many letters are in the Arabic alphabet?", "28", "26", "30", "24"),
      Q(
        "Noon sakinah followed by the letter ب is read with…",
        "Iqlab",
        "Izhar",
        "Idgham",
        "Ikhfa'",
      ),
      Q(
        "Which letters are the letters of Qalqalah?",
        "ق ط ب ج د",
        "ا و ي",
        "ء هـ ع ح",
        "ي ر م ل و ن",
      ),
      Q("How many rules are there for noon sakinah and tanween?", "4", "2", "3", "5"),
      Q("What is the longest surah of the Qur'an?", "Al-Baqarah", "Al-Imran", "An-Nisa'", "Yasin"),
    ],
    senior: [
      Q("Ikhfa' of noon sakinah happens before how many letters?", "15", "6", "4", "1"),
      Q("Madd Tabi'i (the natural stretch) is how many counts?", "2", "4", "6", "1"),
      Q("The letters of Idgham are gathered in the word…", "يرملون", "قطب جد", "أخي", "بم"),
      Q(
        "The letters of Izhar Halqi come from…",
        "The throat",
        "The lips",
        "The nose",
        "The tongue tip",
      ),
      Q(
        "Who wrote Tuhfat al-Atfal?",
        "Sulayman al-Jamzuri",
        "Ibn al-Jazari",
        "Imam Malik",
        "Imam an-Nawawi",
      ),
      Q("Over about how many years was the Qur'an revealed?", "23", "10", "40", "13"),
    ],
  },
  arabic: {
    primary: [
      Q('"Kitaab" (كِتَاب) means…', "Book", "Pen", "House", "Door"),
      Q('"Qalam" (قَلَم) means…', "Pen", "Book", "Chair", "Bag"),
      Q('"Bayt" (بَيْت) means…', "House", "School", "Market", "Car"),
      Q('"Madrasah" (مَدْرَسَة) means…', "School", "Mosque", "Teacher", "Lesson"),
      Q('The Arabic number "thalaathah" (ثَلَاثَة) is…', "3", "2", "5", "10"),
      Q('"Maa\'" (مَاء) means…', "Water", "Milk", "Food", "Bread"),
    ],
    junior: [
      Q('"Hadha" (هٰذَا) means…', "This (masculine)", "That (feminine)", "These", "Who"),
      Q('The plural of "kitaab" is…', "Kutub", "Kitaabaat", "Kaatib", "Maktab"),
      Q('"Ana" (أَنَا) means…', "I", "You", "He", "We"),
      Q("Which word is feminine?", "Madrasah", "Kitaab", "Qalam", "Bayt"),
      Q('"Ayna" (أَيْنَ) means…', "Where", "When", "Why", "How"),
      Q(
        '"Man" (مَنْ) asks about…',
        "A person (who)",
        "A thing (what)",
        "A place (where)",
        "Time (when)",
      ),
    ],
    senior: [
      Q(
        "The sign of raf' (nominative) in a singular noun is…",
        "Dammah",
        "Fathah",
        "Kasrah",
        "Sukun",
      ),
      Q('"Inna" makes its subject (ism)…', "Mansub", "Marfu'", "Majrur", "Majzum"),
      Q('"Kaana" makes its predicate (khabar)…', "Mansub", "Marfu'", "Majrur", "Majzum"),
      Q(
        "A verb in the past tense is called…",
        "Al-Fi'l al-Madi",
        "Al-Fi'l al-Mudari'",
        "Fi'l al-Amr",
        "Al-Ism",
      ),
      Q(
        "\"Min, ila, 'an, 'ala\" are…",
        "Huruf al-Jarr",
        "Huruf al-'Atf",
        "Asma' al-Isharah",
        "Af'al",
      ),
      Q("A noun after a preposition (harf jarr) is…", "Majrur", "Marfu'", "Mansub", "Majzum"),
    ],
  },
  fiqh: {
    primary: [
      Q("How many obligatory prayers are there each day?", "5", "3", "4", "6"),
      Q("What do we do before salah to purify ourselves?", "Wudu", "Sleep", "Eat", "Read"),
      Q("How many rak'ahs are in Fajr?", "2", "3", "4", "1"),
      Q("How many rak'ahs are in Maghrib?", "3", "2", "4", "5"),
      Q("In which month do Muslims fast?", "Ramadan", "Shawwal", "Rajab", "Muharram"),
      Q("Which of these prayers has 4 rak'ahs?", "Dhuhr", "Fajr", "Maghrib", "Witr"),
    ],
    junior: [
      Q("The zakah on money and gold is…", "2.5%", "10%", "5%", "20%"),
      Q("Tayammum is done with…", "Clean earth", "Water", "Perfume", "Sand from the sea only"),
      Q("Jumu'ah prayer replaces which prayer on Friday?", "Dhuhr", "Asr", "Fajr", "Isha"),
      Q(
        "Hajj is obligatory, for one who is able, how many times in life?",
        "Once",
        "Every year",
        "Twice",
        "Seven times",
      ),
      Q(
        "Which of these breaks wudu?",
        "Using the toilet",
        "Drinking water",
        "Reading a book",
        "Smiling",
      ),
      Q(
        "Who must fast in Ramadan?",
        "Every sane adult Muslim who is able",
        "Only men",
        "Only scholars",
        "Children only",
      ),
    ],
    senior: [
      Q(
        "In the Maliki school, how many obligatory acts (fara'id) of wudu are there?",
        "7",
        "4",
        "5",
        "10",
      ),
      Q(
        "The nisab (minimum) of gold for zakah is about…",
        "85 grams",
        "10 grams",
        "500 grams",
        "1 kilogram",
      ),
      Q("How many takbirs are in the funeral (janazah) prayer?", "4", "2", "5", "7"),
      Q("A traveller shortens the 4-rak'ah prayers to…", "2", "3", "1", "They stay 4"),
      Q(
        "Zakat al-Fitr should be given…",
        "Before the 'Eid prayer",
        "After Dhuhr on 'Eid",
        "In Sha'ban",
        "Any time of year",
      ),
      Q("In the Maliki school, the 'Eid prayer is…", "Sunnah", "Fard 'ayn", "Makruh", "Not prayed"),
    ],
  },
  tawheed: {
    primary: [
      Q("How many pillars of Iman are there?", "6", "5", "4", "7"),
      Q("Who created us and everything?", "Allah", "The angels", "The prophets", "Nature"),
      Q("Which angel brought revelation to the prophets?", "Jibril", "Mika'il", "Israfil", "Malik"),
      Q("Who is the last prophet?", "Muhammad ﷺ", "Isa", "Musa", "Ibrahim"),
      Q("The Tawrah was given to Prophet…", "Musa", "Isa", "Dawud", "Nuh"),
      Q("Belief in the angels is a pillar of…", "Iman", "Hajj", "Zakah", "Salah"),
    ],
    junior: [
      Q('"Tawheed" means…', "Believing Allah is One", "Fasting", "Charity", "Travelling"),
      Q("The opposite of tawheed is…", "Shirk", "Sabr", "Shukr", "Ihsan"),
      Q("The Zabur was given to Prophet…", "Dawud", "Musa", "Isa", "Yunus"),
      Q("The Injil was given to Prophet…", "Isa", "Musa", "Ibrahim", "Sulayman"),
      Q("Belief in Qadar means believing in…", "Allah's decree", "Luck", "Stars", "Dreams"),
      Q(
        "The Day of Judgement is also called…",
        "Yawm al-Qiyamah",
        "Yawm al-Jumu'ah",
        "Laylat al-Qadr",
        "Yawm 'Arafah",
      ),
    ],
    senior: [
      Q(
        "Who wrote Al-Aqidah at-Tahawiyyah?",
        "Imam Abu Ja'far at-Tahawi",
        "Imam al-Bukhari",
        "Imam Malik",
        "Ibn Kathir",
      ),
      Q(
        "Allah's names are called in the Qur'an…",
        "Al-Asma' al-Husna",
        "Al-Mu'awwidhat",
        "Al-Mathani",
        "Al-Furqan",
      ),
      Q("Ayat al-Kursi is in which surah?", "Al-Baqarah", "Al-Imran", "Al-Kahf", "Yasin"),
      Q(
        "The Prophet ﷺ said Surah Al-Ikhlas is equal to…",
        "A third of the Qur'an",
        "Half of the Qur'an",
        "The whole Qur'an",
        "A quarter of the Qur'an",
      ),
      Q(
        "According to the hadith in Sahih Muslim, angels were created from…",
        "Light",
        "Fire",
        "Clay",
        "Water",
      ),
      Q(
        "Shirk is…",
        "Associating partners with Allah",
        "Missing a sunnah",
        "Forgetting in salah",
        "Eating while standing",
      ),
    ],
  },
  hadith: {
    primary: [
      Q(
        "The first hadith in Al-Arba'un an-Nawawiyyah is about…",
        "Intentions",
        "Fasting",
        "Trade",
        "Travel",
      ),
      Q(
        "The Prophet ﷺ said smiling at your brother is…",
        "Charity",
        "Sunnah only",
        "Not allowed",
        "A duty",
      ),
      Q(
        "Who compiled Al-Arba'un an-Nawawiyyah?",
        "Imam an-Nawawi",
        "Imam Malik",
        "Imam Muslim",
        "Ibn Hajar",
      ),
      Q(
        '"Hadith" means…',
        "The sayings and actions of the Prophet ﷺ",
        "A chapter of the Qur'an",
        "A type of prayer",
        "Islamic history",
      ),
      Q(
        '"The best of you learn the Qur\'an and teach it" is in…',
        "Sahih al-Bukhari",
        "The Qur'an",
        "Al-Muwatta'",
        "Nur al-Yaqin",
      ),
      Q(
        "The Prophet ﷺ said purity (tuhur) is…",
        "Half of iman",
        "All of iman",
        "Not part of iman",
        "Only for salah",
      ),
    ],
    junior: [
      Q("How many hadiths are in Al-Arba'un an-Nawawiyyah?", "42", "40 exactly", "100", "30"),
      Q(
        "The hadith of Jibril explains…",
        "Islam, Iman and Ihsan",
        "Hajj only",
        "Trade",
        "Marriage",
      ),
      Q(
        "Sahih al-Bukhari was compiled by…",
        "Muhammad ibn Isma'il al-Bukhari",
        "Imam Muslim",
        "Imam Malik",
        "At-Tirmidhi",
      ),
      Q('How many books are in the famous "six books" of hadith?', "6", "4", "7", "9"),
      Q("The chain of narrators of a hadith is called…", "Isnad", "Matn", "Tafsir", "Fiqh"),
      Q("The text (words) of a hadith is called…", "Matn", "Isnad", "Rawi", "Sanad"),
    ],
    senior: [
      Q(
        "Who wrote Bulugh al-Maram?",
        "Ibn Hajar al-Asqalani",
        "Imam an-Nawawi",
        "Imam Malik",
        "As-Suyuti",
      ),
      Q(
        "A hadith narrated by very many people at every stage is…",
        "Mutawatir",
        "Da'if",
        "Mawdu'",
        "Gharib",
      ),
      Q('"Sahih" means…', "Authentic", "Weak", "Fabricated", "Unknown"),
      Q("Who wrote Al-Muwatta'?", "Imam Malik", "Imam Ahmad", "Imam Abu Dawud", "Imam ash-Shafi'i"),
      Q(
        "Imam Muslim studied hadith with…",
        "Imam al-Bukhari",
        "Ibn Hajar",
        "Imam an-Nawawi",
        "As-Suyuti",
      ),
      Q(
        'A "hasan" hadith is…',
        "Good and accepted, a little below sahih",
        "Fabricated",
        "Rejected",
        "From the Qur'an",
      ),
    ],
  },
  seerah: {
    primary: [
      Q("Where was the Prophet ﷺ born?", "Makkah", "Madinah", "Ta'if", "Jerusalem"),
      Q("What was the name of his mother?", "Aminah", "Khadijah", "Fatimah", "Halimah"),
      Q("What was the name of his father?", "Abdullah", "Abu Talib", "Abdul Muttalib", "Hamzah"),
      Q("Who was his first wife?", "Khadijah", "Aishah", "Hafsah", "Sawdah"),
      Q(
        "Where did the first revelation come?",
        "The cave of Hira",
        "The cave of Thawr",
        "Masjid an-Nabawi",
        "Mount Uhud",
      ),
      Q("To which city did he migrate?", "Madinah", "Ta'if", "Abyssinia", "Damascus"),
    ],
    junior: [
      Q(
        "The year the Prophet ﷺ was born is called…",
        "The Year of the Elephant",
        "The Year of Sorrow",
        "The Year of Hijrah",
        "The Year of Badr",
      ),
      Q(
        "Who raised him after his grandfather died?",
        "His uncle Abu Talib",
        "Abu Bakr",
        "Halimah",
        "Hamzah",
      ),
      Q("What was the first major battle in Islam?", "Badr", "Uhud", "Khandaq", "Hunayn"),
      Q("The Battle of Badr took place in…", "2 AH", "5 AH", "8 AH", "10 AH"),
      Q("Who was with him in the cave during the Hijrah?", "Abu Bakr", "Umar", "Ali", "Uthman"),
      Q("In which year (CE) was the Hijrah?", "622", "570", "610", "632"),
    ],
    senior: [
      Q("The Treaty of Hudaybiyyah was in…", "6 AH", "2 AH", "8 AH", "10 AH"),
      Q("The conquest of Makkah was in…", "8 AH", "6 AH", "3 AH", "11 AH"),
      Q("The Battle of Uhud was in…", "3 AH", "2 AH", "5 AH", "9 AH"),
      Q(
        "Who suggested digging the trench (Khandaq)?",
        "Salman al-Farisi",
        "Khalid ibn al-Walid",
        "Bilal",
        "Zayd ibn Thabit",
      ),
      Q("The Farewell Pilgrimage was in…", "10 AH", "8 AH", "6 AH", "1 AH"),
      Q(
        "Who wrote Ar-Raheeq al-Makhtum?",
        "Safiur-Rahman al-Mubarakpuri",
        "Ibn Hisham",
        "Ibn Kathir",
        "Imam al-Ghazali",
      ),
    ],
  },
  english: {
    primary: [
      Q('What is the plural of "child"?', "Children", "Childs", "Childes", "Childrens"),
      Q('The opposite of "big" is…', "Small", "Tall", "Fat", "Long"),
      Q("She ___ to school every day.", "goes", "go", "going", "gone"),
      Q("Which word is a noun?", "Table", "Run", "Quickly", "Blue"),
      Q("A sentence starts with a…", "Capital letter", "Full stop", "Comma", "Number"),
      Q('The opposite of "happy" is…', "Sad", "Glad", "Kind", "Funny"),
    ],
    junior: [
      Q('The past tense of "go" is…', "Went", "Goed", "Gone", "Going"),
      Q('We use "an" before…', "apple", "book", "car", "dog"),
      Q('A word that means the same as "begin" is…', "Start", "End", "Stop", "Close"),
      Q("They ___ playing football now.", "are", "is", "was", "be"),
      Q('In "the tall boy", the adjective is…', "tall", "the", "boy", "none"),
      Q('The plural of "mouse" is…', "Mice", "Mouses", "Meese", "Mices"),
    ],
    senior: [
      Q("If I ___ you, I would study harder.", "were", "was", "am", "be"),
      Q(
        '"Aisha wrote the letter" in the passive is…',
        "The letter was written by Aisha",
        "The letter writes Aisha",
        "Aisha was written by the letter",
        "The letter is writing Aisha",
      ),
      Q('"As brave as a lion" is an example of…', "A simile", "A metaphor", "Irony", "A pun"),
      Q('The opposite of "generous" is…', "Stingy", "Kind", "Rich", "Brave"),
      Q("Neither the boys nor the girl ___ late.", "was", "were", "are", "have"),
      Q(
        "Which spelling is correct?",
        "Accommodation",
        "Acommodation",
        "Accomodation",
        "Acomodation",
      ),
    ],
  },
};

/** Mathematics questions are made fresh for each class level. */
function mathQ(level: number): Q {
  const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  let q = "",
    ans = 0;
  if (level <= 2) {
    const a = r(2, 9 + level * 5),
      b = r(1, 9 + level * 4);
    if (Math.random() < 0.5) [q, ans] = [`${a} + ${b} = ?`, a + b];
    else [q, ans] = [`${a + b} − ${b} = ?`, a];
  } else if (level <= 4) {
    const a = r(2, 12),
      b = r(2, 12);
    if (Math.random() < 0.6) [q, ans] = [`${a} × ${b} = ?`, a * b];
    else [q, ans] = [`${a * 10 + b} + ${b * 10 + a} = ?`, a * 11 + b * 11];
  } else if (level <= 6) {
    const a = r(2, 12),
      b = r(2, 12);
    if (Math.random() < 0.5) [q, ans] = [`${a * b} ÷ ${a} = ?`, b];
    else {
      const d = [2, 4, 5, 10][r(0, 3)];
      const whole = d * r(2, 20);
      [q, ans] = [`What is 1/${d} of ${whole}?`, whole / d];
    }
  } else if (level <= 9) {
    const k = r(0, 2);
    if (k === 0) {
      const x = r(2, 30),
        a = r(3, 40);
      [q, ans] = [`Solve: x + ${a} = ${x + a}`, x];
    } else if (k === 1) {
      const p = [10, 20, 25, 50][r(0, 3)],
        n = r(2, 20) * 20;
      [q, ans] = [`What is ${p}% of ${n}?`, (p * n) / 100];
    } else {
      const l = r(3, 15),
        w = r(2, 12);
      [q, ans] = [`A rectangle is ${l} m long and ${w} m wide. What is its area (m²)?`, l * w];
    }
  } else {
    const k = r(0, 2);
    if (k === 0) {
      const x = r(2, 15),
        a = r(2, 5),
        b = r(1, 20);
      [q, ans] = [`Solve: ${a}x + ${b} = ${a * x + b}`, x];
    } else if (k === 1) {
      const n = r(3, 9);
      [q, ans] = [`2 to the power ${n} (2^${n}) = ?`, 2 ** n];
    } else {
      const x = r(3, 15);
      [q, ans] = [`If x² = ${x * x} and x > 0, what is x?`, x];
    }
  }
  const opts = new Set<number>([ans]);
  while (opts.size < 4) {
    const d = r(1, Math.max(3, Math.round(ans * 0.25)));
    opts.add(Math.random() < 0.5 ? ans + d : Math.max(0, ans - d));
  }
  const o = [...opts].sort(() => Math.random() - 0.5);
  return { q, o: o.map(String), a: o.indexOf(ans) };
}

/** Five questions for this subject at this class's level. */
export function quizFor(subject: string, cls: string): Q[] {
  if (subject === "maths") return Array.from({ length: 5 }, () => mathQ(levelOf(cls)));
  const pool = [...(BANK[subject]?.[bandOf(cls)] ?? [])];
  return pool.sort(() => Math.random() - 0.5).slice(0, 5);
}

/** Points from school quizzes are capped each day. */
export const SCHOOL_POINTS = { perCorrect: 2, dailyCap: 20 };
