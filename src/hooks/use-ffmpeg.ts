"use client";

import { useCallback, useEffect, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

// FFmpeg core (wasm) is fetched once per session from the CDN and cached by the
// browser. Only the engine is downloaded — user files never leave the device.
const CORE_VERSION = "0.12.6";
const CORE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;
const WASM_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.wasm`;

type Status = "idle" | "loading" | "ready" | "error";

/* ------------------------------------------------------------------ */
/* Module-level singleton shared by every tool                        */
/* ------------------------------------------------------------------ */

let instance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
let status: Status = "idle";
let lastError: string | null = null;
let progressCb: ((pct: number) => void) | null = null;
const logTail: string[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

async function toBlobURL(url: string, type: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't download the video engine (${res.status}).`);
  return URL.createObjectURL(new Blob([await res.blob()], { type }));
}

function loadFFmpeg(): Promise<FFmpeg> {
  if (loadPromise) return loadPromise;
  status = "loading";
  lastError = null;
  notify();
  loadPromise = (async () => {
    const ff = new FFmpeg();
    ff.on("log", ({ message }) => {
      // Keep a short tail for error messages instead of spamming the console.
      logTail.push(message);
      if (logTail.length > 40) logTail.shift();
    });
    ff.on("progress", ({ progress }) => {
      if (progressCb) progressCb(Math.min(100, Math.max(0, Math.round(progress * 100))));
    });
    const [coreURL, wasmURL] = await Promise.all([toBlobURL(CORE_URL, "text/javascript"), toBlobURL(WASM_URL, "application/wasm")]);
    await ff.load({ coreURL, wasmURL });
    instance = ff;
    status = "ready";
    notify();
    return ff;
  })().catch((e) => {
    status = "error";
    lastError = (e as Error)?.message || "Failed to load the video engine.";
    loadPromise = null;
    notify();
    throw e;
  });
  return loadPromise;
}

/** Last lines FFmpeg printed — useful to surface why a command failed. */
export function ffmpegLogTail(lines = 6) {
  return logTail.slice(-lines).join("\n");
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Shared FFmpeg instance. Starts loading on first mount (unless `lazy`),
 * and is reused across tools for the rest of the session.
 */
export function useFFmpeg({ lazy = false }: { lazy?: boolean } = {}) {
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (!lazy && status === "idle") loadFFmpeg().catch(() => {});
    return () => {
      listeners.delete(l);
    };
  }, [lazy]);

  const setOnProgress = useCallback((cb: ((pct: number) => void) | null) => {
    progressCb = cb;
  }, []);

  const resetFFmpeg = useCallback(async () => {
    // Recover from wasm OOM / aborted runs by recreating the worker.
    try {
      instance?.terminate();
    } catch {
      /* already gone */
    }
    instance = null;
    loadPromise = null;
    status = "idle";
    return loadFFmpeg();
  }, []);

  const load = useCallback(() => loadFFmpeg(), []);

  return {
    ffmpeg: status === "ready" ? instance : null,
    loaded: status === "ready",
    loading: status === "loading",
    error: status === "error" ? lastError : null,
    status,
    load,
    fetchFile,
    setOnProgress,
    resetFFmpeg,
  };
}
