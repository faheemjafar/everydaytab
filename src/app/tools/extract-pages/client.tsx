"use client";

import { useState } from "react";
import { Files } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { PagePicker, PdfTool, StatusBadge, downloadFile, parsePageList, suffixName, usePdfFile } from "@/components/tool";

export default function ExtractPages() {
  const [pagesToExtract, setPagesToExtract] = useState("");
  const pdf = usePdfFile(() => setPagesToExtract(""));
  const { file, pageCount } = pdf;

  const selected = pagesToExtract.trim() ? parsePageList(pagesToExtract, pageCount) : [];
  const canRun = !!selected && selected.length > 0;

  const extract = () =>
    pdf.run(async () => {
      if (!file || !selected) return;
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const pages = await out.copyPages(doc, selected.map((p) => p - 1));
      pages.forEach((p) => out.addPage(p));
      downloadFile(await out.save(), suffixName(file, `extracted-${selected.length}-pages`));
    }, "Failed to extract pages.");

  return (
    <ToolLayout toolId="extract-pages">
      <PdfTool
        pdf={pdf}
        optionsTitle="Pages to extract"
        options={<PagePicker value={pagesToExtract} onChange={setPagesToExtract} pageCount={pageCount} label="Pages to extract" />}
        footerInfo={canRun ? <StatusBadge>{selected!.length} of {pageCount} pages</StatusBadge> : undefined}
        action={{ label: "Extract pages", busyLabel: "Extracting…", icon: <Files />, onClick: extract, disabled: !canRun }}
      />
    </ToolLayout>
  );
}
