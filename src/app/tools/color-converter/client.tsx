"use client";

import { useMemo, useState } from "react";
import { displayable } from "culori";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, StatusBadge, ToolPanel } from "@/components/tool";
import { colorName, contrast, formats, hex, parseColor, readableText, toOklch } from "@/lib/color";

const EXAMPLES = ["#0d9488", "rgb(99 102 241)", "hsl(340 82% 52%)", "oklch(70% 0.2 50)", "rebeccapurple", "lab(60% 40 -50)", "color(display-p3 1 0.2 0.1)"];

export default function ColorConverter() {
  const [input, setInput] = useState("#0d9488");
  const c = useMemo(() => parseColor(input), [input]);

  const fm = c ? formats(c) : [];
  const h = c ? hex(c) : "#000000";
  const ok = c ? toOklch(c) : null;
  const scale = ok ? [0.97, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.22, 0.15].map((l) => ({ l, hex: hex({ mode: "oklch", l, c: ok.c * (1 - Math.abs(l - 0.6) * 0.6), h: ok.h }) })) : [];

  const options = (
    <ToolPanel title="Colour" bodyClassName="p-3 space-y-3">
      <div className="h-28 rounded-md border border-border flex items-end p-2" style={{ background: c ? fm[0].value : "transparent" }}>
        {c && <span className="text-xs font-medium" style={{ color: readableText(c) }}>{colorName(c).exact ? "" : "≈ "}{colorName(c).name}</span>}
      </div>
      <div className="flex gap-1.5">
        <input type="color" value={h} onChange={(e) => setInput(e.target.value)} aria-label="Pick colour" className="h-(--control-h) w-10 shrink-0 rounded-md border border-input bg-card p-0.5 cursor-pointer" />
        <Input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono" aria-invalid={input.trim() && !c ? true : undefined} />
      </div>
      {input.trim() && !c && <p className="text-xs text-destructive">Unrecognised colour. Try hex, rgb(), hsl(), oklch(), lab() or a CSS name.</p>}
      {c && !displayable(c) && <StatusBadge tone="warning">Outside sRGB — shown gamut-mapped to {h}</StatusBadge>}
      <div className="flex flex-wrap gap-1">
        {EXAMPLES.map((e) => <button key={e} type="button" onClick={() => setInput(e)} className="h-6 px-2 rounded-sm border border-border font-mono text-[10.5px] text-muted-foreground hover:text-foreground">{e}</button>)}
      </div>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="color-converter">
      <OptionsLayout options={options}>
        {c && (
          <>
            <ToolPanel title="Formats">
              <dl className="grid md:grid-cols-2 md:[&>div:nth-child(odd)]:border-r divide-y divide-border">
                {fm.map((f) => (
                  <div key={f.id} className="group flex items-center gap-3 px-3.5 h-10 border-border">
                    <dt className="w-24 shrink-0 text-xs text-muted-foreground">{f.label}</dt>
                    <dd className="flex-1 font-mono text-[12.5px] truncate" title={f.value}>{f.value}</dd>
                    <CopyButton text={f.value} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                  </div>
                ))}
              </dl>
            </ToolPanel>
            <ToolPanel title="Contrast">
              <div className="grid grid-cols-2 divide-x divide-border">
                {["#ffffff", "#111111"].map((bg) => {
                  const r = contrast(c, bg);
                  return (
                    <div key={bg} className="flex items-center gap-3 p-3" style={{ background: bg, color: h }}>
                      <span className="text-lg font-semibold">Aa</span>
                      <span className="text-xs font-mono" style={{ color: bg === "#ffffff" ? "#444" : "#ccc" }}>{r.toFixed(2)}:1 on {bg === "#ffffff" ? "white" : "black"}</span>
                      <StatusBadge tone={r >= 4.5 ? "success" : r >= 3 ? "warning" : "error"} className="ml-auto">{r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA large" : "Fail"}</StatusBadge>
                    </div>
                  );
                })}
              </div>
            </ToolPanel>
            <ToolPanel title="Tints & shades (perceptual, OKLCH)" actions={<CopyButton getText={() => scale.map((s, i) => `--color-${[50, 100, 200, 300, 400, 500, 600, 700, 800, 900][i]}: ${s.hex};`).join("\n")} label="Copy as CSS vars" />}>
              <div className="flex">
                {scale.map((s, i) => (
                  <button key={s.l} type="button" onClick={() => setInput(s.hex)} className="group flex-1 h-16 flex flex-col items-center justify-end pb-1.5" style={{ background: s.hex, color: s.l > 0.6 ? "#111" : "#fff" }}>
                    <span className="text-[10px] font-medium">{[50, 100, 200, 300, 400, 500, 600, 700, 800, 900][i]}</span>
                    <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100">{s.hex}</span>
                  </button>
                ))}
              </div>
            </ToolPanel>
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
