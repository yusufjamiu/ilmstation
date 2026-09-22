import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Stat, a as BtnLink, f as Mono, o as Card, p as Pill, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { n as questById } from "./quests-BRY7yFVm.mjs";
import { t as Route } from "./lobby-CxFWm2nw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lobby-Dj_Wy4XR.js
var import_jsx_runtime = require_jsx_runtime();
var MULT = {
	beginner: 1,
	intermediate: 1.5,
	advanced: 2
};
/** P04 Quiz Lobby */
function QuizLobby() {
	const { topic, count, difficulty, quest } = Route.useSearch();
	const t = topicById(topic);
	const q = quest ? questById(quest) : void 0;
	const mult = MULT[difficulty] ?? 1.5;
	const xp = Math.round(count * 8 * mult);
	const minutes = Math.max(2, Math.round(count * 22 / 60));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/play",
			label: "Play"
		},
		title: q ? q.name : `${t.name} quiz`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "rounded-r20 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[56px]",
						"aria-hidden": true,
						children: t.icon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-[28px] leading-tight font-black",
						children: t.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
						size: "xl",
						className: "text-center",
						children: t.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[15px] font-semibold",
						children: t.scope
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Questions",
						value: count,
						icon: "📝"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Est. time",
						value: `${minutes}m`,
						icon: "⏱"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "XP reward",
						value: `+${xp}`,
						tone: "green"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Multiplier",
						value: `${mult}×`,
						tone: "yellow"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: "How it works"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-2 space-y-1.5 text-[15px] font-semibold text-ink2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Four options per question, one correct." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Every answer — right or wrong — opens a full explanation with its source." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Skipping costs 5 XP. Running out of time counts as a miss." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• A perfect score adds a +20 XP bonus." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "ink",
								children: difficulty
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: t.category }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "green",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: t.questions }), " in pool"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/quiz",
					search: {
						topic,
						count,
						difficulty,
						quest
					},
					size: "lg",
					full: true,
					children: "Start →"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/play/difficulty",
					search: {
						topic,
						count
					},
					variant: "outline",
					size: "lg",
					children: "Change difficulty"
				})]
			})
		]
	});
}
//#endregion
export { QuizLobby as component };
