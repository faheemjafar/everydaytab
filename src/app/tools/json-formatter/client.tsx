"use client";

import { useMemo, useState } from "react";
import JSON5 from "json5";
import { Braces, FileCode, Minimize2, Wrench } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ClearButton, CodeArea, CopyButton, DownloadButton, JsonTree, Segmented, SplitLayout, StatusBadge, ToolAlert, ToolPanel, Toggle, Toolbar, ToolbarSpacer } from "@/components/tool";

const EXAMPLE = `{
  // JSON5 is accepted too: comments, trailing commas, single quotes
  name: 'EverydayTab',
  version: "2.0.0",
  features: ["Private", "Fast", "Offline",],
  metadata: { author: "Faheem Jafar", tools: 212, "open source": true },
  releases: [{ tag: "v1", date: "2025-01-01" }, { tag: "v2", date: null }],
}`;

type Indent = "2" | "4" | "tab";
type View = "tree" | "text";

/** Line/column of a JSON.parse error, from V8/SpiderMonkey messages. */
function locate(input: string, msg: string) {
  const pos = msg.match(/position (\d+)/)?.[1];
  if (pos) {
    const before = input.slice(0, Number(pos));
    return { line: before.split("\n").length, col: before.length - before.lastIndexOf("\n") };
  }
  const lc = msg.match(/line (\d+) column (\d+)/);
  return lc ? { line: Number(lc[1]), col: Number(lc[2]) } : null;
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  return v;
}

function stats(v: unknown) {
  let keys = 0;
  let depth = 0;
  const walk = (x: unknown, d: number) => {
    depth = Math.max(depth, d);
    if (Array.isArray(x)) x.forEach((y) => walk(y, d + 1));
    else if (x && typeof x === "object") Object.values(x).forEach((y) => { keys++; walk(y, d + 1); });
  };
  walk(v, 0);
  return { keys, depth };
}

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<Indent>("2");
  const [view, setView] = useState<View>("tree");
  const [sort, setSort] = useState(false);
  const [path, setPath] = useState<string | null>(null);

  // Strict parse first; fall back to JSON5 so we can offer a one-click repair.
  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true as const, value: JSON.parse(input), lenient: false };
    } catch (e) {
      const msg = (e as Error).message;
      try {
        return { ok: true as const, value: JSON5.parse(input), lenient: true, strictError: msg };
      } catch (e5) {
        // JSON5 reports "at line:col", which V8 no longer always includes.
        const m5 = (e5 as Error).message.match(/at (\d+):(\d+)/);
        return { ok: false as const, error: msg, at: locate(input, msg) ?? (m5 ? { line: Number(m5[1]), col: Number(m5[2]) } : null) };
      }
    }
  }, [input]);

  const space = indent === "tab" ? "\t" : Number(indent);
  const value = parsed?.ok ? (sort ? sortKeys(parsed.value) : parsed.value) : undefined;
  const pretty = parsed?.ok ? JSON.stringify(value, null, space) : "";
  const info = parsed?.ok ? stats(parsed.value) : null;

  const status = !parsed ? null : !parsed.ok ? <StatusBadge tone="error">Invalid</StatusBadge> : parsed.lenient ? <StatusBadge tone="warning">JSON5 / needs repair</StatusBadge> : <StatusBadge tone="success">Valid JSON</StatusBadge>;

  return (
    <ToolLayout toolId="json-formatter">
      <div className="space-y-3">
        <SplitLayout>
          <ToolPanel
            title="Input"
            actions={
              <>
                {status}
                <span className="text-[11px] text-muted-foreground tabular-nums">{new Blob([input]).size.toLocaleString()} B</span>
              </>
            }
            footer={
              <Toolbar className="w-full">
                <Button size="lg" onClick={() => parsed?.ok && setInput(pretty)} disabled={!parsed?.ok}>
                  {parsed?.ok && parsed.lenient ? <Wrench /> : <Braces />} {parsed?.ok && parsed.lenient ? "Repair & format" : "Format"}
                </Button>
                <Button variant="outline" onClick={() => parsed?.ok && setInput(JSON.stringify(value))} disabled={!parsed?.ok}>
                  <Minimize2 /> Minify
                </Button>
                <ToolbarSpacer />
                <Button variant="ghost" size="sm" onClick={() => setInput(EXAMPLE)}>
                  <FileCode /> Example
                </Button>
                <ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />
              </Toolbar>
            }
          >
            <CodeArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JSON (or JSON5) here…" minHeight={440} />
          </ToolPanel>

          <ToolPanel
            title={<Segmented size="sm" value={view} onChange={setView} options={[{ value: "tree", label: "Tree" }, { value: "text", label: "Formatted" }]} />}
            actions={
              <>
                {view === "text" && <Segmented size="sm" value={indent} onChange={setIndent} options={[{ value: "2", label: "2" }, { value: "4", label: "4" }, { value: "tab", label: "Tab" }]} />}
                <Toggle label="Sort keys" checked={sort} onChange={setSort} />
                <CopyButton text={pretty} iconOnly />
                <DownloadButton content={pretty} filename="formatted.json" mime="application/json" iconOnly />
              </>
            }
            footer={
              info ? (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {info.keys.toLocaleString()} keys · depth {info.depth} · {new Blob([JSON.stringify(value)]).size.toLocaleString()} B minified
                  {path && (
                    <>
                      {" · "}
                      <code className="font-mono text-foreground">{path}</code> <CopyButton text={path} iconOnly className="inline-flex" />
                    </>
                  )}
                </span>
              ) : undefined
            }
          >
            {parsed?.ok ? (
              view === "tree" ? (
                <div className="max-h-[520px] overflow-auto custom-scrollbar">
                  <JsonTree data={value} onPath={setPath} />
                </div>
              ) : (
                <CodeArea value={pretty} readOnly minHeight={440} />
              )
            ) : (
              <p className="px-4 py-10 text-center text-xs text-muted-foreground">{parsed ? "Fix the error to see the result." : "Formatted output and a collapsible tree appear here."}</p>
            )}
          </ToolPanel>
        </SplitLayout>

        {parsed && !parsed.ok && (
          <ToolAlert tone="error" title={parsed.at ? `Syntax error at line ${parsed.at.line}, column ${parsed.at.col}` : "Syntax error"}>
            <code className="font-mono text-xs">{parsed.error}</code>
          </ToolAlert>
        )}
        {parsed?.ok && parsed.lenient && (
          <ToolAlert tone="warning" title="Not strict JSON">
            Parsed as JSON5 (comments, trailing commas, unquoted keys or single quotes). Click <strong>Repair &amp; format</strong> to convert it to valid JSON. <span className="text-muted-foreground">Strict error: {parsed.strictError}</span>
          </ToolAlert>
        )}
      </div>
    </ToolLayout>
  );
}
