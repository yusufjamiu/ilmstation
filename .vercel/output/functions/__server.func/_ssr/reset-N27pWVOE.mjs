import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn, l as Field, u as Input } from "./kit-ZBxajPhE.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
import { n as strength } from "./password-_aOL9JaT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reset-N27pWVOE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S13 Reset Password */
function ResetScreen() {
	const navigate = useNavigate();
	const [pw, setPw] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [done, setDone] = (0, import_react.useState)(false);
	const mismatch = confirm.length > 0 && pw !== confirm;
	const ok = strength(pw) >= 2 && pw === confirm;
	if (done) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "brutal-lg anim-pop rounded-r24 bg-green-l p-7 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[64px]",
				"aria-hidden": true,
				children: "✅"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-[28px] font-black",
				children: "Password updated"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[15px] font-semibold",
				children: "You can log in with your new password now."
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
		size: "lg",
		full: true,
		className: "mt-5",
		onClick: () => navigate({ to: "/onboarding/login" }),
		children: "Log in →"
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardShell, {
		back: "/onboarding/check-email",
		title: "New password",
		subtitle: "Make it strong — at least 8 characters with a number.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-4",
			onSubmit: (e) => {
				e.preventDefault();
				if (ok) setDone(true);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "New password",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "password",
						value: pw,
						onChange: (e) => setPw(e.target.value),
						placeholder: "••••••••"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Confirm password",
					error: mismatch ? "Passwords don't match" : "",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "password",
						value: confirm,
						onChange: (e) => setConfirm(e.target.value),
						placeholder: "••••••••"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					type: "submit",
					size: "lg",
					full: true,
					disabled: !ok,
					children: "Save password →"
				})
			]
		})
	});
}
//#endregion
export { ResetScreen as component };
