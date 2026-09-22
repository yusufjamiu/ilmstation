import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, f as Mono, g as Segmented, h as SectionTitle, i as Btn, o as Card, p as Pill, y as cn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as WISDOM } from "./content-Df4kcoxg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wisdom-Bk2qX6z0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** L04 Daily Wisdom · L04b Wisdom Archive */
function DailyWisdom() {
	const { s, award, toggleBookmark } = useApp();
	const [view, setView] = (0, import_react.useState)("today");
	const [claimed, setClaimed] = (0, import_react.useState)(false);
	const today = WISDOM[0];
	const saved = (id) => s.bookmarks.includes(`wisdom-${id}`);
	const claim = () => {
		if (claimed) return;
		setClaimed(true);
		award(15, "hikmah", "Daily Wisdom reflection");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Daily Wisdom",
		subtitle: "Arabic, transliteration, translation — and the reference.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
			value: view,
			onChange: setView,
			options: [{
				value: "today",
				label: "Today"
			}, {
				value: "archive",
				label: `Archive (${WISDOM.length})`
			}]
		}), view === "today" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "mt-4 rounded-r24",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "ink",
							children: today.kind
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "text-[11px] font-bold tracking-widest uppercase",
							children: [
								"#",
								today.id,
								" · ",
								today.date
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						lang: "ar",
						dir: "rtl",
						className: "arabic mt-4 text-center text-[28px] leading-[2]",
						children: today.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono mt-3 text-center text-[13px] font-bold text-ink2",
						children: today.translit
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-center text-[18px] leading-relaxed font-bold",
						children: [
							"“",
							today.translation,
							"”"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mono mt-4 border-t border-border/20 pt-3 text-center text-[11px] font-bold tracking-widest uppercase",
						children: ["📖 ", today.source]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-2 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: claimed ? "green" : "primary",
						size: "lg",
						full: true,
						onClick: claim,
						children: claimed ? "✓ Reflected · +15 Hikmah" : "I reflected on this · +15"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "outline",
						size: "lg",
						full: true,
						onClick: () => toggleBookmark(`wisdom-${today.id}`),
						children: saved(today.id) ? "🔖 Saved" : "🔖 Save"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/share",
						search: { kind: "wisdom" },
						variant: "outline",
						size: "lg",
						full: true,
						children: "📤 Share"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Why this matters" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: "Daily Wisdom is deliberately short. One narration, understood and acted on, is worth more than a hundred skimmed. Reflect, then take one small action today."
				})]
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 space-y-3",
			children: WISDOM.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: cn("rounded-r16", w.id === today.id && "bg-yellow"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: w.kind === "Ayah" ? "green" : "field",
							children: w.kind
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
							className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
							children: w.date
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						lang: "ar",
						dir: "rtl",
						className: "arabic mt-2 text-right text-[22px] leading-loose",
						children: w.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-[15px] font-bold",
						children: [
							"“",
							w.translation,
							"”"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
							children: ["📖 ", w.source]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							variant: "outline",
							size: "sm",
							onClick: () => toggleBookmark(`wisdom-${w.id}`),
							children: saved(w.id) ? "🔖 Saved" : "Save"
						})]
					})
				]
			}, w.id))
		})]
	});
}
//#endregion
export { DailyWisdom as component };
