import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Label + control stack used inside option panels. */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  inline,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  /** Put label and control on one line (switches, small selects). */
  inline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(inline ? "flex items-center justify-between gap-3" : "space-y-1.5", className)}>
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-xs font-medium text-foreground">
          {label}
        </label>
        {hint && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{hint}</p>}
      </div>
      <div className={cn(inline && "shrink-0")}>{children}</div>
    </div>
  );
}

/** Responsive grid of fields. */
export function FieldGrid({ children, cols = 2, className }: { children: ReactNode; cols?: 1 | 2 | 3 | 4; className?: string }) {
  const colCls = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  return <div className={cn("grid grid-cols-1 gap-3", colCls, className)}>{children}</div>;
}

/** Key/value stat used for results ("Words 1,204"). */
export function Stat({ label, value, hint, className }: { label: ReactNode; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md border border-border bg-card px-3 py-2.5 min-w-0", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground truncate">{label}</p>
      <p className="text-lg font-semibold tabular-nums leading-tight mt-0.5 truncate">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2", className)}>{children}</div>;
}

/** Segmented control for small enumerations (2–5 options). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "default",
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn("inline-flex items-center rounded-md border border-border bg-background p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm font-medium transition-colors",
            size === "sm" ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-xs",
            value === o.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
