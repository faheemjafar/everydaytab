"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ClearButton, CodeArea, CopyButton, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

const words = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-.]+/)
    .filter(Boolean);
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

const CONVERSIONS: { label: string; id: string; group: "Standard" | "Developer"; fn: (s: string) => string; mono?: boolean }[] = [
  { label: "Sentence case", id: "sentence", group: "Standard", fn: (s) => s.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (c) => c.toUpperCase()) },
  { label: "Title Case", id: "title", group: "Standard", fn: (s) => s.split(/(\s+)/).map((w) => (/\s/.test(w) ? w : cap(w))).join("") },
  { label: "UPPERCASE", id: "upper", group: "Standard", fn: (s) => s.toUpperCase() },
  { label: "lowercase", id: "lower", group: "Standard", fn: (s) => s.toLowerCase() },
  { label: "aLtErNaTiNg", id: "alt", group: "Standard", fn: (s) => Array.from(s).map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join("") },
  { label: "InVeRsE", id: "inv", group: "Standard", fn: (s) => Array.from(s).map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("") },
  { label: "camelCase", id: "camel", group: "Developer", mono: true, fn: (s) => words(s).map((w, i) => (i ? cap(w) : w.toLowerCase())).join("") },
  { label: "PascalCase", id: "pascal", group: "Developer", mono: true, fn: (s) => words(s).map(cap).join("") },
  { label: "snake_case", id: "snake", group: "Developer", mono: true, fn: (s) => words(s).map((w) => w.toLowerCase()).join("_") },
  { label: "SCREAMING_SNAKE", id: "screaming", group: "Developer", mono: true, fn: (s) => words(s).map((w) => w.toUpperCase()).join("_") },
  { label: "kebab-case", id: "kebab", group: "Developer", mono: true, fn: (s) => words(s).map((w) => w.toLowerCase()).join("-") },
  { label: "dot.case", id: "dot", group: "Developer", mono: true, fn: (s) => words(s).map((w) => w.toLowerCase()).join(".") },
];

export default function CaseConverter() {
  const [input, setInput] = useState("");
  const has = input.trim().length > 0;

  return (
    <ToolLayout toolId="case-converter">
      <div className="space-y-3">
        <ToolPanel title="Text" actions={<ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />}>
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or paste text…" className="font-sans text-sm" minHeight={140} />
        </ToolPanel>

        {(["Standard", "Developer"] as const).map((group) => (
          <ToolPanel key={group} title={group}>
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y divide-border md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-r md:[&>li:nth-child(2n)]:border-r-0 xl:[&>li:nth-child(2n)]:border-r xl:[&>li:nth-child(3n)]:border-r-0 [&>li]:border-border">
              {CONVERSIONS.filter((c) => c.group === group).map((c) => {
                const out = has ? c.fn(input) : "";
                return (
                  <li key={c.id} className="group px-3.5 py-2.5 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[11px] font-semibold text-muted-foreground", c.mono && "font-mono")}>{c.label}</span>
                      <span className="flex-1" />
                      <CopyButton text={out} iconOnly className={cn("h-6 w-6", !out && "invisible")} />
                    </div>
                    <p className={cn("text-[13px] break-words line-clamp-3 leading-relaxed", c.mono && "font-mono", !out && "text-muted-foreground/50")}>{out || "—"}</p>
                  </li>
                );
              })}
            </ul>
          </ToolPanel>
        ))}
      </div>
    </ToolLayout>
  );
}
