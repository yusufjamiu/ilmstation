import { createFileRoute } from "@tanstack/react-router";
import { CityPage, cityHead } from "./city";

// IlmWorld lives at /world; /city keeps working for old links.
export const Route = createFileRoute("/world")({
  head: () => cityHead(),
  component: CityPage,
});
