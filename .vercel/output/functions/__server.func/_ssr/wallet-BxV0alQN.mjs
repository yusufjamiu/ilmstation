import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, c as Empty, f as Mono, g as Segmented, h as SectionTitle, o as Card, p as Pill, r as Bar, y as cn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallet-BxV0alQN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CATS = [
	{
		id: "ajr",
		name: "Ajr",
		arabic: "أَجْر",
		icon: "🤲",
		how: "Streaks, badges and consistency",
		tone: "bg-green-l"
	},
	{
		id: "ilm",
		name: "Ilm",
		arabic: "عِلْم",
		icon: "📗",
		how: "Quizzes, quests and articles",
		tone: "bg-yellow"
	},
	{
		id: "noor",
		name: "Noor",
		arabic: "نُور",
		icon: "🕯️",
		how: "Hifz and Quran recitation",
		tone: "bg-pink-l"
	},
	{
		id: "hikmah",
		name: "Hikmah",
		arabic: "حِكْمَة",
		icon: "🔮",
		how: "Daily Wisdom and IlmBot study",
		tone: "bg-field"
	}
];
/** Q06 Points Wallet */
function Wallet() {
	const { s, totalPoints } = useApp();
	const [filter, setFilter] = (0, import_react.useState)("all");
	const txns = s.txns.filter((t) => filter === "all" ? true : t.category === filter);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Points Wallet",
		subtitle: "Four categories, one balance — spend it in the Store.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "ink",
				className: "rounded-r24",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono text-[11px] font-bold tracking-widest uppercase opacity-70",
						children: "Total balance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
							className: "text-[40px] leading-none font-bold",
							children: totalPoints
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[15px] font-black",
							children: "points"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/store",
							variant: "primary",
							size: "sm",
							children: "🛒 Spend in Store"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/store",
							search: { item: "sadaqah" },
							variant: "green",
							size: "sm",
							children: "🤲 Give Sadaqah"
						})]
					}),
					s.donated > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-[13px] font-bold",
						children: [
							"You've donated ",
							s.donated,
							" points — about $",
							(s.donated / 500).toFixed(2),
							"."
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: CATS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("brutal rounded-r16 p-4", c.tone),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[26px]",
								"aria-hidden": true,
								children: c.icon
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[22px] font-bold",
								children: s.points[c.id]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "mt-1 text-[18px] font-black",
							children: [
								c.name,
								" · ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "arabic",
									children: c.arabic
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[13px] font-semibold text-ink2",
							children: c.how
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								value: totalPoints ? s.points[c.id] / totalPoints : 0,
								label: `${c.name} share`
							})
						})
					]
				}, c.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: filter,
							onChange: setFilter,
							options: [
								{
									value: "all",
									label: "All"
								},
								{
									value: "ilm",
									label: "Ilm"
								},
								{
									value: "ajr",
									label: "Ajr"
								},
								{
									value: "spend",
									label: "Spent"
								}
							]
						}),
						children: "Transaction history"
					}),
					txns.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
						icon: "🧾",
						title: "No transactions here yet",
						body: "Play a quiz, read an article or finish a Hifz session and it will show up in this list.",
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/play",
							children: "Go play"
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: txns.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "brutal-sm flex items-center gap-3 rounded-r12 bg-field px-3 py-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "brutal-sm grid h-9 w-9 shrink-0 place-items-center rounded-rf bg-surface text-[15px]",
									children: t.amount > 0 ? "＋" : "－"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[15px] font-black",
										children: t.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
										className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
										children: [
											t.at,
											" · ",
											t.category
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
									className: cn("text-[15px] font-bold", t.amount > 0 ? "text-green" : "text-ink2"),
									children: [t.amount > 0 ? "+" : "", t.amount]
								})
							]
						}, t.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "field",
							children: "Points never expire · earn by learning, not by paying"
						})
					})
				]
			})
		]
	});
}
//#endregion
export { Wallet as component };
