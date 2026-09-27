import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "error" | "warning" | "info";

const TONE: Record<Tone, { badge: string; alert: string; icon: typeof Info }> = {
  neutral: { badge: "bg-muted text-muted-foreground", alert: "border-border bg-card text-foreground", icon: Info },
  success: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    alert: "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  error: { badge: "bg-destructive/10 text-destructive", alert: "border-destructive/30 bg-destructive/5 text-destructive", icon: AlertCircle },
  warning: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    alert: "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300",
    icon: AlertTriangle,
  },
  info: {
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    alert: "border-sky-500/30 bg-sky-500/5 text-sky-800 dark:text-sky-300",
    icon: Info,
  },
};

/** Small inline status pill for panel headers ("Valid JSON", "3 files"). */
export function StatusBadge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const Icon = TONE[tone].icon;
  return (
    <span className={cn("inline-flex items-center gap-1 h-5 px-1.5 rounded-sm text-[11px] font-medium", TONE[tone].badge, className)}>
      {tone !== "neutral" && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

/** Block-level message under a workspace (errors, warnings, hints). */
export function ToolAlert({ tone = "info", title, children, className }: { tone?: Tone; title?: string; children?: ReactNode; className?: string }) {
  const Icon = TONE[tone].icon;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-md border px-3 py-2.5 text-sm", TONE[tone].alert, className)}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-medium leading-tight">{title}</p>}
        {children && <div className={cn("text-[13px] leading-relaxed", title && "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}

/** One-line reassurance shown under file-processing tools. */
export function PrivacyNote({ children }: { children?: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      {children ?? "Processed locally in your browser — nothing is uploaded."}
    </p>
  );
}
