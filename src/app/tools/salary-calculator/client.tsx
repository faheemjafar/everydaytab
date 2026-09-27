"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, OptionsLayout, Segmented, SliderField, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

type Period = "hourly" | "daily" | "weekly" | "biweekly" | "semimonthly" | "monthly" | "annual";
const LABEL: Record<Period, string> = { hourly: "Hourly", daily: "Daily", weekly: "Weekly", biweekly: "Bi-weekly", semimonthly: "Semi-monthly", monthly: "Monthly", annual: "Annual" };
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "SAR", "PKR", "CAD", "AUD", "JPY", "CHF", "SGD"];

export default function SalaryCalculator() {
  const mounted = useMounted();
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<Period>("annual");
  const [hours, setHours] = useState(40);
  const [days, setDays] = useState(5);
  const [leave, setLeave] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [raise, setRaise] = useState(0);

  const weeks = 52 - leave / days;
  const hoursYear = hours * weeks;
  // Everything converts through the annual figure.
  const perYear: Record<Period, number> = { hourly: hoursYear, daily: days * weeks, weekly: weeks, biweekly: 26, semimonthly: 24, monthly: 12, annual: 1 };
  const annual = (parseFloat(amount) || 0) * perYear[period] * (1 + raise / 100);
  const money = (v: number) => (mounted ? new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(v) : v.toFixed(2));

  const options = (
    <ToolPanel title="Pay" bodyClassName="p-3 space-y-4">
      <div className="flex gap-1.5">
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Amount" className="h-11 text-lg font-mono" autoFocus aria-label="Amount" />
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-11 rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30" aria-label="Currency">{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <Field label="Per"><Segmented size="sm" value={period} onChange={setPeriod} options={(Object.keys(LABEL) as Period[]).map((p) => ({ value: p, label: LABEL[p] }))} className="flex-wrap" /></Field>
      <SliderField label="Hours per week" value={hours} onChange={setHours} min={1} max={80} />
      <SliderField label="Days per week" value={days} onChange={setDays} min={1} max={7} />
      <SliderField label="Unpaid days off per year" value={leave} onChange={setLeave} min={0} max={60} />
      <SliderField label="What if: raise" value={raise} onChange={setRaise} min={-20} max={50} format={(v) => `${v > 0 ? "+" : ""}${v}%`} />
      <p className="text-[11px] text-muted-foreground">Gross pay before tax. Bi-weekly = 26 pay periods, semi-monthly = 24.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="salary-calculator">
      <OptionsLayout options={options}>
        <ToolPanel title={raise ? `With ${raise > 0 ? "+" : ""}${raise}%` : "Equivalent pay"}>
          <dl className="divide-y divide-border">
            {(Object.keys(LABEL) as Period[]).map((p) => (
              <div key={p} className={`flex items-center justify-between px-3.5 h-12 ${p === period ? "bg-accent/40" : ""}`}>
                <dt className="text-[13px]">{LABEL[p]}</dt>
                <dd className="font-mono text-lg tabular-nums">{money(annual / perYear[p])}</dd>
              </div>
            ))}
          </dl>
        </ToolPanel>
        <p className="text-[11px] text-muted-foreground px-0.5">{Math.round(hoursYear).toLocaleString()} paid hours · {weeks.toFixed(1)} paid weeks per year.</p>
      </OptionsLayout>
    </ToolLayout>
  );
}
