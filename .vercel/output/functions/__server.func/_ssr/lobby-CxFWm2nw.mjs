import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lobby-CxFWm2nw.js
var $$splitComponentImporter = () => import("./lobby-Dj_Wy4XR.mjs");
var Route = createFileRoute("/play/lobby")({
	validateSearch: (search) => ({
		topic: String(search.topic ?? "aqeedah"),
		count: Number(search.count ?? 10),
		difficulty: String(search.difficulty ?? "intermediate"),
		quest: search.quest ? String(search.quest) : void 0
	}),
	head: () => ({ meta: [
		{ title: "Quiz lobby — IlmStation" },
		{
			name: "description",
			content: "Your quiz brief: topic, question count, time estimate and XP preview."
		},
		{
			property: "og:title",
			content: "Quiz lobby — IlmStation"
		},
		{
			property: "og:description",
			content: "Ready when you are."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
