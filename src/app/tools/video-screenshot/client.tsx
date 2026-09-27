"use client";

import { useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Field, FileDropzone, FormatQuality, OptionsLayout, StatusBadge, ToolAlert, ToolPanel, formatBytes, formatDuration, stem, useMediaFile, type ImageMime } from "@/components/tool";

interface Shot {
  id: number;
  time: number;
  url: string;
  blob: Blob;
}

let nextId = 1;
const extFor = (m: ImageMime) => (m === "image/jpeg" ? "jpg" : m.split("/")[1]);

export default function VideoScreenshot() {
  const [format, setFormat] = useState<ImageMime>("image/png");
  const [quality, setQuality] = useState(0.92);
  const [shots, setShots] = useState<Shot[]>([]);
  const [fps, setFps] = useState(30);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Frames are grabbed straight from the <video> element — no FFmpeg download needed.
  const media = useMediaFile("video", undefined, { preloadEngine: false });

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return media.setError("Your browser can't decode this video for preview. Try converting it to MP4 first.");
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    if (format === "image/jpeg") {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.drawImage(v, 0, 0);
    const time = v.currentTime;
    c.toBlob((b) => b && setShots((s) => [{ id: nextId++, time, url: URL.createObjectURL(b), blob: b }, ...s]), format, quality);
  };

  const step = (dir: -1 | 1) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.max(0, Math.min(v.duration || Infinity, v.currentTime + dir / fps));
  };

  const download = (s: Shot) => {
    const a = document.createElement("a");
    a.href = s.url;
    a.download = `${stem(media.file)}-${formatDuration(s.time, true).replace(/[:.]/g, "-")}.${extFor(format)}`;
    a.click();
  };

  const removeShot = (id: number) =>
    setShots((s) => {
      const hit = s.find((x) => x.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return s.filter((x) => x.id !== id);
    });

  if (!media.file || !media.url) {
    return (
      <ToolLayout toolId="video-screenshot">
        <div className="space-y-3">
          <FileDropzone onFiles={media.load} accept="video/*" icon={<Camera className="w-5 h-5" />} title="Drop a video here or click to browse" hint="Capture full-resolution frames as PNG, JPEG or WebP." className="min-h-72" />
          {media.error && <ToolAlert tone="error">{media.error}</ToolAlert>}
        </div>
      </ToolLayout>
    );
  }

  const options = (
    <ToolPanel
      title="Capture"
      bodyClassName="p-3.5 space-y-4"
      footer={
        <Button size="lg" onClick={capture} className="w-full">
          <Camera /> Capture frame
        </Button>
      }
    >
      <FormatQuality format={format} onFormat={setFormat} quality={quality} onQuality={setQuality} />
      <Field label="Frame step" hint="Used by the ‹ › buttons.">
        <div className="flex gap-1">
          {[24, 30, 60].map((f) => (
            <button key={f} type="button" onClick={() => setFps(f)} className={"h-7 px-2.5 rounded-md border text-xs " + (fps === f ? "border-primary bg-accent" : "border-border text-muted-foreground")}>
              1/{f}s
            </button>
          ))}
        </div>
      </Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="video-screenshot">
      <OptionsLayout options={options}>
        <ToolPanel
          title={<span className="normal-case tracking-normal font-medium text-foreground truncate">{media.file.name}</span>}
          actions={
            <>
              {media.info?.width ? <StatusBadge>{media.info.width} × {media.info.height}</StatusBadge> : null}
              <Button variant="ghost" size="sm" onClick={media.clear} className="text-muted-foreground hover:text-destructive">
                Remove
              </Button>
            </>
          }
          footer={
            <>
              <Button variant="outline" size="icon-sm" onClick={() => step(-1)} aria-label="Previous frame">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => step(1)} aria-label="Next frame">
                <ChevronRight />
              </Button>
              <span className="text-xs text-muted-foreground">Pause on the frame you want, then capture.</span>
            </>
          }
        >
          <video ref={videoRef} src={media.url} controls playsInline className="w-full max-h-[60vh] bg-stone-950" />
        </ToolPanel>

        {shots.length > 0 && (
          <ToolPanel title={`Captures · ${shots.length}`} bodyClassName="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
            {shots.map((s) => (
              <figure key={s.id} className="group rounded-md border border-border overflow-hidden bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={`Frame at ${formatDuration(s.time, true)}`} className="w-full aspect-video object-contain bg-stone-950" />
                <figcaption className="flex items-center gap-1 px-2 h-9 text-xs">
                  <span className="font-mono tabular-nums">{formatDuration(s.time, true)}</span>
                  <span className="text-muted-foreground">· {formatBytes(s.blob.size)}</span>
                  <span className="flex-1" />
                  <Button variant="ghost" size="icon-sm" onClick={() => download(s)} aria-label="Download">
                    <Download />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeShot(s.id)} aria-label="Delete" className="text-muted-foreground hover:text-destructive">
                    <Trash2 />
                  </Button>
                </figcaption>
              </figure>
            ))}
          </ToolPanel>
        )}
        {media.error && <ToolAlert tone="error">{media.error}</ToolAlert>}
      </OptionsLayout>
    </ToolLayout>
  );
}
