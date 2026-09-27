"use client";

import { useState } from "react";
import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, Segmented, StatusBadge, ToolAlert, ToolPanel, Toggle } from "@/components/tool";
import { useMounted } from "@/lib/local-store";
import { cn } from "@/lib/utils";

const PRESETS: [string, string][] = [
  ["Every minute", "* * * * *"],
  ["Every 5 minutes", "*/5 * * * *"],
  ["Every 15 minutes", "*/15 * * * *"],
  ["Hourly", "0 * * * *"],
  ["Daily at midnight", "0 0 * * *"],
  ["Daily at 09:00", "0 9 * * *"],
  ["Weekdays at 09:00", "0 9 * * 1-5"],
  ["Every Monday", "0 0 * * 1"],
  ["1st of month", "0 0 1 * *"],
  ["Every quarter", "0 0 1 */3 *"],
  ["Yearly (Jan 1)", "0 0 1 1 *"],
  ["Business hours, every 30 min", "*/30 9-17 * * 1-5"],
];

const FIELDS = [
  { key: "min", label: "Minute", range: "0–59", hint: "*/5 · 0,30 · 10-20" },
  { key: "hour", label: "Hour", range: "0–23", hint: "9-17 · */2" },
  { key: "dom", label: "Day of month", range: "1–31", hint: "1 · 1,15 · L" },
  { key: "mon", label: "Month", range: "1–12", hint: "*/3 · JAN-MAR" },
  { key: "dow", label: "Day of week", range: "0–6 (Sun=0)", hint: "1-5 · MON,WED" },
] as const;

const MACROS: Record<string, string> = { "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *", "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *" };

function evaluate(expr: string, utc: boolean, h24: boolean, withRuns: boolean): { error: string } | { text: string; next: Date[] } {
  if (!expr) return { error: "Enter a cron expression." };
  try {
    const it = CronExpressionParser.parse(expr, utc ? { tz: "UTC" } : {});
    const next = withRuns ? Array.from({ length: 10 }, () => it.next().toDate()) : [];
    return { next, text: cronstrue.toString(expr, { use24HourTimeFormat: h24, verbose: true }) };
  } catch (e) {
    return { error: (e as Error).message.replace(/^Error: /, "") };
  }
}

export default function CrontabGenerator() {
  const mounted = useMounted();
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const [h24, setH24] = useState(true);
  const [utc, setUtc] = useState(false);
  const [command, setCommand] = useState("/usr/local/bin/backup.sh");

  const normalized = MACROS[expr.trim().toLowerCase()] ?? expr.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ");
  const withSeconds = parts.length === 6;
  const fields = withSeconds ? parts.slice(1) : parts;

  const result = evaluate(normalized, utc, h24, mounted);

  const setField = (i: number, v: string) => {
    const f = [...fields];
    while (f.length < 5) f.push("*");
    f[i] = v.replace(/\s+/g, "") || "*";
    setExpr((withSeconds ? [parts[0], ...f] : f).join(" "));
  };

  const fmt = (d: Date) =>
    d.toLocaleString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: withSeconds ? "2-digit" : undefined, hour12: !h24, timeZone: utc ? "UTC" : undefined });

  const line = `${normalized} ${command}`.trim();
  const zone = mounted ? (utc ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone) : "";

  const options = (
    <ToolPanel title="Presets" bodyClassName="p-1.5">
      <ul className="space-y-0.5">
        {PRESETS.map(([label, e]) => (
          <li key={e}>
            <button type="button" onClick={() => setExpr(e)} className={cn("w-full flex items-center justify-between gap-2 h-8 px-2.5 rounded-md text-[13px] text-left", normalized === e ? "bg-accent text-accent-foreground" : "hover:bg-muted")}>
              <span className="truncate">{label}</span>
              <code className="font-mono text-[11px] text-muted-foreground">{e}</code>
            </button>
          </li>
        ))}
      </ul>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="crontab-generator">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-3.5 space-y-3">
          <div className="flex gap-2">
            <Input value={expr} onChange={(e) => setExpr(e.target.value)} spellCheck={false} className="h-12 text-xl font-mono tracking-wide" aria-label="Cron expression" aria-invalid={"error" in result ? true : undefined} />
            <CopyButton text={normalized} className="h-12" />
          </div>
          {"text" in result ? (
            <p className="text-base font-medium">“{result.text}”</p>
          ) : (
            <p className="text-sm text-destructive">{result.error}</p>
          )}
          {/* Individual field editors — hoisted JSX, not nested components, so inputs keep focus. */}
          <div className="grid grid-cols-5 gap-2">
            {FIELDS.map((f, i) => (
              <label key={f.key} className="space-y-1 min-w-0">
                <span className="block text-[11px] font-medium truncate">{f.label}</span>
                <Input value={fields[i] ?? ""} onChange={(e) => setField(i, e.target.value)} spellCheck={false} className="font-mono text-center" />
                <span className="block text-[10px] text-muted-foreground truncate" title={f.hint}>{f.range}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Segmented size="sm" value={h24 ? "24" : "12"} onChange={(v) => setH24(v === "24")} options={[{ value: "24", label: "24 h" }, { value: "12", label: "12 h" }]} />
            <Toggle label="Evaluate in UTC" checked={utc} onChange={setUtc} hint="Servers usually run cron in UTC" />
            {withSeconds && <StatusBadge tone="info">6-field (with seconds)</StatusBadge>}
          </div>
        </ToolPanel>

        {"next" in result && result.next.length > 0 && (
          <ToolPanel title={`Next ${result.next.length} runs`} actions={<StatusBadge>{zone}</StatusBadge>}>
            <ol className="divide-y divide-border">
              {result.next.map((d, i) => (
                <li key={i} className="flex items-center gap-3 px-3.5 h-9 text-[13px]">
                  <span className="w-5 text-right text-[11px] text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="font-mono tabular-nums">{fmt(d)}</span>
                </li>
              ))}
            </ol>
          </ToolPanel>
        )}

        <ToolPanel title="Crontab line" actions={<CopyButton text={line} />} bodyClassName="p-3.5 space-y-2">
          <Input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Command to run" className="font-mono" aria-label="Command" />
          <pre className="font-mono text-[13px] bg-muted/50 rounded-md px-3 py-2 overflow-x-auto">{line}</pre>
          <p className="text-[11px] text-muted-foreground">Add with <code className="font-mono">crontab -e</code>. Use absolute paths — cron runs with a minimal PATH.</p>
        </ToolPanel>

        {"error" in result && normalized && <ToolAlert tone="error" title="Invalid expression">{result.error}</ToolAlert>}
      </OptionsLayout>
    </ToolLayout>
  );
}
