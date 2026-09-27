"use client";

import { useState } from "react";
import { Crop } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, PdfTool, Segmented, StatusBadge, downloadFile, suffixName, usePdfFile } from "@/components/tool";

type Unit = "pt" | "mm";
type Side = "top" | "right" | "bottom" | "left";
const PT_PER_MM = 72 / 25.4;

export default function CropPDF() {
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [margins, setMargins] = useState<Record<Side, number>>({ top: 0, right: 0, bottom: 0, left: 0 });
  const [unit, setUnit] = useState<Unit>("mm");
  const [linked, setLinked] = useState(false);

  const pdf = usePdfFile(async (f) => {
    setMargins({ top: 0, right: 0, bottom: 0, left: 0 });
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer());
      setPageSize(doc.getPage(0).getSize());
    } catch {
      setPageSize(null);
    }
  });

  const toPt = (v: number) => (unit === "mm" ? v * PT_PER_MM : v);
  const fromPt = (v: number) => Math.round((unit === "mm" ? v / PT_PER_MM : v) * 10) / 10;
  const setSide = (side: Side, value: number) =>
    setMargins((m) => (linked ? { top: value, right: value, bottom: value, left: value } : { ...m, [side]: value }));

  const crop = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      const m = { top: toPt(margins.top), right: toPt(margins.right), bottom: toPt(margins.bottom), left: toPt(margins.left) };
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        if (!Number.isFinite(width) || !Number.isFinite(height)) continue;
        const left = Math.min(Math.max(0, m.left), width / 2);
        const right = Math.min(Math.max(0, m.right), width / 2);
        const top = Math.min(Math.max(0, m.top), height / 2);
        const bottom = Math.min(Math.max(0, m.bottom), height / 2);
        const w = Math.max(1, width - left - right);
        const h = Math.max(1, height - top - bottom);
        page.setCropBox(left, bottom, w, h);
        page.setMediaBox(left, bottom, w, h);
      }
      downloadFile(await doc.save(), suffixName(pdf.file, "cropped"));
    }, "Failed to crop PDF.");

  const any = Object.values(margins).some((v) => v > 0);
  const pct = (side: Side) => {
    if (!pageSize) return 0;
    const total = side === "top" || side === "bottom" ? pageSize.height : pageSize.width;
    return Math.min(50, (toPt(margins[side]) / total) * 100);
  };

  const input = (side: Side) => (
    <Field label={side[0].toUpperCase() + side.slice(1)} htmlFor={`m-${side}`}>
      <Input id={`m-${side}`} type="number" min={0} step={unit === "mm" ? 1 : 5} value={margins[side]} onChange={(e) => setSide(side, Math.max(0, Number(e.target.value) || 0))} className="w-24" />
    </Field>
  );

  return (
    <ToolLayout toolId="crop-pdf">
      <PdfTool
        pdf={pdf}
        optionsTitle="Trim from each edge"
        options={
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="grid grid-cols-[auto_auto_auto] items-center gap-3">
              <span />
              {input("top")}
              <span />
              {input("left")}
              {/* Visual preview of the crop */}
              <div className="relative w-24 aspect-[1/1.414] rounded-sm border border-border bg-muted/40 overflow-hidden">
                <div
                  className="absolute bg-card border border-primary"
                  style={{ top: `${pct("top")}%`, right: `${pct("right")}%`, bottom: `${pct("bottom")}%`, left: `${pct("left")}%` }}
                />
              </div>
              {input("right")}
              <span />
              {input("bottom")}
              <span />
            </div>
            <div className="space-y-4">
              <Field label="Units">
                <Segmented
                  size="sm"
                  value={unit}
                  onChange={(u) => {
                    // Convert current values into the new unit.
                    setMargins((m) => {
                      const conv = (v: number) => Math.round((u === "mm" ? v / PT_PER_MM : v * PT_PER_MM) * 10) / 10;
                      return { top: conv(m.top), right: conv(m.right), bottom: conv(m.bottom), left: conv(m.left) };
                    });
                    setUnit(u);
                  }}
                  options={[
                    { value: "mm", label: "mm" },
                    { value: "pt", label: "points" },
                  ]}
                />
              </Field>
              <Field label="Same on all sides">
                <Segmented
                  size="sm"
                  value={linked ? "on" : "off"}
                  onChange={(v) => setLinked(v === "on")}
                  options={[
                    { value: "off", label: "Off" },
                    { value: "on", label: "On" },
                  ]}
                />
              </Field>
              {pageSize && (
                <p className="text-[11px] text-muted-foreground">
                  Page 1: {fromPt(pageSize.width)} × {fromPt(pageSize.height)} {unit}
                </p>
              )}
            </div>
          </div>
        }
        footerInfo={!any ? <StatusBadge>Set at least one margin</StatusBadge> : undefined}
        action={{ label: "Crop PDF", busyLabel: "Cropping…", icon: <Crop />, onClick: crop, disabled: !any }}
      />
    </ToolLayout>
  );
}
