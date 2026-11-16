import { createHash } from "node:crypto";
import { admin } from "./money-server";
import { esc, layout, sendEmail } from "./email-server";

/** "Partner with us" form on the About page (no login needed). */
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });

export async function handlePartner(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, error: "Use POST" }, 405);
  const a = await admin();
  if (!a) return json({ ok: false, error: "Server not set up" }, 500);
  let b: Record<string, unknown>;
  try { b = (await request.json()) as Record<string, unknown>; } catch { return json({ ok: false, error: "Bad request" }, 400); }
  if (b.website) return json({ ok: true }); // hidden trap field: bots fill it in
  const s = (k: string, n: number) => String(b[k] ?? "").trim().slice(0, n);
  const name = s("name", 80), org = s("org", 120), kind = s("kind", 30), phone = s("phone", 30), email = s("email", 120).toLowerCase(), message = s("message", 1000);
  if (!name || (!phone && !email)) return json({ ok: false, error: "Please give your name and a phone number or email." });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "That email doesn't look right." });

  // at most 5 messages a day from the same connection
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const day = new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
  const rref = a.db.doc(`partnerRate/${key}`);
  const r = await rref.get();
  const n = r.get("day") === day ? Number(r.get("n") ?? 0) : 0;
  if (n >= 5) return json({ ok: false, error: "Too many messages today. Please email admin@ilmstation.com." });
  await rref.set({ day, n: n + 1 });

  await a.db.collection("partnerEnquiries").add({ name, org, kind, phone, email, message, status: "new", createdAt: Date.now() });
  const summary = `<p><b>${esc(org || name)}</b>${kind ? ` · ${esc(kind)}` : ""}</p><p>${esc(name)}${phone ? ` · ${esc(phone)}` : ""}${email ? ` · ${esc(email)}` : ""}</p>${message ? `<p>“${esc(message)}”</p>` : ""}`;
  const team = await a.db.collection("admins").where("role", "in", ["owner", "admin"]).get();
  await Promise.all(team.docs.map((d) => String(d.get("email") ?? "")).filter(Boolean).map((to) => sendEmail(to, `${kind === "Sponsor" ? "New sponsor enquiry" : "New partnership enquiry"} from ${org || name}`,
    layout(kind === "Sponsor" ? "New sponsor enquiry" : "New partnership enquiry", summary, { label: "Open the admin", url: `https://www.ilmstation.com/admin?section=${kind === "Sponsor" ? "sponsors" : "about"}` }))));
  if (email) await sendEmail(email, "Thank you for reaching out to IlmStation", layout("Thank you for reaching out",
    `<p>Assalamu alaikum ${esc(name.split(" ")[0])}. Thank you for your interest in partnering with IlmStation. We've received your message and will be in touch soon, in shaa Allah.</p>${summary}`));
  return json({ ok: true });
}
