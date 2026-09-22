import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Mono, i as Btn, n as Avatar, o as Card, p as Pill, t as Arabic, y as cn } from "./kit-ZBxajPhE.mjs";
import { d as useFlow, u as useApp } from "./store-BMzoaAqa.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { t as FRIENDS } from "./social-FuLE4Yer.mjs";
import { n as questionsFor } from "./questions-B_nrrIxx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/duel-m8PQm00h.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** P10 Live Duel */
function LiveDuel() {
	const { flow, setFlow } = useFlow();
	const { s } = useApp();
	const navigate = useNavigate();
	const duel = flow.duel ?? {
		opponent: FRIENDS[0].id,
		topic: "hadith",
		rounds: 10
	};
	const friend = FRIENDS.find((f) => f.id === duel.opponent) ?? FRIENDS[0];
	const topic = topicById(duel.topic);
	const questions = (0, import_react.useMemo)(() => questionsFor(duel.topic, duel.rounds), [duel.topic, duel.rounds]);
	const [i, setI] = (0, import_react.useState)(0);
	const [mine, setMine] = (0, import_react.useState)(0);
	const [theirs, setTheirs] = (0, import_react.useState)(0);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [left, setLeft] = (0, import_react.useState)(15);
	const [oppAnswered, setOppAnswered] = (0, import_react.useState)(false);
	const q = questions[i];
	const revealed = picked !== null;
	(0, import_react.useEffect)(() => {
		if (revealed || left <= 0) return;
		const t = setTimeout(() => setLeft((l) => l - 1), 1e3);
		return () => clearTimeout(t);
	}, [left, revealed]);
	(0, import_react.useEffect)(() => {
		if (left > 0 || revealed) return;
		setPicked(-1);
	}, [left, revealed]);
	(0, import_react.useEffect)(() => {
		setOppAnswered(false);
		const delay = 2200 + Math.random() * 5200;
		const t = setTimeout(() => {
			setOppAnswered(true);
			if (Math.random() < .7) setTheirs((x) => x + 1);
		}, delay);
		return () => clearTimeout(t);
	}, [i]);
	const choose = (n) => {
		if (revealed) return;
		setPicked(n);
		if (n === q.answer) setMine((x) => x + 1);
	};
	const next = () => {
		if (i + 1 >= questions.length) {
			setFlow({ duelResult: {
				opponent: duel.opponent,
				topic: duel.topic,
				rounds: duel.rounds,
				mine,
				theirs
			} });
			navigate({ to: "/challenge/results" });
			return;
		}
		setI(i + 1);
		setPicked(null);
		setLeft(15);
	};
	const total = Math.max(1, mine + theirs);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "brutal-flat sticky top-0 z-20 border-x-0 border-t-0 bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-3xl px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: s.avatar,
								size: 36,
								ring: "yellow"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[20px] font-bold",
								children: mine
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "brutal-flat flex h-5 flex-1 overflow-hidden rounded-rf bg-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bg-yellow transition-[width] duration-500",
									style: { width: `${mine / total * 100}%` }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bg-green transition-[width] duration-500",
									style: { width: `${theirs / total * 100}%` }
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[20px] font-bold",
								children: theirs
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: friend.avatar,
								size: 36,
								ring: "green"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "yellow",
								children: [
									topic.icon,
									" ",
									topic.name
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "ink",
								children: [
									"Round ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: i + 1 }),
									"/",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, { children: questions.length })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("brutal-sm mono ml-auto rounded-rf px-2.5 py-1 text-[13px] font-bold", left <= 4 && !revealed ? "bg-pink" : "bg-field"),
								children: ["⏱ ", revealed ? "—" : `${left}s`]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-3xl px-4 pt-5 pb-32",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								emoji: friend.avatar,
								size: 28
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("text-[13px] font-bold", oppAnswered ? "text-green" : "text-ink2"),
								children: oppAnswered ? `${friend.name.split(" ")[0]} answered` : `${friend.name.split(" ")[0]} is thinking…`
							}),
							!oppAnswered ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "anim-float text-[15px]",
								children: "💭"
							}) : null
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
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[15px] font-bold",
							children: picked === q.answer ? "✅ Point to you." : `💡 Correct: ${q.options[q.answer]}`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[13px] font-semibold text-ink2",
							children: q.explanation
						})]
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
						children: !revealed ? "Answer to continue" : i + 1 >= questions.length ? "See duel result →" : "Next round →"
					})
				})
			})
		]
	});
}
//#endregion
export { LiveDuel as component };
