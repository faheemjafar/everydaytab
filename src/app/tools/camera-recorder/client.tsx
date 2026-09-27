"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Circle, Download, Monitor, Power, Square, Video } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, OptionsLayout, PrivacyNote, Segmented, StatusBadge, ToolAlert, ToolPanel, formatBytes } from "@/components/tool";

type Mode = "camera" | "screen";

const MIME_CANDIDATES = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
const pickMime = () => (typeof MediaRecorder === "undefined" ? "" : MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "");
const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function CameraRecorder() {
  const [mode, setMode] = useState<Mode>("camera");
  const [audio, setAudio] = useState(true);
  const [mirror, setMirror] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState<{ url: string; blob: Blob } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const liveRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop all tracks when leaving the page so the camera light turns off.
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  useEffect(() => {
    if (liveRef.current) liveRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (!recording) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => clearInterval(t);
  }, [recording]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  };

  const startStream = async () => {
    setError(null);
    try {
      const s =
        mode === "camera"
          ? await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio })
          : await navigator.mediaDevices.getDisplayMedia({ video: true, audio });
      // If the user stops screen sharing from the browser UI, reflect it.
      s.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recRef.current?.state === "recording") recRef.current.stop();
        stopStream();
      });
      streamRef.current = s;
      setStream(s);
    } catch (e) {
      const name = (e as DOMException).name;
      setError(name === "NotAllowedError" ? "Permission was denied. Allow access in your browser's site settings and try again." : (e as Error).message || "Couldn't access the device.");
    }
  };

  const startRecording = () => {
    if (!stream) return;
    const mimeType = pickMime();
    chunks.current = [];
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: rec.mimeType || "video/webm" });
      setClip((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { url: URL.createObjectURL(blob), blob };
      });
      setRecording(false);
    };
    rec.start(1000);
    recRef.current = rec;
    setElapsed(0);
    setRecording(true);
  };

  const stopRecording = () => recRef.current?.state === "recording" && recRef.current.stop();

  const snapshot = () => {
    const v = liveRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    if (mode === "camera" && mirror) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    c.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `photo-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  const downloadClip = () => {
    if (!clip) return;
    const ext = clip.blob.type.includes("mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = clip.url;
    a.download = `recording-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
    a.click();
  };

  const options = (
    <ToolPanel title="Source" bodyClassName="p-3 space-y-4" footer={<PrivacyNote>Recorded in your browser; nothing is uploaded.</PrivacyNote>}>
      <Segmented
        value={mode}
        onChange={(m) => { stopStream(); setMode(m); }}
        options={[
          { value: "camera", label: <><Camera className="w-3.5 h-3.5" /> Camera</> },
          { value: "screen", label: <><Monitor className="w-3.5 h-3.5" /> Screen</> },
        ]}
      />
      <Field label="Record audio" inline>
        <Switch checked={audio} onCheckedChange={setAudio} disabled={!!stream} />
      </Field>
      {mode === "camera" && (
        <Field label="Mirror preview" inline>
          <Switch checked={mirror} onCheckedChange={setMirror} />
        </Field>
      )}
      {!stream ? (
        <Button size="lg" onClick={startStream} className="w-full">
          <Power /> Enable {mode === "camera" ? "camera" : "screen share"}
        </Button>
      ) : (
        <div className="space-y-2">
          {!recording ? (
            <Button size="lg" onClick={startRecording} className="w-full">
              <Circle className="fill-current text-red-500" /> Start recording
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={stopRecording} className="w-full">
              <Square className="fill-current" /> Stop · {fmtTime(elapsed)}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={snapshot} className="flex-1" disabled={!stream}>
              <Camera /> Photo
            </Button>
            <Button variant="ghost" onClick={stopStream} disabled={recording} className="flex-1">
              Turn off
            </Button>
          </div>
        </div>
      )}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="camera-recorder">
      <OptionsLayout options={options}>
        <ToolPanel
          title="Live"
          actions={recording ? <StatusBadge tone="error">● REC {fmtTime(elapsed)}</StatusBadge> : stream ? <StatusBadge tone="success">Live</StatusBadge> : null}
        >
          <div className="aspect-video bg-stone-950 flex items-center justify-center">
            {stream ? (
              <video ref={liveRef} autoPlay muted playsInline className="w-full h-full object-contain" style={mode === "camera" && mirror ? { transform: "scaleX(-1)" } : undefined} />
            ) : (
              <div className="text-center text-stone-400 space-y-2">
                <Video className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm">Enable the {mode === "camera" ? "camera" : "screen share"} to start</p>
              </div>
            )}
          </div>
        </ToolPanel>

        {clip && (
          <ToolPanel
            title="Recording"
            actions={<StatusBadge>{formatBytes(clip.blob.size)} · {clip.blob.type.includes("mp4") ? "MP4" : "WebM"}</StatusBadge>}
            footer={
              <>
                <span className="flex-1" />
                <Button variant="outline" onClick={downloadClip}>
                  <Download /> Download
                </Button>
              </>
            }
          >
            <video src={clip.url} controls className="w-full aspect-video bg-stone-950" />
          </ToolPanel>
        )}
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
      </OptionsLayout>
    </ToolLayout>
  );
}
