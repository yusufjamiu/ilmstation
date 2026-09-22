import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Stat, a as BtnLink, f as Mono, h as SectionTitle, i as Btn, o as Card, p as Pill, r as Bar, s as Confetti } from "./kit-ZBxajPhE.mjs";
import { n as BADGES, u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as topicById } from "./topics-_n1jadKH.mjs";
import { n as questById } from "./quests-BRY7yFVm.mjs";
import { t as BadgeUnlock } from "./BadgeUnlock-DexqAwUt.mjs";
import { t as Route } from "./results-BiIrIVOb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/results-DiIT7ODe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MULT = {
	beginner: 1,
	intermediate: 1.5,
	advanced: 2
};
/** P07 Quiz Results · P07u Badge Unlock */
function QuizResults() {
	const { topic, score, total, seconds, penalty = 0, difficulty, quest } = Route.useSearch();
	const { award, unlock, set, s, completeStage } = useApp();
	const navigate = useNavigate();
	const t = topicById(topic);
	const q = quest ? questById(quest) : void 0;
	const accuracy = total ? score / total : 0;
	const mult = MULT[difficulty] ?? 1.5;
	const base = Math.round(score * 8 * mult);
	const perfect = score === total && total > 0;
	const xp = Math.max(0, base + (perfect ? 20 : 0) - penalty);
	const [badge, setBadge] = (0, import_react.useState)(null);
	const [applied, setApplied] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (applied) return;
		setApplied(true);
		award(xp, "ilm", `${t.name} quiz — ${score}/${total}`);
		set({
			quizzesPlayed: s.quizzesPlayed + 1,
			perfectQuizzes: s.perfectQuizzes + (perfect ? 1 : 0)
		});
		if (quest) completeStage(quest, Math.min(3, (s.questStages[quest] ?? 0) + 1));
		if (perfect && unlock("light")) setBadge("light");
		else if (s.xp + xp >= 1e3 && unlock("seal")) setBadge("seal");
	}, [applied]);
	const shareLine = `I scored ${score}/${total} (${Math.round(accuracy * 100)}%) on ${t.name} in IlmStation and earned ${xp} XP.`;
	const [copied, setCopied] = (0, import_react.useState)(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(shareLine);
			setCopied(true);
			setTimeout(() => setCopied(false), 2e3);
		} catch {
			setCopied(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: perfect ? "Perfect score!" : "Quiz complete",
		children: [
			perfect ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Confetti, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: accuracy >= .6 ? "green" : "pink",
				className: "rounded-r24 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[56px]",
						"aria-hidden": true,
						children: perfect ? "🏆" : accuracy >= .6 ? "🎉" : "📚"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
						className: "mt-1 block text-[44px] leading-none font-bold",
						children: [
							score,
							"/",
							total
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-[18px] font-black",
						children: [
							Math.round(accuracy * 100),
							"% accuracy · ",
							t.name
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap justify-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "ink",
								children: [
									"+",
									xp,
									" XP"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "surface",
								children: [
									difficulty,
									" · ",
									mult,
									"×"
								]
							}),
							perfect ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "yellow",
								children: "+20 perfect bonus"
							}) : null,
							penalty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "surface",
								children: [
									"−",
									penalty,
									" skipped"
								]
							}) : null
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Correct",
						value: score,
						icon: "✓",
						tone: "green"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Missed",
						value: total - score,
						icon: "✕"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Time",
						value: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "XP earned",
						value: `+${xp}`,
						tone: "yellow"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Topic breakdown" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex justify-between text-[13px] font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							t.icon,
							" ",
							t.name
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, { children: [Math.round(accuracy * 100), "%"] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						value: accuracy,
						tone: accuracy >= .75 ? "green" : "yellow",
						label: t.name
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[13px] font-semibold text-ink2",
						children: accuracy >= .75 ? "Strong. This topic will move down your remediation priority." : "Below 75% — expect this topic to reappear in your Daily Quest for reinforcement."
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Share your score" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							variant: "outline",
							size: "sm",
							onClick: copy,
							children: copied ? "✓ Copied" : "🔗 Copy result"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/share",
							search: { kind: "score" },
							variant: "outline",
							size: "sm",
							children: "🖼 Share card"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareLine)}`,
							target: "_blank",
							rel: "noreferrer",
							className: "brutal press-sm inline-flex min-h-11 items-center rounded-r8 bg-surface px-3 py-1.5 text-[13px] font-extrabold",
							children: "𝕏 Post"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					size: "lg",
					full: true,
					onClick: () => navigate({
						to: "/quiz",
						search: {
							topic,
							count: total,
							difficulty,
							quest
						}
					}),
					children: "Play again"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
					to: q ? "/quests" : "/home",
					variant: "outline",
					size: "lg",
					full: true,
					children: q ? "Back to Quest Map" : "Next quest →"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeUnlock, {
				badge: badge ? BADGES.find((b) => b.id === badge) ?? null : null,
				onClose: () => setBadge(null)
			})
		]
	});
}
//#endregion
export { QuizResults as component };
