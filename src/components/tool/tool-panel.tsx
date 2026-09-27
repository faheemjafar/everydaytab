import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolPanelProps {
  title?: ReactNode;
  /** Right-aligned header content (status badges, buttons). */
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * The standard bordered surface for a tool workspace. Header and footer are
 * optional 40px bars; the body has no padding by default so editors can be
 * flush — pass bodyClassName="p-4" for form-like content.
 */
export function ToolPanel({ title, actions, footer, children, className, bodyClassName }: ToolPanelProps) {
  const hasHeader = title !== undefined || actions !== undefined;
  return (
    <section className={cn("flex flex-col min-w-0 rounded-md border border-border bg-card overflow-hidden", className)}>
      {hasHeader && (
        <header className="flex items-center gap-2 h-10 px-3 border-b border-border bg-surface shrink-0">
          {title !== undefined && (
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">{title}</h2>
          )}
          <span className="flex-1" />
          {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn("flex-1 min-h-0", bodyClassName)}>{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center gap-2 min-h-10 px-3 py-1.5 border-t border-border bg-surface shrink-0">
          {footer}
        </footer>
      )}
    </section>
  );
}

/** Two panels side by side on wide screens, stacked on narrow ones. */
export function SplitLayout({
  children,
  className,
  ratio = "1fr 1fr",
}: {
  children: ReactNode;
  className?: string;
  ratio?: string;
}) {
  return (
    <div className={cn("grid gap-3 grid-cols-1 lg:[grid-template-columns:var(--split)]", className)} style={{ "--split": ratio } as React.CSSProperties}>
      {children}
    </div>
  );
}

/** Sidebar-of-options + main area layout for tools with many knobs. */
export function OptionsLayout({ options, children, className }: { options: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-3 grid-cols-1 lg:grid-cols-[280px_1fr] items-start", className)}>
      <div className="lg:sticky lg:top-16 space-y-3">{options}</div>
      <div className="min-w-0 space-y-3">{children}</div>
    </div>
  );
}
