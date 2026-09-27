"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, ToolPanel } from "@/components/tool";

const SCALES = {
  c: { name: "Celsius", symbol: "°C", toC: (v: number) => v, fromC: (c: number) => c },
  f: { name: "Fahrenheit", symbol: "°F", toC: (v: number) => ((v - 32) * 5) / 9, fromC: (c: number) => (c * 9) / 5 + 32 },
  k: { name: "Kelvin", symbol: "K", toC: (v: number) => v - 273.15, fromC: (c: number) => c + 273.15 },
  r: { name: "Rankine", symbol: "°R", toC: (v: number) => ((v - 491.67) * 5) / 9, fromC: (c: number) => ((c + 273.15) * 9) / 5 },
} as const;
type Scale = keyof typeof SCALES;

const REFERENCES: [string, number][] = [
  ["Absolute zero", -273.15],
  ["Water freezes", 0],
  ["Room temperature", 21],
  ["Body temperature", 37],
  ["Water boils (sea level)", 100],
  ["Oven, moderate", 180],
];

const fmt = (n: number) => (Number.isFinite(n) ? String(Number(n.toFixed(2))) : "");

export default function TemperatureConverter() {
  // Store the edited field verbatim; derive the others from it.
  const [source, setSource] = useState<{ scale: Scale; text: string }>({ scale: "c", text: "20" });
  const n = parseFloat(source.text);
  const celsius = Number.isFinite(n) ? SCALES[source.scale].toC(n) : NaN;
  const belowZero = Number.isFinite(celsius) && celsius < -273.15;

  return (
    <ToolLayout toolId="temperature-converter">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(SCALES) as Scale[]).map((s) => {
            const value = s === source.scale ? source.text : fmt(SCALES[s].fromC(celsius));
            return (
              <label key={s} className="space-y-1.5">
                <span className="flex items-center justify-between text-xs font-medium">
                  {SCALES[s].name}
                  <CopyButton text={value} iconOnly />
                </span>
                <div className="relative">
                  <Input value={value} onChange={(e) => setSource({ scale: s, text: e.target.value })} inputMode="decimal" className="h-12 pr-10 text-xl font-mono tabular-nums" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{SCALES[s].symbol}</span>
                </div>
              </label>
            );
          })}
        </ToolPanel>
        {belowZero && <p className="text-xs text-destructive px-0.5">That&apos;s below absolute zero (−273.15 °C) — physically impossible.</p>}

        <ToolPanel title="Reference points">
          <ul className="divide-y divide-border">
            {REFERENCES.map(([label, c]) => (
              <li key={label}>
                <button type="button" onClick={() => setSource({ scale: "c", text: String(c) })} className="w-full flex items-center gap-3 px-3.5 h-10 text-sm hover:bg-muted/60 text-left">
                  <span className="flex-1">{label}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {fmt(c)} °C · {fmt(SCALES.f.fromC(c))} °F · {fmt(SCALES.k.fromC(c))} K
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
