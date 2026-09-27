"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

const num = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/,/g, "")));
const show = (v: number, d = 4) => (Number.isFinite(v) ? Number(v.toFixed(d)).toLocaleString(undefined, { maximumFractionDigits: d }) : "—");

type Calc = { id: string; parts: (string | 0 | 1)[]; unit?: string; compute: (a: number, b: number) => { value: number; suffix?: string; work: string } };

const CALCS: Calc[] = [
  { id: "of", parts: ["What is", 0, "% of", 1, "?"], compute: (a, b) => ({ value: (a / 100) * b, work: `${a} ÷ 100 × ${b}` }) },
  { id: "what-pct", parts: [0, "is what % of", 1, "?"], compute: (a, b) => ({ value: (a / b) * 100, suffix: "%", work: `${a} ÷ ${b} × 100` }) },
  { id: "of-what", parts: [0, "is", 1, "% of what?"], compute: (a, b) => ({ value: a / (b / 100), work: `${a} ÷ (${b} ÷ 100)` }) },
  { id: "change", parts: ["% change from", 0, "to", 1], compute: (a, b) => { const v = ((b - a) / Math.abs(a)) * 100; return { value: v, suffix: `% ${v >= 0 ? "increase" : "decrease"}`, work: `(${b} − ${a}) ÷ |${a}| × 100` }; } },
  { id: "inc", parts: ["Increase", 0, "by", 1, "%"], compute: (a, b) => ({ value: a * (1 + b / 100), work: `${a} × (1 + ${b} ÷ 100)` }) },
  { id: "dec", parts: ["Decrease", 0, "by", 1, "%"], compute: (a, b) => ({ value: a * (1 - b / 100), work: `${a} × (1 − ${b} ÷ 100)` }) },
  { id: "diff", parts: ["% difference between", 0, "and", 1], compute: (a, b) => ({ value: (Math.abs(a - b) / ((a + b) / 2)) * 100, suffix: "%", work: `|${a} − ${b}| ÷ ((${a} + ${b}) ÷ 2) × 100` }) },
  { id: "reverse", parts: ["Price", 0, "includes", 1, "% tax — before tax?"], compute: (a, b) => ({ value: a / (1 + b / 100), work: `${a} ÷ (1 + ${b} ÷ 100) · tax = ${show(a - a / (1 + b / 100), 2)}` }) },
];

export default function PercentageCalculator() {
  const [vals, setVals] = useState<Record<string, [string, string]>>({ of: ["15", "80"], "what-pct": ["", ""], "of-what": ["", ""], change: ["", ""], inc: ["", ""], dec: ["", ""], diff: ["", ""], reverse: ["", ""] });

  return (
    <ToolLayout toolId="percentage-calculator">
      <div className="grid gap-3 lg:grid-cols-2">
        {CALCS.map((c) => {
          const [sa, sb] = vals[c.id];
          const a = num(sa);
          const b = num(sb);
          const r = Number.isFinite(a) && Number.isFinite(b) ? c.compute(a, b) : null;
          const ok = r && Number.isFinite(r.value);
          const text = ok ? `${show(c.id === "change" ? Math.abs(r.value) : r.value)}${r.suffix ?? ""}` : "";
          return (
            <ToolPanel key={c.id} bodyClassName="p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 text-[14px]">
                {c.parts.map((p, i) =>
                  typeof p === "string" ? (
                    <span key={i}>{p}</span>
                  ) : (
                    <Input
                      key={i}
                      value={vals[c.id][p]}
                      onChange={(e) => setVals((v) => ({ ...v, [c.id]: (p === 0 ? [e.target.value, v[c.id][1]] : [v[c.id][0], e.target.value]) as [string, string] }))}
                      inputMode="decimal"
                      className="w-24 text-right font-mono"
                      aria-label={`${c.parts.filter((x) => typeof x === "string").join(" … ")} — value ${p + 1}`}
                    />
                  )
                )}
              </div>
              <div className={cn("flex items-center gap-2 rounded-md px-3 h-11", ok ? "bg-accent/40" : "bg-muted/40")}>
                <span className={cn("flex-1 font-mono text-lg tabular-nums", !ok && "text-muted-foreground text-sm")}>{ok ? `= ${text}` : r ? "Can't divide by zero" : "Enter both values"}</span>
                {ok && <CopyButton text={show(r.value)} iconOnly />}
              </div>
              {ok && <p className="text-[11px] text-muted-foreground font-mono">{r.work}</p>}
            </ToolPanel>
          );
        })}
      </div>
    </ToolLayout>
  );
}
