"use client";

import { useEffect, useRef, useState } from "react";
import { Download, GitMerge, Music, RefreshCw, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { useFFmpeg, ffmpegLogTail } from "@/hooks/use-ffmpeg";
import {
  AUDIO_FORMATS,
  AudioFormatField,
  Field,
  FileDropzone,
  FileList,
  FileListItem,
  OptionsLayout,
  PrivacyNote,
  Segmented,
  SliderField,
  StatusBadge,
  ToolAlert,
  ToolPanel,
  extOf,
  formatBytes,
  formatDuration,
  type AudioFormat,
} from "@/components/tool";

interface Track {
  id: string;
  file: File;
  duration: number;
}
type Join = "direct" | "gap" | "crossfade";

const makeId = () => Math.random().toString(36).slice(2, 9);

function probe(file: File): Promise<number> {
  return new Promise((res) => {
    const a = document.createElement("audio");
    const u = URL.createObjectURL(file);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      res(a.duration);
      URL.revokeObjectURL(u);
    };
    a.onerror = () => {
      res(NaN);
      URL.revokeObjectURL(u);
    };
    a.src = u;
  });
}

export default function AudioMerger() {
  const engine = useFFmpeg({ lazy: true });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [format, setFormat] = useState<AudioFormat>("mp3");
  const [join, setJoin] = useState<Join>("direct");
  const [gap, setGap] = useState(1);
  const [xfade, setXfade] = useState(2);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  const urlRef = useRef<string | null>(null);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const add = async (files: File[]) => {
    const ok = files.filter((f) => f.type.startsWith("audio/") || /\.(flac|m4a|opus|aac|wav|ogg|mp3)$/i.test(f.name));
    if (!ok.length) return setError("Please choose audio files.");
    setError(null);
    engine.load().catch(() => {});
    const probed = await Promise.all(ok.map(async (file) => ({ id: makeId(), file, duration: await probe(file) })));
    setTracks((t) => [...t, ...probed]);
  };

  const move = (i: number, d: -1 | 1) =>
    setTracks((t) => {
      const j = i + d;
      if (j < 0 || j >= t.length) return t;
      const n = [...t];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const total = tracks.reduce((s, t) => s + (Number.isFinite(t.duration) ? t.duration : 0), 0) + (join === "gap" ? gap * (tracks.length - 1) : join === "crossfade" ? -xfade * (tracks.length - 1) : 0);

  const merge = async () => {
    if (tracks.length < 2) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    setResult(null);
    const names = tracks.map((t, i) => `in${i}.${extOf(t.file.name, "mp3")}`);
    const written: string[] = [];
    let ff: Awaited<ReturnType<typeof engine.load>> | null = null;
    try {
      ff = await engine.load();
      for (let i = 0; i < tracks.length; i++) {
        await ff.writeFile(names[i], await engine.fetchFile(tracks[i].file));
        written.push(names[i]);
      }
      // Normalise every input to 44.1 kHz stereo so concat/acrossfade accept them.
      const norm = tracks.map((_, i) => `[${i}:a:0]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`);
      let graph: string;
      if (join === "crossfade") {
        const steps: string[] = [];
        let prev = "a0";
        for (let i = 1; i < tracks.length; i++) {
          const out = i === tracks.length - 1 ? "out" : `x${i}`;
          steps.push(`[${prev}][a${i}]acrossfade=d=${xfade}:c1=qsin:c2=qsin[${out}]`);
          prev = out;
        }
        graph = [...norm, ...steps].join(";");
      } else if (join === "gap") {
        const sil = tracks.slice(1).map((_, i) => `anullsrc=r=44100:cl=stereo,atrim=duration=${gap}[s${i}]`);
        const seq = tracks.map((_, i) => (i ? `[s${i - 1}][a${i}]` : "[a0]")).join("");
        graph = [...norm, ...sil, `${seq}concat=n=${tracks.length * 2 - 1}:v=0:a=1[out]`].join(";");
      } else {
        graph = [...norm, `${tracks.map((_, i) => `[a${i}]`).join("")}concat=n=${tracks.length}:v=0:a=1[out]`].join(";");
      }
      const f = AUDIO_FORMATS[format];
      const out = `merged.${format}`;
      engine.setOnProgress(setProgress);
      const code = await ff.exec([...names.flatMap((n) => ["-i", n]), "-filter_complex", graph, "-map", "[out]", ...f.args(192), out]);
      if (code !== 0) throw new Error(`FFmpeg exited with code ${code}.\n${ffmpegLogTail(6)}`);
      const data = (await ff.readFile(out)) as Uint8Array;
      written.push(out);
      const blob = new Blob([data.slice()], { type: f.mime });
      urlRef.current = URL.createObjectURL(blob);
      setResult({ url: urlRef.current, blob });
    } catch (e) {
      setError((e as Error).message || "Merging failed.");
    } finally {
      engine.setOnProgress(null);
      setBusy(false);
      if (ff) for (const n of written) await ff.deleteFile(n).catch(() => {});
    }
  };

  if (!tracks.length) {
    return (
      <ToolLayout toolId="audio-merger">
        <div className="space-y-3">
          <FileDropzone onFiles={add} accept="audio/*" multiple icon={<Music className="w-5 h-5" />} title="Drop two or more audio files" hint="Any mix of MP3, WAV, M4A, FLAC, OGG — joined in the order you arrange." className="min-h-72" />
          {error && <ToolAlert tone="error">{error}</ToolAlert>}
        </div>
      </ToolLayout>
    );
  }

  const shortest = Math.min(...tracks.map((t) => t.duration).filter(Number.isFinite));

  const options = (
    <ToolPanel
      title="Options"
      bodyClassName="p-3.5 space-y-4"
      footer={
        <div className="w-full space-y-2">
          <Button size="lg" onClick={merge} disabled={busy || tracks.length < 2} className="w-full">
            {busy ? <RefreshCw className="animate-spin" /> : <GitMerge />}
            {busy ? (progress ? `Merging ${progress}%` : engine.loading ? "Loading engine…" : "Merging…") : `Merge ${tracks.length} files`}
          </Button>
          {engine.loading ? <StatusBadge tone="info"><RefreshCw className="w-3 h-3 animate-spin" /> Loading engine (first time ≈30 MB)</StatusBadge> : <PrivacyNote>Processed locally.</PrivacyNote>}
        </div>
      }
    >
      <Field label="Between tracks">
        <Segmented
          value={join}
          onChange={setJoin}
          options={[
            { value: "direct", label: "Back to back" },
            { value: "gap", label: "Silence" },
            { value: "crossfade", label: "Crossfade" },
          ]}
        />
      </Field>
      {join === "gap" && <SliderField label="Gap" value={gap} onChange={setGap} min={0.5} max={10} step={0.5} format={(v) => `${v}s`} />}
      {join === "crossfade" && <SliderField label="Crossfade" value={xfade} onChange={setXfade} min={0.5} max={Math.max(0.5, Math.min(10, (shortest || 20) / 2))} step={0.5} format={(v) => `${v}s`} />}
      <AudioFormatField value={format} onChange={setFormat} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="audio-merger">
      <OptionsLayout options={options}>
        <ToolPanel
          title={`${tracks.length} tracks · ${formatDuration(Math.max(0, total))}`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setTracks([])} disabled={busy} className="text-muted-foreground hover:text-destructive">
              <Trash2 /> Clear
            </Button>
          }
        >
          <FileList className="border-0 rounded-none">
            {tracks.map((t, i) => (
              <FileListItem
                key={t.id}
                index={i}
                name={t.file.name}
                meta={[Number.isFinite(t.duration) ? formatDuration(t.duration) : null, formatBytes(t.file.size)].filter(Boolean).join(" · ")}
                icon={<Music className="w-4 h-4" />}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                canMoveUp={i > 0}
                canMoveDown={i < tracks.length - 1}
                onRemove={() => setTracks((x) => x.filter((y) => y.id !== t.id))}
              />
            ))}
          </FileList>
          <div className="p-2 border-t border-border">
            <FileDropzone onFiles={add} accept="audio/*" multiple size="sm" title="Add more tracks" />
          </div>
        </ToolPanel>

        {result && (
          <ToolPanel
            title="Merged"
            actions={<StatusBadge>{formatBytes(result.blob.size)}</StatusBadge>}
            footer={
              <>
                <span className="flex-1" />
                <Button variant="outline" onClick={() => { const a = document.createElement("a"); a.href = result.url; a.download = `merged.${format}`; a.click(); }}>
                  <Download /> Download {AUDIO_FORMATS[format].label}
                </Button>
              </>
            }
          >
            <div className="p-4">
              <audio src={result.url} controls className="w-full" />
            </div>
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
