import type { Gender } from "@/components/auth";
import type { Tier } from "@/components/premium";

export type Age = "kids" | "teens" | "adults";
export type Kind = "article" | "book";

export type LibraryItem = {
  minLevel?: number;
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
  /** Uploaded from the admin (saved in Firebase). */
  coverUrl?: string;
  pdfUrl?: string;
  audioStatus?: "available" | "soon" | "none";
  audio?: { title: string; url: string; mins?: number }[];
  comments?: boolean;
  status?: "draft" | "published";
  createdAt?: number;
};

export const CORNERS: Record<string, Gender> = { "Sisters' Corner": "female", "Brothers' Corner": "male" };

export const CATEGORIES = [
  "Aqeedah", "Hadith", "Seerah", "Fiqh", "Tafsir", "Arabic",
  "Heart & Growth", "Love & Marriage", "Qisas", "Youth & Growing Up",
  "Ramadan & Worship", "Science & Innovation", "Sisters' Corner", "Brothers' Corner",
];

export const LIBRARY: LibraryItem[] = [
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