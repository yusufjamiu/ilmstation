import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { y as cn } from "./kit-ZBxajPhE.mjs";
import { a as Sparkles, y as ArrowLeft } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/OnboardShell-C-NKme8d.js
var import_jsx_runtime = require_jsx_runtime();
function OnboardShell({ children, step, total, back, title, subtitle, wide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto flex w-full max-w-[1200px] items-center gap-3 px-5 py-5 sm:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2.5 font-black",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brutal-sm grid h-9 w-9 place-items-center rounded-r8 bg-yellow",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							size: 18,
							strokeWidth: 2.5
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[18px]",
						children: "IlmStation"
					})]
				}), step && total ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mono ml-auto text-[11px] font-bold text-ink2 uppercase",
					children: [
						"Step ",
						step,
						" / ",
						total
					]
				}) : null]
			}),
			step && total ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto w-full max-w-[1200px] px-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-1.5 w-full overflow-hidden rounded-rf bg-field",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-green transition-[width] duration-500",
						style: { width: `${step / total * 100}%` }
					})
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto flex w-full flex-1 flex-col justify-center px-5 py-10 sm:px-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("mx-auto w-full", wide ? "max-w-3xl" : "max-w-md"),
					children: [
						back ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: back,
							className: "mb-5 inline-flex items-center gap-2 text-[13px] font-bold text-ink2 hover:text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 16 }), " Back"]
						}) : null,
						title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[38px] leading-[1.08] font-black sm:text-[44px]",
							children: title
						}) : null,
						subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 max-w-lg text-[16px] leading-relaxed text-ink2",
							children: subtitle
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: title ? "mt-8" : "",
							children
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mx-auto w-full max-w-[1200px] px-5 py-5 text-center text-[11px] font-bold text-muted uppercase",
				children: "Seek · Learn · Grow"
			})
		]
	});
}
//#endregion
export { OnboardShell as t };
