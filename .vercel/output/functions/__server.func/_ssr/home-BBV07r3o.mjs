import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, f as Mono, h as SectionTitle, o as Card, p as Pill, r as Bar, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { _ as BookOpen, a as Sparkles, g as Bot, i as Target, m as ChevronRight, n as Users, o as Play, r as Trophy, u as Flame } from "../_libs/lucide-react.mjs";
import { n as StreakModal, t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { t as QUESTS } from "./quests-BRY7yFVm.mjs";
import { n as WISDOM } from "./content-Df4kcoxg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home-BBV07r3o.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MODES = [
	{
		to: "/play/topics",
		icon: Target,
		name: "Quick quiz",
		note: "A focused five-minute round",
		tone: "bg-yellow"
	},
	{
		to: "/hifz",
		icon: BookOpen,
		name: "Hifz mode",
		note: "Continue memorisation",
		tone: "bg-green-l"
	},
	{
		to: "/challenge/setup",
		icon: Trophy,
		name: "Challenge",
		note: "Invite a friend to play",
		tone: "bg-pink-l"
	},
	{
		to: "/halaqah",
		icon: Users,
		name: "Halaqah",
		note: "Learn together in a room",
		tone: "bg-field"
	}
];
function HomeFeed() {
	const { s, level } = useApp();
	const [streakOpen, setStreakOpen] = (0, import_react.useState)(false);
	const first = (s.name || "Seeker").split(" ")[0];
	const wisdom = WISDOM[0];
	const quest = QUESTS.find((item) => (s.questStages[item.id] ?? 0) < 3) ?? QUESTS[0];
	const topic = topicById(quest.topic);
	const levelProgress = level.max === Infinity ? 1 : (s.xp - level.min) / (level.max - level.min + 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mono text-[11px] font-bold uppercase text-muted",
						children: [
							"Level ",
							level.level,
							" · ",
							level.name
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-2 text-[36px] leading-tight font-black sm:text-[44px]",
						children: ["Assalamu Alaykum, ", first]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[16px] text-ink2",
						children: "Here is a clear path for today’s learning."
					})
				] }), !s.ramadanDismissed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/ramadan",
					className: "flex items-center gap-3 rounded-r12 border border-border/25 bg-ink px-4 py-3 text-page transition-transform hover:-translate-y-0.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 19 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-[13px] font-bold",
							children: "Ramadan mode"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-[11px] opacity-70",
							children: "Today’s quest and tracker"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 17 })
					]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-3 gap-2 sm:gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/progress",
						className: "rounded-r12 border border-border/20 bg-surface p-3 transition-colors hover:bg-field sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono text-[10px] font-bold uppercase text-muted",
									children: "Total XP"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 18 })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-[20px] font-black sm:mt-5 sm:text-[30px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.xp.toLocaleString() })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 hidden text-[12px] font-bold text-green sm:block",
								children: "Keep building your level"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setStreakOpen(true),
						className: "rounded-r12 border border-border/20 bg-surface p-3 text-left transition-colors hover:bg-field sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono text-[10px] font-bold uppercase text-muted",
									children: "Current streak"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { size: 18 })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-[20px] font-black sm:mt-5 sm:text-[30px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.streak }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1 text-[12px] sm:text-[22px]",
									children: "days"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 hidden text-[12px] font-bold text-pink sm:block",
								children: "One activity keeps it alive"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/leaderboard",
						className: "rounded-r12 border border-border/20 bg-surface p-3 transition-colors hover:bg-field sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono text-[10px] font-bold uppercase text-muted",
									children: "Learning record"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { size: 18 })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-[20px] font-black sm:mt-5 sm:text-[30px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.quizzesPlayed }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1 text-[12px] sm:text-[22px]",
									children: "played"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 hidden text-[12px] font-bold text-ink2 sm:block",
								children: [s.badges.length, " badges earned"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
							action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/quests",
								className: "text-[13px] font-bold text-ink2 hover:text-ink",
								children: "View quest map"
							}),
							children: "Today’s focus"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							tone: "yellow",
							className: "brutal p-6 sm:p-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-7 md:grid-cols-[1fr_auto] md:items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "surface",
										children: "Daily quest · +80 XP"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-4 text-[28px] leading-tight font-black sm:text-[34px]",
										children: quest.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
										size: "lg",
										className: "mt-1 text-left",
										children: quest.arabic
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-4 max-w-xl text-[14px] leading-relaxed text-ink2",
										children: [
											"A ten-question session on ",
											topic.name.toLowerCase(),
											", designed to fit into five focused minutes."
										]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-20 w-20 place-items-center rounded-r16 border border-border/30 bg-surface/70",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { size: 34 })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-7 flex flex-col gap-2 sm:flex-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BtnLink, {
									to: "/play/lobby",
									search: {
										topic: quest.topic,
										count: 10,
										difficulty: s.difficulty,
										quest: quest.id
									},
									variant: "ink",
									size: "lg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
										size: 17,
										fill: "currentColor"
									}), " Start quest"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
									to: "/home/quest",
									variant: "outline",
									size: "lg",
									children: "View details"
								})]
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
							action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/play",
								className: "text-[13px] font-bold text-ink2 hover:text-ink",
								children: "All modes"
							}),
							children: "Choose another activity"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: MODES.map((mode) => {
								const Icon = mode.icon;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: mode.to,
									className: "group flex items-center gap-4 rounded-r12 border border-border/25 bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--border)]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `grid h-12 w-12 shrink-0 place-items-center rounded-r8 ${mode.tone}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 22 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block text-[15px] font-black",
												children: mode.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-0.5 block text-[12px] text-muted",
												children: mode.note
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
											size: 17,
											className: "text-muted group-hover:text-ink"
										})
									]
								}, mode.to);
							})
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
							action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/wisdom",
								className: "text-[13px] font-bold text-ink2 hover:text-ink",
								children: "Open archive"
							}),
							children: "Daily wisdom"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/wisdom",
							className: "block rounded-r16 border border-border/25 bg-green-l p-6 transition-colors hover:bg-green-l/70 sm:p-7",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { size: 17 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "mono text-[10px] font-bold uppercase",
										children: [wisdom.kind, " of the day"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
									size: "lg",
									className: "mt-5 text-left",
									children: wisdom.arabic
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 max-w-2xl text-[16px] font-bold leading-relaxed",
									children: [
										"“",
										wisdom.translation,
										"”"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mono mt-4 text-[10px] font-bold uppercase text-ink2",
									children: wisdom.source
								})
							]
						})] })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Your progress" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[28px] font-black",
									children: ["Level ", level.level]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[13px] text-ink2",
									children: level.name
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
									className: "text-[12px] font-bold text-muted",
									children: [Math.round(levelProgress * 100), "%"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								value: levelProgress,
								className: "mt-4"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 border-t border-border/15 pt-4 text-[12px] leading-relaxed text-ink2",
								children: ["Next unlock: ", level.unlocks]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							tone: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
								action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/leaderboard",
									className: "text-[12px] font-bold text-ink2",
									children: "View all"
								}),
								children: "Quest leaders"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "space-y-1",
								children: [
									{
										n: "Maryam Diallo",
										a: "MD",
										xp: 4100
									},
									{
										n: "Hassan Yusuf",
										a: "HY",
										xp: 2380
									},
									{
										n: "Amina Bello",
										a: "AB",
										xp: 1420
									}
								].map((friend, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-3 rounded-r8 px-2 py-2.5 hover:bg-surface",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
											className: "w-5 text-[11px] font-bold text-muted",
											children: ["0", index + 1]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid h-9 w-9 place-items-center rounded-rf bg-surface text-[10px] font-black",
											children: friend.a
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "min-w-0 flex-1 text-[13px] font-bold",
											children: friend.n
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
											className: "text-[11px] font-bold text-ink2",
											children: friend.xp
										})
									]
								}, friend.n))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/ilmbot",
							className: "flex items-center gap-4 rounded-r12 border border-border/25 bg-pink-l p-5 transition-transform hover:-translate-y-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-11 w-11 place-items-center rounded-r8 bg-surface",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { size: 22 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[15px] font-black",
										children: "Ask IlmBot"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[12px] text-ink2",
										children: "Explore a question with sources"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 17 })
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreakModal, {
				open: streakOpen,
				onClose: () => setStreakOpen(false)
			})
		]
	});
}
//#endregion
export { HomeFeed as component };
