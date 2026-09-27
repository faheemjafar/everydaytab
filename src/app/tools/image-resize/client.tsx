"use client";

import { useState } from "react";
import { Link2, Link2Off, Maximize2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormatQuality, ImageTool, Segmented, baseName, canvasToBlob, drawToCanvas, extFor, useImageFile, type ImageMime } from "@/components/tool";

type Mode = "pixels" | "percent";

export default function ImageResize() {
  const [mode, setMode] = useState<Mode>("pixels");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [percent, setPercent] = useState("50");
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState<ImageMime>("image/png");
  const [quality, setQuality] = useState(0.9);

  const image = useImageFile((img, file) => {
    setWidth(String(img.naturalWidth));
    setHeight(String(img.naturalHeight));
    // Keep the source format when it's one we can encode.
    if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) setFormat(file.type as ImageMime);
  });
  const { width: ow, height: oh } = image;
  const ratio = ow && oh ? oh / ow : 1;

  const onWidth = (v: string) => {
    setWidth(v);
    const n = parseInt(v, 10);
    if (lock && !isNaN(n)) setHeight(String(Math.max(1, Math.round(n * ratio))));
  };
  const onHeight = (v: string) => {
    setHeight(v);
    const n = parseInt(v, 10);
    if (lock && !isNaN(n)) setWidth(String(Math.max(1, Math.round(n / ratio))));
  };

  const target =
    mode === "percent"
      ? { w: Math.round((ow * (Number(percent) || 0)) / 100), h: Math.round((oh * (Number(percent) || 0)) / 100) }
      : { w: parseInt(width, 10) || 0, h: parseInt(height, 10) || 0 };
  const valid = target.w > 0 && target.h > 0 && target.w <= 16384 && target.h <= 16384;

  const resize = () =>
    image.produce(async () => {
      // Always resize from the original, never from a previous result.
      if (!image.img || !valid) return;
      const blob = await canvasToBlob(drawToCanvas(image.img, target.w, target.h, format), format, quality);
      return { blob, width: target.w, height: target.h, filename: `${baseName(image.file)}-${target.w}x${target.h}.${extFor(format)}` };
    });

  return (
    <ToolLayout toolId="image-resize">
      <ImageTool
        image={image}
        options={
          <>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "pixels", label: "Pixels" },
                { value: "percent", label: "Percentage" },
              ]}
            />
            {mode === "pixels" ? (
              <>
                <div className="flex items-end gap-1.5">
                  <Field label="Width" htmlFor="w" className="flex-1">
                    <Input id="w" type="number" min={1} value={width} onChange={(e) => onWidth(e.target.value)} />
                  </Field>
                  <Button variant={lock ? "soft" : "ghost"} size="icon" onClick={() => setLock(!lock)} aria-pressed={lock} aria-label={lock ? "Unlock aspect ratio" : "Lock aspect ratio"} title="Lock aspect ratio">
                    {lock ? <Link2 /> : <Link2Off />}
                  </Button>
                  <Field label="Height" htmlFor="h" className="flex-1">
                    <Input id="h" type="number" min={1} value={height} onChange={(e) => onHeight(e.target.value)} />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[3840, 1920, 1280, 800, 400].filter((w) => w < ow).map((w) => (
                    <button key={w} type="button" onClick={() => onWidth(String(w))} className="h-6 px-2 rounded-sm border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted">
                      {w}w
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <Field label="Scale">
                <div className="flex items-center gap-1.5">
                  <Input type="number" min={1} max={400} value={percent} onChange={(e) => setPercent(e.target.value)} className="w-20" />
                  <span className="text-xs text-muted-foreground">%</span>
                  {[25, 50, 75, 200].map((p) => (
                    <button key={p} type="button" onClick={() => setPercent(String(p))} className="h-6 px-2 rounded-sm border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted">
                      {p}%
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {ow} × {oh} → <span className="text-foreground font-medium">{target.w} × {target.h}</span>
            </p>
            <FormatQuality format={format} onFormat={setFormat} quality={quality} onQuality={setQuality} />
          </>
        }
        action={{ label: "Resize", busyLabel: "Resizing…", icon: <Maximize2 />, onClick: resize, disabled: !valid }}
      />
    </ToolLayout>
  );
}
