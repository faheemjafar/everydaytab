"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, Field, MediaTool, Segmented, SliderField, audioFormatFor, audioOutput, formatDuration, useMediaFile, type AudioFormat } from "@/components/tool";

const PRESETS = [0.5, 0.75, 0.9, 1.1, 1.25, 1.5, 2];

/** atempo accepts 0.5–2 per instance; chain for other factors. */
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

export default function SpeedChanger() {
  const [speed, setSpeed] = useState(1.25);
  const [pitch, setPitch] = useState<"keep" | "shift">("keep");
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const media = useMediaFile("audio", (_, f) => setFormat(audioFormatFor(f)));
  const dur = media.info?.duration ?? NaN;

  const apply = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, `${speed}x`);
    // "shift": resample like a tape/vinyl speed change (pitch moves with speed).
    const af = pitch === "keep" ? atempoChain(speed) : `aresample=44100,asetrate=${Math.round(44100 * speed)},aresample=44100`;
    media.run({ args: (input) => ["-i", input, "-vn", "-af", af, ...o.codec, o.output], output: o.output, mime: o.mime, filename: o.filename });
  };

  const semis = 12 * Math.log2(speed);

  return (
    <ToolLayout toolId="speed-changer">
      <MediaTool
        media={media}
        options={
          <>
            <SliderField label="Speed" value={speed} onChange={setSpeed} min={0.25} max={4} step={0.05} format={(v) => `${v.toFixed(2)}×`} />
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => setSpeed(p)} className={"h-6 px-2 rounded-sm border text-[11px] " + (speed === p ? "border-primary bg-accent" : "border-border text-muted-foreground hover:text-foreground")}>
                  {p}×
                </button>
              ))}
            </div>
            <Field label="Pitch" hint={pitch === "keep" ? "Time-stretch: voices sound natural." : `Tape-style: pitch moves ${semis >= 0 ? "up" : "down"} ${Math.abs(semis).toFixed(1)} semitones.`}>
              <Segmented
                value={pitch}
                onChange={setPitch}
                options={[
                  { value: "keep", label: "Keep pitch" },
                  { value: "shift", label: "Change pitch" },
                ]}
              />
            </Field>
            <AudioFormatField value={format} onChange={setFormat} />
            {Number.isFinite(dur) && (
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatDuration(dur)} → <span className="text-foreground font-medium">{formatDuration(dur / speed)}</span>
              </p>
            )}
          </>
        }
        action={{ label: `Apply ${speed.toFixed(2)}×`, busyLabel: "Processing", icon: <Gauge />, onClick: apply, disabled: speed === 1 }}
      />
    </ToolLayout>
  );
}
