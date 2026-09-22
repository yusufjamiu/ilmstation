import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, c as Empty, f as Mono, g as Segmented, h as SectionTitle, i as Btn, o as Card, p as Pill } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as WISDOM, r as articleBySlug } from "./content-Df4kcoxg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bookmarks-pOHmYqhh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** L05 Bookmarks */
function Bookmarks() {
	const { s, toggleBookmark } = useApp();
	const [tab, setTab] = (0, import_react.useState)("all");
	const articles = s.bookmarks.map(articleBySlug).filter(Boolean);
	const wisdoms = s.bookmarks.filter((b) => b.startsWith("wisdom-")).map((b) => WISDOM.find((w) => `wisdom-${w.id}` === b)).filter(Boolean);
	const empty = tab === "all" && articles.length + wisdoms.length === 0 || tab === "articles" && articles.length === 0 || tab === "wisdom" && wisdoms.length === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Bookmarks",
		subtitle: "Saved articles and narrations for revision.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
				value: tab,
				onChange: setTab,
				options: [
					{
						value: "all",
						label: `All (${articles.length + wisdoms.length})`
					},
					{
						value: "articles",
						label: `Articles (${articles.length})`
					},
					{
						value: "wisdom",
						label: `Wisdom (${wisdoms.length})`
					}
				]
			}),
			empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
					icon: "🔖",
					title: "Nothing saved yet",
					body: "Tap the bookmark button on any article or Daily Wisdom card and it will appear here.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/library",
							children: "Browse Library"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/wisdom",
							variant: "outline",
							children: "Daily Wisdom"
						})]
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-3",
				children: [tab !== "wisdom" && articles.map((a) => a ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "rounded-r16",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-[18px] leading-tight font-black",
									children: a.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
									className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
									children: [
										"Article · ",
										a.minutes,
										" min"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 line-clamp-2 text-[13px] font-semibold text-ink2",
									children: a.excerpt
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/library/$slug",
								params: { slug: a.slug },
								size: "sm",
								children: "Read"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "outline",
								size: "sm",
								onClick: () => toggleBookmark(a.slug),
								children: "Remove"
							})]
						})]
					})
				}, a.slug) : null), tab !== "articles" && wisdoms.map((w) => w ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					tone: "field",
					className: "rounded-r16",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: w.kind === "Ayah" ? "green" : "surface",
							children: w.kind
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							lang: "ar",
							dir: "rtl",
							className: "arabic mt-2 text-right text-[22px] leading-loose",
							children: w.arabic
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-[15px] font-bold",
							children: [
								"“",
								w.translation,
								"”"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
								className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
								children: ["📖 ", w.source]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "outline",
								size: "sm",
								onClick: () => toggleBookmark(`wisdom-${w.id}`),
								children: "Remove"
							})]
						})
					]
				}, w.id) : null)]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "field",
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Tip" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: "Bookmarks are stored on this device only, so they stay private and work offline."
				})]
			})
		]
	});
}
//#endregion
export { Bookmarks as component };
