/** Serves Firebase Storage images from our own site, so flyers can use book covers. */
export async function handleImg(request: Request): Promise<Response> {
  const u = new URL(request.url).searchParams.get("u") ?? "";
  let t: URL;
  try { t = new URL(u); } catch { return new Response("bad", { status: 400 }); }
  if (t.hostname !== "firebasestorage.googleapis.com" && !t.hostname.endsWith(".firebasestorage.app")) return new Response("forbidden", { status: 403 });
  const r = await fetch(t);
  if (!r.ok || !(r.headers.get("content-type") ?? "").startsWith("image/")) return new Response("not found", { status: 404 });
  return new Response(r.body, { headers: { "content-type": r.headers.get("content-type") ?? "image/png", "cache-control": "public, max-age=86400" } });
}
