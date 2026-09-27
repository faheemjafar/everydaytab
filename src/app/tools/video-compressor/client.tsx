"use client";

import { useState } from "react";
import { Minimize2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ChoiceGrid, FASTSTART, Field, MediaTool, Segmented, h264, stem, useMediaFile } from "@/components/tool";

const LEVELS = {
  light: { crf: 23, label: "Light", hint: "Near original" },
  balanced: { crf: 28, label: "Balanced", hint: "Recommended" },
  strong: { crf: 32, label: "Strong", hint: "Much smaller" },
  extreme: { crf: 36, label: "Extreme", hint: "Smallest" },
} as const;
type Level = keyof typeof LEVELS;

const RES = { original: 0, "1080": 1080, "720": 720, "480": 480 } as const;
type Res = keyof typeof RES;

export default function VideoCompressor() {
  const [level, setLevel] = useState<Level>("balanced");
  const [res, setRes] = useState<Res>("original");
  const [audio, setAudio] = useState<"keep" | "compress" | "remove">("compress");
  const media = useMediaFile("video");
  const h = media.info?.height ?? 0;

  const compress = () => {
    if (!media.file) return;
    const target = RES[res];
    // Only ever scale down; -2 keeps aspect ratio and an even width.
    const vf = target && h > target ? `scale=-2:${target}` : "scale=trunc(iw/2)*2:trunc(ih/2)*2";
    const a = audio === "remove" ? ["-an"] : audio === "keep" ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "96k"];
    media.run({
      args: (input) => ["-i", input, "-vf", vf, ...h264(LEVELS[level].crf, "veryfast"), ...a, ...FASTSTART, "compressed.mp4"],
      output: "compressed.mp4",
      mime: "video/mp4",
      filename: `${stem(media.file)}-compressed.mp4`,
    });
  };

  return (
    <ToolLayout toolId="video-compressor">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Compression">
              <ChoiceGrid cols={2} value={level} onChange={setLevel} options={(Object.keys(LEVELS) as Level[]).map((k) => ({ value: k, label: LEVELS[k].label, hint: LEVELS[k].hint }))} />
            </Field>
            <Field label="Max resolution">
              <Segmented
                size="sm"
                value={res}
                onChange={setRes}
                options={(Object.keys(RES) as Res[]).map((k) => ({ value: k, label: k === "original" ? "Original" : `${k}p` }))}
              />
            </Field>
            <Field label="Audio">
              <Segmented
                size="sm"
                value={audio}
                onChange={setAudio}
                options={[
                  { value: "compress", label: "96 kbps" },
                  { value: "keep", label: "Keep" },
                  { value: "remove", label: "Remove" },
                ]}
              />
            </Field>
            <p className="text-[11px] text-muted-foreground">Outputs H.264 MP4. Lowering resolution saves the most; long videos can take a few minutes in the browser.</p>
          </>
        }
        action={{ label: "Compress video", busyLabel: "Compressing", icon: <Minimize2 />, onClick: compress }}
      />
    </ToolLayout>
  );
}
