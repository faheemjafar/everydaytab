"use client";

import { useRef, useState } from "react";
import { Bookmark, Download, Plus, Trash2, Upload } from "lucide-react";
import { PDFDocument, PDFHexString, PDFName, type PDFDict, type PDFRef } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PdfTool, StatusBadge, ToolPanel, downloadFile, loadPdfJs, suffixName, usePdfFile } from "@/components/tool";

interface BookmarkItem {
  id: string;
  title: string;
  page: number;
}

const makeId = () => Math.random().toString(36).slice(2, 9);

/** Reads the existing outline (flattened, nested titles indented). */
async function readOutline(file: File): Promise<BookmarkItem[]> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const outline = await doc.getOutline();
  const out: BookmarkItem[] = [];
  type Node = { title: string; dest: unknown; items?: Node[] };
  const walk = async (items: Node[], depth: number) => {
    for (const item of items) {
      if (item.dest) {
        let page = 1;
        try {
          const dest = typeof item.dest === "string" ? await doc.getDestination(item.dest) : (item.dest as unknown[]);
          if (dest) page = (await doc.getPageIndex(dest[0] as Parameters<typeof doc.getPageIndex>[0])) + 1;
        } catch {
          page = 1;
        }
        out.push({ id: makeId(), title: "  ".repeat(depth) + item.title, page });
      }
      if (item.items?.length) await walk(item.items, depth + 1);
    }
  };
  if (outline?.length) await walk(outline as Node[], 0);
  await doc.destroy();
  return out;
}

/** Writes a flat outline (replacing any existing one). */
function writeOutline(doc: PDFDocument, bms: BookmarkItem[]) {
  const pages = doc.getPages();
  if (!bms.length) {
    doc.catalog.delete(PDFName.of("Outlines"));
    return;
  }
  const outlines = doc.context.obj({}) as PDFDict;
  const outlinesRef = doc.context.register(outlines);
  const items: { ref: PDFRef; dict: PDFDict }[] = [];
  bms.forEach((bm, i) => {
    const dict = doc.context.obj({}) as PDFDict;
    const ref = doc.context.register(dict);
    dict.set(PDFName.of("Title"), PDFHexString.fromText(bm.title.trim() || "Untitled"));
    dict.set(PDFName.of("Parent"), outlinesRef);
    const pageRef = pages[Math.max(0, Math.min(bm.page - 1, pages.length - 1))].ref;
    dict.set(PDFName.of("Dest"), doc.context.obj([pageRef, PDFName.of("Fit")]));
    if (i > 0) {
      dict.set(PDFName.of("Prev"), items[i - 1].ref);
      items[i - 1].dict.set(PDFName.of("Next"), ref);
    }
    items.push({ ref, dict });
  });
  outlines.set(PDFName.of("Type"), PDFName.of("Outlines"));
  outlines.set(PDFName.of("First"), items[0].ref);
  outlines.set(PDFName.of("Last"), items[items.length - 1].ref);
  outlines.set(PDFName.of("Count"), doc.context.obj(items.length));
  doc.catalog.set(PDFName.of("Outlines"), outlinesRef);
}

export default function EditBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [original, setOriginal] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);
  const pdf = usePdfFile(async (f) => {
    setBookmarks([]);
    try {
      const bms = await readOutline(f);
      setBookmarks(bms);
      setOriginal(bms.length);
    } catch {
      setOriginal(0);
    }
  });
  const { pageCount } = pdf;

  const update = (id: string, patch: Partial<BookmarkItem>) => setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const move = (i: number, dir: -1 | 1) =>
    setBookmarks((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = () => setBookmarks((prev) => [...prev, { id: makeId(), title: `Section ${prev.length + 1}`, page: Math.min(pageCount || 1, (prev.at(-1)?.page ?? 0) + 1) }]);
  const sortByPage = () => setBookmarks((prev) => [...prev].sort((a, b) => a.page - b.page));

  const exportJson = () =>
    downloadFile(new Blob([JSON.stringify(bookmarks.map(({ title, page }) => ({ title, page })), null, 2)], { type: "application/json" }), "bookmarks.json");

  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data)) throw new Error("Expected a JSON array of { title, page }.");
      setBookmarks(data.map((d: { title?: unknown; page?: unknown }) => ({ id: makeId(), title: String(d.title ?? "Untitled"), page: Math.max(1, Number(d.page) || 1) })));
      pdf.setError(null);
    } catch (e) {
      pdf.setError((e as Error).message || "Invalid bookmarks file.");
    }
  };

  const save = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      writeOutline(doc, bookmarks);
      downloadFile(await doc.save(), suffixName(pdf.file, bookmarks.length ? "bookmarked" : "no-bookmarks"));
    }, "Failed to save bookmarks.");

  return (
    <ToolLayout toolId="edit-bookmarks">
      <PdfTool
        pdf={pdf}
        footerInfo={<StatusBadge>{original ? `${original} existing bookmark${original === 1 ? "" : "s"} loaded` : "No existing bookmarks"}</StatusBadge>}
        action={{ label: bookmarks.length ? `Save ${bookmarks.length} bookmark${bookmarks.length === 1 ? "" : "s"}` : "Save without bookmarks", busyLabel: "Saving…", icon: <Bookmark />, onClick: save }}
      >
        <ToolPanel
          title="Bookmarks"
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={sortByPage} disabled={bookmarks.length < 2}>
                Sort by page
              </Button>
              <Button variant="ghost" size="sm" onClick={() => importRef.current?.click()}>
                <Upload /> Import
              </Button>
              <Button variant="ghost" size="sm" onClick={exportJson} disabled={!bookmarks.length}>
                <Download /> Export
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setBookmarks([])} disabled={!bookmarks.length} className="text-muted-foreground hover:text-destructive">
                <Trash2 /> Clear
              </Button>
              <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) importJson(e.target.files[0]); e.target.value = ""; }} />
            </>
          }
          footer={
            <Button variant="outline" size="sm" onClick={add}>
              <Plus /> Add bookmark
            </Button>
          }
        >
          {bookmarks.length === 0 ? (
            <p className="px-3.5 py-8 text-center text-sm text-muted-foreground bg-dots">No bookmarks. Add one, or import a JSON list.</p>
          ) : (
            <ul className="divide-y divide-border max-h-[520px] overflow-y-auto custom-scrollbar">
              {bookmarks.map((b, i) => (
                <li key={b.id} className="flex items-center gap-2 px-3 py-1.5">
                  <span className="w-5 text-[11px] text-muted-foreground tabular-nums text-right shrink-0">{i + 1}</span>
                  <Input value={b.title} onChange={(e) => update(b.id, { title: e.target.value })} aria-label="Title" className="flex-1 min-w-0" />
                  <span className="text-[11px] text-muted-foreground shrink-0">p.</span>
                  <Input
                    type="number"
                    min={1}
                    max={pageCount || undefined}
                    value={b.page}
                    onChange={(e) => update(b.id, { page: Math.max(1, Math.min(pageCount || Infinity, Number(e.target.value) || 1)) })}
                    aria-label="Page"
                    className="w-16 shrink-0"
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === bookmarks.length - 1} aria-label="Move down">↓</Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setBookmarks((prev) => prev.filter((x) => x.id !== b.id))} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ToolPanel>
        <p className="text-[11px] text-muted-foreground px-0.5">Saved bookmarks are written as a single level; nested outlines are flattened (indented titles are kept).</p>
      </PdfTool>
    </ToolLayout>
  );
}
