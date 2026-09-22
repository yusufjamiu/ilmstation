import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, f as Mono, h as SectionTitle, o as Card, p as Pill, r as Bar, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { s as IQ_TOPIC_PERF, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { t as QUESTS } from "./quests-BRY7yFVm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quest-Bn565pOO.js
var import_jsx_runtime = require_jsx_runtime();
/** H02 Daily Quest Expanded */
function DailyQuestExpanded() {
	const { s } = useApp();
	const quest = QUESTS.find((q) => (s.questStages[q.id] ?? 0) < 3) ?? QUESTS[0];
	const topic = topicById(quest.topic);
	const done = s.questStages[quest.id] ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/home",
			label: "Home"
		},
		title: "Today's Daily Quest",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "rounded-r20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-[28px] leading-tight font-black",
							children: quest.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
							size: "xl",
							className: "mt-1",
							children: quest.arabic
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[52px]",
							"aria-hidden": true,
							children: topic.icon
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "surface",
								children: "⏱ 5 min"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "surface",
								children: "📝 10 questions"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "surface",
								children: topic.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "ink",
								children: ["+80 XP · ", s.difficulty]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-[15px] font-semibold",
						children: [
							"Today's quest was picked for you from ",
							topic.name,
							" — a topic in your interests where your accuracy has room to grow. Every answer comes with a full explanation and its source."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Stage progress" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: quest.stages.map((st, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "brutal-sm flex items-center gap-3 rounded-r12 bg-field px-3 py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `brutal-flat grid h-7 w-7 place-items-center rounded-rf text-[13px] font-black ${i < done ? "bg-green text-surface" : i === done ? "bg-yellow" : "bg-surface text-muted"}`,
								children: i < done ? "✓" : i + 1
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex-1 text-[15px] font-bold",
								children: [st.name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
									className: "ml-2 text-[11px] text-ink2",
									children: [
										st.questions,
										" Q · ",
										st.multiplier,
										"×"
									]
								})]
							})]
						}, st.name))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							value: done / 3,
							label: "Quest progress"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mono mt-1 text-[11px] font-bold text-ink2 uppercase",
							children: [done, " of 3 stages complete"]
						})]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Your topic accuracy" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: IQ_TOPIC_PERF.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex justify-between text-[13px] font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.topic }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, { children: [t.pct, "%"] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						value: t.pct / 100,
						tone: t.pct >= 75 ? "green" : "yellow",
						label: t.topic
					})] }, t.topic))
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/play/lobby",
					search: {
						topic: quest.topic,
						count: 10,
						difficulty: s.difficulty,
						quest: quest.id
					},
					size: "lg",
					full: true,
					children: "Start quest →"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/share",
					search: { kind: "quest" },
					variant: "outline",
					size: "lg",
					children: "📤 Share"
				})]
			})
		]
	});
}
//#endregion
export { DailyQuestExpanded as component };
