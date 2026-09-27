"use client";

import { useRef, useState } from "react";
import { FileImage } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, MediaTool, Segmented, SliderField, TimeRange, stem, useMediaFile } from "@/components/tool";

export default function VideoToGif() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(5);
  const [fps, setFps] = useState(12);
  const [width, setWidth] = useState<"320" | "480" | "640" | "800">("480");
  const [loop, setLoop] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = useMediaFile("video", (info) => {
    setStart(0);
    setEnd(Number.isFinite(info.duration) ? Math.min(5, info.duration) : 5);
  });

  const convert = () => {
    if (!media.file) return;
    media.run({
      // Two-pass palette in one graph gives far better colours than the default 256-colour web palette.
      args: (input) => [
        "-ss", start.toFixed(2), "-t", (end - start).toFixed(2), "-i", input,
        "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
        "-loop", loop ? "0" : "-1",
        "output.gif",
      ],
      output: "output.gif",
      mime: "image/gif",
      filename: `${stem(media.file)}.gif`,
    });
  };

  const secs = end - start;
  const approxMb = (Number(width) * (Number(width) * 0.5625) * fps * secs * 0.12) / 1e6;

  return (
    <ToolLayout toolId="video-to-gif">
      <MediaTool
        media={media}
        videoRef={videoRef}
        options={
          <>
            <TimeRange duration={media.info?.duration ?? NaN} start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} getCurrentTime={() => videoRef.current?.currentTime} />
            <SliderField label="Frame rate" value={fps} onChange={setFps} min={5} max={30} format={(v) => `${v} fps`} />
            <Field label="Width">
              <Segmented size="sm" value={width} onChange={setWidth} options={["320", "480", "640", "800"].map((w) => ({ value: w as typeof width, label: `${w}px` }))} />
            </Field>
            <Field label="Loop forever" inline>
              <Segmented
                size="sm"
                value={loop ? "on" : "off"}
                onChange={(v) => setLoop(v === "on")}
                options={[
                  { value: "on", label: "Yes" },
                  { value: "off", label: "Play once" },
                ]}
              />
            </Field>
            <p className="text-[11px] text-muted-foreground">
              Estimated ~{approxMb < 1 ? `${Math.round(approxMb * 1000)} KB` : `${approxMb.toFixed(1)} MB`}. GIFs get big fast — keep clips short and small.
            </p>
          </>
        }
        action={{ label: "Create GIF", busyLabel: "Rendering", icon: <FileImage />, onClick: convert, disabled: secs <= 0 || secs > 60 }}
      />
    </ToolLayout>
  );
}
