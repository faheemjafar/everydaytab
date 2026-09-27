"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ClearButton, CodeArea, CopyButton, Field, Segmented, SplitLayout, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";

type Mode = "encode" | "decode";
type Base = "2" | "16" | "8" | "10";
const WIDTH: Record<Base, number> = { "2": 8, "16": 2, "8": 3, "10": 0 };

// UTF-8 bytes, so accented letters and emoji round-trip correctly.
const encode = (s: string, base: Base, sep: string) => Array.from(new TextEncoder().encode(s)).map((b) => b.toString(Number(base)).padStart(WIDTH[base], "0")).join(sep);

function decode(s: string, base: Base): { text: string; error: string | null } {
  const clean = s.trim();
  if (!clean) return { text: "", error: null };
  // Accept separated tokens, or an unbroken binary/hex stream.
  const tokens = /[\s,]/.test(clean) ? clean.split(/[\s,]+/) : base === "2" ? clean.match(/.{1,8}/g)! : base === "16" ? clean.match(/.{1,2}/g)! : [clean];
  const bytes: number[] = [];
  for (const t of tokens) {
    const n = parseInt(t, Number(base));
    if (Number.isNaN(n) || n > 255 || !new RegExp(`^[${base === "16" ? "0-9a-f" : base === "2" ? "01" : base === "8" ? "0-7" : "0-9"}]+$`, "i").test(t)) return { text: "", error: `“${t}” isn't a valid base-${base} byte.` };
    bytes.push(n);
  }
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)), error: null };
  } catch {
    return { text: new TextDecoder().decode(new Uint8Array(bytes)), error: "Some bytes aren't valid UTF-8 (shown as �)." };
  }
}

export default function TextBinaryConverter() {
  const [mode, setMode] = useState<Mode>("encode");
  const [base, setBase] = useState<Base>("2");
  const [spaced, setSpaced] = useState(true);
  const [input, setInput] = useState("Hello 👋");

  const result = useMemo(() => (mode === "encode" ? { text: encode(input, base, spaced ? " " : ""), error: null } : decode(input, base)), [input, mode, base, spaced]);

  const swap = () => {
    setMode(mode === "encode" ? "decode" : "encode");
    setInput(result.text);
  };

  return (
    <ToolLayout toolId="text-binary">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3 flex flex-wrap items-end gap-4">
          <Field label="Direction">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "encode", label: "Text → code" },
                { value: "decode", label: "Code → text" },
              ]}
            />
          </Field>
          <Field label="Format">
            <Segmented
              value={base}
              onChange={setBase}
              options={[
                { value: "2", label: "Binary" },
                { value: "16", label: "Hex" },
                { value: "8", label: "Octal" },
                { value: "10", label: "Decimal" },
              ]}
            />
          </Field>
          {mode === "encode" && (
            <Field label="Separator">
              <Segmented
                value={spaced ? "space" : "none"}
                onChange={(v) => setSpaced(v === "space")}
                options={[
                  { value: "space", label: "Space" },
                  { value: "none", label: "None" },
                ]}
              />
            </Field>
          )}
          <Button variant="outline" onClick={swap} disabled={!result.text} className="ml-auto">
            <ArrowUpDown /> Swap
          </Button>
        </ToolPanel>
        <SplitLayout>
          <ToolPanel title={mode === "encode" ? "Text" : "Code"} actions={<ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />}>
            <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={260} placeholder={mode === "encode" ? "Type text…" : "01001000 01101001"} />
          </ToolPanel>
          <ToolPanel title={mode === "encode" ? "Code" : "Text"} actions={<><StatusBadge>{new TextEncoder().encode(mode === "encode" ? input : result.text).length} bytes</StatusBadge><CopyButton text={result.text} iconOnly /></>}>
            <CodeArea value={result.text} readOnly minHeight={260} />
          </ToolPanel>
        </SplitLayout>
        {result.error && <ToolAlert tone="warning">{result.error}</ToolAlert>}
      </div>
    </ToolLayout>
  );
}
