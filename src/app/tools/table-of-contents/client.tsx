"use client";

import { useState } from "react";
import { List, Plus, Trash2 } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGrid, PdfTool, StatusBadge, ToolPanel, downloadFile, loadPdfJs, suffixName, usePdfFile } from "@/components/tool";

function sanitizeForWinAnsi(text: string): string {
  // Replace common non-WinAnsi characters with ASCII equivalents
  return text
    .replace(/[–—]/g, "-")
    .replace(/[“”"]/g, '"')
    .replace(/[‘']/g, "'")
    .replace(/…/g, "...")
    .replace(/[•·]/g, "*")
    .replace(/[©®™]/g, "")
    .replace(/[α-ωΑ-Ω]/g, "")
    .replace(/[←→↑↓↔↕]/g, "")
    .replace(/[^\x00-\xFF]/g, ""); // Strip any remaining non-Latin-1 chars
}

interface TOCItem {
  id: string;
  title: string;
  page: number;
  level: number;
}

const makeId = () => Math.random().toString(36).slice(2, 9);
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 72;

async function readOutline(file: File): Promise<TOCItem[]> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const outline = await doc.getOutline();
  const items: TOCItem[] = [];
  type Node = { title: string; dest: unknown; items?: Node[] };
  const walk = async (entries: Node[], level: number) => {
    for (const entry of entries) {
      let page = 1;
      try {
        const dest = typeof entry.dest === "string" ? await doc.getDestination(entry.dest) : (entry.dest as unknown[]);
        if (dest) page = (await doc.getPageIndex(dest[0] as Parameters<typeof doc.getPageIndex>[0])) + 1;
      } catch {
        page = 1;
      }
      items.push({ id: makeId(), title: entry.title, page, level });
      if (entry.items?.length) await walk(entry.items, level + 1);
    }
  };
  if (outline?.length) await walk(outline as Node[], 0);
  await doc.destroy();
  return items;
}

/** How many TOC pages `count` entries need (layout depends only on count & font size). */
function tocPageCount(count: number, fontSize: number) {
  let pages = 1;
  let y = PAGE_H - MARGIN - fontSize * 2 - fontSize * 3;
  for (let i = 0; i < count; i++) {
    if (y < MARGIN + fontSize) {
      pages++;
      y = PAGE_H - MARGIN;
    }
    y -= fontSize * 1.8;
  }
  return pages;
}

export default function TableOfContents() {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [tocTitle, setTocTitle] = useState("Table of Contents");
  const [fontSize, setFontSize] = useState(12);
  const [offset, setOffset] = useState(true);
  const [loaded, setLoaded] = useState<number | null>(null);
  const pdf = usePdfFile(async (f) => {
    setTocItems([]);
    setLoaded(null);
    try {
      const items = await readOutline(f);
      setTocItems(items);
      setLoaded(items.length);
    } catch {
      setLoaded(0);
    }
  });
  const { pageCount } = pdf;

  const tocPages = tocPageCount(tocItems.length, fontSize);
  const update = (id: string, patch: Partial<TOCItem>) => setTocItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const add = () => setTocItems((prev) => [...prev, { id: makeId(), title: `Section ${prev.length + 1}`, page: Math.min(pageCount || 1, (prev.at(-1)?.page ?? 0) + 1), level: 0 }]);

  const generateTOC = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const src = await PDFDocument.load(await pdf.file.arrayBuffer());
      const out = await PDFDocument.create();
      const font = await out.embedFont(StandardFonts.Helvetica);
      const boldFont = await out.embedFont(StandardFonts.HelveticaBold);
      const shift = offset ? tocPages : 0;

      let tocPage = out.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MARGIN - fontSize * 2;
      tocPage.drawText(sanitizeForWinAnsi(tocTitle), { x: MARGIN, y, font: boldFont, size: fontSize + 4, color: rgb(0, 0, 0) });
      y -= fontSize * 3;

      for (const item of tocItems) {
        if (y < MARGIN + fontSize) {
          tocPage = out.addPage([PAGE_W, PAGE_H]);
          y = PAGE_H - MARGIN;
        }
        const indent = item.level * 20;
        let titleText = sanitizeForWinAnsi(item.title);
        const pageText = String(item.page + shift);
        const pageNumX = PAGE_W - MARGIN - font.widthOfTextAtSize(pageText, fontSize);
        const dotsEndX = pageNumX - 8;
        const titleStartX = MARGIN + indent;

        // Truncate title if too long (reserve 40pt for dots + page number + gap)
        const maxTitleWidth = dotsEndX - titleStartX - 40;
        if (font.widthOfTextAtSize(titleText, fontSize) > maxTitleWidth) {
          let truncated = titleText;
          while (font.widthOfTextAtSize(truncated + "..", fontSize) > maxTitleWidth && truncated.length > 3) truncated = truncated.slice(0, -1);
          titleText = truncated + "..";
        }
        const titleWidth = font.widthOfTextAtSize(titleText, fontSize);
        const f = item.level === 0 ? boldFont : font;
        tocPage.drawText(titleText, { x: titleStartX, y, font: f, size: fontSize, color: rgb(0, 0, 0) });

        // Leader dots between title and page number
        const dotsWidth = dotsEndX - (titleStartX + titleWidth + 5);
        if (dotsWidth > 10) {
          tocPage.drawText(".".repeat(Math.floor(dotsWidth / (fontSize * 0.28))), { x: titleStartX + titleWidth + 5, y, font, size: fontSize, color: rgb(0.7, 0.7, 0.7) });
        }
        tocPage.drawText(pageText, { x: pageNumX, y, font, size: fontSize, color: rgb(0, 0, 0) });
        y -= fontSize * 1.8;
      }

      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach((p) => out.addPage(p));
      downloadFile(await out.save(), suffixName(pdf.file, "with-toc"));
    }, "Failed to generate table of contents.");

  return (
    <ToolLayout toolId="table-of-contents">
      <PdfTool
        pdf={pdf}
        options={
          <>
            <FieldGrid>
              <Field label="Heading" htmlFor="toc-title">
                <Input id="toc-title" value={tocTitle} onChange={(e) => setTocTitle(e.target.value)} />
              </Field>
              <Field label="Font size" htmlFor="toc-size">
                <Input id="toc-size" type="number" min={8} max={20} value={fontSize} onChange={(e) => setFontSize(Math.min(20, Math.max(8, Number(e.target.value) || 12)))} />
              </Field>
            </FieldGrid>
            <Field label="Adjust page numbers for the TOC" hint={`The TOC adds ${tocPages} page${tocPages === 1 ? "" : "s"} at the front; shift listed numbers so they match the new file.`} inline>
              <Switch checked={offset} onCheckedChange={setOffset} />
            </Field>
          </>
        }
        footerInfo={
          loaded === null ? <StatusBadge>Reading bookmarks…</StatusBadge> : <StatusBadge tone={loaded ? "success" : "neutral"}>{loaded ? `${loaded} entries from bookmarks` : "No bookmarks — add entries below"}</StatusBadge>
        }
        action={{ label: "Add table of contents", busyLabel: "Generating…", icon: <List />, onClick: generateTOC, disabled: !tocItems.length }}
      >
        <ToolPanel
          title={`Entries · ${tocItems.length}`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setTocItems([])} disabled={!tocItems.length} className="text-muted-foreground hover:text-destructive">
              <Trash2 /> Clear
            </Button>
          }
          footer={
            <Button variant="outline" size="sm" onClick={add}>
              <Plus /> Add entry
            </Button>
          }
        >
          {tocItems.length === 0 ? (
            <p className="px-3.5 py-8 text-center text-sm text-muted-foreground bg-dots">No entries yet.</p>
          ) : (
            <ul className="divide-y divide-border max-h-[480px] overflow-y-auto custom-scrollbar">
              {tocItems.map((t) => (
                <li key={t.id} className="flex items-center gap-2 px-3 py-1.5">
                  <Button variant="ghost" size="icon-sm" onClick={() => update(t.id, { level: Math.max(0, t.level - 1) })} disabled={t.level === 0} aria-label="Outdent">‹</Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => update(t.id, { level: Math.min(4, t.level + 1) })} aria-label="Indent">›</Button>
                  <Input value={t.title} onChange={(e) => update(t.id, { title: e.target.value })} aria-label="Title" className="flex-1 min-w-0" style={{ marginLeft: t.level * 16 }} />
                  <span className="text-[11px] text-muted-foreground">p.</span>
                  <Input type="number" min={1} max={pageCount || undefined} value={t.page} onChange={(e) => update(t.id, { page: Math.max(1, Number(e.target.value) || 1) })} aria-label="Page" className="w-16" />
                  <Button variant="ghost" size="icon-sm" onClick={() => setTocItems((prev) => prev.filter((x) => x.id !== t.id))} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ToolPanel>
      </PdfTool>
    </ToolLayout>
  );
}
