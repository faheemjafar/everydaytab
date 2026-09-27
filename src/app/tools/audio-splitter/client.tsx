"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { AUDIO_FORMATS, Field, MediaTool, Segmented, extOf, formatDuration, parseDuration, stem, useMediaFile } from "@/components/tool";

type Mode = "every" | "parts" | "at";

export default function AudioSplitter() {
  const [mode, setMode] = useState<Mode>("every");
  const [every, setEvery] = useState(60);
  const [parts, setParts] = useState(3);
  const [points, setPoints] = useState("1:00, 2:30");
  const media = useMediaFile("audio");
  const dur = media.info?.duration ?? NaN;

  const cutTimes = (): number[] => {
    if (mode === "every") return Number.isFinite(dur) ? Array.from({ length: Math.ceil(dur / every) - 1 }, (_, i) => (i + 1) * every) : [];
    if (mode === "parts") return Number.isFinite(dur) ? Array.from({ length: parts - 1 }, (_, i) => ((i + 1) * dur) / parts) : [];
    return points.split(",").map(parseDuration).filter((t) => Number.isFinite(t) && t > 0 && (!Number.isFinite(dur) || t < dur)).sort((a, b) => a - b);
  };
  const cuts = cutTimes();

  const split = () =>
    media.process(async (ctx) => {
      const ext = extOf(media.file!.name, "mp3");
      const mime = Object.values(AUDIO_FORMATS).find((f) => f.label.toLowerCase() === ext)?.mime ?? media.file!.type ?? "audio/mpeg";
      // Stream copy: no re-encoding, cuts land on the nearest audio frame.
      const args = ["-i", ctx.input, "-vn", "-map", "0:a", "-c", "copy", "-f", "segment", "-reset_timestamps", "1"];
      if (mode === "every") args.push("-segment_time", String(every));
      else args.push("-segment_times", cuts.map((t) => t.toFixed(3)).join(","));
      await ctx.exec([...args, `part_%03d.${ext}`]);
      const names = (await ctx.list()).filter((n) => n.startsWith("part_")).sort();
      names.forEach(ctx.track);
      return Promise.all(names.map(async (n, i) => ({ blob: await ctx.read(n, mime), filename: `${stem(media.file)}-part${String(i + 1).padStart(2, "0")}.${ext}` })));
    });

  const count = mode === "every" && Number.isFinite(dur) ? Math.ceil(dur / every) : cuts.length + 1;

  return (
    <ToolLayout toolId="audio-splitter">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Split">
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "every", label: "Every N sec" },
                  { value: "parts", label: "Into N parts" },
                  { value: "at", label: "At times" },
                ]}
              />
            </Field>
            {mode === "every" && (
              <Field label="Segment length" hint={formatDuration(every)}>
                <div className="flex flex-wrap gap-1 items-center">
                  <Input type="number" min={1} value={every} onChange={(e) => setEvery(Math.max(1, Number(e.target.value) || 1))} className="w-24" />
                  {[30, 60, 300, 600, 1800].map((s) => (
                    <button key={s} type="button" onClick={() => setEvery(s)} className="h-6 px-2 rounded-sm border border-border text-[11px] text-muted-foreground hover:text-foreground">
                      {s < 60 ? `${s}s` : `${s / 60}m`}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            {mode === "parts" && (
              <Field label="Number of parts" htmlFor="parts">
                <Input id="parts" type="number" min={2} max={100} value={parts} onChange={(e) => setParts(Math.max(2, Math.min(100, Number(e.target.value) || 2)))} className="w-24" />
              </Field>
            )}
            {mode === "at" && (
              <Field label="Cut at" hint="Comma-separated, e.g. 1:30, 4:05.5, 12:00" htmlFor="pts">
                <Input id="pts" value={points} onChange={(e) => setPoints(e.target.value)} className="font-mono" />
              </Field>
            )}
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {count} part{count === 1 ? "" : "s"} · no re-encoding, original quality kept.
            </p>
          </>
        }
        action={{ label: `Split into ${count}`, busyLabel: "Splitting", icon: <Scissors />, onClick: split, disabled: count < 2 }}
      />
    </ToolLayout>
  );
}
