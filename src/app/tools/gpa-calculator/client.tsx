"use client";

import { Plus, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, OptionsLayout, Segmented, Stat, StatGrid, ToolPanel } from "@/components/tool";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

type Level = "regular" | "honors" | "ap";
interface Course { id: number; name: string; grade: string; credits: string; level: Level }
interface State { courses: Course[]; prevGpa: string; prevCredits: string; scale: "4.0" | "4.3" }

const SCALES: Record<State["scale"], Record<string, number>> = {
  "4.0": { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, "D+": 1.3, D: 1, "D-": 0.7, F: 0 },
  "4.3": { "A+": 4.3, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, "D+": 1.3, D: 1, "D-": 0.7, F: 0 },
};
const BONUS: Record<Level, number> = { regular: 0, honors: 0.5, ap: 1 };
const blank = (id: number): Course => ({ id, name: "", grade: "A", credits: "3", level: "regular" });
const store = createLocalStore<State>("gpa-calculator", { courses: [1, 2, 3, 4].map(blank), prevGpa: "", prevCredits: "", scale: "4.0" });

export default function GPACalculator() {
  const [s, setS] = useLocalStore(store);
  const map = SCALES[s.scale];
  const upd = (id: number, patch: Partial<Course>) => setS((x) => ({ ...x, courses: x.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const counted = s.courses.filter((c) => (parseFloat(c.credits) || 0) > 0 && c.grade in map);
  const credits = counted.reduce((t, c) => t + parseFloat(c.credits), 0);
  const unweighted = credits ? counted.reduce((t, c) => t + map[c.grade] * parseFloat(c.credits), 0) / credits : 0;
  // Weighting bonus doesn't apply to failing grades.
  const weighted = credits ? counted.reduce((t, c) => t + (map[c.grade] + (map[c.grade] > 0 ? BONUS[c.level] : 0)) * parseFloat(c.credits), 0) / credits : 0;
  const pc = parseFloat(s.prevCredits) || 0;
  const pg = parseFloat(s.prevGpa) || 0;
  const cumulative = pc + credits ? (pg * pc + unweighted * credits) / (pc + credits) : 0;

  const options = (
    <ToolPanel title="Settings" bodyClassName="p-3 space-y-3">
      <Field label="Grade scale"><Segmented size="sm" value={s.scale} onChange={(v) => setS((x) => ({ ...x, scale: v }))} options={[{ value: "4.0", label: "4.0 (A+ = 4.0)" }, { value: "4.3", label: "4.3 (A+ = 4.3)" }]} /></Field>
      <p className="text-[11px] font-medium">Previous semesters (optional)</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Cumulative GPA" htmlFor="pg"><Input id="pg" value={s.prevGpa} onChange={(e) => setS((x) => ({ ...x, prevGpa: e.target.value }))} inputMode="decimal" /></Field>
        <Field label="Credits earned" htmlFor="pcr"><Input id="pcr" value={s.prevCredits} onChange={(e) => setS((x) => ({ ...x, prevCredits: e.target.value }))} inputMode="decimal" /></Field>
      </div>
      <p className="text-[11px] text-muted-foreground">Weighted GPA adds +0.5 for Honors and +1.0 for AP/IB (common US high-school convention; schools vary). Your courses are saved in this browser.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="gpa-calculator">
      <OptionsLayout options={options}>
        <StatGrid>
          <Stat label="Semester GPA" value={unweighted.toFixed(2)} hint={`of ${s.scale}`} />
          <Stat label="Weighted GPA" value={weighted.toFixed(2)} hint="Honors/AP" />
          <Stat label="Credits" value={String(credits)} />
          <Stat label="Cumulative" value={pc ? cumulative.toFixed(2) : "—"} hint={pc ? `${pc + credits} credits` : "add previous"} />
        </StatGrid>
        <ToolPanel title="Courses" actions={<Button variant="ghost" size="sm" onClick={() => setS((x) => ({ ...x, courses: [...x.courses, blank(Math.max(0, ...x.courses.map((c) => c.id)) + 1)] }))}><Plus /> Add course</Button>}>
          <div className="divide-y divide-border">
            {s.courses.map((c, i) => (
              <div key={c.id} className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5">
                <Input value={c.name} onChange={(e) => upd(c.id, { name: e.target.value })} placeholder={`Course ${i + 1}`} className="flex-1 min-w-36" aria-label="Course name" />
                <select value={c.grade} onChange={(e) => upd(c.id, { grade: e.target.value })} className="h-(--control-h) w-20 rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30" aria-label="Grade">
                  {Object.keys(map).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <Input value={c.credits} onChange={(e) => upd(c.id, { credits: e.target.value })} inputMode="decimal" className="w-16 text-right" aria-label="Credits" />
                <Segmented size="sm" value={c.level} onChange={(v) => upd(c.id, { level: v })} options={[{ value: "regular", label: "Reg" }, { value: "honors", label: "Hon" }, { value: "ap", label: "AP" }]} />
                <Button variant="ghost" size="icon-sm" onClick={() => setS((x) => ({ ...x, courses: x.courses.length > 1 ? x.courses.filter((y) => y.id !== c.id) : [blank(1)] }))} aria-label="Remove course" className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>
              </div>
            ))}
          </div>
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
