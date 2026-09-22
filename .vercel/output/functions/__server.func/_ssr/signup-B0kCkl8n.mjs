import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn, l as Field, u as Input } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signup-B0kCkl8n.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S05 Name & Email */
function NameEmail() {
	const { s, set } = useApp();
	const navigate = useNavigate();
	const [name, setName] = (0, import_react.useState)(s.name);
	const [email, setEmail] = (0, import_react.useState)(s.email);
	const [touched, setTouched] = (0, import_react.useState)(false);
	const nameErr = name.trim().length < 2 ? "Enter your full name" : "";
	const emailErr = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "Enter a valid email address" : "";
	const valid = !nameErr && !emailErr;
	const submit = (e) => {
		e.preventDefault();
		setTouched(true);
		if (!valid) return;
		set({
			name: name.trim(),
			email: email.trim()
		});
		navigate({ to: "/onboarding/password" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardShell, {
		step: 3,
		total: 7,
		back: "/onboarding/gateway",
		title: "Who's seeking?",
		subtitle: "We'll use your first name to greet you every day.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "space-y-4",
			noValidate: true,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Full name",
					error: touched ? nameErr : "",
					hint: "e.g. Amina Bello",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: "Your name",
						autoComplete: "name"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Email address",
					error: touched ? emailErr : "",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "email",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						placeholder: "you@email.com",
						autoComplete: "email"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					type: "submit",
					size: "lg",
					full: true,
					children: "Continue →"
				})
			]
		})
	});
}
//#endregion
export { NameEmail as component };
