import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-ZMnVzFJv.js
var $$splitComponentImporter = () => import("./store-BUqQ_6M0.mjs");
var Route = createFileRoute("/store")({
	validateSearch: (search) => ({ item: search.item ? String(search.item) : void 0 }),
	head: () => ({ meta: [
		{ title: "Points Store — turn points into Sadaqah — IlmStation" },
		{
			name: "description",
			content: "Spend points on Sadaqah donations, streak freezes, Premium weeks, gifts and topic packs."
		},
		{
			property: "og:title",
			content: "Points Store — IlmStation"
		},
		{
			property: "og:description",
			content: "500 points = $1 donated to a vetted charity."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
