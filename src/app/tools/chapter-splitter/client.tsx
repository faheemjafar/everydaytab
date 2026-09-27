"use client";

import { useState } from "react";
import { ListOrdered, ScanSearch } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { AUDIO_FORMATS, MediaTool, SliderField, StatusBadge, ToolPanel, extOf, formatDuration, stem, useMediaFile } from "@/components/tool";

/** Parses silencedetect output into [start, end] silence intervals. */
function parseSilences(lines: string[]): [number, number][] {
  const out: [number, number][] = [];
  let s: number | null = null;
  for (const l of lines) {
    const a = l.match(/silence_start:\s*(-?[\d.]+)/);
    if (a) s = Math.max(0, parseFloat(a[1]));
    const b = l.match(/silence_end:\s*([\d.]+)/);
    if (b && s !== null) {
      out.push([s, parseFloat(b[1])]);
      s = null;
    }
  }
  return out;
}

export default function ChapterSplitter() {
  const [minSilence, setMinSilence] = useState(2);
  const [threshold, setThreshold] = useState(-40);
  const [minChapter, setMinChapter] = useState(60);
  const [cuts, setCuts] = useState<number[] | null>(null);
  const media = useMediaFile("audio", () => setCuts(null));
  const dur = media.info?.duration ?? NaN;

  const detectAndSplit = () =>
    media.process(async (ctx) => {
      // 1) Find pauses.
      const log = await ctx.capture(["-i", ctx.input, "-vn", "-af", `silencedetect=noise=${threshold}dB:d=${minSilence}`, "-f", "null", "-"]);
      // 2) Cut in the middle of each pause, skipping chapters shorter than minChapter.
      const points: number[] = [];
      let last = 0;
      for (const [a, b] of parseSilences(log)) {
        const mid = (a + b) / 2;
        if (mid - last >= minChapter && (!Number.isFinite(dur) || dur - mid >= minChapter / 2)) {
          points.push(mid);
          last = mid;
        }
      }
      setCuts(points);
      if (!points.length) throw new Error("No pauses long enough were found. Lower the minimum pause or raise the threshold.");
      // 3) Split with stream copy at those points.
      const ext = extOf(media.file!.name, "mp3");
      const mime = Object.values(AUDIO_FORMATS).find((f) => f.label.toLowerCase() === ext)?.mime ?? media.file!.type ?? "audio/mpeg";
      await ctx.exec(["-i", ctx.input, "-vn", "-map", "0:a", "-c", "copy", "-f", "segment", "-reset_timestamps", "1", "-segment_times", points.map((p) => p.toFixed(3)).join(","), `ch_%03d.${ext}`]);
      const names = (await ctx.list()).filter((n) => n.startsWith("ch_")).sort();
      names.forEach(ctx.track);
      return Promise.all(names.map(async (n, i) => ({ blob: await ctx.read(n, mime), filename: `${stem(media.file)} - Chapter ${String(i + 1).padStart(2, "0")}.${ext}` })));
    });

  const bounds = cuts && Number.isFinite(dur) ? [0, ...cuts, dur] : null;

  return (
    <ToolLayout toolId="chapter-splitter">
      <MediaTool
        media={media}
        options={
          <>
            <SliderField label="Minimum pause" value={minSilence} onChange={setMinSilence} min={0.5} max={8} step={0.5} format={(v) => `${v}s`} />
            <SliderField label="Silence threshold" value={threshold} onChange={setThreshold} min={-60} max={-20} format={(v) => `${v} dB`} />
            <SliderField label="Minimum chapter length" value={minChapter} onChange={setMinChapter} min={10} max={1200} step={10} format={(v) => formatDuration(v)} />
            <p className="text-[11px] text-muted-foreground">Finds natural pauses (between podcast segments, audiobook chapters, album tracks) and cuts in the middle of each. No re-encoding.</p>
          </>
        }
        action={{ label: "Detect & split", busyLabel: "Analysing", icon: <ScanSearch />, onClick: detectAndSplit }}
      >
        {bounds && bounds.length > 2 && (
          <ToolPanel title={`Chapters · ${bounds.length - 1}`} actions={<StatusBadge>{cuts!.length} cut{cuts!.length === 1 ? "" : "s"}</StatusBadge>}>
            <div className="p-3">
              <div className="flex h-6 rounded-sm overflow-hidden border border-border">
                {bounds.slice(1).map((b, i) => (
                  <div key={i} className={"h-full flex items-center justify-center text-[10px] " + (i % 2 ? "bg-accent text-accent-foreground" : "bg-muted")} style={{ width: `${((b - bounds[i]) / dur) * 100}%` }}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <ol className="mt-2 grid sm:grid-cols-2 gap-x-4 text-xs tabular-nums">
                {bounds.slice(1).map((b, i) => (
                  <li key={i} className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Chapter {i + 1}</span>
                    <span className="font-mono">
                      {formatDuration(bounds[i])} – {formatDuration(b)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </ToolPanel>
        )}
        {cuts && !cuts.length && (
          <Button variant="ghost" size="sm" onClick={() => setMinSilence(Math.max(0.5, minSilence - 0.5))}>
            <ListOrdered /> Try a shorter minimum pause
          </Button>
        )}
      </MediaTool>
    </ToolLayout>
  );
}
