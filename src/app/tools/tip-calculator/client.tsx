"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, OptionsLayout, Segmented, SliderField, Stat, StatGrid, ToolPanel, Toggle } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

type Round = "none" | "tip" | "total" | "person";

export default function TipCalculator() {
  const mounted = useMounted();
  const [bill, setBill] = useState("");
  const [pct, setPct] = useState(18);
  const [people, setPeople] = useState(1);
  const [round, setRound] = useState<Round>("none");
  const [preTax, setPreTax] = useState(false);
  const [tax, setTax] = useState("");

  const b = Math.max(0, parseFloat(bill) || 0);
  const t = preTax ? Math.max(0, parseFloat(tax) || 0) : 0;
  const base = preTax ? b - t : b;
  let tip = (base * pct) / 100;
  let total = b + tip;
  if (round === "tip") { tip = Math.round(tip); total = b + tip; }
  if (round === "total") { total = Math.ceil(total); tip = total - b; }
  if (round === "person") { total = Math.ceil(total / people) * people; tip = total - b; }
  const each = total / people;
  const money = (v: number) => (mounted ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2));

  const options = (
    <ToolPanel title="Bill" bodyClassName="p-3 space-y-4">
      <Field label="Bill amount" htmlFor="bill"><Input id="bill" value={bill} onChange={(e) => setBill(e.target.value)} inputMode="decimal" placeholder="0.00" className="h-11 text-lg font-mono" autoFocus /></Field>
      <div className="space-y-2">
        <SliderField label="Tip" value={pct} onChange={setPct} min={0} max={35} format={(v) => `${v}%`} />
        <div className="flex gap-1">{[10, 15, 18, 20, 25].map((p) => <button key={p} type="button" onClick={() => setPct(p)} className={`flex-1 h-7 rounded-md border text-xs ${pct === p ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{p}%</button>)}</div>
      </div>
      <SliderField label="Split between" value={people} onChange={setPeople} min={1} max={20} format={(v) => `${v} ${v === 1 ? "person" : "people"}`} />
      <Field label="Round up"><Segmented size="sm" value={round} onChange={setRound} options={[{ value: "none", label: "No" }, { value: "tip", label: "Tip" }, { value: "total", label: "Total" }, { value: "person", label: "Per person" }]} /></Field>
      <Toggle label="Tip on the pre-tax amount" checked={preTax} onChange={setPreTax} />
      {preTax && <Field label="Tax included in bill" htmlFor="tax"><Input id="tax" value={tax} onChange={(e) => setTax(e.target.value)} inputMode="decimal" className="font-mono" /></Field>}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="tip-calculator">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-6 text-center space-y-1">
          <p className="text-xs text-muted-foreground">{people > 1 ? "Each person pays" : "Total to pay"}</p>
          <p className="text-5xl font-semibold tabular-nums">{money(each)}</p>
          {people > 1 && <p className="text-sm text-muted-foreground tabular-nums">Tip {money(tip / people)} each</p>}
        </ToolPanel>
        <StatGrid>
          <Stat label="Tip" value={money(tip)} hint={b ? `${((tip / base) * 100).toFixed(1)}% effective` : undefined} />
          <Stat label="Total" value={money(total)} />
          <Stat label="Bill" value={money(b)} />
          <Stat label="People" value={String(people)} />
        </StatGrid>
        {b > 0 && (
          <ToolPanel title="Quick comparison">
            <table className="w-full text-[13px] tabular-nums">
              <thead className="text-[11px] text-muted-foreground"><tr><th className="text-left font-medium px-3.5 py-1.5">Tip %</th><th className="text-right font-medium px-3.5">Tip</th><th className="text-right font-medium px-3.5">Total</th>{people > 1 && <th className="text-right font-medium px-3.5">Each</th>}</tr></thead>
              <tbody className="divide-y divide-border">
                {[10, 12, 15, 18, 20, 22, 25].map((p) => { const tp = (base * p) / 100; return <tr key={p} className={p === pct ? "bg-accent/40" : ""}><td className="px-3.5 py-1.5">{p}%</td><td className="text-right px-3.5">{money(tp)}</td><td className="text-right px-3.5">{money(b + tp)}</td>{people > 1 && <td className="text-right px-3.5">{money((b + tp) / people)}</td>}</tr>; })}
              </tbody>
            </table>
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
