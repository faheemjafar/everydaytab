"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Tool, categoryStyle } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { usePersistentTools } from "@/hooks/use-persistent-tools";

interface ToolRowProps {
  tool: Tool;
  active?: boolean;
  onNavigate?: () => void;
  /** Tint the icon with the tool's category hue. */
  tinted?: boolean;
  showCategory?: boolean;
  className?: string;
}

/** Dense one-line tool row used in flyouts, lists and the mobile browser. */
export function ToolRow({ tool, active, onNavigate, tinted, showCategory, className }: ToolRowProps) {
  const { isFavorite, toggleFavorite, mounted } = usePersistentTools();
  const fav = mounted && isFavorite(tool.id);

  return (
    <Link
      href={tool.path}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/row relative flex items-center gap-2.5 h-8 pl-2 pr-1.5 rounded-md text-[13px] leading-none transition-colors outline-none",
        active
          ? "bg-sidebar-accent text-foreground font-medium"
          : "text-foreground/80 hover:bg-sidebar-accent/70 hover:text-foreground",
        "focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
    >
      <span
        style={tinted ? categoryStyle(tool.category) : undefined}
        className={cn(
          "flex items-center justify-center w-5 h-5 rounded-sm shrink-0",
          tinted ? "cat-chip" : "text-muted-foreground group-hover/row:text-foreground"
        )}
      >
        <LucideIcon name={tool.icon} className="w-3.5 h-3.5" />
      </span>
      <span className="truncate flex-1">{tool.name}</span>
      {showCategory && <span className="text-[11px] text-muted-foreground/70 truncate max-w-24 hidden sm:inline">{tool.category}</span>}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(tool.id);
        }}
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "w-6 h-6 inline-flex items-center justify-center rounded-sm shrink-0 transition-opacity",
          fav ? "text-amber-500 opacity-100" : "text-muted-foreground/60 hover:text-amber-500 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
        )}
      >
        <Star className={cn("w-3.5 h-3.5", fav && "fill-current")} />
      </button>
    </Link>
  );
}
