"use client";

import { useState } from "react";
import { Plus, Shuffle, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { CodeOutput, ColorField, Field, OptionsLayout, PreviewStage, Segmented, SliderField, ToolPanel } from "@/components/tool";

interface ColorStop {
  id: number;
  color: string;
  position: number;
}
type Kind = "linear" | "radial" | "conic";

const PRESETS: { name: string; stops: [string, number][]; angle: number }[] = [
  { name: "Aurora", stops: [["#14b8a6", 0], ["#6366f1", 100]], angle: 135 },
  { name: "Sunset", stops: [["#f97316", 0], ["#ec4899", 55], ["#8b5cf6", 100]], angle: 120 },
  { name: "Lagoon", stops: [["#22d3ee", 0], ["#0ea5e9", 50], ["#1e3a8a", 100]], angle: 160 },
  { name: "Peach", stops: [["#fde68a", 0], ["#fca5a5", 100]], angle: 90 },
  { name: "Mono", stops: [["#1c1917", 0], ["#57534e", 100]], angle: 180 },
];

let nextId = 10;
const randomHex = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;

export default function GradientStudio() {
  const [stops, setStops] = useState<ColorStop[]>([
    { id: 1, color: "#14b8a6", position: 0 },
    { id: 2, color: "#6366f1", position: 100 },
  ]);
  const [angle, setAngle] = useState(135);
  const [kind, setKind] = useState<Kind>("linear");

  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const list = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  const value = kind === "linear" ? `linear-gradient(${angle}deg, ${list})` : kind === "radial" ? `radial-gradient(circle at center, ${list})` : `conic-gradient(from ${angle}deg at center, ${list})`;

  const update = (id: number, patch: Partial<ColorStop>) => setStops((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const add = () => setStops((s) => [...s, { id: nextId++, color: randomHex(), position: 50 }]);
  const randomize = () => setStops((s) => s.map((x) => ({ ...x, color: randomHex() })));

  const tailwind =
    kind === "linear" && sorted.length <= 3
      ? `bg-[linear-gradient(${angle}deg,${sorted.map((s) => `${s.color}_${s.position}%`).join(",")})]`
      : `bg-[${value.replace(/\s+/g, "_")}]`;

  const options = (
    <>
      <ToolPanel title="Presets" bodyClassName="p-3 grid grid-cols-5 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            title={p.name}
            onClick={() => {
              setStops(p.stops.map(([color, position]) => ({ id: nextId++, color, position })));
              setAngle(p.angle);
            }}
            className="h-9 rounded-md border border-border"
            style={{ background: `linear-gradient(${p.angle}deg, ${p.stops.map(([c, pos]) => `${c} ${pos}%`).join(", ")})` }}
          />
        ))}
      </ToolPanel>
      <ToolPanel title="Gradient" bodyClassName="p-3 space-y-4">
        <Field label="Type">
          <Segmented
            size="sm"
            value={kind}
            onChange={setKind}
            options={[
              { value: "linear", label: "Linear" },
              { value: "radial", label: "Radial" },
              { value: "conic", label: "Conic" },
            ]}
          />
        </Field>
        {kind !== "radial" && <SliderField label="Angle" value={angle} onChange={setAngle} min={0} max={360} format={(v) => `${v}°`} />}
      </ToolPanel>
      <ToolPanel
        title={`Stops · ${stops.length}`}
        actions={
          <>
            <Button variant="ghost" size="icon-sm" onClick={randomize} aria-label="Randomise colours" title="Randomise colours">
              <Shuffle />
            </Button>
            <Button variant="ghost" size="sm" onClick={add} disabled={stops.length >= 8}>
              <Plus /> Add
            </Button>
          </>
        }
        bodyClassName="divide-y divide-border"
      >
        {sorted.map((s) => (
          <div key={s.id} className="p-3 space-y-2">
            <div className="flex items-end gap-2">
              <ColorField value={s.color} onChange={(c) => update(s.id, { color: c })} className="flex-1" />
              <Button variant="ghost" size="icon" onClick={() => setStops((x) => x.filter((y) => y.id !== s.id))} disabled={stops.length <= 2} aria-label="Remove stop" className="text-muted-foreground hover:text-destructive">
                <Trash2 />
              </Button>
            </div>
            <SliderField label="Position" value={s.position} onChange={(v) => update(s.id, { position: v })} min={0} max={100} format={(v) => `${v}%`} />
          </div>
        ))}
      </ToolPanel>
    </>
  );

  return (
    <ToolLayout toolId="gradient-studio">
      <OptionsLayout options={options}>
        <ToolPanel title="Preview">
          <PreviewStage background={value} className="min-h-[420px]">
            <span />
          </PreviewStage>
          {/* Stop positions bar */}
          <div className="relative h-6 mx-3 my-3 rounded-sm border border-border" style={{ background: `linear-gradient(90deg, ${list})` }}>
            {sorted.map((s) => (
              <span key={s.id} className="absolute -top-1 w-3 h-8 -ml-1.5 rounded-xs border-2 border-white shadow-float" style={{ left: `${s.position}%`, background: s.color }} />
            ))}
          </div>
        </ToolPanel>
        <CodeOutput
          tabs={[
            { id: "css", label: "CSS", code: `background: ${value};` },
            { id: "tw", label: "Tailwind", code: tailwind },
          ]}
        />
      </OptionsLayout>
    </ToolLayout>
  );
}
