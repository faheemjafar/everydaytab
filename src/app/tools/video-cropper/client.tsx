"use client";

import { useState } from "react";
import { Crop } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CropBox, FASTSTART, Field, FieldGrid, MediaTool, Segmented, fitCrop, h264, initialCrop, stem, useMediaFile, type CropRect } from "@/components/tool";

const ASPECTS: { value: string; label: string; r: number | null }[] = [
  { value: "free", label: "Free", r: null },
  { value: "16:9", label: "16:9", r: 16 / 9 },
  { value: "9:16", label: "9:16", r: 9 / 16 },
  { value: "1:1", label: "1:1", r: 1 },
  { value: "4:5", label: "4:5", r: 4 / 5 },
  { value: "4:3", label: "4:3", r: 4 / 3 },
];

export default function VideoCropper() {
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState("free");
  const media = useMediaFile("video", (info) => info.width && setRect(fitCrop(initialCrop(info.width, info.height, null), info.width, info.height, null, undefined, true)));
  const W = media.info?.width ?? 0;
  const H = media.info?.height ?? 0;
  const ratio = ASPECTS.find((a) => a.value === aspect)?.r ?? null;

  // H.264 needs even dimensions.
  const safe = W ? fitCrop(rect, W, H, null, undefined, true) : rect;

  const crop = () => {
    if (!media.file || !W) return;
    media.run({
      args: (input) => ["-i", input, "-vf", `crop=${safe.w}:${safe.h}:${safe.x}:${safe.y}`, ...h264(20), "-c:a", "copy", ...FASTSTART, "cropped.mp4"],
      output: "cropped.mp4",
      mime: "video/mp4",
      filename: `${stem(media.file)}-cropped.mp4`,
    });
  };

  return (
    <ToolLayout toolId="video-cropper">
      <MediaTool
        media={media}
        preview={
          media.url && W ? (
            <CropBox width={W} height={H} rect={rect} onChange={setRect} ratio={ratio} maxHeight="55vh">
              <video src={media.url} muted playsInline loop autoPlay />
            </CropBox>
          ) : undefined
        }
        options={
          <>
            <Field label="Aspect ratio">
              <Segmented
                size="sm"
                value={aspect}
                onChange={(a) => {
                  setAspect(a);
                  setRect(fitCrop(initialCrop(W, H, ASPECTS.find((x) => x.value === a)?.r ?? null), W, H, null, undefined, true));
                }}
                options={ASPECTS.map((a) => ({ value: a.value, label: a.label }))}
              />
            </Field>
            <FieldGrid>
              {(["x", "y", "w", "h"] as const).map((k) => (
                <Field key={k} label={{ x: "X", y: "Y", w: "Width", h: "Height" }[k]} htmlFor={`v-${k}`}>
                  <Input id={`v-${k}`} type="number" min={0} value={rect[k]} onChange={(e) => setRect(fitCrop({ ...rect, [k]: Number(e.target.value) || 0 }, W, H, ratio, k))} />
                </Field>
              ))}
            </FieldGrid>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              Output {safe.w} × {safe.h} (rounded to even pixels). Drag the box on the video or type exact values.
            </p>
          </>
        }
        action={{ label: "Crop video", busyLabel: "Cropping", icon: <Crop />, onClick: crop, disabled: !W || safe.w < 2 || safe.h < 2 }}
      />
    </ToolLayout>
  );
}
