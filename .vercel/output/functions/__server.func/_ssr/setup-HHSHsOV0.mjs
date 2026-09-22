import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/setup-HHSHsOV0.js
var $$splitComponentImporter = () => import("./setup-FCWO39e-.mjs");
var Route = createFileRoute("/challenge/setup")({
	validateSearch: (search) => ({ opponent: search.opponent ? String(search.opponent) : void 0 }),
	head: () => ({ meta: [
		{ title: "Challenge a friend — IlmStation" },
		{
			name: "description",
			content: "Pick an opponent, a topic and the number of rounds, then send the duel invite."
		},
		{
			property: "og:title",
			content: "Challenge a friend — IlmStation"
		},
		{
			property: "og:description",
			content: "Head-to-head duels, +50% XP for the winner."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
