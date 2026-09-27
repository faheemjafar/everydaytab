"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, FieldGrid, PdfTool, StatusBadge, downloadFile, suffixName, usePdfFile } from "@/components/tool";

export default function SplitPDF() {
  const [startPage, setStartPage] = useState("1");
  const [endPage, setEndPage] = useState("");
  const pdf = usePdfFile((_, count) => {
    setStartPage("1");
    setEndPage(String(count || ""));
  });
  const { file, pageCount } = pdf;

  const start = parseInt(startPage, 10);
  const end = parseInt(endPage, 10);
  const valid = !isNaN(start) && !isNaN(end) && start >= 1 && end <= pageCount && start <= end;
  const selected = valid ? end - start + 1 : 0;

  const split = () =>
    pdf.run(async () => {
      if (!file || !valid) return;
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const pages = await out.copyPages(doc, Array.from({ length: selected }, (_, i) => start - 1 + i));
      pages.forEach((p) => out.addPage(p));
      downloadFile(await out.save(), suffixName(file, `pages-${start}-${end}`));
    }, "Failed to split PDF.");

  return (
    <ToolLayout toolId="split-pdf">
      <PdfTool
        pdf={pdf}
        optionsTitle="Page range"
        options={
          <>
            <FieldGrid>
              <Field label="From page" htmlFor="start">
                <Input id="start" type="number" min={1} max={pageCount} value={startPage} onChange={(e) => setStartPage(e.target.value)} />
              </Field>
              <Field label="To page" htmlFor="end">
                <Input id="end" type="number" min={1} max={pageCount} value={endPage} onChange={(e) => setEndPage(e.target.value)} />
              </Field>
            </FieldGrid>
            {valid ? (
              <StatusBadge tone="neutral">
                {selected} of {pageCount} pages selected
              </StatusBadge>
            ) : (
              <StatusBadge tone="error">Enter a range between 1 and {pageCount}</StatusBadge>
            )}
          </>
        }
        action={{ label: "Split PDF", busyLabel: "Splitting…", icon: <Scissors />, onClick: split, disabled: !valid }}
      />
    </ToolLayout>
  );
}
