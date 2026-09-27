"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Link2, Star } from "lucide-react";
import { getToolById, getCategory, categoryStyle } from "@/lib/tools";
import { LucideIcon } from "@/components/lucide-icon";
import { usePersistentTools } from "@/hooks/use-persistent-tools";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ToolLayoutProps {
  toolId: string;
  children: React.ReactNode;
}

export function ToolLayout({ toolId, children }: ToolLayoutProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite, addRecent, mounted } = usePersistentTools();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const tool = getToolById(toolId);

  useEffect(() => {
    if (tool) addRecent(tool.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  if (!tool) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="text-lg font-semibold">Tool not found</h1>
        <p className="text-sm text-muted-foreground">This tool does not exist or has moved.</p>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft /> Back home
        </Button>
      </div>
    );
  }

  const category = getCategory(tool.category);
  const fav = mounted && isFavorite(tool.id);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast("Link copied to clipboard", { type: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Could not copy the link.", { type: "error" });
    }
  };

  return (
    <div
      className={cn(
        "px-4 md:px-6 py-5 md:py-6 mx-auto space-y-5",
        settings.fullWidthTools ? "max-w-none" : "max-w-6xl"
      )}
    >
      <header className="flex items-start gap-3">
        <span style={categoryStyle(category)} className="cat-chip w-10 h-10 rounded-md flex items-center justify-center shrink-0">
          <LucideIcon name={tool.icon} className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight leading-tight">{tool.name}</h1>
            {category && (
              <Link
                href={`/category/${category.id}`}
                className="hidden sm:inline-flex items-center h-5 px-1.5 rounded-sm bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                {category.short}
              </Link>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-snug">{tool.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="icon" onClick={share} aria-label="Copy link" title="Copy link">
            {copied ? <Check className="text-emerald-600" /> : <Link2 />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavorite(tool.id)}
            aria-pressed={fav}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            title={fav ? "Remove from favorites" : "Add to favorites"}
            className={cn(fav && "text-amber-500 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10")}
          >
            <Star className={cn(fav && "fill-current")} />
          </Button>
        </div>
      </header>

      <div className="w-full">{children}</div>
    </div>
  );
}
