import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { g as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, f as Mono, i as Btn, o as Card, p as Pill, t as Arabic, y as cn } from "./kit-ZBxajPhE.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { n as questionsFor } from "./questions-B_nrrIxx.mjs";
import { t as Route } from "./quiz-CKAujzlk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quiz-Cot65EFI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SECONDS = {
	beginner: 25,
	intermediate: 20,
	advanced: 15
};
/** P05 Question · P06 Answer Reveal · P06b Wrong Answer */
function QuizRunner() {
	const { topic, count, difficulty, quest } = Route.useSearch();
	const navigate = useNavigate();
	const t = topicById(topic);
	const limit = SECONDS[difficulty] ?? 20;
	const questions = (0, import_react.useMemo)(() => questionsFor(topic, count), [topic, count]);
	const [i, setI] = (0, import_react.useState)(0);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [revealed, setRevealed] = (0, import_react.useState)(false);
	const [score, setScore] = (0, import_react.useState)(0);
	const [penalty, setPenalty] = (0, import_react.useState)(0);
	const [left, setLeft] = (0, import_react.useState)(limit);
	const [elapsed, setElapsed] = (0, import_react.useState)(0);
	const q = questions[i];
	const isCorrect = picked === q.answer;
	(0, import_react.useEffect)(() => {
		const t2 = setInterval(() => setElapsed((e) => e + 1), 1e3);
		return () => clearInterval(t2);
	}, []);
	(0, import_react.useEffect)(() => {
		if (revealed) return;
		if (left <= 0) {
			setPicked(-1);
			setRevealed(true);
			return;
		}
		const timer = setTimeout(() => setLeft((l) => l - 1), 1e3);
		return () => clearTimeout(timer);
	}, [left, revealed]);
	const choose = (n) => {
		if (revealed) return;
		setPicked(n);
		setRevealed(true);
		if (n === q.answer) setScore((sc) => sc + 1);
	};
	const skip = () => {
		setPenalty((p) => p + 5);
		setPicked(-1);
		setRevealed(true);
	};
	const advance = () => {
		if (i + 1 >= questions.length) {
			navigate({
				to: "/quiz/results",
				search: {
					topic,
					count,
					score,
					total: questions.length,
					seconds: elapsed,
					difficulty,
					penalty,
					quest
				}
			});
			return;
		}
		setI(i + 1);
		setPicked(null);
		setRevealed(false);
		setLeft(limit);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "brutal-flat sticky top-0 z-20 border-x-0 border-t-0 bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-3xl items-center gap-3 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/play",
							className: "brutal-sm press-sm grid h-9 w-9 place-items-center rounded-r8 bg-surface",
							"aria-label": "Quit quiz",
							children: "✕"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "brutal-flat h-3.5 w-full overflow-hidden rounded-rf bg-field",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-green transition-[width] duration-300",
									style: { width: `${(i + (revealed ? 1 : 0)) / questions.length * 100}%` }
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
							className: "text-[13px] font-bold",
							children: [
								i + 1,
								"/",
								questions.length
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: cn("brutal-sm mono rounded-rf px-2.5 py-1 text-[13px] font-bold", left <= 5 && !revealed ? "bg-pink" : "bg-field"),
							"aria-label": `${left} seconds left`,
							children: ["⏱ ", revealed ? "—" : `${left}s`]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-3xl px-4 pt-5 pb-32",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "yellow",
								children: [
									t.icon,
									" ",
									t.name
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "ink",
								children: difficulty
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "green",
								children: ["Score ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: score })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "rounded-r20",
						children: [q.arabic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
							size: "lg",
							children: q.arabic
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 text-[24px] leading-snug font-black",
							children: q.prompt
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid gap-2",
						children: q.options.map((o, n) => {
							const correct = revealed && n === q.answer;
							const wrong = revealed && n === picked && n !== q.answer;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => choose(n),
								disabled: revealed,
								"aria-pressed": picked === n,
								className: cn("brutal press flex min-h-11 items-center gap-3 rounded-r16 px-4 py-3.5 text-left text-[15px] font-bold", correct ? "bg-green text-surface" : wrong ? "bg-pink" : revealed ? "bg-field text-ink2" : "bg-surface"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("brutal-flat mono grid h-8 w-8 shrink-0 place-items-center rounded-rf text-[13px] font-bold", correct ? "bg-surface text-ink" : "bg-field"),
										children: String.fromCharCode(65 + n)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1",
										children: o
									}),
									correct ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": true,
										children: "✓"
									}) : null,
									wrong ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": true,
										children: "✕"
									}) : null
								]
							}, o);
						})
					}),
					revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						tone: isCorrect ? "green" : "pink",
						className: "anim-rise mt-4 rounded-r20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[28px]",
									"aria-hidden": true,
									children: isCorrect ? "✅" : picked === -1 ? "⏭️" : "💡"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-[20px] font-black",
									children: isCorrect ? "Correct — well done" : picked === -1 ? "Skipped — here's the answer" : "That's okay, here's why…"
								})]
							}),
							!isCorrect ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-[15px] font-black",
								children: ["Correct answer: ", q.options[q.answer]]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[15px] font-semibold",
								children: q.explanation
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "brutal-sm mt-3 rounded-r12 bg-surface p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arabic, {
									size: "md",
									children: q.sourceArabic
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
									className: "mt-1 block text-[11px] font-bold tracking-wide text-ink2 uppercase",
									children: q.source
								})]
							}),
							q.articleSlug ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/library/$slug",
								params: { slug: q.articleSlug },
								variant: "outline",
								size: "sm",
								className: "mt-3",
								children: "📚 Library: read more"
							}) : null
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "brutal-flat fixed bottom-0 w-full border-x-0 border-b-0 bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto flex max-w-3xl items-center gap-2 px-4 py-3",
					children: revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						size: "lg",
						full: true,
						onClick: advance,
						children: i + 1 >= questions.length ? "See results →" : "Next question →"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "outline",
						onClick: skip,
						children: "Skip · −5 XP"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						size: "lg",
						full: true,
						disabled: true,
						children: "Pick an answer"
					})] })
				})
			})
		]
	});
}
//#endregion
export { QuizRunner as component };
