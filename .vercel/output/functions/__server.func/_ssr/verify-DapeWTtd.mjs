import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/verify-DapeWTtd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S09 Email Verify */
function VerifyScreen() {
	const { s } = useApp();
	const navigate = useNavigate();
	const [digits, setDigits] = (0, import_react.useState)([
		"",
		"",
		"",
		"",
		"",
		""
	]);
	const [error, setError] = (0, import_react.useState)("");
	const [seconds, setSeconds] = (0, import_react.useState)(45);
	const refs = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		if (seconds <= 0) return;
		const t = setTimeout(() => setSeconds((x) => x - 1), 1e3);
		return () => clearTimeout(t);
	}, [seconds]);
	const setDigit = (i, v) => {
		const clean = v.replace(/\D/g, "").slice(-1);
		const next = [...digits];
		next[i] = clean;
		setDigits(next);
		setError("");
		if (clean && i < 5) refs.current[i + 1]?.focus();
	};
	const code = digits.join("");
	const verify = () => {
		if (code.length < 6) {
			setError("Enter all six digits");
			return;
		}
		navigate({ to: "/onboarding/zone" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 4,
		total: 7,
		back: "/onboarding/avatar",
		title: "Check your inbox",
		subtitle: `We sent a 6-digit code to ${s.email || "your email"}. Demo tip: any 6 digits work.`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-between gap-2",
				children: digits.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: (el) => {
						refs.current[i] = el;
					},
					value: d,
					onChange: (e) => setDigit(i, e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
					},
					inputMode: "numeric",
					"aria-label": `Digit ${i + 1}`,
					className: "brutal mono h-16 w-full rounded-r12 bg-field text-center text-[24px] font-bold focus:ring-2 focus:ring-yellow focus:outline-none"
				}, i))
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-[13px] font-bold",
				children: ["⚠ ", error]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				size: "lg",
				full: true,
				className: "mt-5",
				onClick: verify,
				children: "Verify email →"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 text-center text-[13px] font-semibold text-ink2",
				children: seconds > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Resend code in ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mono",
					children: [seconds, "s"]
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setSeconds(45),
					className: "font-black underline",
					children: "Resend code"
				})
			})
		]
	});
}
//#endregion
export { VerifyScreen as component };
