"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CodeArea, CodeOutput, ColorField, DownloadButton, Field, FieldGrid, OptionsLayout, SliderField, StatusBadge, ToolPanel } from "@/components/tool";

const EXAMPLES: Record<string, string> = {
  Curve: "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80",
  Heart: "M100 170 C 20 110, 20 40, 70 40 C 90 40, 100 55, 100 65 C 100 55, 110 40, 130 40 C 180 40, 180 110, 100 170 Z",
  Star: "M100 15 L123 75 L188 75 L136 113 L156 175 L100 137 L44 175 L64 113 L12 75 L77 75 Z",
  Wave: "M0 100 Q 25 50, 50 100 T 100 100 T 150 100 T 200 100",
};

/** Extracts absolute-ish anchor points (M/L/C/S/Q/T endpoints) for the overlay. */
function anchors(d: string): [number, number][] {
  const pts: [number, number][] = [];
  const re = /([MLCSQTHVZmlcsqthvz])([^MLCSQTHVZmlcsqthvz]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const nums = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
    if (/[MLT]/.test(m[1])) for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    else if (m[1] === "C") for (let i = 4; i + 1 < nums.length; i += 6) pts.push([nums[i], nums[i + 1]]);
    else if (/[SQ]/.test(m[1])) for (let i = 2; i + 1 < nums.length; i += 4) pts.push([nums[i], nums[i + 1]]);
  }
  return pts;
}

export default function SVGPathEditor() {
  const [path, setPath] = useState(EXAMPLES.Curve);
  const [fillOn, setFillOn] = useState(false);
  const [fill, setFill] = useState("#99f6e4");
  const [stroke, setStroke] = useState("#0d9488");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [viewBox, setViewBox] = useState("0 0 200 200");
  const [showPoints, setShowPoints] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const valid = /^[\s,]*[Mm]/.test(path);

  const pts = anchors(path);
  const [, , vw, vh] = viewBox.split(/[\s,]+/).map(Number);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <path d="${path}" fill="${fillOn ? fill : "none"}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  const jsx = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <path d="${path}" fill="${fillOn ? fill : "none"}" stroke="${stroke}" strokeWidth={${strokeWidth}} strokeLinecap="round" strokeLinejoin="round" />
</svg>`;

  const options = (
    <ToolPanel title="Style" bodyClassName="p-3 space-y-4">
      <Field label="Examples">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(EXAMPLES).map(([k, v]) => (
            <Button key={k} variant="outline" size="sm" onClick={() => setPath(v)}>
              {k}
            </Button>
          ))}
        </div>
      </Field>
      <ColorField label="Stroke" value={stroke} onChange={setStroke} />
      <SliderField label="Stroke width" value={strokeWidth} onChange={setStrokeWidth} min={0} max={20} step={0.5} />
      <Field label="Fill" inline>
        <Switch checked={fillOn} onCheckedChange={setFillOn} />
      </Field>
      {fillOn && <ColorField value={fill} onChange={setFill} />}
      <Field label="viewBox" htmlFor="vb">
        <Input id="vb" value={viewBox} onChange={(e) => setViewBox(e.target.value)} className="font-mono" />
      </Field>
      <FieldGrid>
        <Field label="Anchor points" inline>
          <Switch checked={showPoints} onCheckedChange={setShowPoints} />
        </Field>
        <Field label="Grid" inline>
          <Switch checked={showGrid} onCheckedChange={setShowGrid} />
        </Field>
      </FieldGrid>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="svg-path">
      <OptionsLayout options={options}>
        <ToolPanel title="Path data" actions={valid ? <StatusBadge>{pts.length} points</StatusBadge> : <StatusBadge tone="error">Must start with M</StatusBadge>}>
          <CodeArea value={path} onChange={(e) => setPath(e.target.value)} minHeight={90} placeholder="M 10 10 L 100 100…" />
        </ToolPanel>
        <ToolPanel title="Preview" actions={<DownloadButton content={svg} filename="path.svg" mime="image/svg+xml" />}>
          <div className="p-4 flex items-center justify-center bg-muted/30">
            <svg viewBox={viewBox} className="w-full max-w-lg aspect-square bg-card rounded-sm border border-border" preserveAspectRatio="xMidYMid meet">
              {showGrid && vw > 0 && vh > 0 && (
                <g stroke="currentColor" className="text-border" strokeWidth={0.5}>
                  {Array.from({ length: Math.floor(vw / 10) + 1 }, (_, i) => (
                    <line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={vh} />
                  ))}
                  {Array.from({ length: Math.floor(vh / 10) + 1 }, (_, i) => (
                    <line key={`h${i}`} x1={0} y1={i * 10} x2={vw} y2={i * 10} />
                  ))}
                </g>
              )}
              <path d={path} fill={fillOn ? fill : "none"} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              {showPoints && pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={Math.max(1.5, (vw || 200) / 110)} className="fill-card stroke-primary" strokeWidth={1} />)}
            </svg>
          </div>
        </ToolPanel>
        <CodeOutput
          tabs={[
            { id: "svg", label: "SVG", code: svg },
            { id: "jsx", label: "JSX", code: jsx },
          ]}
        />
      </OptionsLayout>
    </ToolLayout>
  );
}
