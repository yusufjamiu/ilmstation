import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Page, Panel, useAudit } from "./ui";

type AdhanCfg = { url?: string; fajrUrl?: string };
type Kind = "url" | "fajrUrl";

export function AdhanSection() {
  const [cfg, setCfg] = useState<AdhanCfg | null>(null);
  const [busy, setBusy] = useState<Kind | null>(null);
  const { record } = useAudit();
  useEffect(() => { getDoc(doc(db, "siteConfig", "adhan")).then((s) => setCfg((s.data() as AdhanCfg) ?? {})).catch(() => setCfg({})); }, []);
  if (!cfg) return <Page eyebrow="App" title="Adhan"><p className="text-sm text-muted-foreground">Loading…</p></Page>;

  const saveCfg = async (next: AdhanCfg) => { await setDoc(doc(db, "siteConfig", "adhan"), { ...next, updatedAt: Date.now() }); setCfg(next); };
  const upload = async (kind: Kind, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) { toast.error("Choose an audio file (MP3)"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Keep it under 5 MB"); return; }
    setBusy(kind);
    try {
      const r = ref(getStorage(), `adhan/${kind === "url" ? "adhan" : "fajr"}-${Date.now()}.mp3`);
      await uploadBytes(r, file, { contentType: file.type });
      await saveCfg({ ...cfg, [kind]: await getDownloadURL(r) });
      record(`Uploaded ${kind === "url" ? "adhan" : "Fajr adhan"}`);
      toast.success("Uploaded. It will play at the next prayer time.");
    } catch { toast.error("Upload failed. Check the Storage rules for adhan/."); } finally { setBusy(null); }
  };
  const remove = async (kind: Kind) => {
    const next = { ...cfg }; delete next[kind];
    try { await saveCfg(next); record(`Removed ${kind === "url" ? "adhan" : "Fajr adhan"}`); toast.success("Removed"); } catch { toast.error("Couldn't remove."); }
  };

  const box = (kind: Kind, title: string, note: string) => <Panel title={title} tag={cfg[kind] ? "Uploaded" : "Not set"}>
    <p className="-mt-1 mb-3 text-xs text-muted-foreground">{note}</p>
    {cfg[kind] ? <audio controls preload="none" className="w-full" src={cfg[kind]} /> : <p className="border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">No file yet.</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-foreground bg-primary px-3 py-2 text-sm font-semibold shadow-brutal-sm">
        <Upload className="size-4" /> {busy === kind ? "Uploading…" : cfg[kind] ? "Replace" : "Upload MP3"}
        <input type="file" accept="audio/*" className="hidden" disabled={!!busy} onChange={(e) => { void upload(kind, e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {cfg[kind] && <Button variant="outline" onClick={() => void remove(kind)}><Trash2 /> Remove</Button>}
    </div>
  </Panel>;

  return <Page eyebrow="App · prayer times" title="Adhan">
    <p className="mb-5 max-w-2xl text-sm text-muted-foreground">This plays for users at each prayer time while IlmStation is open (they can stop it or turn it off). Use recordings you have permission to use, MP3 under 5 MB.</p>
    <div className="grid gap-4 lg:grid-cols-2">
      {box("url", "Adhan", "Plays at Dhuhr, Asr, Maghrib and Isha (and Fajr if no Fajr adhan is set).")}
      {box("fajrUrl", "Fajr adhan (optional)", "With “as-salatu khayrun min an-nawm”.")}
    </div>
  </Page>;
}
