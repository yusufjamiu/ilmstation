/** Today's exchange rates (base USD), refreshed every 12 hours. Display only. */
let mem: { at: number; rates: Record<string, number> } | null = null;
export async function handleFx(): Promise<Response> {
  if (!mem || Date.now() - mem.at > 12 * 3_600_000) {
    try {
      const j = (await (await fetch("https://open.er-api.com/v6/latest/USD")).json()) as { rates?: Record<string, number> };
      if (j.rates) mem = { at: Date.now(), rates: j.rates };
    } catch { /* keep the last rates */ }
  }
  return new Response(JSON.stringify({ rates: mem?.rates ?? {} }), { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } });
}
