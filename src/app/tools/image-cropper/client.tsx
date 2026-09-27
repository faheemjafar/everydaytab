"use client";

import { useState } from "react";
import { Crop as CropIcon } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import {
  CropBox,
  Field,
  FieldGrid,
  FormatQuality,
  ImageTool,
  Segmented,
  baseName,
  canvasToBlob,
  drawToCanvas,
  extFor,
  fitCrop,
  initialCrop,
  useImageFile,
  type CropRect,
  type ImageMime,
} from "@/components/tool";

const ASPECTS: { value: string; label: string; r: number | null }[] = [
  { value: "free", label: "Free", r: null },
  { value: "1:1", label: "1:1", r: 1 },
  { value: "4:3", label: "4:3", r: 4 / 3 },
  { value: "3:2", label: "3:2", r: 3 / 2 },
  { value: "16:9", label: "16:9", r: 16 / 9 },
  { value: "9:16", label: "9:16", r: 9 / 16 },
];

export default function ImageCropper() {
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState("free");
  const [format, setFormat] = useState<ImageMime>("image/png");
  const [quality, setQuality] = useState(0.92);

  const image = useImageFile((img) => setRect(initialCrop(img.naturalWidth, img.naturalHeight, null)));
  const { width: W, height: H } = image;
  const ratio = ASPECTS.find((a) => a.value === aspect)?.r ?? null;

  const doCrop = () =>
    image.produce(async () => {
      if (!image.img) return;
      const blob = await canvasToBlob(drawToCanvas(image.img, rect.w, rect.h, format, rect.x, rect.y, rect.w, rect.h), format, quality);
      return { blob, width: rect.w, height: rect.h, filename: `${baseName(image.file)}-cropped.${extFor(format)}` };
    });

  return (
    <ToolLayout toolId="image-cropper">
      <ImageTool
        image={image}
        preview={
          image.result || !image.url || !W ? undefined : (
            <CropBox width={W} height={H} rect={rect} onChange={setRect} ratio={ratio}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" draggable={false} />
            </CropBox>
          )
        }
        options={
          <>
            <Field label="Aspect ratio">
              <Segmented
                size="sm"
                value={aspect}
                onChange={(a) => {
                  setAspect(a);
                  setRect(initialCrop(W, H, ASPECTS.find((x) => x.value === a)?.r ?? null));
                  image.clearResult();
                }}
                options={ASPECTS.map((a) => ({ value: a.value, label: a.label }))}
              />
            </Field>
            <FieldGrid>
              {(["x", "y", "w", "h"] as const).map((k) => (
                <Field key={k} label={{ x: "X", y: "Y", w: "Width", h: "Height" }[k]} htmlFor={`c-${k}`}>
                  <Input id={`c-${k}`} type="number" min={0} value={rect[k]} onChange={(e) => { setRect(fitCrop({ ...rect, [k]: Number(e.target.value) || 0 }, W, H, ratio, k)); image.clearResult(); }} />
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
