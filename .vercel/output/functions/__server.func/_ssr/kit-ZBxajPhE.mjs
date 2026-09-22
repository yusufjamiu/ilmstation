import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as createLink } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/kit-ZBxajPhE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var variantClass = {
	primary: "bg-yellow text-ink hover:bg-yellow-d",
	green: "bg-green text-surface hover:brightness-95",
	outline: "bg-surface text-ink hover:bg-field",
	ghost: "bg-transparent border-transparent shadow-none text-ink2 hover:text-ink hover:bg-field",
	danger: "bg-pink text-ink hover:brightness-105",
	ink: "bg-ink text-page hover:opacity-90"
};
var sizeClass = {
	sm: "text-[13px] px-3 py-2 rounded-r8",
	md: "text-[14px] px-4 py-2.5 rounded-r8",
	lg: "text-[16px] px-5 py-3.5 rounded-r12"
};
function btnClass(variant = "primary", size = "md", full = false) {
	return cn("inline-flex items-center justify-center gap-2 font-bold select-none", "brutal-sm press-sm disabled:opacity-45 disabled:pointer-events-none min-h-11", variantClass[variant], sizeClass[size], full && "w-full");
}
function Btn({ variant = "primary", size = "md", full, className, ...rest }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(btnClass(variant, size, full), className),
		...rest
	});
}
/**
* Button-styled router link. Built with createLink so `to`, `params` and
* `search` keep full type inference from the generated route tree.
*/
var StyledAnchor = (0, import_react.forwardRef)(({ variant = "primary", size = "md", full, className, ...rest }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
	ref,
	className: cn(btnClass(variant, size, full), className),
	...rest
}));
StyledAnchor.displayName = "StyledAnchor";
var BtnLink = createLink(StyledAnchor);
function Card({ className, children, tone, ...rest }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("brutal-flat rounded-r16 p-5", {
			surface: "bg-surface",
			yellow: "bg-yellow text-ink",
			green: "bg-green-l",
			pink: "bg-pink-l",
			field: "bg-field",
			ink: "bg-ink text-page"
		}[tone ?? "surface"], className),
		...rest,
		children
	});
}
function Pill({ className, children, tone = "field" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-rf border border-border/30 px-2.5 py-1 text-[10px] font-bold uppercase", {
			field: "bg-field text-ink2",
			yellow: "bg-yellow text-ink",
			green: "bg-green text-surface",
			pink: "bg-pink text-ink",
			ink: "bg-ink text-page",
			surface: "bg-surface text-ink"
		}[tone], className),
		children
	});
}
function SectionTitle({ children, action, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("mb-4 flex items-end justify-between gap-3", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-[19px] font-black",
			children
		}), action]
	});
}
function Bar({ value, className, tone = "green", label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-2 w-full overflow-hidden rounded-rf bg-field", className),
		role: "progressbar",
		"aria-valuenow": Math.round(value * 100),
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-label": label ?? "Progress",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("h-full transition-[width] duration-500", {
				green: "bg-green",
				yellow: "bg-yellow",
				ink: "bg-ink",
				pink: "bg-pink"
			}[tone]),
			style: { width: `${Math.max(0, Math.min(1, value)) * 100}%` }
		})
	});
}
function Ring({ value, size = 44, label }) {
	const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "brutal-flat relative grid shrink-0 place-items-center rounded-rf bg-field",
		style: {
			width: size,
			height: size,
			background: `conic-gradient(var(--green) ${pct * 3.6}deg, var(--field) 0deg)`
		},
		role: "img",
		"aria-label": label ? `${label}: ${pct}%` : `${pct}%`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mono grid place-items-center rounded-rf bg-surface text-[10px] font-bold",
			style: {
				width: size - 14,
				height: size - 14
			},
			children: pct
		})
	});
}
function Arabic({ children, className, size = "md" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		lang: "ar",
		dir: "rtl",
		className: cn("arabic", {
			sm: "text-[15px]",
			md: "text-[18px]",
			lg: "text-[22px]",
			xl: "text-[32px]"
		}[size], className),
		children
	});
}
function Mono({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("mono", className),
		children
	});
}
function Avatar({ emoji, size = 44, ring }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("grid shrink-0 place-items-center rounded-r12 border border-border/25", ring === "yellow" ? "bg-yellow" : ring === "green" ? "bg-green-l" : "bg-field"),
		style: {
			width: size,
			height: size,
			fontSize: size * .5
		},
		"aria-hidden": true,
		children: emoji
	});
}
function Stat({ label, value, icon, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-r12 border border-border/20 p-3 text-center", {
			surface: "bg-surface",
			yellow: "bg-yellow",
			green: "bg-green-l",
			field: "bg-field"
		}[tone ?? "surface"]),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mono text-[20px] leading-tight font-bold",
			children: [icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mr-1",
				children: icon
			}) : null, value]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5 text-[11px] font-bold tracking-wide text-ink2 uppercase",
			children: label
		})]
	});
}
function Modal({ open, onClose, children, title, wide }) {
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center sm:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			"aria-label": "Close",
			onClick: onClose,
			className: "absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: cn("brutal anim-rise relative max-h-[92vh] w-full overflow-y-auto rounded-t-r24 bg-surface p-6 sm:rounded-r24", wide ? "sm:max-w-2xl" : "sm:max-w-md"),
			children: [title ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-[24px] font-black",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					variant: "outline",
					size: "sm",
					onClick: onClose,
					"aria-label": "Close dialog",
					children: "✕"
				})]
			}) : null, children]
		})]
	});
}
function Field({ label, hint, error, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase",
				children: label
			}),
			children,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "mt-1 block text-[13px] font-bold text-ink2",
				children: ["⚠ ", error]
			}) : hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-[13px] text-muted",
				children: hint
			}) : null
		]
	});
}
function Input({ className, ...rest }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("w-full rounded-r8 border border-border/35 bg-surface px-3.5 py-3 text-[15px] font-semibold", "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-yellow", className),
		...rest
	});
}
function Toggle({ on, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "switch",
		"aria-checked": on,
		"aria-label": label,
		onClick: () => onChange(!on),
		className: cn("brutal-sm press-sm h-7 w-13 shrink-0 rounded-rf p-0.5", on ? "bg-green" : "bg-field"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("brutal-flat block h-5.5 w-5.5 rounded-rf bg-surface transition-transform", on && "translate-x-6") })
	});
}
function Segmented({ value, options, onChange, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex gap-1 rounded-r12 bg-field p-1", className),
		role: "tablist",
		children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			role: "tab",
			"aria-selected": value === o.value,
			onClick: () => onChange(o.value),
			className: cn("min-h-9 flex-1 rounded-r8 px-2 py-1.5 text-[13px] font-extrabold transition-colors", value === o.value ? "border border-border/30 bg-surface text-ink" : "text-ink2 hover:bg-surface"),
			children: o.label
		}, o.value))
	});
}
function Empty({ icon, title, body, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-r16 border border-border/25 bg-field px-6 py-12 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[44px]",
				"aria-hidden": true,
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-2 text-[18px] font-black",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-1 max-w-sm text-[15px] text-ink2",
				children: body
			}),
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex justify-center",
				children: action
			}) : null
		]
	});
}
function Confetti({ count = 26 }) {
	const colors = [
		"var(--yellow)",
		"var(--green)",
		"var(--pink)",
		"var(--ink)"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none fixed inset-0 z-40 overflow-hidden",
		"aria-hidden": true,
		children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "brutal-flat absolute top-0 block h-3 w-3",
			style: {
				left: `${i * 97 % 100}%`,
				background: colors[i % colors.length],
				animation: `iq-confetti ${1.6 + i % 5 * .35}s linear ${i % 7 * .12}s 1 both`
			}
		}, i))
	});
}
//#endregion
export { Stat as _, BtnLink as a, Empty as c, Modal as d, Mono as f, Segmented as g, SectionTitle as h, Btn as i, Field as l, Ring as m, Avatar as n, Card as o, Pill as p, Bar as r, Confetti as s, Arabic as t, Input as u, Toggle as v, cn as y };
