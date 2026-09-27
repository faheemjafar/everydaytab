"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, MediaTool, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

export default function AudioReverser() {
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const media = useMediaFile("audio", (_, f) => setFormat(audioFormatFor(f)));

  const reverse = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, "reversed");
    media.run({ args: (input) => ["-i", input, "-vn", "-af", "areverse", ...o.codec, o.output], output: o.output, mime: o.mime, filename: o.filename });
  };

  return (
    <ToolLayout toolId="audio-reverser">
      <MediaTool
        media={media}
        options={
          <>
            <AudioFormatField value={format} onChange={setFormat} />
            <p className="text-[11px] text-muted-foreground">Reversing loads the whole file into memory — very long recordings (1 h+) may be too large for the browser.</p>
          </>
        }
        action={{ label: "Reverse audio", busyLabel: "Reversing", icon: <Undo2 />, onClick: reverse }}
      />
    </ToolLayout>
  );
}
