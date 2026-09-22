import { n as require_jsx_runtime, t as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as FlowProvider, t as AppProvider } from "./store-BMzoaAqa.mjs";
import { t as Route$46 } from "../_friendId-DUlvgDAN.mjs";
import { t as Route$47 } from "../_questId-BRGmsK6H.mjs";
import { t as Route$48 } from "../_slug-4Hox36u_.mjs";
import { t as Route$49 } from "./complete-8bsenifR.mjs";
import { t as Route$50 } from "./complete-Dnv5F13C.mjs";
import { t as Route$51 } from "./difficulty-4lWZ3P-K.mjs";
import { t as Route$52 } from "./lobby-CxFWm2nw.mjs";
import { t as Route$53 } from "./quiz-CKAujzlk.mjs";
import { t as Route$54 } from "./password-_aOL9JaT.mjs";
import { t as Route$55 } from "./results-BiIrIVOb.mjs";
import { t as Route$56 } from "./share-BVo0JkHL.mjs";
import { t as Route$57 } from "./store-ZMnVzFJv.mjs";
import { t as Route$58 } from "./setup-HHSHsOV0.mjs";
import { t as Route$59 } from "./session-D7i0qvkG.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CFJw8zuY.js
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-C1LFqq8W.css";
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid-paper flex min-h-screen items-center justify-center bg-page px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "brutal-lg max-w-md rounded-r24 bg-surface p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[64px]",
					"aria-hidden": true,
					children: "☪"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mono text-[44px] font-bold",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 text-[24px] font-black",
					children: "This path isn't on the map"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[15px] text-ink2",
					children: "The screen you're looking for doesn't exist or has moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/home",
					className: "brutal press mt-6 inline-flex min-h-11 items-center justify-center rounded-r12 bg-yellow px-5 py-3 text-[15px] font-extrabold",
					children: "Back to Home"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid-paper flex min-h-screen items-center justify-center bg-page px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "brutal-lg max-w-md rounded-r24 bg-surface p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[56px]",
					"aria-hidden": true,
					children: "⚠️"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-[24px] font-black",
					children: "Something broke the chain"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[15px] text-ink2",
					children: "This screen didn't load. Try again, or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "brutal press inline-flex min-h-11 items-center rounded-r12 bg-yellow px-5 py-3 text-[15px] font-extrabold",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/home",
						className: "brutal press inline-flex min-h-11 items-center rounded-r12 bg-surface px-5 py-3 text-[15px] font-extrabold",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$45 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "IlmStation — Gamified Islamic Learning" },
			{
				name: "description",
				content: "IlmStation turns Islamic learning into a daily habit: quests, streaks, Hifz mode, duels and Sadaqah rewards."
			},
			{
				name: "author",
				content: "IlmStation"
			},
			{
				property: "og:title",
				content: "IlmStation — Gamified Islamic Learning"
			},
			{
				property: "og:description",
				content: "Seek · Learn · Grow. A daily Islamic learning system built around streaks and quests."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "theme-color",
				content: "#F5C842"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&family=Amiri:wght@400;700&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$45.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) })
	});
}
var $$splitComponentImporter$44 = () => import("./routes-BBeEJwDH.mjs");
var Route$44 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "IlmStation — Seek · Learn · Grow" },
		{
			name: "description",
			content: "Start your IlmStation: gamified Islamic learning with daily quests, streaks, Hifz mode and friend duels."
		},
		{
			property: "og:title",
			content: "IlmStation — Seek · Learn · Grow"
		},
		{
			property: "og:description",
			content: "Gamified Islamic learning. Daily quests, streaks, Hifz mode, duels and Sadaqah."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$44, "component")
});
/** S01 Splash — brand moment, then route by onboarding state. */
var $$splitComponentImporter$43 = () => import("./achievements-Dor0P0X-.mjs");
var Route$43 = createFileRoute("/achievements")({
	head: () => ({ meta: [
		{ title: "Achievements — eight Islamic badges — IlmStation" },
		{
			name: "description",
			content: "Track every badge, its Arabic name, unlock condition and how close you are."
		},
		{
			property: "og:title",
			content: "Achievements — IlmStation"
		},
		{
			property: "og:description",
			content: "Badges with meaning, not just points."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$43, "component")
});
/** Q05 Achievements */
var $$splitComponentImporter$42 = () => import("./bookmarks-pOHmYqhh.mjs");
var Route$42 = createFileRoute("/bookmarks")({
	head: () => ({ meta: [
		{ title: "Bookmarks — your saved articles and narrations — IlmStation" },
		{
			name: "description",
			content: "Everything you saved from the Library and Daily Wisdom, in one place."
		},
		{
			property: "og:title",
			content: "Bookmarks — IlmStation"
		},
		{
			property: "og:description",
			content: "Saved for revision."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$42, "component")
});
/** L05 Bookmarks */
var $$splitComponentImporter$41 = () => import("./error-D6Dn1ZPr.mjs");
var Route$41 = createFileRoute("/error")({
	head: () => ({ meta: [
		{ title: "Something went wrong — IlmStation" },
		{
			name: "description",
			content: "A friendly error screen with a retry, a way home and a report option."
		},
		{
			property: "og:title",
			content: "Something went wrong — IlmStation"
		},
		{
			property: "og:description",
			content: "Your progress is safe."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$41, "component")
});
/** SY02 Error State */
var $$splitComponentImporter$40 = () => import("./home-BBV07r3o.mjs");
var Route$40 = createFileRoute("/home")({
	head: () => ({ meta: [
		{ title: "Home — IlmStation" },
		{
			name: "description",
			content: "Your daily Islamic learning home: today's quest, progress, play modes and wisdom."
		},
		{
			property: "og:title",
			content: "Home — IlmStation"
		},
		{
			property: "og:description",
			content: "Continue your daily learning journey."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$40, "component")
});
var $$splitComponentImporter$39 = () => import("./ilmbot-CZNNSYNH.mjs");
var Route$39 = createFileRoute("/ilmbot")({
	head: () => ({ meta: [
		{ title: "IlmBot — ask about Islam, with sources — IlmStation" },
		{
			name: "description",
			content: "A study companion that answers with citations and refers fiqh rulings to qualified scholars."
		},
		{
			property: "og:title",
			content: "IlmBot — IlmStation"
		},
		{
			property: "og:description",
			content: "Every answer carries its source."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$39, "component")
});
/** L03 IlmBot Chat · L03b Answer with citation */
var $$splitComponentImporter$38 = () => import("./leaderboard-BbtfDLdz.mjs");
var Route$38 = createFileRoute("/leaderboard")({
	head: () => ({ meta: [
		{ title: "Leaderboard — friends, global and local — IlmStation" },
		{
			name: "description",
			content: "Weekly and all-time rankings across friends, your city and the world."
		},
		{
			property: "og:title",
			content: "Leaderboard — IlmStation"
		},
		{
			property: "og:description",
			content: "Compete gently, learn seriously."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$38, "component")
});
/** S03 Leaderboard */
var $$splitComponentImporter$37 = () => import("./notifications-BexNfz4C.mjs");
var Route$37 = createFileRoute("/notifications")({
	head: () => ({ meta: [
		{ title: "Notifications — IlmStation" },
		{
			name: "description",
			content: "Challenge invites, friend activity, badge unlocks and streak reminders."
		},
		{
			property: "og:title",
			content: "Notifications — IlmStation"
		},
		{
			property: "og:description",
			content: "Everything that happened while you were away."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$37, "component")
});
/** H04 Notifications */
var $$splitComponentImporter$36 = () => import("./offline-CltUFBv6.mjs");
var Route$36 = createFileRoute("/offline")({
	head: () => ({ meta: [
		{ title: "You're offline — IlmStation" },
		{
			name: "description",
			content: "What still works without a connection, and what syncs when you're back online."
		},
		{
			property: "og:title",
			content: "You're offline — IlmStation"
		},
		{
			property: "og:description",
			content: "Saved quizzes and articles keep working."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$36, "component")
});
/** SY01 Offline State */
var $$splitComponentImporter$35 = () => import("./profile-CnOL3OIv.mjs");
var Route$35 = createFileRoute("/profile")({
	head: () => ({ meta: [
		{ title: "My Profile — level, badges and stats — IlmStation" },
		{
			name: "description",
			content: "Your level, XP, streak, badges, favourite topics and friends — all editable."
		},
		{
			property: "og:title",
			content: "My Profile — IlmStation"
		},
		{
			property: "og:description",
			content: "Your learning identity in IlmStation."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$35, "component")
});
/** S01 My Profile · S01b Edit Profile */
var $$splitComponentImporter$34 = () => import("./progress-DwWN-fkM.mjs");
var Route$34 = createFileRoute("/progress")({
	head: () => ({ meta: [
		{ title: "My Progress — XP, accuracy and topic mastery — IlmStation" },
		{
			name: "description",
			content: "Weekly XP chart, accuracy per topic, level ladder and your strongest and weakest areas."
		},
		{
			property: "og:title",
			content: "My Progress — IlmStation"
		},
		{
			property: "og:description",
			content: "See exactly where you're strong and where to revise."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$34, "component")
});
/** Q04 My Progress */
var $$splitComponentImporter$33 = () => import("./quiz-DYfq8PzL.mjs");
var Route$33 = createFileRoute("/quiz")({
	head: () => ({ meta: [
		{ title: "Quiz — IlmStation" },
		{
			name: "description",
			content: "Test your Islamic knowledge with a focused IlmStation quiz."
		},
		{
			property: "og:title",
			content: "Quiz — IlmStation"
		},
		{
			property: "og:description",
			content: "A focused Islamic learning quiz."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./ramadan-CKSskiQ3.mjs");
var Route$32 = createFileRoute("/ramadan")({
	head: () => ({ meta: [
		{ title: "Ramadan Mode — 30 daily quests — IlmStation" },
		{
			name: "description",
			content: "A themed quest for each day of Ramadan, a Tarawih tracker and a Laylatul Qadr countdown."
		},
		{
			property: "og:title",
			content: "Ramadan Mode — IlmStation"
		},
		{
			property: "og:description",
			content: "Thirty days, thirty themed quests."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$32, "component")
});
/** R01 Ramadan Mode */
var $$splitComponentImporter$31 = () => import("./settings-x47nMLoi.mjs");
var Route$31 = createFileRoute("/settings")({
	head: () => ({ meta: [
		{ title: "Settings — language, notifications and accessibility — IlmStation" },
		{
			name: "description",
			content: "Control theme, language, reminders, sound, motion, text size, Premium and your data."
		},
		{
			property: "og:title",
			content: "Settings — IlmStation"
		},
		{
			property: "og:description",
			content: "Everything is stored on your device."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
/** S07 Settings */
var $$splitComponentImporter$30 = () => import("./wallet-BxV0alQN.mjs");
var Route$30 = createFileRoute("/wallet")({
	head: () => ({ meta: [
		{ title: "Points Wallet — four kinds of reward — IlmStation" },
		{
			name: "description",
			content: "Ajr, Ilm, Noor and Hikmah points with a full transaction history."
		},
		{
			property: "og:title",
			content: "Points Wallet — IlmStation"
		},
		{
			property: "og:description",
			content: "Every point you earned, and where it came from."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
/** Q06 Points Wallet */
var $$splitComponentImporter$29 = () => import("./wisdom-Bk2qX6z0.mjs");
var Route$29 = createFileRoute("/wisdom")({
	head: () => ({ meta: [
		{ title: "Daily Wisdom — a sourced Hadith or Ayah each day — IlmStation" },
		{
			name: "description",
			content: "Today's Hadith or Ayah with Arabic, transliteration, translation and reference, plus the full archive."
		},
		{
			property: "og:title",
			content: "Daily Wisdom — IlmStation"
		},
		{
			property: "og:description",
			content: "One verse or narration a day, always cited."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
/** L04 Daily Wisdom · L04b Wisdom Archive */
var $$splitComponentImporter$28 = () => import("./duel-m8PQm00h.mjs");
var Route$28 = createFileRoute("/challenge/duel")({
	head: () => ({ meta: [
		{ title: "Live duel — IlmStation" },
		{
			name: "description",
			content: "Split-screen head-to-head quiz with a live score bar."
		},
		{
			property: "og:title",
			content: "Live duel — IlmStation"
		},
		{
			property: "og:description",
			content: "Answer faster, score higher."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
/** P10 Live Duel */
var $$splitComponentImporter$27 = () => import("./results-8DMnZE6z.mjs");
var Route$27 = createFileRoute("/challenge/results")({
	head: () => ({ meta: [
		{ title: "Duel results — IlmStation" },
		{
			name: "description",
			content: "Win, loss or draw — with your updated head-to-head record and a rematch option."
		},
		{
			property: "og:title",
			content: "Duel results — IlmStation"
		},
		{
			property: "og:description",
			content: "Winner takes a 50% XP bonus."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
/** P11 Duel Results */
var $$splitComponentImporter$26 = () => import("./waiting-BivX5GSs.mjs");
var Route$26 = createFileRoute("/challenge/waiting")({
	head: () => ({ meta: [
		{ title: "Waiting room — IlmStation" },
		{
			name: "description",
			content: "Your duel invite is pending. It expires in 24 hours."
		},
		{
			property: "og:title",
			content: "Waiting room — IlmStation"
		},
		{
			property: "og:description",
			content: "Waiting for your opponent to accept."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
/** P09 Waiting Room */
var $$splitComponentImporter$25 = () => import("./friends-IEZycSrm.mjs");
var Route$25 = createFileRoute("/friends/")({
	head: () => ({ meta: [
		{ title: "Friends — study together — IlmStation" },
		{
			name: "description",
			content: "Your friends list, pending requests and suggestions, with challenge shortcuts."
		},
		{
			property: "og:title",
			content: "Friends — IlmStation"
		},
		{
			property: "og:description",
			content: "Learn alongside people you know."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
/** S04 Friends List · S05 Find Friends */
var $$splitComponentImporter$24 = () => import("./halaqah-C-6bF3Dq.mjs");
var Route$24 = createFileRoute("/halaqah/")({
	head: () => ({ meta: [
		{ title: "Halaqah — create a room — IlmStation" },
		{
			name: "description",
			content: "Host a live Islamic quiz room for up to six players with a shareable room code."
		},
		{
			property: "og:title",
			content: "Halaqah — IlmStation"
		},
		{
			property: "og:description",
			content: "Family and study-circle mode, up to 6 players."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
/** FM01 Create Room */
var $$splitComponentImporter$23 = () => import("./game-2InzyCH0.mjs");
var Route$23 = createFileRoute("/halaqah/game")({
	head: () => ({ meta: [
		{ title: "Halaqah live game — IlmStation" },
		{
			name: "description",
			content: "Everyone answers the same question at once, with a live leaderboard."
		},
		{
			property: "og:title",
			content: "Halaqah live game — IlmStation"
		},
		{
			property: "og:description",
			content: "Six players, one question at a time."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
/** FM02 Live Game */
var $$splitComponentImporter$22 = () => import("./results-Dob5kc-a.mjs");
var Route$22 = createFileRoute("/halaqah/results")({
	head: () => ({ meta: [
		{ title: "Halaqah results — IlmStation" },
		{
			name: "description",
			content: "The final podium, every player's score and a group share card."
		},
		{
			property: "og:title",
			content: "Halaqah results — IlmStation"
		},
		{
			property: "og:description",
			content: "Who topped the circle?"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
/** FM03 Family Results */
var $$splitComponentImporter$21 = () => import("./hifz-UdJnwzPw.mjs");
var Route$21 = createFileRoute("/hifz/")({
	head: () => ({ meta: [
		{ title: "Hifz Mode — choose a Surah — IlmStation" },
		{
			name: "description",
			content: "Memorise Quran with four view modes, Tajweed colouring and spaced repetition."
		},
		{
			property: "og:title",
			content: "Hifz Mode — IlmStation"
		},
		{
			property: "og:description",
			content: "Listen, read, recite, test."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
/** P18 Select Surah */
var $$splitComponentImporter$20 = () => import("./review-C_lw8bCG.mjs");
var Route$20 = createFileRoute("/hifz/review")({
	head: () => ({ meta: [
		{ title: "Hifz review queue — IlmStation" },
		{
			name: "description",
			content: "Verses due for review, ordered by the spaced repetition algorithm."
		},
		{
			property: "og:title",
			content: "Hifz review queue — IlmStation"
		},
		{
			property: "og:description",
			content: "Review beats re-memorising."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
/** P20 Session Review */
var $$splitComponentImporter$19 = () => import("./quest-Bn565pOO.mjs");
var Route$19 = createFileRoute("/home/quest")({
	head: () => ({ meta: [
		{ title: "Today's Daily Quest — IlmStation" },
		{
			name: "description",
			content: "The full brief for today's quest: stages, topics, rewards and your stats."
		},
		{
			property: "og:title",
			content: "Today's Daily Quest — IlmStation"
		},
		{
			property: "og:description",
			content: "10 questions, 5 minutes, +80 XP."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
/** H02 Daily Quest Expanded */
var $$splitComponentImporter$18 = () => import("./library-TX6VJ8HQ.mjs");
var Route$18 = createFileRoute("/library/")({
	head: () => ({ meta: [
		{ title: "Library — referenced Islamic reading — IlmStation" },
		{
			name: "description",
			content: "Short, sourced articles on Aqeedah, Hadith, Seerah, Fiqh, Quran and Arabic — every claim referenced."
		},
		{
			property: "og:title",
			content: "Library — IlmStation"
		},
		{
			property: "og:description",
			content: "Read it, then quiz yourself on it."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
/** L01 Library Home */
var $$splitComponentImporter$17 = () => import("./assessment-jJSDjsW9.mjs");
var Route$17 = createFileRoute("/onboarding/assessment")({
	head: () => ({ meta: [
		{ title: "Quick assessment — IlmStation" },
		{
			name: "description",
			content: "Three questions to calibrate your starting difficulty."
		},
		{
			property: "og:title",
			content: "Quick assessment — IlmStation"
		},
		{
			property: "og:description",
			content: "Three questions, no pressure."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
/** S17 Assessment */
var $$splitComponentImporter$16 = () => import("./avatar-BmrTPQ4E.mjs");
var Route$16 = createFileRoute("/onboarding/avatar")({
	head: () => ({ meta: [
		{ title: "Pick your avatar — IlmStation" },
		{
			name: "description",
			content: "Choose one of eight IlmStation avatars or upload your own picture."
		},
		{
			property: "og:title",
			content: "Pick your avatar — IlmStation"
		},
		{
			property: "og:description",
			content: "Your face on the leaderboard."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
/** S08 Profile Picture */
var $$splitComponentImporter$15 = () => import("./carousel-DLi-SOeD.mjs");
var Route$15 = createFileRoute("/onboarding/carousel")({
	head: () => ({ meta: [
		{ title: "Learn, Play, Grow — IlmStation" },
		{
			name: "description",
			content: "Three reasons IlmStation makes Islamic learning a daily habit."
		},
		{
			property: "og:title",
			content: "Learn, Play, Grow — IlmStation"
		},
		{
			property: "og:description",
			content: "Curriculum-grade Islamic content wrapped in game mechanics."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
/** S03 Value Carousel */
var $$splitComponentImporter$14 = () => import("./check-email-5fI2MPNq.mjs");
var Route$14 = createFileRoute("/onboarding/check-email")({
	head: () => ({ meta: [
		{ title: "Check your email — IlmStation" },
		{
			name: "description",
			content: "We sent you a password reset link. Open your email app to continue."
		},
		{
			property: "og:title",
			content: "Check your email — IlmStation"
		},
		{
			property: "og:description",
			content: "Reset link sent."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
/** S12 Check Email */
var $$splitComponentImporter$13 = () => import("./dob-pmLwdaya.mjs");
var Route$13 = createFileRoute("/onboarding/dob")({
	head: () => ({ meta: [
		{ title: "Date of birth — IlmStation" },
		{
			name: "description",
			content: "Your age sets the tone and difficulty of your IlmStation content."
		},
		{
			property: "og:title",
			content: "Date of birth — IlmStation"
		},
		{
			property: "og:description",
			content: "Age gate with a scrolling picker."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
/** S07 Date of Birth */
var $$splitComponentImporter$12 = () => import("./forgot-C-qsHVJN.mjs");
var Route$12 = createFileRoute("/onboarding/forgot")({
	head: () => ({ meta: [
		{ title: "Forgot password — IlmStation" },
		{
			name: "description",
			content: "Enter your email address and we'll send a reset link."
		},
		{
			property: "og:title",
			content: "Forgot password — IlmStation"
		},
		{
			property: "og:description",
			content: "Reset your IlmStation password."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
/** S11 Forgot Password */
var $$splitComponentImporter$11 = () => import("./gateway-BXzY17s7.mjs");
var Route$11 = createFileRoute("/onboarding/gateway")({
	head: () => ({ meta: [
		{ title: "Sign up or log in — IlmStation" },
		{
			name: "description",
			content: "Create your IlmStation account or continue with Google or Apple."
		},
		{
			property: "og:title",
			content: "Sign up or log in — IlmStation"
		},
		{
			property: "og:description",
			content: "Two taps to start your first quest."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
/** S04 Gateway */
var $$splitComponentImporter$10 = () => import("./interests-PXSSNleS.mjs");
var Route$10 = createFileRoute("/onboarding/interests")({
	head: () => ({ meta: [
		{ title: "Choose your interests — IlmStation" },
		{
			name: "description",
			content: "Pick the Islamic topics that seed your Quest Map and Daily Quest."
		},
		{
			property: "og:title",
			content: "Choose your interests — IlmStation"
		},
		{
			property: "og:description",
			content: "Eight topics: Aqeedah to Dua."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
/** S16 Interests */
var $$splitComponentImporter$9 = () => import("./language-BE53JoFj.mjs");
var Route$9 = createFileRoute("/onboarding/language")({
	head: () => ({ meta: [
		{ title: "Choose your language — IlmStation" },
		{
			name: "description",
			content: "Pick from English, Arabic, Urdu, Bahasa Melayu, French or Hausa."
		},
		{
			property: "og:title",
			content: "Choose your language — IlmStation"
		},
		{
			property: "og:description",
			content: "IlmStation speaks six languages at launch."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
/** S02 Language Select */
var $$splitComponentImporter$8 = () => import("./login-jvrD4WQy.mjs");
var Route$8 = createFileRoute("/onboarding/login")({
	head: () => ({ meta: [
		{ title: "Log in — IlmStation" },
		{
			name: "description",
			content: "Welcome back. Log in to continue your streak and quests."
		},
		{
			property: "og:title",
			content: "Log in — IlmStation"
		},
		{
			property: "og:description",
			content: "Pick up your streak where you left it."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
/** S10 Log In */
var $$splitComponentImporter$7 = () => import("./reset-N27pWVOE.mjs");
var Route$7 = createFileRoute("/onboarding/reset")({
	head: () => ({ meta: [
		{ title: "Set a new password — IlmStation" },
		{
			name: "description",
			content: "Choose a new password for your IlmStation account."
		},
		{
			property: "og:title",
			content: "Set a new password — IlmStation"
		},
		{
			property: "og:description",
			content: "New password, same streak."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
/** S13 Reset Password */
var $$splitComponentImporter$6 = () => import("./signup-B0kCkl8n.mjs");
var Route$6 = createFileRoute("/onboarding/signup")({
	head: () => ({ meta: [
		{ title: "Create your account — IlmStation" },
		{
			name: "description",
			content: "Enter your name and email to create your IlmStation account."
		},
		{
			property: "og:title",
			content: "Create your account — IlmStation"
		},
		{
			property: "og:description",
			content: "Name and email — that's all we need to begin."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
/** S05 Name & Email */
var $$splitComponentImporter$5 = () => import("./verify-DapeWTtd.mjs");
var Route$5 = createFileRoute("/onboarding/verify")({
	head: () => ({ meta: [
		{ title: "Verify your email — IlmStation" },
		{
			name: "description",
			content: "Enter the 6-digit code sent to your email to verify your IlmStation account."
		},
		{
			property: "og:title",
			content: "Verify your email — IlmStation"
		},
		{
			property: "og:description",
			content: "Six digits and you're in."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
/** S09 Email Verify */
var $$splitComponentImporter$4 = () => import("./welcome-CM_Yg4I6.mjs");
var Route$4 = createFileRoute("/onboarding/welcome")({
	head: () => ({ meta: [
		{ title: "Welcome to IlmStation — +50 XP" },
		{
			name: "description",
			content: "Your welcome bonus is here. Begin your first quest."
		},
		{
			property: "og:title",
			content: "Welcome to IlmStation — +50 XP"
		},
		{
			property: "og:description",
			content: "Assalamu Alaykum. Your first quest is ready."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
/** S18 Welcome */
var $$splitComponentImporter$3 = () => import("./zone-BVWTsOQu.mjs");
var Route$3 = createFileRoute("/onboarding/zone")({
	head: () => ({ meta: [
		{ title: "Pick your zone — IlmStation" },
		{
			name: "description",
			content: "Your age zone sets your content difficulty and the tone of the app."
		},
		{
			property: "og:title",
			content: "Pick your zone — IlmStation"
		},
		{
			property: "og:description",
			content: "Three zones: 13–17, 18–25, 26–35."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
/** S15 Zone Select */
var $$splitComponentImporter$2 = () => import("./play-BNLvGezT.mjs");
var Route$2 = createFileRoute("/play/")({
	head: () => ({ meta: [
		{ title: "Play Hub — IlmStation" },
		{
			name: "description",
			content: "Five ways to play: Daily Quest, Quick Quiz, Challenge, Hifz Mode and Halaqah."
		},
		{
			property: "og:title",
			content: "Play Hub — IlmStation"
		},
		{
			property: "og:description",
			content: "Pick a mode and earn XP."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
/** P01 Play Hub */
var $$splitComponentImporter$1 = () => import("./topics-COVELRgX.mjs");
var Route$1 = createFileRoute("/play/topics")({
	head: () => ({ meta: [
		{ title: "Browse topics — IlmStation" },
		{
			name: "description",
			content: "Eight Islamic topics from Aqeedah to Dua. Filter by category and start a quiz."
		},
		{
			property: "og:title",
			content: "Browse topics — IlmStation"
		},
		{
			property: "og:description",
			content: "Pick your topic, pick your difficulty."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
/** P02 Topic Browser */
var $$splitComponentImporter = () => import("./quests-Cj5VvdlD.mjs");
var Route = createFileRoute("/quests/")({
	head: () => ({ meta: [
		{ title: "Quest Map — a path through Islamic knowledge — IlmStation" },
		{
			name: "description",
			content: "Ten structured quests across five chapters, each with three stages and rising XP multipliers."
		},
		{
			property: "og:title",
			content: "Quest Map — IlmStation"
		},
		{
			property: "og:description",
			content: "Follow the path, chapter by chapter."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
/** Q01 Quest Map */
var IndexRoute = Route$44.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$45
});
var AchievementsRoute = Route$43.update({
	id: "/achievements",
	path: "/achievements",
	getParentRoute: () => Route$45
});
var BookmarksRoute = Route$42.update({
	id: "/bookmarks",
	path: "/bookmarks",
	getParentRoute: () => Route$45
});
var ErrorRoute = Route$41.update({
	id: "/error",
	path: "/error",
	getParentRoute: () => Route$45
});
var HomeRoute = Route$40.update({
	id: "/home",
	path: "/home",
	getParentRoute: () => Route$45
});
var IlmbotRoute = Route$39.update({
	id: "/ilmbot",
	path: "/ilmbot",
	getParentRoute: () => Route$45
});
var LeaderboardRoute = Route$38.update({
	id: "/leaderboard",
	path: "/leaderboard",
	getParentRoute: () => Route$45
});
var NotificationsRoute = Route$37.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => Route$45
});
var OfflineRoute = Route$36.update({
	id: "/offline",
	path: "/offline",
	getParentRoute: () => Route$45
});
var ProfileRoute = Route$35.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$45
});
var ProgressRoute = Route$34.update({
	id: "/progress",
	path: "/progress",
	getParentRoute: () => Route$45
});
var QuizRoute = Route$33.update({
	id: "/quiz",
	path: "/quiz",
	getParentRoute: () => Route$45
});
var RamadanRoute = Route$32.update({
	id: "/ramadan",
	path: "/ramadan",
	getParentRoute: () => Route$45
});
var SettingsRoute = Route$31.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$45
});
var ShareRoute = Route$56.update({
	id: "/share",
	path: "/share",
	getParentRoute: () => Route$45
});
var StoreRoute = Route$57.update({
	id: "/store",
	path: "/store",
	getParentRoute: () => Route$45
});
var WalletRoute = Route$30.update({
	id: "/wallet",
	path: "/wallet",
	getParentRoute: () => Route$45
});
var WisdomRoute = Route$29.update({
	id: "/wisdom",
	path: "/wisdom",
	getParentRoute: () => Route$45
});
var ChallengeDuelRoute = Route$28.update({
	id: "/challenge/duel",
	path: "/challenge/duel",
	getParentRoute: () => Route$45
});
var ChallengeResultsRoute = Route$27.update({
	id: "/challenge/results",
	path: "/challenge/results",
	getParentRoute: () => Route$45
});
var ChallengeSetupRoute = Route$58.update({
	id: "/challenge/setup",
	path: "/challenge/setup",
	getParentRoute: () => Route$45
});
var ChallengeWaitingRoute = Route$26.update({
	id: "/challenge/waiting",
	path: "/challenge/waiting",
	getParentRoute: () => Route$45
});
var FriendsIndexRoute = Route$25.update({
	id: "/friends/",
	path: "/friends/",
	getParentRoute: () => Route$45
});
var FriendsFriendIdRoute = Route$46.update({
	id: "/friends/$friendId",
	path: "/friends/$friendId",
	getParentRoute: () => Route$45
});
var HalaqahIndexRoute = Route$24.update({
	id: "/halaqah/",
	path: "/halaqah/",
	getParentRoute: () => Route$45
});
var HalaqahGameRoute = Route$23.update({
	id: "/halaqah/game",
	path: "/halaqah/game",
	getParentRoute: () => Route$45
});
var HalaqahResultsRoute = Route$22.update({
	id: "/halaqah/results",
	path: "/halaqah/results",
	getParentRoute: () => Route$45
});
var HifzIndexRoute = Route$21.update({
	id: "/hifz/",
	path: "/hifz/",
	getParentRoute: () => Route$45
});
var HifzCompleteRoute = Route$50.update({
	id: "/hifz/complete",
	path: "/hifz/complete",
	getParentRoute: () => Route$45
});
var HifzReviewRoute = Route$20.update({
	id: "/hifz/review",
	path: "/hifz/review",
	getParentRoute: () => Route$45
});
var HifzSessionRoute = Route$59.update({
	id: "/hifz/session",
	path: "/hifz/session",
	getParentRoute: () => Route$45
});
var HomeQuestRoute = Route$19.update({
	id: "/quest",
	path: "/quest",
	getParentRoute: () => HomeRoute
});
var LibraryIndexRoute = Route$18.update({
	id: "/library/",
	path: "/library/",
	getParentRoute: () => Route$45
});
var LibrarySlugRoute = Route$48.update({
	id: "/library/$slug",
	path: "/library/$slug",
	getParentRoute: () => Route$45
});
var OnboardingAssessmentRoute = Route$17.update({
	id: "/onboarding/assessment",
	path: "/onboarding/assessment",
	getParentRoute: () => Route$45
});
var OnboardingAvatarRoute = Route$16.update({
	id: "/onboarding/avatar",
	path: "/onboarding/avatar",
	getParentRoute: () => Route$45
});
var OnboardingCarouselRoute = Route$15.update({
	id: "/onboarding/carousel",
	path: "/onboarding/carousel",
	getParentRoute: () => Route$45
});
var OnboardingCheckEmailRoute = Route$14.update({
	id: "/onboarding/check-email",
	path: "/onboarding/check-email",
	getParentRoute: () => Route$45
});
var OnboardingDobRoute = Route$13.update({
	id: "/onboarding/dob",
	path: "/onboarding/dob",
	getParentRoute: () => Route$45
});
var OnboardingForgotRoute = Route$12.update({
	id: "/onboarding/forgot",
	path: "/onboarding/forgot",
	getParentRoute: () => Route$45
});
var OnboardingGatewayRoute = Route$11.update({
	id: "/onboarding/gateway",
	path: "/onboarding/gateway",
	getParentRoute: () => Route$45
});
var OnboardingInterestsRoute = Route$10.update({
	id: "/onboarding/interests",
	path: "/onboarding/interests",
	getParentRoute: () => Route$45
});
var OnboardingLanguageRoute = Route$9.update({
	id: "/onboarding/language",
	path: "/onboarding/language",
	getParentRoute: () => Route$45
});
var OnboardingLoginRoute = Route$8.update({
	id: "/onboarding/login",
	path: "/onboarding/login",
	getParentRoute: () => Route$45
});
var OnboardingPasswordRoute = Route$54.update({
	id: "/onboarding/password",
	path: "/onboarding/password",
	getParentRoute: () => Route$45
});
var OnboardingResetRoute = Route$7.update({
	id: "/onboarding/reset",
	path: "/onboarding/reset",
	getParentRoute: () => Route$45
});
var OnboardingSignupRoute = Route$6.update({
	id: "/onboarding/signup",
	path: "/onboarding/signup",
	getParentRoute: () => Route$45
});
var OnboardingVerifyRoute = Route$5.update({
	id: "/onboarding/verify",
	path: "/onboarding/verify",
	getParentRoute: () => Route$45
});
var OnboardingWelcomeRoute = Route$4.update({
	id: "/onboarding/welcome",
	path: "/onboarding/welcome",
	getParentRoute: () => Route$45
});
var OnboardingZoneRoute = Route$3.update({
	id: "/onboarding/zone",
	path: "/onboarding/zone",
	getParentRoute: () => Route$45
});
var PlayIndexRoute = Route$2.update({
	id: "/play/",
	path: "/play/",
	getParentRoute: () => Route$45
});
var PlayDifficultyRoute = Route$51.update({
	id: "/play/difficulty",
	path: "/play/difficulty",
	getParentRoute: () => Route$45
});
var PlayLobbyRoute = Route$52.update({
	id: "/play/lobby",
	path: "/play/lobby",
	getParentRoute: () => Route$45
});
var PlayTopicsRoute = Route$1.update({
	id: "/play/topics",
	path: "/play/topics",
	getParentRoute: () => Route$45
});
var QuestsIndexRoute = Route.update({
	id: "/quests/",
	path: "/quests/",
	getParentRoute: () => Route$45
});
var QuestsQuestIdRoute = Route$47.update({
	id: "/quests/$questId",
	path: "/quests/$questId",
	getParentRoute: () => Route$45
});
var QuestsCompleteRoute = Route$49.update({
	id: "/quests/complete",
	path: "/quests/complete",
	getParentRoute: () => Route$45
});
var QuizIndexRoute = Route$53.update({
	id: "/",
	path: "/",
	getParentRoute: () => QuizRoute
});
var QuizResultsRoute = Route$55.update({
	id: "/results",
	path: "/results",
	getParentRoute: () => QuizRoute
});
var HomeRouteChildren = { HomeQuestRoute };
var HomeRouteWithChildren = HomeRoute._addFileChildren(HomeRouteChildren);
var QuizRouteChildren = {
	QuizResultsRoute,
	QuizIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AchievementsRoute,
	BookmarksRoute,
	ErrorRoute,
	HomeRoute: HomeRouteWithChildren,
	IlmbotRoute,
	LeaderboardRoute,
	NotificationsRoute,
	OfflineRoute,
	ProfileRoute,
	ProgressRoute,
	QuizRoute: QuizRoute._addFileChildren(QuizRouteChildren),
	RamadanRoute,
	SettingsRoute,
	ShareRoute,
	StoreRoute,
	WalletRoute,
	WisdomRoute,
	ChallengeDuelRoute,
	ChallengeResultsRoute,
	ChallengeSetupRoute,
	ChallengeWaitingRoute,
	FriendsFriendIdRoute,
	HalaqahGameRoute,
	HalaqahResultsRoute,
	HifzCompleteRoute,
	HifzReviewRoute,
	HifzSessionRoute,
	LibrarySlugRoute,
	OnboardingAssessmentRoute,
	OnboardingAvatarRoute,
	OnboardingCarouselRoute,
	OnboardingCheckEmailRoute,
	OnboardingDobRoute,
	OnboardingForgotRoute,
	OnboardingGatewayRoute,
	OnboardingInterestsRoute,
	OnboardingLanguageRoute,
	OnboardingLoginRoute,
	OnboardingPasswordRoute,
	OnboardingResetRoute,
	OnboardingSignupRoute,
	OnboardingVerifyRoute,
	OnboardingWelcomeRoute,
	OnboardingZoneRoute,
	PlayDifficultyRoute,
	PlayLobbyRoute,
	PlayTopicsRoute,
	QuestsQuestIdRoute,
	QuestsCompleteRoute,
	FriendsIndexRoute,
	HalaqahIndexRoute,
	HifzIndexRoute,
	LibraryIndexRoute,
	PlayIndexRoute,
	QuestsIndexRoute
};
var routeTree = Route$45._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
