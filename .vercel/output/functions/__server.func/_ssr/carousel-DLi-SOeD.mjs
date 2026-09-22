import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn } from "./kit-ZBxajPhE.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/carousel-DLi-SOeD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SLIDES = [
	{
		icon: "📖",
		kicker: "Learn",
		arabic: "اِقْرَأْ",
		title: "Deen with real depth",
		body: "Eight Islamic topics, taught in structured quest chains — from Aqeedah to Tafsir, with every answer explained and sourced.",
		tone: "bg-yellow"
	},
	{
		icon: "🎯",
		kicker: "Play",
		arabic: "تَحَدَّ",
		title: "Turn study into a sport",
		body: "Daily quests, XP, badges, head-to-head duels with friends and a Halaqah room for the whole family.",
		tone: "bg-green-l"
	},
	{
		icon: "🌱",
		kicker: "Grow",
		arabic: "اِنْمُ",
		title: "Consistency you can see",
		body: "Streaks, levels from Beginner to Alim, and points you can convert into real Sadaqah.",
		tone: "bg-pink-l"
	}
];
/** S03 Value Carousel */
function ValueCarousel() {
	const [i, setI] = (0, import_react.useState)(0);
	const navigate = useNavigate();
	const slide = SLIDES[i];
	const last = i === SLIDES.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 2,
		total: 7,
		back: "/onboarding/language",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `brutal-lg anim-pop rounded-r24 p-7 ${slide.tone}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[64px]",
						"aria-hidden": true,
						children: slide.icon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono mt-2 text-[11px] font-bold  uppercase",
						children: slide.kicker
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "arabic mt-1 text-[32px]",
						lang: "ar",
						dir: "rtl",
						children: slide.arabic
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 text-[28px] leading-tight font-black",
						children: slide.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[15px] font-semibold",
						children: slide.body
					})
				]
			}, i),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex items-center gap-2",
				children: [SLIDES.map((_, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setI(n),
					"aria-label": `Slide ${n + 1}`,
					className: `brutal-flat h-3 rounded-rf transition-all ${n === i ? "w-8 bg-ink" : "w-3 bg-field"}`
				}, n)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mono ml-auto text-[11px] font-bold text-ink2",
					children: [
						i + 1,
						" / ",
						SLIDES.length
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					variant: "outline",
					onClick: () => i === 0 ? navigate({ to: "/onboarding/gateway" }) : setI(i - 1),
					children: i === 0 ? "Skip" : "← Back"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					size: "lg",
					full: true,
					onClick: () => last ? navigate({ to: "/onboarding/gateway" }) : setI(i + 1),
					children: last ? "Get started →" : "Next →"
				})]
			})
		]
	});
}
//#endregion
export { ValueCarousel as component };
