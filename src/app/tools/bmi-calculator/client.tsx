"use client";

import { ToolLayout } from "@/components/tool-layout";
import { BodyFields, OptionsLayout, Stat, StatGrid, StatusBadge, ToolPanel, useBody } from "@/components/tool";

const BANDS = [
  { max: 16, label: "Severely underweight", tone: "error" as const, color: "bg-sky-600" },
  { max: 18.5, label: "Underweight", tone: "warning" as const, color: "bg-sky-400" },
  { max: 25, label: "Healthy weight", tone: "success" as const, color: "bg-emerald-500" },
  { max: 30, label: "Overweight", tone: "warning" as const, color: "bg-amber-400" },
  { max: 35, label: "Obesity class I", tone: "error" as const, color: "bg-orange-500" },
  { max: 40, label: "Obesity class II", tone: "error" as const, color: "bg-red-500" },
  { max: Infinity, label: "Obesity class III", tone: "error" as const, color: "bg-red-700" },
];

export default function BMICalculator() {
  const { b, cm, kg } = useBody();
  const m = cm / 100;
  const bmi = kg / (m * m);
  const ok = Number.isFinite(bmi) && bmi > 5 && bmi < 100;
  const band = ok ? BANDS.find((x) => bmi < x.max)! : null;
  const inches = cm / 2.54;
  const over60 = Math.max(0, inches - 60);
  const imperial = b.unit === "imperial";
  const w = (kgv: number) => (imperial ? `${Math.round(kgv / 0.45359237)} lb` : `${kgv.toFixed(1)} kg`);
  const healthy = [18.5 * m * m, 24.9 * m * m];
  // Ideal-weight formulas (merged from Ideal Weight Calculator); defined for heights ≥ 5 ft.
  const male = b.sex === "male";
  const formulas: [string, number, string][] = [
    ["Devine (1974)", (male ? 50 : 45.5) + 2.3 * over60, "Most common in medicine (drug dosing)"],
    ["Robinson (1983)", (male ? 52 : 49) + (male ? 1.9 : 1.7) * over60, "Revision of Devine"],
    ["Miller (1983)", (male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * over60, "Tends to be highest for short people"],
    ["Hamwi (1964)", (male ? 48 : 45.5) + (male ? 2.7 : 2.2) * over60, "Classic nutrition formula"],
  ];
  const pos = ok ? Math.min(100, Math.max(0, ((bmi - 15) / (40 - 15)) * 100)) : 0;

  return (
    <ToolLayout toolId="bmi-calculator">
      <OptionsLayout options={<ToolPanel title="You" bodyClassName="p-3"><BodyFields withSex /></ToolPanel>}>
        {ok && band ? (
          <>
            <ToolPanel bodyClassName="p-5 space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-semibold tabular-nums">{bmi.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">kg/m²</span>
                <StatusBadge tone={band.tone} className="ml-auto">{band.label}</StatusBadge>
              </div>
              <div className="relative">
                <div className="flex h-2.5 rounded-full overflow-hidden">
                  {[[15, 18.5, "bg-sky-400"], [18.5, 25, "bg-emerald-500"], [25, 30, "bg-amber-400"], [30, 35, "bg-orange-500"], [35, 40, "bg-red-600"]].map(([a, z, c]) => <span key={String(a)} className={String(c)} style={{ width: `${(((z as number) - (a as number)) / 25) * 100}%` }} />)}
                </div>
                <span className="absolute -top-1 w-1 h-4.5 rounded-full bg-foreground ring-2 ring-card" style={{ left: `calc(${pos}% - 2px)` }} />
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground tabular-nums"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span></div>
              </div>
            </ToolPanel>
            <StatGrid>
              <Stat label="Healthy range" value={`${w(healthy[0])} – ${w(healthy[1])}`} hint="BMI 18.5–24.9" />
              <Stat label={bmi < 18.5 ? "To reach healthy" : bmi >= 25 ? "To reach healthy" : "Within range"} value={bmi < 18.5 ? `+${w(healthy[0] - kg)}` : bmi >= 25 ? `−${w(kg - healthy[1])}` : "✓"} />
              <Stat label="BMI Prime" value={(bmi / 25).toFixed(2)} hint="1.00 = upper healthy limit" />
              <Stat label="Ponderal index" value={(kg / m ** 3).toFixed(1)} hint="kg/m³" />
            </StatGrid>
            {inches >= 60 && (
              <ToolPanel title={`Ideal weight estimates (${male ? "male" : "female"})`}>
                <ul className="divide-y divide-border">
                  {formulas.map(([n, v, d]) => (
                    <li key={n} className="flex items-center gap-3 px-3.5 h-11">
                      <div className="flex-1 min-w-0"><p className="text-[13px]">{n}</p><p className="text-[11px] text-muted-foreground">{d}</p></div>
                      <span className="font-mono text-sm tabular-nums">{w(v)}</span>
                    </li>
                  ))}
                </ul>
              </ToolPanel>
            )}
            <p className="text-[11px] text-muted-foreground">BMI is a screening measure for adults; it doesn&apos;t distinguish muscle from fat and may misclassify athletes, older adults and some ethnic groups (WHO suggests lower thresholds for Asian populations). Not medical advice.</p>
          </>
        ) : (
          <ToolPanel bodyClassName="py-16 text-center text-sm text-muted-foreground">Enter your height and weight.</ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
