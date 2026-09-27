"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ClearButton, CodeArea, CopyButton, Segmented, SplitLayout, StatusBadge, ToolAlert, ToolPanel, Toggle } from "@/components/tool";
import { diffLines, type DiffRow } from "@/lib/diff";
import { cn } from "@/lib/utils";

const A = `{\n  "name": "EverydayTab",\n  "version": "1.0.0",\n  "private": true,\n  "tags": ["tools", "web"],\n  "author": { "name": "Faheem", "url": null },\n  "scripts": { "dev": "next dev", "build": "next build" }\n}`;
const B = `{\n  "name": "EverydayTab",\n  "version": "2.0.0",\n  "tags": ["web", "tools", "privacy"],\n  "author": { "name": "Faheem Jafar", "url": "https://everydaytab.com" },\n  "scripts": { "dev": "next dev --turbo", "build": "next build", "lint": "eslint ." },\n  "license": "MIT"\n}`;

type Change = { kind: "added" | "removed" | "changed"; path: string; from?: unknown; to?: unknown };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const key = (p: string, k: string | number) => (typeof k === "number" ? `${p}[${k}]` : /^[A-Za-z_$][\w$]*$/.test(k) ? `${p}.${k}` : `${p}[${JSON.stringify(k)}]`);
const canon = (v: unknown): string => JSON.stringify(v, (_, x) => (isObj(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));

function diff(a: unknown, b: unknown, path: string, unordered: boolean, out: Change[]) {
  if (isObj(a) && isObj(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in b)) out.push({ kind: "removed", path: key(path, k), from: a[k] });
      else if (!(k in a)) out.push({ kind: "added", path: key(path, k), to: b[k] });
      else diff(a[k], b[k], key(path, k), unordered, out);
    }
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (unordered) {
      // Multiset comparison by canonical value.
      const rest = b.map(canon);
      a.forEach((x, i) => {
        const j = rest.indexOf(canon(x));
        if (j === -1) out.push({ kind: "removed", path: key(path, i), from: x });
        else rest[j] = "\u0000";
      });
      rest.forEach((c, j) => c !== "\u0000" && out.push({ kind: "added", path: key(path, j), to: b[j] }));
    } else {
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (i >= b.length) out.push({ kind: "removed", path: key(path, i), from: a[i] });
        else if (i >= a.length) out.push({ kind: "added", path: key(path, i), to: b[i] });
        else diff(a[i], b[i], key(path, i), unordered, out);
      }
    }
  } else if (canon(a) !== canon(b)) out.push({ kind: "changed", path, from: a, to: b });
  return out;
}

const show = (v: unknown) => {
  const s = JSON.stringify(v);
  return s && s.length > 80 ? `${s.slice(0, 80)}…` : s;
};

