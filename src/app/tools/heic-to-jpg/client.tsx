"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, Download, ImageIcon, RefreshCw } from "lucide-react";
import JSZip from "jszip";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { FileDropzone, FileList, FileListItem, FormatQuality, IMAGE_FORMATS, PrivacyNote, StatusBadge, ToolAlert, ToolPanel, downloadFile, extFor, formatBytes, type ImageMime } from "@/components/tool";

interface Item { id: number; file: File; status: "pending" | "working" | "done" | "error"; url?: string; blob?: Blob; error?: string }

const isHeic = (f: File) => /\.(heic|heif|hif)$/i.test(f.name) || /image\/hei[cf]/.test(f.type);
const FORMATS = IMAGE_FORMATS.filter((f) => f.value !== "image/webp");

export default function HeicToJpg() {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<ImageMime>("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const latest = useRef(items);
  useEffect(() => { latest.current = items; });
  useEffect(() => () => latest.current.forEach((i) => i.url && URL.revokeObjectURL(i.url)), []);

  const add = (files: File[]) => {
    const fresh = files.filter(isHeic).map((file) => ({ id: nextId.current++, file, status: "pending" as const }));
    setItems((xs) => [...xs, ...fresh]);
  };
  const remove = (id: number) => setItems((xs) => { const url = xs.find((x) => x.id === id)?.url; if (url) URL.revokeObjectURL(url); return xs.filter((x) => x.id !== id); });
  const resetResults = () => setItems((xs) => xs.map((x) => { if (x.url) URL.revokeObjectURL(x.url); return { id: x.id, file: x.file, status: "pending" }; }));

  const convert = async () => {
    setBusy(true);
    const { default: heic2any } = await import("heic2any");
    for (const item of items) {
      if (item.status === "done") continue;
      setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, status: "working" } : x)));
      try {
        const out = await heic2any({ blob: item.file, toType: format, quality });
        const blob = Array.isArray(out) ? out[0] : out;
        setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, status: "done", blob, url: URL.createObjectURL(blob) } : x)));
      } catch (e) {
        const msg = (e as { message?: string })?.message || "Couldn't decode this file.";
        setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, status: "error", error: /format not supported|ERR_USER/.test(msg) ? "Not a HEIC/HEIF image, or it uses an unsupported variant." : msg } : x)));
      }
    }
    setBusy(false);
  };

  const outName = (f: File) => f.name.replace(/\.[^.]+$/, "") + "." + extFor(format);
  const done = items.filter((i) => i.status === "done");
  const downloadAll = async () => {
    if (done.length === 1) return downloadFile(done[0].blob!, outName(done[0].file), format);
    const zip = new JSZip();
    done.forEach((d) => zip.file(outName(d.file), d.blob!));
    downloadFile(await zip.generateAsync({ type: "blob" }), `heic-converted-${extFor(format)}.zip`, "application/zip");
  };
  const pending = items.filter((i) => i.status !== "done").length;

  return (
    <ToolLayout toolId="heic-to-jpg">
      <div className="space-y-3">
        {items.length === 0 ? (
          <FileDropzone onFiles={add} accept=".heic,.heif,.hif,image/heic,image/heif" multiple icon={<ImageIcon className="w-5 h-5" />} title="Drop HEIC photos here or click to browse" hint="iPhone / iPad photos (.heic, .heif) — converted locally, nothing is uploaded." />
        ) : (
          <>
            <FileList>
              {items.map((it, i) => (
                <FileListItem
                  key={it.id}
                  index={i}
                  name={it.file.name}
                  meta={`${formatBytes(it.file.size)}${it.blob ? ` → ${formatBytes(it.blob.size)}` : ""}`}
                  thumbnail={it.url}
                  icon={it.status === "working" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  actions={
                    it.status === "done" ? <Button size="sm" variant="ghost" onClick={() => downloadFile(it.blob!, outName(it.file), format)} aria-label={`Download ${outName(it.file)}`}><Download /></Button>
                    : it.status === "error" ? <StatusBadge tone="error">{it.error}</StatusBadge>
                    : it.status === "working" ? <StatusBadge tone="info">Converting</StatusBadge> : null
                  }
                  onRemove={busy ? undefined : () => remove(it.id)}
                />
              ))}
            </FileList>
            <FileDropzone onFiles={add} accept=".heic,.heif,.hif,image/heic,image/heif" multiple size="sm" title="Add more HEIC files" disabled={busy} />
            <ToolPanel
              title="Output"
              bodyClassName="p-3.5"
              footer={
                <>
                  <PrivacyNote />
                  <span className="flex-1" />
                  {done.length > 0 && <Button variant="outline" onClick={downloadAll}><Download /> {done.length === 1 ? "Download" : `Download all (${done.length})`}</Button>}
                  <Button size="lg" onClick={convert} disabled={busy || pending === 0}>{busy ? <RefreshCw className="animate-spin" /> : <ArrowRightLeft />}{busy ? "Converting…" : `Convert ${pending} to ${extFor(format).toUpperCase()}`}</Button>
                </>
              }
            >
              <FormatQuality format={format} onFormat={(f) => { setFormat(f); resetResults(); }} quality={quality} onQuality={setQuality} formats={FORMATS} />
            </ToolPanel>
          </>
        )}
        {items.length === 0 && <ToolAlert tone="info">HEIC is the default photo format on iPhones since iOS 11. Windows and many websites can&apos;t open it — convert to JPG for universal compatibility, or PNG to keep transparency.</ToolAlert>}
      </div>
    </ToolLayout>
  );
}
