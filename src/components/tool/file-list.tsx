"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, File as FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function FileList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("divide-y divide-border rounded-md border border-border bg-card", className)}>{children}</ul>;
}

interface FileListItemProps {
  index?: number;
  name: string;
  meta?: ReactNode;
  icon?: ReactNode;
  thumbnail?: string;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Extra controls rendered before the remove button. */
  actions?: ReactNode;
  className?: string;
}

export function FileListItem({
  index,
  name,
  meta,
  icon,
  thumbnail,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  actions,
  className,
}: FileListItemProps) {
  return (
    <li className={cn("flex items-center gap-2.5 h-12 pl-3 pr-1.5", className)}>
      {typeof index === "number" && <span className="w-5 text-[11px] text-muted-foreground tabular-nums text-right shrink-0">{index + 1}</span>}
      {thumbnail ? (
        <img src={thumbnail} alt="" className="w-8 h-8 rounded-sm object-cover border border-border shrink-0" />
      ) : (
        <span className="w-8 h-8 rounded-sm bg-muted text-muted-foreground flex items-center justify-center shrink-0">
          {icon ?? <FileIcon className="w-4 h-4" />}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate">{name}</p>
        {meta && <p className="text-[11px] text-muted-foreground truncate">{meta}</p>}
      </div>
      {actions}
      {onMoveUp && (
        <Button variant="ghost" size="icon-sm" onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move up">
          <ArrowUp />
        </Button>
      )}
      {onMoveDown && (
        <Button variant="ghost" size="icon-sm" onClick={onMoveDown} disabled={!canMoveDown} aria-label="Move down">
          <ArrowDown />
        </Button>
      )}
      {onRemove && (
        <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
          <X />
        </Button>
      )}
    </li>
  );
}
