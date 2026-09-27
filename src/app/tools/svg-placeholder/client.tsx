"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CodeOutput, ColorField, DownloadButton, Field, FieldGrid, OptionsLayout, SliderField, ToolPanel } from "@/components/tool";

const SIZES = [
  ["1200×630", 1200, 630],
  ["1920×1080", 1920, 1080],
  ["800×600", 800, 600],
  ["600×400", 600, 400],
  ["400×400", 400, 400],
  ["150×150", 150, 150],
] as const;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function SVGPlaceholderGenerator() {
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState("#e7e5e4");
  const [textColor, setTextColor] = useState("#78716c");
  const [fontSize, setFontSize] = useState(0);
  const [radius, setRadius] = useState(0);

  const label = text || `${width} × ${height}`;
  // Auto font size scales with the image when set to 0.
  const fs = fontSize || Math.max(10, Math.round(Math.min(width, height) / 8));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" rx="${radius}" fill="${bgColor}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fs}" font-weight="600" fill="${textColor}">${esc(label)}</text>
</svg>`;
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n\s*/g, ""))}`;
  const img = `<img src="${dataUri}" width="${width}" height="${height}" alt="" />`;

  const options = (
    <ToolPanel title="Placeholder" bodyClassName="p-3 space-y-4">
      <div className="flex flex-wrap gap-1">
        {SIZES.map(([l, w, h]) => (
          <button key={l} type="button" onClick={() => { setWidth(w); setHeight(h); }} className="h-6 px-2 rounded-sm border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted">
            {l}
          </button>
        ))}
      </div>
      <FieldGrid>
        <Field label="Width" htmlFor="pw">
          <Input id="pw" type="number" min={1} max={8000} value={width} onChange={(e) => setWidth(Math.max(1, Number(e.target.value) || 1))} />
        </Field>
        <Field label="Height" htmlFor="ph">
          <Input id="ph" type="number" min={1} max={8000} value={height} onChange={(e) => setHeight(Math.max(1, Number(e.target.value) || 1))} />
        </Field>
      </FieldGrid>
      <Field label="Text" hint="Blank shows the dimensions." htmlFor="pt">
        <Input id="pt" value={text} onChange={(e) => setText(e.target.value)} placeholder={`${width} × ${height}`} />
      </Field>
      <FieldGrid>
        <ColorField label="Background" value={bgColor} onChange={setBgColor} />
        <ColorField label="Text colour" value={textColor} onChange={setTextColor} />
      </FieldGrid>
      <SliderField label="Font size" value={fontSize} onChange={setFontSize} min={0} max={200} format={(v) => (v ? `${v}px` : `auto (${fs}px)`)} />
      <SliderField label="Corner radius" value={radius} onChange={setRadius} min={0} max={Math.round(Math.min(width, height) / 2)} format={(v) => `${v}px`} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="svg-placeholder">
      <OptionsLayout options={options}>
        <ToolPanel title="Preview" actions={<DownloadButton content={svg} filename={`placeholder-${width}x${height}.svg`} mime="image/svg+xml" />}>
          <div className="p-4 flex items-center justify-center min-h-80 bg-dots">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUri} alt={label} className="max-w-full max-h-[60vh]" />
          </div>
        </ToolPanel>
        <CodeOutput
          tabs={[
            { id: "svg", label: "SVG", code: svg },
            { id: "uri", label: "Data URI", code: dataUri },
            { id: "img", label: "<img>", code: img },
            { id: "css", label: "CSS", code: `background-image: url("${dataUri}");` },
          ]}
        />
      </OptionsLayout>
    </ToolLayout>
  );
}
