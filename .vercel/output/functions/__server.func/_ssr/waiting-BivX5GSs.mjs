import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, i as Btn, n as Avatar, o as Card, p as Pill, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { d as useFlow, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { t as FRIENDS } from "./social-FuLE4Yer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/waiting-BivX5GSs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** P09 Waiting Room */
function WaitingRoom() {
	const { flow } = useFlow();
	const { s } = useApp();
	const navigate = useNavigate();
	const duel = flow.duel ?? {
		opponent: FRIENDS[0].id,
		topic: "hadith",
		rounds: 10
	};
	const friend = FRIENDS.find((f) => f.id === duel.opponent) ?? FRIENDS[0];
	const topic = topicById(duel.topic);
	const [seconds, setSeconds] = (0, import_react.useState)(86358);
	const [accepted, setAccepted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = setInterval(() => setSeconds((x) => Math.max(0, x - 1)), 1e3);
		return () => clearInterval(t);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!friend.online) return;
		const t = setTimeout(() => setAccepted(true), 3200);
		return () => clearTimeout(t);
	}, [friend.online]);
	const hh = Math.floor(seconds / 3600);
	const mm = Math.floor(seconds % 3600 / 60);
	const ss = seconds % 60;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/challenge/setup",
			label: "Challenge setup"
		},
		title: "Invite sent",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: accepted ? "green" : "field",
				className: "rounded-r24 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-center gap-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: s.avatar,
								size: 64,
								ring: "yellow"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-[13px] font-black",
								children: "You"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[28px] font-black",
								children: "⚔️"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: friend.avatar,
								size: 64,
								ring: accepted ? "green" : "none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-[13px] font-black",
								children: friend.name.split(" ")[0]
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-4 text-[24px] leading-tight font-black",
						children: accepted ? `${friend.name.split(" ")[0]} accepted!` : "Waiting for acceptance…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[15px] font-semibold text-ink2",
						children: accepted ? "Both of you are online — this duel runs live." : friend.online ? "They're online, so this should be quick." : "They're offline. The invite stays open for 24 hours."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "brutal-sm mt-4 inline-flex items-center gap-2 rounded-rf bg-surface px-4 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "text-[20px] font-bold",
							children: [
								String(hh).padStart(2, "0"),
								":",
								String(mm).padStart(2, "0"),
								":",
								String(ss).padStart(2, "0")
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-black uppercase",
							children: "until expiry"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[36px]",
							"aria-hidden": true,
							children: topic.icon
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[20px] font-black",
								children: topic.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
								size: "md",
								children: topic.arabic
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: duel.rounds }), " rounds"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "yellow",
									children: "Winner +50% XP"
								})
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					size: "lg",
					full: true,
					disabled: !accepted,
					onClick: () => navigate({ to: "/challenge/duel" }),
					children: accepted ? "Start the duel →" : "Waiting for opponent…"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					variant: "outline",
					size: "lg",
					onClick: () => navigate({ to: "/play" }),
					children: "Cancel invite"
				})]
			})
		]
	});
}
//#endregion
export { WaitingRoom as component };
