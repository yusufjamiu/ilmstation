/* Editable game content. Later this moves to Firebase so the admin page can change it
   without a code release. */

export const AD_EMAIL = "admin@ilmstation.com";

/** Every billboard has its own id, name and advert. Leave `ad` empty and the board
    shows the "advertise here" message. */
export type Advert = {
  brand: string;
  headline: string;
  line: string;
  bg: string;
  fg: string;
  imageUrl?: string; // a real uploaded banner (1000 × 400) replaces the drawn design
  videoUrl?: string; // optional, plays only when a player taps the board
  link?: string;
};
/** A billboard belongs to an area; the game places it beside the main street. */
export type Billboard = { id: string; name: string; district: string; ad?: Advert };

const COMING_SOON =
  "Biography coming soon. The IlmStation team will add it after review by our scholars panel.";

export type Street = { id: string; name: string; bio: string };
export const STREETS: Record<string, Street> = {
  ridwanjamiu: { id: "ridwanjamiu", name: "Imam Ridwan Jamiu Street", bio: COMING_SOON },
  alilory: {
    id: "alilory",
    name: "Sheikh Adam Al-Ilory Street",
    bio: "Sheikh Adam Abdullahi Al-Ilory was a Nigerian scholar and author who founded the Markaz Arabic and Islamic Training Centre, later based in Agege, Lagos. He wrote many books in Arabic and trained generations of teachers. He passed away in 1992. May Allah have mercy on him.",
  },
  adewuyi: { id: "adewuyi", name: "Sheikh Yusuf Adewuyi Street", bio: COMING_SOON },
  ahmadsad: { id: "ahmadsad", name: "Sheikh Ahmad Sad Street", bio: COMING_SOON },
  habeebadewuyi: { id: "habeebadewuyi", name: "Sheikh Habeeb Adewuyi Street", bio: COMING_SOON },
  najmudeen: { id: "najmudeen", name: "Sheikh Najmudeen Street", bio: COMING_SOON },
};

/* ---------------- areas ----------------
   To add an area: copy one block, give it streets (main street first, z = 0;
   a second street sits at z = -55) and landmarks placed along a street by x. */
export type LandmarkKind = "masjid" | "school" | "home" | "souq";
export type Landmark = { id: string; kind: LandmarkKind; name: string; street: string; x: number };
export type District = {
  id: string;
  name: string;
  state: string;
  /** Where the area sits on the one big Lagos map (world units, north is negative z). */
  origin: { x: number; z: number };
  /** The expressway that joins this area to the City Junction. */
  highway: string;
  lagoon?: boolean;
  streets: { id: string; z: number }[];
  landmarks: Landmark[];
};

export const DISTRICTS: District[] = [
  {
    id: "lekki",
    name: "Lekki",
    state: "Lagos",
    origin: { x: 425, z: 450 },
    highway: "Lekki–Epe Expressway",
    lagoon: true,
    streets: [{ id: "ridwanjamiu", z: 0 }],
    landmarks: [
      {
        id: "lekki-central",
        kind: "masjid",
        name: "Lekki Central Mosque",
        street: "ridwanjamiu",
        x: -36,
      },
      { id: "home", kind: "home", name: "Your Home", street: "ridwanjamiu", x: 24 },
      { id: "souq", kind: "souq", name: "Souq al-Barakah", street: "ridwanjamiu", x: 60 },
    ],
  },
  {
    id: "agege",
    name: "Agege",
    state: "Lagos",
    origin: { x: -325, z: -450 },
    highway: "Agege Motor Road",
    streets: [{ id: "alilory", z: 0 }],
    landmarks: [
      { id: "markaz", kind: "school", name: "Markaz Arabic School", street: "alilory", x: -32 },
    ],
  },
  {
    id: "ajegunle",
    name: "Ajegunle",
    state: "Lagos",
    origin: { x: -275, z: 375 },
    highway: "Apapa–Oshodi Expressway",
    streets: [
      { id: "adewuyi", z: 0 },
      { id: "ahmadsad", z: -55 },
    ],
    landmarks: [
      { id: "ibaadullah", kind: "masjid", name: "Ibaadullah Mosque", street: "adewuyi", x: -36 },
      { id: "as-sirat", kind: "school", name: "As-Sirat Schools", street: "ahmadsad", x: 30 },
    ],
  },
  {
    id: "ikorodu",
    name: "Ikorodu",
    state: "Lagos",
    origin: { x: 575, z: -425 },
    highway: "Ikorodu Road",
    streets: [{ id: "habeebadewuyi", z: 0 }],
    landmarks: [
      {
        id: "maktab",
        kind: "masjid",
        name: "Maktab (Saudi) Mosque",
        street: "habeebadewuyi",
        x: -36,
      },
      { id: "manaar", kind: "school", name: "Manaar Schools", street: "habeebadewuyi", x: 32 },
    ],
  },
  {
    id: "egbeda",
    name: "Egbeda",
    state: "Lagos",
    origin: { x: -560, z: -195 },
    highway: "Egbeda–Idimu Road",
    streets: [{ id: "najmudeen", z: 0 }],
    landmarks: [
      {
        id: "abdulazeez",
        kind: "masjid",
        name: "Abdulazeez Central Mosque",
        street: "najmudeen",
        x: -36,
      },
    ],
  },
];
export const districtById = (id: string) => DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
export const BUS_FARE = 5;

