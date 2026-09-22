import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, c as Empty, f as Mono, g as Segmented, h as SectionTitle, i as Btn, n as Avatar, o as Card, p as Pill, u as Input } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { i as SUGGESTED, r as PENDING_REQUESTS, t as FRIENDS } from "./social-FuLE4Yer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/friends-IEZycSrm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S04 Friends List · S05 Find Friends */
function Friends() {
	const { pushNotif } = useApp();
	const navigate = useNavigate();
	const [tab, setTab] = (0, import_react.useState)("friends");
	const [query, setQuery] = (0, import_react.useState)("");
	const [added, setAdded] = (0, import_react.useState)([]);
	const [handled, setHandled] = (0, import_react.useState)({});
	const [copied, setCopied] = (0, import_react.useState)(false);
	const list = FRIENDS.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()) || f.username.toLowerCase().includes(query.toLowerCase()));
	const invite = async () => {
		try {
			await navigator.clipboard.writeText("https://ilmstation.com/invite/seeker");
			setCopied(true);
			setTimeout(() => setCopied(false), 2e3);
		} catch {
			setCopied(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Friends",
		subtitle: "Challenge, compare and encourage each other.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
				value: tab,
				onChange: setTab,
				options: [
					{
						value: "friends",
						label: `Friends (${FRIENDS.length})`
					},
					{
						value: "requests",
						label: `Requests (${PENDING_REQUESTS.length})`
					},
					{
						value: "find",
						label: "Find people"
					}
				]
			}),
			tab === "friends" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search your friends…",
					"aria-label": "Search friends"
				})
			}), list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
					icon: "🔍",
					title: "No friends match that",
					body: "Try another name, or switch to Find people to add someone new.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						onClick: () => setTab("find"),
						children: "Find people"
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: list.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "rounded-r16",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
							emoji: f.avatar,
							size: 52,
							ring: f.online ? "green" : "none"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[18px] font-black",
									children: f.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
									className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
									children: [
										f.username,
										" · Level ",
										f.level,
										" · 🔥 ",
										f.streak
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex flex-wrap gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: "field",
										children: ["H2H ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, { children: [
											f.h2h.wins,
											"–",
											f.h2h.losses
										] })]
									}), f.online ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "green",
										children: "Online"
									}) : null]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							size: "sm",
							onClick: () => navigate({
								to: "/challenge/setup",
								search: { opponent: f.id }
							}),
							children: "⚔️ Challenge"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/friends/$friendId",
							params: { friendId: f.id },
							variant: "outline",
							size: "sm",
							children: "View profile"
						})]
					})]
				}, f.id))
			})] }) : null,
			tab === "requests" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-3",
				children: [PENDING_REQUESTS.map((r) => {
					const state = handled[r.id];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						className: "rounded-r16",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
									emoji: r.avatar,
									size: 48
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[18px] font-black",
										children: r.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
										className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
										children: [
											r.username,
											" · ",
											r.mutual,
											" mutual friends"
										]
									})]
								}),
								state ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: state === "accepted" ? "green" : "field",
									children: state === "accepted" ? "Accepted ✓" : "Declined"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
										size: "sm",
										onClick: () => {
											setHandled((h) => ({
												...h,
												[r.id]: "accepted"
											}));
											pushNotif({
												icon: "🤝",
												title: `${r.name} is now your friend`,
												body: "Challenge them to a duel to start your head-to-head record.",
												action: "friends"
											});
										},
										children: "Accept"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
										variant: "outline",
										size: "sm",
										onClick: () => setHandled((h) => ({
											...h,
											[r.id]: "declined"
										})),
										children: "Decline"
									})]
								})
							]
						})
					}, r.id);
				}), PENDING_REQUESTS.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
					icon: "📭",
					title: "No pending requests",
					body: "You're all caught up."
				}) : null]
			}) : null,
			tab === "find" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						tone: "yellow",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Invite by link" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[15px] font-semibold",
								children: "Share your invite link. When a friend joins and finishes their first quiz, you both earn 50 XP — and it counts towards the Beacon of Hidayah badge."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									variant: "ink",
									onClick: invite,
									children: copied ? "✓ Link copied" : "🔗 Copy invite link"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
									to: "/share",
									search: { kind: "invite" },
									variant: "outline",
									children: "📤 Share card"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search by name or @username…",
						"aria-label": "Search people"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 md:grid-cols-2",
						children: SUGGESTED.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.username.toLowerCase().includes(query.toLowerCase())).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							className: "rounded-r16",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
										emoji: p.avatar,
										size: 48
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[18px] font-black",
											children: p.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
											className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
											children: [
												p.username,
												" · shares ",
												p.shared
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
										size: "sm",
										variant: added.includes(p.id) ? "green" : "primary",
										onClick: () => setAdded((a) => [...a, p.id]),
										disabled: added.includes(p.id),
										children: added.includes(p.id) ? "Requested ✓" : "Add friend"
									})
								]
							})
						}, p.id))
					})
				]
			}) : null
		]
	});
}
//#endregion
export { Friends as component };
