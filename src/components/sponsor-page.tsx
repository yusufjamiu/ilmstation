import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { DEFAULT_SPONSOR } from "@/components/sponsor-tiers";

/** /sponsorship: real tiers from the admin + an enquiry form (saved for the team). */
type Tier = { id: string; name: string; amount?: number | string; per?: string; covers?: string; perks?: string[] | string; highlight?: boolean; active?: boolean };
type Cfg = { eyebrow?: string; headline?: string; intro?: string; tiers?: Tier[] };
const box = "h-11 w-full border-2 border-foreground bg-background px-3 text-sm";
const price = (t: Tier) => (typeof t.amount === "number" ? (t.amount > 0 ? `₦${t.amount.toLocaleString()}` : "Custom") : t.amount || "Custom");
const perkList = (p: Tier["perks"]) => (Array.isArray(p) ? p : String(p ?? "").split("\n")).map((x) => x.trim()).filter(Boolean);

export function SponsorPage() {
  const [cfg, setCfg] = useState<Cfg>(DEFAULT_SPONSOR as unknown as Cfg);
  const [f, setF] = useState({ name: "", org: "", phone: "", email: "", tier: "", message: "", website: "" });
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { getDoc(doc(db, "siteConfig", "sponsorship")).then((s) => { if (s.exists()) setCfg({ ...(DEFAULT_SPONSOR as unknown as Cfg), ...(s.data() as Cfg) }); }).catch(() => {}); }, []);
  const tiers = (cfg.tiers ?? []).filter((t) => t.active !== false);
  const pick = (t: Tier) => { setF((x) => ({ ...x, tier: t.name })); document.getElementById("sponsor-form")?.scrollIntoView({ behavior: "smooth" }); };
  const send = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/partner", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: f.name, org: f.org, phone: f.phone, email: f.email, kind: "Sponsor", website: f.website, message: `${f.tier ? `Tier: ${f.tier}\n` : ""}${f.message}` }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (j.ok) setDone(true); else toast.error(j.error ?? "Couldn't send. Try again.");
    } catch { toast.error("Couldn't send. Check your connection."); } finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <p className="text-xs font-bold uppercase text-muted-foreground">{cfg.eyebrow || "Sponsorship"}</p>
    <h1 className="mt-2 max-w-4xl font-serif text-5xl leading-none sm:text-7xl">{cfg.headline || "Sponsor a learner"}</h1>
    {cfg.intro && <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{cfg.intro}</p>}
    {tiers.length > 0 && <div className="mt-10 grid gap-5 md:grid-cols-3">{tiers.map((t) => <div key={t.id} className={`flex flex-col border-2 border-foreground p-6 shadow-brutal ${t.highlight ? "bg-primary" : "bg-background"}`}>
      <p className="font-serif text-3xl leading-tight">{t.name}</p>
      <p className="mt-2"><b className="text-2xl">{price(t)}</b>{t.per && price(t) !== "Custom" ? <span className="text-sm"> {t.per}</span> : null}</p>
      {t.covers && <p className="mt-2 text-sm">{t.covers}</p>}
      <ul className="mt-4 flex-1 space-y-2 text-sm">{perkList(t.perks).map((p) => <li key={p} className="flex gap-2"><span className="font-bold">✓</span>{p}</li>)}</ul>
      <button onClick={() => pick(t)} className="mt-5 border-2 border-foreground bg-foreground px-4 py-2 font-bold text-background">Choose</button>
    </div>)}</div>}
    <section id="sponsor-form" className="mt-12 grid gap-6 border-2 border-foreground bg-muted p-6 lg:grid-cols-2">
      <div><h2 className="font-serif text-4xl">Become a sponsor</h2><p className="mt-2 text-muted-foreground">Tell us how you’d like to help. We’ll reply with the details and how to pay, in shaa Allah.</p></div>
      <div className="border-2 border-foreground bg-background p-4">
        {done ? <div className="py-6 text-center"><p className="text-4xl">✅</p><p className="mt-2 font-serif text-3xl">Jazakallahu khayran!</p><p className="mt-1 text-sm">We’ve received your message and will be in touch soon.</p></div> : <div className="grid gap-2">
          <input className={box} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={box} placeholder="Organisation (optional)" value={f.org} onChange={(e) => setF({ ...f, org: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2"><input className={box} inputMode="tel" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /><input className={box} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <select className={box} value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value })}><option value="">Choose a tier (optional)</option>{tiers.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
          <textarea className="min-h-24 w-full border-2 border-foreground bg-background p-2 text-sm" placeholder="Anything you’d like us to know" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
          <button disabled={busy} onClick={() => void send()} className="border-2 border-foreground bg-primary px-4 py-2 font-bold disabled:opacity-50">{busy ? "Sending…" : "Send"}</button>
        </div>}
      </div>
    </section>
  </main>;
}
