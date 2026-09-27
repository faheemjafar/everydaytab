"use client";

import { useMemo, useState } from "react";
import { interpolate } from "culori";
import { ToolLayout } from "@/components/tool-layout";
import { ColorField, CopyButton, Field, OptionsLayout, Segmented, SliderField, ToolPanel } from "@/components/tool";
import { hex, parseColor } from "@/lib/color";

type Space = "oklab" | "oklch" | "rgb" | "lab" | "hsl";
const SPACE_HINT: Record<Space, string> = {
  oklab: "Perceptually even — best default, avoids muddy midpoints.",
  oklch: "Keeps saturation; can travel around the hue wheel.",
  rgb: "Plain sRGB averaging, like paint programs — midpoints often look grey.",
  lab: "CIE Lab — perceptual but less uniform than OKLab.",
  hsl: "Hue-based; midpoints can pass through unrelated hues.",
};

export default function ColorMixer() {
  const [a, setA] = useState("#0d9488");
  const [b, setB] = useState("#f59e0b");
  const [ratio, setRatio] = useState(50);
  const [space, setSpace] = useState<Space>("oklab");
  const [steps, setSteps] = useState(7);

  const ca = parseColor(a);
  const cb = parseColor(b);
  const mix = useMemo(() => (ca && cb ? interpolate([ca, cb], space) : null), [ca, cb, space]);
  const result = mix ? hex(mix(ratio / 100)) : "";
  const scale = mix ? Array.from({ length: steps }, (_, i) => hex(mix(i / (steps - 1)))) : [];
  const css = `color-mix(in ${space}, ${a} ${100 - ratio}%, ${b} ${ratio}%)`;

  const options = (
    <ToolPanel title="Colours" bodyClassName="p-3 space-y-4">
      <ColorField label="Colour A" value={a} onChange={setA} />
      <ColorField label="Colour B" value={b} onChange={setB} />
      <SliderField label="Mix" value={ratio} onChange={setRatio} min={0} max={100} format={(v) => `${100 - v}% A · ${v}% B`} />
      <Field label="Colour space" hint={SPACE_HINT[space]}>
        <Segmented size="sm" value={space} onChange={setSpace} options={(Object.keys(SPACE_HINT) as Space[]).map((s) => ({ value: s, label: s.toUpperCase() }))} />
      </Field>
      <SliderField label="Gradient steps" value={steps} onChange={setSteps} min={3} max={15} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="color-mixer">
      <OptionsLayout options={options}>
        {result && (
          <>
            <ToolPanel bodyClassName="p-0">
              <div className="grid grid-cols-[1fr_2fr_1fr] h-40">
                <div style={{ background: a }} />
                <div className="flex items-end justify-center pb-3" style={{ background: result }}><span className="rounded bg-black/40 px-2 py-0.5 font-mono text-sm text-white">{result}</span></div>
                <div style={{ background: b }} />
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 border-t border-border">
                <code className="flex-1 font-mono text-[12.5px] truncate">{css}</code>
                <CopyButton text={result} label="Copy hex" />
                <CopyButton text={css} label="Copy CSS" />
              </div>
            </ToolPanel>
            <ToolPanel title="Scale" actions={<CopyButton getText={() => scale.join("\n")} label="Copy all" />}>
              <div className="flex">
                {scale.map((s, i) => (
                  <button key={i} type="button" onClick={() => setRatio(Math.round((i / (steps - 1)) * 100))} className="group flex-1 h-20 flex items-end justify-center pb-1.5" style={{ background: s }} title={s}>
                    <span className="text-[10px] font-mono rounded bg-black/40 px-1 text-white opacity-0 group-hover:opacity-100">{s}</span>
                  </button>
                ))}
              </div>
            </ToolPanel>
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
