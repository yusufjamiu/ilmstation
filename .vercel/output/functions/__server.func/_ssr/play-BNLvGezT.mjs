import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, o as Card, p as Pill, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { t as QUESTS } from "./quests-BRY7yFVm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/play-BNLvGezT.js
var import_jsx_runtime = require_jsx_runtime();
/** P01 Play Hub */
function PlayHub() {
	const { s } = useApp();
	const quest = QUESTS.find((q) => (s.questStages[q.id] ?? 0) < 3) ?? QUESTS[0];
	const MODES = [
		{
			to: "/play/lobby",
			search: {
				topic: quest.topic,
				count: 10,
				difficulty: s.difficulty,
				quest: quest.id
			},
			icon: "🎯",
			name: "Daily Quest",
			arabic: "مُهِمَّةُ الْيَوْم",
			note: "Today: " + quest.name,
			xp: "+80 XP",
			tone: "yellow"
		},
		{
			to: "/play/topics",
			icon: "⚡",
			name: "Quick Quiz",
			arabic: "اِخْتِبَارٌ سَرِيع",
			note: "Any topic, any difficulty",
			xp: "1× – 2× XP",
			tone: "surface"
		},
		{
			to: "/challenge/setup",
			icon: "⚔️",
			name: "Challenge",
			arabic: "تَحَدِّي",
			note: "Duel a friend head-to-head",
			xp: "+50% XP",
			tone: "pink"
		},
		{
			to: "/hifz",
			icon: "📖",
			name: "Hifz Mode",
			arabic: "حِفْظ",
			note: "Memorise with spaced repetition",
			xp: "+30 XP",
			tone: "green"
		},
		{
			to: "/halaqah",
			icon: "👨‍👩‍👧",
			name: "Halaqah",
			arabic: "حَلَقَة",
			note: "Live room for up to 6 players",
			xp: "Host: Premium",
			tone: "field"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Play",
		subtitle: "Five modes. Every one of them earns XP.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: MODES.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: m.to,
				search: m.search,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					tone: m.tone,
					className: "press h-full rounded-r20",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[40px]",
								"aria-hidden": true,
								children: m.icon
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: m.tone === "yellow" ? "ink" : "yellow",
								children: m.xp
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 text-[24px] leading-tight font-black",
							children: m.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
							size: "md",
							children: m.arabic
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-[13px] font-semibold text-ink2",
							children: m.note
						})
					]
				})
			}, m.name))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "mt-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[24px]",
						"aria-hidden": true,
						children: topicById(quest.topic).icon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono text-[11px] font-bold tracking-widest text-ink2 uppercase",
							children: "Difficulty baseline"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[15px] font-black capitalize",
							children: s.difficulty
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/play/difficulty",
						search: {
							topic: quest.topic,
							count: 10
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "yellow",
							children: "Change ›"
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-[13px] text-ink2",
				children: [
					"Higher difficulty multiplies XP: Beginner 1×, Intermediate 1.5×, Advanced 2×. Your",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.quizzesPlayed }),
					" quizzes so far set this baseline."
				]
			})]
		})]
	});
}
//#endregion
export { PlayHub as component };
