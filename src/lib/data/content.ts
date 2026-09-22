export interface Article {
  slug: string;
  title: string;
  arabic: string;
  topic: TopicId;
  minutes: number;
  excerpt: string;
  featured?: boolean;
  body: { heading?: string; text?: string; arabic?: string; translation?: string }[];
}

export const ARTICLES: Article[] = [
  {
    slug: "six-pillars-of-iman",
    title: "The Six Pillars of Iman",
    arabic: "أَرْكَانُ الْإِيمَان",
    topic: "aqeedah",
    minutes: 6,
    featured: true,
    excerpt:
      "Faith in Islam is not a vague feeling — it has a defined structure of six articles the Prophet ﷺ named explicitly.",
    body: [
      {
        text: "When Jibril عليه السلام came to the Prophet ﷺ in the form of a man and asked him about Iman, the answer was not abstract. It was a list. Six things, named in order, that together define what it means for a Muslim to believe.",
      },
      {
        arabic: "أَنْ تُؤْمِنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الْآخِرِ وَتُؤْمِنَ بِالْقَدَرِ",
        translation:
          "That you believe in Allah, His angels, His books, His messengers, the Last Day, and that you believe in divine decree.",
      },
      {
        heading: "1. Belief in Allah",
        text: "This is belief in His existence, His lordship, His exclusive right to worship, and His names and attributes as He described them — without distortion, denial, or comparison to creation.",
      },
      {
        heading: "2. Belief in the Angels",
        text: "Angels are created from light, they do not disobey, and they carry out specific commands. Jibril conveys revelation, Mika'il is charged with rain and provision, Israfil will blow the horn.",
      },
      {
        heading: "3. Belief in the Books",
        text: "The Tawrah, Zabur, Injil, the scrolls of Ibrahim, and the Quran — which confirms and completes what came before it and is preserved from alteration.",
      },
      {
        heading: "4. Belief in the Messengers",
        text: "Every nation received a warner. We affirm them all and do not distinguish between them in belief, while affirming Muhammad ﷺ as the final messenger.",
      },
      {
        heading: "5. Belief in the Last Day",
        text: "Resurrection, the reckoning, the scale, the bridge, Jannah and Jahannam. This belief is what converts private conviction into daily accountability.",
      },
      {
        heading: "6. Belief in Divine Decree",
        text: "Allah knows, has written, wills, and creates all that occurs — and the human being still acts by genuine choice and is answerable for it. Holding both truths together is the mark of sound Aqeedah.",
      },
    ],
  },
  {
    slug: "understanding-tawhid",
    title: "Understanding Tawhid",
    arabic: "التَّوْحِيد",
    topic: "aqeedah",
    minutes: 7,
    excerpt:
      "The three categories of Tawhid, and why the second one is where most of humanity historically stumbled.",
    body: [
      {
        text: "Scholars organised Tawhid into three categories not to invent doctrine, but to teach it clearly. Each category answers a different question about the relationship between Allah and creation.",
      },
      {
        heading: "Tawhid ar-Rububiyyah",
        text: "Allah alone creates, sustains, gives life and death, and controls the affairs of the universe. Even the pagans of Makkah largely affirmed this — which is exactly why it was never sufficient on its own.",
      },
      {
        arabic: "قُلْ مَن يَرْزُقُكُم مِّنَ السَّمَاءِ وَالْأَرْضِ",
        translation: "Say: Who provides for you from the heaven and the earth?",
      },
      {
        heading: "Tawhid al-Uluhiyyah",
        text: "Worship belongs to Allah alone. Prayer, supplication, vows, sacrifice, hope, fear, reliance — directing any of these to another is the shirk the messengers were sent to dismantle.",
      },
      {
        heading: "Tawhid al-Asma was-Sifat",
        text: "We affirm the names and attributes Allah affirmed for Himself, in the manner befitting Him, without likening Him to creation and without denying what He affirmed.",
      },
    ],
  },
  {
    slug: "nawawi-first-ten",
    title: "The 40 Nawawi: First Ten",
    arabic: "الْأَرْبَعُونَ النَّوَوِيَّة",
    topic: "hadith",
    minutes: 9,
    featured: true,
    excerpt:
      "Imam Nawawi's collection opens with intention and closes the first ten with lawful earning. The sequencing is not accidental.",
    body: [
      {
        text: "Imam an-Nawawi selected forty hadith that between them cover the foundations of religion, worship, character, and law. The first ten alone would reform a life if internalised.",
      },
      {
        arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        translation:
          "Deeds are only by intention, and every person will have only what they intended.",
      },
      {
        heading: "Why intention comes first",
        text: "Because a deed without intention is motion without meaning, and an intention without sincerity is a transaction with the wrong party. Nawawi placed it first so that every hadith after it is read through it.",
      },
      {
        heading: "The hadith of Jibril",
        text: "The second and third hadith establish Islam, Iman, and Ihsan as three ascending levels — outward submission, inner conviction, and worship as though you see Him.",
      },
      {
        heading: "Lawful earning",
        text: "The tenth hadith states that Allah is pure and accepts only what is pure — tying spiritual acceptance directly to how a Muslim earns and eats.",
      },
    ],
  },
  {
    slug: "night-journey",
    title: "The Night Journey",
    arabic: "الْإِسْرَاءُ وَالْمِعْرَاج",
    topic: "seerah",
    minutes: 8,
    excerpt:
      "After the hardest year of his life, the Prophet ﷺ was taken by night from Makkah to Jerusalem and through the heavens.",
    body: [
      {
        text: "The year before the Hijrah was the Prophet's ﷺ hardest: Khadijah رضي الله عنها had died, Abu Talib had died, and Ta'if had rejected him. It was precisely then that Allah honoured him with Al-Isra wal-Mi'raj.",
      },
      {
        arabic: "سُبْحَانَ الَّذِي أَسْرَى بِعَبْدِهِ لَيْلًا مِّنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى",
        translation:
          "Glory be to the One who took His servant by night from the Sacred Mosque to the Farthest Mosque.",
      },
      {
        heading: "The prayer was prescribed",
        text: "During the ascent, fifty daily prayers were prescribed and reduced to five, with the reward of fifty retained. The prayer is therefore the one obligation given directly above the heavens, not through Jibril on earth.",
      },
      {
        heading: "Abu Bakr's certainty",
        text: "When Makkah mocked the account, Abu Bakr رضي الله عنه said: if he said it, he told the truth. That response earned him the title As-Siddiq.",
      },
    ],
  },
  {
    slug: "five-pillars",
    title: "The Five Pillars of Islam",
    arabic: "أَرْكَانُ الْإِسْلَام",
    topic: "fiqh",
    minutes: 5,
    excerpt: "Shahadah, Salah, Zakat, Sawm, Hajj — the load-bearing structure of Muslim practice.",
    body: [
      {
        text: "The Prophet ﷺ used the image of a building: Islam is built upon five. Remove one and the structure is compromised.",
      },
      {
        arabic: "بُنِيَ الْإِسْلَامُ عَلَى خَمْسٍ",
        translation: "Islam is built upon five.",
      },
      {
        heading: "Shahadah",
        text: "The testimony that there is no deity worthy of worship except Allah and that Muhammad is His messenger — the doorway and the standard for everything else.",
      },
      {
        heading: "Salah",
        text: "Five daily prayers at appointed times, structuring the day around remembrance rather than fitting remembrance around the day.",
      },
      {
        heading: "Zakat",
        text: "2.5% of qualifying saved wealth annually, transferred as a right of the poor, not a favour from the rich.",
      },
      {
        heading: "Sawm",
        text: "Fasting Ramadan from dawn to sunset — training in restraint, empathy, and God-consciousness.",
      },
      {
        heading: "Hajj",
        text: "The pilgrimage to Makkah once in a lifetime for those with the means and ability.",
      },
    ],
  },
  {
    slug: "quranic-roots",
    title: "30 Quranic Root Words",
    arabic: "جُذُورُ الْقُرْآن",
    topic: "arabic",
    minutes: 10,
    excerpt:
      "Learn roots, not words. A handful of three-letter roots unlocks a large fraction of Quranic vocabulary.",
    body: [
      {
        text: "Arabic is built on roots. From a single three-letter root, dozens of related words are derived along predictable patterns. Learning fifty roots gets you further than learning five hundred isolated words.",
      },
      {
        arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
        translation: "And say: My Lord, increase me in knowledge.",
      },
      {
        heading: "ع-ل-م — knowledge",
        text: "'ilm (knowledge), 'alim (scholar), ta'lim (instruction), ma'lum (known), 'alamin (worlds).",
      },
      {
        heading: "ك-ت-ب — writing",
        text: "kitab (book), katib (writer), maktub (written/decreed), maktabah (library).",
      },
      {
        heading: "ر-ح-م — mercy",
        text: "Rahman, Rahim, rahmah (mercy), marham, and rahim (womb) — mercy and kinship share a root.",
      },
      {
        heading: "س-ل-م — peace and submission",
        text: "Islam, Muslim, salam, sallama, saleem — safety through submission.",
      },
    ],
  },
  {
    slug: "fatiha-verse-by-verse",
    title: "Surah Al-Fatiha, Verse by Verse",
    arabic: "سُورَةُ الْفَاتِحَة",
    topic: "quran",
    minutes: 8,
    featured: true,
    excerpt:
      "Seven verses recited in every unit of every prayer. Here is what each one is actually doing.",
    body: [
      {
        text: "Al-Fatiha is a conversation. The first three verses are praise, the fourth is the turning point, and the last three are the request — the most important request a human being can make.",
      },
      {
        arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        translation: "You alone we worship, and You alone we ask for help.",
      },
      {
        heading: "The hinge verse",
        text: "Verse five is where the surah pivots from speaking about Allah to speaking to Him. The fronting of 'Iyyaka' makes the meaning exclusive: You alone.",
      },
      {
        heading: "The request",
        text: "Guidance to the straight path — and then a definition of that path by the company you keep on it: those favoured, not those who earned anger, not those astray.",
      },
    ],
  },
  {
    slug: "meaning-of-al-ikhlas",
    title: "The Meaning of Al-Ikhlas",
    arabic: "مَعْنَى الْإِخْلَاص",
    topic: "tafsir",
    minutes: 6,
    excerpt: "Four verses the Prophet ﷺ said equal a third of the Quran. Why?",
    body: [
      {
        text: "Al-Ikhlas contains no command, no story, and no law. It is pure description of Allah — which is why scholars said it equals a third of the Quran: the Quran's themes are Tawhid, law, and narrative, and this surah exhausts the first.",
      },
      {
        arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ",
        translation: "Say: He is Allah, the One. Allah, the Eternal, Absolute.",
      },
      {
        heading: "Ahad, not wahid",
        text: "Ahad denotes a oneness that admits no division or plurality at all — not merely one in number but unique in being.",
      },
      {
        heading: "As-Samad",
        text: "The One free of every need, upon whom all creation depends — perfect in every attribute, deficient in none.",
      },
    ],
  },
  {
    slug: "duas-daily-life",
    title: "Duas for Daily Life",
    arabic: "أَدْعِيَةُ الْيَوْم",
    topic: "dua",
    minutes: 5,
    excerpt: "The prophetic supplications that mark waking, eating, leaving home, and sleeping.",
    body: [
      {
        text: "The sunnah covers the whole day with short supplications. None of them is long. Together they turn ordinary routine into continuous remembrance.",
      },
      {
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
        translation: "We have entered the morning and the dominion belongs to Allah.",
      },
      {
        heading: "Leaving the house",
        text: "Bismillah, tawakkaltu 'ala Allah, wa la hawla wa la quwwata illa billah — in the name of Allah, I rely on Allah, there is no power except by Allah.",
      },
      {
        heading: "Before sleep",
        text: "Recite Ayat al-Kursi, the three final surahs, and say: Bismika Allahumma amutu wa ahya.",
      },
    ],
  },
  {
    slug: "sabr-and-shukr",
    title: "Sabr & Shukr: Two Halves of Iman",
    arabic: "الصَّبْرُ وَالشُّكْر",
    topic: "aqeedah",
    minutes: 7,
    excerpt: "Patience in hardship, gratitude in ease — and why the believer profits either way.",
    body: [
      {
        text: "The Prophet ﷺ described the believer's situation as entirely advantageous: given ease, they are grateful and that is good for them; given hardship, they are patient and that is good for them.",
      },
      {
        arabic: "عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْر",
        translation: "How wonderful is the affair of the believer — all of it is good.",
      },
      {
        heading: "Sabr is active",
        text: "Patience is not passivity. It is restraining the tongue from complaint, the limbs from despair, and the heart from resentment while still striving.",
      },
      {
        heading: "Shukr is structural",
        text: "Gratitude is expressed with the tongue, the heart, and the limbs — using the blessing in the way its Giver intended.",
      },
    ],
  },
];

