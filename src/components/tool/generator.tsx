"use client";

import { useState, type ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { CopyButton } from "./action-buttons";
import { Segmented } from "./fields";
import { ToolPanel } from "./tool-panel";
import { cn } from "@/lib/utils";

/** Label, live value and slider in one row-block. */
export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  className,
}: {
  label: ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Display formatter; defaults to the raw number. */
  format?: (v: number) => ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums font-mono">{format ? format(value) : value}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

/** Native colour picker + hex input. */
export function ColorField({ label, value, onChange, className }: { label?: ReactNode; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <span className="block text-xs font-medium">{label}</span>}
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={typeof label === "string" ? label : "Colour"}
          className="w-8 h-8 shrink-0 rounded-md border border-input bg-card p-0.5 cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono uppercase min-w-0" spellCheck={false} />
      </div>
    </div>
  );
}

/** Read-only code output with optional tabs (e.g. CSS / Tailwind / SCSS) and copy. */
export function CodeOutput({
  title = "Code",
  tabs,
  className,
}: {
  title?: string;
  tabs: { id: string; label: string; code: string }[];
  className?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <ToolPanel
      title={title}
      className={className}
      actions={
        <>
          {tabs.length > 1 && <Segmented size="sm" value={current.id} onChange={setActive} options={tabs.map((t) => ({ value: t.id, label: t.label }))} />}
          <CopyButton text={current.code} />
        </>
      }
    >
      <pre className="px-3.5 py-3 font-mono text-[12.5px] leading-relaxed overflow-auto max-h-80 custom-scrollbar whitespace-pre">{current.code}</pre>
    </ToolPanel>
  );
}

/** Checkerboard / custom background preview stage. */
export function PreviewStage({ children, background, className, checker }: { children: ReactNode; background?: string; className?: string; checker?: boolean }) {
  return (
    <div
      className={cn("flex items-center justify-center p-8 min-h-80", checker && "bg-[conic-gradient(#0000000d_25%,transparent_0_50%,#0000000d_0_75%,transparent_0)] bg-[length:16px_16px]", className)}
      style={background ? { background } : undefined}
    >
      {children}
    </div>
  );
}

export function hexToRgbTuple(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexToRgbTuple(hex);
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(2)})`;
};
