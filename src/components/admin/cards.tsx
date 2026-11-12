import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OCCASIONS } from "@/components/eid-card";
import { Field, inputCls, Page, useAudit, useConfirm } from "./ui";

type Card = {
  id: string; name: string; imageUrl: string; path: string; tier: "free" | "premium"; cost: number; minLevel?: number;
  textColor: string; accentColor: string; layout: "upper" | "middle" | "lower"; hideTitle: boolean;
  occasions: string[]; active: boolean; createdAt: number;
};
const blank = (): Card => ({
  id: `cd-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name: "", imageUrl: "", path: "", tier: "free", cost: 100,
  textColor: "#ffffff", accentColor: "#fbbf24", layout: "middle", hideTitle: false, occasions: ["all"], active: true, createdAt: Date.now(),
});
const label = (id: string) => (id === "all" ? "All occasions" : OCCASIONS.find((o) => o.id === id)?.label ?? id);

export function CardsSection() {
  const [items, setItems] = useState<Card[] | null>(null);
  const [form, setForm] = useState<Card | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState("");
  const { record } = useAudit();
  const { ask, dialog } = useConfirm();

  useEffect(() => onSnapshot(collection(db, "cardDesigns"),
    (s) => setItems(s.docs.map((d) => ({ ...(d.data() as Omit<Card, "id">), id: d.id })).sort((a, b) => b.createdAt - a.createdAt)),
    () => setItems([])), []);

  const upload = (file: File) => {
    if (!form) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image (PNG or JPG)"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image is over 10 MB"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `cards/${form.id}.${ext}`;
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
    task.on("state_changed", (s) => setBusy(`Uploading ${Math.round((s.bytesTransferred / s.totalBytes) * 100)}%`),
      () => { setBusy(""); toast.error("Upload failed. Check your Storage rules."); },
      () => { void getDownloadURL(task.snapshot.ref).then((url) => { setForm((f) => f && { ...f, imageUrl: url, path }); setBusy(""); }); });
  };

  const close = () => {
    if (busy) { toast("Wait for the upload to finish."); return; }
    if (isNew && form?.path) void deleteObject(ref(storage, form.path)).catch(() => {});
    setForm(null);
  };

  const save = async (f: Card) => {
    if (!f.name.trim()) return toast.error("Give the design a name");
    if (!f.imageUrl) return toast.error("Upload the background image");
    if (!f.occasions.length) return toast.error("Pick at least one occasion");
    const { id, ...data } = f;
    try {
      await setDoc(doc(db, "cardDesigns", id), { ...data, name: f.name.trim(), cost: f.tier === "premium" ? Number(f.cost) || 100 : 0, minLevel: f.tier === "premium" ? Number(f.minLevel) || 0 : 0 });
      record(`${isNew ? "Added" : "Updated"} card design ${f.name}`); toast.success("Saved"); setForm(null);
    } catch { toast.error("Couldn't save. Check you are an admin."); }
  };

  const remove = (c: Card) => ask({
    title: `Delete ${c.name}?`, body: "The design disappears from the card maker for everyone.", confirm: "Delete", destructive: true,
    run: () => { void (async () => {
      try { if (c.path) await deleteObject(ref(storage, c.path)).catch(() => {}); await deleteDoc(doc(db, "cardDesigns", c.id)); record(`Deleted card design ${c.name}`); toast.success("Deleted"); }
      catch { toast.error("Couldn't delete."); }
    })(); },
  });

  const toggleOcc = (id: string, on: boolean) => setForm((f) => {
    if (!f) return f;
    if (id === "all") return { ...f, occasions: on ? ["all"] : [] };
    const rest = f.occasions.filter((x) => x !== "all" && x !== id);
    return { ...f, occasions: on ? [...rest, id] : rest };
  });

  return <Page eyebrow="App · cards" title="Card designs" actions={<Button onClick={() => { setForm(blank()); setIsNew(true); }}><Plus /> Add design</Button>}>
    <p className="mb-4 text-sm text-muted-foreground">Upload designer backgrounds (for example made in Canva). Size <b>1080 × 1350</b> (portrait). Leave space for the message; the app adds the title, message, names and the ilmstation.com mark.</p>
    {!items ? <p className="text-sm text-muted-foreground">Loading…</p> : items.length === 0 ? <p className="text-sm text-muted-foreground">No designer cards yet.</p> :
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((c) => <article key={c.id} className={`border-2 border-foreground bg-card shadow-brutal-sm ${c.active ? "" : "opacity-60"}`}>
        <div className="aspect-[4/5] border-b-2 border-foreground bg-cover bg-center" style={{ backgroundImage: `url(${c.imageUrl})` }} />
        <div className="p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">{c.tier === "premium" ? `👑 Premium · ${c.cost} pts${c.minLevel ? ` · free from level ${c.minLevel}` : ""}` : "Free"}{!c.active && " · hidden"}</p>
          <h3 className="font-serif text-xl">{c.name}</h3>
          <p className="text-xs text-muted-foreground">{c.occasions.map(label).join(", ")}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setForm(c); setIsNew(false); }}><Pencil /> Edit</Button>
            <Button size="sm" variant="outline" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}><Trash2 /></Button>
          </div>
        </div>
      </article>)}</div>}

    <Dialog open={!!form} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {form && <>
          <DialogHeader><DialogTitle>{isNew ? "Add card design" : "Edit card design"}</DialogTitle><DialogDescription>Background image plus text colours and position.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              {form.imageUrl ? <div className="h-36 w-28 shrink-0 border-2 border-foreground bg-cover bg-center" style={{ backgroundImage: `url(${form.imageUrl})` }} /> : <div className="grid h-36 w-28 shrink-0 place-items-center border-2 border-dashed border-foreground text-xs">No image</div>}
              <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-foreground px-3 py-2 text-sm font-semibold"><Upload className="size-4" /> {form.imageUrl ? "Replace" : "Upload"} image
                <input type="file" accept="image/*" className="hidden" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} /></label>
            </div>
            {busy && <p className="text-sm font-semibold">{busy}</p>}
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Gold Arch Eid" /></Field>

            <fieldset className="border-2 border-foreground p-3"><legend className="px-1 text-xs font-bold uppercase">Occasions</legend>
              <div className="grid gap-1 sm:grid-cols-2">{["all", ...OCCASIONS.map((o) => o.id)].map((id) => <label key={id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.occasions.includes(id)} onChange={(e) => toggleOcc(id, e.target.checked)} /> {label(id)}</label>)}</div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Who can use it"><select className={inputCls} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as Card["tier"] })}><option value="free">Free</option><option value="premium">👑 Premium</option></select></Field>
              {form.tier === "premium" && <Field label="Unlock cost for free users (points)"><input type="number" min={0} className={inputCls} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></Field>}
              {form.tier === "premium" && <Field label="Free from level (0 = never)"><input type="number" min={0} className={inputCls} value={form.minLevel ?? 0} onChange={(e) => setForm({ ...form, minLevel: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} /></Field>}
              <Field label="Text colour"><input type="color" className={`${inputCls} p-1`} value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })} /></Field>
              <Field label="Accent colour (English title)"><input type="color" className={`${inputCls} p-1`} value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} /></Field>
              <Field label="Text position"><select className={inputCls} value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value as Card["layout"] })}><option value="upper">Higher</option><option value="middle">Middle</option><option value="lower">Lower</option></select></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hideTitle} onChange={(e) => setForm({ ...form, hideTitle: e.target.checked })} /> The image already has the title / calligraphy (don’t add it)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible to users</label>
          </div>
          <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={!!busy} onClick={() => void save(form)}>Save</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
    {dialog}
  </Page>;
}
