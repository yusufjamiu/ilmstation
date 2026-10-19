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

const MSSN_ST =
  "The Muslim students' road on campus: the central mosque, the MSSN secretariat, the sports field and the meeting point where brothers and sisters gist, plan programmes and remind one another.";

export type Street = { id: string; name: string; bio: string };
const ILORIN_ST =
  "A street in Ilorin, Kwara State: the city of scholars, known for its Islamic learning.";
export const STREETS: Record<string, Street> = {
  ibrahimkhalil: {
    id: "ibrahimkhalil",
    name: "Ibrahim Al-Khalil Road",
    bio: "The road from the south up to Al-Masjid Al-Haram, lined with hotels for pilgrims.",
  },
  ajyad: {
    id: "ajyad",
    name: "Ajyad Street",
    bio: "Hotels and shops a short walk from the Haram.",
  },
  aziziyahroad: {
    id: "aziziyahroad",
    name: "Aziziyah Road",
    bio: "Where many pilgrims stay, between the Haram and Mina.",
  },
  masjidalkhayf: {
    id: "masjidalkhayf",
    name: "Al-Khayf Street",
    bio: "A street of hotels and eateries in Aziziyah.",
  },
  mina: {
    id: "mina",
    name: "Mina Road",
    bio: "The road out to Mina, where pilgrims stay during Hajj.",
  },
  jamaratroad: {
    id: "jamaratroad",
    name: "Jamarat Road",
    bio: "The road through Mina to the Jamarat, where pilgrims stone the three pillars.",
  },
  minatents: {
    id: "minatents",
    name: "Tent City Street",
    bio: "Rows of white tents where pilgrims stay in Mina during the days of Hajj.",
  },
  khayf: {
    id: "khayf",
    name: "Masjid Al-Khayf Street",
    bio: "By Masjid Al-Khayf, where many Prophets prayed.",
  },
  arafatroad: {
    id: "arafatroad",
    name: "Arafat Road",
    bio: "Across the plain of Arafat to Jabal ar-Rahmah.",
  },
  namirah: {
    id: "namirah",
    name: "Namirah Street",
    bio: "By Masjid Namirah, where the khutbah of Arafat is given.",
  },
  muzdalifah: {
    id: "muzdalifah",
    name: "Muzdalifah Road",
    bio: "Muzdalifah, where pilgrims spend the night and gather pebbles.",
  },
  jeddahairportroad: {
    id: "jeddahairportroad",
    name: "Airport Road, Jeddah",
    bio: "The road to King Abdulaziz International Airport.",
  },
  jeddahcargo: {
    id: "jeddahcargo",
    name: "Hajj Terminal Road",
    bio: "Shops and eateries for travellers.",
  },
  kingfaisal: {
    id: "kingfaisal",
    name: "King Faisal Road",
    bio: "The ring road around Al-Masjid An-Nabawi, lined with hotels.",
  },
  abudharr: {
    id: "abudharr",
    name: "Abu Dharr Street",
    bio: "Hotels, dates and perfume shops near the Prophet's Mosque.",
  },
  qubaroad: {
    id: "qubaroad",
    name: "Quba Road",
    bio: "The road from the Prophet's Mosque to Masjid Quba, walked by the Prophet ﷺ every Saturday.",
  },
  awali: {
    id: "awali",
    name: "Al-Awali Street",
    bio: "Date farms and homes on the south side of Madinah.",
  },
  uhud: { id: "uhud", name: "Uhud Road", bio: "The road north towards Mount Uhud." },
  madinahairportroad: {
    id: "madinahairportroad",
    name: "Airport Road, Madinah",
    bio: "The road to Prince Mohammad bin Abdulaziz Airport.",
  },
  madinahcargo: {
    id: "madinahcargo",
    name: "Airport Market Road",
    bio: "Shops and eateries for travellers.",
  },
  onikijipa: {
    id: "onikijipa",
    name: "Mufti Sheikh Sulaiman Farooq Onikijipa Street",
    bio: COMING_SOON,
  },
  alaro: { id: "alaro", name: "Sheikh Prof. AbdulMajeed Alaro Street", bio: COMING_SOON },
  lafiaji: { id: "lafiaji", name: "Dr. Sanusi Lafiaji Street", bio: COMING_SOON },
  emirsroad: {
    id: "emirsroad",
    name: "Emir's Road",
    bio: "The road to the palace of the Emir of Ilorin and the Ilorin Central Mosque, in the old heart of the city.",
  },
  ojaoba: {
    id: "ojaoba",
    name: "Oja-Oba Road",
    bio: "Beside Oja-Oba, the old king's market of Ilorin, near the Emir's palace.",
  },
  okelele: { id: "okelele", name: "Okelele Road", bio: ILORIN_ST },
  unilorinroad: {
    id: "unilorinroad",
    name: "University Road (Unilorin)",
    bio: "The main road through the University of Ilorin, past the faculties.",
  },
  mssnunilorin: { id: "mssnunilorin", name: "MSSN Avenue (Unilorin)", bio: MSSN_ST },
  tankeroad: {
    id: "tankeroad",
    name: "Tanke Road",
    bio: "Student lodges, eateries and cyber cafés outside the University of Ilorin.",
  },
  faterd: { id: "faterd", name: "Fate Road", bio: ILORIN_ST },
  gra: {
    id: "gra",
    name: "GRA Road",
    bio: "Big houses behind high walls in the Government Reserved Area.",
  },
  airportrd: {
    id: "airportrd",
    name: "Airport Road",
    bio: "The road out to Ilorin International Airport.",
  },
  adewoleroad: { id: "adewoleroad", name: "Adewole Road", bio: ILORIN_ST },
  hikmahroad: {
    id: "hikmahroad",
    name: "Al-Hikmah Road",
    bio: "The road to Al-Hikmah University, Adewole.",
  },
  asadamroad: { id: "asadamroad", name: "Asa Dam Road", bio: ILORIN_ST },
  taiworoad: {
    id: "taiworoad",
    name: "Ibrahim Taiwo Road",
    bio: "Ilorin's busy business road: banks, shops and offices near the Post Office.",
  },
  ahmadubello: { id: "ahmadubello", name: "Ahmadu Bello Way", bio: ILORIN_ST },
  sulugambari: { id: "sulugambari", name: "Sulu Gambari Road", bio: ILORIN_ST },
  gaaakanbi: { id: "gaaakanbi", name: "Gaa-Akanbi Road", bio: ILORIN_ST },
  sangoroad: { id: "sangoroad", name: "Sango Road", bio: ILORIN_ST },
  mmiaroad: {
    id: "mmiaroad",
    name: "Airport Road, Ikeja",
    bio: "The road to Murtala Muhammed International Airport.",
  },
  mmiacargo: {
    id: "mmiacargo",
    name: "Cargo Road",
    bio: "Behind the airport: shops, eateries and offices for travellers.",
  },
  ilorinairportroad: {
    id: "ilorinairportroad",
    name: "Airport Road, Ilorin",
    bio: "The road to Ilorin International Airport.",
  },
  ilorincargo: { id: "ilorincargo", name: "Airport Cargo Road", bio: ILORIN_ST },
  offaroad: {
    id: "offaroad",
    name: "Offa Garage Road",
    bio: "Where the motor parks and mechanics are, and kekes wait for passengers.",
  },
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
    bio: "Named after Jamiu Adewuyi (Devjaytech), the developer who built IlmStation, OutingStation and IlmWorld. His offices are on this street.",
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
  shukr: { id: "shukr", name: "Shukr Street (new layout)", bio: HOMES },
  rida: { id: "rida", name: "Rida Close (new layout)", bio: HOMES },
  // university areas
  unilagroad: {
    id: "unilagroad",
    name: "University Road, Akoka",
    bio: "The road into the University of Lagos (UNILAG) at Akoka. Faculties line the road; the MSSN mosque, field and meeting point are on MSSN Avenue behind them.",
  },
  lasuroad: {
    id: "lasuroad",
    name: "LASU Road, Ojo",
    bio: "The road into Lagos State University (LASU) at Ojo, off the Lagos–Badagry Expressway.",
  },
  lasustechroad: {
    id: "lasustechroad",
    name: "LASUSTECH Road, First Gate",
    bio: "The road into Lagos State University of Science and Technology (LASUSTECH) at First Gate, Ikorodu.",
  },
  mssnunilag: { id: "mssnunilag", name: "MSSN Avenue (UNILAG)", bio: MSSN_ST },
  mssnlasu: { id: "mssnlasu", name: "MSSN Avenue (LASU)", bio: MSSN_ST },
  mssnlasustech: { id: "mssnlasustech", name: "MSSN Avenue (LASUSTECH)", bio: MSSN_ST },
  yaqeen: { id: "yaqeen", name: "Yaqeen Close", bio: HOMES },
  ilm: { id: "ilm", name: "Ilm Street", bio: HOMES },
  ikhlas: { id: "ikhlas", name: "Ikhlas Avenue", bio: HOMES },
};

