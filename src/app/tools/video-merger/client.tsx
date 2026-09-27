"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Film, GitMerge, RefreshCw, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useFFmpeg, ffmpegLogTail } from "@/hooks/use-ffmpeg";
import {
  FASTSTART,
  Field,
  FileDropzone,
  FileList,
  FileListItem,
  OptionsLayout,
  PrivacyNote,
  Segmented,
  StatusBadge,
  ToolAlert,
  ToolPanel,
  extOf,
  formatBytes,
  formatDuration,
  h264,
} from "@/components/tool";

interface Clip {
  id: string;
  file: File;
  duration: number;
  width: number;
  height: number;
}

type Mode = "reencode" | "copy";
type Size = "first" | "1080" | "720";

const makeId = () => Math.random().toString(36).slice(2, 9);
const even = (n: number) => Math.round(n / 2) * 2;

function probe(file: File): Promise<Omit<Clip, "id" | "file">> {
  return new Promise((res) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      res({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      res({ duration: NaN, width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
}

export default function VideoMerger() {
  const engine = useFFmpeg({ lazy: true });
  const [clips, setClips] = useState<Clip[]>([]);
  const [mode, setMode] = useState<Mode>("reencode");
  const [size, setSize] = useState<Size>("first");
  const [audio, setAudio] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  const resultRef = useRef<string | null>(null);
  useEffect(() => () => { if (resultRef.current) URL.revokeObjectURL(resultRef.current); }, []);

  const add = async (files: File[]) => {
    const vids = files.filter((f) => f.type.startsWith("video/") || /\.(mkv|mov|avi|m4v)$/i.test(f.name));
    if (!vids.length) return setError("Please choose video files.");
    setError(null);
    engine.load().catch(() => {});
    const probed = await Promise.all(vids.map(async (file) => ({ id: makeId(), file, ...(await probe(file)) })));
    setClips((c) => [...c, ...probed]);
  };

  const move = (i: number, d: -1 | 1) =>
    setClips((c) => {
      const j = i + d;
      if (j < 0 || j >= c.length) return c;
      const n = [...c];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const first = clips[0];
  const target =
    size === "first" && first?.width ? { w: even(first.width), h: even(first.height) } : size === "720" ? { w: 1280, h: 720 } : { w: 1920, h: 1080 };
  const mixed = new Set(clips.map((c) => `${c.width}x${c.height}`)).size > 1;
  const total = clips.reduce((s, c) => s + (Number.isFinite(c.duration) ? c.duration : 0), 0);

  const merge = async () => {
    if (clips.length < 2) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    if (resultRef.current) URL.revokeObjectURL(resultRef.current);
    setResult(null);
    const names = clips.map((c, i) => `in${i}.${extOf(c.file.name)}`);
    const written: string[] = [];
    let ff: Awaited<ReturnType<typeof engine.load>> | null = null;
    try {
      ff = await engine.load();
      for (let i = 0; i < clips.length; i++) {
        await ff.writeFile(names[i], await engine.fetchFile(clips[i].file));
        written.push(names[i]);
      }
      engine.setOnProgress(setProgress);
      let args: string[];
      if (mode === "copy") {
        // Concat demuxer: lossless, instant — requires identical codecs/resolution.
        await ff.writeFile("list.txt", new TextEncoder().encode(names.map((n) => `file '${n}'`).join("\n")));
        written.push("list.txt");
        args = ["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", ...FASTSTART, "merged.mp4"];
      } else {
        // Normalise every clip to the same canvas, SAR and frame rate so the concat filter accepts them.
        const { w, h } = target;
        const norm = clips
          .map((_, i) => `[${i}:v:0]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}]` + (audio ? `;[${i}:a:0]aresample=48000,aformat=channel_layouts=stereo[a${i}]` : ""))
          .join(";");
        const inputs = clips.map((_, i) => (audio ? `[v${i}][a${i}]` : `[v${i}]`)).join("");
        const graph = `${norm};${inputs}concat=n=${clips.length}:v=1:a=${audio ? 1 : 0}[v]${audio ? "[a]" : ""}`;
        args = [...names.flatMap((n) => ["-i", n]), "-filter_complex", graph, "-map", "[v]", ...(audio ? ["-map", "[a]", "-c:a", "aac", "-b:a", "160k"] : []), ...h264(22), ...FASTSTART, "merged.mp4"];
      }
      const code = await ff.exec(args);
      if (code !== 0) {
        const log = ffmpegLogTail(8);
        throw new Error(
          /matches no streams|Stream specifier ':a/.test(log)
            ? "One of the clips has no audio track. Turn off “Include audio” and try again."
            : mode === "copy"
              ? `Fast join failed — the clips probably differ in codec or resolution. Use “Re-encode”.\n${log}`
              : `FFmpeg exited with code ${code}.\n${log}`
        );
      }
      const data = (await ff.readFile("merged.mp4")) as Uint8Array;
      written.push("merged.mp4");
      const blob = new Blob([data.slice()], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      resultRef.current = url;
      setResult({ url, blob });
    } catch (e) {
      setError((e as Error).message || "Merging failed.");
    } finally {
      engine.setOnProgress(null);
      setBusy(false);
      if (ff) for (const n of written) await ff.deleteFile(n).catch(() => {});
    }
  };

  if (!clips.length) {
    return (
      <ToolLayout toolId="video-merger">
        <div className="space-y-3">
          <FileDropzone onFiles={add} accept="video/*" multiple icon={<Film className="w-5 h-5" />} title="Drop two or more videos" hint="They'll be joined in the order you arrange them." className="min-h-72" />
          {error && <ToolAlert tone="error">{error}</ToolAlert>}
        </div>
      </ToolLayout>
    );
  }

  const options = (
    <ToolPanel
      title="Options"
      bodyClassName="p-3.5 space-y-4"
      footer={
        <div className="w-full space-y-2">
          <Button size="lg" onClick={merge} disabled={busy || clips.length < 2} className="w-full">
            {busy ? <RefreshCw className="animate-spin" /> : <GitMerge />}
            {busy ? (progress ? `Merging ${progress}%` : engine.loading ? "Loading engine…" : "Merging…") : `Merge ${clips.length} clips`}
          </Button>
          {busy && (
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.max(3, progress)}%` }} />
            </div>
          )}
          {engine.loading ? <StatusBadge tone="info"><RefreshCw className="w-3 h-3 animate-spin" /> Loading engine (first time ≈30 MB)</StatusBadge> : <PrivacyNote>Processed locally.</PrivacyNote>}
        </div>
      }
    >
      <Field label="Method" hint={mode === "copy" ? "Lossless and instant, but only works when all clips share codec and resolution (e.g. same camera)." : "Works with any mix of clips; re-encodes to H.264 MP4."}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "reencode", label: "Re-encode" },
            { value: "copy", label: "Fast join" },
          ]}
        />
      </Field>
      {mode === "reencode" && (
        <>
          <Field label="Output size" hint="Clips with a different shape are letterboxed, not stretched.">
            <Segmented
              size="sm"
              value={size}
              onChange={setSize}
              options={[
                { value: "first", label: first?.width ? `Like clip 1 (${first.width}×${first.height})` : "Like clip 1" },
                { value: "1080", label: "1080p" },
                { value: "720", label: "720p" },
              ]}
            />
          </Field>
          <Field label="Include audio" hint="Turn off if any clip is silent / has no audio track." inline>
            <Switch checked={audio} onCheckedChange={setAudio} />
          </Field>
        </>
      )}
      {mode === "copy" && mixed && <ToolAlert tone="warning">These clips have different resolutions — fast join will likely fail.</ToolAlert>}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="video-merger">
      <OptionsLayout options={options}>
        <ToolPanel
          title={`${clips.length} clips · ${formatDuration(total)}`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setClips([])} disabled={busy} className="text-muted-foreground hover:text-destructive">
              <Trash2 /> Clear
            </Button>
          }
        >
          <FileList className="border-0 rounded-none">
            {clips.map((c, i) => (
              <FileListItem
                key={c.id}
                index={i}
                name={c.file.name}
                meta={[Number.isFinite(c.duration) ? formatDuration(c.duration) : null, c.width ? `${c.width}×${c.height}` : null, formatBytes(c.file.size)].filter(Boolean).join(" · ")}
                icon={<Film className="w-4 h-4" />}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                canMoveUp={i > 0}
                canMoveDown={i < clips.length - 1}
                onRemove={() => setClips((x) => x.filter((y) => y.id !== c.id))}
              />
            ))}
          </FileList>
          <div className="p-2 border-t border-border">
            <FileDropzone onFiles={add} accept="video/*" multiple size="sm" title="Add more clips" />
          </div>
        </ToolPanel>

        {result && (
          <ToolPanel
            title="Merged"
            actions={<StatusBadge>{formatBytes(result.blob.size)}</StatusBadge>}
            footer={
              <>
                <span className="flex-1" />
                <Button variant="outline" onClick={() => { const a = document.createElement("a"); a.href = result.url; a.download = "merged.mp4"; a.click(); }}>
                  <Download /> Download MP4
                </Button>
              </>
            }
          >
            <video src={result.url} controls playsInline className="w-full max-h-[50vh] bg-stone-950" />
          </ToolPanel>
        )}
        {error && (
          <ToolAlert tone="error" title="Merge failed">
            <pre className="whitespace-pre-wrap font-mono text-[11px]">{error}</pre>
          </ToolAlert>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
