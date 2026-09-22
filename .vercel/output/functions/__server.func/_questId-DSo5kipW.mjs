import { n as require_jsx_runtime } from "./_libs/react+tanstack__react-query.mjs";
import { a as BtnLink, c as Empty } from "./_ssr/kit-ZBxajPhE.mjs";
import { t as AppShell } from "./_ssr/AppShell-BbhG3piC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_questId-DSo5kipW.js
var import_jsx_runtime = require_jsx_runtime();
function QuestMissing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Quest not found",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
			icon: "🗺️",
			title: "That quest isn't on the map",
			body: "It may have been renamed. Head back to the Quest Map and pick your next step.",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BtnLink, {
				to: "/quests",
				children: "Back to Quest Map"
			})
		})
	});
}
//#endregion
export { QuestMissing as notFoundComponent };
