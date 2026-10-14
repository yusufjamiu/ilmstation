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

const HOMES =
  "A quiet residential street. Look for TO LET signs on the gates for houses you can rent, and LAND FOR SALE boards for plots you can buy and build on.";

export type Street = { id: string; name: string; bio: string };
export const STREETS: Record<string, Street> = {
  ridwanjamiu: { id: "ridwanjamiu", name: "Imam Ridwan Jamiu Street", bio: COMING_SOON },
  alilory: {
    id: "alilory",
    name: "Sheikh Adam Abdullahi Al-Ilory Street",
    bio: "Sheikh Adam Abdullahi Al-Ilory was a Nigerian scholar and author who founded the Markaz Arabic and Islamic Training Centre, later based in Agege, Lagos. He wrote many books in Arabic and trained generations of teachers. He passed away in 1992. May Allah have mercy on him.",
  },
  adewuyi: { id: "adewuyi", name: "Sheikh Yusuf Adewuyi Street", bio: COMING_SOON },
  ahmadsad: { id: "ahmadsad", name: "Sheikh Ahmad Sad Street", bio: COMING_SOON },
  habeebadewuyi: { id: "habeebadewuyi", name: "Sheikh Habeeb Adewuyi Street", bio: COMING_SOON },
  najmudeen: { id: "najmudeen", name: "Sheikh Najmudeen Street", bio: COMING_SOON },
  // quiet residential streets
  amin: { id: "amin", name: "Al-Amin Close", bio: HOMES },
  salam: { id: "salam", name: "Salam Crescent", bio: HOMES },
  nur: { id: "nur", name: "Nur Avenue", bio: HOMES },
  barakah: { id: "barakah", name: "Barakah Close", bio: HOMES },
  hikmah: { id: "hikmah", name: "Hikmah Street", bio: HOMES },
  ihsan: { id: "ihsan", name: "Ihsan Close", bio: HOMES },
  rahmah: { id: "rahmah", name: "Rahmah Street", bio: HOMES },
  taqwa: { id: "taqwa", name: "Taqwa Close", bio: HOMES },
  sabr: { id: "sabr", name: "Sabr Avenue", bio: HOMES },
  // Ikorodu
  agbabiaka: { id: "agbabiaka", name: "Sheikh Dr Habeebullahi Agbabiaka Street", bio: COMING_SOON },
  devjaytech: {
    id: "devjaytech",
    name: "Techie Jamiu Adewuyi (Devjaytech) Street",
    bio: "Named after Jamiu Adewuyi (Devjaytech), the developer who built IlmStation, OutingStation and IlmCity. His offices are on this street.",
  },
  jabata: { id: "jabata", name: "Sheikh Alli Jabata Street", bio: COMING_SOON },
  najeeb: { id: "najeeb", name: "Imam Najeeb Street", bio: COMING_SOON },
  souq: {
    id: "souq",
    name: "Souq Road",
    bio: "The road through Ikorodu Market. Businesses rent stalls here and show their products to every player who walks by.",
  },
  ummah: { id: "ummah", name: "Ummah Close", bio: HOMES },
  iman: { id: "iman", name: "Iman Street", bio: HOMES },
  firdaus: { id: "firdaus", name: "Firdaus Close", bio: HOMES },
  huda: { id: "huda", name: "Huda Avenue", bio: HOMES },
  kaysanni: { id: "kaysanni", name: "Imam Kay Yusuf Sanni Street", bio: COMING_SOON },
  abdullateef: {
    id: "abdullateef",
    name: "Hon. Iyepe Dr. Abdul Hakeem Abdul Lateef Street",
    bio: COMING_SOON,
  },
  sakinah: { id: "sakinah", name: "Sakinah Close", bio: HOMES },
  tawfiq: { id: "tawfiq", name: "Tawfiq Street", bio: HOMES },
  rayyan: { id: "rayyan", name: "Rayyan Close", bio: HOMES },
  safa: { id: "safa", name: "Safa Street", bio: HOMES },
  kabir: { id: "kabir", name: "Sheikh Kabir Alasfar Street", bio: COMING_SOON },
  eleha: { id: "eleha", name: "Sheikh Imran Eleha Street", bio: COMING_SOON },
  ridwan: { id: "ridwan", name: "Ridwan Close", bio: HOMES },
  falah: { id: "falah", name: "Falah Street", bio: HOMES },
  amanah: { id: "amanah", name: "Amanah Close", bio: HOMES },
};

/* ---------------- areas ----------------
   To add an area: copy one block, give it streets (main street first, z = 0;
   a second street sits at z = -55) and landmarks placed along a street by x. */
export type LandmarkKind =
  "masjid" | "school" | "home" | "souq" | "campus" | "mansion" | "office" | "market";
