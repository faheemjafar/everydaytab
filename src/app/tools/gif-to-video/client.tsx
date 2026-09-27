"use client";

import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { FASTSTART, Field, MediaTool, Segmented, stem, useMediaFile } from "@/components/tool";

type Format = "mp4" | "webm";
const CRF = { high: 18, medium: 23, low: 30 } as const;
type Quality = keyof typeof CRF;

export default function GifToVideo() {
  const [format, setFormat] = useState<Format>("mp4");
  const [quality, setQuality] = useState<Quality>("medium");
  const media = useMediaFile("video");

  const convert = () => {
    if (!media.file) return;
    const out = `output.${format}`;
    // GIFs often have odd dimensions and RGB pixels; H.264 needs even sizes and yuv420p to play in most players.
    const vf = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
    media.run({
      args: (input) =>
        format === "mp4"
          ? ["-i", input, "-vf", vf, "-c:v", "libx264", "-preset", "ultrafast", "-crf", String(CRF[quality]), "-pix_fmt", "yuv420p", ...FASTSTART, "-an", out]
          : // VP8: libvpx-vp9 crashes in the FFmpeg.wasm 0.12 build.
            ["-i", input, "-vf", vf, "-c:v", "libvpx", "-crf", String(Math.round(CRF[quality] * 0.8) + 4), "-b:v", "2M", "-deadline", "realtime", "-cpu-used", "8", "-pix_fmt", "yuv420p", "-an", out],
      output: out,
      mime: `video/${format}`,
      filename: `${stem(media.file)}.${format}`,
    });
  };

  return (
    <ToolLayout toolId="gif-to-video">
      <MediaTool
        media={media}
        accept="image/gif"
        dropHint="Animated GIF — usually 5–10× smaller as a video."
        preview={
          media.url ? (
            <div className="flex items-center justify-center p-4 bg-dots min-h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.url} alt="GIF" className="max-h-[50vh] max-w-full" />
            </div>
          ) : undefined
        }
        options={
          <>
            <Field label="Format">
              <Segmented
                value={format}
                onChange={setFormat}
                options={[
                  { value: "mp4", label: "MP4 (H.264)" },
                  { value: "webm", label: "WebM (VP8)" },
                ]}
              />
            </Field>
            <Field label="Quality">
              <Segmented
                size="sm"
                value={quality}
                onChange={setQuality}
                options={[
                  { value: "high", label: "High" },
                  { value: "medium", label: "Balanced" },
                  { value: "low", label: "Small" },
                ]}
              />
            </Field>
          </>
        }
        action={{ label: `Convert to ${format.toUpperCase()}`, busyLabel: "Converting", icon: <Clapperboard />, onClick: convert }}
      />
    </ToolLayout>
  );
}
