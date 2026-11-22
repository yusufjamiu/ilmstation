/* Starter kids games: quizzes (en/ar/id/tl), picture puzzles and memory games.
   Added from Admin → Kids games → "Add starter games". Generated; edit games in the admin afterwards. */
export type StarterGame = { id: string; title: string; subject: string; emoji: string; color: string; gameType: string; kind: "quiz" | "html"; htmlUrl?: string; questions: { q: string; options: string[]; answer: number }[]; order: number; lang: string; tier: "free" | "premium" };
export const STARTER_GAMES: StarterGame[] = [
{
"id": "starter-quiz-manners-1-en",
"title": "Good Manners",
"subject": "Good Manners",
"emoji": "😊",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "What do we say when we meet someone?",
"options": [
"Goodbye",
"Assalamu alaikum",
"Allahu Akbar"
],
"answer": 1
},
{
"q": "What do we say before eating?",
"options": [
"Bismillah",
"SubhanAllah",
"Ameen"
],
"answer": 0
},
{
"q": "What do we say after eating?",
"options": [
"Alhamdulillah",
"Bismillah",
"In shaa Allah"
],
"answer": 0
},
{
"q": "Which hand do we eat with?",
"options": [
"Left hand",
"Right hand",
"Both feet"
],
"answer": 1
},
{
"q": "What do we say when someone sneezes and says Alhamdulillah?",
"options": [
"Yarhamukallah",
"Bismillah",
"Ameen"
],
"answer": 0
}
],
"order": 0,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-manners-1-ar",
"title": "الأخلاق الحسنة",
"subject": "الأخلاق الحسنة",
"emoji": "😊",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "ماذا نقول عندما نلقى أحدًا؟",
"options": [
"مع السلامة",
"السلام عليكم",
"الله أكبر"
],
"answer": 1
},
{
"q": "ماذا نقول قبل الأكل؟",
"options": [
"بسم الله",
"سبحان الله",
"آمين"
],
"answer": 0
},
{
"q": "ماذا نقول بعد الأكل؟",
"options": [
"الحمد لله",
"بسم الله",
"إن شاء الله"
],
"answer": 0
},
{
"q": "بأي يد نأكل؟",
"options": [
"اليد اليسرى",
"اليد اليمنى",
"بالقدمين"
],
"answer": 1
},
{
"q": "ماذا نقول إذا عطس أحد وقال: الحمد لله؟",
"options": [
"يرحمك الله",
"بسم الله",
"آمين"
],
"answer": 0
}
],
"order": 0,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-manners-1-id",
"title": "Adab yang Baik",
"subject": "Adab yang Baik",
"emoji": "😊",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Apa yang kita ucapkan saat bertemu seseorang?",
"options": [
"Selamat tinggal",
"Assalamu'alaikum",
"Allahu Akbar"
],
"answer": 1
},
{
"q": "Apa yang kita ucapkan sebelum makan?",
"options": [
"Bismillah",
"Subhanallah",
"Aamiin"
],
"answer": 0
},
{
"q": "Apa yang kita ucapkan setelah makan?",
"options": [
"Alhamdulillah",
"Bismillah",
"Insya Allah"
],
"answer": 0
},
{
"q": "Kita makan dengan tangan apa?",
"options": [
"Tangan kiri",
"Tangan kanan",
"Kedua kaki"
],
"answer": 1
},
{
"q": "Apa yang kita ucapkan saat seseorang bersin dan berkata Alhamdulillah?",
"options": [
"Yarhamukallah",
"Bismillah",
"Aamiin"
],
"answer": 0
}
],
"order": 0,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-manners-1-tl",
"title": "Mabuting Asal",
"subject": "Mabuting Asal",
"emoji": "😊",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ano ang sinasabi natin kapag may nakasalubong?",
"options": [
"Paalam",
"Assalamu alaikum",
"Allahu Akbar"
],
"answer": 1
},
{
"q": "Ano ang sinasabi natin bago kumain?",
"options": [
"Bismillah",
"SubhanAllah",
"Ameen"
],
"answer": 0
},
{
"q": "Ano ang sinasabi natin pagkatapos kumain?",
"options": [
"Alhamdulillah",
"Bismillah",
"In shaa Allah"
],
"answer": 0
},
{
"q": "Aling kamay ang ginagamit natin sa pagkain?",
"options": [
"Kaliwang kamay",
"Kanang kamay",
"Dalawang paa"
],
"answer": 1
},
{
"q": "Ano ang sinasabi natin kapag may bumahing at nagsabing Alhamdulillah?",
"options": [
"Yarhamukallah",
"Bismillah",
"Ameen"
],
"answer": 0
}
],
"order": 0,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-manners-2-en",
"title": "Good Manners",
"subject": "Good Manners",
"emoji": "😊",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "How should we speak to our parents?",
"options": [
"Kindly",
"Loudly",
"Rudely"
],
"answer": 0
},
{
"q": "What do we say to thank someone?",
"options": [
"JazakAllahu khayran",
"Allahu Akbar",
"Assalamu alaikum"
],
"answer": 0
},
{
"q": "When we make a promise for tomorrow we say...",
"options": [
"In shaa Allah",
"Alhamdulillah",
"SubhanAllah"
],
"answer": 0
},
{
"q": "What do we reply to Assalamu alaikum?",
"options": [
"Wa alaikum assalam",
"Bismillah",
"Ameen"
],
"answer": 0
}
],
"order": 1,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-manners-2-ar",
"title": "الأخلاق الحسنة",
"subject": "الأخلاق الحسنة",
"emoji": "😊",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "كيف نكلّم والدينا؟",
"options": [
"بلطف",
"بصوت عالٍ",
"بقلة أدب"
],
"answer": 0
},
{
"q": "ماذا نقول لنشكر أحدًا؟",
"options": [
"جزاك الله خيرًا",
"الله أكبر",
"السلام عليكم"
],
"answer": 0
},
{
"q": "عندما نَعِد بشيء للغد نقول...",
"options": [
"إن شاء الله",
"الحمد لله",
"سبحان الله"
],
"answer": 0
},
{
"q": "بماذا نردّ على السلام عليكم؟",
"options": [
"وعليكم السلام",
"بسم الله",
"آمين"
],
"answer": 0
}
],
"order": 1,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-manners-2-id",
"title": "Adab yang Baik",
"subject": "Adab yang Baik",
"emoji": "😊",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Bagaimana kita berbicara kepada orang tua?",
"options": [
"Dengan lembut",
"Dengan keras",
"Dengan kasar"
],
"answer": 0
},
{
"q": "Apa yang kita ucapkan untuk berterima kasih?",
"options": [
"Jazakallahu khairan",
"Allahu Akbar",
"Assalamu'alaikum"
],
"answer": 0
},
{
"q": "Saat berjanji untuk besok kita mengucapkan...",
"options": [
"Insya Allah",
"Alhamdulillah",
"Subhanallah"
],
"answer": 0
},
{
"q": "Apa jawaban untuk Assalamu'alaikum?",
"options": [
"Wa'alaikumussalam",
"Bismillah",
"Aamiin"
],
"answer": 0
}
],
"order": 1,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-manners-2-tl",
"title": "Mabuting Asal",
"subject": "Mabuting Asal",
"emoji": "😊",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Paano tayo dapat makipag-usap sa ating mga magulang?",
"options": [
"Nang mabait",
"Nang malakas",
"Nang bastos"
],
"answer": 0
},
{
"q": "Ano ang sinasabi natin para magpasalamat?",
"options": [
"JazakAllahu khayran",
"Allahu Akbar",
"Assalamu alaikum"
],
"answer": 0
},
{
"q": "Kapag nangangako tayo para bukas, sinasabi natin...",
"options": [
"In shaa Allah",
"Alhamdulillah",
"SubhanAllah"
],
"answer": 0
},
{
"q": "Ano ang sagot natin sa Assalamu alaikum?",
"options": [
"Wa alaikum assalam",
"Bismillah",
"Ameen"
],
"answer": 0
}
],
"order": 1,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-pillars-1-en",
"title": "5 Pillars",
"subject": "5 Pillars",
"emoji": "🕋",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "How many pillars of Islam are there?",
"options": [
"3",
"5",
"7"
],
"answer": 1
},
{
"q": "What is the first pillar of Islam?",
"options": [
"Shahada",
"Hajj",
"Zakat"
],
"answer": 0
},
{
"q": "Which pillar is praying 5 times a day?",
"options": [
"Salah",
"Sawm",
"Zakat"
],
"answer": 0
},
{
"q": "Which pillar is fasting in Ramadan?",
"options": [
"Sawm",
"Hajj",
"Salah"
],
"answer": 0
},
{
"q": "Which pillar is giving to the poor?",
"options": [
"Zakat",
"Salah",
"Shahada"
],
"answer": 0
}
],
"order": 0,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-pillars-1-ar",
"title": "أركان الإسلام",
"subject": "أركان الإسلام",
"emoji": "🕋",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "كم عدد أركان الإسلام؟",
"options": [
"3",
"5",
"7"
],
"answer": 1
},
{
"q": "ما أول ركن من أركان الإسلام؟",
"options": [
"الشهادة",
"الحج",
"الزكاة"
],
"answer": 0
},
{
"q": "أي ركن هو الصلاة 5 مرات في اليوم؟",
"options": [
"الصلاة",
"الصوم",
"الزكاة"
],
"answer": 0
},
{
"q": "أي ركن هو صيام رمضان؟",
"options": [
"الصوم",
"الحج",
"الصلاة"
],
"answer": 0
},
{
"q": "أي ركن هو إعطاء الفقراء؟",
"options": [
"الزكاة",
"الصلاة",
"الشهادة"
],
"answer": 0
}
],
"order": 0,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-pillars-1-id",
"title": "Rukun Islam",
"subject": "Rukun Islam",
"emoji": "🕋",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ada berapa rukun Islam?",
"options": [
"3",
"5",
"7"
],
"answer": 1
},
{
"q": "Apa rukun Islam yang pertama?",
"options": [
"Syahadat",
"Haji",
"Zakat"
],
"answer": 0
},
{
"q": "Rukun mana yang shalat 5 kali sehari?",
"options": [
"Shalat",
"Puasa",
"Zakat"
],
"answer": 0
},
{
"q": "Rukun mana yang berpuasa di bulan Ramadhan?",
"options": [
"Puasa",
"Haji",
"Shalat"
],
"answer": 0
},
{
"q": "Rukun mana yang memberi kepada fakir miskin?",
"options": [
"Zakat",
"Shalat",
"Syahadat"
],
"answer": 0
}
],
"order": 0,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-pillars-1-tl",
"title": "5 Haligi",
"subject": "5 Haligi",
"emoji": "🕋",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ilan ang haligi ng Islam?",
"options": [
"3",
"5",
"7"
],
"answer": 1
},
{
"q": "Ano ang unang haligi ng Islam?",
"options": [
"Shahada",
"Hajj",
"Zakat"
],
"answer": 0
},
{
"q": "Aling haligi ang pagdarasal nang 5 beses sa isang araw?",
"options": [
"Salah",
"Sawm",
"Zakat"
],
"answer": 0
},
{
"q": "Aling haligi ang pag-aayuno sa Ramadan?",
"options": [
"Sawm",
"Hajj",
"Salah"
],
"answer": 0
},
{
"q": "Aling haligi ang pagbibigay sa mahihirap?",
"options": [
"Zakat",
"Salah",
"Shahada"
],
"answer": 0
}
],
"order": 0,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-pillars-2-en",
"title": "5 Pillars",
"subject": "5 Pillars",
"emoji": "🕋",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Which pillar is the journey to Makkah?",
"options": [
"Hajj",
"Sawm",
"Zakat"
],
"answer": 0
},
{
"q": "Where do Muslims go for Hajj?",
"options": [
"Makkah",
"Cairo",
"Lagos"
],
"answer": 0
},
{
"q": "How many times do we pray each day?",
"options": [
"3",
"5",
"10"
],
"answer": 1
}
],
"order": 1,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-pillars-2-ar",
"title": "أركان الإسلام",
"subject": "أركان الإسلام",
"emoji": "🕋",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "أي ركن هو السفر إلى مكة؟",
"options": [
"الحج",
"الصوم",
"الزكاة"
],
"answer": 0
},
{
"q": "إلى أين يذهب المسلمون للحج؟",
"options": [
"مكة",
"القاهرة",
"لاغوس"
],
"answer": 0
},
{
"q": "كم مرة نصلّي في اليوم؟",
"options": [
"3",
"5",
"10"
],
"answer": 1
}
],
"order": 1,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-pillars-2-id",
"title": "Rukun Islam",
"subject": "Rukun Islam",
"emoji": "🕋",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Rukun mana yang perjalanan ke Makkah?",
"options": [
"Haji",
"Puasa",
"Zakat"
],
"answer": 0
},
{
"q": "Ke mana kaum Muslim pergi untuk haji?",
"options": [
"Makkah",
"Kairo",
"Lagos"
],
"answer": 0
},
{
"q": "Berapa kali kita shalat setiap hari?",
"options": [
"3",
"5",
"10"
],
"answer": 1
}
],
"order": 1,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-pillars-2-tl",
"title": "5 Haligi",
"subject": "5 Haligi",
"emoji": "🕋",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Aling haligi ang paglalakbay sa Makkah?",
"options": [
"Hajj",
"Sawm",
"Zakat"
],
"answer": 0
},
{
"q": "Saan pumupunta ang mga Muslim para sa Hajj?",
"options": [
"Makkah",
"Cairo",
"Lagos"
],
"answer": 0
},
{
"q": "Ilang beses tayo nagdarasal bawat araw?",
"options": [
"3",
"5",
"10"
],
"answer": 1
}
],
"order": 1,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-1-en",
"title": "Salah & Wudu",
"subject": "Salah & Wudu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "How many rakahs in Fajr?",
"options": [
"2",
"3",
"4"
],
"answer": 0
},
{
"q": "How many rakahs in Maghrib?",
"options": [
"2",
"3",
"4"
],
"answer": 1
},
{
"q": "How many rakahs in Dhuhr?",
"options": [
"2",
"3",
"4"
],
"answer": 2
},
{
"q": "How many prayers every day?",
"options": [
"3",
"5",
"7"
],
"answer": 1
},
{
"q": "How many sujud in each rakah?",
"options": [
"1",
"2",
"3"
],
"answer": 1
},
{
"q": "Which way do we face to pray?",
"options": [
"Qibla",
"The sun",
"The door"
],
"answer": 0
}
],
"order": 0,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-1-ar",
"title": "الصلاة والوضوء",
"subject": "الصلاة والوضوء",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "كم ركعة في الفجر؟",
"options": [
"2",
"3",
"4"
],
"answer": 0
},
{
"q": "كم ركعة في المغرب؟",
"options": [
"2",
"3",
"4"
],
"answer": 1
},
{
"q": "كم ركعة في الظهر؟",
"options": [
"2",
"3",
"4"
],
"answer": 2
},
{
"q": "كم صلاة في اليوم؟",
"options": [
"3",
"5",
"7"
],
"answer": 1
},
{
"q": "كم سجدة في كل ركعة؟",
"options": [
"1",
"2",
"3"
],
"answer": 1
},
{
"q": "إلى أين نتّجه في الصلاة؟",
"options": [
"القبلة",
"الشمس",
"الباب"
],
"answer": 0
}
],
"order": 0,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-1-id",
"title": "Shalat & Wudhu",
"subject": "Shalat & Wudhu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Berapa rakaat shalat Subuh?",
"options": [
"2",
"3",
"4"
],
"answer": 0
},
{
"q": "Berapa rakaat shalat Maghrib?",
"options": [
"2",
"3",
"4"
],
"answer": 1
},
{
"q": "Berapa rakaat shalat Dzuhur?",
"options": [
"2",
"3",
"4"
],
"answer": 2
},
{
"q": "Berapa shalat setiap hari?",
"options": [
"3",
"5",
"7"
],
"answer": 1
},
{
"q": "Berapa sujud dalam setiap rakaat?",
"options": [
"1",
"2",
"3"
],
"answer": 1
},
{
"q": "Ke arah mana kita menghadap saat shalat?",
"options": [
"Kiblat",
"Matahari",
"Pintu"
],
"answer": 0
}
],
"order": 0,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-1-tl",
"title": "Salah at Wudu",
"subject": "Salah at Wudu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ilang rakah sa Fajr?",
"options": [
"2",
"3",
"4"
],
"answer": 0
},
{
"q": "Ilang rakah sa Maghrib?",
"options": [
"2",
"3",
"4"
],
"answer": 1
},
{
"q": "Ilang rakah sa Dhuhr?",
"options": [
"2",
"3",
"4"
],
"answer": 2
},
{
"q": "Ilang dasal bawat araw?",
"options": [
"3",
"5",
"7"
],
"answer": 1
},
{
"q": "Ilang sujud sa bawat rakah?",
"options": [
"1",
"2",
"3"
],
"answer": 1
},
{
"q": "Saan tayo nakaharap kapag nagdarasal?",
"options": [
"Qibla",
"Ang araw",
"Ang pinto"
],
"answer": 0
}
],
"order": 0,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-2-en",
"title": "Salah & Wudu",
"subject": "Salah & Wudu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Which arm do we wash first?",
"options": [
"Right",
"Left"
],
"answer": 0
},
{
"q": "Which foot do we wash first?",
"options": [
"Right",
"Left"
],
"answer": 0
},
{
"q": "Do we wash or wipe our head?",
"options": [
"Wash",
"Wipe"
],
"answer": 1
},
{
"q": "We wash our arms up to the...",
"options": [
"Wrists",
"Elbows",
"Shoulders"
],
"answer": 1
},
{
"q": "We wash our feet up to the...",
"options": [
"Toes",
"Ankles",
"Knees"
],
"answer": 1
},
{
"q": "How many times do we wipe our head?",
"options": [
"1 time",
"2 times",
"3 times"
],
"answer": 0
},
{
"q": "What is the first thing we wash?",
"options": [
"Feet",
"Hands",
"Face"
],
"answer": 1
},
{
"q": "What is the last thing we wash?",
"options": [
"Feet",
"Arms",
"Ears"
],
"answer": 0
}
],
"order": 1,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-2-ar",
"title": "الصلاة والوضوء",
"subject": "الصلاة والوضوء",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "أي ذراع نغسل أولًا؟",
"options": [
"اليمنى",
"اليسرى"
],
"answer": 0
},
{
"q": "أي قدم نغسل أولًا؟",
"options": [
"اليمنى",
"اليسرى"
],
"answer": 0
},
{
"q": "هل نغسل الرأس أم نمسحه؟",
"options": [
"نغسل",
"نمسح"
],
"answer": 1
},
{
"q": "نغسل الذراعين إلى...",
"options": [
"الرسغين",
"المرفقين",
"الكتفين"
],
"answer": 1
},
{
"q": "نغسل القدمين إلى...",
"options": [
"الأصابع",
"الكعبين",
"الركبتين"
],
"answer": 1
},
{
"q": "كم مرة نمسح الرأس؟",
"options": [
"مرة",
"مرتان",
"3 مرات"
],
"answer": 0
},
{
"q": "ما أول شيء نغسله؟",
"options": [
"القدمان",
"اليدان",
"الوجه"
],
"answer": 1
},
{
"q": "ما آخر شيء نغسله؟",
"options": [
"القدمان",
"الذراعان",
"الأذنان"
],
"answer": 0
}
],
"order": 1,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-2-id",
"title": "Shalat & Wudhu",
"subject": "Shalat & Wudhu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Lengan mana yang dibasuh dulu?",
"options": [
"Kanan",
"Kiri"
],
"answer": 0
},
{
"q": "Kaki mana yang dibasuh dulu?",
"options": [
"Kanan",
"Kiri"
],
"answer": 0
},
{
"q": "Kepala dibasuh atau diusap?",
"options": [
"Dibasuh",
"Diusap"
],
"answer": 1
},
{
"q": "Kita membasuh lengan sampai...",
"options": [
"Pergelangan",
"Siku",
"Bahu"
],
"answer": 1
},
{
"q": "Kita membasuh kaki sampai...",
"options": [
"Jari kaki",
"Mata kaki",
"Lutut"
],
"answer": 1
},
{
"q": "Berapa kali kita mengusap kepala?",
"options": [
"1 kali",
"2 kali",
"3 kali"
],
"answer": 0
},
{
"q": "Apa yang pertama kita basuh?",
"options": [
"Kaki",
"Tangan",
"Wajah"
],
"answer": 1
},
{
"q": "Apa yang terakhir kita basuh?",
"options": [
"Kaki",
"Lengan",
"Telinga"
],
"answer": 0
}
],
"order": 1,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-2-tl",
"title": "Salah at Wudu",
"subject": "Salah at Wudu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Aling braso ang unang hinuhugasan?",
"options": [
"Kanan",
"Kaliwa"
],
"answer": 0
},
{
"q": "Aling paa ang unang hinuhugasan?",
"options": [
"Kanan",
"Kaliwa"
],
"answer": 0
},
{
"q": "Hinuhugasan ba o pinupunasan ang ulo?",
"options": [
"Hugasan",
"Punasan"
],
"answer": 1
},
{
"q": "Hinuhugasan natin ang braso hanggang sa...",
"options": [
"Pulso",
"Siko",
"Balikat"
],
"answer": 1
},
{
"q": "Hinuhugasan natin ang paa hanggang sa...",
"options": [
"Daliri ng paa",
"Bukung-bukong",
"Tuhod"
],
"answer": 1
},
{
"q": "Ilang beses natin pinupunasan ang ulo?",
"options": [
"1 beses",
"2 beses",
"3 beses"
],
"answer": 0
},
{
"q": "Ano ang unang hinuhugasan natin?",
"options": [
"Paa",
"Kamay",
"Mukha"
],
"answer": 1
},
{
"q": "Ano ang huling hinuhugasan natin?",
"options": [
"Paa",
"Braso",
"Tainga"
],
"answer": 0
}
],
"order": 1,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-3-en",
"title": "Salah & Wudu",
"subject": "Salah & Wudu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Which arm do we wash first?",
"options": [
"Right",
"Left"
],
"answer": 0
},
{
"q": "Which foot do we wash first?",
"options": [
"Right",
"Left"
],
"answer": 0
},
{
"q": "Do we wash or wipe our head?",
"options": [
"Wash",
"Wipe"
],
"answer": 1
},
{
"q": "We wash our arms up to the...",
"options": [
"Wrists",
"Elbows",
"Shoulders"
],
"answer": 1
},
{
"q": "We wash our feet up to the...",
"options": [
"Toes",
"Ankles",
"Knees"
],
"answer": 1
},
{
"q": "How many times do we wipe our head?",
"options": [
"1 time",
"2 times",
"3 times"
],
"answer": 0
},
{
"q": "What is the first thing we wash?",
"options": [
"Feet",
"Hands",
"Face"
],
"answer": 1
},
{
"q": "What is the last thing we wash?",
"options": [
"Feet",
"Arms",
"Ears"
],
"answer": 0
}
],
"order": 2,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-3-ar",
"title": "الصلاة والوضوء",
"subject": "الصلاة والوضوء",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "أي ذراع نغسل أولًا؟",
"options": [
"اليمنى",
"اليسرى"
],
"answer": 0
},
{
"q": "أي قدم نغسل أولًا؟",
"options": [
"اليمنى",
"اليسرى"
],
"answer": 0
},
{
"q": "هل نغسل الرأس أم نمسحه؟",
"options": [
"نغسل",
"نمسح"
],
"answer": 1
},
{
"q": "نغسل الذراعين إلى...",
"options": [
"الرسغين",
"المرفقين",
"الكتفين"
],
"answer": 1
},
{
"q": "نغسل القدمين إلى...",
"options": [
"الأصابع",
"الكعبين",
"الركبتين"
],
"answer": 1
},
{
"q": "كم مرة نمسح الرأس؟",
"options": [
"مرة",
"مرتان",
"3 مرات"
],
"answer": 0
},
{
"q": "ما أول شيء نغسله؟",
"options": [
"القدمان",
"اليدان",
"الوجه"
],
"answer": 1
},
{
"q": "ما آخر شيء نغسله؟",
"options": [
"القدمان",
"الذراعان",
"الأذنان"
],
"answer": 0
}
],
"order": 2,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-3-id",
"title": "Shalat & Wudhu",
"subject": "Shalat & Wudhu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Lengan mana yang dibasuh dulu?",
"options": [
"Kanan",
"Kiri"
],
"answer": 0
},
{
"q": "Kaki mana yang dibasuh dulu?",
"options": [
"Kanan",
"Kiri"
],
"answer": 0
},
{
"q": "Kepala dibasuh atau diusap?",
"options": [
"Dibasuh",
"Diusap"
],
"answer": 1
},
{
"q": "Kita membasuh lengan sampai...",
"options": [
"Pergelangan",
"Siku",
"Bahu"
],
"answer": 1
},
{
"q": "Kita membasuh kaki sampai...",
"options": [
"Jari kaki",
"Mata kaki",
"Lutut"
],
"answer": 1
},
{
"q": "Berapa kali kita mengusap kepala?",
"options": [
"1 kali",
"2 kali",
"3 kali"
],
"answer": 0
},
{
"q": "Apa yang pertama kita basuh?",
"options": [
"Kaki",
"Tangan",
"Wajah"
],
"answer": 1
},
{
"q": "Apa yang terakhir kita basuh?",
"options": [
"Kaki",
"Lengan",
"Telinga"
],
"answer": 0
}
],
"order": 2,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-salahwudu-3-tl",
"title": "Salah at Wudu",
"subject": "Salah at Wudu",
"emoji": "🕌",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Aling braso ang unang hinuhugasan?",
"options": [
"Kanan",
"Kaliwa"
],
"answer": 0
},
{
"q": "Aling paa ang unang hinuhugasan?",
"options": [
"Kanan",
"Kaliwa"
],
"answer": 0
},
{
"q": "Hinuhugasan ba o pinupunasan ang ulo?",
"options": [
"Hugasan",
"Punasan"
],
"answer": 1
},
{
"q": "Hinuhugasan natin ang braso hanggang sa...",
"options": [
"Pulso",
"Siko",
"Balikat"
],
"answer": 1
},
{
"q": "Hinuhugasan natin ang paa hanggang sa...",
"options": [
"Daliri ng paa",
"Bukung-bukong",
"Tuhod"
],
"answer": 1
},
{
"q": "Ilang beses natin pinupunasan ang ulo?",
"options": [
"1 beses",
"2 beses",
"3 beses"
],
"answer": 0
},
{
"q": "Ano ang unang hinuhugasan natin?",
"options": [
"Paa",
"Kamay",
"Mukha"
],
"answer": 1
},
{
"q": "Ano ang huling hinuhugasan natin?",
"options": [
"Paa",
"Braso",
"Tainga"
],
"answer": 0
}
],
"order": 2,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-prophets-1-en",
"title": "The Prophets",
"subject": "The Prophets",
"emoji": "🌙",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Who was the first prophet?",
"options": [
"Adam",
"Musa",
"Isa"
],
"answer": 0
},
{
"q": "Which prophet built the ark?",
"options": [
"Nuh",
"Yusuf",
"Dawud"
],
"answer": 0
},
{
"q": "Which prophet was swallowed by a big fish?",
"options": [
"Yunus",
"Ibrahim",
"Sulaiman"
],
"answer": 0
},
{
"q": "Who built the Kaaba with his son Ismail?",
"options": [
"Ibrahim",
"Musa",
"Nuh"
],
"answer": 0
},
{
"q": "Which prophet's staff split the sea?",
"options": [
"Musa",
"Isa",
"Adam"
],
"answer": 0
}
],
"order": 0,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-prophets-1-ar",
"title": "الأنبياء",
"subject": "الأنبياء",
"emoji": "🌙",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "من أول الأنبياء؟",
"options": [
"آدم",
"موسى",
"عيسى"
],
"answer": 0
},
{
"q": "أي نبي صنع السفينة؟",
"options": [
"نوح",
"يوسف",
"داود"
],
"answer": 0
},
{
"q": "أي نبي ابتلعه الحوت؟",
"options": [
"يونس",
"إبراهيم",
"سليمان"
],
"answer": 0
},
{
"q": "من بنى الكعبة مع ابنه إسماعيل؟",
"options": [
"إبراهيم",
"موسى",
"نوح"
],
"answer": 0
},
{
"q": "أي نبي شقّت عصاه البحر؟",
"options": [
"موسى",
"عيسى",
"آدم"
],
"answer": 0
}
],
"order": 0,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-prophets-1-id",
"title": "Para Nabi",
"subject": "Para Nabi",
"emoji": "🌙",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Siapa nabi pertama?",
"options": [
"Adam",
"Musa",
"Isa"
],
"answer": 0
},
{
"q": "Nabi siapa yang membuat bahtera?",
"options": [
"Nuh",
"Yusuf",
"Daud"
],
"answer": 0
},
{
"q": "Nabi siapa yang ditelan ikan besar?",
"options": [
"Yunus",
"Ibrahim",
"Sulaiman"
],
"answer": 0
},
{
"q": "Siapa yang membangun Ka'bah bersama putranya Ismail?",
"options": [
"Ibrahim",
"Musa",
"Nuh"
],
"answer": 0
},
{
"q": "Tongkat nabi siapa yang membelah laut?",
"options": [
"Musa",
"Isa",
"Adam"
],
"answer": 0
}
],
"order": 0,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-prophets-1-tl",
"title": "Ang mga Propeta",
"subject": "Ang mga Propeta",
"emoji": "🌙",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Sino ang unang propeta?",
"options": [
"Adam",
"Musa",
"Isa"
],
"answer": 0
},
{
"q": "Aling propeta ang gumawa ng arko?",
"options": [
"Nuh",
"Yusuf",
"Dawud"
],
"answer": 0
},
{
"q": "Aling propeta ang nilunok ng malaking isda?",
"options": [
"Yunus",
"Ibrahim",
"Sulaiman"
],
"answer": 0
},
{
"q": "Sino ang nagtayo ng Kaaba kasama ang anak niyang si Ismail?",
"options": [
"Ibrahim",
"Musa",
"Nuh"
],
"answer": 0
},
{
"q": "Kaninong tungkod ng propeta ang humati sa dagat?",
"options": [
"Musa",
"Isa",
"Adam"
],
"answer": 0
}
],
"order": 0,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-prophets-2-en",
"title": "The Prophets",
"subject": "The Prophets",
"emoji": "🌙",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Who is the last prophet?",
"options": [
"Muhammad ﷺ",
"Isa",
"Ibrahim"
],
"answer": 0
},
{
"q": "Which prophet could talk to animals and jinn?",
"options": [
"Sulaiman",
"Yunus",
"Nuh"
],
"answer": 0
},
{
"q": "Which prophet was thrown into a well by his brothers?",
"options": [
"Yusuf",
"Musa",
"Adam"
],
"answer": 0
}
],
"order": 1,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-prophets-2-ar",
"title": "الأنبياء",
"subject": "الأنبياء",
"emoji": "🌙",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "من آخر الأنبياء؟",
"options": [
"محمد ﷺ",
"عيسى",
"إبراهيم"
],
"answer": 0
},
{
"q": "أي نبي كان يكلّم الحيوانات والجن؟",
"options": [
"سليمان",
"يونس",
"نوح"
],
"answer": 0
},
{
"q": "أي نبي ألقاه إخوته في البئر؟",
"options": [
"يوسف",
"موسى",
"آدم"
],
"answer": 0
}
],
"order": 1,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-prophets-2-id",
"title": "Para Nabi",
"subject": "Para Nabi",
"emoji": "🌙",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Siapa nabi terakhir?",
"options": [
"Muhammad ﷺ",
"Isa",
"Ibrahim"
],
"answer": 0
},
{
"q": "Nabi siapa yang bisa berbicara dengan hewan dan jin?",
"options": [
"Sulaiman",
"Yunus",
"Nuh"
],
"answer": 0
},
{
"q": "Nabi siapa yang dilempar ke sumur oleh saudara-saudaranya?",
"options": [
"Yusuf",
"Musa",
"Adam"
],
"answer": 0
}
],
"order": 1,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-prophets-2-tl",
"title": "Ang mga Propeta",
"subject": "Ang mga Propeta",
"emoji": "🌙",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Sino ang huling propeta?",
"options": [
"Muhammad ﷺ",
"Isa",
"Ibrahim"
],
"answer": 0
},
{
"q": "Aling propeta ang nakakausap ang mga hayop at jinn?",
"options": [
"Sulaiman",
"Yunus",
"Nuh"
],
"answer": 0
},
{
"q": "Aling propeta ang inihulog sa balon ng kanyang mga kapatid?",
"options": [
"Yusuf",
"Musa",
"Adam"
],
"answer": 0
}
],
"order": 1,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-quran-1-en",
"title": "The Quran",
"subject": "The Quran",
"emoji": "📖",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "What is the first surah of the Quran?",
"options": [
"Al-Fatiha",
"Al-Ikhlas",
"An-Nas"
],
"answer": 0
},
{
"q": "How many surahs are in the Quran?",
"options": [
"30",
"99",
"114"
],
"answer": 2
},
{
"q": "In which month was the Quran first revealed?",
"options": [
"Ramadan",
"Shawwal",
"Muharram"
],
"answer": 0
},
{
"q": "Which angel brought the Quran?",
"options": [
"Jibreel",
"Mikaeel",
"Israfeel"
],
"answer": 0
},
{
"q": "What was the first word revealed?",
"options": [
"Iqra (Read)",
"Bismillah",
"Salam"
],
"answer": 0
}
],
"order": 0,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-quran-1-ar",
"title": "القرآن",
"subject": "القرآن",
"emoji": "📖",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "ما أول سورة في القرآن؟",
"options": [
"الفاتحة",
"الإخلاص",
"الناس"
],
"answer": 0
},
{
"q": "كم عدد سور القرآن؟",
"options": [
"30",
"99",
"114"
],
"answer": 2
},
{
"q": "في أي شهر بدأ نزول القرآن؟",
"options": [
"رمضان",
"شوال",
"محرّم"
],
"answer": 0
},
{
"q": "أي مَلَك نزل بالقرآن؟",
"options": [
"جبريل",
"ميكائيل",
"إسرافيل"
],
"answer": 0
},
{
"q": "ما أول كلمة نزلت؟",
"options": [
"اقرأ",
"بسم الله",
"سلام"
],
"answer": 0
}
],
"order": 0,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-quran-1-id",
"title": "Al-Qur'an",
"subject": "Al-Qur'an",
"emoji": "📖",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Apa surah pertama dalam Al-Qur'an?",
"options": [
"Al-Fatihah",
"Al-Ikhlas",
"An-Nas"
],
"answer": 0
},
{
"q": "Ada berapa surah dalam Al-Qur'an?",
"options": [
"30",
"99",
"114"
],
"answer": 2
},
{
"q": "Di bulan apa Al-Qur'an pertama kali diturunkan?",
"options": [
"Ramadhan",
"Syawal",
"Muharram"
],
"answer": 0
},
{
"q": "Malaikat siapa yang membawa Al-Qur'an?",
"options": [
"Jibril",
"Mikail",
"Israfil"
],
"answer": 0
},
{
"q": "Apa kata pertama yang diturunkan?",
"options": [
"Iqra (Bacalah)",
"Bismillah",
"Salam"
],
"answer": 0
}
],
"order": 0,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-quran-1-tl",
"title": "Ang Quran",
"subject": "Ang Quran",
"emoji": "📖",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ano ang unang surah ng Quran?",
"options": [
"Al-Fatiha",
"Al-Ikhlas",
"An-Nas"
],
"answer": 0
},
{
"q": "Ilan ang surah sa Quran?",
"options": [
"30",
"99",
"114"
],
"answer": 2
},
{
"q": "Sa anong buwan unang ipinahayag ang Quran?",
"options": [
"Ramadan",
"Shawwal",
"Muharram"
],
"answer": 0
},
{
"q": "Aling anghel ang nagdala ng Quran?",
"options": [
"Jibreel",
"Mikaeel",
"Israfeel"
],
"answer": 0
},
{
"q": "Ano ang unang salitang ipinahayag?",
"options": [
"Iqra (Bumasa)",
"Bismillah",
"Salam"
],
"answer": 0
}
],
"order": 0,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-quran-2-en",
"title": "The Quran",
"subject": "The Quran",
"emoji": "📖",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "What is the shortest surah?",
"options": [
"Al-Kawthar",
"Al-Baqarah",
"Yasin"
],
"answer": 0
},
{
"q": "What is the longest surah?",
"options": [
"Al-Baqarah",
"Al-Ikhlas",
"Al-Fatiha"
],
"answer": 0
},
{
"q": "What is the last surah of the Quran?",
"options": [
"An-Nas",
"Al-Fatiha",
"Al-Mulk"
],
"answer": 0
}
],
"order": 1,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-quran-2-ar",
"title": "القرآن",
"subject": "القرآن",
"emoji": "📖",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "ما أقصر سورة؟",
"options": [
"الكوثر",
"البقرة",
"يس"
],
"answer": 0
},
{
"q": "ما أطول سورة؟",
"options": [
"البقرة",
"الإخلاص",
"الفاتحة"
],
"answer": 0
},
{
"q": "ما آخر سورة في القرآن؟",
"options": [
"الناس",
"الفاتحة",
"الملك"
],
"answer": 0
}
],
"order": 1,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-quran-2-id",
"title": "Al-Qur'an",
"subject": "Al-Qur'an",
"emoji": "📖",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Apa surah terpendek?",
"options": [
"Al-Kautsar",
"Al-Baqarah",
"Yasin"
],
"answer": 0
},
{
"q": "Apa surah terpanjang?",
"options": [
"Al-Baqarah",
"Al-Ikhlas",
"Al-Fatihah"
],
"answer": 0
},
{
"q": "Apa surah terakhir dalam Al-Qur'an?",
"options": [
"An-Nas",
"Al-Fatihah",
"Al-Mulk"
],
"answer": 0
}
],
"order": 1,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-quran-2-tl",
"title": "Ang Quran",
"subject": "Ang Quran",
"emoji": "📖",
"color": "yellow",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ano ang pinakamaikling surah?",
"options": [
"Al-Kawthar",
"Al-Baqarah",
"Yasin"
],
"answer": 0
},
{
"q": "Ano ang pinakamahabang surah?",
"options": [
"Al-Baqarah",
"Al-Ikhlas",
"Al-Fatiha"
],
"answer": 0
},
{
"q": "Ano ang huling surah ng Quran?",
"options": [
"An-Nas",
"Al-Fatiha",
"Al-Mulk"
],
"answer": 0
}
],
"order": 1,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-ramadan-1-en",
"title": "Ramadan & Eid",
"subject": "Ramadan & Eid",
"emoji": "🌙",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "In Ramadan we fast from Fajr until...",
"options": [
"Maghrib",
"Dhuhr",
"Asr"
],
"answer": 0
},
{
"q": "What is the Eid after Ramadan called?",
"options": [
"Eid al-Fitr",
"Eid al-Adha",
"Jumuah"
],
"answer": 0
},
{
"q": "The Prophet ﷺ liked to break his fast with...",
"options": [
"Dates",
"Cake",
"Chips"
],
"answer": 0
},
{
"q": "The special night better than 1000 months is...",
"options": [
"Laylatul Qadr",
"Eid night",
"Jumuah night"
],
"answer": 0
},
{
"q": "Which Eid comes at the time of Hajj?",
"options": [
"Eid al-Adha",
"Eid al-Fitr",
"New Year"
],
"answer": 0
}
],
"order": 0,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-ramadan-1-ar",
"title": "رمضان والعيد",
"subject": "رمضان والعيد",
"emoji": "🌙",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "في رمضان نصوم من الفجر حتى...",
"options": [
"المغرب",
"الظهر",
"العصر"
],
"answer": 0
},
{
"q": "ما اسم العيد بعد رمضان؟",
"options": [
"عيد الفطر",
"عيد الأضحى",
"الجمعة"
],
"answer": 0
},
{
"q": "كان النبي ﷺ يحب أن يفطر على...",
"options": [
"التمر",
"الكعك",
"رقائق البطاطس"
],
"answer": 0
},
{
"q": "الليلة المميّزة التي هي خير من ألف شهر هي...",
"options": [
"ليلة القدر",
"ليلة العيد",
"ليلة الجمعة"
],
"answer": 0
},
{
"q": "أي عيد يأتي في وقت الحج؟",
"options": [
"عيد الأضحى",
"عيد الفطر",
"رأس السنة"
],
"answer": 0
}
],
"order": 0,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-ramadan-1-id",
"title": "Ramadhan & Idul Fitri",
"subject": "Ramadhan & Idul Fitri",
"emoji": "🌙",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Di bulan Ramadhan kita berpuasa dari Subuh sampai...",
"options": [
"Maghrib",
"Dzuhur",
"Ashar"
],
"answer": 0
},
{
"q": "Apa nama hari raya setelah Ramadhan?",
"options": [
"Idul Fitri",
"Idul Adha",
"Jumat"
],
"answer": 0
},
{
"q": "Nabi ﷺ suka berbuka puasa dengan...",
"options": [
"Kurma",
"Kue",
"Keripik"
],
"answer": 0
},
{
"q": "Malam istimewa yang lebih baik dari 1000 bulan adalah...",
"options": [
"Lailatul Qadar",
"Malam hari raya",
"Malam Jumat"
],
"answer": 0
},
{
"q": "Hari raya apa yang datang saat musim haji?",
"options": [
"Idul Adha",
"Idul Fitri",
"Tahun Baru"
],
"answer": 0
}
],
"order": 0,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-ramadan-1-tl",
"title": "Ramadan at Eid",
"subject": "Ramadan at Eid",
"emoji": "🌙",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Sa Ramadan, nag-aayuno tayo mula Fajr hanggang...",
"options": [
"Maghrib",
"Dhuhr",
"Asr"
],
"answer": 0
},
{
"q": "Ano ang tawag sa Eid pagkatapos ng Ramadan?",
"options": [
"Eid al-Fitr",
"Eid al-Adha",
"Jumuah"
],
"answer": 0
},
{
"q": "Gustong mag-iftar ng Propeta ﷺ gamit ang...",
"options": [
"Datiles",
"Keyk",
"Chips"
],
"answer": 0
},
{
"q": "Ang espesyal na gabing mas mabuti pa sa 1000 buwan ay...",
"options": [
"Laylatul Qadr",
"Gabi ng Eid",
"Gabi ng Jumuah"
],
"answer": 0
},
{
"q": "Aling Eid ang dumarating sa panahon ng Hajj?",
"options": [
"Eid al-Adha",
"Eid al-Fitr",
"Bagong Taon"
],
"answer": 0
}
],
"order": 0,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-ramadan-2-en",
"title": "Ramadan & Eid",
"subject": "Ramadan & Eid",
"emoji": "🌙",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "The meal before Fajr in Ramadan is called...",
"options": [
"Suhoor",
"Iftar",
"Lunch"
],
"answer": 0
},
{
"q": "The meal at sunset in Ramadan is called...",
"options": [
"Iftar",
"Suhoor",
"Breakfast"
],
"answer": 0
},
{
"q": "Ramadan is how many days long?",
"options": [
"29 or 30",
"7",
"100"
],
"answer": 0
}
],
"order": 1,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-ramadan-2-ar",
"title": "رمضان والعيد",
"subject": "رمضان والعيد",
"emoji": "🌙",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "الوجبة قبل الفجر في رمضان اسمها...",
"options": [
"السحور",
"الإفطار",
"الغداء"
],
"answer": 0
},
{
"q": "الوجبة عند المغرب في رمضان اسمها...",
"options": [
"الإفطار",
"السحور",
"الفطور"
],
"answer": 0
},
{
"q": "كم يومًا مدة رمضان؟",
"options": [
"29 أو 30",
"7",
"100"
],
"answer": 0
}
],
"order": 1,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-ramadan-2-id",
"title": "Ramadhan & Idul Fitri",
"subject": "Ramadhan & Idul Fitri",
"emoji": "🌙",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Makan sebelum Subuh di bulan Ramadhan disebut...",
"options": [
"Sahur",
"Buka puasa",
"Makan siang"
],
"answer": 0
},
{
"q": "Makan saat matahari terbenam di bulan Ramadhan disebut...",
"options": [
"Buka puasa",
"Sahur",
"Sarapan"
],
"answer": 0
},
{
"q": "Ramadhan berapa hari lamanya?",
"options": [
"29 atau 30",
"7",
"100"
],
"answer": 0
}
],
"order": 1,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-ramadan-2-tl",
"title": "Ramadan at Eid",
"subject": "Ramadan at Eid",
"emoji": "🌙",
"color": "green",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ang pagkain bago mag-Fajr sa Ramadan ay tinatawag na...",
"options": [
"Suhoor",
"Iftar",
"Tanghalian"
],
"answer": 0
},
{
"q": "Ang pagkain sa paglubog ng araw sa Ramadan ay tinatawag na...",
"options": [
"Iftar",
"Suhoor",
"Almusal"
],
"answer": 0
},
{
"q": "Ilang araw ang haba ng Ramadan?",
"options": [
"29 o 30",
"7",
"100"
],
"answer": 0
}
],
"order": 1,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-letters-1-en",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "How many letters are in the Arabic alphabet?",
"options": [
"26",
"28",
"30"
],
"answer": 1
},
{
"q": "What is the first Arabic letter?",
"options": [
"Alif ا",
"Baa ب",
"Yaa ي"
],
"answer": 0
},
{
"q": "What is the last Arabic letter?",
"options": [
"Yaa ي",
"Alif ا",
"Meem م"
],
"answer": 0
},
{
"q": "Which letter has ONE dot under it?",
"options": [
"ب",
"ت",
"ث"
],
"answer": 0
},
{
"q": "Which letter has TWO dots on top?",
"options": [
"ب",
"ت",
"ث"
],
"answer": 1
}
],
"order": 0,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-letters-1-ar",
"title": "الحروف العربية",
"subject": "الحروف العربية",
"emoji": "✍️",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "كم عدد الحروف العربية؟",
"options": [
"26",
"28",
"30"
],
"answer": 1
},
{
"q": "ما أول حرف عربي؟",
"options": [
"ألف ا",
"باء ب",
"ياء ي"
],
"answer": 0
},
{
"q": "ما آخر حرف عربي؟",
"options": [
"ياء ي",
"ألف ا",
"ميم م"
],
"answer": 0
},
{
"q": "أي حرف له نقطة واحدة تحته؟",
"options": [
"ب",
"ت",
"ث"
],
"answer": 0
},
{
"q": "أي حرف له نقطتان فوقه؟",
"options": [
"ب",
"ت",
"ث"
],
"answer": 1
}
],
"order": 0,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-letters-1-id",
"title": "Huruf Arab",
"subject": "Huruf Arab",
"emoji": "✍️",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ada berapa huruf dalam abjad Arab?",
"options": [
"26",
"28",
"30"
],
"answer": 1
},
{
"q": "Apa huruf Arab pertama?",
"options": [
"Alif ا",
"Ba ب",
"Ya ي"
],
"answer": 0
},
{
"q": "Apa huruf Arab terakhir?",
"options": [
"Ya ي",
"Alif ا",
"Mim م"
],
"answer": 0
},
{
"q": "Huruf mana yang punya SATU titik di bawah?",
"options": [
"ب",
"ت",
"ث"
],
"answer": 0
},
{
"q": "Huruf mana yang punya DUA titik di atas?",
"options": [
"ب",
"ت",
"ث"
],
"answer": 1
}
],
"order": 0,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-letters-1-tl",
"title": "Mga Titik Arabe",
"subject": "Mga Titik Arabe",
"emoji": "✍️",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ilan ang titik sa alpabetong Arabe?",
"options": [
"26",
"28",
"30"
],
"answer": 1
},
{
"q": "Ano ang unang titik ng Arabe?",
"options": [
"Alif ا",
"Baa ب",
"Yaa ي"
],
"answer": 0
},
{
"q": "Ano ang huling titik ng Arabe?",
"options": [
"Yaa ي",
"Alif ا",
"Meem م"
],
"answer": 0
},
{
"q": "Aling titik ang may ISANG tuldok sa ilalim?",
"options": [
"ب",
"ت",
"ث"
],
"answer": 0
},
{
"q": "Aling titik ang may DALAWANG tuldok sa itaas?",
"options": [
"ب",
"ت",
"ث"
],
"answer": 1
}
],
"order": 0,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-letters-2-en",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Which letter has THREE dots on top?",
"options": [
"ث",
"ت",
"ن"
],
"answer": 0
},
{
"q": "Which letter has a dot inside its curve on top?",
"options": [
"خ",
"ح",
"ج"
],
"answer": 0
},
{
"q": "Which letter has NO dots?",
"options": [
"ح",
"ج",
"خ"
],
"answer": 0
},
{
"q": "Arabic is read from...",
"options": [
"Right to left",
"Left to right",
"Top to bottom"
],
"answer": 0
}
],
"order": 1,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-letters-2-ar",
"title": "الحروف العربية",
"subject": "الحروف العربية",
"emoji": "✍️",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "أي حرف له ثلاث نقاط فوقه؟",
"options": [
"ث",
"ت",
"ن"
],
"answer": 0
},
{
"q": "أي حرف له نقطة فوق انحنائه؟",
"options": [
"خ",
"ح",
"ج"
],
"answer": 0
},
{
"q": "أي حرف ليس له نقاط؟",
"options": [
"ح",
"ج",
"خ"
],
"answer": 0
},
{
"q": "تُقرأ العربية من...",
"options": [
"اليمين إلى اليسار",
"اليسار إلى اليمين",
"الأعلى إلى الأسفل"
],
"answer": 0
}
],
"order": 1,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-letters-2-id",
"title": "Huruf Arab",
"subject": "Huruf Arab",
"emoji": "✍️",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Huruf mana yang punya TIGA titik di atas?",
"options": [
"ث",
"ت",
"ن"
],
"answer": 0
},
{
"q": "Huruf mana yang punya titik di atas lengkungannya?",
"options": [
"خ",
"ح",
"ج"
],
"answer": 0
},
{
"q": "Huruf mana yang TIDAK punya titik?",
"options": [
"ح",
"ج",
"خ"
],
"answer": 0
},
{
"q": "Bahasa Arab dibaca dari...",
"options": [
"Kanan ke kiri",
"Kiri ke kanan",
"Atas ke bawah"
],
"answer": 0
}
],
"order": 1,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-letters-2-tl",
"title": "Mga Titik Arabe",
"subject": "Mga Titik Arabe",
"emoji": "✍️",
"color": "white",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Aling titik ang may TATLONG tuldok sa itaas?",
"options": [
"ث",
"ت",
"ن"
],
"answer": 0
},
{
"q": "Aling titik ang may tuldok sa itaas ng kurba nito?",
"options": [
"خ",
"ح",
"ج"
],
"answer": 0
},
{
"q": "Aling titik ang WALANG tuldok?",
"options": [
"ح",
"ج",
"خ"
],
"answer": 0
},
{
"q": "Binabasa ang Arabe mula sa...",
"options": [
"Kanan pakaliwa",
"Kaliwa pakanan",
"Itaas pababa"
],
"answer": 0
}
],
"order": 1,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-places-1-en",
"title": "Makkah & Madinah",
"subject": "Makkah & Madinah",
"emoji": "🐪",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "In which city was the Prophet ﷺ born?",
"options": [
"Makkah",
"Madinah",
"Taif"
],
"answer": 0
},
{
"q": "To which city did the Prophet ﷺ make Hijrah?",
"options": [
"Madinah",
"Makkah",
"Jeddah"
],
"answer": 0
},
{
"q": "Where is the Kaaba?",
"options": [
"Makkah",
"Madinah",
"Riyadh"
],
"answer": 0
},
{
"q": "Where is Masjid an-Nabawi?",
"options": [
"Madinah",
"Makkah",
"Al-Quds"
],
"answer": 0
},
{
"q": "In which cave did the first revelation come?",
"options": [
"Cave Hira",
"Cave Thawr",
"No cave"
],
"answer": 0
}
],
"order": 0,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-places-1-ar",
"title": "مكة والمدينة",
"subject": "مكة والمدينة",
"emoji": "🐪",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "في أي مدينة وُلد النبي ﷺ؟",
"options": [
"مكة",
"المدينة",
"الطائف"
],
"answer": 0
},
{
"q": "إلى أي مدينة هاجر النبي ﷺ؟",
"options": [
"المدينة",
"مكة",
"جدة"
],
"answer": 0
},
{
"q": "أين الكعبة؟",
"options": [
"مكة",
"المدينة",
"الرياض"
],
"answer": 0
},
{
"q": "أين المسجد النبوي؟",
"options": [
"المدينة",
"مكة",
"القدس"
],
"answer": 0
},
{
"q": "في أي غار نزل الوحي أول مرة؟",
"options": [
"غار حراء",
"غار ثور",
"لا غار"
],
"answer": 0
}
],
"order": 0,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-places-1-id",
"title": "Makkah & Madinah",
"subject": "Makkah & Madinah",
"emoji": "🐪",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Di kota mana Nabi ﷺ dilahirkan?",
"options": [
"Makkah",
"Madinah",
"Thaif"
],
"answer": 0
},
{
"q": "Ke kota mana Nabi ﷺ berhijrah?",
"options": [
"Madinah",
"Makkah",
"Jeddah"
],
"answer": 0
},
{
"q": "Di mana Ka'bah?",
"options": [
"Makkah",
"Madinah",
"Riyadh"
],
"answer": 0
},
{
"q": "Di mana Masjid Nabawi?",
"options": [
"Madinah",
"Makkah",
"Al-Quds"
],
"answer": 0
},
{
"q": "Di gua mana wahyu pertama turun?",
"options": [
"Gua Hira",
"Gua Tsur",
"Tidak di gua"
],
"answer": 0
}
],
"order": 0,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-places-1-tl",
"title": "Makkah at Madinah",
"subject": "Makkah at Madinah",
"emoji": "🐪",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Saang lungsod ipinanganak ang Propeta ﷺ?",
"options": [
"Makkah",
"Madinah",
"Taif"
],
"answer": 0
},
{
"q": "Saang lungsod nag-Hijrah ang Propeta ﷺ?",
"options": [
"Madinah",
"Makkah",
"Jeddah"
],
"answer": 0
},
{
"q": "Nasaan ang Kaaba?",
"options": [
"Makkah",
"Madinah",
"Riyadh"
],
"answer": 0
},
{
"q": "Nasaan ang Masjid an-Nabawi?",
"options": [
"Madinah",
"Makkah",
"Al-Quds"
],
"answer": 0
},
{
"q": "Sa aling kuweba dumating ang unang pahayag?",
"options": [
"Kuweba ng Hira",
"Kuweba ng Thawr",
"Walang kuweba"
],
"answer": 0
}
],
"order": 0,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-quiz-places-2-en",
"title": "Makkah & Madinah",
"subject": "Makkah & Madinah",
"emoji": "🐪",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "What was the first masjid built in Islam?",
"options": [
"Masjid Quba",
"Masjid al-Haram",
"Masjid al-Aqsa"
],
"answer": 0
},
{
"q": "What does Hijrah mean?",
"options": [
"Migration",
"Prayer",
"Fasting"
],
"answer": 0
},
{
"q": "Where is Masjid al-Aqsa?",
"options": [
"Al-Quds",
"Makkah",
"Madinah"
],
"answer": 0
}
],
"order": 1,
"lang": "en",
"tier": "free"
},
{
"id": "starter-quiz-places-2-ar",
"title": "مكة والمدينة",
"subject": "مكة والمدينة",
"emoji": "🐪",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "ما أول مسجد بُني في الإسلام؟",
"options": [
"مسجد قباء",
"المسجد الحرام",
"المسجد الأقصى"
],
"answer": 0
},
{
"q": "ما معنى الهجرة؟",
"options": [
"الانتقال من بلد إلى بلد",
"الصلاة",
"الصيام"
],
"answer": 0
},
{
"q": "أين المسجد الأقصى؟",
"options": [
"القدس",
"مكة",
"المدينة"
],
"answer": 0
}
],
"order": 1,
"lang": "ar",
"tier": "free"
},
{
"id": "starter-quiz-places-2-id",
"title": "Makkah & Madinah",
"subject": "Makkah & Madinah",
"emoji": "🐪",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Apa masjid pertama yang dibangun dalam Islam?",
"options": [
"Masjid Quba",
"Masjidil Haram",
"Masjidil Aqsa"
],
"answer": 0
},
{
"q": "Apa arti hijrah?",
"options": [
"Pindah tempat",
"Shalat",
"Puasa"
],
"answer": 0
},
{
"q": "Di mana Masjidil Aqsa?",
"options": [
"Al-Quds",
"Makkah",
"Madinah"
],
"answer": 0
}
],
"order": 1,
"lang": "id",
"tier": "free"
},
{
"id": "starter-quiz-places-2-tl",
"title": "Makkah at Madinah",
"subject": "Makkah at Madinah",
"emoji": "🐪",
"color": "grey",
"gameType": "quiz",
"kind": "quiz",
"questions": [
{
"q": "Ano ang unang masjid na itinayo sa Islam?",
"options": [
"Masjid Quba",
"Masjid al-Haram",
"Masjid al-Aqsa"
],
"answer": 0
},
{
"q": "Ano ang ibig sabihin ng Hijrah?",
"options": [
"Paglipat",
"Dasal",
"Pag-aayuno"
],
"answer": 0
},
{
"q": "Nasaan ang Masjid al-Aqsa?",
"options": [
"Al-Quds",
"Makkah",
"Madinah"
],
"answer": 0
}
],
"order": 1,
"lang": "tl",
"tier": "free"
},
{
"id": "starter-puzzle-places-1",
"title": "Holy Places",
"subject": "Holy Places",
"emoji": "🕋",
"color": "yellow",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=places&l=1",
"questions": [],
"order": 0,
"lang": "all",
"tier": "free"
},
{
"id": "starter-puzzle-places-2",
"title": "Holy Places",
"subject": "Holy Places",
"emoji": "🕋",
"color": "yellow",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=places&l=2",
"questions": [],
"order": 1,
"lang": "all",
"tier": "free"
},
{
"id": "starter-puzzle-places-3",
"title": "Holy Places",
"subject": "Holy Places",
"emoji": "🕋",
"color": "yellow",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=places&l=3",
"questions": [],
"order": 2,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-puzzle-places-4",
"title": "Holy Places",
"subject": "Holy Places",
"emoji": "🕋",
"color": "yellow",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=places&l=4",
"questions": [],
"order": 3,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-puzzle-places-5",
"title": "Holy Places",
"subject": "Holy Places",
"emoji": "🕋",
"color": "yellow",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=places&l=5",
"questions": [],
"order": 4,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-puzzle-letters-1",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "green",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=letters&l=1",
"questions": [],
"order": 0,
"lang": "all",
"tier": "free"
},
{
"id": "starter-puzzle-letters-2",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "green",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=letters&l=2",
"questions": [],
"order": 1,
"lang": "all",
"tier": "free"
},
{
"id": "starter-puzzle-letters-3",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "green",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=letters&l=3",
"questions": [],
"order": 2,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-puzzle-letters-4",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "green",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=letters&l=4",
"questions": [],
"order": 3,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-puzzle-letters-5",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "green",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=letters&l=5",
"questions": [],
"order": 4,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-puzzle-creation-1",
"title": "Allah's Creation",
"subject": "Allah's Creation",
"emoji": "🐪",
"color": "white",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=creation&l=1",
"questions": [],
"order": 0,
"lang": "all",
"tier": "free"
},
{
"id": "starter-puzzle-creation-2",
"title": "Allah's Creation",
"subject": "Allah's Creation",
"emoji": "🐪",
"color": "white",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=creation&l=2",
"questions": [],
"order": 1,
"lang": "all",
"tier": "free"
},
{
"id": "starter-puzzle-creation-3",
"title": "Allah's Creation",
"subject": "Allah's Creation",
"emoji": "🐪",
"color": "white",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=creation&l=3",
"questions": [],
"order": 2,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-puzzle-creation-4",
"title": "Allah's Creation",
"subject": "Allah's Creation",
"emoji": "🐪",
"color": "white",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=creation&l=4",
"questions": [],
"order": 3,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-puzzle-creation-5",
"title": "Allah's Creation",
"subject": "Allah's Creation",
"emoji": "🐪",
"color": "white",
"gameType": "puzzle",
"kind": "html",
"htmlUrl": "/games/kids/puzzle.html?s=creation&l=5",
"questions": [],
"order": 4,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-letters-1",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=letters&l=1",
"questions": [],
"order": 0,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-letters-2",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=letters&l=2",
"questions": [],
"order": 1,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-letters-3",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=letters&l=3",
"questions": [],
"order": 2,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-letters-4",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=letters&l=4",
"questions": [],
"order": 3,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-letters-5",
"title": "Arabic Letters",
"subject": "Arabic Letters",
"emoji": "✍️",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=letters&l=5",
"questions": [],
"order": 4,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-duas-1",
"title": "Duas",
"subject": "Duas",
"emoji": "🤲",
"color": "green",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=duas&l=1",
"questions": [],
"order": 0,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-duas-2",
"title": "Duas",
"subject": "Duas",
"emoji": "🤲",
"color": "green",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=duas&l=2",
"questions": [],
"order": 1,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-duas-3",
"title": "Duas",
"subject": "Duas",
"emoji": "🤲",
"color": "green",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=duas&l=3",
"questions": [],
"order": 2,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-duas-4",
"title": "Duas",
"subject": "Duas",
"emoji": "🤲",
"color": "green",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=duas&l=4",
"questions": [],
"order": 3,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-duas-5",
"title": "Duas",
"subject": "Duas",
"emoji": "🤲",
"color": "green",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=duas&l=5",
"questions": [],
"order": 4,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-prophets-1",
"title": "Prophets",
"subject": "Prophets",
"emoji": "🌙",
"color": "white",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=prophets&l=1",
"questions": [],
"order": 0,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-prophets-2",
"title": "Prophets",
"subject": "Prophets",
"emoji": "🌙",
"color": "white",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=prophets&l=2",
"questions": [],
"order": 1,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-prophets-3",
"title": "Prophets",
"subject": "Prophets",
"emoji": "🌙",
"color": "white",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=prophets&l=3",
"questions": [],
"order": 2,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-prophets-4",
"title": "Prophets",
"subject": "Prophets",
"emoji": "🌙",
"color": "white",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=prophets&l=4",
"questions": [],
"order": 3,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-prophets-5",
"title": "Prophets",
"subject": "Prophets",
"emoji": "🌙",
"color": "white",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=prophets&l=5",
"questions": [],
"order": 4,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-pillars-1",
"title": "5 Pillars",
"subject": "5 Pillars",
"emoji": "🕋",
"color": "grey",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=pillars&l=1",
"questions": [],
"order": 0,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-pillars-2",
"title": "5 Pillars",
"subject": "5 Pillars",
"emoji": "🕋",
"color": "grey",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=pillars&l=2",
"questions": [],
"order": 1,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-pillars-3",
"title": "5 Pillars",
"subject": "5 Pillars",
"emoji": "🕋",
"color": "grey",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=pillars&l=3",
"questions": [],
"order": 2,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-pillars-4",
"title": "5 Pillars",
"subject": "5 Pillars",
"emoji": "🕋",
"color": "grey",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=pillars&l=4",
"questions": [],
"order": 3,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-pillars-5",
"title": "5 Pillars",
"subject": "5 Pillars",
"emoji": "🕋",
"color": "grey",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=pillars&l=5",
"questions": [],
"order": 4,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-numbers-1",
"title": "Numbers",
"subject": "Numbers",
"emoji": "🔢",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=numbers&l=1",
"questions": [],
"order": 0,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-numbers-2",
"title": "Numbers",
"subject": "Numbers",
"emoji": "🔢",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=numbers&l=2",
"questions": [],
"order": 1,
"lang": "all",
"tier": "free"
},
{
"id": "starter-memory-numbers-3",
"title": "Numbers",
"subject": "Numbers",
"emoji": "🔢",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=numbers&l=3",
"questions": [],
"order": 2,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-numbers-4",
"title": "Numbers",
"subject": "Numbers",
"emoji": "🔢",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=numbers&l=4",
"questions": [],
"order": 3,
"lang": "all",
"tier": "premium"
},
{
"id": "starter-memory-numbers-5",
"title": "Numbers",
"subject": "Numbers",
"emoji": "🔢",
"color": "yellow",
"gameType": "memory",
"kind": "html",
"htmlUrl": "/games/kids/memory.html?s=numbers&l=5",
"questions": [],
"order": 4,
"lang": "all",
"tier": "premium"
}
];
