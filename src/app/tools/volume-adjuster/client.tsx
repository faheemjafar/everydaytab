"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Switch } from "@/components/ui/switch";
import { AudioFormatField, Field, MediaTool, SliderField, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

const PRESETS = [-12, -6, -3, 3, 6, 12];

export default function VolumeAdjuster() {
  const [db, setDb] = useState(6);
  const [limit, setLimit] = useState(true);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const media = useMediaFile("audio", (_, f) => setFormat(audioFormatFor(f)));

  const apply = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, `${db > 0 ? "+" : ""}${db}dB`);
    // A limiter after boosting prevents clipping distortion.
    const af = `volume=${db}dB${limit && db > 0 ? ",alimiter=limit=0.97:level=disabled" : ""}`;
    media.run({ args: (input) => ["-i", input, "-vn", "-af", af, ...o.codec, o.output], output: o.output, mime: o.mime, filename: o.filename });
  };

  return (
    <ToolLayout toolId="volume-adjuster">
      <MediaTool
        media={media}
        options={
          <>
            <SliderField label="Change" value={db} onChange={setDb} min={-30} max={20} step={0.5} format={(v) => `${v > 0 ? "+" : ""}${v} dB (×${Math.pow(10, v / 20).toFixed(2)})`} />
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => setDb(p)} className={"h-6 px-2 rounded-sm border text-[11px] tabular-nums " + (db === p ? "border-primary bg-accent" : "border-border text-muted-foreground hover:text-foreground")}>
                  {p > 0 ? "+" : ""}
                  {p} dB
                </button>
              ))}
            </div>
            <Field label="Prevent clipping" hint="Adds a limiter when boosting." inline>
              <Switch checked={limit} onCheckedChange={setLimit} />
            </Field>
            <AudioFormatField value={format} onChange={setFormat} />
            <p className="text-[11px] text-muted-foreground">+6 dB ≈ twice as loud to the ear; −6 dB ≈ half. For consistent loudness across files, use the Loudness Normalizer.</p>
          </>
        }
        action={{ label: "Apply volume", busyLabel: "Processing", icon: <Volume2 />, onClick: apply, disabled: db === 0 }}
      />
    </ToolLayout>
  );
}
