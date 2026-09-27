"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { PagePicker, PdfTool, StatusBadge, downloadFile, parsePageList, suffixName, usePdfFile } from "@/components/tool";

export default function DeletePages() {
  const [pagesToDelete, setPagesToDelete] = useState("");
  const pdf = usePdfFile(() => setPagesToDelete(""));
  const { file, pageCount } = pdf;

  const toDelete = pagesToDelete.trim() ? parsePageList(pagesToDelete, pageCount) : [];
  const deletingAll = !!toDelete && toDelete.length >= pageCount && pageCount > 0;
  const canRun = !!toDelete && toDelete.length > 0 && !deletingAll;

  const removePages = () =>
    pdf.run(async () => {
      if (!file || !toDelete) return;
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const drop = new Set(toDelete.map((p) => p - 1));
      const out = await PDFDocument.create();
      const pages = await out.copyPages(doc, doc.getPageIndices().filter((i) => !drop.has(i)));
      pages.forEach((p) => out.addPage(p));
      downloadFile(await out.save(), suffixName(file, `removed-${toDelete.length}-pages`));
    }, "Failed to delete pages.");

  return (
    <ToolLayout toolId="delete-pages">
      <PdfTool
        pdf={pdf}
        optionsTitle="Pages to delete"
        options={<PagePicker value={pagesToDelete} onChange={setPagesToDelete} pageCount={pageCount} tone="destructive" label="Pages to delete" />}
        footerInfo={
          deletingAll ? (
            <StatusBadge tone="error">You can&apos;t delete every page</StatusBadge>
          ) : toDelete && toDelete.length > 0 ? (
            <StatusBadge>
              Deleting {toDelete.length} · keeping {pageCount - toDelete.length}
            </StatusBadge>
          ) : undefined
        }
        action={{ label: "Delete pages", busyLabel: "Deleting…", icon: <Trash2 />, onClick: removePages, disabled: !canRun }}
      />
    </ToolLayout>
  );
}
