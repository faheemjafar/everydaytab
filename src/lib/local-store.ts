"use client";

import { useSyncExternalStore } from "react";

// Tiny external store backed by localStorage. One instance per key; every
// subscriber (across components and tabs) re-renders when the value changes.
// Using useSyncExternalStore keeps SSR/CSR consistent: the server snapshot is
// always the fallback, and the client hydrates to the stored value.

type Listener = () => void;

interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (l: Listener) => () => void;
  fallback: T;
}

const stores = new Map<string, Store<unknown>>();

export function createLocalStore<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T = (raw) => raw as T
): Store<T> {
  const existing = stores.get(key);
  if (existing) return existing as Store<T>;

  const listeners = new Set<Listener>();
  let cache: T | undefined;
  let loaded = false;

  const read = (): T => {
    if (typeof window === "undefined") return fallback;
    if (loaded) return cache as T;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw === null ? fallback : parse(JSON.parse(raw));
    } catch {
      cache = fallback;
    }
    loaded = true;
    return cache as T;
  };

  const emit = () => listeners.forEach((l) => l());

  const store: Store<T> = {
    fallback,
    get: read,
    set: (next) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(read()) : next;
      cache = value;
      loaded = true;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // storage full / disabled — keep in memory
      }
      emit();
    },
    subscribe: (l) => {
      listeners.add(l);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) {
          loaded = false;
          emit();
        }
      };
      if (listeners.size === 1) window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(l);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
  };

  stores.set(key, store as Store<unknown>);
  return store;
}

/** Forces every store to re-read from localStorage (after import / wipe). */
export function invalidateLocalStores() {
  // A null-key storage event is treated by every store as "re-read everything".
  if (typeof window !== "undefined") window.dispatchEvent(new StorageEvent("storage", { key: null }));
}

export function useLocalStore<T>(store: Store<T>): [T, Store<T>["set"]] {
  const value = useSyncExternalStore(store.subscribe, store.get, () => store.fallback);
  return [value, store.set];
}

/** True once the component has mounted on the client (safe to trust stored values). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