export default function JSONDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [unordered, setUnordered] = useState(false);
  const [view, setView] = useState<"changes" | "side">("changes");

  const result = useMemo((): null | { error: string } | { changes: Change[]; rows: DiffRow[] } => {
    if (!left.trim() || !right.trim()) return null;
    let a: unknown, b: unknown;
    try { a = JSON.parse(left); } catch (e) { return { error: `Left: ${(e as Error).message}` }; }
    try { b = JSON.parse(right); } catch (e) { return { error: `Right: ${(e as Error).message}` }; }
    const changes = diff(a, b, "$", unordered, []);
    const sortStr = (v: unknown) => JSON.stringify(JSON.parse(canon(v)), null, 2);
    return { changes, rows: diffLines(sortStr(a), sortStr(b)) };
  }, [left, right, unordered]);

  const counts = result && "changes" in result ? { added: result.changes.filter((c) => c.kind === "added").length, removed: result.changes.filter((c) => c.kind === "removed").length, changed: result.changes.filter((c) => c.kind === "changed").length } : null;
  const report = result && "changes" in result ? result.changes.map((c) => (c.kind === "changed" ? `~ ${c.path}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}` : `${c.kind === "added" ? "+" : "-"} ${c.path}: ${JSON.stringify(c.kind === "added" ? c.to : c.from)}`)).join("\n") : "";

  const editor = (label: string, value: string, set: (v: string) => void) => (
    <ToolPanel title={label} actions={<ClearButton onClick={() => set("")} iconOnly disabled={!value} />}>
      <CodeArea value={value} onChange={(e) => set(e.target.value)} minHeight={240} placeholder={`Paste ${label.toLowerCase()} JSON…`} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="json-diff">
      <div className="space-y-3">
        <SplitLayout>
          {editor("Original", left, setLeft)}
          {editor("Modified", right, setRight)}
        </SplitLayout>
        <ToolPanel bodyClassName="p-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Segmented size="sm" value={view} onChange={setView} options={[{ value: "changes", label: "Changes by path" }, { value: "side", label: "Side by side" }]} />
          <Toggle label="Ignore array order" checked={unordered} onChange={setUnordered} />
          <span className="text-[11px] text-muted-foreground">Key order is always ignored.</span>
          <span className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => { setLeft(right); setRight(left); }}><ArrowLeftRight /> Swap</Button>
          {!left && !right && <Button variant="outline" size="sm" onClick={() => { setLeft(A); setRight(B); }}>Load example</Button>}
        </ToolPanel>

        {result && "error" in result && <ToolAlert tone="error">{result.error}</ToolAlert>}
        {result && "changes" in result && counts && (
          <ToolPanel
            title={result.changes.length ? `${result.changes.length} difference${result.changes.length === 1 ? "" : "s"}` : "Identical"}
            actions={
              result.changes.length ? (
                <>
                  <StatusBadge tone="success">+{counts.added}</StatusBadge>
                  <StatusBadge tone="error">−{counts.removed}</StatusBadge>
                  <StatusBadge tone="warning">~{counts.changed}</StatusBadge>
                  <CopyButton text={report} iconOnly />
                </>
              ) : (
                <StatusBadge tone="success">Semantically equal</StatusBadge>
              )
            }
          >
            {view === "changes" ? (
              <ul className="divide-y divide-border font-mono text-[12.5px] max-h-[560px] overflow-auto custom-scrollbar">
                {result.changes.map((c, i) => (
                  <li key={i} className={cn("flex items-start gap-3 px-3.5 py-2", c.kind === "added" && "bg-emerald-500/[0.07]", c.kind === "removed" && "bg-red-500/[0.07]", c.kind === "changed" && "bg-amber-500/[0.07]")}>
                    <span className={cn("w-4 shrink-0 font-semibold", c.kind === "added" ? "text-emerald-600" : c.kind === "removed" ? "text-red-600" : "text-amber-600")}>{c.kind === "added" ? "+" : c.kind === "removed" ? "−" : "~"}</span>
                    <span className="shrink-0 text-foreground">{c.path}</span>
                    <span className="flex-1 min-w-0 break-all text-muted-foreground">
                      {c.kind === "changed" ? (
                        <>
                          <span className="line-through decoration-red-500/60">{show(c.from)}</span> → <span className="text-foreground">{show(c.to)}</span>
                        </>
                      ) : (
                        show(c.kind === "added" ? c.to : c.from)
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid grid-cols-2 divide-x divide-border font-mono text-[12.5px] max-h-[560px] overflow-auto custom-scrollbar">
                {(["left", "right"] as const).map((side) => (
                  <div key={side}>
                    {result.rows.map((r, i) => {
                      const text = side === "left" ? r.left : r.right;
                      const hit = (side === "left" && (r.type === "remove" || r.type === "change")) || (side === "right" && (r.type === "add" || r.type === "change"));
                      return (
                        <div key={i} className={cn("px-3 min-h-6 leading-6 whitespace-pre-wrap break-all", hit && (side === "left" ? "bg-red-500/10" : "bg-emerald-500/10"), text === undefined && "bg-muted/40")}>
                          {text ?? ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </ToolPanel>
        )}
      </div>
    </ToolLayout>
  );
}
