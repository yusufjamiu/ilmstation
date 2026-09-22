import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, c as Empty, f as Mono, g as Segmented, h as SectionTitle, n as Avatar, o as Card, p as Pill, y as cn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as GLOBAL_LEADERBOARD, t as FRIENDS } from "./social-FuLE4Yer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/leaderboard-BbtfDLdz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S03 Leaderboard */
function Leaderboard() {
	const { s, level } = useApp();
	const [scope, setScope] = (0, import_react.useState)("friends");
	const [range, setRange] = (0, import_react.useState)("week");
	const me = {
		id: "me",
		name: s.name || "You",
		avatar: s.avatar,
		xp: range === "week" ? Math.round(s.xp * .35) : s.xp,
		level: level.level,
		streak: s.streak,
		friend: false
	};
	const rows = [...scope === "friends" ? FRIENDS.map((f) => ({
		id: f.id,
		name: f.name,
		avatar: f.avatar,
		xp: f.xp,
		level: f.level,
		streak: f.streak,
		friend: true
	})) : scope === "local" ? GLOBAL_LEADERBOARD.slice(0, 6) : GLOBAL_LEADERBOARD, me].map((r) => ({
		...r,
		xp: range === "week" ? Math.round(r.xp * .35) : r.xp
	})).sort((a, b) => b.xp - a.xp);
	const myRank = rows.findIndex((r) => r.id === "me") + 1;
	const above = rows[myRank - 2];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Leaderboard",
		subtitle: "Ranked by XP earned — reset every Monday.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
					value: scope,
					onChange: setScope,
					options: [
						{
							value: "friends",
							label: "Friends"
						},
						{
							value: "local",
							label: "Local"
						},
						{
							value: "global",
							label: "Global"
						}
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
					value: range,
					onChange: setRange,
					options: [{
						value: "week",
						label: "This week"
					}, {
						value: "all",
						label: "All time"
					}]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				tone: "yellow",
				className: "rounded-r20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end justify-center gap-4",
					children: [
						rows[1],
						rows[0],
						rows[2]
					].filter(Boolean).map((r, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: r.avatar,
								size: idx === 1 ? 60 : 46,
								ring: r.id === "me" ? "yellow" : idx === 1 ? "green" : "none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 max-w-24 truncate text-[13px] font-black",
								children: r.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
								className: "text-[13px] font-bold",
								children: [r.xp, " XP"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("brutal-flat mt-1 grid w-16 place-items-end justify-center rounded-t-r8 bg-surface pb-1 text-[15px] font-black", idx === 1 ? "h-24" : idx === 0 ? "h-16" : "h-12"),
								children: idx === 1 ? "🥇" : idx === 0 ? "🥈" : "🥉"
							})
						]
					}, r.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				tone: "ink",
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "text-[26px] font-bold",
							children: ["#", myRank]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
							emoji: s.avatar,
							size: 40
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[15px] font-black",
								children: [me.name, " — you"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
								className: "text-[11px] font-bold tracking-widest uppercase opacity-70",
								children: [
									me.xp,
									" XP · Level ",
									level.level,
									" · 🔥 ",
									s.streak
								]
							})]
						}),
						above ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "yellow",
							children: [
								above.xp - me.xp,
								" XP behind ",
								above.name.split(" ")[0]
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "green",
							children: "Top of the board"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
						className: "text-[13px] font-bold text-ink2",
						children: [rows.length, " learners"]
					}),
					children: scope === "friends" ? "Your friends" : scope === "local" ? "Your city" : "Worldwide"
				}), rows.length <= 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
					icon: "🤝",
					title: "No one to compare with yet",
					body: "Add friends and you'll see a friendly weekly ranking here.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/friends",
						children: "Find friends"
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: rows.map((r, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("brutal-sm flex items-center gap-3 rounded-r12 px-3 py-2.5", r.id === "me" ? "bg-yellow" : "bg-field"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "w-7 text-[15px] font-bold",
								children: idx + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: r.avatar,
								size: 36
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[15px] font-black",
									children: r.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
									className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
									children: [
										"Level ",
										r.level,
										" · 🔥 ",
										r.streak
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[15px] font-bold",
								children: r.xp
							}),
							r.id !== "me" && FRIENDS.some((f) => f.id === r.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/friends/$friendId",
								params: { friendId: r.id },
								variant: "outline",
								size: "sm",
								children: "View"
							}) : null
						]
					}) }, r.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/challenge/setup",
					size: "lg",
					full: true,
					children: "⚔️ Challenge a friend"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/share",
					search: { kind: "rank" },
					variant: "outline",
					size: "lg",
					full: true,
					children: "📤 Share my rank"
				})]
			})
		]
	});
}
//#endregion
export { Leaderboard as component };
