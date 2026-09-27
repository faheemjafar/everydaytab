"use client";

import { useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Heading } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, PdfTool, Segmented, downloadFile, placeText, suffixName, usePdfFile, type HAlign } from "@/components/tool";

const ALIGN = [
  { value: "left" as const, label: <AlignLeft className="w-3.5 h-3.5" /> },
  { value: "center" as const, label: <AlignCenter className="w-3.5 h-3.5" /> },
  { value: "right" as const, label: <AlignRight className="w-3.5 h-3.5" /> },
];

export default function HeaderFooter() {
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");
  const [fontSize, setFontSize] = useState(10);
  const [headerAlign, setHeaderAlign] = useState<HAlign>("center");
  const [footerAlign, setFooterAlign] = useState<HAlign>("center");
  const pdf = usePdfFile();

  const apply = () =>
    pdf.run(async () => {
      if (!pdf.file || (!header && !footer)) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const total = doc.getPageCount();
      doc.getPages().forEach((page, i) => {
        // {page} and {total} placeholders are expanded per page.
        const expand = (s: string) => s.replace(/\{page\}/gi, String(i + 1)).replace(/\{total\}/gi, String(total));
        const size = page.getSize();
        for (const [text, align, v] of [
          [header, headerAlign, "top"],
          [footer, footerAlign, "bottom"],
        ] as const) {
          if (!text) continue;
          const t = expand(text);
          const { x, y } = placeText(size, font.widthOfTextAtSize(t, fontSize), align, v, 30, fontSize);
          page.drawText(t, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
        }
      });
      downloadFile(await doc.save(), suffixName(pdf.file, "header-footer"));
    }, "Failed to add header/footer.");

  const row = (label: string, value: string, set: (v: string) => void, align: HAlign, setAlign: (v: HAlign) => void, id: string) => (
    <Field label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <Input id={id} value={value} onChange={(e) => set(e.target.value)} placeholder={id === "header" ? "Confidential — Q3 report" : "Page {page} of {total}"} />
        <Segmented size="sm" value={align} onChange={setAlign} options={ALIGN} />
      </div>
    </Field>
  );

  return (
    <ToolLayout toolId="header-footer">
      <PdfTool
        pdf={pdf}
        options={
          <>
            {row("Header", header, setHeader, headerAlign, setHeaderAlign, "header")}
            {row("Footer", footer, setFooter, footerAlign, setFooterAlign, "footer")}
            <Field label="Font size" htmlFor="size" inline>
              <Input id="size" type="number" min={6} max={36} value={fontSize} onChange={(e) => setFontSize(Math.min(36, Math.max(6, Number(e.target.value) || 10)))} className="w-20" />
            </Field>
            <p className="text-[11px] text-muted-foreground">
              Use <code className="font-mono">{"{page}"}</code> and <code className="font-mono">{"{total}"}</code> for page numbers.
            </p>
          </>
        }
        action={{ label: "Apply to all pages", busyLabel: "Applying…", icon: <Heading />, onClick: apply, disabled: !header && !footer }}
      />
    </ToolLayout>
  );
}
