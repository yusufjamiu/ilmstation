import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/complete-Dnv5F13C.js
var $$splitComponentImporter = () => import("./complete-Dohhi-Bz.mjs");
var Route = createFileRoute("/hifz/complete")({
	validateSearch: (search) => ({
		surah: Number(search.surah ?? 112),
		reviewed: Number(search.reviewed ?? 0),
		strong: Number(search.strong ?? 0)
	}),
	head: () => ({ meta: [
		{ title: "Hifz session complete — IlmStation" },
		{
			name: "description",
			content: "Verses reviewed, retention rate, streak maintained and XP awarded."
		},
		{
			property: "og:title",
			content: "Hifz session complete — IlmStation"
		},
		{
			property: "og:description",
			content: "+30 XP and your streak stays alive."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
