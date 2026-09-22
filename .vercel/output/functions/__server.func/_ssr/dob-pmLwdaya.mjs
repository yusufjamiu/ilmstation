import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn } from "./kit-ZBxajPhE.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dob-pmLwdaya.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
var YEARS = Array.from({ length: 60 }, (_, i) => 2013 - i);
var DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
function Drum({ items, value, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mono mb-1 text-center text-[10px] font-bold tracking-widest text-ink2 uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "brutal-flat no-scrollbar h-44 overflow-y-auto rounded-r12 bg-field p-1",
			role: "listbox",
			"aria-label": label,
			children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				role: "option",
				"aria-selected": it === value,
				onClick: () => onChange(it),
				className: `mono block w-full rounded-r8 py-2 text-[16px] font-bold ${it === value ? "brutal-flat bg-yellow" : "text-ink2"}`,
				children: it
			}, String(it)))
		})]
	});
}
/** S07 Date of Birth */
function DobScreen() {
	const navigate = useNavigate();
	const [day, setDay] = (0, import_react.useState)(14);
	const [month, setMonth] = (0, import_react.useState)("Mar");
	const [year, setYear] = (0, import_react.useState)(2004);
	const age = 2026 - year;
	const tooYoung = age < 13;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 4,
		total: 7,
		back: "/onboarding/password",
		title: "When were you born?",
		subtitle: "This sets your age zone and the tone of your content.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drum, {
						items: DAYS,
						value: day,
						onChange: setDay,
						label: "Day"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drum, {
						items: MONTHS,
						value: month,
						onChange: setMonth,
						label: "Month"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drum, {
						items: YEARS,
						value: year,
						onChange: setYear,
						label: "Year"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "brutal-sm mt-4 rounded-r12 bg-surface px-4 py-3 text-[15px] font-bold",
				children: [
					day,
					" ",
					month,
					" ",
					year,
					" · ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono",
						children: age
					}),
					" years old"
				]
			}),
			tooYoung ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "brutal-sm mt-3 rounded-r12 bg-pink-l px-4 py-3 text-[13px] font-bold",
				children: "IlmStation is designed for ages 13 and up. Ask a parent to set up a Family account."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				size: "lg",
				full: true,
				className: "mt-5",
				disabled: tooYoung,
				onClick: () => navigate({ to: "/onboarding/avatar" }),
				children: "Continue →"
			})
		]
	});
}
//#endregion
export { DobScreen as component };
