"use client";

import { useState } from "react";
import { Dices } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, Field, OptionsLayout, Segmented, Stat, StatGrid, ToolAlert, ToolPanel, Toggle } from "@/components/tool";
import { randomInt, shuffle } from "@/lib/random";

const PRESETS: [string, number, number, number, boolean][] = [["Coin (0–1)", 0, 1, 1, true], ["Die (1–6)", 1, 6, 1, true], ["2 dice", 1, 6, 2, true], ["1–10", 1, 10, 1, true], ["1–100", 1, 100, 1, true], ["Lottery 6/49", 1, 49, 6, false], ["PIN (0000–9999)", 0, 9999, 1, true]];

export default function RandomNumberGenerator() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(false);
  const [sort, setSort] = useState<"none" | "asc" | "desc">("none");
  const [decimals, setDecimals] = useState("0");
  const [nums, setNums] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = (lo = Number(min), hi = Number(max), n = Number(count), uniq = unique) => {
    const d = Math.max(0, Math.min(6, Number(decimals) || 0));
    const f = 10 ** d;
    const a = Math.ceil(lo * f);
    const b = Math.floor(hi * f);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > b) return setError("Minimum must be less than or equal to maximum.");
    const k = Math.max(1, Math.min(10000, Math.floor(n) || 1));
    if (uniq && k > b - a + 1) return setError(`Only ${(b - a + 1).toLocaleString()} unique values exist in that range.`);
    setError(null);
    let out: number[];
    if (uniq && b - a + 1 <= 100000) out = shuffle(Array.from({ length: b - a + 1 }, (_, i) => a + i)).slice(0, k);
    else if (uniq) { const s = new Set<number>(); while (s.size < k) s.add(randomInt(a, b)); out = [...s]; }
    else out = Array.from({ length: k }, () => randomInt(a, b));
    out = out.map((x) => x / f);
    if (sort !== "none") out.sort((x, y) => (sort === "asc" ? x - y : y - x));
    setNums(out);
  };

  const sum = nums.reduce((s, x) => s + x, 0);
  const d = Number(decimals) || 0;

  const options = (
    <ToolPanel title="Range" bodyClassName="p-3 space-y-3" footer={<Button size="lg" onClick={() => generate()} className="w-full"><Dices /> Generate</Button>}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Min" htmlFor="rmin"><Input id="rmin" type="number" value={min} onChange={(e) => setMin(e.target.value)} className="font-mono" /></Field>
        <Field label="Max" htmlFor="rmax"><Input id="rmax" type="number" value={max} onChange={(e) => setMax(e.target.value)} className="font-mono" /></Field>
        <Field label="How many" htmlFor="rcount"><Input id="rcount" type="number" min={1} max={10000} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
        <Field label="Decimals" htmlFor="rdec"><Input id="rdec" type="number" min={0} max={6} value={decimals} onChange={(e) => setDecimals(e.target.value)} /></Field>
      </div>
      <Toggle label="No repeats" checked={unique} onChange={setUnique} />
      <Field label="Order"><Segmented size="sm" value={sort} onChange={setSort} options={[{ value: "none", label: "As drawn" }, { value: "asc", label: "Ascending" }, { value: "desc", label: "Descending" }]} /></Field>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map(([l, lo, hi, n, rep]) => (
          <button key={l} type="button" onClick={() => { setMin(String(lo)); setMax(String(hi)); setCount(String(n)); setUnique(!rep); setDecimals("0"); generate(lo, hi, n, !rep); }} className="h-6 px-2 rounded-sm border border-border text-[11px] text-muted-foreground hover:text-foreground">{l}</button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Uses the browser&apos;s cryptographic generator with rejection sampling, so every value is equally likely.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="random-number-generator">
      <OptionsLayout options={options}>
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
        {nums.length === 1 ? (
          <ToolPanel bodyClassName="py-12 flex flex-col items-center gap-3">
            <span className="text-7xl font-semibold tabular-nums">{nums[0].toFixed(d)}</span>
            <CopyButton text={nums[0].toFixed(d)} />
          </ToolPanel>
        ) : nums.length > 1 ? (
          <>
            <ToolPanel title={`${nums.length} numbers`} actions={<CopyButton text={nums.map((x) => x.toFixed(d)).join(", ")} label="Copy all" />}>
              <div className="p-3 flex flex-wrap gap-1.5 max-h-[420px] overflow-y-auto custom-scrollbar">
                {nums.map((x, i) => <span key={i} className="inline-flex items-center justify-center min-w-10 h-9 px-2 rounded-md border border-border font-mono text-sm tabular-nums">{x.toFixed(d)}</span>)}
              </div>
            </ToolPanel>
            <StatGrid>
              <Stat label="Sum" value={Number(sum.toFixed(d)).toLocaleString()} />
              <Stat label="Average" value={(sum / nums.length).toFixed(2)} />
              <Stat label="Lowest" value={Math.min(...nums).toFixed(d)} />
              <Stat label="Highest" value={Math.max(...nums).toFixed(d)} />
            </StatGrid>
          </>
        ) : (
          <ToolPanel bodyClassName="py-16 text-center text-sm text-muted-foreground">Set a range and press Generate.</ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
