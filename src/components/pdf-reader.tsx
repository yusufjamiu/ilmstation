import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

/** Extra decoders and fonts, so scanned books (JBIG2 images), Arabic fonts and special characters show correctly. */
const CDN = `https://unpkg.com/pdfjs-dist@${pdfjs.version}`;
const OPTIONS = {
  wasmUrl: `${CDN}/wasm/`,
  cMapUrl: `${CDN}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${CDN}/standard_fonts/`,
};

/** One page at a time; tells the library which page the reader is on. */
export default function PdfReader({ url, startPage, onPage }: { url: string; startPage: number; onPage: (page: number, total: number) => void }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(Math.max(1, startPage));
  const [width, setWidth] = useState(600);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.min(900, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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
      <Document file={url} options={OPTIONS}
        onLoadSuccess={({ numPages }) => { setPages(numPages); setPage((p) => Math.min(p, numPages)); }}
        loading={<p className="p-6 text-sm text-black">Loading book…</p>}
        error={<p className="p-6 text-sm text-black">Couldn't open this book here. Use “Open full screen” below.</p>}>
        <Page pageNumber={page} width={width} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
    </div>
    {nav}
  </div>;
}
