"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Clock, Star, Trash2, X } from "lucide-react";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import { categoryStyle } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/tool-card";
import { SectionHeader } from "@/components/home/section-header";
import { openCommandPalette } from "@/lib/events";

export function FavoritesClient() {
  const { favoriteTools, recentTools, toggleFavorite, moveFavorite, removeRecent, clearRecents, mounted } =
    usePersistentTools();

  return (
    <div className="px-4 md:px-6 py-6 md:py-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-500 text-amber-500" /> Favorites
        </h1>
        <p className="text-sm text-muted-foreground">Pinned tools appear in the sidebar and the command palette. Stored on this device.</p>
      </div>

      {mounted && favoriteTools.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-dots p-10 text-center space-y-3">
          <p className="text-sm font-medium">No favorites yet</p>
          <p className="text-xs text-muted-foreground">Hover any tool and press the star, or search for one now.</p>
          <Button variant="outline" onClick={openCommandPalette}>
            Search tools
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {favoriteTools.map((t, i) => (
            <li key={t.id} className="flex items-center gap-2.5 h-11 pl-3 pr-2">
              <span style={categoryStyle(t.category)} className="cat-chip w-6 h-6 rounded-sm flex items-center justify-center shrink-0">
                <LucideIcon name={t.icon} className="w-3.5 h-3.5" />
              </span>
              <Link href={t.path} className="text-[13px] font-medium hover:text-primary truncate flex-1">
                {t.name}
              </Link>
              <Button variant="ghost" size="icon-sm" onClick={() => moveFavorite(t.id, -1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => moveFavorite(t.id, 1)}
                disabled={i === favoriteTools.length - 1}
                aria-label="Move down"
              >
                <ArrowDown />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => toggleFavorite(t.id)} aria-label="Remove from favorites" className="text-muted-foreground hover:text-destructive">
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {mounted && recentTools.length > 0 && (
        <section className="space-y-2">
          <SectionHeader
            icon={<Clock className="w-3.5 h-3.5" />}
            title="Recent"
            count={recentTools.length}
            action={
              <button type="button" onClick={clearRecents} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            }
          />
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {recentTools.map((t) => (
              <li key={t.id} className="flex items-center gap-2 pr-1">
                <div className="flex-1 min-w-0">
                  <ToolCard tool={t} variant="row" />
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => removeRecent(t.id)} aria-label="Remove" className="text-muted-foreground">
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
