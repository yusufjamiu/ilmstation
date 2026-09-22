import { N as notFound, m as createFileRoute, p as lazyRouteComponent } from "./_libs/@tanstack/react-router+[...].mjs";
import { r as articleBySlug } from "./_ssr/content-Df4kcoxg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-4Hox36u_.js
var $$splitComponentImporter = () => import("./_slug-COLRKdCu.mjs");
var $$splitNotFoundComponentImporter = () => import("./_slug-Ctf9bZTU.mjs");
var Route = createFileRoute("/library/$slug")({
	loader: ({ params }) => {
		const article = articleBySlug(params.slug);
		if (!article) throw notFound();
		return { article };
	},
	head: ({ loaderData }) => {
		if (!loaderData) return { meta: [{ title: "Article unavailable — IlmStation" }, {
			name: "robots",
			content: "noindex"
		}] };
		const { article } = loaderData;
		return { meta: [
			{ title: `${article.title} — IlmStation Library` },
			{
				name: "description",
				content: article.excerpt.slice(0, 155)
			},
			{
				property: "og:title",
				content: `${article.title} — IlmStation`
			},
			{
				property: "og:description",
				content: article.excerpt.slice(0, 155)
			}
		] };
	},
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
