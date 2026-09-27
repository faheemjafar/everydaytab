"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

function localIso(d: Date) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
}

function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${pad(w)}-${day}`;
}

function relative(d: Date, now: number) {
  const s = Math.round((d.getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const a = Math.abs(s);
  if (a < 60) return rtf.format(s, "second");
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 2592000) return rtf.format(Math.round(s / 86400), "day");
  if (a < 31536000) return rtf.format(Math.round(s / 2592000), "month");
  return rtf.format(Math.round(s / 31536000), "year");
}

/** Accepts ISO strings, RFC 2822, Unix seconds or milliseconds. */
function parseInput(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^-?\d{9,11}$/.test(s)) return new Date(Number(s) * 1000);
  if (/^-?\d{12,14}$/.test(s)) return new Date(Number(s));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export default function ISOFormatter() {
  // Output depends on the viewer's locale/zone/clock, so render on the client only.
  const mounted = useMounted();
  if (!mounted) return <ToolLayout toolId="iso-formatter"><div className="h-96 rounded-md border border-border bg-card" /></ToolLayout>;
  return <Formatter />;
}

function Formatter() {
  const [input, setInput] = useState(() => new Date().toISOString());
  const [now] = useState(() => Date.now());
  const d = useMemo(() => parseInput(input), [input]);

  const rows: [string, string][] = d
    ? [
        ["ISO 8601 (UTC)", d.toISOString()],
        ["ISO 8601 (local offset)", localIso(d)],
        ["Date only", d.toISOString().slice(0, 10)],
        ["ISO week date", isoWeek(d)],
        ["RFC 2822", d.toUTCString().replace("GMT", "+0000")],
        ["RFC 7231 (HTTP)", d.toUTCString()],
        ["SQL datetime (UTC)", d.toISOString().replace("T", " ").slice(0, 19)],
        ["Unix seconds", String(Math.floor(d.getTime() / 1000))],
        ["Unix milliseconds", String(d.getTime())],
        ["Local (long)", d.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" })],
        ["Local (short)", d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })],
        ["Relative", relative(d, now)],
      ]
    : [];

  const options = (
    <ToolPanel title="Accepted input" bodyClassName="p-3 space-y-1.5 text-xs text-muted-foreground">
      <p>ISO 8601 · RFC 2822 · “March 5 2026 14:00” · Unix seconds (10 digits) or milliseconds (13 digits).</p>
      <p>Local formats use your browser&apos;s time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="iso-formatter">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-3.5 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="h-11 font-mono" aria-invalid={input.trim() && !d ? true : undefined} />
          <Button variant="outline" onClick={() => setInput(new Date().toISOString())} className="h-11">
            <Clock /> Now
          </Button>
        </ToolPanel>
        {input.trim() && !d && <p className="text-xs text-destructive px-0.5">Unrecognised date.</p>}
        {d && (
          <ToolPanel title="Formats">
            <dl className="divide-y divide-border">
              {rows.map(([k, v]) => (
                <div key={k} className="group flex items-center gap-3 px-3.5 h-10">
                  <dt className="w-44 shrink-0 text-xs text-muted-foreground">{k}</dt>
                  <dd className="flex-1 font-mono text-[13px] truncate">{v}</dd>
                  <CopyButton text={v} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                </div>
              ))}
            </dl>
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
