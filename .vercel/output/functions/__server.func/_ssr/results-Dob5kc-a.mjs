import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, f as Mono, h as SectionTitle, i as Btn, n as Avatar, o as Card, p as Pill, s as Confetti } from "./kit-ZBxajPhE.mjs";
import { d as useFlow, i as HALAQAH_BOTS, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/results-Dob5kc-a.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** FM03 Family Results */
function FamilyResults() {
	const { flow } = useFlow();
	const { s, award } = useApp();
	const navigate = useNavigate();
	const res = flow.roomResult ?? {
		code: "IQ-7F2K",
		topic: "seerah",
		scores: { me: 0 },
		players: []
	};
	const topic = topicById(res.topic);
	const [applied, setApplied] = (0, import_react.useState)(false);
	const rows = [{
		id: "me",
		name: "You",
		avatar: s.avatar,
		score: res.scores.me ?? 0
	}, ...HALAQAH_BOTS.filter((b) => res.players.includes(b.id)).map((b) => ({
		id: b.id,
		name: b.name,
		avatar: b.avatar,
		score: res.scores[b.id] ?? 0
	}))].sort((a, b) => b.score - a.score);
	const myRank = rows.findIndex((r) => r.id === "me") + 1;
	const xp = 40 + (res.scores.me ?? 0) * 6 + (myRank === 1 ? 30 : 0);
	(0, import_react.useEffect)(() => {
		if (applied) return;
		setApplied(true);
		award(xp, "ajr", `Halaqah ${res.code} — rank ${myRank}`);
	}, [applied]);
	const podium = [
		rows[1],
		rows[0],
		rows[2]
	].filter(Boolean);
	const heights = [
		"h-20",
		"h-28",
		"h-14"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: myRank === 1 ? "You topped the circle!" : "Halaqah complete",
		children: [
			myRank === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Confetti, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "rounded-r24",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end justify-center gap-3",
					children: podium.map((p, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: p.avatar,
								size: idx === 1 ? 56 : 44,
								ring: idx === 1 ? "green" : "none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-[13px] font-black",
								children: p.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[13px] font-bold",
								children: p.score
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `brutal-flat mt-1 grid ${heights[idx]} w-16 place-items-end justify-center rounded-t-r8 bg-surface pb-1 text-[13px] font-black`,
								children: idx === 1 ? "🥇" : idx === 0 ? "🥈" : "🥉"
							})
						]
					}, p.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap justify-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "ink",
							children: res.code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "surface",
							children: [
								topic.icon,
								" ",
								topic.name
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "surface",
							children: [
								"+",
								xp,
								" XP"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Full ranking" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: rows.map((r, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: `brutal-sm flex items-center gap-3 rounded-r12 px-3 py-2.5 ${r.id === "me" ? "bg-yellow" : "bg-field"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "w-6 text-[15px] font-bold",
								children: idx + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: r.avatar,
								size: 36
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1 text-[15px] font-black",
								children: r.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[15px] font-bold",
								children: r.score
							})
						]
					}, r.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						size: "lg",
						full: true,
						onClick: () => navigate({ to: "/halaqah" }),
						children: "Play again"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/share",
						search: { kind: "progress" },
						variant: "outline",
						size: "lg",
						full: true,
						children: "📤 Share results"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/home",
						variant: "outline",
						size: "lg",
						children: "Home"
					})
				]
			})
		]
	});
}
//#endregion
export { FamilyResults as component };