export type Landmark = {
  id: string;
  kind: LandmarkKind;
  name: string;
  street: string;
  x: number;
  /** which side of the street: north (default) or south */
  side?: "n" | "s";
  /** width along the street and depth away from it (campus, mansion, office) */
  width?: number;
  depth?: number;
  /** classes in a school campus (or a Qur'an centre) */
  classes?: string[];
  /** only these subjects in its classes (default: all) */
  subjects?: string[];
  floors?: number;
  /** a short description for the info panel */
  about?: string;
  brand?: { color: number; accent: number; link?: string };
};
export type District = {
  id: string;
  name: string;
  state: string;
  /** Where the area sits on the one big Lagos map (world units, north is negative z). */
  origin: { x: number; z: number };
  /** The expressway that joins this area to the City Junction. */
  highway: string;
  lagoon?: boolean;
  /** half the area's size (default 112 × 100) */
  half?: { x: number; z: number };
  /** reached by road from this area instead of by its own expressway */
  parent?: string;
  /** which way the road runs from the parent area (default north) */
  link?: "north" | "east";
  /** the name of its bus stop */
  busStop?: string;
  /** share of empty plots that are shops and land (default 0.08 and 0.13) */
  shops?: number;
  land?: number;
  /** decor: palms, flower beds and flags along a beautified street */
  streets: { id: string; z: number; decor?: boolean }[];
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
    streets: [
      { id: "ridwanjamiu", z: 0 },
      { id: "amin", z: -66 },
    ],
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
    half: { x: 112, z: 140 },
    streets: [
      { id: "alilory", z: 0, decor: true },
      { id: "salam", z: -95 },
      { id: "nur", z: 95 },
    ],
    landmarks: [
      { id: "markaz", kind: "school", name: "Markaz Arabic School", street: "alilory", x: -32 },
      { id: "markaz-mosque", kind: "masjid", name: "Markaz Mosque", street: "alilory", x: 40 },
      {
        id: "adam-house",
        kind: "mansion",
        name: "House of Sheikh Adam Abdullahi Al-Ilory",
        street: "alilory",
        x: -35,
        side: "s",
        width: 44,
        depth: 44,
        floors: 3,
      },
      {
        id: "habeeb-adam-house",
        kind: "mansion",
        name: "House of Sheikh Habeeb Adam Al-Ilory",
        street: "alilory",
        x: 30,
        side: "s",
        width: 30,
        depth: 26,
        floors: 2,
      },
      {
        id: "thaoban-house",
        kind: "mansion",
        name: "House of Sheikh Thaoban",
        street: "alilory",
        x: 78,
        side: "s",
        width: 30,
        depth: 26,
        floors: 2,
      },
      {
        id: "abdullah-house",
        kind: "mansion",
        name: "House of Sheikh Abdullah",
        street: "alilory",
        x: 85,
        width: 26,
        depth: 26,
        floors: 2,
      },
    ],
  },
  {
    id: "ajegunle",
    name: "Ajegunle",
    state: "Lagos",
    origin: { x: -275, z: 375 },
    highway: "Apapa–Oshodi Expressway",
    half: { x: 112, z: 150 },
    streets: [
      { id: "adewuyi", z: 0, decor: true },
      { id: "ahmadsad", z: -100 },
      { id: "barakah", z: 100 },
    ],
    landmarks: [
      { id: "ibaadullah", kind: "masjid", name: "Ibaadullah Mosque", street: "adewuyi", x: -40 },
      {
        id: "ibaadullah-school",
        kind: "campus",
        name: "Ibaadullah School",
        street: "adewuyi",
        x: -35,
        side: "s",
        width: 48,
        depth: 44,
        floors: 2,
        classes: [
          "Primary 1",
          "Primary 2",
          "Primary 3",
          "Primary 4",
          "Primary 5",
          "Primary 6",
          "JSS 1",
          "JSS 2",
          "JSS 3",
        ],
        about:
          "Ibaadullah School on Sheikh Yusuf Adewuyi Street teaches the Qur'an, Arabic and Islamic studies with the school subjects.",
      },
      {
        id: "alaruf-house",
        kind: "mansion",
        name: "House of Sheikh Alaruf",
        street: "adewuyi",
        x: 30,
        width: 30,
        depth: 26,
        floors: 2,
      },
      {
        id: "mudeer-house",
        kind: "mansion",
        name: "The Mudeer's House",
        street: "adewuyi",
        x: 75,
        width: 30,
        depth: 26,
        floors: 2,
      },
      {
        id: "abubakr-house",
        kind: "mansion",
        name: "House of Sheikh Abubakr",
        street: "adewuyi",
        x: -85,
        width: 26,
        depth: 26,
        floors: 2,
      },
      {
        id: "ummusoffiyah-house",
        kind: "mansion",
        name: "House of Ummu Soffiyah",
        street: "adewuyi",
        x: 30,
        side: "s",
        width: 30,
        depth: 26,
        floors: 2,
      },
      {
        id: "habeeb-ajegunle-house",
        kind: "mansion",
        name: "House of Sheikh Habeeb Adewuyi",
        street: "adewuyi",
        x: 78,
        side: "s",
        width: 30,
        depth: 26,
        floors: 2,
      },
      { id: "as-sirat", kind: "school", name: "As-Sirat Schools", street: "ahmadsad", x: 30 },
    ],
  },
  {
    id: "ikorodu",
    name: "Ikorodu",
    state: "Lagos",
    origin: { x: 575, z: -425 },
    highway: "Ikorodu Road",
    busStop: "Igbe Laara",
    half: { x: 140, z: 170 },
    shops: 0.3,
    streets: [
      { id: "devjaytech", z: 0 },
      { id: "habeebadewuyi", z: -110 },
      { id: "agbabiaka", z: 110 },
    ],
    landmarks: [
      {
        id: "maktab",
        kind: "masjid",
        name: "Maktab (Saudi) Mosque",
        street: "habeebadewuyi",
        x: -40,
      },
      {
        id: "habeeb-house",
        kind: "mansion",
        name: "House of Sheikh Habeeb Adewuyi",
        street: "habeebadewuyi",
        x: 50,
        width: 48,
        depth: 34,
        floors: 3,
      },
      {
        id: "manaar-primary",
        kind: "campus",
        name: "Manaar International Primary School",
        street: "habeebadewuyi",
        x: -50,
        side: "s",
        width: 64,
        depth: 46,
        floors: 2,
        classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5"],
        about:
          "The primary building of Manaar International Schools: Qur'an, Arabic and Islamic studies alongside English, Mathematics and the other school subjects, Primary 1 to 5.",
      },
      {
        id: "manaar-college",
        kind: "campus",
        name: "Manaar International College",
        street: "habeebadewuyi",
        x: 52,
        side: "s",
        width: 64,
        depth: 50,
        floors: 3,
        classes: ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"],
        about:
          "The college building of Manaar International Schools, JSS 1 to SS 3: Islamic and Western education side by side.",
      },
      {
        id: "miqmep",
        kind: "office",
        name: "Manaar Qur'an Memorisation Programme (MIQMEP)",
        street: "habeebadewuyi",
        x: -102,
        width: 34,
        depth: 28,
        floors: 3,
        brand: { color: 0x1f6f63, accent: 0xfdf8ec },
        classes: ["Beginners", "Juz 'Amma", "Juz 1–10", "Juz 11–20", "Juz 21–30"],
        subjects: ["quran", "arabic", "tawheed"],
        about:
          "MIQMEP is Manaar's Qur'an memorisation programme. Students memorise with Tajweed in small halaqahs, from beginners to the full Qur'an.",
      },
      {
        id: "manaar-hajj",
        kind: "office",
        name: "Manaar Hajj & Umrah Company",
        street: "habeebadewuyi",
        x: 100,
        width: 30,
        depth: 26,
        floors: 2,
        brand: { color: 0x2a1c05, accent: 0xe6b84a },
        about:
          "Manaar Hajj & Umrah Company takes pilgrims from Lagos to Makkah and Madinah for Hajj and Umrah, with guidance on the rites before and during the journey.",
      },
      {
        id: "ilmstation",
        kind: "office",
        name: "IlmStation",
        street: "devjaytech",
        x: -48,
        width: 28,
        depth: 26,
        floors: 5,
        brand: { color: 0x1f6f63, accent: 0xe6b84a, link: "https://ilmstation.com" },
        about:
          "IlmStation is a learning app for Muslims: Qur'an, Islamic studies and quizzes with rewards. IlmCity is part of IlmStation.",
      },
      {
        id: "outingstation",
        kind: "office",
        name: "OutingStation",
        street: "devjaytech",
        x: 50,
        width: 28,
        depth: 26,
        floors: 4,
        brand: { color: 0xf2b84b, accent: 0x2a1c05, link: "https://outingstation.com" },
        about:
          "OutingStation helps you discover events, experiences, shortlets and rides near you. Made by OutingStation Limited.",
      },
      {
        id: "devjaytech-hq",
        kind: "office",
        name: "Devjaytech",
        street: "devjaytech",
        x: -36,
        side: "s",
        width: 24,
        depth: 24,
        floors: 3,
        brand: { color: 0x10201e, accent: 0x45b8a8 },
        about:
          "The office of Techie Jamiu Adewuyi (Devjaytech), the developer behind IlmStation, OutingStation and IlmCity.",
      },
      {
        id: "daarulquran-mosque",
        kind: "masjid",
        name: "Daarul Quran Mosque",
        street: "agbabiaka",
        x: 50,
      },
      {
        id: "daarulquran",
        kind: "campus",
        name: "Daarul Quran Madrasah",
        street: "agbabiaka",
        x: -44,
        width: 60,
        depth: 40,
        floors: 2,
        classes: ["Primary 1", "Primary 2", "Primary 3", "JSS 1", "JSS 2", "JSS 3"],
        about:
          "Daarul Quran Madrasah teaches Qur'an memorisation, Tajweed, Arabic and Islamic studies, with English and Mathematics.",
      },
      {
        id: "agbabiaka-house",
        kind: "mansion",
        name: "House of Sheikh Dr Habeebullahi Agbabiaka",
        street: "agbabiaka",
        x: -44,
        side: "s",
        width: 46,
        depth: 32,
        floors: 3,
      },
    ],
  },
  {
    id: "agric",
    name: "Agric",
    state: "Lagos",
    origin: { x: 575, z: -735 },
    highway: "Ikorodu Road",
    parent: "ikorodu",
    busStop: "Agric",
    half: { x: 112, z: 110 },
    shops: 0.3,
    land: 0.25,
    streets: [
      { id: "jabata", z: 0 },
      { id: "ummah", z: -66 },
      { id: "iman", z: 66 },
    ],
    landmarks: [
      {
        id: "jabata-mosque",
        kind: "masjid",
        name: "Sheikh Alli Jabata Mosque",
        street: "jabata",
        x: -40,
      },
      {
        id: "jabata-house",
        kind: "mansion",
        name: "House of Sheikh Alli Jabata",
        street: "jabata",
        x: -42,
        side: "s",
        width: 44,
        depth: 30,
        floors: 2,
      },
    ],
  },
  {
    id: "secondgate",
    name: "Second Gate",
    state: "Lagos",
    origin: { x: 575, z: -975 },
    highway: "Ikorodu Road",
    parent: "agric",
    busStop: "Second Gate",
    half: { x: 112, z: 110 },
    shops: 0.25,
    land: 0.22,
    streets: [
      { id: "najeeb", z: 0 },
      { id: "firdaus", z: -66 },
      { id: "huda", z: 66 },
    ],
    landmarks: [
      { id: "banualli-mosque", kind: "masjid", name: "Banu Alli Mosque", street: "najeeb", x: -40 },
      {
        id: "banualli",
        kind: "campus",
        name: "Banu Alli School",
        street: "najeeb",
        x: -40,
        side: "s",
        width: 58,
        depth: 40,
        floors: 2,
        classes: [
          "Primary 1",
          "Primary 2",
          "Primary 3",
          "Primary 4",
          "Primary 5",
          "Primary 6",
          "JSS 1",
          "JSS 2",
          "JSS 3",
        ],
        about:
          "Banu Alli School gives children a strong Islamic and Western education on Imam Najeeb Street.",
      },
    ],
  },
  {
    id: "market",
    name: "Ikorodu Market",
    state: "Lagos",
    origin: { x: 575, z: -1215 },
    highway: "Ikorodu Road",
    parent: "secondgate",
    busStop: "Ikorodu Market",
    half: { x: 112, z: 100 },
    streets: [{ id: "souq", z: 0 }],
    landmarks: [
      { id: "souq-ikorodu", kind: "market", name: "Ikorodu Market", street: "souq", x: 0 },
    ],
  },
  {
    id: "egbeda",
    name: "Egbeda",
    state: "Lagos",
    origin: { x: -560, z: -195 },
    highway: "Egbeda–Idimu Road",
    streets: [
      { id: "najmudeen", z: 0 },
      { id: "rahmah", z: -66 },
      { id: "taqwa", z: 63 },
    ],
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
  {
    id: "badore",
    name: "Badore",
    state: "Lagos",
    origin: { x: 689, z: 450 },
    highway: "Ajah–Badore Road",
    parent: "lekki",
    link: "east",
    busStop: "Badore",
    lagoon: true,
    shops: 0.2,
    land: 0.2,
    streets: [
      { id: "kabir", z: 0, decor: true },
      { id: "ridwan", z: -66 },
    ],
    landmarks: [
      {
        id: "alasfar-mosque",
        kind: "masjid",
        name: "Sheikh Kabir Alasfar Mosque",
        street: "kabir",
        x: -40,
      },
      {
        id: "alasfar-house",
        kind: "mansion",
        name: "House of Sheikh Kabir Alasfar",
        street: "kabir",
        x: 40,
        side: "s",
        width: 40,
        depth: 30,
        floors: 3,
      },
    ],
  },
  {
    id: "powerline",
    name: "Powerline",
    state: "Lagos",
    origin: { x: -560, z: -425 },
    highway: "Isheri–Igando Road",
    parent: "egbeda",
    busStop: "Powerline",
    shops: 0.2,
    land: 0.2,
    streets: [
      { id: "eleha", z: 0, decor: true },
      { id: "falah", z: -66 },
      { id: "amanah", z: 66 },
    ],
    landmarks: [
      {
        id: "daarunnaim-mosque",
        kind: "masjid",
        name: "Daarul Na'im Central Mosque",
        street: "eleha",
        x: -40,
      },
      {
        id: "daarunnaim-school",
        kind: "campus",
        name: "Daarul Na'im School",
        street: "eleha",
        x: -40,
        side: "s",
        width: 52,
        depth: 40,
        floors: 2,
        classes: [
          "Primary 1",
          "Primary 2",
          "Primary 3",
          "Primary 4",
          "Primary 5",
          "Primary 6",
          "JSS 1",
          "JSS 2",
          "JSS 3",
        ],
        about:
          "Daarul Na'im School on Sheikh Imran Eleha Street, beside Daarul Na'im Central Mosque.",
      },
      {
        id: "eleha-house",
        kind: "mansion",
        name: "House of Sheikh Imran Eleha",
        street: "eleha",
        x: 50,
        width: 40,
        depth: 28,
        floors: 3,
      },
    ],
  },
  {
    id: "okeeletu",
    name: "Oke Eletu",
    state: "Lagos",
    origin: { x: 887, z: -425 },
    highway: "Ikorodu–Ijede Road",
    parent: "ikorodu",
    link: "east",
    busStop: "Oke Eletu",
    shops: 0.22,
    land: 0.2,
    streets: [
      { id: "kaysanni", z: 0, decor: true },
      { id: "sakinah", z: -66 },
      { id: "tawfiq", z: 66 },
    ],
    landmarks: [
      { id: "alfaoz-mosque", kind: "masjid", name: "Alfaoz Mosque", street: "kaysanni", x: -40 },
      {
        id: "alfaoz-madrasah",
        kind: "campus",
        name: "Alfaoz Madrasah",
        street: "kaysanni",
        x: -40,
        side: "s",
        width: 52,
        depth: 40,
        floors: 2,
        classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"],
        about:
          "Alfaoz Madrasah on Imam Kay Yusuf Sanni Street teaches Qur'an, Arabic and Islamic studies.",
      },
      {
        id: "alfaoz-counselling",
        kind: "office",
        name: "Alfaoz Counselling Home",
        street: "kaysanni",
        x: 50,
        width: 32,
        depth: 26,
        floors: 2,
        brand: { color: 0x5a7f8f, accent: 0xfdf8ec },
        about:
          "A quiet, private place for advice and counselling for individuals, couples and families, guided by Islamic teaching. Everything said here stays here.",
      },
    ],
  },
  {
    id: "ikeja",
    name: "Ikeja",
    state: "Lagos",
    origin: { x: 130, z: -470 },
    highway: "Ikeja–Ojodu Road",
    busStop: "Ojodu",
    shops: 0.22,
    streets: [
      { id: "abdullateef", z: 0, decor: true },
      { id: "rayyan", z: -66 },
      { id: "safa", z: 66 },
    ],
    landmarks: [
      {
        id: "abdullateef-mosque",
        kind: "masjid",
        name: "Dr. Abdul Hakeem Abdul Lateef Mosque",
        street: "abdullateef",
        x: -40,
      },
      {
        id: "markaz-abdullateef",
        kind: "office",
        name: "Markaz Abdullateef",
        street: "abdullateef",
        x: 50,
        width: 34,
        depth: 28,
        floors: 3,
        brand: { color: 0x1f6f63, accent: 0xe6b84a },
        classes: ["Beginners", "Juz 'Amma", "Juz 1–10", "Juz 11–20", "Juz 21–30"],
        subjects: ["quran", "arabic", "tawheed"],
        about:
          "Markaz Abdullateef is a centre for Qur'an memorisation, from beginners to the full Qur'an.",
      },
      {
        id: "abdullateef-house",
        kind: "mansion",
        name: "House of Hon. Dr. Abdul Hakeem Abdul Lateef",
        street: "abdullateef",
        x: -42,
        side: "s",
        width: 44,
        depth: 32,
        floors: 3,
      },
      {
        id: "abdullateef-hajj",
        kind: "office",
        name: "Abdul Lateef Hajj & Umrah Tours",
        street: "abdullateef",
        x: 48,
        side: "s",
        width: 30,
        depth: 26,
        floors: 2,
        brand: { color: 0x2a1c05, accent: 0xe6b84a },
        about: "Hajj and Umrah packages from Lagos to Makkah and Madinah.",
      },
    ],
  },
];
export const districtById = (id: string) => DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
export const halfOf = (d: District) => d.half ?? { x: 112, z: 100 };
/** "Agric, Ikorodu" or "Badore, Lekki" for areas reached through another area. */
export const rootOf = (d: District): District => (d.parent ? rootOf(districtById(d.parent)) : d);
export const fullName = (d: District) => (d.parent ? `${d.name}, ${rootOf(d).name}` : d.name);
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

