"use client";

import { useState } from "react";
import { VolumeX } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { EVEN_DIMS, FASTSTART, Field, MediaTool, Segmented, extOf, h264, stem, useMediaFile } from "@/components/tool";

export default function MuteVideo() {
  const [copy, setCopy] = useState(true);
  const media = useMediaFile("video");

  const mute = () => {
    if (!media.file) return;
    const ext = copy ? extOf(media.file.name) : "mp4";
    const out = `muted.${ext}`;
    media.run({
      args: (input) => (copy ? ["-i", input, "-an", "-c:v", "copy", out] : ["-i", input, "-an", "-vf", EVEN_DIMS, ...h264(20), ...FASTSTART, out]),
      output: out,
      mime: copy ? media.file.type || "video/mp4" : "video/mp4",
      filename: `${stem(media.file)}-muted.${ext}`,
    });
  };

  return (
    <ToolLayout toolId="mute-video">
      <MediaTool
        media={media}
        options={
          <Field label="Video" hint={copy ? "Fastest and lossless — the picture is untouched." : "Re-encodes to H.264 MP4 for maximum compatibility."}>
            <Segmented
              value={copy ? "copy" : "encode"}
              onChange={(v) => setCopy(v === "copy")}
              options={[
                { value: "copy", label: "Keep as is" },
                { value: "encode", label: "Re-encode MP4" },
              ]}
            />
          </Field>
        }
        action={{ label: "Remove audio", busyLabel: "Removing", icon: <VolumeX />, onClick: mute }}
      />
    </ToolLayout>
  );
}
