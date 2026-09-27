"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Clock, Pin, PinOff, Search, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, categoryStyle, getCategory, getSubgroups, getToolsByCategory, type Tool } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import { ToolRow } from "@/components/shell/tool-row";

export type PanelId = "favorites" | "recents" | (string & {});

interface FlyoutProps {
  panel: PanelId;
  pinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  /** Called after a tool link is clicked (used to close a hover flyout). */
  onNavigate?: () => void;
  className?: string;
}

export function Flyout({ panel, pinned, onTogglePin, onClose, onNavigate, className }: FlyoutProps) {
  const pathname = usePathname();
  // Filter text is keyed to the panel so switching panels resets it.
  const [q0, setQ0] = useState<{ panel: PanelId; value: string }>({ panel, value: "" });
  const query = q0.panel === panel ? q0.value : "";
  const setQuery = (value: string) => setQ0({ panel, value });
  const inputRef = useRef<HTMLInputElement>(null);
  const { favoriteTools, recentTools, clearRecents } = usePersistentTools();

  const category = getCategory(panel);
  const title = panel === "favorites" ? "Favorites" : panel === "recents" ? "Recents" : category?.name ?? "Tools";

  const baseTools: Tool[] = useMemo(() => {
    if (panel === "favorites") return favoriteTools;
    if (panel === "recents") return recentTools;
    return getToolsByCategory(panel);
  }, [panel, favoriteTools, recentTools]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? baseTools.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.tags?.some((tag) => tag.toLowerCase().includes(q))
          )
        : baseTools,
    [baseTools, q]
  );

  const subgroups = useMemo(() => (category && !q ? getSubgroups(category.id) : null), [category, q]);
  const showGrouped = !!subgroups && subgroups.length > 1;

  return (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 h-12 px-3 border-b border-sidebar-border shrink-0">
        {category ? (
          <Link
            href={`/category/${category.id}`}
            onClick={onNavigate}
            className="group flex items-center gap-2 min-w-0 flex-1"
          >
            <span style={categoryStyle(category)} className="cat-chip w-6 h-6 rounded-sm flex items-center justify-center shrink-0">
              <LucideIcon name={category.icon} className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{title}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">{baseTools.length}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0 bg-sidebar-accent text-muted-foreground">
              {panel === "favorites" ? <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> : <Clock className="w-3.5 h-3.5" />}
            </span>
            <span className="text-sm font-semibold truncate">{title}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">{baseTools.length}</span>
          </div>
        )}
        {panel === "recents" && recentTools.length > 0 && (
          <IconBtn label="Clear recents" onClick={clearRecents}>
            <Trash2 className="w-3.5 h-3.5" />
          </IconBtn>
        )}
        <IconBtn label={pinned ? "Unpin sidebar" : "Pin sidebar open"} onClick={onTogglePin} active={pinned}>
          {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </IconBtn>
        {!pinned && (
          <IconBtn label="Close" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </IconBtn>
        )}
      </div>

      {/* Filter */}
      {baseTools.length > 6 && (
        <div className="px-2.5 pt-2.5 pb-1 shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter ${title.toLowerCase()}…`}
              className="w-full h-8 pl-7 pr-7 rounded-md border border-input bg-card text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear filter"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
        {filtered.length === 0 ? (
          <EmptyState panel={panel} query={q} />
        ) : showGrouped ? (
          <div className="space-y-3">
            {subgroups!.map((sg) => (
              <section key={sg.id}>
                <h4 className="px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                  {sg.name}
                </h4>
                <div className="space-y-px">
                  {sg.tools.map((t) => (
                    <ToolRow key={t.id} tool={t} active={pathname === t.path} onNavigate={onNavigate} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-px">
            {filtered.map((t) => (
              <ToolRow key={t.id} tool={t} active={pathname === t.path} onNavigate={onNavigate} tinted={!category} />
            ))}
          </div>
        )}
      </div>

      {/* Footer: quick jump to other categories (only for non-category panels) */}
      {!category && (
        <div className="border-t border-sidebar-border p-2 shrink-0">
          <p className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">Browse</p>
          <div className="grid grid-cols-2 gap-px">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                onClick={onNavigate}
                className="flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-foreground/80 hover:bg-sidebar-accent/70 hover:text-foreground truncate"
              >
                <LucideIcon name={c.icon} className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{c.short}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "w-7 h-7 inline-flex items-center justify-center rounded-md shrink-0 transition-colors",
        active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ panel, query }: { panel: PanelId; query: string }) {
  if (query) {
    return <p className="px-2 py-8 text-center text-xs text-muted-foreground">No tools match &ldquo;{query}&rdquo;.</p>;
  }
  if (panel === "favorites") {
    return (
      <div className="px-3 py-8 text-center space-y-1.5">
        <Star className="w-5 h-5 mx-auto text-muted-foreground/50" />
        <p className="text-xs font-medium">No favorites yet</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Hover a tool and press the star to pin it here.
        </p>
      </div>
    );
  }
  if (panel === "recents") {
    return (
      <div className="px-3 py-8 text-center space-y-1.5">
        <Clock className="w-5 h-5 mx-auto text-muted-foreground/50" />
        <p className="text-xs font-medium">Nothing recent</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">Tools you open will show up here.</p>
      </div>
    );
  }
  return <p className="px-2 py-8 text-center text-xs text-muted-foreground">No tools in this category.</p>;
}