// two more boards in each area and three along each road into it
for (const d of DISTRICTS) {
  for (let k = 1; k <= 2; k++)
    BILLBOARDS.push({
      id: `${d.id}-street-${k}`,
      name: `${d.name} Street Board ${k}`,
      district: d.id,
    });
  for (let k = 1; k <= 3; k++)
    BILLBOARDS.push({
      id: `${d.id}-road-${k}`,
      name: `${d.highway} Board ${k}`,
      district: "road:" + d.id,
    });
}

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
    id: "alasfar-morning",
    mosque: "alasfar-mosque",
    title: "Tafsir with Sheikh Kabir Alasfar",
    speaker: "Sheikh Kabir Alasfar",
    start: "10:00",
    minutes: 60,
  },
  {
    id: "alasfar-evening",
    mosque: "alasfar-mosque",
    title: "Evening admonition (Wa'z)",
    speaker: "Sheikh Kabir Alasfar",
    start: "20:30",
    minutes: 45,
  },
  {
    id: "daarunnaim-fiqh",
    mosque: "daarunnaim-mosque",
    title: "Lessons in Fiqh",
    speaker: "Guest Imam",
    start: "16:30",
    minutes: 45,
  },
  {
    id: "daarulquran-tafsir",
    mosque: "daarulquran-mosque",
    title: "Tafsir of Juz 'Amma",
    speaker: "Guest Imam",
    start: "16:45",
    minutes: 45,
  },
  {
    id: "jabata-fiqh",
    mosque: "jabata-mosque",
    title: "Fiqh of Purification",
    speaker: "Guest Imam",
    start: "10:30",
    minutes: 45,
  },
  {
    id: "banualli-seerah",
    mosque: "banualli-mosque",
    title: "Stories of the Prophets",
    speaker: "Guest Imam",
    start: "17:15",
    minutes: 40,
  },
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

