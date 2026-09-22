import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/check-email-5fI2MPNq.js
var import_jsx_runtime = require_jsx_runtime();
/** S12 Check Email */
function CheckEmail() {
	const { s } = useApp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 3,
		total: 7,
		back: "/onboarding/forgot",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "brutal-lg anim-pop rounded-r24 bg-green-l p-7 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[64px]",
						"aria-hidden": true,
						children: "📬"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-[28px] leading-tight font-black",
						children: "Check your email"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-[15px] font-semibold",
						children: [
							"We sent a reset link to",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mono font-bold",
								children: s.email || "your email address"
							}),
							". The link expires in 30 minutes."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/onboarding/reset",
					size: "lg",
					full: true,
					children: "Open email app"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/onboarding/login",
					variant: "outline",
					full: true,
					children: "Back to log in"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-center text-[13px] text-muted",
				children: "Didn't get it? Check spam, or resend from the previous screen."
			})
		]
	});
}
//#endregion
export { CheckEmail as component };
