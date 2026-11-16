import { collection as fsCol, limit as fsLimit, onSnapshot as fsSnap, orderBy as fsOrder, query as fsQuery, updateDoc as fsUpdate } from "firebase/firestore";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Page, Panel } from "@/components/admin/ui";

type Advisor = { id: string; name: string; title: string; bio: string; photoUrl: string };
type Partner = { id: string; name: string; kind: string; url: string; logoUrl: string };
type About = { mission: string; team: Advisor[]; advisors: Advisor[]; partners: Partner[]; flyerTitle: string; flyerPoints: string[] };

const DEFAULT_MISSION = `IlmStation is a home for Islamic learning, built for Muslim families. We want every child, teen and adult to learn a little every day, in a way that is joyful, trustworthy and close to the Qur'an and Sunnah.

We bring together daily reminders, quizzes, a library of books and audiobooks, Qur'an memorisation, step-by-step lessons and a safe community, so that learning fits into everyday life at home, at school and at the masjid.

IlmStation is built in Nigeria by IlmStation Limited, with care for authentic sources, good manners and the safety of children.`;
const KINDS = ["Masjid", "School", "Madrasah", "MSSN", "Sponsor", "Organisation"];
const ENQUIRY_KINDS = ["Masjid", "School", "Madrasah", "MSSN", "Scholar or teacher", "Sponsor", "Other"];
const FLYER_TITLE = "Bring IlmStation to your community";
const FLYER_POINTS = ["Daily Islamic learning for kids, teens and adults", "Quizzes, library, Qur'an memorisation and lessons", "Free Premium seats for your students", "Your name on our partners page"];

