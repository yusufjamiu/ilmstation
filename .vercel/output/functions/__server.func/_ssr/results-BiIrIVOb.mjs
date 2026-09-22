import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/results-BiIrIVOb.js
var $$splitComponentImporter = () => import("./results-DiIT7ODe.mjs");
var Route = createFileRoute("/quiz/results")({
	validateSearch: (search) => ({
		topic: String(search.topic ?? "aqeedah"),
		score: Number(search.score ?? 0),
		total: Number(search.total ?? 10),
		seconds: Number(search.seconds ?? 0),
		penalty: Number(search.penalty ?? 0),
		difficulty: String(search.difficulty ?? "intermediate"),
		quest: search.quest ? String(search.quest) : void 0
	}),
	head: () => ({ meta: [
		{ title: "Quiz results — IlmStation" },
		{
			name: "description",
			content: "Your score, XP earned, accuracy and time — plus a share card."
		},
		{
			property: "og:title",
			content: "Quiz results — IlmStation"
		},
		{
			property: "og:description",
			content: "See how you did and share the card."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
