"use client";

import { useState } from "react";
import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { ChoiceGrid, FASTSTART, Field, MediaTool, h264, stem, useMediaFile } from "@/components/tool";

const ACTIONS = {
  rotate90cw: { label: "90° right", vf: "transpose=1", icon: <RotateCw className="w-5 h-5" />, css: "rotate(90deg)" },
  rotate90ccw: { label: "90° left", vf: "transpose=2", icon: <RotateCcw className="w-5 h-5" />, css: "rotate(-90deg)" },
  rotate180: { label: "180°", vf: "transpose=2,transpose=2", icon: <RotateCw className="w-5 h-5" />, css: "rotate(180deg)" },
  fliph: { label: "Flip horizontal", vf: "hflip", icon: <FlipHorizontal className="w-5 h-5" />, css: "scaleX(-1)" },
  flipv: { label: "Flip vertical", vf: "vflip", icon: <FlipVertical className="w-5 h-5" />, css: "scaleY(-1)" },
} as const;
type Action = keyof typeof ACTIONS;

export default function VideoRotator() {
  const [action, setAction] = useState<Action>("rotate90cw");
  const media = useMediaFile("video");

  const rotate = () => {
    if (!media.file) return;
    media.run({
      // -metadata:s:v rotate=0 clears any existing rotation tag so players don't double-rotate.
      args: (input) => ["-i", input, "-vf", `${ACTIONS[action].vf},scale=trunc(iw/2)*2:trunc(ih/2)*2`, "-metadata:s:v:0", "rotate=0", ...h264(20), "-c:a", "copy", ...FASTSTART, "rotated.mp4"],
      output: "rotated.mp4",
      mime: "video/mp4",
      filename: `${stem(media.file)}-${action}.mp4`,
    });
  };

  return (
    <ToolLayout toolId="video-rotator">
      <MediaTool
        media={media}
        preview={
          media.url ? (
            <div className="flex items-center justify-center bg-stone-950 h-[50vh] overflow-hidden">
              <video src={media.url} controls playsInline className="max-w-[70%] max-h-[70%] transition-transform duration-300" style={{ transform: ACTIONS[action].css }} />
            </div>
          ) : undefined
        }
        options={
          <Field label="Transform" hint="The preview shows the result before processing.">
            <ChoiceGrid cols={2} value={action} onChange={setAction} options={(Object.keys(ACTIONS) as Action[]).map((k) => ({ value: k, label: ACTIONS[k].label, icon: ACTIONS[k].icon }))} />
          </Field>
        }
        action={{ label: "Apply", busyLabel: "Rotating", icon: ACTIONS[action].icon, onClick: rotate }}
      />
    </ToolLayout>
  );
}