/** Draw the square partnership flyer. */
function drawFlyer(c: HTMLCanvasElement, title: string, points: string[]) {
  const W = 1080; c.width = W; c.height = W;
  const x = c.getContext("2d"); if (!x) return;
  const wrap = (text: string, maxW: number) => { const out: string[] = []; let line = ""; for (const w of text.split(" ")) { const t = line ? `${line} ${w}` : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; };
  x.fillStyle = "#e8c25b"; x.fillRect(0, 0, W, W);
  x.fillStyle = "#1c1a17"; x.fillRect(74, 74, W - 128, W - 128);
  x.fillStyle = "#f7f3ea"; x.fillRect(54, 54, W - 128, W - 128);
  x.lineWidth = 8; x.strokeStyle = "#1c1a17"; x.strokeRect(54, 54, W - 128, W - 128);
  x.fillStyle = "#e8c25b"; x.fillRect(110, 120, 420, 64); x.strokeRect(110, 120, 420, 64);
  x.fillStyle = "#1c1a17"; x.font = "bold 34px Arial, sans-serif"; x.textBaseline = "middle"; x.fillText("PARTNER WITH US", 140, 153);
  x.textBaseline = "alphabetic"; x.font = "76px Georgia, serif";
  let y = 300; for (const l of wrap(title, 820)) { x.fillText(l, 110, y); y += 88; }
  y += 20; x.font = "38px Arial, sans-serif";
  for (const p of points.slice(0, 5)) { x.fillStyle = "#1c1a17"; x.fillRect(110, y - 30, 30, 30); x.fillStyle = "#e8c25b"; x.font = "bold 26px Arial"; x.fillText("✓", 114, y - 6); x.fillStyle = "#1c1a17"; x.font = "38px Arial, sans-serif"; for (const [i, l] of wrap(p, 760).entries()) { x.fillText(l, 165, y + i * 48); } y += 48 * wrap(p, 760).length + 26; }
  x.fillStyle = "#1c1a17"; x.fillRect(110, 860, 80, 80); x.fillStyle = "#f7f3ea"; x.font = "56px Georgia, serif"; x.fillText("I", 138, 920);
  x.fillStyle = "#1c1a17"; x.font = "46px Georgia, serif"; x.fillText("IlmStation", 210, 900);
  x.font = "28px Arial, sans-serif"; x.fillText("ilmstation.com/about · admin@ilmstation.com", 210, 940);
}
async function flyerFile(title: string, points: string[]) {
  const c = document.createElement("canvas"); drawFlyer(c, title, points);
  return new Promise<File | null>((res) => c.toBlob((b) => res(b ? new File([b], "ilmstation-partner.png", { type: "image/png" }) : null), "image/png"));
}
async function downloadFlyer(title: string, points: string[]) {
  const f = await flyerFile(title, points); if (!f) return;
  const url = URL.createObjectURL(f); const link = document.createElement("a"); link.href = url; link.download = f.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** About page: flyer + "Partner with us" form. */
function PartnerSection({ title, points }: { title: string; points: string[] }) {
  const [f, setF] = useState({ name: "", org: "", kind: "Masjid", phone: "", email: "", message: "", website: "" });
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const send = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (j.ok) setDone(true); else toast.error(j.error ?? "Couldn't send. Try again.");
    } catch { toast.error("Couldn't send. Check your connection."); } finally { setBusy(false); }
  };
  const share = async () => { const file = await flyerFile(title, points); if (!file) return; try { await navigator.share({ files: [file], title: "Partner with IlmStation", text: "https://www.ilmstation.com/about" }); } catch { /* cancelled */ } };
  return <section className="mt-16 grid gap-6 border-2 border-foreground bg-primary p-6 shadow-brutal lg:grid-cols-2">
    <div>
      <h2 className="font-serif text-4xl">Partner with us</h2>
      <p className="mt-2">Are you a masjid, school, madrasah, MSSN branch or organisation that would like to work with IlmStation, or a scholar who would like to help review content? We would love to hear from you.</p>
      <ul className="mt-4 space-y-2 text-sm">{points.map((p) => <li key={p} className="flex gap-2"><span className="font-bold">✓</span>{p}</li>)}</ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => void downloadFlyer(title, points)} className="border-2 border-foreground bg-background px-4 py-2 font-bold">📥 Download flyer</button>
        {canShare && <button onClick={() => void share()} className="border-2 border-foreground bg-background px-4 py-2 font-bold">Share</button>}
      </div>
      <p className="mt-2 text-xs">A square image to share on WhatsApp and social media.</p>
    </div>
    <div className="border-2 border-foreground bg-background p-4">
      {done ? <div className="py-6 text-center"><p className="text-4xl">✅</p><p className="mt-2 font-serif text-3xl">Thank you!</p><p className="mt-1 text-sm">We’ll be in touch soon, in shaa Allah.</p></div> : <div className="grid gap-2">
        <input className={box} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid gap-2 sm:grid-cols-[1fr_11rem]"><input className={box} placeholder="Organisation (optional)" value={f.org} onChange={(e) => setF({ ...f, org: e.target.value })} />
          <select className={box} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{ENQUIRY_KINDS.map((k) => <option key={k}>{k}</option>)}</select></div>
        <div className="grid gap-2 sm:grid-cols-2"><input className={box} inputMode="tel" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /><input className={box} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <textarea className="min-h-24 w-full border-2 border-foreground bg-background p-2 text-sm" placeholder="How would you like to work together?" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} aria-hidden="true" />
        <button disabled={busy} onClick={() => void send()} className="border-2 border-foreground bg-foreground px-4 py-2 font-bold text-background disabled:opacity-50">{busy ? "Sending…" : "Send message"}</button>
      </div>}
    </div>
  </section>;
}

