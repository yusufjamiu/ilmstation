import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Empty, f as Mono, g as Segmented, h as SectionTitle, i as Btn, o as Card, p as Pill } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { r as versesFor, t as SURAHS } from "./quran-CrTaLQPi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/review-C_lw8bCG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** P20 Session Review */
function SessionReview() {
	const { s, set, award } = useApp();
	const navigate = useNavigate();
	const [view, setView] = (0, import_react.useState)("gapped");
	const queue = s.hifzPractice.length ? s.hifzPractice : [
		"112:1",
		"112:3",
		"1:5"
	];
	const cardFor = (key) => {
		const [su, vn] = key.split(":").map(Number);
		return {
			verse: versesFor(su).find((v) => v.n === vn),
			surah: SURAHS.find((x) => x.num === su)
		};
	};
	const clear = (key) => {
		set({
			hifzPractice: s.hifzPractice.filter((x) => x !== key),
			hifzStrong: Array.from(/* @__PURE__ */ new Set([...s.hifzStrong, key]))
		});
	};
	const finish = () => {
		award(30, "noor", "Hifz review session");
		set({ hifzSessions: s.hifzSessions + 1 });
		navigate({
			to: "/hifz/complete",
			search: {
				surah: 112,
				reviewed: queue.length,
				strong: 1
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/hifz",
			label: "Hifz Mode"
		},
		title: "Review queue",
		subtitle: "Ordered by spaced repetition — weakest verses first.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
				value: view,
				onChange: setView,
				options: [
					{
						value: "visible",
						label: "Visible"
					},
					{
						value: "gapped",
						label: "Gapped"
					},
					{
						value: "ghost",
						label: "Ghost"
					},
					{
						value: "hidden",
						label: "Hidden"
					}
				]
			}),
			queue.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
					icon: "🌿",
					title: "Queue is clear",
					body: "Nothing due for review. Start a new Hifz session to add verses.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						onClick: () => navigate({ to: "/hifz" }),
						children: "Choose a Surah"
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-3",
				children: queue.map((key, idx) => {
					const { verse, surah } = cardFor(key);
					if (!verse || !surah) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "rounded-r16",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
									tone: "ink",
									children: [
										surah.name,
										" ",
										key
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: idx === 0 ? "pink" : "field",
									children: idx === 0 ? "Due now" : `Due in ${idx}d`
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								lang: "ar",
								dir: "rtl",
								className: `arabic mt-3 text-center text-[26px] ${view === "ghost" ? "opacity-25" : ""}`,
								children: view === "hidden" ? "• • • • •" : view === "gapped" ? verse.arabic.split(" ").map((w, i) => i % 3 === 1 ? "____" : w).join(" ") : verse.arabic
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-center text-[13px] font-semibold text-ink2",
								children: verse.translation
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									variant: "green",
									size: "sm",
									full: true,
									onClick: () => clear(key),
									children: "Got it ✓"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									variant: "outline",
									size: "sm",
									full: true,
									onClick: () => setView("visible"),
									children: "Show fully"
								})]
							})
						]
					}, key);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "field",
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Session summary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "surface",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: queue.length }), " due"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "green",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.hifzStrong.length }), " strong"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						size: "lg",
						full: true,
						className: "mt-3",
						onClick: finish,
						children: "Finish review · +30 XP"
					})
				]
			})
		]
	});
}
//#endregion
export { SessionReview as component };
