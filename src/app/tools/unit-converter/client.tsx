"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

type Unit = { name: string; symbol: string; factor?: number; to?: (v: number) => number; from?: (v: number) => number };
type Category = { label: string; units: Record<string, Unit> };

// Factors convert to the category's base unit (first entry).
const CATEGORIES: Record<string, Category> = {
  length: {
    label: "Length",
    units: {
      m: { name: "Metre", symbol: "m", factor: 1 },
      km: { name: "Kilometre", symbol: "km", factor: 1000 },
      cm: { name: "Centimetre", symbol: "cm", factor: 0.01 },
      mm: { name: "Millimetre", symbol: "mm", factor: 0.001 },
      um: { name: "Micrometre", symbol: "µm", factor: 1e-6 },
      mi: { name: "Mile", symbol: "mi", factor: 1609.344 },
      yd: { name: "Yard", symbol: "yd", factor: 0.9144 },
      ft: { name: "Foot", symbol: "ft", factor: 0.3048 },
      in: { name: "Inch", symbol: "in", factor: 0.0254 },
      nmi: { name: "Nautical mile", symbol: "nmi", factor: 1852 },
    },
  },
  weight: {
    label: "Weight",
    units: {
      kg: { name: "Kilogram", symbol: "kg", factor: 1 },
      g: { name: "Gram", symbol: "g", factor: 0.001 },
      mg: { name: "Milligram", symbol: "mg", factor: 1e-6 },
      t: { name: "Tonne", symbol: "t", factor: 1000 },
      lb: { name: "Pound", symbol: "lb", factor: 0.45359237 },
      oz: { name: "Ounce", symbol: "oz", factor: 0.028349523125 },
      st: { name: "Stone", symbol: "st", factor: 6.35029318 },
      ton: { name: "US ton", symbol: "ton", factor: 907.18474 },
    },
  },
  temperature: {
    label: "Temperature",
    units: {
      c: { name: "Celsius", symbol: "°C", to: (v) => v, from: (v) => v },
      f: { name: "Fahrenheit", symbol: "°F", to: (v) => ((v - 32) * 5) / 9, from: (v) => (v * 9) / 5 + 32 },
      k: { name: "Kelvin", symbol: "K", to: (v) => v - 273.15, from: (v) => v + 273.15 },
      r: { name: "Rankine", symbol: "°R", to: (v) => ((v - 491.67) * 5) / 9, from: (v) => ((v + 273.15) * 9) / 5 },
    },
  },
  area: {
    label: "Area",
    units: {
      m2: { name: "Square metre", symbol: "m²", factor: 1 },
      km2: { name: "Square kilometre", symbol: "km²", factor: 1e6 },
      cm2: { name: "Square centimetre", symbol: "cm²", factor: 1e-4 },
      ha: { name: "Hectare", symbol: "ha", factor: 1e4 },
      ac: { name: "Acre", symbol: "ac", factor: 4046.8564224 },
      ft2: { name: "Square foot", symbol: "ft²", factor: 0.09290304 },
      in2: { name: "Square inch", symbol: "in²", factor: 0.00064516 },
      mi2: { name: "Square mile", symbol: "mi²", factor: 2589988.110336 },
    },
  },
  volume: {
    label: "Volume",
    units: {
      l: { name: "Litre", symbol: "L", factor: 1 },
      ml: { name: "Millilitre", symbol: "mL", factor: 0.001 },
      m3: { name: "Cubic metre", symbol: "m³", factor: 1000 },
      gal: { name: "US gallon", symbol: "gal", factor: 3.785411784 },
      qt: { name: "US quart", symbol: "qt", factor: 0.946352946 },
      cup: { name: "US cup", symbol: "cup", factor: 0.2365882365 },
      floz: { name: "US fluid ounce", symbol: "fl oz", factor: 0.0295735295625 },
      tbsp: { name: "Tablespoon", symbol: "tbsp", factor: 0.01478676478125 },
      tsp: { name: "Teaspoon", symbol: "tsp", factor: 0.00492892159375 },
      ukgal: { name: "Imperial gallon", symbol: "imp gal", factor: 4.54609 },
    },
  },
  speed: {
    label: "Speed",
    units: {
      mps: { name: "Metre/second", symbol: "m/s", factor: 1 },
      kmh: { name: "Kilometre/hour", symbol: "km/h", factor: 1 / 3.6 },
      mph: { name: "Mile/hour", symbol: "mph", factor: 0.44704 },
      kn: { name: "Knot", symbol: "kn", factor: 1852 / 3600 },
      fps: { name: "Foot/second", symbol: "ft/s", factor: 0.3048 },
    },
  },
  time: {
    label: "Time",
    units: {
      s: { name: "Second", symbol: "s", factor: 1 },
      ms: { name: "Millisecond", symbol: "ms", factor: 0.001 },
      min: { name: "Minute", symbol: "min", factor: 60 },
      h: { name: "Hour", symbol: "h", factor: 3600 },
      d: { name: "Day", symbol: "d", factor: 86400 },
      wk: { name: "Week", symbol: "wk", factor: 604800 },
      mo: { name: "Month (avg)", symbol: "mo", factor: 2629746 },
      yr: { name: "Year (avg)", symbol: "yr", factor: 31556952 },
    },
  },
  data: {
    label: "Data",
    units: {
      B: { name: "Byte", symbol: "B", factor: 1 },
      bit: { name: "Bit", symbol: "bit", factor: 0.125 },
      kB: { name: "Kilobyte (1000)", symbol: "kB", factor: 1e3 },
      MB: { name: "Megabyte (1000²)", symbol: "MB", factor: 1e6 },
      GB: { name: "Gigabyte (1000³)", symbol: "GB", factor: 1e9 },
      TB: { name: "Terabyte (1000⁴)", symbol: "TB", factor: 1e12 },
      KiB: { name: "Kibibyte (1024)", symbol: "KiB", factor: 1024 },
      MiB: { name: "Mebibyte (1024²)", symbol: "MiB", factor: 1024 ** 2 },
      GiB: { name: "Gibibyte (1024³)", symbol: "GiB", factor: 1024 ** 3 },
      TiB: { name: "Tebibyte (1024⁴)", symbol: "TiB", factor: 1024 ** 4 },
    },
  },
  pressure: {
    label: "Pressure",
    units: {
      pa: { name: "Pascal", symbol: "Pa", factor: 1 },
      kpa: { name: "Kilopascal", symbol: "kPa", factor: 1000 },
      bar: { name: "Bar", symbol: "bar", factor: 1e5 },
      psi: { name: "PSI", symbol: "psi", factor: 6894.757293168 },
      atm: { name: "Atmosphere", symbol: "atm", factor: 101325 },
      mmhg: { name: "mmHg", symbol: "mmHg", factor: 133.322387415 },
    },
  },
  energy: {
    label: "Energy",
    units: {
      j: { name: "Joule", symbol: "J", factor: 1 },
      kj: { name: "Kilojoule", symbol: "kJ", factor: 1000 },
      cal: { name: "Calorie", symbol: "cal", factor: 4.184 },
      kcal: { name: "Kilocalorie", symbol: "kcal", factor: 4184 },
      wh: { name: "Watt-hour", symbol: "Wh", factor: 3600 },
      kwh: { name: "Kilowatt-hour", symbol: "kWh", factor: 3.6e6 },
      btu: { name: "BTU", symbol: "BTU", factor: 1055.05585262 },
    },
  },
  angle: {
    label: "Angle",
    units: {
      deg: { name: "Degree", symbol: "°", factor: 1 },
      rad: { name: "Radian", symbol: "rad", factor: 180 / Math.PI },
      grad: { name: "Gradian", symbol: "gon", factor: 0.9 },
      turn: { name: "Turn", symbol: "tr", factor: 360 },
      arcmin: { name: "Arcminute", symbol: "′", factor: 1 / 60 },
    },
  },
};
type CatKey = keyof typeof CATEGORIES;

