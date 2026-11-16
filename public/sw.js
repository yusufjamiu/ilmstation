// IlmStation: no caching (always the newest version), an offline page, and notifications.
const OFFLINE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IlmStation</title></head>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#f7f3ea;font-family:Arial,sans-serif;color:#1c1a17;text-align:center;padding:24px">
<div style="border:3px solid #1c1a17;box-shadow:6px 6px 0 #1c1a17;background:#fff;padding:28px;max-width:360px">
<p style="font-size:48px;margin:0">📡</p><h1 style="font-family:Georgia,serif;font-weight:normal">You're offline</h1>
<p>Check your internet connection, then try again.</p>
<button onclick="location.reload()" style="border:2px solid #1c1a17;background:#e8c25b;padding:10px 18px;font-weight:bold">Try again</button></div></body></html>`;
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { "content-type": "text/html; charset=utf-8" } })));
});
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { /* not JSON */ }
  const m = Object.assign({}, d.notification || {}, d.data || {});
  e.waitUntil(self.registration.showNotification(m.title || "IlmStation", {
    body: m.body || "", icon: "/icon-192.png", badge: "/icon-192.png", tag: m.tag || undefined, data: { url: m.url || "/app" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/app";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) { c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
