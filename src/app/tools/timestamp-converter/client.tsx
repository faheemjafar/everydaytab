"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, Field, Segmented, SplitLayout, StatusBadge, ToolPanel } from "@/components/tool";

type Unit = "s" | "ms";

/** Parse a timestamp string as seconds or milliseconds; auto-detect 13-digit ms. */
function parseTs(v: string, unit: Unit): Date | null {
  const n = Number(v.trim());
  if (!v.trim() || !Number.isFinite(n)) return null;
  const ms = unit === "ms" || v.trim().length >= 13 ? n : n * 1000;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

function relative(d: Date, now: number): string {
  const diff = Math.round((d.getTime() - now) / 1000);
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  for (const [s, name] of units) {
    if (abs >= s) {
      const v = Math.floor(abs / s);
      return `${v} ${name}${v === 1 ? "" : "s"} ${diff < 0 ? "ago" : "from now"}`;
    }
  }
  return "now";
}

export default function TimestampConverter() {
  const [unit, setUnit] = useState<Unit>("s");
  // A single "source of truth": the last field edited drives the other.
  const [source, setSource] = useState<{ kind: "ts" | "iso"; value: string }>({ kind: "ts", value: "" });
  // Ticking clock; server snapshot is 0 so SSR/hydration match, then the client takes over.
  const now = useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, 1000);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / 1000) * 1000,
    () => 0
  );

  const date = useMemo(() => {
    if (!source.value) return null;
    if (source.kind === "ts") return parseTs(source.value, unit);
    const d = new Date(source.value);
    return isNaN(d.getTime()) ? null : d;
  }, [source, unit]);

  const tsValue = source.kind === "ts" ? source.value : date ? String(unit === "ms" ? date.getTime() : Math.floor(date.getTime() / 1000)) : "";
  const isoValue = source.kind === "iso" ? source.value : date ? date.toISOString() : "";
  const invalid = source.value !== "" && !date;

  const nowTs = unit === "ms" ? now : Math.floor(now / 1000);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const rows = date
    ? [
        ["ISO 8601 (UTC)", date.toISOString()],
        ["RFC 2822", date.toUTCString()],
        [`Local (${tz})`, date.toLocaleString()],
        ["Unix seconds", String(Math.floor(date.getTime() / 1000))],
        ["Unix milliseconds", String(date.getTime())],
        ["Relative", relative(date, now)],
        ["Weekday", date.toLocaleDateString(undefined, { weekday: "long" })],
        ["Day of year", String(Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000))],
      ]
    : [];

  return (
    <ToolLayout toolId="timestamp-converter">
      <div className="space-y-3">
        <ToolPanel bodyClassName="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Now</span>
          <code className="font-mono text-base tabular-nums">{now ? nowTs : "…"}</code>
          <span className="text-xs text-muted-foreground hidden sm:inline">{now ? new Date(now).toLocaleTimeString() : ""}</span>
          <span className="flex-1" />
          <Segmented
            size="sm"
            value={unit}
            onChange={setUnit}
            options={[
              { value: "s", label: "Seconds" },
              { value: "ms", label: "Milliseconds" },
            ]}
          />
          <Button variant="outline" size="sm" onClick={() => setSource({ kind: "ts", value: String(nowTs) })}>
            Use now
          </Button>
        </ToolPanel>

        <SplitLayout>
          <ToolPanel title="Convert" bodyClassName="p-3.5 space-y-4" actions={invalid ? <StatusBadge tone="error">Invalid</StatusBadge> : null}>
            <Field label={`Unix timestamp (${unit === "ms" ? "milliseconds" : "seconds"})`} htmlFor="ts">
              <div className="flex items-center gap-1.5">
                <Input
                  id="ts"
                  value={tsValue}
                  onChange={(e) => setSource({ kind: "ts", value: e.target.value })}
                  placeholder={unit === "ms" ? "1715956800000" : "1715956800"}
                  inputMode="numeric"
                  className="font-mono text-base h-10"
                />
                <CopyButton text={tsValue} iconOnly />
              </div>
            </Field>
            <Field label="Date / time" hint="ISO 8601, RFC 2822 or anything Date.parse understands." htmlFor="iso">
              <div className="flex items-center gap-1.5">
                <Input
                  id="iso"
                  value={isoValue}
                  onChange={(e) => setSource({ kind: "iso", value: e.target.value })}
                  placeholder="2024-05-17T14:40:00.000Z"
                  className="font-mono text-base h-10"
                />
                <CopyButton text={isoValue} iconOnly />
              </div>
            </Field>
            <Field label="Pick a local date">
              <Input
                type="datetime-local"
                step={1}
                value={date ? toLocalInput(date) : ""}
                onChange={(e) => e.target.value && setSource({ kind: "iso", value: new Date(e.target.value).toISOString() })}
                className="h-10 w-fit"
              />
            </Field>
          </ToolPanel>

          <ToolPanel title="Details">
            {date ? (
              <dl className="divide-y divide-border">
                {rows.map(([k, v]) => (
                  <div key={k} className="group flex items-center gap-3 px-3.5 h-10">
                    <dt className="w-36 shrink-0 text-xs text-muted-foreground truncate">{k}</dt>
                    <dd className="flex-1 font-mono text-[13px] truncate">{v}</dd>
                    <CopyButton text={v} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                  </div>
                ))}
              </dl>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-dots">
                <p className="text-sm">Enter a timestamp or date</p>
              </div>
            )}
          </ToolPanel>
        </SplitLayout>
      </div>
    </ToolLayout>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
