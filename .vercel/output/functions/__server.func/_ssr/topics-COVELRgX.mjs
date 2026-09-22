import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { g as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as Modal, f as Mono, g as Segmented, i as Btn, o as Card, p as Pill, t as Arabic, u as Input } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { t as TOPICS } from "./topics-_n1jadKH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/topics-COVELRgX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** P02 Topic Browser */
function TopicBrowser() {
	const { s } = useApp();
	const navigate = useNavigate();
	const [cat, setCat] = (0, import_react.useState)("all");
	const [query, setQuery] = (0, import_react.useState)("");
	const [locked, setLocked] = (0, import_react.useState)(null);
	const list = TOPICS.filter((t) => (cat === "all" || t.category === cat) && (t.name.toLowerCase().includes(query.toLowerCase()) || t.arabic.includes(query)));
	const open = (t) => {
		if (t.premium && !s.premium) {
			setLocked(t);
			return;
		}
		navigate({
			to: "/play/difficulty",
			search: {
				topic: t.id,
				count: 10
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/play",
			label: "Play"
		},
		title: "Choose a topic",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-3 sm:grid-cols-[1fr_auto]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search topics in English or Arabic…",
					"aria-label": "Search topics"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
					value: cat,
					onChange: setCat,
					options: [
						{
							value: "all",
							label: "All"
						},
						{
							value: "Foundations",
							label: "Foundations"
						},
						{
							value: "Text",
							label: "Text"
						},
						{
							value: "Practice",
							label: "Practice"
						},
						{
							value: "Language",
							label: "Language"
						}
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: list.map((t) => {
					const isLocked = t.premium && !s.premium;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => open(t),
						className: "text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							tone: isLocked ? "field" : "surface",
							className: "press h-full rounded-r16",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[36px]",
										"aria-hidden": true,
										children: t.icon
									}), isLocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "ink",
										children: "🔒 Premium"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "green",
										children: "Free"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-2 text-[20px] font-black",
									children: t.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
									size: "md",
									children: t.arabic
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1.5 text-[13px] font-semibold text-ink2",
									children: t.scope
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
									className: "mt-2 block text-[11px] font-bold text-ink2 uppercase",
									children: [
										t.questions,
										" questions · ",
										t.category
									]
								})
							]
						})
					}, t.id);
				})
			}),
			list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 text-center text-[15px] font-bold text-ink2",
				children: [
					"No topic matches “",
					query,
					"”."
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				open: !!locked,
				onClose: () => setLocked(null),
				title: "Premium topic",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-ink",
						children: locked?.name
					}), " is an advanced topic. Unlock it with Premium, or buy a Topic Pack for 500 points in the Points Store."]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/store",
						onClick: () => setLocked(null),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							full: true,
							size: "lg",
							children: "🛒 Open Points Store"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "outline",
						full: true,
						onClick: () => setLocked(null),
						children: "Maybe later"
					})]
				})]
			})
		]
	});
}
//#endregion
export { TopicBrowser as component };
