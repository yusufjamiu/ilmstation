import { createHash } from "node:crypto";
import { admin } from "./money-server";
import { layout, sendEmail } from "./email-server";

/** "Forgot password?": our own branded reset email through Resend. Always answers ok (never reveals accounts). */
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });

export async function handleReset(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false }, 405);
  const a = await admin();
  if (!a) return json({ ok: false }, 500);
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith("@kids.ilmstation.com")) return json({ ok: true });
  // at most 5 requests a day from the same connection
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const key = createHash("sha256").update(`reset:${ip}`).digest("hex").slice(0, 32);
  const day = new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
  const rref = a.db.doc(`partnerRate/${key}`);
  const r = await rref.get();
  const n = r.get("day") === day ? Number(r.get("n") ?? 0) : 0;
  if (n >= 5) return json({ ok: true });
  await rref.set({ day, n: n + 1 });
  try {
    let link = "";
    try { link = await a.auth.generatePasswordResetLink(email, { url: "https://www.ilmstation.com/login" }); }
    catch (e) {
      const code = String((e as { code?: string }).code ?? "");
      if (code.includes("user-not-found")) throw e;
      console.error("Reset link with return page failed, trying without:", code, e);
      link = await a.auth.generatePasswordResetLink(email);
    }
    await sendEmail(email, "Reset your IlmStation password", layout("Reset your password",
      `<p>Assalamu alaikum. We received a request to reset the password for your IlmStation account.</p><p>Tap the button to choose a new password. The link works for 1 hour.</p><p style="font-size:13px;color:#6b6458">If you didn't ask for this, you can ignore this email. Your password won't change.</p>`,
      { label: "Set a new password", url: link }));
  } catch (e) {
    const code = String((e as { code?: string }).code ?? "");
    if (!code.includes("user-not-found")) console.error("Password reset failed:", code, e);
  }
  return json({ ok: true });
}
