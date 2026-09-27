"use client";

import { useState } from "react";
import { Contrast } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Field, PdfProgress, PdfTool, Segmented, canvasToBytes, downloadFile, rasterizePages, suffixName, usePdfFile } from "@/components/tool";

type Quality = "1.5" | "2" | "3";
type Style = "invert" | "dark";

export default function InvertColors() {
  const [scale, setScale] = useState<Quality>("2");
  const [style, setStyle] = useState<Style>("invert");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const pdf = usePdfFile();

  const invert = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const out = await PDFDocument.create();
      await rasterizePages(
        pdf.file,
        Number(scale),
        async ({ canvas, ctx, width, height }) => {
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = img.data;
          for (let j = 0; j < d.length; j += 4) {
            if (style === "invert") {
              d[j] = 255 - d[j];
              d[j + 1] = 255 - d[j + 1];
              d[j + 2] = 255 - d[j + 2];
            } else {
              // "Dark reading": invert lightness, then soften to a warm dark grey instead of pure black.
              const l = 255 - (0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]);
              const v = 28 + (l / 255) * 200;
              d[j] = v;
              d[j + 1] = v * 0.98;
              d[j + 2] = v * 0.94;
            }
          }
          ctx.putImageData(img, 0, 0);
          const png = await out.embedPng(await canvasToBytes(canvas, "image/png"));
          out.addPage([width, height]).drawImage(png, { x: 0, y: 0, width, height });
        },
        (done, total) => setProgress({ done, total })
      );
      downloadFile(await out.save(), suffixName(pdf.file, style === "invert" ? "inverted" : "dark"));
    }, "Failed to invert colors.");

  return (
    <ToolLayout toolId="invert-colors">
      <PdfTool
        pdf={pdf}
        options={
          <>
            <Field label="Style">
              <Segmented
                value={style}
                onChange={setStyle}
                options={[
                  { value: "invert", label: "True invert" },
                  { value: "dark", label: "Dark reading mode" },
                ]}
              />
            </Field>
            <Field label="Render quality" hint="Higher = sharper text, larger file, slower.">
              <Segmented
                size="sm"
                value={scale}
                onChange={setScale}
                options={[
                  { value: "1.5", label: "Standard" },
                  { value: "2", label: "High" },
                  { value: "3", label: "Print" },
                ]}
              />
            </Field>
            <p className="text-[11px] text-muted-foreground">Pages are rendered to images, so text won&apos;t be selectable in the result.</p>
          </>
        }
        action={{ label: "Invert colours", busyLabel: "Inverting…", icon: <Contrast />, onClick: invert }}
      >
        {pdf.busy && <PdfProgress {...progress} />}
      </PdfTool>
    </ToolLayout>
  );
}
