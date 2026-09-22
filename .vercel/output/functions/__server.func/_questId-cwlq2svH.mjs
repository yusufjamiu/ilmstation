import { n as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, f as Mono, h as SectionTitle, i as Btn, o as Card, p as Pill, r as Bar, t as Arabic, y as cn } from "./_ssr/kit-ZBxajPhE.mjs";
import { n as BADGES, u as useApp } from "./_ssr/store-BMzoaAqa.mjs";
import { t as AppShell } from "./_ssr/AppShell-BbhG3piC.mjs";
import { n as topicById } from "./_ssr/topics-_n1jadKH.mjs";
import { t as QUESTS } from "./_ssr/quests-BRY7yFVm.mjs";
import { t as Route } from "./_questId-BRGmsK6H.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_questId-cwlq2svH.js
var import_jsx_runtime = require_jsx_runtime();
/** Q02 Quest Detail */
function QuestDetail() {
	const { quest } = Route.useLoaderData();
	const { s } = useApp();
	const navigate = useNavigate();
	const t = topicById(quest.topic);
	const done = s.questStages[quest.id] ?? 0;
	const badge = quest.badge ? BADGES.find((b) => b.id === quest.badge) : void 0;
	const next = quest.stages[Math.min(done, 2)];
	const index = QUESTS.findIndex((q) => q.id === quest.id);
	const after = QUESTS[index + 1];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/quests",
			label: "Quest Map"
		},
		title: quest.name,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "rounded-r20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
						tone: "ink",
						children: quest.chapter
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
						size: "lg",
						className: "mt-2",
						children: quest.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-[15px] font-bold",
						children: [
							t.icon,
							" ",
							t.name,
							" · ",
							quest.stages.reduce((a, st) => a + st.questions, 0),
							" questions across 3 stages"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							value: done / 3,
							tone: "green",
							label: "Stages complete"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "surface",
								children: [
									"+",
									quest.xp,
									" XP total"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "surface",
								children: [done, "/3 stages done"]
							}),
							badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "pink",
								children: [
									badge.icon,
									" ",
									badge.name
								]
							}) : null
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
				className: "mt-5",
				children: "Stages"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "space-y-3",
				children: quest.stages.map((st, i) => {
					const complete = i < done;
					const current = i === done;
					const locked = i > done;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						tone: complete ? "green" : current ? "surface" : "field",
						className: cn("rounded-r16", locked && "opacity-70"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("brutal-flat mono grid h-10 w-10 shrink-0 place-items-center rounded-rf text-[15px] font-bold", complete ? "bg-green text-surface" : current ? "bg-yellow" : "bg-surface"),
									"aria-hidden": true,
									children: complete ? "✓" : locked ? "🔒" : i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "text-[18px] font-black",
										children: [
											"Stage ",
											i + 1,
											" · ",
											st.name
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
										className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
										children: [
											st.questions,
											" questions · ",
											st.multiplier,
											"× XP"
										]
									})]
								}),
								current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									onClick: () => navigate({
										to: "/play/lobby",
										search: {
											topic: quest.topic,
											count: st.questions,
											difficulty: i === 0 ? "beginner" : i === 1 ? "intermediate" : "advanced",
											quest: quest.id
										}
									}),
									children: done === 0 ? "Start" : "Continue"
								}) : complete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "green",
									children: "Done"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "field",
									children: "Locked"
								})
							]
						})
					}) }, st.name);
				})
			}),
			done >= 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "green",
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[18px] font-black",
						children: "Quest complete ✓"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[15px] font-semibold text-ink2",
						children: after ? `${after.name} is now open on the map.` : "You've reached the end of the path."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/quests/complete",
							search: { quest: quest.id },
							variant: "ink",
							children: "View reward summary"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/quests",
							variant: "outline",
							children: "Back to map"
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Btn, {
					size: "lg",
					full: true,
					onClick: () => navigate({
						to: "/play/lobby",
						search: {
							topic: quest.topic,
							count: next.questions,
							difficulty: done === 0 ? "beginner" : done === 1 ? "intermediate" : "advanced",
							quest: quest.id
						}
					}),
					children: [done === 0 ? "Begin Stage 1" : `Continue Stage ${done + 1}`, " →"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/library",
					variant: "outline",
					size: "lg",
					full: true,
					children: "📚 Read up first"
				})]
			})
		]
	});
}
//#endregion
export { QuestDetail as component };
