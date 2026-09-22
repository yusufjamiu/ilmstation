import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, i as Btn, p as Pill, s as Confetti, t as Arabic } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as TOPICS } from "./topics-_n1jadKH.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/welcome-CM_Yg4I6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S18 Welcome */
function WelcomeScreen() {
	const { s, finishOnboarding } = useApp();
	const navigate = useNavigate();
	const [claimed, setClaimed] = (0, import_react.useState)(false);
	const first = (s.name || "Seeker").split(" ")[0];
	(0, import_react.useEffect)(() => {
		if (!claimed) return;
		const t = setTimeout(() => {
			finishOnboarding();
		}, 400);
		return () => clearTimeout(t);
	}, [claimed, finishOnboarding]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, { children: [
		claimed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Confetti, {}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "brutal-lg anim-pop rounded-r24 bg-yellow p-7 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
					size: "xl",
					className: "text-center",
					children: "السَّلَامُ عَلَيْكُمْ"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-2 text-[32px] leading-tight font-black",
					children: [
						"Assalamu Alaykum, ",
						first,
						"!"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[15px] font-bold",
					children: "Your quest begins now. Here's a gift to start you off."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brutal mt-5 inline-flex items-center gap-2 rounded-rf bg-surface px-5 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[24px]",
						"aria-hidden": true,
						children: "✨"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
						className: "text-[24px] font-bold",
						children: "+50 XP"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "brutal mt-4 rounded-r16 bg-surface p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mono text-[11px] font-bold tracking-widest text-ink2 uppercase",
				children: "Your starting setup"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
						tone: "green",
						children: ["Difficulty: ", s.difficulty]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: ["Zone: ", s.zone.replace("zone", "Zone ")] }),
					s.interests.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
						tone: "yellow",
						children: TOPICS.find((t) => t.id === id)?.name
					}, id))
				]
			})]
		}),
		claimed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
			size: "lg",
			full: true,
			className: "mt-5",
			onClick: () => navigate({ to: "/quests" }),
			children: "Begin your first quest →"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
			size: "lg",
			full: true,
			className: "mt-5",
			onClick: () => setClaimed(true),
			children: "Claim +50 XP"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
			variant: "outline",
			full: true,
			className: "mt-2",
			onClick: () => {
				finishOnboarding();
				navigate({ to: "/home" });
			},
			children: "Take me to Home"
		})
	] });
}
//#endregion
export { WelcomeScreen as component };
