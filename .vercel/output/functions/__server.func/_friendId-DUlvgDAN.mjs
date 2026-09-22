import { N as notFound, m as createFileRoute, p as lazyRouteComponent } from "./_libs/@tanstack/react-router+[...].mjs";
import { a as friendById } from "./_ssr/social-FuLE4Yer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_friendId-DUlvgDAN.js
var $$splitComponentImporter = () => import("./_friendId-MvTrxNb5.mjs");
var $$splitNotFoundComponentImporter = () => import("./_friendId-Bt6-2MsQ.mjs");
var Route = createFileRoute("/friends/$friendId")({
	loader: ({ params }) => {
		const friend = friendById(params.friendId);
		if (!friend) throw notFound();
		return { friend };
	},
	head: ({ loaderData }) => {
		if (!loaderData) return { meta: [{ title: "Friend not found — IlmStation" }, {
			name: "robots",
			content: "noindex"
		}] };
		const { friend } = loaderData;
		return { meta: [
			{ title: `${friend.name} — friend profile — IlmStation` },
			{
				name: "description",
				content: `Level ${friend.level}, ${friend.xp} XP and a ${friend.streak}-day streak. See your head-to-head record.`
			},
			{
				property: "og:title",
				content: `${friend.name} on IlmStation`
			},
			{
				property: "og:description",
				content: `Level ${friend.level} · ${friend.streak}-day streak.`
			}
		] };
	},
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
