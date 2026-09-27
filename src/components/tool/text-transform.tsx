"use client";

import type { ReactNode } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClearButton, CopyButton, DownloadButton } from "./action-buttons";
import { CodeArea } from "./code-area";
import { StatusBadge, ToolAlert } from "./status";
import { SplitLayout, ToolPanel } from "./tool-panel";

const count = (s: string) => {
  const lines = s ? s.split("\n").length : 0;
  return `${lines} line${lines === 1 ? "" : "s"} · ${Array.from(s).length} chars`;
};

interface TextTransformProps {
  input: string;
  onInput: (v: string) => void;
  output: string;
  /** Controls shown in a toolbar above the editors. */
  options?: ReactNode;
  sample?: string;
  filename?: string;
  inputLabel?: string;
  outputLabel?: string;
  placeholder?: string;
  error?: ReactNode;
  minHeight?: number;
  /** Extra content under the editors (stats, previews…). */
  children?: ReactNode;
  /** Render output as prose (wrapped, proportional) instead of monospace. */
  outputNode?: ReactNode;
}

/** Standard "text in → text out" workspace used by most Text tools. */
export function TextTransform({
  input,
  onInput,
  output,
  options,
  sample,
  filename = "output.txt",
  inputLabel = "Input",
  outputLabel = "Output",
  placeholder = "Type or paste text…",
  error,
  minHeight = 320,
  children,
  outputNode,
}: TextTransformProps) {
  return (
    <div className="space-y-3">
      {options && <ToolPanel bodyClassName="p-3 flex flex-wrap items-end gap-x-5 gap-y-3">{options}</ToolPanel>}
      <SplitLayout>
        <ToolPanel
          title={inputLabel}
          actions={
            <>
              <StatusBadge>{count(input)}</StatusBadge>
              {sample && !input && (
                <Button variant="ghost" size="sm" onClick={() => onInput(sample)}>
                  Sample
                </Button>
              )}
              <label className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer" title="Open a text file">
                <FileText className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept=".txt,.csv,.md,.json,.log,.html,.xml,text/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) onInput(await f.text());
                    e.target.value = "";
                  }}
                />
              </label>
              <ClearButton onClick={() => onInput("")} iconOnly disabled={!input} />
            </>
          }
        >
          <CodeArea value={input} onChange={(e) => onInput(e.target.value)} placeholder={placeholder} minHeight={minHeight} />
        </ToolPanel>
        <ToolPanel
          title={outputLabel}
          actions={
            <>
              <StatusBadge>{count(output)}</StatusBadge>
              <Button variant="ghost" size="icon-sm" onClick={() => onInput(output)} disabled={!output || output === input} title="Use output as input" aria-label="Use output as input">
                <ArrowLeft />
              </Button>
              <DownloadButton content={output} filename={filename} mime="text/plain" iconOnly />
              <CopyButton text={output} iconOnly />
            </>
          }
        >
          {outputNode ?? <CodeArea value={output} readOnly minHeight={minHeight} />}
        </ToolPanel>
      </SplitLayout>
      {error && <ToolAlert tone="error">{error}</ToolAlert>}
      {children}
    </div>
  );
}

/** Compact labelled toggle for toolbars. */
export function Toggle({ label, checked, onChange, hint }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="inline-flex items-center gap-2 h-(--control-h) text-[13px] cursor-pointer select-none" title={hint}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-3.5 accent-primary" />
      {label}
    </label>
  );
}
