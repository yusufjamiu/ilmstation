import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, g as Segmented, i as Btn, o as Card, p as Pill, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { t as Route } from "./difficulty-4lWZ3P-K.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/difficulty-BTYJ-HmR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TIERS = [
	{
		id: "beginner",
		name: "Beginner",
		arabic: "مُبْتَدِئ",
		mult: "1×",
		note: "Definitions and basic recall. 25 seconds per question."
	},
	{
		id: "intermediate",
		name: "Intermediate",
		arabic: "مُتَوَسِّط",
		mult: "1.5×",
		note: "Contextual application. 20 seconds per question."
	},
	{
		id: "advanced",
		name: "Advanced",
		arabic: "مُتَقَدِّم",
		mult: "2×",
		note: "Synthesis and scholarly nuance. 15 seconds per question."
	}
];
/** P03 Difficulty */
function DifficultyPicker() {
	const { topic, count } = Route.useSearch();
	const { s, set } = useApp();
	const navigate = useNavigate();
	const t = topicById(topic);
	const [tier, setTier] = (0, import_react.useState)(s.difficulty);
	const [len, setLen] = (0, import_react.useState)(count ?? 10);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/play/topics",
			label: "Topics"
		},
		title: "Set your difficulty",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "field",
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[36px]",
						"aria-hidden": true,
						children: t.icon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[20px] font-black",
						children: t.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
						size: "md",
						children: t.arabic
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
						className: "ml-auto text-[13px] font-bold text-ink2",
						children: [t.questions, " in pool"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3",
				children: TIERS.map((tr) => {
					const active = tier === tr.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setTier(tr.id),
						"aria-pressed": active,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							tone: active ? "yellow" : "surface",
							className: "press flex items-center gap-4 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[20px] font-black",
										children: tr.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
										size: "sm",
										className: "text-ink2",
										children: tr.arabic
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[13px] font-semibold text-ink2",
									children: tr.note
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: active ? "ink" : "green",
								children: [tr.mult, " XP"]
							})]
						})
					}, tr.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
					children: "Question count"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
					value: String(len),
					onChange: (v) => setLen(Number(v)),
					options: [
						{
							value: "5",
							label: "5 questions"
						},
						{
							value: "10",
							label: "10 questions"
						},
						{
							value: "15",
							label: "15 questions"
						}
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				size: "lg",
				full: true,
				className: "mt-5",
				onClick: () => {
					set({ difficulty: tier });
					navigate({
						to: "/play/lobby",
						search: {
							topic,
							count: len,
							difficulty: tier
						}
					});
				},
				children: "Continue →"
			})
		]
	});
}
//#endregion
export { DifficultyPicker as component };
