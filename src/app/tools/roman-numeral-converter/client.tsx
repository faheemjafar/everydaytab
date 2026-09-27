"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, StatusBadge, ToolPanel } from "@/components/tool";

const MAP: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

function toRoman(n: number) {
  let out = "";
  for (const [v, s] of MAP) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Strict parse: only canonical numerals are accepted (rejects IIII, IC, VX…). */
function fromRoman(s: string): number | null {
  const t = s.trim().toUpperCase();
  if (!/^[MDCLXVI]+$/.test(t)) return null;
  const vals: Record<string, number> = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
  let n = 0;
  for (let i = 0; i < t.length; i++) {
    const a = vals[t[i]];
    const b = vals[t[i + 1]] ?? 0;
    n += a < b ? -a : a;
  }
  return n > 0 && n < 4000 && toRoman(n) === t ? n : null;
}

function breakdown(n: number) {
  const parts: string[] = [];
  for (const [v, s] of MAP) while (n >= v) { parts.push(`${s} (${v})`); n -= v; }
  return parts;
}

const EXAMPLES = [1987, 2000, 2026, 3999, 14, 49];

export default function RomanNumeralConverter() {
  const [src, setSrc] = useState<{ from: "num" | "roman"; text: string }>({ from: "num", text: String(new Date().getFullYear()) });

  const num = src.from === "num" ? parseInt(src.text, 10) : fromRoman(src.text);
  const numOk = typeof num === "number" && Number.isInteger(num) && num > 0 && num < 4000;
  const roman = numOk ? toRoman(num as number) : "";
  const error =
    src.text.trim() === ""
      ? null
      : src.from === "num"
        ? !numOk ? "Roman numerals cover 1 to 3999." : null
        : num === null ? "Not a valid Roman numeral (standard subtractive form, e.g. XIV not XIIII)." : null;

  return (
    <ToolLayout toolId="roman-numeral-converter">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3.5 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="flex justify-between text-xs font-medium">Number <CopyButton text={numOk ? String(num) : ""} iconOnly /></span>
            <Input value={src.from === "num" ? src.text : numOk ? String(num) : ""} onChange={(e) => setSrc({ from: "num", text: e.target.value })} inputMode="numeric" className="h-12 text-xl font-mono tabular-nums" />
          </label>
          <label className="space-y-1.5">
            <span className="flex justify-between text-xs font-medium">Roman numeral <CopyButton text={roman} iconOnly /></span>
            <Input value={src.from === "roman" ? src.text : roman} onChange={(e) => setSrc({ from: "roman", text: e.target.value.toUpperCase() })} spellCheck={false} className="h-12 text-xl font-mono tracking-wider uppercase" />
          </label>
        </ToolPanel>
        {error && <p className="text-xs text-destructive px-0.5">{error}</p>}

        {numOk && (
          <ToolPanel title="Breakdown" actions={<StatusBadge>{roman.length} characters</StatusBadge>}>
            <div className="p-3.5 flex flex-wrap gap-1.5">
              {breakdown(num as number).map((p, i) => (
                <span key={i} className="inline-flex items-center h-7 px-2 rounded-md border border-border bg-muted/40 font-mono text-xs">{p}</span>
              ))}
            </div>
          </ToolPanel>
        )}

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((e) => (
            <button key={e} type="button" onClick={() => setSrc({ from: "num", text: String(e) })} className="h-7 px-2.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted font-mono">
              {e} = {toRoman(e)}
            </button>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
