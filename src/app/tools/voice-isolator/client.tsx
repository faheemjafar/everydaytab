"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, ChoiceGrid, Field, MediaTool, SliderField, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

const MODES = {
  enhance: { label: "Clean up voice", hint: "Denoise, rumble & hiss filter, level" },
  karaoke: { label: "Remove vocals", hint: "Karaoke: cancel centre-panned voice" },
  centre: { label: "Extract centre", hint: "Keep what's panned centre (often vocals)" },
} as const;
type Mode = keyof typeof MODES;

export default function VoiceIsolator() {
  const [mode, setMode] = useState<Mode>("enhance");
  const [denoise, setDenoise] = useState(12);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const media = useMediaFile("audio", (_, f) => setFormat(audioFormatFor(f)));

  const apply = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, mode === "karaoke" ? "instrumental" : "voice");
    const af =
      mode === "enhance"
        ? // Rumble cut, FFT denoise, air cut, gentle leveller, then a limiter.
          `highpass=f=80,afftdn=nr=${denoise}:nf=-45,lowpass=f=12000,dynaudnorm=f=250:g=15:p=0.9,alimiter=limit=0.95:level=disabled`
        : mode === "karaoke"
          ? "pan=stereo|c0=c0-c1|c1=c1-c0,highpass=f=40"
          : // Mid channel (L+R) with side removed, band-limited to the vocal range.
            "pan=mono|c0=0.5*c0+0.5*c1,highpass=f=100,lowpass=f=8000";
    media.run({ args: (input) => ["-i", input, "-vn", "-af", af, ...o.codec, o.output], output: o.output, mime: o.mime, filename: o.filename });
  };

  return (
    <ToolLayout toolId="voice-isolator">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Mode">
              <ChoiceGrid cols={2} value={mode} onChange={setMode} options={(Object.keys(MODES) as Mode[]).map((k) => ({ value: k, label: MODES[k].label, hint: MODES[k].hint }))} />
            </Field>
            {mode === "enhance" && <SliderField label="Noise reduction" value={denoise} onChange={setDenoise} min={3} max={40} format={(v) => `${v} dB`} />}
            <AudioFormatField value={format} onChange={setFormat} />
            <p className="text-[11px] text-muted-foreground">
              {mode === "enhance"
                ? "Best for recordings with steady background noise (fans, hum, hiss)."
                : "Signal-processing, not AI stem separation: works on stereo songs where the vocal is panned centre; reverb and backing vocals may remain."}
            </p>
          </>
        }
        action={{ label: MODES[mode].label, busyLabel: "Processing", icon: <Mic />, onClick: apply }}
      />
    </ToolLayout>
  );
}
