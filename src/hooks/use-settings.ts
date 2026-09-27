"use client";

import { useCallback, useEffect } from "react";
import { createLocalStore, useLocalStore, useMounted } from "@/lib/local-store";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  applySettingsToDocument,
  sanitizeSettings,
  type Settings,
} from "@/lib/settings";

export const settingsStore = createLocalStore<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS, sanitizeSettings);

export function useSettings() {
  const [settings, set] = useLocalStore(settingsStore);
  const mounted = useMounted();

  const update = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => set((prev) => ({ ...prev, [key]: value })),
    [set]
  );

  const patch = useCallback((partial: Partial<Settings>) => set((prev) => ({ ...prev, ...partial })), [set]);

  const reset = useCallback(() => set(DEFAULT_SETTINGS), [set]);

  return { settings, update, patch, reset, mounted };
}

/** Mount once near the root: mirrors settings onto <html data-*>. */
export function useApplySettings() {
  const [settings] = useLocalStore(settingsStore);
  useEffect(() => applySettingsToDocument(settings), [settings]);
}