/* ---------------- areas ----------------
   To add an area: copy one block, give it streets (main street first, z = 0;
   a second street sits at z = -55) and landmarks placed along a street by x. */
export type LandmarkKind =
  | "masjid"
  | "school"
  | "home"
  | "souq"
  | "campus"
  | "mansion"
  | "office"
  | "market"
  /** a university lecture building: entering it means you are in class */
  | "faculty"
  /** a sports field */
  | "field"
  /** a covered meeting point with mats where students sit and gist */
  | "hangout"
  /** the city's airport: fly to another city */
  | "airport"
  /** Al-Masjid Al-Haram with the Kaaba, Maqam Ibrahim, Zamzam and Safa and Marwah */
  | "haram"
  /** Al-Masjid An-Nabawi with the Green Dome */
  | "nabawi"
  /** the Jamarat bridge in Mina with its three pillars */
  | "jamarat"
  /** Jabal ar-Rahmah, the Mount of Mercy on Arafat */
  | "rahmah"
  /** a clock tower (Madinah) */
  | "clocktower";
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
  /** the town this area's bus stops belong to (e.g. Ikorodu), on the entrance area */
  region?: string;
  /** reached by road from this area instead of by its own expressway */
  parent?: string;
  /** which way the road runs from the parent area (default north) */
  link?: "north" | "east";
  /** the name of its bus stop */
  busStop?: string;
  /** share of empty plots that are shops and land (default 0.08 and 0.13) */
  shops?: number;
  land?: number;
  /** how built-up and how rich the area looks: 1 = Lekki and Ikeja, 4 = Ajegunle */
  tier?: 1 | 2 | 3 | 4;
  /** share of houses that are to let (default 0.3) */
  toLet?: number;
  /** decor: palms, flower beds and flags along a beautified street; land and toLet
      override the area's shares on that street */
  streets: { id: string; z: number; decor?: boolean; land?: number; toLet?: number }[];
  landmarks: Landmark[];
  /** the city this area is in (default Lagos); each city is its own map */
  city?: string;
  /** Makkah and Madinah: no football pitch, police station or sisters' corner */
  holy?: boolean;
  /** a walled university campus behind the main road, entered through a named gate */
  campus?: { gate: string; z: number };
};

/** A university area: faculties on the main road, and the MSSN mosque, secretariat,
    field and meeting point on MSSN Avenue behind them. */
function universityArea(o: {
  id: string;
  name: string;
  uni: string;
  short: string;
  origin: { x: number; z: number };
  highway: string;
  busStop: string;
  parent?: string;
  road: string;
  avenue: string;
  homes: string;
  faculties: string[];
  about: string;
  state?: string;
  city?: string;
  region?: string;
  /** the name on the gate, e.g. UNIVERSITY OF LAGOS */
  gate?: string;
  /** more places in the area */
  extra?: Landmark[];
}): District {
  // the faculties face MSSN Avenue, inside the campus wall; the main road outside is town
  const fx = [-112, -24, 26, 70];
  return {
    id: o.id,
    name: o.name,
    state: o.state ?? "Lagos",
    city: o.city,
    region: o.region,
    origin: o.origin,
    highway: o.highway,
    busStop: o.busStop,
    parent: o.parent,
    half: { x: 140, z: 140 },
    tier: 2,
    toLet: 0.5,
    shops: 0.3,
    land: 0.12,
    campus: { gate: (o.gate ?? o.short).toUpperCase(), z: -34 },
    streets: [
      { id: o.road, z: 0, decor: true },
      { id: o.avenue, z: -75 },
      { id: o.homes, z: 75 },
    ],
    landmarks: [
      ...o.faculties.slice(0, 4).map((f, i): Landmark => ({
        id: `${o.id}-fac-${i}`,
        kind: "faculty",
        name: `${f} · ${o.short}`,
        street: o.avenue,
        side: "s",
        x: fx[i],
        width: 30,
        depth: 28,
        floors: 3,
        about: `${f}, ${o.uni}.`,
      })),
      {
        id: `${o.id}-mosque`,
        kind: "masjid",
        name: `${o.short} Central Mosque`,
        street: o.avenue,
        x: 48,
      },
      {
        id: `${o.id}-library`,
        kind: "faculty",
        name: `${o.short} Library`,
        street: o.avenue,
        x: 108,
        width: 26,
        depth: 30,
        floors: 2,
        about: `The main library of ${o.uni}: quiet reading rooms, books and journals.`,
      },
      {
        id: `${o.id}-field`,
        kind: "field",
        name: `${o.short} Sports Field`,
        street: o.avenue,
        x: -74,
        width: 58,
        depth: 44,
      },
      {
        id: `${o.id}-mssn`,
        kind: "office",
        name: `MSSN ${o.short} Secretariat`,
        street: o.avenue,
        x: 112,
        side: "s",
        width: 28,
        depth: 18,
        floors: 1,
        brand: { color: 0x1f6f63, accent: 0xfdf8ec },
        about: `The Muslim Students' Society of Nigeria (MSSN), ${o.short} branch. Jumu'ah on campus, tutorials before exams, da'wah week, Ramadan iftar and registration for the Islamic Vacation Course (IVC). Every Muslim student is welcome, brothers and sisters.`,
      },
      {
        id: `${o.id}-meet`,
        kind: "hangout",
        name: `MSSN ${o.short} Meeting Point`,
        street: o.avenue,
        x: -62,
        side: "s",
        width: 30,
        depth: 18,
        about: o.about,
      },
      ...(o.extra ?? []),
    ],
  };
}

