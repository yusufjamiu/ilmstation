import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppProvider, FlowProvider } from "../lib/store";

function NotFoundComponent() {
  return (
    <div className="grid-paper flex min-h-screen items-center justify-center bg-page px-4">
      <div className="brutal-lg max-w-md rounded-r24 bg-surface p-8 text-center">
        <div className="text-[64px]" aria-hidden>
          ☪
        </div>
        <h1 className="mono text-[44px] font-bold">404</h1>
        <h2 className="mt-2 text-[24px] font-black">This path isn&apos;t on the map</h2>
        <p className="mt-2 text-[15px] text-ink2">
          The screen you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          to="/home"
          className="brutal press mt-6 inline-flex min-h-11 items-center justify-center rounded-r12 bg-yellow px-5 py-3 text-[15px] font-extrabold"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="grid-paper flex min-h-screen items-center justify-center bg-page px-4">
      <div className="brutal-lg max-w-md rounded-r24 bg-surface p-8 text-center">
        <div className="text-[56px]" aria-hidden>
          ⚠️
        </div>
        <h1 className="mt-2 text-[24px] font-black">Something broke the chain</h1>
        <p className="mt-2 text-[15px] text-ink2">
          This screen didn&apos;t load. Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="brutal press inline-flex min-h-11 items-center rounded-r12 bg-yellow px-5 py-3 text-[15px] font-extrabold"
          >
            Try again
          </button>
          <a
            href="/home"
            className="brutal press inline-flex min-h-11 items-center rounded-r12 bg-surface px-5 py-3 text-[15px] font-extrabold"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IlmStation — Gamified Islamic Learning" },
      {
        name: "description",
        content:
          "IlmStation turns Islamic learning into a daily habit: quests, streaks, Hifz mode, duels and Sadaqah rewards.",
      },
      { name: "author", content: "IlmStation" },
      { property: "og:title", content: "IlmStation — Gamified Islamic Learning" },
      {
        property: "og:description",
        content: "Seek · Learn · Grow. A daily Islamic learning system built around streaks and quests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F5C842" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&family=Amiri:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <FlowProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </FlowProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
