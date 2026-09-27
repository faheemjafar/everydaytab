"use client";

import Link from "next/link";
import { ArrowRight, Clock, Star, Trash2 } from "lucide-react";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import { ToolCard } from "@/components/tool-card";
import { SectionHeader } from "@/components/home/section-header";

/** Recents + Favorites — client-only because they come from localStorage. */
export function HomeUserSections() {
  const { favoriteTools, recentTools, clearRecents, mounted } = usePersistentTools();
  if (!mounted || (favoriteTools.length === 0 && recentTools.length === 0)) return null;

  return (
    <>
      {recentTools.length > 0 && (
        <section className="space-y-2">
          <SectionHeader
            icon={<Clock className="w-3.5 h-3.5" />}
            title="Pick up where you left off"
            action={
              <button
                type="button"
                onClick={clearRecents}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {recentTools.slice(0, 8).map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      )}

      {favoriteTools.length > 0 && (
        <section className="space-y-2">
          <SectionHeader
            icon={<Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />}
            title="Favorites"
            count={favoriteTools.length}
            action={
              <Link href="/favorites" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {favoriteTools.slice(0, 8).map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
