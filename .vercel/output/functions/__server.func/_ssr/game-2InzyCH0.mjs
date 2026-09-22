import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, i as Btn, n as Avatar, o as Card, p as Pill, t as Arabic, y as cn } from "./kit-ZBxajPhE.mjs";
import { d as useFlow, i as HALAQAH_BOTS, u as useApp } from "./store-BMzoaAqa.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { n as questionsFor } from "./questions-B_nrrIxx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/game-2InzyCH0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** FM02 Live Game */
function LiveGame() {
	const { flow, setFlow } = useFlow();
	const { s } = useApp();
	const navigate = useNavigate();
	const room = flow.room ?? {
		code: "IQ-7F2K",
		topic: "seerah",
		rounds: 5,
		limit: 20,
		players: HALAQAH_BOTS.map((b) => b.id)
	};
	const topic = topicById(room.topic);
	const questions = (0, import_react.useMemo)(() => questionsFor(room.topic, room.rounds), [room.topic, room.rounds]);
	const bots = HALAQAH_BOTS.filter((b) => room.players.includes(b.id));
	const [i, setI] = (0, import_react.useState)(0);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [left, setLeft] = (0, import_react.useState)(room.limit);
	const [scores, setScores] = (0, import_react.useState)(() => ({
		me: 0,
		...Object.fromEntries(bots.map((b) => [b.id, 0]))
	}));
	const q = questions[i];
	const revealed = picked !== null || left <= 0;
	(0, import_react.useEffect)(() => {
		if (revealed) return;
		const t = setTimeout(() => setLeft((l) => l - 1), 1e3);
		return () => clearTimeout(t);
	}, [left, revealed]);
	const choose = (n) => {
		if (revealed) return;
		setPicked(n);
		setScores((sc) => {
			const next = { ...sc };
			if (n === q.answer) next.me += 1;
			bots.forEach((b) => {
				if (Math.random() < .62) next[b.id] += 1;
			});
			return next;
		});
	};
	const next = () => {
		if (i + 1 >= questions.length) {
			setFlow({ roomResult: {
				code: room.code,
				topic: room.topic,
				scores,
				players: room.players
			} });
			navigate({ to: "/halaqah/results" });
			return;
		}
		setI(i + 1);
		setPicked(null);
		setLeft(room.limit);
	};
	const ranked = [{
		id: "me",
		name: "You",
		avatar: s.avatar,
		score: scores.me
	}, ...bots.map((b) => ({
		id: b.id,
		name: b.name,
		avatar: b.avatar,
		score: scores[b.id] ?? 0
	}))].sort((a, b) => b.score - a.score);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "brutal-flat sticky top-0 z-20 border-x-0 border-t-0 bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-3xl px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "ink",
								children: room.code
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "yellow",
								children: [
									topic.icon,
									" ",
									topic.name
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: [
								"Q ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: i + 1 }),
								"/",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: questions.length })
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("brutal-sm mono ml-auto rounded-rf px-2.5 py-1 text-[13px] font-bold", left <= 5 && !revealed ? "bg-pink" : "bg-field"),
								children: ["⏱ ", revealed ? "—" : `${left}s`]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "no-scrollbar mt-2 flex gap-2 overflow-x-auto",
						children: ranked.map((p, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: cn("brutal-sm flex shrink-0 items-center gap-2 rounded-rf px-2 py-1", idx === 0 ? "bg-yellow" : "bg-field"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": true,
									children: p.avatar
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[13px] font-black",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
									className: "text-[13px] font-bold",
									children: p.score
								})
							]
						}, p.id))
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-3xl px-4 pt-5 pb-32",
				children: [
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
						className: "mt-3 grid gap-2 sm:grid-cols-2",
						children: q.options.map((o, n) => {
							const correct = revealed && n === q.answer;
							const wrong = revealed && n === picked && n !== q.answer;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => choose(n),
								disabled: revealed,
								className: cn("brutal press flex min-h-11 items-center gap-3 rounded-r16 px-4 py-3.5 text-left text-[15px] font-bold", correct ? "bg-green text-surface" : wrong ? "bg-pink" : revealed ? "bg-field text-ink2" : "bg-surface"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "brutal-flat mono grid h-8 w-8 shrink-0 place-items-center rounded-rf bg-field text-[13px] font-bold",
									children: String.fromCharCode(65 + n)
								}), o]
							}, o);
						})
					}),
					revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						tone: picked === q.answer ? "green" : "pink",
						className: "anim-rise mt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[15px] font-bold",
								children: picked === q.answer ? "✅ Correct" : `💡 Correct answer: ${q.options[q.answer]}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[13px] font-semibold text-ink2",
								children: q.explanation
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: bots.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "brutal-sm rounded-rf bg-surface px-2 py-1 text-[11px] font-black",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
											emoji: b.avatar,
											size: 18
										}),
										" ",
										b.name,
										": ",
										scores[b.id] ?? 0
									]
								}, b.id))
							})
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "brutal-flat fixed bottom-0 w-full border-x-0 border-b-0 bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-3xl px-4 py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						size: "lg",
						full: true,
						disabled: !revealed,
						onClick: next,
						children: i + 1 >= questions.length ? "Final podium →" : "Next question →"
					})
				})
			})
		]
	});
}
//#endregion
export { LiveGame as component };
