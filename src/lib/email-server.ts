/** Sends emails through Resend. Does nothing until RESEND_API_KEY is set. */
const FROM = process.env.EMAIL_FROM ?? "IlmStation <noreply@ilmstation.com>";

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to || to.endsWith("@kids.ilmstation.com")) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, reply_to: "admin@ilmstation.com" }),
    });
    if (!r.ok) console.error("Resend error", r.status, await r.text().catch(() => ""));
    return r.ok;
  } catch (e) { console.error("Resend failed", e); return false; }
}

/** IlmStation-styled email. */
export function layout(title: string, body: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f7f3ea;font-family:Arial,Helvetica,sans-serif;color:#1c1a17">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <p style="margin:0 0 16px"><span style="display:inline-block;width:36px;height:36px;background:#1c1a17;color:#f7f3ea;text-align:center;line-height:36px;font-family:Georgia,serif;font-size:22px;vertical-align:middle">I</span>
  <span style="font-family:Georgia,serif;font-size:22px;vertical-align:middle;margin-left:8px">IlmStation</span></p>
  <div style="border:3px solid #1c1a17;background:#ffffff;box-shadow:6px 6px 0 #1c1a17;padding:24px">
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 12px">${esc(title)}</h1>
    ${body}
    ${cta ? `<p style="margin:24px 0 0"><a href="${cta.url}" style="display:inline-block;background:#e8c25b;color:#1c1a17;border:2px solid #1c1a17;padding:12px 18px;font-weight:bold;text-decoration:none">${esc(cta.label)}</a></p>` : ""}
  </div>
  <p style="font-size:12px;color:#6b6458;margin-top:16px">IlmStation · Seek · Learn · Grow · <a href="https://ilmstation.com" style="color:#6b6458">ilmstation.com</a></p>
</div></body></html>`;
}
