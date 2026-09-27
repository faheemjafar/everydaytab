"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { CodeOutput, ColorField, Field, OptionsLayout, PreviewStage, Segmented, SliderField, ToolPanel, rgba } from "@/components/tool";

const BACKDROPS = {
  vivid: "linear-gradient(135deg, #6366f1 0%, #a855f7 45%, #ec4899 100%)",
  ocean: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 50%, #22c55e 100%)",
  sunset: "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #7c3aed 100%)",
  dark: "radial-gradient(circle at 30% 30%, #334155, #0f172a 70%)",
};
type Backdrop = keyof typeof BACKDROPS;

export default function GlassmorphismStudio() {
  const [transparency, setTransparency] = useState(0.15);
  const [blur, setBlur] = useState(12);
  const [outline, setOutline] = useState(0.25);
  const [saturation, setSaturation] = useState(160);
  const [radius, setRadius] = useState(16);
  const [color, setColor] = useState("#ffffff");
  const [backdrop, setBackdrop] = useState<Backdrop>("vivid");

  const filter = `blur(${blur}px) saturate(${saturation}%)`;
  const css = `background: ${rgba(color, transparency)};
backdrop-filter: ${filter};
-webkit-backdrop-filter: ${filter};
border: 1px solid ${rgba(color, outline)};
border-radius: ${radius}px;`;
  const tailwind = `bg-[${rgba(color, transparency).replace(/\s/g, "")}] backdrop-blur-[${blur}px] backdrop-saturate-[${saturation / 100}] border border-[${rgba(color, outline).replace(/\s/g, "")}] rounded-[${radius}px]`;

  const options = (
    <ToolPanel title="Glass" bodyClassName="p-3 space-y-4">
      <SliderField label="Transparency" value={transparency} onChange={setTransparency} min={0} max={1} step={0.01} format={(v) => v.toFixed(2)} />
      <SliderField label="Blur" value={blur} onChange={setBlur} min={0} max={40} format={(v) => `${v}px`} />
      <SliderField label="Saturation" value={saturation} onChange={setSaturation} min={50} max={250} step={5} format={(v) => `${v}%`} />
      <SliderField label="Outline" value={outline} onChange={setOutline} min={0} max={1} step={0.01} format={(v) => v.toFixed(2)} />
      <SliderField label="Corner radius" value={radius} onChange={setRadius} min={0} max={48} format={(v) => `${v}px`} />
      <ColorField label="Tint" value={color} onChange={setColor} />
      <Field label="Backdrop">
        <Segmented size="sm" value={backdrop} onChange={setBackdrop} options={(Object.keys(BACKDROPS) as Backdrop[]).map((b) => ({ value: b, label: b[0].toUpperCase() + b.slice(1) }))} />
      </Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="glassmorphism">
      <OptionsLayout options={options}>
        <ToolPanel title="Preview">
          <PreviewStage background={BACKDROPS[backdrop]} className="min-h-[420px] relative overflow-hidden">
            {/* Shapes behind the glass make the blur visible */}
            <span className="absolute w-40 h-40 rounded-full bg-yellow-300/80 top-10 left-[18%]" />
            <span className="absolute w-52 h-52 rounded-full bg-cyan-300/70 bottom-6 right-[16%]" />
            <div
              className="relative w-80 aspect-video flex flex-col items-center justify-center text-white"
              style={{ background: rgba(color, transparency), backdropFilter: filter, WebkitBackdropFilter: filter, border: `1px solid ${rgba(color, outline)}`, borderRadius: radius }}
            >
              <span className="text-xl font-semibold tracking-tight drop-shadow">Frosted glass</span>
              <span className="text-xs opacity-80 mt-1">backdrop-filter preview</span>
            </div>
          </PreviewStage>
        </ToolPanel>
        <CodeOutput
          tabs={[
            { id: "css", label: "CSS", code: css },
            { id: "tw", label: "Tailwind", code: tailwind },
          ]}
        />
      </OptionsLayout>
    </ToolLayout>
  );
}
