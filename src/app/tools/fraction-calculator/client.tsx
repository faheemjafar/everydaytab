"use client";

import { useMemo, useState } from "react";
import { create, all, type Fraction } from "mathjs";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, Stat, StatGrid, ToolAlert, ToolPanel } from "@/components/tool";

const m = create(all, { number: "Fraction" });

/** Mixed numbers ("1 1/2" → "(1+1/2)", "-2 3/4" → "-(2+3/4)") and ×/÷ symbols. */
// Each written fraction is grouped, so "7/8 / 1/4" means 7/8 ÷ 1/4 (not ((7/8)/1)/4).
const normalise = (s: string) =>
  s
    .replace(/×/g, "*").replace(/÷/g, " div ").replace(/−/g, "-")
    .replace(/(^|[^\d/.])(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)/g, (_, pre, sign, w, n, d) => `${pre}${sign}(${w}+${n}/${d})`)
    .replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g, "($1/$2)")
    .replace(/ div /g, "/");

const EXAMPLES = ["1/2 + 3/4", "2 1/3 - 5/6", "3/4 * 2/5", "7/8 / 1/4", "(1/2 + 1/3) * 6/5", "0.375", "1.2 + 1/3"];

function parts(f: Fraction) {
  const sign = Number(f.s) < 0 ? "-" : "";
  const n = Number(f.n);
  const d = Number(f.d);
  const whole = Math.floor(n / d);
  const rem = n % d;
  return { sign, n, d, whole, rem, improper: d === 1 ? `${sign}${n}` : `${sign}${n}/${d}`, mixed: d === 1 ? `${sign}${n}` : whole ? `${sign}${whole}${rem ? ` ${rem}/${d}` : ""}` : `${sign}${rem}/${d}` };
}

function Big({ f }: { f: ReturnType<typeof parts> }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono">
      {f.sign && <span className="text-3xl">−</span>}
      {(f.whole > 0 || f.d === 1) && <span className="text-4xl">{f.d === 1 ? f.n : f.whole}</span>}
      {f.d !== 1 && f.rem > 0 && (
        <span className="inline-flex flex-col items-center text-2xl leading-none">
          <span>{f.rem}</span>
          <span className="w-full border-t-2 border-current my-1" />
          <span>{f.d}</span>
        </span>
      )}
    </span>
  );
}

export default function FractionCalculator() {
  const [expr, setExpr] = useState("1/2 + 3/4");
  const res = useMemo(() => {
    if (!expr.trim()) return null;
    try {
      const v = m.evaluate(normalise(expr));
      if (!m.isFraction(v)) return { error: "Result isn't a number." };
      return { f: v as Fraction };
    } catch (e) {
      return { error: (e as Error).message.replace(/\(char \d+\)/, "").trim() };
    }
  }, [expr]);

  const p = res && "f" in res ? parts(res.f!) : null;
  const dec = res && "f" in res ? Number(res.f!.valueOf()) : 0;

  return (
    <ToolLayout toolId="fraction-calculator">
      <div className="space-y-3 max-w-3xl">
        <ToolPanel bodyClassName="p-3.5 space-y-2">
          <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="e.g. 2 1/3 + 5/6" className="h-12 text-xl font-mono" spellCheck={false} autoFocus />
          <div className="flex flex-wrap gap-1">
            {EXAMPLES.map((e) => <button key={e} type="button" onClick={() => setExpr(e)} className="h-6 px-2 rounded-sm border border-border font-mono text-[11px] text-muted-foreground hover:text-foreground">{e}</button>)}
          </div>
          <p className="text-[11px] text-muted-foreground">Use / for fractions, a space for mixed numbers (2 1/3), and + − × ÷ or * /. Decimals are converted to exact fractions.</p>
        </ToolPanel>
        {res && "error" in res && <ToolAlert tone="error">{res.error}</ToolAlert>}
        {p && (
          <>
            <ToolPanel bodyClassName="p-6 flex items-center justify-center gap-4">
              <span className="text-muted-foreground text-2xl">=</span>
              <Big f={p} />
            </ToolPanel>
            <StatGrid>
              <Stat label="Simplified" value={p.improper} />
              <Stat label="Mixed number" value={p.mixed} />
              <Stat label="Decimal" value={Number.isInteger(dec) ? String(dec) : dec.toPrecision(12).replace(/0+$/, "")} />
              <Stat label="Percent" value={`${Number((dec * 100).toPrecision(10))}%`} />
            </StatGrid>
            <div className="flex gap-2">
              <CopyButton text={p.improper} label="Copy fraction" />
              <CopyButton text={p.mixed} label="Copy mixed" />
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
