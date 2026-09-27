"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, Field, MediaTool, Segmented, SliderField, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

const CURVES = [
  { value: "tri", label: "Linear" },
  { value: "qsin", label: "Smooth" },
  { value: "exp", label: "Exponential" },
  { value: "log", label: "Logarithmic" },
] as const;
type Curve = (typeof CURVES)[number]["value"];

export default function FadeInOut() {
  const [fadeIn, setFadeIn] = useState(2);
  const [fadeOut, setFadeOut] = useState(3);
  const [curve, setCurve] = useState<Curve>("qsin");
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const media = useMediaFile("audio", (_, f) => setFormat(audioFormatFor(f)));
  const dur = media.info?.duration ?? NaN;
  const known = Number.isFinite(dur);
  const max = known ? Math.max(0.5, Math.min(30, dur / 2)) : 30;

  const apply = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, "faded");
    // With a known duration, fade-out starts at (duration − length); otherwise
    // reverse → fade in → reverse (slower, uses more memory).
    const inF = fadeIn > 0 ? `afade=t=in:st=0:d=${fadeIn}:curve=${curve}` : "";
    const outF = fadeOut > 0 ? (known ? `afade=t=out:st=${(dur - fadeOut).toFixed(3)}:d=${fadeOut}:curve=${curve}` : `areverse,afade=t=in:st=0:d=${fadeOut}:curve=${curve},areverse`) : "";
    const af = [inF, outF].filter(Boolean).join(",");
    media.run({ args: (input) => ["-i", input, "-vn", "-af", af, ...o.codec, o.output], output: o.output, mime: o.mime, filename: o.filename });
  };

  return (
    <ToolLayout toolId="fade-in-out">
      <MediaTool
        media={media}
        range={known ? { start: fadeIn, end: dur - fadeOut } : undefined}
        options={
          <>
            <SliderField label="Fade in" value={fadeIn} onChange={setFadeIn} min={0} max={max} step={0.1} format={(v) => (v ? `${v.toFixed(1)}s` : "off")} />
            <SliderField label="Fade out" value={fadeOut} onChange={setFadeOut} min={0} max={max} step={0.1} format={(v) => (v ? `${v.toFixed(1)}s` : "off")} />
            <Field label="Curve">
              <Segmented size="sm" value={curve} onChange={setCurve} options={CURVES.map((c) => ({ value: c.value, label: c.label }))} />
            </Field>
            <AudioFormatField value={format} onChange={setFormat} />
            <p className="text-[11px] text-muted-foreground">The highlighted part of the waveform plays at full volume.</p>
          </>
        }
        action={{ label: "Apply fades", busyLabel: "Processing", icon: <TrendingUp />, onClick: apply, disabled: !fadeIn && !fadeOut }}
      />
    </ToolLayout>
  );
}
