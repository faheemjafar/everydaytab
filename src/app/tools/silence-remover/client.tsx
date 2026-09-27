"use client";

import { useState } from "react";
import { Eraser } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, Field, MediaTool, Segmented, SliderField, audioFormatFor, audioOutput, formatDuration, useMediaFile, type AudioFormat } from "@/components/tool";

type Mode = "ends" | "all";

export default function SilenceRemover() {
  const [mode, setMode] = useState<Mode>("all");
  const [threshold, setThreshold] = useState(-40);
  const [minGap, setMinGap] = useState(0.8);
  const [keep, setKeep] = useState(0.25);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [saved, setSaved] = useState<number | null>(null);
  const media = useMediaFile("audio", (_, f) => {
    setFormat(audioFormatFor(f));
    setSaved(null);
  });

  const apply = () =>
    media.process(async (ctx) => {
      const o = audioOutput(format, media.file, "no-silence");
      const t = `${threshold}dB`;
      // "all": remove every pause longer than minGap, leaving `keep` seconds so speech doesn't sound chopped.
      const af =
        mode === "ends"
          ? `silenceremove=start_periods=1:start_threshold=${t}:start_silence=${keep},areverse,silenceremove=start_periods=1:start_threshold=${t}:start_silence=${keep},areverse`
          : `silenceremove=start_periods=1:start_threshold=${t}:start_silence=${keep}:stop_periods=-1:stop_duration=${minGap}:stop_threshold=${t}:stop_silence=${keep}:detection=rms`;
      await ctx.exec(["-i", ctx.input, "-vn", "-af", af, ...o.codec, o.output]);
      const blob = await ctx.read(o.output, o.mime);
      // Measure the new duration to report time saved.
      const probe = await ctx.capture(["-i", o.output, "-f", "null", "-"]);
      const m = probe.join("\n").match(/time=(\d+):(\d+):([\d.]+)/g)?.pop()?.match(/time=(\d+):(\d+):([\d.]+)/);
      if (m && Number.isFinite(media.info?.duration)) setSaved(media.info!.duration - (+m[1] * 3600 + +m[2] * 60 + +m[3]));
      return [{ blob, filename: o.filename }];
    });

  return (
    <ToolLayout toolId="silence-remover">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Remove">
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "all", label: "All long pauses" },
                  { value: "ends", label: "Start & end only" },
                ]}
              />
            </Field>
            <SliderField label="Silence threshold" value={threshold} onChange={setThreshold} min={-70} max={-20} format={(v) => `${v} dB`} />
            {mode === "all" && <SliderField label="Only pauses longer than" value={minGap} onChange={setMinGap} min={0.2} max={5} step={0.1} format={(v) => `${v.toFixed(1)}s`} />}
            <SliderField label="Keep around cuts" value={keep} onChange={setKeep} min={0} max={1} step={0.05} format={(v) => `${v.toFixed(2)}s`} />
            <AudioFormatField value={format} onChange={setFormat} />
            <p className="text-[11px] text-muted-foreground">Lower threshold (e.g. −55 dB) only removes true silence; higher (−30 dB) also removes quiet room noise.</p>
          </>
        }
        action={{ label: "Remove silence", busyLabel: "Processing", icon: <Eraser />, onClick: apply }}
      >
        {saved !== null && saved > 0.05 && <p className="text-xs text-muted-foreground px-0.5">Removed {formatDuration(saved, true)} of silence.</p>}
      </MediaTool>
    </ToolLayout>
  );
}
