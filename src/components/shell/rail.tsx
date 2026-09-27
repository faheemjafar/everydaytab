"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Clock, Home, PanelLeftClose, PanelLeftOpen, Settings, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, categoryStyle, getToolsByCategory } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import type { PanelId } from "@/components/shell/flyout";
import { ThemeToggle } from "@/components/shell/theme-toggle";

/** Rail width in px for each mode — the flyout offsets itself by this. */
export const RAIL_WIDTH = { labels: 184, icons: 48 } as const;

interface RailProps {
  /** Show text labels next to icons (default). Icon-only when false. */
  labels: boolean;
  onToggleLabels: () => void;
  openPanel: PanelId | null;
  activeCategory?: string;
  onEnter: (panel: PanelId) => void;
  onLeave: () => void;
  onClick: (panel: PanelId) => void;
}

export function Rail({ labels, onToggleLabels, openPanel, activeCategory, onEnter, onLeave, onClick }: RailProps) {
  const pathname = usePathname();
  const { favoriteTools, recentTools, mounted } = usePersistentTools();
  const favCount = mounted ? favoriteTools.length : 0;
  const recentCount = mounted ? recentTools.length : 0;

  return (
    <nav
      aria-label="Primary"
      style={{ width: labels ? RAIL_WIDTH.labels : RAIL_WIDTH.icons }}
      className="hidden md:flex flex-col h-screen sticky top-0 shrink-0 bg-sidebar border-r border-sidebar-border z-40 transition-[width] duration-150"
      onMouseLeave={onLeave}
    >
      <Link
        href="/"
        aria-label="EverydayTab home"
        className={cn("flex items-center gap-2 h-12 shrink-0 border-b border-sidebar-border", labels ? "px-3" : "justify-center")}
      >
        <img src="/logo.svg" alt="" className="w-6 h-6 rounded-sm shrink-0" draggable={false} />
        {labels && <span className="font-semibold text-sm tracking-tight truncate">EverydayTab</span>}
      </Link>

      <div className={cn("flex flex-col gap-0.5 py-2", labels ? "px-2" : "px-1.5")}>
        <RailLink href="/" label="Home" labels={labels} active={pathname === "/"}>
          <Home className="w-4 h-4" />
        </RailLink>
        <RailButton
          label="Favorites"
          labels={labels}
          panel="favorites"
          open={openPanel === "favorites"}
          count={favCount}
          onEnter={onEnter}
          onClick={onClick}
        >
          <Star className={cn("w-4 h-4", favCount > 0 && "fill-amber-500 text-amber-500")} />
        </RailButton>
        <RailButton label="Recents" labels={labels} panel="recents" open={openPanel === "recents"} count={recentCount} onEnter={onEnter} onClick={onClick}>
          <Clock className="w-4 h-4" />
        </RailButton>
      </div>

      {labels ? (
        <p className="px-4 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">Categories</p>
      ) : (
        <div className="mx-auto w-6 h-px bg-sidebar-border shrink-0" />
      )}

      <div className={cn("flex-1 flex flex-col gap-0.5 py-1 overflow-y-auto no-scrollbar", labels ? "px-2" : "px-1.5")}>
        {categories.map((c) => {
          const open = openPanel === c.id;
          const active = activeCategory === c.id;
          return (
            <RailButton
              key={c.id}
              label={labels ? c.short : c.name}
              labels={labels}
              panel={c.id}
              open={open}
              active={active}
              count={labels ? getToolsByCategory(c.id).length : undefined}
              onEnter={onEnter}
              onClick={onClick}
              style={categoryStyle(c)}
              tinted
            >
              <LucideIcon name={c.icon} className="w-4 h-4" />
            </RailButton>
          );
        })}
      </div>

      <div className={cn("flex flex-col gap-0.5 py-2 border-t border-sidebar-border", labels ? "px-2" : "px-1.5")}>
        <RailLink href="/settings" label="Settings" labels={labels} active={pathname.startsWith("/settings")}>
          <Settings className="w-4 h-4" />
        </RailLink>
        <div className={cn("flex items-center", labels ? "justify-between" : "flex-col gap-0.5")}>
          <ThemeToggle className={cn(railItemBase, "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground", labels ? "w-9" : "w-full")} />
          <button
            type="button"
            onClick={onToggleLabels}
            aria-label={labels ? "Collapse sidebar" : "Expand sidebar"}
            title={labels ? "Collapse sidebar" : "Expand sidebar"}
            className={cn(railItemBase, "group/rail relative text-muted-foreground hover:bg-sidebar-accent hover:text-foreground", labels ? "w-9" : "w-full")}
          >
            {labels ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            {!labels && <Tooltip label="Expand sidebar" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

const railItemBase = "flex items-center justify-center h-9 rounded-md transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Tooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover text-popover-foreground text-xs px-2 py-1 shadow-float opacity-0 group-hover/rail:opacity-100 group-focus-visible/rail:opacity-100 transition-opacity delay-150 z-50"
    >
      {label}
    </span>
  );
}

function RailLink({ href, label, labels, active, children }: { href: string; label: string; labels: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        railItemBase,
        "group/rail relative w-full",
        labels ? "justify-start gap-2.5 px-2.5 text-[13px]" : "",
        active ? "bg-sidebar-accent text-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      <span className="w-5 h-5 flex items-center justify-center shrink-0">{children}</span>
      {labels ? <span className="truncate">{label}</span> : <Tooltip label={label} />}
    </Link>
  );
}

function RailButton({
  label,
  labels,
  panel,
  open,
  active,
  count,
  tinted,
  style,
  onEnter,
  onClick,
  children,
}: {
  label: string;
  labels: boolean;
  panel: PanelId;
  open: boolean;
  active?: boolean;
  count?: number;
  tinted?: boolean;
  style?: React.CSSProperties;
  onEnter: (panel: PanelId) => void;
  onClick: (panel: PanelId) => void;
  children: React.ReactNode;
}) {
  const highlight = open || active;
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-haspopup="true"
      onMouseEnter={() => onEnter(panel)}
      onFocus={() => onEnter(panel)}
      onClick={() => onClick(panel)}
      style={style}
      className={cn(
        railItemBase,
        "group/rail relative w-full",
        labels ? "justify-start gap-2.5 px-2.5 text-[13px]" : "",
        highlight ? "bg-sidebar-accent text-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "w-5 h-5 flex items-center justify-center shrink-0 rounded-sm",
          tinted && (labels || highlight) && "cat-chip",
          !labels && tinted && highlight && "w-7 h-7"
        )}
      >
        {children}
      </span>
      {labels ? (
        <>
          <span className="truncate flex-1 text-left">{label}</span>
          {typeof count === "number" && count > 0 && (
            <span className={cn("text-[11px] tabular-nums", highlight ? "text-foreground/70" : "text-muted-foreground/60")}>{count}</span>
          )}
          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground/50 transition-opacity", open ? "opacity-100" : "opacity-0 group-hover/rail:opacity-60")} />
        </>
      ) : (
        <>
          {typeof count === "number" && count > 0 && panel === "favorites" && (
            <span className="absolute top-0.5 right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center tabular-nums">
              {count > 9 ? "9+" : count}
            </span>
          )}
          {!open && <Tooltip label={label} />}
        </>
      )}
    </button>
  );
}
