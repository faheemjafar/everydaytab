"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { EVEN_DIMS, Field, MediaTool, Segmented, VIDEO_CONTAINERS, stem, useMediaFile, type VideoContainer } from "@/components/tool";

const QUALITY = { high: 20, medium: 24, low: 30 } as const;
type Quality = keyof typeof QUALITY;

export default function VideoConverter() {
  const [format, setFormat] = useState<VideoContainer>("mp4");
  const [quality, setQuality] = useState<Quality>("medium");
  const media = useMediaFile("video");

  const convert = () => {
    if (!media.file) return;
    const c = VIDEO_CONTAINERS[format];
    const out = `output.${format}`;
    media.run({
      args: (input) => ["-i", input, "-vf", EVEN_DIMS, ...c.v(QUALITY[quality]), ...c.a, ...c.extra, out],
      output: out,
      mime: c.mime,
      filename: `${stem(media.file)}.${format}`,
    });
  };

  return (
    <ToolLayout toolId="video-converter">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Convert to">
              <Segmented value={format} onChange={(f) => { setFormat(f); media.clearResult(); }} options={(Object.keys(VIDEO_CONTAINERS) as VideoContainer[]).map((k) => ({ value: k, label: k.toUpperCase() }))} />
            </Field>
            <Field label="Quality">
              <Segmented
                value={quality}
                onChange={setQuality}
                options={[
                  { value: "high", label: "High" },
                  { value: "medium", label: "Balanced" },
                  { value: "low", label: "Small file" },
                ]}
              />
            </Field>
            <p className="text-[11px] text-muted-foreground">
              {format === "webm" ? "WebM uses VP8 + Vorbis — great for the web, slower to encode." : "H.264 + AAC — plays everywhere, including iPhone and Windows."}
            </p>
          </>
        }
        action={{ label: `Convert to ${format.toUpperCase()}`, busyLabel: "Converting", icon: <ArrowRightLeft />, onClick: convert }}
      />
    </ToolLayout>
  );
}
