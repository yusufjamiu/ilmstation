/* Seed data for the IlmWorld (game world) admin sections. Deterministic, like data.ts. */

export const mosques = [
  "Lekki Central Mosque · Lekki", "Markaz Mosque · Agege", "Ibaadullah Mosque · Ajegunle", "Makkah (Saudi) Mosque · Jaba Laara",
  "Manaar Gardens Mosque · Manaar Gardens Estate", "Sheikh Alli Jabata Mosque · Agric", "Banu Alli Mosque · Second Gate",
  "Abdulazeez Central Mosque · Egbeda", "Daarul Na'im Central Mosque · Powerline", "Alfaoz Mosque · Oke Eletu",
  "Dr. Abdul Hakeem Abdul Lateef Mosque · Ikeja", "LASUSTECH Central Mosque · First Gate", "UNILAG Central Mosque · Akoka",
  "LASU Central Mosque · Ojo", "Airport Mosque, Ikeja · Lagos Airport", "GRA Central Mosque · GRA", "Ilorin Central Mosque · Ilorin Central",
  "Taiwo Road Jumu'at Mosque · Taiwo Road",
];
export const schools = ["Ibaadullah School · Ajegunle", "Al-Furqan Model School · Ikorodu", "Darul Ulum Academy · Ilorin"];
export const mssnCentres = ["MSSN LASUSTECH Secretariat · First Gate", "MSSN UNILAG Secretariat · Akoka", "MSSN LASU Secretariat · Ojo", "MSSN Unilorin Secretariat · Tanke"];

/* ---------- Quiz text format (shared by every IlmWorld quiz editor) ----------
   One question per block: the question, then each choice on its own line with *
   before the right one. Optional last line: "Why: …". Blank line between questions. */
export type WorldQuestion = { q: string; options: string[]; answer: number; why: string };
export function parseQuiz(text: string): WorldQuestion[] {
  return text.split(/\n\s*\n/).flatMap((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const why = lines.find((l) => /^why:/i.test(l))?.replace(/^why:\s*/i, "") ?? "";
    const [q, ...rest] = lines.filter((l) => !/^why:/i.test(l));
    const options = rest.map((l) => l.replace(/^\*\s*/, ""));
    const answer = rest.findIndex((l) => l.startsWith("*"));
    return q && options.length >= 2 && answer >= 0 && rest.filter((l) => l.startsWith("*")).length === 1 ? [{ q, options, answer, why }] : [];
  });
}
export const sampleQuiz = "How many pillars of Islam are there?\n* Five\nFour\nSix\n\nWho was the first caliph?\n* Abu Bakr\nUmar\nUthman";

/* ---------- Billboard adverts ---------- */
export type AdvertPlan = "week" | "month";
export const advertPrices: Record<AdvertPlan, number> = { week: 5000, month: 15000 };
export type Advert = { id: string; advertiser: string; phone: string; billboard: string; message: string; plan: AdvertPlan; paid: boolean; status: "pending" | "approved" | "declined"; at: string };
export const billboards = ["Central Market square", "Sports Arena gate", "Faculties Complex", "Mosque Road junction"];
export const seedAdverts: Advert[] = [
  { id: "ad1", advertiser: "Halal Bites Kitchen", phone: "0803 000 1101", billboard: "Central Market square", message: "Fresh suya & zobo — 10% off for IlmWorld players!", plan: "week", paid: true, status: "pending", at: "2026-10-28" },
  { id: "ad2", advertiser: "Noor Hijab Store", phone: "0805 000 2202", billboard: "Faculties Complex", message: "New Jumu'ah collection now in store.", plan: "month", paid: false, status: "pending", at: "2026-10-27" },
  { id: "ad3", advertiser: "Al-Ameen Books", phone: "0809 000 3303", billboard: "Mosque Road junction", message: "Qur'an, tafsir and kids' books delivered in Lagos.", plan: "month", paid: true, status: "approved", at: "2026-10-12" },
  { id: "ad4", advertiser: "QuickFix Phones", phone: "0812 000 4404", billboard: "Sports Arena gate", message: "Screen repairs in 1 hour.", plan: "week", paid: false, status: "declined", at: "2026-10-09" },
];

