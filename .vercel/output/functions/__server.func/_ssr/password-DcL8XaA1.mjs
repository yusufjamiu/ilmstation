import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn, l as Field, u as Input } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
import { i as signUp, t as authErrorMessage } from "./auth-Be7ZzKU5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/password-DcL8XaA1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function strength(pw) {
	let score = 0;
	if (pw.length >= 8) score++;
	if (/[A-Z]/.test(pw)) score++;
	if (/[0-9]/.test(pw)) score++;
	if (/[^A-Za-z0-9]/.test(pw)) score++;
	return score;
}
var LABELS = [
	"Too short",
	"Weak",
	"Fair",
	"Strong",
	"Excellent"
];
var TONES = [
	"bg-field",
	"bg-pink",
	"bg-yellow",
	"bg-green",
	"bg-green"
];
/** S06 Password */
function PasswordScreen() {
	const { s } = useApp();
	const navigate = useNavigate();
	const [pw, setPw] = (0, import_react.useState)("");
	const [show, setShow] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const score = strength(pw);
	const submit = async (e) => {
		e.preventDefault();
		if (score < 2) return;
		setError("");
		setLoading(true);
		try {
			await signUp(s.email, pw, s.name);
			navigate({ to: "/onboarding/dob" });
		} catch (err) {
			setError(authErrorMessage(err));
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardShell, {
		step: 3,
		total: 7,
		back: "/onboarding/signup",
		title: "Lock it down",
		subtitle: "8+ characters, with a number and a capital letter.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-4",
			onSubmit: submit,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Password",
					error,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: show ? "text" : "password",
							value: pw,
							onChange: (e) => setPw(e.target.value),
							placeholder: "••••••••",
							autoComplete: "new-password",
							className: "pr-20"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShow(!show),
							className: "absolute top-1/2 right-2 -translate-y-1/2 rounded-r8 px-2 py-1 text-[11px] font-black uppercase",
							children: show ? "Hide" : "Show"
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5",
					children: [
						0,
						1,
						2,
						3
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `brutal-flat h-2.5 flex-1 rounded-rf ${i < score ? TONES[score] : "bg-field"}` }, i))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mono mt-1.5 text-[11px] font-bold tracking-widest uppercase",
					children: LABELS[score]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1 text-[13px] font-semibold text-ink2",
					children: [
						{
							ok: pw.length >= 8,
							t: "At least 8 characters"
						},
						{
							ok: /[A-Z]/.test(pw),
							t: "One capital letter"
						},
						{
							ok: /[0-9]/.test(pw),
							t: "One number"
						},
						{
							ok: /[^A-Za-z0-9]/.test(pw),
							t: "One symbol (optional)"
						}
					].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: r.ok ? "text-green" : "text-muted",
							children: r.ok ? "✓" : "○"
						}),
						" ",
						r.t
					] }, r.t))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					type: "submit",
					size: "lg",
					full: true,
					disabled: score < 2 || loading,
					children: loading ? "Creating account…" : "Continue →"
				})
			]
		})
	});
}
//#endregion
export { PasswordScreen as component, strength };
