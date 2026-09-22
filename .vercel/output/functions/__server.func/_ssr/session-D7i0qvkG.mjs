import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/session-D7i0qvkG.js
var $$splitComponentImporter = () => import("./session-DqTq5bzJ.mjs");
var Route = createFileRoute("/hifz/session")({
	validateSearch: (search) => ({ surah: Number(search.surah ?? 112) }),
	head: () => ({ meta: [
		{ title: "Hifz session — IlmStation" },
		{
			name: "description",
			content: "Visible, Gapped, Ghost and Hidden view modes with Tajweed colouring and audio control."
		},
		{
			property: "og:title",
			content: "Hifz session — IlmStation"
		},
		{
			property: "og:description",
			content: "Got it, or need practice?"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
