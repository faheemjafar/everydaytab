"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Film, Music, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useFFmpeg, ffmpegLogTail, startLogCapture, stopLogCapture } from "@/hooks/use-ffmpeg";
import { FileDropzone } from "./file-dropzone";
import { formatBytes } from "./file-list";
import { PrivacyNote, StatusBadge, ToolAlert } from "./status";
import { OptionsLayout, ToolPanel } from "./tool-panel";
import { Waveform } from "./waveform";

export type MediaKind = "video" | "audio";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** 75.5 → "1:15.5"; 3725 → "1:02:05" */
export function formatDuration(sec: number, precise = false) {
  if (!Number.isFinite(sec)) return "--:--";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const ss = precise ? s.toFixed(1).padStart(4, "0") : String(Math.floor(s)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "1:15.5" | "75.5" | "01:02:05" → seconds (NaN if invalid) */
export function parseDuration(v: string) {
  const parts = v.trim().split(":").map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n) || n < 0)) return NaN;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** Scale filter that rounds to even dimensions (required by H.264/yuv420p). */
export const EVEN_DIMS = "scale=trunc(iw/2)*2:trunc(ih/2)*2";

/**
 * Broadly compatible H.264 video args (plays in Safari/iOS/Windows):
 * yuv420p pixel format and moov atom at the front for streaming.
 */
export function h264(crf: number | string = 23, preset: "ultrafast" | "superfast" | "veryfast" | "faster" = "ultrafast") {
  return ["-c:v", "libx264", "-preset", preset, "-crf", String(crf), "-pix_fmt", "yuv420p"];
}
export const FASTSTART = ["-movflags", "+faststart"];

export const VIDEO_CONTAINERS = {
  mp4: { mime: "video/mp4", v: (crf: number) => h264(crf), a: ["-c:a", "aac", "-b:a", "160k"], extra: FASTSTART },
  mov: { mime: "video/quicktime", v: (crf: number) => h264(crf), a: ["-c:a", "aac", "-b:a", "160k"], extra: FASTSTART },
  mkv: { mime: "video/x-matroska", v: (crf: number) => h264(crf), a: ["-c:a", "aac", "-b:a", "160k"], extra: [] as string[] },
  webm: { mime: "video/webm", v: (crf: number) => ["-c:v", "libvpx", "-crf", String(Math.min(63, Math.round(crf / 51 * 40) + 4)), "-b:v", "2M", "-deadline", "realtime", "-cpu-used", "8"], a: ["-c:a", "libvorbis", "-q:a", "4"], extra: [] as string[] },
  avi: { mime: "video/x-msvideo", v: (crf: number) => h264(crf), a: ["-c:a", "libmp3lame", "-q:a", "3"], extra: [] as string[] },
} as const;
export type VideoContainer = keyof typeof VIDEO_CONTAINERS;

export const AUDIO_FORMATS = {
  mp3: { label: "MP3", mime: "audio/mpeg", lossless: false, args: (kbps = 192) => ["-c:a", "libmp3lame", "-b:a", `${kbps}k`] },
  m4a: { label: "M4A", mime: "audio/mp4", lossless: false, args: (kbps = 192) => ["-c:a", "aac", "-b:a", `${kbps}k`] },
  ogg: { label: "OGG", mime: "audio/ogg", lossless: false, args: (kbps = 192) => ["-c:a", "libvorbis", "-b:a", `${kbps}k`] },
  // FFmpeg.wasm 0.12: libopus crashes on stereo at compression_level ≥ 5 and on non-48k input; pin both.
  opus: { label: "Opus", mime: "audio/ogg", lossless: false, args: (kbps = 128) => ["-c:a", "libopus", "-b:a", `${Math.min(kbps, 256)}k`, "-compression_level", "4", "-ar", "48000"] },
  wav: { label: "WAV", mime: "audio/wav", lossless: true, args: () => ["-c:a", "pcm_s16le"] },
  flac: { label: "FLAC", mime: "audio/flac", lossless: true, args: () => ["-c:a", "flac"] },
} as const;
export type AudioFormat = keyof typeof AUDIO_FORMATS;

