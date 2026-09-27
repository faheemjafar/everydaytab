"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ClearButton, CodeArea, CopyButton, DownloadButton, Segmented, SplitLayout, StatusBadge, ToolPanel, Toggle } from "@/components/tool";
import { diffLines, unified, type DiffRow, type Op } from "@/lib/diff";
import { cn } from "@/lib/utils";

type View = "split" | "inline" | "unified";

const SAMPLE_A = "The quick brown fox\njumps over the lazy dog.\n\nShipping: 3–5 days\nPrice: $20\nColour: red";
const SAMPLE_B = "The quick brown fox\nleaps over the lazy dog!\n\nShipping: 2–4 days\nPrice: $20\nColour: red\nSize: M";

function Words({ ops, side }: { ops: Op<string>[]; side: "left" | "right" }) {
  return (
    <>
      {ops.map((o, i) =>
        o.type === "equal" ? (
          <span key={i}>{o.value}</span>
        ) : (o.type === "remove" && side === "left") || (o.type === "add" && side === "right") ? (
          <mark key={i} className={cn("rounded-[2px] text-inherit", side === "left" ? "bg-red-500/25" : "bg-emerald-500/25")}>{o.value}</mark>
        ) : null
      )}
    </>
  );
}

const rowBg = { left: "bg-red-500/[0.07]", right: "bg-emerald-500/[0.07]" };

function Cell({ row, side }: { row: DiffRow; side: "left" | "right" }) {
  const text = side === "left" ? row.left : row.right;
  const no = side === "left" ? row.leftNo : row.rightNo;
  const changed = (side === "left" && (row.type === "remove" || row.type === "change")) || (side === "right" && (row.type === "add" || row.type === "change"));
  return (
    <div className={cn("flex min-h-6", changed && rowBg[side], text === undefined && "bg-muted/40")}>
      <span className="w-10 shrink-0 pr-2 text-right text-[11px] leading-6 text-muted-foreground/70 select-none tabular-nums">{no ?? ""}</span>
      <span className="w-4 shrink-0 leading-6 text-muted-foreground select-none">{changed ? (side === "left" ? "−" : "+") : ""}</span>
      <span className="flex-1 whitespace-pre-wrap break-all leading-6 pr-2">{row.type === "change" && row.words ? <Words ops={row.words} side={side} /> : text}</span>
    </div>
  );
}

export default function TextDiff() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [view, setView] = useState<View>("split");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWs, setIgnoreWs] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(false);

  const rows = useMemo(() => (a || b ? diffLines(a, b, { ignoreCase, ignoreWhitespace: ignoreWs }) : []), [a, b, ignoreCase, ignoreWs]);
  const stats = useMemo(() => ({ add: rows.filter((r) => r.type === "add").length, rem: rows.filter((r) => r.type === "remove").length, chg: rows.filter((r) => r.type === "change").length }), [rows]);
  const patch = useMemo(() => unified(rows, "original", "changed"), [rows]);
  const identical = rows.length > 0 && rows.every((r) => r.type === "equal");
  const shown = onlyChanges ? rows.filter((r, i) => r.type !== "equal" || rows.slice(Math.max(0, i - 2), i + 3).some((x) => x.type !== "equal")) : rows;

  const editor = (label: string, value: string, set: (v: string) => void) => (
    <ToolPanel title={label} actions={<><StatusBadge>{value ? value.split("\n").length : 0} lines</StatusBadge><ClearButton onClick={() => set("")} iconOnly disabled={!value} /></>}>
      <CodeArea value={value} onChange={(e) => set(e.target.value)} minHeight={200} placeholder={`Paste ${label.toLowerCase()} text…`} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="text-diff">
      <div className="space-y-3">
        <SplitLayout>
          {editor("Original", a, setA)}
          {editor("Changed", b, setB)}
        </SplitLayout>

        <ToolPanel bodyClassName="p-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Segmented size="sm" value={view} onChange={setView} options={[{ value: "split", label: "Side by side" }, { value: "inline", label: "Inline" }, { value: "unified", label: "Unified patch" }]} />
          <Toggle label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
          <Toggle label="Ignore whitespace" checked={ignoreWs} onChange={setIgnoreWs} />
          <Toggle label="Only changes" checked={onlyChanges} onChange={setOnlyChanges} />
          <span className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => { setA(b); setB(a); }} disabled={!a && !b}>
            <ArrowLeftRight /> Swap
          </Button>
          {!a && !b && (
            <Button variant="outline" size="sm" onClick={() => { setA(SAMPLE_A); setB(SAMPLE_B); }}>
              Load example
            </Button>
          )}
        </ToolPanel>

        {rows.length > 0 && (
          <ToolPanel
            title={identical ? "No differences" : "Differences"}
            actions={
              identical ? (
                <StatusBadge tone="success">Identical{ignoreCase || ignoreWs ? " (with ignore options)" : ""}</StatusBadge>
              ) : (
                <>
                  <StatusBadge tone="success">+{stats.add + stats.chg}</StatusBadge>
                  <StatusBadge tone="error">−{stats.rem + stats.chg}</StatusBadge>
                  <CopyButton text={patch} iconOnly />
                  <DownloadButton content={patch} filename="changes.diff" mime="text/x-diff" iconOnly />
                </>
              )
            }
          >
            <div className="font-mono text-[12.5px] max-h-[640px] overflow-auto custom-scrollbar">
              {view === "unified" ? (
                <pre className="px-3.5 py-3">
                  {patch.split("\n").map((l, i) => (
                    <div key={i} className={cn(l.startsWith("+") && !l.startsWith("+++") && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", l.startsWith("-") && !l.startsWith("---") && "bg-red-500/10 text-red-700 dark:text-red-400", l.startsWith("@@") && "text-primary")}>
                      {l || " "}
                    </div>
                  ))}
                </pre>
              ) : view === "split" ? (
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div>{shown.map((r, i) => <Cell key={i} row={r} side="left" />)}</div>
                  <div>{shown.map((r, i) => <Cell key={i} row={r} side="right" />)}</div>
                </div>
              ) : (
                <div>
                  {shown.flatMap((r, i) =>
                    r.type === "equal" ? [<Cell key={i} row={r} side="left" />] : [r.left !== undefined && <Cell key={`${i}l`} row={{ ...r, right: undefined }} side="left" />, r.right !== undefined && <Cell key={`${i}r`} row={{ ...r, left: undefined }} side="right" />]
                  )}
                </div>
              )}
            </div>
          </ToolPanel>
        )}
      </div>
    </ToolLayout>
  );
}
