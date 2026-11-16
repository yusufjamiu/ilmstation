import { admin } from "./money-server";
import { esc, layout, sendEmail } from "./email-server";

/** Sunday report to each parent about their children (called by the weekly schedule). */
type Member = { uid: string; name: string; role: string; status: string };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
const ago = (t: number) => { if (!t) return "not yet"; const d = Math.floor((Date.now() - t) / 86_400_000); return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };

export async function handleWeekly(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "Not allowed" }, 401);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  const reportPremium = !!(((await a.db.doc("siteConfig/premium").get()).get("ticks") as Record<string, boolean> | undefined)?.report);
  const fams = await a.db.collection("families").get();
  let sent = 0;
  for (const f of fams.docs) {
    const kids = ((f.get("members") as Member[]) ?? []).filter((m) => m.role === "child" && m.status === "active");
    if (!kids.length) continue;
    if (reportPremium) {
      const ent = await a.db.doc(`entitlements/${f.id}`).get();
      if (Math.max(Number(ent.get("premiumUntil") ?? 0), Number(ent.get("familyUntil") ?? 0)) <= Date.now()) continue;
    }
    let to = "";
    try { to = (await a.auth.getUser(f.id)).email ?? ""; } catch { continue; }
    if (!to) continue;
    const snap = (f.get("reportSnap") as Record<string, number>) ?? {};
    const next: Record<string, number> = {};
    const rows: string[] = [];
    for (const k of kids) {
      const [pl, pr, ls] = await Promise.all([a.db.doc(`players/${k.uid}`).get(), a.db.doc(`profiles/${k.uid}`).get(), a.db.doc(`libraryState/${k.uid}`).get()]);
      const xp = Number(pl.get("xp") ?? 50);
      next[k.uid] = xp;
      const week = Math.max(0, xp - (snap[k.uid] ?? xp));
      const streak = Number((pr.get("streak") as { count?: number } | undefined)?.count ?? 0);
      const books = ((ls.get("finished") as string[]) ?? []).length;
      rows.push(`<tr><td style="padding:10px;border-top:2px solid #1c1a17"><b>${esc(k.name)}</b><br><span style="font-size:13px;color:#6b6458">Last active: ${ago(Number(pl.get("lastSeen") ?? 0))}</span></td>
        <td style="padding:10px;border-top:2px solid #1c1a17;text-align:center"><b>+${week}</b><br><span style="font-size:12px;color:#6b6458">XP this week</span></td>
        <td style="padding:10px;border-top:2px solid #1c1a17;text-align:center"><b>${streak}</b><br><span style="font-size:12px;color:#6b6458">day streak</span></td>
        <td style="padding:10px;border-top:2px solid #1c1a17;text-align:center"><b>${books}</b><br><span style="font-size:12px;color:#6b6458">books</span></td></tr>`);
    }
    const ok = await sendEmail(to, "Your weekly family report", layout("This week on IlmStation",
      `<p>Assalamu alaikum. Here’s how your children did this week.</p><table style="width:100%;border-collapse:collapse;margin-top:8px">${rows.join("")}</table>`,
      { label: "Open Family hub", url: "https://ilmstation.com/app?s=family" }));
    await f.ref.set({ reportSnap: next, reportAt: Date.now() }, { merge: true });
    if (ok === true) sent++;
  }
  return json({ ok: true, sent });
}

/** Send a test email (protected by CRON_SECRET) and show exactly what happened. */
export async function handleEmailTest(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "Not allowed (check CRON_SECRET)" }, 401);
  const to = new URL(request.url).searchParams.get("to") ?? "";
  const result = await sendEmail(to, "IlmStation test email", layout("It works!", "<p>This is a test email from IlmStation.</p>"));
  return json({ to, result, hasKey: !!process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM ?? "(EMAIL_FROM not set)" });
}

/** Every morning: "trial ends in 2 days" and "Premium ends in 3 days" emails (once each). */
export async function handleDaily(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "Not allowed" }, 401);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  const DAY = 86_400_000, now = Date.now();
  const snap = await a.db.collection("entitlements").where("premiumUntil", ">", now).where("premiumUntil", "<", now + 3 * DAY).get();
  let sent = 0;
  for (const d of snap.docs) {
    const until = Number(d.get("premiumUntil") ?? 0);
    const trial = d.get("source") === "trial";
    const flag = trial ? "remindTrial" : "remindEnd";
    if (Number(d.get(flag) ?? 0) === until) continue; // already reminded for this end date
    if (trial && until - now > 2 * DAY) continue;      // trials: 2 days before
    let to = "";
    try { to = (await a.auth.getUser(d.id)).email ?? ""; } catch { continue; }
    if (!to || to.endsWith("@kids.ilmstation.com")) continue;
    const name = String((await a.db.doc(`profiles/${d.id}`).get()).get("name") ?? "").split(" ")[0];
    const date = new Date(until).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const ok = trial
      ? await sendEmail(to, "Your free trial ends in 2 days", layout("Your free trial ends soon",
          `<p>Assalamu alaikum${name ? ` ${esc(name)}` : ""}. Your free Premium trial ends on <b>${date}</b>.</p><p>Keep enjoying every Premium book, audiobook, lesson and game by choosing a plan. Monthly and yearly options are available.</p>`,
          { label: "Choose a plan", url: "https://www.ilmstation.com/app?s=rewards" }))
      : await sendEmail(to, "Your Premium ends in 3 days", layout("Your Premium ends soon",
          `<p>Assalamu alaikum${name ? ` ${esc(name)}` : ""}. Your IlmStation Premium ends on <b>${date}</b>.</p><p>Renew to keep your Premium books, audio, lessons and games. Your progress is always kept.</p>`,
          { label: "Renew Premium", url: "https://www.ilmstation.com/app?s=rewards" }));
    if (ok === true) { await d.ref.set({ [flag]: until }, { merge: true }); sent++; }
  }
  return json({ ok: true, sent });
}
