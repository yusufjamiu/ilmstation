import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, f as Mono, h as SectionTitle, i as Btn, o as Card } from "./kit-ZBxajPhE.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/error-D6Dn1ZPr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** SY02 Error State */
function ErrorState() {
	const router = useRouter();
	const [reported, setReported] = (0, import_react.useState)(false);
	const [retrying, setRetrying] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Something went wrong",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			tone: "pink",
			className: "rounded-r24 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[56px]",
					"aria-hidden": true,
					children: "🧩"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 text-[26px] font-black",
					children: "This screen didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[15px] font-semibold",
					children: "Your XP, points and streak are safe on this device. Nothing you earned was lost."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap justify-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							onClick: () => {
								setRetrying(true);
								router.invalidate();
								setTimeout(() => setRetrying(false), 900);
							},
							children: retrying ? "Retrying…" : "🔄 Try again"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/home",
							variant: "outline",
							children: "Go home"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							variant: "ink",
							onClick: () => setReported(true),
							disabled: reported,
							children: reported ? "✓ Report sent" : "Report a problem"
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "What you can try" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-[15px] font-semibold text-ink2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "1. Retry — most errors are a one-off hiccup." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "2. Go home, then come back to the screen." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "3. Check your connection on the offline screen." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "4. Still stuck? Send a report and keep learning elsewhere in the app." })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/offline",
						variant: "outline",
						size: "sm",
						children: "Connection help"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/settings",
						variant: "outline",
						size: "sm",
						children: "Settings"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
					className: "mt-3 block text-[11px] font-bold tracking-widest text-ink2 uppercase",
					children: "Reference: IQ-ERR-000 · frontend demo"
				})
			]
		})]
	});
}
//#endregion
export { ErrorState as component };
