"use client";

import { useEffect, useRef, useState } from "react";

/** Downsampled min/max peaks for drawing; computed once per file. */
async function computePeaks(url: string, buckets: number): Promise<{ peaks: Float32Array; duration: number } | null> {
  try {
    const buf = await (await fetch(url)).arrayBuffer();
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const audio = await ctx.decodeAudioData(buf);
    ctx.close();
    const ch = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
    const size = Math.floor(audio.length / buckets) || 1;
    const peaks = new Float32Array(buckets);
    for (let b = 0; b < buckets; b++) {
      let max = 0;
      const startIdx = b * size;
      // Stride through the bucket for speed on long files.
      const stride = Math.max(1, Math.floor(size / 200));
      for (let i = 0; i < size; i += stride) {
        for (const c of ch) {
          const v = Math.abs(c[startIdx + i] ?? 0);
          if (v > max) max = v;
        }
      }
      peaks[b] = max;
    }
    return { peaks, duration: audio.duration };
  } catch {
    return null;
  }
}

/**
 * Waveform with optional selected range and playhead. Clicking seeks via
 * `onSeek`; the host owns the <audio> element and time state.
 */
export function Waveform({
  url,
  start,
  end,
  currentTime,
  onSeek,
  height = 96,
}: {
  url: string;
  start?: number;
  end?: number;
  currentTime?: number;
  onSeek?: (t: number) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<{ url: string; peaks: Float32Array; duration: number } | null | "error">(null);

  useEffect(() => {
    let alive = true;
    computePeaks(url, 1200).then((r) => alive && setData(r ? { url, ...r } : "error"));
    return () => {
      alive = false;
    };
  }, [url]);

  const ready = data && data !== "error" && data.url === url ? data : null;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !ready) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    c.width = w * dpr;
    c.height = height * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    // The wrapper has text-primary, so currentColor resolves to the accent.
    const primary = getComputedStyle(c).color || "#14b8a6";
    const muted = "rgba(120,113,108,0.35)";
    const { peaks, duration } = ready;
    const mid = height / 2;
    const barW = w / peaks.length;
    const s = start !== undefined ? (start / duration) * w : 0;
    const e = end !== undefined ? (end / duration) * w : w;
    for (let i = 0; i < peaks.length; i++) {
      const x = i * barW;
      const h = Math.max(1, peaks[i] * (height - 8));
      ctx.fillStyle = x >= s && x <= e ? primary : muted;
      ctx.fillRect(x, mid - h / 2, Math.max(1, barW - 0.2), h);
    }
    if (start !== undefined || end !== undefined) {
      ctx.fillStyle = primary;
      ctx.fillRect(s - 1, 0, 2, height);
      ctx.fillRect(e - 1, 0, 2, height);
    }
    if (currentTime !== undefined && Number.isFinite(currentTime)) {
      const x = (currentTime / duration) * w;
      ctx.fillStyle = "rgba(239,68,68,0.9)";
      ctx.fillRect(x - 0.5, 0, 1.5, height);
    }
  }, [ready, start, end, currentTime, height]);

  if (data === "error") return <p className="px-3 py-6 text-center text-xs text-muted-foreground">Waveform unavailable for this format — playback and processing still work.</p>;

  return (
    <div className="relative text-primary" style={{ height }}>
      {!ready && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Drawing waveform…</div>}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={(e) => {
          if (!ready || !onSeek) return;
          const r = e.currentTarget.getBoundingClientRect();
          onSeek(((e.clientX - r.left) / r.width) * ready.duration);
        }}
      />
    </div>
  );
}
