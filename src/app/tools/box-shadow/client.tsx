"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CodeOutput, ColorField, Field, FieldGrid, OptionsLayout, PreviewStage, SliderField, ToolPanel, rgba } from "@/components/tool";
import { cn } from "@/lib/utils";

interface Layer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  opacity: number;
  color: string;
  inset: boolean;
}

const layer = (p: Partial<Layer> = {}): Layer => ({ x: 0, y: 10, blur: 20, spread: -5, opacity: 0.1, color: "#000000", inset: false, ...p });

const PRESETS: Record<string, Layer[]> = {
  Soft: [layer()],
  Crisp: [layer({ y: 1, blur: 2, spread: 0, opacity: 0.08 }), layer({ y: 1, blur: 3, spread: 0, opacity: 0.1 })],
  Layered: [layer({ y: 1, blur: 1, spread: 0, opacity: 0.05 }), layer({ y: 4, blur: 8, spread: -2, opacity: 0.08 }), layer({ y: 16, blur: 32, spread: -8, opacity: 0.12 })],
  Floating: [layer({ y: 24, blur: 48, spread: -12, opacity: 0.25 })],
  Inset: [layer({ y: 2, blur: 6, spread: 0, opacity: 0.15, inset: true })],
  Glow: [layer({ y: 0, blur: 24, spread: 2, opacity: 0.6, color: "#14b8a6" })],
};

const toCss = (l: Layer) => `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${rgba(l.color, l.opacity)}`;

export default function BoxShadowStudio() {
  const [layers, setLayers] = useState<Layer[]>(PRESETS.Soft);
  const [active, setActive] = useState(0);
  const [radius, setRadius] = useState(16);
  const [boxColor, setBoxColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#f5f5f4");

  const cur = layers[Math.min(active, layers.length - 1)];
  const set = <K extends keyof Layer>(k: K, v: Layer[K]) => setLayers((ls) => ls.map((l, i) => (i === active ? { ...l, [k]: v } : l)));
  const shadow = layers.map(toCss).join(",\n    ");

  const css = `box-shadow:\n    ${shadow};\nborder-radius: ${radius}px;\nbackground-color: ${boxColor};`;
  const tailwind = `shadow-[${layers.map(toCss).join(",").replace(/\s+/g, "_")}] rounded-[${radius}px]`;

  const options = (
    <>
      <ToolPanel title="Presets" bodyClassName="p-3 flex flex-wrap gap-1.5">
        {Object.entries(PRESETS).map(([name, ls]) => (
          <Button key={name} variant="outline" size="sm" onClick={() => { setLayers(ls); setActive(0); }}>
            {name}
          </Button>
        ))}
      </ToolPanel>
      <ToolPanel
        title="Layers"
        actions={
          <Button variant="ghost" size="sm" onClick={() => { setLayers((ls) => [...ls, layer({ opacity: 0.08 })]); setActive(layers.length); }} disabled={layers.length >= 6}>
            <Plus /> Add
          </Button>
        }
        bodyClassName="p-3 space-y-4"
      >
        {layers.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {layers.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={cn("h-7 px-2.5 rounded-md text-xs font-medium border", i === active ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground")}
              >
                Layer {i + 1}
              </button>
            ))}
            <Button variant="ghost" size="icon-sm" onClick={() => { setLayers((ls) => ls.filter((_, i) => i !== active)); setActive(0); }} aria-label="Remove layer" className="text-muted-foreground hover:text-destructive ml-auto">
              <Trash2 />
            </Button>
          </div>
        )}
        <FieldGrid>
          <SliderField label="X offset" value={cur.x} onChange={(v) => set("x", v)} min={-100} max={100} format={(v) => `${v}px`} />
          <SliderField label="Y offset" value={cur.y} onChange={(v) => set("y", v)} min={-100} max={100} format={(v) => `${v}px`} />
          <SliderField label="Blur" value={cur.blur} onChange={(v) => set("blur", v)} min={0} max={120} format={(v) => `${v}px`} />
          <SliderField label="Spread" value={cur.spread} onChange={(v) => set("spread", v)} min={-60} max={60} format={(v) => `${v}px`} />
        </FieldGrid>
        <SliderField label="Opacity" value={cur.opacity} onChange={(v) => set("opacity", v)} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
        <ColorField label="Shadow colour" value={cur.color} onChange={(v) => set("color", v)} />
        <Field label="Inset" inline>
          <Switch checked={cur.inset} onCheckedChange={(v) => set("inset", v)} />
        </Field>
      </ToolPanel>
      <ToolPanel title="Box" bodyClassName="p-3 space-y-4">
        <SliderField label="Corner radius" value={radius} onChange={setRadius} min={0} max={64} format={(v) => `${v}px`} />
        <FieldGrid>
          <ColorField label="Box" value={boxColor} onChange={setBoxColor} />
          <ColorField label="Background" value={bgColor} onChange={setBgColor} />
        </FieldGrid>
      </ToolPanel>
    </>
  );

  return (
    <ToolLayout toolId="box-shadow">
      <OptionsLayout options={options}>
        <ToolPanel title="Preview">
          <PreviewStage background={bgColor} className="min-h-[420px]">
            <div className="w-56 h-56 flex items-center justify-center text-sm text-stone-400 transition-shadow" style={{ backgroundColor: boxColor, boxShadow: layers.map(toCss).join(", "), borderRadius: radius }}>
              {layers.length} layer{layers.length === 1 ? "" : "s"}
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
