import { n as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, c as Empty } from "./_ssr/kit-ZBxajPhE.mjs";
import { t as AppShell } from "./_ssr/AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_friendId-Bt6-2MsQ.js
var import_jsx_runtime = require_jsx_runtime();
function FriendMissing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Friend not found",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
			icon: "👤",
			title: "That profile isn't available",
			body: "They may have left IlmStation. Head back to your friends list.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
				to: "/friends",
				children: "Back to Friends"
			})
		})
	});
}
//#endregion
export { FriendMissing as notFoundComponent };
