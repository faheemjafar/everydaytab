"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { type Tool, getSubgroups } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

interface CategoryBrowserProps {
  categoryId: string;
  tools: Tool[];
}

type View = "grid" | "list";
const viewStore = createLocalStore<View>("everydaytab:category-view", "grid", (raw) => (raw === "list" ? "list" : "grid"));

export function CategoryBrowser({ categoryId, tools }: CategoryBrowserProps) {
  const [query, setQuery] = useState("");
  const [view, changeView] = useLocalStore(viewStore);
  const [activeSubgroup, setActiveSubgroup] = useState<string>("all");

  const subgroups = useMemo(() => getSubgroups(categoryId), [categoryId]);
  const hasMultipleSubgroups = subgroups.length > 1;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = tools;
    if (activeSubgroup !== "all" && !q) {
      list = subgroups.find((sg) => sg.id === activeSubgroup)?.tools ?? tools;
    }
    if (!q) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [tools, subgroups, activeSubgroup, q]);

  const visibleSubgroups = useMemo(() => {
    if (q) return [{ id: "results", name: "Results", tools: filtered }];
    if (activeSubgroup !== "all") return subgroups.filter((sg) => sg.id === activeSubgroup);
    return subgroups;
  }, [q, filtered, subgroups, activeSubgroup]);

  const gridCls = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2";
  const listCls = "divide-y divide-border rounded-md border border-border bg-card";

  return (
    <div className="space-y-4">
      {/* Sticky toolbar */}
      <div className="sticky top-12 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-background/95 supports-backdrop-filter:backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter ${tools.length} tools…`}
              className="w-full h-8 pl-8 pr-8 rounded-md border border-input bg-card text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {hasMultipleSubgroups && !q && (
            <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1" aria-label="Sections">
              <Chip active={activeSubgroup === "all"} onClick={() => setActiveSubgroup("all")}>
                All <span className="text-muted-foreground tabular-nums">{tools.length}</span>
              </Chip>
              {subgroups.map((sg) => (
                <Chip key={sg.id} active={activeSubgroup === sg.id} onClick={() => setActiveSubgroup(sg.id)}>
                  {sg.name} <span className="text-muted-foreground tabular-nums">{sg.tools.length}</span>
                </Chip>
              ))}
            </nav>
          )}

          <div className="ml-auto inline-flex items-center rounded-md border border-border bg-card p-0.5">
            <ViewBtn active={view === "grid"} onClick={() => changeView("grid")} label="Grid view">
              <LayoutGrid className="w-3.5 h-3.5" />
            </ViewBtn>
            <ViewBtn active={view === "list"} onClick={() => changeView("list")} label="List view">
              <List className="w-3.5 h-3.5" />
            </ViewBtn>
          </div>
        </div>

        {hasMultipleSubgroups && !q && (
          <select
            value={activeSubgroup}
            onChange={(e) => setActiveSubgroup(e.target.value)}
            className="md:hidden mt-2 h-8 w-full rounded-md border border-input bg-card text-xs px-2"
            aria-label="Section"
          >
            <option value="all">All sections ({tools.length})</option>
            {subgroups.map((sg) => (
              <option key={sg.id} value={sg.id}>
                {sg.name} ({sg.tools.length})
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-md border border-dashed border-border bg-dots">
          <p className="text-sm text-muted-foreground">No tools match &ldquo;{query}&rdquo;.</p>
          <button onClick={() => setQuery("")} className="mt-3 text-sm font-medium text-primary hover:underline">
            Clear filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleSubgroups.map((sg) => (
            <section key={sg.id} id={`subgroup-${sg.id}`} className="scroll-mt-28 space-y-2">
              {hasMultipleSubgroups && (
                <h3 className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  {sg.name}
                  <span className="text-xs font-normal text-muted-foreground tabular-nums">{sg.tools.length}</span>
                </h3>
              )}
              <div className={view === "grid" ? gridCls : listCls}>
                {sg.tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} variant={view === "grid" ? "grid" : "row"} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ViewBtn({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "w-7 h-6.5 inline-flex items-center justify-center rounded-sm transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
