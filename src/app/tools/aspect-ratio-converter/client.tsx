"use client";

import { useState } from "react";
import { RectangleHorizontal } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ChoiceGrid, ColorField, FASTSTART, Field, MediaTool, Segmented, h264, stem, useMediaFile } from "@/components/tool";

const RATIOS = [
  { value: "9:16", label: "9:16", hint: "Reels · TikTok · Shorts" },
  { value: "1:1", label: "1:1", hint: "Instagram feed" },
  { value: "4:5", label: "4:5", hint: "Instagram portrait" },
  { value: "16:9", label: "16:9", hint: "YouTube" },
  { value: "4:3", label: "4:3", hint: "Classic TV" },
  { value: "21:9", label: "21:9", hint: "Cinematic" },
];

type Mode = "blur" | "pad" | "crop";
const even = (n: number) => Math.round(n / 2) * 2;

export default function AspectRatioConverter() {
  const [ratio, setRatio] = useState("9:16");
  const [mode, setMode] = useState<Mode>("blur");
  const [padColor, setPadColor] = useState("#000000");
  const media = useMediaFile("video");
  const vw = media.info?.width ?? 0;
  const vh = media.info?.height ?? 0;

  const [rw, rh] = ratio.split(":").map(Number);
  const R = rw / rh;
  // Output canvas: grow (pad/blur) or shrink (crop) one side to hit the ratio.
  const outW = vw ? even(mode === "crop" ? Math.min(vw, vh * R) : Math.max(vw, vh * R)) : 0;
  const outH = vw ? even(mode === "crop" ? Math.min(vh, vw / R) : Math.max(vh, vw / R)) : 0;

  const convert = () => {
    if (!media.file || !vw) return;
    const color = padColor.replace("#", "0x");
    const filter =
      mode === "crop"
        ? ["-vf", `crop=${outW}:${outH}:(iw-${outW})/2:(ih-${outH})/2`]
        : mode === "pad"
          ? ["-vf", `scale=${even(vw)}:${even(vh)},pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:color=${color}`]
          : [
              // Blurred, zoomed copy fills the background; the original sits centred on top.
              "-filter_complex",
              `[0:v]split=2[bg][fg];[bg]scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},boxblur=20:2[b];[fg]scale=${even(vw)}:${even(vh)}[f];[b][f]overlay=(W-w)/2:(H-h)/2[v]`,
              "-map",
              "[v]",
              "-map",
              "0:a?",
            ];
    media.run({
      args: (input) => ["-i", input, ...filter, ...h264(21), "-c:a", "aac", "-b:a", "160k", ...FASTSTART, "output.mp4"],
      output: "output.mp4",
      mime: "video/mp4",
      filename: `${stem(media.file)}-${ratio.replace(":", "x")}.mp4`,
    });
  };

  const matches = vw && Math.abs(vw / vh - R) < 0.01;

  return (
    <ToolLayout toolId="aspect-ratio-converter">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Target ratio">
              <ChoiceGrid cols={3} value={ratio} onChange={setRatio} options={RATIOS} />
            </Field>
            <Field label="Fill method">
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "blur", label: "Blur fill" },
                  { value: "pad", label: "Bars" },
                  { value: "crop", label: "Crop" },
                ]}
              />
            </Field>
            {mode === "pad" && <ColorField label="Bar colour" value={padColor} onChange={setPadColor} />}
            {vw > 0 && (
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute border border-dashed border-muted-foreground/60 bg-muted" style={{ aspectRatio: `${outW} / ${outH}`, [outW >= outH ? "width" : "height"]: "100%" }} />
                  <div className="relative bg-primary/60" style={{ aspectRatio: `${vw} / ${vh}`, [outW >= outH ? "width" : "height"]: mode === "crop" ? "100%" : `${(outW >= outH ? vw / outW : vh / outH) * 100}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {vw} × {vh} → <span className="text-foreground font-medium">{outW} × {outH}</span>
                </p>
              </div>
            )}
            {matches ? <p className="text-[11px] text-muted-foreground">This video is already {ratio}.</p> : null}
          </>
        }
        action={{ label: `Convert to ${ratio}`, busyLabel: "Converting", icon: <RectangleHorizontal />, onClick: convert, disabled: !vw }}
      />
    </ToolLayout>
  );
}
