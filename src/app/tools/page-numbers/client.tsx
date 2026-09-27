"use client";

import { useState } from "react";
import { ListOrdered } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldGrid,
  PdfTool,
  PositionPicker,
  Segmented,
  downloadFile,
  placeText,
  suffixName,
  usePdfFile,
  type HAlign,
  type VAlign,
} from "@/components/tool";

type Format = "n" | "page-n" | "n-of-total" | "page-n-of-total";

const FORMATS: { value: Format; label: string }[] = [
  { value: "n", label: "1" },
  { value: "page-n", label: "Page 1" },
  { value: "n-of-total", label: "1 / 10" },
  { value: "page-n-of-total", label: "Page 1 of 10" },
];

function formatLabel(fmt: Format, n: number, total: number) {
  switch (fmt) {
    case "page-n": return `Page ${n}`;
    case "n-of-total": return `${n} / ${total}`;
    case "page-n-of-total": return `Page ${n} of ${total}`;
    default: return String(n);
  }
}

export default function PageNumbers() {
  const [position, setPosition] = useState<`${VAlign}-${HAlign}`>("bottom-center");
  const [format, setFormat] = useState<Format>("n");
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [skipFirst, setSkipFirst] = useState(false);
  const pdf = usePdfFile();

  const apply = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const [v, h] = position.split("-") as [VAlign, HAlign];
      const numbered = skipFirst ? pages.slice(1) : pages;
      const total = numbered.length + startNumber - 1;
      numbered.forEach((page, i) => {
        const label = formatLabel(format, startNumber + i, total);
        const { x, y } = placeText(page.getSize(), font.widthOfTextAtSize(label, fontSize), h, v, 28, fontSize);
        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
      });
      downloadFile(await doc.save(), suffixName(pdf.file, "numbered"));
    }, "Failed to add page numbers.");

  return (
    <ToolLayout toolId="page-numbers">
      <PdfTool
        pdf={pdf}
        options={
          <div className="flex flex-col sm:flex-row gap-5">
            <Field label="Position">
              <PositionPicker value={position} onChange={setPosition} />
            </Field>
            <div className="flex-1 space-y-4">
              <Field label="Format">
                <Segmented value={format} onChange={setFormat} options={FORMATS} />
              </Field>
              <FieldGrid>
                <Field label="Start at" htmlFor="start">
                  <Input id="start" type="number" min={0} value={startNumber} onChange={(e) => setStartNumber(Number(e.target.value) || 0)} />
                </Field>
                <Field label="Font size" htmlFor="size">
                  <Input id="size" type="number" min={6} max={48} value={fontSize} onChange={(e) => setFontSize(Math.min(48, Math.max(6, Number(e.target.value) || 11)))} />
                </Field>
              </FieldGrid>
              <Field label="Skip the first page" hint="Useful for cover pages." inline>
                <Switch checked={skipFirst} onCheckedChange={setSkipFirst} />
              </Field>
            </div>
          </div>
        }
        action={{ label: "Add page numbers", busyLabel: "Numbering…", icon: <ListOrdered />, onClick: apply }}
      />
    </ToolLayout>
  );
}
