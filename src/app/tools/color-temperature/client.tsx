"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, SliderField, ToolPanel } from "@/components/tool";

/** Tanner Helland's blackbody approximation (1000–40000 K), accurate to within a few RGB units. */
function kelvinToRgb(k: number): [number, number, number] {
  const t = Math.min(40000, Math.max(1000, k)) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v)))) as [number, number, number];
}
const toHex = (rgb: number[]) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

const PRESETS: [number, string][] = [
  [1850, "Candle flame"], [2700, "Warm white LED / incandescent"], [3000, "Soft white"], [3500, "Halogen"], [4000, "Neutral / cool white"],
  [5000, "Horizon daylight (D50)"], [5600, "Photo flash / studio"], [6500, "Daylight (D65, sRGB white)"], [7500, "Overcast sky"], [10000, "Blue sky / shade"],
];

export default function ColorTemperature() {
  const [k, setK] = useState(6500);
  const rgb = kelvinToRgb(k);
  const hex = toHex(rgb);
  const mired = Math.round(1e6 / k);

  const options = (
    <ToolPanel title="Temperature" bodyClassName="p-3 space-y-4">
      <SliderField label="Kelvin" value={k} onChange={setK} min={1000} max={12000} step={50} format={(v) => `${v.toLocaleString()} K`} />
      <Input type="number" min={1000} max={40000} value={k} onChange={(e) => setK(Math.max(1000, Math.min(40000, Number(e.target.value) || 1000)))} className="font-mono" aria-label="Kelvin" />
      <div className="h-3 rounded-full" style={{ background: `linear-gradient(90deg, ${[1000, 2000, 3000, 4000, 5000, 6500, 8000, 10000, 12000].map((x) => toHex(kelvinToRgb(x))).join(", ")})` }} />
      <p className="text-[11px] text-muted-foreground">Approximates the colour of an ideal black-body radiator — useful for lighting, white balance and warm/cool UI tints.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="color-temperature">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-0">
          <div className="h-44 flex items-end justify-between p-4" style={{ background: hex }}>
            <span className="text-2xl font-semibold text-stone-900/80">{k.toLocaleString()} K</span>
            <span className="font-mono text-sm text-stone-900/70">{hex}</span>
          </div>
          <dl className="divide-y divide-border">
            {[["HEX", hex], ["RGB", `rgb(${rgb.join(", ")})`], ["Mired", `${mired} MK⁻¹`]].map(([a, b]) => (
              <div key={a} className="group flex items-center gap-3 px-3.5 h-10"><dt className="w-20 text-xs text-muted-foreground">{a}</dt><dd className="flex-1 font-mono text-[13px]">{b}</dd><CopyButton text={b} iconOnly /></div>
            ))}
          </dl>
        </ToolPanel>
        <ToolPanel title="Common light sources">
          <ul className="grid sm:grid-cols-2 divide-y divide-border">
            {PRESETS.map(([t, label]) => (
              <li key={t}>
                <button type="button" onClick={() => setK(t)} className="w-full flex items-center gap-3 px-3.5 h-10 text-left text-[13px] hover:bg-muted/60">
                  <span className="w-5 h-5 rounded-sm border border-border" style={{ background: toHex(kelvinToRgb(t)) }} />
                  <span className="w-16 font-mono text-xs">{t} K</span>
                  <span className="text-muted-foreground truncate">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
