"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      title="Toggle theme"
      className={cn("inline-flex items-center justify-center transition-colors", className)}
    >
      <Sun className="hidden dark:block w-4 h-4" />
      <Moon className="block dark:hidden w-4 h-4" />
    </button>
  );
}
