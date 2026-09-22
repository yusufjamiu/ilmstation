import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, f as Mono, h as SectionTitle, i as Btn, o as Card, p as Pill } from "./kit-ZBxajPhE.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offline-CltUFBv6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** SY01 Offline State */
function Offline() {
	const [online, setOnline] = (0, import_react.useState)(true);
	const [retrying, setRetrying] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (typeof navigator === "undefined") return;
		const sync = () => setOnline(navigator.onLine);
		sync();
		window.addEventListener("online", sync);
		window.addEventListener("offline", sync);
		return () => {
			window.removeEventListener("online", sync);
			window.removeEventListener("offline", sync);
		};
	}, []);
	const retry = () => {
		setRetrying(true);
		setTimeout(() => setRetrying(false), 1200);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: online ? "Connection looks fine" : "You're offline",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: online ? "green" : "pink",
				className: "rounded-r24 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[56px]",
						"aria-hidden": true,
						children: online ? "📶" : "📴"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-[26px] font-black",
						children: online ? "You're connected" : "No internet connection"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[15px] font-semibold",
						children: online ? "Everything is live. This screen is how IlmStation looks when the connection drops." : "Your progress is saved on this device and nothing is lost. Some screens need a connection."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							onClick: retry,
							children: retrying ? "Retrying…" : "🔄 Retry connection"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/bookmarks",
							variant: "outline",
							children: "🔖 Read saved items"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Works offline" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-[15px] font-semibold",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "✅ Bookmarked articles" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "✅ Hifz review queue" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "✅ Downloaded quizzes and your progress" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "✅ Points wallet and history" })
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					tone: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Needs a connection" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 text-[15px] font-semibold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "⛔ Challenge duels and Halaqah rooms" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "⛔ Leaderboards" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "⛔ IlmBot answers" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "⛔ Recitation audio streaming" })
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Pending sync" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "yellow",
							children: "2 quiz results queued"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "yellow",
							children: "1 Hifz session queued"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
						className: "mt-3 block text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: "These upload automatically as soon as you're back online."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/home",
					size: "lg",
					full: true,
					children: "Back to Home"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: "/hifz/review",
					variant: "outline",
					size: "lg",
					full: true,
					children: "📖 Hifz review (offline)"
				})]
			})
		]
	});
}
//#endregion
export { Offline as component };
