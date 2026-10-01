import { Copy, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ShareCard = { eyebrow: string; headline: string; sub: string; arabic?: string; meta?: string };

export function shareText(c: ShareCard) {
  return [c.arabic, c.headline, c.sub, c.eyebrow].filter(Boolean).join("\n");
}

export function shareUrl() {
  if (typeof window === "undefined") return "https://ilmstation.app";
  return window.location.origin;
}

type Net = { id: string; label: string; brand: string; path: string; href: (text: string, url: string) => string };

/** Simple Icons brand glyph paths (24x24 viewBox). */
const glyphs = {
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.885 3.6",
  x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073",
  telegram: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0m4.962 7.224c.1-.002.321.023.465.14a.5.5 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024q-.16.036-5.061 3.345-.719.494-1.301.48c-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789q.04-.324.893-.663c3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065m1.782 13.019H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z",
  email: "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.909 1.528-1.146C21.69 2.28 24 3.434 24 5.457",
} as const;

const networks: Net[] = [
  { id: "whatsapp", label: "WhatsApp", brand: "#25D366", path: glyphs.whatsapp, href: (t, u) => `https://wa.me/?text=${encodeURIComponent(`${t}\n${u}`)}` },
  { id: "x", label: "X", brand: "#000000", path: glyphs.x, href: (t, u) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { id: "facebook", label: "Facebook", brand: "#1877F2", path: glyphs.facebook, href: (t, u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}&quote=${encodeURIComponent(t)}` },
  { id: "telegram", label: "Telegram", brand: "#229ED9", path: glyphs.telegram, href: (t, u) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { id: "linkedin", label: "LinkedIn", brand: "#0A66C2", path: glyphs.linkedin, href: (_t, u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { id: "email", label: "Email", brand: "#6B7280", path: glyphs.email, href: (t, u) => `mailto:?subject=${encodeURIComponent("From IlmStation")}&body=${encodeURIComponent(`${t}\n${u}`)}` },
];

async function copy(text: string, what: string) {
  try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`); }
  catch { toast.error("Could not copy — select the text and copy manually"); }
}

export function ShareActions({ card, onDone }: { card: ShareCard; onDone?: () => void }) {
  const text = shareText(card);
  const url = shareUrl();
  const open = (n: Net) => {
    window.open(n.href(text, url), "_blank", "noopener,noreferrer,width=640,height=640");
    toast.success(`Opening ${n.label}`);
  };
  const native = async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) { try { await nav.share({ title: "IlmStation", text, url }); onDone?.(); } catch { /* dismissed */ } }
    else await copy(`${text}\n${url}`, "Share card");
  };
  return <div className="space-y-3">
    <p className="text-xs font-bold uppercase text-muted-foreground">Share to</p>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {networks.map(n => <button key={n.id} type="button" aria-label={`Share on ${n.label}`} onClick={() => open(n)}
        className="flex flex-col items-center gap-1 border-2 border-foreground bg-background p-2 text-[10px] font-bold shadow-brutal-sm transition hover:-translate-y-0.5">
        <span className="grid size-8 place-items-center border-2 border-foreground" style={{ background: n.brand }}><svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="#fff"><path d={n.path} /></svg></span>
        {n.label}
      </button>)}
    </div>
    <div className="grid gap-2 sm:grid-cols-3">
      <Button variant="outline" onClick={() => copy(text, "Share card")}><Copy /> Copy text</Button>
      <Button variant="outline" onClick={() => copy(url, "Link")}><Link2 /> Copy link</Button>
      <Button onClick={native}><Share2 /> More apps</Button>
    </div>
  </div>;
}
