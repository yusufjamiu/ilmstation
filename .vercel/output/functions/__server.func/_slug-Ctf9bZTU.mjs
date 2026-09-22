import { n as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, c as Empty } from "./_ssr/kit-ZBxajPhE.mjs";
import { t as AppShell } from "./_ssr/AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-Ctf9bZTU.js
var import_jsx_runtime = require_jsx_runtime();
function ArticleMissing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Article unavailable",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
			icon: "📄",
			title: "We couldn't find that article",
			body: "The link may be old. Browse the Library and pick another sourced read.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
				to: "/library",
				children: "Back to Library"
			})
		})
	});
}
//#endregion
export { ArticleMissing as notFoundComponent };
