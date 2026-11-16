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
type About = { mission: string; advisors: Advisor[]; partners: Partner[] };

const DEFAULT_MISSION = `IlmStation is a home for Islamic learning, built for Muslim families. We want every child, teen and adult to learn a little every day, in a way that is joyful, trustworthy and close to the Qur'an and Sunnah.

We bring together daily reminders, quizzes, a library of books and audiobooks, Qur'an memorisation, step-by-step lessons and a safe community, so that learning fits into everyday life at home, at school and at the masjid.

IlmStation is built in Nigeria by IlmStation Limited, with care for authentic sources, good manners and the safety of children.`;
const KINDS = ["Masjid", "School", "Madrasah", "MSSN", "Sponsor", "Organisation"];
const box = "h-10 w-full border-2 border-foreground bg-background px-3 text-sm";
const newId = () => Math.random().toString(36).slice(2, 10);

function useAbout() {
  const [a, setA] = useState<About | null>(null);
  useEffect(() => {
    getDoc(doc(db, "siteConfig", "about")).then((s) => {
      const d = (s.data() ?? {}) as Partial<About>;
      setA({ mission: d.mission?.trim() ? d.mission : DEFAULT_MISSION, advisors: d.advisors ?? [], partners: d.partners ?? [] });
    }).catch(() => setA({ mission: DEFAULT_MISSION, advisors: [], partners: [] }));
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

    <section className="mt-16 border-2 border-foreground bg-primary p-6 shadow-brutal">
      <h2 className="font-serif text-3xl">Partner with us</h2>
      <p className="mt-2 max-w-2xl">Are you a masjid, school, madrasah, MSSN branch or organisation that would like to work with IlmStation, or a scholar who would like to help review content? We would love to hear from you.</p>
      <a href="mailto:admin@ilmstation.com?subject=Partnering%20with%20IlmStation" className="mt-4 inline-block border-2 border-foreground bg-background px-4 py-2 font-bold">admin@ilmstation.com</a>
    </section>
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
    <div className="mt-6 flex justify-end">{actions}</div>
  </Page>;
}
