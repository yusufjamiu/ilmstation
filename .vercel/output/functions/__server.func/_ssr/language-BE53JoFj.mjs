import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
import { n as LANGUAGES } from "./onboarding-B7CWioSf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/language-BE53JoFj.js
var import_jsx_runtime = require_jsx_runtime();
/** S02 Language Select */
function LanguageSelect() {
	const { s, set } = useApp();
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 1,
		total: 7,
		back: "/",
		title: "Choose your language",
		subtitle: "You can change this anytime in Settings.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-2",
			children: LANGUAGES.map((l) => {
				const active = s.language === l.code;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => set({ language: l.code }),
					className: `brutal press flex min-h-11 items-center gap-3 rounded-r12 px-4 py-3 text-left ${active ? "bg-yellow" : "bg-surface"}`,
					"aria-pressed": active,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[24px]",
							"aria-hidden": true,
							children: l.flag
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[15px] font-black",
								children: l.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[13px] text-ink2",
								children: l.native
							})]
						}),
						active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							children: "✓"
						}) : null
					]
				}, l.code);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
			full: true,
			size: "lg",
			className: "mt-5",
			onClick: () => navigate({ to: "/onboarding/carousel" }),
			children: "Continue →"
		})]
	});
}
//#endregion
export { LanguageSelect as component };
