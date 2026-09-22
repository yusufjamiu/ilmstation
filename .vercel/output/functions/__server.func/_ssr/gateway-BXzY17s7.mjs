import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, i as Btn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
import { r as logInWithGoogle, t as authErrorMessage } from "./auth-Be7ZzKU5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gateway-BXzY17s7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S04 Gateway */
function Gateway() {
	const { set, finishOnboarding } = useApp();
	const navigate = useNavigate();
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const continueWithGoogle = async () => {
		setError("");
		setLoading(true);
		try {
			const user = await logInWithGoogle();
			set({
				name: user.displayName || "",
				email: user.email || ""
			});
			finishOnboarding();
			navigate({ to: "/onboarding/zone" });
		} catch (err) {
			setError(authErrorMessage(err));
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 3,
		total: 7,
		back: "/onboarding/carousel",
		title: "Your quest starts here",
		subtitle: "Create an account to save your streak, XP and badges.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/onboarding/signup",
					size: "lg",
					full: true,
					children: "Sign up with email"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/onboarding/login",
					variant: "outline",
					size: "lg",
					full: true,
					children: "Log in"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "my-5 flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-0.5 flex-1 bg-field" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono text-[11px] font-bold tracking-widest text-muted uppercase",
						children: "or"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-0.5 flex-1 bg-field" })
				]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-center text-[13px] font-semibold text-pink",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Btn, {
					variant: "outline",
					full: true,
					onClick: continueWithGoogle,
					disabled: loading,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							children: "🇬"
						}),
						" ",
						loading ? "Connecting…" : "Continue with Google"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Btn, {
					variant: "ink",
					full: true,
					disabled: true,
					title: "Coming soon",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": true }), " Continue with Apple (coming soon)"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-center text-[13px] text-muted",
				children: "By continuing you agree to our Terms and Privacy Policy."
			})
		]
	});
}
//#endregion
export { Gateway as component };
