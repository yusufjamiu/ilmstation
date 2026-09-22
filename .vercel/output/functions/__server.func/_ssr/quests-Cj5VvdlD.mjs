import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as Modal, f as Mono, h as SectionTitle, i as Btn, o as Card, p as Pill, r as Bar, t as Arabic, y as cn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { n as questById, t as QUESTS } from "./quests-BRY7yFVm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quests-Cj5VvdlD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Q01 Quest Map */
function QuestMap() {
	const { s } = useApp();
	const navigate = useNavigate();
	const [lockedNote, setLockedNote] = (0, import_react.useState)(null);
	const stagesDone = (id) => s.questStages[id] ?? 0;
	const isComplete = (id) => stagesDone(id) >= 3;
	const isUnlocked = (q) => !q.prereq || isComplete(q.prereq);
	const chapters = Array.from(new Set(QUESTS.map((q) => q.chapter)));
	const completed = QUESTS.filter((q) => isComplete(q.id)).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Quest Map",
		subtitle: "A structured path — finish one quest to open the next.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "mb-5 rounded-r20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "text-[13px] font-bold",
							children: [
								completed,
								"/",
								QUESTS.length,
								" quests"
							]
						}),
						children: "Your journey"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						value: completed / QUESTS.length,
						tone: "green",
						label: "Quests completed"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "surface",
								children: ["Level ", s.badges.length ? "up next" : "keep going"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "ink",
								children: "3 stages per quest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "surface",
								children: "Multipliers 1× → 1.5×"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-6",
				children: chapters.map((ch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: ch }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3 md:grid-cols-2",
					children: QUESTS.filter((q) => q.chapter === ch).map((q) => {
						const done = stagesDone(q.id);
						const unlocked = isUnlocked(q);
						const t = topicById(q.topic);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "text-left",
							onClick: () => unlocked ? navigate({
								to: "/quests/$questId",
								params: { questId: q.id }
							}) : setLockedNote(questById(q.prereq)?.name ?? "the previous quest"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								tone: done >= 3 ? "green" : unlocked ? "surface" : "field",
								className: cn("press h-full rounded-r16", !unlocked && "opacity-70"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("brutal-flat grid h-12 w-12 shrink-0 place-items-center rounded-rf text-[22px]", done >= 3 ? "bg-green text-surface" : unlocked ? "bg-yellow" : "bg-surface"),
										"aria-hidden": true,
										children: done >= 3 ? "✓" : unlocked ? t.icon : "🔒"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-[18px] leading-tight font-black",
												children: q.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
												size: "sm",
												className: "text-ink2",
												children: q.arabic
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 flex items-center gap-1.5",
												children: q.stages.map((st, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													title: `${st.name} · ${st.multiplier}×`,
													className: cn("brutal-sm h-3 flex-1 rounded-rf", i < done ? "bg-green" : "bg-field")
												}, st.name))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-2 flex flex-wrap gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
														tone: "field",
														children: [done, "/3 stages"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
														tone: "field",
														children: [
															"+",
															q.xp,
															" XP"
														]
													}),
													q.badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
														tone: "pink",
														children: "🏅 Badge"
													}) : null
												]
											})
										]
									})]
								})
							})
						}, q.id);
					})
				})] }, ch))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				open: !!lockedNote,
				onClose: () => setLockedNote(null),
				title: "Quest locked",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: [
						"Finish all three stages of ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: lockedNote }),
						" to open this quest. The path is sequential on purpose — each quest builds on the one before."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					full: true,
					className: "mt-4",
					onClick: () => setLockedNote(null),
					children: "Got it"
				})]
			})
		]
	});
}
//#endregion
export { QuestMap as component };