/* ---------------- passers-by ----------------
   Short, well-known authentic narrations a neighbour may share when you ask. */
export const REMINDERS: { text: string; source: string }[] = [
  { text: "Smiling in the face of your brother is charity.", source: "Tirmidhi" },
  { text: "The best of you are those who learn the Quran and teach it.", source: "Bukhari" },
  {
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Bukhari and Muslim",
  },
  {
    text: "Whoever believes in Allah and the Last Day, let him say what is good or keep silent.",
    source: "Bukhari and Muslim",
  },
  {
    text: "The strong person is not the one who wrestles others down, but the one who controls himself when angry.",
    source: "Bukhari",
  },
  { text: "Make things easy and do not make them difficult.", source: "Bukhari" },
  {
    text: "Whoever takes a path seeking knowledge, Allah makes easy for him a path to Paradise.",
    source: "Muslim",
  },
  {
    text: "Shall I not tell you something that, if you do it, you will love one another? Spread the salam among you.",
    source: "Muslim",
  },
  {
    text: "The deeds most loved by Allah are those done regularly, even if they are small.",
    source: "Bukhari and Muslim",
  },
  {
    text: "Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.",
    source: "Muslim",
  },
];

/** What neighbours say about their day. */
export const SMALL_TALK = [
  "Alhamdulillah, I'm well. Just coming back from the market.",
  "Alhamdulillah. I'm going to pick up my children from the madrasah.",
  "Alhamdulillah, everything is fine. This traffic sha!",
  "Alhamdulillah. I'm on my way to visit my mother.",
  "Alhamdulillah. Business is moving, by Allah's grace.",
  "I'm fine, alhamdulillah. Have you seen the new houses for rent on this street?",
  "Alhamdulillah. I just finished my Quran revision for today.",
];

