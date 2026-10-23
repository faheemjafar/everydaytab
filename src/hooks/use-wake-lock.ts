"use client";

import { useEffect, useState } from "react";

export type WakeLockState = "off" | "active" | "unsupported" | "denied";

/** Holds a Screen Wake Lock while `enabled`, re-acquiring it when the tab becomes visible again. */
export function useWakeLock(enabled: boolean): WakeLockState {
  const [state, setState] = useState<WakeLockState>("off");
  useEffect(() => {
    if (!enabled) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      if (!("wakeLock" in navigator)) { setState("unsupported"); return; }
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) { lock.release(); return; }
        setState("active");
        lock.addEventListener("release", () => { if (!cancelled) setState("off"); });
      } catch {
        setState("denied");
      }
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release();
      setState("off");
    };
  }, [enabled]);
  return state;
}
