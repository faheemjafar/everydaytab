"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AUDIO_FORMATS, AudioFormatField, Field, MediaTool, Segmented, stem, useMediaFile, type AudioFormat } from "@/components/tool";

const BITRATES = ["96", "128", "192", "256", "320"] as const;
type Bitrate = (typeof BITRATES)[number];

export default function AudioConverter() {
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [bitrate, setBitrate] = useState<Bitrate>("192");
  const [rate, setRate] = useState<"keep" | "44100" | "48000">("keep");
  const media = useMediaFile("audio");
  const f = AUDIO_FORMATS[format];

  const convert = () => {
    if (!media.file) return;
    const out = `out.${format}`;
    media.run({
      args: (input) => ["-i", input, "-vn", ...f.args(Number(bitrate)), ...(rate === "keep" ? [] : ["-ar", rate]), out],
      output: out,
      mime: f.mime,
      filename: `${stem(media.file)}.${format}`,
    });
  };

  return (
    <ToolLayout toolId="audio-converter">
      <MediaTool
        media={media}
        accept="audio/*,video/*"
        dropHint="Any audio file — or a video, to pull out its soundtrack."
        options={
          <>
            <AudioFormatField value={format} onChange={(v) => { setFormat(v); media.clearResult(); }} label="Convert to" />
            {!f.lossless && (
              <Field label="Bitrate">
                <Segmented size="sm" value={bitrate} onChange={setBitrate} options={BITRATES.map((b) => ({ value: b, label: `${b}k` }))} />
              </Field>
            )}
            <Field label="Sample rate">
              <Segmented
                size="sm"
                value={rate}
                onChange={setRate}
                options={[
                  { value: "keep", label: "Keep" },
                  { value: "44100", label: "44.1 kHz" },
                  { value: "48000", label: "48 kHz" },
                ]}
              />
            </Field>
            <p className="text-[11px] text-muted-foreground">
              {f.lossless ? "Lossless: exact copy of the decoded audio, large files." : "Converting between lossy formats loses a little quality each time — start from the best source you have."}
            </p>
          </>
        }
        action={{ label: `Convert to ${f.label}`, busyLabel: "Converting", icon: <ArrowRightLeft />, onClick: convert }}
      />
    </ToolLayout>
  );
}