/** Picks the output format matching the input file where possible (else MP3). */
export function audioFormatFor(file: File | null): AudioFormat {
  const e = extOf(file?.name ?? "", "mp3");
  if (e === "aac" || e === "mp4") return "m4a";
  return (e in AUDIO_FORMATS ? e : "mp3") as AudioFormat;
}

/** Encoder args + filename + mime for an audio output. */
export function audioOutput(format: AudioFormat, file: File | null, suffix: string, kbps?: number) {
  const f = AUDIO_FORMATS[format];
  return { codec: f.args(kbps), output: `out.${format}`, mime: f.mime, filename: `${stem(file)}-${suffix}.${format}` };
}

export const extOf = (name: string, fallback = "mp4") => (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? fallback).toLowerCase();
export const stem = (file: File | null) => file?.name.replace(/\.[^.]+$/, "") || "output";

interface MediaInfo {
  duration: number;
  width: number;
  height: number;
}

function probe(url: string, kind: MediaKind): Promise<MediaInfo> {
  return new Promise((res, rej) => {
    const el = document.createElement(kind);
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const v = el as HTMLVideoElement;
      res({ duration: el.duration, width: v.videoWidth ?? 0, height: v.videoHeight ?? 0 });
    };
    el.onerror = () => rej(new Error(`Your browser can't read this ${kind} file's metadata.`));
    el.src = url;
  });
}

/* ------------------------------------------------------------------ */
/* State                                                              */
/* ------------------------------------------------------------------ */

export interface MediaResult {
  url: string;
  blob: Blob;
  filename: string;
  seconds: number;
}

export interface FFmpegJob {
  /** Name the input will have inside FFmpeg's FS, e.g. "input.mp4". */
  args: (input: string) => string[];
  output: string;
  mime: string;
  filename: string;
  /** Extra files to write before running (e.g. a concat list). */
  extraInputs?: { name: string; data: File | Uint8Array | string }[];
}

export interface ProcessContext {
  /** Name of the source file inside FFmpeg's virtual FS. */
  input: string;
  exec: (args: string[]) => Promise<void>;
  /** Runs a command and returns all log lines (for silencedetect, volumedetect, loudnorm JSON…). */
  capture: (args: string[]) => Promise<string[]>;
  write: (name: string, data: File | Uint8Array | string) => Promise<void>;
  read: (name: string, mime: string) => Promise<Blob>;
  list: () => Promise<string[]>;
  /** Mark a file for cleanup (e.g. segment outputs). */
  track: (name: string) => void;
  setProgress: (pct: number) => void;
}

