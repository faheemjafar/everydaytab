"use client";

import { useRef, useState } from "react";
import { Scissors } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, FASTSTART, MediaTool, Segmented, TimeRange, extOf, h264, stem, useMediaFile } from "@/components/tool";

type Mode = "fast" | "precise";

export default function VideoTrimmerClient() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [mode, setMode] = useState<Mode>("fast");
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = useMediaFile("video", (info) => {
    setStart(0);
    setEnd(Number.isFinite(info.duration) ? info.duration : 30);
  });

  const trim = () => {
    if (!media.file) return;
    const ext = extOf(media.file.name);
    const out = `trimmed.${ext}`;
    const len = (end - start).toFixed(3);
    media.run({
      // Fast: seek before input + stream copy (cuts on keyframes, instant).
      // Precise: decode and re-encode so the cut lands on the exact frame.
      args: (input) =>
        mode === "fast"
          ? ["-ss", start.toFixed(3), "-i", input, "-t", len, "-c", "copy", "-avoid_negative_ts", "make_zero", out]
          : ["-ss", start.toFixed(3), "-i", input, "-t", len, ...h264(20), "-c:a", "aac", "-b:a", "160k", ...FASTSTART, `trimmed.mp4`],
      output: mode === "fast" ? out : "trimmed.mp4",
      mime: mode === "fast" ? media.file.type || "video/mp4" : "video/mp4",
      filename: `${stem(media.file)}-trimmed.${mode === "fast" ? ext : "mp4"}`,
    });
  };

  return (
    <ToolLayout toolId="video-trimmer">
      <MediaTool
        media={media}
        videoRef={videoRef}
        options={
          <>
            <TimeRange
              duration={media.info?.duration ?? NaN}
              start={start}
              end={end}
              onChange={(s, e) => {
                setStart(s);
                setEnd(e);
                if (videoRef.current && Math.abs(videoRef.current.currentTime - s) > 0.05 && s !== start) videoRef.current.currentTime = s;
              }}
              getCurrentTime={() => videoRef.current?.currentTime}
            />
            <Field label="Cut mode" hint={mode === "fast" ? "Instant, lossless; cuts snap to the nearest keyframe (can be off by ~1–2 s)." : "Frame-accurate; re-encodes to MP4, slower."}>
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "fast", label: "Fast (no re-encode)" },
                  { value: "precise", label: "Precise" },
                ]}
              />
            </Field>
          </>
        }
        action={{ label: "Trim video", busyLabel: "Trimming", icon: <Scissors />, onClick: trim, disabled: end - start < 0.1 }}
      />
    </ToolLayout>
  );
}
