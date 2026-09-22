import { r as __toESM } from "./_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "./_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, f as Mono, h as SectionTitle, i as Btn, o as Card, p as Pill, t as Arabic } from "./_ssr/kit-ZBxajPhE.mjs";
import { u as useApp } from "./_ssr/store-BMzoaAqa.mjs";
import { t as AppShell } from "./_ssr/AppShell-BbhG3piC.mjs";
import { n as topicById } from "./_ssr/topics-_n1jadKH.mjs";
import { t as ARTICLES } from "./_ssr/content-Df4kcoxg.mjs";
import { t as Route } from "./_slug-4Hox36u_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-COLRKdCu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** L02 Article Reader */
function ArticleReader() {
	const { article } = Route.useLoaderData();
	const { s, toggleBookmark, markArticleRead } = useApp();
	const [size, setSize] = (0, import_react.useState)(17);
	const t = topicById(article.topic);
	const read = s.readArticles.includes(article.slug);
	const saved = s.bookmarks.includes(article.slug);
	const related = ARTICLES.filter((a) => a.topic === article.topic && a.slug !== article.slug).slice(0, 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/library",
			label: "Library"
		},
		title: article.title,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "yellow",
				className: "rounded-r20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "ink",
								children: [
									t.icon,
									" ",
									t.name
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "surface",
								children: [article.minutes, " min read"]
							}),
							read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "green",
								children: "Completed ✓"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "surface",
								children: "+30 Ilm on finish"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
						size: "xl",
						className: "mt-3",
						children: article.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[15px] font-bold",
						children: article.excerpt
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "ink",
								size: "sm",
								onClick: () => toggleBookmark(article.slug),
								children: saved ? "🔖 Saved" : "🔖 Bookmark"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "outline",
								size: "sm",
								onClick: () => setSize(Math.min(22, size + 2)),
								children: "A+"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "outline",
								size: "sm",
								onClick: () => setSize(Math.max(15, size - 2)),
								children: "A−"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
				className: "mt-4 space-y-4",
				style: { fontSize: size },
				children: article.body.map((block, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					block.heading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-4 text-[22px] font-black tracking-tight",
						children: block.heading
					}) : null,
					block.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 leading-relaxed font-medium text-ink2",
						children: block.text
					}) : null,
					block.arabic ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						tone: "field",
						className: "mt-3 rounded-r16",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							lang: "ar",
							dir: "rtl",
							className: "arabic text-center text-[24px] leading-loose",
							children: block.arabic
						}), block.translation ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-center text-[15px] font-bold",
							children: [
								"“",
								block.translation,
								"”"
							]
						}) : null]
					}) : null
				] }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Finished reading?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							size: "lg",
							full: true,
							variant: read ? "green" : "primary",
							onClick: () => markArticleRead(article.slug),
							disabled: read,
							children: read ? "✓ Marked complete" : "Mark as read · +30 Ilm"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/play/difficulty",
							search: {
								topic: article.topic,
								count: 10
							},
							variant: "outline",
							size: "lg",
							full: true,
							children: "🎯 Quiz me on this"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
						className: "mt-3 block text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: ["Articles read: ", s.articlesRead]
					})
				]
			}),
			related.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, {
				className: "mt-5",
				children: ["More in ", t.name]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: related.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "rounded-r16",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-[15px] leading-tight font-black",
							children: r.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
							children: [r.minutes, " min"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/library/$slug",
							params: { slug: r.slug },
							variant: "outline",
							size: "sm",
							className: "mt-2",
							children: "Read"
						})
					]
				}, r.slug))
			})] }) : null
		]
	});
}
//#endregion
export { ArticleReader as component };
