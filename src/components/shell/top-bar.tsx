"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Heart, Search, Settings } from "lucide-react";
import { GithubIcon as Github } from "@/components/github-icon";
import { cn } from "@/lib/utils";
import { getCategory, tools } from "@/lib/tools";
import { openCommandPalette } from "@/lib/events";
import { KOFI_URL } from "@/lib/support";
import { ThemeToggle } from "@/components/shell/theme-toggle";

interface Crumb {
  label: string;
  href?: string;
}

function useCrumbs(pathname: string): Crumb[] {
  if (pathname === "/") return [];
  if (pathname.startsWith("/settings")) return [{ label: "Settings" }];
  const cat = pathname.match(/^\/category\/([^/]+)/);
  if (cat) {
    const c = getCategory(cat[1]);
    return c ? [{ label: c.name }] : [];
  }
  const tool = tools.find((t) => t.path === pathname);
  if (tool) {
    const c = getCategory(tool.category);
    return [...(c ? [{ label: c.name, href: `/category/${c.id}` }] : []), { label: tool.name }];
  }
  return [];
}

export function TopBar() {
  const pathname = usePathname();
  const crumbs = useCrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 h-12 border-b border-border bg-background/95 supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur-sm">
      <div className="flex items-center gap-2 h-full px-3 md:px-4">
        {/* Mobile logo */}
        <Link href="/" className="md:hidden flex items-center gap-2 shrink-0 mr-1">
          <img src="/logo.svg" alt="EverydayTab" className="w-6 h-6 rounded-sm" draggable={false} />
          <span className="font-semibold text-sm tracking-tight">EverydayTab</span>
        </Link>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 min-w-0 text-[13px]">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Home
          </Link>
          {crumbs.map((c, i) => (
            <Fragment key={`${c.label}-${i}`}>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              {c.href ? (
                <Link href={c.href} className="text-muted-foreground hover:text-foreground transition-colors truncate">
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground truncate">{c.label}</span>
              )}
            </Fragment>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Search trigger */}
        <button
          type="button"
          onClick={openCommandPalette}
          className={cn(
            "flex items-center gap-2 h-8 rounded-md border border-border bg-card text-muted-foreground text-xs transition-colors hover:border-ring/50 hover:text-foreground",
            "w-8 justify-center px-0 sm:w-56 md:w-72 sm:justify-start sm:px-2.5"
          )}
          aria-label="Search tools"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline flex-1 text-left truncate">Search {tools.length} tools…</span>
          <kbd className="hidden sm:inline-flex">⌘K</kbd>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
            aria-label="Sponsor on Ko-fi"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            Sponsor
          </a>
          <a
            href="https://github.com/faheemjafar/everydaytab"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="GitHub repository"
          >
            <Github className="w-4 h-4" />
          </a>
          <ThemeToggle className="md:hidden w-8 h-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" />
          <Link
            href="/settings"
            className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
