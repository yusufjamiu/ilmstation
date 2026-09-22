import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Empty, f as Mono, i as Btn, o as Card, p as Pill } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-BexNfz4C.js
var import_jsx_runtime = require_jsx_runtime();
var TARGETS = {
	challenge: "/challenge/setup",
	achievements: "/achievements",
	leaderboard: "/leaderboard",
	home: "/home",
	friends: "/friends"
};
/** H04 Notifications */
function Notifications() {
	const { s, set, readAllNotifs } = useApp();
	const unread = s.notifs.filter((n) => n.unread).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		back: {
			to: "/home",
			label: "Home"
		},
		title: "Notifications",
		subtitle: unread ? `${unread} unread` : "You're all caught up",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				variant: "outline",
				size: "sm",
				onClick: readAllNotifs,
				disabled: !unread,
				children: "Mark all read"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				variant: "outline",
				size: "sm",
				onClick: () => set({ notifs: [] }),
				disabled: !s.notifs.length,
				children: "Clear all"
			})]
		}), s.notifs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
			icon: "🔔",
			title: "Nothing here yet",
			body: "Challenge invites, badge unlocks and streak reminders will appear here."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-2",
			children: s.notifs.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: TARGETS[n.action] ?? "/home",
				onClick: () => set({ notifs: s.notifs.map((x) => x.id === n.id ? {
					...x,
					unread: false
				} : x) }),
				className: "block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					tone: n.unread ? "yellow" : "surface",
					className: "press flex items-start gap-3 rounded-r12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[24px]",
							"aria-hidden": true,
							children: n.icon
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[15px] font-black",
								children: n.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[13px] font-semibold text-ink2",
								children: n.body
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
								className: "text-[11px] font-bold text-ink2",
								children: n.time
							}), n.unread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "ink",
									children: "New"
								})
							}) : null]
						})
					]
				})
			}) }, n.id))
		})]
	});
}
//#endregion
export { Notifications as component };
