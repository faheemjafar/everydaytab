"use client";

import { useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AudioFormatField, Field, MediaTool, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

const BANDS = [
  { freq: 60, label: "60" },
  { freq: 150, label: "150" },
  { freq: 400, label: "400" },
  { freq: 1000, label: "1k" },
  { freq: 2400, label: "2.4k" },
  { freq: 6000, label: "6k" },
  { freq: 12000, label: "12k" },
  { freq: 16000, label: "16k" },
];

const PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0],
  "Bass boost": [6, 4, 1, 0, 0, 0, 0, 0],
  "Vocal clarity": [-3, -1, 0, 2, 4, 3, 1, 0],
  Podcast: [-6, -2, 0, 1, 3, 2, 0, -2],
  Bright: [0, 0, 0, 0, 1, 3, 4, 5],
  Warm: [3, 2, 1, 0, -1, -2, -2, -3],
  "Reduce hiss": [0, 0, 0, 0, 0, -2, -6, -9],
};

export default function AudioEqualizer() {
  const [gains, setGains] = useState<number[]>(PRESETS.Flat);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const media = useMediaFile("audio", (_, f) => setFormat(audioFormatFor(f)));
  const active = gains.some((g) => g !== 0);

  const apply = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, "eq");
    // Peaking filters, one octave wide; a limiter guards against boosts clipping.
    const af = BANDS.map((b, i) => (gains[i] ? `equalizer=f=${b.freq}:t=o:w=1:g=${gains[i]}` : null)).filter(Boolean).join(",") + (gains.some((g) => g > 0) ? ",alimiter=limit=0.97:level=disabled" : "");
    media.run({ args: (input) => ["-i", input, "-vn", "-af", af, ...o.codec, o.output], output: o.output, mime: o.mime, filename: o.filename });
  };

  return (
    <ToolLayout toolId="audio-equalizer">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Presets">
              <div className="flex flex-wrap gap-1">
                {Object.entries(PRESETS).map(([name, g]) => (
                  <button key={name} type="button" onClick={() => setGains(g)} className={"h-6 px-2 rounded-sm border text-[11px] " + (g.every((v, i) => v === gains[i]) ? "border-primary bg-accent" : "border-border text-muted-foreground hover:text-foreground")}>
                    {name}
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex items-end justify-between gap-1 h-48 pt-2">
              {BANDS.map((b, i) => (
                <div key={b.freq} className="flex flex-col items-center gap-1.5 h-full flex-1">
                  <span className="text-[10px] tabular-nums text-muted-foreground">{gains[i] > 0 ? "+" : ""}{gains[i]}</span>
                  <Slider orientation="vertical" min={-12} max={12} step={1} value={[gains[i]]} onValueChange={([v]) => setGains((g) => g.map((x, j) => (j === i ? v : x)))} className="flex-1 min-h-0" aria-label={`${b.label} Hz`} />
                  <span className="text-[10px] text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setGains(PRESETS.Flat)} disabled={!active}>
              <RotateCcw /> Reset
            </Button>
            <AudioFormatField value={format} onChange={setFormat} />
          </>
        }
        action={{ label: "Apply EQ", busyLabel: "Processing", icon: <SlidersHorizontal />, onClick: apply, disabled: !active }}
      />
    </ToolLayout>
  );
}
