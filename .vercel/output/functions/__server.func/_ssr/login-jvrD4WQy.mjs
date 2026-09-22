import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, i as Btn, l as Field, u as Input } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
import { n as logIn, r as logInWithGoogle, t as authErrorMessage } from "./auth-Be7ZzKU5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-jvrD4WQy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S10 Log In */
function LoginScreen() {
	const { s, set, finishOnboarding } = useApp();
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)(s.email || "");
	const [pw, setPw] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [googleLoading, setGoogleLoading] = (0, import_react.useState)(false);
	const finishLogin = (userEmail, name) => {
		set({
			email: userEmail,
			name: name || s.name || ""
		});
		finishOnboarding();
		navigate({ to: "/home" });
	};
	const submit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const user = await logIn(email, pw);
			finishLogin(email, user.displayName || "");
		} catch (err) {
			setError(authErrorMessage(err));
		} finally {
			setLoading(false);
		}
	};
	const submitGoogle = async () => {
		setError("");
		setGoogleLoading(true);
		try {
			const user = await logInWithGoogle();
			finishLogin(user.email || "", user.displayName || "");
		} catch (err) {
			setError(authErrorMessage(err));
		} finally {
			setGoogleLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 3,
		total: 7,
		back: "/onboarding/gateway",
		title: "Welcome back",
		subtitle: "Assalamu Alaykum — your streak is waiting.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-4",
				onSubmit: submit,
				noValidate: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Email address",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							autoComplete: "email"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Password",
						error,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "password",
							value: pw,
							onChange: (e) => setPw(e.target.value),
							placeholder: "••••••••",
							autoComplete: "current-password"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						type: "submit",
						size: "lg",
						full: true,
						disabled: loading || googleLoading,
						children: loading ? "Logging in…" : "Log in →"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "my-4 flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-ink/10" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: "or"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-ink/10" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				type: "button",
				variant: "outline",
				size: "lg",
				full: true,
				onClick: submitGoogle,
				disabled: loading || googleLoading,
				children: googleLoading ? "Connecting…" : "Continue with Google"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-2 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/onboarding/forgot",
					variant: "ghost",
					children: "Forgot your password?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/onboarding/signup",
					variant: "outline",
					full: true,
					children: "Create an account instead"
				})]
			})
		]
	});
}
//#endregion
export { LoginScreen as component };
