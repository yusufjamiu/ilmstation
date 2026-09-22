import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Stat, a as BtnLink, d as Modal, f as Mono, h as SectionTitle, i as Btn, l as Field, n as Avatar, o as Card, p as Pill, r as Bar, t as Arabic, u as Input, y as cn } from "./kit-ZBxajPhE.mjs";
import { n as BADGES, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById, t as TOPICS } from "./topics-_n1jadKH.mjs";
import { t as FRIENDS } from "./social-FuLE4Yer.mjs";
import { t as QUESTS } from "./quests-BRY7yFVm.mjs";
import { t as AVATARS } from "./onboarding-B7CWioSf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-CnOL3OIv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S01 My Profile · S01b Edit Profile */
function Profile() {
	const { s, set, level, totalPoints } = useApp();
	const navigate = useNavigate();
	const [edit, setEdit] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)(s.name);
	const [username, setUsername] = (0, import_react.useState)(s.username);
	const [avatar, setAvatar] = (0, import_react.useState)(s.avatar);
	const earned = BADGES.filter((b) => s.badges.includes(b.id));
	const questsDone = QUESTS.filter((q) => (s.questStages[q.id] ?? 0) >= 3).length;
	const inLevel = level.max === Infinity ? 1 : (s.xp - level.min) / (level.max - level.min + 1);
	const interests = s.interests.length ? s.interests : TOPICS.slice(0, 3).map((t) => t.id);
	const save = () => {
		set({
			name,
			username: username.startsWith("@") ? username : `@${username}`,
			avatar
		});
		setEdit(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "My Profile",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "rounded-r24",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
							emoji: s.avatar,
							size: 84,
							ring: "green"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-[28px] leading-tight font-black",
									children: s.name || "Seeker"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
									className: "text-[13px] font-bold text-ink2",
									children: s.username || "@seeker"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex flex-wrap gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
											tone: "ink",
											children: [
												"Level ",
												level.level,
												" · ",
												level.name
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
											tone: "surface",
											children: [
												"🔥 ",
												s.streak,
												" day streak"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
											tone: "surface",
											children: s.premium ? "⚡ Premium" : "Free plan"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
									size: "md",
									className: "mt-1",
									children: level.arabic
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "ink",
								onClick: () => setEdit(true),
								children: "✏️ Edit profile"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/settings",
								variant: "outline",
								children: "⚙️ Settings"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 flex justify-between text-[13px] font-black",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Progress to next level" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, { children: [
								s.xp,
								" / ",
								level.max === Infinity ? "∞" : level.max,
								" XP"
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							value: inLevel,
							tone: "green",
							label: "Level progress"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-[13px] font-semibold text-ink2",
							children: ["Unlocks: ", level.unlocks]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Total XP",
						value: s.xp,
						tone: "yellow",
						icon: "⚡"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Points",
						value: totalPoints,
						tone: "green",
						icon: "🪙"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Quizzes",
						value: s.quizzesPlayed,
						icon: "🎯"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Duels won",
						value: s.duelWins,
						icon: "⚔️"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, {
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/achievements",
						variant: "outline",
						size: "sm",
						children: "See all"
					}),
					children: [
						"Badges (",
						earned.length,
						"/",
						BADGES.length,
						")"
					]
				}), earned.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: "No badges yet — finish a quest or hit a streak milestone to earn your first."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-3",
					children: earned.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "brutal-sm rounded-r12 bg-field p-3 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[28px]",
							"aria-hidden": true,
							children: b.icon
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 max-w-24 text-[11px] font-black",
							children: b.name
						})]
					}, b.id))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Favourite topics" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: interests.map((id) => {
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
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Quests completed",
								value: `${questsDone}/${QUESTS.length}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Articles read",
								value: s.articlesRead
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Hifz sessions",
								value: s.hifzSessions
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Sadaqah points",
								value: s.donated
							})
						]
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, {
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/friends",
						variant: "outline",
						size: "sm",
						children: "Manage"
					}),
					children: [
						"Friends (",
						FRIENDS.length,
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "no-scrollbar flex gap-3 overflow-x-auto pb-1",
					children: FRIENDS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "press-sm shrink-0 text-center",
						onClick: () => navigate({
							to: "/friends/$friendId",
							params: { friendId: f.id }
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
							emoji: f.avatar,
							size: 52,
							ring: f.online ? "green" : "none"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 max-w-16 truncate text-[11px] font-black",
							children: f.name.split(" ")[0]
						})]
					}, f.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/progress",
						size: "lg",
						full: true,
						children: "📈 My progress"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/share",
						search: { kind: "progress" },
						variant: "outline",
						size: "lg",
						full: true,
						children: "📤 Share profile card"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/wallet",
						variant: "outline",
						size: "lg",
						full: true,
						children: "💰 Wallet"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
				open: edit,
				onClose: () => setEdit(false),
				title: "Edit profile",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Display name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: name,
								onChange: (e) => setName(e.target.value),
								placeholder: "Your name"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Username",
							hint: "Friends find you with this handle.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: username,
								onChange: (e) => setUsername(e.target.value),
								placeholder: "@username"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
							children: "Avatar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: AVATARS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setAvatar(a),
								"aria-pressed": avatar === a,
								className: cn("brutal-sm press-sm grid h-12 w-12 place-items-center rounded-rf text-[22px]", avatar === a ? "bg-yellow" : "bg-field"),
								children: a
							}, a))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 pt-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								full: true,
								onClick: save,
								children: "Save changes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "outline",
								full: true,
								onClick: () => setEdit(false),
								children: "Cancel"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { Profile as component };
