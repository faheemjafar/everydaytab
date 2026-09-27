"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, Field, ToolPanel, Toggle } from "@/components/tool";
import { cn } from "@/lib/utils";

const WHO = [
  { key: "u", label: "Owner" },
  { key: "g", label: "Group" },
  { key: "o", label: "Others" },
] as const;
const BITS = [
  { key: "r", label: "Read", v: 4 },
  { key: "w", label: "Write", v: 2 },
  { key: "x", label: "Execute", v: 1 },
] as const;
const SPECIAL = [
  { v: 4, label: "setuid", hint: "Run as the file's owner" },
  { v: 2, label: "setgid", hint: "Run as group / new files inherit group" },
  { v: 1, label: "sticky", hint: "Only owners can delete (e.g. /tmp)" },
] as const;

const PRESETS: [string, string][] = [
  ["644", "Files — owner edits, everyone reads"],
  ["755", "Scripts & directories"],
  ["600", "Private file (SSH keys)"],
  ["700", "Private directory"],
  ["664", "Shared group file"],
  ["775", "Shared group directory"],
  ["1777", "World-writable with sticky bit (/tmp)"],
  ["400", "Read-only for owner"],
];

/** Mode as [special, u, g, o] digits. */
type Mode = [number, number, number, number];

function symbolic([s, u, g, o]: Mode, dir: boolean) {
  const trio = (d: number, special: boolean, ch: string) => `${d & 4 ? "r" : "-"}${d & 2 ? "w" : "-"}${special ? (d & 1 ? ch : ch.toUpperCase()) : d & 1 ? "x" : "-"}`;
  return (dir ? "d" : "-") + trio(u, !!(s & 4), "s") + trio(g, !!(s & 2), "s") + trio(o, !!(s & 1), "t");
}

function parseOctal(t: string): Mode | null {
  if (!/^[0-7]{3,4}$/.test(t)) return null;
  const d = t.padStart(4, "0").split("").map(Number);
  return [d[0], d[1], d[2], d[3]];
}

function parseSymbolic(t: string): Mode | null {
  const m = t.trim().match(/^[-dlcbps]?([r-][w-][xsS-])([r-][w-][xsS-])([r-][w-][xtT-])$/);
  if (!m) return null;
  let s = 0;
  const digit = (p: string, i: number) => {
    if (/[sStT]/.test(p[2])) s |= [4, 2, 1][i];
    return (p[0] === "r" ? 4 : 0) + (p[1] === "w" ? 2 : 0) + (/[xst]/.test(p[2]) ? 1 : 0);
  };
  return [s, digit(m[1], 0), digit(m[2], 1), digit(m[3], 2)].map((v, i) => (i === 0 ? s : v)) as Mode;
}

