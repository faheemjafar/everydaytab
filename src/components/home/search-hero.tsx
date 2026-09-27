"use client";

import { Search } from "lucide-react";
import { openCommandPalette } from "@/lib/events";
import { tools, categories } from "@/lib/tools";

export function SearchHero() {
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">What do you need to do?</h1>
        <p className="text-sm text-muted-foreground">
          {tools.length} free tools across {categories.length} categories. Everything runs in your browser — nothing is
          uploaded.
        </p>
      </div>
      <button
        type="button"
        onClick={openCommandPalette}
        className="group flex items-center gap-3 w-full max-w-2xl h-11 px-3.5 rounded-md border border-border bg-card text-left text-sm text-muted-foreground transition-colors hover:border-ring/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 truncate">Search tools — try &ldquo;merge pdf&rdquo;, &ldquo;json&rdquo;, &ldquo;qr code&rdquo;…</span>
        <kbd className="hidden sm:inline-flex h-6 px-1.5 text-[11px]">⌘K</kbd>
      </button>
    </section>
  );
}
