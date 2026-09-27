"use client";

import { useMemo, useState } from "react";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { Clock, Plus, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, Field, OptionsLayout, Segmented, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

const ALL_ZONES: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Asia/Kolkata", "Australia/Sydney"];
  }
})();
const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const DEFAULT_TARGETS = ["UTC", "America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"];
const pretty = (tz: string) => tz.replace(/_/g, " ").replace(/\//g, " / ");

function nowLocalInput(tz: string) {
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm");
}

/** Offset label like "UTC+5:30". */
function offsetLabel(date: Date, tz: string) {
  return formatInTimeZone(date, tz, "xxx").replace(/^\+00:00$/, "±0").replace(/:00$/, "").replace(/^/, "UTC");
}

function ZoneInput({ value, onChange, id }: { value: string; onChange: (tz: string) => void; id: string }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <>
      <Input
        id={id}
        list={`${id}-list`}
        value={text ?? value}
        onFocus={() => setText("")}
        onChange={(e) => {
          setText(e.target.value);
          if (ALL_ZONES.includes(e.target.value)) onChange(e.target.value);
        }}
        onBlur={() => setText(null)}
        placeholder={value}
        className="font-mono"
      />
      <datalist id={`${id}-list`}>
        {ALL_ZONES.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
    </>
  );
}

export default function TimeZoneConverter() {
  // Depends on the browser's zone and clock, so render only on the client.
  const mounted = useMounted();
  if (!mounted) return <ToolLayout toolId="time-zone-converter"><div className="h-96 rounded-md border border-border bg-card" /></ToolLayout>;
  return <Converter />;
}

function Converter() {
  const LOCAL = localZone();
  const [fromTz, setFromTz] = useState(LOCAL);
  const [wall, setWall] = useState(() => nowLocalInput(LOCAL));
  const [targets, setTargets] = useState<string[]>(() => DEFAULT_TARGETS.filter((z) => z !== LOCAL));
  const [adding, setAdding] = useState("");
  const [h24, setH24] = useState(true);

  // Interpret the typed wall-clock time *in the source zone*, then show that instant everywhere.
  const instant = useMemo(() => {
    if (!wall) return null;
    const d = fromZonedTime(wall.length === 16 ? `${wall}:00` : wall, fromTz);
    return isNaN(d.getTime()) ? null : d;
  }, [wall, fromTz]);

  const sourceDay = instant ? formatInTimeZone(instant, fromTz, "yyyy-MM-dd") : "";
  const fmt = h24 ? "HH:mm" : "h:mm a";

  const add = (tz: string) => {
    if (ALL_ZONES.includes(tz) && !targets.includes(tz)) setTargets((t) => [...t, tz]);
    setAdding("");
  };

  const options = (
    <ToolPanel title="From" bodyClassName="p-3 space-y-4">
      <Field label="Time zone" htmlFor="from-tz">
        <ZoneInput id="from-tz" value={fromTz} onChange={setFromTz} />
      </Field>
      <Field label="Date & time" htmlFor="wall">
        <Input id="wall" type="datetime-local" value={wall} onChange={(e) => setWall(e.target.value)} />
      </Field>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" onClick={() => setWall(nowLocalInput(fromTz))}>
          <Clock /> Now
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFromTz(LOCAL)} disabled={fromTz === LOCAL}>
          My zone ({LOCAL.split("/").pop()?.replace(/_/g, " ")})
        </Button>
      </div>
      <Field label="Clock" inline>
        <Segmented
          size="sm"
          value={h24 ? "24" : "12"}
          onChange={(v) => setH24(v === "24")}
          options={[
            { value: "24", label: "24 h" },
            { value: "12", label: "12 h" },
          ]}
        />
      </Field>
      {instant && (
        <p className="text-[11px] text-muted-foreground font-mono break-all">
          {instant.toISOString()} · Unix {Math.floor(instant.getTime() / 1000)}
        </p>
      )}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="time-zone-converter">
      <OptionsLayout options={options}>
        <ToolPanel
          title={instant ? `${formatInTimeZone(instant, fromTz, `EEE d MMM, ${fmt}`)} in ${pretty(fromTz)}` : "Enter a date and time"}
          footer={
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1">
                <Input list="add-tz-list" value={adding} onChange={(e) => { setAdding(e.target.value); if (ALL_ZONES.includes(e.target.value)) add(e.target.value); }} placeholder="Add a time zone… (e.g. Europe/Berlin)" className="font-mono" />
                <datalist id="add-tz-list">
                  {ALL_ZONES.map((z) => (
                    <option key={z} value={z} />
                  ))}
                </datalist>
              </div>
              <Button variant="outline" size="icon" onClick={() => add(adding)} disabled={!ALL_ZONES.includes(adding)} aria-label="Add zone">
                <Plus />
              </Button>
            </div>
          }
        >
          {instant && (
            <ul className="divide-y divide-border">
              {targets.map((tz) => {
                const day = formatInTimeZone(instant, tz, "yyyy-MM-dd");
                const diff = Math.round((Date.parse(day) - Date.parse(sourceDay)) / 86400000);
                const hour = Number(formatInTimeZone(instant, tz, "H"));
                const text = `${formatInTimeZone(instant, tz, `${fmt}, EEE d MMM yyyy`)} (${pretty(tz)})`;
                return (
                  <li key={tz} className="group flex items-center gap-3 px-3.5 h-14">
                    <span className={"w-2 h-2 rounded-full shrink-0 " + (hour >= 8 && hour < 18 ? "bg-emerald-500" : hour >= 6 && hour < 22 ? "bg-amber-500" : "bg-stone-400")} title={hour >= 8 && hour < 18 ? "Working hours" : hour >= 6 && hour < 22 ? "Evening / morning" : "Night"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{pretty(tz)}</p>
                      <p className="text-[11px] text-muted-foreground">{offsetLabel(instant, tz)} · {formatInTimeZone(instant, tz, "zzz")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg tabular-nums leading-tight">{formatInTimeZone(instant, tz, fmt)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatInTimeZone(instant, tz, "EEE d MMM")}
                        {diff !== 0 && <span className="ml-1 font-medium text-foreground">{diff > 0 ? `+${diff}` : diff} day</span>}
                      </p>
                    </div>
                    <CopyButton text={text} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                    <Button variant="ghost" size="icon-sm" onClick={() => setTargets((t) => t.filter((x) => x !== tz))} aria-label={`Remove ${tz}`} className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground">
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </ToolPanel>
        <p className="text-[11px] text-muted-foreground px-0.5">Daylight-saving changes are applied automatically for the chosen date. Green = 08:00–18:00 local.</p>
      </OptionsLayout>
    </ToolLayout>
  );
}
