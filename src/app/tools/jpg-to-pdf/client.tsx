"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { PDFDocument, PageSizes } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FileDropzone,
  FileList,
  FileListItem,
  PrivacyNote,
  Segmented,
  ToolAlert,
  ToolPanel,
  downloadFile,
  formatBytes,
} from "@/components/tool";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

type PageSize = "a4" | "letter" | "fit";
type Orientation = "auto" | "portrait" | "landscape";
type Margin = "0" | "18" | "36";

const makeId = () => Math.random().toString(36).slice(2, 9);

/** pdf-lib embeds only PNG/JPEG; re-encode anything else (WebP, GIF, AVIF…) to PNG. */
async function toEmbeddable(file: File): Promise<{ bytes: ArrayBuffer; kind: "png" | "jpg" }> {
  if (file.type === "image/png") return { bytes: await file.arrayBuffer(), kind: "png" };
  if (file.type === "image/jpeg" || file.type === "image/jpg") return { bytes: await file.arrayBuffer(), kind: "jpg" };
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not convert image"))), "image/png"));
  return { bytes: await blob.arrayBuffer(), kind: "png" };
}

export default function ImagesToPDF() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState<Margin>("18");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URLs on unmount.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  const addImages = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return setError("Please choose image files (JPG, PNG, WebP…).");
    setError(null);
    setImages((prev) => [...prev, ...imgs.map((file) => ({ id: makeId(), file, preview: URL.createObjectURL(file) }))]);
  };

  const remove = (id: string) =>
    setImages((prev) => {
      const hit = prev.find((i) => i.id === id);
      if (hit) URL.revokeObjectURL(hit.preview);
      return prev.filter((i) => i.id !== id);
    });

  const move = (index: number, dir: -1 | 1) =>
    setImages((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const clearAll = () => {
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    setImages([]);
  };

  const convert = async () => {
    if (!images.length) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await PDFDocument.create();
      const m = Number(margin);
      for (const img of images) {
        const { bytes, kind } = await toEmbeddable(img.file);
        const embedded = kind === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const { width, height } = embedded.scale(1);

        let pw: number, ph: number;
        if (pageSize === "fit") {
          pw = width + m * 2;
          ph = height + m * 2;
        } else {
          const [a, b] = pageSize === "a4" ? PageSizes.A4 : PageSizes.Letter;
          const landscape = orientation === "landscape" || (orientation === "auto" && width > height);
          [pw, ph] = landscape ? [b, a] : [a, b];
        }
        const scale = Math.min((pw - m * 2) / width, (ph - m * 2) / height, pageSize === "fit" ? 1 : Infinity);
        const w = width * scale;
        const h = height * scale;
        doc.addPage([pw, ph]).drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
      downloadFile(await doc.save(), `images-${images.length}.pdf`);
    } catch (e) {
      setError((e as Error).message || "Failed to create PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout toolId="jpg-to-pdf">
      <div className="space-y-3">
        {images.length === 0 ? (
          <FileDropzone
            onFiles={addImages}
            accept="image/*"
            multiple
            icon={<ImagePlus className="w-5 h-5" />}
            title="Drop images here or click to browse"
            hint="JPG, PNG, WebP, GIF, AVIF — one page per image, in the order you arrange them."
          />
        ) : (
          <>
            <ToolPanel
              title={`${images.length} image${images.length === 1 ? "" : "s"}`}
              actions={
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-destructive">
                  <Trash2 /> Clear all
                </Button>
              }
            >
              <FileList className="border-0 rounded-none max-h-[420px] overflow-y-auto custom-scrollbar">
                {images.map((img, i) => (
                  <FileListItem
                    key={img.id}
                    index={i}
                    name={img.file.name}
                    meta={formatBytes(img.file.size)}
                    thumbnail={img.preview}
                    onMoveUp={() => move(i, -1)}
                    onMoveDown={() => move(i, 1)}
                    canMoveUp={i > 0}
                    canMoveDown={i < images.length - 1}
                    onRemove={() => remove(img.id)}
                  />
                ))}
              </FileList>
              <div className="p-2 border-t border-border">
                <FileDropzone onFiles={addImages} accept="image/*" multiple size="sm" title="Add more images" />
              </div>
            </ToolPanel>

            <ToolPanel
              title="Page setup"
              bodyClassName="p-3.5 grid gap-4 sm:grid-cols-3"
              footer={
                <>
                  <PrivacyNote />
                  <span className="flex-1" />
                  <Button size="lg" onClick={convert} disabled={busy}>
                    {busy ? <RefreshCw className="animate-spin" /> : <ImagePlus />}
                    {busy ? "Creating PDF…" : `Create PDF (${images.length} page${images.length === 1 ? "" : "s"})`}
                  </Button>
                </>
              }
            >
              <Field label="Page size">
                <Segmented
                  size="sm"
                  value={pageSize}
                  onChange={setPageSize}
                  options={[
                    { value: "a4", label: "A4" },
                    { value: "letter", label: "Letter" },
                    { value: "fit", label: "Fit image" },
                  ]}
                />
              </Field>
              {pageSize !== "fit" && (
                <Field label="Orientation">
                  <Segmented
                    size="sm"
                    value={orientation}
                    onChange={setOrientation}
                    options={[
                      { value: "auto", label: "Auto" },
                      { value: "portrait", label: "Portrait" },
                      { value: "landscape", label: "Landscape" },
                    ]}
                  />
                </Field>
              )}
              <Field label="Margin">
                <Segmented
                  size="sm"
                  value={margin}
                  onChange={setMargin}
                  options={[
                    { value: "0", label: "None" },
                    { value: "18", label: "Small" },
                    { value: "36", label: "Large" },
                  ]}
                />
              </Field>
            </ToolPanel>
          </>
        )}
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
      </div>
    </ToolLayout>
  );
}
