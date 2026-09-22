import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Btn } from "./kit-ZBxajPhE.mjs";
import { u as useApp } from "./store-BMzoaAqa.mjs";
import { t as OnboardShell } from "./OnboardShell-C-NKme8d.mjs";
import { t as AVATARS } from "./onboarding-B7CWioSf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/avatar-BmrTPQ4E.js
var import_jsx_runtime = require_jsx_runtime();
/** S08 Profile Picture */
function AvatarScreen() {
	const { s, set } = useApp();
	const navigate = useNavigate();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OnboardShell, {
		step: 4,
		total: 7,
		back: "/onboarding/dob",
		title: "Choose your face",
		subtitle: "This shows on the leaderboard, duels and share cards.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "brutal-lg grid h-28 w-28 place-items-center rounded-rf bg-yellow text-[56px]",
					children: s.avatar
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "brutal press-sm mt-4 cursor-pointer rounded-r12 bg-surface px-4 py-2.5 text-[13px] font-extrabold",
					children: ["📷 Upload a photo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "file",
						accept: "image/*",
						className: "hidden",
						onChange: () => set({ avatar: "🖼️" })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mono mt-6 mb-2 text-[11px] font-bold tracking-widest text-ink2 uppercase",
				children: "Or pick a generated avatar"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-4 gap-2",
				children: AVATARS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => set({ avatar: a }),
					"aria-pressed": s.avatar === a,
					"aria-label": `Avatar ${a}`,
					className: `brutal press grid aspect-square place-items-center rounded-r16 text-[32px] ${s.avatar === a ? "bg-yellow" : "bg-surface"}`,
					children: a
				}, a))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				size: "lg",
				full: true,
				className: "mt-5",
				onClick: () => navigate({ to: "/onboarding/verify" }),
				children: "Continue →"
			})
		]
	});
}
//#endregion
export { AvatarScreen as component };
