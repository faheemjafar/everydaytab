"use client";

import { useState } from "react";
import { Minimize2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import {
  ChoiceGrid,
  Field,
  PdfProgress,
  PdfTool,
  Segmented,
  Stat,
  ToolAlert,
  canvasToBytes,
  downloadFile,
  formatBytes,
  rasterizePages,
  suffixName,
  usePdfFile,
} from "@/components/tool";

const PRESETS = {
  light: { scale: 2.0, quality: 0.85, label: "Light", hint: "Best quality" },
  balanced: { scale: 1.5, quality: 0.65, label: "Balanced", hint: "Recommended" },
  aggressive: { scale: 1.2, quality: 0.45, label: "Strong", hint: "Smaller" },
  extreme: { scale: 1.0, quality: 0.25, label: "Extreme", hint: "Smallest" },
};
type Level = keyof typeof PRESETS;
type Mode = "structure" | "rasterize";

export default function CompressPDF() {
  const [mode, setMode] = useState<Mode>("rasterize");
  const [level, setLevel] = useState<Level>("balanced");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ before: number; after: number; bytes: Uint8Array } | null>(null);
  const pdf = usePdfFile(() => setResult(null));

  const compress = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      setResult(null);
      const buffer = await pdf.file.arrayBuffer();
      let bytes: Uint8Array;
      if (mode === "structure") {
        const doc = await PDFDocument.load(buffer);
        doc.setTitle("");
        doc.setAuthor("");
        doc.setSubject("");
        doc.setKeywords([]);
        doc.setCreator("");
        doc.setProducer("");
        bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
      } else {
        const { scale, quality } = PRESETS[level];
        const out = await PDFDocument.create();
        await rasterizePages(
          buffer.slice(0),
          scale,
          async ({ canvas, width, height }) => {
            const jpg = await out.embedJpg(await canvasToBytes(canvas, "image/jpeg", quality));
            // Output page keeps the original physical size; only pixel density changes.
            out.addPage([width, height]).drawImage(jpg, { x: 0, y: 0, width, height });
          },
          (done, total) => setProgress({ done, total })
        );
        bytes = await out.save();
      }
      setProgress({ done: 0, total: 0 });
      setResult({ before: buffer.byteLength, after: bytes.length, bytes });
      if (bytes.length < buffer.byteLength) downloadFile(bytes, suffixName(pdf.file, "compressed"));
    }, "Failed to compress PDF.");

  const saved = result ? Math.round((1 - result.after / result.before) * 100) : 0;

  return (
    <ToolLayout toolId="compress-pdf">
      <PdfTool
        pdf={pdf}
        options={
          <>
            <Field label="Method">
              <Segmented
                value={mode}
                onChange={(m) => {
                  setMode(m);
                  setResult(null);
                }}
                options={[
                  { value: "rasterize", label: "Re-encode pages" },
                  { value: "structure", label: "Lossless clean-up" },
                ]}
              />
            </Field>
            {mode === "rasterize" ? (
              <>
                <Field label="Strength">
                  <ChoiceGrid value={level} onChange={setLevel} cols={4} options={(Object.keys(PRESETS) as Level[]).map((k) => ({ value: k, label: PRESETS[k].label, hint: PRESETS[k].hint }))} />
                </Field>
                <p className="text-[11px] text-muted-foreground">
                  Renders every page to an image and re-compresses it. Biggest savings on scans and image-heavy PDFs; text stops being selectable.
                </p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Rewrites the file with object streams and strips metadata. Keeps text selectable; savings are usually modest.
              </p>
            )}
          </>
        }
        action={{ label: "Compress PDF", busyLabel: "Compressing…", icon: <Minimize2 />, onClick: compress }}
      >
        {pdf.busy && <PdfProgress {...progress} label="Compressing pages" />}
        {result && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Original" value={formatBytes(result.before)} />
              <Stat label="Compressed" value={formatBytes(result.after)} />
              <Stat label="Saved" value={saved > 0 ? `${saved}%` : "—"} />
            </div>
            {saved <= 0 && (
              <ToolAlert tone="warning" title="This PDF is already well compressed">
                The result was larger than the original, so nothing was downloaded. Try {mode === "structure" ? "“Re-encode pages”" : "a stronger preset"}.
              </ToolAlert>
            )}
            {saved > 0 && (
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => downloadFile(result.bytes, suffixName(pdf.file, "compressed"))}>
                Download again
              </button>
            )}
          </>
        )}
      </PdfTool>
    </ToolLayout>
  );
}
