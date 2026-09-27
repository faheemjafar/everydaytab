"use client";

import { useState } from "react";
import { ArrowUpDown, Copy, RotateCcw } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { FileList, FileListItem, PdfTool, StatusBadge, ToolPanel, downloadFile, suffixName, usePdfFile } from "@/components/tool";

interface PageItem {
  id: string;
  pageIndex: number;
}

const makeId = () => Math.random().toString(36).slice(2, 9);
const initial = (count: number): PageItem[] => Array.from({ length: count }, (_, i) => ({ id: makeId(), pageIndex: i }));

export default function OrganizePDF() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const pdf = usePdfFile((_, count) => setPages(initial(count)));
  const { file, pageCount } = pdf;

  const move = (index: number, dir: -1 | 1) =>
    setPages((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  const duplicate = (index: number) =>
    setPages((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { ...prev[index], id: makeId() });
      return next;
    });
  const remove = (index: number) => setPages((prev) => prev.filter((_, i) => i !== index));
  const reverse = () => setPages((prev) => [...prev].reverse());

  const changed = pages.length !== pageCount || pages.some((p, i) => p.pageIndex !== i);

  const download = () =>
    pdf.run(async () => {
      if (!file || pages.length === 0) return;
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const out = await PDFDocument.create();
      const copied = await out.copyPages(doc, pages.map((p) => p.pageIndex));
      copied.forEach((p) => out.addPage(p));
      downloadFile(await out.save(), suffixName(file, "organized"));
    }, "Failed to organize PDF.");

  return (
    <ToolLayout toolId="organize-pdf">
      <PdfTool
        pdf={pdf}
        footerInfo={<StatusBadge tone={changed ? "info" : "neutral"}>{changed ? `${pages.length} pages · reordered` : `${pages.length} pages · original order`}</StatusBadge>}
        action={{ label: "Save new order", busyLabel: "Saving…", icon: <ArrowUpDown />, onClick: download, disabled: pages.length === 0 }}
      >
        <ToolPanel
          title="Page order"
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={reverse} disabled={pages.length < 2}>
                <ArrowUpDown /> Reverse
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPages(initial(pageCount))} disabled={!changed}>
                <RotateCcw /> Reset
              </Button>
            </>
          }
        >
          <FileList className="border-0 rounded-none max-h-[560px] overflow-y-auto custom-scrollbar">
            {pages.map((p, i) => (
              <FileListItem
                key={p.id}
                index={i}
                name={`Page ${p.pageIndex + 1}`}
                meta={p.pageIndex !== i ? `moved from position ${p.pageIndex + 1}` : undefined}
                icon={<span className="text-[11px] font-semibold tabular-nums">{p.pageIndex + 1}</span>}
                actions={
                  <Button variant="ghost" size="icon-sm" onClick={() => duplicate(i)} aria-label="Duplicate page">
                    <Copy />
                  </Button>
                }
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                canMoveUp={i > 0}
                canMoveDown={i < pages.length - 1}
                onRemove={() => remove(i)}
              />
            ))}
          </FileList>
        </ToolPanel>
      </PdfTool>
    </ToolLayout>
  );
}
