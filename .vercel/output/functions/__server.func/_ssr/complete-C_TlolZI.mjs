import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Stat, a as BtnLink, f as Mono, o as Card, p as Pill, s as Confetti, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { n as BADGES, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as questById, t as QUESTS } from "./quests-BRY7yFVm.mjs";
import { t as Route } from "./complete-8bsenifR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/complete-C_TlolZI.js
var import_jsx_runtime = require_jsx_runtime();
/** Q03 Quest Complete */
function QuestComplete() {
	const { quest: id } = Route.useSearch();
	const { s } = useApp();
	const quest = (id ? questById(id) : void 0) ?? QUESTS[0];
	const badge = quest.badge ? BADGES.find((b) => b.id === quest.badge) : void 0;
	const index = QUESTS.findIndex((q) => q.id === quest.id);
	const after = QUESTS[index + 1];
	const questions = quest.stages.reduce((a, st) => a + st.questions, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Quest complete",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Confetti, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "green",
				className: "rounded-r24 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[56px]",
						"aria-hidden": true,
						children: "🏁"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-[28px] leading-tight font-black",
						children: quest.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
						size: "lg",
						className: "mt-1",
						children: quest.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap justify-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "ink",
								children: [
									"+",
									quest.xp,
									" XP"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "surface",
								children: quest.chapter
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "surface",
								children: "3 / 3 stages"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Questions answered",
						value: questions,
						icon: "❓"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Quest XP",
						value: quest.xp,
						tone: "yellow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Total XP",
						value: s.xp,
						tone: "green"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Badges",
						value: s.badges.length,
						icon: "🏅"
					})
				]
			}),
			badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "pink",
				className: "mt-4 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[44px]",
						"aria-hidden": true,
						children: badge.icon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[18px] font-black",
						children: badge.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
						size: "md",
						children: badge.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[13px] font-semibold text-ink2",
						children: badge.description
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mono text-[11px] font-bold tracking-widest text-ink2 uppercase",
					children: "Next on the map"
				}), after ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[18px] font-black",
						children: after.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
						size: "md",
						className: "text-ink2",
						children: after.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
						className: "mt-1 block text-[13px] font-bold text-ink2",
						children: [
							after.chapter,
							" · +",
							after.xp,
							" XP"
						]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[15px] font-semibold",
					children: "You've finished every quest on the map. New chapters arrive with Ramadan Mode."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [
					after ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BtnLink, {
						to: "/quests/$questId",
						params: { questId: after.id },
						size: "lg",
						full: true,
						children: [
							"Start ",
							after.name,
							" →"
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/quests",
						size: "lg",
						full: true,
						children: "Back to Quest Map"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/share",
						search: { kind: "quest" },
						variant: "outline",
						size: "lg",
						full: true,
						children: "📤 Share this"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/achievements",
						variant: "outline",
						size: "lg",
						children: "Achievements"
					})
				]
			})
		]
	});
}
//#endregion
export { QuestComplete as component };
