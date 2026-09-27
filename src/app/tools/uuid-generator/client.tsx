"use client";

import { useMemo, useState } from "react";
import { Fingerprint, RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ClearButton, CopyButton, DownloadButton, Field, OptionsLayout, PrivacyNote, Segmented, ToolPanel } from "@/components/tool";

type Format = "plain" | "braces" | "upper" | "nodash";

function uuidV4(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  a[6] = (a[6] & 0x0f) | 0x40;
  a[8] = (a[8] & 0x3f) | 0x80;
  const h = Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function format(u: string, f: Format) {
  switch (f) {
    case "braces": return `{${u}}`;
    case "upper": return u.toUpperCase();
    case "nodash": return u.replace(/-/g, "");
    default: return u;
  }
}

export default function UuidGenerator() {
  const [count, setCount] = useState(10);
  const [fmt, setFmt] = useState<Format>("plain");
  const [quoted, setQuoted] = useState(false);
  // Regenerated whenever count or seed changes; seed bumps on "Generate".
  const [seed, setSeed] = useState(0);
  const [cleared, setCleared] = useState(false);

  const uuids = useMemo(
    () => (cleared ? [] : Array.from({ length: Math.min(Math.max(count, 1), 1000) }, uuidV4)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, seed, cleared]
  );

  const generate = () => {
    setCleared(false);
    setSeed((s) => s + 1);
  };

  const rendered = uuids.map((u) => (quoted ? `"${format(u, fmt)}"` : format(u, fmt)));
  const joined = rendered.join(quoted ? ",\n" : "\n");

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-4">
      <Field label="Quantity" hint="Up to 1,000 at once." htmlFor="uuid-count">
        <Input
          id="uuid-count"
          type="number"
          min={1}
          max={1000}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          className="font-mono"
        />
      </Field>
      <Field label="Format">
        <Segmented
          size="sm"
          value={fmt}
          onChange={setFmt}
          options={[
            { value: "plain", label: "Default" },
            { value: "upper", label: "UPPER" },
            { value: "braces", label: "{…}" },
            { value: "nodash", label: "No dashes" },
          ]}
        />
      </Field>
      <Field label="Quote values" hint="Ready to paste into JSON or SQL." inline>
        <Switch checked={quoted} onCheckedChange={setQuoted} />
      </Field>
      <Button size="lg" onClick={generate} className="w-full">
        <RefreshCw /> Generate
      </Button>
      <PrivacyNote>Version 4 UUIDs from crypto.randomUUID().</PrivacyNote>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="uuid-generator">
      <OptionsLayout options={options}>
        <ToolPanel
          title={`Generated · ${uuids.length}`}
          actions={
            <>
              <CopyButton text={joined} label="Copy all" />
              <DownloadButton content={joined} filename="uuids.txt" iconOnly />
              <ClearButton onClick={() => setCleared(true)} iconOnly disabled={!uuids.length} />
            </>
          }
        >
          {uuids.length ? (
            <ul className="divide-y divide-border max-h-[600px] overflow-y-auto custom-scrollbar">
              {rendered.map((u, i) => (
                <li key={i} className="group flex items-center gap-3 px-3 h-9">
                  <span className="w-8 text-[11px] text-muted-foreground tabular-nums text-right">{i + 1}</span>
                  <code className="flex-1 font-mono text-[13px] truncate">{u}</code>
                  <CopyButton text={u} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground bg-dots">
              <Fingerprint className="w-8 h-8 opacity-40" />
              <p className="text-sm">Nothing generated yet</p>
            </div>
          )}
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
