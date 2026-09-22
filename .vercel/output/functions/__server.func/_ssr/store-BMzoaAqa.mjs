import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-BMzoaAqa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BADGES = [
	{
		id: "beacon",
		icon: "🕯️",
		name: "Beacon of Hidayah",
		arabic: "مَنَارَةُ الْهِدَايَة",
		condition: "Guided 5 friends",
		description: "Invite 5 friends who complete their first quiz",
		xp: 150,
		progress: .6
	},
	{
		id: "seal",
		icon: "📜",
		name: "Seal of Knowledge",
		arabic: "خَاتَمُ الْعِلْم",
		condition: "Reach 1,000 total points",
		description: "Accumulate 1,000 points across all activities",
		xp: 200,
		progress: 1
	},
	{
		id: "garden",
		icon: "🌿",
		name: "Garden of Jannah",
		arabic: "رَوْضَةُ الْجَنَّة",
		condition: "7-day Hifz streak",
		description: "Complete a Hifz session every day for 7 days",
		xp: 180,
		progress: .43
	},
	{
		id: "key",
		icon: "🗝️",
		name: "Key to Understanding",
		arabic: "مِفْتَاحُ الْفَهْم",
		condition: "Complete 10 quests",
		description: "Complete 10 full quests on the Quest Map",
		xp: 160,
		progress: .3
	},
	{
		id: "light",
		icon: "💎",
		name: "Light of Iman",
		arabic: "نُورُ الْإِيمَان",
		condition: "Score 100% on 5 quizzes",
		description: "Achieve a perfect score on 5 different quizzes",
		xp: 170,
		progress: .4
	},
	{
		id: "crown",
		icon: "👑",
		name: "Crown of Sabr",
		arabic: "تَاجُ الصَّبْر",
		condition: "30-day login streak",
		description: "Log in and complete one activity every day for 30 days",
		xp: 250,
		progress: .4
	},
	{
		id: "star",
		icon: "🌠",
		name: "Star of Guidance",
		arabic: "نَجْمُ الْهِدَايَة",
		condition: "Complete Prophets quest",
		description: "Finish all 3 stages of the Prophets & Messengers quest",
		xp: 200,
		progress: .66
	},
	{
		id: "insight",
		icon: "🔮",
		name: "Insight of the Wise",
		arabic: "بَصِيرَةُ الْحَكِيم",
		condition: "Win 20 challenges",
		description: "Win 20 head-to-head Challenge duels",
		xp: 200,
		progress: .35
	}
];
var LEVELS = [
	{
		level: 1,
		name: "Beginner",
		arabic: "مُبْتَدِئ",
		min: 0,
		max: 199,
		unlocks: "Core quiz topics, Hifz Mode starter surahs"
	},
	{
		level: 2,
		name: "Seeker",
		arabic: "طَالِب",
		min: 200,
		max: 499,
		unlocks: "Challenge Mode, Quest Map access"
	},
	{
		level: 3,
		name: "Student",
		arabic: "مُتَعَلِّم",
		min: 500,
		max: 999,
		unlocks: "Advanced topics, Library full access"
	},
	{
		level: 4,
		name: "Scholar",
		arabic: "عَالِم",
		min: 1e3,
		max: 1999,
		unlocks: "Halaqah Mode hosting, IlmBot full history"
	},
	{
		level: 5,
		name: "Guardian",
		arabic: "حَافِظ",
		min: 2e3,
		max: 3499,
		unlocks: "Ramadan special quests, custom avatar frames"
	},
	{
		level: 6,
		name: "Sage",
		arabic: "حَكِيم",
		min: 3500,
		max: 5999,
		unlocks: "Create custom challenges, mentor badge"
	},
	{
		level: 7,
		name: "Alim",
		arabic: "عَالِمٌ",
		min: 6e3,
		max: Infinity,
		unlocks: "Verified Alim badge, leaderboard Hall of Fame entry"
	}
];
function levelFor(xp) {
	return [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
}
var IQ_TOPIC_PERF = [
	{
		topic: "Aqeedah",
		pct: 88
	},
	{
		topic: "Hadith",
		pct: 82
	},
	{
		topic: "Seerah",
		pct: 75
	},
	{
		topic: "Fiqh",
		pct: 62
	}
];
var ILMBOT_SUGGESTIONS = [
	"What are the conditions of a valid Salah?",
	"Explain the difference between Zakat and Sadaqah",
	"Who compiled Sahih al-Bukhari and when?",
	"What does 'Bismillah' mean word by word?",
	"How do I start memorising Quran consistently?"
];
var ILMBOT_ANSWERS = [
	{
		match: [
			"salah",
			"prayer",
			"pray"
		],
		text: "A valid Salah requires: being in a state of purity (wudu), covering the 'awrah, facing the qiblah, praying within the appointed time window, and having the intention. Inside the prayer, the pillars include the opening takbir, standing, reciting Al-Fatiha, ruku', sujud, sitting, and the final tasleem. Missing a pillar invalidates the prayer; missing a wajib requires the forgetfulness prostration.",
		source: "Fiqh as-Sunnah; Sahih al-Bukhari 757"
	},
	{
		match: [
			"zakat",
			"sadaqah",
			"charity"
		],
		text: "Zakat is obligatory, fixed at 2.5% of qualifying wealth held for a lunar year above the nisab, and payable to eight categories named in Surah At-Tawbah 9:60. Sadaqah is voluntary, unlimited in amount, and may be given to anyone in any form — including a kind word or removing harm from a path.",
		source: "Quran 9:60; Sahih Muslim 1009"
	},
	{
		match: [
			"bukhari",
			"hadith",
			"compiled"
		],
		text: "Imam Muhammad ibn Isma'il al-Bukhari (194–256 AH) compiled Sahih al-Bukhari over roughly sixteen years, selecting about 7,275 narrations (around 2,600 without repetition) from a pool he reported as near 600,000. He applied strict conditions of continuous chain and contemporaneity between narrators.",
		source: "Ibn Hajar, Hadyu as-Sari"
	},
	{
		match: [
			"bismillah",
			"meaning",
			"word"
		],
		text: "Bi-smi-llah: 'bi' is a preposition meaning 'with' or 'in', 'ism' means name, 'Allah' is the proper name of God. Ar-Rahman is the intensive form of mercy — vast and encompassing all creation; Ar-Rahim is the sustained form — mercy specifically continuing toward the believers.",
		source: "Tafsir Ibn Kathir, 1:1"
	},
	{
		match: [
			"memoris",
			"memoriz",
			"hifz",
			"quran"
		],
		text: "Consistency beats volume. Pick a fixed time daily (after Fajr is ideal), memorise a small portion — even three lines — and never move on until yesterday's portion is secure. Recite to a teacher or partner, use one mushaf layout permanently so page positions anchor memory, and review far more than you memorise.",
		source: "Prophetic principle: Sahih al-Bukhari 6464"
	},
	{
		match: [
			"halal",
			"haram",
			"ruling",
			"divorce",
			"inherit"
		],
		text: "This touches a specific fiqh ruling that depends on your circumstances and school of thought. IlmStation is not a fatwa service — please bring this to a qualified scholar or your local imam who can ask the necessary follow-up questions. I can still explain the general principles and the evidences scholars work from, if that would help.",
		source: "IlmBot scholarly-referral policy"
	}
];
var NOTIFICATIONS_SEED = [
	{
		id: "n1",
		kind: "challenge",
		icon: "⚔️",
		title: "Hassan challenged you",
		body: "Hadith · 10 rounds · expires in 22h",
		time: "12m",
		unread: true,
		action: "challenge"
	},
	{
		id: "n2",
		kind: "badge",
		icon: "📜",
		title: "Badge unlocked: Seal of Knowledge",
		body: "You crossed 1,000 total points. +200 XP",
		time: "2h",
		unread: true,
		action: "achievements"
	},
	{
		id: "n3",
		kind: "friend",
		icon: "🔥",
		title: "Maryam hit a 67-day streak",
		body: "She's ranked #1 on the global leaderboard",
		time: "5h",
		unread: false,
		action: "leaderboard"
	},
	{
		id: "n4",
		kind: "reminder",
		icon: "⏰",
		title: "Your streak needs today's quest",
		body: "Complete one activity to keep 12 days alive",
		time: "8h",
		unread: false,
		action: "home"
	},
	{
		id: "n5",
		kind: "friend",
		icon: "👋",
		title: "Fatima sent a friend request",
		body: "5 mutual friends",
		time: "1d",
		unread: false,
		action: "friends"
	}
];
var HALAQAH_BOTS = [
	{
		id: "b1",
		name: "Amina",
		avatar: "🧕"
	},
	{
		id: "b2",
		name: "Hassan",
		avatar: "🧑🏽"
	},
	{
		id: "b3",
		name: "Ibrahim",
		avatar: "🧔🏽"
	},
	{
		id: "b4",
		name: "Maryam",
		avatar: "👩🏾"
	},
	{
		id: "b5",
		name: "Yaseen",
		avatar: "👨🏽"
	}
];
var RAMADAN_QUESTS = [
	{
		day: 1,
		name: "Taqwa: The Purpose of Fasting",
		theme: "Taqwa",
		xp: 90
	},
	{
		day: 2,
		name: "The Night Prayer of Ramadan",
		theme: "Qiyam",
		xp: 90
	},
	{
		day: 3,
		name: "Sadaqah in the Blessed Month",
		theme: "Sadaqah",
		xp: 90
	},
	{
		day: 4,
		name: "The Month of the Quran",
		theme: "Quran",
		xp: 90
	},
	{
		day: 5,
		name: "Gratitude at the Table",
		theme: "Gratitude",
		xp: 90
	},
	{
		day: 6,
		name: "Guarding the Tongue While Fasting",
		theme: "Taqwa",
		xp: 90
	},
	{
		day: 7,
		name: "Laylatul Qadr: Searching the Nights",
		theme: "Qiyam",
		xp: 110
	}
];
var initial = {
	hydrated: false,
	onboarded: false,
	name: "",
	email: "",
	username: "",
	avatar: "🧕",
	language: "en",
	zone: "zone2",
	interests: [],
	difficulty: "intermediate",
	xp: 0,
	points: {
		ajr: 0,
		ilm: 0,
		noor: 0,
		hikmah: 0
	},
	streak: 0,
	streakWeek: [
		false,
		false,
		false,
		false,
		false,
		false,
		false
	],
	freezes: 0,
	badges: [],
	bookmarks: [],
	readArticles: [],
	questStages: {},
	quizzesPlayed: 0,
	perfectQuizzes: 0,
	duelWins: 0,
	duelLosses: 0,
	hifzStrong: [],
	hifzPractice: [],
	hifzSessions: 0,
	dark: false,
	premium: false,
	sound: true,
	reduceMotion: false,
	largeText: false,
	notificationsOn: true,
	ilmbotUsed: 0,
	articlesRead: 0,
	donated: 0,
	txns: [],
	notifs: NOTIFICATIONS_SEED.map((n) => ({ ...n })),
	ramadanDismissed: false,
	ramadanDays: [],
	tarawih: []
};
/** Demo profile applied when onboarding completes, so every screen has real data. */
var demoSeed = {
	xp: 1180,
	points: {
		ajr: 420,
		ilm: 610,
		noor: 240,
		hikmah: 180
	},
	streak: 12,
	streakWeek: [
		true,
		true,
		true,
		true,
		true,
		false,
		false
	],
	freezes: 1,
	badges: ["seal"],
	quizzesPlayed: 14,
	perfectQuizzes: 2,
	duelWins: 7,
	duelLosses: 4,
	hifzSessions: 3,
	articlesRead: 2,
	questStages: {
		iman: 3,
		pillars: 2
	},
	txns: [
		{
			id: "t1",
			label: "Daily Quest — Aqeedah",
			category: "ilm",
			amount: 80,
			at: "Today · 08:14"
		},
		{
			id: "t2",
			label: "Streak maintained (day 12)",
			category: "ajr",
			amount: 10,
			at: "Today · 08:14"
		},
		{
			id: "t3",
			label: "Hifz session — Al-Ikhlas",
			category: "noor",
			amount: 30,
			at: "Yesterday"
		},
		{
			id: "t4",
			label: "Duel win vs Amina",
			category: "hikmah",
			amount: 60,
			at: "Yesterday"
		},
		{
			id: "t5",
			label: "Badge: Seal of Knowledge",
			category: "ajr",
			amount: 200,
			at: "2 days ago"
		}
	]
};
var AppCtx = (0, import_react.createContext)(null);
var KEY = "ilmstation.v1";
function AppProvider({ children }) {
	const [s, setS] = (0, import_react.useState)(initial);
	const loaded = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) setS({
				...initial,
				...JSON.parse(raw),
				hydrated: true
			});
			else setS((p) => ({
				...p,
				hydrated: true
			}));
		} catch {
			setS((p) => ({
				...p,
				hydrated: true
			}));
		}
		loaded.current = true;
	}, []);
	(0, import_react.useEffect)(() => {
		if (!s.hydrated) return;
		try {
			localStorage.setItem(KEY, JSON.stringify({
				...s,
				hydrated: void 0
			}));
		} catch {}
	}, [s]);
	(0, import_react.useEffect)(() => {
		if (typeof document === "undefined") return;
		document.documentElement.classList.toggle("dark", s.dark);
		document.documentElement.style.fontSize = s.largeText ? "18px" : "";
	}, [s.dark, s.largeText]);
	const set = (0, import_react.useCallback)((patch) => setS((p) => ({
		...p,
		...patch
	})), []);
	const award = (0, import_react.useCallback)((xp, category, label) => {
		setS((p) => ({
			...p,
			xp: p.xp + xp,
			points: {
				...p.points,
				[category]: p.points[category] + xp
			},
			txns: [{
				id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
				label,
				category,
				amount: xp,
				at: "Just now"
			}, ...p.txns].slice(0, 40)
		}));
	}, []);
	const spend = (0, import_react.useCallback)((cost, label) => {
		let ok = false;
		setS((p) => {
			if (p.points.ajr + p.points.ilm + p.points.noor + p.points.hikmah < cost) return p;
			ok = true;
			let left = cost;
			const next = { ...p.points };
			const order = [
				"ilm",
				"ajr",
				"noor",
				"hikmah"
			].sort((a, b) => next[b] - next[a]);
			for (const k of order) {
				const take = Math.min(next[k], left);
				next[k] -= take;
				left -= take;
			}
			return {
				...p,
				points: next,
				txns: [{
					id: `t${Date.now()}`,
					label,
					category: "spend",
					amount: -cost,
					at: "Just now"
				}, ...p.txns].slice(0, 40)
			};
		});
		return ok;
	}, []);
	const unlock = (0, import_react.useCallback)((badgeId) => {
		let granted = false;
		setS((p) => {
			if (p.badges.includes(badgeId)) return p;
			const badge = BADGES.find((b) => b.id === badgeId);
			if (!badge) return p;
			granted = true;
			return {
				...p,
				badges: [...p.badges, badgeId],
				xp: p.xp + badge.xp,
				points: {
					...p.points,
					ajr: p.points.ajr + badge.xp
				},
				txns: [{
					id: `t${Date.now()}`,
					label: `Badge: ${badge.name}`,
					category: "ajr",
					amount: badge.xp,
					at: "Just now"
				}, ...p.txns].slice(0, 40),
				notifs: [{
					id: `n${Date.now()}`,
					icon: badge.icon,
					title: `Badge unlocked: ${badge.name}`,
					body: `${badge.description} · +${badge.xp} XP`,
					time: "now",
					unread: true,
					action: "achievements"
				}, ...p.notifs]
			};
		});
		return granted;
	}, []);
	const toggleBookmark = (0, import_react.useCallback)((slug) => {
		setS((p) => ({
			...p,
			bookmarks: p.bookmarks.includes(slug) ? p.bookmarks.filter((b) => b !== slug) : [...p.bookmarks, slug]
		}));
	}, []);
	const markArticleRead = (0, import_react.useCallback)((slug) => {
		setS((p) => p.readArticles.includes(slug) ? p : {
			...p,
			readArticles: [...p.readArticles, slug],
			articlesRead: p.articlesRead + 1,
			xp: p.xp + 30,
			points: {
				...p.points,
				ilm: p.points.ilm + 30
			},
			txns: [{
				id: `t${Date.now()}`,
				label: "Library article completed",
				category: "ilm",
				amount: 30,
				at: "Just now"
			}, ...p.txns].slice(0, 40)
		});
	}, []);
	const completeStage = (0, import_react.useCallback)((questId, stage) => {
		setS((p) => ({
			...p,
			questStages: {
				...p.questStages,
				[questId]: Math.max(p.questStages[questId] ?? 0, stage)
			}
		}));
	}, []);
	const pushNotif = (0, import_react.useCallback)((n) => {
		setS((p) => ({
			...p,
			notifs: [{
				...n,
				id: `n${Date.now()}`,
				unread: true,
				time: "now"
			}, ...p.notifs]
		}));
	}, []);
	const readAllNotifs = (0, import_react.useCallback)(() => {
		setS((p) => ({
			...p,
			notifs: p.notifs.map((n) => ({
				...n,
				unread: false
			}))
		}));
	}, []);
	const reset = (0, import_react.useCallback)(() => {
		try {
			localStorage.removeItem(KEY);
		} catch {}
		setS({
			...initial,
			hydrated: true
		});
	}, []);
	const finishOnboarding = (0, import_react.useCallback)(() => {
		setS((p) => ({
			...p,
			...demoSeed,
			xp: (demoSeed.xp ?? 0) + 50,
			onboarded: true,
			username: p.username || `@${(p.name || "seeker").split(" ")[0].toLowerCase()}`,
			txns: [{
				id: "t-welcome",
				label: "Welcome bonus",
				category: "ajr",
				amount: 50,
				at: "Just now"
			}, ...demoSeed.txns ?? []]
		}));
	}, []);
	const totalPoints = s.points.ajr + s.points.ilm + s.points.noor + s.points.hikmah;
	const value = (0, import_react.useMemo)(() => ({
		s,
		set,
		award,
		spend,
		unlock,
		toggleBookmark,
		markArticleRead,
		completeStage,
		pushNotif,
		readAllNotifs,
		totalPoints,
		level: levelFor(s.xp),
		reset,
		finishOnboarding
	}), [
		s,
		set,
		award,
		spend,
		unlock,
		toggleBookmark,
		markArticleRead,
		completeStage,
		pushNotif,
		readAllNotifs,
		totalPoints,
		reset,
		finishOnboarding
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppCtx.Provider, {
		value,
		children
	});
}
function useApp() {
	const ctx = (0, import_react.useContext)(AppCtx);
	if (!ctx) throw new Error("useApp must be used inside AppProvider");
	return ctx;
}
var FlowCtx = (0, import_react.createContext)(null);
function FlowProvider({ children }) {
	const [flow, setFlowState] = (0, import_react.useState)({});
	const setFlow = (0, import_react.useCallback)((patch) => setFlowState((p) => ({
		...p,
		...patch
	})), []);
	const value = (0, import_react.useMemo)(() => ({
		flow,
		setFlow
	}), [flow, setFlow]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowCtx.Provider, {
		value,
		children
	});
}
function useFlow() {
	const ctx = (0, import_react.useContext)(FlowCtx);
	if (!ctx) throw new Error("useFlow must be used inside FlowProvider");
	return ctx;
}
//#endregion
export { ILMBOT_ANSWERS as a, LEVELS as c, useFlow as d, HALAQAH_BOTS as i, RAMADAN_QUESTS as l, BADGES as n, ILMBOT_SUGGESTIONS as o, FlowProvider as r, IQ_TOPIC_PERF as s, AppProvider as t, useApp as u };
