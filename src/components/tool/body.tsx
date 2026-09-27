"use client";

import { Input } from "@/components/ui/input";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { Field, Segmented } from "./fields";

/** Body measurements shared by the health calculators (saved locally, entered once). */
export interface Body { unit: "metric" | "imperial"; sex: "male" | "female"; age: string; cm: string; kg: string; ft: string; inch: string; lb: string }
const store = createLocalStore<Body>("body-measurements", { unit: "metric", sex: "female", age: "", cm: "", kg: "", ft: "", inch: "", lb: "" });

export function useBody() {
  const [b, setB] = useLocalStore(store);
  const cm = b.unit === "metric" ? parseFloat(b.cm) : ((parseFloat(b.ft) || 0) * 12 + (parseFloat(b.inch) || 0)) * 2.54;
  const kg = b.unit === "metric" ? parseFloat(b.kg) : (parseFloat(b.lb) || NaN) * 0.45359237;
  return { b, set: <K extends keyof Body>(k: K, v: Body[K]) => setB((x) => ({ ...x, [k]: v })), cm: cm > 0 ? cm : NaN, kg: kg > 0 ? kg : NaN, age: parseFloat(b.age) || NaN };
}

export function BodyFields({ withSex, withAge }: { withSex?: boolean; withAge?: boolean }) {
  const { b, set } = useBody();
  return (
    <div className="space-y-3">
      <Segmented size="sm" value={b.unit} onChange={(v) => set("unit", v)} options={[{ value: "metric", label: "Metric (cm, kg)" }, { value: "imperial", label: "US (ft, lb)" }]} />
      {(withSex || withAge) && (
        <div className="flex gap-2">
          {withSex && <Field label="Sex"><Segmented size="sm" value={b.sex} onChange={(v) => set("sex", v)} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} /></Field>}
          {withAge && <Field label="Age" htmlFor="b-age"><Input id="b-age" value={b.age} onChange={(e) => set("age", e.target.value)} inputMode="numeric" className="w-20" /></Field>}
        </div>
      )}
      {b.unit === "metric" ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Height (cm)" htmlFor="b-cm"><Input id="b-cm" value={b.cm} onChange={(e) => set("cm", e.target.value)} inputMode="decimal" /></Field>
          <Field label="Weight (kg)" htmlFor="b-kg"><Input id="b-kg" value={b.kg} onChange={(e) => set("kg", e.target.value)} inputMode="decimal" /></Field>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Feet" htmlFor="b-ft"><Input id="b-ft" value={b.ft} onChange={(e) => set("ft", e.target.value)} inputMode="numeric" /></Field>
          <Field label="Inches" htmlFor="b-in"><Input id="b-in" value={b.inch} onChange={(e) => set("inch", e.target.value)} inputMode="decimal" /></Field>
          <Field label="Pounds" htmlFor="b-lb"><Input id="b-lb" value={b.lb} onChange={(e) => set("lb", e.target.value)} inputMode="decimal" /></Field>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">Saved in this browser and shared with the other health calculators.</p>
    </div>
  );
}
