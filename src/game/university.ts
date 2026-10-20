/* Universities: every faculty has departments; each department has courses at each level
   (100 to 500), and every course has a short quiz. */

import { FACULTY_QUESTIONS, type FQ } from "./content";

type Dept = { name: string; code: string; topics: string[]; qs: FQ[] };

const q = (text: string, a: string, ...w: string[]): FQ => {
  const o = [a, ...w];
  const k = text.length % o.length;
  [o[0], o[k]] = [o[k], o[0]];
  return { q: text, o, a: k };
};

const DEPTS: Record<string, Dept[]> = {
  Arts: [
    {
      name: "English",
      code: "ENG",
      topics: [
        "English Grammar",
        "African Literature",
        "Poetry",
        "Phonetics",
        "Drama",
        "Stylistics",
      ],
      qs: [
        q("Which of these is a verb?", "run", "table", "happy", "quickly"),
        q(
          "'The wind whispered' is an example of…",
          "personification",
          "simile",
          "hyperbole",
          "alliteration",
        ),
        q("A poem of fourteen lines is a…", "sonnet", "haiku", "limerick", "ballad"),
        q(
          "Who wrote 'Death and the King's Horseman'?",
          "Wole Soyinka",
          "Chinua Achebe",
          "Femi Osofisan",
          "Ola Rotimi",
        ),
      ],
    },
    {
      name: "Arabic",
      code: "ARA",
      topics: [
        "Arabic Grammar (Nahw)",
        "Morphology (Sarf)",
        "Arabic Literature",
        "Rhetoric (Balaghah)",
        "Translation",
        "Classical Texts",
      ],
      qs: [
        q(
          "In Arabic grammar, the subject of a verbal sentence is the…",
          "fa'il",
          "maf'ul bihi",
          "khabar",
          "hal",
        ),
        q("How many letters are in the Arabic alphabet?", "28", "26", "30", "24"),
        q("'Kitab' (book) in the plural is…", "kutub", "kitabat", "kawatib", "kitaban"),
        q(
          "Balaghah is the study of…",
          "eloquence and rhetoric",
          "word forms",
          "poetry metres",
          "spelling",
        ),
      ],
    },
    {
      name: "Religions (Islamic Studies)",
      code: "ISS",
      topics: [
        "Tafsir",
        "Hadith Studies",
        "Fiqh",
        "Sirah",
        "Islamic History",
        "Comparative Religion",
      ],
      qs: [
        q("Sahih al-Bukhari is a collection of…", "hadith", "tafsir", "fiqh rulings", "poetry"),
        q(
          "Usul al-Fiqh is the study of…",
          "the principles of Islamic law",
          "the Prophet's life",
          "Qur'an recitation",
          "Arabic grammar",
        ),
        q("The Hijrah to Madinah was in the year…", "622 CE", "610 CE", "632 CE", "570 CE"),
        q(
          "Which caliph had the Qur'an compiled into one standard copy for the lands?",
          "Uthman ibn Affan",
          "Abu Bakr",
          "Umar ibn al-Khattab",
          "Ali ibn Abi Talib",
        ),
      ],
    },
    {
      name: "History and International Studies",
      code: "HIS",
      topics: [
        "Nigerian History",
        "West African Empires",
        "Diplomacy",
        "The Sokoto Caliphate",
        "Colonial Africa",
        "World History",
      ],
      qs: [
        q("Nigeria became independent in…", "1960", "1963", "1957", "1970"),
        q(
          "Who founded the Sokoto Caliphate?",
          "Shehu Usman dan Fodio",
          "Muhammadu Bello",
          "Mansa Musa",
          "Sunni Ali",
        ),
        q("Mansa Musa ruled which empire?", "Mali", "Songhai", "Ghana", "Kanem-Bornu"),
        q("The headquarters of the United Nations is in…", "New York", "Geneva", "London", "Paris"),
      ],
    },
  ],
  Science: [
    {
      name: "Mathematics",
      code: "MTH",
      topics: [
        "Calculus",
        "Linear Algebra",
        "Real Analysis",
        "Statistics",
        "Abstract Algebra",
        "Numerical Methods",
      ],
      qs: [
        q("What is the derivative of x²?", "2x", "x", "2", "x³/3"),
        q("What is 7 × 8?", "56", "54", "64", "48"),
        q(
          "A matrix with the same number of rows and columns is…",
          "square",
          "diagonal",
          "zero",
          "singular",
        ),
        q("What is the value of π to two decimal places?", "3.14", "3.41", "3.12", "3.16"),
      ],
    },
    {
      name: "Physics",
      code: "PHY",
      topics: [
        "Mechanics",
        "Electricity and Magnetism",
        "Waves and Optics",
        "Thermodynamics",
        "Quantum Physics",
        "Electronics",
      ],
      qs: [
        q("The unit of force is the…", "newton", "joule", "watt", "pascal"),
        q(
          "Acceleration due to gravity on Earth is about…",
          "9.8 m/s²",
          "98 m/s²",
          "1.6 m/s²",
          "0.98 m/s²",
        ),
        q("Power is work done divided by…", "time", "distance", "mass", "force"),
        q("Which particle has a negative charge?", "electron", "proton", "neutron", "photon"),
      ],
    },
    {
      name: "Chemistry",
      code: "CHM",
      topics: [
        "General Chemistry",
        "Organic Chemistry",
        "Inorganic Chemistry",
        "Physical Chemistry",
        "Analytical Chemistry",
        "Industrial Chemistry",
      ],
      qs: [
        q("What is the atomic number of carbon?", "6", "12", "8", "14"),
        q("NaCl is the formula of…", "table salt", "baking soda", "chalk", "sugar"),
        q("An acid turns blue litmus paper…", "red", "green", "blue", "colourless"),
        q(
          "Compounds of carbon and hydrogen only are…",
          "hydrocarbons",
          "carbohydrates",
          "salts",
          "alloys",
        ),
      ],
    },
    {
      name: "Computer Science",
      code: "CSC",
      topics: [
        "Programming",
        "Data Structures",
        "Algorithms",
        "Databases",
        "Operating Systems",
        "Artificial Intelligence",
      ],
      qs: [
        q("Which data structure is first in, first out?", "queue", "stack", "tree", "graph"),
        q(
          "What does CPU stand for?",
          "Central Processing Unit",
          "Computer Power Unit",
          "Central Program Utility",
          "Core Processing Unit",
        ),
        q("Binary search needs the list to be…", "sorted", "short", "unsorted", "linked"),
        q("Which language is used to query databases?", "SQL", "HTML", "CSS", "XML"),
      ],
    },
  ],
  Engineering: [
    {
      name: "Civil Engineering",
      code: "CVE",
      topics: [
        "Engineering Drawing",
        "Strength of Materials",
        "Structural Analysis",
        "Soil Mechanics",
        "Highway Engineering",
        "Hydraulics",
      ],
      qs: [
        q("Concrete is strong in…", "compression", "tension", "bending only", "torsion only"),
        q(
          "Steel bars put inside concrete are called…",
          "reinforcement",
          "formwork",
          "aggregate",
          "binder",
        ),
        q(
          "The study of soil for foundations is…",
          "soil mechanics",
          "hydrology",
          "surveying",
          "geology",
        ),
        q(
          "Cement, sand, gravel and water make…",
          "concrete",
          "mortar only",
          "asphalt",
          "plaster of Paris",
        ),
      ],
    },
    {
      name: "Electrical and Electronics Engineering",
      code: "EEE",
      topics: [
        "Circuit Theory",
        "Electrical Machines",
        "Power Systems",
        "Digital Electronics",
        "Control Systems",
        "Telecommunications",
      ],
      qs: [
        q("Ohm's law: V equals…", "I × R", "I ÷ R", "R ÷ I", "I + R"),
        q("A transformer changes…", "AC voltage", "DC current to AC", "frequency", "resistance"),
        q(
          "A diode lets current flow…",
          "one way",
          "both ways equally",
          "never",
          "only in a vacuum",
        ),
        q("The unit of capacitance is the…", "farad", "henry", "ohm", "tesla"),
      ],
    },
    {
      name: "Mechanical Engineering",
      code: "MEE",
      topics: [
        "Engineering Mechanics",
        "Thermodynamics",
        "Fluid Mechanics",
        "Machine Design",
        "Manufacturing",
        "Heat Transfer",
      ],
      qs: [
        q(
          "Energy can neither be created nor destroyed: this is the…",
          "first law of thermodynamics",
          "second law of thermodynamics",
          "Newton's third law",
          "Hooke's law",
        ),
        q(
          "A car engine is a kind of…",
          "heat engine",
          "electric motor",
          "turbine pump",
          "compressor",
        ),
        q("Stress is force divided by…", "area", "length", "time", "mass"),
        q(
          "Which machine part reduces friction between moving parts?",
          "bearing",
          "spring",
          "gear tooth",
          "bolt",
        ),
      ],
    },
  ],
  Law: [
    {
      name: "Islamic Law (Shari'ah)",
      code: "ILS",
      topics: [
        "Sources of Islamic Law",
        "Islamic Family Law",
        "Law of Inheritance",
        "Islamic Commercial Law",
        "Islamic Criminal Law",
        "Usul al-Fiqh",
      ],
      qs: [
        q("The first source of Islamic law is…", "the Qur'an", "ijma'", "qiyas", "custom"),
        q(
          "Agreement of the scholars on a ruling is called…",
          "ijma'",
          "qiyas",
          "ijtihad",
          "istihsan",
        ),
        q("The science of inheritance shares is called…", "fara'id", "nikah", "waqf", "zakah"),
        q(
          "A sale where the price is paid now for goods delivered later is…",
          "salam",
          "murabahah",
          "ijarah",
          "hibah",
        ),
      ],
    },
    {
      name: "Public Law",
      code: "PUL",
      topics: [
        "Constitutional Law",
        "Administrative Law",
        "Criminal Law",
        "Human Rights",
        "International Law",
        "Legal Methods",
      ],
      qs: [
        q(
          "The highest law in Nigeria is…",
          "the Constitution",
          "a state law",
          "a by-law",
          "a court rule",
        ),
        q(
          "The highest court in Nigeria is the…",
          "Supreme Court",
          "Court of Appeal",
          "High Court",
          "Magistrate Court",
        ),
        q(
          "Someone accused of a crime is presumed…",
          "innocent until proven guilty",
          "guilty until proven innocent",
          "neither",
          "guilty if arrested",
        ),
        q("How many arms of government are there?", "three", "two", "four", "five"),
      ],
    },
    {
      name: "Private and Property Law",
      code: "PPL",
      topics: [
        "Law of Contract",
        "Law of Torts",
        "Land Law",
        "Equity and Trusts",
        "Commercial Law",
        "Company Law",
      ],
      qs: [
        q(
          "A contract needs offer, acceptance and…",
          "consideration",
          "a lawyer",
          "a witness always",
          "a stamp",
        ),
        q(
          "Harm to another's reputation by false statements is…",
          "defamation",
          "trespass",
          "nuisance",
          "negligence",
        ),
        q("In Nigeria, the Land Use Act was passed in…", "1978", "1960", "1999", "1914"),
        q(
          "Entering someone's land without permission is…",
          "trespass",
          "theft",
          "assault",
          "fraud",
        ),
      ],
    },
  ],
  Education: [
    {
      name: "Educational Technology",
      code: "EDT",
      topics: [
        "Instructional Design",
        "Educational Media",
        "E-learning",
        "Computers in Education",
        "Learning Theories",
        "Educational Research",
      ],
      qs: [
        q(
          "ADDIE is a model for…",
          "instructional design",
          "school buildings",
          "testing children's IQ",
          "class timetables",
        ),
        q(
          "Learning through a computer network is called…",
          "e-learning",
          "rote learning",
          "peer review",
          "streaming",
        ),
        q("In ADDIE, the 'E' stands for…", "evaluation", "education", "examination", "engagement"),
        q(
          "Bloom's taxonomy sorts…",
          "levels of thinking in learning",
          "school subjects",
          "teachers by rank",
          "exam halls",
        ),
      ],
    },
    {
      name: "Guidance and Counselling",
      code: "GNC",
      topics: [
        "Principles of Counselling",
        "Developmental Psychology",
        "Career Guidance",
        "Counselling Skills",
        "Group Counselling",
        "Ethics in Counselling",
      ],
      qs: [
        q(
          "A counsellor's first skill is…",
          "listening",
          "advising quickly",
          "judging",
          "lecturing",
        ),
        q(
          "What a client shares with a counsellor should be kept…",
          "confidential",
          "public",
          "on social media",
          "with classmates",
        ),
        q(
          "Helping students choose a profession is…",
          "career guidance",
          "remedial teaching",
          "discipline",
          "admission",
        ),
        q(
          "Adolescence is the stage between…",
          "childhood and adulthood",
          "birth and childhood",
          "adulthood and old age",
          "infancy and toddlerhood",
        ),
      ],
    },
    {
      name: "Science Education",
      code: "SED",
      topics: [
        "Methods of Teaching Science",
        "Curriculum Studies",
        "Laboratory Management",
        "Assessment",
        "Teaching Practice",
        "Science and Society",
      ],
      qs: [
        q(
          "Learning by doing experiments is…",
          "the practical method",
          "the lecture method",
          "rote learning",
          "dictation",
        ),
        q("A lesson plan begins with the…", "objectives", "homework", "test", "conclusion"),
        q(
          "Testing during teaching to improve learning is…",
          "formative assessment",
          "summative assessment",
          "admission test",
          "aptitude test",
        ),
        q(
          "The first rule of the school laboratory is…",
          "safety",
          "speed",
          "silence only",
          "decoration",
        ),
      ],
    },
  ],
  Management: [
    {
      name: "Accounting",
      code: "ACC",
      topics: [
        "Principles of Accounting",
        "Cost Accounting",
        "Financial Reporting",
        "Auditing",
        "Taxation",
        "Islamic Accounting",
      ],
      qs: [
        q("Assets equal liabilities plus…", "equity", "expenses", "income", "debts"),
        q("Every debit entry has a matching…", "credit", "debit", "tax", "receipt"),
        q(
          "Checking a company's accounts independently is…",
          "auditing",
          "budgeting",
          "marketing",
          "banking",
        ),
        q("Zakah on savings held for a year is…", "2.5%", "10%", "5%", "20%"),
      ],
    },
    {
      name: "Business Administration",
      code: "BUS",
      topics: [
        "Principles of Management",
        "Marketing",
        "Entrepreneurship",
        "Human Resources",
        "Business Ethics",
        "Strategic Management",
      ],
      qs: [
        q(
          "The 4 Ps of marketing are product, price, place and…",
          "promotion",
          "people",
          "profit",
          "planning",
        ),
        q(
          "Someone who starts a business is an…",
          "entrepreneur",
          "employee",
          "auditor",
          "economist",
        ),
        q(
          "SWOT stands for strengths, weaknesses, opportunities and…",
          "threats",
          "targets",
          "taxes",
          "trends",
        ),
        q(
          "Selling with honesty about faults in goods is…",
          "business ethics",
          "advertising",
          "insurance",
          "logistics",
        ),
      ],
    },
    {
      name: "Banking and Finance",
      code: "BFN",
      topics: [
        "Money and Banking",
        "Islamic Banking",
        "Corporate Finance",
        "Investment",
        "Financial Markets",
        "Risk Management",
      ],
      qs: [
        q("Islamic banks do not charge…", "interest (riba)", "fees", "rent", "profit shares"),
        q("Nigeria's central bank is the…", "CBN", "NDIC", "SEC", "FIRS"),
        q(
          "A profit-sharing partnership where one side gives capital is…",
          "mudarabah",
          "murabahah",
          "ijarah",
          "takaful",
        ),
        q(
          "Shares in companies are traded on the…",
          "stock exchange",
          "central bank",
          "post office",
          "customs",
        ),
      ],
    },
  ],
  Applied: [
    {
      name: "Computer Science",
      code: "CSC",
      topics: [
        "Programming",
        "Data Structures",
        "Networks",
        "Databases",
        "Software Engineering",
        "Cyber Security",
      ],
      qs: [
        q("Which data structure is last in, first out?", "stack", "queue", "array", "heap"),
        q("HTTP is used to…", "load web pages", "edit photos", "store power", "cool computers"),
        q("A strong password should be…", "long and mixed", "your name", "123456", "your birthday"),
        q("RAM is the computer's…", "working memory", "permanent storage", "screen", "keyboard"),
      ],
    },
    {
      name: "Microbiology",
      code: "MCB",
      topics: [
        "General Microbiology",
        "Bacteriology",
        "Virology",
        "Food Microbiology",
        "Immunology",
        "Industrial Microbiology",
      ],
      qs: [
        q("Bacteria are seen with a…", "microscope", "telescope", "periscope", "stethoscope"),
        q("Antibiotics work against…", "bacteria", "viruses", "all germs equally", "allergies"),
        q("Yeast is a kind of…", "fungus", "bacterium", "virus", "plant"),
        q(
          "Washing hands with soap helps stop…",
          "the spread of germs",
          "sunburn",
          "hair loss",
          "hunger",
        ),
      ],
    },
    {
      name: "Statistics",
      code: "STA",
      topics: [
        "Descriptive Statistics",
        "Probability",
        "Statistical Inference",
        "Regression",
        "Sampling",
        "Design of Experiments",
      ],
      qs: [
        q("The middle value of sorted data is the…", "median", "mean", "mode", "range"),
        q("The most frequent value is the…", "mode", "median", "mean", "variance"),
        q("The chance of heads on a fair coin is…", "1/2", "1/4", "1", "0"),
        q("The mean of 2, 4 and 6 is…", "4", "6", "3", "12"),
      ],
    },
  ],
  Environmental: [
    {
      name: "Architecture",
      code: "ARC",
      topics: [
        "Architectural Design",
        "History of Architecture",
        "Building Construction",
        "Climate and Building",
        "Islamic Architecture",
        "Urban Design",
      ],
      qs: [
        q(
          "A drawing looking down on a building from above is a…",
          "plan",
          "elevation",
          "section",
          "perspective",
        ),
        q(
          "The pointed arch is a feature of…",
          "Islamic architecture",
          "log cabins",
          "Igloos",
          "tents only",
        ),
        q("Cross ventilation keeps buildings…", "cool", "dark", "noisy", "wet"),
        q("A mosque's tower for the adhan is the…", "minaret", "mihrab", "minbar", "dome"),
      ],
    },
    {
      name: "Estate Management",
      code: "ESM",
      topics: [
        "Principles of Valuation",
        "Property Law",
        "Land Economics",
        "Property Management",
        "Real Estate Finance",
        "Facilities Management",
      ],
      qs: [
        q(
          "Estimating what a property is worth is…",
          "valuation",
          "surveying land only",
          "decorating",
          "zoning",
        ),
        q("Money paid for using someone's property is…", "rent", "tax", "zakah", "salary"),
        q("A landlord gives a tenant a…", "lease", "loan", "mortgage", "deed of gift only"),
        q(
          "Location is the biggest factor in…",
          "property value",
          "paint colour",
          "door size",
          "roof shape",
        ),
      ],
    },
    {
      name: "Urban and Regional Planning",
      code: "URP",
      topics: [
        "Planning Theory",
        "Land Use Planning",
        "Transport Planning",
        "Housing",
        "Environmental Planning",
        "GIS",
      ],
      qs: [
        q(
          "Deciding which areas are for homes, shops or factories is…",
          "zoning",
          "valuation",
          "surveying",
          "drainage",
        ),
        q(
          "GIS stands for…",
          "Geographic Information System",
          "General Internet Service",
          "Ground Inspection Survey",
          "Global Industry Standard",
        ),
        q(
          "Good drainage in a city helps prevent…",
          "flooding",
          "traffic lights",
          "noise",
          "power cuts",
        ),
        q(
          "A master plan guides the…",
          "growth of a city",
          "price of food",
          "weather",
          "school calendar",
        ),
      ],
    },
  ],
  Agriculture: [
    {
      name: "Crop Production",
      code: "CRP",
      topics: [
        "Crop Science",
        "Soil Science",
        "Plant Breeding",
        "Pest Management",
        "Irrigation",
        "Horticulture",
      ],
      qs: [
        q(
          "Plants make food by…",
          "photosynthesis",
          "respiration only",
          "digestion",
          "fermentation",
        ),
        q(
          "Growing different crops on the same land in turns is…",
          "crop rotation",
          "monoculture",
          "grazing",
          "fallowing only",
        ),
        q(
          "Which nutrient makes leaves green and lush?",
          "nitrogen",
          "calcium",
          "iron only",
          "sodium",
        ),
        q("Cassava is grown for its…", "roots", "flowers", "seeds", "bark"),
      ],
    },
    {
      name: "Animal Science",
      code: "ANS",
      topics: [
        "Animal Nutrition",
        "Poultry Production",
        "Animal Breeding",
        "Livestock Health",
        "Fisheries",
        "Ruminant Production",
      ],
      qs: [
        q("Cows, goats and sheep are…", "ruminants", "poultry", "rodents", "reptiles"),
        q("Rearing chickens is…", "poultry farming", "aquaculture", "apiculture", "sericulture"),
        q(
          "Keeping bees for honey is…",
          "apiculture",
          "pisciculture",
          "horticulture",
          "silviculture",
        ),
        q("Fish farming is…", "aquaculture", "agronomy", "forestry", "apiculture"),
      ],
    },
    {
      name: "Agricultural Economics",
      code: "AEC",
      topics: [
        "Farm Management",
        "Agricultural Marketing",
        "Rural Development",
        "Agricultural Policy",
        "Agribusiness",
        "Farm Finance",
      ],
      qs: [
        q(
          "When supply rises and demand stays the same, prices usually…",
          "fall",
          "rise",
          "stay fixed",
          "double",
        ),
        q(
          "Farmers grouping together to buy and sell is a…",
          "cooperative",
          "monopoly",
          "cartel",
          "tax office",
        ),
        q(
          "Selling farm produce through middlemen is part of…",
          "agricultural marketing",
          "irrigation",
          "breeding",
          "soil testing",
        ),
        q("Agribusiness is farming run as a…", "business", "hobby", "school", "charity only"),
      ],
    },
  ],
};
// faculties named differently in some universities
const ALIAS: Record<string, string> = {
  Humanities: "Arts",
  "Natural and Applied": "Applied",
  "Applied Sciences": "Applied",
  "Management Sciences": "Management",
};

