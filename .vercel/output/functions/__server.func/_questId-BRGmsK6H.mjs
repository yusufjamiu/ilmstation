import { N as notFound, m as createFileRoute, p as lazyRouteComponent } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as questById } from "./_ssr/quests-BRY7yFVm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_questId-BRGmsK6H.js
var $$splitComponentImporter = () => import("./_questId-cwlq2svH.mjs");
var $$splitNotFoundComponentImporter = () => import("./_questId-DSo5kipW.mjs");
var Route = createFileRoute("/quests/$questId")({
	loader: ({ params }) => {
		const quest = questById(params.questId);
		if (!quest) throw notFound();
		return { quest };
	},
	head: ({ loaderData }) => {
		if (!loaderData) return { meta: [{ title: "Quest not found — IlmStation" }, {
			name: "robots",
			content: "noindex"
		}] };
		const { quest } = loaderData;
		return { meta: [
			{ title: `${quest.name} — Quest — IlmStation` },
			{
				name: "description",
				content: `Three stages, ${quest.xp} XP and rising multipliers on ${quest.name}.`
			},
			{
				property: "og:title",
				content: `${quest.name} — IlmStation`
			},
			{
				property: "og:description",
				content: `Quest in ${quest.chapter}.`
			}
		] };
	},
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