export const articleBySlug = (slug: string) => ARTICLES.find((a) => a.slug === slug);

// ── Daily Wisdom ─────────────────────────────────────────────────────────
export interface Wisdom {
  id: number;
  kind: "Hadith" | "Ayah";
  arabic: string;
  translit: string;
  translation: string;
  source: string;
  date: string;
}

export const WISDOM: Wisdom[] = [
  {
    id: 97,
    kind: "Hadith",
    arabic: "مَنْ سَلَكَ طَرِيقًا يَطْلُبُ فِيهِ عِلْمًا سَلَكَ اللَّهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    translit: "Man salaka tariqan yatlubu fihi 'ilman salaka Allahu bihi tariqan ilal-jannah",
    translation:
      "Whoever travels a path in search of knowledge, Allah will place them on a path to Paradise.",
    source: "Sunan at-Tirmidhi 2646",
    date: "Today",
  },
  {
    id: 96,
    kind: "Ayah",
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    translit: "Wa qul Rabbi zidni 'ilma",
    translation: "And say: My Lord, increase me in knowledge.",
    source: "Quran 20:114",
    date: "Yesterday",
  },
  {
    id: 95,
    kind: "Hadith",
    arabic: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
    translit: "Ahabbul-a'mali ilallahi adwamuha wa in qall",
    translation: "The deeds most beloved to Allah are the most consistent, even if small.",
    source: "Sahih al-Bukhari 6464",
    date: "2 days ago",
  },
  {
    id: 94,
    kind: "Ayah",
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translit: "Inna ma'al-'usri yusra",
    translation: "Indeed, with hardship comes ease.",
    source: "Quran 94:6",
    date: "3 days ago",
  },
  {
    id: 93,
    kind: "Hadith",
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    translit: "Al-muslimu man salimal-muslimuna min lisanihi wa yadih",
    translation: "The Muslim is one from whose tongue and hand other Muslims are safe.",
    source: "Sahih al-Bukhari 10",
    date: "4 days ago",
  },
  {
    id: 92,
    kind: "Ayah",
    arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    translit: "Wa man yattaqillaha yaj'al lahu makhraja",
    translation: "Whoever is conscious of Allah, He will make a way out for them.",
    source: "Quran 65:2",
    date: "5 days ago",
  },
];

// ── Social ───────────────────────────────────────────────────────────────
