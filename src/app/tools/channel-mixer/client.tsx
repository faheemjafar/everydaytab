"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, ChoiceGrid, Field, MediaTool, SliderField, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

const MODES = {
  mono: { label: "Stereo → mono", hint: "Mix both sides", af: "pan=mono|c0=0.5*c0+0.5*c1" },
  left: { label: "Left only", hint: "Mono from left", af: "pan=mono|c0=c0" },
  right: { label: "Right only", hint: "Mono from right", af: "pan=mono|c0=c1" },
  swap: { label: "Swap L ↔ R", hint: "Stereo", af: "pan=stereo|c0=c1|c1=c0" },
  dual: { label: "Mono → stereo", hint: "Duplicate to both", af: "pan=stereo|c0=c0|c1=c0" },
  balance: { label: "Balance", hint: "Shift left/right", af: "" },
} as const;
type Mode = keyof typeof MODES;

export default function ChannelMixer() {
  const [mode, setMode] = useState<Mode>("mono");
  const [balance, setBalance] = useState(0);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const media = useMediaFile("audio", (_, f) => setFormat(audioFormatFor(f)));

  const apply = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, mode);
    // Balance: attenuate the opposite side; -1 = full left, +1 = full right.
    const l = Math.min(1, 1 - balance).toFixed(3);
    const r = Math.min(1, 1 + balance).toFixed(3);
    const af = mode === "balance" ? `pan=stereo|c0=${l}*c0|c1=${r}*c1` : MODES[mode].af;
    media.run({ args: (input) => ["-i", input, "-vn", "-af", af, ...o.codec, o.output], output: o.output, mime: o.mime, filename: o.filename });
  };

  return (
    <ToolLayout toolId="channel-mixer">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Mode">
              <ChoiceGrid cols={2} value={mode} onChange={setMode} options={(Object.keys(MODES) as Mode[]).map((k) => ({ value: k, label: MODES[k].label, hint: MODES[k].hint }))} />
            </Field>
            {mode === "balance" && (
              <SliderField label="Balance" value={balance} onChange={setBalance} min={-1} max={1} step={0.05} format={(v) => (v === 0 ? "centre" : v < 0 ? `${Math.round(-v * 100)}% left` : `${Math.round(v * 100)}% right`)} />
            )}
            <AudioFormatField value={format} onChange={setFormat} />
          </>
        }
        action={{ label: "Apply", busyLabel: "Processing", icon: <SlidersHorizontal />, onClick: apply, disabled: mode === "balance" && balance === 0 }}
      />
    </ToolLayout>
  );
}
