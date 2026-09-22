import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, f as Mono, h as SectionTitle, i as Btn, o as Card, p as Pill, u as Input, y as cn } from "./kit-ZBxajPhE.mjs";
import { a as ILMBOT_ANSWERS, o as ILMBOT_SUGGESTIONS, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ilmbot-CZNNSYNH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var GREETING = {
	id: 0,
	role: "bot",
	text: "As-salamu alaykum. I'm IlmBot — a study companion, not a mufti. Ask me about Aqeedah, Hadith, Seerah, Quranic Arabic or how to structure your learning. For personal fiqh rulings I'll point you to a qualified scholar.",
	source: "IlmBot · scope notice"
};
var FALLBACK = {
	text: "I don't have a sourced answer for that yet. Try rephrasing it, or pick one of the suggested questions below — those are covered in depth. You can also search the Library, where every article is referenced.",
	source: "IlmBot · no matching reference"
};
/** L03 IlmBot Chat · L03b Answer with citation */
function IlmBot() {
	const { s, set, award } = useApp();
	const [msgs, setMsgs] = (0, import_react.useState)([GREETING]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [typing, setTyping] = (0, import_react.useState)(false);
	const endRef = (0, import_react.useRef)(null);
	const limit = s.premium ? Infinity : 10;
	const used = s.ilmbotUsed;
	const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [msgs, typing]);
	const ask = (question) => {
		const q = question.trim();
		if (!q || typing || remaining === 0) return;
		const id = Date.now();
		setMsgs((m) => [...m, {
			id,
			role: "user",
			text: q
		}]);
		setDraft("");
		setTyping(true);
		set({ ilmbotUsed: used + 1 });
		const lower = q.toLowerCase();
		const hit = ILMBOT_ANSWERS.find((a) => a.match.some((k) => lower.includes(k)));
		setTimeout(() => {
			setMsgs((m) => [...m, {
				id: id + 1,
				role: "bot",
				text: hit?.text ?? FALLBACK.text,
				source: hit?.source ?? FALLBACK.source
			}]);
			setTyping(false);
			if (hit) award(10, "hikmah", "IlmBot study question");
		}, 900);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "IlmBot",
		subtitle: "Sourced answers · not a fatwa service",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				tone: "field",
				className: "mb-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "ink",
							children: "🤖 Study companion"
						}),
						limit === Infinity ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "green",
							children: "Premium · unlimited questions"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
							tone: remaining > 3 ? "yellow" : "pink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: remaining }), " of 10 daily questions left"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							tone: "surface",
							children: "+10 Hikmah per sourced answer"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					msgs.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("flex", m.role === "user" ? "justify-end" : "justify-start"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("brutal max-w-[85%] rounded-r16 px-4 py-3", m.role === "user" ? "bg-yellow" : "bg-surface"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[15px] leading-relaxed font-semibold whitespace-pre-line",
								children: m.text
							}), m.source ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mono mt-2 border-t border-border/20 pt-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
								children: ["📖 ", m.source]
							}) : null]
						})
					}, m.id)),
					typing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-start",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "brutal rounded-r16 bg-surface px-4 py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mono text-[13px] font-bold text-ink2",
								children: "IlmBot is checking sources…"
							})
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Suggested questions" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: ILMBOT_SUGGESTIONS.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => ask(q),
						className: "press-sm text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "brutal-sm block rounded-r12 bg-field px-3 py-2 text-[13px] font-bold",
							children: q
						})
					}, q))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 flex flex-col gap-2 sm:flex-row",
				onSubmit: (e) => {
					e.preventDefault();
					ask(draft);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					placeholder: remaining === 0 ? "Daily limit reached — upgrade for unlimited" : "Ask about Aqeedah, Hadith, Seerah…",
					"aria-label": "Ask IlmBot a question",
					disabled: remaining === 0
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					type: "submit",
					size: "lg",
					disabled: !draft.trim() || typing || remaining === 0,
					children: "Ask →"
				})]
			}),
			remaining === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "pink",
				className: "mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-bold",
					children: "You've used today's 10 free questions."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/store",
						search: { item: "premium-week" },
						children: "Get unlimited with Premium"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/library",
						variant: "outline",
						children: "Read the Library instead"
					})]
				})]
			}) : null
		]
	});
}
//#endregion
export { IlmBot as component };
