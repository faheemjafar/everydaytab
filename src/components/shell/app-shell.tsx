"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { tools } from "@/lib/tools";
import { useSettings, useApplySettings } from "@/hooks/use-settings";
import { recentsStore } from "@/hooks/use-persistent-tools";
import { Rail, RAIL_WIDTH } from "@/components/shell/rail";
import { Flyout, type PanelId } from "@/components/shell/flyout";
import { TopBar } from "@/components/shell/top-bar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SiteFooter } from "@/components/shell/site-footer";

const HOVER_OPEN_DELAY = 90;
const HOVER_CLOSE_DELAY = 180;

function categoryFromPath(pathname: string): string | undefined {
  const cat = pathname.match(/^\/category\/([^/]+)/);
  if (cat) return cat[1];
  return tools.find((t) => t.path === pathname)?.category;
}

export function AppShell({ children }: { children: ReactNode }) {
  useApplySettings();
  const pathname = usePathname();
  const router = useRouter();
  const { settings, update, mounted } = useSettings();
  const pinned = mounted && settings.sidebarPinned;
  // Labels default on; before hydration trust the boot script's data attribute via CSS-free fallback (true).
  const railLabels = mounted ? settings.railLabels : true;

  const activeCategory = categoryFromPath(pathname);

  // Hover (transient) panel and pinned (persistent) panel are tracked separately
  // so unpinning returns you to the contextual state. Both are keyed to the
  // pathname they were set on, so navigating resets them without an effect:
  // the hover flyout closes, and the pinned panel follows the route's category.
  const [hover, setHover] = useState<{ panel: PanelId | null; path: string }>({ panel: null, path: pathname });
  const [manual, setManual] = useState<{ panel: PanelId; path: string } | null>(null);
  const hoverPanel = hover.path === pathname ? hover.panel : null;
  const pinnedPanel: PanelId = manual?.path === pathname ? manual.panel : activeCategory ?? "favorites";
  const setHoverPanel = useCallback(
    (next: PanelId | null | ((cur: PanelId | null) => PanelId | null)) =>
      setHover((h) => ({ panel: typeof next === "function" ? next(h.path === pathname ? h.panel : null) : next, path: pathname })),
    [pathname]
  );
  const setPinnedPanel = useCallback((panel: PanelId) => setManual({ panel, path: pathname }), [pathname]);

  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = closeTimer.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHoverPanel(null);
      // ⌘, opens settings (like most desktop apps)
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push("/settings");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  // "Open last tool on start" — once per browser session.
  useEffect(() => {
    if (!mounted || pathname !== "/" || !settings.openLastToolOnStart) return;
    if (sessionStorage.getItem("everydaytab:booted")) return;
    sessionStorage.setItem("everydaytab:booted", "1");
    const last = recentsStore.get()[0];
    const tool = last && tools.find((t) => t.id === last);
    if (tool) router.replace(tool.path);
  }, [mounted, pathname, settings.openLastToolOnStart, router]);

  const onRailEnter = useCallback(
    (panel: PanelId) => {
      clearTimers();
      if (pinned) return; // pinned mode: hover does nothing, click switches
      if (!settings.sidebarHoverOpen) return;
      openTimer.current = window.setTimeout(() => setHoverPanel(panel), HOVER_OPEN_DELAY);
    },
    [pinned, settings.sidebarHoverOpen, setHoverPanel]
  );

  const onRailLeave = useCallback(() => {
    clearTimers();
    if (pinned) return;
    closeTimer.current = window.setTimeout(() => setHoverPanel(null), HOVER_CLOSE_DELAY);
  }, [pinned, setHoverPanel]);

  const onFlyoutEnter = useCallback(() => clearTimers(), []);

  const onRailClick = useCallback(
    (panel: PanelId) => {
      clearTimers();
      if (pinned) {
        setPinnedPanel(panel);
      } else {
        setHoverPanel((cur) => (cur === panel ? null : panel));
      }
    },
    [pinned, setHoverPanel, setPinnedPanel]
  );

  const togglePin = useCallback(() => {
    if (pinned) {
      update("sidebarPinned", false);
      setHoverPanel(null);
    } else {
      // pin whatever is currently visible
      if (hoverPanel) setPinnedPanel(hoverPanel);
      update("sidebarPinned", true);
      setHoverPanel(null);
    }
  }, [pinned, hoverPanel, update, setHoverPanel, setPinnedPanel]);

  const openPanel: PanelId | null = pinned ? pinnedPanel : hoverPanel;

  return (
    <div className="flex min-h-screen w-full">
      <Rail
        labels={railLabels}
        onToggleLabels={() => update("railLabels", !settings.railLabels)}
        openPanel={openPanel}
        activeCategory={activeCategory}
        onEnter={onRailEnter}
        onLeave={onRailLeave}
        onClick={onRailClick}
      />

      {/* Pinned flyout: in-flow, only on large screens */}
      {pinned && (
        <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-sidebar-border">
          <Flyout panel={pinnedPanel} pinned onTogglePin={togglePin} onClose={() => {}} />
        </aside>
      )}

      {/* Hover flyout: floating over content */}
      {!pinned && hoverPanel && (
        <div
          style={{ left: railLabels ? RAIL_WIDTH.labels : RAIL_WIDTH.icons }}
          className={cn("hidden md:block fixed top-0 h-screen w-72 z-40 shadow-float animate-in fade-in slide-in-from-left-1 duration-100")}
          onMouseEnter={onFlyoutEnter}
          onMouseLeave={onRailLeave}
        >
          <Flyout
            panel={hoverPanel}
            pinned={false}
            onTogglePin={togglePin}
            onClose={() => setHoverPanel(null)}
            onNavigate={() => setHoverPanel(null)}
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 pb-14 md:pb-0">{children}</main>
        <SiteFooter />
      </div>

      <MobileNav />
    </div>
  );
}
