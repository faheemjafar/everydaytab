"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import { ToolLayout } from "@/components/tool-layout";
import { Switch } from "@/components/ui/switch";
import { CodeArea, CopyButton, DownloadButton, Field, PdfTool, StatusBadge, ToolPanel, suffixName, usePdfFile } from "@/components/tool";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

export default function PDFToText() {
  const [text, setText] = useState("");
  const [pageMarkers, setPageMarkers] = useState(true);
  const [keepLines, setKeepLines] = useState(true);
  const pdf = usePdfFile(() => setText(""));

  const extract = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const doc = await pdfjs.getDocument({ data: await pdf.file.arrayBuffer() }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const content = await (await doc.getPage(i)).getTextContent();
        // pdf.js flags line ends with hasEOL; honour it when "keep line breaks" is on.
        const pageText = content.items
          .map((item) => {
            const it = item as { str?: string; hasEOL?: boolean };
            return (it.str ?? "") + (keepLines && it.hasEOL ? "\n" : " ");
          })
          .join("")
          .replace(/[ \t]+\n/g, "\n")
          .trim();
        parts.push(pageMarkers ? `--- Page ${i} ---\n${pageText}` : pageText);
      }
      setText(parts.join("\n\n"));
    }, "Failed to extract text.");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <ToolLayout toolId="pdf-to-text">
      <PdfTool
        pdf={pdf}
        options={
          <>
            <Field label="Page separators" hint="Insert “--- Page N ---” between pages." inline>
              <Switch checked={pageMarkers} onCheckedChange={setPageMarkers} />
            </Field>
            <Field label="Keep line breaks" hint="Off joins each page into flowing text." inline>
              <Switch checked={keepLines} onCheckedChange={setKeepLines} />
            </Field>
          </>
        }
        action={{ label: text ? "Extract again" : "Extract text", busyLabel: "Extracting…", icon: <FileText />, onClick: extract }}
      >
        {text && (
          <ToolPanel
            title="Text"
            actions={
              <>
                <StatusBadge>{words.toLocaleString()} words</StatusBadge>
                <CopyButton text={text} />
                <DownloadButton content={text} filename={suffixName(pdf.file, "text", "txt")} />
              </>
            }
          >
            <CodeArea value={text} onChange={(e) => setText(e.target.value)} minHeight={420} className="font-sans text-sm" />
          </ToolPanel>
        )}
        {pdf.file && !text && !pdf.busy && (
          <p className="text-xs text-muted-foreground px-0.5">Scanned PDFs (images of text) have no text layer — you&apos;ll need OCR for those.</p>
        )}
      </PdfTool>
    </ToolLayout>
  );
}
