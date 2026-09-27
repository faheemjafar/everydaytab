"use client";

import type { ReactNode } from "react";
import { ClearButton, CopyButton, DownloadButton } from "./action-buttons";
import { CodeArea } from "./code-area";
import { StatusBadge, ToolAlert } from "./status";
import { SplitLayout, ToolPanel } from "./tool-panel";

/** Shared layout for JSON → code generators (TypeScript, Go, JSON Schema…). */
export function JsonCodegen({
  input,
  onInput,
  output,
  error,
  options,
  outputLabel,
  filename,
  sample,
}: {
  input: string;
  onInput: (v: string) => void;
  output: string;
  error: string | null;
  options: ReactNode;
  outputLabel: string;
  filename: string;
  sample: string;
}) {
  return (
    <div className="space-y-3">
      <ToolPanel bodyClassName="p-3 flex flex-wrap items-end gap-x-5 gap-y-3">{options}</ToolPanel>
      <SplitLayout>
        <ToolPanel
          title="JSON"
          actions={
            <>
              {!input && (
                <button type="button" onClick={() => onInput(sample)} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">
                  Sample
                </button>
              )}
              <ClearButton onClick={() => onInput("")} iconOnly disabled={!input} />
            </>
          }
        >
          <CodeArea value={input} onChange={(e) => onInput(e.target.value)} minHeight={420} placeholder="Paste a JSON sample — arrays of objects are merged to find optional fields." />
        </ToolPanel>
        <ToolPanel
          title={outputLabel}
          actions={
            <>
              {output && <StatusBadge>{output.split("\n").length} lines</StatusBadge>}
              <DownloadButton content={output} filename={filename} mime="text/plain" iconOnly />
              <CopyButton text={output} iconOnly />
            </>
          }
        >
          <CodeArea value={output} readOnly minHeight={420} />
        </ToolPanel>
      </SplitLayout>
      {error && <ToolAlert tone="error" title="Invalid JSON">{error}</ToolAlert>}
    </div>
  );
}

export function parseJsonInput(input: string): { value?: unknown; error: string | null } {
  if (!input.trim()) return { error: null };
  try {
    return { value: JSON.parse(input), error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
