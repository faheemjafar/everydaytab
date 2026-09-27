"use client";

import { useMemo, useRef, useState } from "react";
import { all, create, type MathJsInstance } from "mathjs";
import { Delete, History, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { CopyButton, Segmented, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

type Angle = "rad" | "deg";

// BigNumber arithmetic: 0.1 + 0.2 = 0.3, and large integers stay exact.
function makeMath(angle: Angle): MathJsInstance {
  const m = create(all, { number: "BigNumber", precision: 64 });
  if (angle === "deg") {
    const toRad = (x: unknown) => m.multiply(x as never, m.divide(m.pi, 180) as never);
    const toDeg = (x: unknown) => m.multiply(x as never, m.divide(180, m.pi) as never);
    const base = { sin: m.sin, cos: m.cos, tan: m.tan, asin: m.asin, acos: m.acos, atan: m.atan };
    m.import(
      {
        sin: (x: unknown) => (m.isUnit(x) ? base.sin(x as never) : base.sin(toRad(x) as never)),
        cos: (x: unknown) => (m.isUnit(x) ? base.cos(x as never) : base.cos(toRad(x) as never)),
        tan: (x: unknown) => (m.isUnit(x) ? base.tan(x as never) : base.tan(toRad(x) as never)),
        asin: (x: unknown) => toDeg(base.asin(x as never)),
        acos: (x: unknown) => toDeg(base.acos(x as never)),
        atan: (x: unknown) => toDeg(base.atan(x as never)),
      },
      { override: true }
    );
  }
  return m;
}
const MATH = { rad: makeMath("rad"), deg: makeMath("deg") };

/** Friendlier syntax: ×, ÷, −, "12% of 200", "√9", "π". */
function normalise(expr: string) {
  return expr
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "pi").replace(/√\s*\(/g, "sqrt(").replace(/√\s*([\d.]+)/g, "sqrt($1)")
    .replace(/([\d.]+)\s*%\s*of\s*/gi, "($1/100)*");
}

function fmt(m: MathJsInstance, v: unknown) {
  if (typeof v === "function") return "function";
  // Snap BigNumber residue from trig (cos(90°) ≈ 1e-64) to zero.
  if ((m.isBigNumber(v) || typeof v === "number") && v !== 0 && Math.abs(m.number(v as never) as number) < 1e-30) return "0";
  return m.format(v as never, { precision: 14, lowerExp: -9, upperExp: 21 });
}

interface Line { expr: string; result: string }

const SCI = ["sin(", "cos(", "tan(", "log(", "ln(", "√(", "^", "!", "(", ")", "π", "e"];
const PAD: string[][] = [
  ["C", "⌫", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["ans", "0", ".", "="],
];

export default function Calculator() {
  const [expr, setExpr] = useState("");
  const [angle, setAngle] = useState<Angle>("deg");
  const [sci, setSci] = useState(true);
  const [history, setHistory] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // Variables (x = 3) and ans persist across evaluations.
  const [scope, setScope] = useState<Record<string, unknown>>({});

  const math = MATH[angle];
  // Live preview without committing variables: evaluate in a throwaway scope.
  const preview = useMemo(() => {
    const t = expr.trim();
    if (!t || /=\s*$/.test(t)) return "";
    try {
      const v = math.evaluate(normalise(t.replace(/\bln\(/g, "log(")), new Map(Object.entries(scope)));
      return v === undefined ? "" : fmt(math, v);
    } catch {
      return "";
    }
  }, [expr, math, scope]);

  const commit = () => {
    const t = expr.trim();
    if (!t) return;
    try {
      const map = new Map(Object.entries(scope));
      const v = math.evaluate(normalise(t.replace(/\bln\(/g, "log(")), map);
      const r = fmt(math, v);
      map.set("ans", v);
      setScope(Object.fromEntries(map));
      setHistory((h) => [{ expr: t, result: r }, ...h].slice(0, 50));
      setExpr(/^[a-z_]\w*\s*=/i.test(t) ? "" : r);
      setError(null);
    } catch (e) {
      setError((e as Error).message.replace(/\(char \d+\)/, "").trim());
    }
  };

  const press = (k: string) => {
    setError(null);
    if (k === "C") return setExpr("");
    if (k === "⌫") return setExpr((x) => x.slice(0, -1));
    if (k === "=") return commit();
    setExpr((x) => x + (k === "ln(" ? "ln(" : k));
    input.current?.focus();
  };

  return (
    <ToolLayout toolId="calculator">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,420px)_1fr] items-start">
        <ToolPanel
          title={<Segmented size="sm" value={sci ? "sci" : "basic"} onChange={(v) => setSci(v === "sci")} options={[{ value: "basic", label: "Basic" }, { value: "sci", label: "Scientific" }]} />}
          actions={<Segmented size="sm" value={angle} onChange={setAngle} options={[{ value: "deg", label: "DEG" }, { value: "rad", label: "RAD" }]} />}
          bodyClassName="p-3 space-y-3"
        >
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <input
              ref={input}
              value={expr}
              onChange={(e) => { setExpr(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") setExpr(""); }}
              placeholder="Type or tap — e.g. 12% of 250, sin(30), 5 km to mi"
              spellCheck={false}
              autoFocus
              aria-label="Expression"
              className="w-full bg-transparent text-right font-mono text-2xl outline-none placeholder:text-sm placeholder:text-muted-foreground"
            />
            <p className={cn("min-h-5 text-right font-mono text-sm", error ? "text-destructive" : "text-muted-foreground")}>{error ?? (preview && preview !== expr.trim() ? `= ${preview}` : "")}</p>
          </div>
          {sci && (
            <div className="grid grid-cols-6 gap-1.5">
              {SCI.map((k) => <Button key={k} variant="outline" size="sm" onClick={() => press(k)} className="font-mono">{k.replace("(", "")}</Button>)}
            </div>
          )}
          <div className="grid grid-cols-4 gap-1.5">
            {PAD.flat().map((k) => (
              <Button key={k} variant={k === "=" ? "default" : /[÷×−+%]/.test(k) ? "secondary" : "outline"} onClick={() => press(k)} className="h-12 text-lg font-mono" aria-label={k === "⌫" ? "Backspace" : k}>
                {k === "⌫" ? <Delete /> : k}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Enter evaluates; Esc clears. Supports variables (<code className="font-mono">r = 4</code>), <code className="font-mono">ans</code>, units (<code className="font-mono">60 mph to km/h</code>), fractions, factorials and exact decimals.</p>
        </ToolPanel>

        <ToolPanel title={<span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> History</span>} actions={history.length > 0 && <Button variant="ghost" size="icon-sm" onClick={() => setHistory([])} aria-label="Clear history"><Trash2 /></Button>}>
          {history.length ? (
            <ul className="divide-y divide-border max-h-[560px] overflow-y-auto custom-scrollbar">
              {history.map((h, i) => (
                <li key={i} className="group flex items-center gap-3 px-3.5 py-2">
                  <button type="button" onClick={() => setExpr(h.expr)} className="flex-1 min-w-0 text-left" title="Edit this expression">
                    <p className="font-mono text-xs text-muted-foreground truncate">{h.expr}</p>
                    <p className="font-mono text-base truncate">= {h.result}</p>
                  </button>
                  <CopyButton text={h.result} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3.5 py-10 text-center text-xs text-muted-foreground">Calculations appear here. Click one to edit it.</p>
          )}
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
