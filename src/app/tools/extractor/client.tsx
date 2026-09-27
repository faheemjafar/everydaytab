"use client";

import { useMemo, useState } from "react";
import type JSZip from "jszip";
import { Download, File as FileIcon, Folder, RefreshCw, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropzone, formatBytes, PrivacyNote, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

interface Item { path: string; size: number; date: Date; entry: JSZip.JSZipObject }
const TEXT = /\.(txt|md|json|csv|xml|html?|css|js|ts|tsx|jsx|yml|yaml|toml|ini|log|py|sh|sql|svg|env|gitignore)$/i;
const IMAGE = /\.(png|jpe?g|gif|webp|avif|bmp|ico|svg)$/i;
// macOS resource forks and Finder metadata aren't user files.
const JUNK = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$)/;

const save = (blob: Blob, name: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

export default function ZipExtractor() {
  const [archive, setArchive] = useState<{ name: string; items: Item[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [hideJunk, setHideJunk] = useState(true);
  const [preview, setPreview] = useState<{ path: string; text?: string; url?: string } | null>(null);

  const open = async ([file]: File[]) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const { default: Zip } = await import("jszip");
      const zip = await Zip.loadAsync(file);
      const items: Item[] = [];
      zip.forEach((path, entry) => {
        if (!entry.dir) items.push({ path, size: (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0, date: entry.date, entry });
      });
      items.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
      setArchive({ name: file.name, items });
    } catch (e) {
      const m = (e as Error).message || "";
      setError(/encrypt/i.test(m) ? "This ZIP is password-protected, which isn't supported in the browser." : /end of central directory|corrupted|not a zip/i.test(m) ? "Not a valid ZIP archive (RAR, 7z and TAR aren't supported)." : m);
      setArchive(null);
    } finally {
      setBusy(false);
    }
  };

  const shown = useMemo(() => (archive?.items ?? []).filter((i) => (!hideJunk || !JUNK.test(i.path)) && (!filter || i.path.toLowerCase().includes(filter.toLowerCase()))), [archive, filter, hideJunk]);
  const total = shown.reduce((s, i) => s + i.size, 0);

  const show = async (i: Item) => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    if (IMAGE.test(i.path)) {
      const blob = await i.entry.async("blob");
      setPreview({ path: i.path, url: URL.createObjectURL(i.path.endsWith(".svg") ? new Blob([blob], { type: "image/svg+xml" }) : blob) });
    } else if (TEXT.test(i.path) && i.size < 2_000_000) setPreview({ path: i.path, text: await i.entry.async("string") });
    else setPreview(null);
  };

  const downloadOne = async (i: Item) => save(await i.entry.async("blob"), i.path.split("/").pop()!);

  if (!archive)
    return (
      <ToolLayout toolId="extractor">
        <div className="space-y-3">
          <FileDropzone onFiles={open} accept=".zip,application/zip,application/x-zip-compressed" title={busy ? "Reading archive…" : "Drop a ZIP file here or click to browse"} hint="Browse the contents and download only what you need." icon={busy ? <RefreshCw className="animate-spin" /> : undefined} />
          {error && <ToolAlert tone="error">{error}</ToolAlert>}
          <PrivacyNote>Opened locally — the archive is never uploaded.</PrivacyNote>
        </div>
      </ToolLayout>
    );

  return (
    <ToolLayout toolId="extractor">
      <div className="grid gap-3 lg:grid-cols-[1fr_380px]">
        <ToolPanel
          title={archive.name}
          actions={<><StatusBadge>{shown.length} files · {formatBytes(total)}</StatusBadge><Button variant="ghost" size="icon-sm" onClick={() => { setArchive(null); setPreview(null); }} aria-label="Close archive"><X /></Button></>}
          bodyClassName="p-0"
        >
          <div className="flex items-center gap-3 px-3 py-2 border-b border-border">
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter files…" className="h-8 max-w-60" />
            <label className="inline-flex items-center gap-2 text-[12px] text-muted-foreground"><input type="checkbox" checked={hideJunk} onChange={(e) => setHideJunk(e.target.checked)} className="size-3.5 accent-primary" />Hide __MACOSX / .DS_Store</label>
          </div>
          <ul className="divide-y divide-border max-h-[560px] overflow-y-auto custom-scrollbar">
            {shown.map((i) => {
              const parts = i.path.split("/");
              return (
                <li key={i.path} className={cn("group flex items-center gap-2 px-3 h-9 text-[13px] cursor-pointer hover:bg-muted/50", preview?.path === i.path && "bg-accent/40")} onClick={() => show(i)}>
                  <FileIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 min-w-0 truncate">
                    {parts.length > 1 && <span className="text-muted-foreground"><Folder className="inline w-3 h-3 -mt-0.5 mr-0.5" />{parts.slice(0, -1).join("/")}/</span>}
                    {parts[parts.length - 1]}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{formatBytes(i.size)}</span>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); downloadOne(i); }} aria-label={`Download ${i.path}`} className="opacity-60 group-hover:opacity-100"><Download /></Button>
                </li>
              );
            })}
          </ul>
        </ToolPanel>
        <ToolPanel title={preview ? preview.path.split("/").pop() : "Preview"} className="lg:sticky lg:top-3 self-start">
          {preview?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt="" className="max-h-[480px] w-full object-contain bg-muted/30" />
          ) : preview?.text !== undefined ? (
            <pre className="p-3 font-mono text-[11.5px] max-h-[480px] overflow-auto custom-scrollbar whitespace-pre-wrap break-all">{preview.text.slice(0, 200_000)}</pre>
          ) : (
            <p className="px-3.5 py-10 text-center text-xs text-muted-foreground">Click a text or image file to preview it. Use the download icon to save any file.</p>
          )}
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
