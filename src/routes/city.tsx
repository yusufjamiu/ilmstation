import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { cityGreeting } from "@/game/time";

// The 3D game only runs in the browser, and only downloads when someone opens IlmCity.
const IlmCityGame = lazy(() => import("@/game/IlmCityGame"));

export const Route = createFileRoute("/city")({
  head: () => cityHead(),
  component: CityPage,
});

export const cityHead = () => ({
  meta: [
    { title: "IlmWorld — Live, pray, learn and travel" },
    {
      name: "description",
      content: "IlmWorld by IlmStation: a 3D Muslim world where your day runs on real salah times.",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
    },
    { name: "theme-color", content: "#10201e" },
  ],
});

export function CityPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#10201e]">
      {ready ? (
        <Suspense fallback={<Loading />}>
          <IlmCityGame />
        </Suspense>
      ) : (
        <Loading />
      )}
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid h-full place-items-center text-center text-[#fdf8ec]">
      <div>
        <div className="font-serif text-4xl">
          Ilm<span className="text-[#45b8a8]">World</span>
        </div>
        <p className="mt-2 text-sm opacity-70">{cityGreeting()}</p>
      </div>
    </div>
  );
}
