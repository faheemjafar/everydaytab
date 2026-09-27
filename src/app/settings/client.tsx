"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Check, Coffee, Download, Heart, Monitor, Moon, Sun, Trash2, Upload } from "lucide-react";
import { GithubIcon as Github } from "@/components/github-icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";
import { usePersistentTools, favoritesStore, recentsStore } from "@/hooks/use-persistent-tools";
import { useToast } from "@/hooks/use-toast";
import { invalidateLocalStores } from "@/lib/local-store";
import {
  ACCENTS,
  ALL_STORAGE_KEYS,
  FAVORITES_KEY,
  RECENTS_KEY,
  RECENTS_LIMITS,
  SETTINGS_KEY,
  sanitizeSettings,
  type Accent,
  type Settings,
} from "@/lib/settings";
import { KOFI_URL, SUPPORT_CONFIG } from "@/lib/support";
import { tools } from "@/lib/tools";

const SECTIONS = [
  { id: "appearance", label: "Appearance" },
  { id: "behaviour", label: "Behaviour" },
  { id: "data", label: "Data" },
  { id: "support", label: "Support & about" },
] as const;

const ACCENT_SWATCH: Record<Accent, string> = {
  teal: "oklch(0.55 0.12 190)",
  indigo: "oklch(0.55 0.18 277)",
  emerald: "oklch(0.55 0.14 155)",
  orange: "oklch(0.62 0.16 45)",
  rose: "oklch(0.58 0.16 5)",
  mono: "oklch(0.3 0.01 60)",
};

