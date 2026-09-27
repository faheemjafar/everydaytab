"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ClearButton, CodeArea, CopyButton, Segmented, SplitLayout, StatusBadge, ToolPanel } from "@/components/tool";

type Mode = "encode" | "decode";

function convert(input: string, mode: Mode): { output: string; error?: string } {
  if (!input) return { output: "" };
  try {
    if (mode === "encode") {
      const bytes = new TextEncoder().encode(input);
      let bin = "";
      bytes.forEach((b) => (bin += String.fromCharCode(b)));
      return { output: btoa(bin) };
    }
    const bin = atob(input.replace(/\s/g, ""));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return { output: new TextDecoder().decode(bytes) };
  } catch {
    return { output: "", error: mode === "decode" ? "Not valid Base64" : "Could not encode input" };
  }
}

export default function Base64Converter() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => convert(input, mode), [input, mode]);

  const swap = () => {
    if (!output) return;
    setMode(mode === "encode" ? "decode" : "encode");
    setInput(output);
  };

  return (
    <ToolLayout toolId="base64">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              setInput("");
            }}
            options={[
              { value: "encode", label: "Encode" },
              { value: "decode", label: "Decode" },
            ]}
          />
          <Button variant="outline" size="sm" onClick={swap} disabled={!output} title="Use result as input">
            <ArrowLeftRight /> Swap
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">UTF-8 safe</span>
        </div>

        <SplitLayout>
          <ToolPanel
            title={mode === "encode" ? "Text" : "Base64"}
            actions={<ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />}
          >
            <CodeArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "encode" ? "Enter text to encode…" : "Paste Base64 to decode…"}
              minHeight={320}
            />
          </ToolPanel>
          <ToolPanel
            title={mode === "encode" ? "Base64" : "Text"}
            actions={
              <>
                {error ? <StatusBadge tone="error">{error}</StatusBadge> : output ? <StatusBadge tone="neutral">{output.length.toLocaleString()} chars</StatusBadge> : null}
                <CopyButton text={output} iconOnly />
              </>
            }
          >
            <CodeArea value={output} readOnly placeholder="Result appears here…" minHeight={320} />
          </ToolPanel>
        </SplitLayout>
      </div>
    </ToolLayout>
  );
}
