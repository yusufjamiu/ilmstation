import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BtnLink, i as Btn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BBeEJwDH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** S01 Splash — brand moment, then route by onboarding state. */
function Splash() {
	const { s } = useApp();
	const navigate = useNavigate();
	const [waited, setWaited] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setWaited(true), 1600);
		return () => clearTimeout(t);
	}, []);
	(0, import_react.useEffect)(() => {
		if (waited && s.hydrated && s.onboarded) navigate({ to: "/home" });
	}, [
		waited,
		s.hydrated,
		s.onboarded,
		navigate
	]);
	const ready = waited && s.hydrated;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid-paper flex min-h-screen flex-col items-center justify-center bg-page px-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "anim-pop text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "brutal-lg anim-float mx-auto grid h-28 w-28 place-items-center rounded-r24 bg-yellow text-[56px]",
						children: "☪"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-6 text-[56px] leading-none font-black tracking-tight sm:text-[72px]",
						children: "ILMSTATION"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mono mt-2 text-[13px] font-bold  text-ink2 uppercase",
						children: "Seek · Learn · Grow"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 w-full max-w-sm",
				children: !ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "brutal-flat h-3 w-full overflow-hidden rounded-rf bg-field",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-1/2 animate-pulse bg-green" })
				}) : s.onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					full: true,
					size: "lg",
					onClick: () => window.location.assign("/home"),
					children: "Continue →"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "anim-rise space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/onboarding/language",
						full: true,
						size: "lg",
						children: "Begin →"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
						to: "/onboarding/login",
						variant: "outline",
						full: true,
						children: "I already have an account"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 max-w-sm text-center text-[13px] font-semibold text-muted",
				children: "A gamified Islamic learning platform. 71 screens, working end to end in your browser — your progress is saved on this device."
			})
		]
	});
}
//#endregion
export { Splash as component };
