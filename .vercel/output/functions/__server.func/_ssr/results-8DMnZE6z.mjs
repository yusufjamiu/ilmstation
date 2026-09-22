import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Stat, a as BtnLink, f as Mono, h as SectionTitle, i as Btn, n as Avatar, o as Card, p as Pill, s as Confetti } from "./kit-ZBxajPhE.mjs";
import { d as useFlow, n as BADGES, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { t as FRIENDS } from "./social-FuLE4Yer.mjs";
import { t as BadgeUnlock } from "./BadgeUnlock-DexqAwUt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/results-8DMnZE6z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** P11 Duel Results */
function DuelResults() {
	const { flow } = useFlow();
	const { s, set, award, unlock } = useApp();
	const navigate = useNavigate();
	const r = flow.duelResult ?? {
		opponent: FRIENDS[0].id,
		topic: "hadith",
		rounds: 10,
		mine: 0,
		theirs: 0
	};
	const friend = FRIENDS.find((f) => f.id === r.opponent) ?? FRIENDS[0];
	const topic = topicById(r.topic);
	const won = r.mine > r.theirs;
	const draw = r.mine === r.theirs;
	const xp = won ? 60 + r.mine * 4 : draw ? 30 + r.mine * 2 : r.mine * 3;
	const [applied, setApplied] = (0, import_react.useState)(false);
	const [badge, setBadge] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (applied) return;
		setApplied(true);
		award(xp, "hikmah", `Duel vs ${friend.name.split(" ")[0]} — ${won ? "win" : draw ? "draw" : "loss"}`);
		set({
			duelWins: s.duelWins + (won ? 1 : 0),
			duelLosses: s.duelLosses + (!won && !draw ? 1 : 0)
		});
		if (won && s.duelWins + 1 >= 20 && unlock("insight")) setBadge("insight");
	}, [applied]);
	const h2hWins = friend.h2h.wins + (won ? 1 : 0);
	const h2hLosses = friend.h2h.losses + (!won && !draw ? 1 : 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: won ? "You won!" : draw ? "It's a draw" : "You lost this one",
		children: [
			won ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Confetti, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: won ? "green" : draw ? "field" : "pink",
				className: "rounded-r24 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[56px]",
						"aria-hidden": true,
						children: won ? "🏆" : draw ? "🤝" : "💪"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center justify-center gap-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
									emoji: s.avatar,
									size: 56,
									ring: "yellow"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
									className: "mt-1 block text-[28px] font-bold",
									children: r.mine
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[13px] font-black",
									children: "You"
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[20px] font-black",
								children: "vs"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
									emoji: friend.avatar,
									size: 56,
									ring: "green"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
									className: "mt-1 block text-[28px] font-bold",
									children: r.theirs
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[13px] font-black",
									children: friend.name.split(" ")[0]
								})
							] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap justify-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "ink",
								children: [
									"+",
									xp,
									" XP"
								]
							}),
							won ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "yellow",
								children: "Win bonus +50%"
							}) : null,
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
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: r.rounds }), " rounds"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-3 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Your wins",
						value: h2hWins,
						tone: "yellow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Their wins",
						value: h2hLosses
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Total duels",
						value: h2hWins + h2hLosses + (draw ? 1 : 0),
						tone: "field"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Head-to-head record" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: [
						"You lead ",
						friend.name,
						" ",
						h2hWins,
						"–",
						h2hLosses,
						" across ",
						topic.name,
						" and other topics. Your overall duel record is now",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "font-bold text-ink",
							children: [
								s.duelWins,
								"–",
								s.duelLosses
							]
						}),
						"."
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						size: "lg",
						full: true,
						onClick: () => navigate({ to: "/challenge/duel" }),
						children: "🔁 Rematch"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BtnLink, {
						to: "/friends/$friendId",
						params: { friendId: friend.id },
						variant: "outline",
						size: "lg",
						full: true,
						children: [
							"View ",
							friend.name.split(" ")[0],
							"'s profile"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/share",
						search: { kind: "score" },
						variant: "outline",
						size: "lg",
						children: "📤 Share"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeUnlock, {
				badge: badge ? BADGES.find((b) => b.id === badge) ?? null : null,
				onClose: () => setBadge(null)
			})
		]
	});
}
//#endregion
export { DuelResults as component };
