"use client";

import { useCallback, useMemo, useState } from "react";
import { Braces, FileCode, Minimize2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import {
  ClearButton,
  CodeArea,
  CopyButton,
  DownloadButton,
  Segmented,
  StatusBadge,
  ToolAlert,
  ToolPanel,
  Toolbar,
  ToolbarSpacer,
} from "@/components/tool";

const EXAMPLE = {
  name: "EverydayTab",
  version: "1.0.0",
  features: ["Security", "Fast", "Private"],
  metadata: { author: "Faheem", status: "Development" },
};

type Indent = "2" | "4" | "tab";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<Indent>("2");

  const parse = useCallback(() => {
    if (!input.trim()) return null;
    try {
      const parsed = JSON.parse(input);
      setError(null);
      return parsed;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [input]);

  const beautify = () => {
    const parsed = parse();
    if (parsed !== null) setInput(JSON.stringify(parsed, null, indent === "tab" ? "\t" : Number(indent)));
  };

  const minify = () => {
    const parsed = parse();
    if (parsed !== null) setInput(JSON.stringify(parsed));
  };

  const valid = useMemo(() => {
    if (!input.trim()) return null;
    if (error) return false;
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }, [input, error]);

  const status = valid === null ? null : valid ? <StatusBadge tone="success">Valid JSON</StatusBadge> : <StatusBadge tone="error">Invalid JSON</StatusBadge>;
  const size = new Blob([input]).size;

  return (
    <ToolLayout toolId="json-formatter">
      <div className="space-y-3">
        <ToolPanel
          title="JSON"
          actions={
            <>
              {status}
              <span className="text-[11px] text-muted-foreground tabular-nums ml-1">{size.toLocaleString()} B</span>
            </>
          }
          footer={
            <Toolbar className="w-full">
              <Button size="lg" onClick={beautify} disabled={!input.trim()}>
                <Braces /> Beautify
              </Button>
              <Button variant="outline" onClick={minify} disabled={!input.trim()}>
                <Minimize2 /> Minify
              </Button>
              <Segmented
                size="sm"
                value={indent}
                onChange={setIndent}
                options={[
                  { value: "2", label: "2 spaces" },
                  { value: "4", label: "4 spaces" },
                  { value: "tab", label: "Tabs" },
                ]}
              />
              <ToolbarSpacer />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInput(JSON.stringify(EXAMPLE, null, 2));
                  setError(null);
                }}
              >
                <FileCode /> Example
              </Button>
              <CopyButton text={input} />
              <DownloadButton content={input} filename="formatted.json" mime="application/json" />
              <ClearButton onClick={() => { setInput(""); setError(null); }} iconOnly />
            </Toolbar>
          }
        >
          <CodeArea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder='Paste JSON here, or load the example…'
            minHeight={420}
          />
        </ToolPanel>

        {error && (
          <ToolAlert tone="error" title="Parsing error">
            <code className="font-mono text-xs">{error}</code>
          </ToolAlert>
        )}
      </div>
    </ToolLayout>
  );
}
