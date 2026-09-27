"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./file-dropzone";
import { formatBytes } from "./file-list";
import { Segmented } from "./fields";
import { PrivacyNote, StatusBadge, ToolAlert } from "./status";
import { OptionsLayout, ToolPanel } from "./tool-panel";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export type ImageMime = "image/png" | "image/jpeg" | "image/webp";

export const IMAGE_FORMATS: { value: ImageMime; label: string; lossy: boolean }[] = [
  { value: "image/png", label: "PNG", lossy: false },
  { value: "image/jpeg", label: "JPEG", lossy: true },
  { value: "image/webp", label: "WebP", lossy: true },
];

export const extFor = (mime: string) => (mime === "image/jpeg" ? "jpg" : mime.split("/")[1] ?? "png");

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("This image couldn't be decoded by your browser."));
    img.src = src;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error(`Your browser can't encode ${extFor(mime).toUpperCase()}.`))), mime, quality)
  );
}

/** Draws `img` into a new canvas of the given size; JPEG gets a white background (no alpha). */
export function drawToCanvas(img: CanvasImageSource, w: number, h: number, mime: string, sx = 0, sy = 0, sw?: number, sh?: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d")!;
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (sw !== undefined && sh !== undefined) ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  else ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function baseName(file: File | null) {
  return file?.name.replace(/\.[^.]+$/, "") || "image";
}

/* ------------------------------------------------------------------ */
/* State                                                              */
/* ------------------------------------------------------------------ */

export interface ImageResult {
  url: string;
  blob: Blob;
  width: number;
  height: number;
  filename: string;
}

export interface ImageFileState {
  file: File | null;
  url: string | null;
  img: HTMLImageElement | null;
  width: number;
  height: number;
  result: ImageResult | null;
  error: string | null;
  busy: boolean;
  setError: (e: string | null) => void;
  load: (files: File[]) => Promise<void>;
  clear: () => void;
  clearResult: () => void;
  /** Runs a job that produces a Blob; stores it as the result. */
  produce: (job: () => Promise<{ blob: Blob; width: number; height: number; filename: string } | void>) => Promise<void>;
}

export function useImageFile(onLoaded?: (img: HTMLImageElement, file: File) => void): ImageFileState {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Track URLs to revoke on replace/unmount.
  const urls = useRef<{ src: string | null; out: string | null }>({ src: null, out: null });
  useEffect(
    () => () => {
      if (urls.current.src) URL.revokeObjectURL(urls.current.src);
      if (urls.current.out) URL.revokeObjectURL(urls.current.out);
    },
    []
  );

  const clearResult = useCallback(() => {
    if (urls.current.out) URL.revokeObjectURL(urls.current.out);
    urls.current.out = null;
    setResult(null);
  }, []);

  const load = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) return setError("Please choose an image file.");
      setError(null);
      clearResult();
      const u = URL.createObjectURL(f);
      try {
        const el = await loadImageElement(u);
        if (urls.current.src) URL.revokeObjectURL(urls.current.src);
        urls.current.src = u;
        setFile(f);
        setUrl(u);
        setImg(el);
        onLoaded?.(el, f);
      } catch (e) {
        URL.revokeObjectURL(u);
        setError((e as Error).message);
      }
    },
    [clearResult, onLoaded]
  );

  const clear = useCallback(() => {
    clearResult();
    if (urls.current.src) URL.revokeObjectURL(urls.current.src);
    urls.current.src = null;
    setFile(null);
    setUrl(null);
    setImg(null);
    setError(null);
  }, [clearResult]);

  const produce = useCallback<ImageFileState["produce"]>(
    async (job) => {
      setBusy(true);
      setError(null);
      try {
        const out = await job();
        if (!out) return;
        if (urls.current.out) URL.revokeObjectURL(urls.current.out);
        const u = URL.createObjectURL(out.blob);
        urls.current.out = u;
        setResult({ url: u, ...out });
      } catch (e) {
        setError((e as Error)?.message || "Something went wrong processing this image.");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  return { file, url, img, width: img?.naturalWidth ?? 0, height: img?.naturalHeight ?? 0, result, error, busy, setError, load, clear, clearResult, produce };
}

export function downloadResult(r: ImageResult) {
  const a = document.createElement("a");
  a.href = r.url;
  a.download = r.filename;
  a.click();
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

interface ImageToolProps {
  image: ImageFileState;
  options: ReactNode;
  action: { label: ReactNode; busyLabel?: ReactNode; icon?: ReactNode; onClick: () => void; disabled?: boolean };
  /** Replace the default preview (e.g. an interactive crop surface). */
  preview?: ReactNode;
  /** Extra content under the preview. */
  children?: ReactNode;
  dropHint?: ReactNode;
  /** Auto-run: hide the action button (tool updates the result itself). */
  hideAction?: boolean;
}

/**
 * Standard layout for single-image tools:
 *   empty → dropzone
 *   loaded → [options + primary action] | [preview with before/after + download]
 */
export function ImageTool({ image, options, action, preview, children, dropHint, hideAction }: ImageToolProps) {
  const { file, url, width, height, result, error, busy, load, clear } = image;
  const [view, setView] = useState<"before" | "after">("after");
  const showAfter = !!result && view === "after";
  const saved = file && result ? Math.round((1 - result.blob.size / file.size) * 100) : 0;

  if (!file || !url) {
    return (
      <div className="space-y-3">
        <FileDropzone onFiles={load} accept="image/*" icon={<ImageIcon className="w-5 h-5" />} title="Drop an image here or click to browse" hint={dropHint ?? "JPG, PNG, WebP, GIF, AVIF, SVG… processed on your device."} className="min-h-72" />
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
      </div>
    );
  }

  const optionsPanel = (
    <ToolPanel
      title="Options"
      bodyClassName="p-3.5 space-y-4"
      footer={
        hideAction ? (
          <PrivacyNote />
        ) : (
          <Button size="lg" onClick={action.onClick} disabled={busy || action.disabled} className="w-full">
            {busy ? <RefreshCw className="animate-spin" /> : action.icon}
            {busy ? action.busyLabel ?? "Working…" : action.label}
          </Button>
        )
      }
    >
      {options}
    </ToolPanel>
  );

  return (
    <OptionsLayout options={optionsPanel}>
      <ToolPanel
        title={<span className="normal-case tracking-normal font-medium text-foreground">{file.name}</span>}
        actions={
          <>
            {result && !preview && (
              <Segmented
                size="sm"
                value={view}
                onChange={setView}
                options={[
                  { value: "before", label: "Original" },
                  { value: "after", label: "Result" },
                ]}
              />
            )}
            <label className="inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
              Replace
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) load(Array.from(e.target.files)); e.target.value = ""; }} />
            </label>
            <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground hover:text-destructive">
              Remove
            </Button>
          </>
        }
        footer={
          <>
            <StatusBadge>
              {showAfter ? `${result!.width} × ${result!.height}` : `${width} × ${height}`} · {formatBytes(showAfter ? result!.blob.size : file.size)}
            </StatusBadge>
            {result && (
              <StatusBadge tone={saved > 0 ? "success" : "neutral"}>
                {saved > 0 ? `${saved}% smaller` : saved < 0 ? `${-saved}% larger` : "same size"}
              </StatusBadge>
            )}
            <span className="flex-1" />
            {result && (
              <Button variant="outline" onClick={() => downloadResult(result)}>
                <Download /> Download {extFor(result.blob.type).toUpperCase()}
              </Button>
            )}
          </>
        }
      >
        {preview ?? (
          <div className="flex items-center justify-center p-4 min-h-[360px] bg-[conic-gradient(#0000000a_25%,transparent_0_50%,#0000000a_0_75%,transparent_0)] bg-[length:16px_16px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={showAfter ? result!.url : url} alt={showAfter ? "Result" : "Original"} className="max-w-full max-h-[60vh] object-contain rounded-xs border border-border" />
          </div>
        )}
      </ToolPanel>
      {children}
      {error && <ToolAlert tone="error">{error}</ToolAlert>}
    </OptionsLayout>
  );
}

/** Output format + quality controls shared by image tools. */
export function FormatQuality({
  format,
  onFormat,
  quality,
  onQuality,
  formats = IMAGE_FORMATS,
}: {
  format: ImageMime;
  onFormat: (f: ImageMime) => void;
  quality: number;
  onQuality: (q: number) => void;
  formats?: typeof IMAGE_FORMATS;
}) {
  const lossy = formats.find((f) => f.value === format)?.lossy;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <span className="block text-xs font-medium">Format</span>
        <Segmented size="sm" value={format} onChange={onFormat} options={formats.map((f) => ({ value: f.value, label: f.label }))} />
      </div>
      {lossy && (
        <label className="block space-y-1.5">
          <span className="flex justify-between text-xs font-medium">
            Quality <span className="text-muted-foreground tabular-nums">{Math.round(quality * 100)}%</span>
          </span>
          <input type="range" min={0.1} max={1} step={0.01} value={quality} onChange={(e) => onQuality(Number(e.target.value))} className="w-full accent-primary" />
        </label>
      )}
    </div>
  );
}
