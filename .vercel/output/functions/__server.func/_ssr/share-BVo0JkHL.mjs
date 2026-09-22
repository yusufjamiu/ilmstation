import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/share-BVo0JkHL.js
var $$splitComponentImporter = () => import("./share-DkmGxwwJ.mjs");
var Route = createFileRoute("/share")({
	validateSearch: (search) => ({ kind: String(search.kind ?? "progress") }),
	head: () => ({ meta: [
		{ title: "Share cards — IlmStation" },
		{
			name: "description",
			content: "Build a share card for your progress, a badge, your rank, a narration or an invite."
		},
		{
			property: "og:title",
			content: "Share cards — IlmStation"
		},
		{
			property: "og:description",
			content: "Five card types, five themes."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
