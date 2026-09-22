import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as Modal, f as Mono, g as Segmented, h as SectionTitle, i as Btn, m as Ring, o as Card, p as Pill, t as Arabic, u as Input } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { t as SURAHS } from "./quran-CrTaLQPi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hifz-UdJnwzPw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** P18 Select Surah */
function SelectSurah() {
	const { s } = useApp();
	const navigate = useNavigate();
	const [juz, setJuz] = (0, import_react.useState)("all");
	const [query, setQuery] = (0, import_react.useState)("");
	const [locked, setLocked] = (0, import_react.useState)(null);
	const list = SURAHS.filter((su) => (juz === "all" || String(su.juz) === juz) && (su.name.toLowerCase().includes(query.toLowerCase()) || su.arabic.includes(query)));
	const progressFor = (num) => {
		const verses = s.hifzStrong.filter((v) => v.startsWith(`${num}:`)).length;
		const surah = SURAHS.find((x) => x.num === num);
		return Math.min(1, verses / Math.min(surah.verses, 7));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Hifz Mode",
		subtitle: "Memorise with spaced repetition — four view modes.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-3 sm:grid-cols-[1fr_auto]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search Surah in English or Arabic…",
					"aria-label": "Search Surahs"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
					value: juz,
					onChange: setJuz,
					options: [
						{
							value: "all",
							label: "All Juz"
						},
						{
							value: "30",
							label: "Juz 30"
						},
						{
							value: "1",
							label: "Juz 1"
						}
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
				children: list.map((su) => {
					const isLocked = su.premium && !s.premium;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => isLocked ? setLocked(su.name) : navigate({
							to: "/hifz/session",
							search: { surah: su.num }
						}),
						className: "text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							tone: isLocked ? "field" : "surface",
							className: "press flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ring, {
									value: progressFor(su.num),
									label: `${su.name} progress`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
												className: "text-[11px] font-bold text-ink2",
												children: su.num
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[18px] font-black",
												children: su.name
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
											size: "md",
											children: su.arabic
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
											className: "text-[11px] font-bold text-ink2 uppercase",
											children: [
												su.verses,
												" verses · Juz ",
												su.juz
											]
										})
									]
								}),
								isLocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "ink",
									children: "🔒"
								}) : null
							]
						})
					}, su.num);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Your Hifz stats" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "green",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.hifzSessions }), " sessions"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "yellow",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.hifzStrong.length }), " verses strong"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: s.hifzPractice.length }), " in review queue"] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "outline",
						className: "mt-3",
						onClick: () => navigate({ to: "/hifz/review" }),
						children: "🔁 Open review queue"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				open: !!locked,
				onClose: () => setLocked(null),
				title: "Premium Surah",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: [
						"The full Quran is a Premium feature. ",
						locked,
						" is outside the free starter set (Juz Amma)."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					full: true,
					className: "mt-4",
					onClick: () => navigate({ to: "/store" }),
					children: "See Premium options"
				})]
			})
		]
	});
}
//#endregion
export { SelectSurah as component };
