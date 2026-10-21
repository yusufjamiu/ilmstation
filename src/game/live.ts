/* Things the IlmWorld admin controls from /admin/world, read live by every player
   (guests too): approved billboard adverts, the weekly best-home award and nasheeds. */

import type { Advert } from "./content";

export type AdRequest = {
  id: string;
  board: string;
  boardName: string;
  brand: string;
  headline: string;
  line: string;
  link?: string;
  /** a small banner picture (data URL) */
  imageUrl?: string;
  plan: "week" | "month";
  contact: string;
  from: string;
  fromName: string;
  status: "pending" | "approved" | "rejected";
  at: number;
  until?: number;
};
export type Award = {
  id: string;
  winner: string;
  home: string;
  note: string;
  week: string;
  at: number;
};
export type Nasheed = { id: string; title: string; artist: string; url: string; at: number };
export type Enquiry = {
  id: string;
  place: string;
  name: string;
  text: string;
  from: string;
  at: number;
  status: "open" | "answered";
  answer?: string;
};

/** Prices for a player's own advert on a billboard. */
export const AD_PRICES = {
  week: { days: 7, naira: 5000 },
  month: { days: 30, naira: 15000 },
};

async function fs() {
  const { db } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  return { db, ...f };
}

/** Approved adverts that are still running, by billboard id. */
export function watchAds(cb: (ads: Record<string, Advert>) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, query, where, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        query(collection(db, "city_ads"), where("status", "==", "approved")),
        (snap) => {
          const now = Date.now();
          const out: Record<string, Advert> = {};
          for (const d of snap.docs) {
            const a = d.data() as AdRequest;
            if (a.until && a.until < now) continue;
            out[a.board] = {
              brand: a.brand,
              headline: a.headline,
              line: a.line,
              bg: "#1f6f63",
              fg: "#fdf8ec",
              imageUrl: a.imageUrl,
              link: a.link,
            };
          }
          cb(out);
        },
        () => {},
      );
    })
    .catch(() => {});
  return () => {
    live = false;
    off();
  };
}

export async function requestAd(r: Omit<AdRequest, "id" | "status" | "at">) {
  const { db, collection, addDoc } = await fs();
  await addDoc(collection(db, "city_ads"), { ...r, status: "pending", at: Date.now() });
}

/** The latest best-home award. */
export function watchAward(cb: (a: Award | null) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, query, orderBy, limit, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        query(collection(db, "city_awards"), orderBy("at", "desc"), limit(1)),
        (snap) =>
          cb(snap.docs[0] ? ({ ...snap.docs[0].data(), id: snap.docs[0].id } as Award) : null),
        () => cb(null),
      );
    })
    .catch(() => {});
  return () => {
    live = false;
    off();
  };
}

/** Nasheeds the admin has uploaded (with permission from the munshids). */
export function watchNasheeds(cb: (n: Nasheed[]) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, query, orderBy, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        query(collection(db, "city_nasheeds"), orderBy("at", "desc")),
        (snap) => cb(snap.docs.map((d) => ({ ...(d.data() as Omit<Nasheed, "id">), id: d.id }))),
        () => cb([]),
      );
    })
    .catch(() => {});
  return () => {
    live = false;
    off();
  };
}

/** Your own questions to the MSSN, with the answers. */
export function watchMyEnquiries(uid: string, cb: (e: Enquiry[]) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, query, where, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        query(collection(db, "city_enquiries"), where("from", "==", uid)),
        (snap) =>
          cb(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Enquiry, "id">), id: d.id }))
              .sort((a, b) => b.at - a.at),
          ),
        () => cb([]),
      );
    })
    .catch(() => {});
  return () => {
    live = false;
    off();
  };
}

/* ---------------- sponsored quizzes with real prizes ----------------
   The admin sets a quiz at a masjid or a school class, with a cash prize from a sponsor.
   Players see the questions but never the answers: the answers are kept in an admin-only
   document, and the admin ranks the entries and pays the winners. */
export type SponsoredQuiz = {
  id: string;
  title: string;
  sponsor: string;
  /** the masjid or school (landmark id) */
  place: string;
  placeName: string;
  /** for a school: one class only (empty = every class) */
  cls?: string;
  /** naira for each winner */
  prize: number;
  winners: number;
  questions: { q: string; o: string[] }[];
  until: number;
  at: number;
  status: "open" | "closed";
};
export type SponsoredEntry = {
  uid: string;
  name: string;
  phone: string;
  picks: number[];
  at: number;
  paid?: boolean;
};

/** Open sponsored quizzes (still running). */
export function watchSponsored(cb: (q: SponsoredQuiz[]) => void) {
  let off = () => {};
  let live = true;
  fs()
    .then(({ db, collection, query, where, onSnapshot }) => {
      if (!live) return;
      off = onSnapshot(
        query(collection(db, "city_sponsored"), where("status", "==", "open")),
        (snap) => {
          const now = Date.now();
          cb(
            snap.docs
              .map((d) => ({ ...(d.data() as SponsoredQuiz), id: d.id }))
              .filter((q) => q.until > now),
          );
        },
        () => cb([]),
      );
    })
    .catch(() => {});
  return () => {
    live = false;
    off();
  };
}

/** Have I already entered this quiz? */
export async function myEntry(quiz: string, uid: string) {
  const { db, doc, getDoc } = await fs();
  const d = await getDoc(doc(db, "city_sponsored", quiz, "entries", uid));
  return d.exists() ? (d.data() as SponsoredEntry) : null;
}

/** Send my answers (once only). */
export async function enterSponsored(quiz: string, e: SponsoredEntry) {
  const { db, doc, setDoc } = await fs();
  await setDoc(doc(db, "city_sponsored", quiz, "entries", e.uid), e);
}
