import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, d as Modal, f as Mono, h as SectionTitle, i as Btn, o as Card, p as Pill, y as cn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { t as FRIENDS } from "./social-FuLE4Yer.mjs";
import { t as Route } from "./store-ZMnVzFJv.mjs";
import { r as STORE_ITEMS, t as CHARITIES } from "./economy-DbzQDcwR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-BUqQ_6M0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Q07 Points Store · Sadaqah flow */
function Store() {
	const { item: preselect } = Route.useSearch();
	const { s, set, spend, totalPoints } = useApp();
	const [open, setOpen] = (0, import_react.useState)(STORE_ITEMS.find((i) => i.id === preselect) ?? null);
	const [charity, setCharity] = (0, import_react.useState)(CHARITIES[0].id);
	const [amount, setAmount] = (0, import_react.useState)(500);
	const [friend, setFriend] = (0, import_react.useState)(FRIENDS[0].id);
	const [receipt, setReceipt] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const confirm = (it) => {
		const cost = it.id === "sadaqah" ? amount : it.cost;
		if (totalPoints < cost) {
			setError(`You need ${cost - totalPoints} more points for ${it.name}.`);
			return;
		}
		const label = it.id === "sadaqah" ? `Sadaqah — ${CHARITIES.find((c) => c.id === charity)?.name}` : it.id === "gift" ? `Gift Premium — ${FRIENDS.find((f) => f.id === friend)?.name}` : it.name;
		if (!spend(cost, label)) {
			setError("Something went wrong deducting points. Try again.");
			return;
		}
		if (it.id === "sadaqah") set({ donated: s.donated + cost });
		if (it.id === "freeze") set({ freezes: s.freezes + 1 });
		if (it.id === "premium-week") set({ premium: true });
		setOpen(null);
		setReceipt(it.id === "sadaqah" ? `Jazak Allahu khayran. ${cost} points became about $${(cost / 500).toFixed(2)} for ${CHARITIES.find((c) => c.id === charity)?.name}.` : it.id === "gift" ? `${FRIENDS.find((f) => f.id === friend)?.name} now has a month of Premium from you.` : `${it.name} applied to your account.`);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Points Store",
		subtitle: "Points buy meaning, never answers.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				tone: "ink",
				className: "mb-5 rounded-r20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono text-[11px] font-bold tracking-widest uppercase opacity-70",
						children: "Available balance"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
						className: "text-[32px] leading-none font-bold",
						children: totalPoints
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "yellow",
								children: [
									"🧊 ",
									s.freezes,
									" freezes"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "green",
								children: s.premium ? "Premium active" : "Free plan"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/wallet",
								variant: "outline",
								size: "sm",
								children: "Wallet"
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3",
				children: STORE_ITEMS.map((it) => {
					const affordable = totalPoints >= it.cost;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						tone: it.flagship ? "green" : "surface",
						className: cn("flex h-full flex-col rounded-r16", it.flagship && "md:col-span-2"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "brutal-flat grid h-12 w-12 shrink-0 place-items-center rounded-rf bg-surface text-[22px]",
								children: it.icon
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-[18px] font-black",
										children: it.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Mono, {
										className: "text-[11px] font-bold tracking-widest text-ink2 uppercase",
										children: [
											it.cost,
											" pts · ",
											it.unit
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-[13px] font-semibold text-ink2",
										children: it.note
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-auto pt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								full: true,
								variant: it.flagship ? "ink" : affordable ? "primary" : "outline",
								onClick: () => {
									setError(null);
									setOpen(it);
								},
								children: affordable ? it.flagship ? "Donate now" : "Redeem" : `Need ${it.cost - totalPoints} more`
							})
						})]
					}, it.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "field",
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "How the Sadaqah conversion works" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: "Every 500 points is matched to roughly $1, funded from IlmStation Premium revenue and paid to vetted charities monthly. You'll always see which charity your points went to."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
				open: !!open,
				onClose: () => setOpen(null),
				title: open?.name ?? "",
				children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[15px] font-semibold text-ink2",
						children: open.note
					}),
					open.id === "sadaqah" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
								children: "Choose a charity"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "space-y-2",
								children: CHARITIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setCharity(c.id),
									"aria-pressed": charity === c.id,
									className: cn("brutal-sm press-sm flex w-full items-center gap-3 rounded-r12 px-3 py-2.5 text-left", charity === c.id ? "bg-yellow" : "bg-field"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[20px]",
										"aria-hidden": true,
										children: c.icon
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[15px] font-black",
										children: c.name
									})]
								}) }, c.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mono mt-4 mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
								children: "Amount"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									500,
									1e3,
									2e3
								].map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setAmount(a),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: amount === a ? "green" : "field",
										children: [
											a,
											" pts · $",
											(a / 500).toFixed(0)
										]
									})
								}, a))
							})
						]
					}) : null,
					open.id === "gift" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
							children: "Send to"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: FRIENDS.slice(0, 4).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setFriend(f.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
									tone: friend === f.id ? "yellow" : "field",
									children: [
										f.avatar,
										" ",
										f.name
									]
								})
							}, f.id))
						})]
					}) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-[13px] font-bold text-destructive",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Btn, {
							full: true,
							onClick: () => confirm(open),
							children: [
								"Confirm · ",
								open.id === "sadaqah" ? amount : open.cost,
								" pts"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							variant: "outline",
							full: true,
							onClick: () => setOpen(null),
							children: "Cancel"
						})]
					})
				] }) : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
				open: !!receipt,
				onClose: () => setReceipt(null),
				title: "Confirmed",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[48px]",
							"aria-hidden": true,
							children: "🤲"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[15px] font-semibold",
							children: receipt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-col gap-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/wallet",
								full: true,
								children: "View wallet"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "outline",
								full: true,
								onClick: () => setReceipt(null),
								children: "Keep shopping"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { Store as component };
