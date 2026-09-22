import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Stat, a as BtnLink, f as Mono, o as Card, p as Pill, s as Confetti } from "./kit-ZBxajPhE.mjs";
import { n as BADGES, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { t as SURAHS } from "./quran-CrTaLQPi.mjs";
import { t as Route } from "./complete-Dnv5F13C.mjs";
import { t as BadgeUnlock } from "./BadgeUnlock-DexqAwUt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/complete-Dohhi-Bz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** P21 Hifz Complete */
function HifzComplete() {
	const { surah, reviewed } = Route.useSearch();
	const { s, set, award, unlock } = useApp();
	const meta = SURAHS.find((x) => x.num === surah) ?? SURAHS[7];
	const [applied, setApplied] = (0, import_react.useState)(false);
	const [badge, setBadge] = (0, import_react.useState)(null);
	const retention = s.hifzStrong.length ? Math.round(s.hifzStrong.length / (s.hifzStrong.length + s.hifzPractice.length) * 100) : 100;
	const xp = 30 + (retention === 100 ? 10 : 0);
	(0, import_react.useEffect)(() => {
		if (applied) return;
		setApplied(true);
		award(xp, "noor", `Hifz session — ${meta.name}`);
		set({ hifzSessions: s.hifzSessions + 1 });
		if (s.hifzSessions + 1 >= 7 && unlock("garden")) setBadge("garden");
	}, [applied]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Session complete",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Confetti, { count: 18 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "green",
				className: "rounded-r24 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[56px]",
						"aria-hidden": true,
						children: "🌿"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "mt-1 text-[28px] font-black",
						children: [
							meta.name,
							" · ",
							meta.arabic
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[15px] font-bold",
						children: "Small and consistent beats large and rare. Your streak is safe today."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "ink",
							children: [
								"+",
								xp,
								" XP · Noor"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "surface",
							children: [
								"🔥 ",
								s.streak,
								" day streak"
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Verses reviewed",
						value: reviewed,
						icon: "📖"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Retention",
						value: `${retention}%`,
						tone: "green"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Strong verses",
						value: s.hifzStrong.length,
						tone: "yellow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "In queue",
						value: s.hifzPractice.length
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: "Next review"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[15px] font-semibold",
						children: s.hifzPractice.length ? `${s.hifzPractice.length} verse(s) return tomorrow in your review queue.` : "Nothing due tomorrow — pick a new Surah when you're ready."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
						className: "mt-2 block text-[13px] font-bold text-ink2",
						children: ["Sessions completed: ", s.hifzSessions]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BtnLink, {
						to: "/hifz/session",
						search: { surah },
						size: "lg",
						full: true,
						children: ["Continue ", meta.name]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/hifz/review",
						variant: "outline",
						size: "lg",
						full: true,
						children: "Review queue"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/home",
						variant: "outline",
						size: "lg",
						children: "Home"
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
export { HifzComplete as component };
