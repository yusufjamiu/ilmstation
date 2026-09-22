import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, g as Segmented, h as SectionTitle, i as Btn, o as Card, p as Pill, v as Toggle, y as cn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as TAJWEED_RULES, r as versesFor, t as SURAHS } from "./quran-CrTaLQPi.mjs";
import { t as Route } from "./session-D7i0qvkG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/session-DqTq5bzJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function renderVerse(text, view, tajweed) {
	return text.split(" ").map((w, i) => {
		const hideGapped = view === "gapped" && i % 3 === 1;
		const rule = TAJWEED_RULES[i % TAJWEED_RULES.length];
		if (view === "hidden") return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("inline-block px-1", view === "ghost" && "opacity-25", hideGapped && "brutal-flat mx-1 min-w-14 rounded-r4 bg-field text-transparent select-none"),
			style: tajweed && !hideGapped && view !== "ghost" ? { color: rule.color } : void 0,
			children: hideGapped ? "____" : w
		}, `${w}-${i}`);
	});
}
/** P19 Hifz Session */
function HifzSession() {
	const { surah } = Route.useSearch();
	const { s, set } = useApp();
	const navigate = useNavigate();
	const meta = SURAHS.find((x) => x.num === surah) ?? SURAHS[7];
	const verses = versesFor(surah);
	const [i, setI] = (0, import_react.useState)(0);
	const [view, setView] = (0, import_react.useState)("visible");
	const [tajweed, setTajweed] = (0, import_react.useState)(false);
	const [speed, setSpeed] = (0, import_react.useState)("1");
	const [loop, setLoop] = (0, import_react.useState)(false);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [sheikh, setSheikh] = (0, import_react.useState)("Al-Husary");
	const [reviewed, setReviewed] = (0, import_react.useState)([]);
	const v = verses[i];
	const key = `${surah}:${v.n}`;
	const respond = (strong) => {
		const marked = [...reviewed, key];
		setReviewed(marked);
		set({
			hifzStrong: strong ? Array.from(/* @__PURE__ */ new Set([...s.hifzStrong, key])) : s.hifzStrong,
			hifzPractice: strong ? s.hifzPractice.filter((x) => x !== key) : Array.from(/* @__PURE__ */ new Set([...s.hifzPractice, key]))
		});
		if (i + 1 >= verses.length) {
			navigate({
				to: "/hifz/complete",
				search: {
					surah,
					reviewed: marked.length,
					strong: strong ? 1 : 0
				}
			});
			return;
		}
		setI(i + 1);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/hifz",
			label: "Surah list"
		},
		title: `${meta.name} · ${meta.arabic}`,
		subtitle: `Verse ${v.n} of ${verses.length} · Juz ${meta.juz}`,
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4 rounded-r20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: "ink",
							children: [
								surah,
								":",
								v.n
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[13px] font-black uppercase",
								children: "Tajweed"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: tajweed,
								onChange: setTajweed,
								label: "Tajweed colouring"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						lang: "ar",
						dir: "rtl",
						className: "arabic mt-4 min-h-24 text-center text-[32px] leading-[2]",
						children: view === "hidden" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[18px] font-semibold text-muted",
							children: "Recite from memory, then reveal"
						}) : renderVerse(v.arabic, view, tajweed)
					}),
					view === "hidden" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "outline",
						full: true,
						className: "mt-3",
						onClick: () => setView("visible"),
						children: "👁 Reveal the verse"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 border-t border-border/20 pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
							className: "text-[13px] font-bold text-ink2",
							children: v.translit
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[15px] font-semibold",
							children: v.translation
						})]
					}),
					tajweed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: TAJWEED_RULES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "brutal-sm rounded-rf px-2.5 py-1 text-[11px] font-black",
							style: { background: r.color },
							children: [
								r.name,
								" · ",
								r.note
							]
						}, r.name))
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Audio" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: playing ? "green" : "primary",
								onClick: () => setPlaying(!playing),
								children: playing ? "⏸ Pause" : "▶️ Play"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1 min-w-40",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
									value: speed,
									onChange: setSpeed,
									options: [
										{
											value: "0.75",
											label: "0.75×"
										},
										{
											value: "1",
											label: "1×"
										},
										{
											value: "1.5",
											label: "1.5×"
										}
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[13px] font-black uppercase",
									children: "Loop"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
									on: loop,
									onChange: setLoop,
									label: "Loop verse"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							"Al-Husary",
							"Al-Minshawi",
							"Al-Afasy"
						].map((sh) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setSheikh(sh),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: sheikh === sh ? "yellow" : "field",
								children: ["🎙 ", sh]
							})
						}, sh))
					}),
					playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mono mt-3 text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: [
							"Playing ",
							sheikh,
							" at ",
							speed,
							"× ",
							loop ? "· looping" : ""
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					variant: "green",
					size: "lg",
					full: true,
					onClick: () => respond(true),
					children: "Got it ✓"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					variant: "danger",
					size: "lg",
					full: true,
					onClick: () => respond(false),
					children: "Need practice 🔁"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mono mt-3 text-center text-[11px] font-bold tracking-widest text-ink2 uppercase",
				children: [
					reviewed.length,
					" of ",
					verses.length,
					" verses reviewed this session"
				]
			})
		]
	});
}
//#endregion
export { HifzSession as component };
