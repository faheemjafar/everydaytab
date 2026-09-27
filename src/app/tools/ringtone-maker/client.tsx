"use client";

import { useRef, useState } from "react";
import { Bell } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, MediaTool, Segmented, SliderField, TimeRange, stem, useMediaFile } from "@/components/tool";

type Target = "iphone" | "android";

export default function RingtoneMaker() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [fade, setFade] = useState(1);
  const [target, setTarget] = useState<Target>("iphone");
  const audioRef = useRef<HTMLAudioElement>(null);
  const media = useMediaFile("audio", (info) => {
    setStart(0);
    setEnd(Math.min(30, Number.isFinite(info.duration) ? info.duration : 30));
  });

  const len = end - start;
  const maxLen = target === "iphone" ? 40 : 60;

  const make = () => {
    if (!media.file) return;
    const iphone = target === "iphone";
    // iPhone ringtones are AAC in an .m4r (MP4) container, max 40 s.
    const out = iphone ? "out.m4a" : "out.mp3";
    const af = `afade=t=in:st=0:d=${fade},afade=t=out:st=${Math.max(0, len - fade).toFixed(2)}:d=${fade}`;
    media.run({
      args: (input) => ["-ss", start.toFixed(2), "-t", len.toFixed(2), "-i", input, "-vn", "-af", af, ...(iphone ? ["-c:a", "aac", "-b:a", "192k", "-f", "ipod"] : ["-c:a", "libmp3lame", "-b:a", "192k"]), out],
      output: out,
      mime: iphone ? "audio/mp4" : "audio/mpeg",
      filename: `${stem(media.file)}-ringtone.${iphone ? "m4r" : "mp3"}`,
    });
  };

  return (
    <ToolLayout toolId="ringtone-maker">
      <MediaTool
        media={media}
        audioRef={audioRef}
        range={{ start, end }}
        options={
          <>
            <Field label="Phone">
              <Segmented
                value={target}
                onChange={(t) => {
                  setTarget(t);
                  if (t === "iphone" && len > 40) setEnd(start + 40);
                }}
                options={[
                  { value: "iphone", label: "iPhone (.m4r)" },
                  { value: "android", label: "Android (.mp3)" },
                ]}
              />
            </Field>
            <TimeRange
              duration={media.info?.duration ?? NaN}
              start={start}
              end={end}
              onChange={(s, e) => {
                setStart(s);
                setEnd(Math.min(e, s + maxLen));
              }}
              getCurrentTime={() => audioRef.current?.currentTime}
            />
            <SliderField label="Fade in / out" value={fade} onChange={setFade} min={0} max={5} step={0.5} format={(v) => (v ? `${v}s` : "off")} />
            <p className="text-[11px] text-muted-foreground">
              {target === "iphone" ? "Max 40 s. Add it via Finder / iTunes, or the GarageBand app → Share → Ringtone." : "Copy the MP3 to your phone's Ringtones folder, or pick it in Settings → Sound."}
            </p>
          </>
        }
        action={{ label: "Make ringtone", busyLabel: "Creating", icon: <Bell />, onClick: make, disabled: len < 1 || len > maxLen }}
      />
    </ToolLayout>
  );
}
