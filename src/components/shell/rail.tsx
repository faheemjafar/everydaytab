"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, Settings, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, categoryStyle } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import type { PanelId } from "@/components/shell/flyout";
import { ThemeToggle } from "@/components/shell/theme-toggle";

interface RailProps {
  openPanel: PanelId | null;
  activeCategory?: string;
  onEnter: (panel: PanelId) => void;
  onLeave: () => void;
  onClick: (panel: PanelId) => void;
}

export function Rail({ openPanel, activeCategory, onEnter, onLeave, onClick }: RailProps) {
  const pathname = usePathname();
  const { favoriteTools, mounted } = usePersistentTools();
  const favCount = mounted ? favoriteTools.length : 0;

  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex flex-col items-center w-12 h-screen sticky top-0 shrink-0 bg-sidebar border-r border-sidebar-border z-40"
      onMouseLeave={onLeave}
    >
      <Link
        href="/"
        aria-label="EverydayTab home"
        className="flex items-center justify-center w-12 h-12 shrink-0 border-b border-sidebar-border"
      >
        <img src="/logo.svg" alt="" className="w-6 h-6 rounded-sm" draggable={false} />
      </Link>

      <div className="flex flex-col items-center gap-0.5 py-2 w-full">
        <RailLink href="/" label="Home" active={pathname === "/"}>
          <Home className="w-4 h-4" />
        </RailLink>
        <RailButton
          label="Favorites"
          panel="favorites"
          open={openPanel === "favorites"}
          badge={favCount}
          onEnter={onEnter}
          onClick={onClick}
        >
          <Star className={cn("w-4 h-4", favCount > 0 && "fill-amber-500 text-amber-500")} />
        </RailButton>
        <RailButton label="Recents" panel="recents" open={openPanel === "recents"} onEnter={onEnter} onClick={onClick}>
          <Clock className="w-4 h-4" />
        </RailButton>
      </div>

      <div className="w-6 h-px bg-sidebar-border shrink-0" />

      <div className="flex-1 flex flex-col items-center gap-0.5 py-2 w-full overflow-y-auto no-scrollbar">
        {categories.map((c) => {
          const open = openPanel === c.id;
          const active = activeCategory === c.id;
          return (
            <RailButton
              key={c.id}
              label={c.name}
              panel={c.id}
              open={open}
              active={active}
              onEnter={onEnter}
              onClick={onClick}
              style={categoryStyle(c)}
              tinted={open || active}
            >
              <LucideIcon name={c.icon} className="w-4 h-4" />
            </RailButton>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-0.5 py-2 w-full border-t border-sidebar-border">
        <ThemeToggle className="w-9 h-9 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground" />
        <RailLink href="/settings" label="Settings" active={pathname.startsWith("/settings")}>
          <Settings className="w-4 h-4" />
        </RailLink>
      </div>
    </nav>
  );
}

const railItemBase =
  "relative group/rail flex items-center justify-center w-9 h-9 rounded-md transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring";

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

function RailLink({ href, label, active, children }: { href: string; label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        railItemBase,
        active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      {children}
      <Tooltip label={label} />
    </Link>
  );
}

function RailButton({
  label,
  panel,
  open,
  active,
  badge,
  tinted,
  style,
  onEnter,
  onClick,
  children,
}: {
  label: string;
  panel: PanelId;
  open: boolean;
  active?: boolean;
  badge?: number;
  tinted?: boolean;
  style?: React.CSSProperties;
  onEnter: (panel: PanelId) => void;
  onClick: (panel: PanelId) => void;
  children: React.ReactNode;
}) {
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
        tinted ? "cat-chip" : open || active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      {children}
      {active && <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-primary" />}
      {!!badge && badge > 0 && (
        <span className="absolute top-1 right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center tabular-nums">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      {!open && <Tooltip label={label} />}
    </button>
  );
}
