"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { PDFDocument, PDFName, rgb } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, PdfTool, downloadFile, hexToRgb01, suffixName, usePdfFile } from "@/components/tool";
import { cn } from "@/lib/utils";

const SWATCHES = ["#ffffff", "#fdf6e3", "#f5f5f4", "#fef9c3", "#e0f2fe", "#dcfce7", "#fce7f3", "#1c1917"];

export default function BackgroundColor() {
  const [color, setColor] = useState("#fdf6e3");
  const pdf = usePdfFile();

  const changeBackground = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const src = await PDFDocument.load(await pdf.file.arrayBuffer());
      const out = await PDFDocument.create();
      const { r, g, b } = hexToRgb01(color);
      // Rebuild each page as: coloured rectangle, then the original page drawn on top.
      for (let i = 0; i < src.getPageCount(); i++) {
        const [orig] = await out.copyPages(src, [i]);
        const { width, height } = orig.getSize();
        const page = out.addPage([width, height]);
        page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(r, g, b) });
        if (orig.node.has(PDFName.of("Contents"))) page.drawPage(await out.embedPage(orig), { x: 0, y: 0, width, height });
      }
      downloadFile(await out.save(), suffixName(pdf.file, "background"));
    }, "Failed to change background.");

  return (
    <ToolLayout toolId="background-color">
      <PdfTool
        pdf={pdf}
        optionsTitle="Background"
        options={
          <>
            <Field label="Colour">
              <div className="flex flex-wrap items-center gap-1.5">
                {SWATCHES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setColor(s)}
                    aria-label={s}
                    aria-pressed={color === s}
                    style={{ background: s }}
                    className={cn("w-8 h-8 rounded-md border border-border", color === s && "ring-2 ring-primary ring-offset-2 ring-offset-card")}
                  />
                ))}
                <span className="w-px h-6 bg-border mx-1" />
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Custom colour" className="w-8 h-8 rounded-md border border-input bg-card p-0.5 cursor-pointer" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-24 font-mono uppercase" />
              </div>
            </Field>
            <p className="text-[11px] text-muted-foreground">
              Pages with a solid white background of their own (common in scanned PDFs) will hide the new colour.
            </p>
          </>
        }
        action={{ label: "Apply background", busyLabel: "Applying…", icon: <Palette />, onClick: changeBackground }}
      />
    </ToolLayout>
  );
}
