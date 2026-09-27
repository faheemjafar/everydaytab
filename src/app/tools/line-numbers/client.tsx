"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type Mode = "add" | "remove";
type Sep = ". " | ") " | ": " | " - " | "\t" | " ";
const SEPS: { value: Sep; label: string }[] = [
  { value: ". ", label: "1." },
  { value: ") ", label: "1)" },
  { value: ": ", label: "1:" },
  { value: " - ", label: "1 -" },
  { value: "\t", label: "1⇥" },
  { value: " ", label: "1 ␣" },
];

export default function LineNumbers() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("add");
  const [start, setStart] = useState(1);
  const [step, setStep] = useState(1);
  const [sep, setSep] = useState<Sep>(". ");
  const [pad, setPad] = useState(true);
  const [skipBlank, setSkipBlank] = useState(false);

  const output = useMemo(() => {
    if (!input) return "";
    const lines = input.split("\n");
    if (mode === "remove") return lines.map((l) => l.replace(/^\s*(\d+|[ivxlcdm]+|[a-z])[.):\-\]]?\s+/i, (m, n) => (/^\d+$/.test(n) || /[.):\-\]]/.test(m) ? "" : m))).join("\n");
    const count = skipBlank ? lines.filter((l) => l.trim()).length : lines.length;
    const width = String(start + (count - 1) * step).length;
    let n = start;
    return lines
      .map((l) => {
        if (skipBlank && !l.trim()) return l;
        const num = pad ? String(n).padStart(width, " ") : String(n);
        n += step;
        return `${num}${sep}${l}`;
      })
      .join("\n");
  }, [input, mode, start, step, sep, pad, skipBlank]);

  return (
    <ToolLayout toolId="line-numbers">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        sample={"Apple\nBanana\n\nCherry\nDate\nElderberry\nFig\nGrape\nHoneydew\nKiwi\nLemon"}
        filename="numbered.txt"
        options={
          <>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "add", label: "Add numbers" },
                { value: "remove", label: "Remove numbers" },
              ]}
            />
            {mode === "add" && (
              <>
                <Field label="Start" htmlFor="ln-start">
                  <Input id="ln-start" type="number" value={start} onChange={(e) => setStart(Number(e.target.value) || 0)} className="w-20" />
                </Field>
                <Field label="Step" htmlFor="ln-step">
                  <Input id="ln-step" type="number" min={1} value={step} onChange={(e) => setStep(Math.max(1, Number(e.target.value) || 1))} className="w-16" />
                </Field>
                <Field label="Format">
                  <Segmented size="sm" value={sep} onChange={setSep} options={SEPS} />
                </Field>
                <Toggle label="Align numbers" checked={pad} onChange={setPad} />
                <Toggle label="Skip blank lines" checked={skipBlank} onChange={setSkipBlank} />
              </>
            )}
          </>
        }
      />
    </ToolLayout>
  );
}
