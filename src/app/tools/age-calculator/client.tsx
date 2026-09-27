"use client";

import { useState } from "react";
import { Cake } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, OptionsLayout, Stat, StatGrid, ToolAlert, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";
import { addMonths, DAY, long, parse, todayIso, ymd } from "@/lib/dates";

const ZODIAC: [number, string][] = [[120, "Capricorn ♑"], [219, "Aquarius ♒"], [321, "Pisces ♓"], [420, "Aries ♈"], [521, "Taurus ♉"], [621, "Gemini ♊"], [723, "Cancer ♋"], [823, "Leo ♌"], [923, "Virgo ♍"], [1023, "Libra ♎"], [1122, "Scorpio ♏"], [1222, "Sagittarius ♐"], [1232, "Capricorn ♑"]];
const CHINESE = ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat"];

export default function AgeCalculator() {
  const mounted = useMounted();
  const [dob, setDob] = useState("");
  const [on, setOn] = useState("");
  const today = mounted ? todayIso() : "";
  const at = on || today;

  const b = parse(dob);
  const t = parse(at);
  const valid = Number.isFinite(b) && Number.isFinite(t);
  const future = valid && b > t;
  const age = valid && !future ? ymd(b, t) : null;
  const days = valid ? Math.round((t - b) / DAY) : 0;
  const months = age ? age.y * 12 + age.m : 0;

  // Next birthday (Feb 29 birthdays fall on Feb 28 in non-leap years).
  let next = NaN;
  if (age) { next = addMonths(b, (age.y + 1) * 12); if (age.m === 0 && age.d === 0) next = t; }
  const untilNext = Number.isFinite(next) ? Math.round((next - t) / DAY) : 0;
  const bd = Number.isFinite(b) ? new Date(b) : null;
  const md = bd ? (bd.getUTCMonth() + 1) * 100 + bd.getUTCDate() : 0;

  const options = (
    <ToolPanel title="Dates" bodyClassName="p-3 space-y-3">
      <Field label="Date of birth" htmlFor="dob"><Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={today} className="h-11" autoFocus /></Field>
      <Field label="Age on" hint="Defaults to today" htmlFor="on"><Input id="on" type="date" value={at} onChange={(e) => setOn(e.target.value)} /></Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="age-calculator">
      <OptionsLayout options={options}>
        {future && <ToolAlert tone="warning">The birth date is after the “age on” date.</ToolAlert>}
        {age ? (
          <>
            <ToolPanel bodyClassName="p-6 space-y-1">
              <p className="text-4xl font-semibold">{age.y} <span className="text-xl font-normal text-muted-foreground">years</span> {age.m} <span className="text-xl font-normal text-muted-foreground">months</span> {age.d} <span className="text-xl font-normal text-muted-foreground">days</span></p>
              <p className="text-sm text-muted-foreground">Born on a {bd!.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" })}, {mounted && long(b).replace(/^[^,]+, /, "")}</p>
            </ToolPanel>
            <ToolPanel bodyClassName="p-3.5 flex items-center gap-3">
              <Cake className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm">{untilNext === 0 ? <strong>Happy birthday! 🎉</strong> : <>Next birthday in <strong>{untilNext} days</strong> — {mounted && long(next)} (turning {age.y + 1})</>}</p>
            </ToolPanel>
            <StatGrid>
              <Stat label="Total months" value={months.toLocaleString()} />
              <Stat label="Total weeks" value={Math.floor(days / 7).toLocaleString()} />
              <Stat label="Total days" value={days.toLocaleString()} />
              <Stat label="Total hours" value={(days * 24).toLocaleString()} />
              <Stat label="Star sign" value={ZODIAC.find(([end]) => md < end)?.[1] ?? ""} />
              <Stat label="Chinese zodiac" value={CHINESE[bd!.getUTCFullYear() % 12]} hint="by calendar year" />
              <Stat label="10,000-day mark" value={mounted ? new Date(b + 10000 * DAY).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" }) : ""} />
              <Stat label="Generation" value={((y) => (y >= 2013 ? "Gen Alpha" : y >= 1997 ? "Gen Z" : y >= 1981 ? "Millennial" : y >= 1965 ? "Gen X" : y >= 1946 ? "Baby Boomer" : "Silent"))(bd!.getUTCFullYear())} />
            </StatGrid>
          </>
        ) : (
          !future && <ToolPanel bodyClassName="py-16 text-center text-sm text-muted-foreground">Enter a date of birth.</ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