export const DISTRICTS: District[] = [
  {
    id: "lekki",
    tier: 1,
    name: "Lekki",
    state: "Lagos",
    origin: { x: 425, z: 450 },
    highway: "Lekki–Epe Expressway",
    lagoon: true,
    streets: [
      { id: "ridwanjamiu", z: 0, decor: true },
      { id: "amin", z: -66, decor: true },
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
    tier: 3,
    toLet: 0.95,
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
    tier: 4,
    toLet: 0.7,
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
    tier: 2,
    toLet: 0.55,
    name: "Igbe Laara",
    region: "Ikorodu",
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
          "IlmStation is a learning app for Muslims: Qur'an, Islamic studies and quizzes with rewards. IlmWorld is part of IlmStation.",
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
          "The office of Techie Jamiu Adewuyi (Devjaytech), the developer behind IlmStation, OutingStation and IlmWorld.",
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
    tier: 2,
    toLet: 0.55,
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
    tier: 2,
    toLet: 0.55,
    name: "Second Gate",
    state: "Lagos",
    origin: { x: 575, z: -1275 },
    highway: "Ikorodu Road",
    parent: "firstgate",
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
    tier: 2,
    name: "Ikorodu Market",
    state: "Lagos",
    origin: { x: 575, z: -1505 },
    highway: "Ikorodu Road",
    parent: "secondgate",
    busStop: "Ikorodu Market",
    half: { x: 112, z: 100 },
    streets: [
      { id: "souq", z: 0 },
      { id: "shukr", z: -66, land: 0.45, toLet: 0.7 },
      { id: "rida", z: 66, land: 0.45, toLet: 0.7 },
    ],
    landmarks: [
      { id: "souq-ikorodu", kind: "market", name: "Ikorodu Market", street: "souq", x: 0 },
    ],
  },
  {
    id: "egbeda",
    tier: 2,
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
    tier: 1,
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
      { id: "ridwan", z: -66, decor: true },
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
    tier: 2,
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
    tier: 2,
    toLet: 0.55,
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
    tier: 1,
    name: "Ikeja",
    state: "Lagos",
    origin: { x: 130, z: -470 },
    highway: "Ikeja–Ojodu Road",
    busStop: "Ojodu",
    shops: 0.22,
    streets: [
      { id: "abdullateef", z: 0, decor: true },
      { id: "rayyan", z: -66, decor: true },
      { id: "safa", z: 66, decor: true },
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
  universityArea({
    id: "firstgate",
    gate: "LASUSTECH, Ikorodu",
    name: "First Gate",
    uni: "Lagos State University of Science and Technology (LASUSTECH), Ikorodu",
    short: "LASUSTECH",
    origin: { x: 575, z: -1005 },
    highway: "Ikorodu Road",
    parent: "agric",
    busStop: "First Gate",
    road: "lasustechroad",
    avenue: "mssnlasustech",
    homes: "yaqeen",
    faculties: [
      "Faculty of Engineering",
      "Faculty of Applied Sciences",
      "Faculty of Environmental Studies",
      "Faculty of Agriculture",
    ],
    about:
      "Where LASUSTECH Muslim students meet between lectures: brothers and sisters gist, plan MSSN programmes, share notes and remind one another.",
  }),
  universityArea({
    id: "akoka",
    gate: "University of Lagos",
    name: "Akoka",
    uni: "the University of Lagos (UNILAG), Akoka",
    short: "UNILAG",
    origin: { x: 280, z: 25 },
    highway: "Herbert Macaulay Way",
    busStop: "UNILAG Gate",
    road: "unilagroad",
    avenue: "mssnunilag",
    homes: "ilm",
    faculties: [
      "Faculty of Arts",
      "Faculty of Science",
      "Faculty of Engineering",
      "Faculty of Law",
    ],
    about:
      "Where UNILAG Muslim students meet between lectures: brothers and sisters gist, plan MSSN programmes, share notes and remind one another.",
  }),
  universityArea({
    id: "ojo",
    gate: "Lagos State University",
    name: "Ojo",
    uni: "Lagos State University (LASU), Ojo",
    short: "LASU",
    origin: { x: -620, z: 250 },
    highway: "Lagos–Badagry Expressway",
    busStop: "LASU Gate",
    road: "lasuroad",
    avenue: "mssnlasu",
    homes: "ikhlas",
    faculties: [
      "Faculty of Arts",
      "Faculty of Science",
      "Faculty of Management Sciences",
      "Faculty of Education",
    ],
    about:
      "Where LASU Muslim students meet between lectures: brothers and sisters gist, plan MSSN programmes, share notes and remind one another.",
  }),
  /* ---------------- Lagos airport, up the road from Ikeja ---------------- */
  {
    id: "lagosairport",
    tier: 1,
    name: "Lagos Airport",
    state: "Lagos",
    origin: { x: 130, z: -725 },
    half: { x: 112, z: 90 },
    highway: "Airport Road, Ikeja",
    parent: "ikeja",
    busStop: "Lagos Airport",
    toLet: 0,
    land: 0,
    shops: 0.7,
    streets: [
      { id: "mmiaroad", z: 0, decor: true },
      { id: "mmiacargo", z: 55 },
    ],
    landmarks: [
      {
        id: "lagos",
        kind: "airport",
        name: "Murtala Muhammed International Airport",
        street: "mmiaroad",
        x: -52,
        width: 72,
        depth: 40,
        floors: 2,
        brand: { color: 0x2f4a7a, accent: 0xffffff },
        about:
          "Flights from Lagos to Ilorin and, soon, other cities. Fly in minutes instead of hours on the road.",
      },
      {
        id: "mmia-mosque",
        kind: "masjid",
        name: "Airport Mosque, Ikeja",
        street: "mmiaroad",
        x: 60,
      },
    ],
  },

  /* ---------------- Ilorin, Kwara State: its own map, east of Lagos ---------------- */
  {
    id: "ilorincentral",
    city: "ilorin",
    tier: 2,
    name: "Ilorin Central",
    state: "Kwara",
    region: "Ilorin",
    origin: { x: 3870, z: -780 },
    highway: "Unity Road",
    busStop: "Oja-Oba",
    shops: 0.3,
    toLet: 0.45,
    streets: [
      { id: "emirsroad", z: 0, decor: true },
      { id: "ojaoba", z: -66 },
      { id: "onikijipa", z: 66 },
    ],
    landmarks: [
      {
        id: "ilorin-central-mosque",
        kind: "masjid",
        name: "Ilorin Central Mosque",
        street: "emirsroad",
        x: -40,
      },
      {
        id: "emirs-palace",
        kind: "mansion",
        name: "Palace of the Emir of Ilorin",
        street: "emirsroad",
        x: 50,
        width: 48,
        depth: 34,
        floors: 2,
      },
      { id: "oja-oba", kind: "souq", name: "Oja-Oba Market", street: "ojaoba", x: 40 },
      {
        id: "ilorin-madrasah",
        kind: "school",
        name: "Ilorin Arabic and Islamic School",
        street: "onikijipa",
        x: -40,
      },
      {
        id: "onikijipa-house",
        kind: "mansion",
        name: "House of Mufti Sheikh Sulaiman Farooq Onikijipa",
        street: "onikijipa",
        x: 50,
        width: 44,
        depth: 30,
        floors: 2,
      },
    ],
  },
  {
    id: "taiwo",
    city: "ilorin",
    tier: 2,
    name: "Taiwo Road",
    state: "Kwara",
    region: "Ilorin",
    origin: { x: 3870, z: -470 },
    highway: "Post Office Road",
    busStop: "Post Office",
    shops: 0.4,
    toLet: 0.4,
    streets: [
      { id: "taiworoad", z: 0, decor: true },
      { id: "ahmadubello", z: -66 },
      { id: "sulugambari", z: 66 },
    ],
    landmarks: [
      {
        id: "taiwo-mosque",
        kind: "masjid",
        name: "Taiwo Road Juma'at Mosque",
        street: "taiworoad",
        x: -40,
      },
      {
        id: "ilorin-post-office",
        kind: "office",
        name: "Post Office, Ilorin",
        street: "taiworoad",
        x: 50,
        width: 34,
        depth: 26,
        floors: 2,
        brand: { color: 0x1d6b3a, accent: 0xfdf8ec },
        about: "The Post Office roundabout is the heart of Ilorin's business district.",
      },
      {
        id: "taiwo-quran",
        kind: "office",
        name: "Taiwo Road Qur'an Centre",
        street: "ahmadubello",
        x: 46,
        width: 30,
        depth: 24,
        floors: 2,
        brand: { color: 0x1f6f63, accent: 0xe6b84a },
        classes: ["Beginners", "Juz 'Amma", "Juz 1–10", "Juz 11–20", "Juz 21–30"],
        subjects: ["quran", "arabic", "tawheed"],
        about: "Qur'an memorisation and Arabic, morning and evening classes.",
      },
    ],
  },
  {
    id: "gaa",
    city: "ilorin",
    tier: 4,
    name: "Gaa-Akanbi",
    state: "Kwara",
    region: "Ilorin",
    origin: { x: 3870, z: -170 },
    highway: "Offa Road",
    busStop: "Gaa-Akanbi",
    shops: 0.35,
    land: 0.2,
    toLet: 0.55,
    streets: [
      { id: "gaaakanbi", z: 0 },
      { id: "sangoroad", z: -66 },
      { id: "lafiaji", z: 66 },
    ],
    landmarks: [
      {
        id: "gaa-mosque",
        kind: "masjid",
        name: "Gaa-Akanbi Central Mosque",
        street: "gaaakanbi",
        x: -40,
      },
      { id: "sango-market", kind: "souq", name: "Sango Market", street: "sangoroad", x: 40 },
      {
        id: "gaa-madrasah",
        kind: "school",
        name: "Gaa-Akanbi Madrasah",
        street: "lafiaji",
        x: -40,
      },
      {
        id: "lafiaji-house",
        kind: "mansion",
        name: "House of Dr. Sanusi Lafiaji",
        street: "lafiaji",
        x: 50,
        width: 44,
        depth: 30,
        floors: 2,
      },
    ],
  },
  universityArea({
    id: "tanke",
    gate: "University of Ilorin",
    name: "Tanke",
    uni: "the University of Ilorin (Unilorin)",
    short: "Unilorin",
    origin: { x: 4540, z: -790 },
    highway: "Tanke Road",
    busStop: "Unilorin Gate",
    road: "unilorinroad",
    avenue: "mssnunilorin",
    homes: "alaro",
    extra: [
      {
        id: "alaro-house",
        kind: "mansion",
        name: "House of Sheikh Prof. AbdulMajeed Alaro",
        street: "alaro",
        x: 50,
        side: "s",
        width: 44,
        depth: 30,
        floors: 2,
      },
    ],
    state: "Kwara",
    city: "ilorin",
    region: "Ilorin",
    faculties: [
      "Faculty of Arts",
      "Faculty of Science",
      "Faculty of Engineering",
      "Faculty of Education",
    ],
    about:
      "Where Unilorin Muslim students meet between lectures: brothers and sisters gist, plan MSSN programmes, share notes and remind one another.",
  }),
  {
    id: "fate",
    city: "ilorin",
    tier: 1,
    name: "Fate / GRA",
    state: "Kwara",
    region: "Ilorin",
    origin: { x: 4530, z: -470 },
    highway: "Fate Road",
    busStop: "Fate",
    shops: 0.2,
    toLet: 0.35,
    streets: [
      { id: "faterd", z: 0, decor: true },
      { id: "gra", z: -66, decor: true },
      { id: "asadamroad", z: 66 },
    ],
    landmarks: [
      { id: "fate-mosque", kind: "masjid", name: "Fate Juma'at Mosque", street: "faterd", x: -40 },
      {
        id: "kwara-mall",
        kind: "office",
        name: "Kwara Mall",
        street: "faterd",
        x: 50,
        width: 40,
        depth: 30,
        floors: 2,
        brand: { color: 0xb8573a, accent: 0xfdf8ec },
        about: "Shopping, food and a cinema hall on Fate Road.",
      },
      {
        id: "metropolitan-square",
        kind: "hangout",
        name: "Metropolitan Square",
        street: "asadamroad",
        x: -46,
        side: "s",
        width: 30,
        depth: 18,
        about: "Ilorin's big open square for events, Eid gatherings and outings.",
      },
    ],
  },
  {
    id: "adewole",
    city: "ilorin",
    tier: 3,
    name: "Adewole",
    state: "Kwara",
    region: "Ilorin",
    origin: { x: 4530, z: -170 },
    highway: "Murtala Mohammed Way",
    busStop: "Adewole",
    shops: 0.25,
    land: 0.18,
    toLet: 0.5,
    streets: [
      { id: "adewoleroad", z: 0 },
      { id: "hikmahroad", z: -66 },
      { id: "airportrd", z: 66 },
    ],
    landmarks: [
      {
        id: "adewole-mosque",
        kind: "masjid",
        name: "Adewole Central Mosque",
        street: "adewoleroad",
        x: -40,
      },
      {
        id: "al-hikmah",
        kind: "campus",
        name: "Al-Hikmah University",
        street: "hikmahroad",
        x: 40,
        width: 58,
        depth: 30,
        floors: 2,
        classes: ["100 Level", "200 Level", "300 Level", "400 Level"],
        about:
          "Al-Hikmah University, Adewole: a university with Islamic values, for brothers and sisters.",
      },
    ],
  },
  {
    id: "ilorinairport",
    city: "ilorin",
    tier: 1,
    name: "Ilorin Airport",
    state: "Kwara",
    region: "Ilorin",
    origin: { x: 4815, z: -470 },
    half: { x: 112, z: 90 },
    highway: "Airport Road, Ilorin",
    parent: "fate",
    link: "east",
    busStop: "Ilorin Airport",
    toLet: 0,
    land: 0,
    shops: 0.7,
    streets: [
      { id: "ilorinairportroad", z: 0, decor: true },
      { id: "ilorincargo", z: 55 },
    ],
    landmarks: [
      {
        id: "ilorin",
        kind: "airport",
        name: "Ilorin International Airport",
        street: "ilorinairportroad",
        x: -52,
        width: 72,
        depth: 40,
        floors: 2,
        brand: { color: 0x1d6b3a, accent: 0xffffff },
        about: "Flights from Ilorin to Lagos. Fly in minutes instead of hours on the road.",
      },
      {
        id: "ilorin-airport-mosque",
        kind: "masjid",
        name: "Airport Mosque, Ilorin",
        street: "ilorinairportroad",
        x: 60,
      },
    ],
  },

  /* ---------------- Makkah: the Haram and the Kaaba ---------------- */
  {
    id: "haram",
    city: "makkah",
    holy: true,
    tier: 1,
    name: "Al-Haram",
    state: "Makkah",
    region: "Makkah",
    origin: { x: -5330, z: -480 },
    half: { x: 230, z: 230 },
    highway: "Ibrahim Al-Khalil Road",
    busStop: "Al-Haram",
    toLet: 0.3,
    shops: 0.5,
    land: 0,
    streets: [
      { id: "ibrahimkhalil", z: 0, decor: true },
      { id: "ajyad", z: 100 },
    ],
    landmarks: [
      {
        id: "masjid-al-haram",
        kind: "haram",
        name: "Al-Masjid Al-Haram",
        street: "ibrahimkhalil",
        x: 0,
        about:
          "The Sacred Mosque around the Kaaba, the first house of worship built for mankind. Make tawaf, pray behind Maqam Ibrahim, drink Zamzam and walk between Safa and Marwah.",
      },
      {
        id: "haram-barber",
        kind: "office",
        name: "Barber · Halq and Taqsir",
        street: "ajyad",
        x: -50,
        width: 22,
        depth: 18,
        floors: 1,
        brand: { color: 0xf7f7f2, accent: 0x1f6f63 },
        about: "Shave or shorten your hair to complete your Umrah.",
      },
    ],
  },
  {
    id: "aziziyah",
    city: "makkah",
    holy: true,
    tier: 2,
    name: "Aziziyah",
    state: "Makkah",
    region: "Makkah",
    origin: { x: -4680, z: -480 },
    highway: "King Abdulaziz Road",
    busStop: "Aziziyah",
    toLet: 0.45,
    shops: 0.45,
    land: 0,
    streets: [
      { id: "aziziyahroad", z: 0, decor: true },
      { id: "masjidalkhayf", z: -66 },
      { id: "mina", z: 66 },
    ],
    landmarks: [
      {
        id: "aziziyah-mosque",
        kind: "masjid",
        name: "Aziziyah Mosque",
        street: "aziziyahroad",
        x: -40,
      },
      {
        id: "abdullateef-hajj-makkah",
        kind: "office",
        name: "Abdul Lateef Hajj & Umrah Tours · Makkah",
        street: "aziziyahroad",
        x: 48,
        width: 30,
        depth: 24,
        floors: 3,
        brand: { color: 0x2a1c05, accent: 0xe6b84a },
        about:
          "Hajj and Umrah from Nigeria: your hotel, guides and transport in Makkah and Madinah.",
      },
    ],
  },
  {
    id: "jeddahairport",
    city: "makkah",
    holy: true,
    tier: 1,
    name: "Jeddah Airport",
    state: "Makkah",
    region: "Makkah",
    origin: { x: -4395, z: -480 },
    half: { x: 112, z: 90 },
    highway: "Airport Road, Jeddah",
    parent: "aziziyah",
    link: "east",
    busStop: "Jeddah Airport",
    toLet: 0,
    land: 0,
    shops: 0.7,
    streets: [
      { id: "jeddahairportroad", z: 0, decor: true },
      { id: "jeddahcargo", z: 55 },
    ],
    landmarks: [
      {
        id: "makkah",
        kind: "airport",
        name: "King Abdulaziz International Airport",
        street: "jeddahairportroad",
        x: -52,
        width: 72,
        depth: 40,
        floors: 2,
        brand: { color: 0x1d6b3a, accent: 0xffffff },
        about: "The airport for pilgrims to Makkah. Flights to Lagos, Ilorin and Madinah.",
      },
    ],
  },

  /* ---------------- Mina and Arafat: the sites of Hajj ---------------- */
  {
    id: "mina",
    city: "makkah",
    holy: true,
    tier: 2,
    name: "Mina",
    state: "Makkah",
    region: "Makkah",
    origin: { x: -4680, z: -730 },
    half: { x: 140, z: 110 },
    highway: "King Faisal Road",
    parent: "aziziyah",
    busStop: "Mina",
    toLet: 0,
    land: 0,
    shops: 0.12,
    streets: [
      { id: "jamaratroad", z: 0, decor: true },
      { id: "minatents", z: -70 },
      { id: "khayf", z: 70 },
    ],
    landmarks: [
      {
        id: "jamarat",
        kind: "jamarat",
        name: "The Jamarat",
        street: "jamaratroad",
        x: 0,
        about:
          "The three pillars of Mina: Al-Jamrah Al-Ula, Al-Wusta and Al-Aqabah. Pilgrims throw seven small pebbles at each, saying Allahu Akbar, following the Sunnah of Ibrahim ﷺ.",
      },
      {
        id: "masjid-al-khayf",
        kind: "masjid",
        name: "Masjid Al-Khayf",
        street: "khayf",
        x: -40,
        about: "The mosque of Mina. The Prophet ﷺ said seventy Prophets prayed here.",
      },
    ],
  },
  {
    id: "arafat",
    city: "makkah",
    holy: true,
    tier: 3,
    name: "Arafat",
    state: "Makkah",
    region: "Makkah",
    origin: { x: -4680, z: -990 },
    half: { x: 150, z: 120 },
    highway: "Arafat Road",
    parent: "mina",
    busStop: "Arafat",
    toLet: 0,
    land: 0,
    shops: 0.1,
    streets: [
      { id: "arafatroad", z: 0, decor: true },
      { id: "muzdalifah", z: -72 },
      { id: "namirah", z: 72 },
    ],
    landmarks: [
      {
        id: "jabal-rahmah",
        kind: "rahmah",
        name: "Jabal ar-Rahmah",
        street: "arafatroad",
        x: 0,
        about:
          'The Mount of Mercy on the plain of Arafat. Standing at Arafat on the 9th of Dhul Hijjah is the heart of Hajj: "Hajj is Arafah."',
      },
      {
        id: "masjid-namirah",
        kind: "masjid",
        name: "Masjid Namirah",
        street: "namirah",
        x: -40,
        about: "Where the khutbah of Arafat is given and Dhuhr and Asr are prayed together.",
      },
      {
        id: "mashar-al-haram",
        kind: "masjid",
        name: "Al-Mash'ar Al-Haram, Muzdalifah",
        street: "muzdalifah",
        x: 40,
        about: "The mosque of Muzdalifah, where pilgrims spend the night and gather pebbles.",
      },
    ],
  },

  /* ---------------- Madinah: the Prophet's Mosque ﷺ ---------------- */
  {
    id: "nabawi",
    city: "madinah",
    holy: true,
    tier: 1,
    name: "Al-Masjid An-Nabawi",
    state: "Madinah",
    region: "Madinah",
    origin: { x: -5330, z: -3480 },
    half: { x: 230, z: 230 },
    highway: "King Faisal Road",
    busStop: "Al-Masjid An-Nabawi",
    toLet: 0.3,
    shops: 0.5,
    land: 0,
    streets: [
      { id: "kingfaisal", z: 0, decor: true },
      { id: "abudharr", z: 100 },
    ],
    landmarks: [
      {
        id: "masjid-an-nabawi",
        kind: "nabawi",
        name: "Al-Masjid An-Nabawi",
        street: "kingfaisal",
        x: 0,
        about:
          "The Mosque of the Prophet ﷺ in Madinah, with the Green Dome over his resting place and the Rawdah, a garden from the gardens of Paradise.",
      },
      {
        id: "madinah-clock",
        kind: "clocktower",
        name: "Madinah Clock Tower",
        street: "kingfaisal",
        x: -130,
      },
    ],
  },
  {
    id: "quba",
    city: "madinah",
    holy: true,
    tier: 2,
    name: "Quba",
    state: "Madinah",
    region: "Madinah",
    origin: { x: -4680, z: -3480 },
    highway: "Quba Road",
    busStop: "Quba",
    toLet: 0.45,
    shops: 0.4,
    land: 0,
    streets: [
      { id: "qubaroad", z: 0, decor: true },
      { id: "awali", z: -66 },
      { id: "uhud", z: 66 },
    ],
    landmarks: [
      {
        id: "masjid-quba",
        kind: "masjid",
        name: "Masjid Quba",
        street: "qubaroad",
        x: -40,
        about:
          "The first mosque built in Islam. Praying two rak'ahs here is like the reward of an Umrah.",
      },
      {
        id: "masjid-qiblatayn",
        kind: "masjid",
        name: "Masjid Al-Qiblatayn",
        street: "uhud",
        x: 40,
        about:
          "The Mosque of the Two Qiblahs, where the Prophet ﷺ was commanded in salah to turn from Jerusalem to the Kaaba.",
      },
    ],
  },
  {
    id: "madinahairport",
    city: "madinah",
    holy: true,
    tier: 1,
    name: "Madinah Airport",
    state: "Madinah",
    region: "Madinah",
    origin: { x: -4395, z: -3480 },
    half: { x: 112, z: 90 },
    highway: "Airport Road, Madinah",
    parent: "quba",
    link: "east",
    busStop: "Madinah Airport",
    toLet: 0,
    land: 0,
    shops: 0.7,
    streets: [
      { id: "madinahairportroad", z: 0, decor: true },
      { id: "madinahcargo", z: 55 },
    ],
    landmarks: [
      {
        id: "madinah",
        kind: "airport",
        name: "Prince Mohammad bin Abdulaziz Airport",
        street: "madinahairportroad",
        x: -52,
        width: 72,
        depth: 40,
        floors: 2,
        brand: { color: 0x1d6b3a, accent: 0xffffff },
        about: "Madinah's airport. Flights to Lagos, Ilorin and Makkah (Jeddah).",
      },
    ],
  },
];
/** Where each city's junction is on the map; its areas sit around it. */
export const CITY_CENTER: Record<string, { x: number; z: number }> = {
  lagos: { x: 0, z: 0 },
  ilorin: { x: 4200, z: -480 },
  makkah: { x: -5000, z: -480 },
  madinah: { x: -5000, z: -3480 },
};
export const cityOf = (d: District) => d.city ?? "lagos";
export const centerOf = (d: District) => CITY_CENTER[cityOf(d)] ?? CITY_CENTER.lagos;
/** Junction names, one per city. */
export const JUNCTION_NAME: Record<string, string> = {
  lagos: "City Junction",
  ilorin: "Post Office Roundabout",
  makkah: "Makkah Junction",
  madinah: "Madinah Junction",
};
/** Travel between cities, in game units (₦10 each). */
export const INTERCITY = {
  bus: 300,
  fly: 1500,
  business: 4000,
  /** to and from Saudi Arabia */
  abroad: 15000,
  abroadBusiness: 40000,
  /** the Haramain train between Makkah and Madinah */
  train: 1500,
};
export const districtById = (id: string) => DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
export const halfOf = (d: District) => d.half ?? { x: 112, z: 100 };
/** The look of an area's houses, so no two kinds of place look the same. */
export function houseStyleOf(d: District): import("./buildings").HouseStyle {
  if (d.id === "mina" || d.id === "arafat") return "tents";
  if (d.holy) return d.id === "haram" || d.id === "nabawi" ? "tower" : "saudi";
  if (["lekki", "badore", "ikeja", "fate", "lagosairport", "ilorinairport"].includes(d.id))
    return "modern";
  if (cityOf(d) === "ilorin") return "ilorin";
  if (["egbeda", "agric", "okeeletu"].includes(d.id)) return "cottage";
  return "local";
}
/** "Agric, Ikorodu" or "Badore, Lekki" for areas reached through another area. */
export const rootOf = (d: District): District => (d.parent ? rootOf(districtById(d.parent)) : d);
/** The town an area belongs to: Agric, First Gate and Igbe Laara are all in Ikorodu. */
/* ---------------- cities ---------------- */
/** IlmWorld grows city by city. Lagos is open; the others are being built. Each new city
    gets its own map and areas (District.city), reached from the intercity bus park. */
export type WorldCity = {
  id: string;
  name: string;
  state: string;
  country: string;
  live: boolean;
  /** what it is known for, shown on the travel screen */
  blurb: string;
};
export const WORLD_CITIES: WorldCity[] = [
  {
    id: "lagos",
    name: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    live: true,
    blurb: "The mega city: Lekki, Ikeja, Ikorodu, the lagoon and the bridges.",
  },
  {
    id: "ilorin",
    name: "Ilorin",
    state: "Kwara",
    country: "Nigeria",
    live: true,
    blurb: "The city of scholars: the Central Mosque, Oja-Oba, Unilorin and the Emir's palace.",
  },
  {
    id: "abuja",
    name: "Abuja",
    state: "FCT",
    country: "Nigeria",
    live: false,
    blurb: "The capital: the National Mosque, Wuse market and the city gate.",
  },
  {
    id: "kano",
    name: "Kano",
    state: "Kano",
    country: "Nigeria",
    live: false,
    blurb: "The old walled city, Kurmi market and the Kano Central Mosque.",
  },
  {
    id: "makkah",
    name: "Makkah",
    state: "Makkah",
    country: "Saudi Arabia",
    live: true,
    blurb: "Al-Masjid Al-Haram and the Kaaba: make Umrah, tawaf, sa'i and drink Zamzam.",
  },
  {
    id: "madinah",
    name: "Madinah",
    state: "Madinah",
    country: "Saudi Arabia",
    live: true,
    blurb: "The city of the Prophet ﷺ: Al-Masjid An-Nabawi, the Green Dome and Masjid Quba.",
  },
  {
    id: "accra",
    name: "Accra",
    state: "Greater Accra",
    country: "Ghana",
    live: false,
    blurb: "Our first city outside Nigeria: Nima, Madina and the coast.",
  },
];

export const regionOf = (d: District) => rootOf(d).region ?? rootOf(d).name;
export const fullName = (d: District) =>
  d.parent || d.region ? `${d.name}, ${regionOf(d)}` : d.name;
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
  // Ilorin: boards for Ilorin businesses
  {
    id: "ilorin-postoffice",
    name: "Post Office Roundabout",
    district: "taiwo",
    ad: {
      brand: "IlmStation",
      headline: "Ilorin, city of scholars",
      line: "Learn daily on IlmStation · ilmstation.com",
      bg: "#1d6b3a",
      fg: "#fdf8ec",
      link: "https://ilmstation.com",
    },
  },
  { id: "ilorin-ojaoba", name: "Oja-Oba Market Board", district: "ilorincentral" },
  {
    id: "ilorin-unilorin",
    name: "Unilorin Gate Board",
    district: "tanke",
    ad: {
      brand: "OutingStation",
      headline: "Halal outings in Ilorin",
      line: "Events · Experiences · outingstation.com",
      bg: "#5adaee",
      fg: "#062a30",
    },
  },
  { id: "ilorin-fate", name: "Fate Road Board", district: "fate" },
  { id: "ilorin-sango", name: "Sango Market Board", district: "gaa" },
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
/** Buying a house outright, by floors; and the weekly rent a tenant pays for one room. */
export const HOUSE_PRICE: Record<number, number> = { 1: 2500, 2: 4500, 3: 7000 };
export const ROOM_RENT_WEEK = 30;
export const TENANTS = [
  "Brother Kabir's family",
  "Sister Halimah",
  "Mallam Usman and family",
  "Brother Rasheed",
  "The Adeyemi family",
  "Sister Fatimah and her children",
  "Brother Ibrahim (NYSC corps member)",
  "Sister Rukayyah (nurse)",
  "Brother Taofeek (student)",
  "Mallam Sani",
  "Sister Zulaykha (teacher)",
  "Brother Waheed (trader)",
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
  // decorations
  {
    id: "calligraphy",
    name: "Bismillah calligraphy",
    icon: "🖼️",
    naira: 150,
    does: "Over your bed",
  },
  { id: "kaabaframe", name: "Kaaba picture", icon: "🕋", naira: 150, does: "Over the prayer mat" },
  { id: "plants", name: "Potted plants", icon: "🪴", naira: 100, does: "Green corners" },
  { id: "lamp", name: "Floor lamp", icon: "💡", naira: 100, does: "Warm light by the sofa" },
  { id: "chandelier", name: "Chandelier", icon: "✨", naira: 400, does: "Over the dining table" },
  {
    id: "sidetables",
    name: "Side table and vase",
    icon: "🏺",
    naira: 150,
    does: "Flowers by the door",
  },
  { id: "aquarium", name: "Fish tank", icon: "🐠", naira: 300, does: "Calm and colourful" },
  { id: "teaset", name: "Tea set", icon: "🫖", naira: 150, does: "Tea for your guests" },
  { id: "persian", name: "Persian carpet", icon: "🧶", naira: 300, does: "A grand living room" },
  { id: "shoerack", name: "Shoe rack", icon: "👞", naira: 100, does: "Shoes off at the door" },
  { id: "bakhoor", name: "Bakhoor burner", icon: "🪔", naira: 100, does: "A sweet-smelling home" },
  { id: "photowall", name: "Picture wall", icon: "🖼️", naira: 150, does: "Family memories" },
];
/** Paint your home: wall and floor colours (points per change). */
export const PAINT_PRICE = 30;
export const WALL_COLOURS = [
  0xe9dcc4, 0xf4f1ea, 0xd9e8e2, 0xf2e3c0, 0xe6d3e0, 0xd6e2f0, 0xf0d9c8, 0xc9dcc0,
];
export const FLOOR_COLOURS = [0xb98d5e, 0x8a5a3a, 0xd9d4c8, 0x6d4a2b, 0xc9b28a, 0x9aa3a8];
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

/* ---------------- work ---------------- */
export type JobQ = { q: string; o: string[]; a: number };
export type Job = {
  id: string;
  name: string;
  place: string;
  /** where you report for work: a zone id prefix */
  at: string;
  area: string;
  pay: number;
  /** shift hours in Lagos time; null = any time */
  hours: [number, number] | null;
  about: string;
  tasks: JobQ[];
  /** a job you do with your hands in the city rather than by answering questions */
  play?: "porter" | "caretaker" | "rider";
};
const J = (q: string, a: string, ...w: string[]): JobQ => {
  const o = [a, ...w];
  const k = q.length % o.length;
  [o[0], o[k]] = [o[k], o[0]];
  return { q, o, a: k };
};
export const JOBS: Job[] = [
  {
    id: "teacher",
    name: "Class teacher",
    place: "Manaar International Primary School",
    at: "campus:manaar-primary:admin",
    area: "ikorodu",
    pay: 50,
    hours: [8, 15],
    about: "Teach Primary pupils and mark their work.",
    tasks: [
      J(
        "A pupil wrote 7 + 5 = 13. What do you say?",
        "Kindly show them it is 12",
        "Mark it right",
        "Send them home",
      ),
      J(
        "It is time for Dhuhr during school. You…",
        "Lead the pupils to pray",
        "Keep teaching",
        "Close the school",
      ),
      J(
        "Two pupils are fighting. First you…",
        "Separate them and calm them",
        "Shout at the class",
        "Ignore it",
      ),
      J(
        "A shy pupil has not spoken today. You…",
        "Give them an easy question to answer",
        "Mock them",
        "Leave them out",
      ),
      J("Which is a noun?", "School", "Run", "Quickly", "Happy"),
      J(
        "The pupils finish early. You…",
        "Revise a short surah together",
        "Let them roam outside",
        "End school",
      ),
    ],
  },
  {
    id: "developer",
    name: "App developer",
    place: "IlmStation",
    at: "office:ilmstation",
    area: "ikorodu",
    pay: 60,
    hours: [9, 17],
    about: "Fix bugs and build features for the IlmStation app.",
    tasks: [
      J(
        "A user says the quiz shows the wrong answer. First you…",
        "Reproduce the bug and check the data",
        "Delete the quiz",
        "Blame the user",
      ),
      J(
        "Before releasing a feature you should…",
        "Test it",
        "Release it on Friday night untested",
        "Hide it",
      ),
      J(
        "Prayer times look wrong in Riyadh. You check…",
        "The time zone and calculation method",
        "The font",
        "The colour",
      ),
      J("A teammate asks for help. You…", "Help them kindly", "Ignore them", "Laugh at them"),
      J(
        "Users' passwords should be…",
        "Never stored in plain text",
        "Shared in the group chat",
        "Printed",
      ),
    ],
  },
  {
    id: "events",
    name: "Events coordinator",
    place: "OutingStation",
    at: "office:outingstation",
    area: "ikorodu",
    pay: 55,
    hours: [9, 17],
    about: "Help businesses list events and help people book them.",
    tasks: [
      J(
        "An event clashes with Jumu'ah. You suggest…",
        "Starting after Jumu'ah",
        "Ignoring it",
        "Cancelling Jumu'ah",
      ),
      J(
        "A customer paid but got no ticket. You…",
        "Check the payment and send the ticket",
        "Tell them to pay again",
        "Block them",
      ),
      J(
        "A venue asks to list a mixed party with alcohol. You…",
        "Politely decline",
        "Approve it",
        "Hide the details",
      ),
      J(
        "A family wants a halal outing. You suggest…",
        "A park picnic or a museum",
        "A nightclub",
        "Nothing",
      ),
      J(
        "An event's photos look fake. You…",
        "Ask the organiser for real photos",
        "Approve it anyway",
        "Post it twice",
      ),
    ],
  },
  {
    id: "hajj",
    name: "Hajj & Umrah consultant",
    place: "Manaar Hajj & Umrah Company",
    at: "office:manaar-hajj",
    area: "ikorodu",
    pay: 55,
    hours: [9, 17],
    about: "Guide pilgrims through their Hajj and Umrah plans.",
    tasks: [
      J("Ihram for Umrah starts at the…", "Miqat", "Hotel lobby", "Airport shop"),
      J("Tawaf is going round the Ka'bah how many times?", "7", "3", "5"),
      J("Sa'i is walking between…", "Safa and Marwah", "Mina and Arafah", "Makkah and Madinah"),
      J(
        "The most important day of Hajj is…",
        "The day of Arafah",
        "The day of travel",
        "The last day of Ramadan",
      ),
      J(
        "A pilgrim's passport expires next month. You…",
        "Tell them to renew it first",
        "Book them anyway",
        "Ignore it",
      ),
    ],
  },
  {
    id: "quranteacher",
    name: "Qur'an teacher",
    place: "Markaz Abdullateef",
    at: "office:markaz-abdullateef",
    area: "ikeja",
    pay: 50,
    hours: [7, 13],
    about: "Listen to students recite and correct their memorisation.",
    tasks: [
      J(
        "A student skips a verse. You…",
        "Stop and help them repeat it",
        "Let it pass",
        "End the class",
      ),
      J("Noon sakinah before ب is read with…", "Iqlab", "Izhar", "Idgham"),
      J("How many surahs are in Juz 'Amma?", "37", "30", "114"),
      J(
        "A student is tired. You…",
        "Give a short break and encourage them",
        "Shout",
        "Send them away",
      ),
      J(
        "The best revision is…",
        "Little and often, every day",
        "Once a month",
        "Only before exams",
      ),
    ],
  },
  {
    id: "counsellor",
    name: "Counsellor",
    place: "Alfaoz Counselling Home",
    at: "office:alfaoz-counselling",
    area: "okeeletu",
    pay: 50,
    hours: [10, 18],
    about: "Listen to people and give gentle, private advice.",
    tasks: [
      J(
        "Someone is sharing a problem. You first…",
        "Listen without interrupting",
        "Tell everyone",
        "Judge them",
      ),
      J("What is said in counselling is…", "Kept private", "Posted online", "Told to neighbours"),
      J(
        "A couple argues about money. You suggest…",
        "Make a budget together",
        "Divorce",
        "Borrow more",
      ),
      J(
        "Someone feels low. You…",
        "Show care and suggest they also see a doctor",
        "Laugh it off",
        "Ignore them",
      ),
    ],
  },
  {
    id: "caretaker",
    name: "Mosque caretaker",
    place: "Any mosque",
    at: "door:masjid:",
    area: "",
    pay: 35,
    hours: null,
    about: "Sweep the masjid yard with a broom before the people come to pray.",
    play: "caretaker",
    tasks: [
      J(
        "Before Jumu'ah you should…",
        "Clean and lay out the mats",
        "Lock the doors",
        "Turn off the fans",
      ),
      J("Shoes go…", "On the shoe rack", "On the prayer mats", "In the mihrab"),
      J(
        "A traveller asks for the Qiblah. You…",
        "Show them the direction",
        "Ignore them",
        "Point anywhere",
      ),
      J("The adhan begins with…", "Allahu Akbar", "Bismillah", "Alhamdulillah"),
    ],
  },
  {
    id: "porter",
    name: "Market porter",
    place: "Any market",
    at: "stall:",
    area: "",
    pay: 25,
    hours: null,
    about: "Carry baskets of goods on your head from stall to stall at the market.",
    play: "porter",
    tasks: [
      J(
        "A woman has heavy bags. You…",
        "Offer to help and agree a fair price",
        "Grab them",
        "Walk away",
      ),
      J("A trader gives you too much change. You…", "Give it back", "Keep it", "Run"),
      J(
        "Rice bags should be lifted with…",
        "Bent knees and a straight back",
        "Your back bent",
        "One finger",
      ),
      J("It is time for salah. You…", "Pause and pray", "Keep working through it", "Sleep"),
    ],
  },
  {
    id: "rider",
    name: "Dispatch rider",
    place: "Any shop",
    at: "shop:",
    area: "",
    pay: 40,
    hours: null,
    about: "Collect parcels at a shop and deliver them to houses on your street.",
    play: "rider",
    tasks: [],
  },
];
export const STREAK_REWARDS: Record<number, number> = { 3: 20, 7: 50, 14: 100, 30: 200 };
export const STREAK_TASKS = 5;
/** A trader's shop with a name and products sells this much a day. */
export const SHOP_SALES_PER_DAY = 20;

/* ---------------- adhkar at places ---------------- */
export type PlaceDhikr = {
  title: string;
  arabic: string;
  say: string;
  meaning: string;
  source: string;
  tip?: string;
};
export const PLACE_DHIKR: Record<string, PlaceDhikr> = {
  talbiyah: {
    title: "Talbiyah · entering ihram",
    arabic:
      "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
    say: "Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak.",
    meaning:
      "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. All praise, blessing and dominion are Yours. You have no partner.",
    source: "Bukhari, Muslim",
    tip: "Make the intention for Umrah in your heart. Keep saying the Talbiyah until you begin tawaf.",
  },
  tawafDua: {
    title: "Between the Yemeni Corner and the Black Stone",
    arabic:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    say: "Rabbana atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina 'adhaban-nar.",
    meaning:
      "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
    source: "Abu Dawud · Al-Baqarah 2:201",
    tip: "In the rest of each round, make any dua or dhikr you like.",
  },
  safa: {
    title: "At Safa",
    arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ",
    say: "Innas-Safa wal-Marwata min sha'a'irillah.",
    meaning: "Indeed, Safa and Marwah are among the symbols of Allah.",
    source: "Al-Baqarah 2:158, recited by the Prophet ﷺ at Safa (Muslim)",
    tip: "Face the Kaaba, say Allahu Akbar and make dua. Do the same on Marwah.",
  },
  salamProphet: {
    title: "Greeting the Prophet ﷺ",
    arabic: "السَّلَامُ عَلَيْكَ يَا رَسُولَ اللَّهِ",
    say: "As-salamu 'alayka ya Rasulallah.",
    meaning: "Peace be upon you, O Messenger of Allah.",
    source: "The practice of Ibn 'Umar (Muwatta Malik)",
    tip: "Then greet Abu Bakr and 'Umar, may Allah be pleased with them, and turn to the qibla to make dua to Allah.",
  },
  leaveHome: {
    title: "Leaving the house",
    arabic:
      "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    say: "Bismillah, tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah.",
    meaning:
      "In the name of Allah, I put my trust in Allah, and there is no power and no strength except with Allah.",
    source: "Abu Dawud, Tirmidhi",
  },
  enterHome: {
    title: "Entering the house",
    arabic:
      "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    say: "Bismillahi walajna, wa bismillahi kharajna, wa 'ala Allahi rabbina tawakkalna.",
    meaning:
      "In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.",
    source: "Abu Dawud",
    tip: "Then greet the people of the house with salam.",
  },
  enterMasjid: {
    title: "Entering the masjid",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    say: "Allahumma-ftah li abwaba rahmatik.",
    meaning: "O Allah, open for me the doors of Your mercy.",
    source: "Muslim",
    tip: "Enter with your right foot.",
  },
  leaveMasjid: {
    title: "Leaving the masjid",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    say: "Allahumma inni as'aluka min fadlik.",
    meaning: "O Allah, I ask You from Your bounty.",
    source: "Muslim",
    tip: "Leave with your left foot.",
  },
  ride: {
    title: "Riding a vehicle",
    arabic:
      "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ",
    say: "Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun.",
    meaning:
      "Glory be to the One who made this subservient to us, and we could never have done it ourselves. And to our Lord we will surely return.",
    source: "Qur'an 43:13–14",
  },
  market: {
    title: "Entering the market",
    arabic:
      "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ، بِيَدِهِ الْخَيْرُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    say: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, yuhyi wa yumit, wa huwa hayyun la yamut, biyadihil-khayr, wa huwa 'ala kulli shay'in qadir.",
    meaning:
      "None has the right to be worshipped but Allah alone, without partner. His is the dominion and His is the praise. He gives life and causes death, and He is Ever-Living and does not die. In His hand is all good, and He has power over all things.",
    source: "Tirmidhi",
  },
  study: {
    title: "Before class",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    say: "Rabbi zidni 'ilma.",
    meaning: "My Lord, increase me in knowledge.",
    source: "Qur'an 20:114",
    tip: "Make your intention to learn for Allah and to benefit people.",
  },
  beforeEating: {
    title: "Before eating",
    arabic: "بِسْمِ اللَّهِ",
    say: "Bismillah.",
    meaning: "In the name of Allah.",
    source: "Abu Dawud, Tirmidhi",
    tip: "If you forget at the start, say: Bismillahi awwalahu wa akhirahu.",
  },
  enterToilet: {
    title: "Entering the toilet",
    arabic: "بِسْمِ اللَّهِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
    say: "Bismillah. Allahumma inni a'udhu bika minal-khubuthi wal-khaba'ith.",
    meaning: "In the name of Allah. O Allah, I seek refuge with You from all evil and evil-doers.",
    source: "Bukhari, Muslim; Bismillah: Tirmidhi",
    tip: "Enter with your left foot.",
  },
  leaveToilet: {
    title: "Leaving the toilet",
    arabic: "غُفْرَانَكَ",
    say: "Ghufranak.",
    meaning: "I ask You for Your forgiveness.",
    source: "Abu Dawud, Tirmidhi",
    tip: "Leave with your right foot.",
  },
  afterWudu: {
    title: "After wudu",
    arabic:
      "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    say: "Ash-hadu an la ilaha illallahu wahdahu la sharika lah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
    meaning:
      "I bear witness that none has the right to be worshipped but Allah alone, without partner, and I bear witness that Muhammad is His servant and Messenger.",
    source: "Muslim",
    tip: "The eight gates of Paradise are opened for the one who says this.",
  },
  afterEating: {
    title: "After eating",
    arabic:
      "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    say: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah.",
    meaning:
      "All praise is for Allah who fed me this and provided it for me without any might or power from me.",
    source: "Abu Dawud, Tirmidhi",
  },
};

/** What Muslim students talk about at the meeting point. */
export const CAMPUS_GIST = [
  "Jumu'ah khutbah this week is on time management for students. Come early, the mosque fills up.",
  "MSSN tutorials for first-year maths start on Monday after Asr, in the library.",
  "Who is going for IVC this December? Registration is at the secretariat.",
  "Da'wah week is next month. We need volunteers for the welcome desk.",
  "Exams are close. Sleep early, pray Fajr, then revise. Barakah is in the morning.",
  "Sisters' halaqah is on Wednesday and brothers' halaqah on Thursday, both after Maghrib.",
  "Iftar on campus every Monday and Thursday for anyone fasting.",
  "Remember the du'a before lectures: Rabbi zidni 'ilma.",
  "Football match on the field on Saturday: Engineering vs Science.",
  "Book club is reading a seerah book this month. Ask at the secretariat.",
];

/* ---------------- lost things, police and bail ---------------- */
export const FOUND_ITEMS = {
  wallet: { name: "wallet", value: 20 },
  phone: { name: "phone", value: 30 },
  bag: { name: "bag", value: 25 },
  ring: { name: "gold ring", value: 40 },
} as const;
export type FoundKind = keyof typeof FOUND_ITEMS;
export const POLICE = {
  /** reward for handing in something you found */
  handInPoints: 5,
  handInIlm: 5,
  /** Ilm lost for keeping it */
  keepIlm: 5,
  bailPoints: 30,
  bailIlm: 15,
  /** minutes in the cell if you don't pay bail */
  cellMinutes: 2,
  /** road offences: the car is towed to the station until the fine is paid */
  hitFine: 40,
  crashFine: 20,
  towFee: 15,
};

/* ---------------- university students ---------------- */
export const UNIVERSITIES = [
  { area: "akoka", name: "UNILAG", full: "University of Lagos, Akoka" },
  { area: "ojo", name: "LASU", full: "Lagos State University, Ojo" },
  { area: "firstgate", name: "LASUSTECH", full: "LASUSTECH, First Gate Ikorodu" },
];
/** The faculties of a university area (from its faculty buildings). */
export const facultiesOf = (area: string) =>
  districtById(area)
    .landmarks.filter((l) => l.kind === "faculty" && !l.id.endsWith("-library"))
    .map((l) => ({ id: l.id, name: l.name.split(" · ")[0] }));

type FQ = { q: string; o: string[]; a: number };
const fq = (q: string, a: string, ...w: string[]): FQ => {
  const o = [a, ...w];
  // put the answer in a fixed but varied place
  const k = q.length % o.length;
  [o[0], o[k]] = [o[k], o[0]];
  return { q, o, a: k };
};
/** Questions for each faculty, matched by a word in its name. */
export const FACULTY_QUESTIONS: Record<string, FQ[]> = {
  Arts: [
    fq(
      "Who wrote the novel 'Things Fall Apart'?",
      "Chinua Achebe",
      "Wole Soyinka",
      "Chimamanda Adichie",
      "Ben Okri",
    ),
    fq(
      "Which language family does Yoruba belong to?",
      "Niger-Congo",
      "Afro-Asiatic",
      "Nilo-Saharan",
      "Indo-European",
    ),
    fq(
      "A word that means the opposite of another is called an…",
      "antonym",
      "synonym",
      "homophone",
      "acronym",
    ),
    fq(
      "Ajami is African languages written in which script?",
      "Arabic",
      "Latin",
      "Ge'ez",
      "Cyrillic",
    ),
    fq(
      "Who was the first African to win the Nobel Prize in Literature?",
      "Wole Soyinka",
      "Chinua Achebe",
      "Naguib Mahfouz",
      "Nadine Gordimer",
    ),
  ],
  Science: [
    fq("What is the chemical formula of water?", "H₂O", "CO₂", "O₂", "NaCl"),
    fq("Which part of the cell contains the DNA?", "Nucleus", "Ribosome", "Cell wall", "Vacuole"),
    fq(
      "What is the speed of light, roughly?",
      "300,000 km per second",
      "3,000 km per second",
      "30,000 km per hour",
      "300 km per second",
    ),
    fq("What is the pH of pure water?", "7", "0", "14", "1"),
    fq(
      "Which gas do plants take in for photosynthesis?",
      "Carbon dioxide",
      "Oxygen",
      "Nitrogen",
      "Hydrogen",
    ),
  ],
  Engineering: [
    fq("What is the unit of electrical resistance?", "Ohm", "Volt", "Ampere", "Watt"),
    fq("Ohm's law says V equals…", "I × R", "I ÷ R", "R ÷ I", "I + R"),
    fq("What is the SI unit of force?", "Newton", "Joule", "Pascal", "Watt"),
    fq("Which material is a good electrical conductor?", "Copper", "Rubber", "Glass", "Wood"),
    fq("Power is the rate of doing…", "work", "speed", "pressure", "charge"),
  ],
  Law: [
    fq(
      "What is the highest court in Nigeria?",
      "The Supreme Court",
      "The Court of Appeal",
      "The Federal High Court",
      "The Magistrate Court",
    ),
    fq(
      "A person accused of a crime is presumed…",
      "innocent until proven guilty",
      "guilty until proven innocent",
      "neither",
      "guilty if arrested",
    ),
    fq(
      "In which year did Nigeria's current constitution come into force?",
      "1999",
      "1979",
      "1963",
      "2010",
    ),
    fq(
      "A contract needs offer, acceptance and…",
      "consideration",
      "a lawyer",
      "a stamp",
      "a witness only",
    ),
    fq(
      "In Islamic law, the main sources are the Qur'an, the Sunnah, ijma' and…",
      "qiyas",
      "custom only",
      "opinion polls",
      "dreams",
    ),
  ],
  Education: [
    fq(
      "Who is known for the idea of the 'zone of proximal development'?",
      "Lev Vygotsky",
      "Jean Piaget",
      "B. F. Skinner",
      "John Dewey",
    ),
    fq(
      "Bloom's taxonomy sorts learning goals from remembering up to…",
      "creating",
      "listening",
      "copying",
      "testing",
    ),
    fq(
      "A test given at the end of a course is a…",
      "summative assessment",
      "formative assessment",
      "diagnostic test only",
      "placement test",
    ),
    fq(
      "Which is the first stage in Piaget's theory?",
      "Sensorimotor",
      "Formal operational",
      "Concrete operational",
      "Preoperational",
    ),
    fq(
      "The first word revealed in the Qur'an, about learning, is…",
      "Iqra (Read)",
      "Qul (Say)",
      "Ya ayyuha (O you)",
      "Alhamdu (Praise)",
    ),
  ],
  Management: [
    fq("Profit equals revenue minus…", "costs", "assets", "tax only", "sales"),
    fq(
      "What does SWOT stand for?",
      "Strengths, Weaknesses, Opportunities, Threats",
      "Sales, Work, Orders, Targets",
      "Staff, Wages, Output, Time",
      "Supply, Want, Offer, Trade",
    ),
    fq(
      "In Islamic finance, charging interest on loans (riba) is…",
      "forbidden",
      "encouraged",
      "required",
      "only for banks",
    ),
    fq(
      "A business owned by shareholders is a…",
      "company",
      "sole proprietorship",
      "partnership only",
      "cooperative only",
    ),
    fq("Money set aside for future use is called…", "savings", "debt", "expense", "loss"),
  ],
  Applied: [
    fq("What does a microbiologist mainly study?", "Microorganisms", "Rocks", "Stars", "Languages"),
    fq("Which instrument measures temperature?", "Thermometer", "Barometer", "Ammeter", "Odometer"),
    fq("Stainless steel is mainly iron mixed with…", "chromium", "gold", "silver", "lead"),
    fq(
      "What is the main gas in the air we breathe?",
      "Nitrogen",
      "Oxygen",
      "Carbon dioxide",
      "Argon",
    ),
    fq(
      "A food scientist checks food for safety and…",
      "quality",
      "colour only",
      "price only",
      "packaging only",
    ),
  ],
  Environmental: [
    fq(
      "What do architects draw before a building is built?",
      "Plans",
      "Maps of the sea",
      "Recipes",
      "Circuits",
    ),
    fq("Planting trees helps to reduce…", "erosion", "rainfall", "sunlight", "gravity"),
    fq("A quantity surveyor estimates a building's…", "cost", "colour", "height only", "owner"),
    fq(
      "Urban planning is about planning…",
      "towns and cities",
      "farms only",
      "the sea",
      "the weather",
    ),
    fq("Which is a renewable source of energy?", "Solar", "Coal", "Diesel", "Petrol"),
  ],
  Agriculture: [
    fq(
      "Which crop is Nigeria a top producer of in the world?",
      "Cassava",
      "Wheat",
      "Apples",
      "Barley",
    ),
    fq("Adding nutrients to soil is done with…", "fertiliser", "sand", "plastic", "salt"),
    fq(
      "Rearing fish in ponds is called…",
      "aquaculture",
      "apiculture",
      "horticulture",
      "sericulture",
    ),
    fq("Rotating crops on the same land helps keep the soil…", "fertile", "dry", "salty", "hard"),
    fq(
      "Keeping bees for honey is called…",
      "apiculture",
      "aquaculture",
      "viticulture",
      "floriculture",
    ),
  ],
};
export function facultyQuestions(faculty: string): FQ[] {
  const key = Object.keys(FACULTY_QUESTIONS).find((k) => faculty.includes(k)) ?? "Science";
  return FACULTY_QUESTIONS[key];
}

/** Points for a football match: per goal, and for the win. */
export const FOOTBALL = { perGoal: 2, win: 8 };

/* ---------------- food: order on the phone, or eat at the eatery ---------------- */
export type Dish = { id: string; name: string; icon: string; points: number; fills: number };
/** Delivered by IlmDash. The eatery charges more for the same food. */
export const MENU: Dish[] = [
  { id: "jollof", name: "Jollof rice & chicken", icon: "🍛", points: 12, fills: 80 },
  { id: "broast", name: "Broast chicken & fries", icon: "🍗", points: 13, fills: 85 },
  { id: "shawarma", name: "Chicken shawarma", icon: "🌯", points: 9, fills: 60 },
  { id: "amala", name: "Amala & ewedu", icon: "🥣", points: 10, fills: 75 },
  { id: "kabsa", name: "Kabsa", icon: "🍚", points: 14, fills: 90 },
  { id: "suya", name: "Suya", icon: "🍢", points: 8, fills: 45 },
];
export const EATERY_MARKUP = 1.5;
export const eateryPrice = (d: Dish) => Math.ceil(d.points * EATERY_MARKUP);
/** At or below this, you're too hungry to do anything but eat (and pray). */
export const HUNGRY_AT = 5;
