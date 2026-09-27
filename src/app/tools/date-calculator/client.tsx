"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Segmented, Stat, StatGrid, ToolPanel, Toggle } from "@/components/tool";
import { useMounted } from "@/lib/local-store";
import { addDuration, businessDays, DAY, iso, isoWeek, long, parse, todayIso, ymd } from "@/lib/dates";

type Mode = "diff" | "add" | "countdown" | "info";
const plural = (n: number, w: string) => `${n.toLocaleString()} ${w}${n === 1 ? "" : "s"}`;

export default function DateCalculator() {
  const mounted = useMounted();
  const [mode, setMode] = useState<Mode>("diff");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [includeEnd, setIncludeEnd] = useState(false);
  const [dur, setDur] = useState({ y: "0", m: "0", w: "0", d: "30" });
  const [sub, setSub] = useState(false);
  const [business, setBusiness] = useState(false);
  const [target, setTarget] = useState("");
  const [now, setNow] = useState(0);

  // Defaults depend on the viewer's date, so fill them after mount.
  const today = mounted ? todayIso() : "";
  const A = a || today;
  const B = b || (mounted ? iso(parse(today) + 100 * DAY) : "");
  const T = target || (mounted ? `${new Date().getFullYear() + 1}-01-01T00:00` : "");

  useEffect(() => {
    if (mode !== "countdown") return;
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [mode]);

  const ta = parse(A), tb = parse(B);
  let diff: null | { lo: number; hi: number; days: number; neg: boolean } = null;
  if (Number.isFinite(ta) && Number.isFinite(tb)) {
    const lo = Math.min(ta, tb), hi = Math.max(ta, tb) + (includeEnd ? DAY : 0);
    diff = { lo, hi, days: Math.round((hi - lo) / DAY), neg: tb < ta };
  }
  const k = sub ? -1 : 1;
  const added = Number.isFinite(ta) ? addDuration(ta, k * (+dur.y || 0), k * (+dur.m || 0), k * (+dur.w || 0), k * (+dur.d || 0), business) : NaN;
  const tt = T ? new Date(T).getTime() : NaN;
  const delta = Number.isFinite(tt) && now ? tt - now : NaN;

  return (
    <ToolLayout toolId="date-calculator">
      <div className="space-y-3 max-w-4xl">
        <Segmented value={mode} onChange={setMode} options={[{ value: "diff", label: "Between dates" }, { value: "add", label: "Add / subtract" }, { value: "countdown", label: "Countdown" }, { value: "info", label: "Date info" }]} />

        {mode === "diff" && (
          <>
            <ToolPanel bodyClassName="p-3 flex flex-wrap items-end gap-3">
              <Field label="Start date" htmlFor="da"><Input id="da" type="date" value={A} onChange={(e) => setA(e.target.value)} /></Field>
              <Button variant="ghost" size="icon" onClick={() => { setA(B); setB(A); }} aria-label="Swap dates"><ArrowLeftRight /></Button>
              <Field label="End date" htmlFor="db"><Input id="db" type="date" value={B} onChange={(e) => setB(e.target.value)} /></Field>
              <Toggle label="Include end day" checked={includeEnd} onChange={setIncludeEnd} />
            </ToolPanel>
            {diff && (() => {
              const c = ymd(diff.lo, diff.hi);
              return (
                <>
                  <ToolPanel bodyClassName="p-5 space-y-1">
                    <p className="text-3xl font-semibold">{[c.y && plural(c.y, "year"), c.m && plural(c.m, "month"), (c.d || (!c.y && !c.m)) && plural(c.d, "day")].filter(Boolean).join(", ")}</p>
                    <p className="text-sm text-muted-foreground">{diff.neg ? "before" : "from"} {mounted && long(ta)}{includeEnd ? ", inclusive" : ""}</p>
                  </ToolPanel>
                  <StatGrid>
                    <Stat label="Total days" value={diff.days.toLocaleString()} />
                    <Stat label="Weeks" value={`${Math.floor(diff.days / 7)} w ${diff.days % 7} d`} />
                    <Stat label="Business days" value={businessDays(diff.lo, diff.hi).toLocaleString()} hint="Mon–Fri, no holidays" />
                    <Stat label="Hours" value={(diff.days * 24).toLocaleString()} />
                  </StatGrid>
                </>
              );
            })()}
          </>
        )}

        {mode === "add" && (
          <>
            <ToolPanel bodyClassName="p-3 space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Start date" htmlFor="as"><Input id="as" type="date" value={A} onChange={(e) => setA(e.target.value)} /></Field>
                <Segmented value={sub ? "sub" : "add"} onChange={(v) => setSub(v === "sub")} options={[{ value: "add", label: "+ Add" }, { value: "sub", label: "− Subtract" }]} />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["y", "m", "w", "d"] as const).map((u) => (
                  <Field key={u} label={{ y: "Years", m: "Months", w: "Weeks", d: business ? "Business days" : "Days" }[u]} htmlFor={`du${u}`}>
                    <Input id={`du${u}`} type="number" min={0} value={dur[u]} onChange={(e) => setDur((x) => ({ ...x, [u]: e.target.value }))} className="w-24" />
                  </Field>
                ))}
              </div>
              <Toggle label="Count days as business days (skip weekends)" checked={business} onChange={setBusiness} />
            </ToolPanel>
            {Number.isFinite(added) && (
              <ToolPanel bodyClassName="p-5 space-y-1">
                <p className="text-3xl font-semibold">{mounted && long(added)}</p>
                <p className="text-sm text-muted-foreground font-mono">{iso(added)} · {plural(Math.abs(Math.round((added - ta) / DAY)), "day")} {added >= ta ? "later" : "earlier"}</p>
              </ToolPanel>
            )}
          </>
        )}

        {mode === "countdown" && (
          <>
            <ToolPanel bodyClassName="p-3 flex flex-wrap items-end gap-3">
              <Field label="Target date & time (your time zone)" htmlFor="ct"><Input id="ct" type="datetime-local" value={T} onChange={(e) => setTarget(e.target.value)} /></Field>
            </ToolPanel>
            {Number.isFinite(delta) && (() => {
              const abs = Math.abs(delta);
              const units: [string, number][] = [["days", Math.floor(abs / DAY)], ["hours", Math.floor(abs / 3600000) % 24], ["minutes", Math.floor(abs / 60000) % 60], ["seconds", Math.floor(abs / 1000) % 60]];
              return (
                <ToolPanel bodyClassName="p-6 space-y-3 text-center">
                  <p className="text-xs text-muted-foreground">{delta >= 0 ? "Time remaining until" : "Time elapsed since"} {new Date(tt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</p>
                  <div className="flex justify-center gap-3">
                    {units.map(([l, v]) => (
                      <div key={l} className="w-20 rounded-md border border-border py-3">
                        <p className="text-3xl font-semibold tabular-nums">{String(v).padStart(2, "0")}</p>
                        <p className="text-[11px] text-muted-foreground">{l}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">{Math.floor(abs / 3600000).toLocaleString()} hours · {Math.floor(abs / 60000).toLocaleString()} minutes total</p>
                </ToolPanel>
              );
            })()}
          </>
        )}

        {mode === "info" && (
          <>
            <ToolPanel bodyClassName="p-3"><Field label="Date" htmlFor="id"><Input id="id" type="date" value={A} onChange={(e) => setA(e.target.value)} className="w-48" /></Field></ToolPanel>
            {Number.isFinite(ta) && mounted && (() => {
              const d = new Date(ta);
              const y = d.getUTCFullYear();
              const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
              const doy = Math.round((ta - Date.UTC(y, 0, 1)) / DAY) + 1;
              const w = isoWeek(ta);
              const fromToday = Math.round((ta - parse(today)) / DAY);
              return (
                <StatGrid>
                  <Stat label="Weekday" value={d.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" })} />
                  <Stat label="ISO week" value={`W${String(w.week).padStart(2, "0")} ${w.year}`} />
                  <Stat label="Day of year" value={`${doy} / ${leap ? 366 : 365}`} />
                  <Stat label="Quarter" value={`Q${Math.floor(d.getUTCMonth() / 3) + 1}`} />
                  <Stat label="Leap year" value={leap ? "Yes" : "No"} />
                  <Stat label="Days in month" value={String(new Date(Date.UTC(y, d.getUTCMonth() + 1, 0)).getUTCDate())} />
                  <Stat label="From today" value={fromToday === 0 ? "Today" : `${plural(Math.abs(fromToday), "day")} ${fromToday > 0 ? "ahead" : "ago"}`} />
                  <Stat label="Unix timestamp" value={String(ta / 1000)} hint="midnight UTC" />
                </StatGrid>
              );
            })()}
          </>
        )}
      </div>
    </ToolLayout>
  );
}
