import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/* Relay servers (TURN) for IlmWorld voice calls: phones on different mobile networks often
   can't reach each other directly, so the voice goes through a relay. Credentials are made
   on the server, short-lived, from Cloudflare Realtime TURN or Metered (whichever is set). */
let turnCache: { at: number; body: string } | null = null;
async function turnServers(): Promise<Response> {
  const json = (body: string) =>
    new Response(body, {
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  if (turnCache && Date.now() - turnCache.at < 10 * 60_000) return json(turnCache.body);
  const env = process.env;
  let iceServers: unknown = [];
  try {
    if (env.CLOUDFLARE_TURN_KEY_ID && env.CLOUDFLARE_TURN_API_TOKEN) {
      const r = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${env.CLOUDFLARE_TURN_KEY_ID}/credentials/generate-ice-servers`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.CLOUDFLARE_TURN_API_TOKEN}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ ttl: 3600 }),
        },
      );
      if (r.ok) iceServers = ((await r.json()) as { iceServers?: unknown }).iceServers ?? [];
    } else if (env.METERED_TURN_DOMAIN && env.METERED_API_KEY) {
      const r = await fetch(
        `https://${env.METERED_TURN_DOMAIN}/api/v1/turn/credentials?apiKey=${env.METERED_API_KEY}`,
      );
      if (r.ok) iceServers = await r.json();
    }
  } catch {
    iceServers = [];
  }
  const body = JSON.stringify({ iceServers });
  if (Array.isArray(iceServers) ? iceServers.length : iceServers)
    turnCache = { at: Date.now(), body };
  return json(body);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // play.ilmstation.com opens IlmWorld straight away.
    const url = new URL(request.url);
    if (url.pathname === "/api/turn") return turnServers();
    // IlmWorld money: every change to a player's naira goes through the server
    // Paystack: buying IlmWorld naira
    if (url.pathname.startsWith("/api/pay/"))
      return import("./lib/pay-server").then((m) => m.handlePay(request, url.pathname));
    if (url.pathname === "/api/money")
      return import("./lib/money-server").then((m) => m.handleMoney(request));
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
    if (host.startsWith("play.") && url.pathname === "/")
      return new Response(null, { status: 302, headers: { location: "/world" + url.search } });
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
