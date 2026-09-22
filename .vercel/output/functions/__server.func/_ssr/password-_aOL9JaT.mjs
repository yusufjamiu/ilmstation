import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/password-_aOL9JaT.js
var $$splitComponentImporter = () => import("./password-DcL8XaA1.mjs");
var Route = createFileRoute("/onboarding/password")({
	head: () => ({ meta: [
		{ title: "Create a password — IlmStation" },
		{
			name: "description",
			content: "Set a strong password for your IlmStation account."
		},
		{
			property: "og:title",
			content: "Create a password — IlmStation"
		},
		{
			property: "og:description",
			content: "Strength meter included."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
function strength(pw) {
	let score = 0;
	if (pw.length >= 8) score++;
	if (/[A-Z]/.test(pw)) score++;
	if (/[0-9]/.test(pw)) score++;
	if (/[^A-Za-z0-9]/.test(pw)) score++;
	return score;
}
//#endregion
export { strength as n, Route as t };
