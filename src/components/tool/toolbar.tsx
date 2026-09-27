import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Horizontal action row. Wraps on small screens. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-1.5", className)}>{children}</div>;
}

export function ToolbarGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-1.5", className)}>{children}</div>;
}

export function ToolbarSpacer() {
  return <span className="flex-1 min-w-2" aria-hidden />;
}

export function ToolbarDivider() {
  return <span className="w-px h-5 bg-border mx-0.5" aria-hidden />;
}