export function useMediaFile(kind: MediaKind, onLoaded?: (info: MediaInfo, file: File) => void, { preloadEngine = true }: { preloadEngine?: boolean } = {}) {
  const engine = useFFmpeg({ lazy: true });
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [outputs, setOutputs] = useState<MediaResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const urls = useRef<{ src: string | null; outs: string[] }>({ src: null, outs: [] });

  useEffect(
    () => () => {
      if (urls.current.src) URL.revokeObjectURL(urls.current.src);
      urls.current.outs.forEach((u) => URL.revokeObjectURL(u));
    },
    []
  );

  const clearResult = useCallback(() => {
    urls.current.outs.forEach((u) => URL.revokeObjectURL(u));
    urls.current.outs = [];
    setOutputs([]);
  }, []);

  const load = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      const okType = f.type.startsWith(`${kind}/`) || (kind === "video" && /\.(mkv|mov|avi|wmv|flv|m4v|3gp|gif)$/i.test(f.name)) || (kind === "audio" && /\.(flac|opus|m4a|aac|wma|aiff?)$/i.test(f.name));
      if (!okType) return setError(`Please choose ${kind === "video" ? "a video" : "an audio"} file.`);
      setError(null);
      clearResult();
      // Start fetching the engine now, in parallel with reading metadata.
      if (preloadEngine) engine.load().catch(() => {});
      const u = URL.createObjectURL(f);
      if (urls.current.src) URL.revokeObjectURL(urls.current.src);
      urls.current.src = u;
      setFile(f);
      setUrl(u);
      try {
        const i = await probe(u, kind);
        setInfo(i);
        onLoaded?.(i, f);
      } catch {
        // Some containers (e.g. MKV in Safari) can't be previewed but FFmpeg can still process them.
        setInfo({ duration: NaN, width: 0, height: 0 });
        onLoaded?.({ duration: NaN, width: 0, height: 0 }, f);
      }
    },
    [kind, clearResult, engine, onLoaded, preloadEngine]
  );

  const clear = useCallback(() => {
    clearResult();
    if (urls.current.src) URL.revokeObjectURL(urls.current.src);
    urls.current.src = null;
    setFile(null);
    setUrl(null);
    setInfo(null);
    setError(null);
  }, [clearResult]);

  /**
   * Runs an arbitrary multi-step job against the current file. The context
   * gives exec (throws on non-zero exit), log capture, and file IO; any files
   * written or read are cleaned up afterwards. Return one or more outputs.
   */
  const process = useCallback(
    async (job: (ctx: ProcessContext) => Promise<{ blob: Blob; filename: string }[] | void>) => {
      if (!file) return;
      setBusy(true);
      setError(null);
      setProgress(0);
      clearResult();
      const started = performance.now();
      const input = `input.${extOf(file.name, kind === "video" ? "mp4" : "mp3")}`;
      const touched = new Set<string>();
      let ff: Awaited<ReturnType<typeof engine.load>> | null = null;
      try {
        ff = await engine.load();
        const f = ff;
        await f.writeFile(input, await engine.fetchFile(file));
        touched.add(input);
        engine.setOnProgress(setProgress);
        const ctx: ProcessContext = {
          input,
          exec: async (args) => {
            const code = await f.exec(args);
            if (code !== 0) throw new Error(`FFmpeg exited with code ${code}.\n${ffmpegLogTail()}`);
          },
          capture: async (args) => {
            // Analysis commands (-f null) may exit non-zero harmlessly; callers parse the log.
            startLogCapture();
            await f.exec(args).catch(() => {});
            return stopLogCapture();
          },
          write: async (name, data) => {
            await f.writeFile(name, typeof data === "string" ? new TextEncoder().encode(data) : data instanceof File ? await engine.fetchFile(data) : data);
            touched.add(name);
          },
          read: async (name, mime) => {
            touched.add(name);
            const d = (await f.readFile(name)) as Uint8Array;
            return new Blob([d.slice()], { type: mime });
          },
          list: async () => ((await f.listDir("/")) as { name: string; isDir: boolean }[]).filter((e) => !e.isDir).map((e) => e.name),
          track: (name) => touched.add(name),
          setProgress,
        };
        const outs = (await job(ctx)) ?? [];
        if (!outs.length || outs.some((o) => !o.blob.size)) throw new Error(`The output was empty.\n${ffmpegLogTail()}`);
        const seconds = (performance.now() - started) / 1000;
        const results = outs.map((o) => ({ ...o, url: URL.createObjectURL(o.blob), seconds }));
        urls.current.outs = results.map((r) => r.url);
        setOutputs(results);
        setProgress(100);
      } catch (e) {
        const msg = (e as Error)?.message || "Processing failed.";
        const oom = /memory|OOM|abort/i.test(msg);
        setError(oom ? "Ran out of memory processing this file in the browser. Try a shorter file." : msg);
        if (oom) engine.resetFFmpeg().catch(() => {});
      } finally {
        stopLogCapture();
        engine.setOnProgress(null);
        setBusy(false);
        if (ff) for (const n of touched) await ff.deleteFile(n).catch(() => {});
      }
    },
    [file, kind, engine, clearResult]
  );

  /** Single-command convenience wrapper around process(). */
  const run = useCallback(
    (job: FFmpegJob) =>
      process(async (ctx) => {
        for (const x of job.extraInputs ?? []) await ctx.write(x.name, x.data);
        await ctx.exec(job.args(ctx.input));
        return [{ blob: await ctx.read(job.output, job.mime), filename: job.filename }];
      }),
    [process]
  );

  const result = outputs[0] ?? null;
  return { kind, file, url, info, result, outputs, error, busy, progress, engine, setError, load, clear, clearResult, run, process };
}