/* ---------------- houses and land ----------------
   Prices in points (earned slowly) or naira (paid with Paystack). Rent you collect
   from tenants is paid in points and cannot be withdrawn. */
export const ECONOMY = {
  rent: {
    week: { days: 7, points: 150, naira: 1500 },
    month: { days: 30, points: 500, naira: 5000 },
  },
  land: { points: 2000, naira: 20000 },
  build: {
    1: { name: "Bungalow", points: 1500, naira: 15000, minutes: 2, tenantPerDay: 10 },
    2: { name: "Duplex", points: 3000, naira: 30000, minutes: 4, tenantPerDay: 20 },
    3: { name: "Storey building", points: 5000, naira: 50000, minutes: 6, tenantPerDay: 35 },
  } as Record<
    number,
    { name: string; points: number; naira: number; minutes: number; tenantPerDay: number }
  >,
};
export const TENANTS = [
  "Brother Kabir's family",
  "Sister Halimah",
  "Mallam Usman and family",
  "Brother Rasheed",
  "The Adeyemi family",
  "Sister Fatimah and her children",
];

/* ---------------- shops and market stalls ---------------- */
export const SHOP_PRICES = {
  shop: {
    week: { days: 7, points: 200, naira: 2000 },
    month: { days: 30, points: 700, naira: 7000 },
  },
  /** market stalls are paid in naira with Paystack */
  stall: { week: { days: 7, naira: 2000 } },
};
/** Traders already selling in Ikorodu Market (every third stall). */
export const MARKET_TRADERS: { name: string; items: [string, string, string][] }[] = [
  {
    name: "Mama Aisha Dates",
    items: [
      ["🌴", "Ajwa dates", "₦4,500"],
      ["🍯", "Pure honey", "₦3,000"],
    ],
  },
  {
    name: "Barakah Books",
    items: [
      ["📗", "Mushaf (Qur'an)", "₦6,000"],
      ["📚", "Islamic storybooks", "₦2,500"],
    ],
  },
  {
    name: "Al-Noor Perfumes",
    items: [
      ["🧴", "Oud oil", "₦5,000"],
      ["🌸", "White musk", "₦2,000"],
    ],
  },
  {
    name: "Sister Halimah Abayas",
    items: [
      ["👗", "Abaya", "₦18,000"],
      ["🧕", "Jersey hijab", "₦3,500"],
    ],
  },
  {
    name: "Iya Basira Foodstuff",
    items: [
      ["🍚", "Rice (5kg)", "₦9,000"],
      ["🫘", "Beans (paint)", "₦7,500"],
    ],
  },
  {
    name: "Prayer Mat Corner",
    items: [
      ["🕌", "Prayer mat", "₦6,500"],
      ["📿", "Tasbih", "₦1,000"],
    ],
  },
  {
    name: "Fresh Fruits",
    items: [
      ["🍉", "Watermelon", "₦2,500"],
      ["🍌", "Banana (bunch)", "₦1,500"],
    ],
  },
  {
    name: "Phone Gadgets",
    items: [
      ["📱", "Phone case", "₦2,000"],
      ["🔌", "Fast charger", "₦4,000"],
    ],
  },
];

