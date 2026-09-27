"use client";

import { useState } from "react";
import { Check, FileMinus, ScanSearch } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Field, PdfProgress, PdfTool, StatusBadge, ToolAlert, ToolPanel, downloadFile, rasterizePages, suffixName, usePdfFile } from "@/components/tool";
import { cn } from "@/lib/utils";

interface BlankPage {
  index: number;
  thumbnail: string;
  ink: number;
  selected: boolean;
}

export default function RemoveBlankPages() {
  const [blankPages, setBlankPages] = useState<BlankPage[] | null>(null);
  const [sensitivity, setSensitivity] = useState(80);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const pdf = usePdfFile(() => setBlankPages(null));

  // Allowed share of non-white pixels: 80% sensitivity ≈ 1.1% ink.
  const maxInk = 5 - (sensitivity / 100) * 4.9;

  const detect = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const found: BlankPage[] = [];
      await rasterizePages(
        pdf.file,
        0.5,
        ({ canvas, ctx, index }) => {
          const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let dark = 0;
          for (let i = 0; i < d.length; i += 4) if ((d[i] + d[i + 1] + d[i + 2]) / 3 < 240) dark++;
          const ink = (dark / (d.length / 4)) * 100;
          if (ink <= maxInk) found.push({ index: index - 1, thumbnail: canvas.toDataURL("image/jpeg", 0.6), ink, selected: true });
        },
        (done, total) => setProgress({ done, total })
      );
      setBlankPages(found);
    }, "Failed to scan for blank pages.");

  const selected = blankPages?.filter((p) => p.selected) ?? [];

  const removeSelected = () =>
    pdf.run(async () => {
      if (!pdf.file || !selected.length) return;
      const src = await PDFDocument.load(await pdf.file.arrayBuffer());
      const drop = new Set(selected.map((p) => p.index));
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, src.getPageIndices().filter((i) => !drop.has(i)));
      pages.forEach((p) => out.addPage(p));
      downloadFile(await out.save(), suffixName(pdf.file, "no-blanks"));
    }, "Failed to remove blank pages.");

  const scanned = blankPages !== null;
  const toggle = (index: number) => setBlankPages((prev) => prev?.map((p) => (p.index === index ? { ...p, selected: !p.selected } : p)) ?? null);

  return (
    <ToolLayout toolId="remove-blank-pages">
      <PdfTool
        pdf={pdf}
        optionsTitle="Detection"
        options={
          <Field label={`Sensitivity — ${sensitivity}%`} hint="Higher treats only truly empty pages as blank; lower also catches pages with a stray mark or scan noise.">
            <Slider
              min={0}
              max={100}
              step={5}
              value={[sensitivity]}
              onValueChange={(v) => {
                setSensitivity(v[0]);
                setBlankPages(null);
              }}
            />
          </Field>
        }
        footerInfo={
          scanned ? (
            <StatusBadge tone={blankPages!.length ? "info" : "success"}>
              {blankPages!.length ? `${blankPages!.length} blank page${blankPages!.length === 1 ? "" : "s"} found` : "No blank pages found"}
            </StatusBadge>
          ) : undefined
        }
        action={
          scanned && blankPages!.length
            ? { label: `Remove ${selected.length} page${selected.length === 1 ? "" : "s"}`, busyLabel: "Removing…", icon: <FileMinus />, onClick: removeSelected, disabled: !selected.length }
            : { label: scanned ? "Scan again" : "Scan for blank pages", busyLabel: "Scanning…", icon: <ScanSearch />, onClick: detect }
        }
      >
        {pdf.busy && !scanned && <PdfProgress {...progress} label="Scanning pages" />}
        {scanned && blankPages!.length > 0 && (
          <ToolPanel
            title="Blank pages — click to keep"
            actions={
              <Button variant="ghost" size="sm" onClick={detect} disabled={pdf.busy}>
                <ScanSearch /> Rescan
              </Button>
            }
            bodyClassName="p-3"
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
              {blankPages!.map((p) => (
                <button
                  key={p.index}
                  type="button"
                  onClick={() => toggle(p.index)}
                  aria-pressed={p.selected}
                  className={cn("relative rounded-md border p-1.5 text-left transition-colors", p.selected ? "border-destructive bg-destructive/5" : "border-border bg-card opacity-60 hover:opacity-100")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbnail} alt={`Page ${p.index + 1}`} className="w-full aspect-[1/1.414] object-contain bg-white rounded-sm border border-border" />
                  <span className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="font-medium">p.{p.index + 1}</span>
                    <span className="text-muted-foreground tabular-nums">{p.ink.toFixed(1)}%</span>
                  </span>
                  {p.selected && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </ToolPanel>
        )}
        {scanned && blankPages!.length === 0 && <ToolAlert tone="success">No blank pages at this sensitivity. Lower it to catch pages with scan noise.</ToolAlert>}
      </PdfTool>
    </ToolLayout>
  );
}
