"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { FASTSTART, Field, MediaTool, Segmented, SliderField, formatDuration, h264, stem, useMediaFile } from "@/components/tool";

const PRESETS = [0.25, 0.5, 0.75, 1.25, 1.5, 2, 3, 4];

/** atempo only accepts 0.5–2 per instance, so chain them for other factors. */
function atempoChain(speed: number) {
  const f: string[] = [];
  let s = speed;
  while (s > 2) {
    f.push("atempo=2");
    s /= 2;
  }
  while (s < 0.5) {
    f.push("atempo=0.5");
    s /= 0.5;
  }
  f.push(`atempo=${s.toFixed(4)}`);
  return f.join(",");
}

export default function VideoSpeedChanger() {
  const [speed, setSpeed] = useState(2);
  const [audio, setAudio] = useState<"pitch" | "mute">("pitch");
  const media = useMediaFile("video");
  const dur = media.info?.duration ?? NaN;

  const apply = () => {
    if (!media.file) return;
    media.run({
      args: (input) => [
        "-i", input,
        "-vf", `setpts=PTS/${speed},scale=trunc(iw/2)*2:trunc(ih/2)*2`,
        ...(audio === "mute" ? ["-an"] : ["-af", atempoChain(speed), "-c:a", "aac", "-b:a", "160k"]),
        ...h264(22), ...FASTSTART, "output.mp4",
      ],
      output: "output.mp4",
      mime: "video/mp4",
      filename: `${stem(media.file)}-${speed}x.mp4`,
    });
  };

  return (
    <ToolLayout toolId="video-speed-changer">
      <MediaTool
        media={media}
        options={
          <>
            <SliderField label="Speed" value={speed} onChange={setSpeed} min={0.25} max={4} step={0.05} format={(v) => `${v}×`} />
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => setSpeed(p)} className={"h-6 px-2 rounded-sm border text-[11px] " + (speed === p ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                  {p}×
                </button>
              ))}
            </div>
            <Field label="Audio">
              <Segmented
                size="sm"
                value={audio}
                onChange={setAudio}
                options={[
                  { value: "pitch", label: "Keep, natural pitch" },
                  { value: "mute", label: "Remove" },
                ]}
              />
            </Field>
            {Number.isFinite(dur) && (
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatDuration(dur)} → <span className="text-foreground font-medium">{formatDuration(dur / speed)}</span>
              </p>
            )}
          </>
        }
        action={{ label: `Change to ${speed}×`, busyLabel: "Processing", icon: <Gauge />, onClick: apply, disabled: speed === 1 }}
      />
    </ToolLayout>
  );
}
