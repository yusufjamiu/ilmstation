import { esc, layout, sendEmail } from "./email-server";
import { getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { admin } from "./money-server";

/** Called every minute by cron-job.org: sends whatever notifications are due. */
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
type Prefs = { wisdom: boolean; prayer: boolean; streak: boolean; kahf: boolean; ramadan: boolean; tilawah?: boolean };
const WISDOM_AT = 7 * 60 + 30, STREAK_AT = 19 * 60, KAHF_AT = 9 * 60, WINDOW = 15;
const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function local(now: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
    .formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, dmy: `${p.day}-${p.month}-${p.year}`, mins: Number(p.hour) * 60 + Number(p.minute), weekday: p.weekday };
}
const due = (mins: number, at: number) => mins >= at && mins < at + WINDOW;
const hm = (s: string) => { const m = /(\d{1,2}):(\d{2})/.exec(s); return m ? Number(m[1]) * 60 + Number(m[2]) : -1; };

export async function handleNotify(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "Not allowed" }, 401);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  const messaging = getMessaging(getApps()[0]);
  const now = new Date();

  // today's Daily Wisdom (pinned for today, else the day's rotation)
  const wisdomCache: Record<string, string> = {};
  const wisdomFor = async (date: string) => {
    if (wisdomCache[date]) return wisdomCache[date];
    try {
      const docs = (await a.db.collection("wisdom").get()).docs.map((d) => d.data()).filter((w) => w.active !== false && String(w.text ?? "").trim());
      const pinned = docs.find((w) => w.date === date);
      const list = docs.filter((w) => !w.date).sort((x, y) => Number(x.createdAt ?? 0) - Number(y.createdAt ?? 0));
      const day = Math.floor((Date.parse(date) - Date.parse(`${date.slice(0, 4)}-01-01`)) / 86_400_000) + 1;
      const w = pinned ?? (list.length ? list[day % list.length] : undefined);
      const text = String(w?.text ?? w?.english ?? w?.translation ?? "").trim();
      const src = String(w?.source ?? w?.ref ?? "").trim();
      wisdomCache[date] = text ? `${text.length > 150 ? `${text.slice(0, 147)}…` : text}${src ? ` · ${src}` : ""}` : "";
    } catch { wisdomCache[date] = ""; }
    return wisdomCache[date] || "A new reminder is waiting for you. Tap to read and share it.";
  };

  // Ramadan quizzes that just opened
  const opened = (await a.db.collection("ramadanDays").where("opensAt", ">", now.getTime() - WINDOW * 60_000).where("opensAt", "<=", now.getTime()).get().catch(() => null))?.docs ?? [];

  // Ramadan winners: email + notification once results are out
  const outNow = (await a.db.collection("ramadanDays").where("resultsAt", ">", now.getTime() - 60 * 60_000).where("resultsAt", "<=", now.getTime()).get().catch(() => null))?.docs ?? [];
  for (const dd of outNow) {
    if (dd.get("winnersNotified")) continue;
    await dd.ref.set({ winnersNotified: true }, { merge: true });
    const w = Number(dd.get("winners") ?? 3), prize = String(dd.get("prize") ?? "");
    const rows = (await a.db.collection(`ramadanResults/${dd.id}/list`).orderBy("rankKey").limit(w * 2).get()).docs.filter((r) => r.get("correct") === true && r.get("recentWinner") !== true).slice(0, w);
    for (const r of rows) {
      const name = String(r.get("name") ?? "").split(" ")[0];
      try {
        const em = (await a.auth.getUser(r.id)).email ?? "";
        await sendEmail(em, `🏆 You won Day ${dd.id}'s prize quiz!`, layout("Congratulations, you won! 🏆",
          `<p>Assalamu alaikum${name ? ` ${esc(name)}` : ""}. You're one of today's winners of the Ramadan prize quiz${prize ? `: <b>${esc(prize)}</b>` : ""}.</p><p>Open <b>Ramadan</b> in the app and send your details <b>within 7 days</b> so we can send your prize.</p>`,
          { label: "Claim my prize", url: "https://www.ilmstation.com/app?s=ramadan" }));
      } catch { /* no email */ }
      const toks = (((await a.db.doc(`push/${r.id}`).get()).get("tokens") as string[]) ?? []).filter(Boolean);
      if (toks.length) await messaging.sendEachForMulticast({ tokens: toks, data: { title: "🏆 You won today’s prize quiz!", body: "Open Ramadan and send your details to claim your prize.", url: "/app?s=ramadan", tag: `won${dd.id}` }, webpush: { headers: { Urgency: "high" } } }).catch(() => null);
    }
  }

  const users = await a.db.collection("push").get();
  let sent = 0;
  for (const u of users.docs) {
    const d = u.data();
    const tokens = ((d.tokens as string[]) ?? []).filter(Boolean);
    if (!tokens.length) continue;
    const prefs = (d.prefs ?? {}) as Prefs;
    const tz = String(d.tz || "Africa/Lagos");
    const t = local(now, tz);
    const done = (d.sent?.day === t.date ? d.sent.keys : {}) as Record<string, boolean>;
    const out: { key: string; title: string; body: string; url: string }[] = [];

    if (prefs.wisdom && due(t.mins, WISDOM_AT) && !done.wisdom) out.push({ key: "wisdom", title: "🌅 Today’s Daily Wisdom", body: await wisdomFor(t.date), url: "/app?s=home" });
    if (prefs.kahf && t.weekday === "Fri" && due(t.mins, KAHF_AT) && !done.kahf) out.push({ key: "kahf", title: "📖 Jumu‘ah Mubarak", body: "Don’t forget to read Surah Al-Kahf today.", url: "/app?s=home" });
    if (prefs.tilawah && !done.tilawah) {
      const at = hm(String(d.tilawahAt ?? "05:30"));
      const days = (d.tilawahDays as number[] | undefined) ?? [0, 1, 2, 3, 4, 5, 6];
      const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(t.weekday);
      if (at >= 0 && days.includes(wd) && due(t.mins, at)) {
        const pg = Number(((await a.db.doc(`hifz/${u.id}`).get()).get("tilawah") as { page?: number } | undefined)?.page ?? 0);
        out.push({ key: "tilawah", title: "📖 Time for your daily tilawah", body: pg > 1 ? `Continue from page ${pg}. A few pages bring light to your day.` : "Open the Qur’an and read a few pages today.", url: "/app?s=hifz" });
      }
    }
    if (d.studyAt && !done.study && due(t.mins, hm(String(d.studyAt)))) {
      const lessons = (((await a.db.doc(`studyProgress/${u.id}`).get()).get("done") as Record<string, number> | undefined) ?? {});
      const today = Object.values(lessons).some((ms) => typeof ms === "number" && local(new Date(ms), tz).date === t.date);
      if (!today) out.push({ key: "study", title: `📖 Your ${String(d.studyLabel || "study")} lesson is waiting`, body: "A few minutes today keeps you on track with your plan.", url: "/app?s=study" });
      else done.study = true;
    }
    if (prefs.streak && due(t.mins, STREAK_AT) && !done.streak) {
      const lastSeen = Number((await a.db.doc(`players/${u.id}`).get()).get("lastSeen") ?? 0);
      if (local(new Date(lastSeen || 0), tz).date !== t.date) {
        const count = Number(((await a.db.doc(`profiles/${u.id}`).get()).get("streak") as { count?: number } | undefined)?.count ?? 0);
        out.push({ key: "streak", title: count > 1 ? `🔥 Keep your ${count}-day streak!` : "🔥 A little learning today?", body: "Open IlmStation for a quick quiz or today’s wisdom.", url: "/app" });
      }
    }
    if (prefs.ramadan) for (const r of opened) if (!done[`ramadan${r.id}`]) out.push({ key: `ramadan${r.id}`, title: `🏆 Day ${r.id} prize quiz is open`, body: r.get("prize") ? `Answer quickly to win ${r.get("prize")}.` : "Answer quickly to win today’s prizes.", url: "/app?s=ramadan" });
    // same city and method as the Today page (else the phone's location)
    const rp = prefs.prayer ? ((await a.db.doc(`ramadanProgress/${u.id}`).get()).data() ?? {}) : {};
    const city = rp.city as { name?: string; country?: string; lat?: number; lng?: number; method?: number } | undefined;
    const pick = String(rp.prayerMethod ?? d.method ?? "");
    const meth = !pick || pick === "country" ? (city?.method != null ? String(city.method) : "") : pick;
    const where = city?.lat != null && city?.lng != null ? `timings/${t.dmy}?latitude=${city.lat}&longitude=${city.lng}`
      : city?.name ? `timingsByCity/${t.dmy}?city=${encodeURIComponent(city.name)}&country=${encodeURIComponent(city.country ?? "")}`
      : typeof d.lat === "number" && typeof d.lng === "number" ? `timings/${t.dmy}?latitude=${d.lat}&longitude=${d.lng}` : "";
    const tkey = `${where}|${meth}`;
    if (prefs.prayer && where) {
      let times = d.times as { day: string; tz: string; list: Record<string, number>; key?: string } | undefined;
      if (!times || times.day !== t.date || times.key !== tkey) {
        try {
          const m = /^\d+$/.test(meth) ? `&method=${meth}` : "";
          const j = (await (await fetch(`https://api.aladhan.com/v1/${where}${m}`)).json()) as { data?: { timings?: Record<string, string>; meta?: { timezone?: string } } };
          const list = Object.fromEntries(PRAYERS.map((p) => [p, hm(j.data?.timings?.[p] ?? "")]));
          times = { day: t.date, tz: j.data?.meta?.timezone || tz, list, key: tkey };
          await u.ref.set({ times }, { merge: true });
        } catch { times = undefined; }
      }
      if (times) {
        const pt = local(now, times.tz);
        for (const p of PRAYERS) if (times.list[p] >= 0 && pt.mins >= times.list[p] && pt.mins < times.list[p] + 10 && !done[`p${p}`])
          out.push({ key: `p${p}`, title: `🕌 It’s time for ${p}`, body: "Hayya ‘ala-s-salah. Come to prayer.", url: "/app?s=home" });
      }
    }
    if (!out.length) continue;

    const bad = new Set<string>();
    for (const m of out) {
      const r = await messaging.sendEachForMulticast({ tokens, data: { title: m.title, body: m.body, url: m.url, tag: m.key }, webpush: { headers: { Urgency: "high", TTL: "3600" } } }).catch(() => null);
      r?.responses.forEach((x, i) => { const c = x.error?.code ?? ""; if (c.includes("registration-token-not-registered") || c.includes("invalid-registration-token") || c.includes("invalid-argument")) bad.add(tokens[i]); });
      if (r?.successCount) sent++;
      done[m.key] = true;
    }
    await u.ref.set({ sent: { day: t.date, keys: done }, ...(bad.size ? { tokens: tokens.filter((x) => !bad.has(x)) } : {}) }, { merge: true });
  }
  return json({ ok: true, sent });
}
