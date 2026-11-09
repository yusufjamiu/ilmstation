import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/* PDF.js is loaded from a CDN in the browser only, never bundled, so the server
   (which has no window/document) never touches it. v4 decodes scanned books (JBIG2) without extra files. */
const CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Lib = any;
let libPromise: Promise<Lib> | null = null;
function loadPdfJs(): Promise<Lib> {
  if (!libPromise) {
    const src = `${CDN}/build/pdf.min.mjs`;
    libPromise = import(/* @vite-ignore */ src).then((lib: Lib) => {
      lib.GlobalWorkerOptions.workerSrc = `${CDN}/build/pdf.worker.min.mjs`;
      return lib;
    });
  }
  return libPromise;
}

/** One page at a time; tells the library which page the reader is on. */
export default function PdfReader({ url, startPage, onPage }: { url: string; startPage: number; onPage: (page: number, total: number) => void }) {
  const [pdf, setPdf] = useState<Lib>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(Math.max(1, startPage));
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(600);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // open the book
  useEffect(() => {
    let off = false;
    setError(false);
    loadPdfJs()
      .then((lib) => lib.getDocument({ url, cMapUrl: `${CDN}/cmaps/`, cMapPacked: true, standardFontDataUrl: `${CDN}/standard_fonts/` }).promise)
      .then((d: Lib) => { if (off) return; setPdf(d); setPages(d.numPages); setPage((p) => Math.min(p, d.numPages)); })
      .catch(() => { if (!off) setError(true); });
    return () => { off = true; };
  }, [url]);

  // fit the page to the screen width
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(200, Math.min(900, el.clientWidth - 4))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // draw the current page
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let off = false;
    let task: Lib = null;
    pdf.getPage(page).then((p: Lib) => {
      if (off || !canvas.current) return;
      const ratio = window.devicePixelRatio || 1;
      const scale = width / p.getViewport({ scale: 1 }).width;
      const vp = p.getViewport({ scale: scale * ratio });
      const c = canvas.current;
      c.width = vp.width; c.height = vp.height;
      c.style.width = `${width}px`; c.style.height = `${vp.height / ratio}px`;
      task = p.render({ canvasContext: c.getContext("2d")!, viewport: vp });
      return task.promise;
    }).catch(() => {});
    return () => { off = true; task?.cancel?.(); };
  }, [pdf, page, width]);

  useEffect(() => { if (pages) onPage(page, pages); }, [page, pages]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (p: number) => { setPage(Math.min(Math.max(1, p), pages || 1)); box.current?.scrollIntoView({ block: "start", behavior: "smooth" }); };

  const nav = <div className="flex items-center justify-between gap-2 py-3">
    <Button variant="outline" disabled={page <= 1} onClick={() => go(page - 1)}><ChevronLeft /> Previous</Button>
    <span className="text-sm font-semibold tabular-nums">Page {page}{pages ? ` of ${pages}` : ""}</span>
    <Button variant="outline" disabled={!pages || page >= pages} onClick={() => go(page + 1)}>Next <ChevronRight /></Button>
  </div>;

  return <div ref={box} className="min-w-0">
    {nav}
    <div className="flex justify-center border-2 border-foreground bg-white">
      {error ? <p className="p-6 text-sm text-black">Couldn't open this book here. Use “Open full screen” below.</p>
        : !pages ? <p className="p-6 text-sm text-black">Loading book…</p> : null}
      <canvas ref={canvas} className={pages && !error ? "block" : "hidden"} />
    </div>
    {nav}
  </div>;
}