type Enquiry = { id: string; name: string; org: string; kind: string; phone: string; email: string; message: string; status: string; createdAt: number };
/** Admin: partnership enquiries. */
function Enquiries() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  useEffect(() => fsSnap(fsQuery(fsCol(db, "partnerEnquiries"), fsOrder("createdAt", "desc"), fsLimit(50)), (s) => setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Enquiry, "id">) })).filter((r) => r.kind !== "Sponsor")), () => {}), []);
  const fresh = rows.filter((r) => r.status === "new").length;
  return <Panel title="Partnership enquiries" tag={fresh ? `${fresh} new` : `${rows.length} total`}>
    {!rows.length ? <p className="text-sm text-muted-foreground">No enquiries yet. They arrive from the form on the About page.</p>
    : <div className="grid gap-2">{rows.map((r) => <div key={r.id} className={`grid gap-1 border-2 border-foreground p-3 ${r.status === "new" ? "bg-primary/30" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold">{r.org || r.name} <span className="font-normal text-muted-foreground">· {r.kind} · {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></p>
        <select className="h-9 border-2 border-foreground bg-background px-2 text-sm" value={r.status} onChange={(e) => { void fsUpdate(doc(db, "partnerEnquiries", r.id), { status: e.target.value }).catch(() => toast.error("Couldn't update.")); }}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select>
      </div>
      <p className="text-sm">{r.name}{r.phone ? ` · ${r.phone}` : ""}{r.email ? ` · ${r.email}` : ""}</p>
      {r.message && <p className="text-sm text-muted-foreground">“{r.message}”</p>}
    </div>)}</div>}
  </Panel>;
}
const box = "h-10 w-full border-2 border-foreground bg-background px-3 text-sm";
const newId = () => Math.random().toString(36).slice(2, 10);

function useAbout() {
  const [a, setA] = useState<About | null>(null);
  useEffect(() => {
    getDoc(doc(db, "siteConfig", "about")).then((s) => {
      const d = (s.data() ?? {}) as Partial<About>;
      setA({ mission: d.mission?.trim() ? d.mission : DEFAULT_MISSION, team: d.team ?? [], advisors: d.advisors ?? [], partners: d.partners ?? [], flyerTitle: d.flyerTitle?.trim() ? d.flyerTitle : FLYER_TITLE, flyerPoints: d.flyerPoints?.length ? d.flyerPoints : FLYER_POINTS });
    }).catch(() => setA({ mission: DEFAULT_MISSION, team: [], advisors: [], partners: [], flyerTitle: FLYER_TITLE, flyerPoints: FLYER_POINTS }));
  }, []);
  return a;
}
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

/** www.ilmstation.com/about */
export function AboutPage() {
  const a = useAbout();
  if (!a) return <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6"><p className="text-muted-foreground">Loading…</p></main>;
  return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
    <p className="text-xs font-bold uppercase text-muted-foreground">About us</p>
    <h1 className="mt-2 font-serif text-5xl leading-none sm:text-7xl">About IlmStation</h1>
    <div className="mt-8 max-w-3xl border-t-2 border-foreground pt-2">{a.mission.split(/\n\s*\n/).map((p, i) => <p key={i} className="mt-4 text-lg leading-8">{p}</p>)}</div>

    {a.team.length > 0 && <section className="mt-16">
      <h2 className="font-serif text-4xl">Our team</h2>
      <p className="mt-2 text-muted-foreground">The people building IlmStation.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{a.team.map((v) => <div key={v.id} className="border-2 border-foreground bg-background p-5 shadow-brutal-sm">
        {v.photoUrl ? <img src={v.photoUrl} alt={v.name} className="size-24 border-2 border-foreground object-cover" />
          : <div className="grid size-24 place-items-center border-2 border-foreground bg-primary font-serif text-3xl">{initials(v.name)}</div>}
        <p className="mt-4 font-serif text-2xl leading-tight">{v.name}</p>
        {v.title && <p className="text-sm font-semibold">{v.title}</p>}
        {v.bio && <p className="mt-2 text-sm text-muted-foreground">{v.bio}</p>}
      </div>)}</div>
    </section>}

    {a.advisors.length > 0 && <section className="mt-16">
      <h2 className="font-serif text-4xl">Our advisors</h2>
      <p className="mt-2 text-muted-foreground">Scholars and educators who guide and review our learning content.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{a.advisors.map((v) => <div key={v.id} className="border-2 border-foreground bg-background p-5 shadow-brutal-sm">
        {v.photoUrl ? <img src={v.photoUrl} alt={v.name} className="size-24 border-2 border-foreground object-cover" />
          : <div className="grid size-24 place-items-center border-2 border-foreground bg-primary font-serif text-3xl">{initials(v.name)}</div>}
        <p className="mt-4 font-serif text-2xl leading-tight">{v.name}</p>
        {v.title && <p className="text-sm font-semibold">{v.title}</p>}
        {v.bio && <p className="mt-2 text-sm text-muted-foreground">{v.bio}</p>}
      </div>)}</div>
    </section>}

    {a.partners.length > 0 && <section className="mt-16">
      <h2 className="font-serif text-4xl">Our partners</h2>
      <p className="mt-2 text-muted-foreground">Masjids, schools and organisations learning and growing with us.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{a.partners.map((p) => { const inner = <>
        <div className="grid h-24 place-items-center">{p.logoUrl ? <img src={p.logoUrl} alt={p.name} className="max-h-20 max-w-full object-contain" /> : <span className="font-serif text-3xl">{initials(p.name)}</span>}</div>
        <p className="mt-2 font-semibold leading-tight">{p.name}</p><p className="text-xs uppercase text-muted-foreground">{p.kind}</p></>;
        return p.url ? <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="border-2 border-foreground bg-background p-4 text-center shadow-brutal-sm transition hover:-translate-y-0.5">{inner}</a>
          : <div key={p.id} className="border-2 border-foreground bg-background p-4 text-center shadow-brutal-sm">{inner}</div>; })}</div>
    </section>}

    <PartnerSection title={a.flyerTitle} points={a.flyerPoints} />
  </main>;
}

async function uploadImage(file: File, name: string) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image");
  if (file.size > 2 * 1024 * 1024) throw new Error("Keep it under 2 MB");
  const r = ref(getStorage(), `about/${name}-${Date.now()}`);
  await uploadBytes(r, file, { contentType: file.type });
  return getDownloadURL(r);
}
function move<T>(list: T[], i: number, d: number) { const a = [...list]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; }

/** Admin → About page */
export function AboutSection() {
  const loaded = useAbout();
  const [a, setA] = useState<About | null>(null);
  const [busy, setBusy] = useState("");
  useEffect(() => { if (loaded && !a) setA(loaded); }, [loaded, a]);
  if (!a) return <Page eyebrow="Website" title="About page"><p className="text-sm text-muted-foreground">Loading…</p></Page>;
  const setAdv = (i: number, p: Partial<Advisor>) => setA({ ...a, advisors: a.advisors.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const setTeam = (i: number, p: Partial<Advisor>) => setA({ ...a, team: a.team.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const setPar = (i: number, p: Partial<Partner>) => setA({ ...a, partners: a.partners.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const upload = async (file: File | undefined, key: string, done: (url: string) => void) => {
    if (!file) return;
    setBusy(key);
    try { done(await uploadImage(file, key)); toast.success("Image uploaded. Remember to Save."); }
    catch (e) { toast.error(e instanceof Error && e.message.startsWith("Keep") || e instanceof Error && e.message.startsWith("Choose") ? e.message : "Upload failed. Check the Storage rules for about/."); }
    finally { setBusy(""); }
  };
  const save = async () => {
    setBusy("save");
    try { await setDoc(doc(db, "siteConfig", "about"), { ...a, updatedAt: Date.now() }); toast.success("About page saved"); }
    catch { toast.error("Couldn't save. Check you are an admin."); } finally { setBusy(""); }
  };
  const actions = <div className="flex gap-2"><Button variant="outline" asChild><a href="/about" target="_blank" rel="noreferrer">View page</a></Button><Button disabled={busy === "save"} onClick={() => void save()}>{busy === "save" ? "Saving…" : "Save"}</Button></div>;
  return <Page eyebrow="Website" title="About page" actions={actions}>
    <Panel title="Our mission" tag="Shown at the top">
      <textarea className="min-h-56 w-full border-2 border-foreground bg-background p-3 text-sm leading-6" value={a.mission} onChange={(e) => setA({ ...a, mission: e.target.value })} />
      <p className="mt-1 text-xs text-muted-foreground">A blank line starts a new paragraph.</p>
    </Panel>

    <div className="mt-6"><Panel title="Our team" tag={a.team.length ? `${a.team.length} shown` : "Hidden until you add one"}>
      <div className="grid gap-3">{a.team.map((v, i) => <div key={v.id} className="grid gap-2 border-2 border-foreground p-3 sm:grid-cols-[6rem_1fr]">
        <div>{v.photoUrl ? <img src={v.photoUrl} alt="" className="size-24 border-2 border-foreground object-cover" /> : <div className="grid size-24 place-items-center border-2 border-dashed border-foreground text-xs">No photo</div>}
          <label className="mt-1 block cursor-pointer text-xs font-semibold underline">{busy === v.id ? "Uploading…" : v.photoUrl ? "Change" : "Upload photo"}<input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0], v.id, (url) => setTeam(i, { photoUrl: url })); e.target.value = ""; }} /></label>
          {v.photoUrl && <button className="block text-xs underline" onClick={() => setTeam(i, { photoUrl: "" })}>Remove photo</button>}</div>
        <div className="grid gap-2">
          <div className="grid gap-2 sm:grid-cols-2"><input className={box} placeholder="Name, e.g. Jamiu Yusuf" value={v.name} onChange={(e) => setTeam(i, { name: e.target.value })} /><input className={box} placeholder="Role, e.g. Founder" value={v.title} onChange={(e) => setTeam(i, { title: e.target.value })} /></div>
          <textarea className="min-h-16 w-full border-2 border-foreground bg-background p-2 text-sm" placeholder="Short bio (one or two sentences)" value={v.bio} onChange={(e) => setTeam(i, { bio: e.target.value })} />
          <div className="flex gap-2"><Button size="sm" variant="outline" aria-label="Move up" onClick={() => setA({ ...a, team: move(a.team, i, -1) })}><ArrowUp /></Button><Button size="sm" variant="outline" aria-label="Move down" onClick={() => setA({ ...a, team: move(a.team, i, 1) })}><ArrowDown /></Button><Button size="sm" variant="outline" aria-label="Remove" onClick={() => setA({ ...a, team: a.team.filter((_, j) => j !== i) })}><Trash2 /></Button></div>
        </div>
      </div>)}</div>
      <Button variant="outline" className="mt-3" onClick={() => setA({ ...a, team: [...a.team, { id: newId(), name: "", title: "", bio: "", photoUrl: "" }] })}><Plus /> Add team member</Button>
    </Panel></div>

    <div className="mt-6"><Panel title="Advisors" tag={a.advisors.length ? `${a.advisors.length} shown` : "Hidden until you add one"}>
      <p className="-mt-1 mb-3 text-xs text-muted-foreground">Only list people who have agreed to be shown.</p>
      <div className="grid gap-3">{a.advisors.map((v, i) => <div key={v.id} className="grid gap-2 border-2 border-foreground p-3 sm:grid-cols-[6rem_1fr]">
        <div>{v.photoUrl ? <img src={v.photoUrl} alt="" className="size-24 border-2 border-foreground object-cover" /> : <div className="grid size-24 place-items-center border-2 border-dashed border-foreground text-xs">No photo</div>}
          <label className="mt-1 block cursor-pointer text-xs font-semibold underline">{busy === v.id ? "Uploading…" : v.photoUrl ? "Change" : "Upload photo"}<input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0], v.id, (url) => setAdv(i, { photoUrl: url })); e.target.value = ""; }} /></label></div>
        <div className="grid gap-2">
          <div className="grid gap-2 sm:grid-cols-2"><input className={box} placeholder="Name, e.g. Ustadh Abdullahi Musa" value={v.name} onChange={(e) => setAdv(i, { name: e.target.value })} /><input className={box} placeholder="Title, e.g. Arabic & Fiqh teacher" value={v.title} onChange={(e) => setAdv(i, { title: e.target.value })} /></div>
          <textarea className="min-h-16 w-full border-2 border-foreground bg-background p-2 text-sm" placeholder="Short bio (one or two sentences)" value={v.bio} onChange={(e) => setAdv(i, { bio: e.target.value })} />
          <div className="flex gap-2"><Button size="sm" variant="outline" aria-label="Move up" onClick={() => setA({ ...a, advisors: move(a.advisors, i, -1) })}><ArrowUp /></Button><Button size="sm" variant="outline" aria-label="Move down" onClick={() => setA({ ...a, advisors: move(a.advisors, i, 1) })}><ArrowDown /></Button><Button size="sm" variant="outline" aria-label="Remove" onClick={() => setA({ ...a, advisors: a.advisors.filter((_, j) => j !== i) })}><Trash2 /></Button></div>
        </div>
      </div>)}</div>
      <Button variant="outline" className="mt-3" onClick={() => setA({ ...a, advisors: [...a.advisors, { id: newId(), name: "", title: "", bio: "", photoUrl: "" }] })}><Plus /> Add advisor</Button>
    </Panel></div>

    <div className="mt-6"><Panel title="Partners" tag={a.partners.length ? `${a.partners.length} shown` : "Hidden until you add one"}>
      <div className="grid gap-3">{a.partners.map((p, i) => <div key={p.id} className="grid gap-2 border-2 border-foreground p-3 sm:grid-cols-[6rem_1fr]">
        <div>{p.logoUrl ? <img src={p.logoUrl} alt="" className="h-20 w-24 border-2 border-foreground bg-white object-contain" /> : <div className="grid h-20 w-24 place-items-center border-2 border-dashed border-foreground text-xs">No logo</div>}
          <label className="mt-1 block cursor-pointer text-xs font-semibold underline">{busy === p.id ? "Uploading…" : p.logoUrl ? "Change" : "Upload logo"}<input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0], p.id, (url) => setPar(i, { logoUrl: url })); e.target.value = ""; }} /></label></div>
        <div className="grid gap-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_10rem]"><input className={box} placeholder="Name, e.g. Al-Hikmah Central Mosque" value={p.name} onChange={(e) => setPar(i, { name: e.target.value })} />
            <select className={box} value={p.kind} onChange={(e) => setPar(i, { kind: e.target.value })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></div>
          <input className={box} placeholder="Website (optional), e.g. https://…" value={p.url} onChange={(e) => setPar(i, { url: e.target.value.trim() })} />
          <div className="flex gap-2"><Button size="sm" variant="outline" aria-label="Move up" onClick={() => setA({ ...a, partners: move(a.partners, i, -1) })}><ArrowUp /></Button><Button size="sm" variant="outline" aria-label="Move down" onClick={() => setA({ ...a, partners: move(a.partners, i, 1) })}><ArrowDown /></Button><Button size="sm" variant="outline" aria-label="Remove" onClick={() => setA({ ...a, partners: a.partners.filter((_, j) => j !== i) })}><Trash2 /></Button></div>
        </div>
      </div>)}</div>
      <Button variant="outline" className="mt-3" onClick={() => setA({ ...a, partners: [...a.partners, { id: newId(), name: "", kind: "Masjid", url: "", logoUrl: "" }] })}><Plus /> Add partner</Button>
    </Panel></div>
    <div className="mt-6"><Panel title="Partnership flyer" tag="On the About page">
      <label className="block text-xs font-bold uppercase">Title<input className={box} value={a.flyerTitle} onChange={(e) => setA({ ...a, flyerTitle: e.target.value })} /></label>
      <label className="mt-3 block text-xs font-bold uppercase">Points (one per line, up to 5)<textarea className="min-h-28 w-full border-2 border-foreground bg-background p-2 text-sm font-normal normal-case" value={a.flyerPoints.join("\n")} onChange={(e) => setA({ ...a, flyerPoints: e.target.value.split("\n").slice(0, 5) })} /></label>
      <Button variant="outline" className="mt-3" onClick={() => void downloadFlyer(a.flyerTitle, a.flyerPoints.filter((x) => x.trim()))}>📥 Preview flyer</Button>
    </Panel></div>
    <div className="mt-6"><Enquiries /></div>
    <div className="mt-6 flex justify-end">{actions}</div>
  </Page>;
}
