"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { FormatQuality, ImageTool, baseName, canvasToBlob, drawToCanvas, extFor, useImageFile, type ImageMime } from "@/components/tool";

export default function ImageConverter() {
  const [format, setFormat] = useState<ImageMime>("image/webp");
  const [quality, setQuality] = useState(0.9);
  const image = useImageFile();

  const convert = () =>
    image.produce(async () => {
      if (!image.img) return;
      const { naturalWidth: w, naturalHeight: h } = image.img;
      const blob = await canvasToBlob(drawToCanvas(image.img, w, h, format), format, quality);
      return { blob, width: w, height: h, filename: `${baseName(image.file)}.${extFor(format)}` };
    });

  return (
    <ToolLayout toolId="image-converter">
      <ImageTool
        image={image}
        options={
          <>
            <FormatQuality format={format} onFormat={(f) => { setFormat(f); image.clearResult(); }} quality={quality} onQuality={setQuality} />
            {format === "image/jpeg" && <p className="text-[11px] text-muted-foreground">JPEG has no transparency — transparent areas become white.</p>}
          </>
        }
        action={{ label: `Convert to ${extFor(format).toUpperCase()}`, busyLabel: "Converting…", icon: <ArrowRightLeft />, onClick: convert }}
      />
    </ToolLayout>
  );
}
