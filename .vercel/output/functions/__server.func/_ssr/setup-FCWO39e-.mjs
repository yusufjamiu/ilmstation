import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, g as Segmented, h as SectionTitle, i as Btn, n as Avatar, o as Card, p as Pill, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { d as useFlow, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById, t as TOPICS } from "./topics-_n1jadKH.mjs";
import { t as FRIENDS } from "./social-FuLE4Yer.mjs";
import { t as Route } from "./setup-HHSHsOV0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/setup-FCWO39e-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** P08 Challenge Setup */
function ChallengeSetup() {
	const { s } = useApp();
	const { setFlow } = useFlow();
	const navigate = useNavigate();
	const { opponent: preselect } = Route.useSearch();
	const [opponent, setOpponent] = (0, import_react.useState)(FRIENDS.some((f) => f.id === preselect) ? preselect : FRIENDS[0].id);
	const [topic, setTopic] = (0, import_react.useState)("hadith");
	const [rounds, setRounds] = (0, import_react.useState)(10);
	const friend = FRIENDS.find((f) => f.id === opponent);
	const shared = friend.topics;
	const send = () => {
		setFlow({ duel: {
			opponent,
			topic,
			rounds
		} });
		navigate({ to: "/challenge/waiting" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		back: {
			to: "/play",
			label: "Play"
		},
		title: "Set up a duel",
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "1 · Choose your opponent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: FRIENDS.map((f) => {
					const active = opponent === f.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setOpponent(f.id),
						className: "w-full",
						"aria-pressed": active,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `brutal-sm press-sm flex items-center gap-3 rounded-r12 px-3 py-2.5 text-left ${active ? "bg-yellow" : "bg-field"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
									emoji: f.avatar,
									size: 40,
									ring: f.online ? "green" : "none"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[15px] font-black",
										children: f.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
										className: "text-[11px] font-bold text-ink2",
										children: [
											"LVL ",
											f.level,
											" · 🔥 ",
											f.streak,
											" · H2H ",
											f.h2h.wins,
											"–",
											f.h2h.losses
										]
									})]
								}),
								f.online ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "green",
									children: "Online"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: "Async" })
							]
						})
					}) }, f.id);
				})
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "2 · Choose the topic" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-2 text-[13px] font-semibold text-ink2",
							children: [
								friend.name.split(" ")[0],
								" plays ",
								shared.map((t) => topicById(t).name).join(", "),
								" most."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
							children: TOPICS.filter((t) => !t.premium || s.premium).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setTopic(t.id),
								"aria-pressed": topic === t.id,
								className: `brutal-sm press-sm rounded-r12 p-2.5 text-center ${topic === t.id ? "bg-yellow" : "bg-field"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[24px]",
										"aria-hidden": true,
										children: t.icon
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[13px] font-black",
										children: t.name
									}),
									shared.includes(t.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
										className: "text-[10px] font-bold text-ink2",
										children: "shared"
									}) : null
								]
							}, t.id))
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "3 · Rounds" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
						value: String(rounds),
						onChange: (v) => setRounds(Number(v)),
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
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						tone: "yellow",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
									emoji: s.avatar,
									size: 44
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[20px] font-black",
									children: "vs"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
									emoji: friend.avatar,
									size: 44
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[15px] font-black",
										children: topicById(topic).name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
										size: "sm",
										children: topicById(topic).arabic
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
									tone: "ink",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: rounds }), " rounds"]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							variant: "ink",
							size: "lg",
							full: true,
							className: "mt-4",
							onClick: send,
							children: "Send challenge →"
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { ChallengeSetup as component };
