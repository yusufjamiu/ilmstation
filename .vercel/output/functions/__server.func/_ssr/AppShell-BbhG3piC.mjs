import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as Modal, f as Mono, i as Btn, n as Avatar, r as Bar, y as cn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { _ as BookOpen, a as Sparkles, c as Library, d as Ellipsis, f as Compass, g as Bot, h as ChevronLeft, i as Target, l as House, m as ChevronRight, p as CircleUserRound, r as Trophy, s as Menu, t as X, u as Flame, v as Bell } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppShell-BbhG3piC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DAYS = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
];
function StreakModal({ open, onClose }) {
	const { s, set, spend } = useApp();
	const today = 5;
	const buyFreeze = () => {
		if (spend(100, "Streak Freeze")) set({ freezes: s.freezes + 1 });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		open,
		onClose,
		title: `🔥 ${s.streak}-day streak`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[15px] font-bold text-ink2",
				children: "Don't break the chain. One activity a day keeps it alive."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid grid-cols-7 gap-1.5",
				children: DAYS.map((d, i) => {
					const done = s.streakWeek[i];
					const isToday = i === today;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 text-[10px] font-black tracking-wide text-ink2 uppercase",
							children: d
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `brutal-sm grid aspect-square place-items-center rounded-r8 text-[16px] ${done ? "bg-green text-surface" : isToday ? "bg-yellow" : "bg-field text-muted"}`,
							children: done ? "✓" : isToday ? "•" : "✗"
						})]
					}, d);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "brutal-sm mt-4 flex items-center justify-between rounded-r12 bg-field px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[15px] font-black",
					children: "🧊 Streak Freeze"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[13px] text-ink2",
					children: [
						"You own ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.freezes }),
						" · protects one missed day"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					size: "sm",
					onClick: buyFreeze,
					children: "Buy · 100 pts"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				full: true,
				className: "mt-4",
				onClick: onClose,
				children: "Keep the chain going"
			})
		]
	});
}
var NAV = [
	{
		to: "/home",
		label: "Overview",
		icon: House
	},
	{
		to: "/play",
		label: "Play",
		icon: Target
	},
	{
		to: "/quests",
		label: "My quests",
		icon: Compass
	},
	{
		to: "/library",
		label: "Library",
		icon: Library
	},
	{
		to: "/ilmbot",
		label: "IlmBot",
		icon: Bot
	},
	{
		to: "/leaderboard",
		label: "Leaderboard",
		icon: Trophy
	},
	{
		to: "/profile",
		label: "Profile",
		icon: CircleUserRound
	}
];
var MORE = [
	{
		to: "/hifz",
		label: "Hifz Mode",
		icon: BookOpen
	},
	{
		to: "/halaqah",
		label: "Halaqah",
		icon: CircleUserRound
	},
	{
		to: "/challenge/setup",
		label: "Challenge",
		icon: Target
	},
	{
		to: "/progress",
		label: "My Progress",
		icon: Trophy
	},
	{
		to: "/achievements",
		label: "Achievements",
		icon: Sparkles
	},
	{
		to: "/wallet",
		label: "Points Wallet",
		icon: CircleUserRound
	},
	{
		to: "/store",
		label: "Points Store",
		icon: Compass
	},
	{
		to: "/wisdom",
		label: "Daily Wisdom",
		icon: BookOpen
	},
	{
		to: "/bookmarks",
		label: "Bookmarks",
		icon: Library
	},
	{
		to: "/friends",
		label: "Friends",
		icon: CircleUserRound
	},
	{
		to: "/ramadan",
		label: "Ramadan Mode",
		icon: Sparkles
	},
	{
		to: "/share",
		label: "Share Cards",
		icon: Ellipsis
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Ellipsis
	}
];
function NavLink({ to, label, icon: Icon, collapsed, path }) {
	const active = path === to || path.startsWith(to + "/");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		title: collapsed ? label : void 0,
		className: cn("flex min-h-11 items-center gap-3 rounded-r8 px-3 text-[14px] font-bold transition-colors", active ? "bg-yellow text-ink" : "text-ink2 hover:bg-field hover:text-ink", collapsed && "justify-center px-0"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			size: 19,
			strokeWidth: active ? 2.5 : 2
		}), !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }) : null]
	});
}
function AppShell({ children, title, subtitle, back, wide }) {
	const { s, level, totalPoints } = useApp();
	const path = useRouterState({ select: (st) => st.location.pathname });
	const [streakOpen, setStreakOpen] = (0, import_react.useState)(false);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [collapsed, setCollapsed] = (0, import_react.useState)(false);
	const unread = s.notifs.filter((n) => n.unread).length;
	level.max === Infinity || (s.xp - level.min) / (level.max - level.min + 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-page lg:flex",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/25 bg-surface px-4 py-6 transition-[width] duration-200 lg:flex", collapsed ? "w-[76px]" : "w-[248px]"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("flex items-center", collapsed ? "justify-center" : "justify-between"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/home",
							className: "flex items-center gap-2.5 font-black",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "brutal-sm grid h-10 w-10 shrink-0 place-items-center rounded-r8 bg-yellow",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
									size: 19,
									strokeWidth: 2.5
								})
							}), !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[19px]",
								children: "IlmStation"
							}) : null]
						}), !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							variant: "ghost",
							size: "sm",
							className: "h-9 min-h-0 w-9 p-0",
							onClick: () => setCollapsed(true),
							"aria-label": "Collapse navigation",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 17 })
						}) : null]
					}),
					collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "ghost",
						size: "sm",
						className: "mx-auto mt-3 h-9 min-h-0 w-9 p-0",
						onClick: () => setCollapsed(false),
						"aria-label": "Expand navigation",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 17 })
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "mt-10 space-y-1",
						"aria-label": "Main",
						children: [NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
							...item,
							collapsed,
							path
						}, item.to)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Btn, {
							variant: "ghost",
							full: true,
							className: cn("justify-start border-transparent px-3 font-bold shadow-none", collapsed && "px-0"),
							onClick: () => setMenuOpen(true),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 19 }),
								" ",
								!collapsed ? "More" : null
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-auto",
						children: !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setStreakOpen(true),
							className: "w-full rounded-r12 border border-border/30 bg-green-l p-4 text-left transition-colors hover:bg-green-l/70",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mono text-[10px] font-bold uppercase text-ink2",
										children: "Current streak"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { size: 17 })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 text-[22px] font-black",
									children: [s.streak, " days"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									value: Math.min(1, s.streak / 14),
									className: "mt-3",
									tone: "green",
									label: "Streak milestone"
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							variant: "ghost",
							className: "mx-auto w-11 px-0",
							onClick: () => setStreakOpen(true),
							"aria-label": `${s.streak} day streak`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { size: 19 })
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "sticky top-0 z-30 border-b border-border/20 bg-surface/95 backdrop-blur-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto flex h-[72px] max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:px-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/home",
								className: "flex items-center gap-2 font-black lg:hidden",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "brutal-sm grid h-9 w-9 place-items-center rounded-r8 bg-yellow",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 17 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:block",
									children: "IlmStation"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden lg:block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[15px] font-black",
									children: title ?? "Student dashboard"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[12px] text-muted",
									children: [
										"Level ",
										level.level,
										" · ",
										level.name
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ml-auto flex items-center gap-2 sm:gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/wallet",
										className: "hidden rounded-r8 bg-field px-3 py-2 text-[12px] font-bold sm:block",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: totalPoints }), " pts"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/notifications",
										className: "relative grid h-10 w-10 place-items-center rounded-r8 border border-border/20 hover:bg-field",
										"aria-label": `Notifications${unread ? `, ${unread} unread` : ""}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 19 }), unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-1.5 top-1.5 h-2 w-2 rounded-rf bg-pink" }) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/profile",
										className: "flex items-center gap-3 border-l border-border/20 pl-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "hidden text-right md:block",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block text-[13px] font-bold",
												children: s.name || "Seeker"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "block text-[11px] text-muted",
												children: [s.xp, " XP"]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
											emoji: s.avatar,
											size: 38,
											ring: "green"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
										variant: "ghost",
										className: "h-10 min-h-0 w-10 p-0 lg:hidden",
										onClick: () => setMenuOpen(true),
										"aria-label": "Open menu",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { size: 20 })
									})
								]
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: cn("mx-auto px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-12", wide ? "max-w-[1500px]" : "max-w-4xl"),
					children: [title || back ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-7",
						children: [
							back ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: back.to,
								className: "mb-3 inline-flex items-center gap-2 text-[13px] font-bold text-ink2 hover:text-ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 16 }), back.label ?? "Back"]
							}) : null,
							title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-[34px] leading-tight font-black",
								children: title
							}) : null,
							subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-2xl text-[15px] leading-relaxed text-ink2",
								children: subtitle
							}) : null
						]
					}) : null, children]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 flex border-t border-border/25 bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden",
				"aria-label": "Primary",
				children: NAV.slice(0, 5).map((item) => {
					const active = path === item.to || path.startsWith(item.to + "/");
					const Icon = item.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold", active ? "text-ink" : "text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("grid h-7 w-9 place-items-center rounded-rf", active && "bg-yellow"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								size: 18,
								strokeWidth: active ? 2.5 : 2
							})
						}), item.label === "My quests" ? "Quests" : item.label]
					}, item.to);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreakModal, {
				open: streakOpen,
				onClose: () => setStreakOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				open: menuOpen,
				onClose: () => setMenuOpen(false),
				title: "Explore IlmStation",
				wide: true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
					children: [...NAV, ...MORE].map((item) => {
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							onClick: () => setMenuOpen(false),
							className: "flex min-h-12 items-center gap-3 rounded-r8 border border-border/20 bg-field px-3 py-3 text-[14px] font-bold hover:bg-yellow",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 }),
								" ",
								item.label
							]
						}, item.to);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Btn, {
					variant: "outline",
					full: true,
					className: "mt-4",
					onClick: () => setMenuOpen(false),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 17 }), " Close"]
				})]
			})
		]
	});
}
//#endregion
export { StreakModal as n, AppShell as t };
