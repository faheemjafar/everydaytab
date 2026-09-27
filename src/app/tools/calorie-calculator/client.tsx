"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { BodyFields, Field, OptionsLayout, Segmented, Stat, StatGrid, ToolAlert, ToolPanel, useBody } from "@/components/tool";

const ACTIVITY = [
  { f: 1.2, label: "Sedentary", hint: "Desk job, little exercise" },
  { f: 1.375, label: "Light", hint: "Exercise 1–3 days/week" },
  { f: 1.55, label: "Moderate", hint: "Exercise 3–5 days/week" },
  { f: 1.725, label: "Active", hint: "Hard exercise 6–7 days/week" },
  { f: 1.9, label: "Very active", hint: "Physical job + training" },
];
// kcal per day for a weekly change: 1 kg of body fat ≈ 7,700 kcal.
const GOALS = [
  { id: "-1", label: "Lose 1 kg/wk", d: -1100 },
  { id: "-0.5", label: "Lose 0.5 kg/wk", d: -550 },
  { id: "-0.25", label: "Lose 0.25 kg/wk", d: -275 },
  { id: "0", label: "Maintain", d: 0 },
  { id: "0.25", label: "Gain 0.25 kg/wk", d: 275 },
  { id: "0.5", label: "Gain 0.5 kg/wk", d: 550 },
];
const MACROS = { balanced: [30, 40, 30], lowcarb: [35, 25, 40], highprotein: [40, 35, 25], keto: [25, 5, 70] } as const;

export default function CalorieCalculator() {
  const { b, cm, kg, age } = useBody();
  const [act, setAct] = useState(1);
  const [goal, setGoal] = useState("0");
  const [fat, setFat] = useState("");
  const [split, setSplit] = useState<keyof typeof MACROS>("balanced");

  const bf = parseFloat(fat);
  // Katch–McArdle when body-fat % is known, otherwise Mifflin–St Jeor (most accurate general formula).
  const bmr = bf > 3 && bf < 70 ? 370 + 21.6 * kg * (1 - bf / 100) : 10 * kg + 6.25 * cm - 5 * age + (b.sex === "male" ? 5 : -161);
  const ok = Number.isFinite(bmr) && bmr > 500;
  const tdee = bmr * ACTIVITY[act].f;
  const g = GOALS.find((x) => x.id === goal)!;
  const target = tdee + g.d;
  const floor = b.sex === "male" ? 1500 : 1200;
  const [p, c, f] = MACROS[split];

  const options = (
    <ToolPanel title="You" bodyClassName="p-3 space-y-4">
      <BodyFields withSex withAge />
      <Field label="Activity" hint={ACTIVITY[act].hint}>
        <Segmented size="sm" value={String(act)} onChange={(v) => setAct(Number(v))} options={ACTIVITY.map((a, i) => ({ value: String(i), label: a.label }))} className="flex-wrap" />
      </Field>
      <Field label="Body fat % (optional)" hint="Enables the Katch–McArdle formula" htmlFor="bf"><Input id="bf" value={fat} onChange={(e) => setFat(e.target.value)} inputMode="decimal" className="w-24" /></Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="calorie-calculator">
      <OptionsLayout options={options}>
        {ok ? (
          <>
            <StatGrid>
              <Stat label="BMR" value={`${Math.round(bmr).toLocaleString()} kcal`} hint={bf > 3 ? "Katch–McArdle" : "Mifflin–St Jeor"} />
              <Stat label="Maintenance (TDEE)" value={`${Math.round(tdee).toLocaleString()} kcal`} hint={`× ${ACTIVITY[act].f} activity`} />
              <Stat label="Your target" value={`${Math.round(target).toLocaleString()} kcal`} hint={g.label} />
              <Stat label="Per week" value={`${Math.round(target * 7).toLocaleString()} kcal`} />
            </StatGrid>
            <ToolPanel title="Goal" bodyClassName="p-3">
              <Segmented size="sm" value={goal} onChange={setGoal} options={GOALS.map((x) => ({ value: x.id, label: x.label }))} className="flex-wrap" />
            </ToolPanel>
            {target < floor && <ToolAlert tone="warning">That&apos;s below {floor.toLocaleString()} kcal/day, generally the minimum without medical supervision. Choose a slower rate.</ToolAlert>}
            <ToolPanel title="Macronutrients" actions={<Segmented size="sm" value={split} onChange={setSplit} options={[{ value: "balanced", label: "Balanced" }, { value: "highprotein", label: "High protein" }, { value: "lowcarb", label: "Low carb" }, { value: "keto", label: "Keto" }]} />}>
              <div className="grid grid-cols-3 divide-x divide-border">
                {[["Protein", p, 4, "bg-sky-500"], ["Carbs", c, 4, "bg-amber-400"], ["Fat", f, 9, "bg-rose-400"]].map(([n, pct, kcal, col]) => (
                  <div key={String(n)} className="p-3.5 space-y-1.5">
                    <p className="text-xs text-muted-foreground">{n} · {pct}%</p>
                    <p className="text-2xl font-semibold tabular-nums">{Math.round((target * (pct as number)) / 100 / (kcal as number))} g</p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className={String(col)} style={{ width: `${pct}%`, height: "100%" }} /></div>
                  </div>
                ))}
              </div>
              <p className="px-3.5 pb-3 text-[11px] text-muted-foreground">Protein: {(Math.round((target * p) / 100 / 4) / kg).toFixed(1)} g per kg of body weight (1.6–2.2 g/kg supports muscle when losing fat).</p>
            </ToolPanel>
            <p className="text-[11px] text-muted-foreground">Estimates — individual metabolism varies by ±10–15%. Track your weight for 2–3 weeks and adjust. Not medical advice.</p>
          </>
        ) : (
          <ToolPanel bodyClassName="py-16 text-center text-sm text-muted-foreground">Enter your age, height and weight.</ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
