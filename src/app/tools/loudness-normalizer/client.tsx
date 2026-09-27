"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, ChoiceGrid, Field, MediaTool, Stat, StatGrid, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

const TARGETS = {
  streaming: { I: -14, TP: -1, LRA: 11, label: "Streaming", hint: "−14 LUFS · Spotify, YouTube" },
  podcast: { I: -16, TP: -1.5, LRA: 11, label: "Podcast", hint: "−16 LUFS · Apple Podcasts" },
  broadcast: { I: -23, TP: -2, LRA: 7, label: "Broadcast", hint: "−23 LUFS · EBU R128" },
  loud: { I: -9, TP: -1, LRA: 8, label: "Loud / club", hint: "−9 LUFS · mastering" },
} as const;
type Target = keyof typeof TARGETS;

interface Measure {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
  output_i?: string;
  output_tp?: string;
}

/** loudnorm prints a JSON block at the end of its log. */
function parseLoudnorm(lines: string[]): Measure | null {
  const text = lines.join("\n");
  const m = text.match(/\{[^{}]*"input_i"[^{}]*\}/);
  try {
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}

export default function LoudnessNormalizer() {
  const [target, setTarget] = useState<Target>("streaming");
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [measured, setMeasured] = useState<{ before: Measure; after: Measure | null } | null>(null);
  const media = useMediaFile("audio", (_, f) => {
    setFormat(audioFormatFor(f));
    setMeasured(null);
  });

  const normalize = () =>
    media.process(async (ctx) => {
      const t = TARGETS[target];
      const base = `loudnorm=I=${t.I}:TP=${t.TP}:LRA=${t.LRA}`;
      // Pass 1: measure.
      ctx.setProgress(1);
      const m = parseLoudnorm(await ctx.capture(["-i", ctx.input, "-vn", "-af", `${base}:print_format=json`, "-f", "null", "-"]));
      if (!m) throw new Error("Couldn't measure loudness for this file.");
      // Pass 2: apply with measured values; linear mode avoids pumping when possible.
      const o = audioOutput(format, media.file, `${t.I}LUFS`);
      const af = `${base}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
      const log = await ctx.capture(["-i", ctx.input, "-vn", "-af", af, "-ar", "48000", ...o.codec, o.output]);
      setMeasured({ before: m, after: parseLoudnorm(log) });
      return [{ blob: await ctx.read(o.output, o.mime), filename: o.filename }];
    });

  const t = TARGETS[target];

  return (
    <ToolLayout toolId="loudness-normalizer">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Target">
              <ChoiceGrid cols={2} value={target} onChange={setTarget} options={(Object.keys(TARGETS) as Target[]).map((k) => ({ value: k, label: TARGETS[k].label, hint: TARGETS[k].hint }))} />
            </Field>
            <AudioFormatField value={format} onChange={setFormat} />
            <p className="text-[11px] text-muted-foreground">
              Two-pass EBU R128: measures first, then applies an exact gain with a true-peak ceiling of {t.TP} dBTP.
            </p>
          </>
        }
        action={{ label: `Normalize to ${t.I} LUFS`, busyLabel: "Normalizing", icon: <Gauge />, onClick: normalize }}
      >
        {measured && (
          <StatGrid>
            <Stat label="Before" value={`${Number(measured.before.input_i).toFixed(1)} LUFS`} hint={`peak ${Number(measured.before.input_tp).toFixed(1)} dBTP`} />
            <Stat label="After" value={measured.after?.output_i ? `${Number(measured.after.output_i).toFixed(1)} LUFS` : `≈ ${t.I} LUFS`} hint={measured.after?.output_tp ? `peak ${Number(measured.after.output_tp).toFixed(1)} dBTP` : undefined} />
            <Stat label="Loudness range" value={`${Number(measured.before.input_lra).toFixed(1)} LU`} />
            <Stat label="Gain applied" value={`${(t.I - Number(measured.before.input_i) >= 0 ? "+" : "")}${(t.I - Number(measured.before.input_i)).toFixed(1)} dB`} />
          </StatGrid>
        )}
      </MediaTool>
    </ToolLayout>
  );
}
