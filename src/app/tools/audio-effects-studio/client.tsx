"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { AudioFormatField, ChoiceGrid, Field, MediaTool, SliderField, audioFormatFor, audioOutput, useMediaFile, type AudioFormat } from "@/components/tool";

const EFFECTS = {
  echo: { label: "Echo", hint: "Distinct repeats", af: (x: number) => `aecho=0.8:0.85:${Math.round(300 + x * 7)}|${Math.round(600 + x * 12)}:${(0.2 + x / 250).toFixed(2)}|${(0.15 + x / 400).toFixed(2)}` },
  reverb: { label: "Reverb", hint: "Room / hall", af: (x: number) => `aecho=0.8:0.88:${Math.round(40 + x)}|${Math.round(60 + x * 1.3)}|${Math.round(90 + x * 1.7)}:${(0.3 + x / 400).toFixed(2)}|${(0.25 + x / 500).toFixed(2)}|${(0.2 + x / 600).toFixed(2)}` },
  chorus: { label: "Chorus", hint: "Thicker, layered", af: (x: number) => `chorus=0.6:0.9:${Math.round(40 + x / 3)}|${Math.round(55 + x / 3)}:0.4|0.32:0.25|0.4:2|1.3` },
  flanger: { label: "Flanger", hint: "Jet sweep", af: (x: number) => `flanger=delay=${(x / 25).toFixed(1)}:depth=${(2 + x / 20).toFixed(1)}:speed=0.5` },
  phaser: { label: "Phaser", hint: "Swirling", af: (x: number) => `aphaser=in_gain=0.6:out_gain=0.8:delay=${(1 + x / 40).toFixed(1)}:decay=0.5:speed=0.6` },
  bass: { label: "Bass boost", hint: "Low-end lift", af: (x: number) => `bass=g=${Math.round(x / 5)}:f=100,alimiter=limit=0.95:level=disabled` },
  treble: { label: "Treble boost", hint: "Crisper highs", af: (x: number) => `treble=g=${Math.round(x / 6)}:f=4000,alimiter=limit=0.95:level=disabled` },
  telephone: { label: "Telephone", hint: "Lo-fi band-pass", af: () => "highpass=f=400,lowpass=f=3200,acompressor=threshold=-20dB:ratio=4" },
  radio: { label: "Old radio", hint: "Narrow + crunch", af: (x: number) => `highpass=f=300,lowpass=f=4500,acrusher=bits=${Math.max(4, 12 - Math.round(x / 15))}:mix=0.4` },
  pitchup: { label: "Chipmunk", hint: "Pitch up", af: () => "aresample=44100,asetrate=58800,aresample=44100,atempo=0.75" },
  pitchdown: { label: "Deep voice", hint: "Pitch down", af: () => "aresample=44100,asetrate=33075,aresample=44100,atempo=1.3333" },
  robot: { label: "Robot", hint: "Metallic", af: () => "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75" },
} as const;
type Effect = keyof typeof EFFECTS;
const AMOUNT: Effect[] = ["echo", "reverb", "chorus", "flanger", "phaser", "bass", "treble", "radio"];

export default function AudioEffectsStudio() {
  const [effect, setEffect] = useState<Effect>("reverb");
  const [amount, setAmount] = useState(50);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const media = useMediaFile("audio", (_, f) => setFormat(audioFormatFor(f)));

  const apply = () => {
    if (!media.file) return;
    const o = audioOutput(format, media.file, effect);
    media.run({ args: (input) => ["-i", input, "-vn", "-af", EFFECTS[effect].af(amount), ...o.codec, o.output], output: o.output, mime: o.mime, filename: o.filename });
  };

  return (
    <ToolLayout toolId="audio-effects-studio">
      <MediaTool
        media={media}
        options={
          <>
            <Field label="Effect">
              <ChoiceGrid cols={3} value={effect} onChange={setEffect} options={(Object.keys(EFFECTS) as Effect[]).map((k) => ({ value: k, label: EFFECTS[k].label, hint: EFFECTS[k].hint }))} />
            </Field>
            {AMOUNT.includes(effect) && <SliderField label="Amount" value={amount} onChange={setAmount} min={0} max={100} format={(v) => `${v}%`} />}
            <AudioFormatField value={format} onChange={setFormat} />
          </>
        }
        action={{ label: `Apply ${EFFECTS[effect].label}`, busyLabel: "Processing", icon: <Sparkles />, onClick: apply }}
      />
    </ToolLayout>
  );
}
