"use client";

import { useState } from "react";
import { Eraser } from "lucide-react";
import { PDFDocument, PDFName } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { PdfTool, StatusBadge, ToolAlert, downloadFile, suffixName, usePdfFile } from "@/components/tool";

async function countAnnotations(file: File) {
  const doc = await PDFDocument.load(await file.arrayBuffer());
  return doc.getPages().reduce((n, p) => n + (p.node.Annots()?.asArray().length ?? 0), 0);
}

export default function RemoveAnnotations() {
  const [annotCount, setAnnotCount] = useState<number | null>(null);
  const [removed, setRemoved] = useState<number | null>(null);
  const pdf = usePdfFile((f) => {
    setAnnotCount(null);
    setRemoved(null);
    countAnnotations(f).then(setAnnotCount, () => setAnnotCount(0));
  });

  const removeAnnotations = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      let n = 0;
      for (const page of doc.getPages()) {
        const refs = page.node.Annots()?.asArray() ?? [];
        if (refs.length) {
          page.node.delete(PDFName.of("Annots"));
          n += refs.length;
        }
      }
      downloadFile(await doc.save(), suffixName(pdf.file, "clean"));
      setRemoved(n);
    }, "Failed to remove annotations.");

  return (
    <ToolLayout toolId="remove-annotations">
      <PdfTool
        pdf={pdf}
        footerInfo={
          annotCount === null ? (
            <StatusBadge>Scanning…</StatusBadge>
          ) : (
            <StatusBadge tone={annotCount ? "info" : "success"}>
              {annotCount ? `${annotCount} annotation${annotCount === 1 ? "" : "s"} found` : "No annotations found"}
            </StatusBadge>
          )
        }
        action={{ label: "Remove annotations", busyLabel: "Removing…", icon: <Eraser />, onClick: removeAnnotations, disabled: !annotCount }}
      >
        {removed !== null && (
          <ToolAlert tone="success" title="Done">
            Removed {removed} annotation{removed === 1 ? "" : "s"} — comments, highlights, links and form widgets. Page content is untouched.
          </ToolAlert>
        )}
      </PdfTool>
    </ToolLayout>
  );
}
