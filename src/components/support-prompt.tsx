"use client";

import { useEffect, useState } from "react";
import { Heart, Coffee, X } from "lucide-react";
import {
  KOFI_URL,
  SUPPORT_CONFIG,
  SUPPORT_PROMPT_EVENT,
  markSupportPromptShown,
  shouldShowSupportPrompt,
} from "@/lib/support";
import { settingsStore } from "@/hooks/use-settings";

/**
 * Global non-blocking support notice:
 *  - Listens for the SUPPORT_PROMPT_EVENT (manual trigger from any tool).
 *  - Auto-detects user-initiated file downloads (incl. detached anchors via
 *    a one-time prototype patch) so we don't need to instrument 150 tools.
 *  - Slides in from the bottom-right corner. Doesn't dim the page,
 *    doesn't block interaction. User dismisses or clicks the CTA.
 *  - Throttled to once per 3 days via localStorage so it never feels spammy.
 *  - Can be disabled entirely from Settings → Support.
 */
export function SupportPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleEvent = () => {
      if (!settingsStore.get().showSupportPrompt) return;
      if (!shouldShowSupportPrompt()) return;
      // Tiny delay so the user sees their result first.
      window.setTimeout(() => {
        setOpen(true);
        markSupportPromptShown();
      }, 700);
    };

    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a[download]") as HTMLAnchorElement | null;
      if (!anchor) return;
      // Skip the prompt itself (e.g. if Ko-fi link ever has download attr).
      if (anchor.closest("[data-support-prompt]")) return;
      handleEvent();
    };

    // Many tools trigger downloads via a *detached* anchor:
    //   const a = document.createElement("a"); a.download = "x"; a.click();
    // Detached clicks don't bubble to document, so we patch the prototype to
    // also fire our event whenever a programmatic download click happens.
    const proto = HTMLAnchorElement.prototype as HTMLAnchorElement & {
      __everydaytabPatched?: boolean;
    };
    const originalClick = proto.click;
    if (!proto.__everydaytabPatched) {
      proto.click = function patchedClick(this: HTMLAnchorElement, ...args: []) {
        try {
          // `download` attr present (even empty string) signals a download intent.
          if (this.hasAttribute("download")) {
            handleEvent();
          }
        } catch {
          // never block the actual click
        }
        return originalClick.apply(this, args);
      };
      proto.__everydaytabPatched = true;
    }

    window.addEventListener(SUPPORT_PROMPT_EVENT, handleEvent);
    document.addEventListener("click", handleDocClick, { capture: true });
    return () => {
      window.removeEventListener(SUPPORT_PROMPT_EVENT, handleEvent);
      document.removeEventListener("click", handleDocClick, { capture: true });
      // Note: we intentionally don't unpatch — the patch is idempotent
      // and removing it on unmount could break detection if SupportPrompt
      // remounts (e.g. during fast refresh).
    };
  }, []);

  if (!open) return null;

  return (
    <div
      data-support-prompt
      role="complementary"
      aria-label="Support EverydayTab"
      className="fixed bottom-16 md:bottom-4 right-4 z-[90] w-[calc(100%-2rem)] sm:w-80 rounded-md bg-popover text-popover-foreground shadow-float p-3.5 animate-in slide-in-from-bottom-2 fade-in duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500/10 shrink-0">
          <Heart className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Hope that saved you time!</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            Built solo by {SUPPORT_CONFIG.authorName}. Free, ad-free, processed in your browser. A coffee keeps it
            free.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss"
          className="text-muted-foreground/60 hover:text-foreground transition-colors h-6 w-6 rounded-sm flex items-center justify-center hover:bg-muted shrink-0 -mt-1 -mr-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md font-medium text-xs bg-[#FF5E5B] text-white hover:bg-[#ff4744] transition-colors"
        >
          <Coffee className="w-3.5 h-3.5" />
          Buy me a coffee
        </a>
        <a
          href="/settings#support"
          onClick={() => setOpen(false)}
          className="text-[11px] text-muted-foreground hover:text-foreground px-2"
        >
          Don&apos;t show
        </a>
      </div>
    </div>
  );
}
