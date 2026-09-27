"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type Sep = "newline" | "space" | "comma" | "none" | "custom";
const SEPS: Record<Exclude<Sep, "custom">, string> = { newline: "\n", space: " ", comma: ", ", none: "" };
const MAX_CHARS = 5_000_000;

export default function TextRepeater() {
  const [input, setInput] = useState("");
  const [times, setTimes] = useState(10);
  const [sep, setSep] = useState<Sep>("newline");
  const [custom, setCustom] = useState(" | ");
  const [numbered, setNumbered] = useState(false);

  const separator = sep === "custom" ? custom.replace(/\\n/g, "\n").replace(/\\t/g, "\t") : SEPS[sep];
  const tooBig = input.length * times > MAX_CHARS;
  const output = useMemo(() => {
    if (!input || tooBig) return "";
    return Array.from({ length: times }, (_, i) => (numbered ? `${i + 1}. ${input}` : input)).join(separator);
  }, [input, times, separator, numbered, tooBig]);

  return (
    <ToolLayout toolId="text-repeater">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        sample="Hello 👋"
        filename="repeated.txt"
        minHeight={240}
        error={tooBig ? `That would be ${(input.length * times).toLocaleString()} characters — the limit is ${MAX_CHARS.toLocaleString()} to keep your browser responsive.` : undefined}
        options={
          <>
            <Field label="Repeat" htmlFor="times">
              <div className="flex items-center gap-1.5">
                <Input id="times" type="number" min={1} max={100000} value={times} onChange={(e) => setTimes(Math.max(1, Math.min(100000, Number(e.target.value) || 1)))} className="w-24" />
                {[5, 10, 100, 1000].map((n) => (
                  <button key={n} type="button" onClick={() => setTimes(n)} className="h-6 px-2 rounded-sm border border-border text-[11px] text-muted-foreground hover:text-foreground">
                    ×{n}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Separator">
              <Segmented
                size="sm"
                value={sep}
                onChange={setSep}
                options={[
                  { value: "newline", label: "New line" },
                  { value: "space", label: "Space" },
                  { value: "comma", label: "Comma" },
                  { value: "none", label: "None" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </Field>
            {sep === "custom" && (
              <Field label="Custom (\\n = newline)" htmlFor="csep">
                <Input id="csep" value={custom} onChange={(e) => setCustom(e.target.value)} className="w-32 font-mono" />
              </Field>
            )}
            <Toggle label="Number each" checked={numbered} onChange={setNumbered} />
          </>
        }
      />
    </ToolLayout>
  );
}
