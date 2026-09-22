import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, g as Segmented, h as SectionTitle, i as Btn, n as Avatar, o as Card, p as Pill, u as Input } from "./kit-ZBxajPhE.mjs";
import { d as useFlow, i as HALAQAH_BOTS, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { t as TOPICS } from "./topics-_n1jadKH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/halaqah-C-6bF3Dq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function makeCode() {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	return `IQ-${Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 32)]).join("")}`;
}
/** FM01 Create Room */
function CreateRoom() {
	const { s } = useApp();
	const { setFlow } = useFlow();
	const navigate = useNavigate();
	const [code, setCode] = (0, import_react.useState)("IQ-7F2K");
	const [topic, setTopic] = (0, import_react.useState)("seerah");
	const [rounds, setRounds] = (0, import_react.useState)(5);
	const [limit, setLimit] = (0, import_react.useState)(20);
	const [joined, setJoined] = (0, import_react.useState)([]);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [joinCode, setJoinCode] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => setCode(makeCode()), []);
	(0, import_react.useEffect)(() => {
		if (joined.length >= 5) return;
		const t = setTimeout(() => setJoined((j) => [...j, HALAQAH_BOTS[j.length].id]), 1800);
		return () => clearTimeout(t);
	}, [joined]);
	const players = HALAQAH_BOTS.filter((b) => joined.includes(b.id));
	const start = () => {
		setFlow({ room: {
			code,
			topic,
			rounds,
			limit,
			players: players.map((p) => p.id)
		} });
		navigate({ to: "/halaqah/game" });
	};
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2e3);
		} catch {
			setCopied(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Halaqah room",
		subtitle: "Live quiz for up to 6 players in the same circle.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					tone: "yellow",
					className: "rounded-r20",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Your room code" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "brutal rounded-r16 bg-surface py-6 text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[36px] font-bold ",
								children: code
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									variant: "ink",
									size: "sm",
									onClick: copy,
									children: copied ? "✓ Copied" : "🔗 Copy code"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									variant: "outline",
									size: "sm",
									onClick: () => setCode(makeCode()),
									children: "🔄 New code"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									variant: "outline",
									size: "sm",
									children: "▣ Show QR"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-[13px] font-semibold",
							children: [
								"Hosting requires Premium — joining is always free.",
								" ",
								s.premium ? "You're on Premium." : "You're hosting on a trial room."
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Topic" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-4 gap-2",
						children: TOPICS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setTopic(t.id),
							"aria-pressed": topic === t.id,
							className: `brutal-sm press-sm rounded-r12 p-2 text-center ${topic === t.id ? "bg-yellow" : "bg-field"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[20px]",
								"aria-hidden": true,
								children: t.icon
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-black",
								children: t.name
							})]
						}, t.id))
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Rounds" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: String(rounds),
							onChange: (v) => setRounds(Number(v)),
							options: [
								{
									value: "5",
									label: "5"
								},
								{
									value: "10",
									label: "10"
								},
								{
									value: "15",
									label: "15"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
								children: "Seconds per question"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: String(limit),
								onChange: (v) => setLimit(Number(v)),
								options: [
									{
										value: "10",
										label: "10s"
									},
									{
										value: "20",
										label: "20s"
									},
									{
										value: "30",
										label: "30s"
									}
								]
							})]
						})
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
						className: "text-[13px] font-bold text-ink2",
						children: [players.length + 1, " / 6 joined"]
					}),
					children: "Players"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: s.avatar,
								size: 52,
								ring: "yellow"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-[13px] font-black",
								children: "You (host)"
							})]
						}),
						players.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "anim-pop text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: p.avatar,
								size: 52,
								ring: "green"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-[13px] font-black",
								children: p.name
							})]
						}, p.id)),
						Array.from({ length: Math.max(0, 5 - players.length) }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center opacity-45",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "brutal-sm grid h-13 w-13 place-items-center rounded-rf bg-field text-[20px]",
								children: "⋯"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-[13px] font-black",
								children: "Waiting"
							})]
						}, i))
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					size: "lg",
					full: true,
					disabled: players.length === 0,
					onClick: start,
					children: "Start the game →"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: joinCode,
						onChange: (e) => setJoinCode(e.target.value.toUpperCase()),
						placeholder: "IQ-XXXX",
						"aria-label": "Join a room by code",
						className: "w-36"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "outline",
						size: "lg",
						disabled: joinCode.length < 4,
						onClick: start,
						children: "Join"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: "field",
					children: "Host controls the pace · questions are timed for everyone at once"
				})
			})
		]
	});
}
//#endregion
export { CreateRoom as component };