export function SettingsClient() {
  const { settings, update, reset, mounted } = useSettings();
  const { theme, setTheme } = useTheme();
  const { favoriteTools, recentTools, clearFavorites, clearRecents } = usePersistentTools();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const exportData = () => {
    const payload = {
      app: "everydaytab",
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      theme,
      favorites: favoritesStore.get(),
      recents: recentsStore.get(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `everydaytab-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== "everydaytab") throw new Error("Not an EverydayTab export");
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(data.settings)));
      const ids = (arr: unknown) => (Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && tools.some((t) => t.id === x)) : []);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids(data.favorites)));
      localStorage.setItem(RECENTS_KEY, JSON.stringify(ids(data.recents)));
      if (typeof data.theme === "string") setTheme(data.theme);
      invalidateLocalStores();
      toast("Settings imported", { type: "success" });
    } catch (e) {
      toast((e as Error).message || "Could not import that file.", { type: "error", title: "Import failed" });
    }
  };

  const wipe = () => {
    ALL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    invalidateLocalStores();
    setTheme("system");
    setConfirmWipe(false);
    toast("All local data removed", { type: "success" });
  };

  return (
    <div className="px-4 md:px-6 py-6 md:py-8 max-w-5xl mx-auto">
      <div className="space-y-1 mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Preferences are stored on this device only. Press <kbd>⌘</kbd><kbd>,</kbd> to open this page anywhere.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[160px_1fr]">
        <nav className="hidden md:block sticky top-16 self-start space-y-0.5" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block h-8 leading-8 px-2 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted">
              {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-10 min-w-0">
          {/* Appearance */}
          <Section id="appearance" title="Appearance">
            <Row label="Theme" description="Follows your OS by default.">
              <Segmented
                value={mounted ? theme ?? "system" : "system"}
                onChange={setTheme}
                options={[
                  { value: "light", label: "Light", icon: <Sun className="w-3.5 h-3.5" /> },
                  { value: "dark", label: "Dark", icon: <Moon className="w-3.5 h-3.5" /> },
                  { value: "system", label: "System", icon: <Monitor className="w-3.5 h-3.5" /> },
                ]}
              />
            </Row>
            <Row label="Accent colour" description="Used for buttons, links and focus rings.">
              <div className="flex items-center gap-1.5">
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => update("accent", a)}
                    aria-label={a}
                    aria-pressed={settings.accent === a}
                    title={a}
                    style={{ background: ACCENT_SWATCH[a] }}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center ring-offset-2 ring-offset-background transition-shadow",
                      settings.accent === a ? "ring-2 ring-foreground" : "hover:ring-2 hover:ring-border"
                    )}
                  >
                    {settings.accent === a && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Density" description="Compact fits more on screen; comfortable has larger controls.">
              <Segmented
                value={settings.density}
                onChange={(v) => update("density", v as Settings["density"])}
                options={[
                  { value: "compact", label: "Compact" },
                  { value: "comfortable", label: "Comfortable" },
                ]}
              />
            </Row>
            <Row label="Font size">
              <Segmented
                value={settings.fontSize}
                onChange={(v) => update("fontSize", v as Settings["fontSize"])}
                options={[
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Default" },
                  { value: "lg", label: "Large" },
                ]}
              />
            </Row>
            <Row label="Reduce motion" description="Disables animations and transitions.">
              <Switch checked={settings.reduceMotion} onCheckedChange={(v) => update("reduceMotion", v)} />
            </Row>
          </Section>

          {/* Behaviour */}
          <Section id="behaviour" title="Behaviour">
            <Row label="Sidebar labels" description="Show category names next to their icons. Off = compact icon rail with tooltips.">
              <Switch checked={settings.railLabels} onCheckedChange={(v) => update("railLabels", v)} />
            </Row>
            <Row label="Keep tool list pinned" description="Show the current category's tool list next to the sidebar on large screens.">
              <Switch checked={settings.sidebarPinned} onCheckedChange={(v) => update("sidebarPinned", v)} />
            </Row>
            <Row label="Open sidebar on hover" description="When unpinned, hovering a category icon opens its tool list. Off = click only.">
              <Switch checked={settings.sidebarHoverOpen} onCheckedChange={(v) => update("sidebarHoverOpen", v)} />
            </Row>
            <Row label="Open last tool on start" description="When you open EverydayTab, jump straight to the tool you used last.">
              <Switch checked={settings.openLastToolOnStart} onCheckedChange={(v) => update("openLastToolOnStart", v)} />
            </Row>
            <Row label="Recent tools to keep">
              <Segmented
                value={String(settings.recentsLimit)}
                onChange={(v) => update("recentsLimit", Number(v) as Settings["recentsLimit"])}
                options={RECENTS_LIMITS.map((n) => ({ value: String(n), label: String(n) }))}
              />
            </Row>
            <Row label="Guides under tools" description="The About / How-to / FAQ block beneath each tool.">
              <Segmented
                value={settings.seoContent}
                onChange={(v) => update("seoContent", v as Settings["seoContent"])}
                options={[
                  { value: "collapsed", label: "Collapsed" },
                  { value: "expanded", label: "Expanded" },
                  { value: "hidden", label: "Hidden" },
                ]}
              />
            </Row>
            <Row label="Full-width tool workspace" description="Let tools use the whole window instead of a centred column.">
              <Switch checked={settings.fullWidthTools} onCheckedChange={(v) => update("fullWidthTools", v)} />
            </Row>
          </Section>

          {/* Data */}
          <Section id="data" title="Data">
            <Row label="Favorites" description={mounted ? `${favoriteTools.length} pinned` : ""}>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/favorites">Manage</Link>
                </Button>
                <Button variant="ghost" onClick={clearFavorites} disabled={!favoriteTools.length}>
                  Clear
                </Button>
              </div>
            </Row>
            <Row label="Recent tools" description={mounted ? `${recentTools.length} remembered` : ""}>
              <Button variant="ghost" onClick={clearRecents} disabled={!recentTools.length}>
                Clear
              </Button>
            </Row>
            <Row label="Export / import" description="Settings, favorites and recents as a JSON file.">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={exportData}>
                  <Download /> Export
                </Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload /> Import
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importData(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </Row>
            <Row label="Reset preferences" description="Restore defaults; keeps favorites and recents.">
              <Button variant="ghost" onClick={reset}>
                Reset
              </Button>
            </Row>
            <Row label="Wipe all local data" description="Removes settings, favorites, recents and theme from this browser.">
              {confirmWipe ? (
                <div className="flex items-center gap-2">
                  <Button variant="destructive" onClick={wipe}>
                    <Trash2 /> Yes, wipe everything
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmWipe(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="destructive" onClick={() => setConfirmWipe(true)}>
                  <Trash2 /> Wipe
                </Button>
              )}
            </Row>
          </Section>

          {/* Support */}
          <Section id="support" title="Support & about">
            <Row label="Show support prompt" description="Occasional, dismissible note after you download a result (max once per 3 days).">
              <Switch checked={settings.showSupportPrompt} onCheckedChange={(v) => update("showSupportPrompt", v)} />
            </Row>
            <div className="rounded-md border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-[13px] font-medium flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Built solo by {SUPPORT_CONFIG.authorName}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  EverydayTab is free, open source and ad-free. {tools.length} tools and counting. If it saves you time, a coffee
                  keeps it that way.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild>
                  <a href={KOFI_URL} target="_blank" rel="noopener noreferrer">
                    <Coffee /> Buy me a coffee
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://github.com/faheemjafar/everydaytab" target="_blank" rel="noopener noreferrer">
                    <Github /> GitHub
                  </a>
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              All processing happens in your browser. Nothing you paste or upload leaves your device.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 space-y-3">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <div className="rounded-md border border-border bg-card divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[13px] font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground leading-snug">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
}) {
  return (
    <div role="radiogroup" className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-sm text-xs font-medium transition-colors",
            value === o.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
