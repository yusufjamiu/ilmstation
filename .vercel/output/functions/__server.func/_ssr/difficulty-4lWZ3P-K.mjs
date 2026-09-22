import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/difficulty-4lWZ3P-K.js
var $$splitComponentImporter = () => import("./difficulty-BTYJ-HmR.mjs");
var Route = createFileRoute("/play/difficulty")({
	validateSearch: (search) => ({
		topic: String(search.topic ?? "aqeedah"),
		count: search.count ? Number(search.count) : void 0
	}),
	head: () => ({ meta: [
		{ title: "Choose difficulty — IlmStation" },
		{
			name: "description",
			content: "Beginner, Intermediate or Advanced — each tier multiplies the XP you earn."
		},
		{
			property: "og:title",
			content: "Choose difficulty — IlmStation"
		},
		{
			property: "og:description",
			content: "1×, 1.5× or 2× XP."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
