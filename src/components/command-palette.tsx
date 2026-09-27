"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Clock, Home, LayoutGrid, Moon, Settings, Star, Sun } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { categories, categoryStyle, getCategory, tools, type Tool } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import { CMD_PALETTE_EVENT } from "@/lib/events";

export { CMD_PALETTE_EVENT };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { favoriteTools, recentTools, addRecent, mounted } = usePersistentTools();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const toggle = () => setOpen((o) => !o);
    document.addEventListener("keydown", down);
    window.addEventListener(CMD_PALETTE_EVENT, toggle);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener(CMD_PALETTE_EVENT, toggle);
    };
  }, []);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  const go = (tool: Tool) =>
    run(() => {
      addRecent(tool.id);
      router.push(tool.path);
    });

  const searching = query.trim().length > 0;

  // Without a query, show a compact "start" view; with a query, flat results across everything.
  const toolsByCategory = useMemo(() => {
    const grouped: Record<string, Tool[]> = {};
    for (const t of tools) (grouped[t.category] ||= []).push(t);
    return grouped;
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search EverydayTab"
      description="Type a tool name, tag or category."
      className="sm:max-w-xl rounded-lg shadow-float overflow-hidden"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={`Search ${tools.length} tools, categories, actions…`}
        className="h-11 text-sm"
      />
      <CommandList className="max-h-[60vh] p-1.5 custom-scrollbar">
        <CommandEmpty className="py-10 text-center text-sm text-muted-foreground">No results.</CommandEmpty>

        {!searching && mounted && recentTools.length > 0 && (
          <CommandGroup heading="Recent">
            {recentTools.slice(0, 5).map((t) => (
              <ToolItem key={`r-${t.id}`} tool={t} onSelect={() => go(t)} prefix="recent" icon={<Clock className="w-3.5 h-3.5" />} />
            ))}
          </CommandGroup>
        )}

        {!searching && mounted && favoriteTools.length > 0 && (
          <CommandGroup heading="Favorites">
            {favoriteTools.slice(0, 6).map((t) => (
              <ToolItem key={`f-${t.id}`} tool={t} onSelect={() => go(t)} prefix="favorite" icon={<Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />} />
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Navigate">
          <CommandItem value="go home dashboard" onSelect={() => run(() => router.push("/"))}>
            <Home className="text-muted-foreground" /> Home
          </CommandItem>
          <CommandItem value="go favorites" onSelect={() => run(() => router.push("/favorites"))}>
            <Star className="text-muted-foreground" /> Favorites
          </CommandItem>
          <CommandItem value="open settings preferences" onSelect={() => run(() => router.push("/settings"))}>
            <Settings className="text-muted-foreground" /> Settings
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="toggle theme dark light mode"
            onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
          >
            {resolvedTheme === "dark" ? <Sun className="text-muted-foreground" /> : <Moon className="text-muted-foreground" />}
            Toggle theme
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Categories">
          {categories.map((c) => (
            <CommandItem
              key={c.id}
              value={`category ${c.name} ${c.short}`}
              onSelect={() => run(() => router.push(`/category/${c.id}`))}
            >
              <span style={categoryStyle(c)} className="cat-chip w-5 h-5 rounded-sm flex items-center justify-center shrink-0">
                <LucideIcon name={c.icon} className="w-3 h-3" />
              </span>
              {c.name}
              <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{toolsByCategory[c.id]?.length ?? 0}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="my-1" />

        {/* Full tool index – cmdk filters it by value */}
        <CommandGroup heading={searching ? "Tools" : "All tools"}>
          {tools.map((t) => (
            <ToolItem key={t.id} tool={t} onSelect={() => go(t)} showCategory />
          ))}
        </CommandGroup>
      </CommandList>
      <div className="hidden sm:flex items-center gap-3 px-3 h-8 border-t border-border text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span className="inline-flex items-center gap-1"><kbd>↵</kbd> open</span>
        <span className="inline-flex items-center gap-1"><kbd>esc</kbd> close</span>
        <span className="ml-auto inline-flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> {tools.length} tools</span>
      </div>
    </CommandDialog>
  );
}

function ToolItem({
  tool,
  onSelect,
  prefix = "",
  icon,
  showCategory,
}: {
  tool: Tool;
  onSelect: () => void;
  prefix?: string;
  icon?: React.ReactNode;
  showCategory?: boolean;
}) {
  const cat = getCategory(tool.category);
  return (
    <CommandItem
      value={`${prefix} ${tool.name} ${tool.description} ${cat?.name ?? ""} ${tool.tags?.join(" ") ?? ""}`}
      onSelect={onSelect}
      className="gap-2.5"
    >
      <span style={categoryStyle(cat)} className="cat-chip w-6 h-6 rounded-sm flex items-center justify-center shrink-0">
        {icon ?? <LucideIcon name={tool.icon} className="w-3.5 h-3.5" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium truncate">{tool.name}</span>
        <span className="block text-[11px] text-muted-foreground truncate">{tool.description}</span>
      </span>
      {showCategory && cat && <span className="text-[11px] text-muted-foreground shrink-0">{cat.short}</span>}
    </CommandItem>
  );
}
