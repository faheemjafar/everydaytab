"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceGrid, CopyButton, Field, OptionsLayout, ToolPanel } from "@/components/tool";

const PRESETS = [
  { label: "Widescreen", ratio: "16:9" },
  { label: "Standard", ratio: "4:3" },
  { label: "Photo", ratio: "3:2" },
  { label: "Square", ratio: "1:1" },
  { label: "Vertical video", ratio: "9:16" },
  { label: "Ultrawide", ratio: "21:9" },
  { label: "Portrait photo", ratio: "4:5" },
  { label: "Cinema", ratio: "2.39:1" },
];

const WIDTHS = [7680, 3840, 2560, 1920, 1600, 1280, 1080, 854, 640];

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** Simplifies w:h; falls back to a decimal ratio when the integers are awkward. */
function simplify(w: number, h: number) {
  if (!w || !h) return null;
  const rw = Math.round(w);
  const rh = Math.round(h);
  const g = gcd(rw, rh);
  const a = rw / g;
  const b = rh / g;
  const decimal = w / h;
  return { exact: `${a}:${b}`, decimal: decimal.toFixed(decimal >= 1 ? 3 : 4).replace(/\.?0+$/, ""), nice: a <= 64 && b <= 64 };
}

export default function AspectRatioCalculator() {
  const [ratioW, setRatioW] = useState("16");
  const [ratioH, setRatioH] = useState("9");
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");

  const rw = parseFloat(ratioW);
  const rh = parseFloat(ratioH);
  const validRatio = rw > 0 && rh > 0;

  const onWidth = (v: string) => {
    setWidth(v);
    const n = parseFloat(v);
    if (validRatio && n > 0) setHeight(String(Math.round((n * rh) / rw)));
  };
  const onHeight = (v: string) => {
    setHeight(v);
    const n = parseFloat(v);
    if (validRatio && n > 0) setWidth(String(Math.round((n * rw) / rh)));
  };
  const setRatio = (a: string, b: string) => {
    setRatioW(a);
    setRatioH(b);
    const n = parseFloat(width);
    const x = parseFloat(a);
    const y = parseFloat(b);
    if (n > 0 && x > 0 && y > 0) setHeight(String(Math.round((n * y) / x)));
  };

  const fromDims = simplify(parseFloat(width), parseFloat(height));
  const matchesRatio = validRatio && fromDims && Math.abs(parseFloat(width) / parseFloat(height) - rw / rh) < 0.005;

  const options = (
    <ToolPanel title="Calculate" bodyClassName="p-3 space-y-4">
      <Field label="Ratio">
        <div className="flex items-center gap-1.5">
          <Input type="number" min={0} step="any" value={ratioW} onChange={(e) => setRatio(e.target.value, ratioH)} className="text-center font-mono" aria-label="Ratio width" />
          <span className="text-muted-foreground">:</span>
          <Input type="number" min={0} step="any" value={ratioH} onChange={(e) => setRatio(ratioW, e.target.value)} className="text-center font-mono" aria-label="Ratio height" />
          <Button variant="ghost" size="icon" onClick={() => { setRatio(ratioH, ratioW); }} aria-label="Swap orientation" title="Swap orientation">
            <ArrowLeftRight />
          </Button>
        </div>
      </Field>
      <Field label="Width (px)" htmlFor="w">
        <div className="flex gap-1.5">
          <Input id="w" type="number" min={0} value={width} onChange={(e) => onWidth(e.target.value)} className="font-mono" />
          <CopyButton text={width} iconOnly />
        </div>
      </Field>
      <Field label="Height (px)" htmlFor="h">
        <div className="flex gap-1.5">
          <Input id="h" type="number" min={0} value={height} onChange={(e) => onHeight(e.target.value)} className="font-mono" />
          <CopyButton text={height} iconOnly />
        </div>
      </Field>
      {fromDims && !matchesRatio && (
        <button type="button" onClick={() => { const [a, b] = fromDims.exact.split(":"); setRatioW(a); setRatioH(b); }} className="w-full text-left rounded-md border border-border px-2.5 py-2 text-xs hover:bg-muted">
          {width} × {height} is <strong className="font-mono">{fromDims.nice ? fromDims.exact : `${fromDims.decimal}:1`}</strong> — use this ratio
        </button>
      )}
      <p className="text-[11px] text-muted-foreground">Change width or height and the other updates to keep the ratio.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="aspect-ratio">
      <OptionsLayout options={options}>
        <ToolPanel title="Presets" bodyClassName="p-3">
          <ChoiceGrid
            cols={4}
            value={`${ratioW}:${ratioH}`}
            onChange={(r) => { const [a, b] = r.split(":"); setRatio(a, b); }}
            options={PRESETS.map((p) => ({ value: p.ratio, label: p.ratio, hint: p.label }))}
          />
        </ToolPanel>

        <div className="grid gap-3 md:grid-cols-2">
          <ToolPanel title="Preview" bodyClassName="p-6 flex items-center justify-center min-h-64 bg-dots">
            {validRatio && (
              <div
                className="w-full rounded-md border border-primary/40 bg-accent text-accent-foreground flex flex-col items-center justify-center gap-0.5"
                style={{ aspectRatio: `${rw} / ${rh}`, maxWidth: rw >= rh ? 320 : 320 * (rw / rh), maxHeight: 260 }}
              >
                <span className="text-xl font-semibold font-mono">{ratioW}:{ratioH}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{width} × {height}</span>
              </div>
            )}
          </ToolPanel>

          <ToolPanel title={`Common sizes at ${ratioW}:${ratioH}`}>
            <ul className="divide-y divide-border max-h-72 overflow-y-auto custom-scrollbar">
              {validRatio &&
                WIDTHS.map((w) => {
                  const long = rw >= rh ? w : Math.round((w * rw) / rh);
                  const W = rw >= rh ? long : Math.round((w * rw) / rh);
                  const H = rw >= rh ? Math.round((w * rh) / rw) : w;
                  const label = `${W} × ${H}`;
                  return (
                    <li key={w} className="group flex items-center gap-3 px-3.5 h-9 text-sm">
                      <button type="button" onClick={() => { setWidth(String(W)); setHeight(String(H)); }} className="flex-1 text-left font-mono tabular-nums hover:text-primary">
                        {label}
                      </button>
                      <CopyButton text={label} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                    </li>
                  );
                })}
            </ul>
          </ToolPanel>
        </div>

        <ToolPanel title="CSS" actions={<CopyButton text={`aspect-ratio: ${ratioW} / ${ratioH};`} />}>
          <pre className="px-3.5 py-3 font-mono text-[12.5px]">aspect-ratio: {ratioW} / {ratioH};</pre>
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
