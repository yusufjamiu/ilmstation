import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, f as Mono, g as Segmented, h as SectionTitle, i as Btn, o as Card, p as Pill, y as cn } from "./kit-ZBxajPhE.mjs";
import { n as BADGES, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as WISDOM } from "./content-Df4kcoxg.mjs";
import { t as Route } from "./share-BVo0JkHL.mjs";
import { n as SHARE_THEMES } from "./economy-DbzQDcwR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/share-DkmGxwwJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** SH01 Share Card Builder · SH02 Card Preview */
function ShareCards() {
	const { kind: initial } = Route.useSearch();
	const { s, level, totalPoints } = useApp();
	const [kind, setKind] = (0, import_react.useState)(initial ?? "progress");
	const [theme, setTheme] = (0, import_react.useState)(SHARE_THEMES[0].id);
	const [showArabic, setShowArabic] = (0, import_react.useState)(true);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const t = SHARE_THEMES.find((x) => x.id === theme) ?? SHARE_THEMES[0];
	const badge = BADGES.find((b) => s.badges.includes(b.id)) ?? BADGES[1];
	const wisdom = WISDOM[0];
	const card = {
		progress: {
			title: `${s.xp} XP earned`,
			arabic: level.arabic,
			lines: [
				`Level ${level.level} · ${level.name}`,
				`${s.streak}-day streak · ${totalPoints} points`,
				`${s.quizzesPlayed} quizzes completed`
			],
			caption: "My IlmStation progress this week"
		},
		badge: {
			title: `${badge.icon} ${badge.name}`,
			arabic: badge.arabic,
			lines: [
				badge.description,
				`+${badge.xp} XP`,
				badge.condition
			],
			caption: "New badge unlocked on IlmStation"
		},
		rank: {
			title: "Top 3 this week",
			arabic: "الْمُتَصَدِّرُون",
			lines: [
				`${s.xp} XP total`,
				`Level ${level.level}`,
				`🔥 ${s.streak}-day streak`
			],
			caption: "My weekly leaderboard rank"
		},
		wisdom: {
			title: wisdom.translation,
			arabic: wisdom.arabic,
			lines: [wisdom.translit, `📖 ${wisdom.source}`],
			caption: "Today's wisdom from IlmStation"
		},
		invite: {
			title: "Learn your Deen with me",
			arabic: "طَلَبُ الْعِلْم",
			lines: [
				"Join IlmStation free",
				"We both get 50 XP",
				"ilmstation.com/invite/seeker"
			],
			caption: "Come learn with me on IlmStation"
		},
		quest: {
			title: "Quest complete",
			arabic: "أَتْمَمْتُ الرِّحْلَة",
			lines: [
				`Level ${level.level} · ${level.name}`,
				`${s.xp} XP`,
				"3 / 3 stages"
			],
			caption: "Another quest finished on IlmStation"
		}
	}[kind];
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(`${card.caption} — ${card.lines.join(" · ")}`);
			setCopied(true);
			setTimeout(() => setCopied(false), 2e3);
		} catch {
			setCopied(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Share cards",
		subtitle: "Build a card, pick a theme, share it.",
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-5 lg:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Card type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
					children: [
						{
							id: "progress",
							label: "📈 Progress"
						},
						{
							id: "badge",
							label: "🏅 Badge"
						},
						{
							id: "rank",
							label: "🏆 Rank"
						},
						{
							id: "wisdom",
							label: "☪️ Wisdom"
						},
						{
							id: "quest",
							label: "🗺️ Quest"
						},
						{
							id: "invite",
							label: "🤝 Invite"
						}
					].map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setKind(o.id),
						"aria-pressed": kind === o.id,
						className: cn("brutal-sm press-sm rounded-r12 px-3 py-2.5 text-[15px] font-black", kind === o.id ? "bg-yellow" : "bg-field"),
						children: o.label
					}, o.id))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "mt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Theme" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: SHARE_THEMES.map((th) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setTheme(th.id),
								"aria-pressed": theme === th.id,
								className: cn("brutal-sm press-sm flex items-center gap-2 rounded-rf px-3 py-2 text-[13px] font-black", theme === th.id ? "ring-4 ring-ink" : ""),
								style: {
									background: th.bg,
									color: th.fg
								},
								children: th.name
							}, th.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: showArabic ? "on" : "off",
								onChange: (v) => setShowArabic(v === "on"),
								options: [{
									value: "on",
									label: "Show Arabic"
								}, {
									value: "off",
									label: "English only"
								}]
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "mt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Caption" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[15px] font-semibold text-ink2",
							children: card.caption
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									onClick: copy,
									children: copied ? "✓ Caption copied" : "🔗 Copy caption"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									variant: "outline",
									onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(card.caption)}`, "_blank", "noopener"),
									children: "𝕏 Post"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									variant: "outline",
									onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(card.caption)}`, "_blank", "noopener"),
									children: "💬 WhatsApp"
								})
							]
						})
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:sticky lg:top-24",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: "Preview · 1080 × 1350"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "brutal flex aspect-[4/5] flex-col justify-between rounded-r24 p-6",
						style: {
							background: t.bg,
							color: t.fg
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[15px] font-black",
									children: "IlmStation"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono text-[11px] font-bold tracking-widest uppercase",
									children: kind
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								showArabic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									lang: "ar",
									dir: "rtl",
									className: "arabic text-right text-[26px] leading-loose",
									children: card.arabic
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-2 text-[26px] leading-tight font-black",
									children: card.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 space-y-1",
									children: card.lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "text-[15px] font-bold opacity-90",
										children: l
									}, l))
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[26px]",
									"aria-hidden": true,
									children: s.avatar
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
									className: "text-[11px] font-bold tracking-widest uppercase",
									children: "ilmstation.com"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "field",
							children: "Cards render on device — nothing is uploaded"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							size: "lg",
							full: true,
							onClick: copy,
							children: copied ? "✓ Copied" : "📤 Share this card"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/home",
							variant: "outline",
							size: "lg",
							full: true,
							children: "Back to Home"
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { ShareCards as component };
