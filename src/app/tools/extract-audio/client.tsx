"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, MediaTool, Segmented, stem, useMediaFile } from "@/components/tool";

const FORMATS = {
  mp3: { mime: "audio/mpeg", codec: (q: Quality) => ["-c:a", "libmp3lame", "-b:a", { high: "320k", medium: "192k", low: "128k" }[q]] },
  m4a: { mime: "audio/mp4", codec: (q: Quality) => ["-c:a", "aac", "-b:a", { high: "256k", medium: "160k", low: "96k" }[q]] },
  wav: { mime: "audio/wav", codec: () => ["-c:a", "pcm_s16le"] },
  flac: { mime: "audio/flac", codec: () => ["-c:a", "flac"] },
  ogg: { mime: "audio/ogg", codec: (q: Quality) => ["-c:a", "libvorbis", "-q:a", { high: "8", medium: "5", low: "3" }[q]] },
} as const;
type Format = keyof typeof FORMATS;
type Quality = "high" | "medium" | "low";

export default function ExtractAudio() {
  const [format, setFormat] = useState<Format>("mp3");
  const [quality, setQuality] = useState<Quality>("medium");
  const media = useMediaFile("video");
  const lossless = format === "wav" || format === "flac";

  const extract = () => {
    if (!media.file) return;
    const out = `audio.${format}`;
    media.run({
      args: (input) => ["-i", input, "-vn", "-map", "0:a:0", ...FORMATS[format].codec(quality), out],
      output: out,
      mime: FORMATS[format].mime,
      filename: `${stem(media.file)}.${format}`,
    });
  };

  return (
    <ToolLayout toolId="extract-audio">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Audio format">
              <Segmented value={format} onChange={(f) => { setFormat(f); media.clearResult(); }} options={(Object.keys(FORMATS) as Format[]).map((k) => ({ value: k, label: k.toUpperCase() }))} />
            </Field>
            {!lossless && (
              <Field label="Quality">
                <Segmented
                  size="sm"
                  value={quality}
                  onChange={setQuality}
                  options={[
                    { value: "high", label: "High" },
                    { value: "medium", label: "Standard" },
                    { value: "low", label: "Small" },
                  ]}
                />
              </Field>
            )}
            <p className="text-[11px] text-muted-foreground">{lossless ? "Lossless — larger files, perfect for editing." : "Compressed — ideal for listening and sharing."}</p>
          </>
        }
        action={{ label: `Extract ${format.toUpperCase()}`, busyLabel: "Extracting", icon: <Music />, onClick: extract }}
      />
    </ToolLayout>
  );
}
