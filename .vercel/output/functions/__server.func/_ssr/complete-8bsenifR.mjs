import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/complete-8bsenifR.js
var $$splitComponentImporter = () => import("./complete-C_TlolZI.mjs");
var Route = createFileRoute("/quests/complete")({
	validateSearch: (search) => ({ quest: search.quest ? String(search.quest) : void 0 }),
	head: () => ({ meta: [
		{ title: "Quest complete — IlmStation" },
		{
			name: "description",
			content: "Total XP earned, the badge awarded and the next quest now unlocked."
		},
		{
			property: "og:title",
			content: "Quest complete — IlmStation"
		},
		{
			property: "og:description",
			content: "One chapter closer to the end of the path."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