/* ---------- Weekly award ---------- */
export type HomeEntry = { id: string; player: string; home: string; likes: number };
export const seedLikedHomes: HomeEntry[] = [
  { id: "h1", player: "Aisha Bello", home: "No. 12, Sabr Avenue, Lekki", likes: 64 },
  { id: "h2", player: "Yusuf Lawal", home: "No. 3, Shukr Close, Agege", likes: 51 },
  { id: "h3", player: "Zainab Usman", home: "No. 27, Ihsan Street, Ikeja", likes: 38 },
  { id: "h4", player: "Ibrahim Sani", home: "No. 8, Tawakkul Road, Ojo", likes: 22 },
];
export type AwardWinner = { id: string; week: string; player: string; home: string; message: string };
export const seedWinners: AwardWinner[] = [
  { id: "w1", week: "2026-10-24", player: "Maryam Adeyemi", home: "No. 5, Rahmah Crescent, Lekki", message: "May Allah bless your home!" },
  { id: "w2", week: "2026-10-17", player: "Hamza Okafor", home: "No. 19, Barakah Lane, Egbeda", message: "Beautiful work, masha'Allah." },
];

/* ---------- Sponsored quizzes ---------- */
export type QuizEntry = { id: string; player: string; score: number; seconds: number; paid: boolean };
export type SponsoredQuiz = { id: string; title: string; sponsor: string; place: string; prize: number; winners: number; days: number; questions: string; opened: string; status: "live" | "closed"; entries: QuizEntry[] };
const players = ["Aisha Bello", "Yusuf Lawal", "Zainab Usman", "Ibrahim Sani", "Hafsah Musa", "Bilal Danjuma", "Ruqayyah Ibrahim", "Umar Balogun"];
const entriesFor = (seed: number, n: number): QuizEntry[] => players.slice(0, n).map((player, i) => ({ id: `e${seed}${i}`, player, score: 2 - ((i + seed) % 3), seconds: 40 + ((i * 17 + seed * 7) % 90), paid: false }));
export const seedSponsoredQuizzes: SponsoredQuiz[] = [
  { id: "sq1", title: "Seerah Sprint", sponsor: "Al-Ameen Books", place: "Lekki Central Mosque · Lekki", prize: 5000, winners: 3, days: 7, questions: sampleQuiz, opened: "2026-10-25", status: "live", entries: entriesFor(1, 7) },
  { id: "sq2", title: "Ramadan Ready", sponsor: "Halal Bites Kitchen", place: "Ibaadullah School · Ajegunle", prize: 3000, winners: 2, days: 5, questions: sampleQuiz, opened: "2026-10-14", status: "closed", entries: entriesFor(2, 8) },
];

/* ---------- Races ---------- */
export const LAP_METRES = 370;
export type RaceKind = "running" | "cycling";
export type RaceTime = { id: string; player: string; seconds: number; paid: boolean };
export type Race = { id: string; kind: RaceKind; title: string; prize: string; winners: number; laps: number; opens: string; closes: string; times: RaceTime[] };
export const seedRaces: Race[] = [
  { id: "rc1", kind: "running", title: "Jumu'ah 2-lap dash", prize: "₦5,000 each", winners: 3, laps: 2, opens: "2026-10-23T09:00", closes: "2026-10-30T18:00", times: players.slice(0, 6).map((player, i) => ({ id: `t1${i}`, player, seconds: 118 + ((i * 23) % 60), paid: false })) },
  { id: "rc2", kind: "cycling", title: "Arena 4-lap ride", prize: "₦3,000 each", winners: 2, laps: 4, opens: "2026-10-10T09:00", closes: "2026-10-17T18:00", times: players.slice(2, 7).map((player, i) => ({ id: `t2${i}`, player, seconds: 150 + ((i * 31) % 70), paid: i < 2 })) },
];

