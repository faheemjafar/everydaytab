"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const isId = (k: string) => /^[A-Za-z_$][\w$]*$/.test(k);
const childPath = (path: string, key: string | number) => (typeof key === "number" ? `${path}[${key}]` : isId(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`);

function Value({ v }: { v: Json }) {
  if (v === null) return <span className="text-muted-foreground">null</span>;
  if (typeof v === "string") return <span className="text-emerald-700 dark:text-emerald-400 break-all">&quot;{v}&quot;</span>;
  if (typeof v === "number") return <span className="text-sky-700 dark:text-sky-400">{v}</span>;
  if (typeof v === "boolean") return <span className="text-amber-700 dark:text-amber-400">{String(v)}</span>;
  return null;
}

function Node({ name, value, path, depth, onPath, defaultOpen }: { name?: string | number; value: Json; path: string; depth: number; onPath: (p: string) => void; defaultOpen: number }) {
  const [open, setOpen] = useState(depth < defaultOpen);
  const isObj = value !== null && typeof value === "object";
  const entries: [string | number, Json][] = isObj ? (Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value)) : [];
  const label =
    name === undefined ? null : (
      <button type="button" onClick={() => onPath(path)} className="text-foreground hover:underline shrink-0" title={`Copy path ${path}`}>
        {typeof name === "number" ? name : name}
        <span className="text-muted-foreground">:</span>
      </button>
    );

  if (!isObj)
    return (
      <div className="flex gap-1.5 py-px pl-5">
        {label} <Value v={value} />
      </div>
    );

  const summary = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`;
  return (
    <div>
      <div className="flex items-center gap-1 py-px">
        <button type="button" onClick={() => setOpen(!open)} className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label={open ? "Collapse" : "Expand"}>
          <ChevronRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} />
        </button>
        {label}
        <span className="text-muted-foreground text-[11px]">{summary}</span>
      </div>
      {open && (
        <div className="ml-2 pl-2 border-l border-border">
          {entries.slice(0, 1000).map(([k, v]) => (
            <Node key={k} name={k} value={v} path={childPath(path, k)} depth={depth + 1} onPath={onPath} defaultOpen={defaultOpen} />
          ))}
          {entries.length > 1000 && <p className="pl-5 text-[11px] text-muted-foreground">… {entries.length - 1000} more</p>}
        </div>
      )}
    </div>
  );
}

/** Collapsible JSON tree. Clicking a key reports its JS path (e.g. $.items[0].name). */
export function JsonTree({ data, onPath, defaultOpen = 2 }: { data: unknown; onPath: (p: string) => void; defaultOpen?: number }) {
  return (
    <div className="font-mono text-[12.5px] leading-5 px-2 py-2">
      <Node value={data as Json} path="$" depth={0} onPath={onPath} defaultOpen={defaultOpen} />
    </div>
  );
}