/* ---------------- your home ---------------- */
export type HomeItem = { id: string; name: string; icon: string; naira: number; does: string };
/** Furniture for your flat. Points price = naira ÷ 10. */
export const HOME_ITEMS: HomeItem[] = [
  { id: "prayermat", name: "Prayer mat", icon: "🕌", naira: 100, does: "Pray at home" },
  { id: "rug", name: "Rug", icon: "🟥", naira: 100, does: "A warm floor" },
  { id: "fan", name: "Standing fan", icon: "🌀", naira: 100, does: "Cool air" },
  { id: "curtains", name: "Curtains", icon: "🪟", naira: 100, does: "Privacy" },
  { id: "clock", name: "Wall clock", icon: "🕰️", naira: 100, does: "Never miss salah" },
  {
    id: "bookshelf",
    name: "Bookshelf and Qur'an",
    icon: "📖",
    naira: 200,
    does: "Read the Qur'an at home",
  },
  { id: "radio", name: "Radio", icon: "📻", naira: 200, does: "Listen to lectures at home" },
  { id: "table", name: "Dining table", icon: "🍽️", naira: 200, does: "Eat with family" },
  { id: "wardrobe", name: "Wardrobe", icon: "🚪", naira: 200, does: "Keep your clothes" },
  {
    id: "kitchen",
    name: "Kitchen and cooker",
    icon: "🍳",
    naira: 500,
    does: "Cook and eat at home",
  },
  { id: "fridge", name: "Fridge", icon: "🧊", naira: 500, does: "Food stays fresh" },
  { id: "sofa", name: "Sofa", icon: "🛋️", naira: 500, does: "Rest and receive guests" },
];
export const itemPoints = (i: HomeItem) => i.naira / 10;