/* ---------- University courses ---------- */
const coreFaculties = ["Faculty of Arts", "Faculty of Science", "Faculty of Engineering", "Faculty of Law", "Faculty of Social Sciences", "Faculty of Management Sciences", "Faculty of Education", "Faculty of Environmental Sciences", "Faculty of Pharmacy", "College of Medicine", "Faculty of Computing"];
export const universities: { id: string; name: string; faculties: string[] }[] = [
  { id: "lasustech", name: "LASUSTECH, Ikorodu", faculties: coreFaculties },
  { id: "unilag", name: "University of Lagos", faculties: coreFaculties },
  { id: "lasu", name: "Lagos State University", faculties: ["Faculty of Arts", "Faculty of Science", "Faculty of Management Sciences", "Faculty of Education", "Faculty of Law", "Faculty of Social Sciences", "Faculty of Engineering", "Faculty of Communication and Media Studies", "College of Medicine", "Faculty of Computing"] },
  { id: "unilorin", name: "University of Ilorin", faculties: coreFaculties },
  { id: "alhikmah", name: "Al-Hikmah University, Ilorin", faculties: ["Faculty of Arts", "Faculty of Science", "Faculty of Law", "Faculty of Management Sciences", "Faculty of Education", "Faculty of Computing"] },
];
export const levels = ["100", "200", "300", "400", "500"];
export const MAX_TOPICS = 12;
export type CourseTopic = { id: string; title: string; notes: string; quiz: string };
/** Courses are keyed by code: ENG 101 is the same course at every university. */
export type Course = { code: string; title: string; topics: CourseTopic[] };
/** Where a course is taught: university + faculty + department + level. */
export type CourseLink = { id: string; uni: string; faculty: string; department: string; level: string; code: string };
export const seedCourses: Record<string, Course> = {
  "GST 101": { code: "GST 101", title: "Use of English", topics: [{ id: "ct1", title: "Parts of speech", notes: "Nouns, pronouns, verbs, adjectives, adverbs, prepositions, conjunctions and interjections.", quiz: "Which word is a conjunction?\n* And\nQuickly\nBeautiful" }] },
  "CSC 101": { code: "CSC 101", title: "Introduction to Computing", topics: [] },
};
export const seedCourseLinks: CourseLink[] = [
  { id: "cl1", uni: "lasustech", faculty: "Faculty of Science", department: "Computer Science", level: "100", code: "GST 101" },
  { id: "cl2", uni: "lasustech", faculty: "Faculty of Science", department: "Computer Science", level: "100", code: "CSC 101" },
  { id: "cl3", uni: "unilag", faculty: "Faculty of Arts", department: "English", level: "100", code: "GST 101" },
];

/* ---------- Mosque lectures ---------- */
export const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export type Lecture = { id: string; title: string; speaker: string; time: string; minutes: number; days: number[]; audio: string };
export const seedLectures: Record<string, Lecture[]> = {
  "Lekki Central Mosque · Lekki": [{ id: "lc1", title: "Tafsir of Surah Al-Kahf", speaker: "Sheikh Musa Abdullahi", time: "17:00", minutes: 45, days: [5], audio: "" }],
};

/* ---------- School quizzes ---------- */
export const subjects = ["Qur'an & Tajweed", "Arabic Language", "Fiqh", "Tawheed", "Hadith", "Seerah", "English Language", "Mathematics"];
export const schoolLevels = ["Primary", "JSS"] as const;
export const schoolQuizKey = (school: string, subject: string, level: string) => `${school}|${subject}|${level}`;
/** Built-in questions players get until a school saves its own. */
export const builtInSchoolQuizzes: Record<string, string> = {
  "Qur'an & Tajweed|Primary": "Which surah is called \"The Opening\"?\n* Al-Fatihah\nAl-Baqarah\nAn-Nas\nYasin\n\nWhich surah do we recite in every rak'ah of salah?\nAl-Kawthar\nAl-Ikhlas\n* Al-Fatihah\nAl-Asr\n\nWhat was the first word revealed to the Prophet ﷺ?\nQul (Say)\nBismillah\n* Iqra' (Read)\nAlhamdulillah\n\nSurah Al-Ikhlas is mainly about…\n* The Oneness of Allah\nFasting\nThe story of Musa\nZakah\n\nHow many surahs are in the Qur'an?\n99\n100\n* 114\n120",
  "Tawheed|Primary": "Who created us and everything?\nThe prophets\nThe angels\n* Allah\nNature\n\nWho is the last prophet?\n* Muhammad ﷺ\nIsa\nMusa\nIbrahim",
  "Arabic Language|Primary": "\"Madrasah\" means…\nMosque\n* School\nTeacher\nLesson\n\n\"Kitaab\" means…\n* Book\nPen\nHouse\nDoor",
};
