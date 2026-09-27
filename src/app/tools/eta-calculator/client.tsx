"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, OptionsLayout, Segmented, Stat, StatGrid, ToolAlert, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

type Mode = "task" | "travel";
type Basis = "rate" | "started";
const RATE_UNIT = { s: 1, min: 60, h: 3600 } as const;

function duration(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "—";
  const d = Math.floor(sec / 86400), h = Math.floor(sec / 3600) % 24, m = Math.floor(sec / 60) % 60, s = Math.floor(sec % 60);
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`, !d && `${s}s`].filter(Boolean).join(" ");
}

export default function ETACalculator() {
  const mounted = useMounted();
  const [mode, setMode] = useState<Mode>("task");
  const [total, setTotal] = useState("1000");
  const [done, setDone] = useState("250");
  const [basis, setBasis] = useState<Basis>("started");
  const [rate, setRate] = useState("5");
  const [rateUnit, setRateUnit] = useState<keyof typeof RATE_UNIT>("s");
  const [started, setStarted] = useState("");
  const [dist, setDist] = useState("350");
  const [speed, setSpeed] = useState("90");
  const [stops, setStops] = useState("15");
  const [depart, setDepart] = useState("");
  const [now] = useState(() => Date.now());

  const nowLocal = mounted ? new Date(now - new Date(now).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  const at = (ms: number) => (mounted && Number.isFinite(ms) ? new Date(ms).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : "—");

  // Task: remaining ÷ rate, where rate comes from a stated speed or from progress since the start time.
  const T = parseFloat(total), D = parseFloat(done);
  const startMs = started ? new Date(started).getTime() : NaN;
  const elapsed = (now - startMs) / 1000;
  const perSec = basis === "rate" ? parseFloat(rate) / RATE_UNIT[rateUnit] : D / elapsed;
  const remaining = T - D;
  const secLeft = remaining / perSec;
  const pct = T > 0 ? Math.min(100, Math.max(0, (D / T) * 100)) : 0;
  const taskOk = T > 0 && D >= 0 && D <= T && perSec > 0 && Number.isFinite(perSec);

  // Travel: distance ÷ speed + stops.
  const travelSec = (parseFloat(dist) / parseFloat(speed)) * 3600 + (parseFloat(stops) || 0) * 60;
  const departMs = new Date(depart || nowLocal).getTime();

  const options =
    mode === "task" ? (
      <ToolPanel title="Progress" bodyClassName="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Total" htmlFor="et"><Input id="et" value={total} onChange={(e) => setTotal(e.target.value)} inputMode="decimal" className="font-mono" /></Field>
          <Field label="Done so far" htmlFor="ed"><Input id="ed" value={done} onChange={(e) => setDone(e.target.value)} inputMode="decimal" className="font-mono" /></Field>
        </div>
        <Field label="Estimate from"><Segmented size="sm" value={basis} onChange={setBasis} options={[{ value: "started", label: "When I started" }, { value: "rate", label: "A known rate" }]} /></Field>
        {basis === "started" ? (
          <Field label="Started at" htmlFor="es"><Input id="es" type="datetime-local" value={started} onChange={(e) => setStarted(e.target.value)} max={nowLocal} /></Field>
        ) : (
          <Field label="Rate (units per…)" htmlFor="er">
            <div className="flex gap-1.5">
              <Input id="er" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" className="font-mono" />
              <Segmented size="sm" value={rateUnit} onChange={setRateUnit} options={[{ value: "s", label: "/s" }, { value: "min", label: "/min" }, { value: "h", label: "/h" }]} />
            </div>
          </Field>
        )}
        <p className="text-[11px] text-muted-foreground">Works for anything countable: file copies (MB), pages read, tasks, downloads, migrations.</p>
      </ToolPanel>
    ) : (
      <ToolPanel title="Trip" bodyClassName="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Distance" htmlFor="tdist"><Input id="tdist" value={dist} onChange={(e) => setDist(e.target.value)} inputMode="decimal" className="font-mono" /></Field>
          <Field label="Average speed" hint="same unit per hour" htmlFor="tspd"><Input id="tspd" value={speed} onChange={(e) => setSpeed(e.target.value)} inputMode="decimal" className="font-mono" /></Field>
        </div>
        <Field label="Stops (minutes total)" htmlFor="tst"><Input id="tst" value={stops} onChange={(e) => setStops(e.target.value)} inputMode="numeric" className="w-24" /></Field>
        <Field label="Departure" hint="Defaults to now" htmlFor="tdep"><Input id="tdep" type="datetime-local" value={depart || nowLocal} onChange={(e) => setDepart(e.target.value)} /></Field>
      </ToolPanel>
    );

  return (
    <ToolLayout toolId="eta-calculator">
      <div className="space-y-3">
        <Segmented value={mode} onChange={setMode} options={[{ value: "task", label: "Task progress" }, { value: "travel", label: "Travel time" }]} />
        <OptionsLayout options={options}>
          {mode === "task" ? (
            taskOk ? (
              <>
                <ToolPanel bodyClassName="p-5 space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-4xl font-semibold">{remaining === 0 ? "Done" : duration(secLeft)}</p>
                    <p className="text-sm text-muted-foreground">{remaining === 0 ? "" : `finishes ${at(now + secLeft * 1000)}`}</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  <p className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(1)}% · {remaining.toLocaleString()} left</p>
                </ToolPanel>
                <StatGrid>
                  <Stat label="Rate" value={`${(perSec * 60).toLocaleString(undefined, { maximumFractionDigits: 2 })}/min`} />
                  <Stat label="Per hour" value={(perSec * 3600).toLocaleString(undefined, { maximumFractionDigits: 1 })} />
                  {basis === "started" && <Stat label="Elapsed" value={duration(elapsed)} />}
                  <Stat label="Total time" value={duration(T / perSec)} />
                </StatGrid>
              </>
            ) : (
              <ToolAlert tone="info">{basis === "started" && !started ? "Enter when you started to estimate the rate from your progress." : "Enter a total, progress (≤ total) and a positive rate."}</ToolAlert>
            )
          ) : Number.isFinite(travelSec) && travelSec > 0 ? (
            <>
              <ToolPanel bodyClassName="p-5 space-y-1">
                <p className="text-xs text-muted-foreground">Arrive</p>
                <p className="text-4xl font-semibold">{at(departMs + travelSec * 1000)}</p>
                <p className="text-sm text-muted-foreground">after {duration(travelSec)} on the road</p>
              </ToolPanel>
              <StatGrid>
                <Stat label="Driving" value={duration(travelSec - (parseFloat(stops) || 0) * 60)} />
                <Stat label="Stops" value={`${parseFloat(stops) || 0} min`} />
                <Stat label="+10% traffic" value={at(departMs + travelSec * 1100)} />
                <Stat label="Pace" value={`${(60 / parseFloat(speed)).toFixed(2)} min/unit`} />
              </StatGrid>
            </>
          ) : (
            <ToolAlert tone="info">Enter a distance and speed.</ToolAlert>
          )}
        </OptionsLayout>
      </div>
    </ToolLayout>
  );
}
