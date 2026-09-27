// User preferences. Persisted in localStorage under a single key and applied
// to <html> as data-* attributes so CSS can react (see globals.css).

export const ACCENTS = ["teal", "indigo", "emerald", "orange", "rose", "mono"] as const;
export type Accent = (typeof ACCENTS)[number];

export const DENSITIES = ["compact", "comfortable"] as const;
export type Density = (typeof DENSITIES)[number];

export const FONT_SIZES = ["sm", "md", "lg"] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const SEO_MODES = ["collapsed", "expanded", "hidden"] as const;
export type SeoMode = (typeof SEO_MODES)[number];

export const RECENTS_LIMITS = [5, 10, 20] as const;
export type RecentsLimit = (typeof RECENTS_LIMITS)[number];

export interface Settings {
  // Appearance (theme itself is handled by next-themes)
  accent: Accent;
  density: Density;
  fontSize: FontSize;
  reduceMotion: boolean;
  // Behaviour
  sidebarPinned: boolean;
  sidebarHoverOpen: boolean;
  openLastToolOnStart: boolean;
  recentsLimit: RecentsLimit;
  seoContent: SeoMode;
  fullWidthTools: boolean;
  // Support
  showSupportPrompt: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  accent: "teal",
  density: "compact",
  fontSize: "md",
  reduceMotion: false,
  sidebarPinned: false,
  sidebarHoverOpen: true,
  openLastToolOnStart: false,
  recentsLimit: 10,
  seoContent: "collapsed",
  fullWidthTools: false,
  showSupportPrompt: true,
};

export const SETTINGS_KEY = "everydaytab:settings";
export const FAVORITES_KEY = "everydaytab_favorites";
export const RECENTS_KEY = "everydaytab_recents";

/** Every localStorage key the app writes, for "wipe all data". */
export const ALL_STORAGE_KEYS = [
  SETTINGS_KEY,
  FAVORITES_KEY,
  RECENTS_KEY,
  "everydaytab:support-prompt:lastShownAt",
  "theme",
];

export function sanitizeSettings(input: unknown): Settings {
  const s = (input && typeof input === "object" ? input : {}) as Partial<Record<keyof Settings, unknown>>;
  const pick = <T,>(v: unknown, allowed: readonly T[], fallback: T): T =>
    (allowed as readonly unknown[]).includes(v) ? (v as T) : fallback;
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  return {
    accent: pick(s.accent, ACCENTS, DEFAULT_SETTINGS.accent),
    density: pick(s.density, DENSITIES, DEFAULT_SETTINGS.density),
    fontSize: pick(s.fontSize, FONT_SIZES, DEFAULT_SETTINGS.fontSize),
    reduceMotion: bool(s.reduceMotion, DEFAULT_SETTINGS.reduceMotion),
    sidebarPinned: bool(s.sidebarPinned, DEFAULT_SETTINGS.sidebarPinned),
    sidebarHoverOpen: bool(s.sidebarHoverOpen, DEFAULT_SETTINGS.sidebarHoverOpen),
    openLastToolOnStart: bool(s.openLastToolOnStart, DEFAULT_SETTINGS.openLastToolOnStart),
    recentsLimit: pick(s.recentsLimit, RECENTS_LIMITS, DEFAULT_SETTINGS.recentsLimit),
    seoContent: pick(s.seoContent, SEO_MODES, DEFAULT_SETTINGS.seoContent),
    fullWidthTools: bool(s.fullWidthTools, DEFAULT_SETTINGS.fullWidthTools),
    showSupportPrompt: bool(s.showSupportPrompt, DEFAULT_SETTINGS.showSupportPrompt),
  };
}

/** Applies the CSS-relevant settings to <html>. Safe to call on the server (no-op). */
export function applySettingsToDocument(s: Settings) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.dataset.accent = s.accent;
  el.dataset.density = s.density;
  el.dataset.fontSize = s.fontSize;
  el.dataset.reduceMotion = String(s.reduceMotion);
}

/**
 * Inline script injected in <head> so the accent/density/font-size are applied
 * before first paint (avoids a flash when settings differ from defaults).
 */
export const SETTINGS_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_KEY
)})||"{}");var d=document.documentElement;d.dataset.accent=s.accent||"teal";d.dataset.density=s.density||"compact";d.dataset.fontSize=s.fontSize||"md";d.dataset.reduceMotion=String(!!s.reduceMotion);}catch(e){}})();`;
