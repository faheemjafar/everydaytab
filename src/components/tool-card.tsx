"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { type Tool, categoryStyle } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: Tool;
  /** "grid" = icon + title + description card, "row" = dense single line. */
  variant?: "grid" | "row";
}

export function ToolCard({ tool, variant = "grid" }: ToolCardProps) {
  const { isFavorite, toggleFavorite, mounted } = usePersistentTools();
  const fav = mounted && isFavorite(tool.id);

  const star = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(tool.id);
      }}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-sm transition-opacity",
        fav ? "text-amber-500 opacity-100" : "text-muted-foreground/60 hover:text-amber-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
      )}
    >
      <Star className={cn("w-3.5 h-3.5", fav && "fill-current")} />
    </button>
  );

  if (variant === "row") {
    return (
      <Link
        href={tool.path}
        className="group flex items-center gap-2.5 h-9 px-2 rounded-md hover:bg-muted/70 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span style={categoryStyle(tool.category)} className="cat-chip w-6 h-6 rounded-sm flex items-center justify-center shrink-0">
          <LucideIcon name={tool.icon} className="w-3.5 h-3.5" />
        </span>
        <span className="text-[13px] font-medium truncate">{tool.name}</span>
        <span className="hidden sm:block text-xs text-muted-foreground truncate flex-1">{tool.description}</span>
        <span className="sm:hidden flex-1" />
        {star}
      </Link>
    );
  }

  return (
    <Link
      href={tool.path}
      className="group flex items-start gap-3 h-full rounded-md border border-border bg-card p-3 transition-colors hover:border-ring/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span style={categoryStyle(tool.category)} className="cat-chip w-8 h-8 rounded-md flex items-center justify-center shrink-0">
        <LucideIcon name={tool.icon} className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium leading-tight truncate">{tool.name}</span>
          {star}
        </span>
        <span className="block mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{tool.description}</span>
      </span>
    </Link>
  );
}
