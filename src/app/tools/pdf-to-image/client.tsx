"use client";

import { useState } from "react";
import { Download, Images } from "lucide-react";
import JSZip from "jszip";
import { ToolLayout } from "@/components/tool-layout";
import {
  ChoiceGrid,
  Field,
  FieldGrid,
  FormatQuality,
  PagePicker,
  PdfProgress,
  PdfTool,
  StatusBadge,
  ToolPanel,
  canvasToBlob,
  downloadFile,
  extFor,
  formatBytes,
  parsePageList,
  rasterizePages,
  usePdfFile,
  type ImageMime,
} from "@/components/tool";

const DPI = [
  { value: 72, label: "72 dpi", hint: "Screen" },
  { value: 150, label: "150 dpi", hint: "Good" },
  { value: 300, label: "300 dpi", hint: "Print" },
] as const;

interface Result { index: number; url: string; size: number; name: string }

export default function PdfToImage() {
  const [pages, setPages] = useState("");
  const [dpi, setDpi] = useState<(typeof DPI)[number]["value"]>(150);
  const [format, setFormat] = useState<ImageMime>("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<Result[]>([]);
  const pdf = usePdfFile((_, count) => { setPages(count ? `1-${count}` : ""); setResults((r) => { r.forEach((x) => URL.revokeObjectURL(x.url)); return []; }); });
  const { file, pageCount } = pdf;

  const selected = parsePageList(pages, pageCount);
  const base = file?.name.replace(/\.[^.]+$/, "") || "page";
  const ext = extFor(format);

  const convert = () =>
    pdf.run(async () => {
      if (!file || !selected?.length) return;
      results.forEach((x) => URL.revokeObjectURL(x.url));
      setResults([]);
      setProgress({ done: 0, total: selected.length });
      const out: Result[] = [];
      const pad = String(pageCount).length;
      await rasterizePages(
        file,
        dpi / 72,
        async ({ canvas, index }) => {
          const blob = await canvasToBlob(canvas, format, quality);
          out.push({ index, url: URL.createObjectURL(blob), size: blob.size, name: `${base}-${String(index).padStart(pad, "0")}.${ext}` });
          canvas.width = canvas.height = 0;
        },
        (done, total) => setProgress({ done, total }),
        selected
      );
      setResults(out);
    }, "Failed to render this PDF.");

  const downloadAll = async () => {
    if (results.length === 1) return downloadOne(results[0]);
    const zip = new JSZip();
    for (const r of results) zip.file(r.name, await (await fetch(r.url)).blob());
    downloadFile(await zip.generateAsync({ type: "blob" }), `${base}-images.zip`, "application/zip");
  };
  const downloadOne = async (r: Result) => downloadFile(await (await fetch(r.url)).blob(), r.name, format);

  const total = results.reduce((s, r) => s + r.size, 0);

  return (
    <ToolLayout toolId="pdf-to-image">
      <PdfTool
        pdf={pdf}
        optionsTitle="Output"
        options={
          <>
            <PagePicker value={pages} onChange={setPages} pageCount={pageCount} />
            <FieldGrid>
              <Field label="Resolution" hint="Higher dpi = sharper, larger files">
                <ChoiceGrid value={dpi} onChange={setDpi} options={DPI.map((d) => ({ value: d.value, label: d.label, hint: d.hint }))} />
              </Field>
              <FormatQuality format={format} onFormat={setFormat} quality={quality} onQuality={setQuality} />
            </FieldGrid>
          </>
        }
        footerInfo={selected ? <StatusBadge tone="neutral">{selected.length} of {pageCount} pages → {ext.toUpperCase()}</StatusBadge> : <StatusBadge tone="error">Select at least one page</StatusBadge>}
        action={{ label: "Convert to images", busyLabel: "Rendering…", icon: <Images />, onClick: convert, disabled: !selected?.length }}
      >
        {pdf.busy && <PdfProgress {...progress} label="Rendering pages" />}
        {results.length > 0 && !pdf.busy && (
          <ToolPanel
            title={`${results.length} image${results.length === 1 ? "" : "s"} · ${formatBytes(total)}`}
            actions={
              <button type="button" onClick={downloadAll} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium bg-foreground text-background hover:opacity-90">
                <Download className="w-3.5 h-3.5" /> {results.length === 1 ? "Download" : "Download ZIP"}
              </button>
            }
          >
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
              {results.map((r) => (
                <li key={r.index} className="group relative rounded-md border border-border bg-muted/30 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={`Page ${r.index}`} className="w-full aspect-[3/4] object-contain bg-white" loading="lazy" />
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[11px]">
                    <span className="font-medium">Page {r.index}</span>
                    <span className="text-muted-foreground tabular-nums">{formatBytes(r.size)}</span>
                  </div>
                  <button type="button" onClick={() => downloadOne(r)} aria-label={`Download page ${r.index}`} className="absolute top-1.5 right-1.5 h-7 w-7 inline-flex items-center justify-center rounded-md bg-background/90 border border-border opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </ToolPanel>
        )}
      </PdfTool>
    </ToolLayout>
  );
}
