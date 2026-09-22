import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn, p as Pill, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as ASSESSMENT } from "./questions-B_nrrIxx.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assessment-jJSDjsW9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S17 Assessment */
function AssessmentScreen() {
	const { set } = useApp();
	const navigate = useNavigate();
	const [i, setI] = (0, import_react.useState)(0);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [correct, setCorrect] = (0, import_react.useState)(0);
	const q = ASSESSMENT[i];
	const last = i === ASSESSMENT.length - 1;
	const next = () => {
		if (picked === null) return;
		const got = picked === q.answer ? 1 : 0;
		const score = correct + got;
		if (last) {
			set({ difficulty: score >= 3 ? "advanced" : score >= 2 ? "intermediate" : "beginner" });
			navigate({ to: "/onboarding/welcome" });
			return;
		}
		setCorrect(score);
		setPicked(null);
		setI(i + 1);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 7,
		total: 7,
		back: "/onboarding/interests",
		title: "Three quick questions",
		subtitle: "No pressure — this only calibrates where you start.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
					tone: "ink",
					children: [
						"Q ",
						i + 1,
						" of ",
						ASSESSMENT.length
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "brutal-flat h-3 flex-1 overflow-hidden rounded-rf bg-field",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-green transition-[width] duration-300",
						style: { width: `${(i + (picked !== null ? 1 : 0)) / ASSESSMENT.length * 100}%` }
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "brutal rounded-r16 bg-surface p-5",
				children: [q.arabic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
					size: "lg",
					children: q.arabic
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 text-[20px] leading-snug font-black",
					children: q.prompt
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid gap-2",
				children: q.options.map((o, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setPicked(n),
					"aria-pressed": picked === n,
					className: `brutal press min-h-11 rounded-r16 px-4 py-3 text-left text-[15px] font-bold ${picked === n ? "bg-yellow" : "bg-surface"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono mr-2 font-bold",
						children: String.fromCharCode(65 + n)
					}), o]
				}, o))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				size: "lg",
				full: true,
				className: "mt-5",
				disabled: picked === null,
				onClick: next,
				children: last ? "Finish assessment →" : "Next question →"
			})
		]
	});
}
//#endregion
export { AssessmentScreen as component };
