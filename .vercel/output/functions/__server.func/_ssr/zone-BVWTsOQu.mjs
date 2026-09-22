import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
import { r as ZONES } from "./onboarding-B7CWioSf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/zone-BVWTsOQu.js
var import_jsx_runtime = require_jsx_runtime();
/** S15 Zone Select */
function ZoneScreen() {
	const { s, set } = useApp();
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 5,
		total: 7,
		back: "/onboarding/verify",
		title: "Which one is you?",
		subtitle: "This sets your content difficulty baseline and how we talk to you.",
		wide: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-3",
			children: ZONES.map((z) => {
				const active = s.zone === z.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => set({ zone: z.id }),
					"aria-pressed": active,
					className: `brutal press rounded-r20 p-5 text-left ${active ? "bg-yellow" : "bg-surface"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[40px]",
							"aria-hidden": true,
							children: z.icon
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono mt-2 text-[20px] font-bold",
							children: z.range
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-[15px] font-black",
							children: z.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-[13px] font-semibold text-ink2",
							children: z.blurb
						}),
						active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 text-[13px] font-black",
							children: "✓ Selected"
						}) : null
					]
				}, z.id);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
			size: "lg",
			full: true,
			className: "mt-5",
			onClick: () => navigate({ to: "/onboarding/interests" }),
			children: "Continue →"
		})]
	});
}
//#endregion
export { ZoneScreen as component };
