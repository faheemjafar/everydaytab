"use client";

import { useRef, useState } from "react";
import { Crop as CropIcon } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, FieldGrid, FormatQuality, ImageTool, Segmented, baseName, canvasToBlob, drawToCanvas, extFor, useImageFile, type ImageMime } from "@/components/tool";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Handle = "move" | "nw" | "ne" | "sw" | "se";

const ASPECTS: { value: string; label: string; r: number | null }[] = [
  { value: "free", label: "Free", r: null },
  { value: "1:1", label: "1:1", r: 1 },
  { value: "4:3", label: "4:3", r: 4 / 3 },
  { value: "3:2", label: "3:2", r: 3 / 2 },
  { value: "16:9", label: "16:9", r: 16 / 9 },
  { value: "9:16", label: "9:16", r: 9 / 16 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Largest centred rect of aspect r inside W×H (80% if free). */
function initialRect(W: number, H: number, r: number | null): Rect {
  if (!r) return { x: Math.round(W * 0.1), y: Math.round(H * 0.1), w: Math.round(W * 0.8), h: Math.round(H * 0.8) };
  let w = W;
  let h = w / r;
  if (h > H) {
    h = H;
    w = h * r;
  }
  return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w: Math.round(w), h: Math.round(h) };
}

export default function ImageCropper() {
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState("free");
  const [format, setFormat] = useState<ImageMime>("image/png");
  const [quality, setQuality] = useState(0.92);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: Handle; start: Rect; px: number; py: number } | null>(null);

  const image = useImageFile((img) => setRect(initialRect(img.naturalWidth, img.naturalHeight, null)));
  const { width: W, height: H } = image;
  const ratio = ASPECTS.find((a) => a.value === aspect)?.r ?? null;

  const startDrag = (e: React.PointerEvent, handle: Handle) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { handle, start: rect, px: e.clientX, py: e.clientY };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const stage = stageRef.current;
    if (!d || !stage) return;
    // Convert screen delta to image pixels.
    const scale = W / stage.clientWidth;
    const dx = (e.clientX - d.px) * scale;
    const dy = (e.clientY - d.py) * scale;
    const s = d.start;
    if (d.handle === "move") {
      setRect({ ...s, x: Math.round(clamp(s.x + dx, 0, W - s.w)), y: Math.round(clamp(s.y + dy, 0, H - s.h)) });
      return;
    }
    const left = d.handle.includes("w");
    const top = d.handle.includes("n");
    let w = clamp(s.w + (left ? -dx : dx), 8, left ? s.x + s.w : W - s.x);
    let h = clamp(s.h + (top ? -dy : dy), 8, top ? s.y + s.h : H - s.y);
    if (ratio) {
      // Drive by the larger change, then fit within bounds.
      if (Math.abs(dx) > Math.abs(dy)) h = w / ratio;
      else w = h * ratio;
      const maxW = left ? s.x + s.w : W - s.x;
      const maxH = top ? s.y + s.h : H - s.y;
      if (w > maxW) {
        w = maxW;
        h = w / ratio;
      }
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
    }
    setRect({
      x: Math.round(left ? s.x + s.w - w : s.x),
      y: Math.round(top ? s.y + s.h - h : s.y),
      w: Math.round(w),
      h: Math.round(h),
    });
  };

  const setField = (k: keyof Rect, v: number) =>
    setRect((r) => {
      const next = { ...r, [k]: Math.max(0, Math.round(v)) };
      if (ratio && k === "w") next.h = Math.round(next.w / ratio);
      if (ratio && k === "h") next.w = Math.round(next.h * ratio);
      next.w = clamp(next.w, 1, W);
      next.h = clamp(next.h, 1, H);
      next.x = clamp(next.x, 0, W - next.w);
      next.y = clamp(next.y, 0, H - next.h);
      return next;
    });

  const doCrop = () =>
    image.produce(async () => {
      if (!image.img) return;
      const c = drawToCanvas(image.img, rect.w, rect.h, format, rect.x, rect.y, rect.w, rect.h);
      const blob = await canvasToBlob(c, format, quality);
      return { blob, width: rect.w, height: rect.h, filename: `${baseName(image.file)}-cropped.${extFor(format)}` };
    });

  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  const stage =
    image.url && W ? (
      <div className="flex items-center justify-center p-4 min-h-[360px] bg-muted/40">
        <div ref={stageRef} className="relative select-none touch-none max-w-full" style={{ aspectRatio: `${W} / ${H}`, maxHeight: "60vh", width: `min(100%, calc(60vh * ${W / H}))` }} onPointerMove={onMove} onPointerUp={() => (drag.current = null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
          {/* Dim outside the crop via a giant box-shadow */}
          <div
            className="absolute border border-white cursor-move"
            style={{ left: pct(rect.x, W), top: pct(rect.y, H), width: pct(rect.w, W), height: pct(rect.h, H), boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)" }}
            onPointerDown={(e) => startDrag(e, "move")}
          >
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className="border-white/30 border-r border-b last:border-0 [&:nth-child(3n)]:border-r-0 [&:nth-child(n+7)]:border-b-0" />
              ))}
            </div>
            {(["nw", "ne", "sw", "se"] as const).map((h) => (
              <span
                key={h}
                onPointerDown={(e) => startDrag(e, h)}
                className="absolute w-3.5 h-3.5 bg-white border border-stone-400 rounded-xs"
                style={{
                  left: h.includes("w") ? -7 : undefined,
                  right: h.includes("e") ? -7 : undefined,
                  top: h.includes("n") ? -7 : undefined,
                  bottom: h.includes("s") ? -7 : undefined,
                  cursor: h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <ToolLayout toolId="image-cropper">
      <ImageTool
        image={image}
        preview={image.result ? undefined : stage}
        options={
          <>
            <Field label="Aspect ratio">
              <Segmented
                size="sm"
                value={aspect}
                onChange={(a) => {
                  setAspect(a);
                  setRect(initialRect(W, H, ASPECTS.find((x) => x.value === a)?.r ?? null));
                  image.clearResult();
                }}
                options={ASPECTS.map((a) => ({ value: a.value, label: a.label }))}
              />
            </Field>
            <FieldGrid>
              {(["x", "y", "w", "h"] as const).map((k) => (
                <Field key={k} label={{ x: "X", y: "Y", w: "Width", h: "Height" }[k]} htmlFor={`c-${k}`}>
                  <Input id={`c-${k}`} type="number" min={0} value={rect[k]} onChange={(e) => { setField(k, Number(e.target.value) || 0); image.clearResult(); }} />
                </Field>
              ))}
            </FieldGrid>
            <FormatQuality format={format} onFormat={setFormat} quality={quality} onQuality={setQuality} />
            {image.result && (
              <button type="button" onClick={image.clearResult} className="text-xs text-primary hover:underline">
                ← Adjust crop
              </button>
            )}
          </>
        }
        action={{ label: `Crop to ${rect.w} × ${rect.h}`, busyLabel: "Cropping…", icon: <CropIcon />, onClick: doCrop, disabled: rect.w < 1 || rect.h < 1 }}
      />
    </ToolLayout>
  );
}
