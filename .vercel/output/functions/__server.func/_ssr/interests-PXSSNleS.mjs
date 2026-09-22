import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as TOPICS } from "./topics-_n1jadKH.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/interests-PXSSNleS.js
var import_jsx_runtime = require_jsx_runtime();
/** S16 Interests */
function InterestsScreen() {
	const { s, set } = useApp();
	const navigate = useNavigate();
	const toggle = (id) => set({ interests: s.interests.includes(id) ? s.interests.filter((i) => i !== id) : [...s.interests, id] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 6,
		total: 7,
		back: "/onboarding/zone",
		title: "What do you want to learn?",
		subtitle: "Pick at least one. This seeds your Quest Map and your Daily Quest.",
		wide: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
			children: TOPICS.map((t) => {
				const active = s.interests.includes(t.id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => toggle(t.id),
					"aria-pressed": active,
					className: `brutal press rounded-r16 p-4 text-left ${active ? "bg-yellow" : "bg-surface"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[32px]",
							"aria-hidden": true,
							children: t.icon
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1.5 text-[15px] font-black",
							children: t.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "arabic text-[18px]",
							lang: "ar",
							dir: "rtl",
							children: t.arabic
						}),
						active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-[11px] font-black uppercase",
							children: "✓ Added"
						}) : null
					]
				}, t.id);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "mono text-[13px] font-bold text-ink2",
				children: [s.interests.length, " selected"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				size: "lg",
				full: true,
				disabled: s.interests.length === 0,
				onClick: () => navigate({ to: "/onboarding/assessment" }),
				children: "Continue →"
			})]
		})]
	});
}
//#endregion
export { InterestsScreen as component };
