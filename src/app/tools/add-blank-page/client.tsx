"use client";

import { useState } from "react";
import { FilePlus } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, FieldGrid, PdfTool, Segmented, StatusBadge, downloadFile, suffixName, usePdfFile } from "@/components/tool";

type Where = "start" | "end" | "before";

export default function AddBlankPage() {
  const [where, setWhere] = useState<Where>("end");
  const [position, setPosition] = useState("1");
  const [count, setCount] = useState("1");
  const pdf = usePdfFile(() => setPosition("1"));
  const { file, pageCount } = pdf;

  const pos = where === "start" ? 1 : where === "end" ? pageCount + 1 : parseInt(position, 10);
  const n = parseInt(count, 10);
  const valid = !isNaN(pos) && pos >= 1 && pos <= pageCount + 1 && n >= 1 && n <= 100;

  const addPage = () =>
    pdf.run(async () => {
      if (!file || !valid) return;
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const ref = doc.getPage(Math.min(pos - 1, doc.getPageCount() - 1)).getSize();
      // Insert blank pages sized like the neighbouring page.
      for (let i = 0; i < n; i++) doc.insertPage(pos - 1, [ref.width, ref.height]);
      downloadFile(await doc.save(), suffixName(file, "blank-page-added"));
    }, "Failed to add blank page.");

  return (
    <ToolLayout toolId="add-blank-page">
      <PdfTool
        pdf={pdf}
        optionsTitle="Insert"
        options={
          <>
            <Field label="Where">
              <Segmented
                value={where}
                onChange={setWhere}
                options={[
                  { value: "start", label: "At the start" },
                  { value: "before", label: "Before page…" },
                  { value: "end", label: "At the end" },
                ]}
              />
            </Field>
            <FieldGrid>
              {where === "before" && (
                <Field label={`Before page (1–${pageCount + 1})`} htmlFor="pos">
                  <Input id="pos" type="number" min={1} max={pageCount + 1} value={position} onChange={(e) => setPosition(e.target.value)} />
                </Field>
              )}
              <Field label="How many blank pages" htmlFor="count">
                <Input id="count" type="number" min={1} max={100} value={count} onChange={(e) => setCount(e.target.value)} />
              </Field>
            </FieldGrid>
          </>
        }
        footerInfo={valid ? <StatusBadge>Result: {pageCount + n} pages</StatusBadge> : <StatusBadge tone="error">Check the position and count</StatusBadge>}
        action={{ label: n > 1 ? `Add ${n} blank pages` : "Add blank page", busyLabel: "Adding…", icon: <FilePlus />, onClick: addPage, disabled: !valid }}
      />
    </ToolLayout>
  );
}
