import type { Gender } from "@/components/auth";
import type { Tier } from "@/components/premium";

export type Age = "kids" | "teens" | "adults";
export type Kind = "article" | "book";

export type LibraryItem = {
  id: string;
  title: string;
  author?: string;
  /** First category is the main one; the others are extra shelves it also appears on. */
  cats: string[];
  kind: Kind;
  mins?: number;
  tier: Tier;
  cost: number;
  /** Youngest band that may see it: kids < teens < adults. */
  age: Age;
  /** Only this gender sees it (used for Sisters' / Brothers' Corner). */
  audience?: Gender;
  arabic?: string;
  translation?: string;
  /** The text, one paragraph per entry. Items without a body show "text coming". */
  body?: string[];
};

export const CORNERS: Record<string, Gender> = { "Sisters' Corner": "female", "Brothers' Corner": "male" };

export const CATEGORIES = [
  "Aqeedah", "Hadith", "Seerah", "Fiqh", "Tafsir", "Arabic",
  "Heart & Growth", "Love & Marriage", "Qisas", "Youth & Growing Up",
  "Ramadan & Worship", "Science & Innovation", "Sisters' Corner", "Brothers' Corner",
];

export const LIBRARY: LibraryItem[] = [
  {
    id: "tawakkul", title: "Understanding Tawakkul", cats: ["Aqeedah", "Heart & Growth"], kind: "article", mins: 8, tier: "free", cost: 0, age: "kids",
    arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    translation: "Whoever relies upon Allah — then He is sufficient for him. Qur’an 65:3",
    body: [
      "Reliance is active, not passive.",
      "Tawakkul joins sincere effort with trust in Allah’s decree. The believer takes the available means, asks for guidance, and releases anxiety about the outcome.",
      "The Prophetic model consistently paired preparation with reliance: journeys were planned, counsel was sought, and every action remained anchored in remembrance.",
    ],
  },
  { id: "mercy", title: "Mercy in the Prophetic Tradition", cats: ["Hadith"], kind: "article", mins: 12, tier: "free", cost: 0, age: "kids" },
  { id: "hudaybiyyah", title: "The Treaty of Hudaybiyyah", cats: ["Seerah"], kind: "article", mins: 10, tier: "premium", cost: 300, age: "teens" },
  { id: "wudu", title: "A Practical Guide to Wudu", cats: ["Fiqh"], kind: "article", mins: 6, tier: "free", cost: 0, age: "kids" },
  { id: "tafsir-mulk", title: "Tafsir of Surah Al-Mulk", cats: ["Tafsir"], kind: "article", mins: 22, tier: "premium", cost: 450, age: "teens" },
  { id: "arabic-grammar", title: "Classical Arabic: Building Sentences", cats: ["Arabic"], kind: "article", mins: 18, tier: "premium", cost: 400, age: "teens" },

  // Listed books: cover details only. Full text needs each author's permission.
  { id: "b-beyond-my-trials", title: "Beyond My Trials: My Journey with Muscular Dystrophy", author: "Fatimah Aderohunmu", cats: ["Heart & Growth"], kind: "book", tier: "free", cost: 0, age: "teens" },
  { id: "b-heart-to-heart", title: "Heart-to-Heart With My Sister", author: "Majeedah Ashimi Idris", cats: ["Sisters' Corner", "Love & Marriage"], kind: "book", tier: "free", cost: 0, age: "adults", audience: "female" },
  { id: "b-infatuation", title: "Infatuation: Lust in Disguise of Love", author: "Sanni Kay Yusuf", cats: ["Love & Marriage"], kind: "book", tier: "free", cost: 0, age: "adults" },
  { id: "b-soulmates", title: "Soulmates In Conflict", author: "Lateefah Adewunmi Jumah", cats: ["Love & Marriage"], kind: "book", tier: "free", cost: 0, age: "adults" },
  { id: "b-my-crush", title: "My Crush: Desires of the Heart", author: "Lateefah Adewunmi Jumah", cats: ["Love & Marriage"], kind: "book", tier: "free", cost: 0, age: "adults" },
  { id: "b-lpp", title: "Love, Pain, and Pandemonium", author: "Lateefah Adewunmi Jumah", cats: ["Love & Marriage", "Qisas"], kind: "book", tier: "free", cost: 0, age: "adults" },
  { id: "b-hot-water", title: "In Hot Water", author: "Lateefah Adewunmi Jumah", cats: ["Qisas"], kind: "book", tier: "free", cost: 0, age: "adults" },
  { id: "b-beginning-end", title: "The Beginning of an End", author: "Lateefah Adewunmi Jumah", cats: ["Qisas"], kind: "book", tier: "free", cost: 0, age: "adults" },
  { id: "b-freeloader", title: "The Freeloader", author: "Lateefah Adewunmi Jumah", cats: ["Qisas"], kind: "book", tier: "free", cost: 0, age: "adults" },
  { id: "b-girls-golden", title: "Girls Are Golden (Parts 1–3)", author: "Lateefah Adewunmi Jumah", cats: ["Youth & Growing Up", "Sisters' Corner"], kind: "book", tier: "free", cost: 0, age: "teens", audience: "female" },
  { id: "b-boys-heroes", title: "Boys Are Heroes", author: "Lateefah Adewunmi Jumah", cats: ["Youth & Growing Up", "Brothers' Corner"], kind: "book", tier: "free", cost: 0, age: "teens", audience: "male" },
  { id: "b-bbc", title: "Beauty, Brain and Character (Books 1–6)", author: "Lateefah Adewunmi Jumah", cats: ["Youth & Growing Up", "Qisas"], kind: "book", tier: "free", cost: 0, age: "teens" },
  { id: "b-ramadan-mirror", title: "Ramadan Mirror", author: "Lateefah Adewunmi Jumah", cats: ["Ramadan & Worship"], kind: "book", tier: "free", cost: 0, age: "teens" },
  { id: "b-strange", title: "Strange: An Explosive Insight on Strange Phenomenon", author: "Lateefah Adewunmi Jumah", cats: ["Science & Innovation"], kind: "book", tier: "free", cost: 0, age: "adults" },
];