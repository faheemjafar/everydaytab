import type { ReactNode } from "react";

export function SectionHeader({
  icon,
  title,
  count,
  action,
  id,
}: {
  icon?: ReactNode;
  title: string;
  count?: number;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-2 h-7">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <h2 id={id} className="text-[13px] font-semibold tracking-tight">
        {title}
      </h2>
      {typeof count === "number" && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
      <span className="flex-1" />
      {action}
    </div>
  );
}