export default function ChmodCalculator() {
  const [mode, setMode] = useState<Mode>([0, 6, 4, 4]);
  const [text, setText] = useState<{ which: "oct" | "sym"; v: string } | null>(null);
  const [dir, setDir] = useState(false);
  const [recursive, setRecursive] = useState(false);
  const [path, setPath] = useState("file.txt");

  const octal = `${mode[0] ? mode[0] : ""}${mode[1]}${mode[2]}${mode[3]}`;
  const sym = symbolic(mode, dir);
  const toggle = (who: number, v: number) => setMode((m) => m.map((d, i) => (i === who ? d ^ v : d)) as Mode);
  const letters = (d: number) => `${d & 4 ? "r" : ""}${d & 2 ? "w" : ""}${d & 1 ? "x" : ""}`;
  const symCmd = [`u=${letters(mode[1])}`, `g=${letters(mode[2])}`, `o=${letters(mode[3])}`, mode[0] & 4 && "u+s", mode[0] & 2 && "g+s", mode[0] & 1 && "+t"].filter(Boolean).join(",");
  const cmd = `chmod ${recursive ? "-R " : ""}${octal} ${path || "file"}`;

  return (
    <ToolLayout toolId="chmod-calculator">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[1fr_320px]">
          <ToolPanel title="Permissions">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground">
                  <th className="text-left font-medium px-3.5 py-2" />
                  {BITS.map((b) => <th key={b.key} className="font-medium px-2 py-2">{b.label} <span className="font-mono">({b.v})</span></th>)}
                  <th className="font-medium px-3.5 py-2 text-right">Octal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {WHO.map((w, i) => (
                  <tr key={w.key}>
                    <td className="px-3.5 py-2 font-medium">{w.label}</td>
                    {BITS.map((b) => (
                      <td key={b.key} className="text-center py-2">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={!!(mode[i + 1] & b.v)}
                          aria-label={`${w.label} ${b.label}`}
                          onClick={() => toggle(i + 1, b.v)}
                          className={cn("size-8 rounded-md border font-mono text-sm transition-colors", mode[i + 1] & b.v ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}
                        >
                          {mode[i + 1] & b.v ? b.key : "–"}
                        </button>
                      </td>
                    ))}
                    <td className="px-3.5 py-2 text-right font-mono text-lg">{mode[i + 1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-x-5 gap-y-2 px-3.5 py-3 border-t border-border">
              {SPECIAL.map((sp) => (
                <Toggle key={sp.label} label={sp.label} hint={sp.hint} checked={!!(mode[0] & sp.v)} onChange={() => toggle(0, sp.v)} />
              ))}
              <Toggle label="Directory" checked={dir} onChange={setDir} hint="Shows a leading d; x on directories means 'can enter'" />
            </div>
          </ToolPanel>

          <ToolPanel title="Notation" bodyClassName="p-3.5 space-y-3">
            <Field label="Octal" htmlFor="oct">
              <div className="flex gap-1.5">
                <Input
                  id="oct"
                  value={text?.which === "oct" ? text.v : octal}
                  onChange={(e) => { setText({ which: "oct", v: e.target.value }); const m = parseOctal(e.target.value.trim()); if (m) setMode(m); }}
                  onBlur={() => setText(null)}
                  className="h-11 text-2xl font-mono text-center tracking-widest"
                  aria-invalid={text?.which === "oct" && !parseOctal(text.v.trim()) ? true : undefined}
                />
                <CopyButton text={octal} iconOnly className="h-11 w-11" />
              </div>
            </Field>
            <Field label="Symbolic" htmlFor="sym">
              <div className="flex gap-1.5">
                <Input
                  id="sym"
                  value={text?.which === "sym" ? text.v : sym}
                  onChange={(e) => { setText({ which: "sym", v: e.target.value }); const m = parseSymbolic(e.target.value); if (m) { setMode(m); setDir(e.target.value.trim().startsWith("d")); } }}
                  onBlur={() => setText(null)}
                  className="h-11 text-lg font-mono text-center"
                />
                <CopyButton text={sym} iconOnly className="h-11 w-11" />
              </div>
            </Field>
            <p className="text-[11px] text-muted-foreground">Same as <code className="font-mono">chmod {symCmd} {path || "file"}</code></p>
          </ToolPanel>
        </div>

        <ToolPanel title="Command" actions={<CopyButton text={cmd} />} bodyClassName="p-3.5 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="path" className="w-56 font-mono" aria-label="Path" />
            <Toggle label="Recursive (-R)" checked={recursive} onChange={setRecursive} />
          </div>
          <pre className="font-mono text-[13px] bg-muted/50 rounded-md px-3 py-2">{cmd}</pre>
          {mode[3] & 2 ? <p className="text-xs text-amber-600 dark:text-amber-400">Warning: “others” can write — anyone on the system can modify this.</p> : null}
        </ToolPanel>

        <ToolPanel title="Common modes">
          <ul className="grid sm:grid-cols-2 divide-y divide-border">
            {PRESETS.map(([o, desc]) => (
              <li key={o}>
                <button type="button" onClick={() => setMode(parseOctal(o)!)} className={cn("w-full flex items-center gap-3 px-3.5 h-10 text-left text-sm hover:bg-muted/60", octal === o && "bg-accent/50")}>
                  <code className="font-mono w-12">{o}</code>
                  <code className="font-mono text-xs text-muted-foreground w-24">{symbolic(parseOctal(o)!, false)}</code>
                  <span className="text-xs text-muted-foreground truncate">{desc}</span>
                </button>
              </li>
            ))}
          </ul>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