function convert(v: number, from: Unit, to: Unit) {
  const base = from.to ? from.to(v) : v * (from.factor ?? 1);
  return to.from ? to.from(base) : base / (to.factor ?? 1);
}

/** Up to 10 significant digits, no float noise, scientific only for extremes. */
function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const a = Math.abs(n);
  if (a >= 1e15 || a < 1e-9) return n.toExponential(6).replace(/\.?0+e/, "e");
  return Number(n.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 10, useGrouping: true });
}

export default function UnitConverter() {
  const [cat, setCat] = useState<CatKey>("length");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");

  const units = CATEGORIES[cat].units;
  const num = parseFloat(value.replace(/,/g, ""));
  const result = Number.isFinite(num) ? convert(num, units[from], units[to]) : NaN;

  const all = useMemo(() => (Number.isFinite(num) ? Object.entries(units).map(([k, u]) => ({ k, u, v: convert(num, units[from], u) })) : []), [num, units, from]);

  const pickCat = (c: CatKey) => {
    const keys = Object.keys(CATEGORIES[c].units);
    setCat(c);
    setFrom(keys[0]);
    setTo(keys[1]);
  };

  const select = (val: string, set: (v: string) => void, id: string) => (
    <select id={id} value={val} onChange={(e) => set(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30">
      {Object.entries(units).map(([k, u]) => (
        <option key={k} value={k}>
          {u.name} ({u.symbol})
        </option>
      ))}
    </select>
  );

  const options = (
    <ToolPanel title="Category" bodyClassName="p-1.5">
      <div className="grid grid-cols-3 lg:grid-cols-1 gap-0.5">
        {(Object.keys(CATEGORIES) as CatKey[]).map((c) => (
          <button key={c} type="button" onClick={() => pickCat(c)} className={cn("h-8 px-2.5 rounded-md text-left text-[13px] transition-colors", c === cat ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {CATEGORIES[c].label}
          </button>
        ))}
      </div>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="unit-converter">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-3.5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] items-end">
            <div className="space-y-1.5">
              <label htmlFor="uv" className="text-xs font-medium">From</label>
              <Input id="uv" value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className="h-12 text-xl font-mono tabular-nums" autoFocus />
              {select(from, setFrom, "uf")}
            </div>
            <Button variant="outline" size="icon" onClick={() => { setFrom(to); setTo(from); }} aria-label="Swap units" className="justify-self-center mb-11">
              <ArrowLeftRight />
            </Button>
            <div className="space-y-1.5">
              <span className="text-xs font-medium">To</span>
              <div className="flex items-center h-12 px-3 rounded-md border border-border bg-muted/40 text-xl font-mono tabular-nums">
                <span className="flex-1 truncate">{fmt(result)}</span>
                <CopyButton text={Number.isFinite(result) ? String(Number(result.toPrecision(12))) : ""} iconOnly />
              </div>
              {select(to, setTo, "ut")}
            </div>
          </div>
          {Number.isFinite(result) && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-mono text-foreground">{fmt(num)} {units[from].symbol}</span> = <span className="font-mono text-foreground">{fmt(result)} {units[to].symbol}</span>
            </p>
          )}
        </ToolPanel>

        {all.length > 0 && (
          <ToolPanel title={`${fmt(num)} ${units[from].symbol} in every unit`}>
            <ul className="grid sm:grid-cols-2 divide-y divide-border sm:[&>li:nth-child(odd)]:border-r sm:[&>li]:border-border">
              {all.map(({ k, u, v }) => (
                <li key={k} className={cn("group flex items-center gap-3 px-3.5 h-10", k === to && "bg-accent/40")}>
                  <button type="button" onClick={() => setTo(k)} className="flex-1 min-w-0 text-left">
                    <span className="block font-mono text-[13px] tabular-nums truncate">{fmt(v)}</span>
                  </button>
                  <span className="text-xs text-muted-foreground truncate">{u.name}</span>
                  <CopyButton text={String(Number(v.toPrecision(12)))} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                </li>
              ))}
            </ul>
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
