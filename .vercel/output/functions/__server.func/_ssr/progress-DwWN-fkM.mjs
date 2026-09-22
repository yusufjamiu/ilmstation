import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Stat, a as BtnLink, f as Mono, g as Segmented, h as SectionTitle, o as Card, p as Pill, r as Bar, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { c as LEVELS, s as IQ_TOPIC_PERF, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { t as TOPICS } from "./topics-_n1jadKH.mjs";
import { t as QUESTS } from "./quests-BRY7yFVm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/progress-DwWN-fkM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Q04 My Progress */
function Progress() {
	const { s, level, totalPoints } = useApp();
	const [range, setRange] = (0, import_react.useState)("week");
	const bars = range === "week" ? [
		120,
		180,
		90,
		240,
		160,
		60,
		200
	] : range === "month" ? [
		640,
		820,
		510,
		900
	] : [
		1200,
		2400,
		3100,
		4200
	];
	const labels = range === "week" ? [
		"M",
		"T",
		"W",
		"T",
		"F",
		"S",
		"S"
	] : range === "month" ? [
		"W1",
		"W2",
		"W3",
		"W4"
	] : [
		"Q1",
		"Q2",
		"Q3",
		"Q4"
	];
	const peak = Math.max(...bars);
	const questsDone = QUESTS.filter((q) => (s.questStages[q.id] ?? 0) >= 3).length;
	const accuracy = s.quizzesPlayed ? Math.min(96, 68 + s.perfectQuizzes * 4) : 0;
	const strongest = [...IQ_TOPIC_PERF].sort((a, b) => b.pct - a.pct)[0];
	const weakest = [...IQ_TOPIC_PERF].sort((a, b) => a.pct - b.pct)[0];
	const inLevel = level.max === Infinity ? 1 : (s.xp - level.min) / (level.max - level.min + 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "My Progress",
		subtitle: "Your learning, measured honestly.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Total XP",
						value: s.xp,
						tone: "yellow",
						icon: "⚡"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Accuracy",
						value: `${accuracy}%`,
						tone: "green"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Quizzes played",
						value: s.quizzesPlayed,
						icon: "🎯"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Current streak",
						value: `${s.streak} days`,
						icon: "🔥"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						value: range,
						onChange: setRange,
						options: [
							{
								value: "week",
								label: "Week"
							},
							{
								value: "month",
								label: "Month"
							},
							{
								value: "all",
								label: "All"
							}
						]
					}),
					children: "XP earned"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-40 items-end gap-2",
					children: bars.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[11px] font-bold text-ink2",
								children: v
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "brutal-flat w-full rounded-t-r8 bg-yellow",
								style: { height: `${Math.max(8, v / peak * 118)}px` },
								role: "img",
								"aria-label": `${labels[i]}: ${v} XP`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[11px] font-bold",
								children: labels[i]
							})
						]
					}, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Accuracy by topic" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-3",
						children: IQ_TOPIC_PERF.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 flex justify-between text-[13px] font-black",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.topic }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, { children: [t.pct, "%"] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							value: t.pct / 100,
							tone: t.pct >= 80 ? "green" : t.pct >= 65 ? "yellow" : "pink"
						})] }, t.topic))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "green",
							children: ["Strongest: ", strongest.topic]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "pink",
							children: ["Needs work: ", weakest.topic]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BtnLink, {
						to: "/play/difficulty",
						search: { topic: weakest.topic.toLowerCase() },
						variant: "outline",
						className: "mt-3",
						children: [
							"Revise ",
							weakest.topic,
							" →"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Level ladder" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-1 flex justify-between text-[13px] font-black",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Level ",
									level.level,
									" · ",
									level.name
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, { children: [
									s.xp,
									" / ",
									level.max === Infinity ? "∞" : level.max,
									" XP"
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								value: inLevel,
								tone: "green",
								label: "Level progress"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
								size: "md",
								className: "mt-1",
								children: level.arabic
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: LEVELS.map((l) => {
							const reached = s.xp >= l.min;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: `brutal-sm flex items-center gap-3 rounded-r12 px-3 py-2 ${l.level === level.level ? "bg-yellow" : reached ? "bg-green-l" : "bg-field"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
										className: "w-5 text-[13px] font-bold",
										children: l.level
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[15px] font-black",
											children: l.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] font-semibold text-ink2",
											children: l.unlocks
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
										className: "text-[11px] font-bold",
										children: [l.min, "+"]
									})
								]
							}, l.level);
						})
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Activity mix" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Quests completed",
								value: `${questsDone}/${QUESTS.length}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Hifz sessions",
								value: s.hifzSessions
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Articles read",
								value: s.articlesRead
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Duel record",
								value: `${s.duelWins}W · ${s.duelLosses}L`
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "field",
							children: ["Total points: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: totalPoints })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "field",
							children: [
								"Interests: ",
								s.interests.length || TOPICS.length,
								" topics"
							]
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { Progress as component };