/* ---------------- a Muslim's day ---------------- */
export const DAY_TASKS: { id: string; text: string; hint: string }[] = [
  { id: "wake", text: "Say the du'a for waking up", hint: "Open My Day → Morning adhkar" },
  { id: "adhkarM", text: "Morning adhkar", hint: "Before Dhuhr" },
  { id: "wudu", text: "Make wudu", hint: "Bathroom at home, or the masjid" },
  { id: "salah", text: "Pray the prayers on time", hint: "Each prayer counts" },
  {
    id: "eat",
    text: "Eat a halal meal (say Bismillah)",
    hint: "Cook at home or buy food at a market",
  },
  { id: "market", text: "Visit a market", hint: "Every area has one" },
  { id: "learn", text: "Learn something", hint: "Lecture, mosque quiz or a class" },
  { id: "salam", text: "Greet 3 people with salam", hint: "Talk to neighbours or players" },
  { id: "quran", text: "Read the Qur'an", hint: "At home or in the masjid" },
  { id: "adhkarE", text: "Evening adhkar", hint: "After Asr" },
  { id: "sleep", text: "Sleep early after Isha", hint: "Your bed at home" },
];
export const TASK_POINTS = 3;
export const DAY_BONUS = 20;

/** Adhkar for morning and evening, with how many times each is said. */
export const ADHKAR: Record<
  "wake" | "morning" | "evening" | "sleep",
  { ar: string; en: string; times: number; src: string }[]
