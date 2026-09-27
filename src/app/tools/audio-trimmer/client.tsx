"use client";

import { useRef, useState } from "react";
import { Scissors } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, MediaTool, SliderField, TimeRange, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

export default function AudioTrimmer() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const audioRef = useRef<HTMLAudioElement>(null);
  const media = useMediaFile("audio", (info, file) => {
    setStart(0);
    setEnd(Number.isFinite(info.duration) ? info.duration : 30);
    setFormat(audioFormatFor(file));
  });

  const len = end - start;

  const trim = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, "trimmed");
    const fades = [fadeIn > 0 ? `afade=t=in:st=0:d=${fadeIn}` : null, fadeOut > 0 ? `afade=t=out:st=${Math.max(0, len - fadeOut).toFixed(3)}:d=${fadeOut}` : null].filter(Boolean);
    media.run({
      args: (input) => ["-ss", start.toFixed(3), "-t", len.toFixed(3), "-i", input, "-vn", ...(fades.length ? ["-af", fades.join(",")] : []), ...o.codec, o.output],
      output: o.output,
      mime: o.mime,
      filename: o.filename,
    });
  };

  return (
    <ToolLayout toolId="audio-trimmer">
      <MediaTool
        media={media}
        audioRef={audioRef}
        range={{ start, end }}
        options={
          <>
            <TimeRange
              duration={media.info?.duration ?? NaN}
              start={start}
              end={end}
              onChange={(s, e) => {
                setStart(s);
                setEnd(e);
              }}
              getCurrentTime={() => audioRef.current?.currentTime}
            />
            <SliderField label="Fade in" value={fadeIn} onChange={setFadeIn} min={0} max={Math.min(10, len / 2)} step={0.1} format={(v) => (v ? `${v.toFixed(1)}s` : "off")} />
            <SliderField label="Fade out" value={fadeOut} onChange={setFadeOut} min={0} max={Math.min(10, len / 2)} step={0.1} format={(v) => (v ? `${v.toFixed(1)}s` : "off")} />
            <AudioFormatField value={format} onChange={setFormat} />
          </>
        }
        action={{ label: "Trim audio", busyLabel: "Trimming", icon: <Scissors />, onClick: trim, disabled: len < 0.1 }}
      />
    </ToolLayout>
  );
}
