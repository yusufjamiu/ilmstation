import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quiz-CKAujzlk.js
var $$splitComponentImporter = () => import("./quiz-Cot65EFI.mjs");
var Route = createFileRoute("/quiz/")({
	validateSearch: (search) => ({
		topic: String(search.topic ?? "aqeedah"),
		count: Number(search.count ?? 10),
		difficulty: String(search.difficulty ?? "intermediate"),
		quest: search.quest ? String(search.quest) : void 0
	}),
	head: () => ({ meta: [
		{ title: "Quiz in progress — IlmStation" },
		{
			name: "description",
			content: "Answer, learn the explanation, and move on. Every question is sourced."
		},
		{
			property: "og:title",
			content: "Quiz in progress — IlmStation"
		},
		{
			property: "og:description",
			content: "Never punish learning — wrong answers teach."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
