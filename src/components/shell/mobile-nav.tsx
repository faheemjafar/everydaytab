"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Clock, Home, LayoutGrid, Search, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, categoryStyle, getToolsByCategory, tools } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { MOBILE_BROWSE_EVENT, openCommandPalette, toggleMobileBrowse } from "@/lib/events";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import { ToolRow } from "@/components/shell/tool-row";

/** Bottom tab bar (mobile only) + full-screen browse sheet. */
export function MobileNav() {
  const pathname = usePathname();
  // Open state is keyed to the pathname so navigating closes the sheet.
  const [browse, setBrowse] = useState<{ open: boolean; path: string }>({ open: false, path: pathname });
  const browseOpen = browse.path === pathname && browse.open;
  const setBrowseOpen = useCallback(
    (next: boolean | ((o: boolean) => boolean)) =>
      setBrowse((b) => ({ open: typeof next === "function" ? next(b.path === pathname && b.open) : next, path: pathname })),
    [pathname]
  );

  useEffect(() => {
    const toggle = () => setBrowseOpen((o) => !o);
    window.addEventListener(MOBILE_BROWSE_EVENT, toggle);
    return () => window.removeEventListener(MOBILE_BROWSE_EVENT, toggle);
  }, [setBrowseOpen]);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!browseOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [browseOpen]);

  return (
    <>
      <nav
        aria-label="Mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t border-border bg-background/95 supports-backdrop-filter:backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-14">
          <Tab href="/" label="Home" active={pathname === "/" && !browseOpen}>
            <Home className="w-5 h-5" />
          </Tab>
          <Tab label="Search" onClick={openCommandPalette}>
            <Search className="w-5 h-5" />
          </Tab>
          <Tab href="/favorites" label="Favorites" active={pathname === "/favorites"}>
            <Star className="w-5 h-5" />
          </Tab>
          <Tab label="Browse" onClick={toggleMobileBrowse} active={browseOpen}>
            {browseOpen ? <X className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          </Tab>
        </div>
      </nav>

      {browseOpen && <BrowseSheet onClose={() => setBrowseOpen(false)} />}
    </>
  );
}

function Tab({
  href,
  label,
  active,
  onClick,
  children,
}: {
  href?: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const cls = cn(
    "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
  );
  if (href) {
    return (
      <Link href={href} className={cls} aria-current={active ? "page" : undefined}>
        {children}
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-pressed={active}>
      {children}
      {label}
    </button>
  );
}

function BrowseSheet({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { recentTools } = usePersistentTools();

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      q
        ? tools
            .filter(
              (t) =>
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.tags?.some((tag) => tag.toLowerCase().includes(q))
            )
            .slice(0, 40)
        : [],
    [q]
  );

  return (
    <div className="md:hidden fixed inset-0 z-30 bg-background flex flex-col pt-12 pb-14 animate-in fade-in duration-150">
      <div className="px-3 py-2.5 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tools.length} tools…`}
            className="w-full h-10 pl-8 pr-8 rounded-md border border-input bg-card text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {q ? (
          results.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No tools match &ldquo;{query}&rdquo;.</p>
          ) : (
            <div className="space-y-px">
              {results.map((t) => (
                <ToolRow key={t.id} tool={t} tinted active={pathname === t.path} onNavigate={onClose} className="h-10" />
              ))}
            </div>
          )
        ) : (
          <>
            {recentTools.length > 0 && (
              <section className="mb-3">
                <h3 className="flex items-center gap-1.5 px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                  <Clock className="w-3 h-3" /> Recent
                </h3>
                <div className="space-y-px">
                  {recentTools.slice(0, 5).map((t) => (
                    <ToolRow key={t.id} tool={t} tinted active={pathname === t.path} onNavigate={onClose} className="h-10" />
                  ))}
                </div>
              </section>
            )}
            <h3 className="px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
              Categories
            </h3>
            <div className="space-y-px">
              {categories.map((c) => {
                const catTools = getToolsByCategory(c.id);
                const expanded = open === c.id;
                return (
                  <div key={c.id} className="rounded-md overflow-hidden">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : c.id)}
                        aria-expanded={expanded}
                        className="flex-1 flex items-center gap-2.5 h-11 px-2 text-sm text-left hover:bg-muted/60 rounded-md"
                      >
                        <span style={categoryStyle(c)} className="cat-chip w-7 h-7 rounded-md flex items-center justify-center shrink-0">
                          <LucideIcon name={c.icon} className="w-4 h-4" />
                        </span>
                        <span className="flex-1 font-medium truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{catTools.length}</span>
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                      </button>
                    </div>
                    {expanded && (
                      <div className="pl-3 pb-2 space-y-px">
                        <Link
                          href={`/category/${c.id}`}
                          onClick={onClose}
                          className="flex items-center h-9 px-2 text-xs font-medium text-primary hover:underline"
                        >
                          View {c.name} page →
                        </Link>
                        {catTools.map((t) => (
                          <ToolRow key={t.id} tool={t} active={pathname === t.path} onNavigate={onClose} className="h-10" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
