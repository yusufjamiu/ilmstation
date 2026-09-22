import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, d as Modal, f as Mono, g as Segmented, h as SectionTitle, i as Btn, l as Field, o as Card, p as Pill, u as Input, v as Toggle } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as AppShell } from "./AppShell-BbhG3piC.mjs";
import { n as LANGUAGES, r as ZONES } from "./onboarding-B7CWioSf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-x47nMLoi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S07 Settings */
function Settings() {
	const { s, set, reset } = useApp();
	const navigate = useNavigate();
	const [confirmReset, setConfirmReset] = (0, import_react.useState)(false);
	const [email, setEmail] = (0, import_react.useState)(s.email);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const saveAccount = () => {
		set({ email });
		setSaved(true);
		setTimeout(() => setSaved(false), 2e3);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Settings",
		subtitle: "Your data lives on this device only.",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Appearance" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Dark mode",
							hint: "Deep charcoal with the same bold borders.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: s.dark,
								onChange: (v) => set({ dark: v }),
								label: "Dark mode"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Larger text",
							hint: "Increases the base text size across the app.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: s.largeText,
								onChange: (v) => set({ largeText: v }),
								label: "Larger text"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Reduce motion",
							hint: "Removes confetti and card animations.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: s.reduceMotion,
								onChange: (v) => set({ reduceMotion: v }),
								label: "Reduce motion"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Sound effects",
							hint: "Correct/incorrect chimes and streak sounds.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: s.sound,
								onChange: (v) => set({ sound: v }),
								label: "Sound effects"
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Learning" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
								children: "Default difficulty"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: s.difficulty,
								onChange: (v) => set({ difficulty: v }),
								options: [
									{
										value: "beginner",
										label: "Beginner"
									},
									{
										value: "intermediate",
										label: "Intermediate"
									},
									{
										value: "advanced",
										label: "Advanced"
									}
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
								children: "Language"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: LANGUAGES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => set({ language: l.code }),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: s.language === l.code ? "yellow" : "field",
										children: [
											l.flag,
											" ",
											l.label
										]
									})
								}, l.code))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mono mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
								children: "Age zone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: ZONES.map((z) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => set({ zone: z.id }),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
										tone: s.zone === z.id ? "green" : "field",
										children: [
											z.icon,
											" ",
											z.range
										]
									})
								}, z.id))
							})] })
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Notifications" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "All reminders",
							hint: "Daily quest, streak warnings and challenge invites.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								on: s.notificationsOn,
								onChange: (v) => set({ notificationsOn: v }),
								label: "Notifications"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "field",
									children: "Daily quest · 07:30"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "field",
									children: "Streak warning · 20:00"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: "field",
									children: "Challenge invites · instant"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
							to: "/notifications",
							variant: "outline",
							className: "mt-3",
							children: "Open notification centre"
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Account" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Email",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: email,
									onChange: (e) => setEmail(e.target.value),
									placeholder: "you@example.com",
									type: "email"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
									onClick: saveAccount,
									children: saved ? "✓ Saved" : "Save email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
									to: "/profile",
									variant: "outline",
									children: "Edit profile"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "brutal-sm rounded-r12 bg-field p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[15px] font-black",
										children: s.premium ? "⚡ Premium active" : "Free plan"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[13px] font-semibold text-ink2",
										children: s.premium ? "Unlimited IlmBot, all Surahs, Halaqah hosting and advanced topics." : "Premium unlocks unlimited IlmBot, every Surah and Halaqah hosting."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 flex flex-wrap gap-2",
										children: s.premium ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
											variant: "outline",
											size: "sm",
											onClick: () => set({ premium: false }),
											children: "Switch back to Free"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
											to: "/store",
											search: { item: "premium-week" },
											size: "sm",
											children: "See Premium"
										})
									})
								]
							})
						]
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				tone: "pink",
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Data" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[15px] font-semibold text-ink2",
						children: "IlmStation stores your progress in this browser. Clearing it resets XP, points, badges, bookmarks and onboarding."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								variant: "danger",
								onClick: () => setConfirmReset(true),
								children: "Reset all my data"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/offline",
								variant: "outline",
								children: "Offline behaviour"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
								to: "/error",
								variant: "outline",
								children: "Error state demo"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mono, {
						className: "mt-3 block text-[11px] font-bold tracking-widest text-ink2 uppercase",
						children: "Version 1.0 · frontend demo · no account required"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				open: confirmReset,
				onClose: () => setConfirmReset(false),
				title: "Reset everything?",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-semibold text-ink2",
					children: "This clears your saved progress on this device and takes you back to the start of onboarding. It cannot be undone."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "danger",
						full: true,
						onClick: () => {
							reset();
							navigate({ to: "/onboarding/language" });
						},
						children: "Yes, reset"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						variant: "outline",
						full: true,
						onClick: () => setConfirmReset(false),
						children: "Keep my data"
					})]
				})]
			})
		]
	});
}
function Row({ label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3 border-b border-border/20 py-3 last:border-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[15px] font-black",
				children: label
			}), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[13px] font-semibold text-ink2",
				children: hint
			}) : null]
		}), children]
	});
}
//#endregion
export { Settings as component };
