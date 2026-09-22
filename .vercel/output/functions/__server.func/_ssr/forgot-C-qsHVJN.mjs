import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn, l as Field, u as Input } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/forgot-C-qsHVJN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S11 Forgot Password */
function ForgotScreen() {
	const { s, set } = useApp();
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)(s.email);
	const [error, setError] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardShell, {
		step: 3,
		total: 7,
		back: "/onboarding/login",
		title: "Reset your password",
		subtitle: "We'll email you a secure link to set a new one.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-4",
			onSubmit: (e) => {
				e.preventDefault();
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
					setError("Enter a valid email address");
					return;
				}
				set({ email });
				navigate({ to: "/onboarding/check-email" });
			},
			noValidate: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Email address",
				error,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "email",
					value: email,
					onChange: (e) => setEmail(e.target.value),
					placeholder: "you@email.com"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				type: "submit",
				size: "lg",
				full: true,
				children: "Send reset link →"
			})]
		})
	});
}
//#endregion
export { ForgotScreen as component };
