"use client";

import { useState } from "react";
import { FileText, GitMerge, RefreshCw, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { FileDropzone, FileList, FileListItem, PrivacyNote, ToolAlert, ToolPanel, Toolbar, ToolbarSpacer, formatBytes } from "@/components/tool";

interface PDFFile {
  id: string;
  file: File;
  name: string;
  pageCount?: number;
}

export default function MergePDF() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).slice(2, 9);

  const addFiles = async (newFiles: File[]) => {
    const pdfFiles = newFiles.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length === 0) return;
    setError(null);
    const entries: PDFFile[] = [];
    for (const file of pdfFiles) {
      try {
        const doc = await PDFDocument.load(await file.arrayBuffer());
        entries.push({ id: generateId(), file, name: file.name, pageCount: doc.getPageCount() });
      } catch {
        entries.push({ id: generateId(), file, name: file.name });
      }
    }
    setFiles((prev) => [...prev, ...entries]);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const moveFile = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= files.length) return;
    setFiles((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const merge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const merged = await PDFDocument.create();
      for (const entry of files) {
        const doc = await PDFDocument.load(await entry.file.arrayBuffer());
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const bytes = await merged.save();
      const url = URL.createObjectURL(new Blob([bytes.slice()], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `merged-${files.length}-pdfs.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message || "Failed to merge PDFs.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = files.reduce((sum, f) => sum + (f.pageCount || 0), 0);

  return (
    <ToolLayout toolId="merge-pdf">
      <div className="space-y-3">
        {files.length === 0 ? (
          <FileDropzone
            onFiles={addFiles}
            accept="application/pdf"
            multiple
            icon={<FileText className="w-5 h-5" />}
            title="Drop PDF files here or click to browse"
            hint="Add two or more PDFs, then arrange them in the order you want."
          />
        ) : (
          <ToolPanel
            title={`${files.length} file${files.length === 1 ? "" : "s"} · ${totalPages} pages`}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-muted-foreground hover:text-destructive">
                <Trash2 /> Clear all
              </Button>
            }
            footer={
              <Toolbar className="w-full">
                <PrivacyNote />
                <ToolbarSpacer />
                <Button size="lg" onClick={merge} disabled={loading || files.length < 2}>
                  {loading ? <RefreshCw className="animate-spin" /> : <GitMerge />}
                  {loading ? "Merging…" : `Merge ${files.length} PDFs`}
                </Button>
              </Toolbar>
            }
          >
            <FileList className="border-0 rounded-none">
              {files.map((entry, index) => (
                <FileListItem
                  key={entry.id}
                  index={index}
                  name={entry.name}
                  meta={`${entry.pageCount ? `${entry.pageCount} pages · ` : ""}${formatBytes(entry.file.size)}`}
                  icon={<FileText className="w-4 h-4" />}
                  onMoveUp={() => moveFile(index, -1)}
                  onMoveDown={() => moveFile(index, 1)}
                  canMoveUp={index > 0}
                  canMoveDown={index < files.length - 1}
                  onRemove={() => removeFile(entry.id)}
                />
              ))}
            </FileList>
            <div className="p-2 border-t border-border">
              <FileDropzone onFiles={addFiles} accept="application/pdf" multiple size="sm" title="Add more PDFs" />
            </div>
          </ToolPanel>
        )}

        {files.length === 1 && <ToolAlert tone="info">Add at least one more PDF to merge.</ToolAlert>}
        {error && (
          <ToolAlert tone="error" title="Merge failed">
            {error}
          </ToolAlert>
        )}
      </div>
    </ToolLayout>
  );
}
