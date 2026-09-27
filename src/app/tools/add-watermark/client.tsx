"use client";

import { useState } from "react";
import { Stamp } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ChoiceGrid, Field, FieldGrid, PdfTool, downloadFile, suffixName, usePdfFile } from "@/components/tool";

type Position = "center" | "tile" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "center", label: "Diagonal" },
  { value: "tile", label: "Tiled" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

const LAYOUT: Record<Position, { x: number; y: number; angle: number }> = {
  center: { x: 0.5, y: 0.5, angle: -45 },
  tile: { x: 0.5, y: 0.5, angle: -30 },
  "top-left": { x: 0.15, y: 0.85, angle: 0 },
  "top-right": { x: 0.85, y: 0.85, angle: 0 },
  "bottom-left": { x: 0.15, y: 0.15, angle: 0 },
  "bottom-right": { x: 0.85, y: 0.15, angle: 0 },
};

/** Renders text to a PNG via canvas so any script/emoji works (standard PDF fonts are Latin-only). */
async function createTextImage(text: string, color: string, size: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");
  const dpr = 2;
  const font = `bold ${size * dpr}px Arial, sans-serif`;
  ctx.font = font;
  canvas.width = Math.ceil(ctx.measureText(text).width) + 4;
  canvas.height = Math.ceil(size * dpr * 1.4);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 2, canvas.height / 2);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Canvas toBlob failed"))), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

export default function AddWatermark() {
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.4);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#999999");
  const [position, setPosition] = useState<Position>("center");
  const pdf = usePdfFile();

  const apply = () =>
    pdf.run(async () => {
      if (!pdf.file || !text.trim()) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      const image = await doc.embedPng(await createTextImage(text, color, fontSize));
      const w = image.width / 2;
      const h = image.height / 2;
      const { x: px, y: py, angle } = LAYOUT[position];
      const rad = (angle * Math.PI) / 180;
      // Offset so the image rotates around its centre.
      const at = (cx: number, cy: number) => ({
        x: cx - Math.cos(rad) * (w / 2) + Math.sin(rad) * (h / 2),
        y: cy - Math.sin(rad) * (w / 2) - Math.cos(rad) * (h / 2),
      });

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const points: [number, number][] = [];
        if (position === "tile") {
          for (let tx = 0; tx < width; tx += 200) for (let ty = 0; ty < height; ty += 200) points.push([tx, ty]);
        } else {
          points.push([px * width, py * height]);
        }
        for (const [cx, cy] of points) page.drawImage(image, { ...at(cx, cy), width: w, height: h, opacity, rotate: degrees(angle) });
      }
      downloadFile(await doc.save(), suffixName(pdf.file, "watermarked"));
    }, "Failed to add watermark.");

  const layout = LAYOUT[position];

  return (
    <ToolLayout toolId="add-watermark">
      <PdfTool
        pdf={pdf}
        options={
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 space-y-4">
              <Field label="Text" htmlFor="wm-text">
                <Input id="wm-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="CONFIDENTIAL" />
              </Field>
              <Field label="Placement">
                <ChoiceGrid value={position} onChange={setPosition} options={POSITIONS} />
              </Field>
              <FieldGrid>
                <Field label={`Size — ${fontSize}pt`}>
                  <Slider min={12} max={120} step={2} value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} />
                </Field>
                <Field label={`Opacity — ${Math.round(opacity * 100)}%`}>
                  <Slider min={0.05} max={1} step={0.05} value={[opacity]} onValueChange={(v) => setOpacity(v[0])} />
                </Field>
              </FieldGrid>
              <Field label="Colour" inline>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Watermark colour" className="w-8 h-8 rounded-md border border-input bg-card p-0.5 cursor-pointer" />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-24 font-mono uppercase" />
                </div>
              </Field>
            </div>

            {/* Live preview */}
            <Field label="Preview">
              <div className="relative w-44 aspect-[1/1.414] rounded-sm border border-border bg-white overflow-hidden">
                <div className="absolute inset-4 flex flex-col gap-1.5" aria-hidden>
                  {Array.from({ length: 14 }, (_, i) => (
                    <span key={i} className="block h-1 rounded-full bg-stone-200" style={{ width: `${60 + ((i * 37) % 40)}%` }} />
                  ))}
                </div>
                {(position === "tile" ? Array.from({ length: 9 }, (_, i) => [0.15 + (i % 3) * 0.35, 0.15 + Math.floor(i / 3) * 0.35]) : [[layout.x, 1 - layout.y]]).map(([x, y], i) => (
                  <span
                    key={i}
                    className="absolute whitespace-nowrap font-bold"
                    style={{
                      left: `${x * 100}%`,
                      top: `${y * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${layout.angle}deg)`,
                      color,
                      opacity,
                      fontSize: `${Math.max(6, fontSize * 0.22)}px`,
                    }}
                  >
                    {text || " "}
                  </span>
                ))}
              </div>
            </Field>
          </div>
        }
        action={{ label: "Add watermark", busyLabel: "Watermarking…", icon: <Stamp />, onClick: apply, disabled: !text.trim() }}
      />
    </ToolLayout>
  );
}
