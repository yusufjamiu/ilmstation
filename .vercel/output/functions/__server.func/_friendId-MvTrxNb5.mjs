import { n as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { _ as Stat, a as BtnLink, f as Mono, h as SectionTitle, i as Btn, n as Avatar, o as Card, p as Pill, r as Bar } from "./_ssr/kit-ZBxajPhE.mjs";
import { u as useApp } from "./_ssr/store-BMzoaAqa.mjs";
import { t as AppShell } from "./_ssr/AppShell-BbhG3piC.mjs";
import { n as topicById } from "./_ssr/topics-_n1jadKH.mjs";
import { t as Route } from "./_friendId-DUlvgDAN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_friendId-MvTrxNb5.js
var import_jsx_runtime = require_jsx_runtime();
/** S06 Friend Profile */
function FriendProfile() {
	const { friend } = Route.useLoaderData();
	const { s } = useApp();
	const navigate = useNavigate();
	const total = friend.h2h.wins + friend.h2h.losses;
	const winRate = total ? friend.h2h.wins / total : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/friends",
			label: "Friends"
		},
		title: friend.name,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				tone: "yellow",
				className: "rounded-r24",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
						emoji: friend.avatar,
						size: 80,
						ring: friend.online ? "green" : "none"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-[26px] leading-tight font-black",
								children: friend.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[13px] font-bold text-ink2",
								children: friend.username
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: "ink",
										children: ["Level ", friend.level]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: "surface",
										children: [
											"🔥 ",
											friend.streak,
											" days"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: "surface",
										children: [friend.mutual, " mutual friends"]
									}),
									friend.online ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "green",
										children: "Online now"
									}) : null
								]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Their XP",
						value: friend.xp,
						tone: "yellow",
						icon: "⚡"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Your XP",
						value: s.xp,
						tone: "green",
						icon: "⚡"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "You won",
						value: friend.h2h.wins,
						icon: "🏆"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "You lost",
						value: friend.h2h.losses,
						icon: "💫"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Head-to-head" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex justify-between text-[13px] font-black",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"You ",
							friend.h2h.wins,
							" — ",
							friend.h2h.losses,
							" ",
							friend.name.split(" ")[0]
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, { children: [Math.round(winRate * 100), "% win rate"] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						value: winRate,
						tone: winRate >= .5 ? "green" : "pink",
						label: "Head to head"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[15px] font-semibold text-ink2",
						children: winRate >= .5 ? "You have the edge — keep it by playing their strongest topic." : "They're ahead. Study their strong topics below, then rematch."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Their strongest topics" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: friend.topics.map((id) => {
						const t = topicById(id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BtnLink, {
							to: "/play/difficulty",
							search: {
								topic: id,
								count: 10
							},
							variant: "outline",
							size: "sm",
							children: [
								t.icon,
								" ",
								t.name
							]
						}, id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Btn, {
					size: "lg",
					full: true,
					onClick: () => navigate({
						to: "/challenge/setup",
						search: { opponent: friend.id }
					}),
					children: ["⚔️ Challenge ", friend.name.split(" ")[0]]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/leaderboard",
					variant: "outline",
					size: "lg",
					full: true,
					children: "🏆 Compare on leaderboard"
				})]
			})
		]
	});
}
//#endregion
export { FriendProfile as component };
