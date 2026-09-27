"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";
import { intToIp, parseRange, rangeToCidrs } from "@/lib/ipv4";

type Mode = "expand" | "cidr";
const MAX = 65536;

function compute(input: string, mode: Mode, skipEnds: boolean): { output: string; error: string | null; count: number } {
  const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { output: "", error: null, count: 0 };
  const ranges: [number, number][] = [];
  for (const l of lines) {
    const r = parseRange(l);
    if (!r) return { output: "", error: `Couldn't parse “${l}”. Use 10.0.0.0/24, 10.0.0.1-10.0.0.50, 10.0.0.1-50 or a single IP.`, count: 0 };
    ranges.push(r);
  }
  if (mode === "cidr") {
    // Merge overlapping/adjacent ranges first, then find minimal CIDR blocks.
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
      else merged.push([...r]);
    }
    const cidrs = merged.flatMap(([a, b]) => rangeToCidrs(a, b));
    return { output: cidrs.join("\n"), error: null, count: cidrs.length };
  }
  const total = ranges.reduce((n, [a, b]) => n + (b - a + 1), 0);
  if (total > MAX) return { output: "", error: `That's ${total.toLocaleString()} addresses — the limit is ${MAX.toLocaleString()} (a /16).`, count: 0 };
  const out: string[] = [];
  for (const [a, b] of ranges) for (let n = a; n <= b; n++) if (!(skipEnds && b - a > 1 && (n === a || n === b))) out.push(intToIp(n));
  return { output: out.join("\n"), error: null, count: out.length };
}

export default function IPRangeExpander() {
  const [mode, setMode] = useState<Mode>("expand");
  const [input, setInput] = useState("");
  const [skipEnds, setSkipEnds] = useState(false);

  const { output, error, count } = useMemo(() => compute(input, mode, skipEnds), [input, mode, skipEnds]);

  return (
    <ToolLayout toolId="ip-range-expander">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        minHeight={260}
        sample={mode === "expand" ? "192.168.1.0/29\n10.0.0.10-15" : "10.0.0.5-10.0.0.20\n192.168.0.0-192.168.3.255"}
        inputLabel="Ranges (one per line)"
        outputLabel={mode === "expand" ? `Addresses${count ? ` · ${count.toLocaleString()}` : ""}` : `CIDR blocks${count ? ` · ${count}` : ""}`}
        filename={mode === "expand" ? "ips.txt" : "cidrs.txt"}
        options={
          <>
            <Field label="Mode">
              <Segmented value={mode} onChange={setMode} options={[{ value: "expand", label: "Expand to IP list" }, { value: "cidr", label: "Range → minimal CIDRs" }]} />
            </Field>
            {mode === "expand" && <Toggle label="Skip network & broadcast" checked={skipEnds} onChange={setSkipEnds} />}
          </>
        }
      />
    </ToolLayout>
  );
}
