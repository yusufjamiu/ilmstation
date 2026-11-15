import { FieldValue } from "firebase-admin/firestore";
import { admin } from "./money-server";
import { mergePremium } from "./premium-config";

/** Family plans: the payer adds people by email; members get Premium while the plan lasts. */
type Member = { uid: string; email: string; name: string; role: "adult" | "child"; status: "invited" | "active"; at: number; managed?: boolean };
const KID_DOMAIN = "kids.ilmstation.com";
const int = (v: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function handleFamily(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const a = await admin();
  if (!a) return json({ error: "Server not set up" }, 500);
  let uid: string; let email = "";
  try { const t = await a.auth.verifyIdToken((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "")); uid = t.uid; email = (t.email ?? "").toLowerCase(); } catch { return json({ error: "Not signed in" }, 401); }
  const { action, data = {} } = (await request.json().catch(() => ({}))) as { action?: string; data?: Record<string, unknown> };
  const cfg = mergePremium((await a.db.doc("siteConfig/premium").get()).data());
  const now = Date.now();
  const famRef = (owner: string) => a.db.doc(`families/${owner}`);
  const entRef = (u: string) => a.db.doc(`entitlements/${u}`);
  const profRef = (u: string) => a.db.doc(`profiles/${u}`);

  /** Is this person's current plan a family plan that's still running? */
  const planOf = async (owner: string) => {
    const e = await entRef(owner).get();
    const until = Number(e.get("premiumUntil") ?? 0);
    const plan = cfg.plans.find((p) => p.id === e.get("plan"));
    const adults = plan?.adults ?? 1; const kids = plan?.kids ?? 0;
    return { until, plan, adults, kids, active: until > now && !!plan && (kids > 0 || adults > 1) };
  };
  /** Save the member list plus quick lookups used by invites and the rules. */
  const write = (tx: FirebaseFirestore.Transaction, owner: string, ownerName: string, members: Member[]) => tx.set(famRef(owner), {
    owner, ownerName, members,
    inviteEmails: members.filter((m) => m.status === "invited").map((m) => m.email),
    memberUids: members.filter((m) => m.status === "active").map((m) => m.uid),
    updatedAt: now,
  });

  if (action === "get") {
    const fam = await famRef(uid).get();
    const invites = email ? (await a.db.collection("families").where("inviteEmails", "array-contains", email).get()).docs.map((d) => ({ owner: d.id, ownerName: (d.get("ownerName") as string) ?? "A family" })) : [];
    const memberOf = ((await profRef(uid).get()).get("familyOf") as string | undefined) ?? null;
    const memberOfName = memberOf ? (((await famRef(memberOf).get()).get("ownerName") as string) ?? null) : null;
    const p = await planOf(uid);
    return json({ ok: true, family: { members: (fam.get("members") as Member[]) ?? [] }, invites, memberOf, memberOfName,
      plan: p.plan ? { id: p.plan.id, name: p.plan.name, adults: p.adults, kids: p.kids } : null, familyActive: p.active });
  }

  if (action === "invite") {
    const p = await planOf(uid);
    if (!p.active) return json({ ok: false, error: "Choose a Family plan first (Wallet & store → Premium)." });
    const target = String(data.email ?? "").trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(target)) return json({ ok: false, error: "Enter their email." });
    if (target === email) return json({ ok: false, error: "That’s your own email." });
    let tu: string;
    try { tu = (await a.auth.getUserByEmail(target)).uid; } catch { return json({ ok: false, error: "No IlmStation account with that email. Ask them to sign up first." }); }
    const prof = await profRef(tu).get();
    if (prof.get("familyOf") && prof.get("familyOf") !== uid) return json({ ok: false, error: "They’re already in another family plan." });
    const role: Member["role"] = prof.get("zone") === "kids" || prof.get("zone") === "youth" ? "child" : "adult";
    const ownerName = ((await profRef(uid).get()).get("name") as string) ?? "Your family";
    const r = await a.db.runTransaction(async (tx) => {
      const fam = await tx.get(famRef(uid));
      const members = ((fam.get("members") as Member[]) ?? []).slice();
      if (members.some((m) => m.email === target)) return { ok: false, error: "They’re already on your plan." };
      const used = members.filter((m) => m.role === role).length;
      const max = role === "adult" ? p.adults - 1 : p.kids;
      if (used >= max) return { ok: false, error: role === "adult" ? "All adult seats are taken." : "All child seats are taken." };
      members.push({ uid: tu, email: target, name: (prof.get("name") as string) ?? target, role, status: "invited", at: now });
      write(tx, uid, ownerName, members);
      return { ok: true };
    });
    return json(r);
  }

  if (action === "accept" || action === "decline") {
    const owner = String(data.owner ?? "");
    if (!owner) return json({ ok: false, error: "Invite not found." });
    if (action === "accept" && (await profRef(uid).get()).get("familyOf")) return json({ ok: false, error: "Leave your current family plan first." });
    const p = await planOf(owner);
    const r = await a.db.runTransaction(async (tx) => {
      const fam = await tx.get(famRef(owner));
      const members = ((fam.get("members") as Member[]) ?? []).slice();
      const i = members.findIndex((m) => m.email === email && m.status === "invited");
      if (i < 0) return { ok: false, error: "Invite not found." };
      if (action === "decline") members.splice(i, 1);
      else {
        members[i] = { ...members[i]!, uid, status: "active", at: now };
        tx.set(profRef(uid), { familyOf: owner }, { merge: true });
        tx.set(entRef(uid), { familyUntil: p.until }, { merge: true });
      }
      write(tx, owner, (fam.get("ownerName") as string) ?? "A family", members);
      return { ok: true };
    });
    return json(r);
  }

  if (action === "leave" || action === "remove") {
    if (action === "leave" && (await profRef(uid).get()).get("managed")) return json({ ok: false, error: "Ask your parent to change this." });
    const owner = action === "leave" ? (((await profRef(uid).get()).get("familyOf") as string | undefined) ?? "") : uid;
    const who = action === "leave" ? uid : String(data.uid ?? "");
    if (!owner || !who) return json({ ok: false, error: "Nothing to remove." });
    const r = await a.db.runTransaction(async (tx) => {
      const fam = await tx.get(famRef(owner));
      const members = ((fam.get("members") as Member[]) ?? []).slice();
      const m = members.find((x) => x.uid === who);
      if (!m) return { ok: false, error: "Not on this plan." };
      if (m.status === "active") {
        tx.set(profRef(who), { familyOf: FieldValue.delete() }, { merge: true });
        tx.set(entRef(who), { familyUntil: FieldValue.delete() }, { merge: true });
      }
      write(tx, owner, (fam.get("ownerName") as string) ?? "A family", members.filter((x) => x.uid !== who));
      return { ok: true };
    });
    return json(r);
  }

  // a parent creates an account for a child (no email: they log in with a username)
  if (action === "createChild") {
    const name = String(data.name ?? "").trim().slice(0, 40);
    const age = int(data.age, 0, 99);
    const gender = data.gender === "female" ? "female" : data.gender === "male" ? "male" : null;
    const username = String(data.username ?? "").trim().toLowerCase();
    const password = String(data.password ?? "");
    if (!name) return json({ ok: false, error: "Add their first name." });
    if (age < 4 || age > 17) return json({ ok: false, error: "Age must be between 4 and 17." });
    if (!gender) return json({ ok: false, error: "Choose boy or girl." });
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return json({ ok: false, error: "Username: 3–20 letters, numbers or _." });
    if (password.length < 6) return json({ ok: false, error: "Password: at least 6 characters." });
    const fam = await famRef(uid).get();
    const members = ((fam.get("members") as Member[]) ?? []).slice();
    if (members.filter((m) => m.managed).length >= 8) return json({ ok: false, error: "You can add up to 8 children." });
    if ((await a.db.doc(`usernames/${username}`).get()).exists) return json({ ok: false, error: "That username is taken. Try another." });
    const kidEmail = `${username}@${KID_DOMAIN}`;
    let kidUid: string;
    try { kidUid = (await a.auth.createUser({ email: kidEmail, password, displayName: name })).uid; } catch { return json({ ok: false, error: "Couldn't create the account. Try another username." }); }
    const zone = age <= 12 ? "kids" : "youth";
    await a.db.doc(`usernames/${username}`).set({ uid: kidUid });
    await profRef(kidUid).set({ name, username, email: kidEmail, zone, gender, age, level: "Beginner", xp: 50, language: "en", interests: [], guardian: uid, familyOf: uid, managed: true, createdAt: now }, { merge: true });
    const p = await planOf(uid);
    const kidsWithPremium = members.filter((m) => m.role === "child" && m.status === "active").length;
    if (p.active && kidsWithPremium < p.kids) await entRef(kidUid).set({ familyUntil: p.until }, { merge: true });
    const ownerName = (((await profRef(uid).get()).get("name") as string) ?? "Your family");
    await a.db.runTransaction(async (tx) => {
      const f = await tx.get(famRef(uid));
      const list = ((f.get("members") as Member[]) ?? []).slice();
      list.push({ uid: kidUid, email: kidEmail, name, role: "child", status: "active", at: now, managed: true });
      write(tx, uid, ownerName, list);
    });
    return json({ ok: true, username });
  }

  // parent resets or removes a child account they made
  if (action === "resetChild" || action === "removeChild") {
    const kid = String(data.uid ?? "");
    const fam = await famRef(uid).get();
    const members = ((fam.get("members") as Member[]) ?? []);
    const m = members.find((x) => x.uid === kid && x.managed);
    if (!m) return json({ ok: false, error: "Child not found." });
    if (action === "resetChild") {
      const password = String(data.password ?? "");
      if (password.length < 6) return json({ ok: false, error: "Password: at least 6 characters." });
      await a.auth.updateUser(kid, { password });
      return json({ ok: true });
    }
    const username = m.email.split("@")[0] ?? "";
    await Promise.all([
      a.auth.deleteUser(kid).catch(() => {}),
      profRef(kid).delete(), entRef(kid).delete(),
      username ? a.db.doc(`usernames/${username}`).delete() : Promise.resolve(),
      a.db.doc(`players/${kid}`).delete().catch(() => {}),
    ]);
    await a.db.runTransaction(async (tx) => {
      const f = await tx.get(famRef(uid));
      write(tx, uid, (f.get("ownerName") as string) ?? "A family", ((f.get("members") as Member[]) ?? []).filter((x) => x.uid !== kid));
    });
    return json({ ok: true });
  }

  // the owner's view of each child's progress
  if (action === "summary") {
    const kids = (((await famRef(uid).get()).get("members") as Member[]) ?? []).filter((m) => m.status === "active" && m.role === "child");
    const list = await Promise.all(kids.map(async (m) => {
      const [pl, pr, ls] = await Promise.all([a.db.doc(`players/${m.uid}`).get(), profRef(m.uid).get(), a.db.doc(`libraryState/${m.uid}`).get()]);
      return { uid: m.uid, xp: Number(pl.get("xp") ?? 50), streak: Number((pr.get("streak") as { count?: number } | undefined)?.count ?? 0),
        lastActive: Number(pl.get("lastSeen") ?? 0), books: ((ls.get("finished") as string[]) ?? []).length };
    }));
    return json({ ok: true, list });
  }

  return json({ error: "Unknown action" }, 400);
}
