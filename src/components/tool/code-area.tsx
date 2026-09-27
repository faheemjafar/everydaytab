"use client";

import { type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface CodeAreaProps extends Omit<ComponentProps<"textarea">, "className"> {
  className?: string;
  /** Visual height. Defaults to a comfortable editor size. */
  minHeight?: number | string;
  /** Show subtle placeholder icon/text when empty. */
  emptyHint?: string;
}

/**
 * Monospaced, borderless textarea meant to sit flush inside a ToolPanel.
 * Uses the app mono font and a 13px size so large payloads stay legible.
 */
export function CodeArea({ className, minHeight = 320, emptyHint, value, readOnly, ...props }: CodeAreaProps) {
  const empty = !value;
  return (
    <div className="relative h-full">
      <textarea
        value={value}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={cn(
          "block w-full h-full resize-y bg-transparent px-3.5 py-3 font-mono text-[13px] leading-relaxed text-foreground outline-none",
          "placeholder:text-muted-foreground/50 selection:bg-primary/20",
          readOnly && "cursor-text",
          className
        )}
        style={{ minHeight }}
        {...props}
      />
      {empty && emptyHint && !props.placeholder && (
        <p className="pointer-events-none absolute left-3.5 top-3 text-[13px] font-mono text-muted-foreground/50">{emptyHint}</p>
      )}
    </div>
  );
}
