"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Check, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ColorField, OptionsLayout, StatusBadge, ToolPanel, hexToRgbTuple } from "@/components/tool";
import { cn } from "@/lib/utils";

function luminance(hex: string) {
  const [r, g, b] = hexToRgbTuple(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratioOf = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/** Nudges `fg` lighter or darker until it hits `target` against `bg`. */
function suggest(fg: string, bg: string, target: number): string | null {
  const [r, g, b] = hexToRgbTuple(fg);
  const darker = luminance(bg) > 0.18;
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const mix = (c: number) => Math.round(darker ? c * (1 - t) : c + (255 - c) * t);
    const hex = `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    if (ratioOf(hex, bg) >= target) return hex;
  }
  return null;
}

const CHECKS = [
  { id: "aa", label: "AA · normal text", min: 4.5 },
  { id: "aa-large", label: "AA · large text & UI", min: 3 },
  { id: "aaa", label: "AAA · normal text", min: 7 },
  { id: "aaa-large", label: "AAA · large text", min: 4.5 },
];

export default function ColorContrastChecker() {
  const [foreground, setForeground] = useState("#1c1917");
  const [background, setBackground] = useState("#f5f5f4");

  const valid = /^#[0-9a-f]{6}$/i.test(foreground) && /^#[0-9a-f]{6}$/i.test(background);
  const ratio = useMemo(() => (valid ? ratioOf(foreground, background) : 1), [foreground, background, valid]);
  const aaFix = valid && ratio < 4.5 ? suggest(foreground, background, 4.5) : null;
  const aaaFix = valid && ratio < 7 ? suggest(foreground, background, 7) : null;

  const options = (
    <ToolPanel title="Colours" bodyClassName="p-3 space-y-4">
      <ColorField label="Text" value={foreground} onChange={setForeground} />
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => { setForeground(background); setBackground(foreground); }}>
          <ArrowUpDown /> Swap
        </Button>
      </div>
      <ColorField label="Background" value={background} onChange={setBackground} />
      {(aaFix || aaaFix) && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-medium">Suggested text colours</p>
          {[
            ["AA", aaFix],
            ["AAA", aaaFix],
          ].map(([lvl, hex]) =>
            hex ? (
              <button key={lvl} type="button" onClick={() => setForeground(hex)} className="flex items-center gap-2 w-full h-8 px-2 rounded-md border border-border hover:bg-muted text-xs">
                <span className="w-4 h-4 rounded-sm border border-border" style={{ background: hex }} />
                <code className="font-mono">{hex}</code>
                <span className="ml-auto text-muted-foreground">passes {lvl}</span>
              </button>
            ) : null
          )}
        </div>
      )}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="contrast-checker">
      <OptionsLayout options={options}>
        <ToolPanel title="Result" bodyClassName="p-0">
          <div className="grid sm:grid-cols-[200px_1fr] divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="flex flex-col items-center justify-center p-6 gap-1">
              <span className="text-5xl font-semibold tabular-nums tracking-tight">{ratio.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">contrast ratio : 1</span>
              <StatusBadge tone={ratio >= 7 ? "success" : ratio >= 4.5 ? "success" : ratio >= 3 ? "warning" : "error"} className="mt-2">
                {ratio >= 7 ? "Excellent" : ratio >= 4.5 ? "Good" : ratio >= 3 ? "Large text only" : "Fails"}
              </StatusBadge>
            </div>
            <ul className="divide-y divide-border">
              {CHECKS.map((c) => {
                const pass = ratio >= c.min;
                return (
                  <li key={c.id} className="flex items-center gap-3 px-4 h-11 text-sm">
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center", pass ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive")}>
                      {pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </span>
                    <span className="flex-1">{c.label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">≥ {c.min}:1</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </ToolPanel>

        <ToolPanel title="Preview">
          <div className="p-6 space-y-4" style={{ background, color: foreground }}>
            <p className="text-2xl font-semibold tracking-tight">Large heading text (24px)</p>
            <p className="text-base leading-relaxed">
              Body text at 16px. The quick brown fox jumps over the lazy dog. WCAG requires 4.5:1 for text like this to pass AA.
            </p>
            <p className="text-xs">Small print at 12px — hardest to read at low contrast.</p>
            <div className="flex gap-2">
              <span className="inline-flex items-center h-8 px-3 rounded-md border text-sm font-medium" style={{ borderColor: foreground }}>
                Outline button
              </span>
              <span className="inline-flex items-center h-8 px-3 rounded-md text-sm font-medium" style={{ background: foreground, color: background }}>
                Filled button
              </span>
            </div>
          </div>
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
