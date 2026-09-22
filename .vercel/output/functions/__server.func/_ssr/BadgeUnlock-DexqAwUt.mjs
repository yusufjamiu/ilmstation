import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, f as Mono, i as Btn, p as Pill, s as Confetti, t as Arabic } from "./kit-ZBxajPhE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BadgeUnlock-DexqAwUt.js
var import_jsx_runtime = require_jsx_runtime();
/** P07u Badge Unlock — full-screen celebration. */
function BadgeUnlock({ badge, onClose }) {
	if (!badge) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 grid place-items-center bg-ink/70 px-4 backdrop-blur-[2px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Confetti, { count: 34 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "brutal anim-pop w-full max-w-md rounded-r24 bg-yellow p-7 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: "ink",
					children: "Badge unlocked"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
					size: "xl",
					className: "mt-4 text-center",
					children: badge.arabic
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 text-[64px]",
					"aria-hidden": true,
					children: badge.icon
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 text-[28px] leading-tight font-black",
					children: badge.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[15px] font-bold",
					children: badge.description
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 inline-flex items-center gap-2 rounded-rf border border-border/25 bg-surface px-4 py-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
						className: "text-[20px] font-bold",
						children: [
							"+",
							badge.xp,
							" XP"
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/share",
						search: { kind: "badge" },
						variant: "ink",
						full: true,
						size: "lg",
						children: "📤 Share this badge"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "outline",
						full: true,
						onClick: onClose,
						children: "Continue"
					})]
				})
			]
		})]
	});
}
//#endregion
export { BadgeUnlock as t };