> = {
  wake: [
    {
      ar: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
      en: "All praise is for Allah who gave us life after causing us to die, and to Him is the return.",
      times: 1,
      src: "Bukhari",
    },
  ],
  morning: [
    {
      ar: "Ayat al-Kursi (Al-Baqarah 2:255)",
      en: "Allah — there is no god except Him, the Ever-Living, the Sustainer of all existence…",
      times: 1,
      src: "Qur'an",
    },
    {
      ar: "Surah Al-Ikhlas, Al-Falaq and An-Nas",
      en: "The three protecting surahs.",
      times: 3,
      src: "Abu Dawud, Tirmidhi",
    },
    {
      ar: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa huwas-sami'ul-'alim",
      en: "In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the All-Hearing, the All-Knowing.",
      times: 3,
      src: "Abu Dawud, Tirmidhi",
    },
    {
      ar: "SubhanAllahi wa bihamdihi",
      en: "Glory be to Allah and praise be to Him.",
      times: 100,
      src: "Muslim",
    },
  ],
  evening: [
    {
      ar: "Ayat al-Kursi (Al-Baqarah 2:255)",
      en: "Allah — there is no god except Him, the Ever-Living, the Sustainer of all existence…",
      times: 1,
      src: "Qur'an",
    },
    {
      ar: "Surah Al-Ikhlas, Al-Falaq and An-Nas",
      en: "The three protecting surahs.",
      times: 3,
      src: "Abu Dawud, Tirmidhi",
    },
    {
      ar: "A'udhu bikalimatillahit-tammati min sharri ma khalaq",
      en: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
      times: 3,
      src: "Muslim",
    },
  ],
  sleep: [
    {
      ar: "Bismika Allahumma amutu wa ahya",
      en: "In Your name, O Allah, I die and I live.",
      times: 1,
      src: "Bukhari",
    },
  ],
};

/** The steps of wudu, in order. */
export const WUDU_STEPS: { name: string; how: string; times: number }[] = [
  {
    name: "Intention and Bismillah",
    how: "Make the intention in your heart and say Bismillah.",
    times: 1,
  },
  { name: "Wash your hands", how: "Wash both hands up to the wrists.", times: 3 },
  { name: "Rinse your mouth", how: "Take water into your mouth and rinse it.", times: 3 },
  { name: "Rinse your nose", how: "Sniff water into the nose and blow it out.", times: 3 },
  { name: "Wash your face", how: "From the hairline to the chin, ear to ear.", times: 3 },
  {
    name: "Wash your right arm",
    how: "From the fingertips up to and including the elbow.",
    times: 3,
  },
  {
    name: "Wash your left arm",
    how: "From the fingertips up to and including the elbow.",
    times: 3,
  },
  {
    name: "Wipe your head",
    how: "Wet hands from the front of the head to the back and return.",
    times: 1,
  },
  {
    name: "Wipe your ears",
    how: "Inside with the index fingers, behind with the thumbs.",
    times: 1,
  },
  {
    name: "Wash your right foot",
    how: "Up to and including the ankle, between the toes.",
    times: 3,
  },
  {
    name: "Wash your left foot",
    how: "Up to and including the ankle, between the toes.",
    times: 3,
  },
  {
    name: "The du'a after wudu",
    how: "Ash-hadu an la ilaha illallah wahdahu la sharika lah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh. (Muslim)",
    times: 1,
  },
];
