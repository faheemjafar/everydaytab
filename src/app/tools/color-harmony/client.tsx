"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { CodeOutput, ColorField, OptionsLayout, ToolPanel } from "@/components/tool";
import { hex, parseColor, readableText, toOklch } from "@/lib/color";

// Hue rotations in OKLCH keep perceived lightness constant, unlike HSL wheels.
const SCHEMES: { id: string; name: string; desc: string; offsets: number[] }[] = [
  { id: "complementary", name: "Complementary", desc: "Opposite hues — maximum contrast.", offsets: [0, 180] },
  { id: "split", name: "Split complementary", desc: "Base plus the two neighbours of its complement.", offsets: [0, 150, 210] },
  { id: "analogous", name: "Analogous", desc: "Neighbouring hues — calm and cohesive.", offsets: [-30, 0, 30] },
  { id: "triadic", name: "Triadic", desc: "Three evenly spaced hues — vibrant but balanced.", offsets: [0, 120, 240] },
  { id: "tetradic", name: "Tetradic (square)", desc: "Four evenly spaced hues — rich, needs a dominant colour.", offsets: [0, 90, 180, 270] },
  { id: "rectangle", name: "Rectangle", desc: "Two complementary pairs.", offsets: [0, 60, 180, 240] },
];

export default function ColorHarmony() {
  const [base, setBase] = useState("#0d9488");
  const c = parseColor(base);
  const ok = c ? toOklch(c) : null;
  const schemes = ok ? SCHEMES.map((s) => ({ ...s, colors: s.offsets.map((o) => hex({ mode: "oklch", l: ok.l, c: ok.c, h: ((ok.h ?? 0) + o + 360) % 360 })) })) : [];
  const mono = ok ? [0.92, 0.8, 0.68, ok.l, 0.42, 0.3].map((l) => hex({ mode: "oklch", l, c: ok.c * (l > 0.85 ? 0.35 : 1), h: ok.h })) : [];
  const all = [...schemes.map((s) => `/* ${s.name} */\n${s.colors.map((x, i) => `--${s.id}-${i + 1}: ${x};`).join("\n")}`), `/* Monochromatic */\n${mono.map((x, i) => `--mono-${i + 1}: ${x};`).join("\n")}`].join("\n\n");

  const row = (name: string, desc: string, colors: string[]) => (
    <ToolPanel key={name} title={name} actions={<span className="text-[11px] text-muted-foreground hidden sm:inline">{desc}</span>}>
      <div className="flex">
        {colors.map((x, i) => (
          <button key={i} type="button" onClick={() => setBase(x)} className="flex-1 h-20 flex items-end justify-center pb-1.5" style={{ background: x, color: readableText(parseColor(x)!) }} title="Use as base">
            <span className="font-mono text-[11px]">{x}</span>
          </button>
        ))}
      </div>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="color-harmony">
      <OptionsLayout
        options={
          <ToolPanel title="Base colour" bodyClassName="p-3 space-y-3">
            <ColorField value={base} onChange={setBase} />
            <p className="text-[11px] text-muted-foreground">Harmonies are computed in OKLCH, so every colour keeps the same perceived lightness and chroma. Click any swatch to make it the base.</p>
          </ToolPanel>
        }
      >
        {schemes.map((s) => row(s.name, s.desc, s.colors))}
        {mono.length > 0 && row("Monochromatic", "One hue, varied lightness.", mono)}
        {schemes.length > 0 && <CodeOutput title="Export" tabs={[{ id: "css", label: "CSS variables", code: all }, { id: "json", label: "JSON", code: JSON.stringify(Object.fromEntries([...schemes.map((s) => [s.id, s.colors]), ["monochromatic", mono]]), null, 2) }]} />}
      </OptionsLayout>
    </ToolLayout>
  );
}
