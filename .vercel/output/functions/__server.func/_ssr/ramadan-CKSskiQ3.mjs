import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Stat, a as BtnLink, f as Mono, h as SectionTitle, i as Btn, o as Card, p as Pill, r as Bar, v as Toggle, y as cn } from "./kit-ZBxajPhE.mjs";
import { l as RAMADAN_QUESTS, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ramadan-CKSskiQ3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** R01 Ramadan Mode */
function Ramadan() {
	const { s, set, award } = useApp();
	const navigate = useNavigate();
	const [nightMode, setNightMode] = (0, import_react.useState)(s.dark);
	const today = Math.min(30, s.ramadanDays.length + 1);
	const done = (day) => s.ramadanDays.includes(day);
	const tarawihDone = (day) => s.tarawih.includes(day);
	const startDay = (day) => {
		const quest = RAMADAN_QUESTS.find((q) => q.day === day) ?? RAMADAN_QUESTS[0];
		if (!done(day)) {
			set({ ramadanDays: [...s.ramadanDays, day] });
			award(quest.xp, "ajr", `Ramadan Day ${day} — ${quest.theme}`);
		}
		navigate({
			to: "/play/lobby",
			search: {
				topic: "dua",
				count: 8,
				difficulty: "intermediate"
			}
		});
	};
	const toggleTarawih = (day) => {
		set({ tarawih: tarawihDone(day) ? s.tarawih.filter((d) => d !== day) : [...s.tarawih, day] });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Ramadan Mode",
		subtitle: "Special quests, Tarawih tracking and night-friendly reading.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "ink",
				className: "rounded-r24",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mono text-[11px] font-bold tracking-widest uppercase opacity-70",
							children: [
								"Ramadan · Day ",
								today,
								" of 30"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-[28px] leading-tight font-black",
							children: ["🌙 ", RAMADAN_QUESTS.find((q) => q.day === Math.min(today, 7))?.name]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-[15px] font-bold opacity-90",
							children: [
								"Laylatul Qadr window opens in ",
								Math.max(0, 21 - today),
								" days — the last ten nights."
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[13px] font-black uppercase",
							children: "Night mode"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							on: nightMode,
							onChange: (v) => {
								setNightMode(v);
								set({ dark: v });
							},
							label: "Night mode"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						value: s.ramadanDays.length / 30,
						tone: "green",
						label: "Ramadan quests complete"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Days completed",
						value: `${s.ramadanDays.length}/30`,
						tone: "green",
						icon: "✅"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Tarawih nights",
						value: s.tarawih.length,
						icon: "🕌"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Streak",
						value: `${s.streak} days`,
						icon: "🔥"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Sadaqah points",
						value: s.donated,
						icon: "🤲"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Daily quests" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: RAMADAN_QUESTS.map((q) => {
							const complete = done(q.day);
							const locked = q.day > today;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("brutal-sm flex flex-wrap items-center gap-3 rounded-r12 px-3 py-3", complete ? "bg-green-l" : locked ? "bg-field opacity-70" : "bg-surface"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "brutal-sm mono grid h-10 w-10 shrink-0 place-items-center rounded-rf bg-yellow text-[15px] font-bold",
										children: q.day
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[15px] leading-tight font-black",
											children: q.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
											className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
											children: [
												q.theme,
												" · +",
												q.xp,
												" XP"
											]
										})]
									}),
									complete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "green",
										children: "Done ✓"
									}) : locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: "field",
										children: ["Opens day ", q.day]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
										size: "sm",
										onClick: () => startDay(q.day),
										children: "Start"
									})
								]
							}, q.day);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono mt-3 text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: "Days 8–30 unlock one per day through the month."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Tarawih tracker" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-6 gap-2 sm:grid-cols-10",
						children: Array.from({ length: 30 }, (_, i) => i + 1).map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => toggleTarawih(day),
							"aria-pressed": tarawihDone(day),
							"aria-label": `Tarawih night ${day}`,
							className: cn("brutal-sm press-sm mono grid aspect-square place-items-center rounded-r8 text-[13px] font-bold", tarawihDone(day) ? "bg-green text-surface" : "bg-field", day > 20 && !tarawihDone(day) ? "bg-pink-l" : ""),
							children: tarawihDone(day) ? "✓" : day
						}, day))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-[13px] font-semibold text-ink2",
						children: "Rose squares mark the last ten nights — the window in which Laylatul Qadr falls."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						size: "lg",
						full: true,
						onClick: () => startDay(today),
						children: "Start today's Ramadan quest →"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/store",
						search: { item: "sadaqah" },
						variant: "outline",
						size: "lg",
						full: true,
						children: "🤲 Give Sadaqah"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/wisdom",
						variant: "outline",
						size: "lg",
						full: true,
						children: "☪️ Daily Wisdom"
					})
				]
			})
		]
	});
}
//#endregion
export { Ramadan as component };
