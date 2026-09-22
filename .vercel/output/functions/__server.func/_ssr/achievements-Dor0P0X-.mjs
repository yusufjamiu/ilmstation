import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, d as Modal, f as Mono, g as Segmented, h as SectionTitle, i as Btn, o as Card, p as Pill, r as Bar, t as Arabic, y as cn } from "./kit-ZBxajPhE.mjs";
import { n as BADGES, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/achievements-Dor0P0X-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Q05 Achievements */
function Achievements() {
	const { s } = useApp();
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [open, setOpen] = (0, import_react.useState)(null);
	const earned = (b) => s.badges.includes(b.id);
	const list = BADGES.filter((b) => filter === "all" ? true : filter === "earned" ? earned(b) : !earned(b));
	const count = BADGES.filter(earned).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Achievements",
		subtitle: "Eight badges, each tied to real practice.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "mb-5 rounded-r20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "text-[13px] font-bold",
							children: [
								count,
								"/",
								BADGES.length
							]
						}),
						children: "Badge collection"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						value: count / BADGES.length,
						tone: "green",
						label: "Badges earned"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
							value: filter,
							onChange: setFilter,
							options: [
								{
									value: "all",
									label: "All"
								},
								{
									value: "earned",
									label: "Earned"
								},
								{
									value: "locked",
									label: "Locked"
								}
							]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: list.map((b) => {
					const got = earned(b);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setOpen(b),
						className: "text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							tone: got ? "yellow" : "field",
							className: cn("press h-full rounded-r16 text-center", !got && "opacity-80"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("text-[40px]", !got && "grayscale"),
									"aria-hidden": true,
									children: b.icon
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-1 text-[15px] leading-tight font-black",
									children: b.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
									size: "sm",
									className: "text-ink2",
									children: b.arabic
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										value: got ? 1 : b.progress,
										tone: got ? "green" : "yellow",
										label: `${b.name} progress`
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
									className: "mt-1 block text-[11px] font-bold text-ink2 uppercase",
									children: got ? "Earned ✓" : `${Math.round(b.progress * 100)}%`
								})
							]
						})
					}, b.id);
				})
			}),
			list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-[15px] font-semibold text-ink2",
				children: "Nothing in this filter yet — switch to “All” to see the full set."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
				open: !!open,
				onClose: () => setOpen(null),
				title: open?.name ?? "",
				children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[56px]",
							"aria-hidden": true,
							children: open.icon
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
							size: "lg",
							children: open.arabic
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[15px] font-semibold",
							children: open.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap justify-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "ink",
									children: open.condition
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
									tone: "yellow",
									children: [
										"+",
										open.xp,
										" XP"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: earned(open) ? "green" : "field",
									children: earned(open) ? "Earned" : `${Math.round(open.progress * 100)}% there`
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-col gap-2 sm:flex-row",
							children: [earned(open) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/share",
								search: { kind: "badge" },
								full: true,
								children: "📤 Share badge"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/play",
								full: true,
								children: "Work towards it"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "outline",
								full: true,
								onClick: () => setOpen(null),
								children: "Close"
							})]
						})
					]
				}) : null
			})
		]
	});
}
//#endregion
export { Achievements as component };