export const BILLBOARDS: Billboard[] = [
  {
    id: "lekki-junction",
    name: "Lekki Junction",
    district: "lekki",
    ad: {
      brand: "IlmStation",
      headline: "Learn daily. Earn rewards.",
      line: "IlmStation Premium · ilmstation.com",
      bg: "#1f6f63",
      fg: "#fdf8ec",
      link: "https://ilmstation.com",
    },
  },
  { id: "lekki-lagoon", name: "Lekki Lagoon Road", district: "lekki" },
  {
    id: "agege-markaz",
    name: "Agege Markaz Gate",
    district: "agege",
    ad: {
      brand: "OutingStation",
      headline: "Find halal outings near you",
      line: "Events · Experiences · outingstation.com",
      bg: "#f2b84b",
      fg: "#2a1c05",
    },
  },
  { id: "agege-junction", name: "Agege Junction", district: "agege" },
  { id: "ajegunle-junction", name: "Ajegunle Junction", district: "ajegunle" },
  { id: "ajegunle-market", name: "Ajegunle Market Road", district: "ajegunle" },
  { id: "ikorodu-garage", name: "Ikorodu Garage", district: "ikorodu" },
  { id: "ikorodu-junction", name: "Ikorodu Junction", district: "ikorodu" },
  { id: "egbeda-junction", name: "Egbeda Junction", district: "egbeda" },
  { id: "egbeda-market", name: "Egbeda Market Road", district: "egbeda" },
];

export type Question = { q: string; o: string[]; a: number; e: string };
export const QUESTIONS: Question[] = [
  {
    q: "How many obligatory prayers are there each day?",
    o: ["3", "5", "7", "10"],
    a: 1,
    e: "Fajr, Dhuhr, Asr, Maghrib and Isha.",
  },
  {
    q: "In which month do Muslims fast?",
    o: ["Shawwal", "Rajab", "Ramadan", "Muharram"],
    a: 2,
    e: "Fasting in Ramadan is one of the five pillars of Islam.",
  },
  {
    q: "What is the first surah of the Quran?",
    o: ["Al-Baqarah", "Al-Fatihah", "Al-Ikhlas", "Yasin"],
    a: 1,
    e: "Al-Fatihah is recited in every unit of prayer.",
  },
  {
    q: "How many pillars of Islam are there?",
    o: ["4", "5", "6", "7"],
    a: 1,
    e: "Shahadah, Salah, Zakah, Sawm and Hajj.",
  },
  {
    q: "What is the direction Muslims face in prayer called?",
    o: ["Qiblah", "Minbar", "Mihrab", "Imam"],
    a: 0,
    e: "The Qiblah points to the Ka'bah in Makkah.",
  },
  {
    q: "Which prayer is prayed just after sunset?",
    o: ["Asr", "Isha", "Maghrib", "Fajr"],
    a: 2,
    e: "Maghrib begins right after the sun sets.",
  },
  {
    q: "What is voluntary charity called?",
    o: ["Zakah", "Sadaqah", "Hajj", "Sawm"],
    a: 1,
    e: "Sadaqah can be given any time. Even a smile counts.",
  },
  {
    q: "How many surahs are in the Quran?",
    o: ["99", "100", "114", "124"],
    a: 2,
    e: "The Quran has 114 surahs.",
  },
  {
    q: "What is the washing before prayer called?",
    o: ["Ghusl", "Wudu", "Tayammum", "Adhan"],
    a: 1,
    e: "Wudu is the washing done before salah.",
  },
  {
    q: "Which is the shortest surah in the Quran?",
    o: ["Al-Asr", "Al-Kawthar", "An-Nas", "Al-Ikhlas"],
    a: 1,
    e: "Al-Kawthar has only three verses.",
  },
  {
    q: 'What does "Bismillah" mean?',
    o: ["Praise be to Allah", "Allah is the Greatest", "In the name of Allah", "If Allah wills"],
    a: 2,
    e: "We say Bismillah before eating, reading and starting good things.",
  },
  {
    q: "Which city did the Prophet ﷺ migrate to?",
    o: ["Taif", "Jerusalem", "Madinah", "Damascus"],
    a: 2,
    e: "The Hijrah to Madinah marks the start of the Islamic calendar.",
  },
];

/* ---------------- mosque lectures ----------------
   At these times the lecture plays when a player enters that mosque. Add the audio
   file link (for example from Firebase Storage) once you have the speaker's permission.
   days: 0 = Sunday … 6 = Saturday; leave empty for every day. */
export type Lecture = {
  id: string;
  mosque: string; // landmark id
  title: string;
  speaker: string;
  start: string; // "HH:MM" local time
  minutes: number;
  days?: number[];
  audioUrl?: string;
};
export const LECTURES: Lecture[] = [
  {
    id: "lekki-tafsir",
    mosque: "lekki-central",
    title: "Tafsir of Surah Al-Kahf",
    speaker: "Guest Imam",
    start: "10:00",
    minutes: 60,
    days: [5],
  },
  {
    id: "lekki-evening",
    mosque: "lekki-central",
    title: "Lessons from the Seerah",
    speaker: "Guest Imam",
    start: "17:00",
    minutes: 45,
  },
  {
    id: "ibaadullah-fiqh",
    mosque: "ibaadullah",
    title: "Fiqh of Salah",
    speaker: "Guest Imam",
    start: "16:30",
    minutes: 45,
  },
  {
    id: "maktab-hadith",
    mosque: "maktab",
    title: "Forty Hadith of Imam Nawawi",
    speaker: "Guest Imam",
    start: "11:00",
    minutes: 60,
  },
  {
    id: "abdulazeez-quran",
    mosque: "abdulazeez",
    title: "Tajweed for beginners",
    speaker: "Guest Imam",
    start: "15:00",
    minutes: 45,
  },
];

/** Learning pays points, but slowly: these are the daily limits. */
export const POINTS = {
  perLectureMinute: 1,
  lectureDailyCap: 30,
  perCorrectAnswer: 2,
  quizPerDay: 5,
  start: 20,
};
