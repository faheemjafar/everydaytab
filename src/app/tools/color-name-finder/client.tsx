"use client";

import { useMemo, useState } from "react";
import { colorsNamed, parse } from "culori";
import tailwind from "tailwindcss/colors";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, StatusBadge, ToolPanel } from "@/components/tool";
import { deltaE, hex, parseColor, readableText, toOklch } from "@/lib/color";
import type { Color } from "culori";

const CSS = Object.keys(colorsNamed).map((name) => ({ name, value: parse(name)!, label: name }));
const TW = Object.entries(tailwind as unknown as Record<string, Record<string, string> | string>)
  .filter(([, v]) => typeof v === "object")
  .flatMap(([family, shades]) => Object.entries(shades as Record<string, string>).map(([shade, v]) => ({ name: `${family}-${shade}`, value: parse(v)!, label: `${family}-${shade}` })))
  .filter((x) => x.value);

// OKLCH hue bands (degrees), calibrated on reference colours: red ≈ 29°, orange ≈ 70°, yellow ≈ 110°, green ≈ 142°, cyan ≈ 195°, blue ≈ 264°, purple ≈ 328°, pink ≈ 354°.
const HUES: [number, string][] = [[15, "pink"], [45, "red"], [85, "orange"], [100, "amber"], [120, "yellow"], [135, "yellow-green"], [175, "green"], [200, "teal"], [230, "cyan"], [272, "blue"], [295, "indigo"], [338, "purple"], [361, "pink"]];

/** Plain-English description from OKLCH: e.g. "dark, muted teal". */
function describe(c: Color) {
  const { l, c: ch, h } = toOklch(c);
  if (ch < 0.03) return l > 0.95 ? "white" : l < 0.18 ? "black" : l > 0.7 ? "light grey" : l < 0.4 ? "dark grey" : "grey";
  const hue = HUES.find(([max]) => (h ?? 0) < max)?.[1] ?? "red";
  const light = l > 0.85 ? "very light" : l > 0.7 ? "light" : l < 0.3 ? "very dark" : l < 0.45 ? "dark" : "";
  const sat = ch < 0.07 ? "muted" : ch > 0.18 ? "vivid" : "";
  const brownish = (hue === "orange" || hue === "amber") && l < 0.55 && ch < 0.15;
  return [light, sat, brownish ? "brown" : hue].filter(Boolean).join(" ");
}

function top(c: Color, list: typeof CSS, n: number) {
  return list.map((x) => ({ ...x, d: deltaE(c, x.value) })).sort((a, b) => a.d - b.d).slice(0, n);
}

const match = (d: number) => (d < 1 ? "Exact match" : d < 3 ? "Very close" : d < 6 ? "Close" : "Nearest");

export default function ColorNameFinder() {
  const [input, setInput] = useState("#3f51b5");
  const c = useMemo(() => parseColor(input), [input]);
  const css = c ? top(c, CSS, 6) : [];
  const tw = c ? top(c, TW, 6) : [];
  const h = c ? hex(c) : "#000000";

  const options = (
    <ToolPanel title="Colour" bodyClassName="p-3 space-y-3">
      <div className="flex gap-1.5">
        <input type="color" value={h} onChange={(e) => setInput(e.target.value)} aria-label="Pick colour" className="h-(--control-h) w-10 shrink-0 rounded-md border border-input bg-card p-0.5 cursor-pointer" />
        <Input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono" autoFocus aria-invalid={input.trim() && !c ? true : undefined} />
      </div>
      {input.trim() && !c && <p className="text-xs text-destructive">Unrecognised colour.</p>}
      <p className="text-[11px] text-muted-foreground">Accepts HEX, RGB, HSL, OKLCH or any CSS colour. Matching uses CIEDE2000 — how different colours look to people, not raw RGB distance.</p>
    </ToolPanel>
  );

  const list = (title: string, items: ReturnType<typeof top>, prefix = "") => (
    <ToolPanel title={title}>
      <ul className="divide-y divide-border">
        {items.map((x, i) => (
          <li key={x.name} className="group flex items-center gap-3 px-3.5 h-11">
            <span className="w-8 h-8 rounded-md border border-border shrink-0" style={{ background: hex(x.value) }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{prefix}{x.label}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{hex(x.value)} · ΔE {x.d.toFixed(1)}</p>
            </div>
            {i === 0 && <StatusBadge tone={x.d < 3 ? "success" : "neutral"}>{match(x.d)}</StatusBadge>}
            <CopyButton text={`${prefix}${x.label}`} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
          </li>
        ))}
      </ul>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="color-name-finder">
      <OptionsLayout options={options}>
        {c && (
          <>
            <ToolPanel bodyClassName="p-0">
              <div className="h-36 flex flex-col justify-end p-4" style={{ background: h, color: readableText(c) }}>
                <p className="text-3xl font-semibold capitalize">{css[0]?.name}</p>
                <p className="text-sm opacity-80">{describe(c)} · {h}</p>
              </div>
            </ToolPanel>
            <div className="grid gap-3 lg:grid-cols-2">
              {list("CSS named colours", css)}
              {list("Tailwind CSS palette", tw, "")}
            </div>
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
