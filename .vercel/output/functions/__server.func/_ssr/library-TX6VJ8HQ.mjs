import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, c as Empty, f as Mono, g as Segmented, h as SectionTitle, o as Card, p as Pill, t as Arabic, u as Input, y as cn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById, t as TOPICS } from "./topics-_n1jadKH.mjs";
import { t as ARTICLES } from "./content-Df4kcoxg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-TX6VJ8HQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** L01 Library Home */
function Library() {
	const { s } = useApp();
	const [query, setQuery] = (0, import_react.useState)("");
	const [topic, setTopic] = (0, import_react.useState)("all");
	const [sort, setSort] = (0, import_react.useState)("featured");
	let list = ARTICLES.filter((a) => (topic === "all" || a.topic === topic) && (a.title.toLowerCase().includes(query.toLowerCase()) || a.excerpt.toLowerCase().includes(query.toLowerCase())));
	if (sort === "short") list = [...list].sort((a, b) => a.minutes - b.minutes);
	if (sort === "unread") list = list.filter((a) => !s.readArticles.includes(a.slug));
	if (sort === "featured") list = [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
	const featured = ARTICLES.find((a) => a.featured);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Library",
		subtitle: "Every article referenced — read, then test yourself.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "green",
				className: "mb-5 rounded-r20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
						tone: "ink",
						children: "Featured"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 text-[24px] leading-tight font-black",
						children: featured.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
						size: "lg",
						children: featured.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-2xl text-[15px] font-semibold text-ink2",
						children: featured.excerpt
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BtnLink, {
							to: "/library/$slug",
							params: { slug: featured.slug },
							variant: "ink",
							children: [
								"Read now · ",
								featured.minutes,
								" min"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BtnLink, {
							to: "/bookmarks",
							variant: "outline",
							children: [
								"🔖 Bookmarks (",
								s.bookmarks.length,
								")"
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 lg:grid-cols-[1fr_auto]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search articles…",
					"aria-label": "Search articles"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
					value: sort,
					onChange: setSort,
					options: [
						{
							value: "featured",
							label: "Featured"
						},
						{
							value: "short",
							label: "Quickest"
						},
						{
							value: "unread",
							label: "Unread"
						}
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTopic("all"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
						tone: topic === "all" ? "yellow" : "field",
						children: "All topics"
					})
				}), TOPICS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTopic(t.id),
					className: "shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
						tone: topic === t.id ? "yellow" : "field",
						children: [
							t.icon,
							" ",
							t.name
						]
					})
				}, t.id))]
			}),
			list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
					icon: "📚",
					title: "Nothing matches that",
					body: "Try a different topic or clear the search — there are articles across all eight topics.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/library",
						onClick: () => {
							setQuery("");
							setTopic("all");
							setSort("featured");
						},
						children: "Reset filters"
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3",
				children: list.map((a) => {
					const t = topicById(a.topic);
					const read = s.readArticles.includes(a.slug);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/library/$slug",
						params: { slug: a.slug },
						variant: "outline",
						className: "!block !p-0 !rounded-r16",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							tone: read ? "field" : "surface",
							className: cn("h-full border-0 shadow-none rounded-r16 text-left"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: "field",
										children: [
											t.icon,
											" ",
											t.name
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
										className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
										children: [a.minutes, " min"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-2 text-[18px] leading-tight font-black",
									children: a.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
									size: "sm",
									className: "text-ink2",
									children: a.arabic
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 line-clamp-3 text-[13px] font-semibold text-ink2 normal-case",
									children: a.excerpt
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex flex-wrap gap-2",
									children: [read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "green",
										children: "Read ✓"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "yellow",
										children: "+30 XP"
									}), s.bookmarks.includes(a.slug) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: "pink",
										children: "🔖 Saved"
									}) : null]
								})
							]
						})
					}, a.slug);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "field",
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Reading rewards" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: [
						"Finishing an article awards 30 Ilm points. You've read ",
						s.articlesRead,
						" of",
						" ",
						ARTICLES.length,
						"."
					]
				})]
			})
		]
	});
}
//#endregion
export { Library as component };
