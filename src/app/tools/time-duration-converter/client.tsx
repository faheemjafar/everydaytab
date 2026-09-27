"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, StatusBadge, ToolPanel } from "@/components/tool";

const UNITS: { key: string; label: string; s: number; aliases: string[] }[] = [
  { key: "ms", label: "Milliseconds", s: 0.001, aliases: ["ms", "msec", "millisecond", "milliseconds"] },
  { key: "s", label: "Seconds", s: 1, aliases: ["s", "sec", "secs", "second", "seconds"] },
  { key: "min", label: "Minutes", s: 60, aliases: ["m", "min", "mins", "minute", "minutes"] },
  { key: "h", label: "Hours", s: 3600, aliases: ["h", "hr", "hrs", "hour", "hours"] },
  { key: "d", label: "Days", s: 86400, aliases: ["d", "day", "days"] },
  { key: "wk", label: "Weeks", s: 604800, aliases: ["w", "wk", "week", "weeks"] },
  { key: "mo", label: "Months (avg 30.44 d)", s: 2629746, aliases: ["mo", "month", "months"] },
  { key: "yr", label: "Years (avg 365.25 d)", s: 31557600, aliases: ["y", "yr", "year", "years"] },
];

/**
 * Parses "1h 30m", "90 min", "1.5 hours", "01:30:00", "2d 4h", or ISO 8601 "PT1H30M".
 * Returns seconds or null.
 */
function parse(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const iso = s.match(/^p(?:(\d+(?:\.\d+)?)y)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)w)?(?:(\d+(?:\.\d+)?)d)?(?:t(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?)?$/);
  if (iso && s !== "p" && s !== "pt") {
    const [, y, mo, w, d, h, m, sec] = iso.map((x) => Number(x) || 0);
    return y * 31557600 + mo * 2629746 + w * 604800 + d * 86400 + h * 3600 + m * 60 + sec;
  }
  const clock = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/);
  if (clock) return (Number(clock[1]) || 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  const re = /(-?\d+(?:\.\d+)?)\s*([a-z]+)?/g;
  let total = 0;
  let matched = false;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const unit = m[2] ? UNITS.find((u) => u.aliases.includes(m![2])) : UNITS[1];
    if (!unit) return null;
    total += Number(m[1]) * unit.s;
    matched = true;
  }
  return matched && s.replace(re, "").replace(/[\s,and]+/g, "") === "" ? total : null;
}

const fmt = (n: number) => (n === 0 ? "0" : Math.abs(n) < 1e-4 ? n.toExponential(3) : Number(n.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 6 }));

function breakdown(total: number) {
  const parts: string[] = [];
  let r = Math.abs(total);
  for (const [n, label] of [[86400, "d"], [3600, "h"], [60, "m"], [1, "s"]] as const) {
    const q = Math.floor(r / n);
    if (q) parts.push(`${q}${label}`);
    r -= q * n;
  }
  if (r >= 0.001) parts.push(`${Math.round(r * 1000)}ms`);
  return parts.join(" ") || "0s";
}

function isoDuration(total: number) {
  let r = Math.abs(total);
  const d = Math.floor(r / 86400); r -= d * 86400;
  const h = Math.floor(r / 3600); r -= h * 3600;
  const m = Math.floor(r / 60); r -= m * 60;
  const s = Number(r.toFixed(3));
  const t = `${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
  return `P${d ? `${d}D` : ""}${t ? `T${t}` : ""}` === "P" ? "PT0S" : `P${d ? `${d}D` : ""}${t ? `T${t}` : ""}`;
}

function clock(total: number) {
  const t = Math.abs(total);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s.toFixed(s % 1 ? 3 : 0).padStart(s % 1 ? 6 : 2, "0")}`;
}

const EXAMPLES = ["1h 30m", "90 min", "2.5 days", "01:45:30", "PT2H15M", "3 weeks", "10000 s"];

export default function TimeDurationConverter() {
  const [input, setInput] = useState("1h 30m");
  const secs = useMemo(() => parse(input), [input]);

  const formats: [string, string][] = secs === null ? [] : [["Human", breakdown(secs)], ["HH:MM:SS", clock(secs)], ["ISO 8601", isoDuration(secs)], ["Seconds", fmt(secs)], ["Milliseconds", fmt(secs * 1000)]];

  const options = (
    <ToolPanel title="Examples" bodyClassName="p-2 flex flex-wrap gap-1">
      {EXAMPLES.map((e) => (
        <button key={e} type="button" onClick={() => setInput(e)} className="h-7 px-2.5 rounded-md border border-border font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted">
          {e}
        </button>
      ))}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="time-duration-converter">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-3.5 space-y-1.5">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. 2h 15m, 90 minutes, 01:30:00, PT1H30M" className="h-12 text-lg font-mono" autoFocus aria-invalid={input.trim() && secs === null ? true : undefined} />
          <p className="text-[11px] text-muted-foreground">Mix units freely (“1 day 3h”), or use a clock time or ISO 8601 duration.</p>
          {input.trim() && secs === null && <p className="text-xs text-destructive">Couldn&apos;t understand that duration.</p>}
        </ToolPanel>

        {secs !== null && (
          <>
            <ToolPanel title="Formats" actions={<StatusBadge>{breakdown(secs)}</StatusBadge>}>
              <dl className="divide-y divide-border">
                {formats.map(([k, v]) => (
                  <div key={k} className="group flex items-center gap-3 px-3.5 h-10">
                    <dt className="w-32 shrink-0 text-xs text-muted-foreground">{k}</dt>
                    <dd className="flex-1 font-mono text-[13px] truncate">{v}</dd>
                    <CopyButton text={v} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                  </div>
                ))}
              </dl>
            </ToolPanel>
            <ToolPanel title="In each unit">
              <ul className="grid sm:grid-cols-2 divide-y divide-border">
                {UNITS.map((u) => {
                  const v = fmt(secs / u.s);
                  return (
                    <li key={u.key} className="group flex items-center gap-3 px-3.5 h-10">
                      <span className="flex-1 font-mono text-[13px] tabular-nums truncate">{v}</span>
                      <span className="text-xs text-muted-foreground">{u.label}</span>
                      <CopyButton text={v.replace(/,/g, "")} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                    </li>
                  );
                })}
              </ul>
            </ToolPanel>
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
