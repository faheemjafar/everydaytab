"use client";

import { useCallback, useMemo } from "react";
import { getToolById, type Tool } from "@/lib/tools";
import { createLocalStore, useLocalStore, useMounted } from "@/lib/local-store";
import { FAVORITES_KEY, RECENTS_KEY } from "@/lib/settings";
import { settingsStore } from "@/hooks/use-settings";

const toIdList = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];

export const favoritesStore = createLocalStore<string[]>(FAVORITES_KEY, [], toIdList);
export const recentsStore = createLocalStore<string[]>(RECENTS_KEY, [], toIdList);

const resolve = (ids: string[]) => ids.map((id) => getToolById(id)).filter((t): t is Tool => !!t);

export function usePersistentTools() {
  const [favorites, setFavorites] = useLocalStore(favoritesStore);
  const [recents, setRecents] = useLocalStore(recentsStore);
  const mounted = useMounted();

  const favoriteTools = useMemo(() => (mounted ? resolve(favorites) : []), [favorites, mounted]);
  const recentTools = useMemo(() => (mounted ? resolve(recents) : []), [recents, mounted]);

  const toggleFavorite = useCallback(
    (toolId: string) =>
      setFavorites((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId])),
    [setFavorites]
  );

  const moveFavorite = useCallback(
    (toolId: string, direction: -1 | 1) =>
      setFavorites((prev) => {
        const i = prev.indexOf(toolId);
        const j = i + direction;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      }),
    [setFavorites]
  );

  const addRecent = useCallback(
    (toolId: string) => {
      const limit = settingsStore.get().recentsLimit;
      setRecents((prev) => [toolId, ...prev.filter((id) => id !== toolId)].slice(0, limit));
    },
    [setRecents]
  );

  const removeRecent = useCallback(
    (toolId: string) => setRecents((prev) => prev.filter((id) => id !== toolId)),
    [setRecents]
  );

  const clearRecents = useCallback(() => setRecents([]), [setRecents]);
  const clearFavorites = useCallback(() => setFavorites([]), [setFavorites]);

  return {
    favorites,
    recents,
    favoriteTools,
    recentTools,
    isFavorite: (toolId: string) => favorites.includes(toolId),
    toggleFavorite,
    moveFavorite,
    addRecent,
    removeRecent,
    clearRecents,
    clearFavorites,
    mounted,
  };
}