export type MediaFileState = ReturnType<typeof useMediaFile>;

export function downloadMedia(r: MediaResult) {
  const a = document.createElement("a");
  a.href = r.url;
  a.download = r.filename;
  a.click();
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

interface MediaToolProps {
  media: MediaFileState;
  options: ReactNode;
  action: { label: ReactNode; busyLabel?: ReactNode; icon?: ReactNode; onClick: () => void; disabled?: boolean };
  /** Replace the source preview (e.g. a crop overlay). */
  preview?: ReactNode;
  /** Replace the result preview (e.g. an image or audio for extract tools). */
  resultPreview?: (r: MediaResult) => ReactNode;
  children?: ReactNode;
  accept?: string;
  dropHint?: ReactNode;
  videoRef?: React.Ref<HTMLVideoElement>;
  /** For audio: ref to the <audio> element (for "set start here" etc.). */
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  /** For audio: highlight this range on the waveform. */
  range?: { start: number; end: number };
}

export function MediaTool({ media, options, action, preview, resultPreview, children, accept, dropHint, videoRef, audioRef, range }: MediaToolProps) {
  const { kind, file, url, info, result, outputs, error, busy, progress, engine, load, clear } = media;
  const Icon = kind === "video" ? Film : Music;

  if (!file || !url) {
    return (
      <div className="space-y-3">
        <FileDropzone
          onFiles={load}
          accept={accept ?? `${kind}/*`}
          icon={<Icon className="w-5 h-5" />}
          title={`Drop ${kind === "video" ? "a video" : "an audio file"} here or click to browse`}
          hint={dropHint ?? (kind === "video" ? "MP4, MOV, WebM, MKV, AVI… processed on your device." : "MP3, WAV, M4A, FLAC, OGG… processed on your device.")}
          className="min-h-72"
        />
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
      </div>
    );
  }

  const engineNote =
    engine.status === "loading" ? (
      <StatusBadge tone="info">
        <RefreshCw className="w-3 h-3 animate-spin" /> Loading engine (first time ≈30 MB)
      </StatusBadge>
    ) : engine.status === "error" ? (
      <StatusBadge tone="error">Engine failed to load</StatusBadge>
    ) : (
      <PrivacyNote>Processed locally.</PrivacyNote>
    );

  const optionsPanel = (
    <ToolPanel
      title="Options"
      bodyClassName="p-3.5 space-y-4"
      footer={
        <div className="w-full space-y-2">
          <Button size="lg" onClick={action.onClick} disabled={busy || action.disabled} className="w-full">
            {busy ? <RefreshCw className="animate-spin" /> : action.icon}
            {busy ? (progress > 0 ? `${action.busyLabel ?? "Processing…"} ${progress}%` : engine.status === "loading" ? "Loading engine…" : action.busyLabel ?? "Processing…") : action.label}
          </Button>
          {busy && (
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${Math.max(3, progress)}%` }} />
            </div>
          )}
          {engineNote}
        </div>
      }
    >
      {options}
    </ToolPanel>
  );

  const meta = [
    info && Number.isFinite(info.duration) ? formatDuration(info.duration) : null,
    info?.width ? `${info.width} × ${info.height}` : null,
    formatBytes(file.size),
  ].filter(Boolean);

  return (
    <OptionsLayout options={optionsPanel}>
      <ToolPanel
        title={<span className="normal-case tracking-normal font-medium text-foreground truncate">{file.name}</span>}
        actions={
          <>
            <StatusBadge>{meta.join(" · ")}</StatusBadge>
            <label className="inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
              Replace
              <input type="file" accept={accept ?? `${kind}/*`} className="hidden" onChange={(e) => { if (e.target.files) load(Array.from(e.target.files)); e.target.value = ""; }} />
            </label>
            <Button variant="ghost" size="sm" onClick={clear} disabled={busy} className="text-muted-foreground hover:text-destructive">
              Remove
            </Button>
          </>
        }
      >
        {preview ??
          (kind === "video" ? (
            <video ref={videoRef} src={url} controls playsInline className="w-full max-h-[60vh] bg-stone-950" />
          ) : (
            <AudioPlayer url={url} audioRef={audioRef} range={range} />
          ))}
      </ToolPanel>

      {children}

      {outputs.length > 1 && <OutputList outputs={outputs} baseName={stem(file)} />}

      {result && outputs.length === 1 && (
        <ToolPanel
          title="Result"
          actions={
            <>
              <StatusBadge>{formatBytes(result.blob.size)}</StatusBadge>
              <StatusBadge tone={result.blob.size < file.size ? "success" : "neutral"}>
                {result.blob.size < file.size ? `${Math.round((1 - result.blob.size / file.size) * 100)}% smaller` : `${Math.round((result.blob.size / file.size - 1) * 100)}% larger`}
              </StatusBadge>
            </>
          }
          footer={
            <>
              <span className="text-xs text-muted-foreground">Done in {result.seconds.toFixed(1)}s</span>
              <span className="flex-1" />
              <Button variant="outline" onClick={() => downloadMedia(result)}>
                <Download /> Download {extOf(result.filename).toUpperCase()}
              </Button>
            </>
          }
        >
          {resultPreview ? (
            resultPreview(result)
          ) : result.blob.type.startsWith("video/") ? (
            <video src={result.url} controls playsInline className="w-full max-h-[50vh] bg-stone-950" />
          ) : result.blob.type.startsWith("audio/") ? (
            <div className="p-4">
              <audio src={result.url} controls className="w-full" />
            </div>
          ) : (
            <div className="p-4 flex justify-center bg-dots">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt="Result" className="max-h-[50vh] max-w-full" />
            </div>
          )}
        </ToolPanel>
      )}

      {error && (
        <ToolAlert tone="error" title="Processing failed">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{error}</pre>
        </ToolAlert>
      )}
    </OptionsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                           */
/* ------------------------------------------------------------------ */

function TimeInput({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <label className="flex-1 space-y-1.5">
      <span className="block text-xs font-medium">{label}</span>
      <Input
        value={text ?? formatDuration(value, true)}
        onFocus={() => setText(formatDuration(value, true))}
        onChange={(e) => {
          setText(e.target.value);
          const s = parseDuration(e.target.value);
          if (Number.isFinite(s)) onChange(Math.min(max, s));
        }}
        onBlur={() => setText(null)}
        className="font-mono tabular-nums"
        aria-label={label}
      />
    </label>
  );
}

/** Start/end range with dual slider, editable timestamps and "set from player". */
export function TimeRange({
  duration,
  start,
  end,
  onChange,
  getCurrentTime,
}: {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  /** Returns the player's current time, enabling "Set start/end here" buttons. */
  getCurrentTime?: () => number | undefined;
}) {
  const max = Number.isFinite(duration) && duration > 0 ? duration : Math.max(end, 60);
  const setStart = (s: number) => onChange(Math.min(s, end - 0.1), end);
  const setEnd = (e: number) => onChange(start, Math.max(e, start + 0.1));
  return (
    <div className="space-y-3">
      <Slider min={0} max={max} step={0.1} value={[start, end]} onValueChange={([a, b]) => onChange(a, b)} minStepsBetweenThumbs={1} />
      <div className="flex items-end gap-2">
        <TimeInput label="Start" value={start} onChange={setStart} max={max} />
        <TimeInput label="End" value={end} onChange={setEnd} max={max} />
      </div>
      {getCurrentTime && (
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => { const t = getCurrentTime(); if (t !== undefined) setStart(t); }}>
            Set start here
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => { const t = getCurrentTime(); if (t !== undefined) setEnd(t); }}>
            Set end here
          </Button>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground tabular-nums">
        Selection: <span className="text-foreground font-medium">{formatDuration(end - start, true)}</span> of {formatDuration(max)}
      </p>
    </div>
  );
}

/** List of multiple outputs (segments, chapters) with per-file and ZIP download. */
function OutputList({ outputs, baseName }: { outputs: MediaResult[]; baseName: string }) {
  const [zipping, setZipping] = useState(false);
  const total = outputs.reduce((n, o) => n + o.blob.size, 0);
  const zipAll = async () => {
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      outputs.forEach((o) => zip.file(o.filename, o.blob));
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${baseName}-parts.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setZipping(false);
    }
  };
  return (
    <ToolPanel
      title={`${outputs.length} files`}
      actions={
        <>
          <StatusBadge>{formatBytes(total)}</StatusBadge>
          <Button variant="outline" size="sm" onClick={zipAll} disabled={zipping}>
            {zipping ? <RefreshCw className="animate-spin" /> : <Download />} Download all (.zip)
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-border max-h-[480px] overflow-y-auto custom-scrollbar">
        {outputs.map((o, i) => (
          <li key={o.url} className="flex items-center gap-3 px-3 py-2">
            <span className="w-6 text-[11px] text-muted-foreground tabular-nums text-right">{i + 1}</span>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[13px] font-medium truncate">{o.filename}</p>
              {o.blob.type.startsWith("audio/") && <audio src={o.url} controls preload="none" className="w-full h-8" />}
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">{formatBytes(o.blob.size)}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => downloadMedia(o)} aria-label={`Download ${o.filename}`}>
              <Download />
            </Button>
          </li>
        ))}
      </ul>
    </ToolPanel>
  );
}

/** <audio> with a clickable waveform, playhead and optional range highlight. */
export function AudioPlayer({ url, audioRef, range }: { url: string; audioRef?: React.RefObject<HTMLAudioElement | null>; range?: { start: number; end: number } }) {
  const localRef = useRef<HTMLAudioElement>(null);
  const ref = audioRef ?? localRef;
  const [time, setTime] = useState(0);
  return (
    <div className="p-3 space-y-2">
      <Waveform
        url={url}
        start={range?.start}
        end={range?.end}
        currentTime={time}
        onSeek={(t) => {
          if (ref.current) {
            ref.current.currentTime = t;
            setTime(t);
          }
        }}
      />
      <audio ref={ref} src={url} controls className="w-full" onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} />
    </div>
  );
}

/** Output format picker for audio tools. */
export function AudioFormatField({ value, onChange, label = "Output format", formats }: { value: AudioFormat; onChange: (f: AudioFormat) => void; label?: string; formats?: AudioFormat[] }) {
  const keys = formats ?? (Object.keys(AUDIO_FORMATS) as AudioFormat[]);
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium">{label}</span>
      <div role="radiogroup" className="inline-flex flex-wrap items-center rounded-md border border-border bg-background p-0.5">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={value === k}
            onClick={() => onChange(k)}
            className={"inline-flex items-center h-6 px-2 rounded-sm text-[11px] font-medium transition-colors " + (value === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
          >
            {AUDIO_FORMATS[k].label}
          </button>
        ))}
      </div>
    </div>
  );
}