export const LEVELS = [100, 200, 300, 400, 500];

/** The departments of a faculty (from its name, e.g. "Faculty of Law · UNILAG"). */
function facultyKey(faculty: string) {
  const name = faculty.split(" · ")[0];
  const alias = Object.keys(ALIAS).find((k) => name.includes(k));
  if (alias) return ALIAS[alias];
  // the most specific match ("Management Sciences" before "Science")
  return (
    Object.keys(DEPTS)
      .filter((k) => name.includes(k))
      .sort((a, b) => b.length - a.length)
      .find((k) => k !== "Science") ?? (name.includes("Science") ? "Science" : "Arts")
  );
}
export function departmentsOf(faculty: string): Dept[] {
  return DEPTS[facultyKey(faculty)];
}

/** The courses of a department at a level: three a semester, with codes. */
export function coursesOf(d: Dept, level: number) {
  const n = level / 100;
  const name = (t: string) =>
    n === 1
      ? `Introduction to ${t}`
      : n === 2
        ? `${t} I`
        : n === 3
          ? `${t} II`
          : n === 4
            ? `Advanced ${t}`
            : `Seminar in ${t}`;
  return [0, 1, 2].map((k) => ({
    code: `${d.code} ${n}${k}${k + 1}`,
    title: name(d.topics[(n - 1 + k * 2) % d.topics.length]),
  }));
}

/** Five questions for a course: from its department, with some from the faculty. */
export function courseQuiz(d: Dept, faculty: string, code: string): FQ[] {
  const pool = [...d.qs, ...(FACULTY_QUESTIONS[facultyKey(faculty)] ?? [])];
  // the same course always asks the same questions, in its own order
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296;
  const order = pool.map((x) => ({ x, r: rnd() })).sort((a, b) => a.r - b.r);
  return order.slice(0, 5).map((o) => o.x);
}
export type { Dept };
