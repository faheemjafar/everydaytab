"use client";

import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

/**
 * Wraps server-rendered SEO prose in a <details> so it stays in the DOM
 * (crawlable) while defaulting to collapsed. Honors the settings.seoContent
 * preference: collapsed | expanded | hidden.
 */
export function SeoDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const { settings, mounted } = useSettings();
  const mode = mounted ? settings.seoContent : "collapsed";

  return (
    <details
      key={mode}
      open={mode === "expanded"}
      className={mode === "hidden" ? "sr-only" : "group rounded-md border border-border bg-card"}
    >
      <summary className="flex items-center gap-2 h-10 px-3 cursor-pointer select-none list-none text-[13px] font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{title}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-4 md:px-6 py-5">{children}</div>
    </details>
  );
}
