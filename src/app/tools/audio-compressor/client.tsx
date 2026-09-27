"use client";

import { useState } from "react";
import { Minimize2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ChoiceGrid, Field, MediaTool, Segmented, formatBytes, stem, useMediaFile } from "@/components/tool";

const LEVELS = {
  high: { kbps: 192, label: "High", hint: "Music, near original" },
  medium: { kbps: 128, label: "Standard", hint: "Music, good" },
  low: { kbps: 64, label: "Small", hint: "Speech, podcasts" },
  tiny: { kbps: 32, label: "Tiny", hint: "Voice memos" },
} as const;
type Level = keyof typeof LEVELS;
type Codec = "mp3" | "m4a" | "opus";

const CODEC = {
  mp3: { mime: "audio/mpeg", args: (k: number) => ["-c:a", "libmp3lame", "-b:a", `${k}k`] },
  m4a: { mime: "audio/mp4", args: (k: number) => ["-c:a", "aac", "-b:a", `${k}k`] },
  opus: { mime: "audio/ogg", args: (k: number) => ["-c:a", "libopus", "-b:a", `${k}k`, "-compression_level", "4"] },
};

export default function AudioCompressor() {
  const [level, setLevel] = useState<Level>("medium");
  const [codec, setCodec] = useState<Codec>("mp3");
  const [mono, setMono] = useState(false);
  const media = useMediaFile("audio");
  const kbps = LEVELS[level].kbps;
  const dur = media.info?.duration ?? NaN;

  const compress = () => {
    if (!media.file) return;
    const out = `out.${codec}`;
    // Lower sample rate for very low bitrates keeps speech clearer.
    // Opus must be 48/24 kHz (FFmpeg.wasm crashes otherwise); others drop rate at low bitrates for clearer speech.
    const ar = codec === "opus" ? ["-ar", kbps <= 32 ? "24000" : "48000"] : kbps <= 32 ? ["-ar", "22050"] : kbps <= 64 ? ["-ar", "32000"] : [];
    media.run({
      args: (input) => ["-i", input, "-vn", ...(mono ? ["-ac", "1"] : []), ...ar, ...CODEC[codec].args(kbps), out],
      output: out,
      mime: CODEC[codec].mime,
      filename: `${stem(media.file)}-${kbps}k.${codec}`,
    });
  };

  return (
    <ToolLayout toolId="audio-compressor">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Target quality">
              <ChoiceGrid cols={2} value={level} onChange={setLevel} options={(Object.keys(LEVELS) as Level[]).map((k) => ({ value: k, label: `${LEVELS[k].label} · ${LEVELS[k].kbps}k`, hint: LEVELS[k].hint }))} />
            </Field>
            <Field label="Codec" hint={codec === "opus" ? "Best quality per kbps; plays in browsers, Android, VLC." : codec === "m4a" ? "AAC — great on Apple devices." : "Plays everywhere."}>
              <Segmented
                size="sm"
                value={codec}
                onChange={setCodec}
                options={[
                  { value: "mp3", label: "MP3" },
                  { value: "m4a", label: "AAC" },
                  { value: "opus", label: "Opus" },
                ]}
              />
            </Field>
            <Field label="Channels">
              <Segmented
                size="sm"
                value={mono ? "mono" : "stereo"}
                onChange={(v) => setMono(v === "mono")}
                options={[
                  { value: "stereo", label: "Keep" },
                  { value: "mono", label: "Mono (halves size)" },
                ]}
              />
            </Field>
            {Number.isFinite(dur) && <p className="text-[11px] text-muted-foreground tabular-nums">Estimated output ≈ {formatBytes((kbps * 1000 * dur) / 8)}</p>}
          </>
        }
        action={{ label: "Compress audio", busyLabel: "Compressing", icon: <Minimize2 />, onClick: compress }}
      />
    </ToolLayout>
  );
}
