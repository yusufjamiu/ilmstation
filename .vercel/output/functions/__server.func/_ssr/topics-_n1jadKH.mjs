//#region node_modules/.nitro/vite/services/ssr/assets/topics-_n1jadKH.js
var TOPICS = [
	{
		id: "aqeedah",
		name: "Aqeedah",
		arabic: "عَقِيدَة",
		icon: "🕌",
		scope: "Core beliefs: Tawhid, Prophets, Angels, Books, Day of Judgement",
		premium: false,
		questions: 148,
		category: "Foundations"
	},
	{
		id: "hadith",
		name: "Hadith",
		arabic: "حَدِيث",
		icon: "📜",
		scope: "40 Hadith of Imam Nawawi; Sahih collections; Hadith sciences",
		premium: false,
		questions: 210,
		category: "Text"
	},
	{
		id: "seerah",
		name: "Seerah",
		arabic: "سِيرَة",
		icon: "🌙",
		scope: "Life of Prophet Muhammad ﷺ from birth to death; Companions",
		premium: false,
		questions: 176,
		category: "Foundations"
	},
	{
		id: "fiqh",
		name: "Fiqh",
		arabic: "فِقْه",
		icon: "⚖️",
		scope: "Islamic jurisprudence: Salah, Zakat, Fasting, Hajj basics",
		premium: false,
		questions: 194,
		category: "Practice"
	},
	{
		id: "arabic",
		name: "Arabic",
		arabic: "عَرَبِيَّة",
		icon: "🔤",
		scope: "Quranic Arabic vocabulary; root words; basmala and common du'as",
		premium: false,
		questions: 132,
		category: "Language"
	},
	{
		id: "quran",
		name: "Quran",
		arabic: "قُرْآن",
		icon: "📖",
		scope: "Tafsir of key surahs; revelation context; memorisation via Hifz",
		premium: false,
		questions: 160,
		category: "Text"
	},
	{
		id: "tafsir",
		name: "Tafsir",
		arabic: "تَفْسِير",
		icon: "🔍",
		scope: "Exegesis of selected verses; themes; historical context",
		premium: true,
		questions: 118,
		category: "Text"
	},
	{
		id: "dua",
		name: "Dua",
		arabic: "دُعَاء",
		icon: "🤲",
		scope: "Morning/evening adhkar; prophetic supplications; contextual duas",
		premium: true,
		questions: 96,
		category: "Practice"
	}
];
var topicById = (id) => TOPICS.find((t) => t.id === id) ?? TOPICS[0];
//#endregion
export { topicById as n, TOPICS as t };
