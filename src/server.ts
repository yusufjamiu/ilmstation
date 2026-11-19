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
    // Library: star ratings and each book's average
    if (url.pathname === "/api/rate")
      return import("./lib/rate-server").then((m) => m.handleRate(request));
    if (url.pathname === "/api/xp")
      return import("./lib/xp-server").then((m) => m.handleXp(request));
    if (url.pathname === "/api/premium")
      return import("./lib/premium-server").then((m) => m.handlePremium(request));
    if (url.pathname === "/api/family")
      return import("./lib/family-server").then((m) => m.handleFamily(request));
    if (url.pathname === "/api/hifz-stt")
      return import("./lib/stt-server").then((m) => m.handleStt(request));
    // Qira'ah lessons: Arabic read aloud with every harakah (OpenAI voice)
    if (url.pathname === "/api/tts")
      return import("./lib/tts-server").then((m) => m.handleTts(request));
    if (url.pathname === "/api/fx")
      return import("./lib/fx-server").then((m) => m.handleFx());
    if (url.pathname === "/api/version")
      return new Response(JSON.stringify({ v: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    if (url.pathname === "/api/reset")
      return import("./lib/reset-server").then((m) => m.handleReset(request));
    if (url.pathname === "/api/img")
      return import("./lib/img-server").then((m) => m.handleImg(request));
    if (url.pathname === "/api/partner")
      return import("./lib/partner-server").then((m) => m.handlePartner(request));
    if (url.pathname === "/api/admin-stats")
      return import("./lib/stats-server").then((m) => m.handleStats(request));
    if (url.pathname === "/api/cron/weekly")
      return import("./lib/report-server").then((m) => m.handleWeekly(request));
    if (url.pathname === "/api/cron/notify")
      return import("./lib/notify-server").then((m) => m.handleNotify(request));
    if (url.pathname === "/api/cron/daily")
      return import("./lib/report-server").then((m) => m.handleDaily(request));
    if (url.pathname === "/api/email-test")
      return import("./lib/report-server").then((m) => m.handleEmailTest(request));
    if (url.pathname === "/api/study-exam")
      return import("./lib/study-server").then((m) => m.handleStudyExam(request));
    // Ramadan prize quiz: marked on the server
    if (url.pathname === "/api/ramadan-quiz")
      return import("./lib/ramadan-server").then((m) => m.handleRamadanQuiz(request));
    if (url.pathname === "/api/ramadan-payout")
      return import("./lib/ramadan-server").then((m) => m.handleRamadanPayout(request));
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