export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  topics: TopicId[];
  h2h: { wins: number; losses: number };
  mutual: number;
  online: boolean;
}

export const FRIENDS: Friend[] = [
  {
    id: "amina",
    name: "Amina Bello",
    username: "@amina.b",
    avatar: "🧕",
    level: 4,
    xp: 1420,
    streak: 23,
    topics: ["seerah", "hadith", "dua"],
    h2h: { wins: 7, losses: 4 },
    mutual: 12,
    online: true,
  },
  {
    id: "hassan",
    name: "Hassan Yusuf",
    username: "@hassan.dev",
    avatar: "🧑🏽",
    level: 5,
    xp: 2380,
    streak: 41,
    topics: ["quran", "arabic", "tafsir"],
    h2h: { wins: 3, losses: 9 },
    mutual: 8,
    online: true,
  },
  {
    id: "khalid",
    name: "Umm Khalid",
    username: "@ummkhalid",
    avatar: "👩🏻",
    level: 3,
    xp: 820,
    streak: 12,
    topics: ["fiqh", "dua", "aqeedah"],
    h2h: { wins: 5, losses: 5 },
    mutual: 4,
    online: false,
  },
  {
    id: "ibrahim",
    name: "Ibrahim Sani",
    username: "@ibro",
    avatar: "🧔🏽",
    level: 2,
    xp: 460,
    streak: 6,
    topics: ["aqeedah", "seerah"],
    h2h: { wins: 2, losses: 1 },
    mutual: 15,
    online: false,
  },
  {
    id: "maryam",
    name: "Maryam Diallo",
    username: "@maryam.d",
    avatar: "👩🏾",
    level: 6,
    xp: 4100,
    streak: 67,
    topics: ["hadith", "tafsir", "quran"],
    h2h: { wins: 1, losses: 6 },
    mutual: 6,
    online: true,
  },
  {
    id: "yaseen",
    name: "Yaseen Rahman",
    username: "@yaseen",
    avatar: "👨🏽",
    level: 3,
    xp: 940,
    streak: 9,
    topics: ["arabic", "fiqh"],
    h2h: { wins: 4, losses: 3 },
    mutual: 3,
    online: false,
  },
];

export const friendById = (id: string) => FRIENDS.find((f) => f.id === id);

export const SUGGESTED = [
  { id: "s1", name: "Zainab Okoro", username: "@zainab.o", avatar: "🧕🏾", shared: "Seerah, Hadith" },
  { id: "s2", name: "Bilal Ahmad", username: "@bilal", avatar: "🧑🏻", shared: "Quran, Arabic" },
  { id: "s3", name: "Safiyya Nur", username: "@safiyya", avatar: "👩🏽", shared: "Fiqh, Dua" },
  { id: "s4", name: "Musa Kamara", username: "@musa.k", avatar: "👨🏿", shared: "Aqeedah" },
];

export const PENDING_REQUESTS = [
  { id: "p1", name: "Fatima Adewale", username: "@fatima.a", avatar: "🧕🏿", mutual: 5 },
  { id: "p2", name: "Idris Bello", username: "@idris", avatar: "🧑🏾", mutual: 2 },
];

export interface LeaderRow {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  friend: boolean;
}

export const GLOBAL_LEADERBOARD: LeaderRow[] = [
  { id: "g1", name: "Maryam Diallo", avatar: "👩🏾", xp: 4100, level: 6, streak: 67, friend: true },
  { id: "g2", name: "Omar Haddad", avatar: "🧔🏻", xp: 3890, level: 6, streak: 52, friend: false },
  { id: "g3", name: "Hassan Yusuf", avatar: "🧑🏽", xp: 2380, level: 5, streak: 41, friend: true },
  { id: "g4", name: "Nadia Farouk", avatar: "🧕", xp: 2110, level: 5, streak: 33, friend: false },
  { id: "g5", name: "Amina Bello", avatar: "🧕", xp: 1420, level: 4, streak: 23, friend: true },
  { id: "g6", name: "Yaseen Rahman", avatar: "👨🏽", xp: 940, level: 3, streak: 9, friend: true },
  { id: "g7", name: "Umm Khalid", avatar: "👩🏻", xp: 820, level: 3, streak: 12, friend: true },
  { id: "g8", name: "Ibrahim Sani", avatar: "🧔🏽", xp: 460, level: 2, streak: 6, friend: true },
  { id: "g9", name: "Sumayya Ali", avatar: "🧕🏽", xp: 390, level: 2, streak: 4, friend: false },
];

