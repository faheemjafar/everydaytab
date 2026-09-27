"use client";

import { useState } from "react";
import { AudioLines } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, MediaTool, Segmented, formatBytes, stem, useMediaFile } from "@/components/tool";

const RATES = ["8000", "16000", "22050", "32000", "44100", "48000", "88200", "96000"] as const;
type Rate = (typeof RATES)[number];
const DEPTHS = {
  s16: { label: "16-bit", hint: "CD", pcm: "pcm_s16le", flac: "s16", bytes: 2 },
  s24: { label: "24-bit", hint: "Studio", pcm: "pcm_s24le", flac: "s32", bytes: 3 },
  f32: { label: "32-bit float", hint: "Editing headroom", pcm: "pcm_f32le", flac: null, bytes: 4 },
} as const;
type Depth = keyof typeof DEPTHS;

export default function AudioResampler() {
  const [rate, setRate] = useState<Rate>("48000");
  const [depth, setDepth] = useState<Depth>("s16");
  const [container, setContainer] = useState<"wav" | "flac">("wav");
  const [channels, setChannels] = useState<"keep" | "1" | "2">("keep");
  const media = useMediaFile("audio");
  const d = DEPTHS[depth];
  const fmt = container === "flac" && d.flac ? "flac" : "wav";
  const dur = media.info?.duration ?? NaN;

  const resample = () => {
    if (!media.file) return;
    const out = `out.${fmt}`;
    // High-quality swr settings (soxr isn't compiled into FFmpeg.wasm).
    const codec = fmt === "flac" ? ["-c:a", "flac", "-sample_fmt", d.flac!, ...(depth === "s24" ? ["-bits_per_raw_sample", "24"] : [])] : ["-c:a", d.pcm];
    media.run({
      args: (input) => ["-i", input, "-vn", "-af", `aresample=${rate}:filter_size=64:phase_shift=12:cutoff=0.97`, ...(channels === "keep" ? [] : ["-ac", channels]), ...codec, out],
      output: out,
      mime: fmt === "flac" ? "audio/flac" : "audio/wav",
      filename: `${stem(media.file)}-${Number(rate) / 1000}k-${d.label.split("-")[0]}bit.${fmt}`,
    });
  };

  return (
    <ToolLayout toolId="audio-resampler">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Sample rate">
              <Segmented size="sm" value={rate} onChange={setRate} options={RATES.map((r) => ({ value: r, label: `${Number(r) / 1000}k` }))} className="flex-wrap" />
            </Field>
            <Field label="Bit depth">
              <Segmented size="sm" value={depth} onChange={setDepth} options={(Object.keys(DEPTHS) as Depth[]).map((k) => ({ value: k, label: DEPTHS[k].label }))} />
            </Field>
            <Field label="Container" hint={depth === "f32" ? "FLAC doesn't support float — WAV will be used." : "FLAC is lossless and about half the size of WAV."}>
              <Segmented
                size="sm"
                value={container}
                onChange={setContainer}
                options={[
                  { value: "wav", label: "WAV" },
                  { value: "flac", label: "FLAC" },
                ]}
              />
            </Field>
            <Field label="Channels">
              <Segmented
                size="sm"
                value={channels}
                onChange={setChannels}
                options={[
                  { value: "keep", label: "Keep" },
                  { value: "1", label: "Mono" },
                  { value: "2", label: "Stereo" },
                ]}
              />
            </Field>
            {Number.isFinite(dur) && fmt === "wav" && (
              <p className="text-[11px] text-muted-foreground tabular-nums">≈ {formatBytes(dur * Number(rate) * d.bytes * (channels === "1" ? 1 : 2))} WAV</p>
            )}
          </>
        }
        action={{ label: `Resample to ${Number(rate) / 1000} kHz`, busyLabel: "Resampling", icon: <AudioLines />, onClick: resample }}
      />
    </ToolLayout>
  );
}
